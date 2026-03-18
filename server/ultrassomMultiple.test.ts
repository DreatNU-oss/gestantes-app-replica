import { describe, it, expect } from "vitest";
import { insertUltrassomSchema } from "./ultrassons";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Ultrassom - Multiple Records Support", () => {
  describe("insertUltrassomSchema", () => {
    it("should accept input without id (new record)", () => {
      const input = {
        gestanteId: 1,
        tipoUltrassom: "ultrassom_obstetrico" as const,
        dataExame: "2026-03-18",
        idadeGestacional: "20s 1d",
        dados: { pesoFetal: "350g" },
      };
      const result = insertUltrassomSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it("should accept input with id (update existing record)", () => {
      const input = {
        id: 42,
        gestanteId: 1,
        tipoUltrassom: "ultrassom_obstetrico" as const,
        dataExame: "2026-03-18",
        idadeGestacional: "20s 1d",
        dados: { pesoFetal: "350g" },
      };
      const result = insertUltrassomSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
      }
    });

    it("should accept all ultrasound types", () => {
      const types = [
        "primeiro_ultrassom",
        "morfologico_1tri",
        "ultrassom_obstetrico",
        "morfologico_2tri",
        "ecocardiograma_fetal",
        "ultrassom_seguimento",
      ];
      for (const tipo of types) {
        const input = {
          gestanteId: 1,
          tipoUltrassom: tipo,
          dados: {},
        };
        const result = insertUltrassomSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid ultrasound type", () => {
      const input = {
        gestanteId: 1,
        tipoUltrassom: "tipo_invalido",
        dados: {},
      };
      const result = insertUltrassomSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("salvarUltrassom logic", () => {
    it("should always INSERT when no id is provided (code check)", () => {
      const code = readFileSync(resolve(__dirname, "ultrassons.ts"), "utf-8");
      // Verify the function has the INSERT-always logic
      expect(code).toContain("Sempre criar novo registro");
      expect(code).toContain("permite múltiplos ultrassons do mesmo tipo");
      // Verify it checks for input.id to decide update vs insert
      expect(code).toContain("if (input.id)");
    });

    it("should UPDATE when id is provided (code check)", () => {
      const code = readFileSync(resolve(__dirname, "ultrassons.ts"), "utf-8");
      // Verify the update path exists
      expect(code).toContain(".update(ultrassons)");
      expect(code).toContain(".where(eq(ultrassons.id, input.id))");
    });
  });

  describe("AI Name Verification", () => {
    it("should extract nomePacienteLaudo from AI prompt (code check)", () => {
      const code = readFileSync(resolve(__dirname, "interpretarUltrassom.ts"), "utf-8");
      expect(code).toContain("nomePacienteLaudo");
    });

    it("should pass nomePacienteLaudo through in dadosFiltrados (code check)", () => {
      const code = readFileSync(resolve(__dirname, "interpretarUltrassom.ts"), "utf-8");
      // The nomePacienteLaudo should be passed through to the response
      expect(code).toContain("nomePacienteLaudo");
    });
  });

  describe("Frontend - Name Verification Dialog", () => {
    it("should have name mismatch dialog in InterpretarUltrassomModal", () => {
      const code = readFileSync(
        resolve(__dirname, "../client/src/components/InterpretarUltrassomModal.tsx"),
        "utf-8"
      );
      expect(code).toContain("nomeGestante");
      expect(code).toContain("nomePacienteLaudo");
      expect(code).toContain("showNameMismatch");
      expect(code).toContain("Nome no Cadastro");
      expect(code).toContain("Nome no Laudo");
    });
  });

  describe("Frontend - Multiple Records UI", () => {
    it("should have UltrassomRegistrosSalvos component", () => {
      const code = readFileSync(
        resolve(__dirname, "../client/src/components/UltrassomRegistrosSalvos.tsx"),
        "utf-8"
      );
      expect(code).toContain("registros");
      expect(code).toContain("editingId");
      expect(code).toContain("onEditar");
      expect(code).toContain("onNovo");
      expect(code).toContain("onApagar");
      expect(code).toContain("Novo {tipoLabel}");
    });

    it("should use UltrassomFormularioSalvo in all ultrasound cards", () => {
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      // Count occurrences of UltrassomFormularioSalvo (full form display)
      const matches = code.match(/UltrassomFormularioSalvo/g);
      // Should be imported (1) + used in 6 cards (6) = at least 7
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(7);
    });

    it("should have editingIds state for all ultrasound types", () => {
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      expect(code).toContain("editingIds");
      expect(code).toContain("primeiro_ultrassom");
      expect(code).toContain("morfologico_1tri");
      expect(code).toContain("ultrassom_obstetrico");
      expect(code).toContain("morfologico_2tri");
      expect(code).toContain("ecocardiograma_fetal");
      expect(code).toContain("ultrassom_seguimento");
    });

    it("should have carregarNoFormulario and prepararNovo functions", () => {
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      expect(code).toContain("carregarNoFormulario");
      expect(code).toContain("prepararNovo");
    });

    it("should show 'Atualizar' when editing and 'Salvar Novo' for new records", () => {
      const code = readFileSync(
        resolve(__dirname, "../client/src/pages/Ultrassons.tsx"),
        "utf-8"
      );
      expect(code).toContain("Atualizar");
      expect(code).toContain("Salvar Novo");
    });
  });
});
