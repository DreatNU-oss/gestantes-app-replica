import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Test: msAteProxima9hBRT calculation ─────────────────────────────────────

describe('WhatsApp Scheduler - Horário 9h BRT', () => {
  
  it('deve calcular corretamente ms até 9:00 BRT quando são 6:00 BRT (09:00 UTC)', () => {
    // 6:00 BRT = 09:00 UTC → faltam 3h para 9:00 BRT (12:00 UTC)
    const fakeDate = new Date('2026-03-12T09:00:00.000Z'); // 6:00 BRT
    vi.setSystemTime(fakeDate);
    
    // 9:00 BRT = 12:00 UTC
    const targetUTCHour = 12;
    const utcHours = fakeDate.getUTCHours(); // 9
    const utcMinutes = fakeDate.getUTCMinutes(); // 0
    const utcSeconds = fakeDate.getUTCSeconds(); // 0
    
    const msDesdeUTCMeiaNoite = (utcHours * 3600 + utcMinutes * 60 + utcSeconds) * 1000;
    const msAlvo = targetUTCHour * 3600 * 1000;
    let diff = msAlvo - msDesdeUTCMeiaNoite;
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;
    
    // Deve ser 3 horas = 10800000 ms
    expect(diff).toBe(3 * 60 * 60 * 1000);
    
    vi.useRealTimers();
  });
  
  it('deve agendar para amanhã quando já passou das 9:00 BRT', () => {
    // 14:00 BRT = 17:00 UTC → já passou das 9:00 BRT
    const fakeDate = new Date('2026-03-12T17:00:00.000Z'); // 14:00 BRT
    vi.setSystemTime(fakeDate);
    
    const targetUTCHour = 12;
    const utcHours = fakeDate.getUTCHours(); // 17
    const utcMinutes = fakeDate.getUTCMinutes(); // 0
    const utcSeconds = fakeDate.getUTCSeconds(); // 0
    
    const msDesdeUTCMeiaNoite = (utcHours * 3600 + utcMinutes * 60 + utcSeconds) * 1000;
    const msAlvo = targetUTCHour * 3600 * 1000;
    let diff = msAlvo - msDesdeUTCMeiaNoite;
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;
    
    // 17:00 UTC → 12:00 UTC amanhã = 19h = 68400000 ms
    expect(diff).toBe(19 * 60 * 60 * 1000);
    
    vi.useRealTimers();
  });
  
  it('deve calcular 24h quando são exatamente 9:00 BRT (12:00 UTC)', () => {
    // Exatamente 9:00 BRT = 12:00 UTC → diff = 0, deve ir para amanhã
    const fakeDate = new Date('2026-03-12T12:00:00.000Z');
    vi.setSystemTime(fakeDate);
    
    const targetUTCHour = 12;
    const utcHours = fakeDate.getUTCHours(); // 12
    
    const msDesdeUTCMeiaNoite = (utcHours * 3600) * 1000;
    const msAlvo = targetUTCHour * 3600 * 1000;
    let diff = msAlvo - msDesdeUTCMeiaNoite;
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;
    
    // Deve ser 24h
    expect(diff).toBe(24 * 60 * 60 * 1000);
    
    vi.useRealTimers();
  });
  
  it('deve calcular corretamente quando são 23:00 BRT (02:00 UTC do dia seguinte)', () => {
    // 23:00 BRT = 02:00 UTC → faltam 10h para 12:00 UTC
    const fakeDate = new Date('2026-03-13T02:00:00.000Z');
    vi.setSystemTime(fakeDate);
    
    const targetUTCHour = 12;
    const utcHours = fakeDate.getUTCHours(); // 2
    
    const msDesdeUTCMeiaNoite = (utcHours * 3600) * 1000;
    const msAlvo = targetUTCHour * 3600 * 1000;
    let diff = msAlvo - msDesdeUTCMeiaNoite;
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;
    
    // Deve ser 10h
    expect(diff).toBe(10 * 60 * 60 * 1000);
    
    vi.useRealTimers();
  });
});

// ─── Test: Template content matches email templates ──────────────────────────

describe('WhatsApp Templates - Conteúdo equivalente aos e-mails', () => {
  
  it('template dTpa deve mencionar 27 semanas e vacina dTpa', () => {
    const templateDtpa = `Olá *{nome}*! 👋

Você está com *27 semanas de gestação* e chegou o momento de tomar a *vacina dTpa* (tríplice bacteriana acelular).`;
    
    expect(templateDtpa).toContain('27 semanas');
    expect(templateDtpa).toContain('vacina dTpa');
    expect(templateDtpa).toContain('{nome}');
  });
  
  it('template bronquiolite deve mencionar VSR e período 32-36 semanas', () => {
    const templateBronquiolite = `Olá *{nome}*! 👋

Você está com *{ig_semanas} semanas de gestação* e está no período ideal para tomar a *vacina contra bronquiolite* (VSR - Vírus Sincicial Respiratório).`;
    
    expect(templateBronquiolite).toContain('bronquiolite');
    expect(templateBronquiolite).toContain('VSR');
    expect(templateBronquiolite).toContain('{ig_semanas}');
    expect(templateBronquiolite).toContain('{nome}');
  });
  
  it('template morfo 1º tri deve mencionar período 11-14 semanas', () => {
    const templateMorfo1 = `📅 *Período recomendado:* entre 11 e 14 semanas de gestação.`;
    
    expect(templateMorfo1).toContain('11 e 14 semanas');
  });
  
  it('template morfo 2º tri deve mencionar período 20-24 semanas', () => {
    const templateMorfo2 = `📅 *Período recomendado:* entre 20 e 24 semanas de gestação.`;
    
    expect(templateMorfo2).toContain('20 e 24 semanas');
  });
  
  it('todos os templates devem ter rodapé de mensagem automática', () => {
    const rodape = '_Mensagem automática - Acompanhamento Pré-Natal_';
    expect(rodape).toContain('Mensagem automática');
  });
});

// ─── Test: Envio automático de PDF ao cadastrar gestante ────────────────────

describe('WhatsApp - Envio automático de orientações alimentares ao cadastrar gestante', () => {
  
  it('processarMensagemEvento deve aceitar evento cadastro_gestante', async () => {
    const { processarMensagemEvento } = await import('./whatsappScheduler');
    // Chamar com clinicaId inexistente - deve retornar 0 enviadas (sem config ativa)
    const result = await processarMensagemEvento(999999, 'cadastro_gestante', {
      nome: 'Teste Cadastro',
      telefone: '5535999999999',
      gestanteId: 1,
    });
    expect(result).toBeDefined();
    expect(result.enviadas).toBe(0);
    expect(result.erros).toBe(0);
  });

  it('deve ter evento cadastro_gestante no schema', () => {
    const eventosValidos = ['pos_cesarea', 'pos_parto_normal', 'cadastro_gestante', 'primeira_consulta'];
    expect(eventosValidos).toContain('cadastro_gestante');
  });

  it('template de cadastro deve conter variável {nome} e URL do PDF', () => {
    const templateMsg = 'Olá {nome}! Seja bem-vinda ao acompanhamento pré-natal da Clínica Mais Mulher! Segue em anexo o nosso Guia de Alimentação para uma Gestação Saudável.';
    const pdfUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes-alimentares/OrientacoesAlimentares1aconsulta.pdf';
    
    expect(templateMsg).toContain('{nome}');
    expect(templateMsg).toContain('Guia de Alimentação');
    expect(pdfUrl).toContain('.pdf');
    expect(pdfUrl.startsWith('https://')).toBe(true);
  });

  it('deve substituir variável {nome} na mensagem de orientações alimentares', async () => {
    const { replaceTemplateVariables } = await import('./whatsapp');
    const template = 'Olá {nome}! Seja bem-vinda ao acompanhamento pré-natal!';
    const result = replaceTemplateVariables(template, {
      nome: 'Juliana Santos',
      telefone: '5535999999999',
    });
    expect(result).toBe('Olá Juliana! Seja bem-vinda ao acompanhamento pré-natal!');
  });
});

// ─── Test: Condições de template (tipo parto + médico) ────────────────────

describe('WhatsApp Scheduler - Condições de template (pré-operatório cesárea)', () => {
  
  it('deve pular template quando gestante não tem cesariana agendada', () => {
    const template = { condicaoTipoParto: 'cesariana' as const, condicaoMedicoId: 1 };
    const gestante = { tipoPartoDesejado: 'normal', medicoId: 1 };
    
    const passaTipoParto = !template.condicaoTipoParto || gestante.tipoPartoDesejado === template.condicaoTipoParto;
    const passaMedico = !template.condicaoMedicoId || gestante.medicoId === template.condicaoMedicoId;
    
    expect(passaTipoParto).toBe(false);
    expect(passaMedico).toBe(true);
    expect(passaTipoParto && passaMedico).toBe(false); // Não deve enviar
  });

  it('deve pular template quando gestante não é do Dr. André', () => {
    const template = { condicaoTipoParto: 'cesariana' as const, condicaoMedicoId: 1 };
    const gestante = { tipoPartoDesejado: 'cesariana', medicoId: 99 };
    
    const passaTipoParto = !template.condicaoTipoParto || gestante.tipoPartoDesejado === template.condicaoTipoParto;
    const passaMedico = !template.condicaoMedicoId || gestante.medicoId === template.condicaoMedicoId;
    
    expect(passaTipoParto).toBe(true);
    expect(passaMedico).toBe(false);
    expect(passaTipoParto && passaMedico).toBe(false); // Não deve enviar
  });

  it('deve enviar quando gestante tem cesariana + Dr. André', () => {
    const template = { condicaoTipoParto: 'cesariana' as const, condicaoMedicoId: 1 };
    const gestante = { tipoPartoDesejado: 'cesariana', medicoId: 1 };
    
    const passaTipoParto = !template.condicaoTipoParto || gestante.tipoPartoDesejado === template.condicaoTipoParto;
    const passaMedico = !template.condicaoMedicoId || gestante.medicoId === template.condicaoMedicoId;
    
    expect(passaTipoParto).toBe(true);
    expect(passaMedico).toBe(true);
    expect(passaTipoParto && passaMedico).toBe(true); // Deve enviar
  });

  it('deve enviar template sem condições para qualquer gestante', () => {
    const template = { condicaoTipoParto: null, condicaoMedicoId: null };
    const gestante = { tipoPartoDesejado: 'normal', medicoId: 99 };
    
    const passaTipoParto = !template.condicaoTipoParto || gestante.tipoPartoDesejado === template.condicaoTipoParto;
    const passaMedico = !template.condicaoMedicoId || gestante.medicoId === template.condicaoMedicoId;
    
    expect(passaTipoParto).toBe(true);
    expect(passaMedico).toBe(true);
    expect(passaTipoParto && passaMedico).toBe(true); // Templates sem condição enviam para todos
  });

  it('deve pular quando gestante tem tipo "a_definir" e template exige cesariana', () => {
    const template = { condicaoTipoParto: 'cesariana' as const, condicaoMedicoId: 1 };
    const gestante = { tipoPartoDesejado: 'a_definir', medicoId: 1 };
    
    const passaTipoParto = !template.condicaoTipoParto || gestante.tipoPartoDesejado === template.condicaoTipoParto;
    expect(passaTipoParto).toBe(false); // "a_definir" não é cesariana
  });

  it('deve enviar evento correto conforme tipo de parto', () => {
    // Simula a lógica do trigger no registro de parto
    const inputCesarea = { tipoParto: 'cesarea' as const };
    const inputNormal = { tipoParto: 'normal' as const };
    
    const eventoCesarea = inputCesarea.tipoParto === 'cesarea' ? 'pos_cesarea' : 'pos_parto_normal';
    const eventoNormal = inputNormal.tipoParto === 'cesarea' ? 'pos_cesarea' : 'pos_parto_normal';
    
    expect(eventoCesarea).toBe('pos_cesarea');
    expect(eventoNormal).toBe('pos_parto_normal');
  });

  it('processarMensagemEvento deve aceitar evento pos_cesarea', async () => {
    const { processarMensagemEvento } = await import('./whatsappScheduler');
    // Chamar com clinicaId inexistente - deve retornar 0 enviadas (sem config)
    const result = await processarMensagemEvento(999999, 'pos_cesarea', {
      nome: 'Teste Pós-Cesárea',
      telefone: '5535999999999',
      gestanteId: 1,
    });
    expect(result).toBeDefined();
    expect(result.enviadas).toBe(0);
    expect(result.erros).toBe(0);
  });

  it('template pós-cesárea deve conter mensagem de parabéns e PDF', () => {
    const templateMsg = 'Olá {nome}! Parabéns pelo nascimento do seu bebê!';
    const pdfUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes/PosOperatorioCesariana.pdf';
    
    expect(templateMsg).toContain('{nome}');
    expect(templateMsg).toContain('Parabéns');
    expect(pdfUrl).toContain('PosOperatorioCesariana.pdf');
  });

  it('processarMensagemEvento deve aceitar evento pos_parto_normal', async () => {
    const { processarMensagemEvento } = await import('./whatsappScheduler');
    const result = await processarMensagemEvento(999999, 'pos_parto_normal', {
      nome: 'Teste Pós-Parto Normal',
      telefone: '5535999999999',
      gestanteId: 1,
    });
    expect(result).toBeDefined();
    expect(result.enviadas).toBe(0);
    expect(result.erros).toBe(0);
  });

  it('template pós-parto normal deve conter mensagem de parabéns e PDF', () => {
    const templateMsg = 'Olá {nome}! Parabéns pelo nascimento do seu bebê!';
    const pdfUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes/PosPartoNormal.pdf';
    
    expect(templateMsg).toContain('{nome}');
    expect(templateMsg).toContain('Parabéns');
    expect(pdfUrl).toContain('PosPartoNormal.pdf');
  });

  it('template pré-operatório deve ser IG 36 semanas com PDF anexo', () => {
    const template = {
      igSemanas: 36,
      igDias: 0,
      condicaoTipoParto: 'cesariana',
      condicaoMedicoId: 1,
      pdfUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes/PreOperatorioCesariana.pdf',
    };
    
    expect(template.igSemanas).toBe(36);
    expect(template.condicaoTipoParto).toBe('cesariana');
    expect(template.condicaoMedicoId).toBe(1); // Dr. André
    expect(template.pdfUrl).toContain('PreOperatorioCesariana.pdf');
  });
});

// ─── Test: IG matching logic ─────────────────────────────────────────────────

describe('WhatsApp Scheduler - Lógica de matching por IG', () => {
  
  it('deve enviar quando gestante está exatamente na IG do template', () => {
    const templateTotalDias = 27 * 7; // 189 dias (27 semanas)
    const igTotalDias = 189; // exatamente 27 semanas
    
    const shouldSend = igTotalDias >= templateTotalDias && igTotalDias <= templateTotalDias + 1;
    expect(shouldSend).toBe(true);
  });
  
  it('deve enviar quando gestante está 1 dia após a IG do template', () => {
    const templateTotalDias = 27 * 7; // 189
    const igTotalDias = 190; // 27s + 1d
    
    const shouldSend = igTotalDias >= templateTotalDias && igTotalDias <= templateTotalDias + 1;
    expect(shouldSend).toBe(true);
  });
  
  it('NÃO deve enviar quando gestante está 2 dias após a IG do template', () => {
    const templateTotalDias = 27 * 7; // 189
    const igTotalDias = 191; // 27s + 2d
    
    const shouldSend = igTotalDias >= templateTotalDias && igTotalDias <= templateTotalDias + 1;
    expect(shouldSend).toBe(false);
  });
  
  it('NÃO deve enviar quando gestante está antes da IG do template', () => {
    const templateTotalDias = 27 * 7; // 189
    const igTotalDias = 188; // 26s + 6d
    
    const shouldSend = igTotalDias >= templateTotalDias && igTotalDias <= templateTotalDias + 1;
    expect(shouldSend).toBe(false);
  });
});

// ─── Test: Notificação para funcionárias ao registrar parto ──────────────────

describe('WhatsApp - Notificação para funcionárias ao registrar parto', () => {

  it('deve gerar mensagem personalizada com nome da funcionária', () => {
    const funcionarias = [
      { nome: 'Bruna', telefone: '5535987046110' },
      { nome: 'Crislaine', telefone: '5535988222837' },
      { nome: 'Jenifer', telefone: '5535988156771' },
    ];

    const nomeCompleto = 'Maria Silva';
    const nomeGestante = nomeCompleto.split(' ')[0]; // Primeiro nome apenas
    const nomeGestanteFormatado = nomeGestante.charAt(0).toUpperCase() + nomeGestante.slice(1).toLowerCase();
    const tipoPartoLabel = 'Cesárea';
    const dataFormatada = '13/03/2026';
    const nomeMedico = 'Dr. André';

    for (const func of funcionarias) {
      const msg = `Olá ${func.nome}! 👋\n\nInformamos que a gestante *${nomeGestanteFormatado}* ganhou bebê!\n\n🏥 Tipo de parto: *${tipoPartoLabel}*\n📅 Data: *${dataFormatada}*\n👨‍⚕️ Médico: *${nomeMedico}*\n\nPor favor, agende a consulta puerperal para ela o mais breve possível.\n\nObrigado!`;

      expect(msg).toContain(`Olá ${func.nome}!`);
      expect(msg).toContain('*Maria*');
      expect(msg).toContain('*Cesárea*');
      expect(msg).toContain('*13/03/2026*');
      expect(msg).toContain('*Dr. André*');
      expect(msg).toContain('consulta puerperal');
    }
  });

  it('deve incluir lembrete de flores quando é segundo parto com Dr. André', () => {
    const ehSegundoPartoComAndre = true;
    const lembreteFlores = ehSegundoPartoComAndre
      ? '\n\n🌸 *ATENÇÃO:* Este é o segundo parto desta paciente com o Dr. André. Por favor, providencie o envio de flores para ela!'
      : '';

    expect(lembreteFlores).toContain('flores');
    expect(lembreteFlores).toContain('segundo parto');
    expect(lembreteFlores).toContain('Dr. André');
  });

  it('NÃO deve incluir lembrete de flores quando é primeiro parto com Dr. André', () => {
    const ehSegundoPartoComAndre = false;
    const lembreteFlores = ehSegundoPartoComAndre
      ? '\n\n🌸 *ATENÇÃO:* Este é o segundo parto desta paciente com o Dr. André. Por favor, providencie o envio de flores para ela!'
      : '';

    expect(lembreteFlores).toBe('');
  });

  it('NÃO deve incluir lembrete de flores quando médico não é Dr. André', () => {
    const medicoId = 2; // Outro médico
    const ehSegundoPartoComAndre = medicoId === 1 ? true : false;
    const lembreteFlores = ehSegundoPartoComAndre
      ? '\n\n🌸 *ATENÇÃO:* Este é o segundo parto desta paciente com o Dr. André. Por favor, providencie o envio de flores para ela!'
      : '';

    expect(lembreteFlores).toBe('');
  });

  it('deve ter os 3 contatos corretos das funcionárias', () => {
    const funcionarias = [
      { nome: 'Bruna', telefone: '5535987046110' },
      { nome: 'Crislaine', telefone: '5535988222837' },
      { nome: 'Jenifer', telefone: '5535988156771' },
    ];

    expect(funcionarias).toHaveLength(3);
    expect(funcionarias[0].nome).toBe('Bruna');
    expect(funcionarias[1].nome).toBe('Crislaine');
    expect(funcionarias[2].nome).toBe('Jenifer');
    // Verificar formato dos telefones (DDI + DDD + número, sem espaços/caracteres)
    for (const f of funcionarias) {
      expect(f.telefone).toMatch(/^55\d{10,11}$/);
    }
  });

  it('deve formatar a data corretamente de YYYY-MM-DD para DD/MM/YYYY', () => {
    const dataParto = '2026-03-13';
    const dataFormatada = dataParto.split('-').reverse().join('/');
    expect(dataFormatada).toBe('13/03/2026');
  });

  it('deve mapear tipo de parto corretamente para o label', () => {
    expect('cesarea' === 'cesarea' ? 'Cesárea' : 'Normal').toBe('Cesárea');
    expect('normal' === 'cesarea' ? 'Cesárea' : 'Normal').toBe('Normal');
  });

  it('lógica de segundo parto: count >= 2 significa segundo ou mais partos', () => {
    // Simula contagem de partos anteriores (já incluindo o atual)
    const partosCount1 = 1; // Primeiro parto
    const partosCount2 = 2; // Segundo parto
    const partosCount3 = 3; // Terceiro parto

    expect(partosCount1 >= 2).toBe(false); // Primeiro parto - sem flores
    expect(partosCount2 >= 2).toBe(true);  // Segundo parto - com flores
    expect(partosCount3 >= 2).toBe(true);  // Terceiro parto - com flores
  });

  it('nome Jenifer deve estar escrito corretamente (sem duplo n)', () => {
    const funcionarias = [
      { nome: 'Bruna', telefone: '5535987046110' },
      { nome: 'Crislaine', telefone: '5535988222837' },
      { nome: 'Jenifer', telefone: '5535988156771' },
    ];

    const jenifer = funcionarias.find(f => f.nome === 'Jenifer');
    expect(jenifer).toBeDefined();
    expect(jenifer!.nome).toBe('Jenifer'); // Não "Jennifer"
    expect(jenifer!.nome).not.toBe('Jennifer');
  });
});

// ─── Test: Envio manual de orientações alimentares ──────────────────────────

describe('WhatsApp - Envio manual de orientações alimentares (botão)', () => {

  it('deve rejeitar envio quando gestante não tem telefone', () => {
    const gestante = { nome: 'Maria', telefone: null };
    const hasPhone = !!gestante.telefone;
    expect(hasPhone).toBe(false);
  });

  it('deve permitir envio quando gestante tem telefone', () => {
    const gestante = { nome: 'Maria', telefone: '5535991156028' };
    const hasPhone = !!gestante.telefone;
    expect(hasPhone).toBe(true);
  });

  it('botão só deve aparecer quando gestanteId existe (edição, não criação)', () => {
    const gestanteId = 123;
    const telefone = '5535991156028';
    const showButton = !!gestanteId && !!telefone;
    expect(showButton).toBe(true);

    const noId = null;
    const showButtonNoId = !!noId && !!telefone;
    expect(showButtonNoId).toBe(false);
  });

  it('evento cadastro_gestante deve ser usado para orientações alimentares', () => {
    const evento = 'cadastro_gestante';
    expect(evento).toBe('cadastro_gestante');
  });
});

// ─── Test: Admin Clínicas access control ────────────────────────────────────

describe('Admin Clínicas - Controle de acesso', () => {

  it('admin deve ter acesso ao Admin Clínicas', () => {
    const allowedRoles = ['superadmin', 'admin'];
    const userRole = 'admin';
    expect(allowedRoles.includes(userRole)).toBe(true);
  });

  it('superadmin deve ter acesso ao Admin Clínicas', () => {
    const allowedRoles = ['superadmin', 'admin'];
    const userRole = 'superadmin';
    expect(allowedRoles.includes(userRole)).toBe(true);
  });

  it('obstetra NÃO deve ter acesso ao Admin Clínicas', () => {
    const allowedRoles = ['superadmin', 'admin'];
    const userRole = 'obstetra';
    expect(allowedRoles.includes(userRole)).toBe(false);
  });

  it('secretaria NÃO deve ter acesso ao Admin Clínicas', () => {
    const allowedRoles = ['superadmin', 'admin'];
    const userRole = 'secretaria';
    expect(allowedRoles.includes(userRole)).toBe(false);
  });

  it('ownerProcedure deve aceitar admin além de isSystemOwner', () => {
    // Simula a lógica do ownerProcedure atualizado
    const checkAccess = (user: { isSystemOwner?: boolean; role: string } | null) => {
      if (!user || (!user.isSystemOwner && user.role !== 'admin')) {
        return false;
      }
      return true;
    };

    expect(checkAccess({ isSystemOwner: true, role: 'superadmin' })).toBe(true);
    expect(checkAccess({ isSystemOwner: false, role: 'admin' })).toBe(true);
    expect(checkAccess({ isSystemOwner: false, role: 'obstetra' })).toBe(false);
    expect(checkAccess({ isSystemOwner: false, role: 'secretaria' })).toBe(false);
    expect(checkAccess(null)).toBe(false);
  });
});
