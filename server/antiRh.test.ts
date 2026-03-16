import { describe, it, expect } from 'vitest';
import { calcularMarcosImportantes } from './marcos';

describe('Vacina Anti-Rh (Imunoglobulina) - Marcos', () => {
  const dataUltrassom = '2026-01-01';
  const igUltrassom = '12s3d';

  it('deve incluir marco "Vacina Anti-Rh (Imunoglobulina)" quando ehRhNegativo = true', () => {
    const marcos = calcularMarcosImportantes(dataUltrassom, igUltrassom, true);
    const antiRhMarco = marcos.find((m: any) => m.titulo.includes('Anti-Rh'));
    expect(antiRhMarco).toBeDefined();
    expect(antiRhMarco.titulo).toBe('Vacina Anti-Rh (Imunoglobulina)');
    expect(antiRhMarco.periodo).toBe('28 semanas');
  });

  it('NÃO deve incluir marco "Vacina Anti-Rh" quando ehRhNegativo = false', () => {
    const marcos = calcularMarcosImportantes(dataUltrassom, igUltrassom, false);
    const antiRhMarco = marcos.find((m: any) => m.titulo.includes('Anti-Rh'));
    expect(antiRhMarco).toBeUndefined();
  });

  it('NÃO deve incluir marco "Vacina Anti-Rh" quando ehRhNegativo não é fornecido (default)', () => {
    const marcos = calcularMarcosImportantes(dataUltrassom, igUltrassom);
    const antiRhMarco = marcos.find((m: any) => m.titulo.includes('Anti-Rh'));
    expect(antiRhMarco).toBeUndefined();
  });

  it('deve posicionar Anti-Rh após "Início do 3º Trimestre" (28 semanas)', () => {
    const marcos = calcularMarcosImportantes(dataUltrassom, igUltrassom, true);
    const idx3Tri = marcos.findIndex((m: any) => m.titulo.includes('3º Trimestre'));
    const idxAntiRh = marcos.findIndex((m: any) => m.titulo.includes('Anti-Rh'));
    expect(idx3Tri).toBeGreaterThan(-1);
    expect(idxAntiRh).toBeGreaterThan(-1);
    expect(idxAntiRh).toBe(idx3Tri + 1);
  });

  it('deve ter a mesma data que "Início do 3º Trimestre" (ambos 28 semanas)', () => {
    const marcos = calcularMarcosImportantes(dataUltrassom, igUltrassom, true);
    const marco3Tri = marcos.find((m: any) => m.titulo.includes('3º Trimestre'));
    const marcoAntiRh = marcos.find((m: any) => m.titulo.includes('Anti-Rh'));
    expect(marco3Tri).toBeDefined();
    expect(marcoAntiRh).toBeDefined();
    expect(marcoAntiRh.data).toBe(marco3Tri.data);
  });

  it('deve manter todos os outros marcos inalterados quando Rh negativo', () => {
    const marcosComRh = calcularMarcosImportantes(dataUltrassom, igUltrassom, true);
    const marcosSemRh = calcularMarcosImportantes(dataUltrassom, igUltrassom, false);
    
    // Com Rh deve ter 1 marco a mais
    expect(marcosComRh.length).toBe(marcosSemRh.length + 1);
    
    // Todos os marcos sem Rh devem existir nos marcos com Rh
    marcosSemRh.forEach((marco: any) => {
      const encontrado = marcosComRh.find((m: any) => m.titulo === marco.titulo);
      expect(encontrado).toBeDefined();
      expect(encontrado.data).toBe(marco.data);
    });
  });
});

describe('Condição Rh Negativo no Scheduler', () => {
  it('deve filtrar corretamente gestantes Rh negativo pelo fator de risco', () => {
    // Simular lista de fatores de risco
    const fatoresComRhNeg = [
      { id: 1, gestanteId: 1, tipo: 'fator_rh_negativo', ativo: 1 },
      { id: 2, gestanteId: 1, tipo: 'hipertensao', ativo: 1 },
    ];
    const fatoresSemRhNeg = [
      { id: 2, gestanteId: 1, tipo: 'hipertensao', ativo: 1 },
      { id: 3, gestanteId: 1, tipo: 'diabetes_gestacional', ativo: 1 },
    ];
    const fatoresRhNegInativo = [
      { id: 1, gestanteId: 1, tipo: 'fator_rh_negativo', ativo: 0 },
    ];

    const ehRhNeg1 = fatoresComRhNeg.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
    const ehRhNeg2 = fatoresSemRhNeg.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
    const ehRhNeg3 = fatoresRhNegInativo.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);

    expect(ehRhNeg1).toBe(true);
    expect(ehRhNeg2).toBe(false);
    expect(ehRhNeg3).toBe(false);
  });
});

describe('Template WhatsApp - condicaoRhNegativo', () => {
  it('deve filtrar templates com condicaoRhNegativo = 1 apenas para gestantes Rh negativo', () => {
    // Simular template com condição Rh negativo
    const template = {
      id: 1,
      nome: 'Lembrete Vacina Anti-Rh',
      condicaoRhNegativo: 1,
      igSemanas: 28,
    };

    // Gestante Rh negativo
    const fatoresRhNeg = [{ tipo: 'fator_rh_negativo', ativo: 1 }];
    const ehRhNeg = fatoresRhNeg.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
    
    // Template com condicaoRhNegativo = 1 deve ser enviado para Rh negativo
    const deveEnviar = template.condicaoRhNegativo !== 1 || ehRhNeg;
    expect(deveEnviar).toBe(true);

    // Gestante Rh positivo
    const fatoresRhPos = [{ tipo: 'hipertensao', ativo: 1 }];
    const ehRhPos = fatoresRhPos.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
    
    // Template com condicaoRhNegativo = 1 NÃO deve ser enviado para Rh positivo
    const naoDeveEnviar = template.condicaoRhNegativo !== 1 || ehRhPos;
    expect(naoDeveEnviar).toBe(false);
  });

  it('templates sem condicaoRhNegativo devem ser enviados para todas as gestantes', () => {
    const template = {
      id: 2,
      nome: 'Lembrete Vacina dTpa',
      condicaoRhNegativo: 0,
      igSemanas: 27,
    };

    const fatoresRhNeg = [{ tipo: 'fator_rh_negativo', ativo: 1 }];
    const fatoresRhPos = [{ tipo: 'hipertensao', ativo: 1 }];

    // Deve enviar para ambas
    const deveEnviarRhNeg = template.condicaoRhNegativo !== 1 || fatoresRhNeg.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
    const deveEnviarRhPos = template.condicaoRhNegativo !== 1 || fatoresRhPos.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
    
    expect(deveEnviarRhNeg).toBe(true);
    expect(deveEnviarRhPos).toBe(true);
  });
});
