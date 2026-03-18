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
  regra?: string; // Regra especial de extração
}

// Campos esperados por tipo de ultrassom com descrições detalhadas
const camposDetalhados: Record<TipoUltrassom, CampoDefinicao[]> = {
  primeiro_ultrassom: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado", exemplo: "15/01/2026", formato: "DD/MM/AAAA", regra: "OBRIGATÓRIO. Procure em QUALQUER lugar: cabeçalho ('DATA:', 'Data do exame:'), rodapé, assinatura, corpo do texto. Pode aparecer como 'DATA: dd/mm/aaaa' ou 'Realizado em dd/mm/aaaa'." },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame (pelo CCN ou biometria)", exemplo: "8 semanas e 3 dias", regra: "Procure por 'correspondendo a X semanas e X dias' ou 'IG: Xs Xd'." },
    { nome: "ccn", descricao: "Comprimento Cabeça-Nádega (CCN) do embrião em mm ou cm", exemplo: "21 mm", regra: "Procure por 'crânio-nádegas', 'cabeça-nádegas', 'CCN' ou 'CRL'. Mantenha a unidade." },
    { nome: "bcf", descricao: "Batimentos Cardíacos Fetais (BCF) em bpm", exemplo: "152 bpm", regra: "Procure por 'batimentos cardíacos', 'BCF', 'frequência de X batimentos por minuto'." },
    { nome: "sacoVitelino", descricao: "Presença e aspecto do saco/vesícula vitelino(a)", exemplo: "Presente, regular, 3.6 mm", regra: "Procure por 'vesícula vitelínica', 'saco vitelino'. Inclua diâmetro se mencionado." },
    { nome: "hematoma", descricao: "Presença de hematoma subcoriônico ou coleções", exemplo: "Não", regra: "Se o laudo NÃO menciona hematoma, coleção ou sangramento, retorne 'Não'. Só retorne 'Sim' se explicitamente descrito." },
    { nome: "corpoLuteo", descricao: "Identificação do corpo lúteo e localização", exemplo: "Presente em ovário esquerdo", regra: "Procure por 'corpo lúteo' e indique em qual ovário." },
    { nome: "coloUterino", descricao: "Medida do colo uterino (cervical length) em cm ou mm", exemplo: "3.9 cm", regra: "Procure por 'colo uterino', 'colo medindo', 'cervicometria'. Inclua se o orifício interno está aberto ou fechado, se mencionado." },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "14/05/2026", formato: "DD/MM/AAAA", regra: "IMPORTANTE. Procure por 'DPP:', 'Data Provável do Parto', 'data provável de parto'. Geralmente aparece na hipótese diagnóstica ou conclusão." },
  ],
  morfologico_1tri: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado", exemplo: "15/01/2026", formato: "DD/MM/AAAA", regra: "OBRIGATÓRIO. Procure em QUALQUER lugar: cabeçalho ('DATA:', 'Data do exame:'), rodapé, assinatura, corpo do texto." },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "12 semanas e 5 dias", regra: "Procure por 'correspondendo a X semanas e X dias' ou 'IG: Xs Xd'." },
    { nome: "tn", descricao: "Translucência Nucal (TN) - medida em mm", exemplo: "1.2 mm", regra: "Procure por 'translucência nucal', 'TN'. Valor em mm." },
    { nome: "dv", descricao: "Ducto Venoso (DV) - fluxo normal ou alterado", exemplo: "Normal (onda A positiva)", regra: "'onda A positiva' = 'Normal (onda A positiva)'. 'onda A negativa/reversa' = 'Alterado (onda A negativa)'." },
    { nome: "valvaTricuspide", descricao: "Avaliação da válvula tricúspide", exemplo: "Normal", regra: "Procure por 'válvula tricúspide', 'regurgitação tricúspide'. Sem menção = 'Normal'." },
    { nome: "dopplerUterinas", descricao: "Doppler das artérias uterinas - valores dos IPs", exemplo: "IP D: 1.45, IP E: 1.32", regra: "Procure por 'artérias uterinas', 'IP', 'índice de pulsatilidade'. Extraia valores de ambas as artérias (direita e esquerda) ou IP médio." },
    { nome: "incisuraPresente", descricao: "Presença de incisura (notch) nas artérias uterinas", exemplo: "Não", regra: "Procure por 'incisura', 'notch'. Se não mencionado, retorne 'Não'." },
    { nome: "colo", descricao: "Medida do colo uterino em mm", exemplo: "38 mm", regra: "Procure por 'colo uterino', 'cervicometria'. Valor em mm." },
    { nome: "riscoTrissomias", descricao: "Risco calculado para trissomias (T21, T18, T13)", exemplo: "Baixo risco. T21: 1:5000", regra: "Procure por 'risco', 'trissomia', 'T21', 'T18', 'T13', 'Síndrome de Down'." },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA", regra: "IMPORTANTE. Procure por 'DPP:', 'Data Provável do Parto'." },
  ],
  ultrassom_obstetrico: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado", exemplo: "15/01/2026", formato: "DD/MM/AAAA", regra: "OBRIGATÓRIO. Procure em QUALQUER lugar do documento." },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "20 semanas e 1 dia", regra: "Procure por 'correspondendo a X semanas e X dias' ou 'IG: Xs Xd'." },
    { nome: "pesoFetal", descricao: "Peso fetal estimado", exemplo: "350 g", regra: "Procure por 'peso fetal estimado', 'peso estimado', 'PFE'. Mantenha a unidade (g ou kg)." },
    { nome: "placentaLocalizacao", descricao: "Localização da placenta", exemplo: "Anterior", regra: "Procure por 'placenta' seguido de localização: anterior, posterior, fúndica, lateral, prévia." },
    { nome: "placentaGrau", descricao: "Grau de maturidade da placenta (Grannum)", exemplo: "I", regra: "Procure por 'grau' perto de 'placenta'. Valores: 0, I, II, III." },
    { nome: "coloUterinoMedida", descricao: "Medida do colo uterino (canal cervical / cervical length) em mm ou cm", exemplo: "35 mm, OI fechado", regra: "Procure por 'colo uterino', 'cervicometria', 'colo medindo', 'canal cervical', 'comprimento cervical'. Inclua se o orifício interno está aberto ou fechado, e se foi via transvaginal (TV), se mencionado." },
    { nome: "liquidoAmniotico", descricao: "Avaliação do líquido amniótico", exemplo: "Normal, ILA: 12 cm", regra: "Procure por 'líquido amniótico', 'ILA', 'maior bolsão'. Inclua valores numéricos." },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA", regra: "IMPORTANTE. Procure por 'DPP:', 'Data Provável do Parto'." },
  ],
  morfologico_2tri: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado", exemplo: "15/01/2026", formato: "DD/MM/AAAA", regra: "OBRIGATÓRIO. Procure em QUALQUER lugar do documento." },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "22 semanas e 4 dias", regra: "Procure por 'correspondendo a X semanas e X dias' ou 'IG: Xs Xd'." },
    { nome: "biometria", descricao: "Medidas biométricas completas (DBP, CC, CA, CF)", exemplo: "DBP: 52mm, CC: 195mm, CA: 175mm, CF: 38mm", regra: "Procure por 'DBP', 'CC' (circunferência cefálica), 'CA' (circunferência abdominal), 'CF' (comprimento do fêmur). Inclua todas as medidas encontradas." },
    { nome: "pesoFetal", descricao: "Peso fetal estimado", exemplo: "480 g", regra: "Procure por 'peso fetal estimado', 'peso estimado', 'PFE'. Mantenha a unidade." },
    { nome: "placentaLocalizacao", descricao: "Localização da placenta", exemplo: "Anterior", regra: "Procure por 'placenta' seguido de localização." },
    { nome: "placentaGrau", descricao: "Grau de maturidade da placenta", exemplo: "0", regra: "Procure por 'grau' perto de 'placenta'." },
    { nome: "liquidoAmniotico", descricao: "Avaliação do líquido amniótico (ILA ou maior bolsão)", exemplo: "Normal, ILA: 12 cm", regra: "Procure por 'líquido amniótico', 'ILA', 'maior bolsão'." },
    { nome: "avaliacaoAnatomica", descricao: "Resultado da avaliação anatômica fetal", exemplo: "Normal, sem alterações identificadas", regra: "Resuma os achados anatômicos. Se tudo normal, retorne 'Normal, sem alterações identificadas'. Se houver alterações, descreva-as." },
    { nome: "dopplers", descricao: "Avaliação dos Dopplers (umbilical, cerebral, uterinas)", exemplo: "Normais. IP umbilical: 1.2, IP ACM: 1.8", regra: "Procure por 'Doppler', 'IP', 'índice de pulsatilidade', 'artéria umbilical', 'ACM', 'artérias uterinas'." },
    { nome: "sexoFetal", descricao: "Sexo fetal identificado", exemplo: "Masculino", regra: "Procure por 'sexo', 'masculino', 'feminino', 'genitália'." },
    { nome: "observacoes", descricao: "Observações adicionais relevantes", exemplo: "Sem alterações", regra: "Inclua qualquer informação relevante não coberta pelos campos acima." },
    { nome: "coloUterino", descricao: "Medida do colo uterino (canal cervical / cervical length) em mm ou cm", exemplo: "35 mm, OI fechado", regra: "Procure por 'colo uterino', 'colo medindo', 'cervicometria', 'canal cervical', 'comprimento do colo'. Inclua se o orifício interno está aberto ou fechado, se mencionado." },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA", regra: "IMPORTANTE. Procure por 'DPP:', 'Data Provável do Parto'." },
  ],
  ecocardiograma: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado", exemplo: "15/01/2026", formato: "DD/MM/AAAA", regra: "OBRIGATÓRIO. Procure em QUALQUER lugar do documento." },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "24 semanas e 2 dias", regra: "Procure por 'correspondendo a X semanas e X dias' ou 'IG: Xs Xd'." },
    { nome: "conclusao", descricao: "Conclusão do ecocardiograma fetal", exemplo: "Coração estruturalmente normal", regra: "Procure pela conclusão ou hipótese diagnóstica. Resuma os achados principais." },
  ],
  ultrassom_seguimento: [
    { nome: "dataExame", descricao: "Data em que o exame foi realizado", exemplo: "15/01/2026", formato: "DD/MM/AAAA", regra: "OBRIGATÓRIO. Procure em QUALQUER lugar do documento." },
    { nome: "idadeGestacional", descricao: "Idade gestacional no momento do exame", exemplo: "32 semanas e 3 dias", regra: "Procure por 'correspondendo a X semanas e X dias' ou 'IG: Xs Xd'." },
    { nome: "pesoFetal", descricao: "Peso fetal estimado", exemplo: "1850 g", regra: "Procure por 'peso fetal estimado', 'peso estimado', 'PFE'. Mantenha a unidade." },
    { nome: "percentilPeso", descricao: "Percentil do peso fetal", exemplo: "50º percentil", regra: "Procure por 'percentil', 'p50', 'adequado para IG'." },
    { nome: "liquidoAmniotico", descricao: "Avaliação do líquido amniótico", exemplo: "Normal, ILA: 14 cm", regra: "Procure por 'líquido amniótico', 'ILA', 'maior bolsão'." },
    { nome: "placentaLocalizacao", descricao: "Localização da placenta", exemplo: "Posterior", regra: "Procure por 'placenta' seguido de localização." },
    { nome: "placentaGrau", descricao: "Grau de maturidade da placenta", exemplo: "II", regra: "Procure por 'grau' perto de 'placenta'." },
    { nome: "coloUterino", descricao: "Medida do colo uterino (canal cervical / cervical length) em mm ou cm", exemplo: "35 mm, OI fechado", regra: "Procure por 'colo uterino', 'colo medindo', 'cervicometria', 'canal cervical', 'comprimento cervical'. Inclua se o orifício interno está aberto ou fechado, se mencionado." },
    { nome: "movimentosFetais", descricao: "Movimentos fetais observados", exemplo: "Presentes", regra: "Procure por 'movimentos fetais', 'movimentação'. Se mencionado como ativo, retorne 'Presentes'." },
    { nome: "apresentacaoFetal", descricao: "Apresentação fetal", exemplo: "Cefálica", regra: "Procure por 'apresentação', 'cefálica', 'pélvica', 'transversa', 'córmica'." },
    { nome: "dopplers", descricao: "Avaliação dos Dopplers com valores de IP", exemplo: "IP umbilical: 0.95, IP ACM: 1.8, IP uterinas: 0.8", regra: "Procure por 'Doppler', 'IP', 'índice de pulsatilidade'. Extraia TODOS os valores de IP encontrados." },
    { nome: "observacoes", descricao: "Observações adicionais", exemplo: "Sem alterações", regra: "Inclua qualquer informação relevante não coberta pelos campos acima." },
    { nome: "dpp", descricao: "Data Provável do Parto calculada pelo ultrassom", exemplo: "20/08/2026", formato: "DD/MM/AAAA", regra: "IMPORTANTE. Procure por 'DPP:', 'Data Provável do Parto'." },
  ],
};

/**
 * Gera o prompt detalhado para a IA baseado no tipo de ultrassom
 */
function gerarPromptDetalhado(tipoUltrassom: TipoUltrassom): string {
  const campos = camposDetalhados[tipoUltrassom];
  
  const listaCampos = campos.map(campo => {
    let entry = `- **${campo.nome}**: ${campo.descricao}`;
    if (campo.formato) entry += ` (Formato: ${campo.formato})`;
    entry += `\n  Exemplo: "${campo.exemplo}"`;
    if (campo.regra) entry += `\n  REGRA: ${campo.regra}`;
    return entry;
  }).join("\n\n");

  return `Você é um assistente médico ESPECIALIZADO em interpretar laudos de ultrassom obstétrico pré-natal.

**TAREFA:** Analise o laudo de ultrassom e extraia TODOS os dados disponíveis para os campos listados abaixo.

**INSTRUÇÕES CRÍTICAS:**

1. Analise TODAS as páginas/imagens do documento com atenção.

2. **NOME DA PACIENTE (nomePacienteLaudo)** - OBRIGATÓRIO:
   - Procure o nome da paciente em QUALQUER lugar do documento: cabeçalho, campo "Paciente:", "Nome:", "Gestante:".
   - Retorne o nome completo exatamente como aparece no laudo.
   - Se não encontrar, retorne string vazia.

3. **DATA DO EXAME (dataExame)** - CAMPO MAIS IMPORTANTE:
   - Procure em QUALQUER lugar: cabeçalho, rodapé, corpo, assinatura, carimbos.
   - Padrões comuns: "DATA: dd/mm/aaaa", "Data do exame: dd/mm/aaaa", "Realizado em dd/mm/aaaa", "dd de mês de aaaa".
   - Se encontrar apenas dia e mês sem ano, use o ano mais recente.
   - NUNCA retorne este campo vazio se houver qualquer data no documento.

4. **DPP (Data Provável do Parto)** - MUITO IMPORTANTE:
   - Procure por "DPP:", "Data Provável do Parto", "data provável de parto", "DPP estimada".
   - Geralmente aparece na CONCLUSÃO ou HIPÓTESE DIAGNÓSTICA.
   - Formato: DD/MM/AAAA.

5. Para campos binários (hematoma, incisura, etc.):
   - Se o laudo NÃO menciona o achado, retorne "Não" (ausência = negativo).
   - Só retorne "Sim" se explicitamente descrito como presente.

6. Extraia TODOS os campos listados abaixo. Para cada campo, siga a REGRA específica.

7. Se um campo realmente não puder ser determinado pelo laudo (não há informação suficiente), omita-o do resultado.

**CAMPOS A EXTRAIR:**

${listaCampos}

**FORMATO DE RESPOSTA:**
Retorne APENAS um objeto JSON válido, sem texto adicional, sem markdown:
{"campo1": "valor1", "campo2": "valor2"}

Analise o laudo agora:`;
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
            console.warn(`[Ultrassom] Erro ao processar página ${i + 1}:`, err);
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
            content: `Você é um assistente médico especializado em análise de laudos de ultrassom obstétrico pré-natal.

REGRAS OBRIGATÓRIAS:
1. SEMPRE extraia a DATA DO EXAME (dataExame) - é o campo mais importante. Procure em cabeçalhos ("DATA:", "Data:"), rodapés, assinaturas, carimbos, qualquer lugar do documento. NUNCA retorne sem este campo se houver qualquer data no documento.
2. SEMPRE extraia a DPP (Data Provável do Parto) quando presente. Procure na conclusão, hipótese diagnóstica, ou qualquer menção a "DPP".
3. Para campos binários como hematoma e incisura: se o laudo NÃO menciona, retorne "Não" (ausência = negativo).
4. Para Ducto Venoso: "onda A positiva" = "Normal (onda A positiva)", "onda A negativa/reversa" = "Alterado (onda A negativa)".
5. Para Doppler das Uterinas: extraia os valores de IP (Índice de Pulsatilidade) de ambas as artérias.
6. Responda APENAS em JSON válido, sem markdown, sem explicações, sem texto antes ou depois do JSON.
7. Use formato DD/MM/AAAA para todas as datas.
8. Mantenha unidades de medida (mm, cm, g, bpm, etc.).`
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
      if (dadosExtraidos[campo] !== undefined && dadosExtraidos[campo] !== null && dadosExtraidos[campo] !== '') {
        dadosFiltrados[campo] = String(dadosExtraidos[campo]);
      }
    }
    
    // Sempre incluir nomePacienteLaudo se extraído (não faz parte dos campos do formulário)
    if (dadosExtraidos.nomePacienteLaudo) {
      dadosFiltrados.nomePacienteLaudo = String(dadosExtraidos.nomePacienteLaudo);
    }

    // Post-processing: garantir que campos binários tenham valor padrão
    const camposBinarios: Record<string, string[]> = {
      primeiro_ultrassom: ['hematoma'],
      morfologico_1tri: ['incisuraPresente'],
      ultrassom_obstetrico: [],
      morfologico_2tri: [],
      ecocardiograma: [],
      ultrassom_seguimento: [],
    };

    const binarios = camposBinarios[tipoUltrassom] || [];
    for (const campo of binarios) {
      if (!dadosFiltrados[campo] && camposEsperados.includes(campo)) {
        dadosFiltrados[campo] = 'Não';
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
