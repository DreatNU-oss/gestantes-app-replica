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

// Interface para definição de campo com descrição e exemplo
interface CampoDefinicao {
  nome: string;
  descricao: string;
  exemplo: string;
  formato?: string;
}

// Campos esperados por tipo de ultrassom com descrições detalhadas
const camposDetalhados: Record<TipoUltrassom, CampoDefinicao[]> = {
  primeiro_ultrassom: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado (procure no cabeçalho, rodapé ou corpo do laudo)", exemplo: "15/01/2026", formato: "DD/MM/AAAA" },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "8 semanas e 3 dias ou 8s 3d" },
    { nome: "ccn", descricao: "Comprimento Cabeça-Nádega (CCN) do embrião", exemplo: "15 mm" },
    { nome: "bcf", descricao: "Batimentos Cardíacos Fetais (BCF)", exemplo: "152 bpm" },
    { nome: "sacoVitelino", descricao: "Presença e aspecto do saco vitelino", exemplo: "Presente, regular" },
    { nome: "hematoma", descricao: "Presença de hematoma ou coleções", exemplo: "Ausente ou Presente" },
    { nome: "corpoLuteo", descricao: "Identificação do corpo lúteo", exemplo: "Presente em ovário direito" },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA" },
  ],
  morfologico_1tri: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado (OBRIGATÓRIO - procure em QUALQUER parte do documento)", exemplo: "15/01/2026", formato: "DD/MM/AAAA" },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "12 semanas e 5 dias ou 12s 5d" },
    { nome: "tn", descricao: "Translucência Nucal (TN) - medida em mm", exemplo: "1.2 mm" },
    { nome: "dv", descricao: "Ducto Venoso (DV) - fluxo normal ou alterado (onda A positiva/negativa)", exemplo: "Normal (onda A positiva)" },
    { nome: "valvaTricuspide", descricao: "Avaliação da válvula tricúspide - normal ou regurgitação", exemplo: "Normal" },
    { nome: "dopplerUterinas", descricao: "Doppler das artérias uterinas - valores dos IPs (Índice de Pulsatilidade) direita e esquerda", exemplo: "IP D: 1.45, IP E: 1.32 ou IP médio: 1.38" },
    { nome: "incisuraPresente", descricao: "Presença de incisura (notch) nas artérias uterinas", exemplo: "Sim ou Não" },
    { nome: "colo", descricao: "Medida do colo uterino em mm", exemplo: "38 mm" },
    { nome: "riscoTrissomias", descricao: "Risco calculado para trissomias (T21, T18, T13)", exemplo: "Baixo risco ou 1:5000" },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA" },
  ],
  ultrassom_obstetrico: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado (OBRIGATÓRIO)", exemplo: "15/01/2026", formato: "DD/MM/AAAA" },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "20 semanas e 1 dia ou 20s 1d" },
    { nome: "pesoFetal", descricao: "Peso fetal estimado", exemplo: "350 g" },
    { nome: "placentaLocalizacao", descricao: "Localização da placenta", exemplo: "Anterior, Posterior, Fúndica, Lateral" },
    { nome: "placentaGrau", descricao: "Grau de maturidade da placenta", exemplo: "0, I, II ou III" },
    { nome: "placentaDistanciaOI", descricao: "Distância da placenta ao orifício interno do colo", exemplo: "5 cm ou Prévia" },
    { nome: "coloUterinoTV", descricao: "Se foi realizada avaliação do colo por via transvaginal", exemplo: "Sim ou Não" },
    { nome: "coloUterinoMedida", descricao: "Medida do colo uterino em mm", exemplo: "35 mm" },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA" },
  ],
  morfologico_2tri: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado (OBRIGATÓRIO)", exemplo: "15/01/2026", formato: "DD/MM/AAAA" },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "22 semanas e 4 dias ou 22s 4d" },
    { nome: "biometria", descricao: "Medidas biométricas completas (DBP, CC, CA, CF)", exemplo: "DBP: 52mm, CC: 195mm, CA: 175mm, CF: 38mm" },
    { nome: "pesoFetal", descricao: "Peso fetal estimado", exemplo: "480 g" },
    { nome: "placentaLocalizacao", descricao: "Localização da placenta", exemplo: "Anterior" },
    { nome: "placentaGrau", descricao: "Grau de maturidade da placenta", exemplo: "0 ou I" },
    { nome: "placentaDistanciaOI", descricao: "Distância da placenta ao orifício interno", exemplo: "5 cm" },
    { nome: "liquidoAmniotico", descricao: "Avaliação do líquido amniótico (ILA ou maior bolsão)", exemplo: "Normal, ILA: 12 cm" },
    { nome: "avaliacaoAnatomica", descricao: "Resultado da avaliação anatômica fetal", exemplo: "Normal ou Alterações encontradas" },
    { nome: "dopplers", descricao: "Avaliação dos Dopplers (umbilical, cerebral, uterinas)", exemplo: "Normais ou valores específicos" },
    { nome: "sexoFetal", descricao: "Sexo fetal identificado", exemplo: "Masculino ou Feminino" },
    { nome: "observacoes", descricao: "Observações adicionais relevantes", exemplo: "Sem alterações" },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA" },
  ],
  ecocardiograma: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado (OBRIGATÓRIO)", exemplo: "15/01/2026", formato: "DD/MM/AAAA" },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "24 semanas e 2 dias" },
    { nome: "conclusao", descricao: "Conclusão do ecocardiograma fetal", exemplo: "Coração estruturalmente normal" },
  ],
  ultrassom_seguimento: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado (OBRIGATÓRIO)", exemplo: "15/01/2026", formato: "DD/MM/AAAA" },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "32 semanas e 3 dias ou 32s 3d" },
    { nome: "pesoFetal", descricao: "Peso fetal estimado", exemplo: "1850 g" },
    { nome: "percentilPeso", descricao: "Percentil do peso fetal", exemplo: "50º percentil" },
    { nome: "liquidoAmniotico", descricao: "Avaliação do líquido amniótico", exemplo: "Normal, ILA: 14 cm" },
    { nome: "placentaLocalizacao", descricao: "Localização da placenta", exemplo: "Posterior" },
    { nome: "placentaGrau", descricao: "Grau de maturidade da placenta", exemplo: "II" },
    { nome: "placentaDistanciaOI", descricao: "Distância da placenta ao orifício interno", exemplo: "Longe do OI" },
    { nome: "movimentosFetais", descricao: "Movimentos fetais observados", exemplo: "Presentes" },
    { nome: "apresentacaoFetal", descricao: "Apresentação fetal", exemplo: "Cefálica, Pélvica, Transversa" },
    { nome: "dopplers", descricao: "Avaliação dos Dopplers (umbilical, cerebral, uterinas) com valores de IP", exemplo: "IP umbilical: 0.95, IP ACM: 1.8, IP uterinas: 0.8" },
    { nome: "observacoes", descricao: "Observações adicionais", exemplo: "Sem alterações" },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA" },
  ],
};

/**
 * Gera o prompt detalhado para a IA baseado no tipo de ultrassom
 */
function gerarPromptDetalhado(tipoUltrassom: TipoUltrassom): string {
  const campos = camposDetalhados[tipoUltrassom];
  
  const listaCampos = campos.map(campo => 
    `- **${campo.nome}**: ${campo.descricao}${campo.formato ? ` (Formato: ${campo.formato})` : ''}\n  Exemplo: "${campo.exemplo}"`
  ).join("\n\n");

  return `Você é um assistente médico ESPECIALIZADO em interpretar laudos de ultrassom pré-natal.

**TAREFA CRÍTICA:** Analise o laudo de ultrassom fornecido e extraia TODOS os dados disponíveis.

**IMPORTANTE - LEIA COM ATENÇÃO:**
1. Você receberá uma ou mais imagens do mesmo documento. Analise TODAS as páginas/imagens.
2. A DATA DO EXAME é OBRIGATÓRIA - procure em QUALQUER lugar do documento (cabeçalho, rodapé, corpo, assinatura).
3. Extraia TODOS os campos listados abaixo que estiverem presentes no laudo.
4. Se um campo não estiver presente, NÃO inclua no resultado.
5. Mantenha os valores EXATAMENTE como aparecem no laudo (com unidades de medida).

**CAMPOS A EXTRAIR:**

${listaCampos}

**REGRAS DE FORMATAÇÃO:**
- Para datas: use formato DD/MM/AAAA (ex: 15/01/2026)
- Para idade gestacional: use formato "X semanas e X dias" ou "Xs Xd"
- Para medidas: mantenha as unidades (mm, cm, g, bpm)
- Para valores de IP (Índice de Pulsatilidade): mantenha os decimais
- Para campos Normal/Alterado: use exatamente essas palavras quando aplicável

**ATENÇÃO ESPECIAL:**
- Ducto Venoso (DV): procure por "onda A positiva" (Normal) ou "onda A negativa/reversa" (Alterado)
- Doppler das Uterinas: procure por valores de IP (Índice de Pulsatilidade) direita e esquerda
- DPP: procure por "Data Provável do Parto" ou "DPP" em qualquer parte do documento

**FORMATO DE RESPOSTA:**
Retorne APENAS um objeto JSON válido, sem texto adicional:
{"campo1": "valor1", "campo2": "valor2"}

Agora analise o laudo e extraia os dados:`;
}

/**
 * Interpreta um laudo de ultrassom (PDF ou imagem) e extrai dados estruturados
 */
export async function interpretarLaudoUltrassom(
  fileUrl: string,
  tipoUltrassom: TipoUltrassom,
  mimeType: string
): Promise<Record<string, string>> {
  const camposEsperados = camposDetalhados[tipoUltrassom].map(c => c.nome);
  const prompt = gerarPromptDetalhado(tipoUltrassom);

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

    // Chamar OpenAI GPT-4o com prompt de sistema mais enfático
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
            content: `Você é um assistente médico especializado em análise de laudos de ultrassom obstétrico.

REGRAS OBRIGATÓRIAS:
1. SEMPRE extraia a DATA DO EXAME - é o campo mais importante. Procure em cabeçalhos, rodapés, assinaturas.
2. SEMPRE extraia a DPP (Data Provável do Parto) quando presente.
3. Para Ducto Venoso: "onda A positiva" = "Normal", "onda A negativa/reversa" = "Alterado"
4. Para Doppler das Uterinas: extraia os valores de IP (Índice de Pulsatilidade) de ambas as artérias.
5. Responda APENAS em JSON válido, sem markdown, sem explicações.
6. Se um campo não estiver no laudo, NÃO inclua no JSON.`
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

    // Log para debug
    console.log('[Ultrassom] Dados extraídos pela IA:', JSON.stringify(dadosExtraidos, null, 2));

    // Validar que apenas campos esperados foram retornados
    const dadosFiltrados: Record<string, string> = {};
    for (const campo of camposEsperados) {
      if (dadosExtraidos[campo]) {
        dadosFiltrados[campo] = String(dadosExtraidos[campo]);
      }
    }

    // Log final
    console.log('[Ultrassom] Dados filtrados finais:', JSON.stringify(dadosFiltrados, null, 2));

    return dadosFiltrados;
  } catch (error) {
    console.error("Erro ao interpretar laudo de ultrassom:", error);
    throw error;
  }
}
