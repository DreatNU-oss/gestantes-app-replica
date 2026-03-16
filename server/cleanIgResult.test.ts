import { describe, it, expect } from 'vitest';

/**
 * cleanIgResult - limpa resultados de IgG/IgM removendo prefixos e partes combinadas.
 * Replica a mesma lógica usada em htmlToPdf.ts e CartaoPrenatal.tsx.
 */
function cleanIgResult(nomeExame: string, resultado: string): string {
  if (!resultado || resultado === '-') return resultado;
  const isIgExam = /Ig[GM]$/i.test(nomeExame);
  if (!isIgExam) return resultado;
  const r = resultado.trim();
  if (r.includes(' / ')) {
    const isIgM = /IgM$/i.test(nomeExame);
    const parts = r.split(' / ').map(p => p.trim());
    const targetPrefix = isIgM ? 'igm' : 'igg';
    let matched = parts.find(p => p.toLowerCase().startsWith(targetPrefix));
    if (matched) {
      matched = matched.replace(/^ig[gm]\s+/i, '');
      return matched.charAt(0).toUpperCase() + matched.slice(1);
    }
  }
  const cleaned = r.replace(/^ig[gm]\s+/i, '');
  if (cleaned !== r) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return resultado;
}

describe('cleanIgResult', () => {
  describe('IgG exams - combined results', () => {
    it('should extract IgG part from "IgG reagente / IgM não reagente"', () => {
      expect(cleanIgResult('Toxoplasmose IgG', 'IgG reagente / IgM não reagente')).toBe('Reagente');
    });

    it('should extract IgG part from "IgG não reagente / IgM não reagente"', () => {
      expect(cleanIgResult('Rubéola IgG', 'IgG não reagente / IgM não reagente')).toBe('Não reagente');
    });

    it('should extract IgG part from "IgG reagente / IgM reagente"', () => {
      expect(cleanIgResult('Citomegalovírus IgG', 'IgG reagente / IgM reagente')).toBe('Reagente');
    });
  });

  describe('IgM exams - combined results', () => {
    it('should extract IgM part from "IgG reagente / IgM não reagente"', () => {
      expect(cleanIgResult('Toxoplasmose IgM', 'IgG reagente / IgM não reagente')).toBe('Não reagente');
    });

    it('should extract IgM part from "IgG não reagente / IgM reagente"', () => {
      expect(cleanIgResult('Rubéola IgM', 'IgG não reagente / IgM reagente')).toBe('Reagente');
    });
  });

  describe('Simple results (no " / ")', () => {
    it('should clean "IgG reagente" to "Reagente"', () => {
      expect(cleanIgResult('Toxoplasmose IgG', 'IgG reagente')).toBe('Reagente');
    });

    it('should clean "IgM não reagente" to "Não reagente"', () => {
      expect(cleanIgResult('Toxoplasmose IgM', 'IgM não reagente')).toBe('Não reagente');
    });

    it('should return "Não Reagente" as-is for IgM exam', () => {
      expect(cleanIgResult('Rubéola IgM', 'Não Reagente')).toBe('Não Reagente');
    });

    it('should return "Reagente" as-is for IgG exam', () => {
      expect(cleanIgResult('Citomegalovírus IgG', 'Reagente')).toBe('Reagente');
    });
  });

  describe('Non-Ig exams - should not be modified', () => {
    it('should not modify VDRL result', () => {
      expect(cleanIgResult('VDRL', 'Não Reagente')).toBe('Não Reagente');
    });

    it('should not modify HIV result', () => {
      expect(cleanIgResult('HIV', 'Não Reagente')).toBe('Não Reagente');
    });

    it('should not modify Hepatite B result', () => {
      expect(cleanIgResult('Hepatite B (HBsAg)', 'Não Reagente')).toBe('Não Reagente');
    });

    it('should not modify TSH result', () => {
      expect(cleanIgResult('TSH', '2.1 mUI/L')).toBe('2.1 mUI/L');
    });
  });

  describe('Edge cases', () => {
    it('should return "-" for empty result', () => {
      expect(cleanIgResult('Toxoplasmose IgG', '-')).toBe('-');
    });

    it('should return empty string for empty string', () => {
      expect(cleanIgResult('Toxoplasmose IgG', '')).toBe('');
    });

    it('should handle FTA-ABS IgG', () => {
      expect(cleanIgResult('FTA-ABS IgG', 'IgG reagente / IgM não reagente')).toBe('Reagente');
    });

    it('should handle FTA-ABS IgM', () => {
      expect(cleanIgResult('FTA-ABS IgM', 'IgG reagente / IgM não reagente')).toBe('Não reagente');
    });
  });
});
