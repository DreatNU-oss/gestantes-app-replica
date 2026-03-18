import { describe, it, expect } from 'vitest';
import * as fs from 'fs';

/**
 * Tests to verify that automatic email sending has been disabled
 * while manual email sending capability is preserved.
 */
describe('Envio automático de e-mails desativado', () => {
  
  it('cron endpoint de processamento de lembretes deve estar removido do index.ts', () => {
    const source = fs.readFileSync('./server/_core/index.ts', 'utf-8');
    // Should NOT have the active cron endpoint
    expect(source).not.toContain("app.get('/api/cron/processar-lembretes'");
    // Should have the commented-out import
    expect(source).toContain('// import { processarLembretes }');
  });

  it('processarLembretes deve estar removido do router email', () => {
    const source = fs.readFileSync('./server/routers.ts', 'utf-8');
    // Should NOT have active processarLembretes procedure
    expect(source).not.toMatch(/processarLembretes:\s*protectedProcedure/);
    // Should have the commented-out import
    expect(source).toContain('// import { processarLembretes }');
  });

  it('procedures de monitoramento de e-mail (processarLembretes, estatisticas, proximosLembretes) devem estar removidas do router email', () => {
    const source = fs.readFileSync('./server/routers.ts', 'utf-8');
    // processarLembretes should not exist as active procedure
    expect(source).not.toMatch(/processarLembretes:\s*protectedProcedure/);
    // proximosLembretes should not exist
    expect(source).not.toMatch(/proximosLembretes:\s*protectedProcedure/);
    // The comment indicating removal should exist
    expect(source).toContain('[REMOVIDO] processarLembretes');
  });

  it('menu Monitoramento de E-mails deve estar removido do GestantesLayout', () => {
    const source = fs.readFileSync('./client/src/components/GestantesLayout.tsx', 'utf-8');
    expect(source).not.toContain('"Monitoramento de E-mails"');
    expect(source).not.toContain('"/monitoramento-emails"');
  });

  it('rota /monitoramento-emails deve estar removida do App.tsx', () => {
    const source = fs.readFileSync('./client/src/App.tsx', 'utf-8');
    expect(source).not.toMatch(/<Route path=\{\"\/monitoramento-emails\"\}>/);
    expect(source).not.toMatch(/<MonitoramentoEmails\s*\/>/);
  });

  it('email.configurar e email.obterConfig devem continuar existindo para envio manual', () => {
    const source = fs.readFileSync('./server/routers.ts', 'utf-8');
    expect(source).toContain('configurar: protectedProcedure');
    expect(source).toContain('obterConfig: protectedProcedure');
  });

  it('função enviarEmail deve continuar existindo em email.ts para envio manual', () => {
    const source = fs.readFileSync('./server/email.ts', 'utf-8');
    expect(source).toContain('export async function enviarEmail');
    expect(source).toContain('createGmailTransporter');
  });

  it('enviarEmail ainda é utilizado no gestanteAuth.ts para envio de código de acesso', () => {
    const source = fs.readFileSync('./server/gestanteAuth.ts', 'utf-8');
    expect(source).toContain("import { enviarEmail } from './email'");
    expect(source).toContain('await enviarEmail(');
  });
});
