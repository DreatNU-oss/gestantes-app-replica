import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { gestantes, consultasPrenatal } from './drizzle/schema';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('📊 Lendo CSV de gestantes original para criar mapeamento...');
const gestantesCSV = fs.readFileSync('/home/ubuntu/upload/gestantes_20251209_210138.csv', 'utf-8');
const gestantesLines = gestantesCSV.split('\n').filter((line: string) => line.trim());

// Criar mapa: ID antigo -> Nome
const mapIdParaNome: Record<number, string> = {};
for (let i = 1; i < gestantesLines.length; i++) {
  const line = gestantesLines[i];
  if (!line.trim()) continue;
  
  const values = line.split(',');
  const id = parseInt(values[0]);
  const nome = values[2];
  
  if (id && nome) {
    mapIdParaNome[id] = nome;
  }
}

console.log(\`✅ Mapeamento criado: \${Object.keys(mapIdParaNome).length} gestantes\`);

console.log('\n🔍 Buscando gestantes no banco atual...');
const todasGestantes = await db.select().from(gestantes);
console.log(\`✅ Encontradas \${todasGestantes.length} gestantes no banco\`);

// Criar mapa: Nome -> ID novo
const mapNomeParaId: Record<string, number> = {};
todasGestantes.forEach((g: any) => {
  mapNomeParaId[g.nome] = g.id;
});

console.log('\n📊 Lendo arquivo CSV de consultas...');
const csvContent = fs.readFileSync('/home/ubuntu/upload/consultasPrenatal_20251210_091102.csv', 'utf-8');
const lines = csvContent.split('\n').filter((line: string) => line.trim());

console.log(\`📝 Total de linhas: \${lines.length - 1}\`);

// Limpar consultas existentes
console.log('\n🗑️  Limpando consultas existentes...');
await db.delete(consultasPrenatal);

let importadas = 0;
let semGestante = 0;

console.log('\n📥 Importando consultas...\n');

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const values = line.split(',');
  
  const idAntigoGestante = parseInt(values[1]);
  const nomeGestante = mapIdParaNome[idAntigoGestante];
  
  if (!nomeGestante) {
    semGestante++;
    continue;
  }
  
  const novoIdGestante = mapNomeParaId[nomeGestante];
  
  if (!novoIdGestante) {
    semGestante++;
    continue;
  }
  
  try {
    const dataConsulta = values[2]?.split(' ')[0] || null;
    const igDumSemanas = values[3] ? parseInt(values[3]) : null;
    const igDumDias = values[4] ? parseInt(values[4]) : null;
    const pesoStr = values[5]?.trim();
    let peso = null;
    if (pesoStr) {
      const pesoKg = parseFloat(pesoStr.replace('kg', '').replace(',', '.'));
      if (!isNaN(pesoKg)) {
        peso = Math.round(pesoKg * 1000);
      }
    }
    const pressaoSistolica = values[6] ? parseInt(values[6]) : null;
    const pressaoDiastolica = values[7] ? parseInt(values[7]) : null;
    const alturaUterinaStr = values[8]?.trim();
    let alturaUterina = null;
    if (alturaUterinaStr && alturaUterinaStr !== '12.0') {
      const altura = parseFloat(alturaUterinaStr.replace('cm', '').replace(',', '.'));
      if (!isNaN(altura)) {
        alturaUterina = altura;
      }
    }
    const bcf = values[9] === '1';
    const mf = values[10] === '1';
    const observacoes = values[11] || null;
    const igUsSemanas = values[14] ? parseInt(values[14]) : null;
    const igUsDias = values[15] ? parseInt(values[15]) : null;
    
    await db.insert(consultasPrenatal).values({
      gestanteId: novoIdGestante,
      dataConsulta,
      igDumSemanas,
      igDumDias,
      peso,
      pressaoSistolica,
      pressaoDiastolica,
      alturaUterina,
      bcf,
      mf,
      observacoes,
      igUsSemanas,
      igUsDias,
    });
    
    importadas++;
    if (importadas % 10 === 0) {
      console.log(\`✅ \${importadas} consultas importadas...\`);
    }
  } catch (error: any) {
    console.error(\`❌ Erro: \${error.message}\`);
  }
}

console.log(\`\n📊 Resumo:\`);
console.log(\`   ✅ Importadas: \${importadas}\`);
console.log(\`   ⚠️  Sem gestante: \${semGestante}\`);

await connection.end();
console.log('\n✨ Concluído!');
