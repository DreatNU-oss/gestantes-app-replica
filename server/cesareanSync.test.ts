import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { sincronizarCesareaComAdmin, sincronizarTodasCesareasComAdmin } from "./cesareanSync";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("cesareanSync", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ADMIN_SYSTEM_URL = "https://admin.example.com";
    process.env.ADMIN_INTEGRATION_API_KEY = "test-api-key-123";
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env.ADMIN_SYSTEM_URL = originalEnv.ADMIN_SYSTEM_URL;
    process.env.ADMIN_INTEGRATION_API_KEY = originalEnv.ADMIN_INTEGRATION_API_KEY;
  });

  describe("sincronizarCesareaComAdmin", () => {
    it("returns error when config is missing", async () => {
      process.env.ADMIN_SYSTEM_URL = "";
      process.env.ADMIN_INTEGRATION_API_KEY = "";

      const result = await sincronizarCesareaComAdmin({
        id: 1,
        nomeCompleto: "Maria Silva",
        dataCesarea: "2026-04-15",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Configuração ausente");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("creates a new cesarean appointment via POST", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          atualizado: false,
          cirurgiaId: 45,
          message: "Cesárea agendada com sucesso no Mapa Cirúrgico",
        }),
      });

      const result = await sincronizarCesareaComAdmin({
        id: 123,
        nomeCompleto: "Maria Silva Santos",
        dataCesarea: "2026-04-15",
        hospital: "Hospital Unimed",
        convenio: "Unimed",
      });

      expect(result.success).toBe(true);
      expect(result.atualizado).toBe(false);
      expect(result.cirurgiaId).toBe(45);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://admin.example.com/api/integration/cesarea",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test-api-key-123",
          },
          body: JSON.stringify({
            pacienteNome: "Maria Silva Santos",
            dataCirurgia: "2026-04-15",
            hospital: "Hospital Unimed",
            convenio: "Unimed",
            procedimento: "Cesárea",
            observacoes: "Agendamento via APP Gestantes",
            externalId: "gestante-123",
          }),
        })
      );
    });

    it("updates an existing cesarean appointment", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          atualizado: true,
          cirurgiaId: 45,
          message: "Agendamento atualizado com sucesso",
        }),
      });

      const result = await sincronizarCesareaComAdmin({
        id: 123,
        nomeCompleto: "Maria Silva Santos",
        dataCesarea: "2026-05-20",
      });

      expect(result.success).toBe(true);
      expect(result.atualizado).toBe(true);
    });

    it("deletes appointment when dataCesarea is null", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          message: "Agendamento removido com sucesso",
        }),
      });

      const result = await sincronizarCesareaComAdmin({
        id: 123,
        nomeCompleto: "Maria Silva Santos",
        dataCesarea: null,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://admin.example.com/api/integration/cesarea/gestante-123",
        expect.objectContaining({
          method: "DELETE",
          headers: { "X-API-Key": "test-api-key-123" },
        })
      );
    });

    it("handles API error response gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: "Internal server error",
        }),
      });

      const result = await sincronizarCesareaComAdmin({
        id: 123,
        nomeCompleto: "Maria Silva Santos",
        dataCesarea: "2026-04-15",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Internal server error");
    });

    it("handles network error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await sincronizarCesareaComAdmin({
        id: 123,
        nomeCompleto: "Maria Silva Santos",
        dataCesarea: "2026-04-15",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("sincronizarTodasCesareasComAdmin", () => {
    it("returns empty result when config is missing", async () => {
      process.env.ADMIN_SYSTEM_URL = "";
      process.env.ADMIN_INTEGRATION_API_KEY = "";

      const result = await sincronizarTodasCesareasComAdmin([]);

      expect(result).toEqual({ sucesso: 0, falhas: 0, total: 0, detalhes: [] });
    });

    it("syncs multiple gestantes in batch", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: async () => ({ success: true, atualizado: false, cirurgiaId: 1 }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, atualizado: true, cirurgiaId: 2 }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: false, error: "Erro interno" }),
        });

      const gestantes = [
        { id: 1, nome: "Maria", dataPartoProgramado: "2026-04-15" },
        { id: 2, nome: "Ana", dataPartoProgramado: "2026-04-20" },
        { id: 3, nome: "Julia", dataPartoProgramado: "2026-04-25" },
      ];

      const progressCalls: Array<{ current: number; total: number; nome: string }> = [];
      const result = await sincronizarTodasCesareasComAdmin(
        gestantes,
        (current, total, nome) => progressCalls.push({ current, total, nome })
      );

      expect(result.sucesso).toBe(2);
      expect(result.falhas).toBe(1);
      expect(result.total).toBe(3);
      expect(result.detalhes).toHaveLength(3);
      expect(result.detalhes[0]).toEqual({ nome: "Maria", status: "sucesso", mensagem: "Criado" });
      expect(result.detalhes[1]).toEqual({ nome: "Ana", status: "sucesso", mensagem: "Atualizado" });
      expect(result.detalhes[2]).toEqual({ nome: "Julia", status: "falha", mensagem: "Erro interno" });

      expect(progressCalls).toHaveLength(3);
      expect(progressCalls[0]).toEqual({ current: 1, total: 3, nome: "Maria" });
    });

    it("maps plano de saude to convenio correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, atualizado: false }),
      });

      await sincronizarTodasCesareasComAdmin([
        { id: 1, nome: "Maria", dataPartoProgramado: "2026-04-15", planoSaudeNome: "Unimed Nacional" },
      ]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.convenio).toBe("Unimed");
    });
  });
});
