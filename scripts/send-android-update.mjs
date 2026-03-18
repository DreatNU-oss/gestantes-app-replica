/**
 * Script para enviar mensagem de atualização do app Android para todas as gestantes ativas
 * da Clínica 00001 (Dr. André).
 * 
 * Exclui:
 * - Gestantes sem telefone
 * - Gestantes com parto realizado
 * - Gestante de teste (TESTE TESTE)
 * 
 * Usa envio sequencial com delay de 6s entre mensagens para evitar rate limit.
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
if (!WASENDER_API_KEY) {
  console.error('WASENDER_API_KEY not set');
  process.exit(1);
}

// Normalize phone number
function normalizePhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (!digits.startsWith('55')) digits = '55' + digits;
  return digits;
}

// Extract first name
function extrairPrimeiroNome(nomeCompleto) {
  if (!nomeCompleto) return '';
  const partes = nomeCompleto.trim().split(/\s+/);
  let primeiro = partes[0] || '';
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Send WhatsApp message with retry
async function sendWhatsApp(to, text, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(WASENDER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WASENDER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, text }),
      });

      if (response.status === 429) {
        const waitTime = attempt * 10000; // 10s, 20s, 30s
        console.log(`  ⏳ Rate limit (429), aguardando ${waitTime/1000}s antes de retry ${attempt}/${maxRetries}...`);
        await delay(waitTime);
        continue;
      }

      const data = await response.json();
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data?.message || `HTTP ${response.status}` };
      }
    } catch (err) {
      if (attempt === maxRetries) {
        return { success: false, error: err.message };
      }
      await delay(5000);
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Get all active gestantes from Clínica 00001 with phone numbers, excluding partos realizados and test patient
  const [gestantes] = await connection.execute(`
    SELECT g.id, g.nome, g.telefone, g.medicoId, m.nome as medicoNome
    FROM gestantes g
    LEFT JOIN partosRealizados pr ON pr.gestanteId = g.id
    LEFT JOIN abortamentos ab ON ab.gestanteId = g.id
    LEFT JOIN medicos m ON m.id = g.medicoId
    WHERE g.clinicaId = 1
    AND g.telefone IS NOT NULL 
    AND g.telefone != ''
    AND pr.id IS NULL
    AND ab.id IS NULL
    AND g.nome NOT LIKE '%TESTE%'
    AND g.nome != 'Adrieli Rezende Barros'
    ORDER BY g.nome
  `);

  console.log(`\n📱 Envio de mensagem: Atualização App Android`);
  console.log(`📊 Total de gestantes a receber: ${gestantes.length}`);
  console.log(`⏰ Tempo estimado: ~${Math.ceil(gestantes.length * 6 / 60)} minutos\n`);

  const messageTemplate = `Olá, {nome}! 👋

Aqui é o Dr. André.

Se você utiliza celular *Android*, tenho uma ótima notícia: nosso aplicativo de acompanhamento pré-natal acaba de receber uma *atualização importante*! 📲

Para atualizar ou instalar, basta clicar no link abaixo:

👉 https://play.google.com/store/apps/details?id=com.maismulher.prenatal

Com o app atualizado, você terá acesso a melhorias no acompanhamento da sua gestação.

Em caso de dúvidas, entre em contato comigo.

Um abraço!`;

  let enviados = 0;
  let erros = 0;
  const errosList = [];

  for (let i = 0; i < gestantes.length; i++) {
    const g = gestantes[i];
    const primeiroNome = extrairPrimeiroNome(g.nome);
    const telefone = normalizePhone(g.telefone);
    const mensagem = messageTemplate.replace(/\{nome\}/g, primeiroNome);

    console.log(`[${i + 1}/${gestantes.length}] Enviando para ${g.nome} (${telefone})...`);

    const result = await sendWhatsApp(telefone, mensagem);

    if (result.success) {
      enviados++;
      console.log(`  ✅ Enviado com sucesso`);
      
      // Log to whatsapp history
      await connection.execute(
        `INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, nomeGestante, sentAt) 
         VALUES (1, ?, NULL, ?, ?, 'enviado', ?, NOW())`,
        [g.id, telefone, mensagem, g.nome]
      );
    } else {
      erros++;
      errosList.push({ nome: g.nome, telefone, erro: result.error });
      console.log(`  ❌ Erro: ${result.error}`);
      
      // Log error to whatsapp history
      await connection.execute(
        `INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, erroMensagem, nomeGestante, sentAt) 
         VALUES (1, ?, NULL, ?, ?, 'falhou', ?, ?, NOW())`,
        [g.id, telefone, mensagem, result.error, g.nome]
      );
    }

    // Wait 6 seconds between messages to avoid rate limit
    if (i < gestantes.length - 1) {
      await delay(6000);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 RESULTADO FINAL:`);
  console.log(`  ✅ Enviados com sucesso: ${enviados}`);
  console.log(`  ❌ Erros: ${erros}`);
  console.log(`  📱 Total: ${gestantes.length}`);
  
  if (errosList.length > 0) {
    console.log(`\n❌ ERROS DETALHADOS:`);
    errosList.forEach(e => {
      console.log(`  - ${e.nome} (${e.telefone}): ${e.erro}`);
    });
  }

  await connection.end();
  console.log(`\n✅ Script finalizado.`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
