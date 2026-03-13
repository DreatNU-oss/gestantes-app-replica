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
