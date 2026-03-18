import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Pré-consulta auto-fill in consultation components", () => {
  const clientSrc = path.resolve(__dirname, "../client/src");

  it("WizardPrimeiraConsulta should query preConsulta and auto-fill peso/PA", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "components/WizardPrimeiraConsulta.tsx"),
      "utf-8"
    );
    // Should query preConsulta pendentes
    expect(content).toContain("trpc.preConsulta.listarPendentesPorGestante.useQuery");
    // Should auto-fill peso from preConsulta
    expect(content).toContain("pc.peso");
    // Should auto-fill pressaoArterial from preConsulta
    expect(content).toContain("pc.pressaoArterial");
    // Should mark preConsulta as used
    expect(content).toContain("trpc.preConsulta.marcarUtilizado.useMutation");
    expect(content).toContain("marcarPreConsultaUtilizada.mutate");
    // Should have useEffect for auto-fill
    expect(content).toContain("useEffect");
  });

  it("CartaoPrenatal (consulta de rotina) should auto-fill peso/PA and NOT show blue banner", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/CartaoPrenatal.tsx"),
      "utf-8"
    );
    // Should still query preConsulta pendentes for auto-fill
    expect(content).toContain("trpc.preConsulta.listarPendentesPorGestante.useQuery");
    // Should auto-fill peso from preConsulta
    expect(content).toContain("pc.peso");
    // Should auto-fill pressaoArterial from preConsulta
    expect(content).toContain("pc.pressaoArterial");
    // Should NOT have the blue info banner text
    expect(content).not.toContain("Pré-consulta registrada pela secretária");
    expect(content).not.toContain("Os dados serão pré-preenchidos ao abrir a nova consulta.");
  });

  it("ConsultaUrgencia should query preConsulta and auto-fill PA", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/ConsultaUrgencia.tsx"),
      "utf-8"
    );
    // Should query preConsulta pendentes
    expect(content).toContain("trpc.preConsulta.listarPendentesPorGestante.useQuery");
    // Should auto-fill pressaoArterial from preConsulta
    expect(content).toContain("pc.pressaoArterial");
    // Should mark preConsulta as used
    expect(content).toContain("trpc.preConsulta.marcarUtilizado.useMutation");
    expect(content).toContain("marcarPreConsultaUtilizada.mutate");
  });
});
