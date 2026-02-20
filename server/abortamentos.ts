import { getDb, getGestanteById, deleteGestante } from "./db";
import { abortamentos, gestantes, medicos, planosSaude } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sincronizarCesareaComAdmin } from "./cesareanSync";

/**
 * Registra um abortamento e remove a gestante do sistema
 */
export async function registrarAbortamento(input: {
  gestanteId: number;
  dataAbortamento: string;
  igSemanas?: number;
  igDias?: number;
  tipoAbortamento?: "espontaneo" | "retido" | "incompleto" | "inevitavel" | "outro";
  observacoes?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Buscar gestante antes de registrar
  const gestante = await getGestanteById(input.gestanteId);
  if (!gestante) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Gestante não encontrada",
    });
  }

  // Se tinha cesárea programada, remover do Mapa Cirúrgico
  if (gestante.dataPartoProgramado && gestante.tipoPartoDesejado === 'cesariana') {
    sincronizarCesareaComAdmin({
      id: gestante.id,
      nomeCompleto: gestante.nome,
      dataCesarea: null, // null = remover agendamento
    }).catch(err => console.error('[Abortamento] Erro ao remover agendamento:', err));
  }

  // Registrar o abortamento
  const result = await db.insert(abortamentos).values({
    gestanteId: input.gestanteId,
    dataAbortamento: new Date(`${input.dataAbortamento}T12:00:00`),
    igSemanas: input.igSemanas,
    igDias: input.igDias,
    tipoAbortamento: input.tipoAbortamento || "espontaneo",
    observacoes: input.observacoes,
    nomeGestante: gestante.nome,
    medicoId: gestante.medicoId,
    planoSaudeId: gestante.planoSaudeId,
  });

  // Excluir a gestante do sistema (mesma lógica do delete normal)
  await deleteGestante(input.gestanteId);

  console.log(`[Abortamento] Registrado para gestante ${gestante.nome} (ID: ${input.gestanteId}) em ${input.dataAbortamento}`);

  return { 
    success: true, 
    insertId: result[0].insertId,
    nomeGestante: gestante.nome,
  };
}

/**
 * Lista todos os abortamentos registrados com dados do médico e plano
 */
export async function listarAbortamentos() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const lista = await db
    .select({
      id: abortamentos.id,
      gestanteId: abortamentos.gestanteId,
      dataAbortamento: abortamentos.dataAbortamento,
      igSemanas: abortamentos.igSemanas,
      igDias: abortamentos.igDias,
      tipoAbortamento: abortamentos.tipoAbortamento,
      observacoes: abortamentos.observacoes,
      nomeGestante: abortamentos.nomeGestante,
      medicoId: abortamentos.medicoId,
      planoSaudeId: abortamentos.planoSaudeId,
      createdAt: abortamentos.createdAt,
      // Dados do médico
      medicoNome: medicos.nome,
      // Dados do plano de saúde
      planoSaudeNome: planosSaude.nome,
    })
    .from(abortamentos)
    .leftJoin(medicos, eq(abortamentos.medicoId, medicos.id))
    .leftJoin(planosSaude, eq(abortamentos.planoSaudeId, planosSaude.id))
    .orderBy(desc(abortamentos.dataAbortamento));

  return lista;
}

/**
 * Busca estatísticas de abortamentos
 */
export async function getEstatisticasAbortamentos() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Total de abortamentos
  const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(abortamentos);
  const total = totalResult[0]?.count || 0;

  // Por tipo de abortamento
  const porTipo = await db
    .select({
      tipo: abortamentos.tipoAbortamento,
      count: sql<number>`COUNT(*)`,
    })
    .from(abortamentos)
    .groupBy(abortamentos.tipoAbortamento)
    .orderBy(desc(sql`COUNT(*)`));

  // Por mês (últimos 12 meses)
  const porMes = await db
    .select({
      mes: sql<string>`DATE_FORMAT(dataAbortamento, '%Y-%m')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(abortamentos)
    .groupBy(sql`DATE_FORMAT(dataAbortamento, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(dataAbortamento, '%Y-%m')`);

  // Por IG (faixas: <8 semanas, 8-12, 12-20, >20)
  const porIG = await db
    .select({
      faixa: sql<string>`CASE 
        WHEN igSemanas IS NULL THEN 'Não informado'
        WHEN igSemanas < 8 THEN '< 8 semanas'
        WHEN igSemanas < 12 THEN '8-12 semanas'
        WHEN igSemanas < 20 THEN '12-20 semanas'
        ELSE '≥ 20 semanas'
      END`,
      count: sql<number>`COUNT(*)`,
    })
    .from(abortamentos)
    .groupBy(sql`CASE 
      WHEN igSemanas IS NULL THEN 'Não informado'
      WHEN igSemanas < 8 THEN '< 8 semanas'
      WHEN igSemanas < 12 THEN '8-12 semanas'
      WHEN igSemanas < 20 THEN '12-20 semanas'
      ELSE '≥ 20 semanas'
    END`);

  return {
    total,
    porTipo,
    porMes,
    porIG,
  };
}

/**
 * Deleta um registro de abortamento
 */
export async function deletarAbortamento(id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const result = await db.select().from(abortamentos).where(eq(abortamentos.id, id));
  if (result.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Registro de abortamento não encontrado",
    });
  }

  await db.delete(abortamentos).where(eq(abortamentos.id, id));
  return { success: true };
}
