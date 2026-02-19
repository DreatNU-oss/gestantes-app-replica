import { describe, it, expect } from 'vitest';
import { calcularConsultasSugeridas } from './agendamento';

describe('Agendamento de Consultas', () => {
  it('deve calcular segunda consulta em ~1 mês quando primeira consulta é até 28 semanas', () => {
    // Gestante com DUM em 2025-06-01 (hoje seria ~27 semanas)
    const dum = new Date('2025-06-01');
    // Primeira consulta em 2025-12-15 (27 semanas de gestação)
    const primeiraConsulta = new Date('2025-12-15');
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    // Deve retornar consultas (segunda em diante, não incluindo a primeira)
    expect(consultas.length).toBeGreaterThan(0);
    
    // A primeira consulta retornada é na verdade a SEGUNDA consulta
    const segundaConsulta = consultas[0];
    
    // Deve estar aproximadamente 30 dias após a primeira
    const diffDias = Math.floor(
      (segundaConsulta.dataAgendada.getTime() - primeiraConsulta.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    console.log('Teste 1 - Segunda consulta:', {
      primeiraConsulta: primeiraConsulta.toISOString().split('T')[0],
      segundaConsulta: segundaConsulta.dataAgendada.toISOString().split('T')[0],
      diffDias,
      ig: `${segundaConsulta.igSemanas}s ${segundaConsulta.igDias}d`
    });
    
    // Deve estar entre 28-35 dias (considerando ajuste para seg/ter/qua)
    expect(diffDias).toBeGreaterThanOrEqual(28);
    expect(diffDias).toBeLessThanOrEqual(35);
    
    // Deve ser segunda, terça ou quarta-feira
    const diaSemana = segundaConsulta.dataAgendada.getDay();
    expect([1, 2, 3]).toContain(diaSemana);
  });

  it('deve calcular segunda consulta quinzenalmente quando primeira consulta é entre 29-35 semanas', () => {
    // Gestante com DUM em 2025-05-01 (hoje seria ~33 semanas)
    const dum = new Date('2025-05-01');
    // Primeira consulta em 2025-12-15 (33 semanas de gestação)
    const primeiraConsulta = new Date('2025-12-15');
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    expect(consultas.length).toBeGreaterThan(0);
    
    const segundaConsulta = consultas[0];
    
    // Deve estar aproximadamente 14 dias após a primeira
    const diffDias = Math.floor(
      (segundaConsulta.dataAgendada.getTime() - primeiraConsulta.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    console.log('Teste 2 - Segunda consulta:', {
      primeiraConsulta: primeiraConsulta.toISOString().split('T')[0],
      segundaConsulta: segundaConsulta.dataAgendada.toISOString().split('T')[0],
      diffDias,
      ig: `${segundaConsulta.igSemanas}s ${segundaConsulta.igDias}d`
    });
    
    // Deve estar entre 12-17 dias (considerando ajuste para seg/ter/qua)
    expect(diffDias).toBeGreaterThanOrEqual(12);
    expect(diffDias).toBeLessThanOrEqual(17);
  });

  it('deve calcular segunda consulta semanalmente quando primeira consulta é após 36 semanas', () => {
    // Gestante com DUM em 2025-03-15 (hoje seria ~39 semanas)
    const dum = new Date('2025-03-15');
    // Primeira consulta em 2025-12-15 (39 semanas de gestação)
    const primeiraConsulta = new Date('2025-12-15');
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    expect(consultas.length).toBeGreaterThan(0);
    
    const segundaConsulta = consultas[0];
    
    // Deve estar aproximadamente 7 dias após a primeira
    const diffDias = Math.floor(
      (segundaConsulta.dataAgendada.getTime() - primeiraConsulta.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    console.log('Teste 3 - Segunda consulta:', {
      primeiraConsulta: primeiraConsulta.toISOString().split('T')[0],
      segundaConsulta: segundaConsulta.dataAgendada.toISOString().split('T')[0],
      diffDias,
      ig: `${segundaConsulta.igSemanas}s ${segundaConsulta.igDias}d`
    });
    
    // Deve estar entre 5-10 dias (considerando ajuste para seg/ter/qua)
    expect(diffDias).toBeGreaterThanOrEqual(5);
    expect(diffDias).toBeLessThanOrEqual(10);
  });

  it('NÃO deve incluir a primeira consulta na rotina (usuário já agendou)', () => {
    const dum = new Date('2025-06-01');
    const primeiraConsulta = new Date('2025-12-15');
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    // Nenhuma consulta deve ter a mesma data da primeira
    const temPrimeiraConsulta = consultas.some(c => 
      c.dataAgendada.toISOString().split('T')[0] === primeiraConsulta.toISOString().split('T')[0]
    );
    
    expect(temPrimeiraConsulta).toBe(false);
  });

  it('todas as consultas devem ser em seg/ter/qua', () => {
    const dum = new Date('2025-06-01');
    const primeiraConsulta = new Date('2025-12-15');
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    consultas.forEach(consulta => {
      const diaSemana = consulta.dataAgendada.getDay();
      expect([1, 2, 3]).toContain(diaSemana);
    });
  });
});
