/**
 * Mapa de normalização de nomes de exames laboratoriais.
 * Converte todas as variações encontradas no banco de dados para o nome canônico
 * usado no examesConfig.ts do frontend.
 * 
 * Categorias:
 * - SANGUE: Tipagem sanguínea ABO/Rh, Coombs indireto, Hemoglobina/Hematócrito, Plaquetas,
 *           Glicemia de jejum, VDRL, FTA-ABS IgG, FTA-ABS IgM, HIV, Hepatite B (HBsAg),
 *           Anti-HBs, Hepatite C (Anti-HCV), Toxoplasmose IgG, Toxoplasmose IgM,
 *           Rubéola IgG, Rubéola IgM, Citomegalovírus IgG, Citomegalovírus IgM,
 *           TSH, T4 Livre, Eletroforese de Hemoglobina, Ferritina, Vitamina D (25-OH),
 *           Vitamina B12, TTGO 75g (Curva Glicêmica)
 * - URINA: EAS (Urina tipo 1), Urocultura, Proteinúria de 24 horas
 * - FEZES: EPF (Parasitológico de Fezes)
 * - EGB: Swab vaginal/retal EGB
 */

// Map from any variation -> canonical name
export const EXAM_NAME_NORMALIZATION: Record<string, string> = {
  // === TIPAGEM SANGUÍNEA ===
  'Tipagem sanguínea ABO/Rh': 'Tipagem sanguínea ABO/Rh',
  'Tipagem sanguínea': 'Tipagem sanguínea ABO/Rh',
  'tipagem_sanguinea': 'Tipagem sanguínea ABO/Rh',
  'tipoSanguineo': 'Tipagem sanguínea ABO/Rh',
  'Grupo sanguíneo e Rh': 'Tipagem sanguínea ABO/Rh',

  // === COOMBS INDIRETO ===
  'Coombs indireto': 'Coombs indireto',

  // === HEMOGLOBINA/HEMATÓCRITO ===
  'Hemoglobina/Hematócrito': 'Hemoglobina/Hematócrito',
  'hemoglobina_hematocrito': 'Hemoglobina/Hematócrito',
  'Hemoglobina': 'Hemoglobina/Hematócrito',
  'Hematócrito': 'Hemoglobina/Hematócrito',
  'Hemograma': 'Hemoglobina/Hematócrito',
  'Hemograma Completo': 'Hemoglobina/Hematócrito',

  // === PLAQUETAS ===
  'Plaquetas': 'Plaquetas',

  // === GLICEMIA DE JEJUM ===
  'Glicemia de jejum': 'Glicemia de jejum',
  'Glicemia jejum': 'Glicemia de jejum',
  'glicemia_jejum': 'Glicemia de jejum',
  'glicemiaJejum': 'Glicemia de jejum',
  'Glicemia de Jejum': 'Glicemia de jejum',

  // === VDRL ===
  'VDRL': 'VDRL',
  'vdrl_sifilis': 'VDRL',

  // === FTA-ABS ===
  'FTA-ABS IgG': 'FTA-ABS IgG',
  'FTA-ABS IgM': 'FTA-ABS IgM',

  // === HIV ===
  'HIV': 'HIV',

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

  // === TTGO / CURVA GLICÊMICA ===
  'TTGO 75g (Curva Glicêmica)': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica) - Jejum': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica) - 1 hora': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica) - 2 horas': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica)__Jejum': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica)__1 hora': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica)__2 horas': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica)-Jejum': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica)-1 hora': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (Curva Glicêmica)-2 horas': 'TTGO 75g (Curva Glicêmica)',
  'ttgo_75g_curva_glicemica_jejum': 'TTGO 75g (Curva Glicêmica)',
  'ttgo_75g_curva_glicemica_1_hora': 'TTGO 75g (Curva Glicêmica)',
  'ttgo_75g_curva_glicemica_2_horas': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (0min)': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (60min)': 'TTGO 75g (Curva Glicêmica)',
  'TTGO 75g (120min)': 'TTGO 75g (Curva Glicêmica)',
  'TOTG 75g': 'TTGO 75g (Curva Glicêmica)',
  'totg': 'TTGO 75g (Curva Glicêmica)',

  // === EAS (URINA) ===
  'EAS (Urina tipo 1)': 'EAS (Urina tipo 1)',
  'eas': 'EAS (Urina tipo 1)',
  'eas_urina_tipo_1': 'EAS (Urina tipo 1)',
  'EAS (Urina tipo 1)__Nitrito': 'EAS (Urina tipo 1)',
  'Urina tipo I': 'EAS (Urina tipo 1)',

  // === UROCULTURA ===
  'Urocultura': 'Urocultura',

  // === PROTEINÚRIA ===
  'Proteinúria de 24 horas': 'Proteinúria de 24 horas',

  // === EPF (FEZES) ===
  'EPF (Parasitológico de Fezes)': 'EPF (Parasitológico de Fezes)',

  // === EGB (SWAB) ===
  'Swab vaginal/retal EGB': 'Swab vaginal/retal EGB',
  'Swab EGB': 'Swab vaginal/retal EGB',
  'streptococcusB': 'Swab vaginal/retal EGB',
  'Estreptococo Grupo B': 'Swab vaginal/retal EGB',
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
  'Tipagem sanguínea ABO/Rh': 'sangue',
  'Coombs indireto': 'sangue',
  'Hemoglobina/Hematócrito': 'sangue',
  'Plaquetas': 'sangue',
  'Glicemia de jejum': 'sangue',
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
  'TTGO 75g (Curva Glicêmica)': 'sangue',
  'EAS (Urina tipo 1)': 'urina',
  'Urocultura': 'urina',
  'Proteinúria de 24 horas': 'urina',
  'EPF (Parasitológico de Fezes)': 'fezes',
  'Swab vaginal/retal EGB': 'egb',
};

/**
 * Dado um nome de exame (possivelmente variante), retorna a categoria.
 * Se não encontrar, retorna 'sangue' como fallback.
 */
export function getExamCategory(nome: string): 'sangue' | 'urina' | 'fezes' | 'egb' {
  const canonical = normalizeExamName(nome);
  return EXAM_CATEGORIES[canonical] || 'sangue';
}
