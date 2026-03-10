// Label mappings and sanitization for jsPDF PDF generation
// jsPDF with standard Helvetica font does NOT support accented characters.
// All labels must use ASCII-only text.

export const FATORES_RISCO_LABELS: Record<string, string> = {
  alergia_medicamentos: 'Alergia a medicamentos',
  alteracoes_morfologicas_fetais: 'Alteracoes morfologicas fetais',
  anemia_falciforme: 'Anemia Falciforme',
  cirurgia_uterina_previa: 'Cirurgia Uterina Previa',
  diabetes_gestacional: 'Diabetes Gestacional',
  diabetes_tipo_1: 'Diabetes Tipo 1',
  diabetes_tipo2: 'Diabetes Tipo 2',
  dpoc_asma: 'DPOC/Asma',
  epilepsia: 'Epilepsia',
  fator_preditivo_dheg: 'Fator Preditivo para DHEG',
  fator_rh_negativo: 'Fator Rh Negativo',
  fiv_nesta_gestacao: 'FIV nesta gestacao',
  gemelar: 'Gemelar',
  hipertensao: 'Hipertensao',
  hipotireoidismo: 'Hipotireoidismo',
  historico_familiar_dheg: 'Historico familiar de DHEG',
  idade_avancada: 'Idade superior a 35 anos',
  incompetencia_istmo_cervical: 'Incompetencia Istmo-cervical',
  mal_passado_obstetrico: 'Mal Passado Obstetrico',
  malformacoes_mullerianas: 'Malformacoes Mullerianas',
  outro: 'Outro',
  sobrepeso_obesidade: 'Sobrepeso/Obesidade',
  trombofilia: 'Trombofilia',
};

export const TIPO_ULTRASSOM_LABELS: Record<string, string> = {
  primeiro_ultrassom: '1o Ultrassom',
  morfologico_1tri: 'Morfologico 1o Trimestre',
  ultrassom_obstetrico: 'Ultrassom Obstetrico',
  morfologico_2tri: 'Morfologico 2o Trimestre',
  ecocardiograma_fetal: 'Ecocardiograma Fetal',
  ultrassom_seguimento: 'Ultrassom de Seguimento',
};

export const MEDICAMENTO_LABELS: Record<string, string> = {
  aas: 'AAS',
  anti_hipertensivos: 'Anti-hipertensivos',
  calcio: 'Calcio',
  enoxaparina: 'Enoxaparina',
  insulina: 'Insulina',
  levotiroxina: 'Levotiroxina',
  medicamentos_inalatorios: 'Medicamentos Inalatorios',
  polivitaminicos: 'Polivitaminicos',
  progestagenos: 'Progestagenos',
  psicotropicos: 'Psicotropicos',
  outros: 'Outros',
};

/** Converte enum com underscore para label legivel */
export function formatarLabel(valor: string, mapa: Record<string, string>): string {
  if (mapa[valor]) return mapa[valor];
  // Fallback generico: substituir underscores por espacos e capitalizar
  return sanitizeForPdf(valor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
}

/** Remove acentos e caracteres especiais para compatibilidade com jsPDF Helvetica */
export function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u00e0\u00e1\u00e2\u00e3\u00e4]/g, 'a')
    .replace(/[\u00c0\u00c1\u00c2\u00c3\u00c4]/g, 'A')
    .replace(/[\u00e8\u00e9\u00ea\u00eb]/g, 'e')
    .replace(/[\u00c8\u00c9\u00ca\u00cb]/g, 'E')
    .replace(/[\u00ec\u00ed\u00ee\u00ef]/g, 'i')
    .replace(/[\u00cc\u00cd\u00ce\u00cf]/g, 'I')
    .replace(/[\u00f2\u00f3\u00f4\u00f5\u00f6]/g, 'o')
    .replace(/[\u00d2\u00d3\u00d4\u00d5\u00d6]/g, 'O')
    .replace(/[\u00f9\u00fa\u00fb\u00fc]/g, 'u')
    .replace(/[\u00d9\u00da\u00db\u00dc]/g, 'U')
    .replace(/[\u00e7]/g, 'c')
    .replace(/[\u00c7]/g, 'C')
    .replace(/[\u00f1]/g, 'n')
    .replace(/[\u00d1]/g, 'N')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u00ba]/g, 'o')
    .replace(/[\u00aa]/g, 'a')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-');
}
