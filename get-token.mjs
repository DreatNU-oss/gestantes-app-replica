import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute(
  "SELECT g.id, g.nome, sg.token FROM sessoesGestante sg JOIN gestantes g ON sg.gestanteId = g.id WHERE g.nome LIKE '%TESTE%' ORDER BY sg.createdAt DESC LIMIT 1"
);
console.log(JSON.stringify(rows[0], null, 2));
await connection.end();
