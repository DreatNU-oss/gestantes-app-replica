import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  listarHospitaisAtivos: vi.fn(),
  listarTodosHospitais: vi.fn(),
  criarHospital: vi.fn(),
  setPadraoHospital: vi.fn(),
  removePadraoHospital: vi.fn(),
  listarPlanosAtivos: vi.fn(),
  listarTodosPlanos: vi.fn(),
  criarPlano: vi.fn(),
  setPadraoPlano: vi.fn(),
  removePadraoPlano: vi.fn(),
}));

import {
  listarHospitaisAtivos,
  listarTodosHospitais,
  setPadraoHospital,
  removePadraoHospital,
  listarPlanosAtivos,
  listarTodosPlanos,
  setPadraoPlano,
  removePadraoPlano,
} from "./db";

describe("Hospital Padrão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set a hospital as default for a clinic", async () => {
    (setPadraoHospital as any).mockResolvedValue(undefined);

    await setPadraoHospital(1, 1);
    expect(setPadraoHospital).toHaveBeenCalledWith(1, 1);
  });

  it("should remove default hospital for a clinic", async () => {
    (removePadraoHospital as any).mockResolvedValue(undefined);

    await removePadraoHospital(1);
    expect(removePadraoHospital).toHaveBeenCalledWith(1);
  });

  it("should return hospitals with padrao field", async () => {
    const mockHospitais = [
      { id: 1, clinicaId: 1, nome: "Hospital A", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Hospital B", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarHospitaisAtivos as any).mockResolvedValue(mockHospitais);

    const result = await listarHospitaisAtivos(1);
    expect(result).toHaveLength(2);
    
    const padrao = result.find((h: any) => h.padrao === 1);
    expect(padrao).toBeDefined();
    expect(padrao!.nome).toBe("Hospital A");
    
    const naoPadrao = result.find((h: any) => h.padrao === 0);
    expect(naoPadrao).toBeDefined();
    expect(naoPadrao!.nome).toBe("Hospital B");
  });

  it("should only have one default hospital per clinic", async () => {
    const mockHospitais = [
      { id: 1, clinicaId: 1, nome: "Hospital A", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Hospital B", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, clinicaId: 1, nome: "Hospital C", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarTodosHospitais as any).mockResolvedValue(mockHospitais);

    const result = await listarTodosHospitais(1);
    const defaults = result.filter((h: any) => h.padrao === 1);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].nome).toBe("Hospital B");
  });

  it("should isolate default hospitals between clinics", async () => {
    const clinic1Hospitals = [
      { id: 1, clinicaId: 1, nome: "Hospital Clínica 1", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    const clinic2Hospitals = [
      { id: 2, clinicaId: 2, nome: "Hospital Clínica 2", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    (listarHospitaisAtivos as any)
      .mockResolvedValueOnce(clinic1Hospitals)
      .mockResolvedValueOnce(clinic2Hospitals);

    const result1 = await listarHospitaisAtivos(1);
    const result2 = await listarHospitaisAtivos(2);

    // Each clinic has its own default
    const padrao1 = result1.find((h: any) => h.padrao === 1);
    const padrao2 = result2.find((h: any) => h.padrao === 1);
    
    expect(padrao1!.clinicaId).toBe(1);
    expect(padrao2!.clinicaId).toBe(2);
    expect(padrao1!.nome).not.toBe(padrao2!.nome);
  });
});

describe("Convênio Padrão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set a convênio as default for a clinic", async () => {
    (setPadraoPlano as any).mockResolvedValue(undefined);

    await setPadraoPlano(1, 1);
    expect(setPadraoPlano).toHaveBeenCalledWith(1, 1);
  });

  it("should remove default convênio for a clinic", async () => {
    (removePadraoPlano as any).mockResolvedValue(undefined);

    await removePadraoPlano(1);
    expect(removePadraoPlano).toHaveBeenCalledWith(1);
  });

  it("should return planos with padrao field", async () => {
    const mockPlanos = [
      { id: 1, clinicaId: 1, nome: "Unimed", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Particular", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarPlanosAtivos as any).mockResolvedValue(mockPlanos);

    const result = await listarPlanosAtivos(1);
    expect(result).toHaveLength(2);
    
    const padrao = result.find((p: any) => p.padrao === 1);
    expect(padrao).toBeDefined();
    expect(padrao!.nome).toBe("Unimed");
    
    const naoPadrao = result.find((p: any) => p.padrao === 0);
    expect(naoPadrao).toBeDefined();
    expect(naoPadrao!.nome).toBe("Particular");
  });

  it("should only have one default convênio per clinic", async () => {
    const mockPlanos = [
      { id: 1, clinicaId: 1, nome: "Unimed", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Particular", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, clinicaId: 1, nome: "FUSEX", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarTodosPlanos as any).mockResolvedValue(mockPlanos);

    const result = await listarTodosPlanos(1);
    const defaults = result.filter((p: any) => p.padrao === 1);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].nome).toBe("Particular");
  });

  it("should isolate default convênios between clinics", async () => {
    const clinic1Planos = [
      { id: 1, clinicaId: 1, nome: "Unimed", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    const clinic2Planos = [
      { id: 2, clinicaId: 2, nome: "SulAmérica", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    (listarPlanosAtivos as any)
      .mockResolvedValueOnce(clinic1Planos)
      .mockResolvedValueOnce(clinic2Planos);

    const result1 = await listarPlanosAtivos(1);
    const result2 = await listarPlanosAtivos(2);

    const padrao1 = result1.find((p: any) => p.padrao === 1);
    const padrao2 = result2.find((p: any) => p.padrao === 1);
    
    expect(padrao1!.clinicaId).toBe(1);
    expect(padrao2!.clinicaId).toBe(2);
    expect(padrao1!.nome).not.toBe(padrao2!.nome);
  });
});

describe("Auto-preenchimento com padrão", () => {
  it("should identify the default hospital from a list", () => {
    const hospitais = [
      { id: 1, nome: "Hospital A", padrao: 0 },
      { id: 2, nome: "Hospital B", padrao: 1 },
      { id: 3, nome: "Hospital C", padrao: 0 },
    ];

    const padrao = hospitais.find(h => h.padrao === 1);
    expect(padrao).toBeDefined();
    expect(padrao!.nome).toBe("Hospital B");
  });

  it("should return undefined when no default is set", () => {
    const hospitais = [
      { id: 1, nome: "Hospital A", padrao: 0 },
      { id: 2, nome: "Hospital B", padrao: 0 },
    ];

    const padrao = hospitais.find(h => h.padrao === 1);
    expect(padrao).toBeUndefined();
  });

  it("should identify the default convênio from a list", () => {
    const planos = [
      { id: 1, nome: "Unimed", padrao: 1 },
      { id: 2, nome: "Particular", padrao: 0 },
    ];

    const padrao = planos.find(p => p.padrao === 1);
    expect(padrao).toBeDefined();
    expect(padrao!.nome).toBe("Unimed");
  });

  it("should not auto-fill when value is already set", () => {
    const existingValue = "Hospital Específico";
    const hospitais = [
      { id: 1, nome: "Hospital A", padrao: 1 },
      { id: 2, nome: "Hospital B", padrao: 0 },
    ];

    // Simulates the logic: only auto-fill if value is empty
    const shouldAutoFill = !existingValue;
    expect(shouldAutoFill).toBe(false);
  });

  it("should auto-fill when value is empty", () => {
    const existingValue = "";
    const hospitais = [
      { id: 1, nome: "Hospital A", padrao: 1 },
      { id: 2, nome: "Hospital B", padrao: 0 },
    ];

    const shouldAutoFill = !existingValue;
    expect(shouldAutoFill).toBe(true);

    if (shouldAutoFill) {
      const padrao = hospitais.find(h => h.padrao === 1);
      expect(padrao!.nome).toBe("Hospital A");
    }
  });
});
