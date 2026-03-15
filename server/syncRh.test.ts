import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db module before importing routers
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as Record<string, unknown>;
  return {
    ...actual,
    getFatoresRiscoByGestanteId: vi.fn(),
    createFatorRisco: vi.fn(),
    deleteFatorRisco: vi.fn(),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getFatoresRiscoByGestanteId, createFatorRisco, deleteFatorRisco } from "./db";

const mockGetFatores = getFatoresRiscoByGestanteId as ReturnType<typeof vi.fn>;
const mockCreateFator = createFatorRisco as ReturnType<typeof vi.fn>;
const mockDeleteFator = deleteFatorRisco as ReturnType<typeof vi.fn>;

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("fatoresRisco.syncRhRiskFactor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds Rh risk factor when blood type is Rh negative and no existing factor", async () => {
    mockGetFatores.mockResolvedValue([]);
    mockCreateFator.mockResolvedValue({ id: 1, gestanteId: 100, tipo: "fator_rh_negativo", ativo: 1 });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.fatoresRisco.syncRhRiskFactor({
      gestanteId: 100,
      tipoSanguineo: "A-",
    });

    expect(result.action).toBe("added");
    expect(result.message).toContain("adicionado");
    expect(mockCreateFator).toHaveBeenCalledWith({ gestanteId: 100, tipo: "fator_rh_negativo" });
  });

  it("removes Rh risk factor when blood type is Rh positive and factor exists", async () => {
    mockGetFatores.mockResolvedValue([
      { id: 42, gestanteId: 100, tipo: "fator_rh_negativo", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockDeleteFator.mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.fatoresRisco.syncRhRiskFactor({
      gestanteId: 100,
      tipoSanguineo: "A+",
    });

    expect(result.action).toBe("removed");
    expect(result.message).toContain("removido");
    expect(mockDeleteFator).toHaveBeenCalledWith(42);
  });

  it("does nothing when blood type is Rh negative and factor already exists", async () => {
    mockGetFatores.mockResolvedValue([
      { id: 42, gestanteId: 100, tipo: "fator_rh_negativo", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.fatoresRisco.syncRhRiskFactor({
      gestanteId: 100,
      tipoSanguineo: "B-",
    });

    expect(result.action).toBe("none");
    expect(result.message).toBeNull();
    expect(mockCreateFator).not.toHaveBeenCalled();
    expect(mockDeleteFator).not.toHaveBeenCalled();
  });

  it("does nothing when blood type is Rh positive and no existing factor", async () => {
    mockGetFatores.mockResolvedValue([]);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.fatoresRisco.syncRhRiskFactor({
      gestanteId: 100,
      tipoSanguineo: "O+",
    });

    expect(result.action).toBe("none");
    expect(result.message).toBeNull();
    expect(mockCreateFator).not.toHaveBeenCalled();
    expect(mockDeleteFator).not.toHaveBeenCalled();
  });

  it("handles all Rh negative blood types correctly", async () => {
    const rhNegativeTypes = ["A-", "B-", "AB-", "O-"];
    
    for (const tipo of rhNegativeTypes) {
      mockGetFatores.mockResolvedValue([]);
      mockCreateFator.mockResolvedValue({ id: 1, gestanteId: 100, tipo: "fator_rh_negativo", ativo: 1 });

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.fatoresRisco.syncRhRiskFactor({
        gestanteId: 100,
        tipoSanguineo: tipo,
      });

      expect(result.action).toBe("added");
      vi.clearAllMocks();
    }
  });

  it("handles all Rh positive blood types correctly", async () => {
    const rhPositiveTypes = ["A+", "B+", "AB+", "O+"];
    
    for (const tipo of rhPositiveTypes) {
      mockGetFatores.mockResolvedValue([]);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.fatoresRisco.syncRhRiskFactor({
        gestanteId: 100,
        tipoSanguineo: tipo,
      });

      expect(result.action).toBe("none");
      vi.clearAllMocks();
    }
  });

  it("only removes the Rh factor, not other risk factors", async () => {
    mockGetFatores.mockResolvedValue([
      { id: 10, gestanteId: 100, tipo: "hipertensao", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 42, gestanteId: 100, tipo: "fator_rh_negativo", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 15, gestanteId: 100, tipo: "idade_avancada", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockDeleteFator.mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.fatoresRisco.syncRhRiskFactor({
      gestanteId: 100,
      tipoSanguineo: "AB+",
    });

    expect(result.action).toBe("removed");
    // Should only delete the Rh factor (id 42), not the others
    expect(mockDeleteFator).toHaveBeenCalledWith(42);
    expect(mockDeleteFator).toHaveBeenCalledTimes(1);
  });
});
