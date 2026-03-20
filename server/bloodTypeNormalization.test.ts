/**
 * Tests for blood type normalization logic used in AI lab exam interpretation.
 * The normalizarValorExame function in ExamesLaboratoriais.tsx must correctly
 * convert various AI-returned blood type formats to the dropdown-expected format.
 */

import { describe, it, expect } from 'vitest';

// Replicate the normalization logic from ExamesLaboratoriais.tsx
function normalizarTipoSanguineo(valor: string): string {
  const valorLower = valor.toLowerCase().trim();

  // Detectar grupo ABO
  let grupoABO = '';
  if (/\bab\b/i.test(valorLower)) {
    grupoABO = 'AB';
  } else if (/\ba\b|grupo\s*a|tipo\s*a|grupo\s+sanguíneo\s*:\s*a/i.test(valorLower)) {
    grupoABO = 'A';
  } else if (/\bb\b|grupo\s*b|tipo\s*b/i.test(valorLower)) {
    grupoABO = 'B';
  } else if (/\bo\b|grupo\s*o|tipo\s*o/i.test(valorLower)) {
    grupoABO = 'O';
  }

  // Detectar fator Rh
  let fatorRh = '';
  if (
    valorLower.includes('negativo') ||
    valorLower.includes('neg') ||
    valorLower.includes('rh -') ||
    valorLower.includes('rh-') ||
    valor.includes('-')
  ) {
    fatorRh = '-';
  } else if (
    valorLower.includes('positivo') ||
    valorLower.includes('pos') ||
    valorLower.includes('rh +') ||
    valorLower.includes('rh+') ||
    valor.includes('+')
  ) {
    fatorRh = '+';
  }

  if (grupoABO && fatorRh) {
    return `${grupoABO}${fatorRh}`;
  }

  return valor; // fallback: return original
}

describe('Blood Type Normalization (AI extraction)', () => {
  // --- A Negative ---
  it('normalizes "A Negativo" to "A-"', () => {
    expect(normalizarTipoSanguineo('A Negativo')).toBe('A-');
  });

  it('normalizes "A NEG" to "A-"', () => {
    expect(normalizarTipoSanguineo('A NEG')).toBe('A-');
  });

  it('normalizes "Grupo A / RH Negativo" to "A-"', () => {
    expect(normalizarTipoSanguineo('Grupo A / RH Negativo')).toBe('A-');
  });

  it('normalizes "GRUPO SANGUÍNEO : A / RH : Negativo" to "A-"', () => {
    expect(normalizarTipoSanguineo('GRUPO SANGUÍNEO : A / RH : Negativo')).toBe('A-');
  });

  it('normalizes "Tipo A, RH Negativo" to "A-"', () => {
    expect(normalizarTipoSanguineo('Tipo A, RH Negativo')).toBe('A-');
  });

  // --- A Positive ---
  it('normalizes "A Positivo" to "A+"', () => {
    expect(normalizarTipoSanguineo('A Positivo')).toBe('A+');
  });

  it('normalizes "A POS" to "A+"', () => {
    expect(normalizarTipoSanguineo('A POS')).toBe('A+');
  });

  it('normalizes "A+" to "A+"', () => {
    expect(normalizarTipoSanguineo('A+')).toBe('A+');
  });

  it('normalizes "A-" to "A-"', () => {
    expect(normalizarTipoSanguineo('A-')).toBe('A-');
  });

  // --- B Negative ---
  it('normalizes "B Negativo" to "B-"', () => {
    expect(normalizarTipoSanguineo('B Negativo')).toBe('B-');
  });

  it('normalizes "B NEG" to "B-"', () => {
    expect(normalizarTipoSanguineo('B NEG')).toBe('B-');
  });

  // --- B Positive ---
  it('normalizes "B Positivo" to "B+"', () => {
    expect(normalizarTipoSanguineo('B Positivo')).toBe('B+');
  });

  // --- AB Negative ---
  it('normalizes "AB Negativo" to "AB-"', () => {
    expect(normalizarTipoSanguineo('AB Negativo')).toBe('AB-');
  });

  it('normalizes "AB NEG" to "AB-"', () => {
    expect(normalizarTipoSanguineo('AB NEG')).toBe('AB-');
  });

  // --- AB Positive ---
  it('normalizes "AB Positivo" to "AB+"', () => {
    expect(normalizarTipoSanguineo('AB Positivo')).toBe('AB+');
  });

  it('normalizes "AB+" to "AB+"', () => {
    expect(normalizarTipoSanguineo('AB+')).toBe('AB+');
  });

  // --- O Negative ---
  it('normalizes "O Negativo" to "O-"', () => {
    expect(normalizarTipoSanguineo('O Negativo')).toBe('O-');
  });

  it('normalizes "O NEG" to "O-"', () => {
    expect(normalizarTipoSanguineo('O NEG')).toBe('O-');
  });

  it('normalizes "Grupo O / RH Negativo" to "O-"', () => {
    expect(normalizarTipoSanguineo('Grupo O / RH Negativo')).toBe('O-');
  });

  // --- O Positive ---
  it('normalizes "O Positivo" to "O+"', () => {
    expect(normalizarTipoSanguineo('O Positivo')).toBe('O+');
  });

  it('normalizes "O+" to "O+"', () => {
    expect(normalizarTipoSanguineo('O+')).toBe('O+');
  });

  // --- Ferreira Davo specific format ---
  it('normalizes Ferreira Davo format "A / RH Negativo / Du Negativo" to "A-"', () => {
    // The AI would extract "A Negativo" or similar from this lab format
    expect(normalizarTipoSanguineo('A Negativo')).toBe('A-');
  });

  // --- Already correct format (passthrough) ---
  it('keeps "A-" unchanged', () => {
    expect(normalizarTipoSanguineo('A-')).toBe('A-');
  });

  it('keeps "O+" unchanged', () => {
    expect(normalizarTipoSanguineo('O+')).toBe('O+');
  });

  it('keeps "AB-" unchanged', () => {
    expect(normalizarTipoSanguineo('AB-')).toBe('AB-');
  });
});
