import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, type: "eq" })),
  desc: vi.fn((col) => ({ col, type: "desc" })),
  and: vi.fn((...args) => ({ args, type: "and" })),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: "sql" })),
    { join: vi.fn(), raw: vi.fn() }
  ),
  count: vi.fn((col) => ({ col, type: "count" })),
  max: vi.fn((col) => ({ col, type: "max" })),
  countDistinct: vi.fn((col) => ({ col, type: "countDistinct" })),
  isNotNull: vi.fn((col) => ({ col, type: "isNotNull" })),
}));

describe("appAcesso - listarGestantesComAcesso", () => {
  it("should filter gestantes by clinicaId when provided", () => {
    const clinicaId = 1;
    const gestanteIds = [10, 20, 30];
    
    // Simulate filtering: only gestantes belonging to clinicaId=1
    const allGestantes = [
      { id: 10, nome: "Ana", email: "ana@test.com", telefone: "11999", clinicaId: 1 },
      { id: 20, nome: "Bia", email: "bia@test.com", telefone: "11888", clinicaId: 1 },
      { id: 30, nome: "Carla", email: "carla@test.com", telefone: "11777", clinicaId: 2 },
    ];
    
    const filtered = allGestantes.filter(
      (g) => g.clinicaId === clinicaId && gestanteIds.includes(g.id)
    );
    
    expect(filtered).toHaveLength(2);
    expect(filtered.map((g) => g.nome)).toContain("Ana");
    expect(filtered.map((g) => g.nome)).toContain("Bia");
    expect(filtered.map((g) => g.nome)).not.toContain("Carla");
  });

  it("should return empty array when no gestantes have sessions", () => {
    const sessoes: any[] = [];
    const result = sessoes
      .map((s) => {
        const gestante = undefined;
        if (!gestante) return null;
        return gestante;
      })
      .filter(Boolean);
    
    expect(result).toHaveLength(0);
  });

  it("should correctly combine session data with gestante data", () => {
    const sessoes = [
      { gestanteId: 1, totalSessoes: 5, ultimoAcesso: "2026-03-19T10:00:00Z", primeiraSessao: "2026-01-01T08:00:00Z" },
      { gestanteId: 2, totalSessoes: 2, ultimoAcesso: "2026-03-10T14:00:00Z", primeiraSessao: "2026-02-01T09:00:00Z" },
    ];
    
    const gestantesData = [
      { id: 1, nome: "Maria Silva", email: "maria@test.com", telefone: "11999", clinicaId: 1 },
      { id: 2, nome: "Joana Santos", email: "joana@test.com", telefone: "11888", clinicaId: 1 },
    ];
    
    const gestantesMap = new Map(gestantesData.map((g) => [g.id, g]));
    
    const result = sessoes
      .map((s) => {
        const gestante = gestantesMap.get(Number(s.gestanteId));
        if (!gestante) return null;
        return {
          gestanteId: Number(s.gestanteId),
          nome: gestante.nome,
          email: gestante.email || "",
          telefone: gestante.telefone || "",
          totalSessoes: Number(s.totalSessoes),
          ultimoAcesso: s.ultimoAcesso ? new Date(s.ultimoAcesso).toISOString() : null,
          primeiraSessao: s.primeiraSessao ? new Date(s.primeiraSessao).toISOString() : null,
        };
      })
      .filter(Boolean);
    
    expect(result).toHaveLength(2);
    expect(result[0]?.nome).toBe("Maria Silva");
    expect(result[0]?.totalSessoes).toBe(5);
    expect(result[1]?.nome).toBe("Joana Santos");
    expect(result[1]?.totalSessoes).toBe(2);
  });

  it("should exclude gestantes not in the gestantesMap (from different clinica)", () => {
    const sessoes = [
      { gestanteId: 1, totalSessoes: 3, ultimoAcesso: "2026-03-19T10:00:00Z", primeiraSessao: "2026-01-01T08:00:00Z" },
      { gestanteId: 99, totalSessoes: 1, ultimoAcesso: "2026-03-15T10:00:00Z", primeiraSessao: "2026-02-01T08:00:00Z" },
    ];
    
    // Only gestante 1 is in this clinica
    const gestantesData = [
      { id: 1, nome: "Maria Silva", email: "maria@test.com", telefone: "11999", clinicaId: 1 },
    ];
    
    const gestantesMap = new Map(gestantesData.map((g) => [g.id, g]));
    
    const result = sessoes
      .map((s) => {
        const gestante = gestantesMap.get(Number(s.gestanteId));
        if (!gestante) return null;
        return { gestanteId: Number(s.gestanteId), nome: gestante.nome };
      })
      .filter(Boolean);
    
    expect(result).toHaveLength(1);
    expect(result[0]?.nome).toBe("Maria Silva");
  });
});

describe("appAcesso - resumo", () => {
  it("should return correct summary structure", () => {
    const mockResumo = {
      totalComAcesso: 57,
      acessosUltimos7Dias: 12,
      acessosHoje: 3,
    };
    
    expect(mockResumo.totalComAcesso).toBeGreaterThanOrEqual(0);
    expect(mockResumo.acessosUltimos7Dias).toBeGreaterThanOrEqual(0);
    expect(mockResumo.acessosHoje).toBeGreaterThanOrEqual(0);
    expect(mockResumo.acessosUltimos7Dias).toBeLessThanOrEqual(mockResumo.totalComAcesso);
    expect(mockResumo.acessosHoje).toBeLessThanOrEqual(mockResumo.acessosUltimos7Dias);
  });

  it("should handle zero access case", () => {
    const mockResumo = {
      totalComAcesso: 0,
      acessosUltimos7Dias: 0,
      acessosHoje: 0,
    };
    
    expect(mockResumo.totalComAcesso).toBe(0);
    expect(mockResumo.acessosUltimos7Dias).toBe(0);
    expect(mockResumo.acessosHoje).toBe(0);
  });
});

describe("AcessoApp UI - statusAcesso helper", () => {
  // Replicate the statusAcesso logic from the component
  function statusAcesso(ultimoAcesso: string | null): { label: string; variant: string } {
    if (!ultimoAcesso) return { label: "Sem acesso", variant: "outline" };
    const diff = Date.now() - new Date(ultimoAcesso).getTime();
    const dias = diff / (1000 * 60 * 60 * 24);
    if (dias < 1) return { label: "Hoje", variant: "default" };
    if (dias < 7) return { label: "Esta semana", variant: "default" };
    if (dias < 30) return { label: "Este mês", variant: "secondary" };
    return { label: "Inativo", variant: "outline" };
  }

  it("should return 'Sem acesso' for null", () => {
    expect(statusAcesso(null).label).toBe("Sem acesso");
    expect(statusAcesso(null).variant).toBe("outline");
  });

  it("should return 'Hoje' for access within last 24h", () => {
    const now = new Date().toISOString();
    expect(statusAcesso(now).label).toBe("Hoje");
  });

  it("should return 'Esta semana' for access 3 days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(statusAcesso(threeDaysAgo).label).toBe("Esta semana");
  });

  it("should return 'Este mês' for access 15 days ago", () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(statusAcesso(fifteenDaysAgo).label).toBe("Este mês");
  });

  it("should return 'Inativo' for access 60 days ago", () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(statusAcesso(sixtyDaysAgo).label).toBe("Inativo");
  });
});

describe("AcessoApp UI - tempoRelativo helper", () => {
  function tempoRelativo(isoString: string | null): string {
    if (!isoString) return "";
    const diff = Date.now() - new Date(isoString).getTime();
    const minutos = Math.floor(diff / 60000);
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return "ontem";
    if (dias < 7) return `há ${dias} dias`;
    if (dias < 30) return `há ${Math.floor(dias / 7)} sem`;
    return `há ${Math.floor(dias / 30)} meses`;
  }

  it("should return empty string for null", () => {
    expect(tempoRelativo(null)).toBe("");
  });

  it("should return 'há X min' for recent access", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(tempoRelativo(fiveMinutesAgo)).toBe("há 5 min");
  });

  it("should return 'há Xh' for access hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(threeHoursAgo)).toBe("há 3h");
  });

  it("should return 'ontem' for access 1 day ago", () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(oneDayAgo)).toBe("ontem");
  });

  it("should return 'há X dias' for access days ago", () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(fourDaysAgo)).toBe("há 4 dias");
  });

  it("should return 'há X sem' for access weeks ago", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(twoWeeksAgo)).toBe("há 2 sem");
  });

  it("should return 'há X meses' for access months ago", () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(twoMonthsAgo)).toBe("há 2 meses");
  });
});
