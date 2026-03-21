/**
 * WhatsApp Scheduler - Disparo automático de mensagens por idade gestacional
 * 
 * Este módulo roda diariamente às 9:00 AM BRT (GMT-3) e verifica:
 * 1. Quais templates de IG estão ativos
 * 2. Quais gestantes atingiram a IG configurada
 * 3. Se a mensagem já foi enviada (evita duplicatas)
 * 4. Envia a mensagem e registra no histórico
 * 
 * Melhorias v2:
 * - Janela de envio ampliada para 6 dias (evita perder mensagens se o scheduler falhar em um dia)
 * - Retry com backoff na conexão do banco
 * - Filtra gestantes com parto/abortamento registrado
 * - Corrige cálculo de IG por ultrassom (semanas * 7 + dias)
 * - Log detalhado para diagnóstico
 */

import { getDb } from './db';
import { gestantes, mensagemTemplates, whatsappHistorico, whatsappConfig, medicos, partosRealizados, abortamentos, fatoresRisco, users, medicamentosGestacao, mensagensAgendadas, sessoesGestante } from '../drizzle/schema';
import { eq, and, isNotNull, sql, notInArray } from 'drizzle-orm';
import { sendToGestante, type GestanteContext } from './whatsapp';

// ─── Filtro: apenas gestantes que baixaram o app ────────────────────────────

/**
 * Retorna true se a gestante tiver ao menos uma sessão registrada em sessoesGestante,
 * indicando que ela já baixou e acessou o aplicativo.
 * Regra obrigatória: mensagens automáticas só são enviadas para quem baixou o app.
 */
async function temSessaoApp(db: any, gestanteId: number): Promise<boolean> {
  const [sessao] = await db
    .select({ id: sessoesGestante.id })
    .from(sessoesGestante)
    .where(eq(sessoesGestante.gestanteId, gestanteId))
    .limit(1);
  return !!sessao;
}

// ─── Retry Helper ───────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelayMs = 2000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isConnectionError = error?.cause?.code === 'ECONNRESET' || 
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('ETIMEDOUT') ||
        error?.message?.includes('ECONNREFUSED');
      
      if (isConnectionError && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`[WhatsApp Scheduler] Erro de conexão (tentativa ${attempt}/${maxRetries}), retentando em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// ─── Cálculo de Idade Gestacional ────────────────────────────────────────────

function calcularIGAtual(dum: Date | string | null, igUltrassomSemanas?: number | null, igUltrassomDias?: number | null, dataUltrassom?: Date | string | null): { semanas: number; dias: number; totalDias: number } | null {
  const hoje = new Date();

  // Prioridade: Ultrassom > DUM
  if ((igUltrassomSemanas || igUltrassomSemanas === 0) && dataUltrassom) {
    const dataUS = typeof dataUltrassom === 'string' ? new Date(dataUltrassom + 'T12:00:00') : dataUltrassom;
    const diffMs = hoje.getTime() - dataUS.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    // Converter semanas + dias do ultrassom para total de dias
    const igTotalDiasNoUS = igUltrassomSemanas * 7 + (igUltrassomDias || 0);
    const totalDias = igTotalDiasNoUS + diasDesdeUS;
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

// ─── Lock de Execução (previne execução concorrente) ────────────────────────

/**
 * Tenta adquirir um lock no banco de dados para evitar que múltiplas instâncias
 * do scheduler (ex: produção + dev sandbox) rodem ao mesmo tempo.
 * Usa GET_LOCK do MySQL com timeout de 0 (non-blocking).
 */
async function acquireSchedulerLock(db: any, lockName: string = 'whatsapp_scheduler_ig'): Promise<boolean> {
  try {
    const result = await db.execute(sql`SELECT GET_LOCK(${lockName}, 0) as acquired`);
    const acquired = result?.rows?.[0]?.acquired ?? result?.[0]?.[0]?.acquired ?? result?.[0]?.acquired;
    return acquired === 1 || acquired === '1';
  } catch (error) {
    console.error(`[WhatsApp Scheduler] Erro ao adquirir lock ${lockName}:`, error);
    return false;
  }
}

async function releaseSchedulerLock(db: any, lockName: string = 'whatsapp_scheduler_ig'): Promise<void> {
  try {
    await db.execute(sql`SELECT RELEASE_LOCK(${lockName})`);
  } catch (error) {
    console.error(`[WhatsApp Scheduler] Erro ao liberar lock ${lockName}:`, error);
  }
}

// ─── Processar Templates por IG ──────────────────────────────────────────────

export async function processarMensagensIG(): Promise<{ enviadas: number; erros: number }> {
  const db = await withRetry(() => getDb());
  if (!db) {
    console.error('[WhatsApp Scheduler] Falha ao conectar ao banco de dados após retries');
    return { enviadas: 0, erros: 0 };
  }

  // Tentar adquirir lock para evitar execução concorrente (ex: produção + dev sandbox)
  const lockName = 'whatsapp_scheduler_ig';
  const lockAcquired = await acquireSchedulerLock(db, lockName);
  if (!lockAcquired) {
    console.log('[WhatsApp Scheduler] Outra instância já está executando processarMensagensIG. Abortando para evitar duplicatas.');
    return { enviadas: 0, erros: 0 };
  }
  console.log('[WhatsApp Scheduler] Lock IG adquirido com sucesso.');

  let enviadas = 0;
  let erros = 0;

  try {
    // Buscar todas as clínicas com WhatsApp ativo
    const clinicasAtivas = await withRetry(() => 
      db.select().from(whatsappConfig).where(eq(whatsappConfig.ativo, 1))
    );

    console.log(`[WhatsApp Scheduler] ${clinicasAtivas.length} clínica(s) com WhatsApp ativo`);

    // Buscar IDs de gestantes que já deram à luz ou tiveram abortamento
    const partosIds = await withRetry(() =>
      db.select({ gestanteId: partosRealizados.gestanteId }).from(partosRealizados)
    );
    const abortamentosIds = await withRetry(() =>
      db.select({ gestanteId: abortamentos.gestanteId }).from(abortamentos)
    );
    const excludedIds = new Set([
      ...partosIds.map((p: any) => p.gestanteId),
      ...abortamentosIds.map((a: any) => a.gestanteId),
    ]);

    console.log(`[WhatsApp Scheduler] ${excludedIds.size} gestante(s) excluídas (parto/abortamento)`);

    for (const clinicaConfig of clinicasAtivas) {
      // Buscar templates de IG ativos desta clínica
      const templatesIG = await withRetry(() =>
        db.select().from(mensagemTemplates).where(and(
          eq(mensagemTemplates.clinicaId, clinicaConfig.clinicaId),
          eq(mensagemTemplates.gatilhoTipo, 'idade_gestacional'),
          eq(mensagemTemplates.ativo, 1),
          isNotNull(mensagemTemplates.igSemanas),
        ))
      );

      if (!templatesIG.length) {
        console.log(`[WhatsApp Scheduler] Clínica ${clinicaConfig.clinicaId}: nenhum template IG ativo`);
        continue;
      }

      console.log(`[WhatsApp Scheduler] Clínica ${clinicaConfig.clinicaId}: ${templatesIG.length} template(s) IG`);

      // Buscar gestantes ativas desta clínica com telefone
      const gestantesList = await withRetry(() =>
        db.select().from(gestantes).where(and(
          sql`${gestantes.clinicaId} = ${clinicaConfig.clinicaId}`,
          isNotNull(gestantes.telefone),
        ))
      );

      // Filtrar gestantes que já deram à luz ou tiveram abortamento
      const gestantesAtivas = gestantesList.filter((g: any) => !excludedIds.has(g.id));

      console.log(`[WhatsApp Scheduler] Clínica ${clinicaConfig.clinicaId}: ${gestantesAtivas.length} gestante(s) ativas com telefone (${gestantesList.length - gestantesAtivas.length} excluídas)`);

      for (const gestante of gestantesAtivas) {
        if (!gestante.telefone) continue;

        // Calcular IG atual - usando igUltrassomSemanas * 7 + igUltrassomDias
        const ig = calcularIGAtual(
          gestante.dum,
          gestante.igUltrassomSemanas,
          gestante.igUltrassomDias,
          gestante.dataUltrassom,
        );
        if (!ig) continue;

        // Verificar cada template de IG
        for (const template of templatesIG) {
          if (!template.igSemanas) continue;

          const templateTotalDias = template.igSemanas * 7 + (template.igDias || 0);

          // Janela de envio: 6 dias de margem (evita perder mensagens se scheduler falhar)
          // Envia se a gestante está na IG do template ou até 6 dias depois
          // A verificação de "já enviada" evita duplicatas
          if (ig.totalDias >= templateTotalDias && ig.totalDias <= templateTotalDias + 6) {
            // Verificar condições opcionais do template
            if (template.condicaoTipoParto && gestante.tipoPartoDesejado !== template.condicaoTipoParto) {
              continue;
            }
            if (template.condicaoMedicoId && gestante.medicoId !== template.condicaoMedicoId) {
              continue;
            }

            // Verificar condição de Rh negativo
            if (template.condicaoRhNegativo === 1) {
              const [fatorRh] = await db
                .select({ id: fatoresRisco.id })
                .from(fatoresRisco)
                .where(and(
                  eq(fatoresRisco.gestanteId, gestante.id),
                  eq(fatoresRisco.tipo, 'fator_rh_negativo'),
                  eq(fatoresRisco.ativo, 1),
                ))
                .limit(1);
              if (!fatorRh) {
                continue; // Gestante não é Rh negativo, pular
              }
            }

            // Verificar condição de medicamento em uso
            if (template.condicaoMedicamento) {
              const [medEmUso] = await db
                .select({ id: medicamentosGestacao.id })
                .from(medicamentosGestacao)
                .where(and(
                  eq(medicamentosGestacao.gestanteId, gestante.id),
                  eq(medicamentosGestacao.tipo, template.condicaoMedicamento as any),
                  eq(medicamentosGestacao.ativo, 1),
                ))
                .limit(1);
              if (!medEmUso) {
                continue; // Gestante não usa este medicamento, pular
              }
            }

            // Verificar se gestante baixou o app (regra obrigatória para mensagens automáticas)
            const baixouApp = await temSessaoApp(db, gestante.id);
            if (!baixouApp) {
              console.log(`[WhatsApp Scheduler] ⏭️ ${gestante.nome} não baixou o app, pulando mensagem automática`);
              continue;
            }

            // Verificar se já foi enviada
            const enviada = await jaEnviada(db, clinicaConfig.clinicaId, gestante.id, template.id);
            if (enviada) continue;

            // Buscar médico da gestante e seu telefone
            let medicoNome = '';
            let telefoneMedico = '';
            try {
              if (gestante.medicoId) {
                const [med] = await db
                  .select({ nome: medicos.nome })
                  .from(medicos)
                  .where(eq(medicos.id, gestante.medicoId))
                  .limit(1);
                medicoNome = med?.nome || '';
                // Buscar telefone do usuário que corresponde ao médico (pelo nome)
                if (medicoNome) {
                  const [userMedico] = await db
                    .select({ telefone: users.telefone })
                    .from(users)
                    .where(and(
                      sql`${users.name} LIKE ${medicoNome + '%'}`,
                      sql`${users.clinicaId} = ${clinicaConfig.clinicaId}`,
                    ))
                    .limit(1);
                  telefoneMedico = userMedico?.telefone || '';
                }
              }
            } catch { /* ignore */ }

            const context: GestanteContext = {
              nome: gestante.nome,
              telefone: gestante.telefone,
              igSemanas: ig.semanas,
              igDias: ig.dias,
              dpp: calcularDPP(gestante.dum) || undefined,
              medico: medicoNome,
              telefoneMedico,
              gestanteId: gestante.id,
            };

            // Re-verificar duplicata imediatamente antes de enviar (segunda camada de proteção)
            const jaEnviadaRecheck = await jaEnviada(db, clinicaConfig.clinicaId, gestante.id, template.id);
            if (jaEnviadaRecheck) {
              console.log(`[WhatsApp Scheduler] ⚠️ Duplicata detectada no re-check para ${gestante.nome} template ${template.id}. Pulando.`);
              continue;
            }

            console.log(`[WhatsApp Scheduler] Enviando "${template.nome}" para ${gestante.nome} (IG: ${ig.semanas}s${ig.dias}d, template IG: ${template.igSemanas}s)`);

            const result = await sendToGestante(clinicaConfig.clinicaId, template.id, context);
            if (result.success) {
              enviadas++;
              console.log(`[WhatsApp Scheduler] ✅ Enviada com sucesso para ${gestante.nome}`);
            } else {
              erros++;
              console.log(`[WhatsApp Scheduler] ❌ Falha ao enviar para ${gestante.nome}: ${result.error}`);
            }

            // Delay de 6 segundos entre envios (Account Protection: 1 msg a cada 5s)
            await new Promise(resolve => setTimeout(resolve, 6000));
          }
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp Scheduler] Erro ao processar mensagens:', error);
  } finally {
    // Sempre liberar o lock ao terminar
    await releaseSchedulerLock(db, lockName);
    console.log('[WhatsApp Scheduler] Lock IG liberado.');
  }

  console.log(`[WhatsApp Scheduler] Processamento conclu\u00eddo: ${enviadas} enviadas, ${erros} erros`);

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

  // Verificar se gestante baixou o app (regra obrigatória para mensagens automáticas)
  if (gestanteContext.gestanteId) {
    const baixouApp = await temSessaoApp(db, gestanteContext.gestanteId);
    if (!baixouApp) {
      console.log(`[WhatsApp Scheduler] ⏭️ Gestante ${gestanteContext.gestanteId} não baixou o app, cancelando mensagem de evento '${evento}'`);
      return { enviadas: 0, erros: 0 };
    }
  }

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

// ─── Processar Mensagens Agendadas (pós-consulta por conduta) ───────────

/**
 * Processa a fila de mensagens agendadas cujo dataEnvio é hoje ou anterior (pendentes).
 * Chamado diariamente pelo scheduler junto com processarMensagensIG.
 */
export async function processarMensagensAgendadas(): Promise<{ enviadas: number; erros: number }> {
  const db = await withRetry(() => getDb());
  if (!db) {
    console.error('[WhatsApp Scheduler] Falha ao conectar ao banco para mensagens agendadas');
    return { enviadas: 0, erros: 0 };
  }

  // Tentar adquirir lock para evitar execução concorrente
  const lockNameAgendadas = 'whatsapp_scheduler_agendadas';
  const lockAcquired = await acquireSchedulerLock(db, lockNameAgendadas);
  if (!lockAcquired) {
    console.log('[WhatsApp Scheduler] Outra instância já está executando agendadas. Abortando.');
    return { enviadas: 0, erros: 0 };
  }

  let enviadas = 0;
  let erros = 0;

  try {
    // Buscar mensagens pendentes cuja data de envio é hoje ou anterior
    const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const pendentes = await withRetry(() =>
      db.select()
        .from(mensagensAgendadas)
        .where(and(
          eq(mensagensAgendadas.status, 'pendente'),
          sql`${mensagensAgendadas.dataEnvio} <= ${hoje}`,
        ))
    );

    console.log(`[WhatsApp Scheduler] ${pendentes.length} mensagem(ns) agendada(s) pendente(s)`);

    for (const agendada of pendentes) {
      try {
        // Buscar template
        const [template] = await db
          .select()
          .from(mensagemTemplates)
          .where(and(
            eq(mensagemTemplates.id, agendada.templateId),
            eq(mensagemTemplates.ativo, 1),
          ))
          .limit(1);

        if (!template) {
          // Template desativado ou removido, cancelar
          await db.update(mensagensAgendadas)
            .set({ status: 'cancelado', erroMensagem: 'Template desativado ou removido', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          continue;
        }

        // Verificar se WhatsApp está ativo para a clínica
        const [config] = await db
          .select()
          .from(whatsappConfig)
          .where(and(eq(whatsappConfig.clinicaId, agendada.clinicaId), eq(whatsappConfig.ativo, 1)))
          .limit(1);

        if (!config) {
          await db.update(mensagensAgendadas)
            .set({ status: 'cancelado', erroMensagem: 'WhatsApp não ativo para a clínica', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          continue;
        }

        // Verificar se gestante ainda está ativa (sem parto/abortamento)
        const [parto] = await db.select({ id: partosRealizados.id }).from(partosRealizados)
          .where(eq(partosRealizados.gestanteId, agendada.gestanteId)).limit(1);
        const [aborto] = await db.select({ id: abortamentos.id }).from(abortamentos)
          .where(eq(abortamentos.gestanteId, agendada.gestanteId)).limit(1);

        if (parto || aborto) {
          await db.update(mensagensAgendadas)
            .set({ status: 'cancelado', erroMensagem: 'Gestante já teve parto ou abortamento', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          continue;
        }

        // Verificar se gestante baixou o app (regra obrigatória para mensagens automáticas)
        const baixouApp = await temSessaoApp(db, agendada.gestanteId);
        if (!baixouApp) {
          await db.update(mensagensAgendadas)
            .set({ status: 'cancelado', erroMensagem: 'Gestante não baixou o app', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          console.log(`[WhatsApp Scheduler] ⏭️ Gestante ${agendada.gestanteId} não baixou o app, cancelando mensagem agendada`);
          continue;
        }

        // Buscar dados da gestante
        const [gestante] = await db.select().from(gestantes)
          .where(eq(gestantes.id, agendada.gestanteId)).limit(1);

        if (!gestante || !gestante.telefone) {
          await db.update(mensagensAgendadas)
            .set({ status: 'cancelado', erroMensagem: 'Gestante sem telefone cadastrado', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          continue;
        }

        // Calcular IG atual
        const ig = calcularIGAtual(gestante.dum, gestante.igUltrassomSemanas, gestante.igUltrassomDias, gestante.dataUltrassom);

        // Buscar médico
        let medicoNome = '';
        let telefoneMedico = '';
        try {
          if (gestante.medicoId) {
            const [med] = await db.select({ nome: medicos.nome }).from(medicos)
              .where(eq(medicos.id, gestante.medicoId)).limit(1);
            medicoNome = med?.nome || '';
            if (medicoNome) {
              const [userMedico] = await db.select({ telefone: users.telefone }).from(users)
                .where(and(sql`${users.name} LIKE ${medicoNome + '%'}`, sql`${users.clinicaId} = ${agendada.clinicaId}`))
                .limit(1);
              telefoneMedico = userMedico?.telefone || '';
            }
          }
        } catch { /* ignore */ }

        const context: GestanteContext = {
          nome: gestante.nome,
          telefone: gestante.telefone,
          igSemanas: ig?.semanas || 0,
          igDias: ig?.dias || 0,
          dpp: calcularDPP(gestante.dum) || undefined,
          medico: medicoNome,
          telefoneMedico,
          gestanteId: gestante.id,
        };

        console.log(`[WhatsApp Scheduler] Enviando agendada "${template.nome}" para ${gestante.nome}`);

        const result = await sendToGestante(agendada.clinicaId, template.id, context);
        if (result.success) {
          enviadas++;
          await db.update(mensagensAgendadas)
            .set({ status: 'enviado', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          console.log(`[WhatsApp Scheduler] ✅ Agendada enviada para ${gestante.nome}`);
        } else {
          erros++;
          await db.update(mensagensAgendadas)
            .set({ status: 'falhou', erroMensagem: result.error || 'Erro desconhecido', processedAt: new Date() })
            .where(eq(mensagensAgendadas.id, agendada.id));
          console.log(`[WhatsApp Scheduler] ❌ Falha agendada para ${gestante.nome}: ${result.error}`);
        }

        // Delay de 6 segundos entre envios
        await new Promise(resolve => setTimeout(resolve, 6000));

      } catch (error: any) {
        erros++;
        await db.update(mensagensAgendadas)
          .set({ status: 'falhou', erroMensagem: error?.message || 'Erro inesperado', processedAt: new Date() })
          .where(eq(mensagensAgendadas.id, agendada.id));
        console.error(`[WhatsApp Scheduler] Erro ao processar agendada ${agendada.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[WhatsApp Scheduler] Erro ao processar mensagens agendadas:', error);
  } finally {
    await releaseSchedulerLock(db, lockNameAgendadas);
  }

  console.log(`[WhatsApp Scheduler] Agendadas: ${enviadas} enviadas, ${erros} erros`);
  return { enviadas, erros };
}

// ─── Agendar Mensagem Pós-Consulta ──────────────────────────────────

/**
 * Verifica se alguma conduta da consulta tem template pos_consulta_conduta ativo
 * e agenda a mensagem para X dias após a consulta.
 */
export async function agendarMensagensPosConsulta(
  clinicaId: number,
  gestanteId: number,
  consultaId: number,
  condutas: string[],
  dataConsulta: string, // YYYY-MM-DD
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let agendadas = 0;

  try {
    // Buscar templates pos_consulta_conduta ativos desta clínica
    const templates = await db.select().from(mensagemTemplates).where(and(
      eq(mensagemTemplates.clinicaId, clinicaId),
      eq(mensagemTemplates.gatilhoTipo, 'pos_consulta_conduta'),
      eq(mensagemTemplates.ativo, 1),
      isNotNull(mensagemTemplates.condutaGatilho),
      isNotNull(mensagemTemplates.diasAposConsulta),
    ));

    if (!templates.length) return 0;

    // Normalizar condutas para comparação case-insensitive
    const condutasLower = condutas.map(c => c.toLowerCase().trim());

    for (const template of templates) {
      if (!template.condutaGatilho || !template.diasAposConsulta) continue;

      // Verificar se a conduta do template está entre as condutas da consulta
      const condutaTemplateLower = template.condutaGatilho.toLowerCase().trim();
      const match = condutasLower.some(c => c.includes(condutaTemplateLower) || condutaTemplateLower.includes(c));

      if (!match) continue;

      // Verificar se já existe agendamento pendente para esta gestante + template
      const [existente] = await db.select({ id: mensagensAgendadas.id })
        .from(mensagensAgendadas)
        .where(and(
          eq(mensagensAgendadas.gestanteId, gestanteId),
          eq(mensagensAgendadas.templateId, template.id),
          eq(mensagensAgendadas.status, 'pendente'),
        ))
        .limit(1);

      if (existente) {
        console.log(`[WhatsApp Scheduler] Já existe agendamento pendente para gestante ${gestanteId} template ${template.id}`);
        continue;
      }

      // Calcular data de envio
      const dataConsultaDate = new Date(dataConsulta + 'T12:00:00');
      dataConsultaDate.setDate(dataConsultaDate.getDate() + template.diasAposConsulta);
      const dataEnvioStr = dataConsultaDate.toISOString().split('T')[0];

      // Inserir na fila
      await db.insert(mensagensAgendadas).values({
        clinicaId,
        gestanteId,
        templateId: template.id,
        consultaId,
        dataEnvio: dataConsultaDate,
        status: 'pendente',
      });

      agendadas++;
      console.log(`[WhatsApp Scheduler] Agendada "${template.nome}" para gestante ${gestanteId} em ${dataEnvioStr} (${template.diasAposConsulta} dias após consulta)`);
    }
  } catch (error) {
    console.error('[WhatsApp Scheduler] Erro ao agendar mensagens pós-consulta:', error);
  }

  return agendadas;
}

// ─── Calcular ms até próxima execução às 9:00 BRT ──────────────────────────

/**
 * Calcula quantos milissegundos faltam até as 9:00 AM BRT (UTC-3).
 * Se já passou das 9:00 BRT hoje, agenda para amanhã.
 */
function msAteProxima9hBRT(): number {
  const agora = new Date();
  
  // Converter para horário BRT (UTC-3)
  const utcHours = agora.getUTCHours();
  const utcMinutes = agora.getUTCMinutes();
  const utcSeconds = agora.getUTCSeconds();
  
  // 9:00 BRT = 12:00 UTC
  const targetUTCHour = 12; // 9:00 BRT = 12:00 UTC
  
  // Calcular ms desde meia-noite UTC
  const msDesdeUTCMeiaNoite = (utcHours * 3600 + utcMinutes * 60 + utcSeconds) * 1000;
  const msAlvo = targetUTCHour * 3600 * 1000; // 12:00 UTC em ms
  
  let diff = msAlvo - msDesdeUTCMeiaNoite;
  
  // Se já passou, agendar para amanhã
  if (diff <= 0) {
    diff += 24 * 60 * 60 * 1000; // +24h
  }
  
  return diff;
}

// ─── Iniciar Scheduler ──────────────────────────────────────────────────────

let schedulerTimeout: ReturnType<typeof setTimeout> | null = null;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

function agendarProximaExecucao() {
  const ms = msAteProxima9hBRT();
  const horasRestantes = (ms / (1000 * 60 * 60)).toFixed(1);
  
  console.log(`[WhatsApp Scheduler] Próxima execução em ${horasRestantes}h (9:00 AM BRT)`);
  
  schedulerTimeout = setTimeout(async () => {
    console.log(`[WhatsApp Scheduler] Executando às 9:00 AM BRT...`);
    await processarMensagensIG().catch(console.error);
    await processarMensagensAgendadas().catch(console.error);
    
    // Após executar, agendar para o dia seguinte (24h)
    schedulerInterval = setInterval(async () => {
      console.log(`[WhatsApp Scheduler] Executando às 9:00 AM BRT...`);
      await processarMensagensIG().catch(console.error);
      await processarMensagensAgendadas().catch(console.error);
    }, 24 * 60 * 60 * 1000); // A cada 24h
  }, ms);
}

export function startWhatsAppScheduler() {
  if (schedulerTimeout || schedulerInterval) return; // Já rodando

  agendarProximaExecucao();
  console.log('[WhatsApp Scheduler] Iniciado - execução diária às 9:00 AM BRT (GMT-3)');
}

export function stopWhatsAppScheduler() {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  console.log('[WhatsApp Scheduler] Parado');
}
