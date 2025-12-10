/**
 * Mapeamento entre nomes de exames na UI e IDs de validação
 * Usado para conectar examesConfig.ts com valoresReferencia.ts
 */

export const MAPEAMENTO_EXAMES: Record<string, string> = {
  // Exames de Sangue
  "Tipagem sanguínea ABO/Rh": "tipagem_sanguinea",
  "Coombs indireto": "coombs_indireto",
  "Hemoglobina/Hematócrito": "hemoglobina_hematocrito",
  "Plaquetas": "plaquetas",
  "Glicemia de jejum": "glicemia_jejum",
  "VDRL": "vdrl",
  "FTA-ABS IgG": "fta_abs_igg",
  "FTA-ABS IgM": "fta_abs_igm",
  "HIV": "hiv",
  "Hepatite B (HBsAg)": "hepatite_b",
  "Hepatite C (Anti-HCV)": "hepatite_c",
  "Toxoplasmose IgG": "toxoplasmose_igg",
  "Toxoplasmose IgM": "toxoplasmose_igm",
  "Rubéola IgG": "rubeola_igg",
  "Rubéola IgM": "rubeola_igm",
  "Citomegalovírus IgG": "cmv_igg",
  "Citomegalovírus IgM": "cmv_igm",
  "TSH": "tsh",
  "T4 Livre": "t4_livre",
  "Ferritina": "ferritina",
  "Vitamina D (25-OH)": "vitamina_d",
  "Vitamina B12": "vitamina_b12",
  
  // TTGO (subcampos)
  "TTGO 75g (Curva Glicêmica)-Jejum": "ttgo_jejum",
  "TTGO 75g (Curva Glicêmica)-1 hora": "ttgo_1h",
  "TTGO 75g (Curva Glicêmica)-2 horas": "ttgo_2h",
  
  // Exames de Urina
  "Urocultura": "urocultura",
  
  // Outros Exames
  "Pesquisa para Estreptococo do Grupo B (EGB)": "egb_swab"
};

/**
 * Obtém o ID de validação para um exame
 */
export function obterIdValidacao(nomeExame: string): string | null {
  return MAPEAMENTO_EXAMES[nomeExame] || null;
}
