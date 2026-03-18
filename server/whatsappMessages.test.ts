import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("WhatsApp Messages - CartaoPrenatal", () => {
  const code = readFileSync(
    resolve(__dirname, "../client/src/pages/CartaoPrenatal.tsx"),
    "utf-8"
  );

  describe("Heart icons removed", () => {
    it("should not contain 💜 emoji in message texts", () => {
      // Check that no purple heart emoji exists in message strings
      expect(code).not.toContain("💜");
    });

    it("should not contain 🤰 emoji in message texts", () => {
      // Check that pregnant woman emoji was replaced
      expect(code).not.toContain("🤰");
    });
  });

  describe("First person singular (not plural)", () => {
    it("should use 'converse comigo' instead of 'converse com seu médico'", () => {
      // The orientação alimentar message
      expect(code).toContain("converse comigo");
      expect(code).not.toContain("converse com seu médico");
    });

    it("should use 'Um abraço!' instead of 'Abraços da equipe Mais Mulher!'", () => {
      expect(code).not.toContain("Abraços da equipe Mais Mulher!");
      expect(code).toContain("Um abraço!");
    });
  });

  describe("Welcome message before orientação alimentar", () => {
    it("should send welcome message before PDF", () => {
      expect(code).toContain("Seja bem-vinda ao nosso pré-natal");
      expect(code).toContain("Agradeço por ter nos escolhido");
    });

    it("should use dynamic doctor name in welcome message", () => {
      expect(code).toContain("gestante.medicoNome");
      // Fallback to André if medicoNome is not available
      expect(code).toContain("medicoNome || 'André'");
    });

    it("should have a delay between welcome and PDF messages", () => {
      // Check for the setTimeout delay between messages
      expect(code).toContain("setTimeout");
      expect(code).toContain("3000");
    });

    it("should send two sequential messages for orientação alimentar", () => {
      // Check that mutateAsync is called twice in the or-alimentares-1a handler
      const orAlimentaresSection = code.substring(
        code.indexOf("'or-alimentares-1a'"),
        code.indexOf("Or. Alimentares")
      );
      const mutateAsyncCount = (orAlimentaresSection.match(/mutateAsync/g) || []).length;
      expect(mutateAsyncCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Orientação Atividade Física message updated", () => {
    it("should use 👋 emoji instead of 🤰", () => {
      // Find the atividade física message area
      const atividadeFisicaArea = code.substring(
        code.indexOf("or-ativ-fisicas"),
        code.indexOf("Or. Ativ. Físicas")
      );
      expect(atividadeFisicaArea).toContain("👋");
      expect(atividadeFisicaArea).not.toContain("🤰");
    });

    it("should use 'converse comigo' in atividade física message", () => {
      const atividadeFisicaArea = code.substring(
        code.indexOf("Atividade Física na Gestação"),
        code.indexOf("Or. Ativ. Físicas")
      );
      expect(atividadeFisicaArea).toContain("converse comigo");
    });
  });
});
