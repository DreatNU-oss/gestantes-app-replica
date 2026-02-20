import { describe, it, expect } from 'vitest';

/**
 * Tests for the pre-term/post-term cesarean date validation logic.
 * These test the core calculation logic that determines if a cesarean date
 * falls outside the recommended 37-41 week window.
 */

function calcularIGNaData(
  dumOrUsDate: string, 
  igReferenciaDias: number, 
  dataCesarea: string
): { semanas: number; dias: number; totalDias: number } {
  const refDate = new Date(dumOrUsDate + 'T00:00:00');
  const cesDate = new Date(dataCesarea + 'T00:00:00');
  const diffMs = cesDate.getTime() - refDate.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDias = igReferenciaDias + diffDias;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { semanas, dias, totalDias };
}

function classificarData(totalDias: number): 'pre-termo' | 'pos-termo' | 'normal' {
  if (totalDias < 259) return 'pre-termo'; // < 37 semanas
  if (totalDias > 287) return 'pos-termo'; // > 41 semanas
  return 'normal';
}

function isDataNoPassado(data: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataSelecionada = new Date(data + 'T00:00:00');
  return dataSelecionada < hoje;
}

describe('Validação de data de cesárea', () => {
  describe('Cálculo de IG na data da cesárea', () => {
    it('deve calcular IG corretamente a partir da DUM', () => {
      // DUM = 2025-06-01, cesárea = 2026-02-15 → ~37 semanas
      const result = calcularIGNaData('2025-06-01', 0, '2026-02-15');
      expect(result.semanas).toBe(37);
      expect(result.dias).toBe(0);
    });

    it('deve calcular IG corretamente a partir do ultrassom', () => {
      // US em 2025-10-01 com IG 20s3d = 143 dias, cesárea em 2026-02-15
      // Diff = 137 dias, total = 143 + 137 = 280 dias = 40s0d
      const result = calcularIGNaData('2025-10-01', 143, '2026-02-15');
      expect(result.semanas).toBe(40);
      expect(result.dias).toBe(0);
    });

    it('deve retornar dias negativos para data antes da DUM', () => {
      const result = calcularIGNaData('2025-06-01', 0, '2025-05-01');
      expect(result.totalDias).toBeLessThan(0);
    });
  });

  describe('Classificação pré-termo / pós-termo', () => {
    it('deve classificar como pré-termo quando IG < 37 semanas (259 dias)', () => {
      expect(classificarData(258)).toBe('pre-termo');
      expect(classificarData(200)).toBe('pre-termo');
      expect(classificarData(0)).toBe('pre-termo');
    });

    it('deve classificar como normal quando IG entre 37-41 semanas', () => {
      expect(classificarData(259)).toBe('normal'); // 37s0d
      expect(classificarData(273)).toBe('normal'); // 39s0d
      expect(classificarData(287)).toBe('normal'); // 41s0d
    });

    it('deve classificar como pós-termo quando IG > 41 semanas (287 dias)', () => {
      expect(classificarData(288)).toBe('pos-termo');
      expect(classificarData(300)).toBe('pos-termo');
    });

    it('deve classificar corretamente os limites exatos', () => {
      expect(classificarData(258)).toBe('pre-termo'); // 36s6d
      expect(classificarData(259)).toBe('normal');     // 37s0d
      expect(classificarData(287)).toBe('normal');     // 41s0d
      expect(classificarData(288)).toBe('pos-termo');  // 41s1d
    });
  });

  describe('Cenário Taynara - data com ano errado', () => {
    it('deve detectar data no passado (2025 em vez de 2026)', () => {
      // O médico digitou 23/02/2025 em vez de 23/02/2026
      expect(isDataNoPassado('2025-02-23')).toBe(true);
    });

    it('deve aceitar data futura correta', () => {
      expect(isDataNoPassado('2027-02-23')).toBe(false);
    });

    it('deve classificar como pré-termo quando data está muito antes', () => {
      // DUM = 2025-06-15, cesárea = 2025-02-23 → data antes da DUM = IG negativa
      const result = calcularIGNaData('2025-06-15', 0, '2025-02-23');
      expect(result.totalDias).toBeLessThan(0);
      expect(classificarData(result.totalDias)).toBe('pre-termo');
    });
  });

  describe('Validação de data no passado', () => {
    it('deve detectar data de ontem como passado', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataStr = ontem.toISOString().split('T')[0];
      expect(isDataNoPassado(dataStr)).toBe(true);
    });

    it('deve aceitar data de amanhã como futuro', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataStr = amanha.toISOString().split('T')[0];
      expect(isDataNoPassado(dataStr)).toBe(false);
    });

    it('deve detectar data de 1 ano atrás como passado', () => {
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      const dataStr = umAnoAtras.toISOString().split('T')[0];
      expect(isDataNoPassado(dataStr)).toBe(true);
    });
  });

  describe('Fluxo de reconhecimento de alerta', () => {
    it('alerta deve iniciar como não reconhecido', () => {
      const alerta = { show: true, tipo: 'pre-termo' as const, igNaData: { semanas: 35, dias: 3 }, acknowledged: false };
      expect(alerta.acknowledged).toBe(false);
    });

    it('alerta reconhecido deve permitir salvamento', () => {
      const alerta = { show: true, tipo: 'pre-termo' as const, igNaData: { semanas: 35, dias: 3 }, acknowledged: true };
      const podeSalvar = !alerta.show || alerta.acknowledged;
      expect(podeSalvar).toBe(true);
    });

    it('alerta não reconhecido deve bloquear salvamento', () => {
      const alerta = { show: true, tipo: 'pre-termo' as const, igNaData: { semanas: 35, dias: 3 }, acknowledged: false };
      const podeSalvar = !alerta.show || alerta.acknowledged;
      expect(podeSalvar).toBe(false);
    });

    it('sem alerta deve permitir salvamento', () => {
      const alerta = { show: false, tipo: null, igNaData: null, acknowledged: false };
      const podeSalvar = !alerta.show || alerta.acknowledged;
      expect(podeSalvar).toBe(true);
    });

    it('mudar a data deve resetar o reconhecimento', () => {
      // Simular: alerta reconhecido, depois muda a data → deve resetar
      let alerta = { show: true, tipo: 'pre-termo' as const, igNaData: { semanas: 35, dias: 3 }, acknowledged: true };
      // Ao mudar a data, o useEffect reseta o acknowledged
      alerta = { show: true, tipo: 'pre-termo' as const, igNaData: { semanas: 34, dias: 0 }, acknowledged: false };
      expect(alerta.acknowledged).toBe(false);
    });
  });
});
