import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

const width = 600;
const height = 300;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
  width, 
  height,
  backgroundColour: 'white'
});

export interface DadoConsulta {
  dataConsulta: string;
  igSemanas?: number;
  peso?: number | null;
  au?: number | null;
  paSistolica?: number | null;
  paDiastolica?: number | null;
}

// Gerar gráfico de peso como imagem base64
export async function gerarGraficoPeso(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.peso && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const labels = dadosValidos.map(c => `${c.igSemanas}s`);
  const pesos = dadosValidos.map(c => c.peso as number);

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso (kg)',
        data: pesos,
        borderColor: '#722F37',
        backgroundColor: 'rgba(114, 47, 55, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#722F37',
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Evolução do Peso',
          font: { size: 16, weight: 'bold' },
          color: '#333'
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Idade Gestacional',
            font: { size: 12 }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Peso (kg)',
            font: { size: 12 }
          },
          beginAtZero: false
        }
      }
    }
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  return buffer.toString('base64');
}

// Gerar gráfico de altura uterina como imagem base64
export async function gerarGraficoAU(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.au && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const labels = dadosValidos.map(c => `${c.igSemanas}s`);
  const alturas = dadosValidos.map(c => c.au as number);

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'AU (cm)',
        data: alturas,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#2563eb',
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Evolução da Altura Uterina',
          font: { size: 16, weight: 'bold' },
          color: '#333'
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Idade Gestacional',
            font: { size: 12 }
          }
        },
        y: {
          title: {
            display: true,
            text: 'AU (cm)',
            font: { size: 12 }
          },
          beginAtZero: false
        }
      }
    }
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  return buffer.toString('base64');
}

// Gerar gráfico de pressão arterial como imagem base64
export async function gerarGraficoPA(consultas: DadoConsulta[]): Promise<string> {
  const dadosValidos = consultas
    .filter(c => c.paSistolica && c.paDiastolica && c.igSemanas)
    .sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));

  if (dadosValidos.length === 0) {
    return '';
  }

  const labels = dadosValidos.map(c => `${c.igSemanas}s`);
  const sistolicas = dadosValidos.map(c => c.paSistolica as number);
  const diastolicas = dadosValidos.map(c => c.paDiastolica as number);

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Sistólica',
          data: sistolicas,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#dc2626',
        },
        {
          label: 'Diastólica',
          data: diastolicas,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#16a34a',
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Evolução da Pressão Arterial',
          font: { size: 16, weight: 'bold' },
          color: '#333'
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Idade Gestacional',
            font: { size: 12 }
          }
        },
        y: {
          title: {
            display: true,
            text: 'mmHg',
            font: { size: 12 }
          },
          beginAtZero: false,
          min: 40,
          max: 180
        }
      }
    }
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  return buffer.toString('base64');
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
