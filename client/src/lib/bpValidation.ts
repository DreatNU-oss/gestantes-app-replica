/**
 * Verifica se a pressão arterial está em níveis elevados
 * @param pressaoArterial String no formato "120/80" ou null
 * @returns true se PA sistólica ≥130 ou diastólica ≥90
 */
export function isBPAbnormal(pressaoArterial: string | null): boolean {
  if (!pressaoArterial) return false;

  const parts = pressaoArterial.split(/[\/xX]/);
  if (parts.length !== 2) return false;

  const sistolica = parseInt(parts[0].trim(), 10);
  const diastolica = parseInt(parts[1].trim(), 10);

  if (isNaN(sistolica) || isNaN(diastolica)) return false;

  return sistolica >= 130 || diastolica >= 90;
}

/**
 * Verifica se a PA está elevada usando valores numéricos separados
 * @param sistolica Valor sistólico em mmHg
 * @param diastolica Valor diastólico em mmHg
 * @returns true se sistólica ≥130 ou diastólica ≥90
 */
export function isBPElevated(sistolica: number | null | undefined, diastolica: number | null | undefined): boolean {
  if (sistolica != null && sistolica >= 130) return true;
  if (diastolica != null && diastolica >= 90) return true;
  return false;
}
