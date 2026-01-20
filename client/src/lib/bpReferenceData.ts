/**
 * Dados de referência de Pressão Arterial durante a gestação
 * Fonte: Oliveira et al. - Estudo brasileiro sobre PA em gestantes normotensas
 * Adaptado de ChatGPT - Valores de Referência da Pressão Arterial durante a Gestação (12–40 semanas)
 * 
 * Valores representam faixas mínimas-máximas normais para cada período gestacional
 */

export interface BPReference {
  systolic: { min: number; max: number; median: number };
  diastolic: { min: number; max: number; median: number };
}

export const BP_REFERENCE_DATA: Record<number, BPReference> = {
  // Semanas 4-5: Extrapolação baseada em 6-8
  4: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 58, median: 57.5 },
  },
  5: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 58, median: 57.5 },
  },
  // Semanas 6-8
  6: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 58, median: 57.5 },
  },
  7: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 58, median: 57.5 },
  },
  8: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 58, median: 57.5 },
  },
  // Semanas 9-12
  9: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 61, max: 63, median: 62 },
  },
  10: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 61, max: 63, median: 62 },
  },
  11: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 61, max: 63, median: 62 },
  },
  12: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 61, max: 63, median: 62 },
  },
  // Semanas 13-16
  13: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 59, max: 61, median: 60 },
  },
  14: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 59, max: 61, median: 60 },
  },
  15: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 59, max: 61, median: 60 },
  },
  16: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 59, max: 61, median: 60 },
  },
  // Semanas 17-20
  17: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  18: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  19: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  20: {
    systolic: { min: 103, max: 104, median: 103.5 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  // Semanas 21-24
  21: {
    systolic: { min: 104, max: 106, median: 105 },
    diastolic: { min: 56, max: 58, median: 57 },
  },
  22: {
    systolic: { min: 104, max: 106, median: 105 },
    diastolic: { min: 56, max: 58, median: 57 },
  },
  23: {
    systolic: { min: 104, max: 106, median: 105 },
    diastolic: { min: 56, max: 58, median: 57 },
  },
  24: {
    systolic: { min: 104, max: 106, median: 105 },
    diastolic: { min: 56, max: 58, median: 57 },
  },
  // Semanas 25-28
  25: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 55, max: 57, median: 56 },
  },
  26: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 55, max: 57, median: 56 },
  },
  27: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 55, max: 57, median: 56 },
  },
  28: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 55, max: 57, median: 56 },
  },
  // Semanas 29-32
  29: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  30: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  31: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  32: {
    systolic: { min: 105, max: 107, median: 106 },
    diastolic: { min: 57, max: 59, median: 58 },
  },
  // Semanas 33-34
  33: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 60, max: 62, median: 61 },
  },
  34: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 60, max: 62, median: 61 },
  },
  // Semanas 35-36
  35: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 62, max: 64, median: 63 },
  },
  36: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 62, max: 64, median: 63 },
  },
  // Semana 37
  37: {
    systolic: { min: 106, max: 108, median: 107 },
    diastolic: { min: 63, max: 65, median: 64 },
  },
  // Semana 38
  38: {
    systolic: { min: 108, max: 110, median: 109 },
    diastolic: { min: 63, max: 65, median: 64 },
  },
  // Semana 39
  39: {
    systolic: { min: 108, max: 110, median: 109 },
    diastolic: { min: 63, max: 65, median: 64 },
  },
  // Semana 40
  40: {
    systolic: { min: 110, max: 112, median: 111 },
    diastolic: { min: 68, max: 70, median: 69 },
  },
  // Semanas 41-42: Extrapolação baseada em 40
  41: {
    systolic: { min: 110, max: 112, median: 111 },
    diastolic: { min: 68, max: 70, median: 69 },
  },
  42: {
    systolic: { min: 110, max: 112, median: 111 },
    diastolic: { min: 68, max: 70, median: 69 },
  },
};

/**
 * Verifica se a pressão arterial está fora da faixa de normalidade
 * Considera tanto hipertensão (≥140/90) quanto valores abaixo da faixa mínima de referência
 * @param pressaoArterial String no formato "120/80" ou null
 * @param igSemanas Idade gestacional em semanas
 * @returns true se PA está fora da faixa normal
 */
export function isBPOutOfRange(
  pressaoArterial: string | null,
  igSemanas: number | null
): boolean {
  if (!pressaoArterial || !igSemanas) return false;

  const parts = pressaoArterial.split('/');
  if (parts.length !== 2) return false;

  const sistolica = parseInt(parts[0], 10);
  const diastolica = parseInt(parts[1], 10);

  if (isNaN(sistolica) || isNaN(diastolica)) return false;

  // Hipertensão gestacional (critério clínico)
  if (sistolica >= 140 || diastolica >= 90) return true;

  // Verificar se está abaixo da faixa mínima de referência
  const ref = BP_REFERENCE_DATA[igSemanas];
  if (!ref) return false;

  return (
    sistolica < ref.systolic.min ||
    diastolica < ref.diastolic.min
  );
}
