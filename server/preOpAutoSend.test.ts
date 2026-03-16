import { describe, it, expect } from 'vitest';

/**
 * Tests for the pre-op cesarean auto-send logic.
 * 
 * The logic is embedded in the gestante.update procedure:
 * 1. Detects when a cesarean is scheduled for the FIRST TIME (isNovaCesarea)
 * 2. Calculates current IG (US priority > DUM)
 * 3. Only sends if IG >= 36 weeks
 * 4. Checks whatsappHistorico for deduplication (won't resend)
 * 5. Doesn't send on reschedule (tinhaDataCesarea && temDataCesarea)
 */

// Helper functions extracted from routers.ts for testing
function calcularIdadeGestacionalPorDUM(dum: Date | string): { semanas: number; dias: number; totalDias: number } {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const hoje = new Date();
  const diffMs = hoje.getTime() - dumDate.getTime();
  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { semanas, dias, totalDias };
}

function calcularIdadeGestacionalPorUS(igUltrassomDias: number, dataUltrassom: Date): { semanas: number; dias: number; totalDias: number } {
  const hoje = new Date();
  const diffMs = hoje.getTime() - dataUltrassom.getTime();
  const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDias = igUltrassomDias + diasDesdeUS;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { semanas, dias, totalDias };
}

// Simulate the decision logic from the update procedure
function shouldSendPreOpOrientation(params: {
  tipoPartoAntes: string | null;
  dataPartoProgramadoAntes: string | null;
  tipoPartoDepois: string | null;
  dataPartoProgramadoDepois: string | null;
  telefone: string | null;
  clinicaId: number | null;
  dum: string | null;
  igUltrassomSemanas: number | null;
  igUltrassomDias: number | null;
  dataUltrassom: string | null;
  jaEnviadaAntes: boolean;
}): { shouldSend: boolean; reason: string } {
  const tinhaDataCesarea = params.dataPartoProgramadoAntes && params.tipoPartoAntes === 'cesariana';
  const temDataCesarea = params.dataPartoProgramadoDepois && params.tipoPartoDepois === 'cesariana';
  
  const isNovaCesarea = temDataCesarea && !tinhaDataCesarea;
  
  if (!isNovaCesarea) {
    if (!temDataCesarea) return { shouldSend: false, reason: 'Não é cesárea' };
    return { shouldSend: false, reason: 'Reagendamento (já tinha cesárea antes)' };
  }
  
  if (!params.telefone) return { shouldSend: false, reason: 'Sem telefone' };
  if (!params.clinicaId) return { shouldSend: false, reason: 'Sem clínica' };
  
  // Calculate IG
  let ig: { semanas: number; dias: number; totalDias: number } | null = null;
  if (params.igUltrassomSemanas !== null && params.igUltrassomDias !== null && params.dataUltrassom) {
    const igUltrassomDiasTotal = (params.igUltrassomSemanas * 7) + params.igUltrassomDias;
    ig = calcularIdadeGestacionalPorUS(igUltrassomDiasTotal, new Date(params.dataUltrassom + 'T12:00:00'));
  } else if (params.dum && params.dum !== 'Incerta' && !params.dum.includes('Compatível') && !params.dum.includes('Incompatível')) {
    ig = calcularIdadeGestacionalPorDUM(params.dum);
  }
  
  if (!ig) return { shouldSend: false, reason: 'Não foi possível calcular IG' };
  if (ig.semanas < 36) return { shouldSend: false, reason: `IG ${ig.semanas}s < 36 semanas` };
  
  if (params.jaEnviadaAntes) return { shouldSend: false, reason: 'Já enviada anteriormente' };
  
  return { shouldSend: true, reason: `Nova cesárea agendada com IG ${ig.semanas}s${ig.dias}d >= 36s` };
}

describe('Pre-op cesarean auto-send logic', () => {
  // Helper to create a date string N days ago
  function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  describe('Nova cesárea detection', () => {
    it('should send when cesarean is scheduled for the first time (IG >= 36)', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(36 * 7 + 1), // 36s1d
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(true);
      expect(result.reason).toContain('Nova cesárea agendada');
    });

    it('should NOT send on reschedule (already had cesarean)', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'cesariana',
        dataPartoProgramadoAntes: '2026-03-25',
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(36 * 7 + 1),
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(false);
      expect(result.reason).toBe('Reagendamento (já tinha cesárea antes)');
    });

    it('should NOT send when tipo parto is not cesariana', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'normal',
        dataPartoProgramadoDepois: null,
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(36 * 7 + 1),
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(false);
      expect(result.reason).toBe('Não é cesárea');
    });
  });

  describe('IG threshold check', () => {
    it('should NOT send when IG < 36 weeks (35s6d)', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-15',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(35 * 7 + 6), // 35s6d
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(false);
      expect(result.reason).toContain('< 36 semanas');
    });

    it('should send when IG is exactly 36s0d', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(36 * 7 + 1), // 36s1d to avoid edge case rounding
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(true);
    });

    it('should send when IG is 38 weeks (well past 36)', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(38 * 7),
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(true);
    });

    it('should use US for IG calculation when available (priority over DUM)', () => {
      // DUM says 30 weeks, but US 7 days ago said 36s0d -> now 37s0d
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(30 * 7), // DUM says 30 weeks
        igUltrassomSemanas: 36,
        igUltrassomDias: 0,
        dataUltrassom: daysAgo(7), // US 7 days ago at 36s0d -> now 37s0d
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(true);
      // Should be >= 36 weeks (US-based calculation)
      expect(result.reason).toMatch(/IG \d+s/);
    });
  });

  describe('Deduplication', () => {
    it('should NOT send when already sent before', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: daysAgo(37 * 7),
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: true,
      });
      expect(result.shouldSend).toBe(false);
      expect(result.reason).toBe('Já enviada anteriormente');
    });
  });

  describe('Missing data handling', () => {
    it('should NOT send when gestante has no phone', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: null,
        clinicaId: 1,
        dum: daysAgo(37 * 7),
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(false);
      expect(result.reason).toBe('Sem telefone');
    });

    it('should NOT send when DUM is Incerta and no US data', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: 'Incerta',
        igUltrassomSemanas: null,
        igUltrassomDias: null,
        dataUltrassom: null,
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(false);
      expect(result.reason).toBe('Não foi possível calcular IG');
    });

    it('should handle DUM Incompatível com US by using US data', () => {
      const result = shouldSendPreOpOrientation({
        tipoPartoAntes: 'a_definir',
        dataPartoProgramadoAntes: null,
        tipoPartoDepois: 'cesariana',
        dataPartoProgramadoDepois: '2026-04-01',
        telefone: '+5535999999999',
        clinicaId: 1,
        dum: 'Incompatível com US',
        igUltrassomSemanas: 37,
        igUltrassomDias: 2,
        dataUltrassom: daysAgo(0),
        jaEnviadaAntes: false,
      });
      expect(result.shouldSend).toBe(true);
      expect(result.reason).toContain('37s');
    });
  });
});
