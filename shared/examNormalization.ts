/**
 * Mapa de normalização de nomes de exames laboratoriais.
 * Converte todas as variações encontradas no banco de dados para o nome canônico padronizado.
 * 
 * Nomes padronizados conforme documento de normalização (25/03/2026):
 * - Title Case para nomes compostos
 * - Siglas médicas em MAIÚSCULAS (HIV, VDRL, TSH, EGB, HBsAg, Anti-HCV, ABO/Rh, IgG, IgM)
 * 
 * IMPORTANTE: Hemoglobina/Hematócrito é o nome canônico para Hemograma, Hemoglobina e Hematócrito combinados.
 * Plaquetas é exame separado.
 * 
 * Categorias:
 * - SANGUE: Tipagem Sanguínea (ABO/Rh), Coombs Indireto, Hemoglobina/Hematócrito,
 *           Plaquetas, Glicemia de Jejum, VDRL, FTA-ABS IgG, FTA-ABS IgM,
 *           HIV, Hepatite B (HBsAg), Anti-HBs, Hepatite C (Anti-HCV),
 *           Toxoplasmose IgG, Toxoplasmose IgM, Rubéola IgG, Rubéola IgM,
 *           Citomegalovírus IgG, Citomegalovírus IgM, TSH, T4 Livre,
 *           Eletroforese de Hemoglobina, Ferritina, Vitamina D (25-OH),
 *           Vitamina B12, TOTG 75g
 * - URINA: Urina Tipo I, Urocultura, Proteinúria de 24 Horas
 * - FEZES: EPF (Parasitológico de Fezes)
 * - EGB: Estreptococo Grupo B (EGB)
 */

// Map from any variation -> canonical name
export const EXAM_NAME_NORMALIZATION: Record<string, string> = {
  // === TIPAGEM SANGUÍNEA (ABO/Rh) ===
  'Tipagem Sanguínea (ABO/Rh)': 'Tipagem Sanguínea (ABO/Rh)',
  'Tipagem sanguínea ABO/Rh': 'Tipagem Sanguínea (ABO/Rh)',
  'Tipagem sanguínea': 'Tipagem Sanguínea (ABO/Rh)',
  'Tipagem Sanguínea': 'Tipagem Sanguínea (ABO/Rh)',
  'tipagem_sanguinea': 'Tipagem Sanguínea (ABO/Rh)',
  'tipoSanguineo': 'Tipagem Sanguínea (ABO/Rh)',
  'Grupo sanguíneo e Rh': 'Tipagem Sanguínea (ABO/Rh)',

  // === COOMBS INDIRETO ===
  'Coombs Indireto': 'Coombs Indireto',
  'Coombs indireto': 'Coombs Indireto',

  // === HEMOGLOBINA/HEMATÓCRITO (unificado) ===
  'Hemoglobina/Hematócrito': 'Hemoglobina/Hematócrito',
  'Hemograma': 'Hemoglobina/Hematócrito',
  'hemograma': 'Hemoglobina/Hematócrito',
  'Hemograma Completo': 'Hemoglobina/Hematócrito',
  'hemoglobina_hematocrito': 'Hemoglobina/Hematócrito',
  'Hemoglobina': 'Hemoglobina/Hematócrito',
  'Hematócrito': 'Hemoglobina/Hematócrito',

  // === PLAQUETAS ===
  'Plaquetas': 'Plaquetas',

  // === GLICEMIA DE JEJUM ===
  'Glicemia de Jejum': 'Glicemia de Jejum',
  'Glicemia de jejum': 'Glicemia de Jejum',
  'Glicemia jejum': 'Glicemia de Jejum',
  'glicemia_jejum': 'Glicemia de Jejum',
  'glicemiaJejum': 'Glicemia de Jejum',

  // === VDRL ===
  'VDRL': 'VDRL',
  'vdrl': 'VDRL',
  'vdrl_sifilis': 'VDRL',

  // === FTA-ABS ===
  'FTA-ABS IgG': 'FTA-ABS IgG',
  'FTA-ABS IgM': 'FTA-ABS IgM',

  // === HIV ===
  'HIV': 'HIV',
  'hiv': 'HIV',

  // === HEPATITE B ===
  'Hepatite B (HBsAg)': 'Hepatite B (HBsAg)',
  'Hepatite B HBsAg': 'Hepatite B (HBsAg)',
  'hepatiteB': 'Hepatite B (HBsAg)',

  // === ANTI-HBs ===
  'Anti-HBs': 'Anti-HBs',

  // === HEPATITE C ===
  'Hepatite C (Anti-HCV)': 'Hepatite C (Anti-HCV)',
  'Hepatite C Anti-HCV': 'Hepatite C (Anti-HCV)',
  'Hepatite C': 'Hepatite C (Anti-HCV)',
  'hepatiteC': 'Hepatite C (Anti-HCV)',

  // === TOXOPLASMOSE ===
  'Toxoplasmose IgG': 'Toxoplasmose IgG',
  'Toxoplasmose IgM': 'Toxoplasmose IgM',
  'toxoplasmose_igg': 'Toxoplasmose IgG',
  'toxoplasmose_igm': 'Toxoplasmose IgM',
  'toxoplasmose': 'Toxoplasmose IgG', // Generic -> IgG

  // === RUBÉOLA ===
  'Rubéola IgG': 'Rubéola IgG',
  'Rubéola IgM': 'Rubéola IgM',
  'rubeola_igg': 'Rubéola IgG',
  'rubeola_igm': 'Rubéola IgM',
  'rubeola': 'Rubéola IgG', // Generic -> IgG

  // === CITOMEGALOVÍRUS ===
  'Citomegalovírus IgG': 'Citomegalovírus IgG',
  'Citomegalovírus IgM': 'Citomegalovírus IgM',
  'CMV IgG': 'Citomegalovírus IgG',
  'CMV IgM': 'Citomegalovírus IgM',
  'citomegalovirus': 'Citomegalovírus IgG', // Generic -> IgG

  // === TSH ===
  'TSH': 'TSH',
  'tsh': 'TSH',

  // === T4 LIVRE ===
  'T4 Livre': 'T4 Livre',

  // === ELETROFORESE DE HEMOGLOBINA ===
  'Eletroforese de Hemoglobina': 'Eletroforese de Hemoglobina',

  // === FERRITINA ===
  'Ferritina': 'Ferritina',

  // === VITAMINA D ===
  'Vitamina D (25-OH)': 'Vitamina D (25-OH)',
  'vitamina_d_25_oh': 'Vitamina D (25-OH)',

  // === VITAMINA B12 ===
  'Vitamina B12': 'Vitamina B12',
  'vitamina_b12': 'Vitamina B12',

  // === TOTG 75g (antes TTGO 75g / Curva Glicêmica) ===
  'TOTG 75g': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica) - Jejum': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica) - 1 hora': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica) - 2 horas': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)__Jejum': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)__1 hora': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)__2 horas': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)-Jejum': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)-1 hora': 'TOTG 75g',
  'TTGO 75g (Curva Glicêmica)-2 horas': 'TOTG 75g',
  'ttgo_75g_curva_glicemica_jejum': 'TOTG 75g',
  'ttgo_75g_curva_glicemica_1_hora': 'TOTG 75g',
  'ttgo_75g_curva_glicemica_2_horas': 'TOTG 75g',
  'TTGO 75g (0min)': 'TOTG 75g',
  'TTGO 75g (60min)': 'TOTG 75g',
  'TTGO 75g (120min)': 'TOTG 75g',
  'totg': 'TOTG 75g',
  'TOTG 75g (Curva Glicêmica)': 'TOTG 75g',
  // TTGO subcampos salvos no banco
  'TTGO-Jejum': 'TOTG 75g',
  'TTGO-1h': 'TOTG 75g',
  'TTGO-2h': 'TOTG 75g',

  // === URINA TIPO I (antes EAS) ===
  'Urina Tipo I': 'Urina Tipo I',
  'EAS (Urina tipo 1)': 'Urina Tipo I',
  'eas': 'Urina Tipo I',
  'eas_urina_tipo_1': 'Urina Tipo I',
  'EAS (Urina tipo 1)__Nitrito': 'Urina Tipo I',
  'Urina tipo I': 'Urina Tipo I',

  // === UROCULTURA ===
  'Urocultura': 'Urocultura',
  'urocultura': 'Urocultura',

  // === PROTEINÚRIA ===
  'Proteinúria de 24 Horas': 'Proteinúria de 24 Horas',
  'Proteinúria de 24 horas': 'Proteinúria de 24 Horas',

  // === EPF (FEZES) ===
  'EPF (Parasitológico de Fezes)': 'EPF (Parasitológico de Fezes)',

  // === ESTREPTOCOCO GRUPO B (EGB) ===
  'Estreptococo Grupo B (EGB)': 'Estreptococo Grupo B (EGB)',
  'Swab vaginal/retal EGB': 'Estreptococo Grupo B (EGB)',
  'Swab EGB': 'Estreptococo Grupo B (EGB)',
  'streptococcusB': 'Estreptococo Grupo B (EGB)',
  'Estreptococo Grupo B': 'Estreptococo Grupo B (EGB)',
};

/**
 * Normaliza o nome de um exame para o nome canônico.
 * Se não encontrar no mapa, retorna o nome original.
 */
export function normalizeExamName(nome: string): string {
  return EXAM_NAME_NORMALIZATION[nome] || nome;
}

/**
 * Categorias canônicas de exames - define a qual categoria cada exame canônico pertence.
 */
export const EXAM_CATEGORIES: Record<string, 'sangue' | 'urina' | 'fezes' | 'egb'> = {
  'Tipagem Sanguínea (ABO/Rh)': 'sangue',
  'Coombs Indireto': 'sangue',
  'Hemoglobina/Hematócrito': 'sangue',
  'Plaquetas': 'sangue',
  'Glicemia de Jejum': 'sangue',
  'VDRL': 'sangue',
  'FTA-ABS IgG': 'sangue',
  'FTA-ABS IgM': 'sangue',
  'HIV': 'sangue',
  'Hepatite B (HBsAg)': 'sangue',
  'Anti-HBs': 'sangue',
  'Hepatite C (Anti-HCV)': 'sangue',
  'Toxoplasmose IgG': 'sangue',
  'Toxoplasmose IgM': 'sangue',
  'Rubéola IgG': 'sangue',
  'Rubéola IgM': 'sangue',
  'Citomegalovírus IgG': 'sangue',
  'Citomegalovírus IgM': 'sangue',
  'TSH': 'sangue',
  'T4 Livre': 'sangue',
  'Eletroforese de Hemoglobina': 'sangue',
  'Ferritina': 'sangue',
  'Vitamina D (25-OH)': 'sangue',
  'Vitamina B12': 'sangue',
  'TOTG 75g': 'sangue',
  'Urina Tipo I': 'urina',
  'Urocultura': 'urina',
  'Proteinúria de 24 Horas': 'urina',
  'EPF (Parasitológico de Fezes)': 'fezes',
  'Estreptococo Grupo B (EGB)': 'egb',
};

/**
 * Set of all canonical exam names for quick lookup
 */
export const ALL_CANONICAL_EXAMS = new Set(Object.keys(EXAM_CATEGORIES));

/**
 * Dado um nome de exame (possivelmente variante), retorna a categoria.
 * Se não encontrar, retorna 'sangue' como fallback.
 */
export function getExamCategory(nome: string): 'sangue' | 'urina' | 'fezes' | 'egb' {
  const canonical = normalizeExamName(nome);
  return EXAM_CATEGORIES[canonical] || 'sangue';
}
