import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("gestante.loginComSenha - Apple App Store Review", () => {
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  it("deve autenticar com credenciais corretas da conta de teste", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "dreatnu@yahoo.com",
      senha: "MaisMulher2026!",
      dispositivo: "iPad Air",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.token).toBeDefined();
      expect(resultado.token.length).toBeGreaterThan(0);
      expect(resultado.gestante).toBeDefined();
      expect(resultado.gestante.id).toBe(1560002);
      expect(resultado.gestante.nome).toBe("TESTE TESTE");
      expect(resultado.gestante.email).toBe("dreatnu@yahoo.com");
      expect(resultado.expiraEm).toBeDefined();
      // Verificar que expiraEm é uma data ISO válida no futuro
      const expDate = new Date(resultado.expiraEm);
      expect(expDate.getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("deve rejeitar senha incorreta", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "dreatnu@yahoo.com",
      senha: "senhaerrada",
      dispositivo: "test",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error).toBe("Email ou senha incorretos.");
    }
  });

  it("deve rejeitar email não autorizado", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "outro@email.com",
      senha: "MaisMulher2026!",
      dispositivo: "test",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error).toBe("Email ou senha incorretos.");
    }
  });

  it("deve rejeitar email e senha ambos incorretos", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "hacker@evil.com",
      senha: "tentativa123",
      dispositivo: "test",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error).toBe("Email ou senha incorretos.");
    }
  });

  it("deve funcionar sem dispositivo (campo opcional)", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "dreatnu@yahoo.com",
      senha: "MaisMulher2026!",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.token).toBeDefined();
      expect(resultado.gestante.id).toBe(1560002);
    }
  });

  it("deve ser case-insensitive para o email", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "DreatNU@Yahoo.com",
      senha: "MaisMulher2026!",
      dispositivo: "test",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.gestante.email).toBe("dreatnu@yahoo.com");
    }
  });

  it("deve ser case-sensitive para a senha", async () => {
    const resultado = await caller.gestante.loginComSenha({
      email: "dreatnu@yahoo.com",
      senha: "maismulher2026!",
      dispositivo: "test",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error).toBe("Email ou senha incorretos.");
    }
  });

  it("deve gerar tokens diferentes a cada login", async () => {
    const resultado1 = await caller.gestante.loginComSenha({
      email: "dreatnu@yahoo.com",
      senha: "MaisMulher2026!",
      dispositivo: "test1",
    });

    const resultado2 = await caller.gestante.loginComSenha({
      email: "dreatnu@yahoo.com",
      senha: "MaisMulher2026!",
      dispositivo: "test2",
    });

    expect(resultado1.success).toBe(true);
    expect(resultado2.success).toBe(true);
    if (resultado1.success && resultado2.success) {
      expect(resultado1.token).not.toBe(resultado2.token);
    }
  });
});
