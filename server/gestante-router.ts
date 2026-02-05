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
function generateMarcos(dpp: string, dum: Date) {
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
      nome: "Vacina dTpa",
      data: weekToDate(27),
      semana: 27,
      descricao: "Vacina contra difteria, tétano e coqueluche",
    },
    {
      nome: "Vacina Bronquiolite",
      dataInicio: weekToDate(32),
      dataFim: weekToDate(36),
      semana: "32-36",
      descricao: "Vacina contra bronquiolite (VSR)",
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
      
      const dum = gestante.dum ? new Date(gestante.dum) : null;
      const dataUS = gestante.dataUltrassom ? new Date(gestante.dataUltrassom) : null;
      
      let dpp: string;
      
      if (dataUS && gestante.igUltrassomSemanas !== null) {
        dpp = calculateDPPFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
      } else if (dum) {
        dpp = calculateDPP(dum);
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "DUM ou ultrassom não cadastrados" });
      }
      
      const dumForMarcos = dum || new Date(new Date(dpp).getTime() - 280 * 24 * 60 * 60 * 1000);
      
      return {
        dpp,
        marcos: generateMarcos(dpp, dumForMarcos),
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
      
      // Group exams by name - agora usando campos da tabela resultadosExames
      const examesByName: Record<string, Array<{ data: string; resultado: string; trimestre: number }>> = {};
      
      for (const exame of examesList) {
        if (!examesByName[exame.nomeExame]) {
          examesByName[exame.nomeExame] = [];
        }
        examesByName[exame.nomeExame].push({
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
      if (gestante.dum) {
        const dum = new Date(gestante.dum);
        const dpp = new Date(dum);
        dpp.setDate(dpp.getDate() + 280);
        dppDUM = dpp.toISOString().split('T')[0];
      }
      
      // Agrupar exames por trimestre
      // Os exames vêm da tabela resultadosExames com campos: nomeExame, trimestre, resultado, dataExame
      const examesAgrupados: { nome: string; trimestre1?: { resultado: string; data?: string }; trimestre2?: { resultado: string; data?: string }; trimestre3?: { resultado: string; data?: string } }[] = [];
      
      // Agrupar por nome de exame
      const examesPorNome = new Map<string, { nome: string; trimestre1?: { resultado: string; data?: string }; trimestre2?: { resultado: string; data?: string }; trimestre3?: { resultado: string; data?: string } }>();
      
      exames.forEach((ex: any) => {
        // Ignorar observações gerais (trimestre 0)
        if (ex.trimestre === 0) return;
        
        const nomeExame = ex.nomeExame;
        if (!examesPorNome.has(nomeExame)) {
          examesPorNome.set(nomeExame, { nome: nomeExame });
        }
        
        const exameAgrupado = examesPorNome.get(nomeExame)!;
        const key = `trimestre${ex.trimestre}` as 'trimestre1' | 'trimestre2' | 'trimestre3';
        
        // Só adicionar se tiver resultado
        if (ex.resultado) {
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

      const dadosPdf: DadosPdfCompleto = {
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
      
      const dum = gestante.dum ? new Date(gestante.dum) : null;
      const dataUS = gestante.dataUltrassom ? new Date(gestante.dataUltrassom) : null;
      
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
});
