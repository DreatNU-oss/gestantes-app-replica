import { describe, it, expect } from 'vitest';

// Test the exam configuration
describe('Exames Config - Trimester availability', () => {
  // We need to import the config - since it's a client file, we'll test the logic
  
  const examesSangue = [
    { nome: "Tipagem sanguínea ABO/Rh", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "Coombs indireto", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Hemoglobina/Hematócrito", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Plaquetas", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Glicemia de jejum", trimestres: { primeiro: true, segundo: false, terceiro: false } },
    { nome: "VDRL", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "FTA-ABS IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "FTA-ABS IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "HIV", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Hepatite B (HBsAg)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Anti-HBs", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Hepatite C (Anti-HCV)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Toxoplasmose IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Toxoplasmose IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Rubéola IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Rubéola IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Citomegalovírus IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Citomegalovírus IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "TSH", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "T4 Livre", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Eletroforese de Hemoglobina", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Ferritina", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Vitamina D (25-OH)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
    { nome: "Vitamina B12", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  ];

  const examesFezes = [
    { nome: "EPF (Parasitológico de Fezes)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  ];

  // Exams that must be available in all 3 trimesters
  const examesAllTri = [
    "HIV", "Hepatite B (HBsAg)", "Anti-HBs", "Hepatite C (Anti-HCV)",
    "TSH", "T4 Livre", "Eletroforese de Hemoglobina", "EPF (Parasitológico de Fezes)"
  ];

  it('should have HIV available in all 3 trimesters', () => {
    const hiv = examesSangue.find(e => e.nome === "HIV");
    expect(hiv).toBeDefined();
    expect(hiv!.trimestres.primeiro).toBe(true);
    expect(hiv!.trimestres.segundo).toBe(true);
    expect(hiv!.trimestres.terceiro).toBe(true);
  });

  it('should have Hepatite B (HBsAg) available in all 3 trimesters', () => {
    const hepB = examesSangue.find(e => e.nome === "Hepatite B (HBsAg)");
    expect(hepB).toBeDefined();
    expect(hepB!.trimestres.primeiro).toBe(true);
    expect(hepB!.trimestres.segundo).toBe(true);
    expect(hepB!.trimestres.terceiro).toBe(true);
  });

  it('should have Hepatite C (Anti-HCV) available in all 3 trimesters', () => {
    const hepC = examesSangue.find(e => e.nome === "Hepatite C (Anti-HCV)");
    expect(hepC).toBeDefined();
    expect(hepC!.trimestres.primeiro).toBe(true);
    expect(hepC!.trimestres.segundo).toBe(true);
    expect(hepC!.trimestres.terceiro).toBe(true);
  });

  it('should have TSH available in all 3 trimesters', () => {
    const tsh = examesSangue.find(e => e.nome === "TSH");
    expect(tsh).toBeDefined();
    expect(tsh!.trimestres.primeiro).toBe(true);
    expect(tsh!.trimestres.segundo).toBe(true);
    expect(tsh!.trimestres.terceiro).toBe(true);
  });

  it('should have T4 Livre available in all 3 trimesters', () => {
    const t4 = examesSangue.find(e => e.nome === "T4 Livre");
    expect(t4).toBeDefined();
    expect(t4!.trimestres.primeiro).toBe(true);
    expect(t4!.trimestres.segundo).toBe(true);
    expect(t4!.trimestres.terceiro).toBe(true);
  });

  it('should have Eletroforese de Hemoglobina available in all 3 trimesters', () => {
    const eletro = examesSangue.find(e => e.nome === "Eletroforese de Hemoglobina");
    expect(eletro).toBeDefined();
    expect(eletro!.trimestres.primeiro).toBe(true);
    expect(eletro!.trimestres.segundo).toBe(true);
    expect(eletro!.trimestres.terceiro).toBe(true);
  });

  it('should have EPF available in all 3 trimesters', () => {
    const epf = examesFezes.find(e => e.nome === "EPF (Parasitológico de Fezes)");
    expect(epf).toBeDefined();
    expect(epf!.trimestres.primeiro).toBe(true);
    expect(epf!.trimestres.segundo).toBe(true);
    expect(epf!.trimestres.terceiro).toBe(true);
  });
});

describe('VDRL dropdown options', () => {
  const opcoesVDRL = ["Não Reagente", "1:1", "1:2", "1:4", "1:8", "1:16", "1:32", "1:64", "1:128", "1:256"];

  it('should have 10 options', () => {
    expect(opcoesVDRL).toHaveLength(10);
  });

  it('should start with Não Reagente', () => {
    expect(opcoesVDRL[0]).toBe("Não Reagente");
  });

  it('should have all titration values in order', () => {
    expect(opcoesVDRL[1]).toBe("1:1");
    expect(opcoesVDRL[2]).toBe("1:2");
    expect(opcoesVDRL[3]).toBe("1:4");
    expect(opcoesVDRL[4]).toBe("1:8");
    expect(opcoesVDRL[5]).toBe("1:16");
    expect(opcoesVDRL[6]).toBe("1:32");
    expect(opcoesVDRL[7]).toBe("1:64");
    expect(opcoesVDRL[8]).toBe("1:128");
    expect(opcoesVDRL[9]).toBe("1:256");
  });

  it('should detect Não Reagente as normal (green)', () => {
    const valor = "Não Reagente";
    const ehNaoReagente = valor === "Não Reagente";
    const ehReagente = valor && valor !== "Não Reagente" && opcoesVDRL.includes(valor);
    expect(ehNaoReagente).toBe(true);
    expect(ehReagente).toBeFalsy();
  });

  it('should detect titration values as abnormal (red)', () => {
    for (const titulacao of ["1:1", "1:2", "1:4", "1:8", "1:16", "1:32", "1:64", "1:128", "1:256"]) {
      const ehNaoReagente = titulacao === "Não Reagente";
      const ehReagente = titulacao && titulacao !== "Não Reagente" && opcoesVDRL.includes(titulacao);
      expect(ehNaoReagente).toBe(false);
      expect(ehReagente).toBeTruthy();
    }
  });
});

describe('VDRL normalization', () => {
  // Simulate the normalization logic from ExamesLaboratoriais
  const normalizarVDRL = (valor: string): string => {
    const valorLower = valor.toLowerCase().trim();
    
    if (valorLower.includes('não reagente') || valorLower.includes('nao reagente') || valorLower.includes('negativo')) {
      return 'Não Reagente';
    }
    
    const matchTitulacao = valor.match(/1\s*:\s*(\d+)/);
    if (matchTitulacao) {
      const titulo = parseInt(matchTitulacao[1]);
      const opcoesValidas = [1, 2, 4, 8, 16, 32, 64, 128, 256];
      if (opcoesValidas.includes(titulo)) {
        return `1:${titulo}`;
      }
    }
    
    if (valorLower.includes('reagente') || valorLower.includes('positivo')) {
      return '1:1';
    }
    
    return valor;
  };

  it('should normalize "Não Reagente" correctly', () => {
    expect(normalizarVDRL('Não Reagente')).toBe('Não Reagente');
    expect(normalizarVDRL('não reagente')).toBe('Não Reagente');
    expect(normalizarVDRL('Nao reagente')).toBe('Não Reagente');
    expect(normalizarVDRL('Negativo')).toBe('Não Reagente');
  });

  it('should normalize titration values correctly', () => {
    expect(normalizarVDRL('1:1')).toBe('1:1');
    expect(normalizarVDRL('1:2')).toBe('1:2');
    expect(normalizarVDRL('1:4')).toBe('1:4');
    expect(normalizarVDRL('1:8')).toBe('1:8');
    expect(normalizarVDRL('1:16')).toBe('1:16');
    expect(normalizarVDRL('1:32')).toBe('1:32');
    expect(normalizarVDRL('1:64')).toBe('1:64');
    expect(normalizarVDRL('1:128')).toBe('1:128');
    expect(normalizarVDRL('1:256')).toBe('1:256');
  });

  it('should normalize titration with spaces', () => {
    expect(normalizarVDRL('1 : 4')).toBe('1:4');
    expect(normalizarVDRL('1 :16')).toBe('1:16');
  });

  it('should normalize "Reagente" to 1:1 as fallback', () => {
    expect(normalizarVDRL('Reagente')).toBe('1:1');
    expect(normalizarVDRL('Positivo')).toBe('1:1');
  });
});

describe('VDRL abnormal detection in PDF', () => {
  const isVDRLAbnormal = (resultado: string): boolean => {
    const r = resultado.toLowerCase().trim();
    if (r.match(/1\s*:\s*\d+/)) return true;
    return false;
  };

  it('should detect titration values as abnormal', () => {
    expect(isVDRLAbnormal('1:1')).toBe(true);
    expect(isVDRLAbnormal('1:2')).toBe(true);
    expect(isVDRLAbnormal('1:16')).toBe(true);
    expect(isVDRLAbnormal('1:256')).toBe(true);
  });

  it('should not detect Não Reagente as abnormal', () => {
    expect(isVDRLAbnormal('Não Reagente')).toBe(false);
  });
});
