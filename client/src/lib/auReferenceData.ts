// Faixas de referência da Altura Uterina por Idade Gestacional
// Fonte: Ministério da Saúde / FEBRASGO
// Percentis 10, 50 (mediana) e 90

export const AU_REFERENCE_DATA: Record<number, { p10: number; p50: number; p90: number }> = {
  12: { p10: 8, p50: 10, p90: 12 },
  13: { p10: 9, p50: 11, p90: 13 },
  14: { p10: 10, p50: 12, p90: 14 },
  15: { p10: 11, p50: 13, p90: 15 },
  16: { p10: 12, p50: 14, p90: 16 },
  17: { p10: 13, p50: 15, p90: 17 },
  18: { p10: 14, p50: 16, p90: 18 },
  19: { p10: 15, p50: 17, p90: 19 },
  20: { p10: 16, p50: 18, p90: 20 },
  21: { p10: 17, p50: 19, p90: 21 },
  22: { p10: 18, p50: 20, p90: 22 },
  23: { p10: 19, p50: 21, p90: 23 },
  24: { p10: 20, p50: 22, p90: 24 },
  25: { p10: 21, p50: 23, p90: 25 },
  26: { p10: 22, p50: 24, p90: 26 },
  27: { p10: 23, p50: 25, p90: 27 },
  28: { p10: 24, p50: 26, p90: 28 },
  29: { p10: 25, p50: 27, p90: 29 },
  30: { p10: 26, p50: 28, p90: 30 },
  31: { p10: 27, p50: 29, p90: 31 },
  32: { p10: 28, p50: 30, p90: 32 },
  33: { p10: 29, p50: 31, p90: 33 },
  34: { p10: 30, p50: 32, p90: 34 },
  35: { p10: 31, p50: 33, p90: 35 },
  36: { p10: 32, p50: 34, p90: 36 },
  37: { p10: 32, p50: 35, p90: 37 },
  38: { p10: 33, p50: 36, p90: 38 },
  39: { p10: 34, p50: 37, p90: 39 },
  40: { p10: 34, p50: 37, p90: 40 },
  41: { p10: 35, p50: 38, p90: 40 },
  42: { p10: 35, p50: 38, p90: 41 },
};

/**
 * Verifica se a altura uterina está fora dos percentis 10-90
 * @param au Altura uterina em cm
 * @param igSemanas Idade gestacional em semanas
 * @returns true se AU está fora da faixa normal (< P10 ou > P90)
 */
export function isAUAbnormal(au: number | null, igSemanas: number | null): boolean {
  if (!au || !igSemanas || igSemanas < 12 || igSemanas > 42) {
    return false;
  }

  const ref = AU_REFERENCE_DATA[igSemanas];
  if (!ref) return false;

  return au < ref.p10 || au > ref.p90;
}
