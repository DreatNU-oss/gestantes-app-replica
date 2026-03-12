/**
 * WhatsApp Scheduler - Disparo automático de mensagens por idade gestacional
 * 
 * Este módulo roda periodicamente (a cada 6 horas) e verifica:
 * 1. Quais templates de IG estão ativos
 * 2. Quais gestantes atingiram a IG configurada
 * 3. Se a mensagem já foi enviada (evita duplicatas)
 * 4. Envia a mensagem e registra no histórico
 */

import { getDb } from './db';
import { gestantes, mensagemTemplates, whatsappHistorico, whatsappConfig, medicos } from '../drizzle/schema';
import { eq, and, isNotNull, sql, desc } from 'drizzle-orm';
import { sendToGestante, type GestanteContext } from './whatsapp';

// ─── Cálculo de Idade Gestacional ────────────────────────────────────────────

function calcularIGAtual(dum: Date | string | null, igUltrassomDias?: number | null, dataUltrassom?: Date | string | null): { semanas: number; dias: number; totalDias: number } | null {
  const hoje = new Date();

  // Prioridade: Ultrassom > DUM
  if (igUltrassomDias && dataUltrassom) {
    const dataUS = typeof dataUltrassom === 'string' ? new Date(dataUltrassom + 'T12:00:00') : dataUltrassom;
    const diffMs = hoje.getTime() - dataUS.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalDias = igUltrassomDias + diasDesdeUS;
    if (totalDias < 0 || totalDias > 315) return null; // 45 semanas max
    return { semanas: Math.floor(totalDias / 7), dias: totalDias % 7, totalDias };
  }

  if (dum) {
    const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
    const diffMs = hoje.getTime() - dumDate.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (totalDias < 0 || totalDias > 315) return null;
    return { semanas: Math.floor(totalDias / 7), dias: totalDias % 7, totalDias };
  }

  return null;
}

function calcularDPP(dum: Date | string | null): string | null {
  if (!dum) return null;
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const dpp = new Date(dumDate);
  dpp.setDate(dpp.getDate() + 280); // 40 semanas
  return dpp.toLocaleDateString('pt-BR');
}

// ─── Verificar se mensagem já foi enviada ────────────────────────────────────

async function jaEnviada(db: any, clinicaId: number, gestanteId: number, templateId: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: whatsappHistorico.id })
    .from(whatsappHistorico)
    .where(and(
      eq(whatsappHistorico.clinicaId, clinicaId),
      eq(whatsappHistorico.gestanteId, gestanteId),
      eq(whatsappHistorico.templateId, templateId),
      eq(whatsappHistorico.status, 'enviado'),
    ))
    .limit(1);
  return !!existing;
}

// ─── Processar Templates por IG ──────────────────────────────────────────────

export async function processarMensagensIG(): Promise<{ enviadas: number; erros: number }> {
  const db = await getDb();
  if (!db) return { enviadas: 0, erros: 0 };

  let enviadas = 0;
  let erros = 0;

  try {
    // Buscar todas as clínicas com WhatsApp ativo
    const clinicasAtivas = await db
      .select()
      .from(whatsappConfig)
      .where(eq(whatsappConfig.ativo, 1));

    for (const clinicaConfig of clinicasAtivas) {
      // Buscar templates de IG ativos desta clínica
      const templatesIG = await db
        .select()
        .from(mensagemTemplates)
        .where(and(
          eq(mensagemTemplates.clinicaId, clinicaConfig.clinicaId),
          eq(mensagemTemplates.gatilhoTipo, 'idade_gestacional'),
          eq(mensagemTemplates.ativo, 1),
          isNotNull(mensagemTemplates.igSemanas),
        ));

      if (!templatesIG.length) continue;

      // Buscar gestantes ativas desta clínica com telefone
      const gestantesList = await db
        .select()
        .from(gestantes)
        .where(and(
          sql`${gestantes.clinicaId} = ${clinicaConfig.clinicaId}`,
          isNotNull(gestantes.telefone),
        ));

      for (const gestante of gestantesList) {
        if (!gestante.telefone) continue;

        // Calcular IG atual
        const ig = calcularIGAtual(
          gestante.dum,
          gestante.igUltrassomDias,
          gestante.dataUltrassom,
        );
        if (!ig) continue;

        // Verificar cada template de IG
        for (const template of templatesIG) {
          if (!template.igSemanas) continue;

          const templateTotalDias = template.igSemanas * 7 + (template.igDias || 0);

          // Enviar se a gestante está na semana correta (margem de 3 dias para frente)
          // Isso permite que o scheduler rode a cada 6h sem perder janelas
          if (ig.totalDias >= templateTotalDias && ig.totalDias <= templateTotalDias + 3) {
            // Verificar se já foi enviada
            const enviada = await jaEnviada(db, clinicaConfig.clinicaId, gestante.id, template.id);
            if (enviada) continue;

            // Buscar médico da gestante
            let medicoNome = '';
            try {
              if (gestante.medicoId) {
                const [med] = await db
                  .select({ nome: medicos.nome })
                  .from(medicos)
                  .where(eq(medicos.id, gestante.medicoId))
                  .limit(1);
                medicoNome = med?.nome || '';
              }
            } catch { /* ignore */ }

            const context: GestanteContext = {
              nome: gestante.nome,
              telefone: gestante.telefone,
              igSemanas: ig.semanas,
              igDias: ig.dias,
              dpp: calcularDPP(gestante.dum) || undefined,
              medico: medicoNome,
              gestanteId: gestante.id,
            };

            const result = await sendToGestante(clinicaConfig.clinicaId, template.id, context);
            if (result.success) {
              enviadas++;
            } else {
              erros++;
            }

            // Pequeno delay entre envios para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp Scheduler] Erro ao processar mensagens:', error);
  }

  if (enviadas > 0 || erros > 0) {
    console.log(`[WhatsApp Scheduler] Processamento concluído: ${enviadas} enviadas, ${erros} erros`);
  }

  return { enviadas, erros };
}

// ─── Processar Templates por Evento ──────────────────────────────────────────

/**
 * Dispara mensagens baseadas em eventos (chamado manualmente quando o evento ocorre).
 * Ex: após registrar um parto, chamar com evento='pos_cesarea' ou 'pos_parto_normal'
 */
export async function processarMensagemEvento(
  clinicaId: number,
  evento: string,
  gestanteContext: GestanteContext,
): Promise<{ enviadas: number; erros: number }> {
  const db = await getDb();
  if (!db) return { enviadas: 0, erros: 0 };

  let enviadas = 0;
  let erros = 0;

  // Verificar se WhatsApp está ativo para esta clínica
  const [config] = await db
    .select()
    .from(whatsappConfig)
    .where(and(eq(whatsappConfig.clinicaId, clinicaId), eq(whatsappConfig.ativo, 1)))
    .limit(1);

  if (!config) return { enviadas: 0, erros: 0 };

  // Buscar templates do evento
  const templates = await db
    .select()
    .from(mensagemTemplates)
    .where(and(
      eq(mensagemTemplates.clinicaId, clinicaId),
      eq(mensagemTemplates.gatilhoTipo, 'evento'),
      eq(mensagemTemplates.ativo, 1),
      sql`${mensagemTemplates.evento} = ${evento}`,
    ));

  for (const template of templates) {
    const result = await sendToGestante(clinicaId, template.id, gestanteContext);
    if (result.success) {
      enviadas++;
    } else {
      erros++;
    }
  }

  return { enviadas, erros };
}

// ─── Iniciar Scheduler ──────────────────────────────────────────────────────

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startWhatsAppScheduler() {
  if (schedulerInterval) return; // Já rodando

  // Rodar a cada 6 horas (21600000 ms)
  const INTERVAL_MS = 6 * 60 * 60 * 1000;

  // Primeira execução após 5 minutos (dar tempo do server iniciar)
  setTimeout(() => {
    processarMensagensIG().catch(console.error);
  }, 5 * 60 * 1000);

  schedulerInterval = setInterval(() => {
    processarMensagensIG().catch(console.error);
  }, INTERVAL_MS);

  console.log('[WhatsApp Scheduler] Iniciado - verificação a cada 6 horas');
}

export function stopWhatsAppScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[WhatsApp Scheduler] Parado');
  }
}
