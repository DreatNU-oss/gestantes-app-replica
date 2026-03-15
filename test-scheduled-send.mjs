/**
 * Script de teste: Envia uma mensagem de template para TESTE TESTE após 5 minutos.
 * Simula o comportamento do scheduler automático usando sendToGestante().
 */

import mysql from 'mysql2/promise';

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const DELAY_MINUTES = 5;

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (!digits.startsWith('55')) digits = '55' + digits;
  return digits;
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
  const conn = await mysql.createConnection(DATABASE_URL);

  // Buscar TESTE TESTE
  const [gestanteRows] = await conn.execute(
    "SELECT id, nome, telefone, dum, dataUltrassom, igUltrassomSemanas, igUltrassomDias, medicoId FROM gestantes WHERE UPPER(nome) LIKE '%TESTE TESTE%' LIMIT 1"
  );
  if (!gestanteRows.length) {
    console.error('Paciente TESTE TESTE não encontrada!');
    process.exit(1);
  }
  const gestante = gestanteRows[0];

  // Buscar template de IG (Vacina dTpa - ID 1)
  const [templateRows] = await conn.execute(
    "SELECT id, nome, mensagem, igSemanas, igDias FROM mensagemTemplates WHERE id = 1"
  );
  if (!templateRows.length) {
    console.error('Template não encontrado!');
    process.exit(1);
  }
  const template = templateRows[0];

  // Calcular IG atual
  const hoje = new Date();
  let igSemanas, igDias;
  if (gestante.igUltrassomSemanas !== null && gestante.dataUltrassom) {
    const dataUS = new Date(gestante.dataUltrassom + 'T12:00:00');
    const diasDesdeUS = Math.floor((hoje.getTime() - dataUS.getTime()) / (1000*60*60*24));
    const totalDias = gestante.igUltrassomSemanas * 7 + (gestante.igUltrassomDias || 0) + diasDesdeUS;
    igSemanas = Math.floor(totalDias / 7);
    igDias = totalDias % 7;
  } else if (gestante.dum) {
    const dumDate = new Date(gestante.dum + 'T12:00:00');
    const totalDias = Math.floor((hoje.getTime() - dumDate.getTime()) / (1000*60*60*24));
    igSemanas = Math.floor(totalDias / 7);
    igDias = totalDias % 7;
  }

  // Calcular DPP
  let dpp = '';
  if (gestante.dum) {
    const dumDate = new Date(gestante.dum + 'T12:00:00');
    const dppDate = new Date(dumDate);
    dppDate.setDate(dppDate.getDate() + 280);
    dpp = dppDate.toLocaleDateString('pt-BR');
  }

  // Substituir variáveis no template
  let mensagem = template.mensagem;
  mensagem = mensagem.replace(/\{nome\}/g, gestante.nome);
  mensagem = mensagem.replace(/\{ig_semanas\}/g, String(igSemanas));
  mensagem = mensagem.replace(/\{ig_dias\}/g, String(igDias));
  mensagem = mensagem.replace(/\{dpp\}/g, dpp);
  mensagem = mensagem.replace(/\{medico\}/g, '');

  const phoneNormalized = normalizePhone(gestante.telefone);

  console.log('='.repeat(60));
  console.log('TESTE DE ENVIO AGENDADO DE TEMPLATE WHATSAPP');
  console.log('='.repeat(60));
  console.log(`Paciente: ${gestante.nome}`);
  console.log(`Telefone: ${gestante.telefone} → ${phoneNormalized}`);
  console.log(`IG atual: ${igSemanas}s${igDias}d`);
  console.log(`Template: ${template.nome} (ID: ${template.id})`);
  console.log(`Delay: ${DELAY_MINUTES} minutos`);
  console.log(`Hora agendada: ${new Date(Date.now() + DELAY_MINUTES * 60 * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log('-'.repeat(60));
  console.log('Mensagem que será enviada:');
  console.log(mensagem);
  console.log('='.repeat(60));
  console.log(`\n⏳ Aguardando ${DELAY_MINUTES} minutos para enviar...\n`);

  await conn.end();

  // Aguardar 5 minutos
  await new Promise(resolve => setTimeout(resolve, DELAY_MINUTES * 60 * 1000));

  console.log(`\n🚀 Enviando mensagem agora (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})...`);
  const result = await sendWhatsApp(phoneNormalized, mensagem);

  if (result.success) {
    console.log('✅ Mensagem enviada com SUCESSO!');

    // Registrar no histórico
    const conn2 = await mysql.createConnection(DATABASE_URL);
    await conn2.execute(
      'INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, enviadoEm) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [1, gestante.id, template.id, phoneNormalized, mensagem, 'enviado']
    );
    console.log('📝 Registrado no histórico de WhatsApp');
    await conn2.end();
  } else {
    console.log(`❌ FALHA no envio: ${result.error}`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
