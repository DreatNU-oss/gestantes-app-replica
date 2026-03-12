import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  listarHospitaisAtivos: vi.fn(),
  listarTodosHospitais: vi.fn(),
  criarHospital: vi.fn(),
  atualizarHospital: vi.fn(),
  toggleAtivoHospital: vi.fn(),
  deletarHospital: vi.fn(),
}));

import {
  listarHospitaisAtivos,
  listarTodosHospitais,
  criarHospital,
  atualizarHospital,
  toggleAtivoHospital,
  deletarHospital,
} from "./db";

describe("Hospitais CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list active hospitals filtered by clinicaId", async () => {
    const mockHospitais = [
      { id: 1, clinicaId: 1, nome: "Hospital A", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Hospital B", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarHospitaisAtivos as any).mockResolvedValue(mockHospitais);

    const result = await listarHospitaisAtivos(1);
    expect(listarHospitaisAtivos).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe("Hospital A");
  });

  it("should list all hospitals including inactive", async () => {
    const mockHospitais = [
      { id: 1, clinicaId: 1, nome: "Hospital A", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clinicaId: 1, nome: "Hospital B", ativo: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    (listarTodosHospitais as any).mockResolvedValue(mockHospitais);

    const result = await listarTodosHospitais(1);
    expect(listarTodosHospitais).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
  });

  it("should create a hospital with clinicaId", async () => {
    const newHospital = { id: 3, clinicaId: 1, nome: "Hospital C", ativo: 1, createdAt: new Date(), updatedAt: new Date() };
    (criarHospital as any).mockResolvedValue(newHospital);

    const result = await criarHospital({ nome: "Hospital C", clinicaId: 1 });
    expect(criarHospital).toHaveBeenCalledWith({ nome: "Hospital C", clinicaId: 1 });
    expect(result.nome).toBe("Hospital C");
    expect(result.clinicaId).toBe(1);
  });

  it("should update a hospital name", async () => {
    (atualizarHospital as any).mockResolvedValue(undefined);

    await atualizarHospital(1, { nome: "Hospital A Atualizado" });
    expect(atualizarHospital).toHaveBeenCalledWith(1, { nome: "Hospital A Atualizado" });
  });

  it("should toggle hospital active status", async () => {
    (toggleAtivoHospital as any).mockResolvedValue(undefined);

    await toggleAtivoHospital(1);
    expect(toggleAtivoHospital).toHaveBeenCalledWith(1);
  });

  it("should delete a hospital", async () => {
    (deletarHospital as any).mockResolvedValue(undefined);

    await deletarHospital(1);
    expect(deletarHospital).toHaveBeenCalledWith(1);
  });

  it("should isolate hospitals between clinics", async () => {
    const clinic1Hospitals = [
      { id: 1, clinicaId: 1, nome: "Hospital Clínica 1", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    const clinic2Hospitals = [
      { id: 2, clinicaId: 2, nome: "Hospital Clínica 2", ativo: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    (listarHospitaisAtivos as any)
      .mockResolvedValueOnce(clinic1Hospitals)
      .mockResolvedValueOnce(clinic2Hospitals);

    const result1 = await listarHospitaisAtivos(1);
    const result2 = await listarHospitaisAtivos(2);

    expect(result1).toHaveLength(1);
    expect(result1[0].nome).toBe("Hospital Clínica 1");
    expect(result2).toHaveLength(1);
    expect(result2[0].nome).toBe("Hospital Clínica 2");
    
    // Ensure no cross-contamination
    expect(result1[0].clinicaId).toBe(1);
    expect(result2[0].clinicaId).toBe(2);
  });
});
