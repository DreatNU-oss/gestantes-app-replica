import { jsPDF } from 'jspdf';
import { LOGO_MAIS_MULHER_BASE64 } from './logoBase64';
import { FATORES_RISCO_LABELS, TIPO_ULTRASSOM_LABELS, MEDICAMENTO_LABELS, formatarLabel, sanitizeForPdf } from './htmlToPdf_labels';

// Logo base64 embutida diretamente no codigo (compativel com esbuild bundle)
const LOGO_BASE64: string = LOGO_MAIS_MULHER_BASE64;

/**
 * Interface para os dados do PDF
 */
interface DadosPdf {
  gestante: {
    nome: string;
    idade: number | null;
    dum: string | null;
    dppDUM: string | null;
    dppUS: string | null;
    gesta: number | null;
    para: number | null;
    abortos: number | null;
    partosNormais: number | null;
    cesareas: number | null;
    dataUltrassom: string | null;
    igUltrassomSemanas: number | null;
    igUltrassomDias: number | null;
  };
  graficos?: {
    peso?: string;
    au?: string;
    pa?: string;
  };
  consultas: Array<{
    dataConsulta: string;
    igDUM: string | null;
    igUS: string | null;
    peso: number | null;
    pa: string | null;
    au: number | null;
    bcf: number | null;
    mf: number | null;
    conduta: string | null;
    condutaComplementacao: string | null;
    observacoes: string | null;
  }>;
  marcos: Array<{
    titulo: string;
    data: string;
    periodo: string;
  }>;
  ultrassons: Array<{
    data: string;
    ig: string;
    tipo: string;
    observacoes: string | null;
  }>;
  exames: Array<{
    nome: string;
    trimestre1?: { resultado: string; data?: string };
    trimestre2?: { resultado: string; data?: string };
    trimestre3?: { resultado: string; data?: string };
  }>;
  fatoresRisco: Array<{ tipo: string }>;
  medicamentos: Array<{ tipo: string; especificacao?: string }>;
  // Dados brutos para gráficos nativos jsPDF
  dadosGraficos?: {
    peso?: Array<{ igSemanas: number; valor: number }>;
    au?: Array<{ igSemanas: number; valor: number }>;
    pa?: Array<{ igSemanas: number; sistolica: number; diastolica: number }>;
  };
}

/**
 * Formata data para pt-BR
 */
function formatarData(data: string | null): string {
  if (!data) return '-';
  const d = new Date(data + 'T12:00:00');
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

// Dados de referência para Altura Uterina (Ministério da Saúde/FEBRASGO)
const auReferenceData: Record<number, { min: number; max: number; median: number }> = {
  12: { min: 10, max: 12, median: 11 },
  13: { min: 6, max: 14, median: 10 },
  14: { min: 9, max: 16, median: 12.5 },
  15: { min: 10, max: 18, median: 14 },
  16: { min: 11, max: 19, median: 15 },
  17: { min: 13, max: 24, median: 18.5 },
  18: { min: 13, max: 23, median: 18 },
  19: { min: 14, max: 24, median: 19 },
  20: { min: 18, max: 22, median: 20 },
  21: { min: 16, max: 24, median: 20 },
  22: { min: 17, max: 26, median: 21.5 },
  23: { min: 19, max: 27, median: 23 },
  24: { min: 19, max: 28, median: 23.5 },
  25: { min: 20, max: 28, median: 24 },
  26: { min: 21, max: 30, median: 25.5 },
  27: { min: 23, max: 29, median: 26 },
  28: { min: 24, max: 32, median: 28 },
  29: { min: 24, max: 35, median: 29.5 },
  30: { min: 25, max: 34, median: 29.5 },
  31: { min: 25, max: 35, median: 30 },
  32: { min: 26, max: 36, median: 31 },
  33: { min: 27, max: 35, median: 31 },
  34: { min: 27, max: 36, median: 31.5 },
  35: { min: 28, max: 37, median: 32.5 },
  36: { min: 29, max: 37, median: 33 },
  37: { min: 30, max: 38, median: 34 },
  38: { min: 31, max: 39, median: 35 },
  39: { min: 31, max: 38, median: 34.5 },
  40: { min: 32, max: 36, median: 34 },
  41: { min: 35, max: 40, median: 37.5 },
  42: { min: 35, max: 41, median: 38 },
};

/**
 * Desenha gráfico de peso diretamente no jsPDF (sem SVG, sem dependência de fontes do sistema)
 */
function desenharGraficoPeso(
  doc: jsPDF,
  dados: Array<{ igSemanas: number; valor: number }>,
  startX: number,
  startY: number,
  width: number,
  height: number
): number {
  if (dados.length === 0) return startY;

  const sorted = [...dados].sort((a, b) => a.igSemanas - b.igSemanas);
  const padding = { top: 12, right: 8, bottom: 16, left: 14 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartX = startX + padding.left;
  const chartY = startY + padding.top;

  const valores = sorted.map(d => d.valor);
  const minY = Math.floor(Math.min(...valores) - 2);
  const maxY = Math.ceil(Math.max(...valores) + 2);

  // Título
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('Peso (kg)', startX + width / 2, startY + 4, { align: 'center' });

  // Grid horizontal
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const yPos = chartY + (i / ySteps) * chartH;
    const value = maxY - (i / ySteps) * (maxY - minY);
    doc.line(chartX, yPos, chartX + chartW, yPos);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text(value.toFixed(0), chartX - 2, yPos + 1, { align: 'right' });
  }

  // Mapear pontos
  const points = sorted.map((d, i) => ({
    x: chartX + (i / Math.max(sorted.length - 1, 1)) * chartW,
    y: chartY + chartH - ((d.valor - minY) / (maxY - minY)) * chartH,
    valor: d.valor,
    semana: d.igSemanas,
  }));

  // Linha do gráfico
  doc.setDrawColor(114, 47, 55);
  doc.setLineWidth(0.5);
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }

  // Pontos e valores
  points.forEach(point => {
    doc.setFillColor(114, 47, 55);
    doc.circle(point.x, point.y, 0.8, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(114, 47, 55);
    doc.text(point.valor.toFixed(1), point.x, point.y - 2, { align: 'center' });
  });

  // Labels eixo X (semanas)
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  sorted.forEach((d, i) => {
    const x = chartX + (i / Math.max(sorted.length - 1, 1)) * chartW;
    doc.text(`${d.igSemanas}s`, x, chartY + chartH + 4, { align: 'center' });
  });

  // Label eixo X
  doc.setFontSize(6);
  doc.setTextColor(51, 51, 51);
  doc.text('Idade Gestacional', startX + width / 2, startY + height - 1, { align: 'center' });

  return startY + height;
}

/**
 * Desenha gráfico de Altura Uterina diretamente no jsPDF com faixa P10-P90
 */
function desenharGraficoAU(
  doc: jsPDF,
  dados: Array<{ igSemanas: number; valor: number }>,
  startX: number,
  startY: number,
  width: number,
  height: number
): number {
  if (dados.length === 0) return startY;

  const sorted = [...dados].sort((a, b) => a.igSemanas - b.igSemanas);
  const padding = { top: 12, right: 8, bottom: 16, left: 14 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartX = startX + padding.left;
  const chartY = startY + padding.top;

  const semanasData = sorted.map(d => d.igSemanas);
  const minWeek = Math.max(12, Math.min(...semanasData) - 2);
  const maxWeek = Math.min(42, Math.max(...semanasData) + 2);
  const minY = 0;
  const maxY = 45;

  const mapWeekToX = (week: number) => chartX + ((week - minWeek) / (maxWeek - minWeek)) * chartW;
  const mapValueToY = (value: number) => chartY + chartH - ((value - minY) / (maxY - minY)) * chartH;

  // Título
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('Altura Uterina (cm)', startX + width / 2, startY + 4, { align: 'center' });

  // Área de referência P10-P90
  const refWeeks = Object.keys(auReferenceData).map(Number).filter(w => w >= minWeek && w <= maxWeek).sort((a, b) => a - b);
  if (refWeeks.length > 1) {
    doc.setFillColor(200, 200, 210);
    doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
    for (let i = 0; i < refWeeks.length - 1; i++) {
      const w1 = refWeeks[i];
      const w2 = refWeeks[i + 1];
      const x1 = mapWeekToX(w1);
      const x2 = mapWeekToX(w2);
      const topY = Math.min(mapValueToY(auReferenceData[w1].max), mapValueToY(auReferenceData[w2].max));
      const botY = Math.max(mapValueToY(auReferenceData[w1].min), mapValueToY(auReferenceData[w2].min));
      doc.rect(x1, topY, x2 - x1, botY - topY, 'F');
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Linhas tracejadas P90 e P10
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.2);
    for (let i = 0; i < refWeeks.length - 1; i++) {
      const x1 = mapWeekToX(refWeeks[i]);
      const x2 = mapWeekToX(refWeeks[i + 1]);
      const y1t = mapValueToY(auReferenceData[refWeeks[i]].max);
      const y2t = mapValueToY(auReferenceData[refWeeks[i + 1]].max);
      const y1b = mapValueToY(auReferenceData[refWeeks[i]].min);
      const y2b = mapValueToY(auReferenceData[refWeeks[i + 1]].min);
      for (let s = 0; s < 4; s += 2) {
        const t1 = s / 4, t2 = (s + 1) / 4;
        doc.line(x1 + (x2 - x1) * t1, y1t + (y2t - y1t) * t1, x1 + (x2 - x1) * t2, y1t + (y2t - y1t) * t2);
        doc.line(x1 + (x2 - x1) * t1, y1b + (y2b - y1b) * t1, x1 + (x2 - x1) * t2, y1b + (y2b - y1b) * t2);
      }
    }
  }

  // Grid horizontal
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const yPos = chartY + (i / ySteps) * chartH;
    const value = maxY - (i / ySteps) * (maxY - minY);
    doc.line(chartX, yPos, chartX + chartW, yPos);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text(value.toFixed(0), chartX - 2, yPos + 1, { align: 'right' });
  }

  // Mapear pontos
  const points = sorted.map(d => ({
    x: mapWeekToX(d.igSemanas),
    y: mapValueToY(d.valor),
    valor: d.valor,
    semana: d.igSemanas,
  }));

  // Linha do gráfico
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }

  // Pontos e valores
  points.forEach(point => {
    doc.setFillColor(37, 99, 235);
    doc.circle(point.x, point.y, 0.8, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(point.valor.toFixed(0), point.x, point.y - 2, { align: 'center' });
  });

  // Labels eixo X
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  const weekStep = Math.ceil((maxWeek - minWeek) / 8);
  for (let week = minWeek; week <= maxWeek; week += weekStep) {
    const x = mapWeekToX(week);
    doc.text(`${week}s`, x, chartY + chartH + 4, { align: 'center' });
  }

  // Legenda P10-P90
  doc.setFontSize(5);
  doc.setTextColor(156, 163, 175);
  doc.text('P10-P90', startX + width - 10, startY + 10);

  // Label eixo X
  doc.setFontSize(6);
  doc.setTextColor(51, 51, 51);
  doc.text('Idade Gestacional', startX + width / 2, startY + height - 1, { align: 'center' });

  return startY + height;
}

/**
 * Desenha gráfico de Pressão Arterial diretamente no jsPDF
 */
function desenharGraficoPA(
  doc: jsPDF,
  dados: Array<{ igSemanas: number; sistolica: number; diastolica: number }>,
  startX: number,
  startY: number,
  width: number,
  height: number
): number {
  if (dados.length === 0) return startY;

  const sorted = [...dados].sort((a, b) => a.igSemanas - b.igSemanas);
  const padding = { top: 14, right: 10, bottom: 16, left: 14 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartX = startX + padding.left;
  const chartY = startY + padding.top;

  const minY = 40;
  const maxY = 180;

  const mapToX = (i: number) => chartX + (i / Math.max(sorted.length - 1, 1)) * chartW;
  const mapToY = (value: number) => chartY + chartH - ((value - minY) / (maxY - minY)) * chartH;

  // Título
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('Pressão Arterial (mmHg)', startX + width / 2, startY + 4, { align: 'center' });

  // Legenda (posicionada abaixo do título, à direita)
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(220, 38, 38);
  doc.rect(startX + width - 32, startY + 7, 3, 2, 'F');
  doc.setTextColor(51, 51, 51);
  doc.text('Sist.', startX + width - 28, startY + 8.5);
  doc.setFillColor(22, 163, 106);
  doc.rect(startX + width - 18, startY + 7, 3, 2, 'F');
  doc.text('Diast.', startX + width - 14, startY + 8.5);

  // Linhas de referência hipertensão
  const y140 = mapToY(140);
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.3);
  for (let x = chartX; x < chartX + chartW; x += 3) {
    doc.line(x, y140, Math.min(x + 1.5, chartX + chartW), y140);
  }
  doc.setFontSize(5);
  doc.setTextColor(239, 68, 68);
  doc.text('140', chartX + chartW + 1, y140 + 1);

  const y90 = mapToY(90);
  doc.setDrawColor(34, 197, 94);
  for (let x = chartX; x < chartX + chartW; x += 3) {
    doc.line(x, y90, Math.min(x + 1.5, chartX + chartW), y90);
  }
  doc.setFontSize(5);
  doc.setTextColor(34, 197, 94);
  doc.text('90', chartX + chartW + 1, y90 + 1);

  // Grid horizontal
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  const ySteps = 7;
  for (let i = 0; i <= ySteps; i++) {
    const yPos = chartY + (i / ySteps) * chartH;
    const value = maxY - (i / ySteps) * (maxY - minY);
    doc.line(chartX, yPos, chartX + chartW, yPos);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text(value.toFixed(0), chartX - 2, yPos + 1, { align: 'right' });
  }

  // Mapear pontos
  const pointsSis = sorted.map((d, i) => ({ x: mapToX(i), y: mapToY(d.sistolica), valor: d.sistolica }));
  const pointsDia = sorted.map((d, i) => ({ x: mapToX(i), y: mapToY(d.diastolica), valor: d.diastolica }));

  // Linha sistólica
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  for (let i = 1; i < pointsSis.length; i++) {
    doc.line(pointsSis[i - 1].x, pointsSis[i - 1].y, pointsSis[i].x, pointsSis[i].y);
  }

  // Linha diastólica
  doc.setDrawColor(22, 163, 106);
  for (let i = 1; i < pointsDia.length; i++) {
    doc.line(pointsDia[i - 1].x, pointsDia[i - 1].y, pointsDia[i].x, pointsDia[i].y);
  }

  // Pontos e valores sistólica (acima)
  pointsSis.forEach(point => {
    doc.setFillColor(220, 38, 38);
    doc.circle(point.x, point.y, 0.8, 'F');
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(point.valor.toString(), point.x, point.y - 2, { align: 'center' });
  });

  // Pontos e valores diastólica (abaixo)
  pointsDia.forEach(point => {
    doc.setFillColor(22, 163, 106);
    doc.circle(point.x, point.y, 0.8, 'F');
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 106);
    doc.text(point.valor.toString(), point.x, point.y + 4, { align: 'center' });
  });

  // Labels eixo X
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  sorted.forEach((d, i) => {
    const x = mapToX(i);
    doc.text(`${d.igSemanas}s`, x, chartY + chartH + 4, { align: 'center' });
  });

  // Label eixo X
  doc.setFontSize(6);
  doc.setTextColor(51, 51, 51);
  doc.text('Idade Gestacional', startX + width / 2, startY + height - 1, { align: 'center' });

  return startY + height;
}

/**
 * Converte SVG para PNG base64 usando sharp (fallback para gráficos antigos)
 */
async function svgToPngBase64(svg: string): Promise<string> {
  try {
    const sharp = require('sharp');
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Erro ao converter SVG para PNG:', error);
    return '';
  }
}

/**
 * Gera PDF do Cartão de Pré-natal usando jsPDF com gráficos nativos
 * Os gráficos são desenhados diretamente com comandos jsPDF, eliminando
 * a dependência de fontes do sistema operacional (corrige os "quadrados" no texto)
 */
export async function gerarPdfComJsPDF(dados: DadosPdf): Promise<Buffer> {
  console.log('[htmlToPdf] Iniciando geração de PDF com jsPDF (gráficos nativos)...');
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Cores
  const corPrimaria = [139, 69, 19]; // Marrom
  const corTexto = [51, 51, 51];
  const corCinza = [128, 128, 128];

  // Função auxiliar para adicionar nova página se necessário
  const checkNewPage = (height: number = 20) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Funcao para desenhar titulo de secao
  const drawSectionTitle = (title: string) => {
    checkNewPage(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.text(sanitizeForPdf(title), margin, y);
    y += 8;
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFont('helvetica', 'normal');
  };

  // Funcao para desenhar linha de dados
  const drawDataLine = (label: string, value: string) => {
    checkNewPage(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizeForPdf(label) + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(sanitizeForPdf(label) + ': ');
    doc.text(sanitizeForPdf(value || '-'), margin + labelWidth, y);
    y += 6;
  };

  // ===== CABEÇALHO COM LOGO =====
  if (LOGO_BASE64) {
    try {
      // Logo horizontal: 850x378 -> aspect ratio ~2.25
      const logoHeight = 14;
      const logoWidth = logoHeight * 2.25;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(
        `data:image/png;base64,${LOGO_BASE64}`,
        'PNG',
        logoX,
        y - 2,
        logoWidth,
        logoHeight
      );
      y += logoHeight + 6;
    } catch (e) {
      console.error('[htmlToPdf] Erro ao adicionar logo:', e);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
      doc.text('Clinica Mais Mulher', pageWidth / 2, y, { align: 'center' });
      y += 8;
    }
  } else {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.text('Clinica Mais Mulher', pageWidth / 2, y, { align: 'center' });
    y += 8;
  }

  // Título do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
  doc.text(sanitizeForPdf('Cartao de Pre-Natal'), pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Linha separadora
  doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ===== DADOS DA GESTANTE =====
  drawSectionTitle('Dados da Gestante');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
  doc.text(sanitizeForPdf(dados.gestante.nome), margin, y);
  y += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (dados.gestante.idade) {
    drawDataLine('Idade', `${dados.gestante.idade} anos`);
  }
  
  if (dados.gestante.dum) {
    drawDataLine('DUM', formatarData(dados.gestante.dum));
  }
  if (dados.gestante.dppDUM) {
    drawDataLine('DPP (DUM)', formatarData(dados.gestante.dppDUM));
  }
  if (dados.gestante.dppUS) {
    drawDataLine('DPP (US)', formatarData(dados.gestante.dppUS));
  }
  
  if (dados.gestante.dataUltrassom) {
    drawDataLine('Data US', formatarData(dados.gestante.dataUltrassom));
    if (dados.gestante.igUltrassomSemanas !== null) {
      drawDataLine('IG no US', `${dados.gestante.igUltrassomSemanas}s ${dados.gestante.igUltrassomDias || 0}d`);
    }
  }
  
  const go = `G${dados.gestante.gesta || 0}P${dados.gestante.para || 0}A${dados.gestante.abortos || 0}`;
  drawDataLine('GO', go);
  
  if (dados.gestante.cesareas) {
    drawDataLine('Cesáreas', `${dados.gestante.cesareas}`);
  }
  
  y += 5;

  // ===== FATORES DE RISCO =====
  if (dados.fatoresRisco.length > 0) {
    drawSectionTitle('Fatores de Risco');
    dados.fatoresRisco.forEach(f => {
      checkNewPage(6);
      doc.setFontSize(10);
      doc.text(sanitizeForPdf(`- ${formatarLabel(f.tipo, FATORES_RISCO_LABELS)}`), margin + 2, y);
      y += 5;
    });
    y += 3;
  }

  // ===== MEDICAMENTOS =====
  if (dados.medicamentos.length > 0) {
    drawSectionTitle('Medicamentos');
    dados.medicamentos.forEach(m => {
      checkNewPage(6);
      doc.setFontSize(10);
      const tipoLabel = formatarLabel(m.tipo, MEDICAMENTO_LABELS);
      const texto = m.especificacao ? `${tipoLabel}: ${m.especificacao}` : tipoLabel;
      doc.text(sanitizeForPdf(`- ${texto}`), margin + 2, y);
      y += 5;
    });
    y += 3;
  }

  // ===== GRÁFICOS (NATIVOS jsPDF - sem dependência de fontes do sistema) =====
  if (dados.dadosGraficos) {
    const chartHeight = 55;
    const halfWidth = contentWidth / 2 - 2;

    // Peso e AU lado a lado
    if (dados.dadosGraficos.peso && dados.dadosGraficos.peso.length > 0 && 
        dados.dadosGraficos.au && dados.dadosGraficos.au.length > 0) {
      checkNewPage(chartHeight + 10);
      drawSectionTitle('Gráficos de Evolução');
      
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, halfWidth, chartHeight, 2, 2);
      desenharGraficoPeso(doc, dados.dadosGraficos.peso, margin, y, halfWidth, chartHeight);
      
      doc.roundedRect(margin + halfWidth + 4, y, halfWidth, chartHeight, 2, 2);
      desenharGraficoAU(doc, dados.dadosGraficos.au, margin + halfWidth + 4, y, halfWidth, chartHeight);
      
      y += chartHeight + 5;
    } else if (dados.dadosGraficos.peso && dados.dadosGraficos.peso.length > 0) {
      checkNewPage(chartHeight + 10);
      drawSectionTitle('Gráficos de Evolução');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth * 0.6, chartHeight, 2, 2);
      desenharGraficoPeso(doc, dados.dadosGraficos.peso, margin, y, contentWidth * 0.6, chartHeight);
      y += chartHeight + 5;
    } else if (dados.dadosGraficos.au && dados.dadosGraficos.au.length > 0) {
      checkNewPage(chartHeight + 10);
      drawSectionTitle('Gráficos de Evolução');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth * 0.6, chartHeight, 2, 2);
      desenharGraficoAU(doc, dados.dadosGraficos.au, margin, y, contentWidth * 0.6, chartHeight);
      y += chartHeight + 5;
    }

    // PA abaixo (centralizado)
    if (dados.dadosGraficos.pa && dados.dadosGraficos.pa.length > 0) {
      checkNewPage(chartHeight + 5);
      if (!dados.dadosGraficos.peso && !dados.dadosGraficos.au) {
        drawSectionTitle('Gráficos de Evolução');
      }
      const paWidth = contentWidth * 0.55;
      const paX = margin + (contentWidth - paWidth) / 2;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(paX, y, paWidth, chartHeight, 2, 2);
      desenharGraficoPA(doc, dados.dadosGraficos.pa, paX, y, paWidth, chartHeight);
      y += chartHeight + 5;
    }
  }
  // Fallback: SVGs antigos via sharp (mantém compatibilidade, mas pode ter problema de fontes)
  else if (dados.graficos) {
    const graficosParaAdicionar: { titulo: string; svg: string }[] = [];
    
    if (dados.graficos.peso) {
      graficosParaAdicionar.push({ titulo: 'Evolução do Peso', svg: dados.graficos.peso });
    }
    if (dados.graficos.au) {
      graficosParaAdicionar.push({ titulo: 'Evolução da Altura Uterina', svg: dados.graficos.au });
    }
    if (dados.graficos.pa) {
      graficosParaAdicionar.push({ titulo: 'Evolução da Pressão Arterial', svg: dados.graficos.pa });
    }

    for (const grafico of graficosParaAdicionar) {
      checkNewPage(70);
      drawSectionTitle(grafico.titulo);
      
      try {
        const pngBase64 = await svgToPngBase64(grafico.svg);
        if (pngBase64) {
          const imgWidth = contentWidth * 0.9;
          const imgHeight = 50;
          doc.addImage(pngBase64, 'PNG', margin + (contentWidth - imgWidth) / 2, y, imgWidth, imgHeight);
          y += imgHeight + 5;
        }
      } catch (error) {
        console.error('Erro ao adicionar gráfico:', error);
      }
    }
  }

  // ===== HISTÓRICO DE CONSULTAS =====
  if (dados.consultas.length > 0) {
    checkNewPage(40);
    drawSectionTitle('Historico de Consultas');
    
    const colWidths = [22, 18, 18, 18, 18, 18, 68];
    const headers = ['Data', 'IG', 'Peso', 'PA', 'AU', 'BCF', 'Conduta'];
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 3, contentWidth, 7, 'F');
    
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x + 1, y);
      x += colWidths[i];
    });
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    dados.consultas.forEach((consulta, index) => {
      if (checkNewPage(8)) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
        let x = margin;
        headers.forEach((header, i) => {
          doc.text(header, x + 1, y);
          x += colWidths[i];
        });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3, contentWidth, 6, 'F');
      }
      
      const pesoFormatado = consulta.peso ? `${(consulta.peso / 1000).toFixed(1)}kg` : '-';
      const auFormatado = consulta.au === -1 ? 'NP' : (consulta.au ? `${(consulta.au / 10).toFixed(0)}cm` : '-');
      const bcfFormatado = consulta.bcf === 1 ? '+' : consulta.bcf === 0 ? '-' : '-';
      
      let condutaFormatada = '-';
      if (consulta.conduta) {
        try {
          const condutas = JSON.parse(consulta.conduta);
          if (Array.isArray(condutas) && condutas.length > 0) {
            condutaFormatada = condutas.slice(0, 2).join(', ');
            if (condutas.length > 2) condutaFormatada += '...';
          }
        } catch {
          condutaFormatada = consulta.conduta.substring(0, 30);
        }
      }
      
      const rowData = [
        formatarData(consulta.dataConsulta),
        consulta.igDUM || '-',
        pesoFormatado,
        consulta.pa || '-',
        auFormatado,
        bcfFormatado,
        condutaFormatada,
      ];
      
      x = margin;
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      rowData.forEach((cell, i) => {
        const maxWidth = colWidths[i] - 2;
        let text = cell;
        if (doc.getTextWidth(text) > maxWidth) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(sanitizeForPdf(text), x + 1, y);
        x += colWidths[i];
      });
      y += 5;
    });
    y += 5;
  }

  // ===== MARCOS IMPORTANTES =====
  if (dados.marcos.length > 0) {
    checkNewPage(30);
    drawSectionTitle('Marcos Importantes');
    
    dados.marcos.forEach(marco => {
      checkNewPage(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const tituloText = sanitizeForPdf(marco.titulo);
      const tituloWidth = doc.getTextWidth(tituloText);
      doc.text(tituloText, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      const complemento = sanitizeForPdf(` - ${formatarData(marco.data)} (${marco.periodo})`);
      doc.text(complemento, margin + 2 + tituloWidth + 1, y);
      y += 6;
    });
    y += 3;
  }

  // ===== ULTRASSONS =====
  if (dados.ultrassons.length > 0) {
    checkNewPage(30);
    drawSectionTitle('Ultrassons Realizados');
    
    dados.ultrassons.forEach(us => {
      checkNewPage(12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const tipoLabel = sanitizeForPdf(formatarLabel(us.tipo, TIPO_ULTRASSOM_LABELS));
      const tipoWidth = doc.getTextWidth(tipoLabel);
      doc.text(tipoLabel, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      const complemento = sanitizeForPdf(` - ${formatarData(us.data)} (${us.ig})`);
      doc.text(complemento, margin + 2 + tipoWidth + 1, y);
      y += 5;
      if (us.observacoes) {
        doc.setFontSize(8);
        doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
        doc.text(sanitizeForPdf(`   ${us.observacoes}`), margin + 4, y);
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        y += 5;
      }
    });
    y += 3;
  }

  // ===== EXAMES LABORATORIAIS =====
  if (dados.exames.length > 0) {
    checkNewPage(40);
    drawSectionTitle('Exames Laboratoriais');
    
    const exameColWidths = [50, 40, 40, 40];
    const exameHeaders = ['Exame', '1o Tri', '2o Tri', '3o Tri'];
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 3, contentWidth, 7, 'F');
    
    let x = margin;
    exameHeaders.forEach((header, i) => {
      doc.text(header, x + 1, y);
      x += exameColWidths[i];
    });
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    dados.exames.forEach((exame, index) => {
      if (checkNewPage(8)) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
        let x = margin;
        exameHeaders.forEach((header, i) => {
          doc.text(header, x + 1, y);
          x += exameColWidths[i];
        });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3, contentWidth, 6, 'F');
      }
      
      const rowData = [
        exame.nome,
        exame.trimestre1?.resultado || '-',
        exame.trimestre2?.resultado || '-',
        exame.trimestre3?.resultado || '-',
      ];
      
      x = margin;
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      rowData.forEach((cell, i) => {
        const maxWidth = exameColWidths[i] - 2;
        let text = cell;
        if (doc.getTextWidth(text) > maxWidth) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(sanitizeForPdf(text), x + 1, y);
        x += exameColWidths[i];
      });
      y += 5;
    });
  }

  // ===== CONDUTAS DETALHADAS =====
  const consultasComConduta = dados.consultas.filter(
    c => c.conduta || c.condutaComplementacao || c.observacoes
  );
  if (consultasComConduta.length > 0) {
    checkNewPage(30);
    drawSectionTitle('Condutas Detalhadas');
    
    consultasComConduta.forEach((consulta, index) => {
      // Calcular espaço necessário para esta consulta
      let alturaEstimada = 8; // cabeçalho da data
      if (consulta.conduta) alturaEstimada += 6;
      if (consulta.condutaComplementacao) alturaEstimada += 6;
      if (consulta.observacoes) alturaEstimada += 6;
      checkNewPage(alturaEstimada + 5);
      
      // Linha separadora entre consultas
      if (index > 0) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y - 1, margin + contentWidth, y - 1);
        y += 2;
      }
      
      // Data e IG da consulta
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
      const igInfo = consulta.igDUM ? ` (IG: ${consulta.igDUM})` : '';
      doc.text(sanitizeForPdf(`${formatarData(consulta.dataConsulta)}${igInfo}`), margin + 2, y);
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      y += 5;
      
      // Condutas (JSON array)
      if (consulta.conduta) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Condutas:', margin + 4, y);
        doc.setFont('helvetica', 'normal');
        try {
          const condutas = JSON.parse(consulta.conduta);
          if (Array.isArray(condutas) && condutas.length > 0) {
            const condutaTexto = sanitizeForPdf(condutas.join(', '));
            const condutaLabelWidth = doc.getTextWidth('Condutas: ');
            const maxCondutaWidth = contentWidth - 6 - condutaLabelWidth;
            const linhasConduta = doc.splitTextToSize(condutaTexto, maxCondutaWidth);
            if (linhasConduta.length === 1) {
              doc.text(condutaTexto, margin + 4 + condutaLabelWidth, y);
              y += 5;
            } else {
              y += 4;
              linhasConduta.forEach((linha: string) => {
                checkNewPage(5);
                doc.text(sanitizeForPdf(linha), margin + 6, y);
                y += 4;
              });
              y += 1;
            }
          } else {
            y += 5;
          }
        } catch {
          // Se nao for JSON, exibir como texto
          const condutaLabelWidth = doc.getTextWidth('Condutas: ');
          const maxWidth = contentWidth - 6 - condutaLabelWidth;
          const linhas = doc.splitTextToSize(sanitizeForPdf(consulta.conduta), maxWidth);
          if (linhas.length === 1) {
            doc.text(sanitizeForPdf(consulta.conduta), margin + 4 + condutaLabelWidth, y);
            y += 5;
          } else {
            y += 4;
            linhas.forEach((linha: string) => {
              checkNewPage(5);
              doc.text(sanitizeForPdf(linha), margin + 6, y);
              y += 4;
            });
            y += 1;
          }
        }
      }
      
      // Complementacao da conduta
      if (consulta.condutaComplementacao) {
        checkNewPage(8);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Complementacao:', margin + 4, y);
        doc.setFont('helvetica', 'normal');
        const compLabelWidth = doc.getTextWidth('Complementacao: ');
        const maxCompWidth = contentWidth - 6 - compLabelWidth;
        const linhasComp = doc.splitTextToSize(sanitizeForPdf(consulta.condutaComplementacao), maxCompWidth);
        if (linhasComp.length === 1) {
          doc.text(sanitizeForPdf(consulta.condutaComplementacao), margin + 4 + compLabelWidth, y);
          y += 5;
        } else {
          y += 4;
          linhasComp.forEach((linha: string) => {
            checkNewPage(5);
            doc.text(sanitizeForPdf(linha), margin + 6, y);
            y += 4;
          });
          y += 1;
        }
      }
      
      // Observacoes
      if (consulta.observacoes) {
        checkNewPage(8);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Observacoes:', margin + 4, y);
        doc.setFont('helvetica', 'normal');
        const obsLabelWidth = doc.getTextWidth('Observacoes: ');
        const maxObsWidth = contentWidth - 6 - obsLabelWidth;
        const linhasObs = doc.splitTextToSize(sanitizeForPdf(consulta.observacoes), maxObsWidth);
        if (linhasObs.length === 1) {
          doc.text(sanitizeForPdf(consulta.observacoes), margin + 4 + obsLabelWidth, y);
          y += 5;
        } else {
          y += 4;
          linhasObs.forEach((linha: string) => {
            checkNewPage(5);
            doc.text(sanitizeForPdf(linha), margin + 6, y);
            y += 4;
          });
          y += 1;
        }
      }
      
      y += 2;
    });
    y += 3;
  }

  // ===== RODAPÉ =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.text(
      sanitizeForPdf(`Gerado em ${new Date().toLocaleDateString('pt-BR')} - Pagina ${i} de ${totalPages}`),
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  console.log('[htmlToPdf] PDF gerado com sucesso via jsPDF (gráficos nativos)');
  
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

/**
 * Função de compatibilidade
 * @deprecated Use gerarPdfComJsPDF diretamente
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  throw new Error('htmlToPdf está deprecado. Use gerarPdfComJsPDF diretamente.');
}
