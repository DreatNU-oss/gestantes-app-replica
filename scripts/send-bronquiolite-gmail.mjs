import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

// Configuração do banco de dados
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const dbConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
};

async function main() {
  console.log('🔄 Conectando ao banco de dados...');
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Buscar gestante TESTE TESTE
    console.log('🔍 Buscando gestante TESTE TESTE...');
    const [gestantes] = await connection.execute(
      'SELECT id, nome, email FROM gestantes WHERE nome = ?',
      ['TESTE TESTE']
    );
    
    if (gestantes.length === 0) {
      console.error('❌ Gestante TESTE TESTE não encontrada');
      return;
    }
    
    const gestante = gestantes[0];
    console.log(`✅ Gestante encontrada: ${gestante.nome} (${gestante.email})`);
    
    // Buscar configurações SMTP do Gmail
    console.log('🔑 Buscando configurações SMTP...');
    const [emailConfigs] = await connection.execute(
      'SELECT valor FROM configuracoesEmail WHERE chave = ?',
      ['smtp_email']
    );
    const [senhaConfigs] = await connection.execute(
      'SELECT valor FROM configuracoesEmail WHERE chave = ?',
      ['smtp_senha']
    );
    
    if (emailConfigs.length === 0 || senhaConfigs.length === 0) {
      console.error('❌ Configurações SMTP não encontradas');
      return;
    }
    
    const smtpEmail = emailConfigs[0].valor;
    const smtpSenha = senhaConfigs[0].valor;
    
    console.log(`   E-mail SMTP: ${smtpEmail}`);
    
    // Criar transporter do Nodemailer para Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: smtpSenha
      }
    });
    
    // Verificar conexão
    console.log('🔗 Verificando conexão com Gmail...');
    await transporter.verify();
    console.log('✅ Conexão com Gmail estabelecida!');
    
    // Template de bronquiolite
    const nomeGestante = gestante.nome.split(' ')[0];
    const semanas = 36;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ffffff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #f97316; }
    .header img { max-width: 300px; height: auto; margin-bottom: 15px; }
    .header h1 { color: #7c2d3d; margin: 0; font-size: 24px; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663167696128/gejrETdwpvuKoumY.png" alt="Clínica Mais Mulher" />
      <h1>Hora da Vacina contra Bronquiolite!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${nomeGestante}</strong>,</p>
      <p>Você está com <strong>${semanas} semanas de gestação</strong> e está no período ideal para tomar a <strong>vacina contra bronquiolite</strong> (VSR - Vírus Sincicial Respiratório).</p>
      <p>Esta vacina protege seu bebê contra infecções respiratórias graves nos primeiros meses de vida.</p>
      <p><strong>Período recomendado:</strong> entre 32 e 36 semanas de gestação.</p>
      <p><strong>Procure uma clínica de vacinação para agendar sua vacina.</strong></p>
      <p style="color: #059669; font-weight: bold;">💚 Esta vacina também está disponível gratuitamente pelo SUS.</p>
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
    
    // Enviar para o e-mail da gestante (dreatnu@yahoo.com)
    const destinatario = gestante.email;
    
    console.log('📧 Enviando e-mail de bronquiolite via Gmail...');
    console.log(`   De: ${smtpEmail}`);
    console.log(`   Para: ${destinatario}`);
    
    const result = await transporter.sendMail({
      from: `"Clínica Mais Mulher" <${smtpEmail}>`,
      to: destinatario,
      subject: 'Lembrete: Vacina Bronquiolite',
      html: htmlContent,
    });
    
    console.log('✅ E-mail enviado com sucesso!');
    console.log(`   Message ID: ${result.messageId}`);
    
    // Registrar no log
    await connection.execute(
      `INSERT INTO logsEmails (gestanteId, tipoLembrete, emailDestinatario, assunto, corpo, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [gestante.id, 'bronquiolite_gmail', destinatario, 'Lembrete: Vacina Bronquiolite', htmlContent, 'enviado']
    );
    
    console.log('📝 Log registrado no banco de dados');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   Possível problema com a Senha de App do Gmail.');
      console.error('   Verifique se a verificação em duas etapas está ativada e a senha de app está correta.');
    }
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Conexão encerrada');
  }
}

main().catch(console.error);
