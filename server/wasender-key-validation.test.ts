import { describe, it, expect } from 'vitest';

describe('WaSenderAPI Key Validation', () => {
  it('deve ter WASENDER_API_KEY configurada no ambiente', () => {
    const key = process.env.WASENDER_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it('deve validar o token com a API do WaSenderAPI', async () => {
    const key = process.env.WASENDER_API_KEY;
    if (!key) {
      console.warn('WASENDER_API_KEY não configurada, pulando teste de validação');
      return;
    }

    // Chamar endpoint de envio com payload inválido para validar autenticação
    // Se o token for válido, retorna 400 (bad request) por falta de parâmetros
    // Se o token for inválido, retorna 401 (unauthorized)
    const response = await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // payload vazio para testar auth
    });

    // Token válido: não deve retornar 401/403
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
