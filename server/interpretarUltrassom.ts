// Usando OpenAI GPT-4o Vision para melhor extração de dados
// import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

**IMPORTANTE:** Você receberá múltiplas imagens representando diferentes páginas do mesmo documento. Analise TODAS as imagens antes de responder.

Analise o laudo de ultrassom fornecido e extraia APENAS os seguintes dados:

${camposEsperados.map((campo) => `- ${campo}`).join("\n")}

INSTRUÇÕES IMPORTANTES:
1. **SEMPRE extraia a data do exame (dataExame)** - procure por datas no cabeçalho, rodapé ou corpo do laudo
2. Retorne APENAS os valores encontrados no laudo
3. Se um campo não estiver presente no laudo, NÃO inclua no resultado
4. Mantenha os valores EXATAMENTE como aparecem no laudo (com unidades de medida)
5. Para campos de data, use formato DD/MM/AAAA
6. Para idade gestacional, use formato "X semanas e X dias" ou "Xs Xd"
7. Retorne um objeto JSON válido no formato: {"campo": "valor"}

EXEMPLO de formato de resposta:
{
  "dataExame": "05/12/2025",
  "idadeGestacional": "12 semanas e 3 dias",
  "ccn": "58 mm",
  "bcf": "152 bpm"
}

Agora analise o laudo e extraia os dados:`;

  try {
    // Usar OpenAI GPT-4o Vision para melhor extração
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Construir mensagem com imagem para GPT-4o
    const userContent: any[] = [
      { type: 'text', text: prompt }
    ];

    if (mimeType.startsWith("image/")) {
      userContent.push({
        type: 'image_url',
        image_url: { url: fileUrl, detail: 'high' }
      });
    } else if (mimeType === "application/pdf") {
      // Para PDF, converter TODAS as páginas para imagens usando biblioteca JavaScript pura
      try {
        const response = await fetch(fileUrl);
        const fileBuffer = Buffer.from(await response.arrayBuffer());
        
        const { pdfToPng } = await import('pdf-to-png-converter');
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        const tempPdfPath = path.join(tempDir, `ultrassom-${timestamp}.pdf`);
        
        // Salvar PDF temporário
        await fs.promises.writeFile(tempPdfPath, fileBuffer);
        
        console.log('[Ultrassom] Convertendo PDF para PNG...');
        
        // Converter PDF para PNG (máximo 10 páginas)
        const pngPages = await pdfToPng(tempPdfPath, {
          outputFolder: tempDir,
          pagesToProcess: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        });
        
        console.log(`[Ultrassom] PDF convertido: ${pngPages.length} página(s)`);
        
        // Upload de todas as imagens para S3
        for (let i = 0; i < pngPages.length; i++) {
          const page = pngPages[i];
          
          try {
            // Upload da imagem para S3
            const imageKey = `ultrassom-temp/${timestamp}-page${i + 1}.png`;
            if (!page.content) {
              console.warn(`[Ultrassom] Página ${i + 1} sem conteúdo`);
              continue;
            }
            const { url: imageUrl } = await storagePut(imageKey, page.content, 'image/png');
            
            // Adicionar imagem ao conteúdo
            userContent.push({
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            });
            
            console.log(`[Ultrassom] Página ${i + 1} enviada para S3`);
          } catch (err) {
            console.warn(`[Ultrassom] Não foi possível processar página ${i + 1}:`, err);
          }
        }
        
        // Limpar arquivo PDF temporário
        await fs.promises.unlink(tempPdfPath).catch(() => {});
        
        if (userContent.length === 1) {
          throw new Error('Nenhuma página foi convertida com sucesso');
        }
      } catch (error) {
        console.error('[Ultrassom] Erro ao converter PDF:', error);
        throw new Error('Não foi possível processar o PDF. Tente converter para imagem (JPG/PNG).');
      }
    } else if (mimeType === "text/plain" && fileUrl.startsWith("data:")) {
      // Para testes: extrair texto do data URL
      const base64Data = fileUrl.split(",")[1];
      const textoLaudo = Buffer.from(base64Data, "base64").toString("utf-8");
      userContent[0] = { type: 'text', text: `${prompt}\n\nLAUDO:\n${textoLaudo}` };
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
    }

    // Chamar OpenAI GPT-4o
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente médico especializado em análise de laudos de ultrassom obstétrico. IMPORTANTE: Sempre extraia a DATA DO EXAME do documento. Responda em JSON válido.'
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const response = await openaiResponse.json();
    const resultText = response.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error("OpenAI não retornou conteúdo");
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
