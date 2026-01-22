import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 400;
const height = 300;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

const configuration = {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Teste',
      data: [10, 20, 15, 25, 30],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }
};

const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
console.log('Gráfico gerado com sucesso! Buffer size:', imageBuffer.length);
