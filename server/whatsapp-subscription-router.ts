/**
 * Router de Assinaturas WhatsApp com Stripe
 * Gerencia o ciclo de vida das assinaturas do módulo de mensagens WhatsApp
 *
 * Fluxo:
 * 1. Admin solicita instalação → status: pendente_instalacao
 * 2. Suporte confirma instalação → status: aguardando_pagamento
 * 3. Admin seleciona obstetras e paga via Stripe Checkout → status: ativa
 * 4. Webhook Stripe atualiza status automaticamente
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { whatsappAssinaturas, whatsappAssinaturaObstetras, clinicas, users } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Price ID do produto WhatsApp (R$ 49,90/mês por obstetra)
// Criado pelo script scripts/setup-stripe-product.mjs
const WHATSAPP_PRICE_ID = process.env.STRIPE_WHATSAPP_PRICE_ID || "price_1TFn9eBHm9Wf5CfwcA9jJRbr";

// Procedure exclusiva para admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem gerenciar assinaturas." });
  }
  return next({ ctx });
});

// Procedure exclusiva para superadmin
const superadminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "superadmin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o suporte pode executar esta ação." });
  }
  return next({ ctx });
});

export const whatsappSubscriptionRouter = router({
  /**
   * Retorna o status atual da assinatura da clínica do usuário logado
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.clinicaId) return null;

    const db = await getDb();
    if (!db) return null;

    const [assinatura] = await db
      .select()
      .from(whatsappAssinaturas)
      .where(eq(whatsappAssinaturas.clinicaId, ctx.user.clinicaId))
      .limit(1);

    if (!assinatura) return null;

    // Buscar obstetras selecionados
    const obstetras = await db
      .select({
        id: whatsappAssinaturaObstetras.userId,
        ativo: whatsappAssinaturaObstetras.ativo,
      })
      .from(whatsappAssinaturaObstetras)
      .where(eq(whatsappAssinaturaObstetras.assinaturaId, assinatura.id));

    return { ...assinatura, obstetras };
  }),

  /**
   * Admin solicita a instalação do serviço WhatsApp
   */
  solicitarInstalacao: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.clinicaId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário sem clínica associada." });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

    // Verificar se já existe uma assinatura
    const [existente] = await db
      .select()
      .from(whatsappAssinaturas)
      .where(eq(whatsappAssinaturas.clinicaId, ctx.user.clinicaId))
      .limit(1);

    if (existente) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Já existe uma solicitação para esta clínica. Status: ${existente.status}`,
      });
    }

    const [nova] = await db
      .insert(whatsappAssinaturas)
      .values({
        clinicaId: ctx.user.clinicaId,
        status: "pendente_instalacao",
        quantidadeObstetras: 1,
      })
      .$returningId();

    return { id: nova.id, status: "pendente_instalacao" };
  }),

  /**
   * Admin seleciona quais obstetras terão acesso ao WhatsApp
   */
  selecionarObstetras: adminProcedure
    .input(z.object({
      obstetrasIds: z.array(z.number()).min(1, "Selecione ao menos 1 obstetra"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.clinicaId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário sem clínica associada." });
      }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

    const [assinatura] = await db
      .select()
      .from(whatsappAssinaturas)
      .where(eq(whatsappAssinaturas.clinicaId, ctx.user.clinicaId))
      .limit(1);

    if (!assinatura) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma assinatura encontrada para esta clínica." });
    }

    if (assinatura.status !== "aguardando_pagamento" && assinatura.status !== "ativa") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A instalação ainda não foi confirmada pelo suporte.",
        });
      }

      // Remover obstetras anteriores e inserir os novos
      await db
        .delete(whatsappAssinaturaObstetras)
        .where(eq(whatsappAssinaturaObstetras.assinaturaId, assinatura.id));

      if (input.obstetrasIds.length > 0) {
        await db.insert(whatsappAssinaturaObstetras).values(
          input.obstetrasIds.map((userId) => ({
            assinaturaId: assinatura.id,
            userId,
            clinicaId: ctx.user.clinicaId!,
            ativo: 1,
          }))
        );
      }

      // Atualizar quantidade
      await db
        .update(whatsappAssinaturas)
        .set({ quantidadeObstetras: input.obstetrasIds.length })
        .where(eq(whatsappAssinaturas.id, assinatura.id));

      return { success: true, quantidade: input.obstetrasIds.length };
    }),

  /**
   * Admin inicia o checkout Stripe para pagar a assinatura
   */
  criarCheckout: adminProcedure
    .input(z.object({
      obstetrasIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.clinicaId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário sem clínica associada." });
      }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

    const [assinatura] = await db
      .select()
      .from(whatsappAssinaturas)
      .where(eq(whatsappAssinaturas.clinicaId, ctx.user.clinicaId))
      .limit(1);

    if (!assinatura) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma assinatura encontrada." });
    }

      if (assinatura.status !== "aguardando_pagamento") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A instalação ainda não foi confirmada pelo suporte.",
        });
      }

      const quantidade = input.obstetrasIds.length;

      // Criar ou recuperar customer Stripe
      let customerId = assinatura.stripeCustomerId;
      if (!customerId) {
        const [clinica] = await db
          .select()
          .from(clinicas)
          .where(eq(clinicas.id, ctx.user.clinicaId))
          .limit(1);

        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: clinica?.nome || `Clínica ${ctx.user.clinicaId}`,
          metadata: {
            clinicaId: String(ctx.user.clinicaId),
            userId: String(ctx.user.id),
          },
        });
        customerId = customer.id;

        await db
          .update(whatsappAssinaturas)
          .set({ stripeCustomerId: customerId })
          .where(eq(whatsappAssinaturas.id, assinatura.id));
      }

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: WHATSAPP_PRICE_ID,
            quantity: quantidade,
          },
        ],
        success_url: `${ctx.req.headers.origin}/configuracoes/whatsapp-assinatura?success=true`,
        cancel_url: `${ctx.req.headers.origin}/configuracoes/whatsapp-assinatura?canceled=true`,
        client_reference_id: String(ctx.user.id),
        metadata: {
          assinaturaId: String(assinatura.id),
          clinicaId: String(ctx.user.clinicaId),
          userId: String(ctx.user.id),
          obstetrasIds: JSON.stringify(input.obstetrasIds),
        },
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            assinaturaId: String(assinatura.id),
            clinicaId: String(ctx.user.clinicaId),
          },
        },
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Admin cancela a assinatura
   */
  cancelar: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.clinicaId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário sem clínica associada." });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

    const [assinatura] = await db
      .select()
      .from(whatsappAssinaturas)
      .where(eq(whatsappAssinaturas.clinicaId, ctx.user.clinicaId))
      .limit(1);

    if (!assinatura || assinatura.status !== "ativa") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma assinatura ativa encontrada." });
    }

    // Cancelar no Stripe ao final do período
    if (assinatura.stripeSubscriptionId) {
      await stripe.subscriptions.update(assinatura.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return { success: true, message: "Assinatura será cancelada ao final do período atual." };
  }),

  // ─── SUPERADMIN ──────────────────────────────────────────────────────────────

  /**
   * Superadmin: lista todas as solicitações pendentes de instalação
   */
  listarSolicitacoesPendentes: superadminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const pendentes = await db
      .select({
        id: whatsappAssinaturas.id,
        clinicaId: whatsappAssinaturas.clinicaId,
        status: whatsappAssinaturas.status,
        quantidadeObstetras: whatsappAssinaturas.quantidadeObstetras,
        createdAt: whatsappAssinaturas.createdAt,
        clinicaNome: clinicas.nome,
        clinicaCodigo: clinicas.codigo,
      })
      .from(whatsappAssinaturas)
      .leftJoin(clinicas, eq(whatsappAssinaturas.clinicaId, clinicas.id))
      .where(inArray(whatsappAssinaturas.status, ["pendente_instalacao", "aguardando_pagamento"]));

    return pendentes;
  }),

  /**
   * Superadmin: lista todas as assinaturas ativas
   */
  listarTodasAssinaturas: superadminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const todas = await db
      .select({
        id: whatsappAssinaturas.id,
        clinicaId: whatsappAssinaturas.clinicaId,
        status: whatsappAssinaturas.status,
        quantidadeObstetras: whatsappAssinaturas.quantidadeObstetras,
        stripeSubscriptionId: whatsappAssinaturas.stripeSubscriptionId,
        instalacaoConfirmadaEm: whatsappAssinaturas.instalacaoConfirmadaEm,
        createdAt: whatsappAssinaturas.createdAt,
        clinicaNome: clinicas.nome,
        clinicaCodigo: clinicas.codigo,
      })
      .from(whatsappAssinaturas)
      .leftJoin(clinicas, eq(whatsappAssinaturas.clinicaId, clinicas.id));

    return todas;
  }),

  /**
   * Superadmin: confirma a instalação e libera o checkout para o admin
   */
  confirmarInstalacao: superadminProcedure
    .input(z.object({ assinaturaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

    const [assinatura] = await db
      .select()
      .from(whatsappAssinaturas)
      .where(eq(whatsappAssinaturas.id, input.assinaturaId))
      .limit(1);

      if (!assinatura) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada." });
      }

      if (assinatura.status !== "pendente_instalacao") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Assinatura já está com status: ${assinatura.status}`,
        });
      }

      await db
        .update(whatsappAssinaturas)
        .set({
          status: "aguardando_pagamento",
          instalacaoConfirmadaEm: new Date(),
          instalacaoConfirmadaPor: ctx.user.id,
        })
        .where(eq(whatsappAssinaturas.id, input.assinaturaId));

      // Ativar whatsappAutorizado na clínica
      await db
        .update(clinicas)
        .set({ whatsappAutorizado: 1 })
        .where(eq(clinicas.id, assinatura.clinicaId));

      return { success: true };
    }),

  /**
   * Verifica se o usuário logado tem acesso ao WhatsApp
   * (assinatura ativa E obstetra selecionado)
   */
  verificarAcesso: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.clinicaId) return { temAcesso: false, motivo: "sem_clinica" };

    // Superadmin sempre tem acesso
    if (ctx.user.role === "superadmin") return { temAcesso: true, motivo: "superadmin" };

    const db = await getDb();
    if (!db) return { temAcesso: false, motivo: "db_indisponivel" };

    // Admin tem acesso se a assinatura estiver ativa
    if (ctx.user.role === "admin") {
      const [assinatura] = await db
        .select()
        .from(whatsappAssinaturas)
        .where(
          and(
            eq(whatsappAssinaturas.clinicaId, ctx.user.clinicaId),
            eq(whatsappAssinaturas.status, "ativa")
          )
        )
        .limit(1);

      return {
        temAcesso: !!assinatura,
        motivo: assinatura ? "admin_assinatura_ativa" : "sem_assinatura_ativa",
      };
    }

    // Obstetra: verificar se está na lista de obstetras selecionados
    const [acesso] = await db
      .select({ id: whatsappAssinaturaObstetras.id })
      .from(whatsappAssinaturaObstetras)
      .innerJoin(
        whatsappAssinaturas,
        eq(whatsappAssinaturaObstetras.assinaturaId, whatsappAssinaturas.id)
      )
      .where(
        and(
          eq(whatsappAssinaturaObstetras.userId, ctx.user.id),
          eq(whatsappAssinaturaObstetras.clinicaId, ctx.user.clinicaId),
          eq(whatsappAssinaturaObstetras.ativo, 1),
          eq(whatsappAssinaturas.status, "ativa")
        )
      )
      .limit(1);

    return {
      temAcesso: !!acesso,
      motivo: acesso ? "obstetra_selecionado" : "obstetra_nao_selecionado",
    };
  }),
});
