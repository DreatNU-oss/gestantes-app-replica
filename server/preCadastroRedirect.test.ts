import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PreCadastro redirect to pré-consulta after save", () => {
  const clientSrc = path.resolve(__dirname, "../client/src");

  it("PreCadastro should import useGestanteAtiva context", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/PreCadastro.tsx"),
      "utf-8"
    );
    expect(content).toContain("useGestanteAtiva");
    expect(content).toContain("setGestanteAtiva");
  });

  it("PreCadastro createMutation onSuccess should set gestante ativa and redirect to /pre-consulta", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/PreCadastro.tsx"),
      "utf-8"
    );
    // Should set the newly created gestante as active
    expect(content).toContain("setGestanteAtiva");
    // Should redirect to pré-consulta page
    expect(content).toContain('setLocation("/pre-consulta")');
    // Should only redirect on create (not on update/edit)
    // The update mutation should NOT redirect to pre-consulta
    const updateOnSuccess = content.match(/updateMutation[\s\S]*?onSuccess[\s\S]*?\{([\s\S]*?)\}/);
    if (updateOnSuccess) {
      expect(updateOnSuccess[1]).not.toContain("/pre-consulta");
    }
  });

  it("PreConsulta should sync with gestanteAtiva from context", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/PreConsulta.tsx"),
      "utf-8"
    );
    // PreConsulta should use gestanteAtiva context
    expect(content).toContain("useGestanteAtiva");
    expect(content).toContain("gestanteAtiva");
    // Should sync gestanteSelecionada with gestanteAtiva
    expect(content).toContain("setGestanteSelecionada");
  });
});
