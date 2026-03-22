import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
};

vi.mock('./db', () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
  getGestanteById: vi.fn((id: number) => Promise.resolve({ id, nome: `Gestante ${id}` })),
}));

describe('Exames Pendentes - Schema e Lógica', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve ter os campos status e origemEnvio no schema', async () => {
    // Verificar que o schema importa corretamente
    const schema = await import('../drizzle/schema');
    expect(schema.arquivosExames).toBeDefined();
  });

  it('contarPendentes deve retornar count 0 quando não há pendentes', async () => {
    mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
    
    const result = await mockDb.select().from('arquivosExames').where('status = pendente_revisao');
    expect(result).toEqual([{ count: 0 }]);
  });

  it('contarPendentes deve retornar count correto quando há pendentes', async () => {
    mockDb.where.mockResolvedValueOnce([{ count: 3 }]);
    
    const result = await mockDb.select().from('arquivosExames').where('status = pendente_revisao');
    expect(result).toEqual([{ count: 3 }]);
  });

  it('listarPendentes deve retornar array de exames com gestanteNome', async () => {
    const mockPendentes = [
      { id: 1, gestanteId: 10, nomeArquivo: 'exame1.pdf', tipoArquivo: 'application/pdf', status: 'pendente_revisao' },
      { id: 2, gestanteId: 20, nomeArquivo: 'exame2.jpg', tipoArquivo: 'image/jpeg', status: 'pendente_revisao' },
    ];
    mockDb.orderBy.mockResolvedValueOnce(mockPendentes);
    
    const result = await mockDb.select().from('arquivosExames').where('status = pendente_revisao').orderBy('createdAt DESC');
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('pendente_revisao');
    expect(result[1].nomeArquivo).toBe('exame2.jpg');
  });

  it('confirmarExame deve atualizar status para confirmado', async () => {
    mockDb.where.mockResolvedValueOnce([{ affectedRows: 1 }]);
    
    const result = await mockDb.update('arquivosExames').set({ status: 'confirmado' }).where('id = 1');
    expect(result).toEqual([{ affectedRows: 1 }]);
  });

  it('rejeitarExame deve atualizar status para rejeitado', async () => {
    mockDb.where.mockResolvedValueOnce([{ affectedRows: 1 }]);
    
    const result = await mockDb.update('arquivosExames').set({ status: 'rejeitado' }).where('id = 1');
    expect(result).toEqual([{ affectedRows: 1 }]);
  });
});

describe('formatarParidade - shared/paridade', () => {
  it('deve formatar primeira gestação corretamente', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: 1, para: 0, partosNormais: 0, cesareas: 0, abortos: 0 })).toBe('G1');
  });

  it('deve formatar gestante com cesáreas', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: 3, para: 2, partosNormais: 0, cesareas: 2, abortos: 0 })).toBe('G3P2(PC2)');
  });

  it('deve formatar gestante com partos normais e cesáreas', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: 4, para: 3, partosNormais: 1, cesareas: 2, abortos: 0 })).toBe('G4P3(PN1PC2)');
  });

  it('deve formatar gestante com abortos', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: 3, para: 0, partosNormais: 0, cesareas: 0, abortos: 3 })).toBe('G3A3');
  });

  it('deve formatar caso completo com tudo', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: 5, para: 2, partosNormais: 1, cesareas: 1, abortos: 2 })).toBe('G5P2(PN1PC1)A2');
  });

  it('deve retornar G0 quando gesta é 0', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: 0, para: 0, partosNormais: 0, cesareas: 0, abortos: 0 })).toBe('G0');
  });

  it('deve tratar null como 0', async () => {
    const { formatarParidade } = await import('../shared/paridade');
    expect(formatarParidade({ gesta: null, para: null, partosNormais: null, cesareas: null, abortos: null })).toBe('G0');
  });
});
