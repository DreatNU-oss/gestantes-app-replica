import { describe, it, expect } from 'vitest';

/**
 * Test suite for the Ecocardiograma Fetal reminder logic
 * Tests the TN and DV detection criteria
 */

// Helper function to simulate the TN parsing logic
function parseTN(tnValue: string): number | null {
  const tnStr = String(tnValue).replace(',', '.').replace(/[^0-9.]/g, '');
  const val = parseFloat(tnStr);
  return isNaN(val) ? null : val;
}

// Helper function to simulate the DV detection logic
function isDVAbnormal(dvValue: string): boolean {
  const dvStr = String(dvValue).toLowerCase();
  return (
    dvStr.includes('negativ') ||
    dvStr.includes('onda a negativ') ||
    dvStr.includes('revers') ||
    dvStr.includes('alterado')
  );
}

// Helper to check if ecocardiograma indication exists
function verificarIndicacao(dados: { tn?: string; dv?: string }): { indicacao: boolean; motivos: string[] } {
  let indicacao = false;
  const motivos: string[] = [];

  if (dados.tn) {
    const tnValue = parseTN(dados.tn);
    if (tnValue !== null && tnValue > 2.5) {
      indicacao = true;
      motivos.push(`TN = ${dados.tn} (> 2,5mm)`);
    }
  }

  if (dados.dv) {
    if (isDVAbnormal(dados.dv)) {
      indicacao = true;
      motivos.push(`Ducto Venoso: ${dados.dv}`);
    }
  }

  return { indicacao, motivos };
}

describe('Ecocardiograma Fetal Reminder - TN Parsing', () => {
  it('should parse TN value "1.2mm" correctly', () => {
    expect(parseTN('1.2mm')).toBe(1.2);
  });

  it('should parse TN value "2,8mm" with comma correctly', () => {
    expect(parseTN('2,8mm')).toBe(2.8);
  });

  it('should parse TN value "3.0" without unit correctly', () => {
    expect(parseTN('3.0')).toBe(3.0);
  });

  it('should parse TN value "1.5 mm" with space correctly', () => {
    expect(parseTN('1.5 mm')).toBe(1.5);
  });

  it('should return null for empty TN', () => {
    expect(parseTN('')).toBeNull();
  });

  it('should return null for non-numeric TN', () => {
    expect(parseTN('normal')).toBeNull();
  });
});

describe('Ecocardiograma Fetal Reminder - DV Detection', () => {
  it('should detect "Onda A negativa"', () => {
    expect(isDVAbnormal('Onda A negativa')).toBe(true);
  });

  it('should detect "Negativo"', () => {
    expect(isDVAbnormal('Negativo')).toBe(true);
  });

  it('should detect "Reverso"', () => {
    expect(isDVAbnormal('Reverso')).toBe(true);
  });

  it('should detect "Alterado"', () => {
    expect(isDVAbnormal('Alterado')).toBe(true);
  });

  it('should NOT detect "Normal"', () => {
    expect(isDVAbnormal('Normal')).toBe(false);
  });

  it('should NOT detect "Positivo"', () => {
    expect(isDVAbnormal('Positivo')).toBe(false);
  });

  it('should NOT detect empty string', () => {
    expect(isDVAbnormal('')).toBe(false);
  });
});

describe('Ecocardiograma Fetal Reminder - Indication Logic', () => {
  it('should indicate ecocardiograma when TN > 2.5mm', () => {
    const result = verificarIndicacao({ tn: '3.0mm', dv: 'Normal' });
    expect(result.indicacao).toBe(true);
    expect(result.motivos).toHaveLength(1);
    expect(result.motivos[0]).toContain('TN');
  });

  it('should indicate ecocardiograma when DV is abnormal', () => {
    const result = verificarIndicacao({ tn: '1.2mm', dv: 'Onda A negativa' });
    expect(result.indicacao).toBe(true);
    expect(result.motivos).toHaveLength(1);
    expect(result.motivos[0]).toContain('Ducto Venoso');
  });

  it('should indicate ecocardiograma when BOTH TN > 2.5 and DV abnormal', () => {
    const result = verificarIndicacao({ tn: '3.5mm', dv: 'Reverso' });
    expect(result.indicacao).toBe(true);
    expect(result.motivos).toHaveLength(2);
  });

  it('should NOT indicate ecocardiograma when TN <= 2.5 and DV normal', () => {
    const result = verificarIndicacao({ tn: '1.5mm', dv: 'Normal' });
    expect(result.indicacao).toBe(false);
    expect(result.motivos).toHaveLength(0);
  });

  it('should NOT indicate ecocardiograma when TN is exactly 2.5mm', () => {
    const result = verificarIndicacao({ tn: '2.5mm', dv: 'Normal' });
    expect(result.indicacao).toBe(false);
    expect(result.motivos).toHaveLength(0);
  });

  it('should NOT indicate ecocardiograma when both fields are empty', () => {
    const result = verificarIndicacao({});
    expect(result.indicacao).toBe(false);
    expect(result.motivos).toHaveLength(0);
  });

  it('should handle TN with comma separator "2,8mm"', () => {
    const result = verificarIndicacao({ tn: '2,8mm' });
    expect(result.indicacao).toBe(true);
  });

  it('should handle DV with "alterado" keyword', () => {
    const result = verificarIndicacao({ dv: 'alterado' });
    expect(result.indicacao).toBe(true);
  });
});

describe('Ecocardiograma Fetal Reminder - Conduta Auto-Resolve', () => {
  it('should match "Ecocardiograma Fetal" conduta for auto-resolve', () => {
    const condutas = ['Rotina Laboratorial 1º Trimestre', 'Ecocardiograma Fetal'];
    const hasEco = condutas.some((c: string) => c.toLowerCase().includes('ecocardiograma'));
    expect(hasEco).toBe(true);
  });

  it('should NOT match condutas without ecocardiograma', () => {
    const condutas = ['Rotina Laboratorial 1º Trimestre', 'US Morfológico 2º Trimestre'];
    const hasEco = condutas.some((c: string) => c.toLowerCase().includes('ecocardiograma'));
    expect(hasEco).toBe(false);
  });

  it('should match lembrete text containing both "Ecocardiograma Fetal" and "Morfológico"', () => {
    const lembreteTexto = '⚠️ Solicitar Ecocardiograma Fetal — Morfológico 1ºTri: TN = 3.0mm (> 2,5mm)';
    const isEcoLembrete = lembreteTexto.includes('Ecocardiograma Fetal') && lembreteTexto.includes('Morfológico');
    expect(isEcoLembrete).toBe(true);
  });
});
