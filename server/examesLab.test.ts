import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { gestantes, resultadosExames } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Exames Laboratoriais - Persistência de Resultados', () => {
  let testGestanteId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Criar gestante de teste
    const [gestante] = await db.insert(gestantes).values({
      userId: 1, // ID do usuário de teste
      nome: 'Gestante Teste Exames',
      telefone: '(11) 99999-9999',
      email: 'teste.exames@test.com',
      dum: '2024-01-01',
      gesta: 1,
      para: 0,
      medicoId: 1,
      planoSaudeId: 1,
    });
    testGestanteId = gestante.insertId as number;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    await db.delete(resultadosExames).where(eq(resultadosExames.gestanteId, testGestanteId));
    await db.delete(gestantes).where(eq(gestantes.id, testGestanteId));
  });

  it('deve salvar resultados de exames com sucesso', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Inserir resultados de teste
    await db.insert(resultadosExames).values([
      {
        gestanteId: testGestanteId,
        nomeExame: 'Hemoglobina/Hematócrito',
        trimestre: 1,
        resultado: '12.5 g/dL / 37%',
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'Tipagem sanguínea ABO/Rh',
        trimestre: 1,
        resultado: 'O+',
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'TTGO-Jejum',
        trimestre: 2,
        resultado: '85 mg/dL',
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'TTGO-1h',
        trimestre: 2,
        resultado: '140 mg/dL',
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'TTGO-2h',
        trimestre: 2,
        resultado: '110 mg/dL',
      },
    ]);

    // Verificar se foram salvos
    const resultados = await db.select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    expect(resultados).toHaveLength(5);
  });

  it('deve recuperar resultados por gestante', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const resultados = await db.select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    expect(resultados.length).toBeGreaterThan(0);
    
    // Verificar estrutura dos resultados
    const primeiroResultado = resultados[0];
    expect(primeiroResultado).toHaveProperty('id');
    expect(primeiroResultado).toHaveProperty('gestanteId');
    expect(primeiroResultado).toHaveProperty('nomeExame');
    expect(primeiroResultado).toHaveProperty('trimestre');
    expect(primeiroResultado).toHaveProperty('resultado');
  });

  it('deve recuperar resultados de exame específico por trimestre', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const resultados = await db.select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    // Filtrar Hemoglobina do 1º trimestre
    const hemoglobina1Tri = resultados.find(
      r => r.nomeExame === 'Hemoglobina/Hematócrito' && r.trimestre === 1
    );

    expect(hemoglobina1Tri).toBeDefined();
    expect(hemoglobina1Tri?.resultado).toBe('12.5 g/dL / 37%');
  });

  it('deve salvar campo de observações (texto livre)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(resultadosExames).values({
      gestanteId: testGestanteId,
      nomeExame: 'outros_observacoes',
      trimestre: 0, // Trimestre 0 para observações gerais
      resultado: 'Paciente apresentou leve anemia. Suplementação de ferro prescrita.',
    });

    const resultados = await db.select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    const observacoes = resultados.find(r => r.nomeExame === 'outros_observacoes');
    expect(observacoes).toBeDefined();
    expect(observacoes?.trimestre).toBe(0);
    expect(observacoes?.resultado).toContain('anemia');
  });

  it('deve permitir atualização de resultados (delete + insert)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Deletar resultados anteriores
    await db.delete(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    // Inserir novos resultados
    await db.insert(resultadosExames).values({
      gestanteId: testGestanteId,
      nomeExame: 'Hemoglobina/Hematócrito',
      trimestre: 2,
      resultado: '13.0 g/dL / 39%', // Valor atualizado
    });

    const resultados = await db.select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    expect(resultados).toHaveLength(1);
    expect(resultados[0].resultado).toBe('13.0 g/dL / 39%');
    expect(resultados[0].trimestre).toBe(2);
  });

  it('deve salvar TTGO com 3 subcampos separadamente', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Limpar dados anteriores
    await db.delete(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    // Inserir TTGO com 3 subcampos
    await db.insert(resultadosExames).values([
      {
        gestanteId: testGestanteId,
        nomeExame: 'TTGO-Jejum',
        trimestre: 2,
        resultado: '85 mg/dL',
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'TTGO-1h',
        trimestre: 2,
        resultado: '140 mg/dL',
      },
      {
        gestanteId: testGestanteId,
        nomeExame: 'TTGO-2h',
        trimestre: 2,
        resultado: '110 mg/dL',
      },
    ]);

    const resultados = await db.select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    const ttgoResultados = resultados.filter(r => r.nomeExame.startsWith('TTGO-'));
    expect(ttgoResultados).toHaveLength(3);
    
    const jejum = ttgoResultados.find(r => r.nomeExame === 'TTGO-Jejum');
    const h1 = ttgoResultados.find(r => r.nomeExame === 'TTGO-1h');
    const h2 = ttgoResultados.find(r => r.nomeExame === 'TTGO-2h');

    expect(jejum?.resultado).toBe('85 mg/dL');
    expect(h1?.resultado).toBe('140 mg/dL');
    expect(h2?.resultado).toBe('110 mg/dL');
  });
});
