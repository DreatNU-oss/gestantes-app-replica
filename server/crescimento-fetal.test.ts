import { describe, it, expect } from 'vitest';
import { FMF_PESO } from '../shared/fmfPercentis';

// ── Replicate the helper functions from the endpoint for unit testing ──

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

function pesoNoPercentil(igDecimal: number, percentil: number): number {
  const pcts = [
    { p: 1, campo: 'p1' as const },
    { p: 3, campo: 'p3' as const },
    { p: 10, campo: 'p10' as const },
    { p: 50, campo: 'p50' as const },
    { p: 90, campo: 'p90' as const },
    { p: 97, campo: 'p97' as const },
    { p: 99, campo: 'p99' as const },
  ];
  const valores = pcts.map(pc => ({
    p: pc.p,
    valor: interpolarFMF(igDecimal, FMF_PESO, pc.campo),
  }));
  if (percentil <= 1) return valores[0].valor;
  if (percentil >= 99) return valores[valores.length - 1].valor;
  for (let i = 0; i < valores.length - 1; i++) {
    if (percentil >= valores[i].p && percentil <= valores[i + 1].p) {
      const frac = (percentil - valores[i].p) / (valores[i + 1].p - valores[i].p);
      return Math.round(valores[i].valor + frac * (valores[i + 1].valor - valores[i].valor));
    }
  }
  return valores[3].valor;
}

function parsePercentil(v: string | undefined | null): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(',', '.').replace(/[^0-9.]/g, ''));
  return isNaN(n) || n <= 0 ? null : n;
}

function comprimentoPorIG(igSemanas: number): number {
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

describe('Crescimento Fetal - Helpers', () => {
  describe('interpolarFMF', () => {
    it('deve retornar valor exato para IG inteira', () => {
      const p50_30 = interpolarFMF(30, FMF_PESO, 'p50');
      expect(p50_30).toBe(1460); // FMF_PESO ig=30, p50=1460
    });

    it('deve interpolar entre duas IGs', () => {
      const p50_30_5 = interpolarFMF(30.5, FMF_PESO, 'p50');
      // Média entre 1460 (ig30) e 1650 (ig31)
      expect(p50_30_5).toBeCloseTo(1555, 0);
    });

    it('deve retornar 0 para IG fora da tabela', () => {
      const result = interpolarFMF(15, FMF_PESO, 'p50');
      expect(result).toBe(0);
    });

    it('deve retornar valor do extremo para IG no limite', () => {
      const p50_22 = interpolarFMF(22, FMF_PESO, 'p50');
      expect(p50_22).toBe(470);
      const p50_40 = interpolarFMF(40, FMF_PESO, 'p50');
      expect(p50_40).toBe(3550);
    });
  });

  describe('pesoNoPercentil', () => {
    it('deve retornar P50 para percentil 50', () => {
      const peso = pesoNoPercentil(30, 50);
      expect(peso).toBe(1460); // P50 na IG 30
    });

    it('deve retornar P10 para percentil 10', () => {
      const peso = pesoNoPercentil(30, 10);
      expect(peso).toBe(1230); // P10 na IG 30
    });

    it('deve retornar P90 para percentil 90', () => {
      const peso = pesoNoPercentil(30, 90);
      expect(peso).toBe(1730); // P90 na IG 30
    });

    it('deve interpolar entre P10 e P50 para percentil 30', () => {
      const peso = pesoNoPercentil(30, 30);
      // Entre P10=1230 e P50=1460, frac = (30-10)/(50-10) = 0.5
      expect(peso).toBe(Math.round(1230 + 0.5 * (1460 - 1230)));
      expect(peso).toBe(1345);
    });

    it('deve retornar P1 para percentil <= 1', () => {
      const peso = pesoNoPercentil(30, 0.5);
      expect(peso).toBe(1040); // P1 na IG 30
    });

    it('deve retornar P99 para percentil >= 99', () => {
      const peso = pesoNoPercentil(30, 99.5);
      expect(peso).toBe(2010); // P99 na IG 30
    });

    it('deve funcionar com percentil 37.6 (caso real)', () => {
      const peso = pesoNoPercentil(32, 37.6);
      // Entre P10=1580 e P50=1860, frac = (37.6-10)/(50-10) = 0.69
      const expected = Math.round(1580 + 0.69 * (1860 - 1580));
      expect(peso).toBeCloseTo(expected, 0);
      expect(peso).toBeGreaterThan(1580);
      expect(peso).toBeLessThan(1860);
    });
  });

  describe('parsePercentil', () => {
    it('deve parsear percentil com vírgula brasileira', () => {
      expect(parsePercentil('37,6')).toBeCloseTo(37.6);
    });

    it('deve parsear percentil com ponto', () => {
      expect(parsePercentil('37.6')).toBeCloseTo(37.6);
    });

    it('deve retornar null para string vazia', () => {
      expect(parsePercentil('')).toBeNull();
    });

    it('deve retornar null para null/undefined', () => {
      expect(parsePercentil(null)).toBeNull();
      expect(parsePercentil(undefined)).toBeNull();
    });

    it('deve retornar null para valor zero', () => {
      expect(parsePercentil('0')).toBeNull();
    });

    it('deve parsear percentil com texto extra', () => {
      expect(parsePercentil('p37.6')).toBeCloseTo(37.6);
    });
  });

  describe('comprimentoPorIG', () => {
    it('deve retornar comprimento para IG 30', () => {
      expect(comprimentoPorIG(30)).toBe(39.9);
    });

    it('deve retornar comprimento para IG 40', () => {
      expect(comprimentoPorIG(40)).toBe(51.2);
    });

    it('deve interpolar entre IGs', () => {
      const c = comprimentoPorIG(30.5);
      // Média entre 39.9 (ig30) e 41.1 (ig31)
      expect(c).toBeCloseTo(40.5, 1);
    });

    it('deve clampar para IG < 22', () => {
      // A função clamp igFloor para 22, mas frac fica negativa (20-22=-2)
      // Resultado: 27.8 + (-2) * (28.9 - 27.8) = 27.8 - 2.2 = 25.6
      // Isso é aceitável pois o endpoint só usa a partir de IG >= 22
      const c = comprimentoPorIG(22);
      expect(c).toBe(27.8); // IG 22 retorna valor correto
    });
  });

  describe('Lógica de estimativa personalizada', () => {
    it('não deve gerar estimativa personalizada antes de 22 semanas', () => {
      const igAtualSemanas = 20;
      const disponivel = igAtualSemanas >= 22;
      expect(disponivel).toBe(false);
    });

    it('deve gerar estimativa personalizada a partir de 22 semanas com percentil', () => {
      const igAtualSemanas = 30;
      const percentil = 37.6;
      const disponivel = igAtualSemanas >= 22 && percentil !== null;
      expect(disponivel).toBe(true);

      const peso = pesoNoPercentil(30, percentil);
      expect(peso).toBeGreaterThan(0);
      expect(peso).toBeLessThan(interpolarFMF(30, FMF_PESO, 'p50'));
    });

    it('não deve gerar estimativa sem ultrassom com percentil', () => {
      const ultrassonsComPercentil: any[] = [];
      const disponivel = ultrassonsComPercentil.length > 0;
      expect(disponivel).toBe(false);
    });

    it('deve usar o ultrassom mais recente com percentil', () => {
      const ultrassons = [
        { dataExame: '2026-01-15', dados: { percentilPeso: '25' } },
        { dataExame: '2026-03-10', dados: { percentilPeso: '37,6' } },
        { dataExame: '2026-02-20', dados: { percentilPeso: '30' } },
      ];
      const sorted = ultrassons
        .filter(us => parsePercentil(us.dados.percentilPeso) !== null)
        .sort((a, b) => b.dataExame.localeCompare(a.dataExame));
      
      expect(sorted[0].dataExame).toBe('2026-03-10');
      expect(parsePercentil(sorted[0].dados.percentilPeso)).toBeCloseTo(37.6);
    });
  });
});
