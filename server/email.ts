import nodemailer from 'nodemailer';
import { getDb } from './db';
import { configuracoesEmail, logsEmails } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Busca configuração de e-mail do banco
 */
async function getConfig(chave: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const configs = await db.select().from(configuracoesEmail).where(eq(configuracoesEmail.chave, chave));
  return configs.length > 0 ? configs[0].valor : null;
}

/**
 * Cria transporter do Nodemailer com configurações do banco
 */
async function createTransporter() {
  const emailUser = await getConfig('EMAIL_USER');
  const emailPass = await getConfig('EMAIL_PASS');
  
  if (!emailUser || !emailPass) {
    throw new Error('Configurações de e-mail não encontradas. Configure EMAIL_USER e EMAIL_PASS.');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

/**
 * Template base para e-mails
 */
function criarTemplateEmail(titulo: string, conteudo: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .alert { background-color: #fef3c7; border-left: 4px solid: #f59e0b; padding: 12px; margin: 20px 0; }
    .button { background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${titulo}</h1>
    </div>
    <div class="content">
      ${conteudo}
    </div>
    <div class="footer">
      <div class="alert" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
        ⚠️ <strong>Este é um e-mail automático apenas para notificações.</strong><br>
        Para contato com a clínica, utilize os canais oficiais de atendimento.
      </div>
      <p>Clínica Mais Mulher - Gestão de Pré-Natal</p>
      <p style="font-size: 10px; color: #9ca3af;">
        Você está recebendo este e-mail porque está cadastrada no sistema de acompanhamento pré-natal.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia e-mail e registra no log
 */
export async function enviarEmail(params: {
  gestanteId: number;
  destinatario: string;
  assunto: string;
  titulo: string;
  conteudo: string;
  tipoLembrete: string;
}): Promise<{ sucesso: boolean; erro?: string }> {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados não disponível');
  
  try {
    const transporter = await createTransporter();
    const htmlContent = criarTemplateEmail(params.titulo, params.conteudo);
    
    const emailFrom = await getConfig('EMAIL_USER') || '';
    await transporter.sendMail({
      from: emailFrom,
      to: params.destinatario,
      subject: params.assunto,
      html: htmlContent,
    });
    
    // Registrar log de sucesso
    await db.insert(logsEmails).values({
      gestanteId: params.gestanteId,
      tipoLembrete: params.tipoLembrete,
      emailDestinatario: params.destinatario,
      assunto: params.assunto,
      corpo: htmlContent,
      status: 'enviado',
    });
    
    return { sucesso: true };
  } catch (error: any) {
    // Registrar log de erro
    await db.insert(logsEmails).values({
      gestanteId: params.gestanteId,
      tipoLembrete: params.tipoLembrete,
      emailDestinatario: params.destinatario,
      assunto: params.assunto,
      corpo: params.conteudo,
      status: 'erro',
      mensagemErro: error.message,
    });
    
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Templates específicos de lembretes
 */
export const templates = {
  dtpa: (nomeGestante: string) => ({
    assunto: 'Lembrete: Vacina dTpa - 27 semanas',
    titulo: 'Hora da Vacina dTpa!',
    conteudo: `
      <p>Olá <strong>${nomeGestante}</strong>,</p>
      <p>Você está com <strong>27 semanas de gestação</strong> e chegou o momento de tomar a <strong>vacina dTpa</strong> (tríplice bacteriana acelular).</p>
      <p>Esta vacina é importante para proteger você e seu bebê contra <strong>difteria, tétano e coqueluche</strong>.</p>
      <p><strong>Por favor, agende sua vacina com a clínica.</strong></p>
    `,
  }),
  
  bronquiolite: (nomeGestante: string, semanas: number) => ({
    assunto: 'Lembrete: Vacina Bronquiolite',
    titulo: 'Hora da Vacina contra Bronquiolite!',
    conteudo: `
      <p>Olá <strong>${nomeGestante}</strong>,</p>
      <p>Você está com <strong>${semanas} semanas de gestação</strong> e está no período ideal para tomar a <strong>vacina contra bronquiolite</strong> (VSR - Vírus Sincicial Respiratório).</p>
      <p>Esta vacina protege seu bebê contra infecções respiratórias graves nos primeiros meses de vida.</p>
      <p><strong>Período recomendado:</strong> entre 32 e 36 semanas de gestação.</p>
      <p><strong>Por favor, agende sua vacina com a clínica.</strong></p>
    `,
  }),
  
  morfo1tri: (nomeGestante: string, semanas: number) => ({
    assunto: 'Lembrete: Ultrassom Morfológico 1º Trimestre',
    titulo: 'Agende seu Ultrassom Morfológico!',
    conteudo: `
      <p>Olá <strong>${nomeGestante}</strong>,</p>
      <p>Você está com <strong>${semanas} semanas de gestação</strong> e está próximo do período ideal para realizar o <strong>ultrassom morfológico do 1º trimestre</strong>.</p>
      <p><strong>Período recomendado:</strong> entre 11 e 14 semanas de gestação.</p>
      <p>Este exame é importante para:</p>
      <ul>
        <li>Avaliar a anatomia fetal inicial</li>
        <li>Medir a translucência nucal</li>
        <li>Rastreamento de anomalias cromossômicas</li>
      </ul>
      <p><strong>Por favor, agende seu exame com antecedência.</strong></p>
    `,
  }),
  
  morfo2tri: (nomeGestante: string, semanas: number, diasRestantes: number) => ({
    assunto: `Lembrete: Ultrassom Morfológico 2º Trimestre (${diasRestantes} ${diasRestantes === 1 ? 'semana' : 'semanas'})`,
    titulo: 'Agende seu Ultrassom Morfológico!',
    conteudo: `
      <p>Olá <strong>${nomeGestante}</strong>,</p>
      <p>Você está com <strong>${semanas} semanas de gestação</strong> e faltam <strong>${diasRestantes} ${diasRestantes === 1 ? 'semana' : 'semanas'}</strong> para o período ideal do <strong>ultrassom morfológico do 2º trimestre</strong>.</p>
      <p><strong>Período recomendado:</strong> entre 20 e 24 semanas de gestação.</p>
      <p>Este é um dos exames mais importantes da gestação para:</p>
      <ul>
        <li>Avaliação detalhada da anatomia fetal</li>
        <li>Detecção de malformações</li>
        <li>Avaliação do crescimento fetal</li>
        <li>Análise da placenta e líquido amniótico</li>
      </ul>
      <p><strong>Por favor, agende seu exame com antecedência para garantir uma vaga no período ideal.</strong></p>
    `,
  }),
};
