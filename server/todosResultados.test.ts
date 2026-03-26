import { describe, it, expect } from 'vitest';

/**
 * Testes para a lógica de todosResultados no buscarComHistorico
 * 
 * O backend retorna todosResultados com:
 * - Arrays por exame/trimestre
 * - Ordenados por data DESC (mais recente primeiro)
 * - O mais recente removido (já está na linha editável)
 */

// Simular a lógica de processamento do backend
function processarTodosResultados(resultados: Array<{
  id: number;
  nomeExame: string;
  trimestre: number;
  resultado: string;
  dataExame: string | null;
}>) {
  const todosResultados: Record<string, Record<string, Array<{
    id: number;
    resultado: string;
    dataExame: string | null;
  }>>> = {};

  for (const r of resultados) {
    if (r.nomeExame === 'outros_observacoes') continue;
    
    if (!todosResultados[r.nomeExame]) {
      todosResultados[r.nomeExame] = {};
    }
    const triKey = r.trimestre.toString();
    if (!todosResultados[r.nomeExame][triKey]) {
      todosResultados[r.nomeExame][triKey] = [];
    }
    todosResultados[r.nomeExame][triKey].push({
      id: r.id,
      resultado: r.resultado,
      dataExame: r.dataExame,
    });
  }

  // Ordenar DESC e remover o mais recente
  for (const nomeExame of Object.keys(todosResultados)) {
    for (const tri of Object.keys(todosResultados[nomeExame])) {
      const arr = todosResultados[nomeExame][tri];
      arr.sort((a, b) => {
        if (!a.dataExame && !b.dataExame) return 0;
        if (!a.dataExame) return 1;
        if (!b.dataExame) return -1;
        return b.dataExame.localeCompare(a.dataExame);
      });
      if (arr.length > 0) {
        arr.shift();
      }
    }
  }

  return todosResultados;
}

// Helper para calcular maxLinhas (replica lógica do frontend)
function getMaxLinhas(
  todosResultados: Record<string, Record<string, Array<any>>>,
  nomeExame: string,
  trimestresConfig: { primeiro: boolean; segundo: boolean; terceiro: boolean }
) {
  const getResultadosTrimestre = (tri: number) => {
    return todosResultados[nomeExame]?.[tri.toString()] || [];
  };
  const extra1 = trimestresConfig.primeiro ? getResultadosTrimestre(1).length : 0;
  const extra2 = trimestresConfig.segundo ? getResultadosTrimestre(2).length : 0;
  const extra3 = trimestresConfig.terceiro ? getResultadosTrimestre(3).length : 0;
  return 1 + Math.max(extra1, extra2, extra3);
}

describe('todosResultados - processamento backend', () => {
  it('deve agrupar resultados por exame e trimestre', () => {
    const resultados = [
      { id: 1, nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-07-07' },
      { id: 2, nomeExame: 'HIV', trimestre: 2, resultado: 'Não Reagente', dataExame: '2025-10-09' },
      { id: 3, nomeExame: 'TSH', trimestre: 1, resultado: '2.1 mUI/L', dataExame: '2025-07-07' },
    ];

    const result = processarTodosResultados(resultados);
    
    // HIV tri 1: tinha 1 resultado, removeu o mais recente -> array vazio
    expect(result['HIV']['1']).toHaveLength(0);
    // HIV tri 2: tinha 1 resultado, removeu o mais recente -> array vazio
    expect(result['HIV']['2']).toHaveLength(0);
    // TSH tri 1: tinha 1 resultado, removeu o mais recente -> array vazio
    expect(result['TSH']['1']).toHaveLength(0);
  });

  it('deve manter resultados anteriores quando há múltiplos no mesmo trimestre', () => {
    const resultados = [
      { id: 1, nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-07-07' },
      { id: 2, nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-08-15' },
      { id: 3, nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-09-01' },
    ];

    const result = processarTodosResultados(resultados);
    
    // 3 resultados no tri 1, removeu o mais recente (2025-09-01) -> 2 restantes
    expect(result['HIV']['1']).toHaveLength(2);
    // Ordenados DESC: 2025-08-15 primeiro, depois 2025-07-07
    expect(result['HIV']['1'][0].dataExame).toBe('2025-08-15');
    expect(result['HIV']['1'][1].dataExame).toBe('2025-07-07');
  });

  it('deve ordenar por data DESC (mais recente primeiro)', () => {
    const resultados = [
      { id: 1, nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '11.5 g/dL', dataExame: '2025-10-01' },
      { id: 2, nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '12.0 g/dL', dataExame: '2025-11-15' },
      { id: 3, nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '11.8 g/dL', dataExame: '2025-10-20' },
      { id: 4, nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '12.2 g/dL', dataExame: '2025-12-01' },
    ];

    const result = processarTodosResultados(resultados);
    
    // 4 resultados, removeu o mais recente (2025-12-01) -> 3 restantes
    expect(result['Hemoglobina/Hematócrito']['2']).toHaveLength(3);
    // Ordenados DESC
    expect(result['Hemoglobina/Hematócrito']['2'][0].dataExame).toBe('2025-11-15');
    expect(result['Hemoglobina/Hematócrito']['2'][1].dataExame).toBe('2025-10-20');
    expect(result['Hemoglobina/Hematócrito']['2'][2].dataExame).toBe('2025-10-01');
  });

  it('deve ignorar outros_observacoes', () => {
    const resultados = [
      { id: 1, nomeExame: 'outros_observacoes', trimestre: 0, resultado: 'Observação qualquer', dataExame: null },
      { id: 2, nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-07-07' },
    ];

    const result = processarTodosResultados(resultados);
    
    expect(result['outros_observacoes']).toBeUndefined();
    expect(result['HIV']).toBeDefined();
  });

  it('deve lidar com datas nulas (colocando no final)', () => {
    const resultados = [
      { id: 1, nomeExame: 'VDRL', trimestre: 1, resultado: 'Não Reagente', dataExame: null },
      { id: 2, nomeExame: 'VDRL', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-07-07' },
      { id: 3, nomeExame: 'VDRL', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-08-01' },
    ];

    const result = processarTodosResultados(resultados);
    
    // 3 resultados, removeu o mais recente (2025-08-01) -> 2 restantes
    expect(result['VDRL']['1']).toHaveLength(2);
    // 2025-07-07 primeiro, null por último
    expect(result['VDRL']['1'][0].dataExame).toBe('2025-07-07');
    expect(result['VDRL']['1'][1].dataExame).toBeNull();
  });
});

describe('getMaxLinhas - cálculo de linhas na tabela', () => {
  it('deve retornar 1 quando não há histórico extra', () => {
    const todosResultados = {
      'HIV': { '1': [], '2': [], '3': [] }
    };
    const config = { primeiro: true, segundo: true, terceiro: true };
    
    expect(getMaxLinhas(todosResultados, 'HIV', config)).toBe(1);
  });

  it('deve retornar 1 quando exame não existe em todosResultados', () => {
    const todosResultados = {};
    const config = { primeiro: true, segundo: true, terceiro: true };
    
    expect(getMaxLinhas(todosResultados, 'HIV', config)).toBe(1);
  });

  it('deve retornar 1 + max(extras) quando há múltiplos resultados', () => {
    const todosResultados = {
      'Hemoglobina/Hematócrito': {
        '1': [], // 0 extras
        '2': [{ id: 1 }, { id: 2 }], // 2 extras
        '3': [{ id: 3 }], // 1 extra
      }
    };
    const config = { primeiro: true, segundo: true, terceiro: true };
    
    // 1 (editável) + 2 (max extras) = 3
    expect(getMaxLinhas(todosResultados, 'Hemoglobina/Hematócrito', config)).toBe(3);
  });

  it('deve ignorar trimestres desabilitados', () => {
    const todosResultados = {
      'Glicemia de jejum': {
        '1': [], // 0 extras
        '2': [{ id: 1 }, { id: 2 }, { id: 3 }], // 3 extras mas tri 2 desabilitado
        '3': [], // 0 extras
      }
    };
    // Glicemia de jejum: apenas 1º trimestre
    const config = { primeiro: true, segundo: false, terceiro: false };
    
    // 1 (editável) + 0 (max extras do tri habilitado) = 1
    expect(getMaxLinhas(todosResultados, 'Glicemia de jejum', config)).toBe(1);
  });

  it('cenário do André: 1 no 1ºtri, 3 no 2ºtri, 2 no 3ºtri', () => {
    // O backend remove o mais recente de cada trimestre
    // Então: 0 extras no 1ºtri, 2 extras no 2ºtri, 1 extra no 3ºtri
    const todosResultados = {
      'Hemoglobina/Hematócrito': {
        '1': [], // 1 resultado total - 1 removido = 0 extras
        '2': [{ id: 2 }, { id: 3 }], // 3 resultados total - 1 removido = 2 extras
        '3': [{ id: 5 }], // 2 resultados total - 1 removido = 1 extra
      }
    };
    const config = { primeiro: true, segundo: true, terceiro: true };
    
    // 1 (editável) + 2 (max extras) = 3 linhas
    expect(getMaxLinhas(todosResultados, 'Hemoglobina/Hematócrito', config)).toBe(3);
  });
});

describe('formatarDataExibicao', () => {
  const formatarDataExibicao = (data: string | null) => {
    if (!data) return '';
    const partes = data.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return data;
  };

  it('deve formatar YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(formatarDataExibicao('2025-07-07')).toBe('07/07/2025');
    expect(formatarDataExibicao('2025-10-09')).toBe('09/10/2025');
    expect(formatarDataExibicao('2026-01-15')).toBe('15/01/2026');
  });

  it('deve retornar string vazia para null', () => {
    expect(formatarDataExibicao(null)).toBe('');
  });

  it('deve retornar a string original se formato inválido', () => {
    expect(formatarDataExibicao('07/07/2025')).toBe('07/07/2025');
  });
});
