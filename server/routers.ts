import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { gerarPDFCartaoPrenatal } from "./pdf";
import { gestanteRouter } from "./gestante-router";
import { z } from "zod";
import type { GestanteComCalculos } from "../drizzle/schema";
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
  getAlertasByGestanteId,
  getCondutasPersonalizadas,
  createCondutaPersonalizada,
  updateCondutaPersonalizada,
  deleteCondutaPersonalizada,
  getFatoresRiscoByGestanteId,
  createFatorRisco,
  updateFatorRisco,
  deleteFatorRisco,
  hasAltoRisco,
  getMedicamentosByGestanteId,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento,
  getGestantesSemConsultaRecente,
  createJustificativa,
  getJustificativaByGestanteId,
  deleteJustificativa
} from "./db";
import { calcularConsultasSugeridas, salvarAgendamentos, buscarAgendamentos, atualizarStatusAgendamento, remarcarAgendamento } from './agendamento';

import { processarLembretes } from './lembretes';
import { configuracoesEmail, logsEmails, resultadosExames, historicoInterpretacoes, feedbackInterpretacoes, gestantes, type InsertResultadoExame, type InsertHistoricoInterpretacao, type InsertFeedbackInterpretacao } from '../drizzle/schema';
import { eq, desc, and, sql, isNotNull } from 'drizzle-orm';
import { interpretarExamesComIA } from './interpretarExames';
import { registrarParto, listarPartosRealizados, buscarPartoPorId, deletarParto } from './partosRealizados';
import { getDb } from './db';
import { TRPCError } from '@trpc/server';

// Função auxiliar para converter string de data (YYYY-MM-DD) para Date sem problemas de fuso horário
// Retorna a string diretamente para o MySQL interpretar como DATE local
function parseLocalDate(dateString: string): string {
  return dateString; // MySQL interpreta YYYY-MM-DD como data local, sem conversão UTC
}

// Funções auxiliares para cálculos obstétricos
function calcularIdadeGestacionalPorDUM(dum: Date | string): { semanas: number; dias: number; totalDias: number } {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const hoje = new Date();
  const diffMs = hoje.getTime() - dumDate.getTime();
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

function calcularDPP(dum: Date | string): Date {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const dpp = new Date(dumDate);
  dpp.setDate(dpp.getDate() + 280); // 40 semanas = 280 dias
  return dpp;
}

function calcularDppUS(igUltrassomDias: number, dataUltrassom: Date): Date {
  const diasRestantes = 280 - igUltrassomDias;
  const dpp = new Date(dataUltrassom);
  dpp.setDate(dpp.getDate() + diasRestantes);
  return dpp;
}

function calcularDataParaSemana(dum: Date | string, semanasAlvo: number): Date {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const dataAlvo = new Date(dumDate);
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

// Função auxiliar para calcular idade a partir de string de data (para validação Zod)
function calculateAgeFromDate(dateString: string): number | null {
  try {
    const birth = new Date(dateString);
    const today = new Date();
    
    if (isNaN(birth.getTime())) return null;
    if (birth > today) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
}

export const appRouter = router({
  system: systemRouter,
  gestante: gestanteRouter,
  
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
    list: protectedProcedure
      .input(z.object({ 
        searchTerm: z.string().optional(),
        sortBy: z.enum(['nome', 'ig_asc', 'ig_desc']).optional().default('ig_desc')
      }).optional())
      .query(async ({ ctx, input }): Promise<GestanteComCalculos[]> => {
      const lista = await getGestantesByUserId(ctx.user.id, input?.searchTerm);
      
      // Adicionar cálculos para cada gestante
      const gestantesComCalculo = lista.map(g => {
        let igDUM = null;
        let igUS = null;
        let dpp = null;
        let dppUS = null;
        let idade = null;
        
        if (g.dum && g.dum !== "Incerta" && g.dum !== "Incompatível com US") {
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
      
      // Ordenar conforme parâmetro
      const sortBy = input?.sortBy ?? 'ig_desc';
      
      return gestantesComCalculo.sort((a, b) => {
        if (sortBy === 'nome') {
          // Ordenação alfabética por nome
          return a.nome.localeCompare(b.nome);
        } else {
          // Ordenação por Idade Gestacional (priorizar US, depois DUM)
          const igA = a.calculado.igUS?.totalDias ?? a.calculado.igDUM?.totalDias ?? 0;
          const igB = b.calculado.igUS?.totalDias ?? b.calculado.igDUM?.totalDias ?? 0;
          
          if (sortBy === 'ig_asc') {
            return igA - igB; // Crescente (menor IG primeiro)
          } else {
            return igB - igA; // Decrescente (maior IG primeiro)
          }
        }
      });
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }): Promise<GestanteComCalculos | null> => {
        const g = await getGestanteById(input.id);
        if (!g) return null;
        
        let igDUM = null;
        let igUS = null;
        let dpp = null;
        let dppUS = null;
        let idade = null;
        
        if (g.dum && g.dum !== "Incerta" && g.dum !== "Incompatível com US") {
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
        telefone: z.string().optional().refine(
          (val) => {
            if (!val) return true; // Telefone é opcional
            const digits = val.replace(/\D/g, "");
            // Deve ter 10 (fixo) ou 11 (celular) dígitos
            if (digits.length !== 10 && digits.length !== 11) return false;
            // DDD deve estar entre 11 e 99
            const ddd = parseInt(digits.substring(0, 2));
            if (ddd < 11 || ddd > 99) return false;
            // Se for celular (11 dígitos), o primeiro dígito após o DDD deve ser 9
            if (digits.length === 11 && digits[2] !== "9") return false;
            return true;
          },
          { message: "Telefone inválido. Use o formato (11) 98765-4321 ou (11) 3456-7890" }
        ),
        email: z.string().email({ message: "E-mail inválido" }).optional().or(z.literal("")),
        dataNascimento: z.string().optional().refine(
          (date) => {
            if (!date) return true; // Opcional
            const age = calculateAgeFromDate(date);
            return age !== null && age >= 10 && age <= 60;
          },
          { message: "Idade deve estar entre 10 e 60 anos" }
        ),
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
        altura: z.number().optional(),
        pesoInicial: z.number().optional(),
        observacoes: z.string().optional(),
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
          altura: input.altura || null,
          pesoInicial: input.pesoInicial || null,
          observacoes: input.observacoes || null,
        };
        
        const novaGestante = await createGestante(data);
        
        // Retornar dados da gestante para permitir seleção automática
        return { 
          success: true,
          id: novaGestante.id,
          nome: novaGestante.nome
        };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        telefone: z.string().optional().refine(
          (val) => {
            if (!val) return true; // Telefone é opcional
            const digits = val.replace(/\D/g, "");
            // Deve ter 10 (fixo) ou 11 (celular) dígitos
            if (digits.length !== 10 && digits.length !== 11) return false;
            // DDD deve estar entre 11 e 99
            const ddd = parseInt(digits.substring(0, 2));
            if (ddd < 11 || ddd > 99) return false;
            // Se for celular (11 dígitos), o primeiro dígito após o DDD deve ser 9
            if (digits.length === 11 && digits[2] !== "9") return false;
            return true;
          },
          { message: "Telefone inválido. Use o formato (11) 98765-4321 ou (11) 3456-7890" }
        ),
        email: z.string().email({ message: "E-mail inválido" }).optional().or(z.literal("")),
        dataNascimento: z.string().optional().refine(
          (date) => {
            if (!date) return true; // Opcional
            const age = calculateAgeFromDate(date);
            return age !== null && age >= 10 && age <= 60;
          },
          { message: "Idade deve estar entre 10 e 60 anos" }
        ),
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
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        
        if (data.dataNascimento) data.dataNascimento = parseLocalDate(data.dataNascimento);
        if (data.dum) data.dum = parseLocalDate(data.dum);
        if (data.dataUltrassom) data.dataUltrassom = parseLocalDate(data.dataUltrassom);
        if (data.dataPartoProgramado) data.dataPartoProgramado = parseLocalDate(data.dataPartoProgramado);
        
        await updateGestante(id, data);
        
        // Retornar dados da gestante para permitir seleção automática
        const gestante = await getGestanteById(id);
        if (!gestante) {
          throw new Error('Gestante não encontrada após atualização');
        }
        return { 
          success: true,
          id: gestante.id,
          nome: gestante.nome
        };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGestante(input.id);
        return { success: true };
      }),
    
    // Fatores de Risco
    getFatoresRisco: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getFatoresRiscoByGestanteId(input.gestanteId)),
    
    addFatorRisco: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipo: z.enum([
          "alergia_medicamentos",
          "alteracoes_morfologicas_fetais",
          "diabetes_gestacional",
          "diabetes_tipo2",
          "dpoc_asma",
          "epilepsia",
          "fator_preditivo_dheg",
          "fator_rh_negativo",
          "gemelar",
          "hipotireoidismo",
          "hipertensao",
          "historico_familiar_dheg",
          "idade_avancada",
          "incompetencia_istmo_cervical",
          "mal_passado_obstetrico",
          "malformacoes_mullerianas",
          "sobrepeso_obesidade",
          "trombofilia",
          "outro"
        ]),
        descricao: z.string().optional(),
      }))
      .mutation(({ input }) => createFatorRisco(input)),
    
    updateFatorRisco: protectedProcedure
      .input(z.object({
        id: z.number(),
        descricao: z.string().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateFatorRisco(id, data);
      }),
    
    deleteFatorRisco: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteFatorRisco(input.id)),
    
    hasAltoRisco: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => hasAltoRisco(input.gestanteId)),
    
    // Alerta de gestantes sem consulta recente (limite dinâmico baseado na IG)
    semConsultaRecente: protectedProcedure
      .query(() => getGestantesSemConsultaRecente()),
    
    // Justificativas para exclusão do alerta de consulta atrasada
    criarJustificativa: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        motivo: z.enum([
          "ja_agendada",
          "consulta_apos_morfologico",
          "parto_proximo_ctg_doppler",
          "desistiu_prenatal",
          "abortamento",
          "mudou_cidade",
          "evoluiu_parto",
          "espaco_maior_consultas"
        ]),
        dataPrevistaConsulta: z.string().optional(), // Data prevista da consulta (formato YYYY-MM-DD)
        observacoes: z.string().optional()
      }))
      .mutation(({ input }) => {
        const data: any = { ...input };
        // Converter string para Date se fornecida
        if (data.dataPrevistaConsulta) {
          data.dataPrevistaConsulta = new Date(data.dataPrevistaConsulta + 'T00:00:00');
        }
        return createJustificativa(data);
      }),
    
    buscarJustificativa: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getJustificativaByGestanteId(input.gestanteId)),
    
    removerJustificativa: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .mutation(({ input }) => deleteJustificativa(input.gestanteId)),
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
        conduta: z.string().optional(),
        condutaComplementacao: z.string().optional(),
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
        conduta: z.string().optional(),
        condutaComplementacao: z.string().optional(),
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
    
    // Buscar histórico completo de e-mails com informações da gestante
    historico: protectedProcedure
      .input(z.object({
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        tipoLembrete: z.string().optional(),
        status: z.enum(['enviado', 'erro']).optional(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        
        if (input.dataInicio) {
          conditions.push(sql`${logsEmails.dataEnvio} >= ${new Date(input.dataInicio)}`);
        }
        if (input.dataFim) {
          conditions.push(sql`${logsEmails.dataEnvio} <= ${new Date(input.dataFim)}`);
        }
        if (input.tipoLembrete) {
          conditions.push(eq(logsEmails.tipoLembrete, input.tipoLembrete));
        }
        if (input.status) {
          conditions.push(eq(logsEmails.status, input.status));
        }
        
        const logs = await db
          .select({
            id: logsEmails.id,
            gestanteId: logsEmails.gestanteId,
            gestanteNome: gestantes.nome,
            tipoLembrete: logsEmails.tipoLembrete,
            emailDestinatario: logsEmails.emailDestinatario,
            assunto: logsEmails.assunto,
            status: logsEmails.status,
            mensagemErro: logsEmails.mensagemErro,
            dataEnvio: logsEmails.dataEnvio,
          })
          .from(logsEmails)
          .leftJoin(gestantes, eq(logsEmails.gestanteId, gestantes.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(logsEmails.dataEnvio))
          .limit(input.limit);
        
        return logs;
      }),
    
    // Estatísticas de envio de e-mails
    estatisticas: protectedProcedure
      .input(z.object({
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return {
          total: 0,
          enviados: 0,
          erros: 0,
          taxaSucesso: 0,
          porTipo: [],
        };
        
        const conditions = [];
        if (input.dataInicio) {
          conditions.push(sql`${logsEmails.dataEnvio} >= ${new Date(input.dataInicio)}`);
        }
        if (input.dataFim) {
          conditions.push(sql`${logsEmails.dataEnvio} <= ${new Date(input.dataFim)}`);
        }
        
        // Total geral
        const [totalResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(logsEmails)
          .where(conditions.length > 0 ? and(...conditions) : undefined);
        
        // Enviados com sucesso
        const [enviadosResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(logsEmails)
          .where(and(
            eq(logsEmails.status, 'enviado'),
            ...(conditions.length > 0 ? conditions : [])
          ));
        
        // Erros
        const [errosResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(logsEmails)
          .where(and(
            eq(logsEmails.status, 'erro'),
            ...(conditions.length > 0 ? conditions : [])
          ));
        
        // Por tipo de lembrete
        const porTipo = await db
          .select({
            tipo: logsEmails.tipoLembrete,
            total: sql<number>`count(*)`,
            enviados: sql<number>`sum(case when ${logsEmails.status} = 'enviado' then 1 else 0 end)`,
            erros: sql<number>`sum(case when ${logsEmails.status} = 'erro' then 1 else 0 end)`,
          })
          .from(logsEmails)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .groupBy(logsEmails.tipoLembrete);
        
        const total = Number(totalResult?.count || 0);
        const enviados = Number(enviadosResult?.count || 0);
        const erros = Number(errosResult?.count || 0);
        const taxaSucesso = total > 0 ? (enviados / total) * 100 : 0;
        
        return {
          total,
          enviados,
          erros,
          taxaSucesso: Math.round(taxaSucesso * 10) / 10,
          porTipo: porTipo.map(t => ({
            tipo: t.tipo,
            total: Number(t.total),
            enviados: Number(t.enviados),
            erros: Number(t.erros),
          })),
        };
      }),
    
    // Próximos lembretes programados
    proximosLembretes: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return [];
        
        // Buscar gestantes com e-mail e calcular próximos lembretes
        const gestantesComEmail = await db
          .select()
          .from(gestantes)
          .where(isNotNull(gestantes.email));
        
        const proximosLembretes: Array<{
          gestanteId: number;
          gestanteNome: string;
          tipoLembrete: string;
          descricao: string;
          igAtual: string;
          igAlvo: string;
          diasRestantes: number;
        }> = [];
        
        for (const gestante of gestantesComEmail) {
          // Calcular IG atual (prioriza US, depois DUM)
          let igAtual: { semanas: number; dias: number } | null = null;
          
          if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
            const dataUS = typeof gestante.dataUltrassom === 'string' 
              ? new Date(gestante.dataUltrassom) 
              : gestante.dataUltrassom;
            const hoje = new Date();
            const diffMs = hoje.getTime() - dataUS.getTime();
            const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diasTotaisUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0);
            const diasTotaisHoje = diasTotaisUS + diffDias;
            igAtual = {
              semanas: Math.floor(diasTotaisHoje / 7),
              dias: diasTotaisHoje % 7,
            };
          } else if (gestante.dum) {
            const dum = typeof gestante.dum === 'string' ? new Date(gestante.dum) : gestante.dum;
            const hoje = new Date();
            const diffMs = hoje.getTime() - dum.getTime();
            const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            igAtual = {
              semanas: Math.floor(diffDias / 7),
              dias: diffDias % 7,
            };
          }
          
          if (!igAtual) continue;
          
          const diasAtual = igAtual.semanas * 7 + igAtual.dias;
          
          // Verificar lembretes pendentes
          const lembretes = [
            { tipo: 'morfo1tri_1sem', igAlvo: 10 * 7, descricao: 'Morfológico 1º Trimestre' },
            { tipo: 'morfo2tri_2sem', igAlvo: 18 * 7, descricao: 'Morfológico 2º Trimestre (2 semanas antes)' },
            { tipo: 'morfo2tri_1sem', igAlvo: 19 * 7, descricao: 'Morfológico 2º Trimestre (1 semana antes)' },
            { tipo: 'dtpa', igAlvo: 27 * 7, descricao: 'Vacina dTpa' },
            { tipo: 'bronquiolite', igAlvo: 32 * 7, descricao: 'Vacina Bronquiolite' },
          ];
          
          for (const lembrete of lembretes) {
            // Verificar se já foi enviado
            const jaEnviou = await db
              .select()
              .from(logsEmails)
              .where(and(
                eq(logsEmails.gestanteId, gestante.id),
                eq(logsEmails.tipoLembrete, lembrete.tipo),
                eq(logsEmails.status, 'enviado')
              ))
              .limit(1);
            
            if (jaEnviou.length === 0 && diasAtual < lembrete.igAlvo) {
              const diasRestantes = lembrete.igAlvo - diasAtual;
              const igAlvoSemanas = Math.floor(lembrete.igAlvo / 7);
              const igAlvoDias = lembrete.igAlvo % 7;
              
              proximosLembretes.push({
                gestanteId: gestante.id,
                gestanteNome: gestante.nome,
                tipoLembrete: lembrete.tipo,
                descricao: lembrete.descricao,
                igAtual: `${igAtual.semanas}s ${igAtual.dias}d`,
                igAlvo: `${igAlvoSemanas}s ${igAlvoDias}d`,
                diasRestantes,
              });
            }
          }
        }
        
        // Ordenar por dias restantes (mais próximos primeiro)
        return proximosLembretes.sort((a, b) => a.diasRestantes - b.diasRestantes).slice(0, 20);
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
              // Adicionar T12:00:00 para evitar problema de timezone
              const dataExame = typeof datasExame === 'string' ? new Date(`${datasExame}T12:00:00`) : null;
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
            for (const [chave, resultado] of Object.entries(valor)) {
              // Verificar se a chave é um número de trimestre válido (1, 2 ou 3)
              // Ignorar chaves como "agente_1", "antibiograma_1", "obs_1" etc.
              const trimestreNum = parseInt(chave);
              if (isNaN(trimestreNum) || trimestreNum < 1 || trimestreNum > 3) {
                continue; // Pular chaves que não são trimestres válidos
              }
              
              // Validar que o resultado não seja vazio, "?", ou apenas espaços
              if (resultado && resultado.trim() && resultado.trim() !== '?') {
                // Buscar data específica do trimestre ou data única
                let dataExame: Date | null = null;
                if (datasExame) {
                  if (typeof datasExame === 'object' && datasExame[`data${chave}`]) {
                    // Adicionar T12:00:00 para evitar problema de timezone
                    const dataStr = datasExame[`data${chave}`];
                    dataExame = new Date(`${dataStr}T12:00:00`);
                  } else if (typeof datasExame === 'string') {
                    dataExame = new Date(`${datasExame}T12:00:00`);
                  }
                }
                
                resultadosParaInserir.push({
                  gestanteId: input.gestanteId,
                  nomeExame,
                  trimestre: trimestreNum,
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
        trimestre: z.enum(["primeiro", "segundo", "terceiro"]).optional(), // Agora opcional
        dumGestante: z.string().optional(), // DUM para calcular trimestre automaticamente
      }))
      .mutation(async ({ input }) => {
        try {
          // Converter base64 para Buffer
          const fileBuffer = Buffer.from(input.fileBase64, 'base64');
          
          // Chamar função de interpretação
          const { resultados, dataColeta, trimestreExtraido } = await interpretarExamesComIA(
            fileBuffer,
            input.mimeType,
            input.trimestre,
            input.dumGestante
          );
          
          return { success: true, resultados, dataColeta, trimestreExtraido };
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
              // Usar toLocaleDateString para evitar problema de timezone
              // Criar data com hora ao meio-dia para evitar mudança de dia
              const data = new Date(resultado.dataExame);
              // Ajustar para timezone local adicionando o offset
              const dataLocal = new Date(data.getTime() + data.getTimezoneOffset() * 60000);
              const ano = dataLocal.getFullYear();
              const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
              const dia = String(dataLocal.getDate()).padStart(2, '0');
              const dataFormatada = `${ano}-${mes}-${dia}`;
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
        const result = await salvarUltrassom(input);
        return result;
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
        const { gerarEUploadPdfCartao } = await import('./gerarPdfParaParto');
        const { getGestanteById } = await import('./db');
        
        // Buscar dados da gestante
        const gestante = await getGestanteById(input.gestanteId);
        if (!gestante) {
          throw new Error('Gestante não encontrada');
        }

        // Gerar PDF usando a mesma função dos partos realizados
        const { pdfUrl, pdfKey } = await gerarEUploadPdfCartao(input.gestanteId);
        
        // Baixar o PDF do S3 para retornar como base64
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);
        
        // Retornar PDF como base64
        return {
          success: true,
          pdf: pdfBuffer.toString('base64'),
          filename: `cartao-prenatal-${gestante.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        };
      }),
  }),

  // Condutas personalizadas
  condutas: router({
    list: protectedProcedure
      .query(() => getCondutasPersonalizadas()),
    
    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        ordem: z.number().optional(),
      }))
      .mutation(({ input }) => createCondutaPersonalizada(input)),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        ordem: z.number().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateCondutaPersonalizada(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCondutaPersonalizada(input.id)),
  }),

  // Histórico de interpretações de IA
  historicoInterpretacoes: router({
    salvar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipoInterpretacao: z.enum(['exames_laboratoriais', 'ultrassom']),
        tipoExame: z.string().optional(),
        arquivosProcessados: z.number().default(1),
        resultadoJson: z.any(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const result = await db.insert(historicoInterpretacoes).values({
          gestanteId: input.gestanteId,
          tipoInterpretacao: input.tipoInterpretacao,
          tipoExame: input.tipoExame,
          arquivosProcessados: input.arquivosProcessados,
          resultadoJson: input.resultadoJson,
        });
        return { success: true, id: result[0].insertId };
      }),

    listar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipoInterpretacao: z.enum(['exames_laboratoriais', 'ultrassom']).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const results = await db.select().from(historicoInterpretacoes)
          .where(eq(historicoInterpretacoes.gestanteId, input.gestanteId))
          .orderBy(desc(historicoInterpretacoes.dataInterpretacao));
        
        // Filtrar por tipo se especificado
        if (input.tipoInterpretacao) {
          return results.filter((r: any) => r.tipoInterpretacao === input.tipoInterpretacao);
        }
        
        return results;
      }),

    deletar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        await db.delete(historicoInterpretacoes).where(eq(historicoInterpretacoes.id, input.id));
        return { success: true };
      }),
  }),

  // Feedback de interpretações de IA
  feedback: router({
    criar: protectedProcedure
      .input(z.object({
        historicoInterpretacaoId: z.number(),
        gestanteId: z.number(),
        tipoInterpretacao: z.enum(['exames_laboratoriais', 'ultrassom']),
        avaliacao: z.number().min(1).max(5),
        precisaoData: z.enum(['correta', 'incorreta', 'nao_extraiu']).optional(),
        precisaoValores: z.enum(['todos_corretos', 'alguns_incorretos', 'maioria_incorreta']).optional(),
        comentario: z.string().optional(),
        camposIncorretos: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const result = await db.insert(feedbackInterpretacoes).values({
          historicoInterpretacaoId: input.historicoInterpretacaoId,
          gestanteId: input.gestanteId,
          userId: ctx.user.id,
          tipoInterpretacao: input.tipoInterpretacao,
          avaliacao: input.avaliacao,
          precisaoData: input.precisaoData,
          precisaoValores: input.precisaoValores,
          comentario: input.comentario,
          camposIncorretos: input.camposIncorretos ? JSON.stringify(input.camposIncorretos) : null,
        });
        
        return { success: true, id: result[0].insertId };
      }),

    buscarPorHistorico: protectedProcedure
      .input(z.object({ historicoInterpretacaoId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const results = await db.select().from(feedbackInterpretacoes)
          .where(eq(feedbackInterpretacoes.historicoInterpretacaoId, input.historicoInterpretacaoId));
        
        return results[0] || null;
      }),

    estatisticas: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const todos = await db.select().from(feedbackInterpretacoes);
        
        const total = todos.length;
        const mediaAvaliacao = total > 0 
          ? todos.reduce((acc: number, f: any) => acc + f.avaliacao, 0) / total 
          : 0;
        
        const porTipo = {
          exames_laboratoriais: todos.filter((f: any) => f.tipoInterpretacao === 'exames_laboratoriais'),
          ultrassom: todos.filter((f: any) => f.tipoInterpretacao === 'ultrassom'),
        };
        
        const precisaoData = {
          correta: todos.filter((f: any) => f.precisaoData === 'correta').length,
          incorreta: todos.filter((f: any) => f.precisaoData === 'incorreta').length,
          nao_extraiu: todos.filter((f: any) => f.precisaoData === 'nao_extraiu').length,
        };
        
        const precisaoValores = {
          todos_corretos: todos.filter((f: any) => f.precisaoValores === 'todos_corretos').length,
          alguns_incorretos: todos.filter((f: any) => f.precisaoValores === 'alguns_incorretos').length,
          maioria_incorreta: todos.filter((f: any) => f.precisaoValores === 'maioria_incorreta').length,
        };
        
        return {
          total,
          mediaAvaliacao: Math.round(mediaAvaliacao * 10) / 10,
          porTipo: {
            exames_laboratoriais: {
              total: porTipo.exames_laboratoriais.length,
              media: porTipo.exames_laboratoriais.length > 0
                ? Math.round(porTipo.exames_laboratoriais.reduce((acc: number, f: any) => acc + f.avaliacao, 0) / porTipo.exames_laboratoriais.length * 10) / 10
                : 0,
            },
            ultrassom: {
              total: porTipo.ultrassom.length,
              media: porTipo.ultrassom.length > 0
                ? Math.round(porTipo.ultrassom.reduce((acc: number, f: any) => acc + f.avaliacao, 0) / porTipo.ultrassom.length * 10) / 10
                : 0,
            },
          },
          precisaoData,
          precisaoValores,
        };
      }),

    listarTodos: protectedProcedure
      .input(z.object({
        limite: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const results = await db.select().from(feedbackInterpretacoes)
          .orderBy(desc(feedbackInterpretacoes.createdAt))
          .limit(input.limite);
        
        return results;
      }),
  }),

  // Router de Partos Realizados
  partos: router({
    registrar: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        dataParto: z.string(),
        tipoParto: z.enum(["normal", "cesarea"]),
        medicoId: z.number(),
        pdfUrl: z.string().optional(),
        pdfKey: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await registrarParto(input);
      }),

    listar: protectedProcedure
      .query(async () => {
        return await listarPartosRealizados();
      }),

    buscarPorId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await buscarPartoPorId(input.id);
      }),

    deletar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletarParto(input.id);
      }),
  }),

  // Router de Fatores de Risco
  fatoresRisco: router({
    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getFatoresRiscoByGestanteId(input.gestanteId)),
    
    add: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipo: z.enum([
          "alergia_medicamentos",
          "alteracoes_morfologicas_fetais",
          "diabetes_gestacional",
          "diabetes_tipo2",
          "dpoc_asma",
          "epilepsia",
          "fator_preditivo_dheg",
          "fator_rh_negativo",
          "gemelar",
          "hipotireoidismo",
          "hipertensao",
          "historico_familiar_dheg",
          "idade_avancada",
          "incompetencia_istmo_cervical",
          "mal_passado_obstetrico",
          "malformacoes_mullerianas",
          "sobrepeso_obesidade",
          "trombofilia",
          "outro"
        ]),
      }))
      .mutation(({ input }) => createFatorRisco(input)),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteFatorRisco(input.id)),
  }),

  // Router de Medicamentos na Gestação
  medicamentos: router({
    list: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getMedicamentosByGestanteId(input.gestanteId)),
    
    getMedicamentos: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => getMedicamentosByGestanteId(input.gestanteId)),
    
    addMedicamento: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        tipo: z.enum([
          "aas",
          "anti_hipertensivos",
          "calcio",
          "enoxaparina",
          "insulina",
          "levotiroxina",
          "medicamentos_inalatorios",
          "polivitaminicos",
          "progestagenos",
          "psicotropicos",
          "outros"
        ]),
        especificacao: z.string().optional(),
      }))
      .mutation(({ input }) => createMedicamento(input)),
    
    updateMedicamento: protectedProcedure
      .input(z.object({
        id: z.number(),
        especificacao: z.string().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateMedicamento(id, data);
      }),
    
    deleteMedicamento: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteMedicamento(input.id)),
  }),
});
export type AppRouter = typeof appRouter;
