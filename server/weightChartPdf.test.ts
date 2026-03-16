import { describe, it, expect } from 'vitest';

// ─── Weight Chart PDF Tests ──────────────────────────────────────
// Tests for proportional X-axis and ideal weight curve calculation

describe('Proportional X-axis mapping', () => {
  // Mimics the mapWeekToX logic in htmlToPdf.ts
  const createMapWeekToX = (data: number[]) => {
    const minWeek = Math.max(0, Math.min(...data) - 2);
    const maxWeek = Math.min(42, Math.max(...data) + 2);
    const chartX = 14; // padding.left
    const chartW = 100; // arbitrary width
    return {
      mapWeekToX: (week: number) => chartX + ((week - minWeek) / (maxWeek - minWeek)) * chartW,
      minWeek,
      maxWeek,
    };
  };

  it('deve posicionar semanas proporcionalmente ao tempo real', () => {
    const data = [23, 29, 33, 35, 36, 37, 38];
    const { mapWeekToX } = createMapWeekToX(data);

    // Distance between 23 and 29 (6 weeks) should be 6x the distance between 37 and 38 (1 week)
    const dist_23_29 = mapWeekToX(29) - mapWeekToX(23);
    const dist_37_38 = mapWeekToX(38) - mapWeekToX(37);

    expect(dist_23_29 / dist_37_38).toBeCloseTo(6, 1);
  });

  it('deve posicionar semanas equidistantes com espaçamento igual', () => {
    const data = [20, 24, 28, 32, 36, 40];
    const { mapWeekToX } = createMapWeekToX(data);

    const dist_20_24 = mapWeekToX(24) - mapWeekToX(20);
    const dist_24_28 = mapWeekToX(28) - mapWeekToX(24);
    const dist_36_40 = mapWeekToX(40) - mapWeekToX(36);

    expect(dist_20_24).toBeCloseTo(dist_24_28, 5);
    expect(dist_20_24).toBeCloseTo(dist_36_40, 5);
  });

  it('deve ter minWeek >= 0 e maxWeek <= 42', () => {
    const data = [2, 5, 8];
    const { minWeek, maxWeek } = createMapWeekToX(data);
    expect(minWeek).toBeGreaterThanOrEqual(0);
    expect(maxWeek).toBeLessThanOrEqual(42);
  });
});

describe('calcularCurvaPesoIdeal', () => {
  // Mimics the calcularCurvaPesoIdeal logic in htmlToPdf.ts
  function calcularCurvaPesoIdeal(pesoInicial: number, altura: number) {
    const alturaM = altura / 100;
    const imc = pesoInicial / 1000 / (alturaM * alturaM);

    let ganhoMin: number, ganhoMax: number;

    if (imc < 18.5) {
      ganhoMin = 12.5; ganhoMax = 18;
    } else if (imc < 25) {
      ganhoMin = 11.5; ganhoMax = 16;
    } else if (imc < 30) {
      ganhoMin = 7; ganhoMax = 11.5;
    } else {
      ganhoMin = 5; ganhoMax = 9;
    }

    const curva: Array<{ semana: number; pesoMin: number; pesoMax: number }> = [];
    for (let semana = 0; semana <= 42; semana++) {
      let fator: number;
      if (semana <= 13) {
        fator = (semana / 13) * 0.125;
      } else {
        fator = 0.125 + ((semana - 13) / 27) * 0.875;
      }
      curva.push({
        semana,
        pesoMin: (pesoInicial + ganhoMin * 1000 * fator) / 1000,
        pesoMax: (pesoInicial + ganhoMax * 1000 * fator) / 1000,
      });
    }

    return { curva, imc, ganhoMin, ganhoMax };
  }

  it('deve classificar Ana Clara (64.9kg, 163cm) como Peso Adequado', () => {
    const { imc, ganhoMin, ganhoMax } = calcularCurvaPesoIdeal(64900, 163);
    // IMC = 64.9 / (1.63^2) = 24.42
    expect(imc).toBeCloseTo(24.42, 1);
    expect(ganhoMin).toBe(11.5); // Peso Adequado
    expect(ganhoMax).toBe(16);
  });

  it('deve ter peso inicial na semana 0', () => {
    const { curva } = calcularCurvaPesoIdeal(64900, 163);
    expect(curva[0].semana).toBe(0);
    expect(curva[0].pesoMin).toBeCloseTo(64.9, 1);
    expect(curva[0].pesoMax).toBeCloseTo(64.9, 1);
  });

  it('deve ter ganho total correto na semana 40', () => {
    const { curva, ganhoMin, ganhoMax } = calcularCurvaPesoIdeal(64900, 163);
    const pesoInicialKg = 64.9;
    const semana40 = curva[40];
    expect(semana40.pesoMin).toBeCloseTo(pesoInicialKg + ganhoMin, 0.5);
    expect(semana40.pesoMax).toBeCloseTo(pesoInicialKg + ganhoMax, 0.5);
  });

  it('deve ter ganho lento no 1º trimestre', () => {
    const { curva } = calcularCurvaPesoIdeal(64900, 163);
    // Semana 13 should have ~12.5% of total gain
    const ganhoSemana13 = curva[13].pesoMax - curva[0].pesoMax;
    const ganhoSemana40 = curva[40].pesoMax - curva[0].pesoMax;
    expect(ganhoSemana13 / ganhoSemana40).toBeCloseTo(0.125, 1);
  });

  it('deve gerar 43 pontos (semana 0 a 42)', () => {
    const { curva } = calcularCurvaPesoIdeal(64900, 163);
    expect(curva).toHaveLength(43);
    expect(curva[0].semana).toBe(0);
    expect(curva[42].semana).toBe(42);
  });

  it('deve classificar Baixo Peso (IMC < 18.5)', () => {
    // 50kg, 170cm → IMC = 17.3
    const { imc, ganhoMin, ganhoMax } = calcularCurvaPesoIdeal(50000, 170);
    expect(imc).toBeLessThan(18.5);
    expect(ganhoMin).toBe(12.5);
    expect(ganhoMax).toBe(18);
  });

  it('deve classificar Sobrepeso (25 <= IMC < 30)', () => {
    // 80kg, 165cm → IMC = 29.4
    const { imc, ganhoMin, ganhoMax } = calcularCurvaPesoIdeal(80000, 165);
    expect(imc).toBeGreaterThanOrEqual(25);
    expect(imc).toBeLessThan(30);
    expect(ganhoMin).toBe(7);
    expect(ganhoMax).toBe(11.5);
  });

  it('deve classificar Obesidade (IMC >= 30)', () => {
    // 90kg, 160cm → IMC = 35.2
    const { imc, ganhoMin, ganhoMax } = calcularCurvaPesoIdeal(90000, 160);
    expect(imc).toBeGreaterThanOrEqual(30);
    expect(ganhoMin).toBe(5);
    expect(ganhoMax).toBe(9);
  });

  it('pesoMin deve ser sempre <= pesoMax em todas as semanas', () => {
    const { curva } = calcularCurvaPesoIdeal(64900, 163);
    curva.forEach(c => {
      expect(c.pesoMin).toBeLessThanOrEqual(c.pesoMax);
    });
  });

  it('curva deve ser monotonicamente crescente', () => {
    const { curva } = calcularCurvaPesoIdeal(64900, 163);
    for (let i = 1; i < curva.length; i++) {
      expect(curva[i].pesoMin).toBeGreaterThanOrEqual(curva[i - 1].pesoMin);
      expect(curva[i].pesoMax).toBeGreaterThanOrEqual(curva[i - 1].pesoMax);
    }
  });
});
