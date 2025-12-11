import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createGestante, 
  getGestantesByUserId, 
  getGestanteById, 
  updateGestante, 
  deleteGestante,
  createConsultaPrenatal,
  getConsultasByGestanteId,
  getConsultaById,
  updateConsulta,
  deleteConsulta,
  createExameLaboratorial,
  getExamesByGestanteId,
  getExameById,
  updateExame,
  deleteExame,
  createParametroExame,
  getParametrosByExameId,
  getParametroById,
  updateParametro,
  deleteParametro,
  listarMedicos,
  listarTodosMedicos,
  criarMedico,
  atualizarMedico,
  desativarMedico,
  ativarMedico,
  deletarMedico,
  listarPlanosAtivos,
  listarTodosPlanos,
  criarPlano,
  atualizarPlano,
  toggleAtivoPlano,
  deletarPlano,
  createPedidoExame,
  getPedidosByGestanteId,
  updatePedidoExame,
  getCredencialByMedicoId,
  createAlertaEnviado,
  getAlertasByGestanteId
} from "./db";
import { calcularConsultasSugeridas, salvarAgendamentos, buscarAgendamentos, atualizarStatusAgendamento, remarcarAgendamento } from './agendamento';
import { sendWhatsAppMessage, TEMPLATES_VACINAS, type TemplateVacina } from './helena';
import { processarLembretes } from './lembretes';
import { configuracoesEmail, logsEmails, resultadosExames, type InsertResultadoExame, mensagensWhatsapp, type InsertMensagemWhatsapp } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { interpretarExamesComIA } from './interpretarExames';
import { getDb } from './db';
import { TRPCError } from '@trpc/server';

// Função auxiliar para converter string de data (YYYY-MM-DD) para Date sem problemas de fuso horário
// Retorna a string diretamente para o MySQL interpretar como DATE local
function parseLocalDate(dateString: string): string {
  return dateString; // MySQL interpreta YYYY-MM-DD como data local, sem conversão UTC
}

// Funções auxiliares para cálculos obstétricos
function calcularIdadeGestacionalPorDUM(dum: Date): { semanas: number; dias: number; totalDias: number } {
  const hoje = new Date();
  const diffMs = hoje.getTime() - dum.getTime();
  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return { semanas, dias, totalDias };
}

function calcularIdadeGestacionalPorUS(igUltrassomDias: number, dataUltrassom: Date): { semanas: number; dias: number; totalDias: number } {
  const hoje = new Date();
  const diffMs = hoje.getTime() - dataUltrassom.getTime();
  const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDias = igUltrassomDias + diasDesdeUS;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return { semanas, dias, totalDias };
}

function calcularDPP(dum: Date): Date {
  const dpp = new Date(dum);
  dpp.setDate(dpp.getDate() + 280); // 40 semanas = 280 dias
  return dpp;
}

function calcularDppUS(igUltrassomDias: number, dataUltrassom: Date): Date {
  const diasRestantes = 280 - igUltrassomDias;
  const dpp = new Date(dataUltrassom);
  dpp.setDate(dpp.getDate() + diasRestantes);
  return dpp;
}

function calcularDataParaSemana(dum: Date, semanasAlvo: number): Date {
  const dataAlvo = new Date(dum);
  dataAlvo.setDate(dataAlvo.getDate() + (semanasAlvo * 7));
  return dataAlvo;
}

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mes = hoje.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  planosSaude: router({
    listar: publicProcedure.query(() => listarPlanosAtivos()),
    listarTodos: protectedProcedure.query(() => listarTodosPlanos()),
    criar: protectedProcedure
      .input(z.object({ nome: z.string() }))
      .mutation(({ input }) => criarPlano(input)),
    atualizar: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return atualizarPlano(id, data);
      }),
    toggleAtivo: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => toggleAtivoPlano(input.id)),
    deletar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletarPlano(input.id)),
  }),
  
  medicos: router({
    listar: publicProcedure.query(() => listarMedicos()),
    listarTodos: protectedProcedure.query(() => listarTodosMedicos()),
    criar: protectedProcedure
      .input(z.object({ nome: z.string(), ordem: z.number().optional() }))
      .mutation(({ input }) => criarMedico(input)),
    atualizar: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional(), ordem: z.number().optional() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return atualizarMedico(id, data);
      }),
    desativar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => desativarMedico(input.id)),
    ativar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => ativarMedico(input.id)),
    deletar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletarMedico(input.id)),
  }),

  gestantes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const lista = await getGestantesByUserId(ctx.user.id);
      
      // Adicionar cálculos para cada gestante
      return lista.map(g => {
        let igDUM = null;
        let igUS = null;
        let dpp = null;
        let dppUS = null;
        let idade = null;
        
        if (g.dum) {
          // Parsear YYYY-MM-DD como data local
          const [year, month, day] = g.dum.split('-').map(Number);
          const dumDate = new Date(year, month - 1, day);
          igDUM = calcularIdadeGestacionalPorDUM(dumDate);
          dpp = calcularDPP(dumDate);
        }
        
        if (g.igUltrassomSemanas !== null && g.igUltrassomDias !== null && g.dataUltrassom) {
          // Parsear YYYY-MM-DD como data local
          const [year, month, day] = g.dataUltrassom.split('-').map(Number);
          const dataUS = new Date(year, month - 1, day);
          const igUltrassomDias = (g.igUltrassomSemanas * 7) + g.igUltrassomDias;
          igUS = calcularIdadeGestacionalPorUS(igUltrassomDias, dataUS);
          dppUS = calcularDppUS(igUltrassomDias, dataUS);
        }
        
        if (g.dataNascimento) {
          const [year, month, day] = g.dataNascimento.split('-').map(Number);
          idade = calcularIdade(new Date(year, month - 1, day));
        }
        
        return {
          ...g,
          calculado: {
            igDUM,
            igUS,
            dpp,
            dppUS,
            idade
          }
        };
      });
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const g = await getGestanteById(input.id);
        if (!g) return null;
        
        let igDUM = null;
        let igUS = null;
        let dpp = null;
        let dppUS = null;
        let idade = null;
        
        if (g.dum) {
          // Parsear YYYY-MM-DD como data local
          const [year, month, day] = g.dum.split('-').map(Number);
          const dumDate = new Date(year, month - 1, day);
          igDUM = calcularIdadeGestacionalPorDUM(dumDate);
          dpp = calcularDPP(dumDate);
        }
        
        if (g.igUltrassomSemanas !== null && g.igUltrassomDias !== null && g.dataUltrassom) {
          // Parsear YYYY-MM-DD como data local
          const [year, month, day] = g.dataUltrassom.split('-').map(Number);
          const dataUS = new Date(year, month - 1, day);
          const igUltrassomDias = (g.igUltrassomSemanas * 7) + g.igUltrassomDias;
          igUS = calcularIdadeGestacionalPorUS(igUltrassomDias, dataUS);
          dppUS = calcularDppUS(igUltrassomDias, dataUS);
        }
        
        if (g.dataNascimento) {
          const [year, month, day] = g.dataNascimento.split('-').map(Number);
          idade = calcularIdade(new Date(year, month - 1, day));
        }
        
        return {
          ...g,
          calculado: {
            igDUM,
            igUS,
            dpp,
            dppUS,
            idade
          }
        };
      }),
    
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        dataNascimento: z.string().optional(),
        planoSaudeId: z.number().optional(),
        carteirinhaUnimed: z.string().optional(),
        medicoId: z.number().optional(),
        tipoPartoDesejado: z.enum(["cesariana", "normal", "a_definir"]).optional(),
        gesta: z.number().optional(),
        para: z.number().optional(),
        partosNormais: z.number().optional(),
        cesareas: z.number().optional(),
        abortos: z.number().optional(),
        dum: z.string().optional(),
        igUltrassomSemanas: z.number().optional(),
        igUltrassomDias: z.number().optional(),
        dataUltrassom: z.string().optional(),
        dataPartoProgramado: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const data: any = {
          userId: ctx.user.id,
          nome: input.nome,
          telefone: input.telefone || null,
          email: input.email || null,
          dataNascimento: input.dataNascimento ? parseLocalDate(input.dataNascimento) : null,
          planoSaudeId: input.planoSaudeId || null,
          carteirinhaUnimed: input.carteirinhaUnimed || null,
          medicoId: input.medicoId || null,
          tipoPartoDesejado: input.tipoPartoDesejado || "a_definir",
          gesta: input.gesta || null,
          para: input.para || null,
          partosNormais: input.partosNormais || null,
          cesareas: input.cesareas || null,
          abortos: input.abortos || null,
          dum: input.dum ? parseLocalDate(input.dum) : null,
          igUltrassomSemanas: input.igUltrassomSemanas || null,
          igUltrassomDias: input.igUltrassomDias || null,
          dataUltrassom: input.dataUltrassom ? parseLocalDate(input.dataUltrassom) : null,
          dataPartoProgramado: input.dataPartoProgramado ? parseLocalDate(input.dataPartoProgramado) : null,
        };
        
        return createGestante(data);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        dataNascimento: z.string().optional(),
        planoSaudeId: z.number().optional(),
        carteirinhaUnimed: z.string().optional(),
        medicoId: z.number().optional(),
        tipoPartoDesejado: z.enum(["cesariana", "normal", "a_definir"]).optional(),
        altura: z.number().optional(),
        pesoInicial: z.number().optional(),
        gesta: z.number().optional(),
        para: z.number().optional(),
        partosNormais: z.number().optional(),
        cesareas: z.number().optional(),
        abortos: z.number().optional(),
        dum: z.string().optional(),
        igUltrassomSemanas: z.number().optional(),
        igUltrassomDias: z.number().optional(),
        dataUltrassom: z.string().optional(),
        dataPartoProgramado: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        
        if (data.dataNascimento) data.dataNascimento = parseLocalDate(data.dataNascimento);
        if (data.dum) data.dum = parseLocalDate(data.dum);
        if (data.dataUltrassom) data.dataUltrassom = parseLocalDate(data.dataUltrassom);
        if (data.dataPartoProgramado) data.dataPartoProgramado = parseLocalDate(data.dataPartoProgramado);
        
        await updateGestante(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGestante(input.id);
        return { success: true };
      }),
  }),

  consultasPrenatal: router({
    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getConsultasByGestanteId(input.gestanteId)),
    
    create: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        dataConsulta: z.string(),
        igSemanas: z.number().optional(),
        igDias: z.number().optional(),
        peso: z.number().optional(),
        pressaoArterial: z.string().optional(),
        alturaUterina: z.number().optional(),
        bcf: z.number().optional(),
        mf: z.number().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const data: any = {
          ...input,
          dataConsulta: parseLocalDate(input.dataConsulta),
        };
        return createConsultaPrenatal(data);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        dataConsulta: z.string().optional(),
        igSemanas: z.number().optional(),
        igDias: z.number().optional(),
        peso: z.number().optional(),
        pressaoArterial: z.string().optional(),
        alturaUterina: z.number().optional(),
        bcf: z.number().optional(),
        mf: z.number().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        if (data.dataConsulta) data.dataConsulta = parseLocalDate(data.dataConsulta);
        return updateConsulta(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteConsulta(input.id)),
  }),

  exames: router({
    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getExamesByGestanteId(input.gestanteId)),
    
    create: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipoExame: z.string(),
        dataExame: z.string(),
        igSemanas: z.number().optional(),
        igDias: z.number().optional(),
        resultado: z.string().optional(),
        observacoes: z.string().optional(),
        arquivoUrl: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const data: any = {
          ...input,
          dataExame: parseLocalDate(input.dataExame),
        };
        return createExameLaboratorial(data);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tipoExame: z.string().optional(),
        dataExame: z.string().optional(),
        igSemanas: z.number().optional(),
        igDias: z.number().optional(),
        resultado: z.string().optional(),
        observacoes: z.string().optional(),
        arquivoUrl: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        if (data.dataExame) data.dataExame = parseLocalDate(data.dataExame);
        return updateExame(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteExame(input.id)),
  }),

  parametros: router({
    list: protectedProcedure
      .input(z.object({ exameId: z.number() }))
      .query(({ input }) => getParametrosByExameId(input.exameId)),
    
    create: protectedProcedure
      .input(z.object({
        exameId: z.number(),
        nomeParametro: z.string(),
        valor: z.string().optional(),
        unidade: z.string().optional(),
        valorReferencia: z.string().optional(),
        status: z.enum(["normal", "alterado", "critico"]).optional(),
      }))
      .mutation(({ input }) => createParametroExame(input)),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeParametro: z.string().optional(),
        valor: z.string().optional(),
        unidade: z.string().optional(),
        valorReferencia: z.string().optional(),
        status: z.enum(["normal", "alterado", "critico"]).optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateParametro(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteParametro(input.id)),
  }),

  pedidos: router({
    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getPedidosByGestanteId(input.gestanteId)),
    
    create: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        medicoId: z.number(),
        tipoExame: z.string(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const data: any = {
          ...input,
          dataInicio: input.dataInicio ? parseLocalDate(input.dataInicio) : null,
          dataFim: input.dataFim ? parseLocalDate(input.dataFim) : null,
        };
        return createPedidoExame(data);
      }),
  }),

  alertas: router({
    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getAlertasByGestanteId(input.gestanteId)),
    
    create: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipoAlerta: z.string(),
        emailDestinatario: z.string().optional(),
        status: z.enum(["enviado", "erro"]).optional(),
      }))
      .mutation(({ input }) => createAlertaEnviado(input)),
  }),

  estatisticas: router({
    tiposPartosDesejados: protectedProcedure
      .query(async ({ ctx }) => {
        const gestantes = await getGestantesByUserId(ctx.user.id);
        
        const contagem = {
          cesariana: 0,
          normal: 0,
          a_definir: 0,
        };

        gestantes.forEach((g) => {
          if (g.tipoPartoDesejado === "cesariana") contagem.cesariana++;
          else if (g.tipoPartoDesejado === "normal") contagem.normal++;
          else contagem.a_definir++;
        });

        return contagem;
      }),

    convenios: protectedProcedure
      .query(async ({ ctx }) => {
        const gestantes = await getGestantesByUserId(ctx.user.id);
        const planos = await listarTodosPlanos();
        
        const contagem: Record<string, number> = {};
        
        gestantes.forEach((g) => {
          if (g.planoSaudeId) {
            const plano = planos.find(p => p.id === g.planoSaudeId);
            const nomePlano = plano?.nome || "Sem plano";
            contagem[nomePlano] = (contagem[nomePlano] || 0) + 1;
          } else {
            contagem["Sem plano"] = (contagem["Sem plano"] || 0) + 1;
          }
        });

        return contagem;
      }),
  }),

  agendamentos: router({
    calcular: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        dum: z.string(),
        dataPrimeiraConsulta: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Converter strings YYYY-MM-DD para Date sem problemas de fuso horário
        const [dumYear, dumMonth, dumDay] = input.dum.split('-').map(Number);
        const dum = new Date(dumYear, dumMonth - 1, dumDay, 12, 0, 0);
        
        const [dataYear, dataMonth, dataDay] = input.dataPrimeiraConsulta.split('-').map(Number);
        const dataPrimeira = new Date(dataYear, dataMonth - 1, dataDay, 12, 0, 0);
        
        const consultas = calcularConsultasSugeridas(dum, dataPrimeira);
        await salvarAgendamentos(input.gestanteId, consultas);
        return { success: true, consultas };
      }),

    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => buscarAgendamentos(input.gestanteId)),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["agendado", "realizado", "cancelado", "remarcado"]),
      }))
      .mutation(async ({ input }) => {
        await atualizarStatusAgendamento(input.id, input.status);
        return { success: true };
      }),

    remarcar: protectedProcedure
      .input(z.object({
        id: z.number(),
        novaData: z.string(),
      }))
      .mutation(async ({ input }) => {
        await remarcarAgendamento(input.id, new Date(input.novaData));
        return { success: true };
      }),
  }),

  email: router({
    configurar: protectedProcedure
      .input(z.object({
        emailUser: z.string().email(),
        emailPass: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        // Inserir ou atualizar EMAIL_USER
        const existingUser = await db.select().from(configuracoesEmail).where(eq(configuracoesEmail.chave, 'EMAIL_USER'));
        if (existingUser.length > 0) {
          await db.update(configuracoesEmail)
            .set({ valor: input.emailUser, updatedAt: new Date() })
            .where(eq(configuracoesEmail.chave, 'EMAIL_USER'));
        } else {
          await db.insert(configuracoesEmail).values({
            chave: 'EMAIL_USER',
            valor: input.emailUser,
            descricao: 'E-mail do Gmail para envio de lembretes',
          });
        }
        
        // Inserir ou atualizar EMAIL_PASS
        const existingPass = await db.select().from(configuracoesEmail).where(eq(configuracoesEmail.chave, 'EMAIL_PASS'));
        if (existingPass.length > 0) {
          await db.update(configuracoesEmail)
            .set({ valor: input.emailPass, updatedAt: new Date() })
            .where(eq(configuracoesEmail.chave, 'EMAIL_PASS'));
        } else {
          await db.insert(configuracoesEmail).values({
            chave: 'EMAIL_PASS',
            valor: input.emailPass,
            descricao: 'Senha de App do Gmail',
          });
        }
        
        return { success: true };
      }),
    
    obterConfig: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return { emailUser: null };
        
        const configs = await db.select().from(configuracoesEmail).where(eq(configuracoesEmail.chave, 'EMAIL_USER'));
        return { emailUser: configs.length > 0 ? configs[0].valor : null };
      }),
    
    processarLembretes: protectedProcedure
      .mutation(async () => {
        const resultado = await processarLembretes();
        return resultado;
      }),
    
    logs: protectedProcedure
      .input(z.object({
        gestanteId: z.number().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        let query = db.select().from(logsEmails);
        if (input.gestanteId) {
          query = query.where(eq(logsEmails.gestanteId, input.gestanteId)) as any;
        }
        
        const logs = await query.limit(input.limit).orderBy(desc(logsEmails.dataEnvio));
        return logs;
      }),
  }),

  examesLab: router({
    salvar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        resultados: z.record(z.string(), z.union([z.record(z.string(), z.string()), z.string()])),
        datas: z.record(z.string(), z.union([z.record(z.string(), z.string()), z.string()])).optional(), // Datas por trimestre ou data única
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        // Primeiro, deletar todos os resultados existentes desta gestante
        await db.delete(resultadosExames).where(eq(resultadosExames.gestanteId, input.gestanteId));
        
        // Preparar array de resultados para inserir
        const resultadosParaInserir: InsertResultadoExame[] = [];
        
        for (const [nomeExame, valor] of Object.entries(input.resultados)) {
          const datasExame = input.datas?.[nomeExame];
          
          if (nomeExame === 'outros_observacoes') {
            // Campo de texto livre - salvar como trimestre 0
            if (typeof valor === 'string' && valor.trim()) {
              const dataExame = typeof datasExame === 'string' ? new Date(datasExame) : null;
              resultadosParaInserir.push({
                gestanteId: input.gestanteId,
                nomeExame,
                trimestre: 0,
                resultado: valor,
                dataExame,
              });
            }
          } else if (typeof valor === 'object' && valor !== null) {
            // Exame com trimestres
            for (const [trimestre, resultado] of Object.entries(valor)) {
              if (resultado && resultado.trim()) {
                // Buscar data específica do trimestre ou data única
                let dataExame: Date | null = null;
                if (datasExame) {
                  if (typeof datasExame === 'object' && datasExame[`data${trimestre}`]) {
                    dataExame = new Date(datasExame[`data${trimestre}`]);
                  } else if (typeof datasExame === 'string') {
                    dataExame = new Date(datasExame);
                  }
                }
                
                resultadosParaInserir.push({
                  gestanteId: input.gestanteId,
                  nomeExame,
                  trimestre: parseInt(trimestre),
                  resultado,
                  dataExame,
                });
              }
            }
          }
        }
        
        // Inserir todos os resultados de uma vez
        if (resultadosParaInserir.length > 0) {
          await db.insert(resultadosExames).values(resultadosParaInserir);
        }
        
        return { success: true, count: resultadosParaInserir.length };
      }),

    interpretarComIA: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        mimeType: z.string(),
        trimestre: z.enum(["primeiro", "segundo", "terceiro"]),
      }))
      .mutation(async ({ input }) => {
        try {
          // Converter base64 para Buffer
          const fileBuffer = Buffer.from(input.fileBase64, 'base64');
          
          // Chamar função de interpretação
          const { resultados, dataColeta } = await interpretarExamesComIA(
            fileBuffer,
            input.mimeType,
            input.trimestre
          );
          
          return { success: true, resultados, dataColeta };
        } catch (error) {
          console.error('Erro ao interpretar exames:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: error instanceof Error ? error.message : 'Erro ao interpretar exames' 
          });
        }
      }),

    buscar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return {};
        
        const resultados = await db.select()
          .from(resultadosExames)
          .where(eq(resultadosExames.gestanteId, input.gestanteId));
        
        // Converter array de resultados em objeto estruturado
        const resultadosEstruturados: Record<string, Record<string, string> | string> = {};
        
        for (const resultado of resultados) {
          if (resultado.nomeExame === 'outros_observacoes') {
            resultadosEstruturados[resultado.nomeExame] = resultado.resultado || '';
          } else {
            if (!resultadosEstruturados[resultado.nomeExame]) {
              resultadosEstruturados[resultado.nomeExame] = {};
            }
            // Adicionar resultado do trimestre
            (resultadosEstruturados[resultado.nomeExame] as Record<string, string>)[resultado.trimestre.toString()] = resultado.resultado || '';
            
            // Adicionar data do trimestre se existir
            if (resultado.dataExame) {
              const dataFormatada = new Date(resultado.dataExame).toISOString().split('T')[0];
              (resultadosEstruturados[resultado.nomeExame] as Record<string, string>)[`data${resultado.trimestre}`] = dataFormatada;
            }
          }
        }
        
        return resultadosEstruturados;
      }),
  }),

  ultrassons: router({
    salvar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipoUltrassom: z.enum([
          "primeiro_ultrassom",
          "morfologico_1tri",
          "ultrassom_obstetrico",
          "morfologico_2tri",
          "ecocardiograma_fetal",
          "ultrassom_seguimento"
        ]),
        dataExame: z.string().optional(),
        idadeGestacional: z.string().optional(),
        dados: z.any(),
      }))
      .mutation(async ({ input }) => {
        const { salvarUltrassom } = await import('./ultrassons');
        const id = await salvarUltrassom(input);
        return { success: true, id };
      }),

    buscar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .query(async ({ input }) => {
        const { buscarUltrassons } = await import('./ultrassons');
        return await buscarUltrassons(input.gestanteId);
      }),

    buscarPorTipo: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipoUltrassom: z.string(),
      }))
      .query(async ({ input }) => {
        const { buscarUltrassomPorTipo } = await import('./ultrassons');
        return await buscarUltrassomPorTipo(input.gestanteId, input.tipoUltrassom);
      }),

    deletar: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { deletarUltrassom } = await import('./ultrassons');
        await deletarUltrassom(input.id);
        return { success: true };
      }),

    interpretar: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
        tipoUltrassom: z.enum([
          "primeiro_ultrassom",
          "morfologico_1tri",
          "ultrassom_obstetrico",
          "morfologico_2tri",
          "ecocardiograma",
          "ultrassom_seguimento"
        ]),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { interpretarLaudoUltrassom } = await import('./interpretarUltrassom');
        const dados = await interpretarLaudoUltrassom(input.fileUrl, input.tipoUltrassom, input.mimeType);
        return { success: true, dados };
      }),
  }),

  // Geração de PDF do Cartão Pré-natal
  pdf: router({
    gerarCartaoPrenatal: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { gerarPdfCartaoPrenatal } = await import('./gerarPdfCartao');
        const { getGestanteById, getConsultasByGestanteId, getExamesByGestanteId } = await import('./db');
        const { buscarUltrassons } = await import('./ultrassons');
        const { calcularMarcosImportantes } = await import('./marcos');
        
        // Buscar dados da gestante
        const gestante = await getGestanteById(input.gestanteId);
        if (!gestante) {
          throw new Error('Gestante não encontrada');
        }

        // Buscar consultas
        const consultas = await getConsultasByGestanteId(input.gestanteId);

        // Buscar ultrassons
        const ultrassons = await buscarUltrassons(input.gestanteId);

        // Buscar exames
        const exames = await getExamesByGestanteId(input.gestanteId);

        // Calcular marcos importantes
        let marcos: any[] = [];
        if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
          const igFormatado = `${gestante.igUltrassomSemanas}s${gestante.igUltrassomDias || 0}d`;
          marcos = calcularMarcosImportantes(gestante.dataUltrassom, igFormatado);
        }

        // Calcular idade
        let idade: number | null = null;
        if (gestante.dataNascimento) {
          const nascimento = new Date(gestante.dataNascimento);
          const hoje = new Date();
          idade = hoje.getFullYear() - nascimento.getFullYear();
          const m = hoje.getMonth() - nascimento.getMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
          }
        }

        // Calcular DPP pela DUM (280 dias)
        let dppDUM: string | null = null;
        if (gestante.dum) {
          const dum = new Date(gestante.dum);
          const dpp = new Date(dum);
          dpp.setDate(dpp.getDate() + 280);
          dppDUM = dpp.toLocaleDateString('pt-BR');
        }

        // Calcular DPP pelo US
        let dppUS: string | null = null;
        if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
          const dataUS = new Date(gestante.dataUltrassom);
          const semanas = gestante.igUltrassomSemanas;
          const dias = gestante.igUltrassomDias || 0;
          const totalDiasIG = semanas * 7 + dias;
          const dpp = new Date(dataUS);
          dpp.setDate(dpp.getDate() + (280 - totalDiasIG));
          dppUS = dpp.toLocaleDateString('pt-BR');
        }

        // Preparar dados para o PDF
        const dadosPDF = {
          gestante: {
            nome: gestante.nome,
            idade,
            dum: gestante.dum,
            dppDUM,
            dppUS,
            gesta: gestante.gesta,
            para: gestante.para,
            abortos: gestante.abortos,
            partosNormais: gestante.partosNormais,
            cesareas: gestante.cesareas,
          },
          consultas: consultas.map((c: any) => ({
            dataConsulta: new Date(c.dataConsulta).toLocaleDateString('pt-BR'),
            igDUM: c.igDUM || '-',
            igUS: c.igUS || null,
            peso: c.peso,
            pa: c.pa,
            bcf: c.bcf,
            mf: c.mf,
            observacoes: c.observacoes,
          })),
          marcos: marcos.map((m: any) => ({
            titulo: m.titulo,
            data: m.data,
            periodo: m.periodo,
          })),
          ultrassons: ultrassons.map((u: any) => ({
            data: new Date(u.data).toLocaleDateString('pt-BR'),
            ig: u.igUS || u.igDUM || '-',
            tipo: u.tipoUltrassom || '-',
            observacoes: u.observacoes || null,
          })),
          exames: exames.flatMap((e: any) => {
            const resultado = typeof e.resultado === 'string' ? JSON.parse(e.resultado) : e.resultado;
            return Object.entries(resultado).map(([nome, valor]: [string, any]) => ({
              tipo: nome,
              data: new Date(e.data).toLocaleDateString('pt-BR'),
              resultado: typeof valor === 'object' ? (valor?.resultado || '-') : (valor || '-'),
              trimestre: e.trimestre || 1,
            }));
          }),
        };

        // Gerar PDF
        const pdfBuffer = await gerarPdfCartaoPrenatal(dadosPDF);
        
        // Retornar PDF como base64
        return {
          success: true,
          pdf: pdfBuffer.toString('base64'),
          filename: `cartao-prenatal-${gestante.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        };
      }),
  }),

  // Router de mensagens WhatsApp via Helena
  whatsapp: router({
    // Enviar mensagem de lembrete de vacina
    enviarLembrete: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        templateId: z.enum([
          'hepatite_b',
          'dtpa',
          'influenza',
          'covid19',
          'lembrete_consulta',
          'lembrete_exame'
        ]),
        // Parâmetros opcionais para templates personalizados
        dataConsulta: z.string().optional(),
        horario: z.string().optional(),
        tipoExame: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });

        // Buscar gestante
        const gestante = await getGestanteById(input.gestanteId);
        if (!gestante) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gestante não encontrada',
          });
        }

        // Verificar se tem telefone
        if (!gestante.telefone) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Gestante não possui telefone cadastrado',
          });
        }

        // Gerar mensagem baseada no template
        const template = TEMPLATES_VACINAS[input.templateId as TemplateVacina];
        let mensagem: string;

        if (input.templateId === 'lembrete_consulta' && input.dataConsulta && input.horario) {
          mensagem = (template.mensagem as (nome: string, data: string, horario: string) => string)(gestante.nome, input.dataConsulta, input.horario);
        } else if (input.templateId === 'lembrete_exame' && input.tipoExame) {
          mensagem = (template.mensagem as (nome: string, tipo: string) => string)(gestante.nome, input.tipoExame);
        } else {
          mensagem = (template.mensagem as (nome: string) => string)(gestante.nome);
        }

        try {
          // Enviar mensagem via Helena
          const response = await sendWhatsAppMessage({
            to: gestante.telefone,
            message: mensagem,
          });

          // Salvar no banco de dados
          const novaMensagem: InsertMensagemWhatsapp = {
            gestanteId: input.gestanteId,
            telefone: gestante.telefone,
            tipoMensagem: input.templateId,
            templateUsado: template.nome,
            mensagem,
            helenaMessageId: response.id,
            helenaSessionId: response.sessionId,
            status: 'processando',
            enviadoPor: ctx.user!.id,
          };

          await db.insert(mensagensWhatsapp).values(novaMensagem);

          return {
            success: true,
            messageId: response.id,
            sessionId: response.sessionId,
            message: 'Mensagem enviada com sucesso!',
          };
        } catch (error) {
          // Salvar erro no banco
          const mensagemErro: InsertMensagemWhatsapp = {
            gestanteId: input.gestanteId,
            telefone: gestante.telefone,
            tipoMensagem: input.templateId,
            templateUsado: template.nome,
            mensagem,
            status: 'erro',
            mensagemErro: error instanceof Error ? error.message : 'Erro desconhecido',
            enviadoPor: ctx.user!.id,
          };

          await db.insert(mensagensWhatsapp).values(mensagemErro);

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
          });
        }
      }),

    // Listar histórico de mensagens de uma gestante
    listarMensagens: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const mensagens = await db
          .select()
          .from(mensagensWhatsapp)
          .where(eq(mensagensWhatsapp.gestanteId, input.gestanteId))
          .orderBy(desc(mensagensWhatsapp.dataEnvio));

        return mensagens;
      }),

    // Obter templates disponíveis
    listarTemplates: protectedProcedure
      .query(() => {
        return Object.entries(TEMPLATES_VACINAS).map(([id, template]) => ({
          id,
          nome: template.nome,
        }));
      }),
  }),
});
export type AppRouter = typeof appRouter;
