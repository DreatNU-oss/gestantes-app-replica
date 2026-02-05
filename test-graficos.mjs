import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 600;
const height = 300;

console.log('Inicializando ChartJSNodeCanvas...');

try {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width, 
    height,
    backgroundColour: 'white'
  });

  console.log('ChartJSNodeCanvas inicializado com sucesso!');

  const configuration = {
    type: 'line',
    data: {
      labels: ['20s', '24s', '28s', '32s', '36s'],
      datasets: [{
        label: 'Peso (kg)',
        data: [65, 67, 69, 71, 73],
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
      }
    }
  };

  console.log('Gerando gráfico...');
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  console.log('Gráfico gerado com sucesso!');
  console.log('Tamanho do buffer:', buffer.length, 'bytes');
  
  // Salvar como arquivo para verificar
  import('fs').then(fs => {
    fs.writeFileSync('/home/ubuntu/test-chart.png', buffer);
    console.log('Gráfico salvo em /home/ubuntu/test-chart.png');
  });

} catch (error) {
  console.error('Erro:', error);
}
