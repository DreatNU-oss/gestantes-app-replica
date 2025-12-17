import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import * as gestanteDb from "./gestante-db";
import { randomBytes, createHash } from "crypto";
import { sendVerificationCode } from "./email-service";

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
      const gestante = await validateGestanteToken(input.token);
      
      // Calculate gestational ages
      const dum = gestante.dum ? new Date(gestante.dum) : null;
      const dataUS = gestante.dataUltrassom ? new Date(gestante.dataUltrassom) : null;
      
      let igDUM = null;
      let igUS = null;
      let dppDUM = null;
      let dppUS = null;
      
      if (dum) {
        igDUM = calculateIGFromDUM(dum);
        dppDUM = calculateDPP(dum);
      }
      
      if (dataUS && gestante.igUltrassomSemanas !== null) {
        igUS = calculateIGFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
        dppUS = calculateDPPFromUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
      }
      
      return {
        ...gestante,
        calculado: {
          igDUM,
          igUS,
          dppDUM,
          dppUS,
        },
      };
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
      
      // Group exams by name
      const examesByName: Record<string, Array<{ data: string; resultado: string; igSemanas: number; igDias: number }>> = {};
      
      for (const exame of examesList) {
        if (!examesByName[exame.tipoExame]) {
          examesByName[exame.tipoExame] = [];
        }
        examesByName[exame.tipoExame].push({
          data: exame.dataExame ? new Date(exame.dataExame).toISOString().split("T")[0] : "",
          resultado: exame.resultado || "",
          igSemanas: exame.igSemanas || 0,
          igDias: exame.igDias || 0,
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
