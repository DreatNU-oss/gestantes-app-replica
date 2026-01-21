import nodemailer from "nodemailer";
import { getDb } from "./db";
import { configuracoesEmail } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface SendVerificationCodeParams {
  to: string;
  code: string;
  gestanteNome?: string;
}

async function getConfig(chave: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const configs = await db.select().from(configuracoesEmail).where(eq(configuracoesEmail.chave, chave));
  return configs.length > 0 ? configs[0].valor : null;
}

export async function sendVerificationCode({
  to,
  code,
  gestanteNome,
}: SendVerificationCodeParams): Promise<{ success: boolean; error?: string }> {
  const greeting = gestanteNome ? `Olá ${gestanteNome}` : "Olá";

  try {
    const gmailUser = await getConfig('gmail_user');
    const gmailPass = await getConfig('gmail_app_password');
    
    if (!gmailUser || !gmailPass) {
      console.warn("[Email] Gmail não configurado - credenciais não definidas");
      return { success: false, error: "Email service not configured" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const result = await transporter.sendMail({
      from: `"Clínica Mais Mulher" <${gmailUser}>`,
      to: to,
      subject: `${code} - Código de Verificação | Mais Mulher`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #722F37; margin: 0;">Mais Mulher</h1>
            <p style="color: #C4A4A4; margin: 5px 0;">Clínica de Saúde Feminina</p>
          </div>
          
          <p style="color: #333; font-size: 16px;">${greeting},</p>
          
          <p style="color: #333; font-size: 16px;">
            Seu código de verificação para acessar o app de Acompanhamento Pré-Natal é:
          </p>
          
          <div style="background: #F5E6C8; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #722F37; letter-spacing: 8px;">${code}</span>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Este código expira em 10 minutos. Se você não solicitou este código, ignore este email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Mais Mulher - Clínica de Saúde Feminina<br>
            Acompanhamento Pré-Natal
          </p>
        </div>
      `,
    });

    console.log("[Email] Verification code sent successfully:", result.messageId);
    return { success: true };
  } catch (err) {
    console.error("[Email] Exception sending verification code:", err);
    return { success: false, error: String(err) };
  }
}
