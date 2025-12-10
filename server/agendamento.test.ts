import { describe, it, expect } from 'vitest';
import { calcularConsultasSugeridas } from './agendamento';

describe('Agendamento de Consultas', () => {
  it('deve calcular consultas sugeridas corretamente', () => {
    // DUM: 21/04/2025
    const dum = new Date(2025, 3, 21, 12, 0, 0); // Mês 3 = Abril (0-indexed)
    const dataPrimeira = new Date(2025, 4, 12, 12, 0, 0); // 12/05/2025
    
    const consultas = calcularConsultasSugeridas(dum, dataPrimeira);
    
    console.log('DUM:', dum.toISOString());
    console.log('Data Primeira:', dataPrimeira.toISOString());
    console.log('Número de consultas calculadas:', consultas.length);
    console.log('Primeiras 5 consultas:', consultas.slice(0, 5).map(c => ({
      data: c.dataAgendada.toISOString().split('T')[0],
      ig: `${c.igSemanas}s ${c.igDias}d`,
      exame: c.exameComplementar
    })));
    
    expect(consultas.length).toBeGreaterThan(0);
    expect(consultas[0].dataAgendada).toBeInstanceOf(Date);
  });
});
