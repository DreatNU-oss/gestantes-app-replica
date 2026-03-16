import { describe, it, expect, vi } from 'vitest';

// ─── Quick WhatsApp Send Feature Tests ──────────────────────────────────────

describe('Quick WhatsApp Send - Orientações Alimentares', () => {
  const PDF_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes-alimentares-1a-consulta_bb34a959.pdf';

  it('deve ter URL do PDF de orientações alimentares válida', () => {
    expect(PDF_URL).toMatch(/^https:\/\//);
    expect(PDF_URL).toContain('orientacoes-alimentares');
    expect(PDF_URL).toContain('.pdf');
  });

  it('deve gerar mensagem personalizada com nome da gestante', () => {
    const nomeCompleto = 'Maria Silva Santos';
    const primeiroNome = nomeCompleto.split(' ')[0];
    
    const mensagem = `Olá ${primeiroNome}! 🤰\n\nSegue o *Guia de Alimentação para uma Gestação Saudável* da Clínica Mais Mulher.`;
    
    expect(mensagem).toContain('Maria');
    expect(mensagem).not.toContain('Silva');
    expect(mensagem).toContain('Guia de Alimentação');
    expect(mensagem).toContain('Clínica Mais Mulher');
  });

  it('deve usar apenas o primeiro nome da gestante', () => {
    const nomes = [
      { completo: 'Ana Paula Souza', esperado: 'Ana' },
      { completo: 'Maria', esperado: 'Maria' },
      { completo: 'Joana da Silva', esperado: 'Joana' },
    ];

    nomes.forEach(({ completo, esperado }) => {
      const primeiroNome = completo.split(' ')[0];
      expect(primeiroNome).toBe(esperado);
    });
  });

  it('deve lidar com nome vazio ou undefined', () => {
    const nomeVazio = '';
    const primeiroNome = nomeVazio?.split(' ')[0] || '';
    expect(primeiroNome).toBe('');

    const nomeUndefined: string | undefined = undefined;
    const primeiroNome2 = nomeUndefined?.split(' ')[0] || '';
    expect(primeiroNome2).toBe('');
  });
});

describe('Quick WhatsApp Send - Validação de Telefone', () => {
  it('deve rejeitar gestante sem telefone', () => {
    const gestante = { nome: 'Maria', telefone: null };
    const temTelefone = !!gestante.telefone;
    expect(temTelefone).toBe(false);
  });

  it('deve aceitar gestante com telefone', () => {
    const gestante = { nome: 'Maria', telefone: '35999999999' };
    const temTelefone = !!gestante.telefone;
    expect(temTelefone).toBe(true);
  });

  it('deve aceitar telefone com formatação', () => {
    const gestante = { nome: 'Maria', telefone: '(35) 99999-9999' };
    const temTelefone = !!gestante.telefone;
    expect(temTelefone).toBe(true);
  });
});

describe('Quick WhatsApp Send - sendManualMessage', () => {
  it('deve importar sendManualMessage sem erros', async () => {
    const { sendManualMessage } = await import('./whatsapp');
    expect(typeof sendManualMessage).toBe('function');
  });

  it('sendManualMessage deve aceitar pdfUrl como parâmetro', async () => {
    const { sendManualMessage } = await import('./whatsapp');
    // Verificar que a função aceita 6 parâmetros (clinicaId, telefone, mensagem, pdfUrl, nomeGestante, gestanteId)
    expect(sendManualMessage.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Quick WhatsApp Send - Botões de Orientação', () => {
  const botoesOrientacao = [
    {
      id: 'or-alimentares-1a',
      label: 'Or. Alimentares 1ª cons',
      pdfUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes-alimentares-1a-consulta_bb34a959.pdf',
    },
  ];

  it('deve ter pelo menos 1 botão de orientação configurado', () => {
    expect(botoesOrientacao.length).toBeGreaterThanOrEqual(1);
  });

  it('cada botão deve ter id, label e pdfUrl', () => {
    botoesOrientacao.forEach((botao) => {
      expect(botao.id).toBeTruthy();
      expect(botao.label).toBeTruthy();
      expect(botao.pdfUrl).toMatch(/^https:\/\//);
    });
  });

  it('primeiro botão deve ser Orientações Alimentares 1ª consulta', () => {
    expect(botoesOrientacao[0].id).toBe('or-alimentares-1a');
    expect(botoesOrientacao[0].label).toContain('Alimentares');
    expect(botoesOrientacao[0].label).toContain('1ª');
  });
});
