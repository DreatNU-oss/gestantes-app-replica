import { describe, it, expect } from 'vitest';

// ─── Chart Data Preparation Tests ──────────────────────────────────────
// Tests that igSemanas fallback chain works correctly:
// igSemanas > igDumSemanas > igUltrassomSemanas

describe('Chart Data igSemanas Fallback', () => {
  // Mimics the data preparation logic in routers.ts
  const prepareChartData = (consulta: {
    igSemanas: number | null;
    igDumSemanas: number | null;
    igUltrassomSemanas: number | null;
    peso: number | null;
    alturaUterina: number | null;
    pressaoSistolica: number | null;
    pressaoDiastolica: number | null;
  }) => ({
    igSemanas: consulta.igSemanas || consulta.igDumSemanas || consulta.igUltrassomSemanas || null,
    peso: consulta.peso ? consulta.peso / 1000 : null,
    au: consulta.alturaUterina ? (consulta.alturaUterina === -1 ? null : consulta.alturaUterina / 10) : null,
    paSistolica: consulta.pressaoSistolica || null,
    paDiastolica: consulta.pressaoDiastolica || null,
  });

  it('deve usar igSemanas quando disponível', () => {
    const result = prepareChartData({
      igSemanas: 30,
      igDumSemanas: 29,
      igUltrassomSemanas: 28,
      peso: 75000,
      alturaUterina: 300,
      pressaoSistolica: 120,
      pressaoDiastolica: 80,
    });
    expect(result.igSemanas).toBe(30);
  });

  it('deve usar igDumSemanas como fallback quando igSemanas é null', () => {
    const result = prepareChartData({
      igSemanas: null,
      igDumSemanas: 29,
      igUltrassomSemanas: 28,
      peso: 75000,
      alturaUterina: 300,
      pressaoSistolica: 120,
      pressaoDiastolica: 80,
    });
    expect(result.igSemanas).toBe(29);
  });

  it('deve usar igUltrassomSemanas como fallback quando igSemanas e igDumSemanas são null', () => {
    const result = prepareChartData({
      igSemanas: null,
      igDumSemanas: null,
      igUltrassomSemanas: 28,
      peso: 75000,
      alturaUterina: 300,
      pressaoSistolica: 120,
      pressaoDiastolica: 80,
    });
    expect(result.igSemanas).toBe(28);
  });

  it('deve retornar null quando todos os IG são null', () => {
    const result = prepareChartData({
      igSemanas: null,
      igDumSemanas: null,
      igUltrassomSemanas: null,
      peso: 75000,
      alturaUterina: 300,
      pressaoSistolica: 120,
      pressaoDiastolica: 80,
    });
    expect(result.igSemanas).toBeNull();
  });

  it('deve converter peso de gramas para kg', () => {
    const result = prepareChartData({
      igSemanas: 30,
      igDumSemanas: null,
      igUltrassomSemanas: null,
      peso: 75000,
      alturaUterina: null,
      pressaoSistolica: null,
      pressaoDiastolica: null,
    });
    expect(result.peso).toBe(75);
  });

  it('deve converter alturaUterina de mm para cm', () => {
    const result = prepareChartData({
      igSemanas: 30,
      igDumSemanas: null,
      igUltrassomSemanas: null,
      peso: null,
      alturaUterina: 300,
      pressaoSistolica: null,
      pressaoDiastolica: null,
    });
    expect(result.au).toBe(30);
  });
});

describe('Chart Data Filtering for dadosGraficosNativos', () => {
  // Mimics the filter logic in routers.ts
  const filterForPeso = (data: Array<{ igSemanas: number | null; peso: number | null }>) =>
    data.filter(c => c.peso !== null && c.igSemanas != null)
      .map(c => ({ igSemanas: c.igSemanas!, valor: c.peso! }));

  const filterForAU = (data: Array<{ igSemanas: number | null; au: number | null }>) =>
    data.filter(c => c.au !== null && c.igSemanas != null)
      .map(c => ({ igSemanas: c.igSemanas!, valor: c.au! }));

  it('deve filtrar consultas com igSemanas null do gráfico de peso', () => {
    const data = [
      { igSemanas: 30, peso: 75 },
      { igSemanas: null, peso: 72 },
      { igSemanas: 28, peso: 70 },
    ];
    const result = filterForPeso(data);
    expect(result).toHaveLength(2);
    expect(result[0].igSemanas).toBe(30);
    expect(result[1].igSemanas).toBe(28);
  });

  it('deve filtrar consultas com peso null do gráfico de peso', () => {
    const data = [
      { igSemanas: 30, peso: 75 },
      { igSemanas: 28, peso: null },
    ];
    const result = filterForPeso(data);
    expect(result).toHaveLength(1);
    expect(result[0].igSemanas).toBe(30);
  });

  it('deve filtrar consultas com igSemanas null do gráfico de AU', () => {
    const data = [
      { igSemanas: 30, au: 30 },
      { igSemanas: null, au: 28 },
      { igSemanas: 28, au: 26 },
    ];
    const result = filterForAU(data);
    expect(result).toHaveLength(2);
  });

  it('deve retornar array vazio quando todos igSemanas são null', () => {
    const data = [
      { igSemanas: null, peso: 75 },
      { igSemanas: null, peso: 72 },
    ];
    const result = filterForPeso(data);
    expect(result).toHaveLength(0);
  });
});

describe('Simulated Ana Clara Scenario', () => {
  // This test simulates the exact scenario that was failing:
  // DUM = "Incerta", so igSemanas and igDumSemanas are null,
  // but igUltrassomSemanas has valid data
  
  const anaClara = [
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 23, peso: 69000, alturaUterina: 240, pressaoSistolica: 110, pressaoDiastolica: 70 },
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 29, peso: 72000, alturaUterina: 260, pressaoSistolica: null, pressaoDiastolica: null },
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 33, peso: 73000, alturaUterina: 270, pressaoSistolica: 120, pressaoDiastolica: 70 },
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 35, peso: 75000, alturaUterina: 280, pressaoSistolica: 110, pressaoDiastolica: 70 },
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 36, peso: 76000, alturaUterina: 290, pressaoSistolica: 100, pressaoDiastolica: 70 },
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 37, peso: 75700, alturaUterina: 300, pressaoSistolica: 110, pressaoDiastolica: 70 },
    { igSemanas: null, igDumSemanas: null, igUltrassomSemanas: 38, peso: 76600, alturaUterina: 310, pressaoSistolica: 110, pressaoDiastolica: 60 },
  ];

  it('deve usar igUltrassomSemanas para todas as consultas da Ana Clara', () => {
    const prepared = anaClara.map(c => ({
      igSemanas: c.igSemanas || c.igDumSemanas || c.igUltrassomSemanas || null,
      peso: c.peso ? c.peso / 1000 : null,
      au: c.alturaUterina ? (c.alturaUterina === -1 ? null : c.alturaUterina / 10) : null,
      paSistolica: c.pressaoSistolica || null,
      paDiastolica: c.pressaoDiastolica || null,
    }));

    // All should have igSemanas from igUltrassomSemanas
    expect(prepared.every(c => c.igSemanas !== null)).toBe(true);
    expect(prepared.map(c => c.igSemanas)).toEqual([23, 29, 33, 35, 36, 37, 38]);
  });

  it('deve gerar dados de peso válidos com igSemanas crescentes', () => {
    const prepared = anaClara.map(c => ({
      igSemanas: c.igSemanas || c.igDumSemanas || c.igUltrassomSemanas || null,
      peso: c.peso ? c.peso / 1000 : null,
    }));

    const pesoData = prepared
      .filter(c => c.peso !== null && c.igSemanas != null)
      .map(c => ({ igSemanas: c.igSemanas!, valor: c.peso! }));

    expect(pesoData).toHaveLength(7);
    // Sorted by igSemanas should show ascending weight trend
    const sorted = [...pesoData].sort((a, b) => a.igSemanas - b.igSemanas);
    expect(sorted[0].valor).toBe(69); // 23s - earliest
    expect(sorted[sorted.length - 1].valor).toBe(76.6); // 38s - latest
  });

  it('deve gerar dados de AU válidos com igSemanas crescentes', () => {
    const prepared = anaClara.map(c => ({
      igSemanas: c.igSemanas || c.igDumSemanas || c.igUltrassomSemanas || null,
      au: c.alturaUterina ? (c.alturaUterina === -1 ? null : c.alturaUterina / 10) : null,
    }));

    const auData = prepared
      .filter(c => c.au !== null && c.igSemanas != null)
      .map(c => ({ igSemanas: c.igSemanas!, valor: c.au! }));

    expect(auData).toHaveLength(7);
    // Sorted by igSemanas should show ascending AU trend
    const sorted = [...auData].sort((a, b) => a.igSemanas - b.igSemanas);
    expect(sorted[0].valor).toBe(24); // 23s - earliest
    expect(sorted[sorted.length - 1].valor).toBe(31); // 38s - latest
  });

  it('deve gerar dados de PA válidos (excluindo consulta sem PA)', () => {
    const prepared = anaClara.map(c => ({
      igSemanas: c.igSemanas || c.igDumSemanas || c.igUltrassomSemanas || null,
      paSistolica: c.pressaoSistolica || null,
      paDiastolica: c.pressaoDiastolica || null,
    }));

    const paData = prepared
      .filter(c => c.paSistolica !== null && c.paDiastolica !== null && c.igSemanas != null)
      .map(c => ({ igSemanas: c.igSemanas!, sistolica: c.paSistolica!, diastolica: c.paDiastolica! }));

    // One consultation (29s) has null PA, so should have 6 entries
    expect(paData).toHaveLength(6);
  });
});
