import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { integrationCallbackRouter } from "./integrationCallback";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getGestanteById: vi.fn(),
  updateGestante: vi.fn(),
}));

// Mock the cesareanSync module
vi.mock("./cesareanSync", () => ({
  sincronizarCesareaComAdmin: vi.fn(),
  mapearHospital: vi.fn((h: string) => {
    if (h === "hospital_sao_sebastiao") return "Hospital São Sebastião";
    return "Hospital Unimed";
  }),
}));

import { getDb, getGestanteById, updateGestante } from "./db";
import { sincronizarCesareaComAdmin } from "./cesareanSync";

const mockGetGestanteById = getGestanteById as ReturnType<typeof vi.fn>;
const mockUpdateGestante = updateGestante as ReturnType<typeof vi.fn>;
const mockSincronizar = sincronizarCesareaComAdmin as ReturnType<typeof vi.fn>;
const mockGetDb = getDb as ReturnType<typeof vi.fn>;

// Create test Express app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/integration/callback", integrationCallbackRouter);
  return app;
}

describe("integrationCallback", () => {
  const originalEnv = { ...process.env };
  const TEST_API_KEY = "test-gestantes-api-key-12345";
  let app: express.Express;

  beforeEach(() => {
    process.env.GESTANTES_INTEGRATION_API_KEY = TEST_API_KEY;
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.GESTANTES_INTEGRATION_API_KEY = originalEnv.GESTANTES_INTEGRATION_API_KEY;
  });

  describe("GET /health", () => {
    it("returns health status without authentication", async () => {
      const res = await request(app)
        .get("/api/integration/callback/health")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.service).toBe("APP Gestantes - Integration Callback");
      expect(res.body.configured).toBe(true);
      expect(res.body.timestamp).toBeDefined();
    });

    it("reports unconfigured when API key is missing", async () => {
      process.env.GESTANTES_INTEGRATION_API_KEY = "";

      const res = await request(app)
        .get("/api/integration/callback/health")
        .expect(200);

      expect(res.body.configured).toBe(false);
    });
  });

  describe("POST /reagendamento - Authentication", () => {
    it("rejects request without API key", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .send({ externalId: "gestante-1", novaDataCirurgia: "2026-04-15" })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("API Key");
    });

    it("rejects request with wrong API key", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", "wrong-key")
        .send({ externalId: "gestante-1", novaDataCirurgia: "2026-04-15" })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it("returns 500 when GESTANTES_INTEGRATION_API_KEY is not configured", async () => {
      delete process.env.GESTANTES_INTEGRATION_API_KEY;

      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "gestante-1", novaDataCirurgia: "2026-04-15" })
        .expect(500);

      expect(res.body.error).toContain("Configuração do servidor");
    });
  });

  describe("POST /reagendamento - Validation", () => {
    it("rejects missing externalId", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ novaDataCirurgia: "2026-04-15" })
        .expect(400);

      expect(res.body.error).toContain("externalId");
    });

    it("rejects missing novaDataCirurgia", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "gestante-1" })
        .expect(400);

      expect(res.body.error).toContain("novaDataCirurgia");
    });

    it("rejects invalid date format", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "gestante-1", novaDataCirurgia: "15/04/2026" })
        .expect(400);

      expect(res.body.error).toContain("Formato de data");
    });

    it("rejects invalid externalId format", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "paciente-1", novaDataCirurgia: "2026-04-15" })
        .expect(400);

      expect(res.body.error).toContain("externalId inválido");
    });

    it("rejects externalId without numeric ID", async () => {
      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "gestante-abc", novaDataCirurgia: "2026-04-15" })
        .expect(400);

      expect(res.body.error).toContain("externalId inválido");
    });
  });

  describe("POST /reagendamento - Business Logic", () => {
    it("returns 404 when gestante is not found", async () => {
      mockGetGestanteById.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "gestante-999", novaDataCirurgia: "2026-04-15" })
        .expect(404);

      expect(res.body.error).toContain("não encontrada");
    });

    it("rejects when gestante does not have cesarean scheduled", async () => {
      mockGetGestanteById.mockResolvedValueOnce({
        id: 100,
        nome: "Maria Silva",
        tipoPartoDesejado: "normal",
        dataPartoProgramado: null,
      });

      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({ externalId: "gestante-100", novaDataCirurgia: "2026-04-15" })
        .expect(400);

      expect(res.body.error).toContain("não tem cesárea programada");
    });

    it("successfully reschedules cesarean and re-syncs", async () => {
      mockGetGestanteById.mockResolvedValueOnce({
        id: 300005,
        nome: "Josiane Alves Batista",
        tipoPartoDesejado: "cesariana",
        dataPartoProgramado: "2025-12-18",
        planoSaudeId: null,
        hospitalParto: "hospital_unimed",
      });
      mockUpdateGestante.mockResolvedValueOnce(undefined);
      mockGetDb.mockResolvedValueOnce(null); // No DB for plano lookup
      mockSincronizar.mockResolvedValueOnce({ success: true, atualizado: true });

      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({
          externalId: "gestante-300005",
          novaDataCirurgia: "2026-04-15",
          motivo: "Reagendamento pelo centro cirúrgico",
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.gestanteId).toBe(300005);
      expect(res.body.nomeGestante).toBe("Josiane Alves Batista");
      expect(res.body.dataAnterior).toBe("2025-12-18");
      expect(res.body.novaData).toBe("2026-04-15");
      expect(res.body.sincronizado).toBe(true);

      // Verify updateGestante was called with new date
      expect(mockUpdateGestante).toHaveBeenCalledWith(300005, {
        dataPartoProgramado: "2026-04-15",
      });

      // Verify re-sync was called
      expect(mockSincronizar).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 300005,
          nomeCompleto: "Josiane Alves Batista",
          dataCesarea: "2026-04-15",
          hospital: "Hospital Unimed",
          observacoes: "Reagendamento via Mapa Cirúrgico: Reagendamento pelo centro cirúrgico",
        })
      );
    });

    it("handles re-sync failure gracefully (still returns success)", async () => {
      mockGetGestanteById.mockResolvedValueOnce({
        id: 100,
        nome: "Ana Santos",
        tipoPartoDesejado: "cesariana",
        dataPartoProgramado: "2026-03-10",
        planoSaudeId: null,
        hospitalParto: "hospital_sao_sebastiao",
      });
      mockUpdateGestante.mockResolvedValueOnce(undefined);
      mockGetDb.mockResolvedValueOnce(null);
      mockSincronizar.mockResolvedValueOnce({ success: false, error: "Network error" });

      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({
          externalId: "gestante-100",
          novaDataCirurgia: "2026-05-20",
        })
        .expect(200);

      // The date update succeeded even if re-sync failed
      expect(res.body.success).toBe(true);
      expect(res.body.sincronizado).toBe(false);
    });

    it("includes motivo in observacoes when provided", async () => {
      mockGetGestanteById.mockResolvedValueOnce({
        id: 200,
        nome: "Julia Costa",
        tipoPartoDesejado: "cesariana",
        dataPartoProgramado: "2026-02-28",
        planoSaudeId: null,
        hospitalParto: "hospital_unimed",
      });
      mockUpdateGestante.mockResolvedValueOnce(undefined);
      mockGetDb.mockResolvedValueOnce(null);
      mockSincronizar.mockResolvedValueOnce({ success: true });

      await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({
          externalId: "gestante-200",
          novaDataCirurgia: "2026-03-15",
          motivo: "Conflito de agenda no centro cirúrgico",
        })
        .expect(200);

      expect(mockSincronizar).toHaveBeenCalledWith(
        expect.objectContaining({
          observacoes: "Reagendamento via Mapa Cirúrgico: Conflito de agenda no centro cirúrgico",
        })
      );
    });

    it("uses default observacoes when motivo is not provided", async () => {
      mockGetGestanteById.mockResolvedValueOnce({
        id: 200,
        nome: "Julia Costa",
        tipoPartoDesejado: "cesariana",
        dataPartoProgramado: "2026-02-28",
        planoSaudeId: null,
        hospitalParto: "hospital_unimed",
      });
      mockUpdateGestante.mockResolvedValueOnce(undefined);
      mockGetDb.mockResolvedValueOnce(null);
      mockSincronizar.mockResolvedValueOnce({ success: true });

      await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({
          externalId: "gestante-200",
          novaDataCirurgia: "2026-03-15",
        })
        .expect(200);

      expect(mockSincronizar).toHaveBeenCalledWith(
        expect.objectContaining({
          observacoes: "Reagendamento confirmado via callback",
        })
      );
    });

    it("shows 'Não definida' when previous date was null", async () => {
      mockGetGestanteById.mockResolvedValueOnce({
        id: 300,
        nome: "Carla Lima",
        tipoPartoDesejado: "cesariana",
        dataPartoProgramado: null,
        planoSaudeId: null,
        hospitalParto: "hospital_unimed",
      });
      mockUpdateGestante.mockResolvedValueOnce(undefined);
      mockGetDb.mockResolvedValueOnce(null);
      mockSincronizar.mockResolvedValueOnce({ success: true });

      const res = await request(app)
        .post("/api/integration/callback/reagendamento")
        .set("X-API-Key", TEST_API_KEY)
        .send({
          externalId: "gestante-300",
          novaDataCirurgia: "2026-06-01",
        })
        .expect(200);

      expect(res.body.dataAnterior).toBe("Não definida");
    });
  });
});
