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
