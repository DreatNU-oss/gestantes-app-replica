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

// Função auxiliar para converter string de data (YYYY-MM-DD) para Date
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
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
        let idade = null;
        
        if (g.dum) {
          const dumDate = new Date(g.dum);
          igDUM = calcularIdadeGestacionalPorDUM(dumDate);
          dpp = calcularDPP(dumDate);
        }
        
        if (g.igUltrassomSemanas !== null && g.igUltrassomDias !== null && g.dataUltrassom) {
          const dataUS = new Date(g.dataUltrassom);
          const igUltrassomDias = (g.igUltrassomSemanas * 7) + g.igUltrassomDias;
          igUS = calcularIdadeGestacionalPorUS(igUltrassomDias, dataUS);
        }
        
        if (g.dataNascimento) {
          idade = calcularIdade(new Date(g.dataNascimento));
        }
        
        return {
          ...g,
          calculado: {
            igDUM,
            igUS,
            dpp,
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
        let idade = null;
        
        if (g.dum) {
          const dumDate = new Date(g.dum);
          igDUM = calcularIdadeGestacionalPorDUM(dumDate);
          dpp = calcularDPP(dumDate);
        }
        
        if (g.igUltrassomSemanas !== null && g.igUltrassomDias !== null && g.dataUltrassom) {
          const dataUS = new Date(g.dataUltrassom);
          const igUltrassomDias = (g.igUltrassomSemanas * 7) + g.igUltrassomDias;
          igUS = calcularIdadeGestacionalPorUS(igUltrassomDias, dataUS);
        }
        
        if (g.dataNascimento) {
          idade = calcularIdade(new Date(g.dataNascimento));
        }
        
        return {
          ...g,
          calculado: {
            igDUM,
            igUS,
            dpp,
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
});
export type AppRouter = typeof appRouter;
