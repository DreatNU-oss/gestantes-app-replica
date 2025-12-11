import { describe, it, expect } from "vitest";

describe("Helena API Integration", () => {
  it("should have HELENA_API_TOKEN configured", () => {
    const token = process.env.HELENA_API_TOKEN;
    
    expect(token).toBeDefined();
    expect(token).not.toBe("");
    expect(token).toMatch(/^pn_/); // Token deve começar com "pn_"
    
    console.log("✅ HELENA_API_TOKEN configurado corretamente");
    console.log(`Token prefix: ${token?.substring(0, 10)}...`);
  });

  it("should validate token format", () => {
    const token = process.env.HELENA_API_TOKEN;
    
    // Token do Helena tem formato: pn_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    expect(token).toMatch(/^pn_[A-Za-z0-9]{40,50}$/);
    
    console.log("✅ Formato do token válido");
  });
});
