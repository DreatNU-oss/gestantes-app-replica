import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { gestantes, resultadosExames } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Exames Laboratoriais - Data de Coleta', () => {
  let testGestanteId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Criar gestante de teste
    const result = await db.insert(gestantes).values({
      userId: 1,
      nome: 'Teste Data Coleta',
      cpf: '12345678900',
      dataNascimento: '1990-01-01',
      telefone: '11999999999',
      endereco: 'Rua Teste',
      dum: '2024-01-01',
    });

    // MySQL retorna insertId como bigint
    testGestanteId = Number(result[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    await db.delete(resultadosExames).where(eq(resultadosExames.gestanteId, testGestanteId));
    await db.delete(gestantes).where(eq(gestantes.id, testGestanteId));
  });

  it('deve salvar data de coleta junto com resultado do exame', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const dataColeta = '2025-12-10';

    // Inserir resultado com data
    await db.insert(resultadosExames).values({
      gestanteId: testGestanteId,
      nomeExame: 'Hemoglobina/Hematócrito',
      trimestre: 1,
      resultado: '12.5 g/dL',
      dataExame: dataColeta,
    });

    // Buscar resultado
    const [resultado] = await db
      .select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    expect(resultado).toBeDefined();
    expect(resultado.nomeExame).toBe('Hemoglobina/Hematócrito');
    expect(resultado.resultado).toBe('12.5 g/dL');
    expect(resultado.dataExame).toBeInstanceOf(Date);
    expect(resultado.dataExame?.toISOString().split('T')[0]).toBe('2025-12-10');
  });

  it('deve permitir salvar resultado sem data de coleta', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Inserir resultado sem data
    await db.insert(resultadosExames).values({
      gestanteId: testGestanteId,
      nomeExame: 'Glicemia de jejum',
      trimestre: 1,
      resultado: '85 mg/dL',
      dataExame: null,
    });

    // Buscar resultado
    const resultados = await db
      .select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    const glicemia = resultados.find(r => r.nomeExame === 'Glicemia de jejum');

    expect(glicemia).toBeDefined();
    expect(glicemia?.resultado).toBe('85 mg/dL');
    expect(glicemia?.dataExame).toBeNull();
  });

  it('deve manter a mesma data para múltiplos trimestres do mesmo exame', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const dataColeta = '2025-11-15';

    // Inserir resultados de diferentes trimestres com a mesma data
    await db.insert(resultadosExames).values([
      {
        gestanteId: testGestanteId,
        nomeExame: 'VDRL',
        trimestre: 1,
        resultado: 'Não reagente',
        dataExame: dataColeta,
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'VDRL',
        trimestre: 2,
        resultado: 'Não reagente',
        dataExame: dataColeta,
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'VDRL',
        trimestre: 3,
        resultado: 'Não reagente',
        dataExame: dataColeta,
      },
    ]);

    // Buscar todos os resultados de VDRL
    const resultados = await db
      .select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    const vdrlResults = resultados.filter(r => r.nomeExame === 'VDRL');

    expect(vdrlResults).toHaveLength(3);
    vdrlResults.forEach(resultado => {
      expect(resultado.dataExame).toBeInstanceOf(Date);
      expect(resultado.dataExame?.toISOString().split('T')[0]).toBe('2025-11-15');
    });
  });

  it('deve atualizar data de coleta ao salvar novamente', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const dataPrimeira = '2025-10-01';
    const dataSegunda = '2025-12-01';

    // Inserir resultado com primeira data
    await db.insert(resultadosExames).values({
      gestanteId: testGestanteId,
      nomeExame: 'Plaquetas',
      trimestre: 1,
      resultado: '250.000',
      dataExame: dataPrimeira,
    });

    // Deletar e reinserir com nova data (simulando update)
    await db.delete(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    await db.insert(resultadosExames).values({
      gestanteId: testGestanteId,
      nomeExame: 'Plaquetas',
      trimestre: 1,
      resultado: '260.000',
      dataExame: dataSegunda,
    });

    // Buscar resultado atualizado
    const [resultado] = await db
      .select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    expect(resultado.resultado).toBe('260.000');
    expect(resultado.dataExame?.toISOString().split('T')[0]).toBe('2025-12-01');
  });
});
