// Label mappings and sanitization for jsPDF PDF generation
// jsPDF with standard Helvetica font supports Latin-1 (ISO 8859-1) characters,
// which includes all Portuguese accented characters (á, é, í, ó, ú, ã, õ, ç, etc.)

export const FATORES_RISCO_LABELS: Record<string, string> = {
  alergia_medicamentos: 'Alergia a medicamentos',
  alteracoes_morfologicas_fetais: 'Alterações morfológicas fetais',
  anemia_falciforme: 'Anemia Falciforme',
  cirurgia_uterina_previa: 'Cirurgia Uterina Prévia',
  diabetes_gestacional: 'Diabetes Gestacional',
  diabetes_tipo_1: 'Diabetes Tipo 1',
  diabetes_tipo2: 'Diabetes Tipo 2',
  dpoc_asma: 'DPOC/Asma',
  epilepsia: 'Epilepsia',
  fator_preditivo_dheg: 'Fator Preditivo para DHEG',
  fator_rh_negativo: 'Fator Rh Negativo',
  fiv_nesta_gestacao: 'FIV nesta gestação',
  gemelar: 'Gemelar',
  hipertensao: 'Hipertensão',
  hipotireoidismo: 'Hipotireoidismo',
  historico_familiar_dheg: 'Histórico familiar de DHEG',
  idade_avancada: 'Idade superior a 35 anos',
  incompetencia_istmo_cervical: 'Incompetência Istmo-cervical',
  mal_passado_obstetrico: 'Mal Passado Obstétrico',
  malformacoes_mullerianas: 'Malformações Mullerianas',
  outro: 'Outro',
  sobrepeso_obesidade: 'Sobrepeso/Obesidade',
  trombofilia: 'Trombofilia',
};

export const TIPO_ULTRASSOM_LABELS: Record<string, string> = {
  primeiro_ultrassom: '1º Ultrassom',
  morfologico_1tri: 'Morfológico 1º Trimestre',
  ultrassom_obstetrico: 'Ultrassom Obstétrico',
  morfologico_2tri: 'Morfológico 2º Trimestre',
  ecocardiograma_fetal: 'Ecocardiograma Fetal',
  ultrassom_seguimento: 'Ultrassom de Seguimento',
};

export const MEDICAMENTO_LABELS: Record<string, string> = {
  aas: 'AAS',
  anti_hipertensivos: 'Anti-hipertensivos',
  calcio: 'Cálcio',
  enoxaparina: 'Enoxaparina',
  insulina: 'Insulina',
  levotiroxina: 'Levotiroxina',
  medicamentos_inalatorios: 'Medicamentos Inalatórios',
  polivitaminicos: 'Polivitamínicos',
  progestagenos: 'Progestágenos',
  psicotropicos: 'Psicotrópicos',
  outros: 'Outros',
};

/** Converte enum com underscore para label legível */
export function formatarLabel(valor: string, mapa: Record<string, string>): string {
  if (mapa[valor]) return mapa[valor];
  // Fallback genérico: substituir underscores por espaços e capitalizar
  return sanitizeForPdf(valor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
}

/** Sanitiza caracteres não suportados pelo jsPDF Helvetica (fora do Latin-1).
 *  Preserva acentos portugueses (á, é, í, ó, ú, ã, õ, ç, etc.) pois são Latin-1. */
export function sanitizeForPdf(text: string): string {
  return text
    // Smart quotes to regular quotes
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Em/en dashes to regular dash
    .replace(/[\u2013\u2014]/g, '-')
    // Math symbols outside Latin-1
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2264]/g, '<=')
    // Bullet points
    .replace(/[\u2022]/g, '-')
    // Ellipsis
    .replace(/[\u2026]/g, '...');
}
