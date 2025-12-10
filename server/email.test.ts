import { describe, it, expect } from 'vitest';
import { enviarEmail, templates } from './email';

describe('Sistema de E-mails com Resend', () => {
  it('deve enviar e-mail de lembrete de vacina dTpa', async () => {
    const nomeGestante = 'Vivian (Teste)';
    const emailDestinatario = 'dreatnu@yahoo.com';
    
    const template = templates.dtpa(nomeGestante);
    
    const resultado = await enviarEmail({
      gestanteId: 330092, // ID da Vivian
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

  it('deve enviar e-mail de lembrete de Morfológico 1º Trimestre', async () => {
    const nomeGestante = 'Paula Marques (Teste)';
    const emailDestinatario = 'andreschlemper@me.com';
    
    const template = templates.morfo1tri(nomeGestante, 10);
    
    const resultado = await enviarEmail({
      gestanteId: 330093, // ID da Paula
      destinatario: emailDestinatario,
      assunto: template.assunto,
      titulo: template.titulo,
      conteudo: template.conteudo,
      tipoLembrete: 'morfo1tri',
    });
    
    console.log('Resultado do envio Morfológico:', resultado);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });
});
