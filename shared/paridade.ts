/**
 * Formata a paridade obstétrica com supressão de zeros.
 *
 * Regras:
 * - G sempre aparece (mesmo G1)
 * - P aparece apenas se > 0
 * - (PN...) aparece apenas se partosNormais > 0
 * - (PC...) aparece apenas se cesareas > 0
 * - O bloco (PN...PC...) aparece apenas se ao menos um dos dois > 0
 * - A aparece apenas se abortos > 0
 *
 * Exemplos:
 *   G1                          → primeira gestação atual
 *   G3P2(PC2)                   → 2 cesáreas anteriores
 *   G4P3(PN1PC2)                → 1 normal + 2 cesáreas
 *   G3A3                        → 3 abortos, sem partos
 *   G5P2(PN1PC1)A2              → 2 partos + 2 abortos
 */
export function formatarParidade(params: {
  gesta?: number | null;
  para?: number | null;
  partosNormais?: number | null;
  cesareas?: number | null;
  abortos?: number | null;
}): string {
  const g = params.gesta ?? 0;
  const p = params.para ?? 0;
  const pn = params.partosNormais ?? 0;
  const pc = params.cesareas ?? 0;
  const a = params.abortos ?? 0;

  let resultado = `G${g}`;

  if (p > 0) {
    resultado += `P${p}`;

    // Bloco de detalhamento de partos — só aparece se PN ou PC > 0
    if (pn > 0 || pc > 0) {
      let detalhe = "";
      if (pn > 0) detalhe += `PN${pn}`;
      if (pc > 0) detalhe += `PC${pc}`;
      resultado += `(${detalhe})`;
    }
  }

  if (a > 0) {
    resultado += `A${a}`;
  }

  return resultado;
}
