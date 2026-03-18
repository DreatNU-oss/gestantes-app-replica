/**
 * Normaliza o campo de Idade Gestacional (IG) para garantir que sempre tenha semanas e dias.
 * 
 * Quando o usuário digita apenas as semanas (ex: "12s", "12", "8 s"), o sistema
 * automaticamente adiciona "0d" para completar o formato padrão "Xs Yd".
 * 
 * Exemplos de normalização:
 * - "12s" → "12s 0d"
 * - "12" → "12s 0d"
 * - "8 s" → "8s 0d"
 * - "12s 3d" → "12s 3d" (sem mudança)
 * - "12s3d" → "12s3d" (sem mudança, já tem dias)
 * - "" → "" (vazio permanece vazio)
 * - "Normal" → "Normal" (texto livre não é alterado)
 */
export function normalizarIdadeGestacional(ig: string): string {
  if (!ig || ig.trim() === '') return ig;

  const trimmed = ig.trim();

  // Padrão: número seguido de "s" (com ou sem espaço), SEM "d" depois
  // Ex: "12s", "12 s", "8s ", "12s "
  const apenasSemanasComS = /^(\d{1,2})\s*s\s*$/i;
  const matchComS = trimmed.match(apenasSemanasComS);
  if (matchComS) {
    return `${matchComS[1]}s 0d`;
  }

  // Padrão: apenas número (sem "s" nem "d")
  // Ex: "12", "8", "32"
  const apenasNumero = /^(\d{1,2})$/;
  const matchNumero = trimmed.match(apenasNumero);
  if (matchNumero) {
    return `${matchNumero[1]}s 0d`;
  }

  // Padrão: número + "s" + espaço + número (sem "d")
  // Ex: "12s 3", "8s 0"
  const semanasEDiasSemD = /^(\d{1,2})\s*s\s+(\d{1,2})$/i;
  const matchSemD = trimmed.match(semanasEDiasSemD);
  if (matchSemD) {
    return `${matchSemD[1]}s ${matchSemD[2]}d`;
  }

  // Se já tem "d" ou é texto livre, retorna sem alteração
  return trimmed;
}
