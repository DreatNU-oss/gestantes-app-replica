import { getDb } from "./db";
import { gestantes, consultasPrenatal, resultadosExames, ultrassons } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Busca gestante por ID
 */
export async function buscarGestantePorId(gestanteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const gestante = await db
    .select()
    .from(gestantes)
    .where(eq(gestantes.id, gestanteId))
    .limit(1);
  
  return gestante[0] || null;
}

/**
 * Busca gestante por email
 */
export async function buscarGestantePorEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const gestante = await db
    .select()
    .from(gestantes)
    .where(eq(gestantes.email, email))
    .limit(1);
  
  return gestante[0] || null;
}

/**
 * Busca consultas de uma gestante
 */
export async function buscarConsultasGestante(gestanteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const consultasGestante = await db
    .select()
    .from(consultasPrenatal)
    .where(eq(consultasPrenatal.gestanteId, gestanteId))
    .orderBy(desc(consultasPrenatal.dataConsulta));
  
  return consultasGestante;
}

/**
 * Busca exames laboratoriais de uma gestante
 */
export async function buscarExamesGestante(gestanteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const exames = await db
    .select()
    .from(resultadosExames)
    .where(eq(resultadosExames.gestanteId, gestanteId));
  
  return exames;
}

/**
 * Busca ultrassons de uma gestante
 */
export async function buscarUltrassonsGestante(gestanteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const ultrassonsGestante = await db
    .select()
    .from(ultrassons)
    .where(eq(ultrassons.gestanteId, gestanteId))
    .orderBy(desc(ultrassons.dataExame));
  
  return ultrassonsGestante;
}

/**
 * Calcula idade gestacional pela DUM
 */
export function calcularIgPorDum(dum: string | null, dataReferencia: Date = new Date()): { semanas: number; dias: number } | null {
  if (!dum) return null;
  
  const dumDate = new Date(dum + 'T12:00:00');
  const diffMs = dataReferencia.getTime() - dumDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const semanas = Math.floor(diffDays / 7);
  const dias = diffDays % 7;
  
  return { semanas, dias };
}

/**
 * Calcula DPP pela DUM (DUM + 280 dias)
 */
export function calcularDppPorDum(dum: string | null): Date | null {
  if (!dum) return null;
  
  const dumDate = new Date(dum + 'T12:00:00');
  const dpp = new Date(dumDate);
  dpp.setDate(dpp.getDate() + 280);
  
  return dpp;
}

/**
 * Calcula marcos importantes baseado na DPP
 */
export function calcularMarcosImportantes(dpp: Date) {
  const marcos = [];
  
  // Concepção (DPP - 280 dias)
  const concepcao = new Date(dpp);
  concepcao.setDate(concepcao.getDate() - 280);
  marcos.push({
    nome: "Concepção",
    data: concepcao.toISOString().split('T')[0],
    cor: "roxo"
  });
  
  // Morfológico 1º Trimestre (11-14 semanas = DPP - 203 a 182 dias)
  const morfo1Inicio = new Date(dpp);
  morfo1Inicio.setDate(morfo1Inicio.getDate() - 203);
  const morfo1Fim = new Date(dpp);
  morfo1Fim.setDate(morfo1Fim.getDate() - 182);
  marcos.push({
    nome: "Morfológico 1º Trimestre",
    dataInicio: morfo1Inicio.toISOString().split('T')[0],
    dataFim: morfo1Fim.toISOString().split('T')[0],
    cor: "verde"
  });
  
  // 13 Semanas (DPP - 189 dias)
  const semana13 = new Date(dpp);
  semana13.setDate(semana13.getDate() - 189);
  marcos.push({
    nome: "13 Semanas",
    data: semana13.toISOString().split('T')[0],
    cor: "azul"
  });
  
  // Morfológico 2º Trimestre (20-24 semanas = DPP - 140 a 112 dias)
  const morfo2Inicio = new Date(dpp);
  morfo2Inicio.setDate(morfo2Inicio.getDate() - 140);
  const morfo2Fim = new Date(dpp);
  morfo2Fim.setDate(morfo2Fim.getDate() - 112);
  marcos.push({
    nome: "Morfológico 2º Trimestre",
    dataInicio: morfo2Inicio.toISOString().split('T')[0],
    dataFim: morfo2Fim.toISOString().split('T')[0],
    cor: "ciano"
  });
  
  // Vacina dTpa (27 semanas = DPP - 91 dias)
  const dtpa = new Date(dpp);
  dtpa.setDate(dtpa.getDate() - 91);
  marcos.push({
    nome: "Vacina dTpa",
    data: dtpa.toISOString().split('T')[0],
    cor: "laranja"
  });
  
  // Vacina Bronquiolite (32-36 semanas = DPP - 56 a 28 dias)
  const bronquioliteInicio = new Date(dpp);
  bronquioliteInicio.setDate(bronquioliteInicio.getDate() - 56);
  const bronquioliteFim = new Date(dpp);
  bronquioliteFim.setDate(bronquioliteFim.getDate() - 28);
  marcos.push({
    nome: "Vacina Bronquiolite",
    dataInicio: bronquioliteInicio.toISOString().split('T')[0],
    dataFim: bronquioliteFim.toISOString().split('T')[0],
    cor: "amarelo"
  });
  
  // Termo Precoce (37 semanas = DPP - 21 dias)
  const termoPrecoce = new Date(dpp);
  termoPrecoce.setDate(termoPrecoce.getDate() - 21);
  marcos.push({
    nome: "Termo Precoce",
    data: termoPrecoce.toISOString().split('T')[0],
    cor: "ciano"
  });
  
  // Termo Completo (39 semanas = DPP - 7 dias)
  const termoCompleto = new Date(dpp);
  termoCompleto.setDate(termoCompleto.getDate() - 7);
  marcos.push({
    nome: "Termo Completo",
    data: termoCompleto.toISOString().split('T')[0],
    cor: "verde"
  });
  
  // DPP 40 semanas
  marcos.push({
    nome: "DPP 40 semanas",
    data: dpp.toISOString().split('T')[0],
    cor: "rosa"
  });
  
  return marcos;
}
