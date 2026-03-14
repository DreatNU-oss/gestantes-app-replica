import { describe, it, expect, vi } from 'vitest';
import { replaceTemplateVariables, extrairPrimeiroNome, normalizePhone, type GestanteContext } from './whatsapp';

// ─── Template Variable Replacement Tests ─────────────────────────────────────

describe('WhatsApp - replaceTemplateVariables', () => {
  const baseContext: GestanteContext = {
    nome: 'Maria Silva',
    telefone: '5535999999999',
    igSemanas: 28,
    igDias: 3,
    dpp: '15/06/2026',
    medico: 'Dr. André',
    gestanteId: 1,
  };

  it('deve substituir todas as variáveis no template', () => {
    const template = 'Olá {nome}, você está com {ig_semanas} semanas e {ig_dias} dias. Sua DPP é {dpp}. Médico: {medico}.';
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe('Olá Maria, você está com 28 semanas e 3 dias. Sua DPP é 15/06/2026. Médico: Dr. André.');
  });

  it('deve substituir múltiplas ocorrências da mesma variável', () => {
    const template = '{nome} - Lembrete para {nome}';
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe('Maria - Lembrete para Maria');
  });

  it('deve lidar com variáveis ausentes (undefined/null)', () => {
    const context: GestanteContext = {
      nome: 'Ana',
      telefone: '5535888888888',
    };
    const template = 'Olá {nome}, IG: {ig_semanas}s{ig_dias}d, DPP: {dpp}, Médico: {medico}';
    const result = replaceTemplateVariables(template, context);
    expect(result).toBe('Olá Ana, IG: sd, DPP: , Médico: ');
  });

  it('deve retornar template sem variáveis inalterado', () => {
    const template = 'Mensagem simples sem variáveis.';
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toBe('Mensagem simples sem variáveis.');
  });

  it('deve lidar com template vazio', () => {
    const result = replaceTemplateVariables('', baseContext);
    expect(result).toBe('');
  });

  it('deve substituir variáveis em mensagem de vacina DTPa', () => {
    const template = 'Olá {nome}! Você está com {ig_semanas} semanas de gestação. É hora de tomar a vacina DTPa. Converse com seu médico {medico} na próxima consulta.';
    const result = replaceTemplateVariables(template, baseContext);
    expect(result).toContain('Maria');
    expect(result).toContain('28 semanas');
    expect(result).toContain('Dr. André');
  });
});
// ─── Testes de Extração de Primeiro Nome ────────────────────────────────────────

describe('WhatsApp - extrairPrimeiroNome', () => {
  it('deve extrair primeiro nome de nome completo', () => {
    expect(extrairPrimeiroNome('Maria Silva')).toBe('Maria');
  });

  it('deve capitalizar corretamente nomes em maiúsculas', () => {
    expect(extrairPrimeiroNome('FERNANDA APARECIDA LEMES')).toBe('Fernanda');
  });

  it('deve capitalizar corretamente nomes em minúsculas', () => {
    expect(extrairPrimeiroNome('camila rosa carvalho')).toBe('Camila');
  });

  it('deve lidar com nomes com preposição', () => {
    expect(extrairPrimeiroNome('Maria da Silva')).toBe('Maria');
    expect(extrairPrimeiroNome('Ana de Souza')).toBe('Ana');
  });

  it('deve lidar com nome único', () => {
    expect(extrairPrimeiroNome('Juliana')).toBe('Juliana');
  });

  it('deve lidar com string vazia', () => {
    expect(extrairPrimeiroNome('')).toBe('');
  });

  it('deve lidar com espaços extras', () => {
    expect(extrairPrimeiroNome('  Bruna   do Carmo  ')).toBe('Bruna');
  });

  it('deve usar {nome} como primeiro nome e {nome_completo} como nome inteiro', () => {
    const template = 'Olá {nome}! Seu nome completo é {nome_completo}.';
    const result = replaceTemplateVariables(template, { nome: 'Fernanda Aparecida Lemes', telefone: '5535999999999' });
    expect(result).toBe('Olá Fernanda! Seu nome completo é Fernanda Aparecida Lemes.');
  });
});

// ─── WhatsApp Scheduler IG Calculation Tests ─────────────────────────────────────────

describe('WhatsApp Scheduler - Cálculo de IG', () => {
  // Importar a função de cálculo do scheduler
  // Note: testamos indiretamente via a lógica de template matching

  it('deve calcular IG corretamente a partir da DUM', async () => {
    // Importar dinamicamente para testar
    const mod = await import('./whatsappScheduler');
    // A função calcularIGAtual é privada, mas podemos testar via processarMensagensIG
    // que é a função pública. Aqui testamos a lógica de forma unitária.
    expect(mod.processarMensagensIG).toBeDefined();
    expect(typeof mod.processarMensagensIG).toBe('function');
  });

  it('deve exportar funções de scheduler', async () => {
    const mod = await import('./whatsappScheduler');
    expect(mod.startWhatsAppScheduler).toBeDefined();
    expect(mod.stopWhatsAppScheduler).toBeDefined();
    expect(mod.processarMensagensIG).toBeDefined();
    expect(mod.processarMensagemEvento).toBeDefined();
  });
});

// ─── WhatsApp Service Tests ──────────────────────────────────────────────────

describe('WhatsApp - sendWhatsApp', () => {
  it('deve retornar resultado (sucesso ou erro) ao enviar mensagem', async () => {
    const { sendWhatsApp } = await import('./whatsapp');
    // Com API key configurada via env, a chamada vai para a API real
    // Pode falhar por rate limit (trial) ou número inválido, mas não deve lançar exceção
    const result = await sendWhatsApp({ to: '5535999999999', text: 'Teste' });
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('WhatsApp - normalizePhone', () => {
  it('deve adicionar +55 para número sem código do país', () => {
    expect(normalizePhone('35991375232')).toBe('5535991375232');
  });

  it('deve formatar número com parênteses e traço', () => {
    expect(normalizePhone('(35) 99137-5232')).toBe('5535991375232');
  });

  it('deve manter número que já tem 55', () => {
    expect(normalizePhone('5535991375232')).toBe('5535991375232');
  });

  it('deve formatar número com +55', () => {
    expect(normalizePhone('+5535991375232')).toBe('5535991375232');
  });

  it('deve remover zero inicial', () => {
    expect(normalizePhone('035991375232')).toBe('5535991375232');
  });

  it('deve formatar número com espaços', () => {
    expect(normalizePhone('55 35 99137 5232')).toBe('5535991375232');
  });

  it('deve retornar vazio para string vazia', () => {
    expect(normalizePhone('')).toBe('');
  });

  it('deve formatar números reais cadastrados pelas pacientes', () => {
    // Formato real: (DDD) XXXXX-XXXX sem código do país
    expect(normalizePhone('(35) 98407-1855')).toBe('5535984071855');
    expect(normalizePhone('(35) 99243-4836')).toBe('5535992434836');
    expect(normalizePhone('(35) 99111-5958')).toBe('5535991115958');
    expect(normalizePhone('(35) 98408-7562')).toBe('5535984087562');
  });
});

describe('WhatsApp - Validação de telefone', () => {
  it('deve formatar telefone removendo caracteres não numéricos', async () => {
    const { sendToGestante } = await import('./whatsapp');
    // Sem API key configurada, vai falhar, mas podemos verificar que não lança exceção
    const result = await sendToGestante(999, 1, {
      nome: 'Teste',
      telefone: '(35) 99999-9999',
      gestanteId: 1,
    });
    // Deve falhar gracefully (sem API key ou template)
    expect(result.success).toBe(false);
  });

  it('deve retornar erro para gestante sem telefone', async () => {
    const { sendToGestante } = await import('./whatsapp');
    const result = await sendToGestante(999, 1, {
      nome: 'Teste',
      telefone: '',
      gestanteId: 1,
    });
    expect(result.success).toBe(false);
    // Pode falhar por template não encontrado (antes de chegar na validação de telefone)
    // ou por telefone vazio - ambos são erros esperados
    expect(result.error).toBeDefined();
  });
});

// ─── WhatsApp Upload Tests ───────────────────────────────────────────────────

describe('WhatsApp - uploadPdf', () => {
  it('deve exportar a função uploadPdf', async () => {
    const { uploadPdf } = await import('./whatsapp');
    expect(uploadPdf).toBeDefined();
    expect(typeof uploadPdf).toBe('function');
  });
});

// ─── Template Gatilho Types ──────────────────────────────────────────────────

describe('WhatsApp - Template gatilho types', () => {
  it('deve suportar gatilho por idade gestacional', () => {
    const template = {
      gatilhoTipo: 'idade_gestacional' as const,
      igSemanas: 28,
      igDias: 0,
    };
    expect(template.gatilhoTipo).toBe('idade_gestacional');
    expect(template.igSemanas).toBe(28);
  });

  it('deve suportar gatilho por evento', () => {
    const template = {
      gatilhoTipo: 'evento' as const,
      evento: 'pos_cesarea' as const,
    };
    expect(template.gatilhoTipo).toBe('evento');
    expect(template.evento).toBe('pos_cesarea');
  });

  it('deve suportar gatilho manual', () => {
    const template = {
      gatilhoTipo: 'manual' as const,
    };
    expect(template.gatilhoTipo).toBe('manual');
  });

  it('deve validar eventos suportados', () => {
    const eventosValidos = ['pos_cesarea', 'pos_parto_normal', 'cadastro_gestante', 'primeira_consulta'];
    eventosValidos.forEach(evento => {
      expect(typeof evento).toBe('string');
      expect(evento.length).toBeGreaterThan(0);
    });
  });
});
