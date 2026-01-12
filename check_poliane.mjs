import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { gestantes, consultasPrenatal } from './drizzle/schema.ts';
import { eq, like } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Buscar Poliane
const poliane = await db.select().from(gestantes).where(like(gestantes.nome, '%Poliane%'));
console.log('=== DADOS DA POLIANE ===');
console.log(JSON.stringify(poliane[0], null, 2));

// Buscar consultas da Poliane
if (poliane[0]) {
  const consultas = await db.select().from(consultasPrenatal).where(eq(consultasPrenatal.gestanteId, poliane[0].id));
  console.log('\n=== CONSULTAS DA POLIANE ===');
  consultas.forEach(c => {
    console.log(`Data: ${c.dataConsulta}, Peso: ${c.peso}g, IG DUM: ${c.igDumSemanas}s${c.igDumDias}d, IG US: ${c.igUsSemanas}s${c.igUsDias}d`);
  });
}

await connection.end();
