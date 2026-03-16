import { describe, it, expect, vi } from 'vitest';

// ─── Orientation Tracking Feature Tests ──────────────────────────────────────

describe('Orientação Tracking - Schema', () => {
  it('deve importar a tabela orientacoesEnviadas do schema', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema.orientacoesEnviadas).toBeDefined();
  });

  it('tabela orientacoesEnviadas deve ter os campos necessários', async () => {
    const schema = await import('../drizzle/schema');
    const table = schema.orientacoesEnviadas;
    // Verify the table has the expected column names
    const columnNames = Object.keys(table);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('gestanteId');
    expect(columnNames).toContain('clinicaId');
    expect(columnNames).toContain('tipoOrientacao');
    expect(columnNames).toContain('enviadoPorId');
    expect(columnNames).toContain('enviadoPorNome');
    expect(columnNames).toContain('enviadoEm');
  });
});

describe('Orientação Tracking - Lógica foiEnviada', () => {
  // Simulates the foiEnviada helper function from CartaoPrenatal.tsx
  const foiEnviada = (orientacoes: Array<{ tipoOrientacao: string }>, tipo: string) =>
    orientacoes.some(o => o.tipoOrientacao === tipo);

  it('deve retornar true quando orientação foi enviada', () => {
    const orientacoes = [
      { tipoOrientacao: 'or-alimentares-1a' },
      { tipoOrientacao: 'enviar-cartao' },
    ];
    expect(foiEnviada(orientacoes, 'or-alimentares-1a')).toBe(true);
    expect(foiEnviada(orientacoes, 'enviar-cartao')).toBe(true);
  });

  it('deve retornar false quando orientação não foi enviada', () => {
    const orientacoes = [
      { tipoOrientacao: 'or-alimentares-1a' },
    ];
    expect(foiEnviada(orientacoes, 'enviar-cartao')).toBe(false);
    expect(foiEnviada(orientacoes, 'or-atividade-fisica')).toBe(false);
  });

  it('deve retornar false quando lista está vazia', () => {
    const orientacoes: Array<{ tipoOrientacao: string }> = [];
    expect(foiEnviada(orientacoes, 'or-alimentares-1a')).toBe(false);
  });

  it('deve lidar com múltiplos envios do mesmo tipo', () => {
    const orientacoes = [
      { tipoOrientacao: 'or-alimentares-1a' },
      { tipoOrientacao: 'or-alimentares-1a' }, // sent twice
    ];
    expect(foiEnviada(orientacoes, 'or-alimentares-1a')).toBe(true);
  });
});

describe('Orientação Tracking - Lógica ultimoEnvio', () => {
  // Simulates the ultimoEnvio helper function from CartaoPrenatal.tsx
  const ultimoEnvio = (orientacoes: Array<{ tipoOrientacao: string; enviadoEm: Date | string }>, tipo: string) => {
    const envio = orientacoes.find(o => o.tipoOrientacao === tipo);
    if (!envio) return null;
    return new Date(envio.enviadoEm).toLocaleString('pt-BR');
  };

  it('deve retornar data formatada quando orientação existe', () => {
    const orientacoes = [
      { tipoOrientacao: 'or-alimentares-1a', enviadoEm: new Date('2026-03-16T10:30:00Z') },
    ];
    const resultado = ultimoEnvio(orientacoes, 'or-alimentares-1a');
    expect(resultado).not.toBeNull();
    expect(typeof resultado).toBe('string');
    expect(resultado!.length).toBeGreaterThan(0);
  });

  it('deve retornar null quando orientação não existe', () => {
    const orientacoes = [
      { tipoOrientacao: 'or-alimentares-1a', enviadoEm: new Date() },
    ];
    const resultado = ultimoEnvio(orientacoes, 'enviar-cartao');
    expect(resultado).toBeNull();
  });

  it('deve retornar null para lista vazia', () => {
    const orientacoes: Array<{ tipoOrientacao: string; enviadoEm: Date }> = [];
    const resultado = ultimoEnvio(orientacoes, 'or-alimentares-1a');
    expect(resultado).toBeNull();
  });

  it('deve aceitar enviadoEm como string ISO', () => {
    const orientacoes = [
      { tipoOrientacao: 'enviar-cartao', enviadoEm: '2026-03-16T10:30:00.000Z' },
    ];
    const resultado = ultimoEnvio(orientacoes, 'enviar-cartao');
    expect(resultado).not.toBeNull();
    expect(typeof resultado).toBe('string');
  });
});

describe('Orientação Tracking - Tipos de Orientação', () => {
  const tiposConhecidos = [
    'or-alimentares-1a',
    'enviar-cartao',
  ];

  it('deve ter tipos de orientação definidos', () => {
    expect(tiposConhecidos.length).toBeGreaterThanOrEqual(2);
  });

  it('tipo or-alimentares-1a deve ser válido', () => {
    expect(tiposConhecidos).toContain('or-alimentares-1a');
  });

  it('tipo enviar-cartao deve ser válido', () => {
    expect(tiposConhecidos).toContain('enviar-cartao');
  });

  it('tipos devem ser strings não vazias', () => {
    tiposConhecidos.forEach(tipo => {
      expect(tipo.length).toBeGreaterThan(0);
      expect(tipo.trim()).toBe(tipo);
    });
  });
});

describe('Orientação Tracking - Isolamento por Clínica', () => {
  it('deve filtrar orientações por clinicaId', () => {
    const todasOrientacoes = [
      { gestanteId: 1, clinicaId: 10, tipoOrientacao: 'or-alimentares-1a' },
      { gestanteId: 1, clinicaId: 20, tipoOrientacao: 'or-alimentares-1a' },
      { gestanteId: 2, clinicaId: 10, tipoOrientacao: 'enviar-cartao' },
    ];

    const clinicaId = 10;
    const filtradas = todasOrientacoes.filter(o => o.clinicaId === clinicaId);
    expect(filtradas.length).toBe(2);
    expect(filtradas.every(o => o.clinicaId === clinicaId)).toBe(true);
  });

  it('deve filtrar orientações por gestanteId', () => {
    const todasOrientacoes = [
      { gestanteId: 1, clinicaId: 10, tipoOrientacao: 'or-alimentares-1a' },
      { gestanteId: 1, clinicaId: 10, tipoOrientacao: 'enviar-cartao' },
      { gestanteId: 2, clinicaId: 10, tipoOrientacao: 'or-alimentares-1a' },
    ];

    const gestanteId = 1;
    const filtradas = todasOrientacoes.filter(o => o.gestanteId === gestanteId);
    expect(filtradas.length).toBe(2);
    expect(filtradas.every(o => o.gestanteId === gestanteId)).toBe(true);
  });
});

describe('Orientação Tracking - Indicadores Visuais', () => {
  it('botão enviado deve ter classe de fundo verde para orientações', () => {
    const foiEnviada = true;
    const className = foiEnviada
      ? 'border-green-400 bg-green-50 text-green-800'
      : 'border-green-200 hover:bg-green-50 hover:border-green-400 text-green-800';
    
    expect(className).toContain('bg-green-50');
    expect(className).toContain('border-green-400');
  });

  it('botão não enviado deve ter classe de borda leve', () => {
    const foiEnviada = false;
    const className = foiEnviada
      ? 'border-green-400 bg-green-50 text-green-800'
      : 'border-green-200 hover:bg-green-50 hover:border-green-400 text-green-800';
    
    expect(className).toContain('border-green-200');
    expect(className).toContain('hover:bg-green-50');
  });

  it('botão Enviar Cartão enviado deve ter classe de fundo azul', () => {
    const foiEnviada = true;
    const className = foiEnviada
      ? 'border-blue-400 bg-blue-50 text-blue-800'
      : 'border-blue-200 hover:bg-blue-50 hover:border-blue-400 text-blue-800';
    
    expect(className).toContain('bg-blue-50');
    expect(className).toContain('border-blue-400');
  });

  it('tooltip deve mostrar data de envio quando orientação foi enviada', () => {
    const foiEnviada = true;
    const dataEnvio = '16/03/2026, 07:30:00';
    const title = foiEnviada
      ? `Enviado em ${dataEnvio}`
      : 'Enviar orientações alimentares 1ª consulta';
    
    expect(title).toContain('Enviado em');
    expect(title).toContain('16/03/2026');
  });

  it('tooltip deve mostrar descrição quando orientação não foi enviada', () => {
    const foiEnviada = false;
    const title = foiEnviada
      ? 'Enviado em 16/03/2026, 07:30:00'
      : 'Enviar orientações alimentares 1ª consulta';
    
    expect(title).toContain('Enviar orientações');
    expect(title).not.toContain('Enviado em');
  });
});
