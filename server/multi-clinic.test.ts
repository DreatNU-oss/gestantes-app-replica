import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getClinicaByCodigo, getClinicaById, getGestantesByUserId } from "./db";
import { checkEmailStatus, isEmailAuthorized, getClinicaIdByEmail } from "./passwordAuth";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContextWithClinica(clinicaId: number | null = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    clinicaId: clinicaId,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    passwordChangedAt: null,
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

describe("Multi-Clinic System", () => {
  
  describe("Clinica table operations", () => {
    it("should find clinic 00001 by code", async () => {
      const clinica = await getClinicaByCodigo("00001");
      expect(clinica).toBeDefined();
      expect(clinica?.codigo).toBe("00001");
      expect(clinica?.nome).toBeTruthy();
      expect(clinica?.ativa).toBe(1);
    });

    it("should find clinic by ID", async () => {
      const clinica = await getClinicaByCodigo("00001");
      if (!clinica) throw new Error("Clinic 00001 not found");
      
      const clinicaById = await getClinicaById(clinica.id);
      expect(clinicaById).toBeDefined();
      expect(clinicaById?.codigo).toBe("00001");
    });

    it("should return undefined for non-existent clinic code", async () => {
      const clinica = await getClinicaByCodigo("99999");
      expect(clinica).toBeUndefined();
    });
  });

  describe("Auth.me returns clinic info", () => {
    it("should return clinicaCodigo, clinicaNome, clinicaLogoUrl for authenticated user", async () => {
      const { ctx } = createAuthContextWithClinica(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("clinicaCodigo");
      expect(result).toHaveProperty("clinicaNome");
      expect(result).toHaveProperty("clinicaLogoUrl");
      // For clinic 00001, clinicaCodigo should be "00001"
      expect(result?.clinicaCodigo).toBe("00001");
    });

    it("should return null clinic info for user without clinicaId", async () => {
      const { ctx } = createAuthContextWithClinica(null);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      
      expect(result).toBeDefined();
      expect(result?.clinicaCodigo).toBeNull();
      expect(result?.clinicaNome).toBeNull();
      expect(result?.clinicaLogoUrl).toBeNull();
    });
  });

  describe("Tenant isolation - gestantes filtering", () => {
    it("should return gestantes only for the specified clinic", async () => {
      // Get gestantes for clinic 1 (00001)
      const gestantesClinic1 = await getGestantesByUserId(1, undefined, 1);
      
      // All returned gestantes should belong to clinic 1
      for (const g of gestantesClinic1) {
        expect(g.clinicaId).toBe(1);
      }
    });

    it("should return empty list for a clinic with no gestantes", async () => {
      // Clinic ID 999 doesn't exist, should return empty
      const gestantes = await getGestantesByUserId(1, undefined, 999);
      expect(gestantes).toHaveLength(0);
    });
  });

  describe("Email authorization with clinic scope", () => {
    it("should check email authorization within clinic scope", async () => {
      // Get an authorized email from clinic 00001
      const clinica = await getClinicaByCodigo("00001");
      if (!clinica) throw new Error("Clinic 00001 not found");
      
      // isEmailAuthorized should work with clinicaId filter
      // Testing the function signature works correctly
      const result = await isEmailAuthorized("nonexistent@test.com", clinica.id);
      expect(typeof result).toBe("boolean");
    });

    it("should resolve clinicaId from email in emailsAutorizados", async () => {
      // getClinicaIdByEmail should return clinicaId for authorized emails
      const clinicaId = await getClinicaIdByEmail("nonexistent@test.com");
      // Non-existent email should return null
      expect(clinicaId).toBeNull();
    });
  });

  describe("checkEmailStatus with clinic code", () => {
    it("should return not authorized for invalid clinic code", async () => {
      const status = await checkEmailStatus("test@test.com", "99999");
      expect(status.isAuthorized).toBe(false);
    });

    it("should return not authorized for unauthorized email in valid clinic", async () => {
      const status = await checkEmailStatus("unauthorized@random.com", "00001");
      expect(status.isAuthorized).toBe(false);
    });
  });

  describe("Integration API conditional access", () => {
    it("should have integracaoApiAtiva flag on clinic 00001", async () => {
      const clinica = await getClinicaByCodigo("00001");
      expect(clinica).toBeDefined();
      expect(clinica?.integracaoApiAtiva).toBe(1);
    });

    it("should block integracao.syncCesareas for clinic without API integration", async () => {
      // Create context with a non-existent clinicaId (no integration)
      const { ctx } = createAuthContextWithClinica(999);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.integracao.syncCesareas()).rejects.toThrow(/não disponível/);
    });
  });
});
