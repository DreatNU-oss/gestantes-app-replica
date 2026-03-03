/**
 * Utilitário para validação de peso com 1 casa decimal.
 * Bloqueia digitação de mais de 1 casa decimal (ex: 79.55 → bloqueado).
 * Permite: 79, 79., 79.5
 * Bloqueia: 79.55, 79.123
 */

/**
 * Valida e filtra o valor do input de peso para aceitar no máximo 1 casa decimal.
 * Retorna o valor filtrado ou null se o valor deve ser rejeitado.
 */
export function filtrarPesoInput(valor: string): string | null {
  // Permitir campo vazio
  if (valor === "") return "";

  // Permitir apenas números, ponto e vírgula
  // Substituir vírgula por ponto para padronizar
  const valorNormalizado = valor.replace(",", ".");

  // Regex: número inteiro ou com no máximo 1 casa decimal
  // Permite: "79", "79.", "79.5", mas não "79.55"
  const regex = /^\d{0,3}(\.\d{0,1})?$/;

  if (regex.test(valorNormalizado)) {
    return valorNormalizado;
  }

  // Rejeitar valor inválido
  return null;
}

/**
 * Handler de onChange para inputs de peso.
 * Usa filtrarPesoInput para bloquear valores com mais de 1 casa decimal.
 */
export function handlePesoChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (valor: string) => void
) {
  const valorFiltrado = filtrarPesoInput(e.target.value);
  if (valorFiltrado !== null) {
    setter(valorFiltrado);
  }
  // Se null, ignora a mudança (bloqueia a digitação)
}
