/**
 * Gerador de gráficos SVG puro para o PDF do Cartão de Pré-natal
 * Não usa dependências nativas, funciona em qualquer ambiente
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
  
  // Converter para base64
  return Buffer.from(svg).toString('base64');
}

// Gerar SVG do gráfico de altura uterina
export async function gerarGraficoAU(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.au && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const config = defaultConfig;
  const labels = dadosValidos.map(c => `${c.igSemanas}s`);
  const alturas = dadosValidos.map(c => c.au as number);
  
  const minY = Math.max(0, Math.floor(Math.min(...alturas) - 5));
  const maxY = Math.ceil(Math.max(...alturas) + 5);
  const points = mapToCoords(alturas, labels, config, minY, maxY);
  
  const chartWidth = config.width - config.padding.left - config.padding.right;
  const chartHeight = config.height - config.padding.top - config.padding.bottom;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.height}" style="background: white; font-family: Arial, sans-serif;">`;
  
  // Título
  svg += `<text x="${config.width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Evolução da Altura Uterina</text>`;
  
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
  svg += `<text x="15" y="${config.height / 2}" text-anchor="middle" font-size="11" fill="#333" transform="rotate(-90, 15, ${config.height / 2})">AU (cm)</text>`;
  
  // Área preenchida
  const areaPath = createLinePath(points) + 
    ` L ${points[points.length - 1].x} ${config.padding.top + chartHeight}` +
    ` L ${points[0].x} ${config.padding.top + chartHeight} Z`;
  svg += `<path d="${areaPath}" fill="rgba(37, 99, 235, 0.1)"/>`;
  
  // Linha
  svg += `<path d="${createLinePath(points)}" fill="none" stroke="#2563eb" stroke-width="2"/>`;
  
  // Pontos e valores
  points.forEach((point, i) => {
    svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#2563eb"/>`;
    svg += `<text x="${point.x}" y="${point.y - 8}" text-anchor="middle" font-size="9" fill="#2563eb" font-weight="bold">${alturas[i]}</text>`;
  });
  
  svg += '</svg>';
  
  return Buffer.from(svg).toString('base64');
}

// Gerar SVG do gráfico de pressão arterial
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
  
  return Buffer.from(svg).toString('base64');
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
