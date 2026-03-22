import { describe, it, expect } from "vitest";
import { normalizarIdadeGestacional } from "../shared/igNormalization";

describe("normalizarIdadeGestacional - Auto-fill dias com 0", () => {
  describe("Deve adicionar '0d' quando apenas semanas são informadas", () => {
    it("'12s' → '12s 0d'", () => {
      expect(normalizarIdadeGestacional("12s")).toBe("12s 0d");
    });

    it("'8s' → '8s 0d'", () => {
      expect(normalizarIdadeGestacional("8s")).toBe("8s 0d");
    });

    it("'7 s' → '7s 0d' (espaço antes do s)", () => {
      expect(normalizarIdadeGestacional("7 s")).toBe("7s 0d");
    });

    it("'32S' → '32s 0d' (maiúsculo)", () => {
      expect(normalizarIdadeGestacional("32S")).toBe("32s 0d");
    });

    it("'12s ' → '12s 0d' (espaço no final)", () => {
      expect(normalizarIdadeGestacional("12s ")).toBe("12s 0d");
    });
  });

  describe("Deve adicionar 's 0d' quando apenas número é informado", () => {
    it("'12' → '12s 0d'", () => {
      expect(normalizarIdadeGestacional("12")).toBe("12s 0d");
    });

    it("'8' → '8s 0d'", () => {
      expect(normalizarIdadeGestacional("8")).toBe("8s 0d");
    });

    it("'32' → '32s 0d'", () => {
      expect(normalizarIdadeGestacional("32")).toBe("32s 0d");
    });

    it("' 7 ' → '7s 0d' (com espaços)", () => {
      expect(normalizarIdadeGestacional(" 7 ")).toBe("7s 0d");
    });
  });

  describe("Deve adicionar 'd' quando dias estão sem sufixo", () => {
    it("'12s 3' → '12s 3d'", () => {
      expect(normalizarIdadeGestacional("12s 3")).toBe("12s 3d");
    });

    it("'8s 0' → '8s 0d'", () => {
      expect(normalizarIdadeGestacional("8s 0")).toBe("8s 0d");
    });

    it("'20s 5' → '20s 5d'", () => {
      expect(normalizarIdadeGestacional("20s 5")).toBe("20s 5d");
    });
  });

  describe("Não deve alterar formatos já completos", () => {
    it("'12s 3d' permanece '12s 3d'", () => {
      expect(normalizarIdadeGestacional("12s 3d")).toBe("12s 3d");
    });

    it("'8s 0d' permanece '8s 0d'", () => {
      expect(normalizarIdadeGestacional("8s 0d")).toBe("8s 0d");
    });

    it("'12s3d' permanece '12s3d' (sem espaço)", () => {
      expect(normalizarIdadeGestacional("12s3d")).toBe("12s3d");
    });

    it("'20s 1d' permanece '20s 1d'", () => {
      expect(normalizarIdadeGestacional("20s 1d")).toBe("20s 1d");
    });
  });

  describe("Não deve alterar valores vazios ou texto livre", () => {
    it("string vazia permanece vazia", () => {
      expect(normalizarIdadeGestacional("")).toBe("");
    });

    it("'Normal' permanece 'Normal'", () => {
      expect(normalizarIdadeGestacional("Normal")).toBe("Normal");
    });

    it("'Compatível com 12 semanas' permanece inalterado", () => {
      expect(normalizarIdadeGestacional("Compatível com 12 semanas")).toBe("Compatível com 12 semanas");
    });

    it("null/undefined retorna o valor original", () => {
      expect(normalizarIdadeGestacional(null as any)).toBeFalsy();
      expect(normalizarIdadeGestacional(undefined as any)).toBeFalsy();
    });
  });

  describe("Integração com Ultrassons.tsx", () => {
    it("deve estar importado corretamente em Ultrassons.tsx", () => {
      const { readFileSync } = require("fs");
      const { resolve } = require("path");
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      expect(code).toContain("import { normalizarIdadeGestacional } from '@shared/igNormalization'");
    });

    it("deve ter onBlur com normalização em todos os 5 campos de IG dos formulários novos", () => {
      const { readFileSync } = require("fs");
      const { resolve } = require("path");
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      // Contar ocorrências de onBlurExtra com normalizarIdadeGestacional
      const matches = code.match(/onBlurExtra=\{.*normalizarIdadeGestacional/g);
      // 5 tipos de US com campo IG: 1º US, Morfo 1T, Obstétrico, Morfo 2T, Seguimento
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(5);
    });

    it("deve normalizar IG no handleSalvar (novo US)", () => {
      const { readFileSync } = require("fs");
      const { resolve } = require("path");
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      expect(code).toContain("const igNormalizada = normalizarIdadeGestacional(idadeGestacional");
    });

    it("deve normalizar IG no handleSalvarRegistroSalvo (US existente)", () => {
      const { readFileSync } = require("fs");
      const { resolve } = require("path");
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      // Deve haver 2 ocorrências de igNormalizada (handleSalvar + handleSalvarRegistroSalvo)
      const matches = code.match(/igNormalizada/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4); // 2 declarações + 2 usos
    });

    it("deve normalizar IG nos dados extraídos pela IA (handleDadosExtraidos)", () => {
      const { readFileSync } = require("fs");
      const { resolve } = require("path");
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      expect(code).toContain("dadosNormalizados.idadeGestacional = normalizarIdadeGestacional(dadosNormalizados.idadeGestacional)");
    });
  });

  describe("Integração com UltrassomFormularioSalvo.tsx", () => {
    it("deve ter onBlur com normalização no componente de registros salvos", () => {
      const { readFileSync } = require("fs");
      const { resolve } = require("path");
      const code = readFileSync(
        resolve(__dirname, "../client/src/components/UltrassomFormularioSalvo.tsx"),
        "utf-8"
      );
      expect(code).toContain("normalizarIdadeGestacional");
      expect(code).toContain("onBlurExtra={field.key === 'idadeGestacional'");
    });
  });
});
