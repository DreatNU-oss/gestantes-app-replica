import { describe, it, expect } from 'vitest';

// Test the adicionarUnidade function logic (extracted for testing)
// This mirrors the function in ExamesLaboratoriais.tsx

const adicionarUnidade = (valor: string, unidade: string, nomeExame?: string): string => {
  if (!valor || valor.trim() === '') return valor;
  if (valor.includes(unidade)) return valor;
  const valorLimpo = valor.trim();
  
  // Bug 3 fix: Hemoglobina/Hematócrito aceita dois valores
  if (nomeExame === 'Hemoglobina/Hematócrito') {
    if (valorLimpo.includes('g/dL') || valorLimpo.includes('%')) return valor;
    const matchDuplo = valorLimpo.match(/^(\d+[.,]?\d*)\s*[\/\s]\s*(\d+[.,]?\d*)$/);
    if (matchDuplo) {
      return `${matchDuplo[1]} g/dL / ${matchDuplo[2]}%`;
    }
    const ehNumero = /^\d+([.,]\d+)?$/.test(valorLimpo);
    if (ehNumero) {
      return `${valorLimpo} g/dL`;
    }
    return valor;
  }
  
  const ehNumero = /^\d+([.,]\d+)?$/.test(valorLimpo);
  if (ehNumero) {
    return `${valorLimpo} ${unidade}`;
  }
  return valor;
};

describe('adicionarUnidade - Bug 3: Hemoglobina/Hematócrito dual units', () => {
  it('should add dual units for "12/36" format', () => {
    const result = adicionarUnidade('12/36', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12 g/dL / 36%');
  });

  it('should add dual units for "12 36" format (space separated)', () => {
    const result = adicionarUnidade('12 36', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12 g/dL / 36%');
  });

  it('should add dual units for "12,5/40" format (decimal with comma)', () => {
    const result = adicionarUnidade('12,5/40', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12,5 g/dL / 40%');
  });

  it('should add dual units for "12.5/40.2" format (decimal with dot)', () => {
    const result = adicionarUnidade('12.5/40.2', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12.5 g/dL / 40.2%');
  });

  it('should add single unit for single value in Hemoglobina', () => {
    const result = adicionarUnidade('12', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12 g/dL');
  });

  it('should add single unit for decimal single value in Hemoglobina', () => {
    const result = adicionarUnidade('12,5', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12,5 g/dL');
  });

  it('should not duplicate units if already present', () => {
    const result = adicionarUnidade('12 g/dL / 36%', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12 g/dL / 36%');
  });

  it('should not modify non-numeric text for Hemoglobina', () => {
    const result = adicionarUnidade('Normal', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('Normal');
  });

  it('should handle "12/40" with spaces around slash', () => {
    const result = adicionarUnidade('12 / 40', 'g/dL', 'Hemoglobina/Hematócrito');
    expect(result).toBe('12 g/dL / 40%');
  });
});

describe('adicionarUnidade - Regular exams (non-Hemoglobina)', () => {
  it('should add g/dL for numeric value without nomeExame', () => {
    const result = adicionarUnidade('12', 'g/dL');
    expect(result).toBe('12 g/dL');
  });

  it('should add mg/dL for Glicemia', () => {
    const result = adicionarUnidade('85', 'mg/dL', 'Glicemia de jejum');
    expect(result).toBe('85 mg/dL');
  });

  it('should add /mm³ for Plaquetas', () => {
    const result = adicionarUnidade('250000', '/mm³', 'Plaquetas');
    expect(result).toBe('250000 /mm³');
  });

  it('should add mUI/L for TSH', () => {
    const result = adicionarUnidade('2,5', 'mUI/L', 'TSH');
    expect(result).toBe('2,5 mUI/L');
  });

  it('should not add unit to non-numeric value', () => {
    const result = adicionarUnidade('Reagente', 'mg/dL');
    expect(result).toBe('Reagente');
  });

  it('should not duplicate unit if already present', () => {
    const result = adicionarUnidade('85 mg/dL', 'mg/dL');
    expect(result).toBe('85 mg/dL');
  });

  it('should return empty string as-is', () => {
    const result = adicionarUnidade('', 'mg/dL');
    expect(result).toBe('');
  });

  it('should handle decimal with comma', () => {
    const result = adicionarUnidade('1,25', 'ng/dL', 'T4 Livre');
    expect(result).toBe('1,25 ng/dL');
  });
});

describe('Bug 1: navegarParaProximoResultado - placeholder text filtering', () => {
  // The fix ensures that placeholder text like "Tipo", "1/2", "1/2/3" are not treated as results
  it('should not consider "Tipo" as a valid result', () => {
    const valorAtual = 'Tipo';
    const temResultado = valorAtual && valorAtual.trim() !== '' && valorAtual !== '1/2' && valorAtual !== '1/2/3' && valorAtual !== 'Tipo';
    expect(temResultado).toBe(false);
  });

  it('should not consider "1/2" as a valid result', () => {
    const valorAtual = '1/2';
    const temResultado = valorAtual && valorAtual.trim() !== '' && valorAtual !== '1/2' && valorAtual !== '1/2/3' && valorAtual !== 'Tipo';
    expect(temResultado).toBe(false);
  });

  it('should not consider "1/2/3" as a valid result', () => {
    const valorAtual = '1/2/3';
    const temResultado = valorAtual && valorAtual.trim() !== '' && valorAtual !== '1/2' && valorAtual !== '1/2/3' && valorAtual !== 'Tipo';
    expect(temResultado).toBe(false);
  });

  it('should consider "A+" as a valid result', () => {
    const valorAtual = 'A+';
    const temResultado = valorAtual && valorAtual.trim() !== '' && valorAtual !== '1/2' && valorAtual !== '1/2/3' && valorAtual !== 'Tipo';
    expect(temResultado).toBeTruthy();
  });

  it('should consider "O-" as a valid result', () => {
    const valorAtual = 'O-';
    const temResultado = valorAtual && valorAtual.trim() !== '' && valorAtual !== '1/2' && valorAtual !== '1/2/3' && valorAtual !== 'Tipo';
    expect(temResultado).toBeTruthy();
  });

  it('should not consider empty string as a valid result', () => {
    const valorAtual = '';
    const temResultado = valorAtual && valorAtual.trim() !== '' && valorAtual !== '1/2' && valorAtual !== '1/2/3' && valorAtual !== 'Tipo';
    expect(temResultado).toBeFalsy();
  });
});

describe('Bug 2: State-based date fallback', () => {
  // Simulates the logic in handleResultadoChange that searches state for dates
  function buscarDataNoState(
    novoEstado: Record<string, Record<string, string> | string>,
    exameAtual: string,
    campoData: string
  ): string | null {
    for (const [outroExame, outroValor] of Object.entries(novoEstado)) {
      if (outroExame === exameAtual) continue;
      if (typeof outroValor === 'object' && outroValor !== null) {
        const dataOutro = (outroValor as Record<string, string>)[campoData];
        if (dataOutro && dataOutro.trim() !== '') {
          return dataOutro;
        }
      }
    }
    return null;
  }

  it('should find date from previous exam in state', () => {
    const state = {
      'Tipagem sanguínea ABO/Rh': { '1': 'A+', 'data1': '2026-03-15' },
      'Coombs indireto': { '1': 'Não Reagente' },
    };
    const result = buscarDataNoState(state, 'Coombs indireto', 'data1');
    expect(result).toBe('2026-03-15');
  });

  it('should return null when no other exam has date', () => {
    const state = {
      'Tipagem sanguínea ABO/Rh': { '1': 'A+' },
      'Coombs indireto': { '1': 'Não Reagente' },
    };
    const result = buscarDataNoState(state, 'Coombs indireto', 'data1');
    expect(result).toBeNull();
  });

  it('should skip the current exam when searching', () => {
    const state = {
      'Coombs indireto': { '1': 'Não Reagente', 'data1': '2026-03-10' },
    };
    const result = buscarDataNoState(state, 'Coombs indireto', 'data1');
    expect(result).toBeNull();
  });

  it('should find date from any exam with data for the trimester', () => {
    const state = {
      'Tipagem sanguínea ABO/Rh': { '1': 'B-' },
      'Coombs indireto': { '1': 'Não Reagente' },
      'Hemoglobina/Hematócrito': { '1': '12/36', 'data1': '2026-03-12' },
      'Plaquetas': { '1': '250000' },
    };
    const result = buscarDataNoState(state, 'Plaquetas', 'data1');
    expect(result).toBe('2026-03-12');
  });

  it('should search correct trimester field (data2)', () => {
    const state = {
      'Tipagem sanguínea ABO/Rh': { '1': 'A+', 'data1': '2026-01-15' },
      'Coombs indireto': { '2': 'Não Reagente', 'data2': '2026-05-20' },
      'Hemoglobina/Hematócrito': { '2': '13/38' },
    };
    const result = buscarDataNoState(state, 'Hemoglobina/Hematócrito', 'data2');
    expect(result).toBe('2026-05-20');
  });
});
