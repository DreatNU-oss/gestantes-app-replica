import { describe, it, expect } from 'vitest';
import { normalizeExamName, getExamCategory, EXAM_CATEGORIES, EXAM_NAME_NORMALIZATION } from '../shared/examNormalization';

describe('normalizeExamName', () => {
  it('returns canonical name for known variations', () => {
    expect(normalizeExamName('tipagem_sanguinea')).toBe('Tipagem sanguínea ABO/Rh');
    expect(normalizeExamName('tipoSanguineo')).toBe('Tipagem sanguínea ABO/Rh');
    expect(normalizeExamName('Grupo sanguíneo e Rh')).toBe('Tipagem sanguínea ABO/Rh');
    expect(normalizeExamName('Tipagem sanguínea')).toBe('Tipagem sanguínea ABO/Rh');
  });

  it('normalizes hemoglobina, hematocrito, hemograma as SEPARATE exams', () => {
    // Hemoglobina stays as Hemoglobina
    expect(normalizeExamName('Hemoglobina')).toBe('Hemoglobina');
    // Hematócrito stays as Hematócrito
    expect(normalizeExamName('Hematócrito')).toBe('Hematócrito');
    // Hemograma and combined variations -> Hemograma
    expect(normalizeExamName('hemoglobina_hematocrito')).toBe('Hemograma');
    expect(normalizeExamName('Hemoglobina/Hematócrito')).toBe('Hemograma');
    expect(normalizeExamName('Hemograma')).toBe('Hemograma');
    expect(normalizeExamName('hemograma')).toBe('Hemograma');
    expect(normalizeExamName('Hemograma Completo')).toBe('Hemograma');
  });

  it('normalizes glicemia variations', () => {
    expect(normalizeExamName('glicemia_jejum')).toBe('Glicemia de jejum');
    expect(normalizeExamName('glicemiaJejum')).toBe('Glicemia de jejum');
    expect(normalizeExamName('Glicemia jejum')).toBe('Glicemia de jejum');
    expect(normalizeExamName('Glicemia de Jejum')).toBe('Glicemia de jejum');
  });

  it('normalizes TTGO/TOTG variations', () => {
    expect(normalizeExamName('TTGO 75g (Curva Glicêmica) - Jejum')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('TTGO 75g (Curva Glicêmica)__1 hora')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('ttgo_75g_curva_glicemica_2_horas')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('TOTG 75g')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('totg')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('TTGO 75g (0min)')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('TTGO 75g (60min)')).toBe('TTGO 75g (Curva Glicêmica)');
    expect(normalizeExamName('TTGO 75g (120min)')).toBe('TTGO 75g (Curva Glicêmica)');
  });

  it('normalizes hepatite variations', () => {
    expect(normalizeExamName('hepatiteB')).toBe('Hepatite B (HBsAg)');
    expect(normalizeExamName('Hepatite B HBsAg')).toBe('Hepatite B (HBsAg)');
    expect(normalizeExamName('hepatiteC')).toBe('Hepatite C (Anti-HCV)');
    expect(normalizeExamName('Hepatite C Anti-HCV')).toBe('Hepatite C (Anti-HCV)');
    expect(normalizeExamName('Hepatite C')).toBe('Hepatite C (Anti-HCV)');
  });

  it('normalizes toxoplasmose variations', () => {
    expect(normalizeExamName('toxoplasmose_igg')).toBe('Toxoplasmose IgG');
    expect(normalizeExamName('toxoplasmose_igm')).toBe('Toxoplasmose IgM');
    expect(normalizeExamName('toxoplasmose')).toBe('Toxoplasmose IgG');
  });

  it('normalizes rubéola variations', () => {
    expect(normalizeExamName('rubeola_igg')).toBe('Rubéola IgG');
    expect(normalizeExamName('rubeola_igm')).toBe('Rubéola IgM');
    expect(normalizeExamName('rubeola')).toBe('Rubéola IgG');
  });

  it('normalizes CMV variations', () => {
    expect(normalizeExamName('CMV IgG')).toBe('Citomegalovírus IgG');
    expect(normalizeExamName('CMV IgM')).toBe('Citomegalovírus IgM');
    expect(normalizeExamName('citomegalovirus')).toBe('Citomegalovírus IgG');
  });

  it('normalizes EAS/urina variations', () => {
    expect(normalizeExamName('eas')).toBe('EAS (Urina tipo 1)');
    expect(normalizeExamName('eas_urina_tipo_1')).toBe('EAS (Urina tipo 1)');
    expect(normalizeExamName('EAS (Urina tipo 1)__Nitrito')).toBe('EAS (Urina tipo 1)');
    expect(normalizeExamName('Urina tipo I')).toBe('EAS (Urina tipo 1)');
  });

  it('normalizes EGB/swab variations', () => {
    expect(normalizeExamName('Swab EGB')).toBe('Swab vaginal/retal EGB');
    expect(normalizeExamName('streptococcusB')).toBe('Swab vaginal/retal EGB');
    expect(normalizeExamName('Estreptococo Grupo B')).toBe('Swab vaginal/retal EGB');
  });

  it('normalizes VDRL variation', () => {
    expect(normalizeExamName('vdrl_sifilis')).toBe('VDRL');
  });

  it('normalizes vitamina variations', () => {
    expect(normalizeExamName('vitamina_d_25_oh')).toBe('Vitamina D (25-OH)');
    expect(normalizeExamName('vitamina_b12')).toBe('Vitamina B12');
  });

  it('returns original name for already canonical names', () => {
    expect(normalizeExamName('HIV')).toBe('HIV');
    expect(normalizeExamName('TSH')).toBe('TSH');
    expect(normalizeExamName('Plaquetas')).toBe('Plaquetas');
    expect(normalizeExamName('Ferritina')).toBe('Ferritina');
    expect(normalizeExamName('Urocultura')).toBe('Urocultura');
  });

  it('returns original name for unknown exams', () => {
    expect(normalizeExamName('ExameDesconhecido')).toBe('ExameDesconhecido');
    expect(normalizeExamName('Outro Exame Qualquer')).toBe('Outro Exame Qualquer');
  });
});

describe('getExamCategory', () => {
  it('returns sangue for blood exams', () => {
    expect(getExamCategory('Tipagem sanguínea ABO/Rh')).toBe('sangue');
    expect(getExamCategory('HIV')).toBe('sangue');
    expect(getExamCategory('TSH')).toBe('sangue');
    expect(getExamCategory('Hemoglobina/Hematócrito')).toBe('sangue');
    expect(getExamCategory('TTGO 75g (Curva Glicêmica)')).toBe('sangue');
  });

  it('returns urina for urine exams', () => {
    expect(getExamCategory('EAS (Urina tipo 1)')).toBe('urina');
    expect(getExamCategory('Urocultura')).toBe('urina');
    expect(getExamCategory('Proteinúria de 24 horas')).toBe('urina');
  });

  it('returns fezes for stool exams', () => {
    expect(getExamCategory('EPF (Parasitológico de Fezes)')).toBe('fezes');
  });

  it('returns egb for EGB exams', () => {
    expect(getExamCategory('Swab vaginal/retal EGB')).toBe('egb');
  });

  it('classifies variant names correctly via normalization', () => {
    expect(getExamCategory('tipagem_sanguinea')).toBe('sangue');
    expect(getExamCategory('eas')).toBe('urina');
    expect(getExamCategory('streptococcusB')).toBe('egb');
    expect(getExamCategory('hepatiteB')).toBe('sangue');
    expect(getExamCategory('TOTG 75g')).toBe('sangue');
  });

  it('returns sangue as fallback for unknown exams', () => {
    expect(getExamCategory('ExameDesconhecido')).toBe('sangue');
  });
});

describe('EXAM_CATEGORIES completeness', () => {
  it('has a category for every canonical exam name', () => {
    // Get all unique canonical names from the normalization map
    const canonicalNames = new Set(Object.values(EXAM_NAME_NORMALIZATION));
    canonicalNames.forEach(name => {
      expect(EXAM_CATEGORIES[name]).toBeDefined();
    });
  });

  it('no Outros Exames category exists', () => {
    const categories = new Set(Object.values(EXAM_CATEGORIES));
    expect(categories.has('sangue')).toBe(true);
    expect(categories.has('urina')).toBe(true);
    expect(categories.has('fezes')).toBe(true);
    expect(categories.has('egb')).toBe(true);
    // No "outros" category
    expect(categories.size).toBe(4);
  });

  it('covers all 80 known database exam names', () => {
    const knownDbNames = [
      'Anti-HBs', 'citomegalovirus', 'Citomegalovírus IgG', 'Citomegalovírus IgM',
      'CMV IgG', 'CMV IgM', 'Coombs indireto', 'eas', 'EAS (Urina tipo 1)',
      'EAS (Urina tipo 1)__Nitrito', 'eas_urina_tipo_1', 'EPF (Parasitológico de Fezes)',
      'Estreptococo Grupo B', 'Ferritina', 'FTA-ABS IgG', 'FTA-ABS IgM',
      'Glicemia de jejum', 'Glicemia jejum', 'glicemia_jejum', 'glicemiaJejum',
      'Grupo sanguíneo e Rh', 'Hematócrito', 'Hemoglobina', 'hemoglobina_hematocrito',
      'Hemoglobina/Hematócrito', 'Hemograma', 'Hepatite B (HBsAg)', 'Hepatite B HBsAg',
      'Hepatite C', 'Hepatite C (Anti-HCV)', 'Hepatite C Anti-HCV', 'hepatiteB',
      'hepatiteC', 'HIV', 'Plaquetas', 'rubeola', 'Rubéola IgG', 'Rubéola IgM',
      'rubeola_igg', 'rubeola_igm', 'streptococcusB', 'Swab EGB',
      'Swab vaginal/retal EGB', 'T4 Livre', 'Tipagem sanguínea',
      'Tipagem sanguínea ABO/Rh', 'tipagem_sanguinea', 'tipoSanguineo', 'totg',
      'TOTG 75g', 'toxoplasmose', 'Toxoplasmose IgG', 'Toxoplasmose IgM',
      'toxoplasmose_igg', 'toxoplasmose_igm', 'TSH',
      'TTGO 75g (0min)', 'TTGO 75g (120min)', 'TTGO 75g (60min)',
      'TTGO 75g (Curva Glicêmica)', 'TTGO 75g (Curva Glicêmica) - 1 hora',
      'TTGO 75g (Curva Glicêmica) - 2 horas', 'TTGO 75g (Curva Glicêmica) - Jejum',
      'TTGO 75g (Curva Glicêmica)__1 hora', 'TTGO 75g (Curva Glicêmica)__2 horas',
      'TTGO 75g (Curva Glicêmica)__Jejum', 'TTGO 75g (Curva Glicêmica)-1 hora',
      'TTGO 75g (Curva Glicêmica)-2 horas', 'TTGO 75g (Curva Glicêmica)-Jejum',
      'ttgo_75g_curva_glicemica_1_hora', 'ttgo_75g_curva_glicemica_2_horas',
      'ttgo_75g_curva_glicemica_jejum', 'Urina tipo I', 'Urocultura', 'VDRL',
      'vdrl_sifilis', 'Vitamina B12', 'Vitamina D (25-OH)', 'vitamina_b12',
      'vitamina_d_25_oh', 'Hemograma Completo',
    ];

    knownDbNames.forEach(name => {
      const canonical = normalizeExamName(name);
      const category = getExamCategory(name);
      // Every known name should normalize to a canonical name that has a category
      expect(EXAM_CATEGORIES[canonical]).toBeDefined();
      expect(['sangue', 'urina', 'fezes', 'egb']).toContain(category);
    });
  });
});
