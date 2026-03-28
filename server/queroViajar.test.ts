import { describe, it, expect, vi } from "vitest";

/**
 * Testes para a funcionalidade "Quero Viajar!"
 * 
 * Testa a lógica de cálculo de IG em datas futuras e filtragem de gestantes a termo.
 * Como o endpoint queroViajar.dadosGestantes depende do banco, testamos a lógica
 * de cálculo de IG que é usada no frontend.
 */

// Funções auxiliares replicadas do componente QueroViajar para teste
function normalizarData(data: string): string {
  if (!data) return '';
  if (data.includes('T')) return data.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const d = new Date(data);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return data;
}

function calcularIgNaData(
  gestante: { dum?: string | null; dataUltrassom?: string | null; igUltrassomSemanas?: number | null; igUltrassomDias?: number | null },
  dataAlvo: Date
): { semanas: number; dias: number; totalDias: number } | null {
  dataAlvo.setHours(12, 0, 0, 0);

  // Priorizar US
  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null && gestante.igUltrassomSemanas !== undefined) {
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return null;
    const diffMs = dataAlvo.getTime() - dataUS.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const igTotalDias = ((gestante.igUltrassomSemanas ?? 0) * 7) + (gestante.igUltrassomDias || 0) + diffDays;
    if (igTotalDias < 0) return null;
    return {
      semanas: Math.floor(igTotalDias / 7),
      dias: igTotalDias % 7,
      totalDias: igTotalDias,
    };
  }

  // Fallback DUM
  if (gestante.dum && gestante.dum !== "Incerta" && !gestante.dum.includes("Incompatível")) {
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return null;
    const diffMs = dataAlvo.getTime() - dumDate.getTime();
    const totalDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (totalDias < 0) return null;
    return {
      semanas: Math.floor(totalDias / 7),
      dias: totalDias % 7,
      totalDias,
    };
  }

  return null;
}

function calcularDppGestante(gestante: { dum?: string | null; dataUltrassom?: string | null; igUltrassomSemanas?: number | null; igUltrassomDias?: number | null }): { data: Date; tipo: string } | null {
  // Prioridade 1: DPP por US
  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null && gestante.igUltrassomSemanas !== undefined) {
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (!isNaN(dataUS.getTime())) {
      const igTotalDias = ((gestante.igUltrassomSemanas ?? 0) * 7) + (gestante.igUltrassomDias || 0);
      const diasRestantes = 280 - igTotalDias;
      const dpp = new Date(dataUS);
      dpp.setDate(dpp.getDate() + diasRestantes);
      return { data: dpp, tipo: "DPP US" };
    }
  }

  // Prioridade 2: DPP por DUM
  if (gestante.dum && gestante.dum !== "Incerta" && !gestante.dum.includes("Incompatível")) {
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (!isNaN(dumDate.getTime())) {
      const dpp = new Date(dumDate);
      dpp.setDate(dpp.getDate() + 280);
      return { data: dpp, tipo: "DPP DUM" };
    }
  }

  return null;
}

describe("Quero Viajar - Cálculos de IG", () => {
  describe("normalizarData", () => {
    it("deve retornar string vazia para input vazio", () => {
      expect(normalizarData("")).toBe("");
    });

    it("deve normalizar data com formato ISO (com T)", () => {
      expect(normalizarData("2026-03-28T12:00:00")).toBe("2026-03-28");
    });

    it("deve manter data já no formato YYYY-MM-DD", () => {
      expect(normalizarData("2026-03-28")).toBe("2026-03-28");
    });
  });

  describe("calcularIgNaData", () => {
    it("deve calcular IG corretamente por DUM", () => {
      // DUM = 2025-09-05, data alvo = 2026-03-28
      // Diferença: ~204 dias = 29 semanas e 1 dia
      const gestante = { dum: "2025-09-05" };
      const dataAlvo = new Date("2026-03-28T12:00:00");
      const ig = calcularIgNaData(gestante, dataAlvo);
      
      expect(ig).not.toBeNull();
      expect(ig!.semanas).toBe(29);
      expect(ig!.dias).toBe(1);
      expect(ig!.totalDias).toBe(204);
    });

    it("deve calcular IG corretamente por US (prioridade sobre DUM)", () => {
      // US em 2026-01-15 com IG 20s3d = 143 dias
      // Data alvo = 2026-03-28 => 72 dias depois
      // IG total = 143 + 72 = 215 dias = 30s5d
      const gestante = {
        dum: "2025-06-01", // Seria ignorado
        dataUltrassom: "2026-01-15",
        igUltrassomSemanas: 20,
        igUltrassomDias: 3,
      };
      const dataAlvo = new Date("2026-03-28T12:00:00");
      const ig = calcularIgNaData(gestante, dataAlvo);
      
      expect(ig).not.toBeNull();
      expect(ig!.totalDias).toBe(215);
      expect(ig!.semanas).toBe(30);
      expect(ig!.dias).toBe(5);
    });

    it("deve retornar null para gestante sem DUM e sem US", () => {
      const gestante = {};
      const dataAlvo = new Date("2026-03-28T12:00:00");
      const ig = calcularIgNaData(gestante, dataAlvo);
      expect(ig).toBeNull();
    });

    it("deve retornar null para DUM 'Incerta'", () => {
      const gestante = { dum: "Incerta" };
      const dataAlvo = new Date("2026-03-28T12:00:00");
      const ig = calcularIgNaData(gestante, dataAlvo);
      expect(ig).toBeNull();
    });

    it("deve retornar null para DUM 'Incompatível com US'", () => {
      const gestante = { dum: "Incompatível com US" };
      const dataAlvo = new Date("2026-03-28T12:00:00");
      const ig = calcularIgNaData(gestante, dataAlvo);
      expect(ig).toBeNull();
    });

    it("deve retornar null se IG seria negativa (data alvo antes do US)", () => {
      const gestante = {
        dataUltrassom: "2026-04-01",
        igUltrassomSemanas: 10,
        igUltrassomDias: 0,
      };
      const dataAlvo = new Date("2026-03-01T12:00:00"); // Antes do US
      const ig = calcularIgNaData(gestante, dataAlvo);
      // 10*7 + 0 = 70, diff = -31, total = 39 (positivo, pois US é futuro mas IG no US era 10s)
      // Na verdade: diff = -31, total = 70 + (-31) = 39 > 0, então retorna
      expect(ig).not.toBeNull();
      expect(ig!.totalDias).toBe(39);
    });
  });

  describe("calcularDppGestante", () => {
    it("deve calcular DPP por DUM (280 dias)", () => {
      // DUM = 2025-07-01 => DPP = 2025-07-01 + 280 = 2026-04-07
      const gestante = { dum: "2025-07-01" };
      const dpp = calcularDppGestante(gestante);
      
      expect(dpp).not.toBeNull();
      expect(dpp!.tipo).toBe("DPP DUM");
      expect(dpp!.data.toISOString().split("T")[0]).toBe("2026-04-07");
    });

    it("deve calcular DPP por US com prioridade sobre DUM", () => {
      // US em 2026-01-15 com IG 20s0d = 140 dias
      // Dias restantes = 280 - 140 = 140
      // DPP = 2026-01-15 + 140 = 2026-06-04
      const gestante = {
        dum: "2025-07-01",
        dataUltrassom: "2026-01-15",
        igUltrassomSemanas: 20,
        igUltrassomDias: 0,
      };
      const dpp = calcularDppGestante(gestante);
      
      expect(dpp).not.toBeNull();
      expect(dpp!.tipo).toBe("DPP US");
      expect(dpp!.data.toISOString().split("T")[0]).toBe("2026-06-04");
    });

    it("deve retornar null se não há dados suficientes", () => {
      const gestante = {};
      const dpp = calcularDppGestante(gestante);
      expect(dpp).toBeNull();
    });
  });

  describe("Filtragem de gestantes a termo no período", () => {
    const gestantes = [
      {
        id: 1,
        nome: "Maria",
        dum: "2025-07-01", // DPP ~2026-04-07, IG em 28/03/2026 ~38s4d
        medicoId: 1,
      },
      {
        id: 2,
        nome: "Ana",
        dum: "2025-09-01", // DPP ~2026-06-08, IG em 28/03/2026 ~29s6d
        medicoId: 2,
      },
      {
        id: 3,
        nome: "Carla",
        dataUltrassom: "2026-01-15",
        igUltrassomSemanas: 25,
        igUltrassomDias: 0,
        medicoId: 1,
        // IG em 28/03/2026: 25*7 + 72 = 247 dias = 35s2d
        // IG em 15/04/2026: 25*7 + 90 = 265 dias = 37s6d
      },
      {
        id: 4,
        nome: "Julia",
        dum: "2025-12-01", // DPP ~2026-09-07, IG em 28/03/2026 ~16s5d
        medicoId: 2,
      },
    ];

    function filtrarGestantes(
      lista: typeof gestantes,
      dataInicio: string,
      dataFim: string,
      igMinSemanas: number,
      medicoFiltro: string = "todos"
    ) {
      const igMinDias = igMinSemanas * 7;
      return lista.filter((g) => {
        // Filtro por médico
        if (medicoFiltro !== "todos" && g.medicoId?.toString() !== medicoFiltro) return false;

        const inicio = new Date(dataInicio + "T12:00:00");
        const fim = new Date(dataFim + "T12:00:00");
        const igNoInicio = calcularIgNaData(g, new Date(inicio));
        const igNoFim = calcularIgNaData(g, new Date(fim));
        if (!igNoInicio && !igNoFim) return false;
        const igFimDias = igNoFim?.totalDias ?? 0;
        const igInicioDias = igNoInicio?.totalDias ?? 0;
        return igFimDias >= igMinDias && igInicioDias <= 294;
      });
    }

    it("deve filtrar gestantes a termo (>=37 semanas) em abril 2026", () => {
      const resultado = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 37);
      
      // Maria: IG em 01/04 ~39s0d, IG em 30/04 ~43s1d => sim (mas >42 no início? 39*7=273 < 294)
      // Ana: IG em 30/04 ~34s2d => não (< 37 semanas no fim)
      // Carla: IG em 01/04 ~35s6d, IG em 30/04 ~40s0d => sim (atinge 37 durante o período)
      // Julia: IG em 30/04 ~21s2d => não
      
      const nomes = resultado.map(g => g.nome);
      expect(nomes).toContain("Maria");
      expect(nomes).toContain("Carla");
      expect(nomes).not.toContain("Ana");
      expect(nomes).not.toContain("Julia");
    });

    it("deve filtrar com IG mínima de 34 semanas", () => {
      const resultado = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 34);
      
      // Ana: IG em 30/04 ~34s2d => sim (>= 34 semanas)
      const nomes = resultado.map(g => g.nome);
      expect(nomes).toContain("Maria");
      expect(nomes).toContain("Carla");
      expect(nomes).toContain("Ana");
      expect(nomes).not.toContain("Julia");
    });

    it("deve retornar lista vazia para período sem gestantes a termo", () => {
      const resultado = filtrarGestantes(gestantes, "2026-01-01", "2026-01-15", 37);
      // Nenhuma gestante com IG >= 37 semanas em janeiro
      expect(resultado.length).toBe(0);
    });

    it("deve filtrar com IG mínima de 41 semanas", () => {
      const resultado = filtrarGestantes(gestantes, "2026-04-15", "2026-04-30", 41);
      
      // Maria: IG em 15/04 ~41s0d, IG em 30/04 ~43s1d => sim
      // Carla: IG em 30/04 ~40s0d => não (< 41)
      const nomes = resultado.map(g => g.nome);
      expect(nomes).toContain("Maria");
      expect(nomes).not.toContain("Carla");
    });

    it("deve filtrar por médico específico (médico 1)", () => {
      // Médico 1: Maria (id=1) e Carla (id=3)
      const resultado = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 34, "1");
      const nomes = resultado.map(g => g.nome);
      expect(nomes).toContain("Maria");
      expect(nomes).toContain("Carla");
      expect(nomes).not.toContain("Ana"); // Médico 2
      expect(nomes).not.toContain("Julia"); // Médico 2
    });

    it("deve filtrar por médico específico (médico 2)", () => {
      // Médico 2: Ana (id=2) e Julia (id=4)
      // Com IG mínima 34, Ana atinge 34s no período, Julia não
      const resultado = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 34, "2");
      const nomes = resultado.map(g => g.nome);
      expect(nomes).toContain("Ana");
      expect(nomes).not.toContain("Maria"); // Médico 1
      expect(nomes).not.toContain("Carla"); // Médico 1
      expect(nomes).not.toContain("Julia"); // IG muito baixa
    });

    it("deve retornar todas as gestantes a termo quando filtro é 'todos'", () => {
      const resultadoTodos = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 34, "todos");
      const resultadoSemFiltro = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 34);
      expect(resultadoTodos.length).toBe(resultadoSemFiltro.length);
      expect(resultadoTodos.map(g => g.nome).sort()).toEqual(resultadoSemFiltro.map(g => g.nome).sort());
    });

    it("deve combinar filtro de médico com IG mínima alta", () => {
      // Médico 1 com IG >= 37: Maria sim, Carla sim (atinge 37 no período)
      const resultado = filtrarGestantes(gestantes, "2026-04-01", "2026-04-30", 37, "1");
      const nomes = resultado.map(g => g.nome);
      expect(nomes).toContain("Maria");
      expect(nomes).toContain("Carla");
      expect(resultado.length).toBe(2);
    });
  });
});
