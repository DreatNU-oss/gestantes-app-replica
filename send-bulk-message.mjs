/**
 * Script para envio em massa de mensagem WhatsApp para todas as gestantes ativas.
 * Exclui TESTE TESTE e gestantes com parto/abortamento registrado.
 * Gera log de falhas em /home/ubuntu/whatsapp-falhas.txt
 */

import mysql from 'mysql2/promise';
import fs from 'fs';

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const DELAY_MS = 6000; // 6 seconds between messages

// Message with WhatsApp bold formatting (*text*)
const MENSAGEM = `Oi! Desculpe te incomodar num sábado, mas é que contratei um aplicativo de Pré-Natal para ser mais uma facilidade pra você! Mas antes gostaria de saber apenas se você usa um celular *Android*/Google ou um celular *Apple* (iphone). É para poder testar o app e depois te enviar o link para baixar caso queira. Muito obrigado!`;

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (!digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWhatsApp(to, text) {
  try {
    const response = await fetch(WASENDER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WASENDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

async function main() {
  if (!WASENDER_API_KEY) {
    console.error('WASENDER_API_KEY não configurada!');
    process.exit(1);
  }
  if (!DATABASE_URL) {
    console.error('DATABASE_URL não configurada!');
    process.exit(1);
  }

  console.log('Conectando ao banco de dados...');
  const connection = await mysql.createConnection(DATABASE_URL);

  // Query all active gestantes with phone, excluding TESTE TESTE and those with parto/abortamento
  const [rows] = await connection.execute(`
    SELECT g.id, g.nome, g.telefone, g.clinicaId 
    FROM gestantes g 
    WHERE g.telefone IS NOT NULL 
      AND g.telefone != '' 
      AND UPPER(g.nome) NOT LIKE '%TESTE TESTE%'
      AND g.id NOT IN (SELECT gestanteId FROM partosRealizados WHERE gestanteId IS NOT NULL) 
      AND g.id NOT IN (SELECT gestanteId FROM abortamentos WHERE gestanteId IS NOT NULL) 
    ORDER BY g.nome
  `);

  await connection.end();

  console.log(`\nTotal de gestantes para enviar: ${rows.length}`);
  console.log(`Tempo estimado: ~${Math.ceil(rows.length * DELAY_MS / 60000)} minutos\n`);

  const falhas = [];
  const sucessos = [];
  let count = 0;

  for (const gestante of rows) {
    count++;
    const phoneNormalized = normalizePhone(gestante.telefone);
    const nomeDisplay = gestante.nome;

    process.stdout.write(`[${count}/${rows.length}] ${nomeDisplay} (${gestante.telefone} → ${phoneNormalized})... `);

    const result = await sendWhatsApp(phoneNormalized, MENSAGEM);

    if (result.success) {
      console.log('✅ OK');
      sucessos.push({ id: gestante.id, nome: nomeDisplay, telefone: gestante.telefone, phoneNormalized });
    } else {
      console.log(`❌ FALHA: ${result.error}`);
      falhas.push({ id: gestante.id, nome: nomeDisplay, telefone: gestante.telefone, phoneNormalized, erro: result.error });
    }

    // Wait between messages (except after the last one)
    if (count < rows.length) {
      await sleep(DELAY_MS);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`RESUMO DO ENVIO`);
  console.log('='.repeat(60));
  console.log(`Total: ${rows.length}`);
  console.log(`Sucesso: ${sucessos.length}`);
  console.log(`Falhas: ${falhas.length}`);

  if (falhas.length > 0) {
    console.log('\n--- NÚMEROS QUE FALHARAM ---');
    for (const f of falhas) {
      console.log(`  ID: ${f.id} | Nome: ${f.nome} | Tel: ${f.telefone} | Normalizado: ${f.phoneNormalized} | Erro: ${f.erro}`);
    }

    // Write failure log to file
    const logContent = [
      `RELATÓRIO DE FALHAS NO ENVIO WHATSAPP - ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      `${'='.repeat(60)}`,
      `Total enviados: ${rows.length}`,
      `Sucesso: ${sucessos.length}`,
      `Falhas: ${falhas.length}`,
      '',
      'NÚMEROS QUE FALHARAM:',
      '-'.repeat(60),
      ...falhas.map(f => `ID: ${f.id} | Nome: ${f.nome} | Telefone cadastrado: ${f.telefone} | Normalizado: ${f.phoneNormalized} | Erro: ${f.erro}`),
      '',
    ].join('\n');

    fs.writeFileSync('/home/ubuntu/whatsapp-falhas.txt', logContent);
    console.log('\nLog de falhas salvo em: /home/ubuntu/whatsapp-falhas.txt');
  } else {
    console.log('\n🎉 Todas as mensagens foram enviadas com sucesso!');
    fs.writeFileSync('/home/ubuntu/whatsapp-falhas.txt', `TODAS AS ${rows.length} MENSAGENS ENVIADAS COM SUCESSO - ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
