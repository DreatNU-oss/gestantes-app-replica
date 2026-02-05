import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Buscar gestante TESTE TESTE
const [rows] = await connection.execute(
  "SELECT id, nome, token FROM gestante WHERE nome LIKE '%TESTE%' LIMIT 1"
);

if (rows.length > 0) {
  console.log('Gestante encontrada:');
  console.log('ID:', rows[0].id);
  console.log('Nome:', rows[0].nome);
  console.log('Token:', rows[0].token);
} else {
  console.log('Nenhuma gestante de teste encontrada');
}

await connection.end();
