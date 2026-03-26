import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interpretarExamesComIA } from './interpretarExames';
import * as storage from './storage';

// Mock do storage (para storagePut)
vi.mock('./storage');

// Mock do fetch global (a função usa fetch diretamente para OpenAI, não invokeLLM)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock do pdf-to-png-converter (para evitar erro ao processar fake PDFs)
vi.mock('pdf-to-png-converter', () => ({
  pdfToPng: vi.fn().mockResolvedValue([
    { content: Buffer.from('fake-png'), name: 'page-1.png' },
  ]),
}));

describe('Interpretação de Exames com IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar OPENAI_API_KEY no env
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('deve interpretar exames de imagem do 1º trimestre corretamente', async () => {
    const mockFileBuffer = Buffer.from('fake-image-content');
    const mockFileUrl = 'https://s3.example.com/exames-temp/test.jpg';
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: mockFileUrl,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    });

    const resultado = await interpretarExamesComIA(
      mockFileBuffer,
      'image/jpeg',
      'primeiro'
    );

    expect(storage.storagePut).toHaveBeenCalledWith(
      expect.stringContaining('exames-temp/'),
      mockFileBuffer,
      'image/jpeg'
    );

    // Resultados incluem sufixo ::trimestre quando trimestre é especificado
    expect(resultado.resultados['Tipagem sanguínea ABO/Rh::1']).toBe('O+');
    expect(resultado.resultados['Hemoglobina/Hematócrito::1']).toBe('12.5 g/dL / 37%');
    expect(resultado.resultados['Glicemia de jejum::1']).toBe('85 mg/dL');
    expect(resultado.relatorio).toBeDefined();
  });

  it('deve interpretar exames de imagem do 2º trimestre com TTGO', async () => {
    const mockFileBuffer = Buffer.from('fake-image-content');
    const mockFileUrl = 'https://s3.example.com/exames-temp/test.jpg';
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: mockFileUrl,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    });

    const resultado = await interpretarExamesComIA(
      mockFileBuffer,
      'image/jpeg',
      'segundo'
    );

    // Resultados incluem sufixo ::trimestre
    expect(resultado.resultados['Hemoglobina/Hematócrito::2']).toBe('11.8 g/dL / 35%');
    expect(resultado.resultados['TTGO 75g (Curva Glicêmica)__Jejum::2']).toBe('92 mg/dL');
    expect(resultado.resultados['TTGO 75g (Curva Glicêmica)__1 hora::2']).toBe('180 mg/dL');
    expect(resultado.resultados['TTGO 75g (Curva Glicêmica)__2 horas::2']).toBe('155 mg/dL');
    expect(resultado.relatorio).toBeDefined();
  });

  it('deve retornar objeto vazio quando nenhum exame for encontrado', async () => {
    const mockFileBuffer = Buffer.from('fake-image-content');
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: 'https://s3.example.com/exames-temp/test.jpg',
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({ exames: [] }),
          },
        }],
      }),
    });

    const resultado = await interpretarExamesComIA(
      mockFileBuffer,
      'image/jpeg',
      'terceiro'
    );

    expect(resultado.resultados).toEqual({});
  });

  it('deve lançar erro quando LLM não retorna conteúdo', async () => {
    const mockFileBuffer = Buffer.from('fake-image-content');
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: 'https://s3.example.com/test.jpg',
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: null,
          },
        }],
      }),
    });

    await expect(
      interpretarExamesComIA(mockFileBuffer, 'image/jpeg', 'primeiro')
    ).rejects.toThrow('LLM não retornou conteúdo válido');
  });

  it('deve incluir apenas exames do trimestre selecionado no prompt', async () => {
    const mockFileBuffer = Buffer.from('fake-image-content');
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: 'https://s3.example.com/test.jpg',
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({ exames: [] }),
          },
        }],
      }),
    });

    await interpretarExamesComIA(mockFileBuffer, 'image/jpeg', 'primeiro');

    // Verificar que fetch foi chamado com o prompt correto
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const userMessage = body.messages.find((m: any) => m.role === 'user');
    const promptText = userMessage.content.find((c: any) => c.type === 'text')?.text;

    // Verificar que exames do 1º trimestre estão incluídos
    expect(promptText).toContain('Tipagem sanguínea ABO/Rh');
    expect(promptText).toContain('Glicemia de jejum');
    expect(promptText).toContain('EPF (Parasitológico de Fezes)');
    
    // Verificar que a seção EXAMES ESPERADOS não contém exames exclusivos do 3º trimestre
    const examesSection = promptText.split('**EXAMES ESPERADOS:**')[1]?.split('**FORMATO DE RESPOSTA')[0] || '';
    // Proteinúria de 24h é exclusiva do 3º trimestre, não deve estar na lista de esperados do 1º tri
    expect(examesSection).not.toContain('Proteinúria de 24 horas');
  });

  it('deve lançar erro quando OpenAI retorna status não-ok', async () => {
    const mockFileBuffer = Buffer.from('fake-image-content');
    
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: 'exames-temp/test.jpg',
      url: 'https://s3.example.com/test.jpg',
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    });

    await expect(
      interpretarExamesComIA(mockFileBuffer, 'image/jpeg', 'primeiro')
    ).rejects.toThrow('OpenAI API error: 429');
  });
});


// Testes para a função de geração de relatório de extração
describe('gerarRelatorioExtracao', () => {
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

  function normalizarNome(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

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
      avisos.push(`Exames não encontrados: ${examesNaoEncontrados.join(', ')}`);
    }
    
    return {
      examesEncontrados,
      examesNaoEncontrados,
      estatisticas: {
        totalEsperado,
        totalEncontrado,
        taxaSucesso,
      },
      avisos,
    };
  }

  it('deve gerar relatório com exames encontrados e não encontrados', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL / 37%' },
      { nomeExame: 'Glicemia de jejum', valor: '85 mg/dL' },
    ];
    const examesEsperados = ['Hemoglobina/Hematócrito', 'Glicemia de jejum', 'VDRL', 'HIV'];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);

    expect(relatorio.examesEncontrados).toHaveLength(2);
    expect(relatorio.examesNaoEncontrados).toContain('VDRL');
    expect(relatorio.examesNaoEncontrados).toContain('HIV');
    expect(relatorio.estatisticas.totalEsperado).toBe(4);
    expect(relatorio.estatisticas.totalEncontrado).toBe(2);
    expect(relatorio.estatisticas.taxaSucesso).toBe(50);
  });

  it('deve gerar aviso quando nenhum exame é encontrado', () => {
    const relatorio = gerarRelatorioExtracao([], ['VDRL', 'HIV']);
    expect(relatorio.avisos).toContain('Nenhum exame foi encontrado no documento. Verifique se o arquivo está legível e contém resultados de exames laboratoriais.');
  });

  it('deve gerar aviso quando taxa de sucesso é baixa', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'Hemoglobina/Hematócrito', valor: '12.5 g/dL / 37%' },
    ];
    const examesEsperados = ['Hemoglobina/Hematócrito', 'Glicemia de jejum', 'VDRL', 'HIV', 'TSH'];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);
    expect(relatorio.avisos.some(a => a.includes('20%'))).toBe(true);
  });

  it('deve lidar com subcampos (TTGO)', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'TTGO 75g', valor: '92 mg/dL', subcampo: 'Jejum' },
      { nomeExame: 'TTGO 75g', valor: '180 mg/dL', subcampo: '1 hora' },
    ];
    const examesEsperados = ['TTGO 75g'];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);
    expect(relatorio.examesEncontrados).toHaveLength(2);
    expect(relatorio.examesEncontrados[0].nome).toBe('TTGO 75g - Jejum');
  });

  it('deve gerar aviso para exame sem valor', () => {
    const examesExtraidos: ExameComTrimestre[] = [
      { nomeExame: 'VDRL', valor: '' },
    ];
    const examesEsperados = ['VDRL'];

    const relatorio = gerarRelatorioExtracao(examesExtraidos, examesEsperados);
    expect(relatorio.avisos).toContain('O exame "VDRL" foi encontrado mas não possui valor.');
  });
});
