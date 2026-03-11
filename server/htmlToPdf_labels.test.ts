import { describe, it, expect } from 'vitest';
import { sanitizeForPdf, formatarLabel, FATORES_RISCO_LABELS, TIPO_ULTRASSOM_LABELS, MEDICAMENTO_LABELS } from './htmlToPdf_labels';

describe('sanitizeForPdf', () => {
  it('preserves Portuguese accented characters (Latin-1)', () => {
    expect(sanitizeForPdf('Cartão de Pré-Natal')).toBe('Cartão de Pré-Natal');
    expect(sanitizeForPdf('História Obstétrica')).toBe('História Obstétrica');
    expect(sanitizeForPdf('Morfológico')).toBe('Morfológico');
    expect(sanitizeForPdf('Gestação')).toBe('Gestação');
    expect(sanitizeForPdf('Hipertensão')).toBe('Hipertensão');
    expect(sanitizeForPdf('Incompetência')).toBe('Incompetência');
    expect(sanitizeForPdf('Cálcio')).toBe('Cálcio');
    expect(sanitizeForPdf('Polivitamínicos')).toBe('Polivitamínicos');
    expect(sanitizeForPdf('Cesáreas')).toBe('Cesáreas');
    expect(sanitizeForPdf('Página')).toBe('Página');
    expect(sanitizeForPdf('Clínica')).toBe('Clínica');
  });

  it('preserves all Portuguese vowels with accents', () => {
    expect(sanitizeForPdf('àáâãäèéêëìíîïòóôõöùúûüçñ')).toBe('àáâãäèéêëìíîïòóôõöùúûüçñ');
    expect(sanitizeForPdf('ÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ')).toBe('ÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ');
  });

  it('replaces smart quotes with regular quotes', () => {
    expect(sanitizeForPdf('\u201ctest\u201d')).toBe('"test"');
    expect(sanitizeForPdf('\u2018test\u2019')).toBe("'test'");
  });

  it('replaces em/en dashes with regular dash', () => {
    expect(sanitizeForPdf('a\u2013b')).toBe('a-b');
    expect(sanitizeForPdf('a\u2014b')).toBe('a-b');
  });

  it('replaces math symbols outside Latin-1', () => {
    expect(sanitizeForPdf('\u2265')).toBe('>=');
    expect(sanitizeForPdf('\u2264')).toBe('<=');
  });

  it('replaces bullet points', () => {
    expect(sanitizeForPdf('\u2022 item')).toBe('- item');
  });

  it('replaces ellipsis', () => {
    expect(sanitizeForPdf('texto\u2026')).toBe('texto...');
  });
});

describe('formatarLabel', () => {
  it('returns mapped label when available', () => {
    expect(formatarLabel('hipertensao', FATORES_RISCO_LABELS)).toBe('Hipertensão');
    expect(formatarLabel('diabetes_gestacional', FATORES_RISCO_LABELS)).toBe('Diabetes Gestacional');
    expect(formatarLabel('incompetencia_istmo_cervical', FATORES_RISCO_LABELS)).toBe('Incompetência Istmo-cervical');
  });

  it('returns formatted fallback for unmapped values', () => {
    const result = formatarLabel('some_unknown_value', FATORES_RISCO_LABELS);
    expect(result).toBe('Some Unknown Value');
  });
});

describe('label maps have proper accents', () => {
  it('FATORES_RISCO_LABELS have Portuguese accents', () => {
    expect(FATORES_RISCO_LABELS['alteracoes_morfologicas_fetais']).toBe('Alterações morfológicas fetais');
    expect(FATORES_RISCO_LABELS['hipertensao']).toBe('Hipertensão');
    expect(FATORES_RISCO_LABELS['historico_familiar_dheg']).toBe('Histórico familiar de DHEG');
    expect(FATORES_RISCO_LABELS['incompetencia_istmo_cervical']).toBe('Incompetência Istmo-cervical');
    expect(FATORES_RISCO_LABELS['mal_passado_obstetrico']).toBe('Mal Passado Obstétrico');
    expect(FATORES_RISCO_LABELS['cirurgia_uterina_previa']).toBe('Cirurgia Uterina Prévia');
    expect(FATORES_RISCO_LABELS['fiv_nesta_gestacao']).toBe('FIV nesta gestação');
    expect(FATORES_RISCO_LABELS['malformacoes_mullerianas']).toBe('Malformações Mullerianas');
  });

  it('TIPO_ULTRASSOM_LABELS have Portuguese accents', () => {
    expect(TIPO_ULTRASSOM_LABELS['morfologico_1tri']).toBe('Morfológico 1º Trimestre');
    expect(TIPO_ULTRASSOM_LABELS['morfologico_2tri']).toBe('Morfológico 2º Trimestre');
    expect(TIPO_ULTRASSOM_LABELS['ultrassom_obstetrico']).toBe('Ultrassom Obstétrico');
    expect(TIPO_ULTRASSOM_LABELS['primeiro_ultrassom']).toBe('1º Ultrassom');
  });

  it('MEDICAMENTO_LABELS have Portuguese accents', () => {
    expect(MEDICAMENTO_LABELS['calcio']).toBe('Cálcio');
    expect(MEDICAMENTO_LABELS['polivitaminicos']).toBe('Polivitamínicos');
    expect(MEDICAMENTO_LABELS['medicamentos_inalatorios']).toBe('Medicamentos Inalatórios');
    expect(MEDICAMENTO_LABELS['progestagenos']).toBe('Progestágenos');
    expect(MEDICAMENTO_LABELS['psicotropicos']).toBe('Psicotrópicos');
  });
});
