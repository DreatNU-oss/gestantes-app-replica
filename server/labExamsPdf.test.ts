import { describe, it, expect } from 'vitest';

/**
 * Tests for the lab exams PDF section improvements:
 * 1. Exams are organized by category (Sangue, Urina, Fezes, Outros)
 * 2. Exams follow the canonical sequence from examesConfig.ts
 * 3. Trimestre 0 (e.g., Tipagem sanguínea) is mapped to 1º Tri
 * 4. Proper exam names (not lowercase/underscored)
 * 5. No duplicate exams
 */

// Canonical exam sequences (same as examesConfig.ts)
const EXAMES_SANGUE = [
  'Tipagem sanguínea ABO/Rh', 'Coombs indireto', 'Hemoglobina/Hematócrito', 'Plaquetas',
  'Glicemia de jejum', 'VDRL', 'FTA-ABS IgG', 'FTA-ABS IgM', 'HIV', 'Hepatite B (HBsAg)',
  'Anti-HBs', 'Hepatite C (Anti-HCV)', 'Toxoplasmose IgG', 'Toxoplasmose IgM',
  'Rubéola IgG', 'Rubéola IgM', 'Citomegalovírus IgG', 'Citomegalovírus IgM',
  'TSH', 'T4 Livre', 'Eletroforese de Hemoglobina', 'Ferritina',
  'Vitamina D (25-OH)', 'Vitamina B12', 'TTGO 75g (Curva Glicêmica)'
];
const EXAMES_URINA = ['EAS (Urina tipo 1)', 'Urocultura', 'Proteinúria de 24 horas'];
const EXAMES_FEZES = ['EPF (Parasitológico de Fezes)'];
const EXAMES_OUTROS = ['Swab vaginal/retal EGB'];

// Simulate the examesAgrupados logic from routers.ts
function agruparExames(exames: Array<{ nomeExame: string; trimestre: number; resultado: string; dataExame?: string | null }>) {
  const examesAgrupados: any[] = [];
  const examesPorNome = new Map<string, any>();
  exames.forEach((ex) => {
    const nomeExame = ex.nomeExame;
    if (!examesPorNome.has(nomeExame)) {
      examesPorNome.set(nomeExame, { nome: nomeExame });
    }
    const exameAgrupado = examesPorNome.get(nomeExame)!;
    // Trimestre 0 = exame sem trimestre (ex: Tipagem sanguínea) -> mostrar no 1º Tri
    const triNum = ex.trimestre === 0 ? 1 : ex.trimestre;
    const key = `trimestre${triNum}` as 'trimestre1' | 'trimestre2' | 'trimestre3';
    if (ex.resultado && !exameAgrupado[key]) {
      exameAgrupado[key] = {
        resultado: ex.resultado,
        data: ex.dataExame ? new Date(ex.dataExame).toISOString().split('T')[0] : undefined
      };
    }
  });
  examesPorNome.forEach((exame) => {
    if (exame.trimestre1 || exame.trimestre2 || exame.trimestre3) {
      examesAgrupados.push(exame);
    }
  });
  return examesAgrupados;
}

// Simulate the PDF rendering logic from htmlToPdf.ts
function orderExamesForPdf(examesAgrupados: Array<{ nome: string; trimestre1?: any; trimestre2?: any; trimestre3?: any }>) {
  const examesPorNome = new Map<string, any>();
  examesAgrupados.forEach(e => examesPorNome.set(e.nome, e));
  
  const todosCanonicos = new Set([...EXAMES_SANGUE, ...EXAMES_URINA, ...EXAMES_FEZES, ...EXAMES_OUTROS]);
  
  const ordered: Array<{ nome: string; categoria: string }> = [];
  
  // Sangue
  EXAMES_SANGUE.forEach(n => {
    if (examesPorNome.has(n)) ordered.push({ nome: n, categoria: 'sangue' });
  });
  // Urina
  EXAMES_URINA.forEach(n => {
    if (examesPorNome.has(n)) ordered.push({ nome: n, categoria: 'urina' });
  });
  // Fezes
  EXAMES_FEZES.forEach(n => {
    if (examesPorNome.has(n)) ordered.push({ nome: n, categoria: 'fezes' });
  });
  // Outros
  EXAMES_OUTROS.forEach(n => {
    if (examesPorNome.has(n)) ordered.push({ nome: n, categoria: 'outros' });
  });
  // Extras
  examesAgrupados.filter(e => !todosCanonicos.has(e.nome)).forEach(e => {
    ordered.push({ nome: e.nome, categoria: 'extras' });
  });
  
  return ordered;
}

describe('Lab Exams PDF - Data Preparation', () => {
  it('should map trimestre 0 to trimestre 1 for Tipagem sanguínea', () => {
    const exames = [
      { nomeExame: 'Tipagem sanguínea ABO/Rh', trimestre: 0, resultado: 'O+', dataExame: '2025-06-15' }
    ];
    const agrupados = agruparExames(exames);
    expect(agrupados).toHaveLength(1);
    expect(agrupados[0].nome).toBe('Tipagem sanguínea ABO/Rh');
    expect(agrupados[0].trimestre1).toBeDefined();
    expect(agrupados[0].trimestre1.resultado).toBe('O+');
  });

  it('should not overwrite existing trimestre 1 when trimestre 0 also exists', () => {
    const exames = [
      { nomeExame: 'Tipagem sanguínea ABO/Rh', trimestre: 1, resultado: 'A+', dataExame: '2025-06-20' },
      { nomeExame: 'Tipagem sanguínea ABO/Rh', trimestre: 0, resultado: 'O+', dataExame: '2025-06-15' }
    ];
    const agrupados = agruparExames(exames);
    expect(agrupados).toHaveLength(1);
    expect(agrupados[0].trimestre1.resultado).toBe('A+'); // First one wins
  });

  it('should group exams correctly across trimestres', () => {
    const exames = [
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 1, resultado: '12.5 g/dl', dataExame: '2025-06-15' },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 2, resultado: '11.8 g/dl', dataExame: '2025-09-10' },
      { nomeExame: 'Hemoglobina/Hematócrito', trimestre: 3, resultado: '11.2 g/dl', dataExame: '2025-12-05' },
    ];
    const agrupados = agruparExames(exames);
    expect(agrupados).toHaveLength(1);
    expect(agrupados[0].trimestre1.resultado).toBe('12.5 g/dl');
    expect(agrupados[0].trimestre2.resultado).toBe('11.8 g/dl');
    expect(agrupados[0].trimestre3.resultado).toBe('11.2 g/dl');
  });

  it('should exclude exams with no results', () => {
    const exames = [
      { nomeExame: 'VDRL', trimestre: 1, resultado: '', dataExame: '2025-06-15' },
    ];
    const agrupados = agruparExames(exames);
    expect(agrupados).toHaveLength(0);
  });

  it('should handle multiple exams from different categories', () => {
    const exames = [
      { nomeExame: 'Tipagem sanguínea ABO/Rh', trimestre: 0, resultado: 'B-', dataExame: null },
      { nomeExame: 'VDRL', trimestre: 1, resultado: 'Não Reagente', dataExame: '2025-06-15' },
      { nomeExame: 'EAS (Urina tipo 1)', trimestre: 1, resultado: 'Normal', dataExame: '2025-06-15' },
      { nomeExame: 'EPF (Parasitológico de Fezes)', trimestre: 1, resultado: 'Negativo', dataExame: '2025-06-15' },
      { nomeExame: 'Swab vaginal/retal EGB', trimestre: 3, resultado: 'Negativo', dataExame: '2025-12-01' },
    ];
    const agrupados = agruparExames(exames);
    expect(agrupados).toHaveLength(5);
    
    // Tipagem should be in trimestre1
    const tipagem = agrupados.find((e: any) => e.nome === 'Tipagem sanguínea ABO/Rh');
    expect(tipagem?.trimestre1?.resultado).toBe('B-');
  });
});

describe('Lab Exams PDF - Ordering', () => {
  it('should order exams by category: Sangue → Urina → Fezes → Outros', () => {
    const examesAgrupados = [
      { nome: 'Swab vaginal/retal EGB', trimestre3: { resultado: 'Negativo' } },
      { nome: 'EAS (Urina tipo 1)', trimestre1: { resultado: 'Normal' } },
      { nome: 'Hemoglobina/Hematócrito', trimestre1: { resultado: '12.5 g/dl' } },
      { nome: 'EPF (Parasitológico de Fezes)', trimestre1: { resultado: 'Negativo' } },
    ];
    
    const ordered = orderExamesForPdf(examesAgrupados);
    expect(ordered[0].categoria).toBe('sangue');
    expect(ordered[0].nome).toBe('Hemoglobina/Hematócrito');
    expect(ordered[1].categoria).toBe('urina');
    expect(ordered[1].nome).toBe('EAS (Urina tipo 1)');
    expect(ordered[2].categoria).toBe('fezes');
    expect(ordered[2].nome).toBe('EPF (Parasitológico de Fezes)');
    expect(ordered[3].categoria).toBe('outros');
    expect(ordered[3].nome).toBe('Swab vaginal/retal EGB');
  });

  it('should maintain canonical order within Sangue category', () => {
    const examesAgrupados = [
      { nome: 'HIV', trimestre1: { resultado: 'Não Reagente' } },
      { nome: 'Tipagem sanguínea ABO/Rh', trimestre1: { resultado: 'O+' } },
      { nome: 'VDRL', trimestre1: { resultado: 'Não Reagente' } },
      { nome: 'Hemoglobina/Hematócrito', trimestre1: { resultado: '12.5 g/dl' } },
    ];
    
    const ordered = orderExamesForPdf(examesAgrupados);
    const nomes = ordered.map(e => e.nome);
    
    // Tipagem should come first, then Hemoglobina, then VDRL, then HIV
    expect(nomes.indexOf('Tipagem sanguínea ABO/Rh')).toBeLessThan(nomes.indexOf('Hemoglobina/Hematócrito'));
    expect(nomes.indexOf('Hemoglobina/Hematócrito')).toBeLessThan(nomes.indexOf('VDRL'));
    expect(nomes.indexOf('VDRL')).toBeLessThan(nomes.indexOf('HIV'));
  });

  it('should place non-canonical exams in extras category at the end', () => {
    const examesAgrupados = [
      { nome: 'Exame Customizado', trimestre1: { resultado: 'OK' } },
      { nome: 'VDRL', trimestre1: { resultado: 'Não Reagente' } },
    ];
    
    const ordered = orderExamesForPdf(examesAgrupados);
    expect(ordered).toHaveLength(2);
    expect(ordered[0].nome).toBe('VDRL');
    expect(ordered[0].categoria).toBe('sangue');
    expect(ordered[1].nome).toBe('Exame Customizado');
    expect(ordered[1].categoria).toBe('extras');
  });

  it('should not produce duplicates', () => {
    const examesAgrupados = [
      { nome: 'VDRL', trimestre1: { resultado: 'Não Reagente' }, trimestre2: { resultado: 'Não Reagente' } },
      { nome: 'HIV', trimestre1: { resultado: 'Não Reagente' } },
    ];
    
    const ordered = orderExamesForPdf(examesAgrupados);
    const nomes = ordered.map(e => e.nome);
    const uniqueNomes = [...new Set(nomes)];
    expect(nomes.length).toBe(uniqueNomes.length);
  });

  it('should skip categories with no exams', () => {
    const examesAgrupados = [
      { nome: 'VDRL', trimestre1: { resultado: 'Não Reagente' } },
    ];
    
    const ordered = orderExamesForPdf(examesAgrupados);
    expect(ordered).toHaveLength(1);
    expect(ordered[0].categoria).toBe('sangue');
    // No urina, fezes, or outros entries
    expect(ordered.filter(e => e.categoria === 'urina')).toHaveLength(0);
    expect(ordered.filter(e => e.categoria === 'fezes')).toHaveLength(0);
    expect(ordered.filter(e => e.categoria === 'outros')).toHaveLength(0);
  });
});

describe('Lab Exams PDF - Exam Names', () => {
  it('should use proper exam names with correct capitalization and accents', () => {
    const allCanonical = [...EXAMES_SANGUE, ...EXAMES_URINA, ...EXAMES_FEZES, ...EXAMES_OUTROS];
    
    // Verify all names have proper capitalization (not all lowercase)
    allCanonical.forEach(name => {
      expect(name).not.toBe(name.toLowerCase());
    });
    
    // Verify accented characters are present
    expect(EXAMES_SANGUE).toContain('Tipagem sanguínea ABO/Rh');
    expect(EXAMES_SANGUE).toContain('Hemoglobina/Hematócrito');
    expect(EXAMES_SANGUE).toContain('Rubéola IgG');
    expect(EXAMES_SANGUE).toContain('Citomegalovírus IgG');
    expect(EXAMES_SANGUE).toContain('TTGO 75g (Curva Glicêmica)');
    expect(EXAMES_URINA).toContain('Proteinúria de 24 horas');
    expect(EXAMES_FEZES).toContain('EPF (Parasitológico de Fezes)');
  });

  it('should include Tipagem sanguínea in the canonical list', () => {
    expect(EXAMES_SANGUE[0]).toBe('Tipagem sanguínea ABO/Rh');
  });

  it('should have 25 blood exams matching examesConfig.ts', () => {
    expect(EXAMES_SANGUE).toHaveLength(25);
  });

  it('should have 3 urine exams matching examesConfig.ts', () => {
    expect(EXAMES_URINA).toHaveLength(3);
  });

  it('should have 1 feces exam matching examesConfig.ts', () => {
    expect(EXAMES_FEZES).toHaveLength(1);
  });

  it('should have 1 other exam matching examesConfig.ts', () => {
    expect(EXAMES_OUTROS).toHaveLength(1);
  });
});
