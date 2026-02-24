import { describe, it, expect } from 'vitest';

/**
 * Tests for the cesarean date validation logic used in the "Agendar Cesárea" button workflow.
 * 
 * The new workflow:
 * 1. User selects a date in the input (stored locally, NOT auto-saved)
 * 2. User clicks "Agendar" (or "Reagendar") button
 * 3. Button click triggers validation:
 *    - Date in the past → confirmation dialog
 *    - IG < 37 weeks (259 days) → pre-term confirmation dialog
 *    - IG >= 40 weeks (280 days) → post-term confirmation dialog
 *    - Normal range (37-39 weeks) → save immediately
 * 4. Only after confirming dialog does the date get saved and synced to admin system
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

/**
 * Updated classification: post-term threshold is now >= 40 weeks (280 days)
 * instead of > 41 weeks (287 days)
 */
function classificarData(totalDias: number): 'pre-termo' | 'pos-termo' | 'normal' {
  if (totalDias < 259) return 'pre-termo'; // < 37 semanas
  if (totalDias >= 280) return 'pos-termo'; // >= 40 semanas
  return 'normal'; // 37s0d to 39s6d
}

function isDataNoPassado(data: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataSelecionada = new Date(data + 'T00:00:00');
  return dataSelecionada < hoje;
}

/**
 * Simulates the button-based scheduling workflow state machine
 */
type WorkflowState = {
  dataCesareaLocal: string;
  dataCesareaModificada: boolean;
  savedDate: string;
  dialogOpen: boolean;
  dialogTipo: 'pre-termo' | 'pos-termo' | 'passado' | null;
};

function createInitialState(savedDate: string = ''): WorkflowState {
  return {
    dataCesareaLocal: savedDate,
    dataCesareaModificada: false,
    savedDate,
    dialogOpen: false,
    dialogTipo: null,
  };
}

function onDateInputChange(state: WorkflowState, newDate: string): WorkflowState {
  return {
    ...state,
    dataCesareaLocal: newDate,
    dataCesareaModificada: newDate !== state.savedDate,
  };
}

function onAgendarClick(
  state: WorkflowState,
  dumOrUsDate: string | null,
  igReferenciaDias: number
): WorkflowState {
  const novaData = state.dataCesareaLocal;

  // Empty date → clear scheduling
  if (!novaData) {
    return {
      ...state,
      savedDate: '',
      dataCesareaModificada: false,
      dialogOpen: false,
      dialogTipo: null,
    };
  }

  // Past date check
  if (isDataNoPassado(novaData)) {
    return {
      ...state,
      dialogOpen: true,
      dialogTipo: 'passado',
    };
  }

  // IG validation
  if (dumOrUsDate) {
    const { totalDias } = calcularIGNaData(dumOrUsDate, igReferenciaDias, novaData);
    const classificacao = classificarData(totalDias);
    
    if (classificacao !== 'normal') {
      return {
        ...state,
        dialogOpen: true,
        dialogTipo: classificacao,
      };
    }
  }

  // Normal: save immediately
  return {
    ...state,
    savedDate: novaData,
    dataCesareaModificada: false,
    dialogOpen: false,
    dialogTipo: null,
  };
}

function onDialogConfirm(state: WorkflowState): WorkflowState {
  return {
    ...state,
    savedDate: state.dataCesareaLocal,
    dataCesareaModificada: false,
    dialogOpen: false,
    dialogTipo: null,
  };
}

function onDialogCancel(state: WorkflowState): WorkflowState {
  return {
    ...state,
    dialogOpen: false,
    dialogTipo: null,
  };
}

describe('Validação de data de cesárea (botão Agendar)', () => {
  describe('Cálculo de IG na data da cesárea', () => {
    it('deve calcular IG corretamente a partir da DUM', () => {
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

  describe('Classificação pré-termo / pós-termo (limiar atualizado: >=40 semanas)', () => {
    it('deve classificar como pré-termo quando IG < 37 semanas (< 259 dias)', () => {
      expect(classificarData(258)).toBe('pre-termo');
      expect(classificarData(200)).toBe('pre-termo');
      expect(classificarData(0)).toBe('pre-termo');
    });

    it('deve classificar como normal quando IG entre 37s0d e 39s6d (259-279 dias)', () => {
      expect(classificarData(259)).toBe('normal'); // 37s0d
      expect(classificarData(266)).toBe('normal'); // 38s0d
      expect(classificarData(273)).toBe('normal'); // 39s0d
      expect(classificarData(279)).toBe('normal'); // 39s6d
    });

    it('deve classificar como pós-termo quando IG >= 40 semanas (>= 280 dias)', () => {
      expect(classificarData(280)).toBe('pos-termo'); // 40s0d exato
      expect(classificarData(281)).toBe('pos-termo'); // 40s1d
      expect(classificarData(287)).toBe('pos-termo'); // 41s0d
      expect(classificarData(294)).toBe('pos-termo'); // 42s0d
      expect(classificarData(300)).toBe('pos-termo');
    });

    it('deve classificar corretamente os limites exatos', () => {
      expect(classificarData(258)).toBe('pre-termo'); // 36s6d → pré-termo
      expect(classificarData(259)).toBe('normal');     // 37s0d → normal
      expect(classificarData(279)).toBe('normal');     // 39s6d → normal
      expect(classificarData(280)).toBe('pos-termo');  // 40s0d → pós-termo (NOVO LIMIAR)
    });
  });

  describe('Validação de data no passado', () => {
    function toLocalDateStr(d: Date): string {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    it('deve detectar data de ontem como passado', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataStr = toLocalDateStr(ontem);
      expect(isDataNoPassado(dataStr)).toBe(true);
    });

    it('deve aceitar data de amanhã como futuro', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataStr = toLocalDateStr(amanha);
      expect(isDataNoPassado(dataStr)).toBe(false);
    });

    it('deve detectar data de 1 ano atrás como passado', () => {
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      const dataStr = toLocalDateStr(umAnoAtras);
      expect(isDataNoPassado(dataStr)).toBe(true);
    });
  });

  describe('Fluxo do botão Agendar (workflow state machine)', () => {
    it('estado inicial deve ter dataCesareaModificada = false', () => {
      const state = createInitialState('');
      expect(state.dataCesareaModificada).toBe(false);
      expect(state.dataCesareaLocal).toBe('');
    });

    it('estado inicial com data existente deve refletir a data salva', () => {
      const state = createInitialState('2026-04-15');
      expect(state.dataCesareaLocal).toBe('2026-04-15');
      expect(state.savedDate).toBe('2026-04-15');
      expect(state.dataCesareaModificada).toBe(false);
    });

    it('mudar data no input deve marcar como modificada mas NÃO salvar', () => {
      const state = createInitialState('2026-04-15');
      const newState = onDateInputChange(state, '2026-05-01');
      expect(newState.dataCesareaLocal).toBe('2026-05-01');
      expect(newState.dataCesareaModificada).toBe(true);
      expect(newState.savedDate).toBe('2026-04-15'); // NÃO mudou
    });

    it('mudar data para o mesmo valor salvo deve marcar como não modificada', () => {
      const state = createInitialState('2026-04-15');
      const changed = onDateInputChange(state, '2026-05-01');
      const reverted = onDateInputChange(changed, '2026-04-15');
      expect(reverted.dataCesareaModificada).toBe(false);
    });

    it('clicar Agendar com data normal deve salvar imediatamente', () => {
      // DUM = 2025-06-01, data = 2026-02-22 → 38s1d (normal, future date)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-02-22');
      // 2026-02-22 is in the past from sandbox perspective, use a guaranteed future date
      // DUM = 2025-09-01, data = 2026-04-15 → ~32 weeks... let's use proper calc
      // DUM = 2025-07-01, data = 2026-04-01 → 274 dias = 39s1d (normal)
      state = createInitialState('');
      state = onDateInputChange(state, '2026-04-01');
      state = onAgendarClick(state, '2025-07-01', 0);
      expect(state.savedDate).toBe('2026-04-01');
      expect(state.dataCesareaModificada).toBe(false);
      expect(state.dialogOpen).toBe(false);
    });

    it('clicar Agendar com data pré-termo deve abrir diálogo', () => {
      // DUM = 2025-09-01, data = 2026-03-15 → ~28 semanas (pré-termo, future date)
      // Actually: diff = 195 dias = 27s6d → pré-termo
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-15');
      state = onAgendarClick(state, '2025-09-01', 0);
      expect(state.dialogOpen).toBe(true);
      expect(state.dialogTipo).toBe('pre-termo');
      expect(state.savedDate).toBe(''); // NÃO salvou ainda
    });

    it('clicar Agendar com data >= 40 semanas deve abrir diálogo pós-termo', () => {
      // DUM = 2025-06-01, data = 2026-03-08 → 40s0d (pós-termo)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-08');
      const ig = calcularIGNaData('2025-06-01', 0, '2026-03-08');
      expect(ig.semanas).toBe(40);
      expect(ig.dias).toBe(0);
      
      state = onAgendarClick(state, '2025-06-01', 0);
      expect(state.dialogOpen).toBe(true);
      expect(state.dialogTipo).toBe('pos-termo');
      expect(state.savedDate).toBe(''); // NÃO salvou ainda
    });

    it('clicar Agendar com data no passado deve abrir diálogo', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataStr = `${ontem.getFullYear()}-${String(ontem.getMonth()+1).padStart(2,'0')}-${String(ontem.getDate()).padStart(2,'0')}`;
      
      let state = createInitialState('');
      state = onDateInputChange(state, dataStr);
      state = onAgendarClick(state, '2025-06-01', 0);
      expect(state.dialogOpen).toBe(true);
      expect(state.dialogTipo).toBe('passado');
      expect(state.savedDate).toBe('');
    });

    it('confirmar diálogo deve salvar a data', () => {
      // DUM = 2025-09-01, data = 2026-03-15 → pré-termo (future date)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-15');
      state = onAgendarClick(state, '2025-09-01', 0);
      expect(state.dialogOpen).toBe(true);
      
      state = onDialogConfirm(state);
      expect(state.savedDate).toBe('2026-03-15');
      expect(state.dataCesareaModificada).toBe(false);
      expect(state.dialogOpen).toBe(false);
    });

    it('cancelar diálogo NÃO deve salvar a data', () => {
      // DUM = 2025-09-01, data = 2026-03-15 → pré-termo (future date)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-15');
      state = onAgendarClick(state, '2025-09-01', 0);
      expect(state.dialogOpen).toBe(true);
      
      state = onDialogCancel(state);
      expect(state.savedDate).toBe(''); // NÃO salvou
      expect(state.dialogOpen).toBe(false);
      expect(state.dataCesareaLocal).toBe('2026-03-15'); // Data local mantida
    });

    it('limpar data e clicar Agendar deve remover agendamento', () => {
      let state = createInitialState('2026-04-15');
      state = onDateInputChange(state, '');
      state = onAgendarClick(state, '2025-06-01', 0);
      expect(state.savedDate).toBe('');
      expect(state.dataCesareaModificada).toBe(false);
    });

    it('sem dados de IG (sem DUM/US), deve salvar diretamente sem validação de IG', () => {
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-05-01');
      state = onAgendarClick(state, null, 0);
      expect(state.savedDate).toBe('2026-05-01');
      expect(state.dialogOpen).toBe(false);
    });

    it('reagendar: mudar data de agendamento existente', () => {
      // Já tem data salva, muda para nova data
      let state = createInitialState('2026-04-15');
      state = onDateInputChange(state, '2026-04-20');
      expect(state.dataCesareaModificada).toBe(true);
      
      // DUM = 2025-07-01, nova data = 2026-04-20 → ~41s4d (pós-termo)
      state = onAgendarClick(state, '2025-07-01', 0);
      expect(state.dialogOpen).toBe(true);
      expect(state.dialogTipo).toBe('pos-termo');
      
      state = onDialogConfirm(state);
      expect(state.savedDate).toBe('2026-04-20');
    });
  });

  describe('Cenário Taynara - data com ano errado', () => {
    it('deve detectar data no passado (2025 em vez de 2026)', () => {
      expect(isDataNoPassado('2025-02-23')).toBe(true);
    });

    it('deve aceitar data futura correta', () => {
      expect(isDataNoPassado('2027-02-23')).toBe(false);
    });

    it('deve classificar como pré-termo quando data está muito antes', () => {
      const result = calcularIGNaData('2025-06-15', 0, '2025-02-23');
      expect(result.totalDias).toBeLessThan(0);
      expect(classificarData(result.totalDias)).toBe('pre-termo');
    });
  });

  describe('Limiar de 39s6d vs 40s0d (boundary test)', () => {
    it('39s6d (279 dias) deve ser normal - sem alerta', () => {
      expect(classificarData(279)).toBe('normal');
    });

    it('40s0d (280 dias) deve ser pós-termo - com alerta', () => {
      expect(classificarData(280)).toBe('pos-termo');
    });

    it('cenário real: DUM 2025-06-01, cesárea 2026-03-07 = 39s6d (normal)', () => {
      const result = calcularIGNaData('2025-06-01', 0, '2026-03-07');
      expect(result.totalDias).toBe(279);
      expect(result.semanas).toBe(39);
      expect(result.dias).toBe(6);
      expect(classificarData(result.totalDias)).toBe('normal');
    });

    it('cenário real: DUM 2025-06-01, cesárea 2026-03-08 = 40s0d (pós-termo)', () => {
      const result = calcularIGNaData('2025-06-01', 0, '2026-03-08');
      expect(result.totalDias).toBe(280);
      expect(result.semanas).toBe(40);
      expect(result.dias).toBe(0);
      expect(classificarData(result.totalDias)).toBe('pos-termo');
    });
  });
});
