import { createCanvas } from '@napi-rs/canvas';

const width = 400;
const height = 300;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Desenhar fundo
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, width, height);

// Desenhar linha de teste
ctx.strokeStyle = 'rgb(75, 192, 192)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(50, 250);
ctx.lineTo(100, 200);
ctx.lineTo(150, 220);
ctx.lineTo(200, 150);
ctx.lineTo(250, 180);
ctx.lineTo(300, 100);
ctx.lineTo(350, 80);
ctx.stroke();

// Exportar como PNG
const buffer = canvas.toBuffer('image/png');
console.log('Canvas gerado com sucesso! Buffer size:', buffer.length);
