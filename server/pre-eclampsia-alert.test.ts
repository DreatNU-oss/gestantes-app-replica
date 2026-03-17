import { describe, it, expect } from 'vitest';
import fs from 'fs';

const COMPONENT_PATH = '/home/ubuntu/gestantes-app-replica/client/src/components/FatoresRiscoManager.tsx';

describe('Alerta Pré-eclâmpsia sem AAS', () => {
  const source = fs.readFileSync(COMPONENT_PATH, 'utf-8');

  it('deve definir os fatores de risco associados a pré-eclâmpsia', () => {
    expect(source).toContain('FATORES_PRE_ECLAMPSIA');
    expect(source).toContain("'fator_preditivo_dheg'");
    expect(source).toContain("'historico_familiar_dheg'");
    expect(source).toContain("'hipertensao'");
    expect(source).toContain("'sobrepeso_obesidade'");
    expect(source).toContain("'trombofilia'");
    expect(source).toContain("'gemelar'");
  });

  it('deve buscar medicamentos da gestante via trpc', () => {
    expect(source).toContain('trpc.medicamentos.list.useQuery');
    expect(source).toContain('medicamentosGestante');
  });

  it('deve verificar se gestante usa AAS ativo', () => {
    expect(source).toContain("m.tipo === 'aas'");
    expect(source).toContain('m.ativo === 1');
  });

  it('deve calcular alertaAAS como risco de PE sem AAS', () => {
    expect(source).toContain('temRiscoPreEclampsia && !usaAAS');
    expect(source).toContain('alertaAAS');
  });

  it('deve exibir alerta visual com texto correto', () => {
    expect(source).toContain('Gestante com risco de pré-eclâmpsia sem AAS prescrito');
    expect(source).toContain('não está usando AAS');
    expect(source).toContain('Considere prescrever AAS 100-150mg/dia');
  });

  it('deve exibir os fatores de risco específicos no alerta', () => {
    expect(source).toContain('fatoresPreEclampsia.map(f => fatoresRiscoLabels[f.tipo]');
  });

  it('deve usar ícones ShieldAlert e Pill no alerta', () => {
    expect(source).toContain('ShieldAlert');
    expect(source).toContain('Pill');
  });

  it('hooks devem estar antes do early return (regra dos hooks)', () => {
    const earlyReturnIndex = source.indexOf('if (isLoading) {');
    const medicamentosQueryIndex = source.indexOf('trpc.medicamentos.list.useQuery');
    // O hook de medicamentos deve estar ANTES do early return
    expect(medicamentosQueryIndex).toBeLessThan(earlyReturnIndex);
  });

  it('todos os useMemo devem estar antes do early return (regra dos hooks)', () => {
    const earlyReturnIndex = source.indexOf('if (isLoading) {');
    const fatoresAtivosIndex = source.indexOf('const fatoresAtivos = useMemo');
    const fatoresPreEclampsiaIndex = source.indexOf('const fatoresPreEclampsia = useMemo');
    const usaAASIndex = source.indexOf('const usaAAS = useMemo');
    // Todos os useMemo devem estar ANTES do early return
    expect(fatoresAtivosIndex).toBeLessThan(earlyReturnIndex);
    expect(fatoresPreEclampsiaIndex).toBeLessThan(earlyReturnIndex);
    expect(usaAASIndex).toBeLessThan(earlyReturnIndex);
  });
});
