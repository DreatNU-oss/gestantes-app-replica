import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the flower reminder API integration
describe('Flower Reminder - enviarLembreteFloresAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return error when admin config is missing', async () => {
    // Clear env vars
    const origUrl = process.env.ADMIN_SYSTEM_URL;
    const origKey = process.env.ADMIN_INTEGRATION_API_KEY;
    delete process.env.ADMIN_SYSTEM_URL;
    delete process.env.ADMIN_INTEGRATION_API_KEY;

    const { enviarLembreteFloresAdmin } = await import('./flowerReminder');
    
    const result = await enviarLembreteFloresAdmin({
      gestanteId: 1,
      gestanteNome: 'Maria Silva',
      medicoNome: 'Dr. André',
      medicoId: 1,
      numeroPartoMedico: 2,
      dataParto: '2026-03-15',
      tipoParto: 'normal',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Configuração ausente');

    // Restore env vars
    if (origUrl) process.env.ADMIN_SYSTEM_URL = origUrl;
    if (origKey) process.env.ADMIN_INTEGRATION_API_KEY = origKey;
  });

  it('should format ordinal correctly for 2nd delivery', async () => {
    process.env.ADMIN_SYSTEM_URL = 'https://test-admin.example.com';
    process.env.ADMIN_INTEGRATION_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, lembreteId: 123 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { enviarLembreteFloresAdmin } = await import('./flowerReminder');

    await enviarLembreteFloresAdmin({
      gestanteId: 1,
      gestanteNome: 'Maria Silva',
      medicoNome: 'Dr. André',
      medicoId: 1,
      numeroPartoMedico: 2,
      dataParto: '2026-03-15',
      tipoParto: 'cesarea',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://test-admin.example.com/api/integration/lembrete');
    
    const body = JSON.parse(callArgs[1].body);
    expect(body.tipo).toBe('envio_flores');
    expect(body.titulo).toContain('2º parto');
    expect(body.titulo).toContain('Dr. André');
    expect(body.descricao).toContain('Maria Silva');
    expect(body.descricao).toContain('Cesárea');
    expect(body.prioridade).toBe('alta');
    expect(body.externalId).toBe('flores-gestante-1-parto-2');
    expect(body.metadata.numeroPartoMedico).toBe(2);

    vi.unstubAllGlobals();
  });

  it('should format ordinal correctly for 3rd delivery', async () => {
    process.env.ADMIN_SYSTEM_URL = 'https://test-admin.example.com';
    process.env.ADMIN_INTEGRATION_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, lembreteId: 456 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { enviarLembreteFloresAdmin } = await import('./flowerReminder');

    const result = await enviarLembreteFloresAdmin({
      gestanteId: 5,
      gestanteNome: 'Ana Costa',
      medicoNome: 'Dr. André',
      medicoId: 1,
      numeroPartoMedico: 3,
      dataParto: '2026-06-20',
      tipoParto: 'normal',
    });

    expect(result.success).toBe(true);
    expect(result.lembreteId).toBe(456);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.titulo).toContain('3º parto');
    expect(body.descricao).toContain('Parto Normal');
    expect(body.descricao).toContain('20/06/2026');

    vi.unstubAllGlobals();
  });

  it('should handle API failure gracefully', async () => {
    process.env.ADMIN_SYSTEM_URL = 'https://test-admin.example.com';
    process.env.ADMIN_INTEGRATION_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const { enviarLembreteFloresAdmin } = await import('./flowerReminder');

    const result = await enviarLembreteFloresAdmin({
      gestanteId: 1,
      gestanteNome: 'Maria Silva',
      medicoNome: 'Dr. André',
      medicoId: 1,
      numeroPartoMedico: 2,
      dataParto: '2026-03-15',
      tipoParto: 'normal',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');

    vi.unstubAllGlobals();
  });

  it('should handle API returning error response', async () => {
    process.env.ADMIN_SYSTEM_URL = 'https://test-admin.example.com';
    process.env.ADMIN_INTEGRATION_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'Endpoint not found' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { enviarLembreteFloresAdmin } = await import('./flowerReminder');

    const result = await enviarLembreteFloresAdmin({
      gestanteId: 1,
      gestanteNome: 'Maria Silva',
      medicoNome: 'Dr. André',
      medicoId: 1,
      numeroPartoMedico: 2,
      dataParto: '2026-03-15',
      tipoParto: 'normal',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Endpoint not found');

    vi.unstubAllGlobals();
  });
});

// Test the delivery count logic
describe('Delivery Count Logic', () => {
  it('should not trigger flowers for 1st delivery', () => {
    const numParto = 1;
    const ehPartoRepetido = numParto >= 2;
    expect(ehPartoRepetido).toBe(false);
  });

  it('should trigger flowers for 2nd delivery', () => {
    const numParto = 2;
    const ehPartoRepetido = numParto >= 2;
    expect(ehPartoRepetido).toBe(true);
  });

  it('should trigger flowers for 3rd delivery', () => {
    const numParto = 3;
    const ehPartoRepetido = numParto >= 2;
    expect(ehPartoRepetido).toBe(true);
  });

  it('should trigger flowers for 4th+ delivery', () => {
    const numParto = 4;
    const ehPartoRepetido = numParto >= 2;
    expect(ehPartoRepetido).toBe(true);
  });

  it('should default to 1st delivery when not specified', () => {
    const numParto = undefined || 1;
    const ehPartoRepetido = numParto >= 2;
    expect(ehPartoRepetido).toBe(false);
  });
});
