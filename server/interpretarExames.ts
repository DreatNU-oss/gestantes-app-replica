import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

interface ExameInterpretado {
  nomeExame: string;
  valor: string;
  subcampo?: string; // Para TTGO: "Jejum", "1 hora", "2 horas"
}

export async function interpretarExamesComIA(
  fileBuffer: Buffer,
  mimeType: string,
  trimestre: "primeiro" | "segundo" | "terceiro"
): Promise<Record<string, string>> {
  // 1. Upload do arquivo para S3
  const fileKey = `exames-temp/${Date.now()}-${Math.random().toString(36).substring(7)}.${mimeType.split('/')[1]}`;
  const { url: fileUrl } = await storagePut(fileKey, fileBuffer, mimeType);

  // 2. Preparar lista de exames esperados para o trimestre
  const examesEsperados = getExamesEsperadosPorTrimestre(trimestre);

  // 3. Chamar LLM com visão para interpretar o documento
  const prompt = `Você é um assistente médico especializado em interpretar resultados de exames laboratoriais de pré-natal.

Analise o documento fornecido (PDF ou imagem) e extraia APENAS os valores dos exames listados abaixo.

**REGRAS IMPORTANTES:**
1. Retorne APENAS os exames que estão presentes no documento
2. NÃO invente ou estime valores
3. Para cada exame encontrado, extraia o valor exato como está escrito
4. Ignore qualquer exame que não esteja na lista abaixo
5. Para exames com subcampos (como TTGO), retorne cada subcampo separadamente

**EXAMES ESPERADOS PARA ESTE TRIMESTRE:**
${examesEsperados.map(e => `- ${e}`).join('\n')}

**FORMATO DE RESPOSTA (JSON):**
Retorne um array de objetos com esta estrutura:
[
  { "nomeExame": "Hemoglobina/Hematócrito", "valor": "12.5 g/dL / 37%" },
  { "nomeExame": "Glicemia de jejum", "valor": "85 mg/dL" },
  { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "92 mg/dL", "subcampo": "Jejum" },
  { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "180 mg/dL", "subcampo": "1 hora" },
  { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "155 mg/dL", "subcampo": "2 horas" }
]

Se nenhum exame for encontrado, retorne um array vazio: []`;

  // Construir conteúdo multimodal baseado no tipo de arquivo
  const contentParts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file_url"; file_url: { url: string; mime_type?: "application/pdf" } }> = [
    { type: "text", text: prompt }
  ];

  if (mimeType.startsWith('image/')) {
    contentParts.push({
      type: "image_url",
      image_url: { url: fileUrl }
    });
  } else if (mimeType === 'application/pdf') {
    contentParts.push({
      type: "file_url",
      file_url: { url: fileUrl, mime_type: 'application/pdf' }
    });
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "user",
        content: contentParts
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "exames_interpretados",
        strict: true,
        schema: {
          type: "object",
          properties: {
            exames: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nomeExame: { type: "string", description: "Nome exato do exame conforme a lista fornecida" },
                  valor: { type: "string", description: "Valor do exame como está escrito no documento" },
                  subcampo: { type: "string", description: "Subcampo para exames com múltiplos valores (opcional)" }
                },
                required: ["nomeExame", "valor"],
                additionalProperties: false
              }
            }
          },
          required: ["exames"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== 'string') {
    throw new Error("LLM não retornou conteúdo válido");
  }

  const parsed = JSON.parse(content) as { exames: ExameInterpretado[] };

  // 4. Converter para formato esperado pelo frontend
  const resultados: Record<string, string> = {};
  
  for (const exame of parsed.exames) {
    if (exame.subcampo) {
      // Para exames com subcampos (TTGO)
      const chave = `${exame.nomeExame}__${exame.subcampo}`;
      resultados[chave] = exame.valor;
    } else {
      resultados[exame.nomeExame] = exame.valor;
    }
  }

  return resultados;
}

function getExamesEsperadosPorTrimestre(trimestre: "primeiro" | "segundo" | "terceiro"): string[] {
  // Lista completa de exames organizados por categoria
  const todosExames = [
    // Exames de Sangue
    { nome: "Tipagem sanguínea ABO/Rh", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "Coombs indireto", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Hemoglobina/Hematócrito", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Plaquetas", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Glicemia de jejum", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "VDRL", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "FTA-ABS IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "FTA-ABS IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "HIV", trimestres: { primeiro: true, segundo: false, terceiro: true } },
    { nome: "Hepatite B (HBsAg)", trimestres: { primeiro: true, segundo: false, terceiro: true } },
    { nome: "Hepatite C (Anti-HCV)", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "Toxoplasmose IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Toxoplasmose IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Rubéola IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Rubéola IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Citomegalovírus IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Citomegalovírus IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "TSH", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "T4 Livre", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "Eletroforese de Hemoglobina", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "Ferritina", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Vitamina D (25-OH)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Vitamina B12", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "TTGO 75g (Curva Glicêmica)", trimestres: { primeiro: false, segundo: true, terceiro: false }, subcampos: ["Jejum", "1 hora", "2 horas"] },
    // Exames de Urina
    { nome: "EAS (Urina tipo 1)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Urocultura", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Proteinúria de 24 horas", trimestres: { primeiro: false, segundo: false, terceiro: true } },
    // Exames de Fezes
    { nome: "EPF (Parasitológico de Fezes)", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    // Outros Exames
    { nome: "Swab vaginal/retal EGB", trimestres: { primeiro: false, segundo: false, terceiro: true } },
  ];

  const examesDoTrimestre: string[] = [];

  for (const exame of todosExames) {
    if (exame.trimestres[trimestre]) {
      if (exame.subcampos) {
        // Para exames com subcampos, adicionar cada subcampo
        for (const subcampo of exame.subcampos) {
          examesDoTrimestre.push(`${exame.nome} - ${subcampo}`);
        }
      } else {
        examesDoTrimestre.push(exame.nome);
      }
    }
  }

  return examesDoTrimestre;
}
