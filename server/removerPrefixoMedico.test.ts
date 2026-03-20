import { describe, it, expect } from "vitest";
import { removerPrefixoMedico, replaceTemplateVariables } from "./whatsapp";

describe("removerPrefixoMedico", () => {
  it("should remove 'Dr. ' prefix", () => {
    expect(removerPrefixoMedico("Dr. André")).toBe("André");
  });

  it("should remove 'Dra. ' prefix", () => {
    expect(removerPrefixoMedico("Dra. Maria")).toBe("Maria");
  });

  it("should remove 'Dr(a). ' prefix", () => {
    expect(removerPrefixoMedico("Dr(a). Carlos")).toBe("Carlos");
  });

  it("should remove 'Dr(a) ' prefix without dot", () => {
    expect(removerPrefixoMedico("Dr(a) Carlos")).toBe("Carlos");
  });

  it("should remove 'DR. ' prefix (case insensitive)", () => {
    expect(removerPrefixoMedico("DR. André")).toBe("André");
  });

  it("should remove 'DRA. ' prefix (case insensitive)", () => {
    expect(removerPrefixoMedico("DRA. Maria")).toBe("Maria");
  });

  it("should NOT modify names without prefix", () => {
    expect(removerPrefixoMedico("André")).toBe("André");
    expect(removerPrefixoMedico("Maria Silva")).toBe("Maria Silva");
    expect(removerPrefixoMedico("João")).toBe("João");
  });

  it("should handle empty string", () => {
    expect(removerPrefixoMedico("")).toBe("");
  });

  it("should handle name with 'Dr' in the middle (not prefix)", () => {
    // Should NOT remove 'Dr' from the middle of a name
    expect(removerPrefixoMedico("Pedro Drago")).toBe("Pedro Drago");
  });

  it("should trim extra spaces after removing prefix", () => {
    expect(removerPrefixoMedico("Dr.  André")).toBe("André");
  });
});

describe("replaceTemplateVariables - no duplicate Dr. prefix", () => {
  const baseContext = {
    nome: "Ana Silva",
    igSemanas: 27,
    igDias: 3,
    dpp: "15/06/2026",
    telefone: "11999999999",
    medico: "Dr. André",
    telefoneMedico: "",
  };

  it("should not duplicate Dr. when template has 'Dr(a). {medico}' and doctor name is 'Dr. André'", () => {
    const template = "Olá {nome}! Aqui é o Dr(a). {medico}.";
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe("Olá Ana! Aqui é o Dr(a). André.");
    expect(result).not.toContain("Dr(a). Dr.");
    expect(result).not.toContain("Dr. Dr.");
  });

  it("should not duplicate Dra. when template has 'Dr(a). {medico}' and doctor name is 'Dra. Maria'", () => {
    const template = "Olá {nome}! Aqui é o Dr(a). {medico}.";
    const result = replaceTemplateVariables(template, { ...baseContext, medico: "Dra. Maria" });
    expect(result).toBe("Olá Ana! Aqui é o Dr(a). Maria.");
    expect(result).not.toContain("Dr(a). Dra.");
  });

  it("should work correctly when doctor name has no prefix", () => {
    const template = "Olá {nome}! Aqui é o Dr(a). {medico}.";
    const result = replaceTemplateVariables(template, { ...baseContext, medico: "Carlos" });
    expect(result).toBe("Olá Ana! Aqui é o Dr(a). Carlos.");
  });

  it("should handle the footer pattern 'Dr(a). {medico}' without duplication", () => {
    const template = "Mensagem importante.\n\nDr(a). {medico}";
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe("Mensagem importante.\n\nDr(a). André");
    expect(result).not.toContain("Dr(a). Dr.");
  });

  it("should replace {medico} multiple times in same message without duplication", () => {
    const template = "Aqui é o Dr(a). {medico}. Atenciosamente, Dr(a). {medico}";
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe("Aqui é o Dr(a). André. Atenciosamente, Dr(a). André");
    expect(result).not.toContain("Dr. André");
  });

  it("should still replace all other template variables correctly", () => {
    const template = "Olá {nome}! IG: {ig_semanas}s{ig_dias}d. DPP: {dpp}. Dr(a). {medico}.";
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe("Olá Ana! IG: 27s3d. DPP: 15/06/2026. Dr(a). André.");
  });

  it("should handle real vaccine reminder template format", () => {
    const template = `Olá *{nome}*! 👋

Aqui é o Dr(a). {medico}.
Você está com *{ig_semanas} semanas de gestação* e chegou o momento de tomar a *vacina dTpa*.

Um abraço!
Dr(a). {medico}`;
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toContain("Dr(a). André.");
    expect(result).not.toContain("Dr(a). Dr.");
    expect(result).not.toContain("Dr. André");
    // Should appear twice (header and footer) but without duplication
    const matches = result.match(/Dr\(a\)\. André/g);
    expect(matches).toHaveLength(2);
  });
});
