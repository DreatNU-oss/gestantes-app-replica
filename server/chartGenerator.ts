/**
 * Gerador de gráficos SVG puro para o PDF do Cartão de Pré-natal
 * Retorna SVG como string para ser inserido diretamente no HTML
 * Não usa dependências nativas, funciona em qualquer ambiente
 * Inclui curvas de referência de percentis 10 e 90 para AU
 */

export interface DadoConsulta {
  dataConsulta: string;
  igSemanas?: number;
  peso?: number | null;
  au?: number | null;
  paSistolica?: number | null;
  paDiastolica?: number | null;
}

interface ChartConfig {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

const defaultConfig: ChartConfig = {
  width: 400,
  height: 220,
  padding: { top: 40, right: 20, bottom: 50, left: 50 }
};

// Dados de referência para Altura Uterina (Ministério da Saúde/FEBRASGO)
// Percentis 10 (min) e 90 (max) por semana gestacional
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

// Função auxiliar para criar path de linha suave
function createLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
}

// Função para mapear valores para coordenadas do gráfico
function mapToCoords(
  values: number[],
  labels: string[],
  config: ChartConfig,
  minY: number,
  maxY: number
): { x: number; y: number }[] {
  const chartWidth = config.width - config.padding.left - config.padding.right;
  const chartHeight = config.height - config.padding.top - config.padding.bottom;
  
  return values.map((val, i) => ({
    x: config.padding.left + (i / Math.max(labels.length - 1, 1)) * chartWidth,
    y: config.padding.top + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight
  }));
}

// Função para mapear semanas para coordenadas X
function mapWeekToX(week: number, minWeek: number, maxWeek: number, config: ChartConfig): number {
  const chartWidth = config.width - config.padding.left - config.padding.right;
  return config.padding.left + ((week - minWeek) / (maxWeek - minWeek)) * chartWidth;
}

// Função para mapear valor para coordenada Y
function mapValueToY(value: number, minY: number, maxY: number, config: ChartConfig): number {
  const chartHeight = config.height - config.padding.top - config.padding.bottom;
  return config.padding.top + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
}

// Gerar SVG do gráfico de peso
export async function gerarGraficoPeso(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.peso && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const config = defaultConfig;
  const labels = dadosValidos.map(c => `${c.igSemanas}s`);
  const pesos = dadosValidos.map(c => c.peso as number);
  
  const minY = Math.floor(Math.min(...pesos) - 2);
  const maxY = Math.ceil(Math.max(...pesos) + 2);
  const points = mapToCoords(pesos, labels, config, minY, maxY);
  
  const chartWidth = config.width - config.padding.left - config.padding.right;
  const chartHeight = config.height - config.padding.top - config.padding.bottom;

  // Criar SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Título
  svg += `<text x="${config.width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Evolução do Peso</text>`;
  
  // Eixo Y
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = config.padding.top + (i / ySteps) * chartHeight;
    const value = maxY - (i / ySteps) * (maxY - minY);
    svg += `<line x1="${config.padding.left}" y1="${y}" x2="${config.padding.left + chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
    svg += `<text x="${config.padding.left - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value.toFixed(0)}</text>`;
  }
  
  // Eixo X labels
  labels.forEach((label, i) => {
    const x = config.padding.left + (i / Math.max(labels.length - 1, 1)) * chartWidth;
    svg += `<text x="${x}" y="${config.height - 20}" text-anchor="middle" font-size="10" fill="#666">${label}</text>`;
  });
  
  // Labels dos eixos
  svg += `<text x="${config.width / 2}" y="${config.height - 5}" text-anchor="middle" font-size="11" fill="#333">Idade Gestacional</text>`;
  svg += `<text x="15" y="${config.height / 2}" text-anchor="middle" font-size="11" fill="#333" transform="rotate(-90, 15, ${config.height / 2})">Peso (kg)</text>`;
  
  // Área preenchida
  const areaPath = createLinePath(points) + 
    ` L ${points[points.length - 1].x} ${config.padding.top + chartHeight}` +
    ` L ${points[0].x} ${config.padding.top + chartHeight} Z`;
  svg += `<path d="${areaPath}" fill="rgba(114, 47, 55, 0.1)"/>`;
  
  // Linha
  svg += `<path d="${createLinePath(points)}" fill="none" stroke="#722F37" stroke-width="2"/>`;
  
  // Pontos e valores
  points.forEach((point, i) => {
    svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#722F37"/>`;
    svg += `<text x="${point.x}" y="${point.y - 8}" text-anchor="middle" font-size="9" fill="#722F37" font-weight="bold">${pesos[i].toFixed(1)}</text>`;
  });
  
  svg += '</svg>';
  
  // Retornar SVG como string (não base64)
  return svg;
}

// Gerar SVG do gráfico de altura uterina com curvas de referência
export async function gerarGraficoAU(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.au && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const config = defaultConfig;
  
  // Determinar range de semanas baseado nos dados
  const semanasData = dadosValidos.map(c => c.igSemanas as number);
  const minWeek = Math.max(12, Math.min(...semanasData) - 2);
  const maxWeek = Math.min(42, Math.max(...semanasData) + 2);
  
  // Range Y fixo para AU
  const minY = 0;
  const maxY = 45;
  
  const chartWidth = config.width - config.padding.left - config.padding.right;
  const chartHeight = config.height - config.padding.top - config.padding.bottom;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Título
  svg += `<text x="${config.width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Evolução da Altura Uterina</text>`;
  
  // Legenda para curvas de referência
  svg += `<rect x="${config.width - 95}" y="8" width="8" height="8" fill="rgba(156, 163, 175, 0.3)" stroke="#9ca3af" stroke-width="1"/>`;
  svg += `<text x="${config.width - 83}" y="15" font-size="8" fill="#666">P10-P90</text>`;
  
  // Gerar área de referência (percentis 10-90)
  const refWeeks = Object.keys(auReferenceData).map(Number).filter(w => w >= minWeek && w <= maxWeek).sort((a, b) => a - b);
  
  if (refWeeks.length > 1) {
    // Criar path para área sombreada entre percentis 10 e 90
    let areaPath = `M ${mapWeekToX(refWeeks[0], minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[refWeeks[0]].max, minY, maxY, config)}`;
    
    // Linha superior (percentil 90)
    refWeeks.forEach(week => {
      areaPath += ` L ${mapWeekToX(week, minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[week].max, minY, maxY, config)}`;
    });
    
    // Linha inferior (percentil 10) - voltando
    for (let i = refWeeks.length - 1; i >= 0; i--) {
      areaPath += ` L ${mapWeekToX(refWeeks[i], minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[refWeeks[i]].min, minY, maxY, config)}`;
    }
    areaPath += ' Z';
    
    svg += `<path d="${areaPath}" fill="rgba(156, 163, 175, 0.2)"/>`;
    
    // Linha do percentil 90 (tracejada)
    let p90Path = `M ${mapWeekToX(refWeeks[0], minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[refWeeks[0]].max, minY, maxY, config)}`;
    refWeeks.forEach(week => {
      p90Path += ` L ${mapWeekToX(week, minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[week].max, minY, maxY, config)}`;
    });
    svg += `<path d="${p90Path}" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4,2"/>`;
    
    // Linha do percentil 10 (tracejada)
    let p10Path = `M ${mapWeekToX(refWeeks[0], minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[refWeeks[0]].min, minY, maxY, config)}`;
    refWeeks.forEach(week => {
      p10Path += ` L ${mapWeekToX(week, minWeek, maxWeek, config)} ${mapValueToY(auReferenceData[week].min, minY, maxY, config)}`;
    });
    svg += `<path d="${p10Path}" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4,2"/>`;
  }
  
  // Eixo Y
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = config.padding.top + (i / ySteps) * chartHeight;
    const value = maxY - (i / ySteps) * (maxY - minY);
    svg += `<line x1="${config.padding.left}" y1="${y}" x2="${config.padding.left + chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
    svg += `<text x="${config.padding.left - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value.toFixed(0)}</text>`;
  }
  
  // Eixo X labels (semanas)
  const weekStep = Math.ceil((maxWeek - minWeek) / 6);
  for (let week = minWeek; week <= maxWeek; week += weekStep) {
    const x = mapWeekToX(week, minWeek, maxWeek, config);
    svg += `<text x="${x}" y="${config.height - 20}" text-anchor="middle" font-size="10" fill="#666">${week}s</text>`;
  }
  
  // Labels dos eixos
  svg += `<text x="${config.width / 2}" y="${config.height - 5}" text-anchor="middle" font-size="11" fill="#333">Idade Gestacional</text>`;
  svg += `<text x="15" y="${config.height / 2}" text-anchor="middle" font-size="11" fill="#333" transform="rotate(-90, 15, ${config.height / 2})">AU (cm)</text>`;
  
  // Mapear pontos dos dados reais
  const dataPoints = dadosValidos.map(c => ({
    x: mapWeekToX(c.igSemanas as number, minWeek, maxWeek, config),
    y: mapValueToY(c.au as number, minY, maxY, config),
    value: c.au as number
  }));
  
  // Área preenchida dos dados
  if (dataPoints.length > 1) {
    let areaPath = createLinePath(dataPoints) + 
      ` L ${dataPoints[dataPoints.length - 1].x} ${config.padding.top + chartHeight}` +
      ` L ${dataPoints[0].x} ${config.padding.top + chartHeight} Z`;
    svg += `<path d="${areaPath}" fill="rgba(37, 99, 235, 0.1)"/>`;
  }
  
  // Linha dos dados
  svg += `<path d="${createLinePath(dataPoints)}" fill="none" stroke="#2563eb" stroke-width="2"/>`;
  
  // Pontos e valores
  dataPoints.forEach((point) => {
    svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#2563eb"/>`;
    svg += `<text x="${point.x}" y="${point.y - 8}" text-anchor="middle" font-size="9" fill="#2563eb" font-weight="bold">${point.value}</text>`;
  });
  
  svg += '</svg>';
  
  return svg;
}

// Gerar SVG do gráfico de pressão arterial com linhas de referência
export async function gerarGraficoPA(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.paSistolica && c.paDiastolica && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const config = defaultConfig;
  const labels = dadosValidos.map(c => `${c.igSemanas}s`);
  const sistolicas = dadosValidos.map(c => c.paSistolica as number);
  const diastolicas = dadosValidos.map(c => c.paDiastolica as number);
  
  const minY = 40;
  const maxY = 180;
  const pointsSis = mapToCoords(sistolicas, labels, config, minY, maxY);
  const pointsDia = mapToCoords(diastolicas, labels, config, minY, maxY);
  
  const chartWidth = config.width - config.padding.left - config.padding.right;
  const chartHeight = config.height - config.padding.top - config.padding.bottom;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Título
  svg += `<text x="${config.width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Evolução da Pressão Arterial</text>`;
  
  // Legenda
  svg += `<rect x="${config.width - 100}" y="8" width="12" height="12" fill="#dc2626"/>`;
  svg += `<text x="${config.width - 85}" y="18" font-size="10" fill="#333">Sistólica</text>`;
  svg += `<rect x="${config.width - 100}" y="22" width="12" height="12" fill="#16a34a"/>`;
  svg += `<text x="${config.width - 85}" y="32" font-size="10" fill="#333">Diastólica</text>`;
  
  // Linhas de referência para hipertensão
  // Limite sistólica 140 mmHg
  const y140 = mapValueToY(140, minY, maxY, config);
  svg += `<line x1="${config.padding.left}" y1="${y140}" x2="${config.padding.left + chartWidth}" y2="${y140}" stroke="#ef4444" stroke-width="1" stroke-dasharray="6,3"/>`;
  svg += `<text x="${config.padding.left + chartWidth + 3}" y="${y140 + 3}" font-size="8" fill="#ef4444">140</text>`;
  
  // Limite diastólica 90 mmHg
  const y90 = mapValueToY(90, minY, maxY, config);
  svg += `<line x1="${config.padding.left}" y1="${y90}" x2="${config.padding.left + chartWidth}" y2="${y90}" stroke="#22c55e" stroke-width="1" stroke-dasharray="6,3"/>`;
  svg += `<text x="${config.padding.left + chartWidth + 3}" y="${y90 + 3}" font-size="8" fill="#22c55e">90</text>`;
  
  // Eixo Y
  const ySteps = 7;
  for (let i = 0; i <= ySteps; i++) {
    const y = config.padding.top + (i / ySteps) * chartHeight;
    const value = maxY - (i / ySteps) * (maxY - minY);
    svg += `<line x1="${config.padding.left}" y1="${y}" x2="${config.padding.left + chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
    svg += `<text x="${config.padding.left - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value.toFixed(0)}</text>`;
  }
  
  // Eixo X labels
  labels.forEach((label, i) => {
    const x = config.padding.left + (i / Math.max(labels.length - 1, 1)) * chartWidth;
    svg += `<text x="${x}" y="${config.height - 20}" text-anchor="middle" font-size="10" fill="#666">${label}</text>`;
  });
  
  // Labels dos eixos
  svg += `<text x="${config.width / 2}" y="${config.height - 5}" text-anchor="middle" font-size="11" fill="#333">Idade Gestacional</text>`;
  svg += `<text x="15" y="${config.height / 2}" text-anchor="middle" font-size="11" fill="#333" transform="rotate(-90, 15, ${config.height / 2})">mmHg</text>`;
  
  // Linha sistólica
  svg += `<path d="${createLinePath(pointsSis)}" fill="none" stroke="#dc2626" stroke-width="2"/>`;
  
  // Linha diastólica
  svg += `<path d="${createLinePath(pointsDia)}" fill="none" stroke="#16a34a" stroke-width="2"/>`;
  
  // Pontos sistólica
  pointsSis.forEach((point, i) => {
    svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#dc2626"/>`;
    svg += `<text x="${point.x}" y="${point.y - 8}" text-anchor="middle" font-size="8" fill="#dc2626" font-weight="bold">${sistolicas[i]}</text>`;
  });
  
  // Pontos diastólica
  pointsDia.forEach((point, i) => {
    svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#16a34a"/>`;
    svg += `<text x="${point.x}" y="${point.y + 12}" text-anchor="middle" font-size="8" fill="#16a34a" font-weight="bold">${diastolicas[i]}</text>`;
  });
  
  svg += '</svg>';
  
  return svg;
}

// Gerar todos os gráficos de uma vez
export async function gerarTodosGraficos(consultas: DadoConsulta[]): Promise<{
  graficoPeso: string;
  graficoAU: string;
  graficoPA: string;
}> {
  const [graficoPeso, graficoAU, graficoPA] = await Promise.all([
    gerarGraficoPeso(consultas),
    gerarGraficoAU(consultas),
    gerarGraficoPA(consultas)
  ]);

  return { graficoPeso, graficoAU, graficoPA };
}
