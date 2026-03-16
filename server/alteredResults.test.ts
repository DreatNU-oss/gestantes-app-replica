import { describe, it, expect } from 'vitest';

/**
 * Tests for the isResultadoAlterado function that determines
 * whether a lab exam result should be highlighted in red in the PDF.
 * 
 * The function is duplicated in htmlToPdf.ts (backend) and CartaoPrenatal.tsx (frontend).
 * We test the logic here to ensure correctness.
 */

// Replicate the isResultadoAlterado logic for testing
function isResultadoAlterado(nomeExame: string, resultado: string): boolean {
  if (!resultado || resultado === '-') return false;
  const r = resultado.toLowerCase().trim();
  
  const palavrasAlteradas = [
    'reagente', 'positiv', 'detecta', 'presente', 'anormal',
    'alterado', 'elevad', 'aumentad', 'reduzid', 'baixo',
    'insuficien', 'deficien'
  ];
  const palavrasNormais = [
    'não reagente', 'nao reagente', 'n reagente', 'nr',
    'não reag', 'nao reag', 'negativ', 'não detecta', 'nao detecta',
    'não reativo', 'nao reativo', 'imune', 'normal', 'adequad',
    'ausente', 'suficien'
  ];
  
  for (const normal of palavrasNormais) {
    if (r.includes(normal)) return false;
  }
  for (const alterada of palavrasAlteradas) {
    if (r.includes(alterada)) return true;
  }
  
  const numMatch = r.match(/([\d.,]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(',', '.'));
    if (isNaN(val)) return false;
    
    const nome = nomeExame.toLowerCase();
    
    if ((nome.includes('hemoglobina') || nome.includes('hemat')) && val < 11 && !r.includes('%')) return true;
    if (nome.includes('plaqueta')) {
      const plaq = r.includes('.') && val > 100 ? val * 1000 : val;
      if (plaq < 150000) return true;
    }
    if (nome.includes('glicemia') && nome.includes('jejum') && val >= 92) return true;
    if (nome === 'tsh' && (val > 4.0 || val < 0.1)) return true;
    if (nome.includes('ttgo') || nome.includes('curva glic')) {
      const partes = r.split(/[\/|;,]/).map(p => parseFloat(p.replace(',', '.')));
      if (partes.length >= 1 && partes[0] >= 92) return true;
      if (partes.length >= 2 && partes[1] >= 180) return true;
      if (partes.length >= 3 && partes[2] >= 153) return true;
    }
    if (nome.includes('ferritina') && val < 15) return true;
    if (nome.includes('vitamina d') && val < 20) return true;
    if ((nome.includes('vitamina b12') || nome.includes('b12')) && val < 200) return true;
  }
  
  if (nomeExame.toLowerCase().includes('urocultura') && (r.includes('positiv') || r.includes('crescimento'))) return true;
  if ((nomeExame.toLowerCase().includes('epf') || nomeExame.toLowerCase().includes('parasitol')) && (r.includes('positiv') || r.includes('presente') || r.includes('encontrad'))) return true;
  
  return false;
}

describe('isResultadoAlterado - Keyword-based detection', () => {
  // Normal results should NOT be flagged
  it('should return false for "Não Reagente"', () => {
    expect(isResultadoAlterado('VDRL', 'Não Reagente')).toBe(false);
  });

  it('should return false for "Nao Reagente" (without accent)', () => {
    expect(isResultadoAlterado('VDRL', 'Nao Reagente')).toBe(false);
  });

  it('should return false for "Negativo"', () => {
    expect(isResultadoAlterado('HIV', 'Negativo')).toBe(false);
  });

  it('should return false for "Não Detectado"', () => {
    expect(isResultadoAlterado('Hepatite C (Anti-HCV)', 'Não Detectado')).toBe(false);
  });

  it('should return false for "Imune"', () => {
    expect(isResultadoAlterado('Rubéola IgG', 'Imune')).toBe(false);
  });

  it('should return false for "Normal"', () => {
    expect(isResultadoAlterado('EAS (Urina tipo 1)', 'Normal')).toBe(false);
  });

  it('should return false for "-" (no result)', () => {
    expect(isResultadoAlterado('VDRL', '-')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isResultadoAlterado('VDRL', '')).toBe(false);
  });

  // Altered results SHOULD be flagged
  it('should return true for "Reagente"', () => {
    expect(isResultadoAlterado('VDRL', 'Reagente')).toBe(true);
  });

  it('should return true for "Positivo"', () => {
    expect(isResultadoAlterado('HIV', 'Positivo')).toBe(true);
  });

  it('should return true for "Positiva"', () => {
    expect(isResultadoAlterado('Toxoplasmose IgM', 'Positiva')).toBe(true);
  });

  it('should return true for "Detectado"', () => {
    expect(isResultadoAlterado('Hepatite B (HBsAg)', 'Detectado')).toBe(true);
  });

  it('should return true for "Alterado"', () => {
    expect(isResultadoAlterado('Eletroforese de Hemoglobina', 'Alterado')).toBe(true);
  });

  it('should return true for "Presente"', () => {
    expect(isResultadoAlterado('Coombs indireto', 'Presente')).toBe(true);
  });
});

describe('isResultadoAlterado - Numeric thresholds', () => {
  // Hemoglobina
  it('should flag Hemoglobina < 11 g/dl', () => {
    expect(isResultadoAlterado('Hemoglobina/Hematócrito', '10.5 g/dl')).toBe(true);
  });

  it('should not flag Hemoglobina >= 11 g/dl', () => {
    expect(isResultadoAlterado('Hemoglobina/Hematócrito', '12.5 g/dl')).toBe(false);
  });

  it('should not flag Hematócrito percentage', () => {
    expect(isResultadoAlterado('Hemoglobina/Hematócrito', '35%')).toBe(false);
  });

  // Plaquetas
  it('should flag Plaquetas < 150.000', () => {
    expect(isResultadoAlterado('Plaquetas', '120.000')).toBe(true);
  });

  it('should not flag Plaquetas >= 150.000', () => {
    expect(isResultadoAlterado('Plaquetas', '250.000')).toBe(false);
  });

  // Glicemia de jejum
  it('should flag Glicemia de jejum >= 92', () => {
    expect(isResultadoAlterado('Glicemia de jejum', '95 mg/dl')).toBe(true);
  });

  it('should not flag Glicemia de jejum < 92', () => {
    expect(isResultadoAlterado('Glicemia de jejum', '85 mg/dl')).toBe(false);
  });

  // TSH
  it('should flag TSH > 4.0', () => {
    expect(isResultadoAlterado('TSH', '5.2 mUI/L')).toBe(true);
  });

  it('should flag TSH < 0.1', () => {
    expect(isResultadoAlterado('TSH', '0.05 mUI/L')).toBe(true);
  });

  it('should not flag TSH in normal range', () => {
    expect(isResultadoAlterado('TSH', '2.5 mUI/L')).toBe(false);
  });

  // TTGO
  it('should flag TTGO with fasting >= 92', () => {
    expect(isResultadoAlterado('TTGO 75g (Curva Glicêmica)', '95/150/140')).toBe(true);
  });

  it('should flag TTGO with 1h >= 180', () => {
    expect(isResultadoAlterado('TTGO 75g (Curva Glicêmica)', '85/185/140')).toBe(true);
  });

  it('should flag TTGO with 2h >= 153', () => {
    expect(isResultadoAlterado('TTGO 75g (Curva Glicêmica)', '85/150/160')).toBe(true);
  });

  it('should not flag TTGO with all values normal', () => {
    expect(isResultadoAlterado('TTGO 75g (Curva Glicêmica)', '85/150/140')).toBe(false);
  });

  // Ferritina
  it('should flag Ferritina < 15', () => {
    expect(isResultadoAlterado('Ferritina', '10 ng/ml')).toBe(true);
  });

  it('should not flag Ferritina >= 15', () => {
    expect(isResultadoAlterado('Ferritina', '45 ng/ml')).toBe(false);
  });

  // Vitamina D
  it('should flag Vitamina D < 20', () => {
    expect(isResultadoAlterado('Vitamina D (25-OH)', '15 ng/ml')).toBe(true);
  });

  it('should not flag Vitamina D >= 20', () => {
    expect(isResultadoAlterado('Vitamina D (25-OH)', '32 ng/ml')).toBe(false);
  });

  // Vitamina B12
  it('should flag Vitamina B12 < 200', () => {
    expect(isResultadoAlterado('Vitamina B12', '150 pg/ml')).toBe(true);
  });

  it('should not flag Vitamina B12 >= 200', () => {
    expect(isResultadoAlterado('Vitamina B12', '450 pg/ml')).toBe(false);
  });
});

describe('isResultadoAlterado - Specific exams', () => {
  // Urocultura
  it('should flag Urocultura positiva', () => {
    expect(isResultadoAlterado('Urocultura', 'Positiva - E. coli')).toBe(true);
  });

  it('should flag Urocultura with crescimento', () => {
    expect(isResultadoAlterado('Urocultura', 'Crescimento bacteriano')).toBe(true);
  });

  it('should not flag Urocultura negativa', () => {
    expect(isResultadoAlterado('Urocultura', 'Negativa')).toBe(false);
  });

  // EPF
  it('should flag EPF positivo', () => {
    expect(isResultadoAlterado('EPF (Parasitológico de Fezes)', 'Positivo - Giardia')).toBe(true);
  });

  it('should not flag EPF negativo', () => {
    expect(isResultadoAlterado('EPF (Parasitológico de Fezes)', 'Negativo')).toBe(false);
  });

  // Tipagem sanguínea - should never be flagged (it's informational)
  it('should not flag blood type O+', () => {
    expect(isResultadoAlterado('Tipagem sanguínea ABO/Rh', 'O+')).toBe(false);
  });

  it('should not flag blood type A-', () => {
    expect(isResultadoAlterado('Tipagem sanguínea ABO/Rh', 'A-')).toBe(false);
  });
});

describe('isResultadoAlterado - Edge cases', () => {
  it('should handle "Não Reagente" with different casing', () => {
    expect(isResultadoAlterado('VDRL', 'NÃO REAGENTE')).toBe(false);
  });

  it('should handle "REAGENTE" in uppercase', () => {
    expect(isResultadoAlterado('VDRL', 'REAGENTE')).toBe(true);
  });

  it('should handle result with extra whitespace', () => {
    expect(isResultadoAlterado('HIV', '  Positivo  ')).toBe(true);
  });

  it('should handle "Reagente 1:8" (VDRL with titer)', () => {
    expect(isResultadoAlterado('VDRL', 'Reagente 1:8')).toBe(true);
  });

  it('should not flag "Não Reativo" for Anti-HBs', () => {
    expect(isResultadoAlterado('Anti-HBs', 'Não Reativo')).toBe(false);
  });

  it('should handle comma decimal separator', () => {
    expect(isResultadoAlterado('TSH', '5,2 mUI/L')).toBe(true);
  });

  it('should handle hemoglobin with slash format "10.5/32"', () => {
    expect(isResultadoAlterado('Hemoglobina/Hematócrito', '10.5/32')).toBe(true);
  });

  it('should not flag normal hemoglobin with slash format "12.5/38"', () => {
    expect(isResultadoAlterado('Hemoglobina/Hematócrito', '12.5/38')).toBe(false);
  });
});
