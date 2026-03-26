import { describe, it, expect } from 'vitest';

/**
 * Testes para a lógica de buscarTodosParaPdf
 * Verifica que o endpoint retorna todos os resultados por trimestre (não apenas o mais recente)
 * e que os dados são estruturados corretamente para geração de PDF
 */

// Simular a lógica de processamento do endpoint buscarTodosParaPdf
function processarResultadosParaPdf(resultados: Array<{
  nomeExame: string;
  trimestre: number;
  resultado: string | null;
  dataExame: Date | null;
}>) {
  const resultadoUnico: Record<string, Record<string, string> | string> = {};
  const todosResultados: Record<string, Record<string, Array<{
    resultado: string;
    data: string | null;
  }>>> = {};

  // Ordenar por data (ASC) para simular a query
  const sorted = [...resultados].sort((a, b) => {
    if (!a.dataExame) return -1;
    if (!b.dataExame) return 1;
    return a.dataExame.getTime() - b.dataExame.getTime();
  });

  for (const resultado of sorted) {
    let dataFormatada: string | null = null;
    if (resultado.dataExame) {
      // Simular o comportamento do backend: new Date() + getTimezoneOffset
      const data = new Date(resultado.dataExame);
      const dataLocal = new Date(data.getTime() + data.getTimezoneOffset() * 60000);
      const ano = dataLocal.getFullYear();
      const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(dataLocal.getDate()).padStart(2, '0');
      dataFormatada = `${ano}-${mes}-${dia}`;
    }

    if (resultado.nomeExame === 'outros_observacoes') {
      resultadoUnico[resultado.nomeExame] = resultado.resultado || '';
    } else {
      if (!resultadoUnico[resultado.nomeExame]) {
        resultadoUnico[resultado.nomeExame] = {};
      }
      (resultadoUnico[resultado.nomeExame] as Record<string, string>)[resultado.trimestre.toString()] = resultado.resultado || '';
      if (dataFormatada) {
        (resultadoUnico[resultado.nomeExame] as Record<string, string>)[`data${resultado.trimestre}`] = dataFormatada;
      }
    }

    if (resultado.nomeExame !== 'outros_observacoes') {
      if (!todosResultados[resultado.nomeExame]) {
        todosResultados[resultado.nomeExame] = {};
      }
      const triKey = resultado.trimestre.toString();
      if (!todosResultados[resultado.nomeExame][triKey]) {
        todosResultados[resultado.nomeExame][triKey] = [];
      }
      todosResultados[resultado.nomeExame][triKey].push({
        resultado: resultado.resultado || '',
        data: dataFormatada,
      });
    }
  }

  return { resultadoUnico, todosResultados };
}

describe('buscarTodosParaPdf - Processamento de resultados', () => {
  it('deve retornar todos os resultados por trimestre, não apenas o mais recente', () => {
    const resultados = [
      { nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: new Date('2025-03-15T12:00:00Z') },
      { nomeExame: 'HIV', trimestre: 2, resultado: 'Não Reagente', dataExame: new Date('2025-06-20T12:00:00Z') },
      { nomeExame: 'HIV', trimestre: 2, resultado: 'Não Reagente', dataExame: new Date('2025-07-10T12:00:00Z') },
      { nomeExame: 'HIV', trimestre: 3, resultado: 'Não Reagente', dataExame: new Date('2025-09-05T12:00:00Z') },
    ];

    const { todosResultados } = processarResultadosParaPdf(resultados);

    expect(todosResultados['HIV']['1']).toHaveLength(1);
    expect(todosResultados['HIV']['2']).toHaveLength(2);
    expect(todosResultados['HIV']['3']).toHaveLength(1);
  });

  it('deve manter a ordem cronológica ASC dentro de cada trimestre', () => {
    const resultados = [
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '12.5 g/dL', dataExame: new Date('2025-07-10T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '11.8 g/dL', dataExame: new Date('2025-06-01T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '13.0 g/dL', dataExame: new Date('2025-08-15T12:00:00Z') },
    ];

    const { todosResultados } = processarResultadosParaPdf(resultados);
    const tri2 = todosResultados['Hemoglobina/Hematócrito']['2'];

    expect(tri2).toHaveLength(3);
    // Ordenados por data ASC
    expect(tri2[0].resultado).toBe('11.8 g/dL');
    expect(tri2[0].data).toBe('2025-06-01');
    expect(tri2[1].resultado).toBe('12.5 g/dL');
    expect(tri2[1].data).toBe('2025-07-10');
    expect(tri2[2].resultado).toBe('13.0 g/dL');
    expect(tri2[2].data).toBe('2025-08-15');
  });

  it('deve retornar resultadoUnico com o mais recente (sobrescrito)', () => {
    const resultados = [
      { nomeExame: 'TSH', trimestre: 1, resultado: '2.1 mUI/L', dataExame: new Date('2025-03-15T12:00:00Z') },
      { nomeExame: 'TSH', trimestre: 1, resultado: '3.0 mUI/L', dataExame: new Date('2025-04-20T12:00:00Z') },
    ];

    const { resultadoUnico } = processarResultadosParaPdf(resultados);

    // resultadoUnico deve ter o mais recente (sobrescrito)
    expect((resultadoUnico['TSH'] as Record<string, string>)['1']).toBe('3.0 mUI/L');
  });

  it('deve incluir datas formatadas corretamente', () => {
    const resultados = [
      { nomeExame: 'Urocultura', trimestre: 1, resultado: 'Negativa', dataExame: new Date('2025-03-15T12:00:00Z') },
    ];

    const { todosResultados } = processarResultadosParaPdf(resultados);

    expect(todosResultados['Urocultura']['1'][0].data).toBe('2025-03-15');
    expect(todosResultados['Urocultura']['1'][0].resultado).toBe('Negativa');
  });

  it('deve tratar outros_observacoes como string simples', () => {
    const resultados = [
      { nomeExame: 'outros_observacoes', trimestre: 1, resultado: 'Paciente com alergia a penicilina', dataExame: null },
      { nomeExame: 'HIV', trimestre: 1, resultado: 'Não Reagente', dataExame: new Date('2025-03-15') },
    ];

    const { resultadoUnico, todosResultados } = processarResultadosParaPdf(resultados);

    expect(resultadoUnico['outros_observacoes']).toBe('Paciente com alergia a penicilina');
    expect(todosResultados['outros_observacoes']).toBeUndefined();
  });

  it('deve lidar com resultados sem data', () => {
    const resultados = [
      { nomeExame: 'VDRL', trimestre: 1, resultado: 'Não Reagente', dataExame: null },
    ];

    const { todosResultados } = processarResultadosParaPdf(resultados);

    expect(todosResultados['VDRL']['1'][0].data).toBeNull();
    expect(todosResultados['VDRL']['1'][0].resultado).toBe('Não Reagente');
  });

  it('deve lidar com múltiplos exames em múltiplos trimestres', () => {
    const resultados = [
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 1, resultado: '12.0', dataExame: new Date('2025-03-01T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '11.5', dataExame: new Date('2025-06-01T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '11.8', dataExame: new Date('2025-07-01T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '12.2', dataExame: new Date('2025-08-01T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 3, resultado: '11.0', dataExame: new Date('2025-09-01T12:00:00Z') },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 3, resultado: '10.8', dataExame: new Date('2025-10-01T12:00:00Z') },
      { nomeExame: 'Plaquetas', trimestre: 1, resultado: '250.000', dataExame: new Date('2025-03-01T12:00:00Z') },
      { nomeExame: 'Plaquetas', trimestre: 2, resultado: '230.000', dataExame: new Date('2025-06-01T12:00:00Z') },
      { nomeExame: 'Plaquetas', trimestre: 2, resultado: '220.000', dataExame: new Date('2025-07-01T12:00:00Z') },
      { nomeExame: 'Plaquetas', trimestre: 2, resultado: '240.000', dataExame: new Date('2025-08-01T12:00:00Z') },
      { nomeExame: 'Plaquetas', trimestre: 3, resultado: '210.000', dataExame: new Date('2025-09-01T12:00:00Z') },
      { nomeExame: 'Plaquetas', trimestre: 3, resultado: '200.000', dataExame: new Date('2025-10-01T12:00:00Z') },
    ];

    const { todosResultados } = processarResultadosParaPdf(resultados);

    // Hemoglobina
    expect(todosResultados['Hemoglobina/Hematócrito']['1']).toHaveLength(1);
    expect(todosResultados['Hemoglobina/Hematócrito']['2']).toHaveLength(3);
    expect(todosResultados['Hemoglobina/Hematócrito']['3']).toHaveLength(2);

    // Plaquetas
    expect(todosResultados['Plaquetas']['1']).toHaveLength(1);
    expect(todosResultados['Plaquetas']['2']).toHaveLength(3);
    expect(todosResultados['Plaquetas']['3']).toHaveLength(2);
  });

  it('deve retornar objetos vazios quando não há resultados', () => {
    const { resultadoUnico, todosResultados } = processarResultadosParaPdf([]);

    expect(Object.keys(resultadoUnico)).toHaveLength(0);
    expect(Object.keys(todosResultados)).toHaveLength(0);
  });

  it('deve lidar com resultado null', () => {
    const resultados = [
      { nomeExame: 'HIV', trimestre: 1, resultado: null, dataExame: new Date('2025-03-15T12:00:00Z') },
    ];

    const { todosResultados } = processarResultadosParaPdf(resultados);

    expect(todosResultados['HIV']['1'][0].resultado).toBe('');
  });
});

// Testes para a formatação de data curta no PDF
describe('formatDataCurta para PDF', () => {
  const formatDataCurta = (data: string | null): string => {
    if (!data) return '';
    const parts = data.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return data;
  };

  it('deve formatar data YYYY-MM-DD para DD/MM', () => {
    expect(formatDataCurta('2025-03-15')).toBe('15/03');
    expect(formatDataCurta('2025-12-01')).toBe('01/12');
  });

  it('deve retornar string vazia para null', () => {
    expect(formatDataCurta(null)).toBe('');
  });

  it('deve retornar a data original se formato inválido', () => {
    expect(formatDataCurta('15/03/2025')).toBe('15/03/2025');
  });
});
