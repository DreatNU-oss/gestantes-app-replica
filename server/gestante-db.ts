import { eq, and, gt, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  gestantes,
  codigosAcessoGestante,
  sessoesGestante,
  consultasPrenatal,
  examesLaboratoriais,
  resultadosExames,
  ultrassons,
  logsAcessoGestante,
  type Gestante,
  type InsertGestante,
  type InsertCodigoAcessoGestante,
  type InsertSessaoGestante,
  type InsertConsultaPrenatal,
  type InsertExameLaboratorial,
  type InsertUltrassom,
  type InsertLogAcessoGestante,
} from "../drizzle/schema";

// ============ Gestante Operations ============

export async function getGestanteByEmail(email: string): Promise<Gestante | null> {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(gestantes).where(eq(gestantes.email, email)).limit(1);
  return results[0] || null;
}

export async function getGestanteById(id: number): Promise<Gestante | null> {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(gestantes).where(eq(gestantes.id, id)).limit(1);
  return results[0] || null;
}

export async function createGestante(data: InsertGestante): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(gestantes).values(data);
  return Number(result[0].insertId);
}

// ============ Verification Code Operations ============

export async function createVerificationCode(data: InsertCodigoAcessoGestante): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(codigosAcessoGestante).values(data);
}

export async function getValidVerificationCode(email: string, codigo: string) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const results = await db
    .select()
    .from(codigosAcessoGestante)
    .where(
      and(
        eq(codigosAcessoGestante.destino, email),
        eq(codigosAcessoGestante.codigo, codigo),
        eq(codigosAcessoGestante.usado, 0),
        gt(codigosAcessoGestante.expiraEm, now)
      )
    )
    .limit(1);
  
  return results[0] || null;
}

export async function markCodeAsUsed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(codigosAcessoGestante).set({ usado: 1 }).where(eq(codigosAcessoGestante.id, id));
}

// ============ Session Operations ============

export async function createSession(data: InsertSessaoGestante): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sessoesGestante).values(data);
}

export async function getSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const results = await db
    .select()
    .from(sessoesGestante)
    .where(
      and(
        eq(sessoesGestante.token, token),
        gt(sessoesGestante.expiraEm, now)
      )
    )
    .limit(1);
  
  return results[0] || null;
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sessoesGestante).where(eq(sessoesGestante.token, token));
}

// ============ Consultas Operations ============

export async function getConsultasByGestanteId(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(consultasPrenatal)
    .where(eq(consultasPrenatal.gestanteId, gestanteId))
    .orderBy(desc(consultasPrenatal.dataConsulta));
}

export async function createConsulta(data: InsertConsultaPrenatal): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(consultasPrenatal).values(data);
  return Number(result[0].insertId);
}

// ============ Exames Operations ============

// Buscar exames da tabela resultadosExames (usada pela interface de exames laboratoriais)
export async function getExamesByGestanteId(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar da tabela resultadosExames que é onde os exames são salvos pela interface
  return db
    .select()
    .from(resultadosExames)
    .where(eq(resultadosExames.gestanteId, gestanteId))
    .orderBy(resultadosExames.trimestre, resultadosExames.nomeExame);
}

export async function createExame(data: InsertExameLaboratorial): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(examesLaboratoriais).values(data);
  return Number(result[0].insertId);
}

// ============ Ultrassons Operations ============

export async function getUltrassonsByGestanteId(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(ultrassons)
    .where(eq(ultrassons.gestanteId, gestanteId))
    .orderBy(desc(ultrassons.dataExame));
}

export async function createUltrassom(data: InsertUltrassom): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(ultrassons).values(data);
  return Number(result[0].insertId);
}

// ============ Logs Operations ============

export async function createLogAcesso(data: InsertLogAcessoGestante): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(logsAcessoGestante).values(data);
}


// ============ Fatores de Risco Operations ============

export async function getFatoresRiscoByGestanteId(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { fatoresRisco } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  return db.select().from(fatoresRisco)
    .where(eq(fatoresRisco.gestanteId, gestanteId));
}

// ============ Medicamentos Operations ============

export async function getMedicamentosByGestanteId(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { medicamentosGestacao } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  return db.select().from(medicamentosGestacao)
    .where(eq(medicamentosGestacao.gestanteId, gestanteId));
}
