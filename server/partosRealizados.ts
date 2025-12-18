import { z } from "zod";
import { getDb } from "./db";
import { partosRealizados, gestantes, medicos } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { gerarEUploadPdfCartao } from "./gerarPdfParaParto";

/**
 * Registra um parto realizado
 */
export async function registrarParto(input: {
  gestanteId: number;
  dataParto: string;
  tipoParto: "normal" | "cesarea";
  medicoId: number;
  pdfUrl?: string;
  pdfKey?: string;
  observacoes?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Verificar se a gestante existe
  const gestanteResult = await db.select().from(gestantes).where(eq(gestantes.id, input.gestanteId));
  
  if (gestanteResult.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Gestante não encontrada",
    });
  }

  // Verificar se o médico existe
  const medicoResult = await db.select().from(medicos).where(eq(medicos.id, input.medicoId));

  if (medicoResult.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Médico não encontrado",
    });
  }

  // Gerar PDF do cartão pré-natal
  const { pdfUrl, pdfKey } = await gerarEUploadPdfCartao(input.gestanteId);

  // Registrar o parto
  const result = await db.insert(partosRealizados).values({
    gestanteId: input.gestanteId,
    dataParto: new Date(input.dataParto),
    tipoParto: input.tipoParto,
    medicoId: input.medicoId,
    pdfUrl,
    pdfKey,
    observacoes: input.observacoes,
  });

  return { success: true, insertId: result[0].insertId, pdfUrl };
}

/**
 * Lista todos os partos realizados com dados da gestante e médico
 */
export async function listarPartosRealizados() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const partos = await db
    .select({
      id: partosRealizados.id,
      gestanteId: partosRealizados.gestanteId,
      dataParto: partosRealizados.dataParto,
      tipoParto: partosRealizados.tipoParto,
      medicoId: partosRealizados.medicoId,
      pdfUrl: partosRealizados.pdfUrl,
      pdfKey: partosRealizados.pdfKey,
      observacoes: partosRealizados.observacoes,
      createdAt: partosRealizados.createdAt,
      // Dados da gestante
      gestanteNome: gestantes.nome,
      gestanteTelefone: gestantes.telefone,
      gestanteEmail: gestantes.email,
      // Dados do médico
      medicoNome: medicos.nome,
    })
    .from(partosRealizados)
    .leftJoin(gestantes, eq(partosRealizados.gestanteId, gestantes.id))
    .leftJoin(medicos, eq(partosRealizados.medicoId, medicos.id))
    .orderBy(desc(partosRealizados.dataParto));

  return partos;
}

/**
 * Busca detalhes de um parto específico
 */
export async function buscarPartoPorId(id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const partoResult = await db.select().from(partosRealizados).where(eq(partosRealizados.id, id));

  if (partoResult.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Parto não encontrado",
    });
  }

  const parto = partoResult[0];

  // Buscar dados da gestante
  const gestanteResult = await db.select().from(gestantes).where(eq(gestantes.id, parto.gestanteId));
  const gestante = gestanteResult.length > 0 ? gestanteResult[0] : null;

  // Buscar dados do médico
  const medicoResult = await db.select().from(medicos).where(eq(medicos.id, parto.medicoId));
  const medico = medicoResult.length > 0 ? medicoResult[0] : null;

  return {
    ...parto,
    gestante,
    medico,
  };
}

/**
 * Deleta um registro de parto
 */
export async function deletarParto(id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const partoResult = await db.select().from(partosRealizados).where(eq(partosRealizados.id, id));

  if (partoResult.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Parto não encontrado",
    });
  }

  await db.delete(partosRealizados).where(eq(partosRealizados.id, id));

  return { success: true };
}
