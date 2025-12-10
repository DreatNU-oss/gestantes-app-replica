import { describe, it, expect } from 'vitest';
import { enviarEmail, templates } from './email';

describe('Sistema de E-mails com Resend', () => {
  it('deve enviar e-mail de lembrete de vacina dTpa', async () => {
    const nomeGestante = 'Teste Sistema';
    const emailDestinatario = 'prenatalmaismulher@gmail.com';
    
    const template = templates.dtpa(nomeGestante);
    
    const resultado = await enviarEmail({
      gestanteId: 1,
      destinatario: emailDestinatario,
      assunto: template.assunto,
      titulo: template.titulo,
      conteudo: template.conteudo,
      tipoLembrete: 'dtpa',
    });
    
    console.log('Resultado do envio dTpa:', resultado);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });

  it('deve enviar e-mail de lembrete de Morfológico 2º Trimestre', async () => {
    const nomeGestante = 'Teste Sistema';
    const emailDestinatario = 'prenatalmaismulher@gmail.com';
    
    const template = templates.morfo2tri(nomeGestante, 18, 2);
    
    const resultado = await enviarEmail({
      gestanteId: 1,
      destinatario: emailDestinatario,
      assunto: template.assunto,
      titulo: template.titulo,
      conteudo: template.conteudo,
      tipoLembrete: 'morfo2tri',
    });
    
    console.log('Resultado do envio Morfológico 2º Tri:', resultado);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });
});
