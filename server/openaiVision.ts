/**
 * Módulo de integração com OpenAI GPT-4o Vision
 * Para interpretação de exames laboratoriais e ultrassons
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Chama a API do OpenAI com suporte a imagens (Vision)
 */
export async function invokeOpenAIVision(params: {
  systemPrompt: string;
  userPrompt: string;
  imageUrls: string[];
  maxTokens?: number;
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: params.systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: params.userPrompt },
        ...params.imageUrls.map(url => ({
          type: 'image_url' as const,
          image_url: { url, detail: 'high' as const }
        }))
      ]
    }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: params.maxTokens || 4096,
      temperature: 0.1, // Baixa temperatura para respostas mais consistentes
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Interpreta exames laboratoriais usando GPT-4o Vision
 */
export async function interpretarExamesLaboratoriais(params: {
  imageUrls: string[];
  trimestre: number;
}): Promise<any> {
  const systemPrompt = `Você é um assistente médico especializado em análise de exames laboratoriais de pré-natal.
Sua tarefa é extrair TODOS os dados dos exames das imagens fornecidas de forma precisa e estruturada.

IMPORTANTE:
- Extraia a DATA DO EXAME de cada documento (geralmente no cabeçalho ou rodapé)
- Extraia TODOS os parâmetros com seus valores, unidades e valores de referência
- Identifique se cada resultado está normal, alterado ou crítico
- Seja preciso com números e unidades

Responda SEMPRE em formato JSON válido.`;

  const userPrompt = `Analise estas imagens de exames laboratoriais do ${params.trimestre}º trimestre de gestação.

Extraia os dados no seguinte formato JSON:
{
  "dataExame": "YYYY-MM-DD",
  "laboratorio": "nome do laboratório se visível",
  "exames": [
    {
      "nome": "nome do exame",
      "resultado": "valor com unidade",
      "valorReferencia": "faixa de referência",
      "status": "normal" | "alterado" | "critico",
      "observacao": "observação se houver"
    }
  ],
  "observacoesGerais": "qualquer observação importante"
}

Se houver múltiplas páginas/imagens, consolide todos os resultados em uma única resposta.
Se a data não estiver visível, use null para dataExame.`;

  const response = await invokeOpenAIVision({
    systemPrompt,
    userPrompt,
    imageUrls: params.imageUrls,
  });

  // Tentar extrair JSON da resposta
  try {
    // Remover possíveis marcadores de código
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                      response.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, response];
    const jsonStr = jsonMatch[1] || response;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('Erro ao parsear resposta:', response);
    return { raw: response, parseError: true };
  }
}

/**
 * Interpreta ultrassons usando GPT-4o Vision
 */
export async function interpretarUltrassom(params: {
  imageUrls: string[];
  tipoUltrassom: string;
}): Promise<any> {
  const tiposDescricao: Record<string, string> = {
    'primeiro_ultrassom': 'Primeiro Ultrassom (6-8 semanas)',
    'morfologico_1tri': 'Morfológico de 1º Trimestre (11-14 semanas)',
    'ultrassom_obstetrico': 'Ultrassom Obstétrico de rotina',
    'morfologico_2tri': 'Morfológico de 2º Trimestre (20-24 semanas)',
    'ecocardiograma_fetal': 'Ecocardiograma Fetal',
    'ultrassom_seguimento': 'Ultrassom de Seguimento/Crescimento',
  };

  const tipoDescricao = tiposDescricao[params.tipoUltrassom] || params.tipoUltrassom;

  const systemPrompt = `Você é um assistente médico especializado em análise de laudos de ultrassonografia obstétrica.
Sua tarefa é extrair TODOS os dados do laudo de ultrassom de forma precisa e estruturada.

IMPORTANTE:
- Extraia a DATA DO EXAME (geralmente no cabeçalho)
- Extraia a IDADE GESTACIONAL no formato "Xs Yd" (semanas e dias)
- Extraia TODAS as medidas biométricas com suas unidades
- Identifique achados normais e alterados
- Seja preciso com números e medidas

Responda SEMPRE em formato JSON válido.`;

  const userPrompt = `Analise estas imagens de um laudo de ${tipoDescricao}.

Extraia os dados no seguinte formato JSON:
{
  "dataExame": "YYYY-MM-DD",
  "idadeGestacional": "Xs Yd",
  "tipoExame": "${params.tipoUltrassom}",
  "biometria": {
    "ccn": "valor em mm (se aplicável)",
    "dbp": "valor em mm",
    "cc": "valor em mm",
    "ca": "valor em mm",
    "cf": "valor em mm",
    "pesoFetal": "valor em gramas"
  },
  "liquidoAmniotico": {
    "ila": "valor em cm",
    "descricao": "normal/aumentado/diminuído"
  },
  "placenta": {
    "localizacao": "anterior/posterior/fúndica/lateral",
    "grau": "0/I/II/III"
  },
  "cordaoUmbilical": "3 vasos / 2 vasos",
  "apresentacao": "cefálica/pélvica/córmica",
  "fcf": "valor em bpm",
  "morfologia": {
    "cerebro": "normal/alterado + descrição",
    "face": "normal/alterado + descrição",
    "coluna": "normal/alterado + descrição",
    "coracao": "normal/alterado + descrição",
    "abdome": "normal/alterado + descrição",
    "rins": "normal/alterado + descrição",
    "membros": "normal/alterado + descrição"
  },
  "marcadores": {
    "tn": "valor em mm (translucência nucal)",
    "ossoNasal": "presente/ausente",
    "ductoVenoso": "normal/alterado",
    "regurgitacaoTricuspide": "presente/ausente"
  },
  "sexoFetal": "masculino/feminino/não visualizado",
  "conclusao": "texto da conclusão do laudo",
  "observacoes": "outras observações importantes"
}

Preencha apenas os campos que estiverem visíveis no laudo. Use null para campos não encontrados.
Se a data não estiver visível, tente extrair de qualquer parte do documento.`;

  const response = await invokeOpenAIVision({
    systemPrompt,
    userPrompt,
    imageUrls: params.imageUrls,
  });

  // Tentar extrair JSON da resposta
  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                      response.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, response];
    const jsonStr = jsonMatch[1] || response;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('Erro ao parsear resposta:', response);
    return { raw: response, parseError: true };
  }
}
