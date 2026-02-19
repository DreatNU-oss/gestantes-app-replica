import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { gerarPDFCartaoPrenatal } from "./pdf";
import { checkPdfProtection, unlockPdf } from "./pdfUtils";
import { loginWithPassword, createPasswordResetToken, validateResetToken, setPassword, listAuthorizedEmails, addAuthorizedEmail, removeAuthorizedEmail, isEmailAuthorized, checkEmailStatus, createUserWithPassword, changePassword, unlockAccount } from "./passwordAuth";
import { sendPasswordResetEmail } from "./email-service";
import { sdk } from "./_core/sdk";
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
  deleteJustificativa,
  getOpcoesFatoresRisco,
  createOpcaoFatorRisco,
  updateOpcaoFatorRisco,
  deleteOpcaoFatorRisco,
  getOpcoesMedicamentos,
  createOpcaoMedicamento,
  updateOpcaoMedicamento,
  deleteOpcaoMedicamento,
  inicializarOpcoesPadrao,
  criarLembretesConduta,
  criarLembretesCondutaWizard,
  criarLembretesCondutaUrgencia,
  listarLembretesPendentes,
  resolverLembretes
} from "./db";
import { calcularConsultasSugeridas, salvarAgendamentos, buscarAgendamentos, atualizarStatusAgendamento, remarcarAgendamento } from './agendamento';

import { processarLembretes } from './lembretes';
import { configuracoesEmail, logsEmails, resultadosExames, historicoInterpretacoes, feedbackInterpretacoes, gestantes, arquivosExames, type InsertResultadoExame, type InsertHistoricoInterpretacao, type InsertFeedbackInterpretacao, type InsertArquivoExame } from '../drizzle/schema';
import { storagePut } from './storage';
import { eq, desc, and, sql, isNotNull } from 'drizzle-orm';
import { interpretarExamesComIA } from './interpretarExames';
import { registrarParto, listarPartosRealizados, buscarPartoPorId, deletarParto } from './partosRealizados';
import { getDb } from './db';
import { TRPCError } from '@trpc/server';
import { sincronizarCesareaComAdmin, sincronizarTodasCesareasComAdmin, mapearHospital } from './cesareanSync';

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
      return { success: true } as const;
    }),
    
    // Login com email e senha
    loginComSenha: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginWithPassword(input.email, input.senha);
        if (!result.success || !result.user) {
          return { 
            success: false, 
            error: result.error,
            locked: result.locked,
            minutesRemaining: result.minutesRemaining,
            attemptsRemaining: result.attemptsRemaining
          };
        }
        // Criar sessão usando oauthService
        const token = await sdk.signSession({ openId: result.user.openId, appId: process.env.VITE_APP_ID || '', name: result.user.name || '' });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role } };
      }),
    
    // Solicitar recuperação de senha
    solicitarRecuperacaoSenha: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // Verificar se email está autorizado
        const autorizado = await isEmailAuthorized(input.email);
        if (!autorizado) {
          return { success: false, error: 'Este email não está autorizado a acessar o sistema.' };
        }
        const token = await createPasswordResetToken(input.email);
        if (!token) {
          // Não revelar se email existe ou não
          return { success: true, message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' };
        }
        // Enviar email
        await sendPasswordResetEmail({ to: input.email, token });
        return { success: true, message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' };
      }),
    
    // Validar token de recuperação
    validarTokenRecuperacao: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const user = await validateResetToken(input.token);
        if (!user) {
          return { valido: false, error: 'Token inválido ou expirado.' };
        }
        return { valido: true, email: user.email };
      }),
    
    // Redefinir senha
    redefinirSenha: publicProcedure
      .input(z.object({ token: z.string(), novaSenha: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const user = await validateResetToken(input.token);
        if (!user) {
          return { success: false, error: 'Token inválido ou expirado.' };
        }
        await setPassword(user.id, input.novaSenha);
        return { success: true, message: 'Senha redefinida com sucesso!' };
      }),
    
    // Listar emails autorizados (admin)
    listarEmailsAutorizados: protectedProcedure.query(async () => {
      return listAuthorizedEmails();
    }),
    
    // Adicionar email autorizado (admin)
    adicionarEmailAutorizado: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        await addAuthorizedEmail(input.email, ctx.user?.id);
        return { success: true };
      }),
    
    // Remover email autorizado (admin)
    removerEmailAutorizado: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        await removeAuthorizedEmail(input.email);
        return { success: true };
      }),
    
    // Verificar status do email (para primeiro acesso)
    verificarStatusEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        return checkEmailStatus(input.email);
      }),
    
    // Criar usuário e definir senha no primeiro acesso
    criarUsuarioComSenha: publicProcedure
      .input(z.object({ 
        email: z.string().email(), 
        senha: z.string().min(6),
        nome: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createUserWithPassword(input.email, input.senha, input.nome);
        if (!result.success || !result.user) {
          return { success: false, error: result.error };
        }
        // Criar sessão automaticamente após criar usuário
        const token = await sdk.signSession({ openId: result.user.openId, appId: process.env.VITE_APP_ID || '', name: result.user.name || '' });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role } };
      }),
    
    // Alterar senha de usuário logado (invalida todas as sessões)
    alterarSenha: protectedProcedure
      .input(z.object({ 
        senhaAtual: z.string().min(1),
        novaSenha: z.string().min(6)
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await changePassword(ctx.user.id, input.senhaAtual, input.novaSenha);
        if (result.success && result.sessionsInvalidated) {
          // Limpar cookie da sessão atual para forçar novo login
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
        }
        return result;
      }),
    
    // Desbloquear conta (apenas admin)
    desbloquearConta: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin
        if (ctx.user.role !== 'admin') {
          return { success: false, error: 'Apenas administradores podem desbloquear contas.' };
        }
        const success = await unlockAccount(input.email);
        return { success, message: success ? 'Conta desbloqueada com sucesso.' : 'Erro ao desbloquear conta.' };
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
        
        if (g.igUltrassomSemanas !== null && g.igUltrassomSemanas !== undefined && g.dataUltrassom) {
          // igUltrassomDias pode ser 0 ou null/undefined, tratar como 0 se não definido
          const igDias = g.igUltrassomDias ?? 0;
          // Parsear YYYY-MM-DD como data local
          const [year, month, day] = g.dataUltrassom.split('-').map(Number);
          const dataUS = new Date(year, month - 1, day);
          const igUltrassomDias = (g.igUltrassomSemanas * 7) + igDias;
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
            dpp: dpp ? dpp.toISOString().split('T')[0] : null,
            dppUS: dppUS ? dppUS.toISOString().split('T')[0] : null,
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
        
        if (g.igUltrassomSemanas !== null && g.igUltrassomSemanas !== undefined && g.dataUltrassom) {
          // igUltrassomDias pode ser 0 ou null/undefined, tratar como 0 se não definido
          const igDias = g.igUltrassomDias ?? 0;
          // Parsear YYYY-MM-DD como data local
          const [year, month, day] = g.dataUltrassom.split('-').map(Number);
          const dataUS = new Date(year, month - 1, day);
          const igUltrassomDias = (g.igUltrassomSemanas * 7) + igDias;
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
            dpp: dpp ? dpp.toISOString().split('T')[0] : null,
            dppUS: dppUS ? dppUS.toISOString().split('T')[0] : null,
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
        motivoCesarea: z.string().optional(),
        motivoCesareaOutro: z.string().optional(),
        hospitalParto: z.enum(["hospital_unimed", "hospital_sao_sebastiao"]).optional(),
        altura: z.number().optional(),
        pesoInicial: z.number().optional(),
        nomeBebe: z.string().optional(),
        sexoBebe: z.enum(["masculino", "feminino", "nao_informado"]).optional(),
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
          motivoCesarea: input.motivoCesarea || null,
          hospitalParto: input.hospitalParto || 'hospital_unimed',
          altura: input.altura || null,
          pesoInicial: input.pesoInicial || null,
          nomeBebe: input.nomeBebe || null,
          sexoBebe: input.sexoBebe || "nao_informado",
          observacoes: input.observacoes || null,
        };
        
        const novaGestante = await createGestante(data);
        
        // Registrar automaticamente uso de Polivitamínico para toda nova gestante
        try {
          await createMedicamento({
            gestanteId: novaGestante.id,
            tipo: "polivitaminicos",
            especificacao: "Adicionado automaticamente ao cadastrar gestante"
          });
        } catch (error) {
          console.error("Erro ao adicionar Polivitamínico automaticamente:", error);
          // Não falhar a criação da gestante se o medicamento não puder ser adicionado
        }
        
        // Sincronizar cesárea com sistema administrativo (Mapa Cirúrgico) se data definida
        if (input.dataPartoProgramado && input.tipoPartoDesejado === 'cesariana') {
          sincronizarCesareaComAdmin({
            id: novaGestante.id,
            nomeCompleto: novaGestante.nome,
            dataCesarea: input.dataPartoProgramado,
            hospital: mapearHospital(input.hospitalParto),
          }).catch(err => console.error('[Integração] Erro na sincronização:', err));
        }
        
        // Retornar dados da gestante para permitir seleção automática e exibir no modal
        return { 
          success: true,
          id: novaGestante.id,
          nome: novaGestante.nome,
          dum: input.dum || null,
          tipoDum: input.dum === "Incerta" ? "incerta" : input.dum === "Incompatível com US" ? "incompativel" : "conhecida",
          dataUltrassom: input.dataUltrassom || null,
          igUltrassomSemanas: input.igUltrassomSemanas || null,
          igUltrassomDias: input.igUltrassomDias || null,
          gesta: input.gesta || null,
          para: input.para || null,
          partosNormais: input.partosNormais || null,
          cesareas: input.cesareas || null,
          abortos: input.abortos || null,
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
        motivoCesarea: z.string().optional(),
        motivoCesareaOutro: z.string().optional(),
        hospitalParto: z.enum(["hospital_unimed", "hospital_sao_sebastiao"]).optional(),
        nomeBebe: z.string().optional(),
        sexoBebe: z.enum(["masculino", "feminino", "nao_informado"]).optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        
        if (data.dataNascimento) data.dataNascimento = parseLocalDate(data.dataNascimento);
        if (data.dum) data.dum = parseLocalDate(data.dum);
        if (data.dataUltrassom) data.dataUltrassom = parseLocalDate(data.dataUltrassom);
        if (data.dataPartoProgramado) data.dataPartoProgramado = parseLocalDate(data.dataPartoProgramado);
        
        // Buscar gestante antes da atualização para comparar data de cesárea
        const gestanteAntes = await getGestanteById(id);
        
        await updateGestante(id, data);
        
        // Retornar dados da gestante para permitir seleção automática
        const gestante = await getGestanteById(id);
        if (!gestante) {
          throw new Error('Gestante não encontrada após atualização');
        }
        
        // Sincronizar cesárea com sistema administrativo (Mapa Cirúrgico)
        // Detectar mudanças na data de cesárea ou tipo de parto
        const dataPartoProgramadoAntes = gestanteAntes?.dataPartoProgramado ? String(gestanteAntes.dataPartoProgramado) : null;
        const dataPartoProgramadoDepois = gestante.dataPartoProgramado ? String(gestante.dataPartoProgramado) : null;
        const tipoPartoAntes = gestanteAntes?.tipoPartoDesejado;
        const tipoPartoDepois = gestante.tipoPartoDesejado;
        
        const tinhaDataCesarea = dataPartoProgramadoAntes && tipoPartoAntes === 'cesariana';
        const temDataCesarea = dataPartoProgramadoDepois && tipoPartoDepois === 'cesariana';
        
        if (temDataCesarea) {
          // Criar ou atualizar agendamento
          sincronizarCesareaComAdmin({
            id: gestante.id,
            nomeCompleto: gestante.nome,
            dataCesarea: dataPartoProgramadoDepois,
            hospital: mapearHospital(gestante.hospitalParto),
          }).catch(err => console.error('[Integração] Erro na sincronização:', err));
        } else if (tinhaDataCesarea && !temDataCesarea) {
          // Data foi removida ou tipo de parto mudou - deletar agendamento
          sincronizarCesareaComAdmin({
            id: gestante.id,
            nomeCompleto: gestante.nome,
            dataCesarea: null,
          }).catch(err => console.error('[Integração] Erro na sincronização:', err));
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
        // Buscar gestante antes de deletar para remover agendamento do Mapa Cirúrgico
        const gestante = await getGestanteById(input.id);
        if (gestante && gestante.dataPartoProgramado && gestante.tipoPartoDesejado === 'cesariana') {
          sincronizarCesareaComAdmin({
            id: gestante.id,
            nomeCompleto: gestante.nome,
            dataCesarea: null, // null = remover agendamento
          }).catch(err => console.error('[Integração] Erro ao remover agendamento:', err));
        }
        
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
          "anemia_falciforme",
          "cirurgia_uterina_previa",
          "diabetes_gestacional",
          "diabetes_tipo_1",
          "diabetes_tipo2",
          "dpoc_asma",
          "epilepsia",
          "fator_preditivo_dheg",
          "fator_rh_negativo",
          "fiv_nesta_gestacao",
          "gemelar",
          "hipertensao",
          "hipotireoidismo",
          "historico_familiar_dheg",
          "idade_avancada",
          "incompetencia_istmo_cervical",
          "mal_passado_obstetrico",
          "malformacoes_mullerianas",
          "outro",
          "sobrepeso_obesidade",
          "trombofilia"
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
        igDumSemanas: z.number().optional(),
        igDumDias: z.number().optional(),
        igUltrassomSemanas: z.number().optional(),
        igUltrassomDias: z.number().optional(),
        peso: z.number().optional(),
        pressaoArterial: z.string().optional(),
        pressaoSistolica: z.number().optional(),
        pressaoDiastolica: z.number().optional(),
        alturaUterina: z.number().optional(),
        bcf: z.number().optional(),
        mf: z.number().optional(),
        conduta: z.string().optional(),
        condutaComplementacao: z.string().optional(),
        observacoes: z.string().optional(),
        queixas: z.string().optional(),
        edema: z.string().optional(),
        // Campos específicos da 1ª consulta
        isPrimeiraConsulta: z.number().optional(),
        historiaPatologicaPregressa: z.string().optional(),
        historiaSocial: z.string().optional(),
        historiaFamiliar: z.string().optional(),
        condutaCheckboxes: z.record(z.string(), z.boolean()).optional(),
        // Campos específicos da consulta de urgência
        isUrgencia: z.number().optional(),
        queixasUrgencia: z.array(z.string()).optional(),
        detalhamentoQueixa: z.string().optional(),
        auf: z.string().optional(),
        atividadeUterina: z.array(z.string()).optional(),
        toqueVaginal: z.string().optional(),
        usgHoje: z.string().optional(),
        hipoteseDiagnostica: z.string().optional(),
        condutaUrgencia: z.record(z.string(), z.boolean()).optional(),
        outraCondutaDescricao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const data: any = {
          ...input,
          dataConsulta: parseLocalDate(input.dataConsulta),
        };
        
        // Converter condutaCheckboxes para JSON string se fornecido
        if (input.condutaCheckboxes) {
          data.condutaCheckboxes = input.condutaCheckboxes;
        }
        
        // Processar pressão arterial se fornecida como string
        if (input.pressaoArterial && !input.pressaoSistolica && !input.pressaoDiastolica) {
          const match = input.pressaoArterial.match(/(\d+)\s*[\/xX]\s*(\d+)/);
          if (match) {
            data.pressaoSistolica = parseInt(match[1]);
            data.pressaoDiastolica = parseInt(match[2]);
          }
        }
        
        const result = await createConsultaPrenatal(data);
        
        // Gerar lembretes automáticos baseados nas condutas selecionadas
        if (result && (result as any).insertId) {
          const consultaId = (result as any).insertId;
          
          // Condutas da consulta de rotina (array JSON)
          if (input.conduta) {
            try {
              const condutas = JSON.parse(input.conduta);
              if (Array.isArray(condutas)) {
                await criarLembretesConduta(input.gestanteId, consultaId, condutas);
              }
            } catch (e) { /* ignore parse errors */ }
          }
          
          // Condutas da 1ª consulta (checkboxes)
          if (input.condutaCheckboxes) {
            await criarLembretesCondutaWizard(input.gestanteId, consultaId, input.condutaCheckboxes);
          }
          
          // Condutas da consulta de urgência
          if (input.condutaUrgencia) {
            await criarLembretesCondutaUrgencia(input.gestanteId, consultaId, input.condutaUrgencia, input.outraCondutaDescricao);
          }
        }
        
        return result;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        dataConsulta: z.string().optional(),
        igSemanas: z.number().optional(),
        igDias: z.number().optional(),
        igDumSemanas: z.number().optional(),
        igDumDias: z.number().optional(),
        igUltrassomSemanas: z.number().optional(),
        igUltrassomDias: z.number().optional(),
        peso: z.number().optional(),
        pressaoArterial: z.string().optional(),
        pressaoSistolica: z.number().optional(),
        pressaoDiastolica: z.number().optional(),
        alturaUterina: z.number().optional(),
        bcf: z.number().optional(),
        mf: z.number().optional(),
        conduta: z.string().optional(),
        condutaComplementacao: z.string().optional(),
        observacoes: z.string().optional(),
        queixas: z.string().optional(),
        edema: z.string().optional(),
        // Campos específicos da 1ª consulta
        isPrimeiraConsulta: z.number().optional(),
        historiaPatologicaPregressa: z.string().optional(),
        historiaSocial: z.string().optional(),
        historiaFamiliar: z.string().optional(),
        condutaCheckboxes: z.record(z.string(), z.boolean()).optional(),
        // Campos específicos da consulta de urgência
        isUrgencia: z.number().optional(),
        queixasUrgencia: z.array(z.string()).optional(),
        detalhamentoQueixa: z.string().optional(),
        auf: z.string().optional(),
        atividadeUterina: z.array(z.string()).optional(),
        toqueVaginal: z.string().optional(),
        usgHoje: z.string().optional(),
        hipoteseDiagnostica: z.string().optional(),
        condutaUrgencia: z.record(z.string(), z.boolean()).optional(),
        outraCondutaDescricao: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        if (data.dataConsulta) data.dataConsulta = parseLocalDate(data.dataConsulta);
        
        // Processar pressão arterial se fornecida como string
        if (input.pressaoArterial && !input.pressaoSistolica && !input.pressaoDiastolica) {
          const match = input.pressaoArterial.match(/(\d+)\s*[\/xX]\s*(\d+)/);
          if (match) {
            data.pressaoSistolica = parseInt(match[1]);
            data.pressaoDiastolica = parseInt(match[2]);
          }
        }
        
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
        modoAdicionar: z.boolean().optional(), // Se true, adiciona novos resultados sem deletar existentes
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        // Se não for modo adicionar, deletar todos os resultados existentes
        if (!input.modoAdicionar) {
          await db.delete(resultadosExames).where(eq(resultadosExames.gestanteId, input.gestanteId));
        }
        
        // Preparar array de resultados para inserir
        const resultadosParaInserir: InsertResultadoExame[] = [];
        
        for (const [nomeExame, valor] of Object.entries(input.resultados)) {
          const datasExame = input.datas?.[nomeExame];
          
          if (nomeExame === 'outros_observacoes') {
            // Campo de texto livre - salvar como trimestre 0
            if (typeof valor === 'string' && valor.trim()) {
              // Adicionar T12:00:00 para evitar problema de timezone
              const dataExame = typeof datasExame === 'string' ? new Date(`${datasExame}T12:00:00`) : null;
              
              // Em modo adicionar, verificar se já existe e atualizar
              if (input.modoAdicionar) {
                const existente = await db.select().from(resultadosExames)
                  .where(and(
                    eq(resultadosExames.gestanteId, input.gestanteId),
                    eq(resultadosExames.nomeExame, nomeExame),
                    eq(resultadosExames.trimestre, 0)
                  ));
                if (existente.length > 0) {
                  await db.update(resultadosExames)
                    .set({ resultado: valor, dataExame })
                    .where(eq(resultadosExames.id, existente[0].id));
                  continue;
                }
              }
              
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
        
        // Verificar duplicatas e versões completas antes de inserir
        const duplicatas: Array<{
          nomeExame: string;
          trimestre: number;
          resultado: string;
          dataExame: string | null;
        }> = [];
        
        const versoesCompletas: Array<{
          nomeExame: string;
          trimestre: number;
          resultadoAntigo: string;
          resultadoNovo: string;
          dataExame: string | null;
          idExameAntigo: number;
        }> = [];
        
        const resultadosFiltrados: InsertResultadoExame[] = [];
        
        // Função auxiliar para verificar se um resultado é mais completo que outro
        const isVersaoCompleta = (antigo: string, novo: string): boolean => {
          // Remover espaços e converter para minúsculas para comparação
          const antigoClean = antigo.trim().toLowerCase();
          const novoClean = novo.trim().toLowerCase();
          
          // Se são idênticos, não é versão completa
          if (antigoClean === novoClean) return false;
          
          // Se o novo contém o antigo e é maior, provavelmente é versão completa
          if (novoClean.includes(antigoClean) && novoClean.length > antigoClean.length) return true;
          
          // Verificar se o antigo tem marcadores de resultado parcial
          const marcadoresParciais = ['parcial', 'pendente', 'aguardando', 'em análise', '?', 'n/a', '-'];
          const antigoEhParcial = marcadoresParciais.some(m => antigoClean.includes(m));
          
          // Se o antigo é parcial e o novo não é, provavelmente é versão completa
          const novoEhParcial = marcadoresParciais.some(m => novoClean.includes(m));
          if (antigoEhParcial && !novoEhParcial && novoClean.length > 0) return true;
          
          // Verificar se o novo tem mais conteúdo numérico (mais resultados)
          const numerosAntigo = antigoClean.match(/\d+/g) || [];
          const numerosNovo = novoClean.match(/\d+/g) || [];
          if (numerosNovo.length > numerosAntigo.length && numerosNovo.length > 0) return true;
          
          return false;
        };
        
        for (const novoResultado of resultadosParaInserir) {
          // Buscar resultados existentes com mesmo nome, trimestre e data
          const existentes = await db.select().from(resultadosExames)
            .where(and(
              eq(resultadosExames.gestanteId, input.gestanteId),
              eq(resultadosExames.nomeExame, novoResultado.nomeExame),
              eq(resultadosExames.trimestre, novoResultado.trimestre),
              novoResultado.dataExame ? eq(resultadosExames.dataExame, novoResultado.dataExame) : sql`${resultadosExames.dataExame} IS NULL`
            ));
          
          if (existentes.length > 0) {
            const existente = existentes[0];
            
            // Se encontrou resultado existente com mesmo valor, é duplicata
            if (existente.resultado === novoResultado.resultado) {
              duplicatas.push({
                nomeExame: novoResultado.nomeExame,
                trimestre: novoResultado.trimestre,
                resultado: novoResultado.resultado || '',
                dataExame: novoResultado.dataExame ? novoResultado.dataExame.toISOString().split('T')[0] : null,
              });
            }
            // Se o novo resultado é versão completa do antigo, marcar para substituição
            else if (isVersaoCompleta(existente.resultado || '', novoResultado.resultado || '')) {
              versoesCompletas.push({
                nomeExame: novoResultado.nomeExame,
                trimestre: novoResultado.trimestre,
                resultadoAntigo: existente.resultado || '',
                resultadoNovo: novoResultado.resultado || '',
                dataExame: novoResultado.dataExame ? novoResultado.dataExame.toISOString().split('T')[0] : null,
                idExameAntigo: existente.id,
              });
              // Adicionar para inserção (será substituído depois)
              resultadosFiltrados.push(novoResultado);
            }
            // Se são diferentes mas nenhum é versão completa, adicionar normalmente
            else {
              resultadosFiltrados.push(novoResultado);
            }
          } else {
            // Não existe, adicionar normalmente
            resultadosFiltrados.push(novoResultado);
          }
        }
        
        // Inserir apenas os resultados não duplicados
        if (resultadosFiltrados.length > 0) {
          await db.insert(resultadosExames).values(resultadosFiltrados);
        }
        
        return { 
          success: true, 
          count: resultadosFiltrados.length,
          duplicatas: duplicatas.length > 0 ? duplicatas : undefined,
          versoesCompletas: versoesCompletas.length > 0 ? versoesCompletas : undefined,
          totalProcessados: resultadosParaInserir.length
        };
      }),

    // Verificar se PDF está protegido por senha
    verificarPdfProtegido: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Só verificar se for PDF
          if (input.mimeType !== 'application/pdf') {
            return { needsPassword: false, isProtected: false };
          }
          
          const fileBuffer = Buffer.from(input.fileBase64, 'base64');
          const result = await checkPdfProtection(fileBuffer);
          
          return { 
            needsPassword: result.needsPassword, 
            isProtected: result.isProtected,
            error: result.error 
          };
        } catch (error) {
          console.error('Erro ao verificar PDF:', error);
          return { needsPassword: false, isProtected: false, error: 'Erro ao verificar PDF' };
        }
      }),

    // Desbloquear PDF protegido por senha
    desbloquearPdf: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const fileBuffer = Buffer.from(input.fileBase64, 'base64');
          const result = await unlockPdf(fileBuffer, input.password);
          
          if (result.success && result.unlockedBuffer) {
            return { 
              success: true, 
              unlockedBase64: result.unlockedBuffer.toString('base64') 
            };
          }
          
          return { success: false, error: result.error };
        } catch (error) {
          console.error('Erro ao desbloquear PDF:', error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro ao desbloquear PDF' 
          };
        }
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
          const { resultados, dataColeta, trimestreExtraido, relatorio } = await interpretarExamesComIA(
            fileBuffer,
            input.mimeType,
            input.trimestre,
            input.dumGestante
          );
          
          return { success: true, resultados, dataColeta, trimestreExtraido, relatorio };
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

    // Buscar exames com histórico de múltiplas datas
    buscarComHistorico: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { exames: {}, historico: {} };
        
        const resultados = await db.select()
          .from(resultadosExames)
          .where(eq(resultadosExames.gestanteId, input.gestanteId))
          .orderBy(resultadosExames.dataExame);
        
        // Objeto estruturado com o resultado mais recente de cada exame/trimestre
        const examesEstruturados: Record<string, Record<string, string> | string> = {};
        
        // Histórico agrupado por exame::trimestre
        const historico: Record<string, Array<{
          id: number;
          resultado: string;
          dataExame: string | null;
          criadoEm: Date | null;
        }>> = {};
        
        for (const resultado of resultados) {
          const chaveHistorico = `${resultado.nomeExame}::${resultado.trimestre}`;
          
          // Formatar data
          let dataFormatada: string | null = null;
          if (resultado.dataExame) {
            const data = new Date(resultado.dataExame);
            const dataLocal = new Date(data.getTime() + data.getTimezoneOffset() * 60000);
            const ano = dataLocal.getFullYear();
            const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
            const dia = String(dataLocal.getDate()).padStart(2, '0');
            dataFormatada = `${ano}-${mes}-${dia}`;
          }
          
          // Adicionar ao histórico
          if (!historico[chaveHistorico]) {
            historico[chaveHistorico] = [];
          }
          historico[chaveHistorico].push({
            id: resultado.id,
            resultado: resultado.resultado || '',
            dataExame: dataFormatada,
            criadoEm: resultado.createdAt,
          });
          
          // Estruturar exames (manter o mais recente)
          if (resultado.nomeExame === 'outros_observacoes') {
            examesEstruturados[resultado.nomeExame] = resultado.resultado || '';
          } else {
            if (!examesEstruturados[resultado.nomeExame]) {
              examesEstruturados[resultado.nomeExame] = {};
            }
            (examesEstruturados[resultado.nomeExame] as Record<string, string>)[resultado.trimestre.toString()] = resultado.resultado || '';
            if (dataFormatada) {
              (examesEstruturados[resultado.nomeExame] as Record<string, string>)[`data${resultado.trimestre}`] = dataFormatada;
            }
          }
        }
        
        return { exames: examesEstruturados, historico };
      }),

    // Excluir resultado específico do histórico
    excluirResultado: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        await db.delete(resultadosExames).where(eq(resultadosExames.id, input.id));
        return { success: true };
      }),

    // Upload de arquivo de exame (PDF ou imagem)
    uploadArquivo: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
        nomeArquivo: z.string(),
        tipoArquivo: z.string(),
        tamanhoBytes: z.number(),
        fileBase64: z.string(),
        senhaPdf: z.string().optional(), // Senha do PDF se protegido
        protegidoPorSenha: z.boolean().optional(),
        trimestre: z.number().optional(),
        dataColeta: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        try {
          // Converter base64 para Buffer
          const fileBuffer = Buffer.from(input.fileBase64, 'base64');
          
          // Gerar nome único para o arquivo
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const extensao = input.nomeArquivo.split('.').pop() || 'pdf';
          const s3Key = `exames/${input.gestanteId}/${timestamp}-${randomSuffix}.${extensao}`;
          
          // Upload para S3
          const { url: s3Url } = await storagePut(s3Key, fileBuffer, input.tipoArquivo);
          
          // Salvar no banco de dados
          const arquivoData: InsertArquivoExame = {
            gestanteId: input.gestanteId,
            nomeArquivo: input.nomeArquivo,
            tipoArquivo: input.tipoArquivo,
            tamanhoBytes: input.tamanhoBytes,
            s3Url,
            s3Key,
            senhaPdf: input.senhaPdf || null,
            protegidoPorSenha: input.protegidoPorSenha ? 1 : 0,
            trimestre: input.trimestre || null,
            dataColeta: input.dataColeta ? new Date(`${input.dataColeta}T12:00:00`) : null,
            observacoes: input.observacoes || null,
          };
          
          const [result] = await db.insert(arquivosExames).values(arquivoData);
          
          return { 
            success: true, 
            id: result.insertId,
            s3Url,
            s3Key
          };
        } catch (error) {
          console.error('Erro ao fazer upload do arquivo:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: error instanceof Error ? error.message : 'Erro ao fazer upload do arquivo' 
          });
        }
      }),

    // Listar arquivos de exames de uma gestante
    listarArquivos: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const arquivos = await db.select({
          id: arquivosExames.id,
          nomeArquivo: arquivosExames.nomeArquivo,
          tipoArquivo: arquivosExames.tipoArquivo,
          tamanhoBytes: arquivosExames.tamanhoBytes,
          s3Url: arquivosExames.s3Url,
          protegidoPorSenha: arquivosExames.protegidoPorSenha,
          trimestre: arquivosExames.trimestre,
          dataColeta: arquivosExames.dataColeta,
          observacoes: arquivosExames.observacoes,
          createdAt: arquivosExames.createdAt,
        })
          .from(arquivosExames)
          .where(eq(arquivosExames.gestanteId, input.gestanteId))
          .orderBy(desc(arquivosExames.createdAt));
        
        return arquivos;
      }),

    // Obter arquivo com senha (para abrir PDF protegido)
    obterArquivoComSenha: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        const [arquivo] = await db.select()
          .from(arquivosExames)
          .where(eq(arquivosExames.id, input.id));
        
        if (!arquivo) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado' });
        }
        
        return {
          id: arquivo.id,
          nomeArquivo: arquivo.nomeArquivo,
          tipoArquivo: arquivo.tipoArquivo,
          s3Url: arquivo.s3Url,
          senhaPdf: arquivo.senhaPdf, // Retornar senha para desbloquear
          protegidoPorSenha: arquivo.protegidoPorSenha === 1,
        };
      }),

    // Desbloquear PDF protegido usando senha salva e retornar URL do arquivo desbloqueado
    desbloquearPdfSalvo: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        const [arquivo] = await db.select()
          .from(arquivosExames)
          .where(eq(arquivosExames.id, input.id));
        
        if (!arquivo) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado' });
        }
        
        // Se não está protegido ou não tem senha salva, retornar URL original
        if (arquivo.protegidoPorSenha !== 1 || !arquivo.senhaPdf) {
          return {
            success: true,
            url: arquivo.s3Url,
            wasUnlocked: false,
          };
        }
        
        try {
          // Baixar o PDF do S3
          const response = await fetch(arquivo.s3Url);
          if (!response.ok) {
            throw new Error('Falha ao baixar arquivo do S3');
          }
          const pdfBuffer = Buffer.from(await response.arrayBuffer());
          
          // Desbloquear o PDF
          const { unlockPdf } = await import('./pdfUtils');
          const result = await unlockPdf(pdfBuffer, arquivo.senhaPdf);
          
          if (!result.success || !result.unlockedBuffer) {
            throw new Error(result.error || 'Falha ao desbloquear PDF');
          }
          
          // Fazer upload do PDF desbloqueado para o S3
          const { storagePut } = await import('./storage');
          const unlockedKey = `exames/${arquivo.gestanteId}/unlocked-${Date.now()}-${arquivo.nomeArquivo}`;
          const { url: unlockedUrl } = await storagePut(unlockedKey, result.unlockedBuffer, 'application/pdf');
          
          return {
            success: true,
            url: unlockedUrl,
            wasUnlocked: true,
          };
        } catch (error: any) {
          console.error('[desbloquearPdfSalvo] Erro:', error);
          // Em caso de erro, retornar URL original (usuário terá que digitar a senha)
          return {
            success: false,
            url: arquivo.s3Url,
            wasUnlocked: false,
            error: error.message,
          };
        }
      }),

    // Excluir arquivo de exame
    excluirArquivo: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        
        // Nota: Não estamos deletando do S3 para manter histórico
        // Se quiser deletar do S3 também, usar storageDelete
        await db.delete(arquivosExames).where(eq(arquivosExames.id, input.id));
        
        return { success: true };
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
  // NOTA: Este endpoint usa a versão web (renderiza a página HTML)
  // Para o app mobile, usar gestante.gerarPdfCartao que usa jsPDF
  pdf: router({
    gerarCartaoPrenatal: protectedProcedure
      .input(z.object({
        gestanteId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const gestanteDb = await import('./gestante-db');
        const { getGestanteById } = await import('./db');
        const { gerarPdfComJsPDF } = await import('./htmlToPdf');
        const { gerarTodosGraficos } = await import('./chartGenerator');
        
        // Buscar dados da gestante
        const gestante = await getGestanteById(input.gestanteId);
        if (!gestante) {
          throw new Error('Gestante não encontrada');
        }

        // Buscar dados relacionados
        const consultas = await gestanteDb.getConsultasByGestanteId(input.gestanteId);
        const ultrassons = await gestanteDb.getUltrassonsByGestanteId(input.gestanteId);
        const exames = await gestanteDb.getExamesByGestanteId(input.gestanteId);
        const fatoresRisco = await gestanteDb.getFatoresRiscoByGestanteId(input.gestanteId);
        const medicamentos = await gestanteDb.getMedicamentosByGestanteId(input.gestanteId);

        // Calcular idade
        let idade = null;
        if (gestante.dataNascimento) {
          const dataNasc = new Date(gestante.dataNascimento);
          const hoje = new Date();
          idade = Math.floor((hoje.getTime() - dataNasc.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        }

        // Calcular DPP
        let dppDUM = null;
        if (gestante.dum) {
          const dum = new Date(gestante.dum);
          const dpp = new Date(dum);
          dpp.setDate(dpp.getDate() + 280);
          dppDUM = dpp.toISOString().split('T')[0];
        }

        let dppUS = null;
        if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
          const usDate = new Date(gestante.dataUltrassom + 'T12:00:00');
          const diasRestantes = (40 * 7) - ((gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0));
          const dppUSDate = new Date(usDate.getTime() + diasRestantes * 24 * 60 * 60 * 1000);
          dppUS = dppUSDate.toISOString().split('T')[0];
        }

        // Preparar dados para gráficos
        const dadosConsultasGraficos = consultas.map((c: any) => ({
          dataConsulta: c.dataConsulta ? new Date(c.dataConsulta).toISOString().split('T')[0] : '',
          igSemanas: c.igSemanas || c.igDumSemanas,
          peso: c.peso ? c.peso / 1000 : null,
          au: c.alturaUterina ? (c.alturaUterina === -1 ? null : c.alturaUterina / 10) : null,
          paSistolica: c.pressaoSistolica || null,
          paDiastolica: c.pressaoDiastolica || null,
        }));

        const graficosGerados = await gerarTodosGraficos(dadosConsultasGraficos);

        // Agrupar exames por trimestre
        const examesAgrupados: any[] = [];
        const examesPorNome = new Map<string, any>();
        exames.forEach((ex: any) => {
          if (ex.trimestre === 0) return;
          const nomeExame = ex.nomeExame;
          if (!examesPorNome.has(nomeExame)) {
            examesPorNome.set(nomeExame, { nome: nomeExame });
          }
          const exameAgrupado = examesPorNome.get(nomeExame)!;
          const key = `trimestre${ex.trimestre}` as 'trimestre1' | 'trimestre2' | 'trimestre3';
          if (ex.resultado) {
            exameAgrupado[key] = {
              resultado: ex.resultado,
              data: ex.dataExame ? new Date(ex.dataExame).toISOString().split('T')[0] : undefined
            };
          }
        });
        examesPorNome.forEach((exame) => {
          if (exame.trimestre1 || exame.trimestre2 || exame.trimestre3) {
            examesAgrupados.push(exame);
          }
        });

        // Calcular marcos
        let marcos: any[] = [];
        let dataBase: Date | null = null;
        let igBaseSemanas = 0;
        let igBaseDias = 0;
        if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
          dataBase = new Date(gestante.dataUltrassom + 'T12:00:00');
          igBaseSemanas = gestante.igUltrassomSemanas;
          igBaseDias = gestante.igUltrassomDias || 0;
        } else if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Compatível com US') {
          dataBase = new Date(gestante.dum + 'T12:00:00');
        }
        if (dataBase) {
          const marcosDefinidos = [
            { titulo: '1º Ultrassom', semanaInicio: 6, semanaFim: 9 },
            { titulo: 'Morfológico 1º Tri', semanaInicio: 11, semanaFim: 14 },
            { titulo: 'Morfológico 2º Tri', semanaInicio: 20, semanaFim: 24 },
            { titulo: 'TOTG 75g', semanaInicio: 24, semanaFim: 28 },
            { titulo: 'Ecocardiograma Fetal', semanaInicio: 24, semanaFim: 28 },
            { titulo: 'Vacina dTpa', semanaInicio: 27, semanaFim: 36 },
            { titulo: 'Estreptococo Grupo B', semanaInicio: 35, semanaFim: 37 },
            { titulo: 'Termo de Gestação', semanaInicio: 37, semanaFim: 42 },
          ];
          marcos = marcosDefinidos.map(m => {
            const diasAteSemanaInicio = ((m.semanaInicio - igBaseSemanas) * 7) - igBaseDias;
            const dataEstimada = new Date(dataBase!.getTime() + (diasAteSemanaInicio * 24 * 60 * 60 * 1000));
            return {
              titulo: m.titulo,
              data: dataEstimada.toISOString().split('T')[0],
              periodo: `${m.semanaInicio}-${m.semanaFim}s`
            };
          });
        }

        const dadosPdf = {
          graficos: {
            peso: graficosGerados.graficoPeso || undefined,
            au: graficosGerados.graficoAU || undefined,
            pa: graficosGerados.graficoPA || undefined,
          },
          gestante: {
            nome: gestante.nome,
            idade: idade,
            dum: gestante.dum ? (gestante.dum.includes('Incerta') || gestante.dum.includes('Incompatível') ? gestante.dum : new Date(gestante.dum).toISOString().split('T')[0]) : null,
            dppDUM: dppDUM,
            dppUS: dppUS,
            dataUltrassom: gestante.dataUltrassom,
            igUltrassomSemanas: gestante.igUltrassomSemanas,
            igUltrassomDias: gestante.igUltrassomDias,
            gesta: gestante.gesta,
            para: gestante.para,
            abortos: gestante.abortos,
            partosNormais: null,
            cesareas: gestante.cesareas,
          },
          consultas: consultas.map((c: any) => ({
            dataConsulta: c.dataConsulta ? new Date(c.dataConsulta).toISOString().split('T')[0] : '',
            igDUM: c.igDumSemanas ? `${c.igDumSemanas}s${c.igDumDias || 0}d` : '',
            igUS: c.igSemanas ? `${c.igSemanas}s${c.igDias || 0}d` : null,
            peso: c.peso,
            pa: c.pressaoSistolica && c.pressaoDiastolica ? `${c.pressaoSistolica}/${c.pressaoDiastolica}` : null,
            au: c.alturaUterina,
            bcf: c.bcf,
            mf: c.movimentosFetais ? 1 : null,
            conduta: c.conduta,
            condutaComplementacao: c.condutaComplementacao,
            observacoes: c.observacoes,
          })),
          marcos: marcos,
          ultrassons: ultrassons.map((u: any) => {
            const dados = u.dados || {};
            let obs = '';
            if (dados.observacoes) obs = dados.observacoes;
            else if (dados.ccn) obs = `CCN: ${dados.ccn}`;
            else if (dados.tn) obs = `TN: ${dados.tn}`;
            else if (dados.pesoFetal) obs = `Peso: ${dados.pesoFetal}`;
            return {
              data: u.dataExame || '',
              ig: u.idadeGestacional || '',
              tipo: u.tipoUltrassom || '',
              observacoes: obs || null,
            };
          }),
          exames: examesAgrupados,
          fatoresRisco: fatoresRisco.map((f: any) => ({ tipo: f.tipo })),
          medicamentos: medicamentos.map((m: any) => ({ tipo: m.tipo, especificacao: m.especificacao })),
        };

        const pdfBuffer = await gerarPdfComJsPDF(dadosPdf);
        
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
          "anemia_falciforme",
          "cirurgia_uterina_previa",
          "diabetes_gestacional",
          "diabetes_tipo_1",
          "diabetes_tipo2",
          "dpoc_asma",
          "epilepsia",
          "fator_preditivo_dheg",
          "fator_rh_negativo",
          "fiv_nesta_gestacao",
          "gemelar",
          "hipertensao",
          "hipotireoidismo",
          "historico_familiar_dheg",
          "idade_avancada",
          "incompetencia_istmo_cervical",
          "mal_passado_obstetrico",
          "malformacoes_mullerianas",
          "outro",
          "sobrepeso_obesidade",
          "trombofilia"
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

  // Router de Opções de Fatores de Risco (Configuráveis)
  opcoesFatoresRisco: router({
    list: protectedProcedure
      .query(async () => {
        // Inicializar opções padrão se não existirem
        await inicializarOpcoesPadrao();
        return getOpcoesFatoresRisco();
      }),
    
    create: protectedProcedure
      .input(z.object({
        codigo: z.string().min(1),
        nome: z.string().min(1),
        descricaoPadrao: z.string().optional(),
        permiteTextoLivre: z.number().optional().default(0),
      }))
      .mutation(({ input }) => createOpcaoFatorRisco({
        ...input,
        sistema: 0, // Opções criadas pelo usuário não são do sistema
      })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricaoPadrao: z.string().optional(),
        permiteTextoLivre: z.number().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateOpcaoFatorRisco(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteOpcaoFatorRisco(input.id)),
  }),

  // Router de Opções de Medicamentos (Configuráveis)
  opcoesMedicamentos: router({
    list: protectedProcedure
      .query(async () => {
        // Inicializar opções padrão se não existirem
        await inicializarOpcoesPadrao();
        return getOpcoesMedicamentos();
      }),
    
    create: protectedProcedure
      .input(z.object({
        codigo: z.string().min(1),
        nome: z.string().min(1),
        descricaoPadrao: z.string().optional(),
        permiteTextoLivre: z.number().optional().default(0),
      }))
      .mutation(({ input }) => createOpcaoMedicamento({
        ...input,
        sistema: 0, // Opções criadas pelo usuário não são do sistema
      })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricaoPadrao: z.string().optional(),
        permiteTextoLivre: z.number().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateOpcaoMedicamento(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteOpcaoMedicamento(input.id)),
  }),

  // Router de Histórico de Textos (Autocomplete)
  historicoTextos: router({
    // Buscar sugestões ordenadas por frequência de uso
    getSugestoes: protectedProcedure
      .input(z.object({
        tipo: z.enum(["observacao", "conduta_complementacao", "historia_patologica", "historia_social", "historia_familiar", "us_biometria", "us_avaliacao_anatomica", "us_observacoes", "eco_conclusao", "us_seguimento_observacoes", "hipotese_diagnostica", "detalhamento_queixa_urgencia", "toque_vaginal", "usg_hoje", "auf_urgencia", "outra_conduta_urgencia"]),
        busca: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const { historicoTextos } = await import('../drizzle/schema');
        
        // Buscar textos do tipo especificado
        let query = db
          .select()
          .from(historicoTextos)
          .where(eq(historicoTextos.tipo, input.tipo))
          .orderBy(desc(historicoTextos.contadorUso), desc(historicoTextos.ultimoUso))
          .limit(20);
        
        const resultados = await query;
        
        // Se houver busca, filtrar por texto similar
        if (input.busca && input.busca.trim()) {
          const buscaLower = input.busca.toLowerCase();
          return resultados.filter(r => 
            r.texto.toLowerCase().includes(buscaLower)
          );
        }
        
        return resultados;
      }),
    
    // Registrar uso de texto (incrementar contador ou criar novo)
    registrarUso: protectedProcedure
      .input(z.object({
        tipo: z.enum(["observacao", "conduta_complementacao", "historia_patologica", "historia_social", "historia_familiar", "us_biometria", "us_avaliacao_anatomica", "us_observacoes", "eco_conclusao", "us_seguimento_observacoes", "hipotese_diagnostica", "detalhamento_queixa_urgencia", "toque_vaginal", "usg_hoje", "auf_urgencia", "outra_conduta_urgencia"]),
        texto: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const { historicoTextos } = await import('../drizzle/schema');
        
        // Buscar se o texto já existe
        const existente = await db
          .select()
          .from(historicoTextos)
          .where(
            and(
              eq(historicoTextos.tipo, input.tipo),
              eq(historicoTextos.texto, input.texto)
            )
          )
          .limit(1);
        
        if (existente.length > 0) {
          // Incrementar contador de uso
          await db
            .update(historicoTextos)
            .set({
              contadorUso: sql`${historicoTextos.contadorUso} + 1`,
              ultimoUso: new Date(),
            })
            .where(eq(historicoTextos.id, existente[0].id));
          
          return { id: existente[0].id, novo: false };
        } else {
          // Criar novo registro
          const [novoRegistro] = await db
            .insert(historicoTextos)
            .values({
              tipo: input.tipo,
              texto: input.texto,
              contadorUso: 1,
              ultimoUso: new Date(),
            });
          
          return { id: novoRegistro.insertId, novo: true };
        }
      }),
  }),

  // Lembretes de Conduta
  lembretes: router({
    // Listar lembretes pendentes de uma gestante
    pendentes: protectedProcedure
      .input(z.object({ gestanteId: z.number() }))
      .query(({ input }) => listarLembretesPendentes(input.gestanteId)),
    
    // Resolver lembretes (marcar como concluídos)
    resolver: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        consultaId: z.number(),
      }))
      .mutation(({ input }) => resolverLembretes(input.ids, input.consultaId)),
  }),

  // Router de Integração com Sistema Administrativo (Mapa Cirúrgico)
  integracao: router({
    // Sincronização em lote de cesáreas
    syncCesareas: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
        
        // Buscar todas as gestantes com data de cesárea e tipo cesariana
        const todasGestantes = await db
          .select({
            id: gestantes.id,
            nome: gestantes.nome,
            dataPartoProgramado: gestantes.dataPartoProgramado,
            tipoPartoDesejado: gestantes.tipoPartoDesejado,
            planoSaudeId: gestantes.planoSaudeId,
            hospitalParto: gestantes.hospitalParto,
          })
          .from(gestantes)
          .where(
            and(
              isNotNull(gestantes.dataPartoProgramado),
              eq(gestantes.tipoPartoDesejado, 'cesariana')
            )
          );
        
        if (todasGestantes.length === 0) {
          return { sucesso: 0, falhas: 0, total: 0, detalhes: [] };
        }
        
        // Buscar nomes dos planos de saúde para mapear convênio
        const { planosSaude } = await import('../drizzle/schema');
        const planos = await db.select().from(planosSaude);
        const planosMap = new Map(planos.map(p => [p.id, p.nome]));
        
        const gestantesParaSync = todasGestantes.map(g => ({
          id: g.id,
          nome: g.nome,
          dataPartoProgramado: String(g.dataPartoProgramado),
          planoSaudeNome: g.planoSaudeId ? planosMap.get(g.planoSaudeId) || undefined : undefined,
          hospitalParto: g.hospitalParto,
        }));
        
        const resultado = await sincronizarTodasCesareasComAdmin(gestantesParaSync);
        return resultado;
      }),
    
    // Verificar status da configuração de integração
    status: protectedProcedure
      .query(async () => {
        const adminUrl = process.env.ADMIN_SYSTEM_URL;
        const apiKey = process.env.ADMIN_INTEGRATION_API_KEY;
        return {
          configurado: !!(adminUrl && apiKey),
          urlConfigurada: !!adminUrl,
          apiKeyConfigurada: !!apiKey,
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
