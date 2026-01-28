import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interpretarExamesComIA } from './interpretarExames';
import * as llm from './_core/llm';
import * as storage from './storage';

// Mock das dependências
vi.mock('./_core/llm');
vi.mock('./storage');

describe('Interpretação de Exames com IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve interpretar exames de PDF do 1º trimestre corretamente', async () => {
    // Arrange
    const mockFileBuffer = Buffer.from('fake-pdf-content');
    const mockFileUrl = 'https://s3.example.com/exames-temp/test.pdf';
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.pdf',
      url: mockFileUrl,
    });

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            exames: [
              { nomeExame: 'Tipagem sanguínea ABO/Rh', valor: 'O+' },
              { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL / 37%' },
              { nomeExame: 'Glicemia de jejum', valor: '85 mg/dL' },
            ],
          }),
        },
      }],
    } as any);

    // Act
    const resultados = await interpretarExamesComIA(
      mockFileBuffer,
      'application/pdf',
      'primeiro'
    );

    // Assert
    expect(storage.storagePut).toHaveBeenCalledWith(
      expect.stringContaining('exames-temp/'),
      mockFileBuffer,
      'application/pdf'
    );

    expect(llm.invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({ type: 'text' }),
              expect.objectContaining({
                type: 'file_url',
                file_url: { url: mockFileUrl, mime_type: 'application/pdf' },
              }),
            ]),
          }),
        ]),
        response_format: expect.objectContaining({
          type: 'json_schema',
        }),
      })
    );

    expect(resultados).toEqual({
      resultados: {
        'Tipagem sanguínea ABO/Rh': 'O+',
        'Hemoglobina/Hematócrito': '12.5 g/dL / 37%',
        'Glicemia de jejum': '85 mg/dL',
      },
      dataColeta: undefined, // Nenhuma data no mock
    });
  });

  it('deve interpretar exames de imagem do 2º trimestre com TTGO', async () => {
    // Arrange
    const mockFileBuffer = Buffer.from('fake-image-content');
    const mockFileUrl = 'https://s3.example.com/exames-temp/test.jpg';
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: mockFileUrl,
    });

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            exames: [
              { nomeExame: 'Hemoglobina/Hematócrito', valor: '11.8 g/dL / 35%' },
              { nomeExame: 'TTGO 75g (Curva Glicêmica)', valor: '92 mg/dL', subcampo: 'Jejum' },
              { nomeExame: 'TTGO 75g (Curva Glicêmica)', valor: '180 mg/dL', subcampo: '1 hora' },
              { nomeExame: 'TTGO 75g (Curva Glicêmica)', valor: '155 mg/dL', subcampo: '2 horas' },
            ],
          }),
        },
      }],
    } as any);

    // Act
    const resultados = await interpretarExamesComIA(
      mockFileBuffer,
      'image/jpeg',
      'segundo'
    );

    // Assert
    expect(llm.invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({ type: 'text' }),
              expect.objectContaining({
                type: 'image_url',
                image_url: { url: mockFileUrl },
              }),
            ]),
          }),
        ]),
      })
    );

    expect(resultados).toEqual({
      resultados: {
        'Hemoglobina/Hematócrito': '11.8 g/dL / 35%',
        'TTGO 75g (Curva Glicêmica)__Jejum': '92 mg/dL',
        'TTGO 75g (Curva Glicêmica)__1 hora': '180 mg/dL',
        'TTGO 75g (Curva Glicêmica)__2 horas': '155 mg/dL',
      },
      dataColeta: undefined, // Nenhuma data no mock
    });
  });

  it('deve retornar objeto vazio quando nenhum exame for encontrado', async () => {
    // Arrange
    const mockFileBuffer = Buffer.from('fake-content');
    const mockFileUrl = 'https://s3.example.com/exames-temp/test.pdf';
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.pdf',
      url: mockFileUrl,
    });

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            exames: [],
          }),
        },
      }],
    } as any);

    // Act
    const resultados = await interpretarExamesComIA(
      mockFileBuffer,
      'application/pdf',
      'terceiro'
    );

    // Assert
    expect(resultados).toEqual({
      resultados: {},
      dataColeta: undefined,
    });
  });

  it('deve lançar erro quando LLM não retorna conteúdo', async () => {
    // Arrange
    const mockFileBuffer = Buffer.from('fake-content');
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.pdf',
      url: 'https://s3.example.com/test.pdf',
    });

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{
        message: {
          content: null,
        },
      }],
    } as any);

    // Act & Assert
    await expect(
      interpretarExamesComIA(mockFileBuffer, 'application/pdf', 'primeiro')
    ).rejects.toThrow('LLM não retornou conteúdo válido');
  });

  it('deve incluir apenas exames do trimestre selecionado no prompt', async () => {
    // Arrange
    const mockFileBuffer = Buffer.from('fake-content');
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.pdf',
      url: 'https://s3.example.com/test.pdf',
    });

    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({ exames: [] }),
        },
      }],
    } as any);

    // Act
    await interpretarExamesComIA(mockFileBuffer, 'application/pdf', 'primeiro');

    // Assert
    const llmCall = vi.mocked(llm.invokeLLM).mock.calls[0][0];
    const promptContent = (llmCall.messages[0].content as any[]).find(
      (c: any) => c.type === 'text'
    )?.text;

    // Extrair apenas a seção de exames esperados
    const examesEsperadosSection = promptContent.split('**EXAMES ESPERADOS PARA ESTE TRIMESTRE:**')[1]?.split('**FORMATO DE RESPOSTA')[0];

    // Verificar que exames do 1º trimestre estão incluídos na lista
    expect(examesEsperadosSection).toContain('Tipagem sanguínea ABO/Rh');
    expect(examesEsperadosSection).toContain('Glicemia de jejum');
    expect(examesEsperadosSection).toContain('EPF (Parasitológico de Fezes)');
    
    // Verificar que exames exclusivos do 2º trimestre NÃO estão na lista
    expect(examesEsperadosSection).not.toContain('TTGO 75g (Curva Glicêmica) - Jejum');
    expect(examesEsperadosSection).not.toContain('Proteinúria de 24 horas');
  });
});


// Testes para a função de geração de relatório de extração
describe('gerarRelatorioExtracao', () => {
  // Tipos para os testes
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
    examesNaoEncontrados: string[];
    estatisticas: {
      totalEsperado: number;
      totalEncontrado: number;
      taxaSucesso: number;
    };
    avisos: string[];
  }

  // Função de normalização de nomes
  function normalizarNome(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  // Função de geração de relatório (copiada para teste isolado)
  function gerarRelatorioExtracao(
    examesExtraidos: ExameComTrimestre[],
    examesEsperados: string[]
  ): RelatorioExtracao {
    const avisos: string[] = [];
    
    const examesEsperadosMap = new Map<string, string>();
    for (const exame of examesEsperados) {
      examesEsperadosMap.set(normalizarNome(exame), exame);
    }
    
    const examesEncontrados: RelatorioExtracao['examesEncontrados'] = [];
    const nomesEncontrados = new Set<string>();
    
    for (const exame of examesExtraidos) {
      examesEncontrados.push({
        nome: exame.subcampo ? `${exame.nomeExame} - ${exame.subcampo}` : exame.nomeExame,
        valor: exame.valor,
        dataColeta: exame.dataColeta,
        trimestre: exame.trimestre
      });
      
      nomesEncontrados.add(normalizarNome(exame.nomeExame));
      
      if (!exame.valor || exame.valor.trim() === '') {
        avisos.push(`O exame "${exame.nomeExame}" foi encontrado mas não possui valor.`);
      }
    }
    
    const examesNaoEncontrados: string[] = [];
    
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
        examesNaoEncontrados.push(exameEsperado);
      }
    }
    
    const totalEsperado = examesEsperados.length;
    const totalEncontrado = examesEncontrados.length;
    const taxaSucesso = totalEsperado > 0 ? Math.round((totalEncontrado / totalEsperado) * 100) : 0;
    
    if (totalEncontrado === 0) {
      avisos.push('Nenhum exame foi encontrado no documento. Verifique se o arquivo está legível e contém resultados de exames laboratoriais.');
    } else if (taxaSucesso < 50) {
      avisos.push(`Apenas ${taxaSucesso}% dos exames esperados foram encontrados. O documento pode estar incompleto ou ilegível.`);
    }
    
    if (examesNaoEncontrados.length > 0 && examesNaoEncontrados.length <= 5) {
      avisos.push(`Os seguintes exames não foram encontrados: ${examesNaoEncontrados.join(', ')}.`);
    } else if (examesNaoEncontrados.length > 5) {
      avisos.push(`${examesNaoEncontrados.length} exames não foram encontrados no documento.`);
    }
    
    return {
      examesEncontrados,
      examesNaoEncontrados,
      estatisticas: {
        totalEsperado,
        totalEncontrado,
        taxaSucesso
      },
      avisos
    };
  }

  const examesEsperados = [
    'Hemoglobina/Hematócrito',
    'Plaquetas',
    'VDRL',
    'HIV',
    'Toxoplasmose IgG',
    'Toxoplasmose IgM',
    'Urocultura',
    'EAS (Urina tipo 1)'
  ];

  it('deve gerar relatório com todos os exames encontrados', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '14.6 g/dL / 44.1%', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'Plaquetas', valor: '191.000 /mm³', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'VDRL', valor: 'Negativo', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'HIV', valor: 'Não Reagente', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'Toxoplasmose IgG', valor: 'Não Reagente', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'Toxoplasmose IgM', valor: 'Não Reagente', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'Urocultura', valor: 'Positiva', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'EAS (Urina tipo 1)', valor: 'Alterado', dataColeta: '2026-01-15', trimestre: 2 },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.totalEncontrado).toBe(8);
    expect(relatorio.estatisticas.totalEsperado).toBe(8);
    expect(relatorio.estatisticas.taxaSucesso).toBe(100);
    expect(relatorio.examesNaoEncontrados).toHaveLength(0);
    expect(relatorio.examesEncontrados).toHaveLength(8);
  });

  it('deve identificar exames não encontrados', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '14.6 g/dL / 44.1%', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'Plaquetas', valor: '191.000 /mm³', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'VDRL', valor: 'Negativo', dataColeta: '2026-01-15', trimestre: 2 },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.totalEncontrado).toBe(3);
    expect(relatorio.estatisticas.totalEsperado).toBe(8);
    expect(relatorio.estatisticas.taxaSucesso).toBe(38);
    expect(relatorio.examesNaoEncontrados.length).toBeGreaterThan(0);
    expect(relatorio.examesNaoEncontrados).toContain('HIV');
    expect(relatorio.examesNaoEncontrados).toContain('Toxoplasmose IgG');
  });

  it('deve gerar aviso quando nenhum exame é encontrado', () => {
    const examesExtraidos: ExameComTrimestre[] = [];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.totalEncontrado).toBe(0);
    expect(relatorio.estatisticas.taxaSucesso).toBe(0);
    expect(relatorio.avisos).toContain('Nenhum exame foi encontrado no documento. Verifique se o arquivo está legível e contém resultados de exames laboratoriais.');
  });

  it('deve gerar aviso quando taxa de sucesso é baixa', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '14.6 g/dL / 44.1%', dataColeta: '2026-01-15', trimestre: 2 },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.estatisticas.taxaSucesso).toBeLessThan(50);
    expect(relatorio.avisos.some(a => a.includes('% dos exames esperados foram encontrados'))).toBe(true);
  });

  it('deve gerar aviso quando exame não possui valor', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '', dataColeta: '2026-01-15', trimestre: 2 },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.avisos.some(a => a.includes('foi encontrado mas não possui valor'))).toBe(true);
  });

  it('deve tratar exames com subcampos corretamente', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'TTGO 75g (Curva Glicêmica)', subcampo: 'Jejum', valor: '85 mg/dL', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'TTGO 75g (Curva Glicêmica)', subcampo: '1 hora', valor: '140 mg/dL', dataColeta: '2026-01-15', trimestre: 2 },
      { nomeExame: 'TTGO 75g (Curva Glicêmica)', subcampo: '2 horas', valor: '120 mg/dL', dataColeta: '2026-01-15', trimestre: 2 },
    ];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, ['TTGO 75g (Curva Glicêmica)']);

    expect(relatorio.examesEncontrados).toHaveLength(3);
    expect(relatorio.examesEncontrados[0].nome).toBe('TTGO 75g (Curva Glicêmica) - Jejum');
    expect(relatorio.examesEncontrados[1].nome).toBe('TTGO 75g (Curva Glicêmica) - 1 hora');
    expect(relatorio.examesEncontrados[2].nome).toBe('TTGO 75g (Curva Glicêmica) - 2 horas');
  });
});
