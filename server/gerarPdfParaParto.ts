import { getDb } from "./db";
import { gestantes, consultasPrenatal, ultrassons, examesLaboratoriais } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { gerarPdfCartaoPrenatal } from "./gerarPdfCartao";
import { storagePut } from "./storage";
import { calcularIdadeGestacional, calcularDPP } from "./calculos";

/**
 * Gera PDF do cartão pré-natal e faz upload no S3
 * Retorna { pdfUrl, pdfKey }
 */
export async function gerarEUploadPdfCartao(gestanteId: number): Promise<{ pdfUrl: string; pdfKey: string }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Buscar dados da gestante
  const gestanteResult = await db.select().from(gestantes).where(eq(gestantes.id, gestanteId));
  if (gestanteResult.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Gestante não encontrada" });
  }
  const gestante = gestanteResult[0];

  // Calcular idade
  let idade: number | null = null;
  if (gestante.dataNascimento) {
    const nascimento = new Date(gestante.dataNascimento);
    const hoje = new Date();
    idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
  }

  // Calcular DPP pela DUM
  let dppDUM: string | null = null;
  if (gestante.dum) {
    const dumDate = new Date(gestante.dum);
    const dpp = calcularDPP(dumDate);
    dppDUM = formatarData(dpp);
  }

  // Calcular DPP pelo US
  let dppUS: string | null = null;
  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
    const usDate = new Date(gestante.dataUltrassom);
    const igUS = {
      semanas: gestante.igUltrassomSemanas,
      dias: gestante.igUltrassomDias || 0,
    };
    const totalDiasUS = igUS.semanas * 7 + igUS.dias;
    const dppDate = new Date(usDate);
    dppDate.setDate(dppDate.getDate() + (280 - totalDiasUS));
    dppUS = formatarData(dppDate);
  }

  // Buscar consultas
  const consultasResult = await db
    .select()
    .from(consultasPrenatal)
    .where(eq(consultasPrenatal.gestanteId, gestanteId))
    .orderBy(desc(consultasPrenatal.dataConsulta));

  const consultas = consultasResult.map((c) => {
    const dataConsulta = new Date(c.dataConsulta);
    
    // Calcular IG pela DUM na data da consulta
    let igDUM = "-";
    if (gestante.dum) {
      const dumDate = new Date(gestante.dum);
      const ig = calcularIdadeGestacional(dumDate, dataConsulta.toISOString().split('T')[0]);
      igDUM = `${ig?.semanas || 0}s ${ig?.dias || 0}d`;
    }

    // Calcular IG pelo US na data da consulta
    let igUS: string | null = null;
    if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
      const usDate = new Date(gestante.dataUltrassom);
      const igUSBase = {
        semanas: gestante.igUltrassomSemanas,
        dias: gestante.igUltrassomDias || 0,
      };
      const totalDiasUSBase = igUSBase.semanas * 7 + igUSBase.dias;
      const diasDecorridos = Math.floor((dataConsulta.getTime() - usDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDiasUS = totalDiasUSBase + diasDecorridos;
      const semanasUS = Math.floor(totalDiasUS / 7);
      const diasUS = totalDiasUS % 7;
      igUS = `${semanasUS}s ${diasUS}d`;
    }

    return {
      dataConsulta: formatarData(dataConsulta),
      igDUM,
      igUS,
      peso: c.peso,
      pa: c.pressaoArterial,
      au: c.alturaUterina,
      bcf: c.bcf,
      mf: c.mf,
      conduta: c.conduta,
      condutaComplementacao: c.condutaComplementacao,
      observacoes: c.observacoes,
    };
  });

  // Buscar ultrassons
  const ultrassonsResult = await db
    .select()
    .from(ultrassons)
    .where(eq(ultrassons.gestanteId, gestanteId))
    .orderBy(desc(ultrassons.dataExame));

  const ultrassonsFormatados = ultrassonsResult.map((u) => ({
    data: u.dataExame || "-",
    ig: u.idadeGestacional || "-",
    tipo: u.tipoUltrassom || "-",
    observacoes: null, // Ultrassons não têm campo observacoes separado
  }));

  // Buscar exames laboratoriais
  const examesResult = await db
    .select()
    .from(examesLaboratoriais)
    .where(eq(examesLaboratoriais.gestanteId, gestanteId))
    .orderBy(desc(examesLaboratoriais.dataExame));

  const examesFormatados = examesResult.map((e) => {
    // Calcular trimestre baseado na IG
    let trimestre = 1;
    if (e.igSemanas !== null) {
      if (e.igSemanas >= 27) trimestre = 3;
      else if (e.igSemanas >= 14) trimestre = 2;
    }
    
    return {
      tipo: e.tipoExame,
      data: formatarData(new Date(e.dataExame)),
      resultado: e.resultado || "-",
      trimestre,
    };
  });

  // Calcular marcos importantes (baseado na DPP pelo US se disponível, senão DUM)
  const marcos: Array<{ titulo: string; data: string; periodo: string }> = [];
  
  if (dppUS || dppDUM) {
    const dppStr = dppUS || dppDUM;
    if (dppStr) {
      const [dia, mes, ano] = dppStr.split("/");
      const dppDate = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      
      // Concepção (DPP - 280 dias)
      const concepcao = new Date(dppDate);
      concepcao.setDate(concepcao.getDate() - 280);
      marcos.push({
        titulo: "Concepção",
        data: formatarData(concepcao),
        periodo: "-",
      });

      // Morfológico 1º Tri (11-14 semanas)
      const morfo1Inicio = new Date(concepcao);
      morfo1Inicio.setDate(morfo1Inicio.getDate() + (11 * 7));
      const morfo1Fim = new Date(concepcao);
      morfo1Fim.setDate(morfo1Fim.getDate() + (14 * 7));
      marcos.push({
        titulo: "Morfológico 1º Trimestre",
        data: formatarData(morfo1Inicio),
        periodo: `${formatarData(morfo1Inicio)} a ${formatarData(morfo1Fim)}`,
      });

      // 13 Semanas
      const semana13 = new Date(concepcao);
      semana13.setDate(semana13.getDate() + (13 * 7));
      marcos.push({
        titulo: "13 Semanas",
        data: formatarData(semana13),
        periodo: "-",
      });

      // Morfológico 2º Tri (20-24 semanas)
      const morfo2Inicio = new Date(concepcao);
      morfo2Inicio.setDate(morfo2Inicio.getDate() + (20 * 7));
      const morfo2Fim = new Date(concepcao);
      morfo2Fim.setDate(morfo2Fim.getDate() + (24 * 7));
      marcos.push({
        titulo: "Morfológico 2º Trimestre",
        data: formatarData(morfo2Inicio),
        periodo: `${formatarData(morfo2Inicio)} a ${formatarData(morfo2Fim)}`,
      });

      // Vacina dTpa (27 semanas)
      const dtpa = new Date(concepcao);
      dtpa.setDate(dtpa.getDate() + (27 * 7));
      marcos.push({
        titulo: "Vacina dTpa",
        data: formatarData(dtpa),
        periodo: "-",
      });

      // Vacina Bronquiolite (32-36 semanas)
      const bronqInicio = new Date(concepcao);
      bronqInicio.setDate(bronqInicio.getDate() + (32 * 7));
      const bronqFim = new Date(concepcao);
      bronqFim.setDate(bronqFim.getDate() + (36 * 7));
      marcos.push({
        titulo: "Vacina Bronquiolite",
        data: formatarData(bronqInicio),
        periodo: `${formatarData(bronqInicio)} a ${formatarData(bronqFim)}`,
      });

      // Termo Precoce (37 semanas)
      const termoPrecoce = new Date(concepcao);
      termoPrecoce.setDate(termoPrecoce.getDate() + (37 * 7));
      marcos.push({
        titulo: "Termo Precoce",
        data: formatarData(termoPrecoce),
        periodo: "-",
      });

      // Termo Completo (39 semanas)
      const termoCompleto = new Date(concepcao);
      termoCompleto.setDate(termoCompleto.getDate() + (39 * 7));
      marcos.push({
        titulo: "Termo Completo",
        data: formatarData(termoCompleto),
        periodo: "-",
      });

      // DPP (40 semanas)
      marcos.push({
        titulo: "DPP (40 semanas)",
        data: dppStr,
        periodo: "-",
      });
    }
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
    consultas,
    marcos,
    ultrassons: ultrassonsFormatados,
    exames: examesFormatados,
  };

  // Gerar PDF
  const pdfBuffer = await gerarPdfCartaoPrenatal(dadosPDF);

  // Upload para S3
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const pdfKey = `cartoes-prenatal/gestante-${gestanteId}-${timestamp}-${randomSuffix}.pdf`;
  
  const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");

  return { pdfUrl, pdfKey };
}

/**
 * Formata data para DD/MM/YYYY
 */
function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}
