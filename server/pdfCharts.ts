/**
 * Gerador de gráficos SVG para o PDF do Cartão de Pré-natal
 * Usa SVG puro convertido para PNG via sharp (sem dependências nativas como canvas)
 */

import { ConsultaPrenatal } from '../drizzle/schema';
import sharp from 'sharp';

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

interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

/**
 * Converte SVG para Buffer PNG usando sharp
 */
async function svgToBuffer(svg: string): Promise<Buffer> {
  try {
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    return pngBuffer;
  } catch (error) {
    console.error('[pdfCharts] Erro ao converter SVG para PNG:', error);
    // Retornar um PNG vazio em caso de erro
    return Buffer.from('');
  }
}

/**
 * Gera gráfico de Altura Uterina como SVG string
 */
function gerarSVGAU(consultas: ConsultaPrenatal[]): string {
  const width = 500;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const xMin = 12, xMax = 42;
  const yMin = 0, yMax = 45;
  
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Área de referência (percentis 10-90)
  const weeks = Object.keys(auReferenceData).map(Number).sort((a, b) => a - b);
  let areaPath = `M ${scaleX(weeks[0])} ${scaleY(auReferenceData[weeks[0]].max)}`;
  weeks.forEach(week => {
    areaPath += ` L ${scaleX(week)} ${scaleY(auReferenceData[week].max)}`;
  });
  for (let i = weeks.length - 1; i >= 0; i--) {
    areaPath += ` L ${scaleX(weeks[i])} ${scaleY(auReferenceData[weeks[i]].min)}`;
  }
  areaPath += ' Z';
  svg += `<path d="${areaPath}" fill="rgba(200, 200, 200, 0.3)"/>`;
  
  // Linhas de referência tracejadas
  let maxPath = `M ${scaleX(weeks[0])} ${scaleY(auReferenceData[weeks[0]].max)}`;
  let minPath = `M ${scaleX(weeks[0])} ${scaleY(auReferenceData[weeks[0]].min)}`;
  let medianPath = `M ${scaleX(weeks[0])} ${scaleY(auReferenceData[weeks[0]].median)}`;
  weeks.forEach(week => {
    maxPath += ` L ${scaleX(week)} ${scaleY(auReferenceData[week].max)}`;
    minPath += ` L ${scaleX(week)} ${scaleY(auReferenceData[week].min)}`;
    medianPath += ` L ${scaleX(week)} ${scaleY(auReferenceData[week].median)}`;
  });
  svg += `<path d="${maxPath}" fill="none" stroke="#999999" stroke-width="1" stroke-dasharray="5,5"/>`;
  svg += `<path d="${minPath}" fill="none" stroke="#999999" stroke-width="1" stroke-dasharray="5,5"/>`;
  svg += `<path d="${medianPath}" fill="none" stroke="#666666" stroke-width="1" stroke-dasharray="3,3"/>`;
  
  // Processar dados das consultas
  const dataPoints: ChartDataPoint[] = consultas
    .filter(c => c.alturaUterina && c.alturaUterina > 0)
    .map(c => {
      let igSemanas = c.igUltrassomSemanas || c.igDumSemanas || 0;
      if (c.igUltrassomDias) igSemanas += c.igUltrassomDias / 7;
      else if (c.igDumDias) igSemanas += c.igDumDias / 7;
      
      const auCm = (c.alturaUterina as number) / 10;
      return { x: igSemanas, y: auCm };
    })
    .filter(p => p.x >= 12 && p.x <= 42)
    .sort((a, b) => a.x - b.x);
  
  // Linha dos dados
  if (dataPoints.length > 0) {
    let dataPath = `M ${scaleX(dataPoints[0].x)} ${scaleY(dataPoints[0].y)}`;
    dataPoints.forEach(p => {
      dataPath += ` L ${scaleX(p.x)} ${scaleY(p.y)}`;
    });
    svg += `<path d="${dataPath}" fill="none" stroke="#8B4049" stroke-width="2"/>`;
    
    // Pontos e labels
    dataPoints.forEach(p => {
      svg += `<circle cx="${scaleX(p.x)}" cy="${scaleY(p.y)}" r="5" fill="#8B4049"/>`;
      svg += `<text x="${scaleX(p.x)}" y="${scaleY(p.y) - 8}" text-anchor="middle" font-size="9" fill="#8B4049" font-weight="bold">${p.y}</text>`;
    });
  }
  
  // Eixos
  svg += `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#333333" stroke-width="1"/>`;
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#333333" stroke-width="1"/>`;
  
  // Labels eixo X
  for (let week = 12; week <= 42; week += 4) {
    svg += `<text x="${scaleX(week)}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#666666">${week}s</text>`;
  }
  
  // Labels eixo Y
  for (let y = 0; y <= 45; y += 10) {
    svg += `<text x="${padding.left - 5}" y="${scaleY(y) + 3}" text-anchor="end" font-size="9" fill="#666666">${y}</text>`;
  }
  
  // Título
  svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="12" font-weight="bold" fill="#8B4049">Evolução da Altura Uterina (AU)</text>`;
  
  // Labels dos eixos
  svg += `<text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-size="10" fill="#666666">Idade Gestacional (semanas)</text>`;
  svg += `<text x="12" y="${height / 2}" text-anchor="middle" font-size="10" fill="#666666" transform="rotate(-90, 12, ${height / 2})">AU (cm)</text>`;
  
  svg += '</svg>';
  return svg;
}

/**
 * Gera gráfico de Pressão Arterial como SVG string
 */
function gerarSVGPA(consultas: ConsultaPrenatal[]): string {
  const width = 500;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const xMin = 4, xMax = 42;
  const yMin = 40, yMax = 160;
  
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Linhas de limite de hipertensão
  svg += `<line x1="${padding.left}" y1="${scaleY(140)}" x2="${width - padding.right}" y2="${scaleY(140)}" stroke="rgba(255, 0, 0, 0.5)" stroke-width="1" stroke-dasharray="5,5"/>`;
  svg += `<line x1="${padding.left}" y1="${scaleY(90)}" x2="${width - padding.right}" y2="${scaleY(90)}" stroke="rgba(0, 0, 255, 0.5)" stroke-width="1" stroke-dasharray="5,5"/>`;
  
  // Processar dados
  const sistolicaPoints: ChartDataPoint[] = [];
  const diastolicaPoints: ChartDataPoint[] = [];
  
  consultas.forEach(c => {
    if (!c.pressaoArterial) return;
    
    const match = c.pressaoArterial.match(/(\d+)\s*[\/x]\s*(\d+)/);
    if (!match) return;
    
    const sistolica = parseInt(match[1]);
    const diastolica = parseInt(match[2]);
    
    let igSemanas = c.igUltrassomSemanas || c.igDumSemanas || 0;
    if (c.igUltrassomDias) igSemanas += c.igUltrassomDias / 7;
    else if (c.igDumDias) igSemanas += c.igDumDias / 7;
    
    if (igSemanas >= 4 && igSemanas <= 42) {
      sistolicaPoints.push({ x: igSemanas, y: sistolica });
      diastolicaPoints.push({ x: igSemanas, y: diastolica });
    }
  });
  
  sistolicaPoints.sort((a, b) => a.x - b.x);
  diastolicaPoints.sort((a, b) => a.x - b.x);
  
  // Linha sistólica
  if (sistolicaPoints.length > 0) {
    let sisPath = `M ${scaleX(sistolicaPoints[0].x)} ${scaleY(sistolicaPoints[0].y)}`;
    sistolicaPoints.forEach(p => {
      sisPath += ` L ${scaleX(p.x)} ${scaleY(p.y)}`;
    });
    svg += `<path d="${sisPath}" fill="none" stroke="#DC2626" stroke-width="2"/>`;
    
    sistolicaPoints.forEach(p => {
      svg += `<circle cx="${scaleX(p.x)}" cy="${scaleY(p.y)}" r="4" fill="#DC2626"/>`;
      svg += `<text x="${scaleX(p.x)}" y="${scaleY(p.y) - 8}" text-anchor="middle" font-size="8" fill="#333333">${p.y}</text>`;
    });
  }
  
  // Linha diastólica
  if (diastolicaPoints.length > 0) {
    let diaPath = `M ${scaleX(diastolicaPoints[0].x)} ${scaleY(diastolicaPoints[0].y)}`;
    diastolicaPoints.forEach(p => {
      diaPath += ` L ${scaleX(p.x)} ${scaleY(p.y)}`;
    });
    svg += `<path d="${diaPath}" fill="none" stroke="#2563EB" stroke-width="2"/>`;
    
    diastolicaPoints.forEach(p => {
      svg += `<circle cx="${scaleX(p.x)}" cy="${scaleY(p.y)}" r="4" fill="#2563EB"/>`;
      svg += `<text x="${scaleX(p.x)}" y="${scaleY(p.y) + 14}" text-anchor="middle" font-size="8" fill="#333333">${p.y}</text>`;
    });
  }
  
  // Eixos
  svg += `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#333333" stroke-width="1"/>`;
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#333333" stroke-width="1"/>`;
  
  // Labels eixo X
  for (let week = 4; week <= 42; week += 4) {
    svg += `<text x="${scaleX(week)}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#666666">${week}s</text>`;
  }
  
  // Labels eixo Y
  for (let y = 40; y <= 160; y += 20) {
    svg += `<text x="${padding.left - 5}" y="${scaleY(y) + 3}" text-anchor="end" font-size="9" fill="#666666">${y}</text>`;
  }
  
  // Título
  svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="12" font-weight="bold" fill="#8B4049">Evolução da Pressão Arterial</text>`;
  
  // Legenda
  svg += `<rect x="${width - 120}" y="8" width="10" height="10" fill="#DC2626"/>`;
  svg += `<text x="${width - 105}" y="16" font-size="9" fill="#333333">Sistólica</text>`;
  svg += `<rect x="${width - 60}" y="8" width="10" height="10" fill="#2563EB"/>`;
  svg += `<text x="${width - 45}" y="16" font-size="9" fill="#333333">Diastólica</text>`;
  
  // Labels dos eixos
  svg += `<text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-size="10" fill="#666666">Idade Gestacional (semanas)</text>`;
  svg += `<text x="12" y="${height / 2}" text-anchor="middle" font-size="10" fill="#666666" transform="rotate(-90, 12, ${height / 2})">PA (mmHg)</text>`;
  
  svg += '</svg>';
  return svg;
}

/**
 * Gera gráfico de Peso como SVG string
 */
function gerarSVGPeso(consultas: ConsultaPrenatal[]): string {
  const width = 500;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Processar dados
  const dataPoints: ChartDataPoint[] = consultas
    .filter(c => c.peso && c.peso > 0)
    .map(c => {
      let igSemanas = c.igUltrassomSemanas || c.igDumSemanas || 0;
      if (c.igUltrassomDias) igSemanas += c.igUltrassomDias / 7;
      else if (c.igDumDias) igSemanas += c.igDumDias / 7;
      
      return { x: igSemanas, y: c.peso as number };
    })
    .filter(p => p.x >= 0 && p.x <= 42)
    .sort((a, b) => a.x - b.x);
  
  if (dataPoints.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: white; font-family: Arial, sans-serif;">
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="12" fill="#666666">Sem dados de peso disponíveis</text>
    </svg>`;
  }
  
  const xMin = 0, xMax = 42;
  const yValues = dataPoints.map(p => p.y);
  const yMin = Math.floor(Math.min(...yValues) - 5);
  const yMax = Math.ceil(Math.max(...yValues) + 5);
  
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Linha dos dados
  let dataPath = `M ${scaleX(dataPoints[0].x)} ${scaleY(dataPoints[0].y)}`;
  dataPoints.forEach(p => {
    dataPath += ` L ${scaleX(p.x)} ${scaleY(p.y)}`;
  });
  svg += `<path d="${dataPath}" fill="none" stroke="#8B4049" stroke-width="2"/>`;
  
  // Pontos e labels
  dataPoints.forEach(p => {
    svg += `<circle cx="${scaleX(p.x)}" cy="${scaleY(p.y)}" r="4" fill="#8B4049"/>`;
    svg += `<text x="${scaleX(p.x)}" y="${scaleY(p.y) - 8}" text-anchor="middle" font-size="9" fill="#333333">${p.y.toFixed(1)}</text>`;
  });
  
  // Eixos
  svg += `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#333333" stroke-width="1"/>`;
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#333333" stroke-width="1"/>`;
  
  // Labels eixo X
  for (let week = 0; week <= 42; week += 4) {
    svg += `<text x="${scaleX(week)}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#666666">${week}s</text>`;
  }
  
  // Labels eixo Y
  const yStep = Math.ceil((yMax - yMin) / 5);
  for (let y = yMin; y <= yMax; y += yStep) {
    svg += `<text x="${padding.left - 5}" y="${scaleY(y) + 3}" text-anchor="end" font-size="9" fill="#666666">${y}</text>`;
  }
  
  // Título
  svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="12" font-weight="bold" fill="#8B4049">Evolução do Peso Gestacional</text>`;
  
  // Labels dos eixos
  svg += `<text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-size="10" fill="#666666">Idade Gestacional (semanas)</text>`;
  svg += `<text x="12" y="${height / 2}" text-anchor="middle" font-size="10" fill="#666666" transform="rotate(-90, 12, ${height / 2})">Peso (kg)</text>`;
  
  svg += '</svg>';
  return svg;
}

/**
 * Gera gráfico de Altura Uterina como imagem PNG
 */
export async function gerarGraficoAU(consultas: ConsultaPrenatal[]): Promise<Buffer> {
  const svg = gerarSVGAU(consultas);
  return svgToBuffer(svg);
}

/**
 * Gera gráfico de Pressão Arterial como imagem PNG
 */
export async function gerarGraficoPA(consultas: ConsultaPrenatal[]): Promise<Buffer> {
  const svg = gerarSVGPA(consultas);
  return svgToBuffer(svg);
}

/**
 * Gera gráfico de Peso Gestacional como imagem PNG
 */
export async function gerarGraficoPeso(
  consultas: ConsultaPrenatal[],
  pesoInicial: number | null,
  altura: number | null
): Promise<Buffer> {
  const svg = gerarSVGPeso(consultas);
  return svgToBuffer(svg);
}
