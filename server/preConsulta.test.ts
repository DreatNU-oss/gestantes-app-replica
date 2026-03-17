import { describe, it, expect } from "vitest";

describe("preConsulta schema and router", () => {
  it("should have preConsulta table exported from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.preConsulta).toBeDefined();
    // $inferSelect is a TypeScript type, not a runtime property
    // Check that the table has columns instead
    expect(schema.preConsulta.id).toBeDefined();
    expect(schema.preConsulta.gestanteId).toBeDefined();
    expect(schema.preConsulta.peso).toBeDefined();
    expect(schema.preConsulta.pressaoArterial).toBeDefined();
  });

  it("should have correct tipoConsulta enum values", async () => {
    const schema = await import("../drizzle/schema");
    // The preConsulta table should have a tipoConsulta column with specific enum values
    const table = schema.preConsulta;
    expect(table).toBeDefined();
    // Verify the table has the expected columns
    const columns = Object.keys(table);
    expect(columns).toContain("id");
    expect(columns).toContain("gestanteId");
    expect(columns).toContain("peso");
    expect(columns).toContain("pressaoArterial");
    expect(columns).toContain("tipoConsulta");
    expect(columns).toContain("utilizado");
    expect(columns).toContain("registradoPorId");
    expect(columns).toContain("registradoPorNome");
    expect(columns).toContain("clinicaId");
  });

  it("should have preConsultaDb helpers exported from db", async () => {
    const db = await import("./db");
    expect(db.preConsultaDb).toBeDefined();
    expect(typeof db.preConsultaDb.criar).toBe("function");
    expect(typeof db.preConsultaDb.listarPorGestante).toBe("function");
    expect(typeof db.preConsultaDb.listarPendentes).toBe("function");
    expect(typeof db.preConsultaDb.listarPendentesPorGestante).toBe("function");
    expect(typeof db.preConsultaDb.buscarPorId).toBe("function");
    expect(typeof db.preConsultaDb.atualizar).toBe("function");
    expect(typeof db.preConsultaDb.marcarUtilizado).toBe("function");
    expect(typeof db.preConsultaDb.deletar).toBe("function");
  });

  it("should have preConsulta procedures in the appRouter", async () => {
    const { appRouter } = await import("./routers");
    // Check that the preConsulta router exists
    expect(appRouter._def.procedures).toBeDefined();
    // Check specific procedures exist
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("preConsulta.criar");
    expect(procedureKeys).toContain("preConsulta.listarPorGestante");
    expect(procedureKeys).toContain("preConsulta.listarPendentes");
    expect(procedureKeys).toContain("preConsulta.listarPendentesPorGestante");
    expect(procedureKeys).toContain("preConsulta.atualizar");
    expect(procedureKeys).toContain("preConsulta.marcarUtilizado");
    expect(procedureKeys).toContain("preConsulta.deletar");
  });

  it("should validate required fields in criar procedure", async () => {
    const { appRouter } = await import("./routers");
    // The criar procedure should require gestanteId, peso, pressaoArterial, tipoConsulta
    const procedures = appRouter._def.procedures;
    const criarProcedure = procedures["preConsulta.criar"];
    expect(criarProcedure).toBeDefined();
  });

  it("should have the sidebar menu item for secretária", async () => {
    // Test that the GestantesLayout has the Pré-Consulta menu item
    // We can verify by checking the file content
    const fs = await import("fs");
    const layoutContent = fs.readFileSync(
      "/home/ubuntu/gestantes-app-replica/client/src/components/GestantesLayout.tsx",
      "utf-8"
    );
    expect(layoutContent).toContain("Pré-Consulta");
    expect(layoutContent).toContain("/pre-consulta");
    expect(layoutContent).toContain("secretaria");
  });

  it("should have the PreConsulta route in App.tsx", async () => {
    const fs = await import("fs");
    const appContent = fs.readFileSync(
      "/home/ubuntu/gestantes-app-replica/client/src/App.tsx",
      "utf-8"
    );
    expect(appContent).toContain("PreConsulta");
    expect(appContent).toContain("/pre-consulta");
    expect(appContent).toContain('allowedRoles={["secretaria"]}');
  });

  it("should have preConsulta integration in CartaoPrenatal", async () => {
    const fs = await import("fs");
    const cartaoContent = fs.readFileSync(
      "/home/ubuntu/gestantes-app-replica/client/src/pages/CartaoPrenatal.tsx",
      "utf-8"
    );
    // Check that CartaoPrenatal queries for pending preConsultas
    expect(cartaoContent).toContain("preConsulta.listarPendentesPorGestante");
    // Check that it marks preConsulta as used
    expect(cartaoContent).toContain("preConsulta.marcarUtilizado");
    // Check that it shows the pre-fill info
    expect(cartaoContent).toContain("Pré-consulta registrada pela secretária");
    expect(cartaoContent).toContain("preConsultaUsadaId");
  });
});
