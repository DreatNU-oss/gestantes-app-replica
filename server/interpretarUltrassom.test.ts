import { describe, it, expect } from 'vitest';
import { interpretarLaudoUltrassom } from './interpretarUltrassom';

// Helper para simular upload de texto como data URL
function textToDataUrl(text: string): string {
  return `data:text/plain;base64,${Buffer.from(text).toString('base64')}`;
}

describe('Interpretação de Ultrassons com IA', () => {
  it('deve interpretar laudo de 1º ultrassom corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA OBSTÉTRICA - 1º TRIMESTRE
      
      Paciente: Maria Silva
      Data do exame: 15/05/2025
      
      DADOS DO EXAME:
      - Idade gestacional: 8 semanas e 3 dias
      - CCN (Comprimento Cabeça-Nádegas): 18mm
      - BCF (Batimento Cardíaco Fetal): 165 bpm
      - Saco vitelino: Presente
      - Identificação do corpo lúteo: Sim
      - Presença de hematoma/coleções: Ausente
      
      CONCLUSÃO:
      Gestação tópica única viável de aproximadamente 8 semanas e 3 dias.
      Data provável do parto: 15/12/2025
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'primeiro_ultrassom',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    // A IA deve extrair pelo menos alguns campos
    expect(Object.keys(resultado).length).toBeGreaterThan(0);
  }, 30000); // 30s timeout para chamada de IA

  it('deve interpretar laudo de morfológico 1º trimestre corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA MORFOLÓGICA - 1º TRIMESTRE
      
      Paciente: Ana Costa
      Data: 20/06/2025
      
      BIOMETRIA:
      - Idade gestacional: 13 semanas e 2 dias
      - Translucência nucal: 1.5mm
      - Osso nasal: Normal
      - Ducto venoso: Normal
      - IPs (Índices de Pulsatilidade): Normais
      - Regurgitação tricúspide: Não
      - Comprimento colo uterino: 38mm
      
      MORFOLOGIA FETAL:
      Crânio, coluna, membros, face e tórax sem alterações evidentes.
      
      RISCO PARA CROMOSSOMOPATIAS: Baixo risco
      
      CONCLUSÃO:
      Exame morfológico do primeiro trimestre sem alterações.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'morfologico_1tri',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    expect(Object.keys(resultado).length).toBeGreaterThan(0);
  }, 30000);

  it('deve interpretar laudo de ultrassom obstétrico corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA OBSTÉTRICA
      
      Paciente: Carla Souza
      Data: 10/08/2025
      
      DADOS DO EXAME:
      - Idade gestacional: 28 semanas e 5 dias
      - Peso fetal estimado: 1250g
      - Placenta: Anterior, grau I
      - Grau de maturação placentária: I
      - Líquido amniótico: Normal (ILA 12cm)
      - Circular de cordão: Não identificada
      - Comprimento colo uterino: 35mm
      
      CONCLUSÃO:
      Gestação de 28 semanas e 5 dias, feto com biometria compatível.
      Placenta anterior grau I, líquido amniótico normal.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'ultrassom_obstetrico',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    expect(Object.keys(resultado).length).toBeGreaterThan(0);
  }, 30000);

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
      - Comprimento do colo uterino: 40mm
      
      MORFOLOGIA FETAL:
      - Crânio: Normal
      - Face: Perfil normal, lábios íntegros
      - Coluna: Sem alterações
      - Tórax: Pulmões simétricos, coração com 4 câmaras visíveis
      - Abdome: Estômago, rins e bexiga normais
      - Membros: Superiores e inferiores presentes e simétricos
      
      DOPPLERFLUXOMETRIA:
      Artérias uterinas, umbilical e cerebral média com índices normais.
      
      SEXO FETAL: Feminino
      
      CONCLUSÃO:
      Exame morfológico do segundo trimestre sem alterações estruturais.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'morfologico_2tri',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    expect(Object.keys(resultado).length).toBeGreaterThan(0);
  }, 30000);

  it('deve interpretar laudo de ecocardiograma fetal corretamente', async () => {
    const laudoTexto = `
      ECOCARDIOGRAMA FETAL
      
      Paciente: Daniela Oliveira
      Data: 05/09/2025
      
      INDICAÇÃO: Rastreamento de cardiopatia congênita
      
      EXAME:
      Coração com posição normal (levocardia).
      Quatro câmaras cardíacas bem definidas e proporcionais.
      Septo interventricular íntegro.
      Valvas atrioventriculares (mitral e tricúspide) com morfologia e função normais.
      Grandes artérias (aorta e pulmonar) emergindo dos ventrículos correspondentes.
      Arco aórtico à esquerda, sem sinais de coarctação.
      Fluxo através do forame oval e canal arterial dentro da normalidade.
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
    expect(typeof resultado).toBe('object');
    expect(Object.keys(resultado).length).toBeGreaterThan(0);
  }, 30000);

  it('deve interpretar laudo de ultrassom de seguimento corretamente', async () => {
    const laudoTexto = `
      ULTRASSONOGRAFIA OBSTÉTRICA DE SEGUIMENTO
      
      Paciente: Fernanda Santos
      Data: 15/10/2025
      
      DADOS DO EXAME:
      - Idade gestacional: 35 semanas e 2 dias
      - Peso fetal estimado: 2600g (percentil 55)
      - Líquido amniótico: Normal (ILA 11cm)
      - Placenta: Anterior, grau II
      - Grau de maturação: II
      - Comprimento colo uterino: 32mm
      - Movimentos fetais: Presentes e ativos
      - Apresentação fetal: Cefálica
      
      DOPPLERFLUXOMETRIA:
      - Artéria umbilical: IP 0.85 (normal)
      - Artéria cerebral média: IP 1.65 (normal)
      - Relação cérebro-placentária: 1.94 (normal)
      
      CONCLUSÃO:
      Feto em apresentação cefálica, crescimento adequado para idade gestacional.
      Vitalidade fetal preservada. Doppler dentro dos padrões de normalidade.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'ultrassom_seguimento',
      'text/plain'
    );

    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
    expect(Object.keys(resultado).length).toBeGreaterThan(0);
  }, 30000);

  it('deve lidar com laudos incompletos ou mal formatados', async () => {
    const laudoTexto = `
      Ultrassom realizado em 10/10/2025
      Gestante: Teste
      Sem mais informações disponíveis.
    `;

    const resultado = await interpretarLaudoUltrassom(
      textToDataUrl(laudoTexto),
      'primeiro_ultrassom',
      'text/plain'
    );

    // Deve retornar um objeto, mesmo que com poucos ou nenhum campo
    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe('object');
  }, 30000);
});
