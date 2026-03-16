import { jsPDF } from 'jspdf';
import { LOGO_MAIS_MULHER_BASE64 } from './logoBase64';
import { FATORES_RISCO_LABELS, TIPO_ULTRASSOM_LABELS, MEDICAMENTO_LABELS, formatarLabel, sanitizeForPdf } from './htmlToPdf_labels';
import { normalizeExamName, EXAM_CATEGORIES } from '../shared/examNormalization';

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
    edema: string | null;
    conduta: string | null;
    condutaComplementacao: string | null;
    observacoes: string | null;
    queixas: string | null;
  }>;
  marcos: Array<{
    titulo: string;
    data: string;
    dataFim?: string;
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
    categoria?: string; // 'sangue' | 'urina' | 'fezes' | 'outros'
  }>;
  fatoresRisco: Array<{ tipo: string }>;
  medicamentos: Array<{ tipo: string; especificacao?: string }>;
  // Dados brutos para gráficos nativos jsPDF
  dadosGraficos?: {
    peso?: Array<{ igSemanas: number; valor: number }>;
    au?: Array<{ igSemanas: number; valor: number }>;
    pa?: Array<{ igSemanas: number; sistolica: number; diastolica: number }>;
  };
  // Dados para curva de peso ideal
  pesoInicial?: number | null; // em gramas
  altura?: number | null; // em cm
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
 * Calcula a curva de peso ideal baseada no IMC pré-gestacional
 * (mesma lógica de calculateWeightCurve em gestante-router.ts)
 */
function calcularCurvaPesoIdeal(pesoInicial: number, altura: number): Array<{ semana: number; pesoMin: number; pesoMax: number }> {
  const alturaM = altura / 100;
  const imc = pesoInicial / 1000 / (alturaM * alturaM);
  
  let ganhoMin: number, ganhoMax: number;
  
  if (imc < 18.5) {
    ganhoMin = 12.5;
    ganhoMax = 18;
  } else if (imc < 25) {
    ganhoMin = 11.5;
    ganhoMax = 16;
  } else if (imc < 30) {
    ganhoMin = 7;
    ganhoMax = 11.5;
  } else {
    ganhoMin = 5;
    ganhoMax = 9;
  }
  
  // Gerar curva semana a semana (0 a 42)
  const curva: Array<{ semana: number; pesoMin: number; pesoMax: number }> = [];
  for (let semana = 0; semana <= 42; semana++) {
    let fator: number;
    if (semana <= 13) {
      fator = (semana / 13) * 0.125; // 1º trimestre: ganho lento
    } else {
      fator = 0.125 + ((semana - 13) / 27) * 0.875; // 2º/3º trimestre: ganho linear
    }
    curva.push({
      semana,
      pesoMin: (pesoInicial + ganhoMin * 1000 * fator) / 1000, // converter para kg
      pesoMax: (pesoInicial + ganhoMax * 1000 * fator) / 1000, // converter para kg
    });
  }
  
  return curva;
}

/**
 * Desenha gráfico de peso diretamente no jsPDF
 * Eixo X proporcional à idade gestacional real + curva de peso ideal
 */
function desenharGraficoPeso(
  doc: jsPDF,
  dados: Array<{ igSemanas: number; valor: number }>,
  startX: number,
  startY: number,
  width: number,
  height: number,
  pesoInicial?: number | null,
  altura?: number | null
): number {
  if (dados.length === 0) return startY;

  const sorted = [...dados].sort((a, b) => a.igSemanas - b.igSemanas);
  const padding = { top: 12, right: 8, bottom: 16, left: 14 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const chartX = startX + padding.left;
  const chartY = startY + padding.top;

  // Eixo X proporcional à idade gestacional
  const semanasData = sorted.map(d => d.igSemanas);
  const minWeek = Math.max(0, Math.min(...semanasData) - 2);
  const maxWeek = Math.min(42, Math.max(...semanasData) + 2);
  
  const mapWeekToX = (week: number) => chartX + ((week - minWeek) / (maxWeek - minWeek)) * chartW;

  // Calcular curva de peso ideal se dados disponíveis
  let curvaPesoIdeal: Array<{ semana: number; pesoMin: number; pesoMax: number }> | null = null;
  if (pesoInicial && pesoInicial > 0 && altura && altura > 0) {
    curvaPesoIdeal = calcularCurvaPesoIdeal(pesoInicial, altura);
  }

  // Calcular range Y considerando dados reais e curva ideal
  const valores = sorted.map(d => d.valor);
  let allMinY = Math.min(...valores);
  let allMaxY = Math.max(...valores);
  
  if (curvaPesoIdeal) {
    const curvaFiltrada = curvaPesoIdeal.filter(c => c.semana >= minWeek && c.semana <= maxWeek);
    if (curvaFiltrada.length > 0) {
      allMinY = Math.min(allMinY, ...curvaFiltrada.map(c => c.pesoMin));
      allMaxY = Math.max(allMaxY, ...curvaFiltrada.map(c => c.pesoMax));
    }
  }
  
  const minY = Math.floor(allMinY - 2);
  const maxY = Math.ceil(allMaxY + 2);
  
  const mapValueToY = (value: number) => chartY + chartH - ((value - minY) / (maxY - minY)) * chartH;

  // Título
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('Peso (kg)', startX + width / 2, startY + 4, { align: 'center' });

  // Desenhar curva de peso ideal (faixa min/max) ANTES do grid
  if (curvaPesoIdeal) {
    const curvaFiltrada = curvaPesoIdeal.filter(c => c.semana >= minWeek && c.semana <= maxWeek);
    if (curvaFiltrada.length > 1) {
      // Área sombreada entre min e max
      doc.setFillColor(200, 230, 200);
      doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
      for (let i = 0; i < curvaFiltrada.length - 1; i++) {
        const x1 = mapWeekToX(curvaFiltrada[i].semana);
        const x2 = mapWeekToX(curvaFiltrada[i + 1].semana);
        const topY = Math.min(mapValueToY(curvaFiltrada[i].pesoMax), mapValueToY(curvaFiltrada[i + 1].pesoMax));
        const botY = Math.max(mapValueToY(curvaFiltrada[i].pesoMin), mapValueToY(curvaFiltrada[i + 1].pesoMin));
        doc.rect(x1, topY, x2 - x1, botY - topY, 'F');
      }
      doc.setGState(new (doc as any).GState({ opacity: 1 }));

      // Linhas tracejadas para min e max
      doc.setDrawColor(76, 175, 80);
      doc.setLineWidth(0.2);
      for (let i = 0; i < curvaFiltrada.length - 1; i++) {
        const x1 = mapWeekToX(curvaFiltrada[i].semana);
        const x2 = mapWeekToX(curvaFiltrada[i + 1].semana);
        const y1t = mapValueToY(curvaFiltrada[i].pesoMax);
        const y2t = mapValueToY(curvaFiltrada[i + 1].pesoMax);
        const y1b = mapValueToY(curvaFiltrada[i].pesoMin);
        const y2b = mapValueToY(curvaFiltrada[i + 1].pesoMin);
        // Tracejado
        for (let s = 0; s < 4; s += 2) {
          const t1 = s / 4, t2 = (s + 1) / 4;
          doc.line(x1 + (x2 - x1) * t1, y1t + (y2t - y1t) * t1, x1 + (x2 - x1) * t2, y1t + (y2t - y1t) * t2);
          doc.line(x1 + (x2 - x1) * t1, y1b + (y2b - y1b) * t1, x1 + (x2 - x1) * t2, y1b + (y2b - y1b) * t2);
        }
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

  // Mapear pontos com eixo X proporcional
  const points = sorted.map(d => ({
    x: mapWeekToX(d.igSemanas),
    y: mapValueToY(d.valor),
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

  // Labels eixo X (semanas) - proporcional
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  const weekStep = Math.ceil((maxWeek - minWeek) / 8);
  for (let week = minWeek; week <= maxWeek; week += weekStep) {
    const x = mapWeekToX(week);
    doc.text(`${week}s`, x, chartY + chartH + 4, { align: 'center' });
  }

  // Legenda da curva ideal
  if (curvaPesoIdeal) {
    doc.setFontSize(5);
    doc.setTextColor(76, 175, 80);
    doc.text('Peso Ideal', startX + width - 12, startY + 10);
  }

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
    const labelText = sanitizeForPdf(label) + ': ';
    doc.text(labelText, margin, y);
    // Measure width while still in bold font for accurate positioning
    const labelWidth = doc.getTextWidth(labelText);
    doc.setFont('helvetica', 'normal');
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
      doc.text('Clínica Mais Mulher', pageWidth / 2, y, { align: 'center' });
      y += 8;
    }
  } else {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.text('Clínica Mais Mulher', pageWidth / 2, y, { align: 'center' });
    y += 8;
  }

  // Título do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
  doc.text('Cartão de Pré-Natal', pageWidth / 2, y, { align: 'center' });
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
  
  // DUM e DPP(DUM) na mesma linha
  if (dados.gestante.dum || dados.gestante.dppDUM) {
    checkNewPage(8);
    doc.setFontSize(10);
    const parts: string[] = [];
    if (dados.gestante.dum) parts.push(`DUM: ${formatarData(dados.gestante.dum)}`);
    if (dados.gestante.dppDUM) parts.push(`DPP (DUM): ${formatarData(dados.gestante.dppDUM)}`);
    const lineText = sanitizeForPdf(parts.join('     '));
    doc.setFont('helvetica', 'normal');
    doc.text(lineText, margin, y);
    y += 6;
  }
  
  // Data 1º US e DPP US na mesma linha
  if (dados.gestante.dataUltrassom || dados.gestante.dppUS) {
    checkNewPage(8);
    doc.setFontSize(10);
    const parts: string[] = [];
    if (dados.gestante.dataUltrassom) parts.push(`Data 1º US: ${formatarData(dados.gestante.dataUltrassom)}`);
    if (dados.gestante.dppUS) parts.push(`DPP (US): ${formatarData(dados.gestante.dppUS)}`);
    const lineText = sanitizeForPdf(parts.join('     '));
    doc.setFont('helvetica', 'normal');
    doc.text(lineText, margin, y);
    y += 6;
  }
  
  // História Obstétrica (sem "GO")
  const ho = `G${dados.gestante.gesta || 0}P${dados.gestante.para || 0}A${dados.gestante.abortos || 0}`;
  drawDataLine('História Obstétrica', ho);
  
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
      desenharGraficoPeso(doc, dados.dadosGraficos.peso, margin, y, halfWidth, chartHeight, dados.pesoInicial, dados.altura);
      
      doc.roundedRect(margin + halfWidth + 4, y, halfWidth, chartHeight, 2, 2);
      desenharGraficoAU(doc, dados.dadosGraficos.au, margin + halfWidth + 4, y, halfWidth, chartHeight);
      
      y += chartHeight + 5;
    } else if (dados.dadosGraficos.peso && dados.dadosGraficos.peso.length > 0) {
      checkNewPage(chartHeight + 10);
      drawSectionTitle('Gráficos de Evolução');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth * 0.6, chartHeight, 2, 2);
      desenharGraficoPeso(doc, dados.dadosGraficos.peso, margin, y, contentWidth * 0.6, chartHeight, dados.pesoInicial, dados.altura);
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
    drawSectionTitle('Histórico de Consultas');
    
    const colWidths = [22, 16, 16, 16, 16, 14, 12, 14, 54];
    const headers = ['Data', 'IG', 'Peso', 'PA', 'AU', 'BCF', 'MF', 'Edema', 'Conduta'];
    
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
      
      const edemaFormatado = consulta.edema || '-';
      const mfFormatado = consulta.mf === 1 ? '+' : consulta.mf === 0 ? '-' : '-';
      
      const rowData = [
        formatarData(consulta.dataConsulta),
        consulta.igDUM || '-',
        pesoFormatado,
        consulta.pa || '-',
        auFormatado,
        bcfFormatado,
        mfFormatado,
        edemaFormatado,
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
      let dataTexto: string;
      if (marco.dataFim) {
        dataTexto = `${formatarData(marco.data)} a ${formatarData(marco.dataFim)}`;
      } else {
        dataTexto = formatarData(marco.data);
      }
      const complemento = sanitizeForPdf(` - ${dataTexto} (${marco.periodo})`);
      doc.text(complemento, margin + 2 + tituloWidth + 1, y);
      y += 6;
    });
    y += 3;
  }

  // ===== ULTRASSONS =====
  if (dados.ultrassons.length > 0) {
    checkNewPage(30);
    drawSectionTitle('Ultrassons Realizados');
    
    // Ordenar cronologicamente (do primeiro ao mais recente)
    const ultrassonsCronologicos = [...dados.ultrassons].sort((a, b) => {
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });
    
    ultrassonsCronologicos.forEach(us => {
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
    
    // Sequência canônica de exames (mesma do frontend examesConfig.ts)
    const EXAMES_SANGUE = [
      'Tipagem sanguínea ABO/Rh', 'Coombs indireto', 'Hemoglobina/Hematócrito', 'Plaquetas',
      'Glicemia de jejum', 'VDRL', 'FTA-ABS IgG', 'FTA-ABS IgM', 'HIV', 'Hepatite B (HBsAg)',
      'Anti-HBs', 'Hepatite C (Anti-HCV)', 'Toxoplasmose IgG', 'Toxoplasmose IgM',
      'Rubéola IgG', 'Rubéola IgM', 'Citomegalovírus IgG', 'Citomegalovírus IgM',
      'TSH', 'T4 Livre', 'Eletroforese de Hemoglobina', 'Ferritina',
      'Vitamina D (25-OH)', 'Vitamina B12', 'TTGO 75g (Curva Glicêmica)'
    ];
    const EXAMES_URINA = ['EAS (Urina tipo 1)', 'Urocultura', 'Proteinúria de 24 horas'];
    const EXAMES_FEZES = ['EPF (Parasitológico de Fezes)'];
    const EXAMES_OUTROS = ['Swab vaginal/retal EGB'];
    
    // Criar mapa de exames por nome canônico para acesso rápido (normaliza variações)
    const examesPorNome = new Map<string, typeof dados.exames[0]>();
    dados.exames.forEach(e => {
      const nomeCanon = normalizeExamName(e.nome);
      // Se já existe com esse nome canônico, mesclar trimestres (não sobrescrever)
      if (examesPorNome.has(nomeCanon)) {
        const existing = examesPorNome.get(nomeCanon)!;
        if (e.trimestre1 && !existing.trimestre1) existing.trimestre1 = e.trimestre1;
        if (e.trimestre2 && !existing.trimestre2) existing.trimestre2 = e.trimestre2;
        if (e.trimestre3 && !existing.trimestre3) existing.trimestre3 = e.trimestre3;
      } else {
        examesPorNome.set(nomeCanon, { ...e, nome: nomeCanon });
      }
    });
    
    // Função para desenhar cabeçalho da tabela
    const exameColWidths = [50, 40, 40, 40];
    const exameHeaders = ['Exame', '1\u00ba Tri', '2\u00ba Tri', '3\u00ba Tri'];
    
    const drawExameTableHeader = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 3, contentWidth, 7, 'F');
      let x = margin;
      exameHeaders.forEach((header, i) => {
        doc.text(sanitizeForPdf(header), x + 1, y);
        x += exameColWidths[i];
      });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    };
    
    // Função para desenhar título de categoria
    const drawCategoryTitle = (titulo: string) => {
      checkNewPage(20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
      doc.text(sanitizeForPdf(titulo), margin + 1, y);
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      y += 5;
      drawExameTableHeader();
    };
    
    // Função para verificar se um resultado de exame é alterado/anormal
    const isResultadoAlterado = (nomeExame: string, resultado: string): boolean => {
      if (!resultado || resultado === '-') return false;
      const r = resultado.toLowerCase().trim();
      
      // Palavras-chave universais de resultado alterado
      const palavrasAlteradas = [
        'reagente', 'positiv', 'detecta', 'presente', 'anormal',
        'alterado', 'elevad', 'aumentad', 'reduzid', 'baixo',
        'insuficien', 'deficien'
      ];
      // Palavras-chave de resultado normal (para evitar falsos positivos)
      const palavrasNormais = [
        'não reagente', 'nao reagente', 'n reagente', 'nr',
        'não reag', 'nao reag', 'negativ', 'não detecta', 'nao detecta',
        'não reativo', 'nao reativo', 'imune', 'normal', 'adequad',
        'ausente', 'suficien'
      ];
      
      // Primeiro verificar se é normal (tem prioridade)
      for (const normal of palavrasNormais) {
        if (r.includes(normal)) return false;
      }
      
      // Depois verificar se é alterado
      for (const alterada of palavrasAlteradas) {
        if (r.includes(alterada)) return true;
      }
      
      // Regras específicas por exame com valores numéricos
      const numMatch = r.match(/([\d.,]+)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1].replace(',', '.'));
        if (isNaN(val)) return false;
        
        const nome = nomeExame.toLowerCase();
        
        // Hemoglobina < 11 g/dl
        if (nome.includes('hemoglobina') || nome.includes('hemat')) {
          if (val < 11 && !r.includes('%')) return true;
        }
        // Plaquetas < 150.000
        if (nome.includes('plaqueta')) {
          const plaq = r.includes('.') && val > 100 ? val * 1000 : val;
          if (plaq < 150000) return true;
        }
        // Glicemia de jejum >= 92 mg/dl
        if (nome.includes('glicemia') && nome.includes('jejum')) {
          if (val >= 92) return true;
        }
        // TSH > 4.0 ou < 0.1
        if (nome === 'tsh') {
          if (val > 4.0 || val < 0.1) return true;
        }
        // TTGO: Jejum >= 92, 1h >= 180, 2h >= 153
        if (nome.includes('ttgo') || nome.includes('curva glic')) {
          // Pode ter múltiplos valores separados por /
          const partes = r.split(/[\/|;,]/).map(p => parseFloat(p.replace(',', '.')));
          if (partes.length >= 1 && partes[0] >= 92) return true;
          if (partes.length >= 2 && partes[1] >= 180) return true;
          if (partes.length >= 3 && partes[2] >= 153) return true;
        }
        // Ferritina < 15
        if (nome.includes('ferritina')) {
          if (val < 15) return true;
        }
        // Vitamina D < 20
        if (nome.includes('vitamina d')) {
          if (val < 20) return true;
        }
        // Vitamina B12 < 200
        if (nome.includes('vitamina b12') || nome.includes('b12')) {
          if (val < 200) return true;
        }
      }
      
      // Urocultura positiva
      if (nomeExame.toLowerCase().includes('urocultura')) {
        if (r.includes('positiv') || r.includes('crescimento')) return true;
      }
      
      // EPF positivo
      if (nomeExame.toLowerCase().includes('epf') || nomeExame.toLowerCase().includes('parasitol')) {
        if (r.includes('positiv') || r.includes('presente') || r.includes('encontrad')) return true;
      }
      
      return false;
    };
    
    // Função para desenhar uma linha de exame
    let rowIndex = 0;
    const drawExameRow = (nomeExame: string) => {
      const exame = examesPorNome.get(nomeExame);
      if (!exame) return; // Exame não tem resultados, pular
      
      if (checkNewPage(8)) {
        drawExameTableHeader();
      }
      
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3, contentWidth, 6, 'F');
      }
      rowIndex++;
      
      const resultados = [
        exame.trimestre1?.resultado || '-',
        exame.trimestre2?.resultado || '-',
        exame.trimestre3?.resultado || '-',
      ];
      const rowData = [exame.nome, ...resultados];
      
      let x = margin;
      doc.setFontSize(7);
      
      rowData.forEach((cell, i) => {
        const maxWidth = exameColWidths[i] - 2;
        let text = cell;
        // Nome do exame em negrito
        if (i === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        } else {
          // Verificar se resultado é alterado
          const alterado = isResultadoAlterado(exame.nome, resultados[i - 1]);
          if (alterado) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(200, 30, 30); // Vermelho
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
          }
        }
        if (doc.getTextWidth(text) > maxWidth) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(sanitizeForPdf(text), x + 1, y);
        x += exameColWidths[i];
      });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      y += 5;
    };
    
    // Renderizar por categoria na sequência do frontend
    // Exames de Sangue
    const temExamesSangue = EXAMES_SANGUE.some(n => examesPorNome.has(n));
    if (temExamesSangue) {
      drawCategoryTitle('Exames de Sangue');
      rowIndex = 0;
      EXAMES_SANGUE.forEach(drawExameRow);
      y += 3;
    }
    
    // Exames de Urina
    const temExamesUrina = EXAMES_URINA.some(n => examesPorNome.has(n));
    if (temExamesUrina) {
      drawCategoryTitle('Exames de Urina');
      rowIndex = 0;
      EXAMES_URINA.forEach(drawExameRow);
      y += 3;
    }
    
    // Exames de Fezes
    const temExamesFezes = EXAMES_FEZES.some(n => examesPorNome.has(n));
    if (temExamesFezes) {
      drawCategoryTitle('Exames de Fezes');
      rowIndex = 0;
      EXAMES_FEZES.forEach(drawExameRow);
      y += 3;
    }
    
    // Pesquisa para E.G.B.
    const temExamesOutros = EXAMES_OUTROS.some(n => examesPorNome.has(n));
    if (temExamesOutros) {
      drawCategoryTitle('Pesquisa para E.G.B.');
      rowIndex = 0;
      EXAMES_OUTROS.forEach(drawExameRow);
      y += 3;
    }
    
    // Exames extras que não estão na sequência canônica -> classificar por categoria
    const todosCanonicos = new Set([...EXAMES_SANGUE, ...EXAMES_URINA, ...EXAMES_FEZES, ...EXAMES_OUTROS]);
    const examesExtrasNomes = Array.from(examesPorNome.keys()).filter(n => !todosCanonicos.has(n));
    // Adicionar extras à categoria correta usando EXAM_CATEGORIES
    examesExtrasNomes.forEach(nome => {
      const cat = EXAM_CATEGORIES[nome] || 'sangue';
      if (cat === 'sangue' && !EXAMES_SANGUE.includes(nome)) {
        // Desenhar na seção de sangue (após os canônicos)
        drawExameRow(nome);
      } else if (cat === 'urina' && !EXAMES_URINA.includes(nome)) {
        drawExameRow(nome);
      } else if (cat === 'fezes' && !EXAMES_FEZES.includes(nome)) {
        drawExameRow(nome);
      } else if (cat === 'egb' && !EXAMES_OUTROS.includes(nome)) {
        drawExameRow(nome);
      }
    });
  }


  // ===== RODAPÉ =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${totalPages}`,
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
