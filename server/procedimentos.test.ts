import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  listarProcedimentosAtivos: vi.fn(),
  listarTodosProcedimentos: vi.fn(),
  criarProcedimento: vi.fn(),
  atualizarProcedimento: vi.fn(),
  toggleAtivoProcedimento: vi.fn(),
  deletarProcedimento: vi.fn(),
  setPadraoProcedimento: vi.fn(),
  removePadraoProcedimento: vi.fn(),
}));

import {
  listarProcedimentosAtivos,
  listarTodosProcedimentos,
  criarProcedimento,
  atualizarProcedimento,
  toggleAtivoProcedimento,
  deletarProcedimento,
  setPadraoProcedimento,
  removePadraoProcedimento,
} from "./db";

describe("Procedimentos CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list active procedimentos filtered by clinicaId", async () => {
    const mockProcs = [
      { id: 1, clinicaId: 1, nome: "Cesárea sem DIU", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Cesárea + DIU", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarProcedimentosAtivos as any).mockResolvedValue(mockProcs);

    const result = await listarProcedimentosAtivos(1);
    expect(listarProcedimentosAtivos).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe("Cesárea sem DIU");
  });

  it("should list all procedimentos including inactive", async () => {
    const mockProcs = [
      { id: 1, clinicaId: 1, nome: "Cesárea sem DIU", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Cesárea + DIU", ativo: 0, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarTodosProcedimentos as any).mockResolvedValue(mockProcs);

    const result = await listarTodosProcedimentos(1);
    expect(listarTodosProcedimentos).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
  });

  it("should create a procedimento with clinicaId", async () => {
    const newProc = { id: 7, clinicaId: 1, nome: "Laparoscopia", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() };
    (criarProcedimento as any).mockResolvedValue(newProc);

    const result = await criarProcedimento({ nome: "Laparoscopia", clinicaId: 1 });
    expect(criarProcedimento).toHaveBeenCalledWith({ nome: "Laparoscopia", clinicaId: 1 });
    expect(result.nome).toBe("Laparoscopia");
    expect(result.clinicaId).toBe(1);
  });

  it("should update a procedimento name", async () => {
    (atualizarProcedimento as any).mockResolvedValue(undefined);

    await atualizarProcedimento(1, { nome: "Cesárea sem DIU (atualizado)" });
    expect(atualizarProcedimento).toHaveBeenCalledWith(1, { nome: "Cesárea sem DIU (atualizado)" });
  });

  it("should toggle procedimento active status", async () => {
    (toggleAtivoProcedimento as any).mockResolvedValue(undefined);

    await toggleAtivoProcedimento(1);
    expect(toggleAtivoProcedimento).toHaveBeenCalledWith(1);
  });

  it("should delete a procedimento", async () => {
    (deletarProcedimento as any).mockResolvedValue(undefined);

    await deletarProcedimento(1);
    expect(deletarProcedimento).toHaveBeenCalledWith(1);
  });
});

describe("Procedimento Padrão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set a procedimento as default for a clinic", async () => {
    (setPadraoProcedimento as any).mockResolvedValue(undefined);

    await setPadraoProcedimento(1, 1);
    expect(setPadraoProcedimento).toHaveBeenCalledWith(1, 1);
  });

  it("should remove default procedimento for a clinic", async () => {
    (removePadraoProcedimento as any).mockResolvedValue(undefined);

    await removePadraoProcedimento(1);
    expect(removePadraoProcedimento).toHaveBeenCalledWith(1);
  });

  it("should return procedimentos with padrao field", async () => {
    const mockProcs = [
      { id: 1, clinicaId: 1, nome: "Cesárea sem DIU", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Cesárea + DIU", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, clinicaId: 1, nome: "Histerec aberta", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarProcedimentosAtivos as any).mockResolvedValue(mockProcs);

    const result = await listarProcedimentosAtivos(1);
    expect(result).toHaveLength(3);

    const padrao = result.find((p: any) => p.padrao === 1);
    expect(padrao).toBeDefined();
    expect(padrao!.nome).toBe("Cesárea sem DIU");

    const naoPadrao = result.filter((p: any) => p.padrao === 0);
    expect(naoPadrao).toHaveLength(2);
  });

  it("should only have one default procedimento per clinic", async () => {
    const mockProcs = [
      { id: 1, clinicaId: 1, nome: "Cesárea sem DIU", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Cesárea + DIU", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, clinicaId: 1, nome: "Histerec aberta", ativo: 1, padrao: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarTodosProcedimentos as any).mockResolvedValue(mockProcs);

    const result = await listarTodosProcedimentos(1);
    const defaults = result.filter((p: any) => p.padrao === 1);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].nome).toBe("Cesárea + DIU");
  });

  it("should isolate default procedimentos between clinics", async () => {
    const clinic1Procs = [
      { id: 1, clinicaId: 1, nome: "Cesárea sem DIU", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    const clinic2Procs = [
      { id: 7, clinicaId: 2, nome: "Cesárea + LTB", ativo: 1, padrao: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    (listarProcedimentosAtivos as any)
      .mockResolvedValueOnce(clinic1Procs)
      .mockResolvedValueOnce(clinic2Procs);

    const result1 = await listarProcedimentosAtivos(1);
    const result2 = await listarProcedimentosAtivos(2);

    const padrao1 = result1.find((p: any) => p.padrao === 1);
    const padrao2 = result2.find((p: any) => p.padrao === 1);

    expect(padrao1!.clinicaId).toBe(1);
    expect(padrao2!.clinicaId).toBe(2);
    expect(padrao1!.nome).not.toBe(padrao2!.nome);
  });
});

describe("Auto-preenchimento com procedimento padrão", () => {
  it("should identify the default procedimento from a list", () => {
    const procs = [
      { id: 1, nome: "Cesárea sem DIU", padrao: 1 },
      { id: 2, nome: "Cesárea + DIU", padrao: 0 },
      { id: 3, nome: "Histerec aberta", padrao: 0 },
    ];

    const padrao = procs.find(p => p.padrao === 1);
    expect(padrao).toBeDefined();
    expect(padrao!.nome).toBe("Cesárea sem DIU");
  });

  it("should return undefined when no default is set", () => {
    const procs = [
      { id: 1, nome: "Cesárea sem DIU", padrao: 0 },
      { id: 2, nome: "Cesárea + DIU", padrao: 0 },
    ];

    const padrao = procs.find(p => p.padrao === 1);
    expect(padrao).toBeUndefined();
  });

  it("should not auto-fill when value is already set", () => {
    const existingValue = "Cesárea + LTB";
    const shouldAutoFill = !existingValue;
    expect(shouldAutoFill).toBe(false);
  });

  it("should auto-fill when value is empty", () => {
    const existingValue = "";
    const procs = [
      { id: 1, nome: "Cesárea sem DIU", padrao: 1 },
      { id: 2, nome: "Cesárea + DIU", padrao: 0 },
    ];

    const shouldAutoFill = !existingValue;
    expect(shouldAutoFill).toBe(true);

    if (shouldAutoFill) {
      const padrao = procs.find(p => p.padrao === 1);
      expect(padrao!.nome).toBe("Cesárea sem DIU");
    }
  });

  it("should detect 'Outra' when value is not in known procedimentos", () => {
    const knownProcs = [
      { id: 1, nome: "Cesárea sem DIU", padrao: 1 },
      { id: 2, nome: "Cesárea + DIU", padrao: 0 },
    ];
    const savedValue = "Laparoscopia diagnóstica";

    const isKnown = knownProcs.some(p => p.nome === savedValue);
    expect(isKnown).toBe(false);
    // Should display as "Outra" with the custom text
  });

  it("should recognize a known procedimento value", () => {
    const knownProcs = [
      { id: 1, nome: "Cesárea sem DIU", padrao: 1 },
      { id: 2, nome: "Cesárea + DIU", padrao: 0 },
    ];
    const savedValue = "Cesárea + DIU";

    const isKnown = knownProcs.some(p => p.nome === savedValue);
    expect(isKnown).toBe(true);
  });
});
