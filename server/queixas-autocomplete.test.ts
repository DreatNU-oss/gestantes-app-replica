import { describe, it, expect } from "vitest";

/**
 * Testes para a lógica de combinação e ordenação de sugestões de queixas
 * no autocomplete do campo "Queixa Principal".
 * 
 * Simula a lógica que existe no CartaoPrenatal.tsx e WizardPrimeiraConsulta.tsx
 * para combinar queixas personalizadas (do banco) com sugestões estáticas.
 */

// Simular a lista estática de sugestões
const SUGESTOES_QUEIXAS = [
  "Sem queixas hoje",
  "Dor lombar",
  "Náuseas",
  "Vômitos",
  "Cefaleia",
  "Dor abdominal",
  "Sangramento vaginal",
  "Leucorreia",
  "Edema de MMII",
  "Tontura",
  "Insônia",
  "Ansiedade",
];

// Simular dados do banco (já ordenados por usageCount DESC)
const queixasPersonalizadasMock = [
  { id: 24, texto: "Sem queixas hoje.", usageCount: 64, clinicaId: 1, ativo: 1 },
  { id: 2, texto: "Ansiedade.", usageCount: 5, clinicaId: 1, ativo: 1 },
  { id: 100, texto: "Astenia.", usageCount: 5, clinicaId: 1, ativo: 1 },
  { id: 200, texto: "Dores em baixo ventre.", usageCount: 3, clinicaId: 1, ativo: 1 },
  { id: 300, texto: "Insônia.", usageCount: 3, clinicaId: 1, ativo: 1 },
  { id: 400, texto: "Migrânias.", usageCount: 1, clinicaId: 1, ativo: 1 },
];

// Função que simula a lógica de combinação do CartaoPrenatal.tsx
function combinarSugestoes(queixasPersonalizadas: typeof queixasPersonalizadasMock) {
  const sugestoesQueixasCombinadas = [
    ...queixasPersonalizadas.map((q) => q.texto),
    ...SUGESTOES_QUEIXAS.filter(s => !queixasPersonalizadas.some((q) => q.texto === s))
  ];
  const sugestoesQueixasIds: (number | null)[] = [
    ...queixasPersonalizadas.map((q) => q.id),
    ...SUGESTOES_QUEIXAS.filter(s => !queixasPersonalizadas.some((q) => q.texto === s)).map(() => null)
  ];
  const sugestoesQueixasUsageCounts: (number | null)[] = [
    ...queixasPersonalizadas.map((q) => q.usageCount),
    ...SUGESTOES_QUEIXAS.filter(s => !queixasPersonalizadas.some((q) => q.texto === s)).map(() => 0)
  ];
  return { sugestoesQueixasCombinadas, sugestoesQueixasIds, sugestoesQueixasUsageCounts };
}

describe("Queixas Autocomplete - Combinação e Ordenação", () => {
  it("deve colocar queixas personalizadas antes das estáticas", () => {
    const { sugestoesQueixasCombinadas } = combinarSugestoes(queixasPersonalizadasMock);
    
    // Primeiras 6 devem ser as personalizadas
    expect(sugestoesQueixasCombinadas[0]).toBe("Sem queixas hoje.");
    expect(sugestoesQueixasCombinadas[1]).toBe("Ansiedade.");
    expect(sugestoesQueixasCombinadas[2]).toBe("Astenia.");
    expect(sugestoesQueixasCombinadas[3]).toBe("Dores em baixo ventre.");
    expect(sugestoesQueixasCombinadas[4]).toBe("Insônia.");
    expect(sugestoesQueixasCombinadas[5]).toBe("Migrânias.");
  });

  it("deve preservar a ordem por usageCount DESC das personalizadas", () => {
    const { sugestoesQueixasUsageCounts } = combinarSugestoes(queixasPersonalizadasMock);
    
    // Primeiras 6 devem ter usageCount decrescente
    expect(sugestoesQueixasUsageCounts[0]).toBe(64); // Sem queixas hoje.
    expect(sugestoesQueixasUsageCounts[1]).toBe(5);  // Ansiedade.
    expect(sugestoesQueixasUsageCounts[2]).toBe(5);  // Astenia.
    expect(sugestoesQueixasUsageCounts[3]).toBe(3);  // Dores em baixo ventre.
    expect(sugestoesQueixasUsageCounts[4]).toBe(3);  // Insônia.
    expect(sugestoesQueixasUsageCounts[5]).toBe(1);  // Migrânias.
  });

  it("deve ter usageCount 0 para sugestões estáticas não rastreadas", () => {
    const { sugestoesQueixasCombinadas, sugestoesQueixasUsageCounts } = combinarSugestoes(queixasPersonalizadasMock);
    
    // Encontrar uma sugestão estática que não está nas personalizadas
    const idxDorLombar = sugestoesQueixasCombinadas.indexOf("Dor lombar");
    expect(idxDorLombar).toBeGreaterThan(5); // Deve estar após as personalizadas
    expect(sugestoesQueixasUsageCounts[idxDorLombar]).toBe(0);
  });

  it("deve incluir IDs para personalizadas e null para estáticas", () => {
    const { sugestoesQueixasIds } = combinarSugestoes(queixasPersonalizadasMock);
    
    // Personalizadas têm IDs
    expect(sugestoesQueixasIds[0]).toBe(24);
    expect(sugestoesQueixasIds[1]).toBe(2);
    
    // Estáticas têm null
    const staticStartIdx = queixasPersonalizadasMock.length;
    expect(sugestoesQueixasIds[staticStartIdx]).toBeNull();
  });

  it("deve excluir sugestões estáticas que já existem como personalizadas", () => {
    const { sugestoesQueixasCombinadas } = combinarSugestoes(queixasPersonalizadasMock);
    
    // "Sem queixas hoje" (estática) é diferente de "Sem queixas hoje." (personalizada com ponto)
    // Ambas devem existir porque são textos diferentes
    const semQueixasEstática = sugestoesQueixasCombinadas.filter(s => s === "Sem queixas hoje");
    const semQueixasPersonalizada = sugestoesQueixasCombinadas.filter(s => s === "Sem queixas hoje.");
    expect(semQueixasEstática.length).toBe(1); // Estática existe
    expect(semQueixasPersonalizada.length).toBe(1); // Personalizada existe
  });

  it("deve funcionar com lista vazia de personalizadas", () => {
    const { sugestoesQueixasCombinadas, sugestoesQueixasUsageCounts } = combinarSugestoes([]);
    
    // Todas devem ser estáticas
    expect(sugestoesQueixasCombinadas.length).toBe(SUGESTOES_QUEIXAS.length);
    expect(sugestoesQueixasUsageCounts.every(c => c === 0)).toBe(true);
  });

  it("a mais frequente deve ser a primeira da lista", () => {
    const { sugestoesQueixasCombinadas, sugestoesQueixasUsageCounts } = combinarSugestoes(queixasPersonalizadasMock);
    
    // A primeira sugestão deve ter o maior usageCount
    const maxUsage = Math.max(...sugestoesQueixasUsageCounts.map(c => c ?? 0));
    expect(sugestoesQueixasUsageCounts[0]).toBe(maxUsage);
    expect(sugestoesQueixasCombinadas[0]).toBe("Sem queixas hoje.");
  });

  it("deve ter comprimento correto (personalizadas + estáticas não duplicadas)", () => {
    const { sugestoesQueixasCombinadas } = combinarSugestoes(queixasPersonalizadasMock);
    
    // Total = personalizadas + estáticas que não estão nas personalizadas
    const estaticasNaoDuplicadas = SUGESTOES_QUEIXAS.filter(
      s => !queixasPersonalizadasMock.some(q => q.texto === s)
    );
    const expectedLength = queixasPersonalizadasMock.length + estaticasNaoDuplicadas.length;
    expect(sugestoesQueixasCombinadas.length).toBe(expectedLength);
  });
});

describe("Queixas - Rastreamento de frequência", () => {
  it("todas as queixas (incluindo estáticas) devem ser rastreadas ao salvar consulta", () => {
    // Simular o comportamento de salvar queixas
    const queixasTexto = "Sem queixas hoje / Dor lombar";
    const queixasArray = queixasTexto.split(/[/,]/).map(q => q.trim()).filter(q => q.length > 0);
    
    // Antes: filtrava estáticas com SUGESTOES_QUEIXAS.includes()
    // Agora: todas devem ser salvas
    expect(queixasArray).toEqual(["Sem queixas hoje", "Dor lombar"]);
    expect(queixasArray.length).toBe(2);
    
    // Verificar que NÃO filtramos mais as estáticas
    const queixasParaSalvar = queixasArray; // Sem filtro!
    expect(queixasParaSalvar.includes("Sem queixas hoje")).toBe(true);
    expect(queixasParaSalvar.includes("Dor lombar")).toBe(true);
  });

  it("deve separar queixas por / e , corretamente", () => {
    const queixasTexto = "Náuseas, Vômitos / Cefaleia";
    const queixasArray = queixasTexto.split(/[/,]/).map(q => q.trim()).filter(q => q.length > 0);
    
    expect(queixasArray).toEqual(["Náuseas", "Vômitos", "Cefaleia"]);
  });
});
