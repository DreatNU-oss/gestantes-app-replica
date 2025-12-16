import { Resend } from "resend";

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Email sender - use Resend's default onboarding email (only sends to account owner email in test mode)
const FROM_EMAIL = "Mais Mulher <onboarding@resend.dev>";

interface SendVerificationCodeParams {
  to: string;
  code: string;
  gestanteNome?: string;
}

export async function sendVerificationCode({
  to,
  code,
  gestanteNome,
}: SendVerificationCodeParams): Promise<{ success: boolean; error?: string }> {
  const greeting = gestanteNome ? `Olá ${gestanteNome}` : "Olá";

  if (!resend) {
    console.warn("[Email] Resend não configurado - RESEND_API_KEY não definida");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
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

    if (error) {
      console.error("[Email] Failed to send verification code:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Verification code sent successfully:", data?.id);
    return { success: true };
  } catch (err) {
    console.error("[Email] Exception sending verification code:", err);
    return { success: false, error: String(err) };
  }
}
