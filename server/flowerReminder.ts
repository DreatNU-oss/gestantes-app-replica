/**
 * Integração com o Sistema Administrativo - Lembrete de Flores
 * 
 * Quando uma gestante tem o 2º parto ou mais com o mesmo médico,
 * envia um lembrete via API para o sistema administrativo da clínica
 * para providenciar o envio de flores.
 * 
 * Usa a mesma API do agendamento de cesáreas (ADMIN_SYSTEM_URL + ADMIN_INTEGRATION_API_KEY).
 */

const getAdminConfig = () => ({
  url: process.env.ADMIN_SYSTEM_URL || '',
  apiKey: process.env.ADMIN_INTEGRATION_API_KEY || '',
});

interface FlowerReminderParams {
  gestanteId: number;
  gestanteNome: string;
  medicoNome: string;
  medicoId: number;
  numeroPartoMedico: number; // 2, 3, 4...
  dataParto: string; // YYYY-MM-DD
  tipoParto: 'normal' | 'cesarea';
}

interface FlowerReminderResult {
  success: boolean;
  lembreteId?: number;
  message?: string;
  error?: string;
}

/**
 * Envia um lembrete de flores para o sistema administrativo da clínica.
 * Chamado automaticamente quando o nº do parto com o mesmo médico é >= 2.
 * 
 * A chamada é não-bloqueante: falhas não interrompem o fluxo principal.
 */
export async function enviarLembreteFloresAdmin(params: FlowerReminderParams): Promise<FlowerReminderResult> {
  const { url, apiKey } = getAdminConfig();

  if (!url || !apiKey) {
    console.warn('[Flores] URL ou API Key do sistema administrativo não configurada');
    return { success: false, error: 'Configuração ausente' };
  }

  try {
    const dataFormatada = params.dataParto.split('-').reverse().join('/');
    const ordinal = params.numeroPartoMedico === 2 ? '2º' 
      : params.numeroPartoMedico === 3 ? '3º' 
      : `${params.numeroPartoMedico}º`;

    const response = await fetch(`${url}/api/integration/lembrete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        tipo: 'envio_flores',
        titulo: `🌸 Enviar Flores - ${ordinal} parto com ${params.medicoNome}`,
        descricao: `A paciente ${params.gestanteNome} teve seu ${ordinal} parto com ${params.medicoNome} em ${dataFormatada} (${params.tipoParto === 'cesarea' ? 'Cesárea' : 'Parto Normal'}). Por favor, providencie o envio de flores como cortesia da clínica.`,
        prioridade: 'alta',
        dataReferencia: params.dataParto,
        externalId: `flores-gestante-${params.gestanteId}-parto-${params.numeroPartoMedico}`,
        metadata: {
          gestanteId: params.gestanteId,
          gestanteNome: params.gestanteNome,
          medicoId: params.medicoId,
          medicoNome: params.medicoNome,
          numeroPartoMedico: params.numeroPartoMedico,
          tipoParto: params.tipoParto,
        },
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log(`[Flores] Lembrete criado: ${params.gestanteNome} - ${ordinal} parto com ${params.medicoNome}`);
      return { success: true, lembreteId: data.lembreteId, message: data.message };
    } else {
      console.error(`[Flores] Erro: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    // Não bloqueia o fluxo principal
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Flores] Falha na comunicação com sistema administrativo:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
