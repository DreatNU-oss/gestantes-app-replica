import { z } from "zod";
import { getDb } from "./db";
import { ultrassons, lembretesConduta, type InsertUltrassom } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Schema de validação para dados de cada tipo de ultrassom
 */
const dadosPrimeiroUltrassomSchema = z.object({
  ccn: z.string().optional(),
  bcf: z.string().optional(),
  sacoVitelino: z.string().optional(),
  hematoma: z.string().optional(),
  corpoLuteo: z.string().optional(),
  dpp: z.string().optional(),
});

const dadosMorfo1TriSchema = z.object({
  tn: z.string().optional(),
  dv: z.string().optional(),
  valvaTricuspide: z.string().optional(),
  dopplerUterinas: z.string().optional(),
  incisuraPresente: z.string().optional(),
  colo: z.string().optional(),
  riscoTrissomias: z.string().optional(),
});

const dadosUltrassomObstetricoSchema = z.object({
  pesoFetal: z.string().optional(),
  placentaLocalizacao: z.string().optional(),
  placentaGrau: z.string().optional(),
  placentaDistanciaOI: z.string().optional(),
  coloUterinoTV: z.string().optional(),
  coloUterinoMedida: z.string().optional(),
});

const dadosMorfo2TriSchema = z.object({
  biometria: z.string().optional(),
  pesoFetal: z.string().optional(),
  placentaLocalizacao: z.string().optional(),
  placentaGrau: z.string().optional(),
  placentaDistanciaOI: z.string().optional(),
  liquidoAmniotico: z.string().optional(),
  avaliacaoAnatomica: z.string().optional(),
  dopplers: z.string().optional(),
  sexoFetal: z.string().optional(),
  observacoes: z.string().optional(),
});

const dadosEcocardiogramaSchema = z.object({
  conclusao: z.string().optional(),
});

const dadosUltrassomSeguimentoSchema = z.object({
  pesoFetal: z.string().optional(),
  percentilPeso: z.string().optional(),
  liquidoAmniotico: z.string().optional(),
  placentaLocalizacao: z.string().optional(),
  placentaGrau: z.string().optional(),
  placentaDistanciaOI: z.string().optional(),
  movimentosFetais: z.string().optional(),
  apresentacaoFetal: z.string().optional(),
  dopplers: z.string().optional(),
  observacoes: z.string().optional(),
});

/**
 * Schema de validação para inserção de ultrassom
 */
export const insertUltrassomSchema = z.object({
  gestanteId: z.number(),
  tipoUltrassom: z.enum([
    "primeiro_ultrassom",
    "morfologico_1tri",
    "ultrassom_obstetrico",
    "morfologico_2tri",
    "ecocardiograma_fetal",
    "ultrassom_seguimento"
  ]),
  dataExame: z.string().optional(),
  idadeGestacional: z.string().optional(),
  dados: z.union([
    dadosPrimeiroUltrassomSchema,
    dadosMorfo1TriSchema,
    dadosUltrassomObstetricoSchema,
    dadosMorfo2TriSchema,
    dadosEcocardiogramaSchema,
    dadosUltrassomSeguimentoSchema,
  ]),
});

/**
 * Salvar ultrassom (cria novo ou atualiza existente)
 */
export async function salvarUltrassom(input: z.infer<typeof insertUltrassomSchema>) {
  // Verificar se já existe ultrassom do mesmo tipo para a gestante
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existente = await db
    .select()
    .from(ultrassons)
    .where(
      and(
        eq(ultrassons.gestanteId, input.gestanteId),
        eq(ultrassons.tipoUltrassom, input.tipoUltrassom)
      )
    )
    .limit(1);

  if (existente.length > 0) {
    // Atualizar existente
    await db
      .update(ultrassons)
      .set({
        dataExame: input.dataExame,
        idadeGestacional: input.idadeGestacional,
        dados: input.dados as any,
        updatedAt: new Date(),
      })
      .where(eq(ultrassons.id, existente[0].id));
    
    const updated = await db
      .select()
      .from(ultrassons)
      .where(eq(ultrassons.id, existente[0].id))
      .limit(1);
    
    return { success: true, ultrassom: updated[0] };
  } else {
    // Criar novo
    const result = await db.insert(ultrassons).values({
      gestanteId: input.gestanteId,
      tipoUltrassom: input.tipoUltrassom,
      dataExame: input.dataExame,
      idadeGestacional: input.idadeGestacional,
      dados: input.dados as any,
    });
    
    const inserted = await db
      .select()
      .from(ultrassons)
      .where(eq(ultrassons.id, result[0].insertId))
      .limit(1);
    
    return { success: true, ultrassom: inserted[0] };
  }
}

/**
 * Verificar se o morfológico 1º tri tem indicação de Ecocardiograma Fetal
 * Critérios: TN > 2.5mm ou Ducto Venoso com onda A negativa
 */
export async function verificarIndicacaoEcocardiograma(
  gestanteId: number,
  tipoUltrassom: string,
  dados: any
): Promise<void> {
  if (tipoUltrassom !== 'morfologico_1tri') return;
  
  const db = await getDb();
  if (!db) return;
  
  let indicacao = false;
  let motivos: string[] = [];
  
  // Verificar TN > 2.5mm
  if (dados.tn) {
    const tnStr = String(dados.tn).replace(',', '.').replace(/[^0-9.]/g, '');
    const tnValue = parseFloat(tnStr);
    if (!isNaN(tnValue) && tnValue > 2.5) {
      indicacao = true;
      motivos.push(`TN = ${dados.tn} (> 2,5mm)`);
    }
  }
  
  // Verificar Ducto Venoso com onda A negativa
  if (dados.dv) {
    const dvStr = String(dados.dv).toLowerCase();
    if (
      dvStr.includes('negativ') ||
      dvStr.includes('onda a negativ') ||
      dvStr.includes('revers') ||
      dvStr.includes('alterado')
    ) {
      indicacao = true;
      motivos.push(`Ducto Venoso: ${dados.dv}`);
    }
  }
  
  if (!indicacao) {
    // Se não há indicação, verificar se existe um lembrete pendente e removê-lo
    // (caso o ultrassom tenha sido editado e os valores corrigidos)
    const existente = await db.select()
      .from(lembretesConduta)
      .where(and(
        eq(lembretesConduta.gestanteId, gestanteId),
        eq(lembretesConduta.resolvido, 0)
      ));
    
    // Remover lembretes de ecocardiograma gerados por ultrassom
    for (const l of existente) {
      if (l.conduta.includes('Ecocardiograma Fetal') && l.conduta.includes('Morfológico')) {
        await db.update(lembretesConduta)
          .set({ resolvido: 1, resolvidoEm: new Date() })
          .where(eq(lembretesConduta.id, l.id));
      }
    }
    return;
  }
  
  // Verificar se já existe um lembrete pendente de ecocardiograma para esta gestante
  const existente = await db.select()
    .from(lembretesConduta)
    .where(and(
      eq(lembretesConduta.gestanteId, gestanteId),
      eq(lembretesConduta.resolvido, 0)
    ));
  
  const jaTemLembrete = existente.some(l => 
    l.conduta.includes('Ecocardiograma Fetal') && l.conduta.includes('Morfológico')
  );
  
  if (!jaTemLembrete) {
    // Criar lembrete automático
    const condutaTexto = `⚠️ Solicitar Ecocardiograma Fetal — Morfológico 1ºTri: ${motivos.join('; ')}`;
    
    await db.insert(lembretesConduta).values({
      gestanteId,
      consultaOrigemId: 0, // Gerado pelo ultrassom, não por uma consulta
      conduta: condutaTexto,
    });
  }
}

/**
 * Buscar ultrassons de uma gestante
 */
export async function buscarUltrassons(gestanteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(ultrassons)
    .where(eq(ultrassons.gestanteId, gestanteId))
    .orderBy(ultrassons.createdAt);
}

/**
 * Buscar ultrassom específico por tipo
 */
export async function buscarUltrassomPorTipo(
  gestanteId: number,
  tipoUltrassom: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const resultado = await db
    .select()
    .from(ultrassons)
    .where(
      and(
        eq(ultrassons.gestanteId, gestanteId),
        eq(ultrassons.tipoUltrassom, tipoUltrassom as any)
      )
    )
    .limit(1);
  
  return resultado.length > 0 ? resultado[0] : null;
}

/**
 * Deletar ultrassom
 */
export async function deletarUltrassom(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ultrassons).where(eq(ultrassons.id, id));
}
