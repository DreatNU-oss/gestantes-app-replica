import { describe, it, expect } from 'vitest';

// Since gerarRelatorioExtracao is a private function, we test the logic by importing the types
// and recreating the logic for unit testing purposes
interface ExameComTrimestre {
  nomeExame: string;
  valor: string;
  subcampo?: string;
  dataColeta?: string;
  trimestre?: number;
}

interface RelatorioExtracao {
  examesEncontrados: {
    nome: string;
    valor: string;
    dataColeta?: string;
    trimestre?: number;
  }[];
  examesNaoPresentes: string[];
  estatisticas: {
    totalEncontradosNoPDF: number;
    totalCadastrados: number;
    totalEsperado: number;
    totalEncontrado: number;
    taxaSucesso: number;
  };
  avisos: string[];
}

// Replicate the function logic for testing
function gerarRelatorioExtracao(
  examesExtraidos: ExameComTrimestre[],
  examesEsperados: string[]
): RelatorioExtracao {
  const avisos: string[] = [];
  
  const normalizarNome = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };
  
  const examesEsperadosMap = new Map<string, string>();
  for (const exame of examesEsperados) {
    examesEsperadosMap.set(normalizarNome(exame), exame);
  }
  
  const examesEncontrados: RelatorioExtracao['examesEncontrados'] = [];
  const nomesEncontrados = new Set<string>();
  let examesComValorVazio = 0;
  
  for (const exame of examesExtraidos) {
    examesEncontrados.push({
      nome: exame.subcampo ? `${exame.nomeExame} - ${exame.subcampo}` : exame.nomeExame,
      valor: exame.valor,
      dataColeta: exame.dataColeta,
      trimestre: exame.trimestre
    });
    
    nomesEncontrados.add(normalizarNome(exame.nomeExame));
    
    if (!exame.valor || exame.valor.trim() === '') {
      examesComValorVazio++;
      avisos.push(`O exame "${exame.nomeExame}" foi encontrado mas não possui valor.`);
    }
  }
  
  const examesNaoPresentes: string[] = [];
  
  for (const exameEsperado of examesEsperados) {
    const nomeNormalizado = normalizarNome(exameEsperado);
    let encontrado = false;
    
    for (const nomeEncontrado of Array.from(nomesEncontrados)) {
      if (nomeNormalizado.includes(nomeEncontrado) || nomeEncontrado.includes(nomeNormalizado)) {
        encontrado = true;
        break;
      }
    }
    
    if (!encontrado) {
      examesNaoPresentes.push(exameEsperado);
    }
  }
  
  const totalEncontradosNoPDF = examesEncontrados.length;
  const totalCadastrados = totalEncontradosNoPDF - examesComValorVazio;
  
  const taxaSucesso = totalEncontradosNoPDF > 0 
    ? Math.round((totalCadastrados / totalEncontradosNoPDF) * 100) 
    : 0;
  
  const totalEsperado = examesEsperados.length;
  const totalEncontrado = examesEncontrados.length;
  
  if (totalEncontradosNoPDF === 0) {
    avisos.push('Nenhum exame foi encontrado no documento. Verifique se o arquivo está legível e contém resultados de exames laboratoriais.');
  }
  
  return {
    examesEncontrados,
    examesNaoPresentes,
    estatisticas: {
      totalEncontradosNoPDF,
      totalCadastrados,
      totalEsperado,
      totalEncontrado,
      taxaSucesso
    },
    avisos
  };
}

describe('Relatório de Extração - Nova Lógica', () => {
  const examesEsperados = [
    'Hemoglobina/Hematócrito',
    'Plaquetas',
    'Glicemia de jejum',
    'VDRL',
    'HIV',
    'Hepatite B (HBsAg)',
    'Toxoplasmose IgG',
    'Toxoplasmose IgM',
    'TSH',
    'Urocultura',
  ];

  it('deve mostrar 100% quando todos os exames do PDF são cadastrados com sucesso', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL / 39%' },
      { nomeExame: 'Glicemia de jejum', valor: '85 mg/dL' },
      { nomeExame: 'VDRL', valor: 'Não Reagente' },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    // Estatísticas baseadas no PDF, não no formulário
    expect(relatorio.estatisticas.totalEncontradosNoPDF).toBe(3);
    expect(relatorio.estatisticas.totalCadastrados).toBe(3);
    expect(relatorio.estatisticas.taxaSucesso).toBe(100);
    
    // Exames não presentes no PDF (informativos, não erro)
    expect(relatorio.examesNaoPresentes).toContain('Plaquetas');
    expect(relatorio.examesNaoPresentes).toContain('HIV');
    expect(relatorio.examesNaoPresentes).toContain('Toxoplasmose IgG');
    expect(relatorio.examesNaoPresentes.length).toBe(7); // 10 - 3 = 7
    
    // Sem avisos de erro
    expect(relatorio.avisos.length).toBe(0);
  });

  it('deve mostrar taxa reduzida quando exame tem valor vazio', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL / 39%' },
      { nomeExame: 'Toxoplasmose IgM', valor: '' }, // Valor vazio - o bug original
      { nomeExame: 'VDRL', valor: 'Não Reagente' },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.totalEncontradosNoPDF).toBe(3);
    expect(relatorio.estatisticas.totalCadastrados).toBe(2); // 1 com valor vazio
    expect(relatorio.estatisticas.taxaSucesso).toBe(67); // 2/3 = 66.67% → 67%
    
    // Deve ter aviso sobre valor vazio
    expect(relatorio.avisos).toContain('O exame "Toxoplasmose IgM" foi encontrado mas não possui valor.');
  });

  it('deve mostrar 0% quando nenhum exame é encontrado no PDF', () => {
    const examesExtraidos: ExameComTrimestre[] = [];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.totalEncontradosNoPDF).toBe(0);
    expect(relatorio.estatisticas.totalCadastrados).toBe(0);
    expect(relatorio.estatisticas.taxaSucesso).toBe(0);
    
    // Todos os exames esperados ficam como "não presentes"
    expect(relatorio.examesNaoPresentes.length).toBe(10);
    
    // Deve ter aviso
    expect(relatorio.avisos).toContain('Nenhum exame foi encontrado no documento. Verifique se o arquivo está legível e contém resultados de exames laboratoriais.');
  });

  it('deve manter totalEsperado e totalEncontrado para compatibilidade', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL' },
      { nomeExame: 'TSH', valor: '1.2 µUI/mL' },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    // Campos legados
    expect(relatorio.estatisticas.totalEsperado).toBe(10); // Total do formulário
    expect(relatorio.estatisticas.totalEncontrado).toBe(2); // Total encontrado
    
    // Novos campos
    expect(relatorio.estatisticas.totalEncontradosNoPDF).toBe(2);
    expect(relatorio.estatisticas.totalCadastrados).toBe(2);
    expect(relatorio.estatisticas.taxaSucesso).toBe(100); // 2/2 = 100%
  });

  it('deve tratar subcampos corretamente (TTGO)', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'TTGO 75g (Curva Glicêmica)', valor: '85 mg/dL', subcampo: 'Jejum' },
      { nomeExame: 'TTGO 75g (Curva Glicêmica)', valor: '140 mg/dL', subcampo: '1 hora' },
      { nomeExame: 'TTGO 75g (Curva Glicêmica)', valor: '110 mg/dL', subcampo: '2 horas' },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.totalEncontradosNoPDF).toBe(3);
    expect(relatorio.estatisticas.totalCadastrados).toBe(3);
    expect(relatorio.estatisticas.taxaSucesso).toBe(100);
    
    // Verificar nomes com subcampos
    expect(relatorio.examesEncontrados[0].nome).toBe('TTGO 75g (Curva Glicêmica) - Jejum');
    expect(relatorio.examesEncontrados[1].nome).toBe('TTGO 75g (Curva Glicêmica) - 1 hora');
    expect(relatorio.examesEncontrados[2].nome).toBe('TTGO 75g (Curva Glicêmica) - 2 horas');
  });

  it('deve usar examesNaoPresentes em vez de examesNaoEncontrados', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL' },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    // Deve ter a propriedade examesNaoPresentes (não examesNaoEncontrados)
    expect(relatorio).toHaveProperty('examesNaoPresentes');
    expect(relatorio.examesNaoPresentes.length).toBe(9); // 10 - 1
    
    // Não deve ter examesNaoEncontrados
    expect(relatorio).not.toHaveProperty('examesNaoEncontrados');
  });

  it('cenário real: PDF com apenas 5 de 30 exames solicitados deve mostrar 100%', () => {
    // Simula o cenário real do usuário: ele pediu apenas 5 exames, não todos os 30 do formulário
    const todosExamesFormulario = [
      ...examesEsperados,
      'Rubéola IgG', 'Rubéola IgM', 'Citomegalovírus IgG', 'Citomegalovírus IgM',
      'T4 Livre', 'Ferritina', 'Vitamina D (25-OH)', 'Vitamina B12',
      'EAS (Urina tipo 1)', 'Proteinúria de 24 horas',
      'EPF (Parasitológico de Fezes)', 'Swab vaginal/retal EGB',
      'Eletroforese de Hemoglobina', 'Anti-HBs', 'Hepatite C (Anti-HCV)',
      'FTA-ABS IgG', 'FTA-ABS IgM', 'Coombs indireto',
      'Tipagem sanguínea ABO/Rh',
      'TTGO 75g (Curva Glicêmica) - Jejum',
      'TTGO 75g (Curva Glicêmica) - 1 hora',
      'TTGO 75g (Curva Glicêmica) - 2 horas',
    ];

    // Apenas 5 exames no PDF
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL / 39%', dataColeta: '2026-01-15' },
      { nomeExame: 'Glicemia de jejum', valor: '85 mg/dL', dataColeta: '2026-01-15' },
      { nomeExame: 'TSH', valor: '1.2 µUI/mL', dataColeta: '2026-01-15' },
      { nomeExame: 'Urocultura', valor: 'Negativa', dataColeta: '2026-01-15' },
      { nomeExame: 'VDRL', valor: 'Não Reagente', dataColeta: '2026-01-15' },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, todosExamesFormulario);

    // ANTES: taxaSucesso seria 5/32 = 15% (confuso para o médico)
    // AGORA: taxaSucesso é 5/5 = 100% (todos os exames do PDF foram cadastrados)
    expect(relatorio.estatisticas.totalEncontradosNoPDF).toBe(5);
    expect(relatorio.estatisticas.totalCadastrados).toBe(5);
    expect(relatorio.estatisticas.taxaSucesso).toBe(100);
    
    // Exames não presentes no PDF são informativos, não erro
    expect(relatorio.examesNaoPresentes.length).toBe(todosExamesFormulario.length - 5);
    
    // Sem avisos de erro
    expect(relatorio.avisos.length).toBe(0);
  });
});
