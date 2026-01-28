// Usando OpenAI GPT-4o Vision para melhor extração de dados
import { storagePut } from "./storage";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ExameInterpretado {
  nomeExame: string;
  valor: string;
  subcampo?: string; // Para TTGO: "Jejum", "1 hora", "2 horas"
  dataColeta?: string; // Data da coleta do exame (formato YYYY-MM-DD)
}

interface ExameComTrimestre {
  nomeExame: string;
  valor: string;
  subcampo?: string;
  dataColeta?: string;
  trimestre?: number; // 1, 2 ou 3
}

export async function interpretarExamesComIA(
  fileBuffer: Buffer,
  mimeType: string,
  trimestre?: "primeiro" | "segundo" | "terceiro", // Agora opcional
  dumGestante?: string // Data da última menstruação para calcular trimestre
): Promise<{ resultados: Record<string, string>; dataColeta?: string; trimestreExtraido?: number }> {
  console.log("[DEBUG] interpretarExamesComIA chamado com:");
  console.log("[DEBUG] - trimestre:", trimestre);
  console.log("[DEBUG] - dumGestante:", dumGestante);
  
  // 1. Upload do arquivo para S3
  const fileKey = `exames-temp/${Date.now()}-${Math.random().toString(36).substring(7)}.${mimeType.split('/')[1]}`;
  const { url: fileUrl } = await storagePut(fileKey, fileBuffer, mimeType);

  // 2. Preparar lista de exames esperados (todos os trimestres se não especificado)
  const examesEsperados = trimestre 
    ? getExamesEsperadosPorTrimestre(trimestre)
    : getAllExames();

  // 3. Chamar LLM com visão para interpretar o documento
  const prompt = `Você é um assistente médico ALTAMENTE ESPECIALIZADO em interpretar resultados de exames laboratoriais de pré-natal.

**SUA MISSÃO:** Analisar TODAS as páginas do documento (PDF ou imagens) e extrair TODOS os valores dos exames listados abaixo. Você DEVE ser EXTREMAMENTE MINUCIOSO e NÃO PODE DEIXAR NENHUM EXAME DE FORA.

**REGRAS CRÍTICAS - LEIA COM ATENÇÃO:**

1. **ANALISE TODAS AS PÁGINAS** - Cada página pode conter exames diferentes. NÃO pare após encontrar alguns exames.

2. **MAPEAMENTO DE NOMES DE EXAMES** - Os exames no documento podem ter nomes diferentes. Use este mapeamento:

   **TIPAGEM SANGUÍNEA:**
   - "Tipo Sanguíneo", "Tipagem ABO", "Grupo Sanguíneo", "ABO/Rh", "Tipagem Sanguínea" → "Tipagem sanguínea ABO/Rh"
   - "Coombs Indireto", "Teste de Coombs Indireto", "TAI" → "Coombs indireto"

   **HEMOGRAMA:**
   - "Hemoglobina", "Hb", "HGB" → "Hemoglobina/Hematócrito" (inclua também o Hematócrito se disponível)
   - "Hematócrito", "Ht", "HCT" → incluir junto com Hemoglobina
   - "Plaquetas", "Contagem de Plaquetas", "PLT" → "Plaquetas"

   **GLICEMIA:**
   - "Glicose", "Glicemia", "Glicemia de Jejum", "Glicose em Jejum" → "Glicemia de jejum"

   **SÍFILIS:**
   - "VDRL", "RPR", "Sífilis" → "VDRL"
   - "FTA-ABS", "FTA-ABS IgG" → "FTA-ABS IgG"
   - "FTA-ABS IgM" → "FTA-ABS IgM"

   **HIV:**
   - "Anti-HIV", "HIV 1 e 2", "HIV", "Sorologia para HIV", "HIV 1/2" → "HIV"

   **HEPATITES:**
   - "HBsAg", "Antígeno de Superfície Hepatite B", "Hepatite B", "AgHBs" → "Hepatite B (HBsAg)"
   - "Anti-HBs", "Anticorpo Anti-HBs" → "Anti-HBs"
   - "Anti-HCV", "Hepatite C", "HCV" → "Hepatite C (Anti-HCV)"

   **TOXOPLASMOSE:**
   - "Toxo IgG", "Toxoplasmose IgG", "Anti-Toxoplasma IgG", "IgG Toxoplasmose" → "Toxoplasmose IgG"
   - "Toxo IgM", "Toxoplasmose IgM", "Anti-Toxoplasma IgM", "IgM Toxoplasmose" → "Toxoplasmose IgM"

   **RUBÉOLA:**
   - "Rubéola IgG", "Anti-Rubéola IgG", "IgG Rubéola" → "Rubéola IgG"
   - "Rubéola IgM", "Anti-Rubéola IgM", "IgM Rubéola" → "Rubéola IgM"

   **CITOMEGALOVÍRUS:**
   - "CMV IgG", "Citomegalovírus IgG", "Anti-CMV IgG", "IgG CMV" → "Citomegalovírus IgG"
   - "CMV IgM", "Citomegalovírus IgM", "Anti-CMV IgM", "IgM CMV" → "Citomegalovírus IgM"

   **TIREOIDE:**
   - "TSH", "Hormônio Tireoestimulante", "TSH Ultrassensível" → "TSH"
   - "T4 Livre", "Tiroxina Livre", "T4L" → "T4 Livre"

   **VITAMINAS E MINERAIS:**
   - "Ferritina", "Ferritina Sérica" → "Ferritina"
   - "Vitamina D", "25-OH Vitamina D", "25-Hidroxi Vitamina D", "Vitamina D - 25 Hidroxi" → "Vitamina D (25-OH)"
   - "Vitamina B12", "Cobalamina", "Cianocobalamina" → "Vitamina B12"

   **ELETROFORESE:**
   - "Eletroforese de Hemoglobina", "Eletroforese Hb" → "Eletroforese de Hemoglobina"

   **URINA:**
   - "EAS", "Urina I", "Urina tipo 1", "Sumário de Urina", "Urinálise", "Urina Rotina", "Exame de Urina", "Urina Rotina Quantitativa" → "EAS (Urina tipo 1)"
   - "Urocultura", "Cultura de Urina", "Urinocultura" → "Urocultura"
   - "Proteinúria 24h", "Proteínas na Urina 24 horas", "Proteinúria de 24 horas" → "Proteinúria de 24 horas"

   **FEZES:**
   - "EPF", "Parasitológico", "Parasitológico de Fezes", "Protoparasitológico", "PPF" → "EPF (Parasitológico de Fezes)"

   **CURVA GLICÊMICA:**
   - "TOTG", "TTGO", "Curva de Tolerância à Glicose", "Teste Oral de Tolerância à Glicose", "Curva Glicêmica" → "TTGO 75g (Curva Glicêmica)"

   **ESTREPTOCOCO:**
   - "Swab Vaginal", "Swab Retal", "Swab Vaginal/Retal", "EGB", "Estreptococo Grupo B", "Streptococcus agalactiae" → "Swab vaginal/retal EGB"

3. **EXTRAÇÃO DE VALORES - PRIORIZE VALORES NUMÉRICOS:**
   - **SEMPRE extraia o valor numérico quando disponível**, mesmo que haja interpretação qualitativa
   - Para sorologias: se houver "Leitura: 0.35" ou "Índice: 0.15", extraia esse valor
   - Para exames de contagem: extraia o valor com unidade (ex: "12.5 g/dL", "191.000 /mm³")
   - Para resultados qualitativos: use "Reagente", "Não Reagente", "Positivo", "Negativo"

4. **UROCULTURA - ATENÇÃO ESPECIAL:**
   - Se encontrar "Urocultura" ou "Cultura de Urina":
     * Se houver crescimento bacteriano (>100.000 UFC/mL ou similar): "Positiva - [nome da bactéria]"
     * Se houver crescimento <100.000 UFC/mL: "Negativa (crescimento não significativo)"
     * Se não houver crescimento: "Negativa"
   - **IMPORTANTE:** Se o documento mencionar "E. coli", "Escherichia coli", "Klebsiella", etc., a urocultura é POSITIVA

5. **EAS/URINA TIPO 1 - ATENÇÃO ESPECIAL:**
   - Se encontrar "Flora Bacteriana Aumentada" ou valor alto de Flora Bacteriana: "Alterada - Flora bacteriana aumentada"
   - Se encontrar Leucócitos elevados (>10/campo): "Alterada - Leucocitúria"
   - Se encontrar Proteínas elevadas: "Alterada - Proteinúria"
   - Se todos os valores estiverem normais: "Normal"

6. **TTGO/CURVA GLICÊMICA:**
   - SEMPRE extraia os 3 valores: Jejum, 1 hora, 2 horas
   - Retorne como subcampos separados

7. **DATA DA COLETA - OBRIGATÓRIO:**
   - Procure "Data da Coleta", "Data/Hora Coleta", "Colhido em", "Data" no cabeçalho
   - Formato: YYYY-MM-DD

**EXAMES ESPERADOS:**
${examesEsperados.map(e => `- ${e}`).join('\n')}

**FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):**
{
  "exames": [
    { "nomeExame": "Tipagem sanguínea ABO/Rh", "valor": "A Positivo", "dataColeta": "2026-01-15" },
    { "nomeExame": "Hemoglobina/Hematócrito", "valor": "12.4 g/dL / 39.3%", "dataColeta": "2026-01-15" },
    { "nomeExame": "Plaquetas", "valor": "191.000 /mm³", "dataColeta": "2026-01-15" },
    { "nomeExame": "Glicemia de jejum", "valor": "71 mg/dL", "dataColeta": "2026-01-15" },
    { "nomeExame": "VDRL", "valor": "Não Reagente", "dataColeta": "2026-01-15" },
    { "nomeExame": "Coombs indireto", "valor": "Não Reagente", "dataColeta": "2026-01-15" },
    { "nomeExame": "HIV", "valor": "Não Reagente", "dataColeta": "2026-01-15" },
    { "nomeExame": "Hepatite B (HBsAg)", "valor": "Não Reagente", "dataColeta": "2026-01-15" },
    { "nomeExame": "Anti-HBs", "valor": "Reagente (144.85 mUI/mL)", "dataColeta": "2026-01-15" },
    { "nomeExame": "Hepatite C (Anti-HCV)", "valor": "Não Reagente", "dataColeta": "2026-01-15" },
    { "nomeExame": "Toxoplasmose IgG", "valor": "< 0.20 UI/mL (Não Reagente)", "dataColeta": "2026-01-15" },
    { "nomeExame": "Toxoplasmose IgM", "valor": "0.05 (Não Reagente)", "dataColeta": "2026-01-15" },
    { "nomeExame": "Rubéola IgG", "valor": "216.9 UI/mL (Reagente)", "dataColeta": "2026-01-15" },
    { "nomeExame": "Rubéola IgM", "valor": "0.10 (Não Reagente)", "dataColeta": "2026-01-15" },
    { "nomeExame": "Citomegalovírus IgG", "valor": "147.20 UA/mL (Reagente)", "dataColeta": "2026-01-15" },
    { "nomeExame": "Citomegalovírus IgM", "valor": "0.19 (Não Reagente)", "dataColeta": "2026-01-15" },
    { "nomeExame": "TSH", "valor": "0.74 µUI/mL", "dataColeta": "2026-01-15" },
    { "nomeExame": "T4 Livre", "valor": "1.04 ng/dL", "dataColeta": "2026-01-15" },
    { "nomeExame": "Ferritina", "valor": "17.4 ng/mL", "dataColeta": "2026-01-15" },
    { "nomeExame": "Vitamina D (25-OH)", "valor": "33.2 ng/mL", "dataColeta": "2026-01-15" },
    { "nomeExame": "Vitamina B12", "valor": "343 pg/mL", "dataColeta": "2026-01-15" },
    { "nomeExame": "EAS (Urina tipo 1)", "valor": "Alterada - Flora bacteriana aumentada", "dataColeta": "2026-01-22" },
    { "nomeExame": "Urocultura", "valor": "Positiva - E. coli (>100.000 UFC/mL)", "dataColeta": "2026-01-22" },
    { "nomeExame": "EPF (Parasitológico de Fezes)", "valor": "Negativo", "dataColeta": "2026-01-15" },
    { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "71 mg/dL", "subcampo": "Jejum", "dataColeta": "2026-01-15" },
    { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "156 mg/dL", "subcampo": "1 hora", "dataColeta": "2026-01-15" },
    { "nomeExame": "TTGO 75g (Curva Glicêmica)", "valor": "109 mg/dL", "subcampo": "2 horas", "dataColeta": "2026-01-15" }
  ]
}

**CHECKLIST FINAL - VERIFIQUE ANTES DE RESPONDER:**
□ Analisei TODAS as páginas do documento?
□ Extraí TODOS os exames de sangue (hemograma, sorologias, bioquímica)?
□ Extraí TODOS os exames de urina (EAS e Urocultura)?
□ Extraí os exames de fezes (EPF)?
□ Extraí os exames de tireoide (TSH, T4 Livre)?
□ Extraí as vitaminas (D, B12, Ferritina)?
□ Extraí a tipagem sanguínea e Coombs?
□ Incluí a data de coleta em todos os exames?

**IMPORTANTE:** Se nenhum exame for encontrado, retorne: { "exames": [] }`;

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
      
      // Converter PDF para PNG (aumentado para 25 páginas para cobrir documentos maiores)
      const pngPages = await pdfToPng(tempPdfPath, {
        outputFolder: tempDir,
        pagesToProcess: Array.from({ length: 25 }, (_, i) => i + 1) // Páginas 1-25
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
      max_tokens: 8192, // Aumentado para permitir extração de muitos exames
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente médico ALTAMENTE ESPECIALIZADO em análise de exames laboratoriais de pré-natal. Você é EXTREMAMENTE MINUCIOSO e NUNCA deixa exames de fora. Sempre responda em JSON válido com TODOS os exames encontrados no documento.'
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

  const parsed = JSON.parse(content) as { exames: ExameComTrimestre[] };

  // 4. Converter para formato esperado pelo frontend
  // Agora retornamos resultados com trimestre incluso na chave: "nomeExame::trimestre"
  const resultados: Record<string, string> = {};
  let dataColeta: string | undefined = undefined;
  let trimestreExtraido: number | undefined = undefined;
  
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
  
  // Função auxiliar para calcular trimestre baseado na DUM e data de coleta
  const calcularTrimestreAutomatico = (dataColetaExame: string | undefined, dum: string | undefined): number | undefined => {
    if (!dataColetaExame || !dum) return undefined;
    
    try {
      const dataColeta = new Date(dataColetaExame);
      const dataDum = new Date(dum);
      
      if (isNaN(dataColeta.getTime()) || isNaN(dataDum.getTime())) return undefined;
      
      const diffMs = dataColeta.getTime() - dataDum.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const semanas = Math.floor(diffDias / 7);
      
      console.log(`[DEBUG] Cálculo trimestre: DUM=${dum}, DataColeta=${dataColetaExame}, Semanas=${semanas}`);
      
      if (semanas <= 13) return 1;
      if (semanas <= 27) return 2;
      if (semanas <= 42) return 3;
      return undefined;
    } catch (e) {
      console.error('[DEBUG] Erro ao calcular trimestre:', e);
      return undefined;
    }
  };
  
  for (const exame of parsed.exames) {
    // Capturar data da coleta (assumindo que todos os exames do mesmo laudo têm a mesma data)
    if (exame.dataColeta && !dataColeta) {
      dataColeta = exame.dataColeta;
    }
    
    // Capturar trimestre extraído (primeiro encontrado)
    if (exame.trimestre && !trimestreExtraido) {
      trimestreExtraido = exame.trimestre;
    }
    
    // Determinar o trimestre para este exame
    // Prioridade: 1) trimestre do exame, 2) calculado automaticamente pela DUM, 3) trimestre extraído, 4) trimestre manual
    let trimestreExame = exame.trimestre;
    
    if (!trimestreExame && dumGestante && exame.dataColeta) {
      // Calcular trimestre automaticamente baseado na DUM e data de coleta
      trimestreExame = calcularTrimestreAutomatico(exame.dataColeta, dumGestante);
      console.log(`[DEBUG] Trimestre calculado automaticamente para ${exame.nomeExame}: ${trimestreExame}`);
    }
    
    if (!trimestreExame) {
      trimestreExame = trimestreExtraido || (trimestre === "primeiro" ? 1 : trimestre === "segundo" ? 2 : trimestre === "terceiro" ? 3 : undefined);
    }
    
    // IMPORTANTE: Sempre incluir trimestre e data na chave para modo automático
    // Formato: NomeExame::trimestre::data
    const trimestreSuffix = trimestreExame ? `::${trimestreExame}` : '';
    const dataSuffix = exame.dataColeta ? `::${exame.dataColeta}` : '';
    
    if (exame.subcampo) {
      // Para exames com subcampos (TTGO)
      const chave = `${exame.nomeExame}__${exame.subcampo}${trimestreSuffix}${dataSuffix}`;
      console.log(`[DEBUG] TTGO subcampo: ${chave} = ${exame.valor}`);
      resultados[chave] = exame.valor;
    } else {
      const chave = `${exame.nomeExame}${trimestreSuffix}${dataSuffix}`;
      console.log(`[DEBUG] Exame: ${chave} = ${exame.valor}`);
      resultados[chave] = exame.valor;
    }
  }
  
  console.log("[DEBUG] Resultados finais:", JSON.stringify(resultados, null, 2));
  console.log("[DEBUG] Data coleta:", dataColeta);
  console.log("[DEBUG] Trimestre extraído:", trimestreExtraido);

  return { resultados, dataColeta, trimestreExtraido };
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


function getAllExames(): string[] {
  // Lista completa de todos os exames (todos os trimestres)
  const todosExames = [
    "Tipagem sanguínea ABO/Rh",
    "Coombs indireto",
    "Hemoglobina/Hematócrito",
    "Plaquetas",
    "Glicemia de jejum",
    "VDRL",
    "FTA-ABS IgG",
    "FTA-ABS IgM",
    "HIV",
    "Hepatite B (HBsAg)",
    "Anti-HBs",
    "Hepatite C (Anti-HCV)",
    "Toxoplasmose IgG",
    "Toxoplasmose IgM",
    "Rubéola IgG",
    "Rubéola IgM",
    "Citomegalovírus IgG",
    "Citomegalovírus IgM",
    "TSH",
    "T4 Livre",
    "Eletroforese de Hemoglobina",
    "Ferritina",
    "Vitamina D (25-OH)",
    "Vitamina B12",
    "TTGO 75g (Curva Glicêmica) - Jejum",
    "TTGO 75g (Curva Glicêmica) - 1 hora",
    "TTGO 75g (Curva Glicêmica) - 2 horas",
    "EAS (Urina tipo 1)",
    "Urocultura",
    "Proteinúria de 24 horas",
    "EPF (Parasitológico de Fezes)",
    "Swab vaginal/retal EGB",
  ];

  return todosExames;
}
