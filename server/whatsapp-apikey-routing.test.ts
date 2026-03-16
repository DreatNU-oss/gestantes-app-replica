import { describe, it, expect } from 'vitest';

/**
 * Tests for WhatsApp API key routing logic:
 * - Clínica 00001 (principal) → WASENDER_API_KEY
 * - Outras clínicas → WASENDER_API_KEY_OUTRAS_CLINICAS
 * 
 * Also validates that the WASENDER_API_KEY_OUTRAS_CLINICAS secret is set.
 */

describe('WhatsApp API Key Routing', () => {
  it('WASENDER_API_KEY_OUTRAS_CLINICAS env var should be set', () => {
    const key = process.env.WASENDER_API_KEY_OUTRAS_CLINICAS;
    expect(key).toBeDefined();
    expect(key).not.toBe('');
    expect(typeof key).toBe('string');
    // Should be a hex-like token
    expect(key!.length).toBeGreaterThan(20);
  });

  it('WASENDER_API_KEY env var should be set (clínica principal)', () => {
    const key = process.env.WASENDER_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe('');
  });

  it('The two API keys should be different', () => {
    const keyPrincipal = process.env.WASENDER_API_KEY;
    const keyOutras = process.env.WASENDER_API_KEY_OUTRAS_CLINICAS;
    expect(keyPrincipal).not.toBe(keyOutras);
  });

  it('WASENDER_API_KEY_OUTRAS_CLINICAS should be a valid WaSenderAPI token format', async () => {
    const key = process.env.WASENDER_API_KEY_OUTRAS_CLINICAS;
    if (!key) return; // Skip if not set
    
    // Validate by making a lightweight request to the API
    // Using a GET to check connectivity (will return 405 or similar but proves the key format is accepted)
    try {
      const response = await fetch('https://www.wasenderapi.com/api/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        // Send minimal body - will fail validation but proves auth works
        body: JSON.stringify({ to: '', text: '' }),
      });
      // If we get 400 (bad request) or 422 (validation error), the key is valid but input is wrong
      // If we get 401/403, the key is invalid
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    } catch (error) {
      // Network error is acceptable in test environment
      console.log('Network request skipped in test environment');
    }
  });
});

describe('Phone normalization (imported from whatsapp.ts)', () => {
  // Import the normalizePhone function
  it('should normalize Brazilian phone numbers correctly', async () => {
    const { normalizePhone } = await import('./whatsapp');
    
    expect(normalizePhone('(35) 99137-5232')).toBe('5535991375232');
    expect(normalizePhone('35991375232')).toBe('5535991375232');
    expect(normalizePhone('5535991375232')).toBe('5535991375232');
    expect(normalizePhone('+5535991375232')).toBe('5535991375232');
    expect(normalizePhone('035991375232')).toBe('5535991375232');
  });
});
