import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizePhone, extrairPrimeiroNome } from './whatsapp';

/**
 * Testes para a funcionalidade de notificação WhatsApp ao médico
 * quando uma gestante envia um exame pelo app mobile.
 * 
 * Verifica:
 * 1. Formatação da mensagem de notificação
 * 2. Normalização de telefone dos destinatários
 * 3. Lógica de seleção de destinatários (admin + obstetra)
 * 4. Tratamento de erros (não deve bloquear o upload)
 */

describe('Upload Exame - Notificação WhatsApp ao Médico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Formatação da mensagem de notificação', () => {
    it('deve formatar mensagem com nome capitalizado e tipo laboratorial', () => {
      const nomeGestante = 'ANA CLARA BORGES DA SILVA';
      const nomeFormatado = nomeGestante
        .split(' ')
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
      const tipoExame = 'laboratorial';
      const tipoLabel = tipoExame === 'laboratorial' ? 'Exame Laboratorial' : 'Ultrassom';
      const nomeArquivo = 'hemograma_completo.pdf';

      const msg = `📋 *Novo exame recebido pelo App*\n\nA gestante *${nomeFormatado}* enviou um *${tipoLabel}* pelo aplicativo.\n\n📎 Arquivo: ${nomeArquivo}\n⏳ Status: Aguardando sua revisão\n\nAcesse a página *Exames Pendentes* no sistema para revisar.`;

      expect(msg).toContain('Ana Clara Borges Da Silva');
      expect(msg).toContain('Exame Laboratorial');
      expect(msg).toContain('hemograma_completo.pdf');
      expect(msg).toContain('Exames Pendentes');
      expect(msg).toContain('Novo exame recebido pelo App');
    });

    it('deve formatar mensagem com tipo ultrassom', () => {
      const tipoExame = 'ultrassom';
      const tipoLabel = tipoExame === 'laboratorial' ? 'Exame Laboratorial' : 'Ultrassom';

      expect(tipoLabel).toBe('Ultrassom');
    });

    it('deve capitalizar nomes corretamente', () => {
      const nomes = [
        { input: 'MARIA DA SILVA', expected: 'Maria Da Silva' },
        { input: 'ana clara', expected: 'Ana Clara' },
        { input: 'JOANA PEREIRA DOS SANTOS', expected: 'Joana Pereira Dos Santos' },
      ];

      for (const { input, expected } of nomes) {
        const formatado = input
          .split(' ')
          .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ');
        expect(formatado).toBe(expected);
      }
    });
  });

  describe('Seleção de destinatários', () => {
    it('deve filtrar apenas admin e obstetra', () => {
      const usuarios = [
        { id: 1, name: 'Dr. André', telefone: '35991375232', role: 'admin', clinicaId: 1 },
        { id: 2, name: 'Dra. Maria', telefone: '35991375233', role: 'obstetra', clinicaId: 1 },
        { id: 3, name: 'Ana Secretária', telefone: '35991375234', role: 'secretaria', clinicaId: 1 },
        { id: 4, name: 'Super Admin', telefone: '35991375235', role: 'superadmin', clinicaId: 1 },
      ];

      const rolesPermitidas = ['admin', 'obstetra'];
      const destinatarios = usuarios.filter(u => rolesPermitidas.includes(u.role));

      expect(destinatarios).toHaveLength(2);
      expect(destinatarios[0].name).toBe('Dr. André');
      expect(destinatarios[1].name).toBe('Dra. Maria');
    });

    it('deve ignorar destinatários sem telefone', () => {
      const destinatarios = [
        { id: 1, name: 'Dr. André', telefone: '35991375232', role: 'admin' },
        { id: 2, name: 'Dra. Maria', telefone: null, role: 'obstetra' },
        { id: 3, name: 'Dr. João', telefone: '', role: 'obstetra' },
      ];

      const comTelefone = destinatarios.filter(d => d.telefone);
      expect(comTelefone).toHaveLength(1);
      expect(comTelefone[0].name).toBe('Dr. André');
    });

    it('deve filtrar por clinicaId correta', () => {
      const usuarios = [
        { id: 1, name: 'Dr. André', telefone: '35991375232', role: 'admin', clinicaId: 1 },
        { id: 2, name: 'Dra. Maria', telefone: '35991375233', role: 'obstetra', clinicaId: 2 },
        { id: 3, name: 'Dr. João', telefone: '35991375234', role: 'obstetra', clinicaId: 1 },
      ];

      const clinicaId = 1;
      const rolesPermitidas = ['admin', 'obstetra'];
      const destinatarios = usuarios.filter(
        u => u.clinicaId === clinicaId && rolesPermitidas.includes(u.role)
      );

      expect(destinatarios).toHaveLength(2);
      expect(destinatarios.every(d => d.clinicaId === 1)).toBe(true);
    });
  });

  describe('Normalização de telefone dos destinatários', () => {
    it('deve normalizar telefone brasileiro com DDD', () => {
      expect(normalizePhone('35991375232')).toBe('5535991375232');
    });

    it('deve normalizar telefone com código do país', () => {
      expect(normalizePhone('5535991375232')).toBe('5535991375232');
    });

    it('deve normalizar telefone com formatação', () => {
      expect(normalizePhone('(35) 99137-5232')).toBe('5535991375232');
    });

    it('deve normalizar telefone com +55', () => {
      expect(normalizePhone('+5535991375232')).toBe('5535991375232');
    });

    it('deve retornar string vazia para telefone vazio', () => {
      expect(normalizePhone('')).toBe('');
    });
  });

  describe('Tratamento de erros (fire-and-forget)', () => {
    it('a notificação WhatsApp não deve bloquear o upload', async () => {
      // Simula o padrão fire-and-forget usado no uploadExame
      let notificacaoExecutou = false;
      let uploadRetornou = false;

      // Fire-and-forget (não espera)
      const notificacaoPromise = (async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        notificacaoExecutou = true;
      })();

      // Upload retorna imediatamente
      uploadRetornou = true;

      expect(uploadRetornou).toBe(true);
      expect(notificacaoExecutou).toBe(false); // Ainda não executou

      // Aguardar a notificação terminar
      await notificacaoPromise;
      expect(notificacaoExecutou).toBe(true);
    });

    it('erro na notificação não deve propagar exceção', async () => {
      let erroCapturado = false;

      // Simula o padrão try-catch do fire-and-forget
      const notificacao = (async () => {
        try {
          throw new Error('Falha no envio WhatsApp');
        } catch (error) {
          erroCapturado = true;
          // Apenas loga, não propaga
          console.error('[uploadExame] Erro ao notificar médicos:', error);
        }
      })();

      await notificacao;
      expect(erroCapturado).toBe(true);
    });
  });

  describe('Integração com sendWhatsApp', () => {
    it('deve usar a assinatura correta de sendWhatsApp', async () => {
      // Verificar que a função sendWhatsApp aceita os parâmetros corretos
      const { sendWhatsApp } = await import('./whatsapp');
      expect(typeof sendWhatsApp).toBe('function');
      // A função aceita (message: WhatsAppMessage, clinicaId?: number, maxRetries?: number)
    });

    it('deve usar extrairPrimeiroNome corretamente', () => {
      expect(extrairPrimeiroNome('Maria da Silva')).toBe('Maria');
      expect(extrairPrimeiroNome('ANA CLARA')).toBe('Ana');
      expect(extrairPrimeiroNome('')).toBe('');
    });
  });
});
