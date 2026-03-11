import { describe, it, expect } from 'vitest';
import { normalizeDateForInput, normalizeDadosDatas } from '../shared/dateNormalization';

describe('normalizeDateForInput', () => {
  it('should convert dd/mm/yyyy to yyyy-MM-dd', () => {
    expect(normalizeDateForInput('07/10/2025')).toBe('2025-10-07');
    expect(normalizeDateForInput('14/05/2026')).toBe('2026-05-14');
    expect(normalizeDateForInput('01/01/2024')).toBe('2024-01-01');
  });

  it('should convert dd-mm-yyyy to yyyy-MM-dd', () => {
    expect(normalizeDateForInput('07-10-2025')).toBe('2025-10-07');
    expect(normalizeDateForInput('14-05-2026')).toBe('2026-05-14');
  });

  it('should convert dd.mm.yyyy to yyyy-MM-dd', () => {
    expect(normalizeDateForInput('07.10.2025')).toBe('2025-10-07');
  });

  it('should keep yyyy-MM-dd as is', () => {
    expect(normalizeDateForInput('2025-10-07')).toBe('2025-10-07');
    expect(normalizeDateForInput('2026-05-14')).toBe('2026-05-14');
  });

  it('should handle single digit day/month', () => {
    expect(normalizeDateForInput('7/1/2025')).toBe('2025-01-07');
    expect(normalizeDateForInput('3/9/2024')).toBe('2024-09-03');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeDateForInput('')).toBe('');
    expect(normalizeDateForInput('  ')).toBe('');
  });

  it('should return original string for unrecognized format', () => {
    expect(normalizeDateForInput('October 7, 2025')).toBe('October 7, 2025');
    expect(normalizeDateForInput('abc')).toBe('abc');
  });

  it('should handle yyyy/mm/dd format', () => {
    expect(normalizeDateForInput('2025/10/07')).toBe('2025-10-07');
    expect(normalizeDateForInput('2026/5/14')).toBe('2026-05-14');
  });
});

describe('normalizeDadosDatas', () => {
  it('should normalize dataExame and dpp fields', () => {
    const dados = {
      dataExame: '07/10/2025',
      dpp: '14/05/2026',
      idadeGestacional: '8 semanas e 5 dias',
      ccn: '21 cm',
    };
    const result = normalizeDadosDatas(dados);
    expect(result.dataExame).toBe('2025-10-07');
    expect(result.dpp).toBe('2026-05-14');
    expect(result.idadeGestacional).toBe('8 semanas e 5 dias');
    expect(result.ccn).toBe('21 cm');
  });

  it('should not modify non-date fields', () => {
    const dados = {
      bcf: '179 bpm',
      hematoma: 'Não',
    };
    const result = normalizeDadosDatas(dados);
    expect(result.bcf).toBe('179 bpm');
    expect(result.hematoma).toBe('Não');
  });

  it('should handle missing date fields gracefully', () => {
    const dados = {
      idadeGestacional: '12 semanas',
    };
    const result = normalizeDadosDatas(dados);
    expect(result.idadeGestacional).toBe('12 semanas');
    expect(result.dataExame).toBeUndefined();
    expect(result.dpp).toBeUndefined();
  });
});
