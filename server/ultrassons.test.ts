import { describe, it, expect, beforeEach } from 'vitest';
import { salvarUltrassom, buscarUltrassons } from './ultrassons';

describe('Ultrassons', () => {
  const gestanteId = 1;

  beforeEach(async () => {
    // Limpar ultrassons de teste
    const db = await import('./db').then(m => m.getDb());
    if (!db) throw new Error('Database not available');
    const { ultrassons } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    await db.delete(ultrassons).where(eq(ultrassons.gestanteId, gestanteId));
  });

  it('deve salvar 1º ultrassom com sucesso', async () => {
    const resultado = await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'primeiro_ultrassom',
      dataExame: '2025-01-15',
      idadeGestacional: '7s 2d',
      dados: {
        ccn: '12mm',
        bcf: '150 bpm',
        sacoVitelino: 'Presente',
        hematoma: 'Não',
        corpoLuteo: 'Presente',
        dppCalculada: '2025-08-20'
      }
    });

    expect(resultado.success).toBe(true);
    expect(resultado.ultrassom).toBeDefined();
    expect(resultado.ultrassom?.tipoUltrassom).toBe('primeiro_ultrassom');
  });

  it('deve salvar morfológico 1º trimestre com sucesso', async () => {
    const resultado = await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'morfologico_1tri',
      dataExame: '2025-02-10',
      idadeGestacional: '12s 3d',
      dados: {
        tn: '1.2mm',
        dv: 'Normal',
        valvaTricuspide: 'Normal',
        dopplerUterinas: 'IPs normais',
        colo: 'Sim',
        coloMedida: '35mm',
        riscoTrissomias: 'Baixo risco'
      }
    });

    expect(resultado.success).toBe(true);
    expect(resultado.ultrassom?.tipoUltrassom).toBe('morfologico_1tri');
  });

  it('deve buscar ultrassons por gestante', async () => {
    // Salvar 2 ultrassons
    await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'primeiro_ultrassom',
      dataExame: '2025-01-15',
      idadeGestacional: '7s 2d',
      dados: { ccn: '12mm' }
    });

    await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'morfologico_1tri',
      dataExame: '2025-02-10',
      idadeGestacional: '12s 3d',
      dados: { tn: '1.2mm' }
    });

    const ultrassons = await buscarUltrassons(gestanteId);
    expect(ultrassons).toHaveLength(2);
    expect(ultrassons[0].tipoUltrassom).toBe('primeiro_ultrassom');
    expect(ultrassons[1].tipoUltrassom).toBe('morfologico_1tri');
  });

  it('deve salvar morfológico 2º trimestre com biometria completa', async () => {
    const resultado = await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'morfologico_2tri',
      dataExame: '2025-03-15',
      idadeGestacional: '22s 4d',
      dados: {
        biometria: 'DBP: 55mm, CC: 200mm, CA: 180mm, CF: 38mm',
        pesoFetal: '450g',
        placenta: 'Anterior',
        grauPlacentario: 'I',
        colo: 'Sim',
        coloMedida: '35mm',
        ila: '12cm',
        anatomia: 'Normal - todos os órgãos visualizados',
        dopplers: 'AU, ACM, DV normais',
        sexo: 'Feminino',
        observacoes: 'Exame sem alterações'
      }
    });

    expect(resultado.success).toBe(true);
    expect(resultado.ultrassom?.tipoUltrassom).toBe('morfologico_2tri');
    expect(resultado.ultrassom?.dados).toHaveProperty('biometria');
    expect(resultado.ultrassom?.dados).toHaveProperty('sexo');
  });

  it('deve salvar ecocardiograma fetal', async () => {
    const resultado = await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'ecocardiograma_fetal',
      dataExame: '2025-04-01',
      idadeGestacional: '24s 0d',
      dados: {
        conclusao: 'Coração fetal sem alterações estruturais. Função cardíaca preservada.'
      }
    });

    expect(resultado.success).toBe(true);
    expect(resultado.ultrassom?.tipoUltrassom).toBe('ecocardiograma_fetal');
    expect(resultado.ultrassom?.dados).toHaveProperty('conclusao');
  });

  it('deve salvar ultrassom de seguimento com dopplers', async () => {
    const resultado = await salvarUltrassom({
      gestanteId,
      tipoUltrassom: 'ultrassom_seguimento',
      dataExame: '2025-05-20',
      idadeGestacional: '32s 1d',
      dados: {
        pesoFetal: '2100g',
        percentil: 'P50',
        ila: '10cm',
        placenta: 'Anterior',
        grauPlacentario: 'II',
        colo: 'Sim',
        coloMedida: '30mm',
        movimentos: 'Presentes',
        apresentacao: 'Cefálica',
        dopplers: 'AU: IP 0.8, ACM: IP 1.5, DV: onda A positiva',
        observacoes: 'Crescimento adequado'
      }
    });

    expect(resultado.success).toBe(true);
    expect(resultado.ultrassom?.tipoUltrassom).toBe('ultrassom_seguimento');
    expect(resultado.ultrassom?.dados).toHaveProperty('dopplers');
  });

  it('deve retornar array vazio para gestante sem ultrassons', async () => {
    const ultrassons = await buscarUltrassons(9999);
    expect(ultrassons).toHaveLength(0);
  });
});
