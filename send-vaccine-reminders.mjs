/**
 * Script para enviar lembretes de vacina:
 * - Bronquiolite (template ID 2) para 10 gestantes entre 32-34 semanas
 * - dTpa (template ID 1) para 4 gestantes entre 27s0d-27s6d
 */

import mysql from 'mysql2/promise';

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const DELAY_MS = 6000;

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (!digits.startsWith('55')) digits = '55' + digits;
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

function calcularIG(g) {
  const hoje = new Date();
  if (g.igUltrassomSemanas !== null && g.dataUltrassom) {
    const dataUS = new Date(g.dataUltrassom + 'T12:00:00');
    const diasDesdeUS = Math.floor((hoje.getTime() - dataUS.getTime()) / (1000*60*60*24));
    const totalDias = g.igUltrassomSemanas * 7 + (g.igUltrassomDias || 0) + diasDesdeUS;
    return { semanas: Math.floor(totalDias / 7), dias: totalDias % 7, totalDias };
  } else if (g.dum) {
    const dumDate = new Date(g.dum + 'T12:00:00');
    const totalDias = Math.floor((hoje.getTime() - dumDate.getTime()) / (1000*60*60*24));
    return { semanas: Math.floor(totalDias / 7), dias: totalDias % 7, totalDias };
  }
  return null;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Buscar templates
  const [templates] = await conn.execute('SELECT id, nome, mensagem FROM mensagemTemplates WHERE id IN (1, 2)');
  const templateMap = {};
  templates.forEach(t => { templateMap[t.id] = t; });

  // Buscar gestantes ativas com telefone
  const [gestantesList] = await conn.execute(`
    SELECT g.id, g.nome, g.telefone, g.dum, g.dataUltrassom, g.igUltrassomSemanas, g.igUltrassomDias
    FROM gestantes g
    WHERE g.telefone IS NOT NULL AND g.telefone != ''
      AND UPPER(g.nome) NOT LIKE '%TESTE TESTE%'
      AND g.id NOT IN (SELECT gestanteId FROM partosRealizados WHERE gestanteId IS NOT NULL)
      AND g.id NOT IN (SELECT gestanteId FROM abortamentos WHERE gestanteId IS NOT NULL)
    ORDER BY g.nome
  `);

  // Identificar candidatas
  const bronquioliteCandidatas = []; // 32-34 semanas, template ID 2
  const dtpaCandidatas = [];         // 27s0d-27s6d, template ID 1

  for (const g of gestantesList) {
    const ig = calcularIG(g);
    if (!ig) continue;
    if (ig.semanas >= 32 && ig.semanas <= 34) {
      bronquioliteCandidatas.push({ ...g, ig });
    }
    if (ig.semanas === 27) {
      dtpaCandidatas.push({ ...g, ig });
    }
  }

  // Filtrar quem já recebeu
  async function filtrarJaReceberam(candidatas, templateId) {
    if (candidatas.length === 0) return [];
    const ids = candidatas.map(g => g.id);
    const placeholders = ids.map(() => '?').join(',');
    const [jaEnviadas] = await conn.execute(
      `SELECT gestanteId FROM whatsappHistorico WHERE templateId = ? AND status = 'enviado' AND gestanteId IN (${placeholders})`,
      [templateId, ...ids]
    );
    const jaEnviadasSet = new Set(jaEnviadas.map(r => r.gestanteId));
    return candidatas.filter(g => !jaEnviadasSet.has(g.id));
  }

  const bronquioliteParaEnviar = await filtrarJaReceberam(bronquioliteCandidatas, 2);
  const dtpaParaEnviar = await filtrarJaReceberam(dtpaCandidatas, 1);

  const totalEnvios = bronquioliteParaEnviar.length + dtpaParaEnviar.length;

  console.log('='.repeat(60));
  console.log('ENVIO DE LEMBRETES DE VACINA');
  console.log('='.repeat(60));
  console.log(`Bronquiolite (32-34s): ${bronquioliteParaEnviar.length} pacientes`);
  console.log(`dTpa (27s): ${dtpaParaEnviar.length} pacientes`);
  console.log(`Total: ${totalEnvios} envios`);
  console.log(`Tempo estimado: ~${Math.ceil(totalEnvios * DELAY_MS / 60000)} minutos`);
  console.log('='.repeat(60));

  const falhas = [];
  const sucessos = [];
  let count = 0;

  // Enviar Bronquiolite
  console.log('\n--- BRONQUIOLITE (32-34 semanas) ---');
  for (const g of bronquioliteParaEnviar) {
    count++;
    const phone = normalizePhone(g.telefone);
    let msg = templateMap[2].mensagem;
    msg = msg.replace(/\{nome\}/g, g.nome);
    msg = msg.replace(/\{ig_semanas\}/g, String(g.ig.semanas));
    msg = msg.replace(/\{ig_dias\}/g, String(g.ig.dias));

    process.stdout.write(`[${count}/${totalEnvios}] ${g.nome} (IG: ${g.ig.semanas}s${g.ig.dias}d)... `);
    const result = await sendWhatsApp(phone, msg);

    if (result.success) {
      console.log('✅ OK');
      sucessos.push({ nome: g.nome, vacina: 'Bronquiolite', ig: `${g.ig.semanas}s${g.ig.dias}d` });
      // Registrar no histórico
      await conn.execute(
        'INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, nomeGestante, sentAt) VALUES (1, ?, 2, ?, ?, ?, ?, NOW())',
        [g.id, phone, msg, 'enviado', g.nome]
      );
    } else {
      console.log(`❌ FALHA: ${result.error}`);
      falhas.push({ nome: g.nome, vacina: 'Bronquiolite', telefone: g.telefone, erro: result.error });
      await conn.execute(
        'INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, erroMensagem, nomeGestante, sentAt) VALUES (1, ?, 2, ?, ?, ?, ?, ?, NOW())',
        [g.id, phone, msg, 'falhou', result.error, g.nome]
      );
    }

    if (count < totalEnvios) await sleep(DELAY_MS);
  }

  // Enviar dTpa
  console.log('\n--- dTpa (27 semanas) ---');
  for (const g of dtpaParaEnviar) {
    count++;
    const phone = normalizePhone(g.telefone);
    let msg = templateMap[1].mensagem;
    msg = msg.replace(/\{nome\}/g, g.nome);
    msg = msg.replace(/\{ig_semanas\}/g, String(g.ig.semanas));
    msg = msg.replace(/\{ig_dias\}/g, String(g.ig.dias));

    process.stdout.write(`[${count}/${totalEnvios}] ${g.nome} (IG: ${g.ig.semanas}s${g.ig.dias}d)... `);
    const result = await sendWhatsApp(phone, msg);

    if (result.success) {
      console.log('✅ OK');
      sucessos.push({ nome: g.nome, vacina: 'dTpa', ig: `${g.ig.semanas}s${g.ig.dias}d` });
      await conn.execute(
        'INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, nomeGestante, sentAt) VALUES (1, ?, 1, ?, ?, ?, ?, NOW())',
        [g.id, phone, msg, 'enviado', g.nome]
      );
    } else {
      console.log(`❌ FALHA: ${result.error}`);
      falhas.push({ nome: g.nome, vacina: 'dTpa', telefone: g.telefone, erro: result.error });
      await conn.execute(
        'INSERT INTO whatsappHistorico (clinicaId, gestanteId, templateId, telefone, mensagem, status, erroMensagem, nomeGestante, sentAt) VALUES (1, ?, 1, ?, ?, ?, ?, ?, NOW())',
        [g.id, phone, msg, 'falhou', result.error, g.nome]
      );
    }

    if (count < totalEnvios) await sleep(DELAY_MS);
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('RESUMO DO ENVIO');
  console.log('='.repeat(60));
  console.log(`Total: ${totalEnvios}`);
  console.log(`Sucesso: ${sucessos.length}`);
  console.log(`Falhas: ${falhas.length}`);

  if (falhas.length > 0) {
    console.log('\n--- FALHAS ---');
    falhas.forEach(f => console.log(`  ${f.nome} | ${f.vacina} | Tel: ${f.telefone} | Erro: ${f.erro}`));
  }

  await conn.end();
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
