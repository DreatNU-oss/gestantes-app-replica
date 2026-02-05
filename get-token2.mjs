import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Buscar sessão válida de gestante TESTE
const [rows] = await connection.execute(`
  SELECT s.token, s.expiraEm, g.nome 
  FROM sessoesGestante s 
  JOIN gestantes g ON s.gestanteId = g.id 
  WHERE g.nome LIKE '%TESTE%' AND s.expiraEm > NOW() 
  LIMIT 1
`);

if (rows.length > 0) {
  console.log('Token válido encontrado:');
  console.log('Nome:', rows[0].nome);
  console.log('Token:', rows[0].token);
  console.log('Expira em:', rows[0].expiraEm);
} else {
  console.log('Nenhum token válido encontrado para gestante de teste');
  
  // Criar nova sessão para gestante de teste
  const [gestantes] = await connection.execute(`
    SELECT id, nome FROM gestantes WHERE nome LIKE '%TESTE%' LIMIT 1
  `);
  
  if (gestantes.length > 0) {
    const gestanteId = gestantes[0].id;
    const token = 'test-token-' + Date.now();
    const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    
    await connection.execute(`
      INSERT INTO sessoesGestante (gestanteId, token, expiraEm) VALUES (?, ?, ?)
    `, [gestanteId, token, expiraEm]);
    
    console.log('Nova sessão criada:');
    console.log('Nome:', gestantes[0].nome);
    console.log('Token:', token);
    console.log('Expira em:', expiraEm);
  }
}

await connection.end();
