import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as gestanteDb from "./gestante-db";
import { randomBytes, createHash } from "crypto";
import { sendVerificationCode } from "./email-service";
import { gerarPdfCartaoPrenatal } from "./gerarPdfCartao";
import { gerarHTMLCartaoCompleto, DadosPdfCompleto } from "./pdfTemplateCompleto";
import { gerarPdfComJsPDF } from "./htmlToPdf";
import { gerarTodosGraficos, DadoConsulta } from "./chartGenerator";
import { normalizeExamName } from "../shared/examNormalization";
import { storagePut } from "./storage";
import { arquivosExames, type InsertArquivoExame, users, medicos } from "../drizzle/schema";
import { getDb } from "./db";
import { sendWhatsApp } from "./whatsapp";
import { eq, and, inArray } from "drizzle-orm";

// Generate 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT-like token (simplified)
function generateToken(): string {
  return randomBytes(64).toString("hex");
}

// Calculate gestational age from DUM
function calculateIGFromDUM(dum: Date): { semanas: number; dias: number; totalDias: number } {
  const today = new Date();
  const diffTime = today.getTime() - dum.getTime();
  const totalDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { semanas, dias, totalDias };
}

// Calculate gestational age from ultrasound
function calculateIGFromUS(dataUS: Date, igSemanas: number, igDias: number): { semanas: number; dias: number; totalDias: number } {
  const today = new Date();
  const diffTime = today.getTime() - dataUS.getTime();
  const diasDesdeUS = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalDiasNoUS = igSemanas * 7 + igDias;
  const totalDias = totalDiasNoUS + diasDesdeUS;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { semanas, dias, totalDias };
}

// Calculate DPP (due date) - 280 days from DUM
function calculateDPP(dum: Date): string {
  const dpp = new Date(dum);
  dpp.setDate(dpp.getDate() + 280);
  return dpp.toISOString().split("T")[0];
}

// Calculate DPP from ultrasound
function calculateDPPFromUS(dataUS: Date, igSemanas: number, igDias: number): string {
  const totalDiasNoUS = igSemanas * 7 + igDias;
  const diasRestantes = 280 - totalDiasNoUS;
  const dpp = new Date(dataUS);
  dpp.setDate(dpp.getDate() + diasRestantes);
  return dpp.toISOString().split("T")[0];
}

// Generate marcos (milestones) based on DPP
function generateMarcos(dpp: string, dum: Date, ehRhNegativo: boolean = false) {
  const dppDate = new Date(dpp);
  
  const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split("T")[0];
  };
  
  const weekToDate = (week: number): string => {
    const date = new Date(dum);
    date.setDate(date.getDate() + week * 7);
    return date.toISOString().split("T")[0];
  };
  
  return [
    {
      nome: "Concepção",
      data: addDays(dum, 14),
      semana: 0,
      descricao: "Data estimada da concepção",
    },
    {
      nome: "Morfológico 1º Trimestre",
      dataInicio: weekToDate(11),
      dataFim: weekToDate(14),
      semana: "11-14",
      descricao: "Ultrassom morfológico do primeiro trimestre",
    },
    {
      nome: "13 Semanas",
      data: weekToDate(13),
      semana: 13,
      descricao: "Fim do primeiro trimestre",
    },
    {
      nome: "Morfológico 2º Trimestre",
      dataInicio: weekToDate(20),
      dataFim: weekToDate(24),
      semana: "20-24",
      descricao: "Ultrassom morfológico do segundo trimestre",
    },
    {
      nome: "Curva Glicêmica (TOTG 75g)",
      dataInicio: weekToDate(24),
      dataFim: weekToDate(28),
      semana: "24-28",
      descricao: "Teste de tolerância à glicose oral para rastreio de diabetes gestacional",
    },
    {
      nome: "Ecocardiograma Fetal",
      dataInicio: weekToDate(24),
      dataFim: weekToDate(28),
      semana: "24-28",
      descricao: "Avaliação cardíaca fetal detalhada",
    },
    {
      nome: "Vacina dTpa",
      data: weekToDate(27),
      semana: 27,
      descricao: "Vacina contra difteria, tétano e coqueluche",
    },
    ...(ehRhNegativo ? [{
      nome: "Vacina Anti-Rh (Imunoglobulina)",
      data: weekToDate(28),
      semana: 28,
      descricao: "Imunoglobulina anti-Rh para gestantes com fator Rh negativo",
    }] : []),
    {
      nome: "Vacina Bronquiolite",
      dataInicio: weekToDate(32),
      dataFim: weekToDate(36),
      semana: "32-36",
      descricao: "Vacina contra bronquiolite (VSR)",
    },
    {
      nome: "Estreptococo Grupo B",
      dataInicio: weekToDate(35),
      dataFim: weekToDate(37),
      semana: "35-37",
      descricao: "Pesquisa de Streptococcus do grupo B (swab vaginal/retal)",
    },
    {
      nome: "Termo Precoce",
      data: weekToDate(37),
      semana: 37,
      descricao: "Início do termo precoce",
    },
    {
      nome: "Termo Completo",
      data: weekToDate(39),
      semana: 39,
      descricao: "Início do termo completo",
    },
    {
      nome: "DPP (40 semanas)",
      data: dpp,
      semana: 40,
      descricao: "Data Provável do Parto",
    },
  ];
}

// Calculate weight gain curve based on pre-pregnancy BMI
function calculateWeightCurve(pesoInicial: number, altura: number) {
  const alturaM = altura / 100;
  const imc = pesoInicial / 1000 / (alturaM * alturaM);
  
  let ganhoMin: number, ganhoMax: number, categoria: string;
  
  if (imc < 18.5) {
    ganhoMin = 12.5;
    ganhoMax = 18;
    categoria = "Baixo Peso";
  } else if (imc < 25) {
    ganhoMin = 11.5;
    ganhoMax = 16;
    categoria = "Peso Adequado";
  } else if (imc < 30) {
    ganhoMin = 7;
    ganhoMax = 11.5;
    categoria = "Sobrepeso";
  } else {
    ganhoMin = 5;
    ganhoMax = 9;
    categoria = "Obesidade";
  }
  
  const curva = [
    { semana: 0, pesoMin: pesoInicial, pesoMax: pesoInicial, pesoIdeal: pesoInicial },
    { semana: 13, pesoMin: pesoInicial + (ganhoMin * 1000 * 0.125), pesoMax: pesoInicial + (ganhoMax * 1000 * 0.125), pesoIdeal: pesoInicial + ((ganhoMin + ganhoMax) / 2 * 1000 * 0.125) },
    { semana: 20, pesoMin: pesoInicial + (ganhoMin * 1000 * 0.35), pesoMax: pesoInicial + (ganhoMax * 1000 * 0.35), pesoIdeal: pesoInicial + ((ganhoMin + ganhoMax) / 2 * 1000 * 0.35) },
    { semana: 28, pesoMin: pesoInicial + (ganhoMin * 1000 * 0.6), pesoMax: pesoInicial + (ganhoMax * 1000 * 0.6), pesoIdeal: pesoInicial + ((ganhoMin + ganhoMax) / 2 * 1000 * 0.6) },
    { semana: 40, pesoMin: pesoInicial + (ganhoMin * 1000), pesoMax: pesoInicial + (ganhoMax * 1000), pesoIdeal: pesoInicial + ((ganhoMin + ganhoMax) / 2 * 1000) },
  ];
  
  return {
    imc: Math.round(imc * 100) / 100,
    categoria,
    ganhoTotalMin: ganhoMin,
    ganhoTotalMax: ganhoMax,
    curva,
  };
}

// Helper to safely parse date strings from database
function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined' || dateStr.trim() === '') {
    return null;
  }
  
  // Handle special values from DUM field
  const specialValues = ['Incerta', 'incerta', 'INCERTA', 'Incompatível com US', 'incompatível com us'];
  if (specialValues.some(val => dateStr.toLowerCase().includes(val.toLowerCase()))) {
    return null;
  }
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Middleware to validate gestante token
async function validateGestanteToken(token: string) {
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Token não fornecido" });
  }
  
  const session = await gestanteDb.getSessionByToken(token);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido ou expirado" });
  }
  
  const gestante = await gestanteDb.getGestanteById(session.gestanteId);
  if (!gestante) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Gestante não encontrada" });
  }
  
  return gestante;
}

export const gestanteRouter = router({
  // POST /auth/solicitar-codigo
  solicitarCodigo: publicProcedure
    .input(z.object({
      contato: z.string().email(),
      tipo: z.enum(["email", "sms", "whatsapp"]).default("email"),
    }))
    .mutation(async ({ input }) => {
      const gestante = await gestanteDb.getGestanteByEmail(input.contato);
      
      if (!gestante) {
        return {
          success: false,
          error: "Gestante não encontrada com este contato",
        };
      }
      
      const codigo = generateCode();
      const expiraEm = new Date();
      expiraEm.setMinutes(expiraEm.getMinutes() + 15); // 15 minutes
      
      await gestanteDb.createVerificationCode({
        gestanteId: gestante.id,
        codigo,
        tipo: "email",
        destino: input.contato,
        expiraEm,
      });
      
      // Send email with code via Resend
      console.log(`[Gestante Auth] Enviando código de verificação para ${input.contato}`);
      
      const emailResult = await sendVerificationCode({
        to: input.contato,
        code: codigo,
        gestanteNome: gestante.nome.split(" ")[0],
      });
      
      if (!emailResult.success) {
        console.error(`[Gestante Auth] Falha ao enviar email: ${emailResult.error}`);
        // Still return success but log the error - in test mode, code is logged
        console.log(`[Gestante Auth] Código de verificação (fallback): ${codigo}`);
      }
      
      return {
        success: true,
        message: emailResult.success 
          ? "Código enviado para seu email" 
          : "Código gerado (verifique os logs do servidor)",
        gestanteNome: gestante.nome.split(" ")[0],
        // In development, return code when email fails
        devCode: !emailResult.success ? codigo : undefined,
      };
    }),
  
  // POST /auth/validar
  validarCodigo: publicProcedure
    .input(z.object({
      contato: z.string().email(),
      codigo: z.string().length(6),
      dispositivo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Fixed verification code for Apple Review test account
      const TEST_EMAIL = "dreatnu@yahoo.com";
      const TEST_CODE = "123456";

      // Check if it's the Apple Review test account with fixed code
      if (input.contato.toLowerCase() === TEST_EMAIL && input.codigo === TEST_CODE) {
        const gestante = await gestanteDb.getGestanteByEmail(TEST_EMAIL);
        if (gestante) {
          const token = generateToken();
          const expiraEm = new Date();
          expiraEm.setDate(expiraEm.getDate() + 30);
          
          await gestanteDb.createSession({
            gestanteId: gestante.id,
            token,
            dispositivo: input.dispositivo || "Apple Review",
            expiraEm,
          });
          
          await gestanteDb.createLogAcesso({
            gestanteId: gestante.id,
            acao: "login_test_code",
          });
          
          return {
            success: true,
            token,
            gestante: {
              id: gestante.id,
              nome: gestante.nome,
              email: gestante.email,
            },
            expiraEm: expiraEm.toISOString(),
          };
        }
      }

      const codigoRecord = await gestanteDb.getValidVerificationCode(input.contato, input.codigo);
      
      if (!codigoRecord) {
        return {
          success: false,
          error: "Código inválido ou expirado",
        };
      }
      
      const gestante = await gestanteDb.getGestanteById(codigoRecord.gestanteId);
      if (!gestante) {
        return {
          success: false,
          error: "Gestante não encontrada",
        };
      }
      
      // Mark code as used
      await gestanteDb.markCodeAsUsed(codigoRecord.id);
      
      // Generate token
      const token = generateToken();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30); // 30 days
      
      await gestanteDb.createSession({
        gestanteId: gestante.id,
        token,
        dispositivo: input.dispositivo || null,
        expiraEm,
      });
      
      // Log access
      await gestanteDb.createLogAcesso({
        gestanteId: gestante.id,
        acao: "login",
      });
      
      return {
        success: true,
        token,
        gestante: {
          id: gestante.id,
          nome: gestante.nome,
          email: gestante.email,
        },
        expiraEm: expiraEm.toISOString(),
      };
    }),
  
  // POST /auth/login-com-senha (Apple App Store Review only)
  loginComSenha: publicProcedure
    .input(z.object({
      email: z.string().email(),
      senha: z.string(),
      dispositivo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Hardcoded credentials for Apple App Store Review test account
      const APPLE_TEST_EMAIL = "dreatnu@yahoo.com";
      const APPLE_TEST_PASSWORD = "MaisMulher2026!";
      
      if (input.email.toLowerCase() !== APPLE_TEST_EMAIL || input.senha !== APPLE_TEST_PASSWORD) {
        return {
          success: false as const,
          error: "Email ou senha incorretos.",
        };
      }
      
      // Buscar gestante pelo email
      const gestante = await gestanteDb.getGestanteByEmail(APPLE_TEST_EMAIL);
      if (!gestante) {
        return {
          success: false as const,
          error: "Email ou senha incorretos.",
        };
      }
      
      // Gerar token (mesmo formato do validarCodigo)
      const token = generateToken();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);
      
      // Criar sessão
      await gestanteDb.createSession({
        gestanteId: gestante.id,
        token,
        dispositivo: input.dispositivo || "Apple Review",
        expiraEm,
      });
      
      // Registrar log de acesso
      await gestanteDb.createLogAcesso({
        gestanteId: gestante.id,
        acao: "login_password",
      });
      
      console.log(`[Gestante Auth] Apple Review password login: ${APPLE_TEST_EMAIL}`);
      
      return {
        success: true as const,
        token,
        gestante: {
          id: gestante.id,
          nome: gestante.nome,
          email: gestante.email,
        },
        expiraEm: expiraEm.toISOString(),
      };
    }),

  // POST /auth/logout
  logout: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      await gestanteDb.deleteSession(input.token);
      return { success: true };
    }),
  
  // GET /me
  me: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      console.log('[DEBUG gestante.me] Input recebido:', JSON.stringify(input));
      try {
        const gestanteRaw = await validateGestanteToken(input.token);
        console.log('[DEBUG] gestanteRaw type:', typeof gestanteRaw);
        console.log('[DEBUG] gestanteRaw keys:', Object.keys(gestanteRaw));
        
        // Convert to JSON and parse back to remove any Date objects
        const gestanteJSON = JSON.stringify(gestanteRaw);
        const gestanteParsed = JSON.parse(gestanteJSON);
        
        // Remove Date fields that cause serialization issues
        const { createdAt, updatedAt, userId, ...gestanteData } = gestanteParsed;
        const gestante = gestanteData;
        console.log('[DEBUG gestante.me] Gestante encontrada:', gestante.id, gestante.nome);
      
      // Calculate gestational ages
      console.log('[DEBUG] gestante.dum:', gestante.dum, 'type:', typeof gestante.dum);
      console.log('[DEBUG] gestante.dataUltrassom:', gestante.dataUltrassom, 'type:', typeof gestante.dataUltrassom);
      console.log('[DEBUG] gestante.dataNascimento:', gestante.dataNascimento, 'type:', typeof gestante.dataNascimento);
      console.log('[DEBUG] gestante.createdAt:', gestante.createdAt, 'type:', typeof gestante.createdAt);
      console.log('[DEBUG] gestante.updatedAt:', gestante.updatedAt, 'type:', typeof gestante.updatedAt);
      
      const dum = parseDateSafe(gestante.dum);
      const dataUS = parseDateSafe(gestante.dataUltrassom);
      console.log('[DEBUG] dum parsed:', dum);
      console.log('[DEBUG] dataUS parsed:', dataUS);
      
      let igDUM = null;
      let igUS = null;
      let dppDUM = null;
      let dppUS = null;
      
      if (dum) {
        try {
          igDUM = calculateIGFromDUM(dum);
          dppDUM = calculateDPP(dum);
          console.log('[DEBUG] Calculated igDUM and dppDUM successfully');
        } catch (err) {
          console.error('[ERROR] Failed to calculate from DUM:', err);
        }
      }
      
      if (dataUS && gestante.igUltrassomSemanas !== null) {
        try {
          igUS = calculateIGFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
          dppUS = calculateDPPFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
          console.log('[DEBUG] Calculated igUS and dppUS successfully');
        } catch (err) {
          console.error('[ERROR] Failed to calculate from US:', err);
        }
      }
      
        console.log('[DEBUG gestante.me] Retornando dados...');
        console.log('[DEBUG] igDUM:', JSON.stringify(igDUM));
        console.log('[DEBUG] igUS:', JSON.stringify(igUS));
        console.log('[DEBUG] dppDUM:', dppDUM, 'type:', typeof dppDUM);
        console.log('[DEBUG] dppUS:', dppUS, 'type:', typeof dppUS);
        
        // Convert Date objects to ISO strings to avoid Superjson serialization errors
        const dppDUMStr = typeof dppDUM === 'string' ? dppDUM : null;
        const dppUSStr = typeof dppUS === 'string' ? dppUS : null;
        
        // Convert all date fields to strings safely - handle both string and Date objects
        const convertToDateString = (val: any): string | null => {
          if (!val) return null;
          if (val instanceof Date) {
            return isNaN(val.getTime()) ? null : val.toISOString().split('T')[0];
          }
          const str = String(val);
          if (str === 'null' || str === 'undefined' || str.trim() === '') return null;
          // Try to parse and validate
          try {
            const d = new Date(str);
            return isNaN(d.getTime()) ? null : str.split('T')[0];
          } catch {
            return null;
          }
        };
        
        const dataNascimentoStr = convertToDateString(gestante.dataNascimento);
        const dumStr = convertToDateString(gestante.dum);
        const dataUltrassomStr = convertToDateString(gestante.dataUltrassom);
        
        console.log('[DEBUG] dppDUMStr:', dppDUMStr);
        console.log('[DEBUG] dppUSStr:', dppUSStr);
        console.log('[DEBUG] dataNascimentoStr:', dataNascimentoStr);
        console.log('[DEBUG] dumStr:', dumStr);
        console.log('[DEBUG] dataUltrassomStr:', dataUltrassomStr);
        
        // Convert all fields to JSON-safe types - ONLY primitives
        const result = {
          id: String(gestante.id),
          nome: String(gestante.nome || ''),
          email: gestante.email ? String(gestante.email) : null,
          telefone: gestante.telefone ? String(gestante.telefone) : null,
          dataNascimento: dataNascimentoStr,
          dum: dumStr,
          dataUltrassom: dataUltrassomStr,
          igUltrassomSemanas: gestante.igUltrassomSemanas !== null ? Number(gestante.igUltrassomSemanas) : null,
          igUltrassomDias: gestante.igUltrassomDias !== null ? Number(gestante.igUltrassomDias) : null,
          altura: gestante.altura !== null ? Number(gestante.altura) : null,
          pesoInicial: gestante.pesoInicial !== null ? Number(gestante.pesoInicial) : null,
          planoSaudeId: gestante.planoSaudeId ? String(gestante.planoSaudeId) : null,
          medicoId: gestante.medicoId ? String(gestante.medicoId) : null,
          tipoPartoDesejado: gestante.tipoPartoDesejado ? String(gestante.tipoPartoDesejado) : null,
          gesta: gestante.gesta !== null ? Number(gestante.gesta) : null,
          para: gestante.para !== null ? Number(gestante.para) : null,
          partosNormais: gestante.partosNormais !== null ? Number(gestante.partosNormais) : null,
          cesareas: gestante.cesareas !== null ? Number(gestante.cesareas) : null,
          abortos: gestante.abortos !== null ? Number(gestante.abortos) : null,
          observacoes: gestante.observacoes ? String(gestante.observacoes) : null,
          calculado: {
            igDUM: igDUM ? { semanas: Number(igDUM.semanas), dias: Number(igDUM.dias), totalDias: Number(igDUM.totalDias) } : null,
            igUS: igUS ? { semanas: Number(igUS.semanas), dias: Number(igUS.dias), totalDias: Number(igUS.totalDias) } : null,
            dppDUM: dppDUMStr,
            dppUS: dppUSStr,
          },
        };
        
        console.log('[DEBUG] Returning result:', JSON.stringify(result).substring(0, 200));
        
        // Try to serialize with Superjson to catch exact error
        try {
          const testSerialization = JSON.stringify(result);
          console.log('[DEBUG] JSON serialization OK');
        } catch (serErr) {
          console.error('[ERROR] JSON serialization failed:', serErr);
          throw serErr;
        }
        
        return result;
      } catch (error) {
        console.error('[ERROR gestante.me] FATAL ERROR CAUGHT!');
        console.error('[ERROR] Error object:', error);
        console.error('[ERROR] Error type:', typeof error);
        console.error('[ERROR] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack');
        if (error instanceof Error && 'cause' in error) {
          console.error('[ERROR] Error cause:', error.cause);
        }
        throw error;
      }
    }),
  
  // GET /marcos
  marcos: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      
      const dumValida = gestante.dum && gestante.dum !== 'Incerta' && !gestante.dum.includes('Compatível') && !gestante.dum.includes('Incompatível');
      const dum = dumValida ? new Date(gestante.dum + 'T12:00:00') : null;
      const dataUS = gestante.dataUltrassom ? new Date(gestante.dataUltrassom + 'T12:00:00') : null;
      
      let dpp: string;
      
      if (dataUS && gestante.igUltrassomSemanas !== null) {
        dpp = calculateDPPFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
      } else if (dum) {
        dpp = calculateDPP(dum);
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "DUM ou ultrassom não cadastrados" });
      }
      
      const dumForMarcos = dum || new Date(new Date(dpp).getTime() - 280 * 24 * 60 * 60 * 1000);
      
      // Verificar se gestante é Rh negativo
      const fatoresRiscoList = await gestanteDb.getFatoresRiscoByGestanteId(gestante.id);
      const ehRhNegativo = fatoresRiscoList.some((f: any) => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
      
      return {
        dpp,
        marcos: generateMarcos(dpp, dumForMarcos, ehRhNegativo),
      };
    }),
  
  // GET /consultas
  consultas: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      const consultasList = await gestanteDb.getConsultasByGestanteId(gestante.id);
      
      return {
        consultas: consultasList.map(c => ({
          ...c,
          dataConsulta: c.dataConsulta ? new Date(c.dataConsulta).toISOString().split("T")[0] : null,
          alturaUterina: c.alturaUterina != null ? Math.round(c.alturaUterina / 10 * 10) / 10 : null,
        })),
      };
    }),
  
  // GET /exames
  exames: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      const examesList = await gestanteDb.getExamesByGestanteId(gestante.id);
      
      // Group exams by name - normalizar nomes para evitar duplicatas de capitalização
      const examesByName: Record<string, Array<{ data: string; resultado: string; trimestre: number }>> = {};
      
      for (const exame of examesList) {
        const nomeNormalizado = normalizeExamName(exame.nomeExame);
        if (!examesByName[nomeNormalizado]) {
          examesByName[nomeNormalizado] = [];
        }
        examesByName[nomeNormalizado].push({
          data: exame.dataExame ? new Date(exame.dataExame).toISOString().split("T")[0] : "",
          resultado: exame.resultado || "",
          trimestre: exame.trimestre,
        });
      }
      
      return {
        exames: Object.entries(examesByName).map(([nome, resultados]) => ({
          nome,
          resultados,
        })),
      };
    }),
  
  // GET /ultrassons
  ultrassons: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      const ultrassonsList = await gestanteDb.getUltrassonsByGestanteId(gestante.id);
      
      return {
        ultrassons: ultrassonsList.map(u => ({
          ...u,
          dataExame: u.dataExame ? new Date(u.dataExame).toISOString().split("T")[0] : null,
        })),
      };
    }),
  
  
  // GET /crescimento-fetal — Dados do gráfico de peso fetal FMF + peso/comprimento personalizado
  crescimentoFetal: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      const ultrassonsList = await gestanteDb.getUltrassonsByGestanteId(gestante.id);

      // Importar tabela FMF
      const { FMF_PESO } = await import('../shared/fmfPercentis');

      // ── Helpers ──
      function parsePeso(v: string | undefined | null): number {
        if (!v) return 0;
        const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
      }

      function parsePercentil(v: string | undefined | null): number | null {
        if (!v) return null;
        const n = parseFloat(String(v).replace(',', '.').replace(/[^0-9.]/g, ''));
        return isNaN(n) || n <= 0 ? null : n;
      }

      function interpolarFMF(
        igDecimal: number,
        tabela: typeof FMF_PESO,
        campo: keyof (typeof FMF_PESO)[0]
      ): number {
        const igFloor = Math.floor(igDecimal);
        const igCeil = Math.ceil(igDecimal);
        const frac = igDecimal - igFloor;
        const rowFloor = tabela.find((r) => r.ig === igFloor);
        const rowCeil = tabela.find((r) => r.ig === igCeil);
        if (!rowFloor && !rowCeil) return 0;
        if (!rowFloor) return rowCeil![campo] as number;
        if (!rowCeil || igFloor === igCeil) return rowFloor[campo] as number;
        return (rowFloor[campo] as number) * (1 - frac) + (rowCeil[campo] as number) * frac;
      }

      /**
       * Dado um percentil numérico (ex: 37.6) e uma IG decimal,
       * interpola o peso esperado naquele percentil usando a tabela FMF.
       * Usa interpolação log-linear entre os percentis tabelados.
       */
      function pesoNoPercentil(igDecimal: number, percentil: number): number {
        // Percentis tabelados e seus campos
        const pcts = [
          { p: 1, campo: 'p1' as const },
          { p: 3, campo: 'p3' as const },
          { p: 10, campo: 'p10' as const },
          { p: 50, campo: 'p50' as const },
          { p: 90, campo: 'p90' as const },
          { p: 97, campo: 'p97' as const },
          { p: 99, campo: 'p99' as const },
        ];

        // Obter valores interpolados para esta IG
        const valores = pcts.map(pc => ({
          p: pc.p,
          valor: interpolarFMF(igDecimal, FMF_PESO, pc.campo),
        }));

        // Se percentil <= 1 ou >= 99, retornar extremo
        if (percentil <= 1) return valores[0].valor;
        if (percentil >= 99) return valores[valores.length - 1].valor;

        // Encontrar intervalo
        for (let i = 0; i < valores.length - 1; i++) {
          if (percentil >= valores[i].p && percentil <= valores[i + 1].p) {
            const frac = (percentil - valores[i].p) / (valores[i + 1].p - valores[i].p);
            return Math.round(valores[i].valor + frac * (valores[i + 1].valor - valores[i].valor));
          }
        }
        return valores[3].valor; // fallback P50
      }

      /**
       * Estima comprimento fetal (cm) a partir do peso (g).
       * Fórmula empírica baseada em dados da OMS/Hadlock:
       * comprimento ≈ 0.24 * peso^0.55 (ajustado para fetos 22-40 semanas)
       * Alternativa mais simples: tabela de comprimento por IG.
       * Usaremos tabela de comprimento médio por IG (OMS) e ajustaremos pelo percentil.
       */
      function comprimentoPorIG(igSemanas: number): number {
        // Comprimento médio (cm) por IG — dados OMS/Hadlock
        const tabela: Record<number, number> = {
          22: 27.8, 23: 28.9, 24: 30.0, 25: 34.6, 26: 35.6,
          27: 36.6, 28: 37.6, 29: 38.6, 30: 39.9, 31: 41.1,
          32: 42.4, 33: 43.7, 34: 45.0, 35: 46.2, 36: 47.4,
          37: 48.6, 38: 49.8, 39: 50.7, 40: 51.2,
        };
        const igFloor = Math.max(22, Math.min(40, Math.floor(igSemanas)));
        const igCeil = Math.min(40, igFloor + 1);
        const frac = igSemanas - igFloor;
        const vFloor = tabela[igFloor] || 27.8;
        const vCeil = tabela[igCeil] || vFloor;
        return parseFloat((vFloor + frac * (vCeil - vFloor)).toFixed(1));
      }

      // ── Calcular IG atual ──
      const dataUS = gestante.dataUltrassom ? new Date(gestante.dataUltrassom + 'T12:00:00') : null;
      const dumValida = gestante.dum && gestante.dum !== 'Incerta' && !gestante.dum.includes('Compatível') && !gestante.dum.includes('Incompatível');
      const dum = dumValida ? new Date(gestante.dum + 'T12:00:00') : null;

      let igAtualSemanas: number | null = null;
      let igAtualDias: number | null = null;

      if (dataUS && gestante.igUltrassomSemanas !== null) {
        const hoje = new Date();
        const diffDias = Math.floor((hoje.getTime() - dataUS.getTime()) / (1000 * 60 * 60 * 24));
        const totalDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diffDias;
        igAtualSemanas = Math.floor(totalDias / 7);
        igAtualDias = totalDias % 7;
      } else if (dum) {
        const hoje = new Date();
        const totalDias = Math.floor((hoje.getTime() - dum.getTime()) / (1000 * 60 * 60 * 24));
        igAtualSemanas = Math.floor(totalDias / 7);
        igAtualDias = totalDias % 7;
      }

      // ── Pontos do gráfico de peso fetal ──
      const pontosPesoFetal = (ultrassonsList as any[])
        .filter((us: any) => us.dataExame && us.dados?.pesoFetal)
        .map((us: any) => {
          const peso = parsePeso(us.dados.pesoFetal);
          if (peso <= 0) return null;

          // Calcular IG pelo 1º US do cadastro
          let igSemDecimal: number | null = null;
          if (dataUS && gestante.igUltrassomSemanas !== null) {
            const dtExame = new Date(us.dataExame + 'T12:00:00');
            const diffMs = dtExame.getTime() - dataUS.getTime();
            const diffDias = diffMs / (1000 * 60 * 60 * 24);
            const igTotalDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diffDias;
            igSemDecimal = igTotalDias / 7;
          }

          return {
            dataExame: us.dataExame,
            pesoGramas: peso,
            igSemanas: igSemDecimal ? parseFloat(igSemDecimal.toFixed(2)) : null,
            percentilPeso: parsePercentil(us.dados?.percentilPeso) ?? parsePercentil(us.dados?.percentil),
          };
        })
        .filter((p: any) => p !== null && p.igSemanas !== null && p.igSemanas >= 21 && p.igSemanas <= 41);

      // ── Peso e comprimento personalizados ──
      // Regra: a partir de 22 semanas, SE houver ultrassom com percentilPeso,
      // usar esse percentil para estimar peso atual na IG atual.
      // Caso contrário, retornar null (app mostrará média ou nada).
      let pesoEstimadoPersonalizado: number | null = null;
      let comprimentoEstimado: number | null = null;
      let percentilUtilizado: number | null = null;
      let fontePercentil: string | null = null;

      if (igAtualSemanas !== null && igAtualSemanas >= 22) {
        const igDecimal = igAtualSemanas + (igAtualDias || 0) / 7;

        // Buscar o ultrassom mais recente com percentilPeso
        const ultrassonsComPercentil = (ultrassonsList as any[])
          .filter((us: any) => {
            const pct = parsePercentil(us.dados?.percentilPeso) ?? parsePercentil(us.dados?.percentil);
            return pct !== null && us.dataExame;
          })
          .sort((a: any, b: any) => {
            // Mais recente primeiro
            return b.dataExame.localeCompare(a.dataExame);
          });

        if (ultrassonsComPercentil.length > 0) {
          const usRecente = ultrassonsComPercentil[0];
          percentilUtilizado = parsePercentil(usRecente.dados.percentilPeso) ?? parsePercentil(usRecente.dados.percentil);
          fontePercentil = `Ultrassom de ${usRecente.dataExame}`;

          if (percentilUtilizado !== null) {
            pesoEstimadoPersonalizado = pesoNoPercentil(igDecimal, percentilUtilizado);
            // Comprimento: usar tabela OMS por IG (ajuste fino pelo percentil é mínimo)
            // Bebês maiores tendem a ser ligeiramente mais compridos
            const comprBase = comprimentoPorIG(igDecimal);
            // Ajuste sutil: ±5% para percentis extremos
            const fatorAjuste = 1 + (percentilUtilizado - 50) / 50 * 0.05;
            comprimentoEstimado = parseFloat((comprBase * fatorAjuste).toFixed(1));
          }
        }
      }

      // ── Tabela FMF completa para o gráfico ──
      const tabelaFMF = FMF_PESO.map(row => ({
        ig: row.ig,
        p1: row.p1,
        p3: row.p3,
        p10: row.p10,
        p50: row.p50,
        p90: row.p90,
        p97: row.p97,
        p99: row.p99,
      }));

      return {
        // Dados da gestante para cálculo de IG
        igAtual: igAtualSemanas !== null ? {
          semanas: igAtualSemanas,
          dias: igAtualDias || 0,
          decimal: parseFloat((igAtualSemanas + (igAtualDias || 0) / 7).toFixed(2)),
        } : null,
        dataUltrassom: gestante.dataUltrassom || null,
        igUltrassomSemanas: gestante.igUltrassomSemanas,
        igUltrassomDias: gestante.igUltrassomDias || 0,

        // Pontos medidos nos ultrassons (para plotar no gráfico)
        pontosPesoFetal,

        // Tabela FMF completa (para desenhar as curvas de percentis)
        tabelaFMF,

        // Peso e comprimento personalizados para a IG atual
        estimativaPersonalizada: {
          disponivel: pesoEstimadoPersonalizado !== null,
          pesoGramas: pesoEstimadoPersonalizado,
          comprimentoCm: comprimentoEstimado,
          percentilUtilizado,
          fontePercentil,
          igCalculoSemanas: igAtualSemanas,
          igCalculoDias: igAtualDias || 0,
        },
      };
    }),

  // POST /gerar-pdf-cartao
  gerarPdfCartao: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      const consultas = await gestanteDb.getConsultasByGestanteId(gestante.id);
      const ultrassons = await gestanteDb.getUltrassonsByGestanteId(gestante.id);
      const exames = await gestanteDb.getExamesByGestanteId(gestante.id);
      const fatoresRisco = await gestanteDb.getFatoresRiscoByGestanteId(gestante.id);
      const medicamentos = await gestanteDb.getMedicamentosByGestanteId(gestante.id);
      
      let idade = null;
      if (gestante.dataNascimento) {
        const dataNasc = new Date(gestante.dataNascimento);
        const hoje = new Date();
        idade = Math.floor((hoje.getTime() - dataNasc.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      }
      let dppDUM = null;
      if (gestante.dum && gestante.dum !== 'Incerta' && !gestante.dum.includes('Compatível') && !gestante.dum.includes('Incompatível')) {
        const dum = new Date(gestante.dum + 'T12:00:00');
        if (!isNaN(dum.getTime())) {
          const dpp = new Date(dum);
          dpp.setDate(dpp.getDate() + 280);
          dppDUM = dpp.toISOString().split('T')[0];
        }
      }
      
      // Agrupar exames por trimestre
      // Os exames vêm da tabela resultadosExames com campos: nomeExame, trimestre, resultado, dataExame
      const examesAgrupados: { nome: string; trimestre1?: { resultado: string; data?: string }; trimestre2?: { resultado: string; data?: string }; trimestre3?: { resultado: string; data?: string } }[] = [];
      
      // Agrupar por nome de exame
      const examesPorNome = new Map<string, { nome: string; trimestre1?: { resultado: string; data?: string }; trimestre2?: { resultado: string; data?: string }; trimestre3?: { resultado: string; data?: string } }>();
      
      exames.forEach((ex: any) => {
        const nomeExame = normalizeExamName(ex.nomeExame);
        if (!examesPorNome.has(nomeExame)) {
          examesPorNome.set(nomeExame, { nome: nomeExame });
        }
        
        const exameAgrupado = examesPorNome.get(nomeExame)!;
        // Trimestre 0 = exame sem trimestre (ex: Tipagem sanguínea) -> mostrar no 1º Tri
        const triNum = ex.trimestre === 0 ? 1 : ex.trimestre;
        const key = `trimestre${triNum}` as 'trimestre1' | 'trimestre2' | 'trimestre3';
        
        // Só adicionar se tiver resultado e não sobrescrever existente
        if (ex.resultado && !exameAgrupado[key]) {
          exameAgrupado[key] = {
            resultado: ex.resultado,
            data: ex.dataExame ? new Date(ex.dataExame).toISOString().split('T')[0] : undefined
          };
        }
      });
      
      // Converter Map para array e filtrar exames sem resultados
      examesPorNome.forEach((exame) => {
        if (exame.trimestre1 || exame.trimestre2 || exame.trimestre3) {
          examesAgrupados.push(exame);
        }
      });
      
      // Calcular marcos importantes
      let marcos: any[] = [];
      let dataBase: Date | null = null;
      let igBaseSemanas = 0;
      let igBaseDias = 0;
      
      if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
        dataBase = new Date(gestante.dataUltrassom + 'T12:00:00');
        igBaseSemanas = gestante.igUltrassomSemanas;
        igBaseDias = gestante.igUltrassomDias || 0;
      } else if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
        dataBase = new Date(gestante.dum + 'T12:00:00');
      }
      
      // Verificar se gestante é Rh negativo
      const ehRhNegativo = fatoresRisco.some((f: any) => f.tipo === 'fator_rh_negativo' && f.ativo === 1);

      if (dataBase) {
        const marcosDefinidos: Array<{ titulo: string; semanaInicio: number; semanaFim: number | null; diasInicio?: number; diasFim?: number }> = [
          { titulo: 'Concepcao', semanaInicio: 2, semanaFim: null, diasInicio: 0 },
          { titulo: '1o Ultrassom', semanaInicio: 6, semanaFim: 9 },
          { titulo: 'Morfologico 1o Tri', semanaInicio: 11, semanaFim: 14, diasInicio: 5, diasFim: 3 },
          { titulo: '13 Semanas', semanaInicio: 13, semanaFim: null, diasInicio: 0 },
          { titulo: 'Morfologico 2o Tri', semanaInicio: 20, semanaFim: 24, diasInicio: 0, diasFim: 6 },
          { titulo: 'TOTG 75g', semanaInicio: 24, semanaFim: 28 },
          { titulo: 'Ecocardiograma Fetal', semanaInicio: 24, semanaFim: 28 },
          { titulo: 'Vacina dTpa', semanaInicio: 27, semanaFim: null, diasInicio: 0 },
          ...(ehRhNegativo ? [{ titulo: 'Vacina Anti-Rh (Imunoglobulina)', semanaInicio: 28, semanaFim: null as number | null, diasInicio: 0 }] : []),
          { titulo: 'Vacina Bronquiolite', semanaInicio: 32, semanaFim: 36 },
          { titulo: 'Estreptococo Grupo B', semanaInicio: 35, semanaFim: 37 },
          { titulo: 'Termo Precoce', semanaInicio: 37, semanaFim: null, diasInicio: 0 },
          { titulo: 'Termo Completo', semanaInicio: 39, semanaFim: null, diasInicio: 0 },
          { titulo: 'DPP (40 semanas)', semanaInicio: 40, semanaFim: null, diasInicio: 0 },
        ];
        
        marcos = marcosDefinidos.map(m => {
          const diasInicioOffset = m.diasInicio || 0;
          const diasAteSemanaInicio = ((m.semanaInicio - igBaseSemanas) * 7) - igBaseDias + diasInicioOffset;
          const dataEstimada = new Date(dataBase!.getTime() + (diasAteSemanaInicio * 24 * 60 * 60 * 1000));
          if (m.semanaFim === null) {
            return {
              titulo: m.titulo,
              data: dataEstimada.toISOString().split('T')[0],
              periodo: `${m.semanaInicio}s`
            };
          } else {
            const diasFimOffset = m.diasFim || 0;
            const diasAteSemanaFim = ((m.semanaFim - igBaseSemanas) * 7) - igBaseDias + diasFimOffset;
            const dataFim = new Date(dataBase!.getTime() + (diasAteSemanaFim * 24 * 60 * 60 * 1000));
            return {
              titulo: m.titulo,
              data: dataEstimada.toISOString().split('T')[0],
              dataFim: dataFim.toISOString().split('T')[0],
              periodo: `${m.semanaInicio}-${m.semanaFim}s`
            };
          }
        });
      }
      
      // Calcular DPP pelo US
      let dppUS = null;
      if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
        const usDate = new Date(gestante.dataUltrassom + 'T12:00:00');
        const diasRestantes = (40 * 7) - ((gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0));
        const dppUSDate = new Date(usDate.getTime() + diasRestantes * 24 * 60 * 60 * 1000);
        dppUS = dppUSDate.toISOString().split('T')[0];
      }
      
      // Preparar dados para gráficos
      const dadosConsultasGraficos: DadoConsulta[] = consultas.map((c: any) => {
        // Calcular IG em semanas para cada consulta
        let igSemanas: number | undefined;
        if (c.igSemanas) {
          igSemanas = c.igSemanas;
        } else if (c.igDumSemanas) {
          igSemanas = c.igDumSemanas;
        } else if (c.igUltrassomSemanas) {
          igSemanas = c.igUltrassomSemanas;
        }
        return {
          dataConsulta: c.dataConsulta ? new Date(c.dataConsulta).toISOString().split('T')[0] : '',
          igSemanas,
          peso: c.peso ? c.peso / 1000 : null, // Converter de gramas para kg
          au: c.alturaUterina ? (c.alturaUterina === -1 ? null : c.alturaUterina / 10) : null, // Converter para cm
          paSistolica: c.pressaoSistolica || null,
          paDiastolica: c.pressaoDiastolica || null,
        };
      });

      // Gerar gráficos como imagens base64
      const graficosGerados = await gerarTodosGraficos(dadosConsultasGraficos);

      // Preparar dados brutos para gráficos nativos jsPDF (sem dependência de fontes)
      const dadosGraficosNativos = {
        peso: dadosConsultasGraficos
          .filter(c => c.peso !== null && c.igSemanas != null)
          .map(c => ({ igSemanas: c.igSemanas!, valor: c.peso! })),
        au: dadosConsultasGraficos
          .filter(c => c.au !== null && c.igSemanas != null)
          .map(c => ({ igSemanas: c.igSemanas!, valor: c.au! })),
        pa: dadosConsultasGraficos
          .filter(c => c.paSistolica !== null && c.paDiastolica !== null && c.igSemanas != null)
          .map(c => ({ igSemanas: c.igSemanas!, sistolica: c.paSistolica!, diastolica: c.paDiastolica! })),
      };

      const dadosPdf: DadosPdfCompleto = {
        graficos: {
          peso: graficosGerados.graficoPeso || undefined,
          au: graficosGerados.graficoAU || undefined,
          pa: graficosGerados.graficoPA || undefined,
        },
        // Dados brutos para gráficos nativos jsPDF
        dadosGraficos: dadosGraficosNativos,
        // Dados para curva de peso ideal
        pesoInicial: gestante.pesoInicial || null,
        altura: gestante.altura || null,
        gestante: {
          nome: gestante.nome,
          idade: idade,
          dum: gestante.dum ? (gestante.dum.includes('Incerta') || gestante.dum.includes('Compatível') || gestante.dum.includes('Incompatível') ? gestante.dum : (() => { const d = new Date(gestante.dum + 'T12:00:00'); return isNaN(d.getTime()) ? gestante.dum : d.toISOString().split('T')[0]; })()) : null,
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
          au: c.alturaUterina != null ? Math.round(c.alturaUterina / 10 * 10) / 10 : null,
          bcf: c.bcf,
          mf: c.movimentosFetais ? 1 : null,
          edema: c.edema || null,
          conduta: c.conduta,
          condutaComplementacao: c.condutaComplementacao,
          observacoes: c.observacoes,
          queixas: c.queixas || null,
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
      // Gerar PDF usando jsPDF (100% JavaScript, sem dependências externas)
      const pdfBuffer = await gerarPdfComJsPDF(dadosPdf);
      const pdfBase64 = pdfBuffer.toString('base64');
      const nomeGestante = gestante.nome.replace(/\s+/g, '-').toLowerCase();
      const filename = `cartao-prenatal-${nomeGestante}.pdf`;
      return {
        success: true,
        pdf: pdfBase64,
        filename: filename,
      };
    }),
  
  // GET /peso
  peso: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const gestante = await validateGestanteToken(input.token);
      const consultasList = await gestanteDb.getConsultasByGestanteId(gestante.id);
      
      if (!gestante.pesoInicial || !gestante.altura) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Peso inicial ou altura não cadastrados" });
      }
      
      const dumValida = gestante.dum && gestante.dum !== 'Incerta' && !gestante.dum.includes('Compatível') && !gestante.dum.includes('Incompatível');
      const dum = dumValida ? new Date(gestante.dum + 'T12:00:00') : null;
      const dataUS = gestante.dataUltrassom ? new Date(gestante.dataUltrassom + 'T12:00:00') : null;
      
      const weightData = calculateWeightCurve(gestante.pesoInicial, gestante.altura);
      
      // Build weight data from consultations
      const dadosPeso = consultasList
        .filter(c => c.peso && c.dataConsulta)
        .map(c => {
          const dataConsulta = new Date(c.dataConsulta!);
          let igSemanas = 0;
          
          if (dataUS && gestante.igUltrassomSemanas !== null) {
            const ig = calculateIGFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
            const diffDays = Math.floor((dataConsulta.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            igSemanas = Math.round((ig.totalDias + diffDays) / 7 * 100) / 100;
          } else if (dum) {
            const diffDays = Math.floor((dataConsulta.getTime() - dum.getTime()) / (1000 * 60 * 60 * 24));
            igSemanas = Math.round(diffDays / 7 * 100) / 100;
          }
          
          return {
            data: dataConsulta.toISOString().split("T")[0],
            peso: c.peso!,
            igSemanas,
          };
        })
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      return {
        pesoInicial: gestante.pesoInicial,
        altura: gestante.altura,
        imcPreGestacional: weightData.imc,
        categoriaIMC: weightData.categoria,
        dadosPeso,
        ganhoIdeal: {
          ganhoTotalMin: weightData.ganhoTotalMin,
          ganhoTotalMax: weightData.ganhoTotalMax,
          curva: weightData.curva,
        },
      };
    }),

  // Upload de exame pelo app mobile (autenticação por token de gestante)
  uploadExame: publicProcedure
    .input(z.object({
      token: z.string(),
      nomeArquivo: z.string(),
      tipoArquivo: z.string(), // MIME type: application/pdf, image/jpeg, image/png
      fileBase64: z.string(),
      tipoExame: z.enum(["laboratorial", "ultrassom"]),
      trimestre: z.number().optional(), // 1, 2 ou 3
      dataColeta: z.string().optional(), // Formato YYYY-MM-DD
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Passo 1 — Validar token da gestante
      const gestante = await validateGestanteToken(input.token);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
      
      try {
        // Passo 2 — Fazer upload no S3
        const fileBuffer = Buffer.from(input.fileBase64, 'base64');
        const tamanhoBytes = fileBuffer.length;
        
        // Limite de 16MB
        if (tamanhoBytes > 16 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Arquivo excede o limite de 16MB' });
        }
        
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extensao = input.nomeArquivo.split('.').pop() || 'pdf';
        const s3Key = `exames/${gestante.id}/${timestamp}-${randomSuffix}.${extensao}`;
        
        const { url: s3Url } = await storagePut(s3Key, fileBuffer, input.tipoArquivo);
        
        // Passo 3 — Registrar no banco com status pendente_revisao
        const arquivoData: InsertArquivoExame = {
          gestanteId: gestante.id,
          nomeArquivo: input.nomeArquivo,
          tipoArquivo: input.tipoArquivo,
          tamanhoBytes,
          s3Url,
          s3Key,
          senhaPdf: null,
          protegidoPorSenha: 0,
          trimestre: input.trimestre || null,
          dataColeta: input.dataColeta ? new Date(`${input.dataColeta}T12:00:00`) : null,
          observacoes: input.observacoes || null,
          tipoExame: input.tipoExame,
          status: "pendente_revisao",
          origemEnvio: "app_mobile",
          resultadoIA: null,
          iaProcessado: 0,
          iaErro: null,
          revisadoPor: null,
          revisadoEm: null,
        };
        
        const [result] = await db.insert(arquivosExames).values(arquivoData);
        const arquivoId = result.insertId;
        
        // Passo 4 — Notificar médico(s) por WhatsApp (fire-and-forget)
        (async () => {
          try {
            const destinatarios = await db.select({
              id: users.id,
              name: users.name,
              telefone: users.telefone,
              role: users.role,
            })
              .from(users)
              .where(
                and(
                  eq(users.clinicaId, gestante.clinicaId!),
                  inArray(users.role, ['admin', 'obstetra']),
                )
              );
            
            const tipoLabel = input.tipoExame === 'laboratorial' ? 'Exame Laboratorial' : 'Ultrassom';
            const nomeGestante = gestante.nome.split(' ').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
            
            for (const dest of destinatarios) {
              if (!dest.telefone) continue;
              
              const msg = `\u{1F4CB} *Novo exame recebido pelo App*\n\nA gestante *${nomeGestante}* enviou um *${tipoLabel}* pelo aplicativo.\n\n\u{1F4CE} Arquivo: ${input.nomeArquivo}\n\u23F3 Status: Aguardando sua revis\u00E3o\n\nAcesse a p\u00E1gina *Exames Pendentes* no sistema para revisar.`;
              
              try {
                const r = await sendWhatsApp({ to: dest.telefone, text: msg }, gestante.clinicaId!);
                if (r.success) {
                  console.log(`[uploadExame] WhatsApp enviado para ${dest.name} (${dest.role})`);
                } else {
                  console.error(`[uploadExame] Erro WhatsApp para ${dest.name}: ${r.error}`);
                }
              } catch (whatsErr) {
                console.error(`[uploadExame] Erro WhatsApp para ${dest.name}:`, whatsErr);
              }
              
              // Delay de 3s entre envios para respeitar rate limit
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } catch (notifError) {
            console.error('[uploadExame] Erro ao notificar m\u00E9dicos:', notifError);
          }
        })();
        
        // Passo 5 — Acionar IA em background (não bloquear a resposta)
        const gestanteDum = gestante.dum ? new Date(gestante.dum).toISOString().split('T')[0] : undefined;
        
        // Fire-and-forget: interpretação IA assíncrona
        (async () => {
          try {
            if (input.tipoExame === "laboratorial") {
              const { interpretarExamesComIA } = await import('./interpretarExames');
              const { resultados, dataColeta: dataColetaIA, trimestreExtraido, relatorio } = await interpretarExamesComIA(
                fileBuffer,
                input.tipoArquivo,
                undefined, // trimestre - deixar a IA detectar
                gestanteDum
              );
              
              // Atualizar o registro com os resultados da IA
              await db.update(arquivosExames)
                .set({
                  resultadoIA: { resultados, dataColeta: dataColetaIA, trimestreExtraido, relatorio },
                  iaProcessado: 1,
                })
                .where(eq(arquivosExames.id, Number(arquivoId)));
              
              console.log(`[uploadExame] IA laboratorial concluída para arquivo ${arquivoId}`);
            } else if (input.tipoExame === "ultrassom") {
              const { interpretarLaudoUltrassom } = await import('./interpretarUltrassom');
              const dados = await interpretarLaudoUltrassom(
                s3Url,
                "ultrassom_obstetrico",
                input.tipoArquivo
              );
              
              // Atualizar o registro com os resultados da IA
              await db.update(arquivosExames)
                .set({
                  resultadoIA: dados,
                  iaProcessado: 1,
                })
                .where(eq(arquivosExames.id, Number(arquivoId)));
              
              console.log(`[uploadExame] IA ultrassom concluída para arquivo ${arquivoId}`);
            }
          } catch (iaError: any) {
            console.error(`[uploadExame] Erro na IA para arquivo ${arquivoId}:`, iaError);
            try {
              await db.update(arquivosExames)
                .set({
                  iaProcessado: 1,
                  iaErro: iaError.message || 'Erro desconhecido na interpretação IA',
                })
                .where(eq(arquivosExames.id, Number(arquivoId)));
            } catch (updateError) {
              console.error(`[uploadExame] Erro ao salvar erro da IA para arquivo ${arquivoId}:`, updateError);
            }
          }
        })();
        
        // Passo 6 — Retornar resposta ao app
        return {
          success: true,
          id: Number(arquivoId),
          s3Url,
          status: "pendente_revisao" as const,
          mensagem: "Exame enviado com sucesso. Aguardando revisão do médico.",
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error('[uploadExame] Erro:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erro ao fazer upload do exame',
        });
      }
    }),
});
