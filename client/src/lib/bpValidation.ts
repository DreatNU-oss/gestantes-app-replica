/**
 * Verifica se a pressão arterial está em níveis de hipertensão
 * @param pressaoArterial String no formato "120/80" ou null
 * @returns true se PA sistólica ≥140 ou diastólica ≥90
 */
export function isBPAbnormal(pressaoArterial: string | null): boolean {
  if (!pressaoArterial) return false;

  const parts = pressaoArterial.split('/');
  if (parts.length !== 2) return false;

  const sistolica = parseInt(parts[0], 10);
  const diastolica = parseInt(parts[1], 10);

  if (isNaN(sistolica) || isNaN(diastolica)) return false;

  return sistolica >= 140 || diastolica >= 90;
}
