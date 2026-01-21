import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const url = new URL(DATABASE_URL);
const dbConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
};

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Verificar configurações de email
    console.log('=== CONFIGURAÇÕES DE EMAIL ===');
    const [configs] = await connection.execute('SELECT * FROM configuracoesEmail');
    console.log(JSON.stringify(configs, null, 2));
    
    // Verificar últimos logs de email
    console.log('\n=== ÚLTIMOS LOGS DE EMAIL ===');
    const [logs] = await connection.execute(
      'SELECT id, gestanteId, tipoLembrete, emailDestinatario, assunto, status, mensagemErro, createdAt FROM logsEmails ORDER BY id DESC LIMIT 5'
    );
    console.log(JSON.stringify(logs, null, 2));
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
