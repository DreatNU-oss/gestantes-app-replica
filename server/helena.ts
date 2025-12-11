/**
 * Integração com API do Helena para envio de mensagens WhatsApp
 * Documentação: https://helena.readme.io/reference/post_v1-message-send
 */

const HELENA_API_URL = "https://api.helena.run/chat/v1";
const HELENA_API_TOKEN = process.env.HELENA_API_TOKEN || "";

interface SendMessageParams {
  to: string; // Número de telefone no formato 5511999999999
  message: string; // Texto da mensagem
  from?: string; // Número do remetente (opcional)
}

interface SendMessageResponse {
  id: string;
  sessionId: string;
  senderId: string;
  status: "PROCESSING" | "SENT" | "ERROR";
  statusUrl: string;
}

/**
 * Envia uma mensagem via WhatsApp usando a API do Helena
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResponse> {
  const { to, message, from } = params;

  // Validar token
  if (!HELENA_API_TOKEN) {
    throw new Error("HELENA_API_TOKEN não configurado nas variáveis de ambiente");
  }

  // Formatar número de telefone (remover caracteres especiais)
  const phoneNumber = to.replace(/\D/g, "");

  // Validar formato do número
  if (phoneNumber.length < 10 || phoneNumber.length > 15) {
    throw new Error("Número de telefone inválido. Use o formato: 5511999999999");
  }

  try {
    const response = await fetch(`${HELENA_API_URL}/message/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HELENA_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: from || undefined,
        body: {
          text: message,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Helena: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as SendMessageResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Falha ao enviar mensagem WhatsApp: ${error.message}`);
    }
    throw new Error("Falha ao enviar mensagem WhatsApp: Erro desconhecido");
  }
}

/**
 * Consulta o status de uma mensagem enviada
 */
export async function getMessageStatus(messageId: string): Promise<{
  id: string;
  status: string;
  error?: string;
}> {
  if (!HELENA_API_TOKEN) {
    throw new Error("HELENA_API_TOKEN não configurado nas variáveis de ambiente");
  }

  try {
    const response = await fetch(`${HELENA_API_URL}/message/${messageId}/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${HELENA_API_TOKEN}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Helena: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Falha ao consultar status: ${error.message}`);
    }
    throw new Error("Falha ao consultar status: Erro desconhecido");
  }
}

/**
 * Templates de mensagens para lembretes de vacinas do pré-natal
 */
export const TEMPLATES_VACINAS = {
  hepatite_b: {
    nome: "Hepatite B",
    mensagem: (nomeGestante: string) =>
      `Olá ${nomeGestante}! 💉\n\nEste é um lembrete importante da Clínica Mais Mulher.\n\nÉ hora de tomar a vacina contra *Hepatite B*.\n\nEsta vacina é fundamental para proteger você e seu bebê.\n\nPor favor, agende sua dose o mais breve possível.\n\n_Equipe Mais Mulher_ 💗`,
  },
  dtpa: {
    nome: "dTpa (Tríplice Bacteriana)",
    mensagem: (nomeGestante: string) =>
      `Olá ${nomeGestante}! 💉\n\nEste é um lembrete importante da Clínica Mais Mulher.\n\nÉ hora de tomar a vacina *dTpa (Tríplice Bacteriana)*.\n\nEsta vacina protege contra difteria, tétano e coqueluche, e é recomendada entre 27-36 semanas de gestação.\n\nPor favor, agende sua dose o mais breve possível.\n\n_Equipe Mais Mulher_ 💗`,
  },
  influenza: {
    nome: "Influenza (Gripe)",
    mensagem: (nomeGestante: string) =>
      `Olá ${nomeGestante}! 💉\n\nEste é um lembrete importante da Clínica Mais Mulher.\n\nÉ hora de tomar a vacina contra *Influenza (Gripe)*.\n\nEsta vacina pode ser tomada em qualquer trimestre da gestação e protege você e seu bebê.\n\nPor favor, agende sua dose o mais breve possível.\n\n_Equipe Mais Mulher_ 💗`,
  },
  covid19: {
    nome: "COVID-19",
    mensagem: (nomeGestante: string) =>
      `Olá ${nomeGestante}! 💉\n\nEste é um lembrete importante da Clínica Mais Mulher.\n\nÉ hora de tomar a vacina contra *COVID-19*.\n\nA vacinação é segura durante a gestação e protege você e seu bebê.\n\nPor favor, agende sua dose o mais breve possível.\n\n_Equipe Mais Mulher_ 💗`,
  },
  lembrete_consulta: {
    nome: "Lembrete de Consulta",
    mensagem: (nomeGestante: string, dataConsulta: string, horario: string) =>
      `Olá ${nomeGestante}! 📅\n\nEste é um lembrete da sua consulta pré-natal na Clínica Mais Mulher.\n\n*Data:* ${dataConsulta}\n*Horário:* ${horario}\n\nPor favor, chegue com 10 minutos de antecedência.\n\nEm caso de imprevistos, entre em contato conosco.\n\n_Equipe Mais Mulher_ 💗`,
  },
  lembrete_exame: {
    nome: "Lembrete de Exame",
    mensagem: (nomeGestante: string, tipoExame: string) =>
      `Olá ${nomeGestante}! 🔬\n\nEste é um lembrete importante da Clínica Mais Mulher.\n\nÉ hora de realizar o exame: *${tipoExame}*\n\nPor favor, agende o quanto antes para acompanharmos sua gestação adequadamente.\n\n_Equipe Mais Mulher_ 💗`,
  },
};

export type TemplateVacina = keyof typeof TEMPLATES_VACINAS;
