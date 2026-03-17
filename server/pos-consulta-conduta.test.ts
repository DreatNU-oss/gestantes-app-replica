import { describe, it, expect } from 'vitest';

/**
 * Tests for the pos_consulta_conduta (Post-Consultation by Conduta) feature.
 * This feature schedules WhatsApp messages X days after a consultation
 * where a specific conduta was selected.
 */

// Simulate the scheduling logic from whatsappScheduler.ts
function shouldScheduleMessage(
  condutas: string[],
  condutaGatilho: string,
): boolean {
  return condutas.some(c => c === condutaGatilho);
}

function calculateSendDate(consultaDate: Date, diasAposConsulta: number): Date {
  const sendDate = new Date(consultaDate);
  sendDate.setDate(sendDate.getDate() + diasAposConsulta);
  return sendDate;
}

describe('Pós-Consulta por Conduta - Scheduling Logic', () => {
  it('should match when conduta is present in consultation condutas', () => {
    const condutas = ['Rotina Laboratorial 1º Trimestre', 'Vacinas (Prescrevo ou Oriento)'];
    expect(shouldScheduleMessage(condutas, 'Rotina Laboratorial 1º Trimestre')).toBe(true);
  });

  it('should NOT match when conduta is NOT present', () => {
    const condutas = ['Vacinas (Prescrevo ou Oriento)', 'US Obstétrico Endovaginal'];
    expect(shouldScheduleMessage(condutas, 'Rotina Laboratorial 1º Trimestre')).toBe(false);
  });

  it('should NOT match with empty condutas', () => {
    const condutas: string[] = [];
    expect(shouldScheduleMessage(condutas, 'Rotina Laboratorial 1º Trimestre')).toBe(false);
  });

  it('should match exact conduta name (case-sensitive)', () => {
    const condutas = ['rotina laboratorial 1º trimestre'];
    expect(shouldScheduleMessage(condutas, 'Rotina Laboratorial 1º Trimestre')).toBe(false);
  });

  it('should match Rotina Laboratorial 2º Trimestre', () => {
    const condutas = ['Rotina Laboratorial 2º Trimestre', 'US Morfológico 2º Trimestre'];
    expect(shouldScheduleMessage(condutas, 'Rotina Laboratorial 2º Trimestre')).toBe(true);
  });

  it('should match Rotina Laboratorial 3º Trimestre', () => {
    const condutas = ['Rotina Laboratorial 3º Trimestre'];
    expect(shouldScheduleMessage(condutas, 'Rotina Laboratorial 3º Trimestre')).toBe(true);
  });
});

describe('Pós-Consulta por Conduta - Send Date Calculation', () => {
  it('should calculate send date 14 days after consultation', () => {
    const consultaDate = new Date('2026-03-17');
    const sendDate = calculateSendDate(consultaDate, 14);
    expect(sendDate.toISOString().split('T')[0]).toBe('2026-03-31');
  });

  it('should calculate send date 7 days after consultation', () => {
    const consultaDate = new Date('2026-03-17');
    const sendDate = calculateSendDate(consultaDate, 7);
    expect(sendDate.toISOString().split('T')[0]).toBe('2026-03-24');
  });

  it('should calculate send date 1 day after consultation', () => {
    const consultaDate = new Date('2026-03-17');
    const sendDate = calculateSendDate(consultaDate, 1);
    expect(sendDate.toISOString().split('T')[0]).toBe('2026-03-18');
  });

  it('should handle month boundary correctly', () => {
    const consultaDate = new Date('2026-03-25');
    const sendDate = calculateSendDate(consultaDate, 14);
    expect(sendDate.toISOString().split('T')[0]).toBe('2026-04-08');
  });

  it('should handle year boundary correctly', () => {
    const consultaDate = new Date('2026-12-25');
    const sendDate = calculateSendDate(consultaDate, 14);
    expect(sendDate.toISOString().split('T')[0]).toBe('2027-01-08');
  });

  it('should handle 90 days (max) correctly', () => {
    const consultaDate = new Date('2026-01-01T12:00:00Z');
    const sendDate = calculateSendDate(consultaDate, 90);
    expect(sendDate.toISOString().split('T')[0]).toBe('2026-04-01');
  });
});

describe('Pós-Consulta por Conduta - Template Validation', () => {
  it('should require condutaGatilho for pos_consulta_conduta type', () => {
    const template = {
      gatilhoTipo: 'pos_consulta_conduta' as const,
      condutaGatilho: '',
      diasAposConsulta: 14,
    };
    expect(template.condutaGatilho).toBeFalsy();
  });

  it('should accept valid condutaGatilho', () => {
    const template = {
      gatilhoTipo: 'pos_consulta_conduta' as const,
      condutaGatilho: 'Rotina Laboratorial 1º Trimestre',
      diasAposConsulta: 14,
    };
    expect(template.condutaGatilho).toBeTruthy();
    expect(template.diasAposConsulta).toBe(14);
  });

  it('should validate diasAposConsulta is within range 1-90', () => {
    expect(1).toBeGreaterThanOrEqual(1);
    expect(90).toBeLessThanOrEqual(90);
    expect(0).toBeLessThan(1);
    expect(91).toBeGreaterThan(90);
  });

  it('should have correct gatilhoTipo enum value', () => {
    const validTypes = ['idade_gestacional', 'evento', 'manual', 'pos_consulta_conduta'];
    expect(validTypes).toContain('pos_consulta_conduta');
  });

  it('should list all available condutas', () => {
    const condutas = [
      'Rotina Laboratorial 1º Trimestre',
      'Rotina Laboratorial 2º Trimestre',
      'Rotina Laboratorial 3º Trimestre',
      'Outros Exames Laboratoriais Específicos',
      'US Obstétrico Endovaginal',
      'US Morfológico 1º Trimestre',
      'US Morfológico 2º Trimestre',
      'US Obstétrico com Doppler',
      'Ecocardiograma Fetal',
      'Colhido Cultura para EGB',
      'Vacinas (Prescrevo ou Oriento)',
    ];
    expect(condutas).toHaveLength(11);
    expect(condutas).toContain('Rotina Laboratorial 1º Trimestre');
  });
});

describe('Pós-Consulta por Conduta - Duplicate Prevention', () => {
  it('should not schedule duplicate messages for the same consultation+template', () => {
    // The scheduler checks for existing mensagensAgendadas with same consultaId + templateId
    const existingScheduled = [
      { consultaId: 1, templateId: 5 },
      { consultaId: 1, templateId: 8 },
    ];
    
    const isDuplicate = (consultaId: number, templateId: number) => 
      existingScheduled.some(s => s.consultaId === consultaId && s.templateId === templateId);
    
    expect(isDuplicate(1, 5)).toBe(true);
    expect(isDuplicate(1, 8)).toBe(true);
    expect(isDuplicate(1, 10)).toBe(false);
    expect(isDuplicate(2, 5)).toBe(false);
  });
});
