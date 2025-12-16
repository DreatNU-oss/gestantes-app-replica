import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Gestante Router", () => {
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  describe("gestante.me", () => {
    it("deve retornar dados da gestante por ID", async () => {
      // Usar ID de uma gestante existente no banco de testes
      const gestanteId = 330092; // Vivian Mantovani
      
      const resultado = await caller.gestante.me({ gestanteId });
      
      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(gestanteId);
      expect(resultado.nome).toBeDefined();
      expect(resultado.email).toBeDefined();
    });

    it("deve calcular IG e DPP corretamente", async () => {
      const gestanteId = 330092;
      
      const resultado = await caller.gestante.me({ gestanteId });
      
      expect(resultado.ig).toBeDefined();
      expect(resultado.ig?.semanas).toBeGreaterThan(0);
      expect(resultado.dpp).toBeDefined();
    });
  });

  describe("gestante.marcos", () => {
    it("deve retornar marcos importantes da gestação", async () => {
      const gestanteId = 330092;
      
      const marcos = await caller.gestante.marcos({ gestanteId });
      
      expect(marcos).toBeDefined();
      expect(Array.isArray(marcos)).toBe(true);
      expect(marcos.length).toBe(9); // 9 marcos importantes
      
      // Verificar estrutura dos marcos
      const primeiroMarco = marcos[0];
      expect(primeiroMarco.nome).toBeDefined();
      expect(primeiroMarco.cor).toBeDefined();
    });
  });

  describe("gestante.consultas", () => {
    it("deve retornar histórico de consultas", async () => {
      const gestanteId = 330092;
      
      const consultas = await caller.gestante.consultas({ gestanteId });
      
      expect(consultas).toBeDefined();
      expect(Array.isArray(consultas)).toBe(true);
      
      if (consultas.length > 0) {
        const primeiraConsulta = consultas[0];
        expect(primeiraConsulta.id).toBeDefined();
        expect(primeiraConsulta.data).toBeDefined();
      }
    });
  });

  describe("gestante.exames", () => {
    it("deve retornar exames laboratoriais agrupados", async () => {
      const gestanteId = 330092;
      
      const exames = await caller.gestante.exames({ gestanteId });
      
      expect(exames).toBeDefined();
      expect(Array.isArray(exames)).toBe(true);
      
      if (exames.length > 0) {
        const primeiroExame = exames[0];
        expect(primeiroExame.nome).toBeDefined();
        expect(primeiroExame.trimestres).toBeDefined();
      }
    });
  });

  describe("gestante.ultrassons", () => {
    it("deve retornar histórico de ultrassons", async () => {
      const gestanteId = 330092;
      
      const ultrassons = await caller.gestante.ultrassons({ gestanteId });
      
      expect(ultrassons).toBeDefined();
      expect(Array.isArray(ultrassons)).toBe(true);
      
      if (ultrassons.length > 0) {
        const primeiroUS = ultrassons[0];
        expect(primeiroUS.id).toBeDefined();
        expect(primeiroUS.tipo).toBeDefined();
        expect(primeiroUS.data).toBeDefined();
      }
    });
  });

  describe("gestante.peso", () => {
    it("deve retornar dados para curva de ganho de peso", async () => {
      const gestanteId = 330092;
      
      const dadosPeso = await caller.gestante.peso({ gestanteId });
      
      expect(dadosPeso).toBeDefined();
      expect(dadosPeso.pontos).toBeDefined();
      expect(Array.isArray(dadosPeso.pontos)).toBe(true);
      
      if (dadosPeso.pesoInicial && dadosPeso.altura) {
        expect(dadosPeso.imc).toBeDefined();
        expect(dadosPeso.categoria).toBeDefined();
      }
    });

    it("deve calcular IMC corretamente", async () => {
      const gestanteId = 330092;
      
      const dadosPeso = await caller.gestante.peso({ gestanteId });
      
      if (dadosPeso.imc) {
        expect(dadosPeso.imc).toBeGreaterThan(0);
        expect(dadosPeso.imc).toBeLessThan(50); // IMC razoável
        expect(dadosPeso.categoria).toMatch(/baixo_peso|adequado|sobrepeso|obesidade/);
      }
    });
  });
});
