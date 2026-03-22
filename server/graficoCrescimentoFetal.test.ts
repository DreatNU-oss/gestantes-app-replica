/**
 * Testes para a lógica de cálculo de IG e extração de dados dos gráficos de crescimento fetal.
 * Testa as funções puras usadas no componente GraficoCrescimentoFetal.
 */

import { describe, it, expect } from "vitest";
import { FMF_PESO, FMF_CA } from "../shared/fmfPercentis";

// ── Funções puras replicadas dos componentes (para teste isolado) ──────────────

function calcularIGPeloUS(
  dataExame: string,
  dataUltrassom: string,
  igUSSemanas: number,
  igUSDias: number
): number {
  const dtExame = new Date(dataExame + "T12:00:00");
  const dtUS = new Date(dataUltrassom + "T12:00:00");
  const diffMs = dtExame.getTime() - dtUS.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  const igTotalDias = igUSSemanas * 7 + igUSDias + diffDias;
  return igTotalDias / 7;
}

function parsePeso(v: string | undefined | null): number {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseCA(dados: { circunferenciaAbdominal?: string; biometria?: string }): number {
  if (dados.circunferenciaAbdominal) {
    const v = parseFloat(String(dados.circunferenciaAbdominal).replace(/[^0-9.]/g, ""));
    if (!isNaN(v) && v > 0) return v <= 100 ? v * 10 : v;
  }
  const bio: string = dados.biometria || "";
  const match = bio.match(/\bCA\s*[=:\s]?\s*(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = (match[2] || "").toLowerCase();
    if (!isNaN(val) && val > 0) {
      return unit === "cm" || val <= 100 ? val * 10 : val;
    }
  }
  return 0;
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("FMF_PESO tabela", () => {
  it("deve ter 19 entradas de IG 22 a 40", () => {
    expect(FMF_PESO).toHaveLength(19);
    expect(FMF_PESO[0].ig).toBe(22);
    expect(FMF_PESO[FMF_PESO.length - 1].ig).toBe(40);
  });

  it("deve ter P1 < P3 < P10 < P50 < P90 < P97 < P99 em todas as linhas", () => {
    for (const row of FMF_PESO) {
      expect(row.p1).toBeLessThan(row.p3);
      expect(row.p3).toBeLessThan(row.p10);
      expect(row.p10).toBeLessThan(row.p50);
      expect(row.p50).toBeLessThan(row.p90);
      expect(row.p90).toBeLessThan(row.p97);
      expect(row.p97).toBeLessThan(row.p99);
    }
  });

  it("deve ter valores corretos para IG 30 (P10=1230, P50=1460, P90=1730)", () => {
    const row = FMF_PESO.find((r) => r.ig === 30);
    expect(row).toBeDefined();
    expect(row!.p10).toBe(1230);
    expect(row!.p50).toBe(1460);
    expect(row!.p90).toBe(1730);
  });

  it("deve ter valores corretos para IG 40 (P1=2840, P50=3550, P99=4400)", () => {
    const row = FMF_PESO.find((r) => r.ig === 40);
    expect(row).toBeDefined();
    expect(row!.p1).toBe(2840);
    expect(row!.p50).toBe(3550);
    expect(row!.p99).toBe(4400);
  });
});

describe("FMF_CA tabela", () => {
  it("deve ter 21 entradas de IG 20 a 40", () => {
    expect(FMF_CA).toHaveLength(21);
    expect(FMF_CA[0].ig).toBe(20);
    expect(FMF_CA[FMF_CA.length - 1].ig).toBe(40);
  });

  it("deve ter P1 < P3 < P10 < P50 < P90 < P97 < P99 em todas as linhas", () => {
    for (const row of FMF_CA) {
      expect(row.p1).toBeLessThan(row.p3);
      expect(row.p3).toBeLessThan(row.p10);
      expect(row.p10).toBeLessThan(row.p50);
      expect(row.p50).toBeLessThan(row.p90);
      expect(row.p90).toBeLessThan(row.p97);
      expect(row.p97).toBeLessThan(row.p99);
    }
  });

  it("deve ter valores corretos para IG 30 (P10=241, P50=263, P90=286)", () => {
    const row = FMF_CA.find((r) => r.ig === 30);
    expect(row).toBeDefined();
    expect(row!.p10).toBe(241);
    expect(row!.p50).toBe(263);
    expect(row!.p90).toBe(286);
  });

  it("deve ter valores corretos para IG 40 (P1=350, P50=408, P99=470)", () => {
    const row = FMF_CA.find((r) => r.ig === 40);
    expect(row).toBeDefined();
    expect(row!.p1).toBe(350);
    expect(row!.p50).toBe(408);
    expect(row!.p99).toBe(470);
  });
});

describe("calcularIGPeloUS", () => {
  it("deve retornar a IG do 1º US quando a data do exame é a mesma do US", () => {
    const ig = calcularIGPeloUS("2025-01-15", "2025-01-15", 20, 0);
    expect(ig).toBeCloseTo(20.0, 1);
  });

  it("deve adicionar 2 semanas quando o exame é 14 dias após o US", () => {
    const ig = calcularIGPeloUS("2025-01-29", "2025-01-15", 20, 0);
    expect(ig).toBeCloseTo(22.0, 1);
  });

  it("deve subtrair semanas quando o exame é anterior ao US (retroativo)", () => {
    const ig = calcularIGPeloUS("2025-01-01", "2025-01-15", 20, 0);
    expect(ig).toBeCloseTo(18.0, 1);
  });

  it("deve considerar igUltrassomDias corretamente", () => {
    // US com 20s 3d = 143 dias. Exame 7 dias depois = 150 dias = 21s 3d
    const ig = calcularIGPeloUS("2025-01-22", "2025-01-15", 20, 3);
    expect(ig).toBeCloseTo(21.43, 1);
  });

  it("deve calcular IG corretamente para exame 8 semanas após US", () => {
    const ig = calcularIGPeloUS("2025-03-12", "2025-01-15", 22, 0);
    expect(ig).toBeCloseTo(30.0, 1);
  });
});

describe("parsePeso", () => {
  it("deve extrair número de string com 'g'", () => {
    expect(parsePeso("1500g")).toBe(1500);
  });

  it("deve extrair número puro", () => {
    expect(parsePeso("2300")).toBe(2300);
  });

  it("deve retornar 0 para string vazia", () => {
    expect(parsePeso("")).toBe(0);
  });

  it("deve retornar 0 para undefined", () => {
    expect(parsePeso(undefined)).toBe(0);
  });

  it("deve extrair número de string com texto misto", () => {
    expect(parsePeso("Peso: 3200g (estimado)")).toBe(3200);
  });
});

describe("parseCA", () => {
  it("deve extrair CA em mm do campo biometria", () => {
    expect(parseCA({ biometria: "DBP 85mm, CC 290mm, CA 280mm, CF 55mm" })).toBe(280);
  });

  it("deve converter CA em cm para mm quando valor <= 100", () => {
    expect(parseCA({ biometria: "CA 28.0cm" })).toBe(280);
  });

  it("deve converter CA em cm para mm com unidade explícita", () => {
    expect(parseCA({ biometria: "CA: 27.5cm" })).toBe(275);
  });

  it("deve extrair CA com separador '='", () => {
    expect(parseCA({ biometria: "CA=265mm" })).toBe(265);
  });

  it("deve extrair CA sem unidade (valor > 100 = mm)", () => {
    expect(parseCA({ biometria: "CA 310" })).toBe(310);
  });

  it("deve usar campo dedicado circunferenciaAbdominal quando disponível", () => {
    expect(parseCA({ circunferenciaAbdominal: "295mm", biometria: "CA 100mm" })).toBe(295);
  });

  it("deve converter campo dedicado em cm para mm", () => {
    expect(parseCA({ circunferenciaAbdominal: "29.5" })).toBe(295);
  });

  it("deve retornar 0 quando não há CA no biometria", () => {
    expect(parseCA({ biometria: "DBP 85mm, CC 290mm, CF 55mm" })).toBe(0);
  });

  it("deve retornar 0 para dados vazios", () => {
    expect(parseCA({})).toBe(0);
  });
});
