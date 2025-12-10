import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

interface ExameInterpretado {
  nomeExame: string;
  valor: string;
  subcampo?: string; // Para TTGO: "Jejum", "1 hora", "2 horas"
  dataColeta?: string; // Data da coleta do exame (formato YYYY-MM-DD)
}

export async function interpretarExamesComIA(
  fileBuffer: Buffer,
  mimeType: string,
  trimestre: "primeiro" | "segundo" | "terceiro"
): Promise<{ resultados: Record<string, string>; dataColeta?: string }> {
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

**ATENÇÃO ESPECIAL PARA TOTG/TTGO (Curva Glicêmica):**
- Pode aparecer como: "TOTG", "TTGO", "Curva de Tolerância à Glicose", "Teste Oral de Tolerância à Glicose", "Curva Glicêmica"
- SEMPRE tem 3 valores obrigatórios: Jejum, 1 hora (ou 1h, 1ª Hora), 2 horas (ou 2h, 2ª Hora)
- **REGRA CRÍTICA**: Se você encontrar o título "CURVA DE TOLERÂNCIA À GLICOSE" ou "CURVA GLICÊMICA" no documento, você DEVE extrair os 3 valores (Jejum, 1ª Hora, 2ª Hora) como subcampos do exame "TTGO 75g (Curva Glicêmica)"
- Ignore qualquer resultado de "GLICOSE" isolado se houver "CURVA DE TOLERÂNCIA" no mesmo documento
- Os 3 valores podem estar na mesma página ou em páginas diferentes - procure em todo o documento
- Extraia TODOS os 3 valores como subcampos separados do exame "TTGO 75g (Curva Glicêmica)"

**EXAMES ESPERADOS PARA ESTE TRIMESTRE:**
${examesEsperados.map(e => `- ${e}`).join('\n')}

**FORMATO DE RESPOSTA (JSON):**
Retorne um array de objetos com esta estrutura:
[
  { "nomeExame": "Hemoglobina/Hematócrito", "valor": "12.5 g/dL / 37%", "dataColeta": "2025-11-11" },
  { "nomeExame": "Glicemia de jejum", "valor": "85 mg/dL", "dataColeta": "2025-11-11" },
  { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "71 mg/dL", "subcampo": "Jejum", "dataColeta": "2025-11-11" },
  { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "156 mg/dL", "subcampo": "1 hora", "dataColeta": "2025-11-11" },
  { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "109 mg/dL", "subcampo": "2 horas", "dataColeta": "2025-11-11" }
]

**EXEMPLO DE TOTG/TTGO NO DOCUMENTO:**
Se você encontrar:
- "GLICOSE: 71 mg/dL" (página 1)
- "CURVA DE TOLERÂNCIA À GLICOSE" com "Jejum: 71 mg/dL", "1ª Hora: 156 mg/dL", "2ª Hora: 109 mg/dL" (página 2)

Retorne os 3 valores como subcampos do "TTGO 75g (Curva Glicêmica)" conforme exemplo acima.

**IMPORTANTE:** Extraia a data da coleta do exame se estiver visível no documento (formato YYYY-MM-DD). Se não encontrar a data, omita o campo "dataColeta".

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
                  subcampo: { type: "string", description: "Subcampo para exames com múltiplos valores (opcional)" },
                  dataColeta: { type: "string", description: "Data da coleta do exame no formato YYYY-MM-DD (opcional)" }
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
  let dataColeta: string | undefined = undefined;
  
  console.log("[DEBUG] Parsed exames:", JSON.stringify(parsed.exames, null, 2));
  
  for (const exame of parsed.exames) {
    // Capturar data da coleta (assumindo que todos os exames do mesmo laudo têm a mesma data)
    if (exame.dataColeta && !dataColeta) {
      dataColeta = exame.dataColeta;
    }
    
    if (exame.subcampo) {
      // Para exames com subcampos (TTGO)
      const chave = `${exame.nomeExame}__${exame.subcampo}`;
      console.log(`[DEBUG] TTGO subcampo: ${chave} = ${exame.valor}`);
      resultados[chave] = exame.valor;
    } else {
      resultados[exame.nomeExame] = exame.valor;
    }
  }
  
  console.log("[DEBUG] Resultados finais:", JSON.stringify(resultados, null, 2));
  console.log("[DEBUG] Data coleta:", dataColeta);

  return { resultados, dataColeta };
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
    { nome: "Anti-HBs", trimestres: { primeiro: true, segundo: true, terceiro: true } },
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
