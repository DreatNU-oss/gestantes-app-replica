import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key Validation", () => {
  it("deve validar que RESEND_API_KEY está configurada", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).not.toBe("");
    expect(process.env.RESEND_API_KEY?.startsWith("re_")).toBe(true);
  });

  it("deve inicializar o cliente Resend sem erros", () => {
    expect(() => {
      const resend = new Resend(process.env.RESEND_API_KEY);
      expect(resend).toBeDefined();
    }).not.toThrow();
  });

  it("deve verificar formato válido da chave", () => {
    const apiKey = process.env.RESEND_API_KEY;
    
    // Resend API keys têm formato específico: re_xxxxx
    expect(apiKey).toMatch(/^re_[A-Za-z0-9_-]+$/);
    
    // Deve ter comprimento mínimo razoável
    expect(apiKey!.length).toBeGreaterThan(20);
  });
});
