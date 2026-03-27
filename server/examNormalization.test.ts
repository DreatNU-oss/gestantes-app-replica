import { describe, it, expect } from 'vitest';
import { normalizeExamName, getExamCategory, EXAM_CATEGORIES, EXAM_NAME_NORMALIZATION } from '../shared/examNormalization';

describe('normalizeExamName', () => {
  it('returns canonical name for known variations', () => {
    expect(normalizeExamName('tipagem_sanguinea')).toBe('Tipagem Sanguínea (ABO/Rh)');
    expect(normalizeExamName('tipoSanguineo')).toBe('Tipagem Sanguínea (ABO/Rh)');
    expect(normalizeExamName('Grupo sanguíneo e Rh')).toBe('Tipagem Sanguínea (ABO/Rh)');
    expect(normalizeExamName('Tipagem sanguínea')).toBe('Tipagem Sanguínea (ABO/Rh)');
    // Old canonical name should also normalize to new
    expect(normalizeExamName('Tipagem sanguínea ABO/Rh')).toBe('Tipagem Sanguínea (ABO/Rh)');
  });

  it('normalizes hemoglobina, hematocrito, hemograma as unified Hemoglobina/Hematócrito', () => {
    // All hemograma-related names map to the canonical 'Hemoglobina/Hematócrito'
    expect(normalizeExamName('Hemoglobina')).toBe('Hemoglobina/Hematócrito');
    expect(normalizeExamName('Hematócrito')).toBe('Hemoglobina/Hematócrito');
    expect(normalizeExamName('hemoglobina_hematocrito')).toBe('Hemoglobina/Hematócrito');
    expect(normalizeExamName('Hemoglobina/Hematócrito')).toBe('Hemoglobina/Hematócrito');
    expect(normalizeExamName('Hemograma')).toBe('Hemoglobina/Hematócrito');
    expect(normalizeExamName('hemograma')).toBe('Hemoglobina/Hematócrito');
    expect(normalizeExamName('Hemograma Completo')).toBe('Hemoglobina/Hematócrito');
  });

  it('normalizes glicemia variations', () => {
    expect(normalizeExamName('glicemia_jejum')).toBe('Glicemia de Jejum');
    expect(normalizeExamName('glicemiaJejum')).toBe('Glicemia de Jejum');
    expect(normalizeExamName('Glicemia jejum')).toBe('Glicemia de Jejum');
    expect(normalizeExamName('Glicemia de Jejum')).toBe('Glicemia de Jejum');
    // Old canonical name should also normalize
    expect(normalizeExamName('Glicemia de jejum')).toBe('Glicemia de Jejum');
  });

  it('normalizes TTGO/TOTG variations to TOTG 75g', () => {
    expect(normalizeExamName('TTGO 75g (Curva Glicêmica) - Jejum')).toBe('TOTG 75g');
    expect(normalizeExamName('TTGO 75g (Curva Glicêmica)__1 hora')).toBe('TOTG 75g');
    expect(normalizeExamName('ttgo_75g_curva_glicemica_2_horas')).toBe('TOTG 75g');
    expect(normalizeExamName('TOTG 75g')).toBe('TOTG 75g');
    expect(normalizeExamName('totg')).toBe('TOTG 75g');
    expect(normalizeExamName('TTGO 75g (0min)')).toBe('TOTG 75g');
    expect(normalizeExamName('TTGO 75g (60min)')).toBe('TOTG 75g');
    expect(normalizeExamName('TTGO 75g (120min)')).toBe('TOTG 75g');
    // Old canonical name
    expect(normalizeExamName('TTGO 75g (Curva Glicêmica)')).toBe('TOTG 75g');
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

  it('normalizes EAS/urina variations to Urina Tipo I', () => {
    expect(normalizeExamName('eas')).toBe('Urina Tipo I');
    expect(normalizeExamName('eas_urina_tipo_1')).toBe('Urina Tipo I');
    expect(normalizeExamName('EAS (Urina tipo 1)__Nitrito')).toBe('Urina Tipo I');
    expect(normalizeExamName('Urina tipo I')).toBe('Urina Tipo I');
    // Old canonical name
    expect(normalizeExamName('EAS (Urina tipo 1)')).toBe('Urina Tipo I');
  });

  it('normalizes EGB/swab variations to Estreptococo Grupo B (EGB)', () => {
    expect(normalizeExamName('Swab EGB')).toBe('Estreptococo Grupo B (EGB)');
    expect(normalizeExamName('streptococcusB')).toBe('Estreptococo Grupo B (EGB)');
    expect(normalizeExamName('Estreptococo Grupo B')).toBe('Estreptococo Grupo B (EGB)');
    // Old canonical name
    expect(normalizeExamName('Swab vaginal/retal EGB')).toBe('Estreptococo Grupo B (EGB)');
  });

  it('normalizes HTLV 1 e 2 variations', () => {
    expect(normalizeExamName('HTLV 1 e 2')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('htlv')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV I/II')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV 1/2')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anti-HTLV')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anti-HTLV I e II')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anti-HTLV 1 e 2')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV I e II')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV-1/2')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV I')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV II')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV 1')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('HTLV 2')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anti HTLV')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anti HTLV I e II')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anti HTLV 1 e 2')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Anticorpos Anti-HTLV I/II')).toBe('HTLV 1 e 2');
    expect(normalizeExamName('Pesquisa de Anticorpos Anti-HTLV I/II')).toBe('HTLV 1 e 2');
  });

  it('normalizes Coombs Indireto', () => {
    expect(normalizeExamName('Coombs indireto')).toBe('Coombs Indireto');
    expect(normalizeExamName('Coombs Indireto')).toBe('Coombs Indireto');
  });

  it('normalizes Proteinúria de 24 Horas', () => {
    expect(normalizeExamName('Proteinúria de 24 horas')).toBe('Proteinúria de 24 Horas');
    expect(normalizeExamName('Proteinúria de 24 Horas')).toBe('Proteinúria de 24 Horas');
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
    expect(getExamCategory('Tipagem Sanguínea (ABO/Rh)')).toBe('sangue');
    expect(getExamCategory('HIV')).toBe('sangue');
    expect(getExamCategory('HTLV 1 e 2')).toBe('sangue');
    expect(getExamCategory('TSH')).toBe('sangue');
    expect(getExamCategory('Hemoglobina/Hematócrito')).toBe('sangue');
    expect(getExamCategory('TOTG 75g')).toBe('sangue');
  });

  it('returns urina for urine exams', () => {
    expect(getExamCategory('Urina Tipo I')).toBe('urina');
    expect(getExamCategory('Urocultura')).toBe('urina');
    expect(getExamCategory('Proteinúria de 24 Horas')).toBe('urina');
  });

  it('returns fezes for stool exams', () => {
    expect(getExamCategory('EPF (Parasitológico de Fezes)')).toBe('fezes');
  });

  it('returns egb for EGB exams', () => {
    expect(getExamCategory('Estreptococo Grupo B (EGB)')).toBe('egb');
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
    expect(categories.size).toBe(4);
  });

  it('covers all known database exam names', () => {
    const knownDbNames = [
      'Anti-HBs', 'citomegalovirus', 'Citomegalovírus IgG', 'Citomegalovírus IgM',
      'CMV IgG', 'CMV IgM', 'Coombs indireto', 'Coombs Indireto', 'eas', 'EAS (Urina tipo 1)',
      'EAS (Urina tipo 1)__Nitrito', 'eas_urina_tipo_1', 'EPF (Parasitológico de Fezes)',
      'Estreptococo Grupo B', 'Estreptococo Grupo B (EGB)', 'Ferritina', 'FTA-ABS IgG', 'FTA-ABS IgM',
      'Glicemia de jejum', 'Glicemia de Jejum', 'Glicemia jejum', 'glicemia_jejum', 'glicemiaJejum',
      'Grupo sanguíneo e Rh', 'Hematócrito', 'Hemoglobina', 'hemoglobina_hematocrito',
      'Hemoglobina/Hematócrito', 'Hemograma', 'Hepatite B (HBsAg)', 'Hepatite B HBsAg',
      'Hepatite C', 'Hepatite C (Anti-HCV)', 'Hepatite C Anti-HCV', 'hepatiteB',
      'hepatiteC', 'HIV', 'Plaquetas', 'rubeola', 'Rubéola IgG', 'Rubéola IgM',
      'rubeola_igg', 'rubeola_igm', 'streptococcusB', 'Swab EGB',
      'Swab vaginal/retal EGB', 'T4 Livre', 'Tipagem sanguínea',
      'Tipagem sanguínea ABO/Rh', 'Tipagem Sanguínea (ABO/Rh)', 'tipagem_sanguinea', 'tipoSanguineo', 'totg',
      'TOTG 75g', 'toxoplasmose', 'Toxoplasmose IgG', 'Toxoplasmose IgM',
      'toxoplasmose_igg', 'toxoplasmose_igm', 'TSH',
      'TTGO 75g (0min)', 'TTGO 75g (120min)', 'TTGO 75g (60min)',
      'TTGO 75g (Curva Glicêmica)', 'TTGO 75g (Curva Glicêmica) - 1 hora',
      'TTGO 75g (Curva Glicêmica) - 2 horas', 'TTGO 75g (Curva Glicêmica) - Jejum',
      'TTGO 75g (Curva Glicêmica)__1 hora', 'TTGO 75g (Curva Glicêmica)__2 horas',
      'TTGO 75g (Curva Glicêmica)__Jejum', 'TTGO 75g (Curva Glicêmica)-1 hora',
      'TTGO 75g (Curva Glicêmica)-2 horas', 'TTGO 75g (Curva Glicêmica)-Jejum',
      'ttgo_75g_curva_glicemica_1_hora', 'ttgo_75g_curva_glicemica_2_horas',
      'ttgo_75g_curva_glicemica_jejum', 'Urina tipo I', 'Urina Tipo I', 'Urocultura', 'VDRL',
      'vdrl_sifilis', 'Vitamina B12', 'Vitamina D (25-OH)', 'vitamina_b12',
      'vitamina_d_25_oh', 'Hemograma Completo',
      'Proteinúria de 24 horas', 'Proteinúria de 24 Horas',
    ];

    knownDbNames.forEach(name => {
      const canonical = normalizeExamName(name);
      const category = getExamCategory(name);
      expect(EXAM_CATEGORIES[canonical]).toBeDefined();
      expect(['sangue', 'urina', 'fezes', 'egb']).toContain(category);
    });
  });
});
