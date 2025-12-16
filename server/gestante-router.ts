import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  buscarGestantePorId,
  buscarGestantePorEmail,
  buscarConsultasGestante,
  buscarExamesGestante,
  buscarUltrassonsGestante,
  calcularIgPorDum,
  calcularDppPorDum,
  calcularMarcosImportantes,
} from "./gestante-db";

/**
 * Router para API da gestante (app nativo)
 */
export const gestanteRouter = router({
  /**
   * Busca dados da gestante autenticada
   */
  me: publicProcedure
    .input(z.object({
      gestanteId: z.number(),
    }))
    .query(async ({ input }) => {
      const gestante = await buscarGestantePorId(input.gestanteId);
      
      if (!gestante) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gestante não encontrada",
        });
      }
      
      // Calcular dados adicionais
      const ig = calcularIgPorDum(gestante.dum);
      const dpp = calcularDppPorDum(gestante.dum);
      
      return {
        id: gestante.id,
        nome: gestante.nome,
        email: gestante.email,
        telefone: gestante.telefone,
        dataNascimento: gestante.dataNascimento,
        dum: gestante.dum,
        dataUltrassom: gestante.dataUltrassom,
        idadeGestacionalUltrassom: gestante.igUltrassomSemanas && gestante.igUltrassomDias 
          ? `${gestante.igUltrassomSemanas}s ${gestante.igUltrassomDias}d`
          : null,
        dpp: dpp?.toISOString().split('T')[0],
        ig: ig,
        gesta: gestante.gesta,
        para: gestante.para,
        abortos: gestante.abortos,
        cesareas: gestante.cesareas,
        partosNormais: gestante.partosNormais,
        tipoPartoDesejado: gestante.tipoPartoDesejado,
        planoSaudeId: gestante.planoSaudeId,
        medicoId: gestante.medicoId,
      };
    }),
  
  /**
   * Busca marcos importantes da gestação
   */
  marcos: publicProcedure
    .input(z.object({
      gestanteId: z.number(),
    }))
    .query(async ({ input }) => {
      const gestante = await buscarGestantePorId(input.gestanteId);
      
      if (!gestante) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gestante não encontrada",
        });
      }
      
      const dpp = calcularDppPorDum(gestante.dum);
      
      if (!dpp) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "DUM não cadastrada",
        });
      }
      
      const marcos = calcularMarcosImportantes(dpp);
      
      return marcos;
    }),
  
  /**
   * Busca histórico de consultas
   */
  consultas: publicProcedure
    .input(z.object({
      gestanteId: z.number(),
    }))
    .query(async ({ input }) => {
      const consultas = await buscarConsultasGestante(input.gestanteId);
      
      return consultas.map(c => ({
        id: c.id,
        data: c.dataConsulta,
        igSemanas: c.igSemanas,
        igDias: c.igDias,
        peso: c.peso ? c.peso / 1000 : null, // Converter de gramas para kg
        pressaoArterial: c.pressaoArterial,
        alturaUterina: c.alturaUterina ? c.alturaUterina / 10 : null, // Converter de mm para cm
        bcf: c.bcf,
        mf: c.mf,
        observacoes: c.observacoes,
      }));
    }),
  
  /**
   * Busca exames laboratoriais
   */
  exames: publicProcedure
    .input(z.object({
      gestanteId: z.number(),
    }))
    .query(async ({ input }) => {
      const exames = await buscarExamesGestante(input.gestanteId);
      
      // Agrupar exames por nome
      const examesAgrupados: Record<string, any> = {};
      
      exames.forEach(exame => {
        if (!examesAgrupados[exame.nomeExame]) {
          examesAgrupados[exame.nomeExame] = {
            nome: exame.nomeExame,
            trimestres: {},
          };
        }
        
        examesAgrupados[exame.nomeExame].trimestres[exame.trimestre] = {
          resultado: exame.resultado,
          data: exame.dataExame,
        };
      });
      
      return Object.values(examesAgrupados);
    }),
  
  /**
   * Busca ultrassons
   */
  ultrassons: publicProcedure
    .input(z.object({
      gestanteId: z.number(),
    }))
    .query(async ({ input }) => {
      const ultrassons = await buscarUltrassonsGestante(input.gestanteId);
      
      return ultrassons.map(us => ({
        id: us.id,
        tipo: us.tipoUltrassom,
        data: us.dataExame,
        idadeGestacional: us.idadeGestacional,
        dados: us.dados,
      }));
    }),
  
  /**
   * Busca dados para curva de ganho de peso
   */
  peso: publicProcedure
    .input(z.object({
      gestanteId: z.number(),
    }))
    .query(async ({ input }) => {
      const gestante = await buscarGestantePorId(input.gestanteId);
      
      if (!gestante) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gestante não encontrada",
        });
      }
      
      const consultas = await buscarConsultasGestante(input.gestanteId);
      
      // Calcular IMC pré-gestacional
      let imc = null;
      let categoria = null;
      
      if (gestante.altura && gestante.pesoInicial) {
        const alturaMetros = gestante.altura / 100;
        const pesoKg = gestante.pesoInicial / 1000;
        imc = pesoKg / (alturaMetros * alturaMetros);
        
        if (imc < 18.5) categoria = "baixo_peso";
        else if (imc < 25) categoria = "adequado";
        else if (imc < 30) categoria = "sobrepeso";
        else categoria = "obesidade";
      }
      
      // Montar pontos de peso
      const pontosPeso = consultas
        .filter(c => c.peso)
        .map(c => {
          const ig = calcularIgPorDum(gestante.dum, new Date(c.dataConsulta + 'T12:00:00'));
          const semanas = ig ? ig.semanas + (ig.dias / 7) : 0;
          
          return {
            semana: semanas,
            peso: c.peso ? c.peso / 1000 : 0,
            data: c.dataConsulta,
          };
        });
      
      return {
        pesoInicial: gestante.pesoInicial ? gestante.pesoInicial / 1000 : null,
        altura: gestante.altura,
        imc,
        categoria,
        pontos: pontosPeso,
      };
    }),
});
