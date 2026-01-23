import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { ConsultaPrenatal } from '../drizzle/schema';

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
 * Gera gráfico de Altura Uterina como imagem PNG
 */
export async function gerarGraficoAU(consultas: ConsultaPrenatal[]): Promise<Buffer> {
  const width = 500;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fundo branco
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Área do gráfico
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Escalas
  const xMin = 12, xMax = 42;
  const yMin = 0, yMax = 45;
  
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  
  // Desenhar área de referência (percentis 10-90)
  ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.beginPath();
  const weeks = Object.keys(auReferenceData).map(Number).sort((a, b) => a - b);
  
  // Linha superior (percentil 90)
  ctx.moveTo(scaleX(weeks[0]), scaleY(auReferenceData[weeks[0]].max));
  weeks.forEach(week => {
    ctx.lineTo(scaleX(week), scaleY(auReferenceData[week].max));
  });
  
  // Linha inferior (percentil 10) - reverso
  for (let i = weeks.length - 1; i >= 0; i--) {
    ctx.lineTo(scaleX(weeks[i]), scaleY(auReferenceData[weeks[i]].min));
  }
  ctx.closePath();
  ctx.fill();
  
  // Desenhar linhas de referência
  // Percentil 90 (linha tracejada)
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(scaleX(weeks[0]), scaleY(auReferenceData[weeks[0]].max));
  weeks.forEach(week => {
    ctx.lineTo(scaleX(week), scaleY(auReferenceData[week].max));
  });
  ctx.stroke();
  
  // Percentil 10 (linha tracejada)
  ctx.beginPath();
  ctx.moveTo(scaleX(weeks[0]), scaleY(auReferenceData[weeks[0]].min));
  weeks.forEach(week => {
    ctx.lineTo(scaleX(week), scaleY(auReferenceData[week].min));
  });
  ctx.stroke();
  
  // Mediana (linha tracejada)
  ctx.strokeStyle = '#666666';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(scaleX(weeks[0]), scaleY(auReferenceData[weeks[0]].median));
  weeks.forEach(week => {
    ctx.lineTo(scaleX(week), scaleY(auReferenceData[week].median));
  });
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Processar dados das consultas
  
  const dataPoints: ChartDataPoint[] = consultas
    .filter(c => c.alturaUterina && c.alturaUterina > 0)
    .map(c => {
      let igSemanas = c.igUltrassomSemanas || c.igDumSemanas || 0;
      if (c.igUltrassomDias) igSemanas += c.igUltrassomDias / 7;
      else if (c.igDumDias) igSemanas += c.igDumDias / 7;
      
      // Converter de mm para cm (valores no banco estão em mm)
      const auCm = (c.alturaUterina as number) / 10;
      
      return {
        x: igSemanas,
        y: auCm,
        label: `${auCm}cm`
      };
    })
    .filter(p => p.x >= 12 && p.x <= 42)
    .sort((a, b) => a.x - b.x);
  
  // Desenhar linha dos dados
  if (dataPoints.length > 0) {
    ctx.strokeStyle = '#8B4049';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX(dataPoints[0].x), scaleY(dataPoints[0].y));
    dataPoints.forEach(p => {
      ctx.lineTo(scaleX(p.x), scaleY(p.y));
    });
    ctx.stroke();
    
    // Desenhar pontos e labels
    dataPoints.forEach(p => {
      // Contorno branco do ponto (para destacar)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(scaleX(p.x), scaleY(p.y), 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Borda do ponto
      ctx.strokeStyle = '#8B4049';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(scaleX(p.x), scaleY(p.y), 6, 0, Math.PI * 2);
      ctx.stroke();
      
      // Ponto preenchido
      ctx.fillStyle = '#8B4049';
      ctx.beginPath();
      ctx.arc(scaleX(p.x), scaleY(p.y), 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label com fundo branco para melhor legibilidade
      const labelText = `${p.y}`;
      ctx.font = 'bold 10px Arial';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(scaleX(p.x) - textWidth/2 - 2, scaleY(p.y) - 20, textWidth + 4, 14);
      ctx.fillStyle = '#8B4049';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, scaleX(p.x), scaleY(p.y) - 9);
    });
  }
  
  // Eixo X
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(width - padding.right, padding.top + chartHeight);
  ctx.stroke();
  
  // Labels do eixo X
  ctx.fillStyle = '#666666';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  for (let week = 12; week <= 42; week += 2) {
    ctx.fillText(`${week}s`, scaleX(week), height - 10);
  }
  
  // Eixo Y
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.stroke();
  
  // Labels do eixo Y
  ctx.textAlign = 'right';
  for (let y = 0; y <= 45; y += 5) {
    ctx.fillText(`${y}`, padding.left - 5, scaleY(y) + 3);
  }
  
  // Título
  ctx.fillStyle = '#8B4049';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Evolução da Altura Uterina (AU)', width / 2, 15);
  
  // Label do eixo Y
  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AU (cm)', 0, 0);
  ctx.restore();
  
  // Label do eixo X
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Idade Gestacional (semanas)', width / 2, height - 2);
  
  return canvas.toBuffer('image/png');
}

/**
 * Gera gráfico de Pressão Arterial como imagem PNG
 */
export async function gerarGraficoPA(consultas: ConsultaPrenatal[]): Promise<Buffer> {
  const width = 500;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fundo branco
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Área do gráfico
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Escalas
  const xMin = 4, xMax = 42;
  const yMin = 40, yMax = 160;
  
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  
  // Linha de limite de hipertensão sistólica (140 mmHg)
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding.left, scaleY(140));
  ctx.lineTo(width - padding.right, scaleY(140));
  ctx.stroke();
  
  // Linha de limite de hipertensão diastólica (90 mmHg)
  ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(padding.left, scaleY(90));
  ctx.lineTo(width - padding.right, scaleY(90));
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Processar dados das consultas
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
      sistolicaPoints.push({ x: igSemanas, y: sistolica, label: `${sistolica}` });
      diastolicaPoints.push({ x: igSemanas, y: diastolica, label: `${diastolica}` });
    }
  });
  
  sistolicaPoints.sort((a, b) => a.x - b.x);
  diastolicaPoints.sort((a, b) => a.x - b.x);
  
  // Desenhar linha sistólica
  if (sistolicaPoints.length > 0) {
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX(sistolicaPoints[0].x), scaleY(sistolicaPoints[0].y));
    sistolicaPoints.forEach(p => {
      ctx.lineTo(scaleX(p.x), scaleY(p.y));
    });
    ctx.stroke();
    
    // Pontos sistólicos
    sistolicaPoints.forEach(p => {
      const isHigh = p.y >= 140;
      ctx.fillStyle = isHigh ? '#DC2626' : '#DC2626';
      ctx.beginPath();
      ctx.arc(scaleX(p.x), scaleY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#333333';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.y}`, scaleX(p.x), scaleY(p.y) - 8);
    });
  }
  
  // Desenhar linha diastólica
  if (diastolicaPoints.length > 0) {
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX(diastolicaPoints[0].x), scaleY(diastolicaPoints[0].y));
    diastolicaPoints.forEach(p => {
      ctx.lineTo(scaleX(p.x), scaleY(p.y));
    });
    ctx.stroke();
    
    // Pontos diastólicos
    diastolicaPoints.forEach(p => {
      const isHigh = p.y >= 90;
      ctx.fillStyle = isHigh ? '#2563EB' : '#2563EB';
      ctx.beginPath();
      ctx.arc(scaleX(p.x), scaleY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#333333';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.y}`, scaleX(p.x), scaleY(p.y) + 14);
    });
  }
  
  // Eixo X
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(width - padding.right, padding.top + chartHeight);
  ctx.stroke();
  
  // Labels do eixo X
  ctx.fillStyle = '#666666';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  for (let week = 4; week <= 42; week += 4) {
    ctx.fillText(`${week}s`, scaleX(week), height - 10);
  }
  
  // Eixo Y
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.stroke();
  
  // Labels do eixo Y
  ctx.textAlign = 'right';
  for (let y = 40; y <= 160; y += 20) {
    ctx.fillText(`${y}`, padding.left - 5, scaleY(y) + 3);
  }
  
  // Título
  ctx.fillStyle = '#8B4049';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Evolução da Pressão Arterial', width / 2, 15);
  
  // Legenda
  ctx.font = '9px Arial';
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(width - 120, 8, 10, 10);
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'left';
  ctx.fillText('Sistólica', width - 105, 16);
  
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(width - 60, 8, 10, 10);
  ctx.fillStyle = '#333333';
  ctx.fillText('Diastólica', width - 45, 16);
  
  // Label do eixo Y
  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PA (mmHg)', 0, 0);
  ctx.restore();
  
  // Label do eixo X
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Idade Gestacional (semanas)', width / 2, height - 2);
  
  return canvas.toBuffer('image/png');
}

/**
 * Gera gráfico de Peso Gestacional como imagem PNG
 */
export async function gerarGraficoPeso(
  consultas: ConsultaPrenatal[],
  pesoInicial: number | null,
  altura: number | null
): Promise<Buffer> {
  const width = 500;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fundo branco
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Área do gráfico
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Processar dados das consultas
  const dataPoints: ChartDataPoint[] = consultas
    .filter(c => c.peso && c.peso > 0)
    .map(c => {
      let igSemanas = c.igUltrassomSemanas || c.igDumSemanas || 0;
      if (c.igUltrassomDias) igSemanas += c.igUltrassomDias / 7;
      else if (c.igDumDias) igSemanas += c.igDumDias / 7;
      
      return {
        x: igSemanas,
        y: c.peso as number / 1000, // Converter para kg
        label: `${(c.peso as number / 1000).toFixed(1)}kg`
      };
    })
    .filter(p => p.x >= 0 && p.x <= 42)
    .sort((a, b) => a.x - b.x);
  
  if (dataPoints.length === 0) {
    // Retornar imagem vazia se não houver dados
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados de peso disponíveis', width / 2, height / 2);
    return canvas.toBuffer('image/png');
  }
  
  // Escalas
  const xMin = 0, xMax = 42;
  const yValues = dataPoints.map(p => p.y);
  const yMin = Math.floor(Math.min(...yValues) - 5);
  const yMax = Math.ceil(Math.max(...yValues) + 5);
  
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  
  // Desenhar linha dos dados
  ctx.strokeStyle = '#8B4049';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(scaleX(dataPoints[0].x), scaleY(dataPoints[0].y));
  dataPoints.forEach(p => {
    ctx.lineTo(scaleX(p.x), scaleY(p.y));
  });
  ctx.stroke();
  
  // Desenhar pontos e labels
  dataPoints.forEach(p => {
    // Ponto
    ctx.fillStyle = '#8B4049';
    ctx.beginPath();
    ctx.arc(scaleX(p.x), scaleY(p.y), 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Label
    ctx.fillStyle = '#333333';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.y.toFixed(1)}`, scaleX(p.x), scaleY(p.y) - 8);
  });
  
  // Eixo X
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(width - padding.right, padding.top + chartHeight);
  ctx.stroke();
  
  // Labels do eixo X
  ctx.fillStyle = '#666666';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  for (let week = 0; week <= 42; week += 4) {
    ctx.fillText(`${week}s`, scaleX(week), height - 10);
  }
  
  // Eixo Y
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.stroke();
  
  // Labels do eixo Y
  ctx.textAlign = 'right';
  const yStep = Math.ceil((yMax - yMin) / 5);
  for (let y = yMin; y <= yMax; y += yStep) {
    ctx.fillText(`${y}`, padding.left - 5, scaleY(y) + 3);
  }
  
  // Título
  ctx.fillStyle = '#8B4049';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Evolução do Peso Gestacional', width / 2, 15);
  
  // Label do eixo Y
  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Peso (kg)', 0, 0);
  ctx.restore();
  
  // Label do eixo X
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Idade Gestacional (semanas)', width / 2, height - 2);
  
  return canvas.toBuffer('image/png');
}
