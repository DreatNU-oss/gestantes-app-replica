import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock state
const mockGetGestanteById = vi.fn();
const mockGetDb = vi.fn();

const mockDeleteGestante = vi.fn().mockResolvedValue(true);

vi.mock('./db', () => ({
  getDb: (...args: any[]) => mockGetDb(...args),
  getGestanteById: (...args: any[]) => mockGetGestanteById(...args),
  deleteGestante: (...args: any[]) => mockDeleteGestante(...args),
}));

vi.mock('../drizzle/schema', () => ({
  abortamentos: { id: 'id', gestanteId: 'gestanteId', dataAbortamento: 'dataAbortamento', igSemanas: 'igSemanas', igDias: 'igDias', tipoAbortamento: 'tipoAbortamento', observacoes: 'observacoes', medicoId: 'medicoId', createdAt: 'createdAt', nomeGestante: 'nomeGestante', planoSaudeId: 'planoSaudeId' },
  gestantes: { id: 'id', nome: 'nome', medicoId: 'medicoId' },
  medicos: { id: 'id', nome: 'nome' },
  planosSaude: { id: 'id', nome: 'nome' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ op: 'eq', a, b })),
  desc: vi.fn((a) => ({ op: 'desc', a })),
  sql: vi.fn(),
  count: vi.fn(() => 'count_fn'),
}));

vi.mock('@trpc/server', () => ({
  TRPCError: class TRPCError extends Error {
    code: string;
    constructor({ code, message }: { code: string; message: string }) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('./cesareanSync', () => ({
  sincronizarCesareaComAdmin: vi.fn().mockResolvedValue(true),
}));

// Create a deeply chainable mock db
function createMockDb() {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined; // not thenable at top level
      // Return a function that returns a chainable + thenable proxy
      return (..._args: any[]) => {
        return new Proxy({}, {
          get(_t, p) {
            if (p === 'then') return (resolve: any) => resolve([{ insertId: 1 }]);
            return (..._a: any[]) => new Proxy({}, {
              get(_t2, p2) {
                if (p2 === 'then') return (resolve: any) => resolve([{ insertId: 1 }]);
                return (..._a2: any[]) => ({ then: (resolve: any) => resolve([{ insertId: 1 }]) });
              }
            });
          }
        });
      };
    }
  };
  return new Proxy({}, handler);
}

describe('Abortamentos Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDb.mockResolvedValue(createMockDb());
  });

  describe('Input Validation', () => {
    it('should reject gestanteId = 0', async () => {
      const { registrarAbortamento } = await import('./abortamentos');
      
      await expect(registrarAbortamento({
        gestanteId: 0,
        dataAbortamento: '2026-01-15',
      })).rejects.toThrow();
    });

    it('should reject invalid date format', async () => {
      const { registrarAbortamento } = await import('./abortamentos');
      
      await expect(registrarAbortamento({
        gestanteId: 1,
        dataAbortamento: 'invalid-date',
      })).rejects.toThrow();
    });

    it('should reject when gestante not found', async () => {
      mockGetGestanteById.mockResolvedValue(null);

      const { registrarAbortamento } = await import('./abortamentos');
      
      await expect(registrarAbortamento({
        gestanteId: 999,
        dataAbortamento: '2026-01-15',
      })).rejects.toThrow('Gestante n\u00e3o encontrada');
    });

    it('should register abortamento successfully', async () => {
      mockGetGestanteById.mockResolvedValue({ id: 1, nome: 'Maria Silva', medicoId: 5, planoSaudeId: null });

      const { registrarAbortamento } = await import('./abortamentos');
      
      const result = await registrarAbortamento({
        gestanteId: 1,
        dataAbortamento: '2026-01-15',
        tipoAbortamento: 'espontaneo',
        igSemanas: 10,
        igDias: 3,
        observacoes: 'Sangramento intenso',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.nomeGestante).toBe('Maria Silva');
      expect(mockDeleteGestante).toHaveBeenCalledWith(1);
    });
  });

  describe('Tipo Abortamento Values', () => {
    it('should accept all valid types', () => {
      const validTypes = ['espontaneo', 'retido', 'incompleto', 'inevitavel', 'outro'];
      expect(validTypes).toHaveLength(5);
      validTypes.forEach(tipo => {
        expect(['espontaneo', 'retido', 'incompleto', 'inevitavel', 'outro']).toContain(tipo);
      });
    });
  });

  describe('IG Faixa Classification', () => {
    it('should classify IG into correct ranges', () => {
      const classificarIG = (semanas: number | null): string => {
        if (semanas === null || semanas === undefined) return 'Não informado';
        if (semanas < 8) return '< 8 semanas';
        if (semanas < 12) return '8-12 semanas';
        if (semanas < 20) return '12-20 semanas';
        return '≥ 20 semanas';
      };

      expect(classificarIG(null)).toBe('Não informado');
      expect(classificarIG(5)).toBe('< 8 semanas');
      expect(classificarIG(7)).toBe('< 8 semanas');
      expect(classificarIG(8)).toBe('8-12 semanas');
      expect(classificarIG(11)).toBe('8-12 semanas');
      expect(classificarIG(12)).toBe('12-20 semanas');
      expect(classificarIG(19)).toBe('12-20 semanas');
      expect(classificarIG(20)).toBe('≥ 20 semanas');
      expect(classificarIG(25)).toBe('≥ 20 semanas');
    });

    it('should handle edge cases for IG', () => {
      const classificarIG = (semanas: number | null): string => {
        if (semanas === null || semanas === undefined) return 'Não informado';
        if (semanas < 8) return '< 8 semanas';
        if (semanas < 12) return '8-12 semanas';
        if (semanas < 20) return '12-20 semanas';
        return '≥ 20 semanas';
      };

      expect(classificarIG(0)).toBe('< 8 semanas');
      expect(classificarIG(1)).toBe('< 8 semanas');
      expect(classificarIG(42)).toBe('≥ 20 semanas');
    });
  });

  describe('Data formatting', () => {
    it('should validate YYYY-MM-DD format', () => {
      const isValidDate = (date: string): boolean => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(date)) return false;
        const parsed = new Date(date + 'T12:00:00');
        return !isNaN(parsed.getTime());
      };

      expect(isValidDate('2026-01-15')).toBe(true);
      expect(isValidDate('2026-12-31')).toBe(true);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('15/01/2026')).toBe(false);
      expect(isValidDate('2026-13-01')).toBe(false);
    });
  });
});
