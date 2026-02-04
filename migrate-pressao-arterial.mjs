import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migratePressaoArterial() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Iniciando migração de dados de pressão arterial...');
    
    // Buscar todas as consultas com pressaoArterial preenchida
    const [consultas] = await connection.execute(
      'SELECT id, pressaoArterial FROM consultasPrenatal WHERE pressaoArterial IS NOT NULL AND pressaoArterial != ""'
    );
    
    console.log(`Encontradas ${consultas.length} consultas com pressão arterial registrada`);
    
    let migradas = 0;
    let erros = 0;
    
    for (const consulta of consultas) {
      const { id, pressaoArterial } = consulta;
      
      // Aceitar tanto "/" quanto "x" ou "X" como separadores
      const match = pressaoArterial.match(/(\d+)\s*[\/xX]\s*(\d+)/);
      
      if (match) {
        const sistolica = parseInt(match[1]);
        const diastolica = parseInt(match[2]);
        
        // Atualizar os novos campos
        await connection.execute(
          'UPDATE consultasPrenatal SET pressaoSistolica = ?, pressaoDiastolica = ? WHERE id = ?',
          [sistolica, diastolica, id]
        );
        
        migradas++;
        console.log(`✓ Consulta ${id}: ${pressaoArterial} → ${sistolica}/${diastolica}`);
      } else {
        erros++;
        console.log(`✗ Consulta ${id}: Formato inválido "${pressaoArterial}"`);
      }
    }
    
    console.log('\n=== Resumo da Migração ===');
    console.log(`Total de consultas: ${consultas.length}`);
    console.log(`Migradas com sucesso: ${migradas}`);
    console.log(`Erros/Formatos inválidos: ${erros}`);
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await connection.end();
  }
}

migratePressaoArterial();
