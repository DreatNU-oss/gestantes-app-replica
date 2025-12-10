import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

// Tipos de ultrassom suportados
export type TipoUltrassom =
  | "primeiro_ultrassom"
  | "morfologico_1tri"
  | "ultrassom_obstetrico"
  | "morfologico_2tri"
  | "ecocardiograma"
  | "ultrassom_seguimento";

// Campos esperados por tipo de ultrassom
const camposPorTipo: Record<TipoUltrassom, string[]> = {
  primeiro_ultrassom: [
    "dataExame",
    "idadeGestacional",
    "ccn",
    "bcf",
    "sacoVitelino",
    "hematoma",
    "corpoLuteo",
    "dpp",
  ],
  morfologico_1tri: [
    "dataExame",
    "idadeGestacional",
    "tn",
    "dv",
    "valvaTricuspide",
    "dopplerUterinas",
    "colo",
    "riscoTrissomias",
  ],
  ultrassom_obstetrico: [
    "dataExame",
    "idadeGestacional",
    "pesoFetal",
    "placenta",
    "coloUterino",
  ],
  morfologico_2tri: [
    "dataExame",
    "idadeGestacional",
    "dbp",
    "cc",
    "ca",
    "cf",
    "pesoFetal",
    "placenta",
    "ila",
    "anatomia",
    "dopplerUmbilical",
    "dopplerCerebral",
    "dopplerUterinas",
    "sexo",
  ],
  ecocardiograma: ["dataExame", "idadeGestacional", "conclusao"],
  ultrassom_seguimento: [
    "dataExame",
    "idadeGestacional",
    "pesoFetal",
    "percentil",
    "ila",
    "placenta",
    "movimentos",
    "apresentacao",
    "dopplerUmbilical",
    "dopplerCerebral",
    "dopplerUterinas",
  ],
};

/**
 * Interpreta um laudo de ultrassom (PDF ou imagem) e extrai dados estruturados
 */
export async function interpretarLaudoUltrassom(
  fileUrl: string,
  tipoUltrassom: TipoUltrassom,
  mimeType: string
): Promise<Record<string, string>> {
  const camposEsperados = camposPorTipo[tipoUltrassom];

  // Construir prompt para a IA
  const prompt = `Você é um assistente médico especializado em interpretar laudos de ultrassom pré-natal.

Analise o laudo de ultrassom fornecido e extraia APENAS os seguintes dados:

${camposEsperados.map((campo) => `- ${campo}`).join("\n")}

INSTRUÇÕES IMPORTANTES:
1. Retorne APENAS os valores encontrados no laudo
2. Se um campo não estiver presente no laudo, NÃO inclua no resultado
3. Mantenha os valores EXATAMENTE como aparecem no laudo (com unidades de medida)
4. Para campos de data, use formato DD/MM/AAAA
5. Para idade gestacional, use formato "X semanas e X dias" ou "Xs Xd"
6. Retorne um objeto JSON válido no formato: {"campo": "valor"}

EXEMPLO de formato de resposta:
{
  "dataExame": "05/12/2025",
  "idadeGestacional": "12 semanas e 3 dias",
  "ccn": "58 mm",
  "bcf": "152 bpm"
}

Agora analise o laudo e extraia os dados:`;

  try {
    // Determinar tipo de conteúdo para o LLM
    let content: any;
    if (mimeType.startsWith("image/")) {
      content = [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: fileUrl,
            detail: "high",
          },
        },
      ];
    } else if (mimeType === "application/pdf") {
      content = [
        { type: "text", text: prompt },
        {
          type: "file_url",
          file_url: {
            url: fileUrl,
            mime_type: "application/pdf",
          },
        },
      ];
    } else if (mimeType === "text/plain" && fileUrl.startsWith("data:")) {
      // Para testes: extrair texto do data URL
      const base64Data = fileUrl.split(",")[1];
      const textoLaudo = Buffer.from(base64Data, "base64").toString("utf-8");
      content = `${prompt}\n\nLAUDO:\n${textoLaudo}`;
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
    }

    // Chamar LLM
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const resultText = response.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error("LLM não retornou conteúdo");
    }

    // Garantir que resultText é string
    const textContent = typeof resultText === 'string' ? resultText : JSON.stringify(resultText);

    // Extrair JSON da resposta (pode vir com markdown)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta do LLM");
    }

    const dadosExtraidos = JSON.parse(jsonMatch[0]);

    // Validar que apenas campos esperados foram retornados
    const dadosFiltrados: Record<string, string> = {};
    for (const campo of camposEsperados) {
      if (dadosExtraidos[campo]) {
        dadosFiltrados[campo] = String(dadosExtraidos[campo]);
      }
    }

    return dadosFiltrados;
  } catch (error) {
    console.error("Erro ao interpretar laudo de ultrassom:", error);
    throw error;
  }
}
