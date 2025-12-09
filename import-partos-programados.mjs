import { createConnection } from 'mysql2/promise';
import fs from 'fs';

const connection = await createConnection(process.env.DATABASE_URL);

// Ler CSV
const csvContent = fs.readFileSync('/home/ubuntu/upload/gestantes_20251209_210138.csv', 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',');

// Encontrar índices das colunas
const idIndex = headers.indexOf('id');
const dataPartoPlaneadoIndex = headers.indexOf('dataPartoPlaneado');

console.log(`Processando ${lines.length - 1} gestantes...`);

let updated = 0;

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  const id = values[idIndex];
  const dataPartoPlaneado = values[dataPartoPlaneadoIndex];
  
  if (dataPartoPlaneado && dataPartoPlaneado.trim() !== '') {
    // Extrair apenas a data (YYYY-MM-DD) do formato YYYY-MM-DD HH:MM:SS
    const dataFormatada = dataPartoPlaneado.split(' ')[0];
    
    await connection.execute(
      'UPDATE gestantes SET dataPartoProgramado = ? WHERE id = ?',
      [dataFormatada, id]
    );
    updated++;
    console.log(`Gestante ID ${id}: Data parto programado = ${dataFormatada}`);
  }
}

console.log(`\n✅ ${updated} datas de partos programados importadas com sucesso!`);

await connection.end();
