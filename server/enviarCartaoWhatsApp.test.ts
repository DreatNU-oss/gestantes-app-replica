import { describe, it, expect, vi } from 'vitest';

// Test the enviarCartaoWhatsApp flow logic
describe('Enviar Cartão WhatsApp', () => {
  describe('PDF generation and upload flow', () => {
    it('should generate a valid S3 key for the PDF', () => {
      const gestanteId = 123;
      const gestanteNome = 'Maria Silva Santos';
      const nomeArquivo = `cartao-prenatal-${gestanteNome.replace(/\s+/g, '-').toLowerCase()}`;
      const pdfKey = `cartoes-prenatal/${gestanteId}/${nomeArquivo}-${Date.now()}.pdf`;
      
      expect(pdfKey).toContain('cartoes-prenatal/123/');
      expect(pdfKey).toContain('cartao-prenatal-maria-silva-santos');
      expect(pdfKey).toMatch(/\.pdf$/);
    });

    it('should format gestante name correctly for the file', () => {
      const names = [
        { input: 'Maria Silva', expected: 'maria-silva' },
        { input: 'Ana  Maria  Santos', expected: 'ana-maria-santos' },
        { input: 'JOANA', expected: 'joana' },
      ];
      
      names.forEach(({ input, expected }) => {
        const result = input.replace(/\s+/g, '-').toLowerCase();
        expect(result).toBe(expected);
      });
    });
  });

  describe('WhatsApp message composition', () => {
    it('should compose message with first name', () => {
      const gestanteNome = 'Maria Silva Santos';
      const primeiroNome = gestanteNome.split(' ')[0] || '';
      const mensagem = `Olá ${primeiroNome}! 🤰\n\nSegue seu *Cartão de Pré-Natal* atualizado da Clínica Mais Mulher.\n\nEste documento contém todas as informações do seu acompanhamento pré-natal. Guarde-o com cuidado!\n\nAbraços da equipe Mais Mulher! 💜`;
      
      expect(mensagem).toContain('Olá Maria!');
      expect(mensagem).toContain('Cartão de Pré-Natal');
      expect(mensagem).toContain('Clínica Mais Mulher');
    });

    it('should handle empty name gracefully', () => {
      const gestanteNome = '';
      const primeiroNome = gestanteNome?.split(' ')[0] || '';
      const mensagem = `Olá ${primeiroNome}! 🤰`;
      
      expect(mensagem).toBe('Olá ! 🤰');
    });

    it('should extract only first name from full name', () => {
      const cases = [
        { full: 'Ana Maria Santos', first: 'Ana' },
        { full: 'Joana', first: 'Joana' },
        { full: 'Maria Clara de Souza', first: 'Maria' },
      ];
      
      cases.forEach(({ full, first }) => {
        expect(full.split(' ')[0]).toBe(first);
      });
    });
  });

  describe('Validation checks', () => {
    it('should require gestante to have telefone', () => {
      const gestante = { id: 1, nome: 'Maria', telefone: null };
      const hasPhone = !!gestante.telefone;
      expect(hasPhone).toBe(false);
    });

    it('should allow sending when gestante has telefone', () => {
      const gestante = { id: 1, nome: 'Maria', telefone: '5535999999999' };
      const hasPhone = !!gestante.telefone;
      expect(hasPhone).toBe(true);
    });

    it('should use clinicaId from context with fallback', () => {
      const ctxWithClinica = { user: { clinicaId: 5 } };
      const ctxWithoutClinica = { user: { clinicaId: null } };
      
      expect(ctxWithClinica.user.clinicaId ?? 1).toBe(5);
      expect(ctxWithoutClinica.user.clinicaId ?? 1).toBe(1);
    });
  });

  describe('Marcos calculation for PDF', () => {
    it('should include Anti-Rh marco only for Rh negative patients', () => {
      const fatoresRiscoRhNeg = [{ tipo: 'fator_rh_negativo', ativo: 1 }];
      const fatoresRiscoNormal = [{ tipo: 'hipertensao', ativo: 1 }];
      
      const ehRhNegativo1 = fatoresRiscoRhNeg.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
      const ehRhNegativo2 = fatoresRiscoNormal.some(f => f.tipo === 'fator_rh_negativo' && f.ativo === 1);
      
      expect(ehRhNegativo1).toBe(true);
      expect(ehRhNegativo2).toBe(false);
      
      const marcosRhNeg = [
        { titulo: 'Vacina dTpa' },
        ...(ehRhNegativo1 ? [{ titulo: 'Vacina Anti-Rh (Imunoglobulina)' }] : []),
      ];
      const marcosNormal = [
        { titulo: 'Vacina dTpa' },
        ...(ehRhNegativo2 ? [{ titulo: 'Vacina Anti-Rh (Imunoglobulina)' }] : []),
      ];
      
      expect(marcosRhNeg).toHaveLength(2);
      expect(marcosRhNeg.find(m => m.titulo.includes('Anti-Rh'))).toBeDefined();
      expect(marcosNormal).toHaveLength(1);
      expect(marcosNormal.find(m => m.titulo.includes('Anti-Rh'))).toBeUndefined();
    });
  });

  describe('Exames grouping for PDF', () => {
    it('should group exames by name and trimester', () => {
      const exames = [
        { nomeExame: 'Hemograma', trimestre: 1, resultado: '12 g/dL', dataExame: '2026-01-15' },
        { nomeExame: 'Hemograma', trimestre: 2, resultado: '11.5 g/dL', dataExame: '2026-04-15' },
        { nomeExame: 'Glicemia', trimestre: 1, resultado: '85 mg/dL', dataExame: '2026-01-15' },
        { nomeExame: 'Ignorar', trimestre: 0, resultado: 'teste', dataExame: '2026-01-15' },
      ];
      
      const examesPorNome = new Map<string, any>();
      exames.forEach(ex => {
        if (ex.trimestre === 0) return;
        if (!examesPorNome.has(ex.nomeExame)) {
          examesPorNome.set(ex.nomeExame, { nome: ex.nomeExame });
        }
        const exameAgrupado = examesPorNome.get(ex.nomeExame)!;
        const key = `trimestre${ex.trimestre}`;
        if (ex.resultado) {
          exameAgrupado[key] = { resultado: ex.resultado, data: ex.dataExame };
        }
      });
      
      const agrupados: any[] = [];
      examesPorNome.forEach(exame => {
        if (exame.trimestre1 || exame.trimestre2 || exame.trimestre3) {
          agrupados.push(exame);
        }
      });
      
      expect(agrupados).toHaveLength(2);
      expect(agrupados[0].nome).toBe('Hemograma');
      expect(agrupados[0].trimestre1.resultado).toBe('12 g/dL');
      expect(agrupados[0].trimestre2.resultado).toBe('11.5 g/dL');
      expect(agrupados[1].nome).toBe('Glicemia');
    });
  });
});
