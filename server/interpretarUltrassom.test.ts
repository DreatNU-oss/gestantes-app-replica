import { describe, it, expect } from 'vitest';
import { interpretarLaudoUltrassom } from './interpretarUltrassom';

// Helper para simular upload de texto como data URL
function textToDataUrl(text: string): string {
  return `data:text/plain;base64,${Buffer.from(text).toString('base64')}`;
}

describe('Interpretação de Ultrassons com IA', () => {
  it('deve interpretar laudo de 1º ultrassom extraindo TODOS os campos', async () => {
    const laudoTexto = `
      NOME: Helena Resende Andrade
      DATA: 07/10/2025

      Paciente de 23 anos, gestante de primeiro trimestre.
      DUM: 06/08/2025 --- TA: 8 semanas e 6 dias --- G1P0A0.
      USG (19/09/2025): 5 semanas e 6 dias.

      ULTRASSOM OBSTÉTRICO

      TÉCNICA:
      Exame realizado em aparelho dinâmico com sonda endocavitária multifrequencial.

      RESULTADO:
      Útero globoso, aumentado de volume, contendo saco gestacional normoimplantado, de contornos
      regulares, com diâmetro médio de 2,3 cm, apresentando em seu interior embrião único com medida
      crânio-nádegas de 2,1 cm, correspondendo a 8 semanas e 5 dias de gestação.

      Embrião dotado de batimentos cardíacos rítmicos e visíveis de frequência de 179 batimentos por
      minuto e movimentação ativa.

      Vesícula vitelínica íntegra e de dimensões, com diâmetro de 3,6 mm.

      Imagem sugestiva de Corpo lúteo à esquerda.

      Ovário direito sem particularidades.

      Colo uterino medindo 3,9 cm, com orifício interno fechado.

      Reação trofoblástica de aspecto habitual.

      HIPÓTESE DIAGNÓSTICA (Compatível com):
      1. Gestação tópica com embrião único de 8 semanas e 5 dias (+/- 0,5 semana de
         erro), segundo o CCN.
         DPP: 14/05/2026.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'primeiro_ultrassom',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    
    // Verificar campos críticos que DEVEM ser extraídos
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('07/10/2025');
    
    expect(resultado.idadeGestacional).toBeDefined();
    expect(resultado.idadeGestacional).toMatch(/8\s*semanas?\s*(e\s*)?5\s*dias?/i);
    
    expect(resultado.ccn).toBeDefined();
    expect(resultado.ccn).toMatch(/2[,.]1\s*cm|21\s*mm/i);
    
    expect(resultado.bcf).toBeDefined();
    expect(resultado.bcf).toMatch(/179/);
    
    expect(resultado.sacoVitelino).toBeDefined();
    
    expect(resultado.corpoLuteo).toBeDefined();
    expect(resultado.corpoLuteo?.toLowerCase()).toMatch(/esquerda|esquerdo/);
    
    // Colo Uterino - novo campo
    expect(resultado.coloUterino).toBeDefined();
    expect(resultado.coloUterino).toMatch(/3[,.]9\s*cm/i);
    
    // DPP - campo crítico que estava faltando
    expect(resultado.dpp).toBeDefined();
    expect(resultado.dpp).toContain('14/05/2026');
    
    // Hematoma - deve ser "Não" quando não mencionado
    expect(resultado.hematoma).toBeDefined();
    expect(resultado.hematoma?.toLowerCase()).toMatch(/não|ausente|negativo/i);
  }, 60000);

  it('deve interpretar laudo de morfológico 1º trimestre corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA MORFOLÓGICA - 1º TRIMESTRE
      
      Paciente: Ana Costa
      Data: 20/06/2025
      
      BIOMETRIA:
      - Idade gestacional: 13 semanas e 2 dias
      - Translucência nucal: 1.5mm
      - Osso nasal: Normal
      - Ducto venoso: onda A positiva
      - Doppler das artérias uterinas: IP D: 1.45, IP E: 1.32
      - Regurgitação tricúspide: Não
      - Comprimento colo uterino: 38mm
      
      RISCO PARA CROMOSSOMOPATIAS: Baixo risco (T21: 1:5000)
      
      CONCLUSÃO:
      Exame morfológico do primeiro trimestre sem alterações.
      DPP: 25/12/2025
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'morfologico_1tri',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('20/06/2025');
    expect(resultado.tn).toBeDefined();
    expect(resultado.tn).toMatch(/1[,.]5/);
    expect(resultado.dv).toBeDefined();
    expect(resultado.dopplerUterinas).toBeDefined();
    expect(resultado.colo).toBeDefined();
    expect(resultado.colo).toMatch(/38/);
    expect(resultado.dpp).toBeDefined();
    expect(resultado.dpp).toContain('25/12/2025');
  }, 60000);

  it('deve interpretar laudo de ultrassom obstétrico corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA OBSTÉTRICA
      
      Paciente: Carla Souza
      Data: 10/08/2025
      
      DADOS DO EXAME:
      - Idade gestacional: 28 semanas e 5 dias
      - Peso fetal estimado: 1250g
      - Placenta: Anterior, grau I, longe do orifício interno
      - Líquido amniótico: Normal (ILA 12cm)
      - Colo uterino por via transvaginal: 35mm
      
      CONCLUSÃO:
      Gestação de 28 semanas e 5 dias, feto com biometria compatível.
      DPP: 20/11/2025
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'ultrassom_obstetrico',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('10/08/2025');
    expect(resultado.pesoFetal).toBeDefined();
    expect(resultado.pesoFetal).toMatch(/1250/);
    expect(resultado.placentaLocalizacao).toBeDefined();
    expect(resultado.dpp).toBeDefined();
    expect(resultado.dpp).toContain('20/11/2025');
  }, 60000);

  it('deve interpretar laudo de morfológico 2º trimestre corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA MORFOLÓGICA - 2º TRIMESTRE
      
      Paciente: Beatriz Lima
      Data: 25/07/2025
      
      BIOMETRIA FETAL:
      - Idade gestacional: 22 semanas e 3 dias
      - DBP: 54mm, CC: 200mm, CA: 180mm, CF: 38mm
      - Peso fetal estimado: 480g
      
      PLACENTA E ANEXOS:
      - Placenta: Posterior, grau 0
      - Líquido amniótico: Normal (ILA 14cm)
      
      DOPPLERFLUXOMETRIA:
      Artérias uterinas, umbilical e cerebral média com índices normais.
      
      SEXO FETAL: Feminino
      
      CONCLUSÃO:
      Exame morfológico do segundo trimestre sem alterações estruturais.
      DPP: 15/11/2025
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'morfologico_2tri',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('25/07/2025');
    expect(resultado.biometria).toBeDefined();
    expect(resultado.sexoFetal).toBeDefined();
    expect(resultado.sexoFetal?.toLowerCase()).toContain('feminino');
    expect(resultado.dpp).toBeDefined();
    expect(resultado.dpp).toContain('15/11/2025');
  }, 60000);

  it('deve interpretar laudo de ecocardiograma fetal corretamente', async () => {
    const laudoTexto = `
      ECOCARDIOGRAMA FETAL
      
      Paciente: Daniela Oliveira
      Data: 05/09/2025
      Idade gestacional: 26 semanas e 1 dia
      
      EXAME:
      Coração com posição normal (levocardia).
      Quatro câmaras cardíacas bem definidas e proporcionais.
      Septo interventricular íntegro.
      Ritmo cardíaco regular, frequência de 145 bpm.
      
      CONCLUSÃO:
      Ecocardiograma fetal sem alterações estruturais ou funcionais.
      Anatomia cardíaca normal para a idade gestacional.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'ecocardiograma',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('05/09/2025');
    expect(resultado.conclusao).toBeDefined();
  }, 60000);

  it('deve interpretar laudo de ultrassom de seguimento corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA OBSTÉTRICA DE SEGUIMENTO
      
      Paciente: Fernanda Santos
      Data: 15/10/2025
      
      DADOS DO EXAME:
      - Idade gestacional: 35 semanas e 2 dias
      - Peso fetal estimado: 2600g (percentil 55)
      - Líquido amniótico: Normal (ILA 11cm)
      - Placenta: Anterior, grau II, longe do OI
      - Movimentos fetais: Presentes e ativos
      - Apresentação fetal: Cefálica
      
      DOPPLERFLUXOMETRIA:
      - Artéria umbilical: IP 0.85 (normal)
      - Artéria cerebral média: IP 1.65 (normal)
      
      CONCLUSÃO:
      Feto em apresentação cefálica, crescimento adequado.
      DPP: 20/11/2025
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'ultrassom_seguimento',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('15/10/2025');
    expect(resultado.pesoFetal).toBeDefined();
    expect(resultado.pesoFetal).toMatch(/2600/);
    expect(resultado.apresentacaoFetal).toBeDefined();
    expect(resultado.dpp).toBeDefined();
    expect(resultado.dpp).toContain('20/11/2025');
  }, 60000);

  it('deve lidar com laudos incompletos extraindo o que for possível', async () => {
    const laudoTexto = `
      Ultrassom realizado em 10/10/2025
      Gestante: Teste
      Idade gestacional: 10 semanas
      Sem mais informações disponíveis.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'primeiro_ultrassom',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    // Deve pelo menos extrair a data
    expect(resultado.dataExame).toBeDefined();
    expect(resultado.dataExame).toContain('10/10/2025');
  }, 60000);
});


/**
 * Testes para a lógica de normalização de valores numéricos brasileiros
 * usada no pós-processamento do interpretarUltrassom.ts e nos parsers do frontend
 */

// Reproduzir a lógica de normalização do backend (interpretarUltrassom.ts)
function normalizarValorNumericoBR(val: string, campo: string): string {
  const camposMedidaMM = ['circunferenciaAbdominal', 'ccn', 'coloUterinoMedida', 'coloUterino'];
  const camposPeso = ['pesoFetal'];

  const matchNumUnit = val.match(/^([\d.,\s]+)\s*(mm|cm|g|kg|bpm|%)?(.*)$/i);
  if (!matchNumUnit) return val;

  let numStr = matchNumUnit[1].trim();
  const unit = matchNumUnit[2] || '';
  const rest = matchNumUnit[3] || '';

  if (numStr.includes(',') && numStr.includes('.')) {
    numStr = numStr.replace(/\./g, '').replace(',', '.');
  } else if (numStr.includes(',')) {
    numStr = numStr.replace(',', '.');
  } else if (numStr.includes('.')) {
    const parts = numStr.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      if (camposPeso.includes(campo)) {
        numStr = numStr.replace('.', '');
      } else if (camposMedidaMM.includes(campo)) {
        const testVal = parseFloat(numStr.replace('.', ''));
        if (testVal > 500) {
          numStr = numStr.replace('.', '');
        }
      }
    }
  }

  const cleanNum = parseFloat(numStr);
  if (isNaN(cleanNum)) return val;
  return unit ? `${cleanNum} ${unit}${rest}` : (rest ? `${cleanNum}${rest}` : `${cleanNum}`);
}

// Reproduzir a lógica do parsePeso do frontend
function parsePeso(v: string | undefined | null): number {
  if (!v) return 0;
  let s = String(v);
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  } else {
    const m = s.match(/(\d+)\.(\d{3})(?!\d)/);
    if (m) s = s.replace('.', '');
  }
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

// Reproduzir a lógica do normalizarNumBR do frontend (parseCA)
function normalizarNumBR(s: string): number {
  let clean = s;
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  return parseFloat(clean.replace(/[^0-9.]/g, ''));
}

describe('Normalização de valores numéricos brasileiros (Backend)', () => {
  describe('Peso Fetal - ponto de milhar', () => {
    it('deve converter "1.531 g" para "1531 g" (ponto de milhar)', () => {
      expect(normalizarValorNumericoBR('1.531 g', 'pesoFetal')).toBe('1531 g');
    });

    it('deve converter "1.890 g" para "1890 g"', () => {
      expect(normalizarValorNumericoBR('1.890 g', 'pesoFetal')).toBe('1890 g');
    });

    it('deve converter "2.537 g" para "2537 g"', () => {
      expect(normalizarValorNumericoBR('2.537 g', 'pesoFetal')).toBe('2537 g');
    });

    it('deve converter "3.250 g" para "3250 g"', () => {
      expect(normalizarValorNumericoBR('3.250 g', 'pesoFetal')).toBe('3250 g');
    });

    it('deve manter "231 g" sem alteração (sem ponto)', () => {
      expect(normalizarValorNumericoBR('231 g', 'pesoFetal')).toBe('231 g');
    });

    it('deve manter "563 g" sem alteração', () => {
      expect(normalizarValorNumericoBR('563 g', 'pesoFetal')).toBe('563 g');
    });

    it('deve manter "907 g" sem alteração', () => {
      expect(normalizarValorNumericoBR('907 g', 'pesoFetal')).toBe('907 g');
    });

    it('deve converter "1.531,5 g" (milhar + decimal) para "1531.5 g"', () => {
      expect(normalizarValorNumericoBR('1.531,5 g', 'pesoFetal')).toBe('1531.5 g');
    });
  });

  describe('Circunferência Abdominal - vírgula decimal', () => {
    it('deve converter "268,8 mm" para "268.8 mm"', () => {
      expect(normalizarValorNumericoBR('268,8 mm', 'circunferenciaAbdominal')).toBe('268.8 mm');
    });

    it('deve converter "289,4 mm" para "289.4 mm"', () => {
      expect(normalizarValorNumericoBR('289,4 mm', 'circunferenciaAbdominal')).toBe('289.4 mm');
    });

    it('deve converter "319,4 mm" para "319.4 mm"', () => {
      expect(normalizarValorNumericoBR('319,4 mm', 'circunferenciaAbdominal')).toBe('319.4 mm');
    });

    it('deve converter "174,0 mm" para "174 mm"', () => {
      expect(normalizarValorNumericoBR('174,0 mm', 'circunferenciaAbdominal')).toBe('174 mm');
    });

    it('deve manter "268.8 mm" sem alteração (já com ponto decimal)', () => {
      expect(normalizarValorNumericoBR('268.8 mm', 'circunferenciaAbdominal')).toBe('268.8 mm');
    });

    it('deve manter "280 mm" sem alteração (inteiro)', () => {
      expect(normalizarValorNumericoBR('280 mm', 'circunferenciaAbdominal')).toBe('280 mm');
    });
  });
});

describe('parsePeso (Frontend)', () => {
  it('deve parsear "1.531 g" como 1531', () => {
    expect(parsePeso('1.531 g')).toBe(1531);
  });

  it('deve parsear "1.890 g" como 1890', () => {
    expect(parsePeso('1.890 g')).toBe(1890);
  });

  it('deve parsear "2.537 g" como 2537', () => {
    expect(parsePeso('2.537 g')).toBe(2537);
  });

  it('deve parsear "231 g" como 231', () => {
    expect(parsePeso('231 g')).toBe(231);
  });

  it('deve parsear "907 g" como 907', () => {
    expect(parsePeso('907 g')).toBe(907);
  });

  it('deve parsear "1531 g" como 1531 (sem ponto)', () => {
    expect(parsePeso('1531 g')).toBe(1531);
  });

  it('deve parsear "1.531,5 g" como 1531.5', () => {
    expect(parsePeso('1.531,5 g')).toBe(1531.5);
  });

  it('deve retornar 0 para null', () => {
    expect(parsePeso(null)).toBe(0);
  });

  it('deve retornar 0 para undefined', () => {
    expect(parsePeso(undefined)).toBe(0);
  });
});

describe('normalizarNumBR / parseCA (Frontend)', () => {
  it('deve parsear "268,8 mm" como 268.8', () => {
    expect(normalizarNumBR('268,8 mm')).toBe(268.8);
  });

  it('deve parsear "289,4 mm" como 289.4', () => {
    expect(normalizarNumBR('289,4 mm')).toBe(289.4);
  });

  it('deve parsear "319,4 mm" como 319.4', () => {
    expect(normalizarNumBR('319,4 mm')).toBe(319.4);
  });

  it('deve parsear "174,0 mm" como 174', () => {
    expect(normalizarNumBR('174,0 mm')).toBe(174);
  });

  it('deve parsear "268.8 mm" como 268.8 (já com ponto)', () => {
    expect(normalizarNumBR('268.8 mm')).toBe(268.8);
  });

  it('deve parsear "280 mm" como 280', () => {
    expect(normalizarNumBR('280 mm')).toBe(280);
  });

  it('deve parsear "182,5" como 182.5 (sem unidade)', () => {
    expect(normalizarNumBR('182,5')).toBe(182.5);
  });

  it('deve parsear "1.531,5 g" como 1531.5 (milhar + decimal)', () => {
    expect(normalizarNumBR('1.531,5 g')).toBe(1531.5);
  });
});
