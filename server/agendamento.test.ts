import { describe, it, expect } from 'vitest';
import { calcularConsultasSugeridas } from './agendamento';

/**
 * Helper: cria uma data N dias no futuro a partir de hoje.
 */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Helper: cria uma DUM que resulte na IG desejada (em semanas) na data fornecida.
 * IG = (dataRef - DUM) / 7
 * DUM = dataRef - (igSemanas * 7 dias)
 */
function dumParaIG(igSemanas: number, dataRef: Date): Date {
  const dum = new Date(dataRef);
  dum.setDate(dum.getDate() - igSemanas * 7);
  return dum;
}

describe('Agendamento de Consultas', () => {
  it('deve calcular segunda consulta em ~1 mês quando primeira consulta é até 28 semanas', () => {
    // Primeira consulta amanhã, com IG de 27 semanas
    const primeiraConsulta = daysFromNow(1);
    const dum = dumParaIG(27, primeiraConsulta);
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    expect(consultas.length).toBeGreaterThan(0);
    
    const segundaConsulta = consultas[0];
    const diffDias = Math.floor(
      (segundaConsulta.dataAgendada.getTime() - primeiraConsulta.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Deve estar entre 28-37 dias (considerando ajuste para seg/ter/qua + possível feriado)
    expect(diffDias).toBeGreaterThanOrEqual(28);
    expect(diffDias).toBeLessThanOrEqual(37);
    
    // Deve ser segunda, terça ou quarta-feira
    const diaSemana = segundaConsulta.dataAgendada.getDay();
    expect([1, 2, 3]).toContain(diaSemana);
  });

  it('deve calcular segunda consulta quinzenalmente quando primeira consulta é entre 29-35 semanas', () => {
    // Primeira consulta amanhã, com IG de 33 semanas
    const primeiraConsulta = daysFromNow(1);
    const dum = dumParaIG(33, primeiraConsulta);
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    expect(consultas.length).toBeGreaterThan(0);
    
    const segundaConsulta = consultas[0];
    const diffDias = Math.floor(
      (segundaConsulta.dataAgendada.getTime() - primeiraConsulta.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Deve estar entre 12-20 dias (considerando ajuste para seg/ter/qua + possível feriado)
    expect(diffDias).toBeGreaterThanOrEqual(12);
    expect(diffDias).toBeLessThanOrEqual(20);
  });

  it('deve calcular segunda consulta semanalmente quando primeira consulta é após 36 semanas', () => {
    // Primeira consulta amanhã, com IG de 37 semanas
    const primeiraConsulta = daysFromNow(1);
    const dum = dumParaIG(37, primeiraConsulta);
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    expect(consultas.length).toBeGreaterThan(0);
    
    const segundaConsulta = consultas[0];
    const diffDias = Math.floor(
      (segundaConsulta.dataAgendada.getTime() - primeiraConsulta.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Deve estar entre 5-14 dias (considerando ajuste para seg/ter/qua + possível feriado)
    expect(diffDias).toBeGreaterThanOrEqual(5);
    expect(diffDias).toBeLessThanOrEqual(14);
  });

  it('NÃO deve incluir a primeira consulta na rotina (usuário já agendou)', () => {
    const primeiraConsulta = daysFromNow(1);
    const dum = dumParaIG(27, primeiraConsulta);
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    // Nenhuma consulta deve ter a mesma data da primeira
    const temPrimeiraConsulta = consultas.some(c => 
      c.dataAgendada.toISOString().split('T')[0] === primeiraConsulta.toISOString().split('T')[0]
    );
    
    expect(temPrimeiraConsulta).toBe(false);
  });

  it('todas as consultas devem ser em seg/ter/qua', () => {
    const primeiraConsulta = daysFromNow(1);
    const dum = dumParaIG(27, primeiraConsulta);
    
    const consultas = calcularConsultasSugeridas(dum, primeiraConsulta);
    
    consultas.forEach(consulta => {
      const diaSemana = consulta.dataAgendada.getDay();
      expect([1, 2, 3]).toContain(diaSemana);
    });
  });
});
