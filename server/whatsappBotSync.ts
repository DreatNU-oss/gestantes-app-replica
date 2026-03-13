/**
 * WhatsApp Bot Sync Service
 * Sincroniza gestantes com a allowlist do bot de WhatsApp em andreschlemper.com
 * Integração unidirecional: gestantesapp.com → bot
 */

// Normaliza URL removendo www para evitar redirect 301 que remove header Authorization
const RAW_BOT_API_URL = process.env.WHATSAPP_BOT_API_URL || "";
const BOT_API_URL = RAW_BOT_API_URL.replace("://www.", "://");
const BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY || "";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${BOT_API_KEY}`,
  };
}

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[BotSync] ${timestamp} - ${message}`, data);
  } else {
    console.log(`[BotSync] ${timestamp} - ${message}`);
  }
}

function logError(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[BotSync] ${timestamp} - ERROR: ${message}`, error?.message || error || "");
}

/**
 * Formata telefone para o formato E.164 brasileiro (apenas dígitos)
 * Ex: (35) 99115-6028 → 5535991156028
 */
export function formatPhoneForBot(phone: string): string {
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, "");
  
  // Se começa com 0, remove
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  
  // Se não começa com 55, adiciona
  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }
  
  return digits;
}

/**
 * Cadastra uma gestante na allowlist do bot
 */
export async function syncPatientToBot(
  phone: string,
  name: string,
  externalId: string | number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!BOT_API_URL || !BOT_API_KEY) {
    log("Bot sync desabilitado (API_URL ou API_KEY não configurados)");
    return { success: false, error: "Bot sync não configurado" };
  }

  if (!phone) {
    log("Ignorando sync - gestante sem telefone");
    return { success: false, error: "Sem telefone" };
  }

  const formattedPhone = formatPhoneForBot(phone);

  try {
    log(`Sincronizando gestante ${name} (${formattedPhone}) com o bot...`);
    
    const response = await fetch(BOT_API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        phone: formattedPhone,
        name,
        status: "active",
        notes: notes || "",
        externalId: String(externalId),
      }),
    });

    if (response.ok) {
      log(`Gestante ${name} sincronizada com sucesso`);
      return { success: true };
    }

    // 409 = já existe, ignorar silenciosamente
    if (response.status === 409) {
      log(`Gestante ${name} já existe no bot (409) - ignorando`);
      return { success: true };
    }

    const errorText = await response.text().catch(() => "");
    logError(`Falha ao sincronizar ${name}: HTTP ${response.status}`, errorText);
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error: any) {
    logError(`Erro de rede ao sincronizar ${name}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove uma gestante da allowlist do bot
 */
export async function removePatientFromBot(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  if (!BOT_API_URL || !BOT_API_KEY) {
    log("Bot sync desabilitado (API_URL ou API_KEY não configurados)");
    return { success: false, error: "Bot sync não configurado" };
  }

  if (!phone) {
    log("Ignorando remoção - sem telefone");
    return { success: false, error: "Sem telefone" };
  }

  const formattedPhone = formatPhoneForBot(phone);

  try {
    log(`Removendo gestante (${formattedPhone}) do bot...`);
    
    const response = await fetch(`${BOT_API_URL}/${formattedPhone}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (response.ok) {
      log(`Gestante (${formattedPhone}) removida do bot com sucesso`);
      return { success: true };
    }

    // 404 = não existe, ignorar
    if (response.status === 404) {
      log(`Gestante (${formattedPhone}) não encontrada no bot (404) - ignorando`);
      return { success: true };
    }

    const errorText = await response.text().catch(() => "");
    logError(`Falha ao remover (${formattedPhone}): HTTP ${response.status}`, errorText);
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error: any) {
    logError(`Erro de rede ao remover (${formattedPhone})`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza dados de uma gestante no bot
 */
export async function updatePatientOnBot(
  phone: string,
  data: { name?: string; status?: string; notes?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!BOT_API_URL || !BOT_API_KEY) {
    log("Bot sync desabilitado (API_URL ou API_KEY não configurados)");
    return { success: false, error: "Bot sync não configurado" };
  }

  if (!phone) {
    log("Ignorando atualização - sem telefone");
    return { success: false, error: "Sem telefone" };
  }

  const formattedPhone = formatPhoneForBot(phone);

  try {
    log(`Atualizando gestante (${formattedPhone}) no bot...`);
    
    const response = await fetch(`${BOT_API_URL}/${formattedPhone}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (response.ok) {
      log(`Gestante (${formattedPhone}) atualizada no bot com sucesso`);
      return { success: true };
    }

    // 404 = não existe no bot, tentar cadastrar
    if (response.status === 404) {
      log(`Gestante (${formattedPhone}) não encontrada no bot para atualização - ignorando`);
      return { success: false, error: "Não encontrada no bot" };
    }

    const errorText = await response.text().catch(() => "");
    logError(`Falha ao atualizar (${formattedPhone}): HTTP ${response.status}`, errorText);
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error: any) {
    logError(`Erro de rede ao atualizar (${formattedPhone})`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sincroniza todas as gestantes ativas com telefone para o bot (bulk)
 */
export async function syncAllPatientsToBot(
  patients: Array<{ phone: string; name: string; externalId: string | number; notes?: string }>
): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
  if (!BOT_API_URL || !BOT_API_KEY) {
    log("Bot sync desabilitado (API_URL ou API_KEY não configurados)");
    return { success: false, synced: 0, failed: 0, error: "Bot sync não configurado" };
  }

  // Filtrar apenas pacientes com telefone
  const validPatients = patients.filter(p => p.phone);
  
  if (validPatients.length === 0) {
    log("Nenhuma gestante com telefone para sincronizar");
    return { success: true, synced: 0, failed: 0 };
  }

  const bulkData = {
    patients: validPatients.map(p => ({
      phone: formatPhoneForBot(p.phone),
      name: p.name,
      status: "active",
      notes: p.notes || "",
      externalId: String(p.externalId),
    })),
  };

  try {
    log(`Sincronizando ${validPatients.length} gestantes em lote...`);
    
    const response = await fetch(`${BOT_API_URL}/bulk`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(bulkData),
    });

    if (response.ok) {
      const result = await response.json().catch(() => ({}));
      log(`Sincronização em lote concluída`, result);
      return { 
        success: true, 
        synced: result.synced || validPatients.length, 
        failed: result.failed || 0 
      };
    }

    const errorText = await response.text().catch(() => "");
    logError(`Falha na sincronização em lote: HTTP ${response.status}`, errorText);
    return { success: false, synced: 0, failed: validPatients.length, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error: any) {
    logError(`Erro de rede na sincronização em lote`, error);
    return { success: false, synced: 0, failed: validPatients.length, error: error.message };
  }
}

/**
 * Verifica se o bot está acessível (health check)
 */
export async function checkBotHealth(): Promise<{ available: boolean; error?: string }> {
  if (!BOT_API_URL || !BOT_API_KEY) {
    return { available: false, error: "Bot sync não configurado" };
  }

  try {
    const response = await fetch(`${BOT_API_URL}?limit=1`, {
      method: "GET",
      headers: getHeaders(),
    });

    return { available: response.ok };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}
