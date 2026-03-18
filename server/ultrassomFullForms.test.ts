import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Ultrassom Full Forms Display', () => {
  const ultrassonsPage = readFileSync(
    join(__dirname, '../client/src/pages/Ultrassons.tsx'),
    'utf-8'
  );
  const formularioSalvo = readFileSync(
    join(__dirname, '../client/src/components/UltrassomFormularioSalvo.tsx'),
    'utf-8'
  );

  it('should NOT use UltrassomRegistrosSalvos compact list anymore', () => {
    // The old compact list component should not be used
    expect(ultrassonsPage).not.toContain('<UltrassomRegistrosSalvos');
  });

  it('should import UltrassomFormularioSalvo component', () => {
    expect(ultrassonsPage).toContain("import { UltrassomFormularioSalvo }");
  });

  it('should render UltrassomFormularioSalvo for all 6 ultrasound types', () => {
    const types = [
      'primeiro_ultrassom',
      'morfologico_1tri',
      'ultrassom_obstetrico',
      'morfologico_2tri',
      'ecocardiograma_fetal',
      'ultrassom_seguimento',
    ];
    types.forEach(tipo => {
      const regex = new RegExp(`getUltrassonsPorTipo\\('${tipo}'\\)\\.map`);
      expect(ultrassonsPage).toMatch(regex);
    });
  });

  it('should sort ultrassons chronologically (oldest first)', () => {
    // The sort should use ascending date order (a - b)
    expect(ultrassonsPage).toContain('.sort((a: any, b: any)');
    // Should sort by dataExame ascending (oldest first)
    const sortMatch = ultrassonsPage.match(/\.sort\(\(a: any, b: any\)[^)]*\)/s);
    expect(sortMatch).toBeTruthy();
  });

  it('UltrassomFormularioSalvo should render full form fields', () => {
    // Should have Label and Input components for form fields
    expect(formularioSalvo).toContain('<Label>');
    expect(formularioSalvo).toContain('<Input');
    // Should have save button
    expect(formularioSalvo).toContain('Atualizar');
    // Should have delete button
    expect(formularioSalvo).toContain('Apagar');
  });

  it('UltrassomFormularioSalvo should track dirty state for modifications', () => {
    expect(formularioSalvo).toContain('isDirty');
    expect(formularioSalvo).toContain('setIsDirty');
    // Save button should only show when dirty
    expect(formularioSalvo).toContain('{isDirty && (');
  });

  it('UltrassomFormularioSalvo should pass _editingId when saving', () => {
    expect(formularioSalvo).toContain('_editingId: registro.id');
  });

  it('should have handleSalvarRegistroSalvo function for saved records', () => {
    expect(ultrassonsPage).toContain('handleSalvarRegistroSalvo');
  });

  it('should show "Novo" label before the empty form for each type', () => {
    expect(ultrassonsPage).toContain('Novo 1º Ultrassom');
    expect(ultrassonsPage).toContain('Novo Morfológico 1º Tri');
    expect(ultrassonsPage).toContain('Novo US Obstétrico');
    expect(ultrassonsPage).toContain('Novo Morfológico 2º Tri');
    expect(ultrassonsPage).toContain('Novo Ecocardiograma');
    expect(ultrassonsPage).toContain('Novo US Seguimento');
  });

  it('should show separator between saved records and new form', () => {
    // Each type should have a separator when there are saved records
    const separatorCount = (ultrassonsPage.match(/Separator className="my-4"/g) || []).length;
    expect(separatorCount).toBeGreaterThanOrEqual(6);
  });
});
