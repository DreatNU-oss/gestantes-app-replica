import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

interface EnviarEmailParams {
  para: string;
  assunto: string;
  html: string;
  de?: string;
}

/**
 * Envia um email usando Resend
 */
export async function enviarEmail({ para, assunto, html, de }: EnviarEmailParams) {
  try {
    const remetente = de || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const resultado = await resend.emails.send({
      from: remetente,
      to: para,
      subject: assunto,
      html: html,
    });
    
    console.log("[Email] Enviado com sucesso:", resultado);
    return { sucesso: true, id: resultado.data?.id };
  } catch (error) {
    console.error("[Email] Erro ao enviar:", error);
    return { sucesso: false, erro: String(error) };
  }
}

/**
 * Cria template de email com rodapé padrão
 */
export function criarTemplateEmail(conteudo: string, logoUrl?: string): string {
  const logo = logoUrl || "https://storage.manus.space/gestantes-app/logo-horizontal.png";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header img {
      max-width: 200px;
      height: auto;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #722F37;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logo}" alt="Clínica Mais Mulher">
  </div>
  
  <div class="content">
    ${conteudo}
  </div>
  
  <div class="footer">
    <p><strong>Clínica Mais Mulher</strong></p>
    <p>Este é um e-mail automático do sistema de gestão de pré-natal.</p>
    <p>Por favor, não responda a este e-mail.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Template de lembrete de vacina dTpa
 */
export function templateVacinaDtpa(nomeGestante: string, dataRecomendada: string): string {
  const conteudo = `
    <h2>Olá, ${nomeGestante}!</h2>
    <p>Este é um lembrete importante sobre sua saúde e a do seu bebê.</p>
    <p><strong>Você está com 27 semanas de gestação!</strong></p>
    <p>É o momento ideal para tomar a <strong>vacina dTpa (tríplice bacteriana acelular)</strong>.</p>
    <p><strong>Data recomendada:</strong> ${dataRecomendada}</p>
    <h3>Por que essa vacina é importante?</h3>
    <ul>
      <li>Protege você e seu bebê contra difteria, tétano e coqueluche</li>
      <li>Os anticorpos passam para o bebê através da placenta</li>
      <li>Oferece proteção ao recém-nascido nos primeiros meses de vida</li>
    </ul>
    <p><strong>Onde tomar:</strong> A vacina está disponível em clínicas de vacinação particulares e também pode estar disponível no SUS. Consulte a unidade de saúde mais próxima.</p>
    <p>Em caso de dúvidas, entre em contato com seu médico obstetra.</p>
  `;
  
  return criarTemplateEmail(conteudo);
}

/**
 * Template de lembrete de vacina contra bronquiolite
 */
export function templateVacinaBronquiolite(nomeGestante: string, dataInicio: string, dataFim: string): string {
  const conteudo = `
    <h2>Olá, ${nomeGestante}!</h2>
    <p>Este é um lembrete importante sobre sua saúde e a do seu bebê.</p>
    <p><strong>Você está entre 32 e 36 semanas de gestação!</strong></p>
    <p>É o período ideal para tomar a <strong>vacina contra bronquiolite (Nirsevimab)</strong>.</p>
    <p><strong>Período recomendado:</strong> ${dataInicio} a ${dataFim}</p>
    <h3>Por que essa vacina é importante?</h3>
    <ul>
      <li>Protege o bebê contra o vírus sincicial respiratório (VSR)</li>
      <li>Previne bronquiolite e outras infecções respiratórias graves</li>
      <li>Os anticorpos passam para o bebê através da placenta</li>
      <li>Oferece proteção nos primeiros meses de vida</li>
    </ul>
    <p><strong>Onde tomar:</strong> A vacina está disponível em clínicas de vacinação particulares e também pode estar disponível no SUS. Consulte a unidade de saúde mais próxima.</p>
    <p>Em caso de dúvidas, entre em contato com seu médico obstetra.</p>
  `;
  
  return criarTemplateEmail(conteudo);
}

/**
 * Template de lembrete de morfológico 1º trimestre
 */
export function templateMorfologico1Tri(nomeGestante: string, dataInicio: string, dataFim: string): string {
  const conteudo = `
    <h2>Olá, ${nomeGestante}!</h2>
    <p>Este é um lembrete importante sobre um exame fundamental para o acompanhamento da sua gestação.</p>
    <p><strong>Você está próxima de 11 semanas de gestação!</strong></p>
    <p>É o momento ideal para agendar o <strong>Ultrassom Morfológico do 1º Trimestre</strong>.</p>
    <p><strong>Período recomendado:</strong> ${dataInicio} a ${dataFim} (entre 11 e 14 semanas)</p>
    <h3>Por que esse exame é importante?</h3>
    <ul>
      <li>Avalia a anatomia do bebê no primeiro trimestre</li>
      <li>Mede a translucência nucal (marcador de cromossomopatias)</li>
      <li>Verifica a presença do osso nasal</li>
      <li>Calcula o risco de síndrome de Down e outras alterações</li>
      <li>Confirma a idade gestacional com precisão</li>
    </ul>
    <p><strong>Importante:</strong> Se você já agendou este exame, pode desconsiderar esta mensagem.</p>
    <p>Em caso de dúvidas ou para agendar, entre em contato com seu médico obstetra.</p>
  `;
  
  return criarTemplateEmail(conteudo);
}

/**
 * Template de lembrete de morfológico 2º trimestre
 */
export function templateMorfologico2Tri(nomeGestante: string, dataInicio: string, dataFim: string): string {
  const conteudo = `
    <h2>Olá, ${nomeGestante}!</h2>
    <p>Este é um lembrete importante sobre um exame fundamental para o acompanhamento da sua gestação.</p>
    <p><strong>Você está próxima de 20 semanas de gestação!</strong></p>
    <p>É o momento ideal para agendar o <strong>Ultrassom Morfológico do 2º Trimestre</strong>.</p>
    <p><strong>Período recomendado:</strong> ${dataInicio} a ${dataFim} (entre 20 e 24 semanas)</p>
    <h3>Por que esse exame é importante?</h3>
    <ul>
      <li>Avalia detalhadamente a anatomia do bebê</li>
      <li>Verifica o desenvolvimento dos órgãos internos</li>
      <li>Identifica possíveis malformações estruturais</li>
      <li>Avalia o crescimento fetal</li>
      <li>Verifica a placenta e o líquido amniótico</li>
    </ul>
    <p><strong>Importante:</strong> Se você já agendou este exame, pode desconsiderar esta mensagem.</p>
    <p>Em caso de dúvidas ou para agendar, entre em contato com seu médico obstetra.</p>
  `;
  
  return criarTemplateEmail(conteudo);
}
