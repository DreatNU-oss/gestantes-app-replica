/**
 * Script para adicionar Polivitamínico a todas as gestantes existentes
 * que ainda não têm esse medicamento registrado.
 * 
 * Execução: node scripts/add-polivitaminico-gestantes.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não encontrada no ambiente');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: {
    rejectUnauthorized: false
  }
};

async function addPolivitaminicoToAllGestantes() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('Conectado ao banco de dados...');
    
    // Buscar todas as gestantes que NÃO têm Polivitamínico registrado
    const [gestantesSemPolivitaminico] = await connection.execute(`
      SELECT g.id, g.nome 
      FROM gestantes g
      WHERE NOT EXISTS (
        SELECT 1 FROM medicamentosGestacao m 
        WHERE m.gestanteId = g.id AND m.tipo = 'polivitaminicos'
      )
    `);
    
    console.log(`Encontradas ${gestantesSemPolivitaminico.length} gestantes sem Polivitamínico`);
    
    if (gestantesSemPolivitaminico.length === 0) {
      console.log('Todas as gestantes já têm Polivitamínico registrado!');
      return;
    }
    
    // Adicionar Polivitamínico para cada gestante
    let adicionados = 0;
    for (const gestante of gestantesSemPolivitaminico) {
      try {
        await connection.execute(`
          INSERT INTO medicamentosGestacao (gestanteId, tipo, especificacao, createdAt, updatedAt)
          VALUES (?, 'polivitaminicos', 'Adicionado automaticamente (migração)', NOW(), NOW())
        `, [gestante.id]);
        
        adicionados++;
        console.log(`✓ Polivitamínico adicionado para: ${gestante.nome} (ID: ${gestante.id})`);
      } catch (error) {
        console.error(`✗ Erro ao adicionar para ${gestante.nome}: ${error.message}`);
      }
    }
    
    console.log(`\n=== Resumo ===`);
    console.log(`Total de gestantes processadas: ${gestantesSemPolivitaminico.length}`);
    console.log(`Polivitamínico adicionado com sucesso: ${adicionados}`);
    console.log(`Erros: ${gestantesSemPolivitaminico.length - adicionados}`);
    
  } finally {
    await connection.end();
    console.log('\nConexão encerrada.');
  }
}

addPolivitaminicoToAllGestantes().catch(console.error);
