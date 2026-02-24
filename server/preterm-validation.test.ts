import { describe, it, expect } from 'vitest';

/**
 * Tests for the shared cesarean date validation utility (cesareanValidation.ts)
 * and the "Agendar Cesárea" button workflow used in both CartaoPrenatal.tsx 
 * and FormularioGestante.tsx.
 * 
 * The workflow:
 * 1. User selects a date in the input (stored locally, NOT auto-saved)
 * 2. User clicks "Agendar" (or "Reagendar") button
 * 3. Button click calls validarDataCesarea() from shared utility:
 *    - Date in the past → 'passado'
 *    - IG < 37 weeks (259 days) → 'pre-termo'
 *    - IG >= 40 weeks (280 days) → 'pos-termo'
 *    - Normal range (37-39 weeks) → 'normal' → save immediately
 * 4. Only after confirming dialog does the date get saved and synced to admin system
 */

// Import from the shared utility
import {
  calcularIGNaData,
  classificarIG,
  isDataNoPassado,
  validarDataCesarea,
  PRETERMIO_DIAS,
  POSTERMO_DIAS,
  type DadosReferencia,
} from '../client/src/lib/cesareanValidation';

/**
 * Simulates the button-based scheduling workflow state machine
 * (mirrors the React state logic in both CartaoPrenatal and FormularioGestante)
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
  dados: DadosReferencia
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

  // Use shared utility for validation
  const resultado = validarDataCesarea(novaData, dados);

  if (resultado.classificacao !== 'normal') {
    return {
      ...state,
      dialogOpen: true,
      dialogTipo: resultado.classificacao,
    };
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

describe('Validação de data de cesárea (utilitário compartilhado)', () => {
  describe('Constantes exportadas', () => {
    it('PRETERMIO_DIAS deve ser 259 (37 * 7)', () => {
      expect(PRETERMIO_DIAS).toBe(259);
    });

    it('POSTERMO_DIAS deve ser 280 (40 * 7)', () => {
      expect(POSTERMO_DIAS).toBe(280);
    });
  });

  describe('calcularIGNaData() - Cálculo de IG na data da cesárea', () => {
    it('deve calcular IG corretamente a partir da DUM', () => {
      const result = calcularIGNaData('2026-02-15', { dum: '2025-06-01' });
      expect(result).not.toBeNull();
      expect(result!.igSemanasDias.semanas).toBe(37);
      expect(result!.igSemanasDias.dias).toBe(0);
      expect(result!.igTotalDias).toBe(259);
    });

    it('deve calcular IG corretamente a partir do ultrassom', () => {
      // US em 2025-10-01 com IG 20s3d = 143 dias, cesárea em 2026-02-15
      // Diff = 137 dias, total = 143 + 137 = 280 dias = 40s0d
      const result = calcularIGNaData('2026-02-15', {
        dataUltrassom: '2025-10-01',
        igUltrassomSemanas: 20,
        igUltrassomDias: 3,
      });
      expect(result).not.toBeNull();
      expect(result!.igSemanasDias.semanas).toBe(40);
      expect(result!.igSemanasDias.dias).toBe(0);
      expect(result!.igTotalDias).toBe(280);
    });

    it('deve priorizar ultrassom sobre DUM quando ambos disponíveis', () => {
      const result = calcularIGNaData('2026-02-15', {
        dataUltrassom: '2025-10-01',
        igUltrassomSemanas: 20,
        igUltrassomDias: 3,
        dum: '2025-06-01', // seria 37s0d pela DUM
      });
      expect(result).not.toBeNull();
      expect(result!.igSemanasDias.semanas).toBe(40); // US prevalece
    });

    it('deve retornar null quando não há dados de referência', () => {
      const result = calcularIGNaData('2026-02-15', {});
      expect(result).toBeNull();
    });

    it('deve retornar null quando DUM é "Incerta"', () => {
      const result = calcularIGNaData('2026-02-15', { dum: 'Incerta' });
      expect(result).toBeNull();
    });

    it('deve retornar null quando DUM é "Incompatível com US"', () => {
      const result = calcularIGNaData('2026-02-15', { dum: 'Incompatível com US' });
      expect(result).toBeNull();
    });

    it('deve retornar dias negativos para data antes da DUM', () => {
      const result = calcularIGNaData('2025-05-01', { dum: '2025-06-01' });
      expect(result).not.toBeNull();
      expect(result!.igTotalDias).toBeLessThan(0);
    });
  });

  describe('classificarIG() - Classificação pré-termo / pós-termo', () => {
    it('deve classificar como pré-termo quando IG < 37 semanas (< 259 dias)', () => {
      expect(classificarIG(258)).toBe('pre-termo');
      expect(classificarIG(200)).toBe('pre-termo');
      expect(classificarIG(0)).toBe('pre-termo');
    });

    it('deve classificar como normal quando IG entre 37s0d e 39s6d (259-279 dias)', () => {
      expect(classificarIG(259)).toBe('normal'); // 37s0d
      expect(classificarIG(266)).toBe('normal'); // 38s0d
      expect(classificarIG(273)).toBe('normal'); // 39s0d
      expect(classificarIG(279)).toBe('normal'); // 39s6d
    });

    it('deve classificar como pós-termo quando IG >= 40 semanas (>= 280 dias)', () => {
      expect(classificarIG(280)).toBe('pos-termo'); // 40s0d exato
      expect(classificarIG(281)).toBe('pos-termo'); // 40s1d
      expect(classificarIG(287)).toBe('pos-termo'); // 41s0d
      expect(classificarIG(294)).toBe('pos-termo'); // 42s0d
      expect(classificarIG(300)).toBe('pos-termo');
    });

    it('deve classificar corretamente os limites exatos', () => {
      expect(classificarIG(258)).toBe('pre-termo'); // 36s6d → pré-termo
      expect(classificarIG(259)).toBe('normal');     // 37s0d → normal
      expect(classificarIG(279)).toBe('normal');     // 39s6d → normal
      expect(classificarIG(280)).toBe('pos-termo');  // 40s0d → pós-termo
    });
  });

  describe('isDataNoPassado() - Validação de data no passado', () => {
    function toLocalDateStr(d: Date): string {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    it('deve detectar data de ontem como passado', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      expect(isDataNoPassado(toLocalDateStr(ontem))).toBe(true);
    });

    it('deve aceitar data de amanhã como futuro', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      expect(isDataNoPassado(toLocalDateStr(amanha))).toBe(false);
    });

    it('deve detectar data de 1 ano atrás como passado', () => {
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      expect(isDataNoPassado(toLocalDateStr(umAnoAtras))).toBe(true);
    });
  });

  describe('validarDataCesarea() - Validação completa integrada', () => {
    it('deve retornar "passado" para data no passado', () => {
      const result = validarDataCesarea('2025-01-01', { dum: '2024-06-01' });
      expect(result.classificacao).toBe('passado');
    });

    it('deve retornar "pre-termo" para IG < 37 semanas', () => {
      // DUM = 2025-09-01, data = 2026-03-15 → ~195 dias = 27s6d
      const result = validarDataCesarea('2026-03-15', { dum: '2025-09-01' });
      expect(result.classificacao).toBe('pre-termo');
      expect(result.igNaData).not.toBeNull();
    });

    it('deve retornar "pos-termo" para IG >= 40 semanas', () => {
      // DUM = 2025-06-01, data = 2026-03-08 → 280 dias = 40s0d
      const result = validarDataCesarea('2026-03-08', { dum: '2025-06-01' });
      expect(result.classificacao).toBe('pos-termo');
      expect(result.igNaData).not.toBeNull();
      expect(result.igNaData!.semanas).toBe(40);
      expect(result.igNaData!.dias).toBe(0);
    });

    it('deve retornar "normal" para IG entre 37-39 semanas', () => {
      // DUM = 2025-07-01, data = 2026-04-01 → 274 dias = 39s1d
      const result = validarDataCesarea('2026-04-01', { dum: '2025-07-01' });
      expect(result.classificacao).toBe('normal');
      expect(result.igNaData).not.toBeNull();
    });

    it('deve retornar "normal" sem dados de referência (sem DUM/US)', () => {
      const result = validarDataCesarea('2026-05-01', {});
      expect(result.classificacao).toBe('normal');
      expect(result.igNaData).toBeNull();
    });

    it('deve funcionar com dados de ultrassom', () => {
      // US em 2025-12-01 com IG 20s3d = 143 dias, cesárea em 2026-07-18
      // Diff = 228 dias, total = 143 + 228 = 371 dias → pós-termo
      const result = validarDataCesarea('2026-07-18', {
        dataUltrassom: '2025-12-01',
        igUltrassomSemanas: 20,
        igUltrassomDias: 3,
      });
      expect(result.classificacao).toBe('pos-termo');
      expect(result.igTotalDias).toBe(371);
    });
  });

  describe('Fluxo do botão Agendar (workflow usando utilitário compartilhado)', () => {
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
      // DUM = 2025-07-01, data = 2026-04-01 → 274 dias = 39s1d (normal)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-04-01');
      state = onAgendarClick(state, { dum: '2025-07-01' });
      expect(state.savedDate).toBe('2026-04-01');
      expect(state.dataCesareaModificada).toBe(false);
      expect(state.dialogOpen).toBe(false);
    });

    it('clicar Agendar com data pré-termo deve abrir diálogo', () => {
      // DUM = 2025-09-01, data = 2026-03-15 → ~195 dias (pré-termo)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-15');
      state = onAgendarClick(state, { dum: '2025-09-01' });
      expect(state.dialogOpen).toBe(true);
      expect(state.dialogTipo).toBe('pre-termo');
      expect(state.savedDate).toBe(''); // NÃO salvou ainda
    });

    it('clicar Agendar com data >= 40 semanas deve abrir diálogo pós-termo', () => {
      // DUM = 2025-06-01, data = 2026-03-08 → 40s0d (pós-termo)
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-08');
      
      // Verify IG calculation via shared utility
      const ig = calcularIGNaData('2026-03-08', { dum: '2025-06-01' });
      expect(ig).not.toBeNull();
      expect(ig!.igSemanasDias.semanas).toBe(40);
      expect(ig!.igSemanasDias.dias).toBe(0);
      
      state = onAgendarClick(state, { dum: '2025-06-01' });
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
      state = onAgendarClick(state, { dum: '2025-06-01' });
      expect(state.dialogOpen).toBe(true);
      expect(state.dialogTipo).toBe('passado');
      expect(state.savedDate).toBe('');
    });

    it('confirmar diálogo deve salvar a data', () => {
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-15');
      state = onAgendarClick(state, { dum: '2025-09-01' });
      expect(state.dialogOpen).toBe(true);
      
      state = onDialogConfirm(state);
      expect(state.savedDate).toBe('2026-03-15');
      expect(state.dataCesareaModificada).toBe(false);
      expect(state.dialogOpen).toBe(false);
    });

    it('cancelar diálogo NÃO deve salvar a data', () => {
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-03-15');
      state = onAgendarClick(state, { dum: '2025-09-01' });
      expect(state.dialogOpen).toBe(true);
      
      state = onDialogCancel(state);
      expect(state.savedDate).toBe(''); // NÃO salvou
      expect(state.dialogOpen).toBe(false);
      expect(state.dataCesareaLocal).toBe('2026-03-15'); // Data local mantida
    });

    it('limpar data e clicar Agendar deve remover agendamento', () => {
      let state = createInitialState('2026-04-15');
      state = onDateInputChange(state, '');
      state = onAgendarClick(state, { dum: '2025-06-01' });
      expect(state.savedDate).toBe('');
      expect(state.dataCesareaModificada).toBe(false);
    });

    it('sem dados de IG (sem DUM/US), deve salvar diretamente sem validação de IG', () => {
      let state = createInitialState('');
      state = onDateInputChange(state, '2026-05-01');
      state = onAgendarClick(state, {});
      expect(state.savedDate).toBe('2026-05-01');
      expect(state.dialogOpen).toBe(false);
    });

    it('reagendar: mudar data de agendamento existente', () => {
      let state = createInitialState('2026-04-15');
      state = onDateInputChange(state, '2026-04-20');
      expect(state.dataCesareaModificada).toBe(true);
      
      // DUM = 2025-07-01, nova data = 2026-04-20 → ~41s4d (pós-termo)
      state = onAgendarClick(state, { dum: '2025-07-01' });
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
      const result = calcularIGNaData('2025-02-23', { dum: '2025-06-15' });
      expect(result).not.toBeNull();
      expect(result!.igTotalDias).toBeLessThan(0);
      expect(classificarIG(result!.igTotalDias)).toBe('pre-termo');
    });
  });

  describe('Limiar de 39s6d vs 40s0d (boundary test)', () => {
    it('39s6d (279 dias) deve ser normal - sem alerta', () => {
      expect(classificarIG(279)).toBe('normal');
    });

    it('40s0d (280 dias) deve ser pós-termo - com alerta', () => {
      expect(classificarIG(280)).toBe('pos-termo');
    });

    it('cenário real: DUM 2025-06-01, cesárea 2026-03-07 = 39s6d (normal)', () => {
      const result = calcularIGNaData('2026-03-07', { dum: '2025-06-01' });
      expect(result).not.toBeNull();
      expect(result!.igTotalDias).toBe(279);
      expect(result!.igSemanasDias.semanas).toBe(39);
      expect(result!.igSemanasDias.dias).toBe(6);
      expect(classificarIG(result!.igTotalDias)).toBe('normal');
    });

    it('cenário real: DUM 2025-06-01, cesárea 2026-03-08 = 40s0d (pós-termo)', () => {
      const result = calcularIGNaData('2026-03-08', { dum: '2025-06-01' });
      expect(result).not.toBeNull();
      expect(result!.igTotalDias).toBe(280);
      expect(result!.igSemanasDias.semanas).toBe(40);
      expect(result!.igSemanasDias.dias).toBe(0);
      expect(classificarIG(result!.igTotalDias)).toBe('pos-termo');
    });
  });
});
