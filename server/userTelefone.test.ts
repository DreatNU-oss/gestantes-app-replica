import { describe, it, expect } from 'vitest';
import { replaceTemplateVariables, type GestanteContext } from './whatsapp';

describe('Campo Telefone de Usuário', () => {
  describe('replaceTemplateVariables - {telefone_medico}', () => {
    const baseContext: GestanteContext = {
      nome: 'Maria Silva',
      telefone: '5535991375232',
      igSemanas: 28,
      igDias: 3,
      dpp: '15/06/2026',
      medico: 'Dr. André',
      telefoneMedico: '+5535999990000',
      gestanteId: 1,
    };

    it('deve substituir {telefone_medico} pelo telefone do médico', () => {
      const template = 'Olá {nome}! Em caso de dúvidas, ligue para {medico}: {telefone_medico}';
      const result = replaceTemplateVariables(template, baseContext);
      expect(result).toBe('Olá Maria! Em caso de dúvidas, ligue para André: +5535999990000');
    });

    it('deve substituir {telefone_medico} com string vazia quando não disponível', () => {
      const template = 'Contato: {telefone_medico}';
      const context = { ...baseContext, telefoneMedico: undefined };
      const result = replaceTemplateVariables(template, context);
      expect(result).toBe('Contato: ');
    });

    it('deve substituir múltiplas ocorrências de {telefone_medico}', () => {
      const template = 'Tel: {telefone_medico} ou WhatsApp: {telefone_medico}';
      const result = replaceTemplateVariables(template, baseContext);
      expect(result).toBe('Tel: +5535999990000 ou WhatsApp: +5535999990000');
    });

    it('deve substituir {telefone_medico} junto com outras variáveis', () => {
      const template = '{nome}, IG {ig_semanas}s{ig_dias}d, médico {medico} ({telefone_medico})';
      const result = replaceTemplateVariables(template, baseContext);
      expect(result).toBe('Maria, IG 28s3d, médico André (+5535999990000)');
    });
  });

  describe('Formatação de telefone brasileiro', () => {
    it('deve manter telefone com +55 inalterado', () => {
      // Simula a lógica de formatação do backend
      const formatarTelefone = (tel: string | null): string | null => {
        if (!tel) return null;
        let formatted = tel.replace(/[^\d+]/g, '');
        if (formatted && !formatted.startsWith('+')) {
          formatted = '+55' + formatted;
        }
        return formatted;
      };

      expect(formatarTelefone('+5535999990000')).toBe('+5535999990000');
    });

    it('deve adicionar +55 quando código de país não é fornecido', () => {
      const formatarTelefone = (tel: string | null): string | null => {
        if (!tel) return null;
        let formatted = tel.replace(/[^\d+]/g, '');
        if (formatted && !formatted.startsWith('+')) {
          formatted = '+55' + formatted;
        }
        return formatted;
      };

      expect(formatarTelefone('35999990000')).toBe('+5535999990000');
    });

    it('deve limpar caracteres especiais do telefone', () => {
      const formatarTelefone = (tel: string | null): string | null => {
        if (!tel) return null;
        let formatted = tel.replace(/[^\d+]/g, '');
        if (formatted && !formatted.startsWith('+')) {
          formatted = '+55' + formatted;
        }
        return formatted;
      };

      expect(formatarTelefone('(35) 99999-0000')).toBe('+5535999990000');
    });

    it('deve retornar null para telefone vazio', () => {
      const formatarTelefone = (tel: string | null): string | null => {
        if (!tel) return null;
        let formatted = tel.replace(/[^\d+]/g, '');
        if (formatted && !formatted.startsWith('+')) {
          formatted = '+55' + formatted;
        }
        return formatted;
      };

      expect(formatarTelefone(null)).toBeNull();
      expect(formatarTelefone('')).toBeNull();
    });
  });
});
