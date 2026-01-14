import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { gestantes, resultadosExames } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Exames Laboratoriais - Urocultura com campos extras', () => {
  let testGestanteId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Criar gestante de teste
    const result = await db.insert(gestantes).values({
      userId: 1,
      nome: 'Teste Urocultura NaN',
      cpf: '98765432100',
      dataNascimento: '1990-01-01',
      telefone: '11999999999',
      endereco: 'Rua Teste',
      dum: '2024-01-01',
    });

    testGestanteId = Number(result[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    await db.delete(resultadosExames).where(eq(resultadosExames.gestanteId, testGestanteId));
    await db.delete(gestantes).where(eq(gestantes.id, testGestanteId));
  });

  it('deve filtrar campos extras de Urocultura (agente, antibiograma) e salvar apenas trimestres válidos', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Simular dados que viriam do frontend com campos extras
    const resultadosInput = {
      'Urocultura': {
        '1': 'Positiva',
        'agente_1': 'E. coli',
        'antibiograma_1': 'Sensível a Ciprofloxacino',
        'data1': '2025-10-02',
      }
    };

    // Processar como o servidor faria
    const resultadosParaInserir: any[] = [];
    
    for (const [nomeExame, valor] of Object.entries(resultadosInput)) {
      if (typeof valor === 'object' && valor !== null) {
        for (const [chave, resultado] of Object.entries(valor)) {
          // Verificar se a chave é um número de trimestre válido (1, 2 ou 3)
          const trimestreNum = parseInt(chave);
          if (isNaN(trimestreNum) || trimestreNum < 1 || trimestreNum > 3) {
            continue; // Pular chaves que não são trimestres válidos
          }
          
          if (resultado && resultado.trim() && resultado.trim() !== '?') {
            resultadosParaInserir.push({
              gestanteId: testGestanteId,
              nomeExame,
              trimestre: trimestreNum,
              resultado,
            });
          }
        }
      }
    }

    // Deve ter apenas 1 resultado (o trimestre 1 com "Positiva")
    expect(resultadosParaInserir).toHaveLength(1);
    expect(resultadosParaInserir[0].trimestre).toBe(1);
    expect(resultadosParaInserir[0].resultado).toBe('Positiva');
    expect(resultadosParaInserir[0].nomeExame).toBe('Urocultura');
    
    // Verificar que não há NaN
    expect(isNaN(resultadosParaInserir[0].trimestre)).toBe(false);

    // Inserir no banco
    await db.insert(resultadosExames).values(resultadosParaInserir);

    // Buscar e verificar
    const resultados = await db
      .select()
      .from(resultadosExames)
      .where(eq(resultadosExames.gestanteId, testGestanteId));

    expect(resultados).toHaveLength(1);
    expect(resultados[0].nomeExame).toBe('Urocultura');
    expect(resultados[0].trimestre).toBe(1);
    expect(resultados[0].resultado).toBe('Positiva');
  });

  it('deve ignorar chaves como obs_1, agente_1, antibiograma_1 ao processar resultados', async () => {
    // Simular dados com vários campos extras
    const resultadosInput = {
      'EAS (Urina tipo 1)': {
        '1': 'Alterado',
        'obs_1': 'Leucocitúria presente',
        '2': 'Normal',
        'obs_2': '',
      }
    };

    const resultadosParaInserir: any[] = [];
    
    for (const [nomeExame, valor] of Object.entries(resultadosInput)) {
      if (typeof valor === 'object' && valor !== null) {
        for (const [chave, resultado] of Object.entries(valor)) {
          const trimestreNum = parseInt(chave);
          if (isNaN(trimestreNum) || trimestreNum < 1 || trimestreNum > 3) {
            continue;
          }
          
          if (resultado && resultado.trim() && resultado.trim() !== '?') {
            resultadosParaInserir.push({
              nomeExame,
              trimestre: trimestreNum,
              resultado,
            });
          }
        }
      }
    }

    // Deve ter 2 resultados (trimestres 1 e 2)
    expect(resultadosParaInserir).toHaveLength(2);
    expect(resultadosParaInserir[0].trimestre).toBe(1);
    expect(resultadosParaInserir[0].resultado).toBe('Alterado');
    expect(resultadosParaInserir[1].trimestre).toBe(2);
    expect(resultadosParaInserir[1].resultado).toBe('Normal');
    
    // Nenhum deve ter NaN
    resultadosParaInserir.forEach(r => {
      expect(isNaN(r.trimestre)).toBe(false);
    });
  });
});
