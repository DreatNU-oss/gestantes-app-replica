import { describe, it, expect } from 'vitest';

describe('OpenAI API Key Validation', () => {
  it('should have OPENAI_API_KEY configured', () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(apiKey?.startsWith('sk-')).toBe(true);
  });

  it('should be able to connect to OpenAI API', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Fazer uma chamada simples para validar a chave
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
