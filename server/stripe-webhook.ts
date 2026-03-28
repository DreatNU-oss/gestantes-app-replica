/**
 * Webhook handler do Stripe para assinaturas WhatsApp
 * Registrado em /api/stripe/webhook
 */
import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { whatsappAssinaturas, whatsappAssinaturaObstetras, clinicas } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      // Sem secret configurado, aceitar sem verificação (apenas em dev)
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Erro ao verificar assinatura:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Detectar eventos de teste
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Evento de teste detectado, retornando verificação.");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Erro ao processar evento:", err);
    res.status(500).json({ error: err.message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const assinaturaId = session.metadata?.assinaturaId;
  const obstetrasIdsJson = session.metadata?.obstetrasIds;
  const subscriptionId = session.subscription as string;

  if (!assinaturaId) {
    console.warn("[Stripe Webhook] checkout.session.completed sem assinaturaId no metadata");
    return;
  }

  const id = parseInt(assinaturaId);

  // Atualizar assinatura para ativa
  await db
    .update(whatsappAssinaturas)
    .set({
      status: "ativa",
      stripeSubscriptionId: subscriptionId,
    })
    .where(eq(whatsappAssinaturas.id, id));

  // Salvar obstetras selecionados se vieram no metadata
  if (obstetrasIdsJson) {
    try {
      const obstetrasIds: number[] = JSON.parse(obstetrasIdsJson);
      const clinicaId = parseInt(session.metadata?.clinicaId || "0");

      // Remover anteriores e inserir novos
      await db
        .delete(whatsappAssinaturaObstetras)
        .where(eq(whatsappAssinaturaObstetras.assinaturaId, id));

      if (obstetrasIds.length > 0 && clinicaId) {
        await db.insert(whatsappAssinaturaObstetras).values(
          obstetrasIds.map((userId) => ({
            assinaturaId: id,
            userId,
            clinicaId,
            ativo: 1,
          }))
        );
      }

      // Atualizar quantidade
      await db
        .update(whatsappAssinaturas)
        .set({ quantidadeObstetras: obstetrasIds.length })
        .where(eq(whatsappAssinaturas.id, id));
    } catch (e) {
      console.error("[Stripe Webhook] Erro ao parsear obstetrasIds:", e);
    }
  }

  // Garantir whatsappAutorizado na clínica
  const [assinatura] = await db
    .select()
    .from(whatsappAssinaturas)
    .where(eq(whatsappAssinaturas.id, id))
    .limit(1);

  if (assinatura) {
    await db
      .update(clinicas)
      .set({ whatsappAutorizado: 1 })
      .where(eq(clinicas.id, assinatura.clinicaId));
  }

  console.log(`[Stripe Webhook] Assinatura ${id} ativada com sucesso.`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Garantir que a assinatura está como ativa
  await db
    .update(whatsappAssinaturas)
    .set({ status: "ativa" })
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscriptionId));

  console.log(`[Stripe Webhook] Fatura paga para subscription ${subscriptionId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Suspender acesso por falha de pagamento
  await db
    .update(whatsappAssinaturas)
    .set({ status: "suspensa" })
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscriptionId));

  // Revogar whatsappAutorizado na clínica
  const [assinatura] = await db
    .select()
    .from(whatsappAssinaturas)
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (assinatura) {
    await db
      .update(clinicas)
      .set({ whatsappAutorizado: 0 })
      .where(eq(clinicas.id, assinatura.clinicaId));
  }

  console.log(`[Stripe Webhook] Pagamento falhou para subscription ${subscriptionId} - acesso suspenso`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(whatsappAssinaturas)
    .set({ status: "cancelada" })
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscription.id));

  // Revogar acesso
  const [assinatura] = await db
    .select()
    .from(whatsappAssinaturas)
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (assinatura) {
    await db
      .update(clinicas)
      .set({ whatsappAutorizado: 0 })
      .where(eq(clinicas.id, assinatura.clinicaId));
  }

  console.log(`[Stripe Webhook] Assinatura ${subscription.id} cancelada - acesso revogado`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) return;
  // Mapear status do Stripe para status local
  const statusMap: Record<string, string> = {
    active: "ativa",
    past_due: "suspensa",
    canceled: "cancelada",
    unpaid: "suspensa",
    paused: "suspensa",
  };

  const novoStatus = statusMap[subscription.status];
  if (!novoStatus) return;

  await db
    .update(whatsappAssinaturas)
    .set({ status: novoStatus as any })
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscription.id));

  // Atualizar whatsappAutorizado na clínica
  const [assinatura] = await db
    .select()
    .from(whatsappAssinaturas)
    .where(eq(whatsappAssinaturas.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (assinatura) {
    await db
      .update(clinicas)
      .set({ whatsappAutorizado: novoStatus === "ativa" ? 1 : 0 })
      .where(eq(clinicas.id, assinatura.clinicaId));
  }

  console.log(`[Stripe Webhook] Assinatura ${subscription.id} atualizada para: ${novoStatus}`);
}
