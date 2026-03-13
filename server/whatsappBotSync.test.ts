import { describe, it, expect } from "vitest";
import { formatPhoneForBot } from "./whatsappBotSync";

// ─── Test: formatPhoneForBot ────────────────────────────────────────────────

describe("WhatsApp Bot Sync - formatPhoneForBot", () => {
  it("deve formatar telefone com parênteses e traço", () => {
    expect(formatPhoneForBot("(35) 99115-6028")).toBe("5535991156028");
  });

  it("deve formatar telefone que já tem 55", () => {
    expect(formatPhoneForBot("5535991156028")).toBe("5535991156028");
  });

  it("deve formatar telefone com +55", () => {
    expect(formatPhoneForBot("+5535991156028")).toBe("5535991156028");
  });

  it("deve formatar telefone sem código do país", () => {
    expect(formatPhoneForBot("35991156028")).toBe("5535991156028");
  });

  it("deve remover zero inicial", () => {
    expect(formatPhoneForBot("035991156028")).toBe("5535991156028");
  });

  it("deve formatar telefone com espaços", () => {
    expect(formatPhoneForBot("55 35 99115 6028")).toBe("5535991156028");
  });
});

// ─── Test: Bot API connectivity (validates WHATSAPP_BOT_API_KEY) ────────────

describe("WhatsApp Bot Sync - API connectivity", () => {
  it("deve conseguir acessar a API do bot com a chave configurada", async () => {
    // Normaliza URL removendo www para evitar redirect 301 que remove header Authorization
    const apiUrl = (process.env.WHATSAPP_BOT_API_URL || "").replace("://www.", "://");
    const apiKey = process.env.WHATSAPP_BOT_API_KEY;

    // Se não configurado, pular teste
    if (!apiUrl || !apiKey) {
      console.log("Bot API não configurada, pulando teste de conectividade");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${apiUrl}?limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      expect(response.ok).toBe(true);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.log("API timeout - bot pode estar offline, pulando");
        return;
      }
      throw error;
    }
  }, 15000);
});

// ─── Test: syncPatientToBot logic ───────────────────────────────────────────

describe("WhatsApp Bot Sync - syncPatientToBot", () => {
  it("deve retornar erro quando não há telefone", async () => {
    const { syncPatientToBot } = await import("./whatsappBotSync");
    const result = await syncPatientToBot("", "Maria", "123");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Sem telefone");
  });
});

// ─── Test: removePatientFromBot logic ───────────────────────────────────────

describe("WhatsApp Bot Sync - removePatientFromBot", () => {
  it("deve retornar erro quando não há telefone", async () => {
    const { removePatientFromBot } = await import("./whatsappBotSync");
    const result = await removePatientFromBot("");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Sem telefone");
  });
});

// ─── Test: updatePatientOnBot logic ─────────────────────────────────────────

describe("WhatsApp Bot Sync - updatePatientOnBot", () => {
  it("deve retornar erro quando não há telefone", async () => {
    const { updatePatientOnBot } = await import("./whatsappBotSync");
    const result = await updatePatientOnBot("", { name: "Maria" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Sem telefone");
  });
});

// ─── Test: syncAllPatientsToBot logic ───────────────────────────────────────

describe("WhatsApp Bot Sync - syncAllPatientsToBot", () => {
  it("deve retornar sucesso com 0 quando lista vazia", async () => {
    const { syncAllPatientsToBot } = await import("./whatsappBotSync");
    const result = await syncAllPatientsToBot([]);
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("deve filtrar pacientes sem telefone", async () => {
    const { syncAllPatientsToBot } = await import("./whatsappBotSync");
    const result = await syncAllPatientsToBot([
      { phone: "", name: "Maria", externalId: "1" },
      { phone: "", name: "Ana", externalId: "2" },
    ]);
    expect(result.synced).toBe(0);
  });
});
