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
