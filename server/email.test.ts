import { describe, it, expect } from 'vitest';
import { enviarEmail, templates } from './email';

describe('Sistema de E-mails com Resend', () => {
  it('deve enviar e-mail de lembrete de vacina Bronquiolite', async () => {
    const nomeGestante = 'Vivian (Teste)';
    const emailDestinatario = 'dreatnu@yahoo.com';
    
    const template = templates.bronquiolite(nomeGestante);
    
    const resultado = await enviarEmail({
      gestanteId: 330092, // ID da Vivian
      destinatario: emailDestinatario,
      assunto: template.assunto,
      titulo: template.titulo,
      conteudo: template.conteudo,
      tipoLembrete: 'bronquiolite',
    });
    
    console.log('Resultado do envio:', resultado);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });

  it('deve enviar e-mail de lembrete de vacina Bronquiolite para segundo email', async () => {
    const nomeGestante = 'Vivian (Teste)';
    const emailDestinatario = 'andreschlemper@me.com';
    
    const template = templates.bronquiolite(nomeGestante);
    
    const resultado = await enviarEmail({
      gestanteId: 330092, // ID da Vivian
      destinatario: emailDestinatario,
      assunto: template.assunto,
      titulo: template.titulo,
      conteudo: template.conteudo,
      tipoLembrete: 'bronquiolite',
    });
    
    console.log('Resultado do envio:', resultado);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });
});
