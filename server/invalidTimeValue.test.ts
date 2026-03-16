import { describe, it, expect } from 'vitest';

// ─── Invalid Time Value Bug Fix Tests ──────────────────────────────────────
// Tests that DUM values like "Incerta", "Incompatível com US", "Compatível com US"
// are properly handled and don't cause "Invalid time value" errors.

describe('DUM Safe Date Parsing', () => {
  // Helper that mimics the safe DUM parsing pattern used across the codebase
  const safeParseDUM = (dum: string | null): Date | null => {
    if (!dum) return null;
    if (dum === 'Incerta' || dum.includes('Compatível') || dum.includes('Incompatível')) return null;
    const d = new Date(dum + 'T12:00:00');
    if (isNaN(d.getTime())) return null;
    return d;
  };

  it('deve retornar null para DUM "Incerta"', () => {
    expect(safeParseDUM('Incerta')).toBeNull();
  });

  it('deve retornar null para DUM "Incompatível com US"', () => {
    expect(safeParseDUM('Incompatível com US')).toBeNull();
  });

  it('deve retornar null para DUM "Compatível com US"', () => {
    expect(safeParseDUM('Compatível com US')).toBeNull();
  });

  it('deve retornar null para DUM null', () => {
    expect(safeParseDUM(null)).toBeNull();
  });

  it('deve retornar Date válida para DUM "2025-06-15"', () => {
    const result = safeParseDUM('2025-06-15');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(5); // June = 5 (0-indexed)
    expect(result!.getDate()).toBe(15);
  });

  it('deve retornar Date válida para DUM "2026-01-01"', () => {
    const result = safeParseDUM('2026-01-01');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
  });

  it('deve retornar null para string aleatória', () => {
    expect(safeParseDUM('texto qualquer')).toBeNull();
  });
});

describe('DPP Calculation with Invalid DUM', () => {
  // Mimics the DPP calculation pattern in routers.ts / gestante-router.ts
  const calcularDPP = (dum: string | null): string | null => {
    if (!dum || dum === 'Incerta' || dum.includes('Compatível') || dum.includes('Incompatível')) {
      return null;
    }
    const dumDate = new Date(dum + 'T12:00:00');
    if (isNaN(dumDate.getTime())) return null;
    const dpp = new Date(dumDate);
    dpp.setDate(dpp.getDate() + 280);
    return dpp.toISOString().split('T')[0];
  };

  it('não deve lançar erro para DUM "Incerta"', () => {
    expect(() => calcularDPP('Incerta')).not.toThrow();
    expect(calcularDPP('Incerta')).toBeNull();
  });

  it('não deve lançar erro para DUM "Incompatível com US"', () => {
    expect(() => calcularDPP('Incompatível com US')).not.toThrow();
    expect(calcularDPP('Incompatível com US')).toBeNull();
  });

  it('não deve lançar erro para DUM "Compatível com US"', () => {
    expect(() => calcularDPP('Compatível com US')).not.toThrow();
    expect(calcularDPP('Compatível com US')).toBeNull();
  });

  it('deve calcular DPP corretamente para DUM válida', () => {
    const dpp = calcularDPP('2025-06-15');
    expect(dpp).not.toBeNull();
    // 2025-06-15 + 280 dias = 2026-03-22
    expect(dpp).toBe('2026-03-22');
  });

  it('deve retornar null para DUM null', () => {
    expect(calcularDPP(null)).toBeNull();
  });
});

describe('DUM Formatting for PDF', () => {
  // Mimics the DUM formatting pattern in dadosPdf sections
  const formatarDUM = (dum: string | null): string | null => {
    if (!dum) return null;
    if (dum.includes('Incerta') || dum.includes('Compatível') || dum.includes('Incompatível')) {
      return dum; // Return the text as-is
    }
    const d = new Date(dum + 'T12:00:00');
    return isNaN(d.getTime()) ? dum : d.toISOString().split('T')[0];
  };

  it('deve retornar "Incerta" como texto para DUM "Incerta"', () => {
    expect(formatarDUM('Incerta')).toBe('Incerta');
  });

  it('deve retornar "Incompatível com US" como texto', () => {
    expect(formatarDUM('Incompatível com US')).toBe('Incompatível com US');
  });

  it('deve retornar "Compatível com US" como texto', () => {
    expect(formatarDUM('Compatível com US')).toBe('Compatível com US');
  });

  it('deve formatar data válida corretamente', () => {
    expect(formatarDUM('2025-06-15')).toBe('2025-06-15');
  });

  it('deve retornar null para DUM null', () => {
    expect(formatarDUM(null)).toBeNull();
  });

  it('não deve lançar "Invalid time value" para nenhum valor de DUM', () => {
    const valoresDUM = [
      'Incerta',
      'Incompatível com US',
      'Compatível com US',
      '2025-06-15',
      null,
      '',
      'texto aleatório',
    ];
    valoresDUM.forEach(dum => {
      expect(() => formatarDUM(dum)).not.toThrow();
    });
  });
});

describe('IG Calculation with Invalid DUM', () => {
  // Mimics the IG calculation pattern in lembretes.ts
  const calcularIG = (dum: string | null): { semanas: number; dias: number } | null => {
    if (!dum || dum === 'Incerta' || dum.includes('Compatível') || dum.includes('Incompatível')) {
      return null;
    }
    const dumDate = new Date(dum + 'T12:00:00');
    if (isNaN(dumDate.getTime())) return null;
    const hoje = new Date();
    const diffMs = hoje.getTime() - dumDate.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      semanas: Math.floor(diffDias / 7),
      dias: diffDias % 7,
    };
  };

  it('não deve lançar erro para DUM "Incerta"', () => {
    expect(() => calcularIG('Incerta')).not.toThrow();
    expect(calcularIG('Incerta')).toBeNull();
  });

  it('não deve lançar erro para DUM "Incompatível com US"', () => {
    expect(() => calcularIG('Incompatível com US')).not.toThrow();
    expect(calcularIG('Incompatível com US')).toBeNull();
  });

  it('deve calcular IG para DUM válida', () => {
    const result = calcularIG('2025-06-15');
    expect(result).not.toBeNull();
    expect(result!.semanas).toBeGreaterThan(0);
    expect(result!.dias).toBeGreaterThanOrEqual(0);
    expect(result!.dias).toBeLessThan(7);
  });
});
