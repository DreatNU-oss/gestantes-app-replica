// Usando OpenAI GPT-4o Vision para melhor extração de dados
import { storagePut } from "./storage";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

Analise TODAS as páginas do documento fornecido (PDF ou imagem) e extraia APENAS os valores dos exames listados abaixo.

**IMPORTANTE:** Você receberá múltiplas imagens representando diferentes páginas do mesmo documento. Analise TODAS as imagens antes de responder.

**REGRAS IMPORTANTES:**
1. Retorne APENAS os exames que estão presentes no documento
2. NÃO invente ou estime valores
3. Para cada exame encontrado, extraia o valor exato como está escrito
4. Ignore qualquer exame que não esteja na lista abaixo
5. Para exames com subcampos (como TTGO), retorne cada subcampo separadamente

**EXTRAÇÃO DE VALORES NUMÉRICOS:**
- **SEMPRE extraia valores numéricos quando disponíveis**, mesmo que haja interpretação qualitativa
- Para exames sorológicos (HIV, Hepatites, Sífilis, Toxoplasmose, Rubéola, etc.):
  * Se houver valor numérico (ex: "0.15", "1.2 UI/mL", "< 0.5"), extraia o valor numérico
  * Se houver apenas resultado qualitativo ("Reagente", "Não Reagente", "Positivo", "Negativo"), extraia esse resultado
  * Preferência: VALOR NUMÉRICO > Resultado qualitativo
- Para exames de contagem (Hemoglobina, Plaquetas, etc.), SEMPRE extraia o valor numérico com unidade
- Para exames de glicose, TSH, etc., SEMPRE extraia o valor numérico com unidade

**ATENÇÃO ESPECIAL PARA TOTG/TTGO (Curva Glicêmica):**
- Pode aparecer como: "TOTG", "TTGO", "Curva de Tolerância à Glicose", "Teste Oral de Tolerância à Glicose", "Curva Glicêmica"
- SEMPRE tem 3 valores obrigatórios: Jejum, 1 hora (ou 1h, 1ª Hora), 2 horas (ou 2h, 2ª Hora)
- **REGRA CRÍTICA**: Se você encontrar o título "CURVA DE TOLERÂNCIA À GLICOSE" ou "CURVA GLICÊMICA" no documento, você DEVE extrair os 3 valores (Jejum, 1ª Hora, 2ª Hora) como subcampos do exame "TTGO 75g (Curva Glicêmica)"
- Ignore qualquer resultado de "GLICOSE" isolado se houver "CURVA DE TOLERÂNCIA" no mesmo documento
- Os 3 valores podem estar na mesma página ou em páginas diferentes - procure em todo o documento
- Extraia TODOS os 3 valores como subcampos separados do exame "TTGO 75g (Curva Glicêmica)"

**EXAMES ESPERADOS PARA ESTE TRIMESTRE:**
${examesEsperados.map(e => `- ${e}`).join('\n')}

**FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):**
Você DEVE retornar um objeto JSON com a chave exames contendo um array.

Exemplo de resposta correta:
{
  "exames": [
    { "nomeExame": "Hemoglobina/Hematócrito", "valor": "12.5 g/dL / 37%", "dataColeta": "2025-11-11" },
    { "nomeExame": "Glicemia de jejum", "valor": "85 mg/dL", "dataColeta": "2025-11-11" },
    { "nomeExame": "HIV", "valor": "0.15" },
    { "nomeExame": "Toxoplasmose IgG", "valor": "125.5 UI/mL" },
    { "nomeExame": "VDRL", "valor": "Não Reagente" }
  ]
}

**EXEMPLO DE TOTG/TTGO NO DOCUMENTO:**
Se você encontrar:
- "GLICOSE: 71 mg/dL" (página 1)
- "CURVA DE TOLERÂNCIA À GLICOSE" com "Jejum: 71 mg/dL", "1ª Hora: 156 mg/dL", "2ª Hora: 109 mg/dL" (página 2)

Retorne os 3 valores como subcampos do "TTGO 75g (Curva Glicêmica)" conforme exemplo acima.

**IMPORTANTE:** 
1. Extraia a data da coleta do exame se estiver visível no documento (formato YYYY-MM-DD).
2. Se nenhum exame for encontrado retorne: { "exames": [] }
3. SEMPRE retorne um objeto JSON com a chave exames`;

  // Usar OpenAI GPT-4o para extração
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  // Construir mensagem para GPT-4o
  const userContent: any[] = [
    { type: 'text', text: prompt }
  ];

  if (mimeType.startsWith('image/')) {
    // Para imagens, usar Vision API
    userContent.push({
      type: 'image_url',
      image_url: { url: fileUrl, detail: 'high' }
    });
  } else if (mimeType === 'application/pdf') {
    // Para PDF, converter para imagem usando biblioteca JavaScript pura
    try {
      const { pdfToPng } = await import('pdf-to-png-converter');
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const tempPdfPath = path.join(tempDir, `exames-${timestamp}.pdf`);
      
      // Salvar PDF temporário
      await fs.promises.writeFile(tempPdfPath, fileBuffer);
      
      console.log('[Exames] Convertendo PDF para PNG...');
      
      // Converter PDF para PNG (máximo 10 páginas)
      const pngPages = await pdfToPng(tempPdfPath, {
        outputFolder: tempDir,
        pagesToProcess: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      });
      
      console.log(`[Exames] PDF convertido: ${pngPages.length} página(s)`);
      
      // Upload de todas as imagens para S3
      for (let i = 0; i < pngPages.length; i++) {
        const page = pngPages[i];
        
        try {
          // Upload da imagem para S3
          const imageKey = `exames-temp/${timestamp}-page${i + 1}.png`;
          if (!page.content) {
            console.warn(`[Exames] Página ${i + 1} sem conteúdo`);
            continue;
          }
          const { url: imageUrl } = await storagePut(imageKey, page.content, 'image/png');
          
          // Adicionar imagem ao conteúdo
          userContent.push({
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' }
          });
          
          console.log(`[Exames] Página ${i + 1} enviada para S3`);
        } catch (err) {
          console.warn(`[Exames] Não foi possível processar página ${i + 1}:`, err);
        }
      }
      
      // Limpar arquivo PDF temporário
      await fs.promises.unlink(tempPdfPath).catch(() => {});
      
      if (userContent.length === 1) {
        throw new Error('Nenhuma página foi convertida com sucesso');
      }
    } catch (error) {
      console.error('[Exames] Erro ao converter PDF:', error);
      throw new Error('Não foi possível processar o PDF. Tente converter para imagem (JPG/PNG).');
    }
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096, // Aumentar limite para permitir extração de muitos exames
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente médico especializado em análise de exames laboratoriais de pré-natal. Sempre responda em JSON válido.'
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }),
  });

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${openaiResponse.status}`);
  }

  const response = await openaiResponse.json();

  const content = response.choices[0].message.content;
  if (!content || typeof content !== 'string') {
    throw new Error("LLM não retornou conteúdo válido");
  }

  const parsed = JSON.parse(content) as { exames: ExameInterpretado[] };

  // 4. Converter para formato esperado pelo frontend
  const resultados: Record<string, string> = {};
  let dataColeta: string | undefined = undefined;
  
  console.log("[DEBUG] Resposta completa da OpenAI:", JSON.stringify(parsed, null, 2));
  
  // Validar se exames é um array
  if (!parsed.exames || !Array.isArray(parsed.exames)) {
    console.error("[ERROR] parsed.exames não é um array:", parsed);
    console.error("[ERROR] Tipo de parsed.exames:", typeof parsed.exames);
    console.error("[ERROR] Conteúdo completo do JSON:", content);
    throw new Error("A IA não retornou os exames no formato esperado. Tente novamente ou converta o PDF para imagem.");
  }
  
  console.log(`[DEBUG] Total de exames extraídos: ${parsed.exames.length}`);
  if (parsed.exames.length === 0) {
    console.warn("[WARN] A IA retornou um array vazio de exames. Nenhum exame foi encontrado no documento.");
  }
  
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
