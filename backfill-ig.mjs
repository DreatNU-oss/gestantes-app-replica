import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
// Schema not needed for raw SQL queries

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
// Using raw SQL queries instead of Drizzle ORM

console.log('🔄 Starting IG backfill for all consultations...\n');

// Função para calcular IG pela DUM
function calcularIGPorDUM(dum, dataConsulta) {
  if (!dum || dum === 'Incerta' || dum === 'Incompatível com US') return null;
  
  const dumDate = new Date(dum);
  const consultaDate = new Date(dataConsulta);
  
  if (isNaN(dumDate.getTime()) || isNaN(consultaDate.getTime())) return null;
  
  const diffMs = consultaDate - dumDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return null;
  
  const semanas = Math.floor(diffDays / 7);
  const dias = diffDays % 7;
  
  return { semanas, dias };
}

// Função para calcular IG pelo Ultrassom
function calcularIGPorUS(dataUltrassom, igUsSemanas, igUsDias, dataConsulta) {
  if (!dataUltrassom || !igUsSemanas) return null;
  
  const usDate = new Date(dataUltrassom);
  const consultaDate = new Date(dataConsulta);
  
  if (isNaN(usDate.getTime()) || isNaN(consultaDate.getTime())) return null;
  
  const diffMs = consultaDate - usDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return null;
  
  const igUsTotal = (igUsSemanas * 7) + (igUsDias || 0);
  const igAtualTotal = igUsTotal + diffDays;
  
  const semanas = Math.floor(igAtualTotal / 7);
  const dias = igAtualTotal % 7;
  
  return { semanas, dias };
}

// Buscar todas as consultas com gestantes
const result = await connection.query(`
  SELECT 
    c.id as consultaId,
    c.dataConsulta,
    c.igDumSemanas,
    c.igUltrassomSemanas,
    g.id as gestanteId,
    g.nome,
    g.dum,
    g.dataUltrassom,
    g.igUltrassomSemanas,
    g.igUltrassomDias
  FROM consultasPrenatal c
  JOIN gestantes g ON c.gestanteId = g.id
  WHERE c.igDumSemanas IS NULL OR c.igUltrassomSemanas IS NULL
  ORDER BY g.nome, c.dataConsulta
`);

const consultas = result[0];

console.log(`📊 Found ${consultas.length} consultations to update\n`);

let updated = 0;
let skipped = 0;

for (const consulta of consultas) {
  const { consultaId, dataConsulta, nome, dum, dataUltrassom, igUltrassomSemanas, igUltrassomDias } = consulta;
  
  // Calcular IG pela DUM
  const igDum = calcularIGPorDUM(dum, dataConsulta);
  
  // Calcular IG pelo US
  const igUs = calcularIGPorUS(dataUltrassom, igUltrassomSemanas, igUltrassomDias, dataConsulta);
  
  if (!igDum && !igUs) {
    console.log(`⚠️  Skipping consultation ${consultaId} (${nome}) - no valid DUM or US data`);
    skipped++;
    continue;
  }
  
  // Atualizar no banco
  await connection.query(`
    UPDATE consultasPrenatal
    SET 
      igDumSemanas = ?,
      igDumDias = ?,
      igUltrassomSemanas = ?,
      igUltrassomDias = ?
    WHERE id = ?
  `, [
    igDum?.semanas || null,
    igDum?.dias || null,
    igUs?.semanas || null,
    igUs?.dias || null,
    consultaId
  ]);
  
  console.log(`✅ Updated consultation ${consultaId} (${nome} - ${new Date(dataConsulta).toLocaleDateString('pt-BR')})`);
  if (igDum) console.log(`   IG DUM: ${igDum.semanas}s ${igDum.dias}d`);
  if (igUs) console.log(`   IG US: ${igUs.semanas}s ${igUs.dias}d`);
  
  updated++;
}

await connection.end();

console.log(`\n✨ Backfill complete!`);
console.log(`   Updated: ${updated} consultations`);
console.log(`   Skipped: ${skipped} consultations`);
