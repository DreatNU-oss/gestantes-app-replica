/**
 * Utilitário compartilhado para validação de agendamento de cesárea.
 * 
 * Centraliza a lógica de:
 * - Cálculo de Idade Gestacional (IG) em uma data futura
 * - Classificação do período (pré-termo, normal, pós-termo)
 * - Detecção de data no passado
 * 
 * Usado por CartaoPrenatal.tsx e FormularioGestante.tsx.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface IGSemanasDias {
  semanas: number;
  dias: number;
}

export type CesareaClassificacao = 'pre-termo' | 'pos-termo' | 'passado' | 'normal';

export interface CesareaValidationResult {
  classificacao: CesareaClassificacao;
  igNaData: IGSemanasDias | null;
  igTotalDias: number | null;
}

export interface DadosReferencia {
  /** Data do ultrassom (string YYYY-MM-DD ou Date) */
  dataUltrassom?: string | Date | null;
  /** Semanas de IG no ultrassom */
  igUltrassomSemanas?: number | null;
  /** Dias de IG no ultrassom */
  igUltrassomDias?: number | null;
  /** DUM (string YYYY-MM-DD, Date, ou texto como "Incerta") */
  dum?: string | Date | null;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Limiar inferior: < 37 semanas = pré-termo */
export const PRETERMIO_DIAS = 259; // 37 * 7

/** Limiar superior: >= 40 semanas = pós-termo */
export const POSTERMO_DIAS = 280; // 40 * 7

// ─── Funções auxiliares ──────────────────────────────────────────────────────

/**
 * Converte string YYYY-MM-DD para Date no meio-dia local (evita problemas de timezone).
 */
function toLocalDate(value: string | Date): Date {
  if (value instanceof Date) {
    const d = new Date(value);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Verifica se a DUM é uma data válida (não "Incerta" nem "Incompatível com US").
 */
function isDumValida(dum: string | Date | null | undefined): boolean {
  if (!dum) return false;
  if (dum instanceof Date) return true;
  return dum !== 'Incerta' && dum !== 'Incompatível com US' && /^\d{4}-\d{2}-\d{2}/.test(dum);
}

// ─── Funções públicas ────────────────────────────────────────────────────────

/**
 * Calcula a Idade Gestacional (em dias totais e semanas+dias) em uma data alvo,
 * dado um ponto de referência (ultrassom ou DUM).
 * 
 * Prioriza ultrassom sobre DUM quando ambos estão disponíveis.
 * 
 * @returns IG em dias totais e semanas+dias, ou null se não há dados suficientes.
 */
export function calcularIGNaData(
  dataAlvo: string | Date,
  dados: DadosReferencia
): { igTotalDias: number; igSemanasDias: IGSemanasDias } | null {
  let dataReferencia: Date | null = null;
  let igReferenciaDias = 0;

  // Priorizar ultrassom
  if (dados.dataUltrassom && dados.igUltrassomSemanas != null) {
    dataReferencia = toLocalDate(dados.dataUltrassom);
    igReferenciaDias = dados.igUltrassomSemanas * 7 + (dados.igUltrassomDias || 0);
  } else if (isDumValida(dados.dum)) {
    dataReferencia = toLocalDate(dados.dum as string | Date);
    igReferenciaDias = 0;
  }

  if (!dataReferencia) return null;

  const alvo = toLocalDate(dataAlvo);
  const diffMs = alvo.getTime() - dataReferencia.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const igTotalDias = igReferenciaDias + diffDias;
  const semanas = Math.floor(igTotalDias / 7);
  const dias = igTotalDias % 7;

  return {
    igTotalDias,
    igSemanasDias: { semanas, dias },
  };
}

/**
 * Classifica a IG em dias totais como pré-termo, normal ou pós-termo.
 */
export function classificarIG(igTotalDias: number): 'pre-termo' | 'normal' | 'pos-termo' {
  if (igTotalDias < PRETERMIO_DIAS) return 'pre-termo';
  if (igTotalDias >= POSTERMO_DIAS) return 'pos-termo';
  return 'normal';
}

/**
 * Verifica se uma data está no passado (antes de hoje).
 */
export function isDataNoPassado(dataStr: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataStr + 'T00:00:00');
  return data < hoje;
}

/**
 * Valida uma data de cesárea completa: verifica passado, calcula IG e classifica.
 * 
 * Retorna a classificação e a IG na data (se calculável).
 * Se não há dados de referência para calcular IG, retorna 'normal' (sem alerta).
 */
export function validarDataCesarea(
  dataCesarea: string,
  dados: DadosReferencia
): CesareaValidationResult {
  // 1. Verificar data no passado
  if (isDataNoPassado(dataCesarea)) {
    // Ainda calcula IG para informação, mas classifica como passado
    const ig = calcularIGNaData(dataCesarea, dados);
    return {
      classificacao: 'passado',
      igNaData: ig?.igSemanasDias || null,
      igTotalDias: ig?.igTotalDias || null,
    };
  }

  // 2. Calcular IG na data
  const ig = calcularIGNaData(dataCesarea, dados);
  if (!ig) {
    // Sem dados de referência: não é possível classificar
    return {
      classificacao: 'normal',
      igNaData: null,
      igTotalDias: null,
    };
  }

  // 3. Classificar
  const classificacao = classificarIG(ig.igTotalDias);

  return {
    classificacao,
    igNaData: ig.igSemanasDias,
    igTotalDias: ig.igTotalDias,
  };
}
