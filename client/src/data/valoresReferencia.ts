/**
 * Valores de Referência para Exames Laboratoriais do Pré-Natal
 * Baseado no documento oficial fornecido pelo usuário
 */

export type TipoAlerta = 'normal' | 'atencao' | 'anormal' | 'critico';

export interface FaixaReferencia {
  min?: number;
  max?: number;
  valorEsperado?: string; // Para exames qualitativos
  trimestres: (1 | 2 | 3)[]; // Em quais trimestres essa faixa se aplica
}

export interface ConfigExame {
  nome: string;
  unidade?: string;
  faixas: FaixaReferencia[];
  validacaoEspecial?: (valor: string, trimestre: 1 | 2 | 3) => {
    tipo: TipoAlerta;
    mensagem?: string;
  };
}

/**
 * Configuração de valores de referência por exame
 */
export const VALORES_REFERENCIA: Record<string, ConfigExame> = {
  // === EXAMES DE SANGUE ===
  
  'tipagem_sanguinea': {
    nome: 'Tipagem sanguínea ABO/Rh',
    faixas: [],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      // Detectar RH negativo
      if (valorLower.includes('rh-') || valorLower.includes('rh -') || 
          valorLower.includes('negativo') || valorLower.match(/[abo]\s*-/i)) {
        return {
          tipo: 'atencao',
          mensagem: '⚠️ RH NEGATIVO - Atenção especial: realizar Coombs indireto'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'coombs_indireto': {
    nome: 'Coombs indireto',
    faixas: [{
      valorEsperado: 'negativo',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('positivo') || valorLower.includes('reagente')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 POSITIVO - Isoimunização Rh! Encaminhar para alto risco'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'hemoglobina_hematocrito': {
    nome: 'Hemoglobina/Hematócrito',
    faixas: [
      { min: 11.6, max: 13.9, trimestres: [1] },
      { min: 9.7, max: 14.8, trimestres: [2] },
      { min: 9.5, max: 15.0, trimestres: [3] }
    ],
    unidade: 'g/dL (Hb) / % (Ht)',
    validacaoEspecial: (valor: string, trimestre: 1 | 2 | 3) => {
      // Extrair valor de hemoglobina (primeiro número antes de "g/dL" ou "/")
      const match = valor.match(/([\d.,]+)\s*(g\/dl|\/)?/i);
      if (!match) return { tipo: 'normal' };
      
      const hb = parseFloat(match[1].replace(',', '.'));
      if (isNaN(hb)) return { tipo: 'normal' };
      
      // Verificar anemia
      if (trimestre === 1 && hb < 11) {
        return { tipo: 'anormal', mensagem: '⚠️ Anemia (Hb < 11 g/dL no 1º trimestre)' };
      }
      if (trimestre === 2 && hb < 10.5) {
        return { tipo: 'anormal', mensagem: '⚠️ Anemia (Hb < 10,5 g/dL no 2º trimestre)' };
      }
      if (trimestre === 3 && hb < 11) {
        return { tipo: 'anormal', mensagem: '⚠️ Anemia (Hb < 11 g/dL no 3º trimestre)' };
      }
      
      // Verificar se está dentro da faixa
      const faixa = [
        { min: 11.6, max: 13.9, tri: 1 },
        { min: 9.7, max: 14.8, tri: 2 },
        { min: 9.5, max: 15.0, tri: 3 }
      ].find(f => f.tri === trimestre);
      
      if (faixa && (hb < faixa.min || hb > faixa.max)) {
        return { tipo: 'anormal', mensagem: `⚠️ Fora da faixa (${faixa.min}-${faixa.max} g/dL)` };
      }
      
      return { tipo: 'normal' };
    }
  },

  'plaquetas': {
    nome: 'Plaquetas',
    faixas: [
      { min: 174, max: 391, trimestres: [1] },
      { min: 155, max: 409, trimestres: [2] },
      { min: 146, max: 429, trimestres: [3] }
    ],
    unidade: '× 10³/μL',
    validacaoEspecial: (valor: string, trimestre: 1 | 2 | 3) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      const faixas = [
        { min: 174, max: 391, tri: 1 },
        { min: 155, max: 409, tri: 2 },
        { min: 146, max: 429, tri: 3 }
      ];
      
      const faixa = faixas.find(f => f.tri === trimestre);
      if (!faixa) return { tipo: 'normal' };
      
      if (num < faixa.min) {
        return { tipo: 'anormal', mensagem: `⚠️ Plaquetopenia (< ${faixa.min} × 10³/μL)` };
      }
      if (num > faixa.max) {
        return { tipo: 'atencao', mensagem: `⚠️ Plaquetas elevadas (> ${faixa.max} × 10³/μL)` };
      }
      
      return { tipo: 'normal' };
    }
  },

  'glicemia_jejum': {
    nome: 'Glicemia de jejum',
    faixas: [
      { max: 92, trimestres: [1, 2, 3] }
    ],
    unidade: 'mg/dL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num >= 92) {
        return {
          tipo: 'critico',
          mensagem: '🚨 DIABETES GESTACIONAL (≥ 92 mg/dL)'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'vdrl': {
    nome: 'VDRL (sífilis)',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 SÍFILIS DETECTADA - Iniciar tratamento imediatamente'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'fta_abs_igg': {
    nome: 'FTA-ABS IgG',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 REAGENTE - Infecção pregressa ou ativa por sífilis'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'fta_abs_igm': {
    nome: 'FTA-ABS IgM',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 REAGENTE - Infecção ativa ou recente por sífilis'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'hiv': {
    nome: 'HIV (1+2)',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não') ||
          valorLower.includes('positivo') && !valorLower.includes('negativo')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 HIV REAGENTE - Encaminhar para serviço especializado'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'hepatite_b': {
    nome: 'Hepatite B (HBsAg)',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não') ||
          valorLower.includes('positivo') && !valorLower.includes('negativo')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 HEPATITE B ATIVA - Encaminhar para infectologia'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'anti_hbs': {
    nome: 'Anti-HBs',
    faixas: [{
      valorEsperado: 'reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      // Reagente = imune (normal)
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return { tipo: 'normal' };
      }
      
      // Não reagente = sem imunidade (crítico - precisa vacinar)
      if (valorLower.includes('não') && valorLower.includes('reagente') ||
          valorLower.includes('negativo')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 SEM IMUNIDADE PARA HEPATITE B - Indicar vacinação'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'hepatite_c': {
    nome: 'Hepatite C (Anti-HCV)',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não') ||
          valorLower.includes('positivo') && !valorLower.includes('negativo')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 HEPATITE C DETECTADA - Encaminhar para infectologia'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'toxoplasmose_igg': {
    nome: 'Toxoplasmose IgG',
    faixas: [],
    validacaoEspecial: (valor: string) => {
      // IgG pode ser reagente ou não reagente (ambos são normais)
      // Apenas alertar mudança de status seria ideal, mas isso requer histórico
      return { tipo: 'normal' };
    }
  },

  'toxoplasmose_igm': {
    nome: 'Toxoplasmose IgM',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 INFECÇÃO AGUDA - Toxoplasmose ativa! Encaminhar urgente'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'rubeola_igg': {
    nome: 'Rubéola IgG',
    faixas: [],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('não reagente') || valorLower.includes('negativo')) {
        return {
          tipo: 'atencao',
          mensagem: '⚠️ NÃO IMUNE - Gestante suscetível à rubéola'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'rubeola_igm': {
    nome: 'Rubéola IgM',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 INFECÇÃO AGUDA - Rubéola ativa! Risco fetal alto'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'cmv_igg': {
    nome: 'Citomegalovírus (CMV) IgG',
    faixas: [],
    validacaoEspecial: () => {
      // IgG pode ser reagente ou não (ambos normais)
      return { tipo: 'normal' };
    }
  },

  'cmv_igm': {
    nome: 'Citomegalovírus (CMV) IgM',
    faixas: [{
      valorEsperado: 'não reagente',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('reagente') && !valorLower.includes('não')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 INFECÇÃO RECENTE/ATIVA - CMV! Avaliar risco fetal'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'tsh': {
    nome: 'TSH',
    faixas: [
      { min: 0.1, max: 2.5, trimestres: [1] },
      { min: 0.2, max: 3.0, trimestres: [2] },
      { min: 0.3, max: 3.0, trimestres: [3] }
    ],
    unidade: 'mIU/L',
    validacaoEspecial: (valor: string, trimestre: 1 | 2 | 3) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      const faixas = [
        { min: 0.1, max: 2.5, tri: 1 },
        { min: 0.2, max: 3.0, tri: 2 },
        { min: 0.3, max: 3.0, tri: 3 }
      ];
      
      const faixa = faixas.find(f => f.tri === trimestre);
      if (!faixa) return { tipo: 'normal' };
      
      if (num < faixa.min) {
        return { tipo: 'anormal', mensagem: `⚠️ TSH baixo (< ${faixa.min}) - Hipertireoidismo?` };
      }
      if (num > faixa.max) {
        return { tipo: 'anormal', mensagem: `⚠️ TSH alto (> ${faixa.max}) - Hipotireoidismo?` };
      }
      
      return { tipo: 'normal' };
    }
  },

  't4_livre': {
    nome: 'T4 Livre',
    faixas: [
      { min: 0.52, max: 1.10, trimestres: [1] },
      { min: 0.45, max: 0.99, trimestres: [2] },
      { min: 0.48, max: 0.95, trimestres: [3] }
    ],
    unidade: 'ng/dL',
    validacaoEspecial: (valor: string, trimestre: 1 | 2 | 3) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      const faixas = [
        { min: 0.52, max: 1.10, tri: 1 },
        { min: 0.45, max: 0.99, tri: 2 },
        { min: 0.48, max: 0.95, tri: 3 }
      ];
      
      const faixa = faixas.find(f => f.tri === trimestre);
      if (!faixa) return { tipo: 'normal' };
      
      if (num < faixa.min || num > faixa.max) {
        return {
          tipo: 'anormal',
          mensagem: `⚠️ Fora da faixa (${faixa.min}-${faixa.max} ng/dL)`
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'ferritina': {
    nome: 'Ferritina',
    faixas: [
      { min: 6, max: 130, trimestres: [1] },
      { min: 2, max: 230, trimestres: [2] },
      { min: 0, max: 166, trimestres: [3] }
    ],
    unidade: 'ng/mL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num < 30) {
        return {
          tipo: 'anormal',
          mensagem: '⚠️ DEFICIÊNCIA DE FERRO (< 30 ng/mL) - Suplementar'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'vitamina_d': {
    nome: 'Vitamina D (25-OH)',
    faixas: [
      { min: 30, max: 60, trimestres: [1, 2, 3] }
    ],
    unidade: 'ng/mL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num < 30) {
        return {
          tipo: 'anormal',
          mensagem: '⚠️ INSUFICIÊNCIA (< 30 ng/mL) - Suplementar vitamina D'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'vitamina_b12': {
    nome: 'Vitamina B12',
    faixas: [
      { min: 118, max: 438, trimestres: [1] },
      { min: 130, max: 656, trimestres: [2] },
      { min: 99, max: 526, trimestres: [3] }
    ],
    unidade: 'pg/mL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num < 150) {
        return {
          tipo: 'anormal',
          mensagem: '⚠️ DEFICIÊNCIA (< 150 pg/mL) - Suplementar B12'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'ttgo_jejum': {
    nome: 'TTGO 75g - Jejum',
    faixas: [
      { max: 92, trimestres: [2] }
    ],
    unidade: 'mg/dL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num >= 92) {
        return {
          tipo: 'critico',
          mensagem: '🚨 DIABETES GESTACIONAL (≥ 92 mg/dL)'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'ttgo_1h': {
    nome: 'TTGO 75g - 1 hora',
    faixas: [
      { max: 180, trimestres: [2] }
    ],
    unidade: 'mg/dL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num >= 180) {
        return {
          tipo: 'critico',
          mensagem: '🚨 DIABETES GESTACIONAL (≥ 180 mg/dL)'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'ttgo_2h': {
    nome: 'TTGO 75g - 2 horas',
    faixas: [
      { max: 153, trimestres: [2] }
    ],
    unidade: 'mg/dL',
    validacaoEspecial: (valor: string) => {
      const num = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(num)) return { tipo: 'normal' };
      
      if (num >= 153) {
        return {
          tipo: 'critico',
          mensagem: '🚨 DIABETES GESTACIONAL (≥ 153 mg/dL)'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'urocultura': {
    nome: 'Urocultura',
    faixas: [{
      valorEsperado: 'negativa',
      trimestres: [1, 2, 3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('positiv') || valorLower.includes('crescimento') ||
          valorLower.match(/\d+.*ufc/i)) {
        return {
          tipo: 'critico',
          mensagem: '🚨 BACTERIÚRIA - Tratar infecção urinária'
        };
      }
      
      return { tipo: 'normal' };
    }
  },

  'egb_swab': {
    nome: 'Swab Vaginal/Retal para EGB',
    faixas: [{
      valorEsperado: 'negativo',
      trimestres: [3]
    }],
    validacaoEspecial: (valor: string) => {
      const valorLower = valor.toLowerCase().trim();
      
      if (valorLower.includes('positiv') || valorLower.includes('detectado')) {
        return {
          tipo: 'critico',
          mensagem: '🚨 EGB POSITIVO - Antibioticoprofilaxia intraparto obrigatória'
        };
      }
      
      return { tipo: 'normal' };
    }
  }
};

/**
 * Valida um resultado de exame e retorna o tipo de alerta
 */
export function validarResultado(
  nomeExame: string,
  valor: string,
  trimestre: 1 | 2 | 3
): { tipo: TipoAlerta; mensagem?: string } {
  if (!valor || valor.trim() === '' || valor === '-') {
    return { tipo: 'normal' };
  }

  const config = VALORES_REFERENCIA[nomeExame];
  if (!config) {
    return { tipo: 'normal' };
  }

  if (config.validacaoEspecial) {
    return config.validacaoEspecial(valor, trimestre);
  }

  return { tipo: 'normal' };
}


/**
 * Lista de exames que aceitam apenas valores "Reagente" ou "Não reagente"
 */
export const EXAMES_SOROLOGICOS = [
  'vdrl',
  'fta_abs_igg',
  'fta_abs_igm',
  'hiv',
  'hepatite_b',
  'anti_hbs',
  'hepatite_c',
  'toxoplasmose_igg',
  'toxoplasmose_igm',
  'rubeola_igg',
  'rubeola_igm',
  'cmv_igg',
  'cmv_igm',
  'coombs_indireto'
];

/**
 * Verifica se um exame é sorológico (aceita apenas Reagente/Não reagente)
 */
export function isExameSorologico(nomeExame: string): boolean {
  // Importar mapeamento de exames
  const MAPEAMENTO: Record<string, string> = {
    "Tipagem sanguínea ABO/Rh": "tipagem_sanguinea",
    "Coombs indireto": "coombs_indireto",
    "VDRL": "vdrl",
    "FTA-ABS IgG": "fta_abs_igg",
    "FTA-ABS IgM": "fta_abs_igm",
    "HIV": "hiv",
    "Hepatite B (HBsAg)": "hepatite_b",
    "Anti-HBs": "anti_hbs",
    "Hepatite C (Anti-HCV)": "hepatite_c",
    "Toxoplasmose IgG": "toxoplasmose_igg",
    "Toxoplasmose IgM": "toxoplasmose_igm",
    "Rubéola IgG": "rubeola_igg",
    "Rubéola IgM": "rubeola_igm",
    "Citomegalovírus IgG": "cmv_igg",
    "Citomegalovírus IgM": "cmv_igm"
  };
  
  const idExame = MAPEAMENTO[nomeExame];
  return idExame ? EXAMES_SOROLOGICOS.includes(idExame) : false;
}
