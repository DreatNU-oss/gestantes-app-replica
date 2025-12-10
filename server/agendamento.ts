/**
 * Módulo de Agendamento de Consultas Pré-Natal
 * Calcula datas sugeridas baseado em regras obstétricas
 */

import { agendamentosConsultas } from "../drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

/**
 * Feriados nacionais brasileiros (fixos e móveis - 2024-2026)
 */
const FERIADOS_NACIONAIS = [
  // 2024
  "2024-01-01", "2024-02-13", "2024-03-29", "2024-04-21", "2024-05-01",
  "2024-05-30", "2024-09-07", "2024-10-12", "2024-11-02", "2024-11-15",
  "2024-11-20", "2024-12-25",
  // 2025
  "2025-01-01", "2025-03-04", "2025-04-18", "2025-04-21", "2025-05-01",
  "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15",
  "2025-11-20", "2025-12-25",
  // 2026
  "2026-01-01", "2026-02-17", "2026-04-03", "2026-04-21", "2026-05-01",
  "2026-06-04", "2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15",
  "2026-11-20", "2026-12-25",
];

type ExameComplementar = "nenhum" | "us_obstetrico" | "cardiotocografia";

export interface ConsultaSugerida {
  dataAgendada: Date;
  igSemanas: number;
  igDias: number;
  exameComplementar: ExameComplementar;
  ehFeriado: boolean;
  observacao?: string;
}

/**
 * Verifica se uma data é feriado nacional
 */
function ehFeriado(data: Date): boolean {
  const dataStr = data.toISOString().split("T")[0];
  return FERIADOS_NACIONAIS.includes(dataStr);
}

/**
 * Verifica se uma data é segunda, terça ou quarta-feira
 */
function ehDiaPermitido(data: Date): boolean {
  const diaSemana = data.getDay();
  return diaSemana >= 1 && diaSemana <= 3; // 1 = seg, 2 = ter, 3 = qua
}

/**
 * Ajusta data para o próximo dia permitido (seg, ter, qua) e não feriado
 */
function ajustarParaDiaPermitido(data: Date): Date {
  const novaData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  let tentativas = 0;
  const MAX_TENTATIVAS = 30;
  
  while (tentativas < MAX_TENTATIVAS) {
    if (ehDiaPermitido(novaData) && !ehFeriado(novaData)) {
      return novaData;
    }
    novaData.setDate(novaData.getDate() + 1);
    tentativas++;
  }
  
  // Forçar próxima segunda-feira se não encontrar
  const forcada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  while (forcada.getDay() !== 1) {
    forcada.setDate(forcada.getDate() + 1);
  }
  return forcada;
}

/**
 * Calcula IG (Idade Gestacional) em uma data futura baseado na DUM
 */
function calcularIGNaData(dum: Date, dataFutura: Date): { semanas: number; dias: number } {
  const diffMs = dataFutura.getTime() - dum.getTime();
  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { semanas, dias };
}

/**
 * Determina exame complementar baseado na IG
 */
function determinarExameComplementar(igSemanas: number): ExameComplementar {
  if (igSemanas <= 34) return "us_obstetrico";
  if (igSemanas === 35) return "cardiotocografia";
  if (igSemanas === 36) return "us_obstetrico";
  if (igSemanas === 37) return "cardiotocografia";
  if (igSemanas === 38) return "us_obstetrico";
  if (igSemanas === 39) return "cardiotocografia";
  if (igSemanas === 40) return "us_obstetrico";
  if (igSemanas === 41) return "us_obstetrico";
  return "nenhum";
}

/**
 * Calcula todas as consultas sugeridas baseado na DUM e data da primeira consulta
 */
export function calcularConsultasSugeridas(
  dum: Date,
  dataPrimeiraConsulta: Date
): ConsultaSugerida[] {
  const consultas: ConsultaSugerida[] = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  let primeiraData = new Date(dataPrimeiraConsulta.getFullYear(), dataPrimeiraConsulta.getMonth(), dataPrimeiraConsulta.getDate());
  
  // Garantir que não seja data passada
  if (primeiraData < hoje) {
    primeiraData = new Date(hoje);
  }
  
  // Calcular IG na data da primeira consulta (que já foi agendada pelo usuário)
  const igPrimeira = calcularIGNaData(dum, primeiraData);
  
  // NÃO incluir a primeira consulta - ela já foi agendada pelo usuário
  // Começar a calcular a partir da SEGUNDA consulta
  
  // Determinar intervalo para a segunda consulta baseado na IG da primeira
  let intervaloInicial: number;
  if (igPrimeira.semanas <= 31) {
    intervaloInicial = 30; // Mensal até 31 semanas
  } else if (igPrimeira.semanas <= 35) {
    intervaloInicial = 14; // Quinzenal de 32 a 35 semanas
  } else {
    intervaloInicial = 7; // Semanal após 36 semanas
  }
  
  // Calcular segunda consulta
  let dataAtual = new Date(primeiraData.getFullYear(), primeiraData.getMonth(), primeiraData.getDate() + intervaloInicial);
  dataAtual = ajustarParaDiaPermitido(dataAtual);
  const igSegunda = calcularIGNaData(dum, dataAtual);
  
  // Adicionar segunda consulta
  consultas.push({
    dataAgendada: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate()),
    igSemanas: igSegunda.semanas,
    igDias: igSegunda.dias,
    exameComplementar: determinarExameComplementar(igSegunda.semanas),
    ehFeriado: ehFeriado(dataAtual),
    observacao: ehFeriado(dataAtual) ? "⚠️ Data cai em feriado - considere reagendar" : undefined,
  });
  
  let igAtual = igSegunda.semanas;
  
  // Calcular demais consultas até 41 semanas
  while (igAtual < 41) {
    // Determinar intervalo baseado na IG
    let intervalo: number;
    if (igAtual < 32) {
      intervalo = 30; // Mensal
    } else if (igAtual < 36) {
      intervalo = 14; // Quinzenal
    } else {
      intervalo = 7; // Semanal
    }
    
    const novaData = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + intervalo);
    dataAtual = ajustarParaDiaPermitido(novaData);
    
    const ig = calcularIGNaData(dum, dataAtual);
    igAtual = ig.semanas;
    
    if (igAtual > 41) break;
    
    consultas.push({
      dataAgendada: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate()),
      igSemanas: ig.semanas,
      igDias: ig.dias,
      exameComplementar: determinarExameComplementar(ig.semanas),
      ehFeriado: ehFeriado(dataAtual),
      observacao: ehFeriado(dataAtual) ? "⚠️ Data cai em feriado - considere reagendar" : undefined,
    });
  }
  
  return consultas;
}

/**
 * Salvar agendamentos no banco
 */
export async function salvarAgendamentos(
  gestanteId: number,
  consultas: ConsultaSugerida[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar agendamentos antigos desta gestante
  await db.delete(agendamentosConsultas)
    .where(eq(agendamentosConsultas.gestanteId, gestanteId));
  
  // Inserir novos agendamentos
  for (const consulta of consultas) {
    await db.insert(agendamentosConsultas).values({
      gestanteId,
      dataAgendada: consulta.dataAgendada,
      igSemanas: consulta.igSemanas,
      igDias: consulta.igDias,
      exameComplementar: consulta.exameComplementar,
      status: "agendado",
      observacoes: consulta.observacao || null,
    });
  }
}

/**
 * Buscar agendamentos de uma gestante
 */
export async function buscarAgendamentos(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(agendamentosConsultas)
    .where(eq(agendamentosConsultas.gestanteId, gestanteId))
    .orderBy(agendamentosConsultas.dataAgendada);
}

/**
 * Atualizar status de um agendamento
 */
export async function atualizarStatusAgendamento(
  id: number,
  status: "agendado" | "realizado" | "cancelado" | "remarcado"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(agendamentosConsultas)
    .set({ status })
    .where(eq(agendamentosConsultas.id, id));
}

/**
 * Remarcar um agendamento
 */
export async function remarcarAgendamento(
  id: number,
  novaData: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const dataAjustada = ajustarParaDiaPermitido(novaData);
  
  await db.update(agendamentosConsultas)
    .set({ 
      dataAgendada: dataAjustada,
      status: "agendado",
      observacoes: ehFeriado(dataAjustada) ? "⚠️ Data cai em feriado - considere reagendar" : null,
    })
    .where(eq(agendamentosConsultas.id, id));
}
