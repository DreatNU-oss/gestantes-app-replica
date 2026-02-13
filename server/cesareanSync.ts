/**
 * Integração com o Sistema Administrativo (Mapa Cirúrgico)
 * 
 * Sincroniza agendamentos de cesáreas com o sistema administrativo da clínica.
 * A API usa lógica de upsert: se o externalId já existe, atualiza; se não, cria.
 */

const getAdminConfig = () => ({
  url: process.env.ADMIN_SYSTEM_URL || '',
  apiKey: process.env.ADMIN_INTEGRATION_API_KEY || '',
});

interface SyncCesareaParams {
  id: number | string;
  nomeCompleto: string;
  dataCesarea: string | null; // YYYY-MM-DD ou null se cancelada/removida
  hospital?: string;
  convenio?: string;
  observacoes?: string;
}

interface SyncResult {
  success: boolean;
  atualizado?: boolean;
  cirurgiaId?: number;
  message?: string;
  error?: string;
}

/**
 * Sincroniza uma cesárea individual com o sistema administrativo.
 * - Se dataCesarea é fornecida: cria ou atualiza (POST - upsert)
 * - Se dataCesarea é null: remove o agendamento (DELETE)
 * 
 * A chamada é não-bloqueante: falhas não interrompem o fluxo principal.
 */
export async function sincronizarCesareaComAdmin(params: SyncCesareaParams): Promise<SyncResult> {
  const { url, apiKey } = getAdminConfig();

  if (!url || !apiKey) {
    console.warn('[Integração] URL ou API Key do sistema administrativo não configurada');
    return { success: false, error: 'Configuração ausente' };
  }

  try {
    if (params.dataCesarea) {
      // Criar ou atualizar agendamento (upsert automático pelo externalId)
      const response = await fetch(`${url}/api/integration/cesarea`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          pacienteNome: params.nomeCompleto,
          dataCirurgia: params.dataCesarea,
          hospital: params.hospital || 'Hospital Unimed',
          convenio: params.convenio || 'Particular',
          procedimento: 'Cesárea',
          observacoes: params.observacoes || 'Agendamento via APP Gestantes',
          externalId: `gestante-${params.id}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.atualizado) {
          console.log(`[Integração] Cesárea ATUALIZADA: ${params.nomeCompleto} - nova data: ${params.dataCesarea}`);
        } else {
          console.log(`[Integração] Cesárea CRIADA: ${params.nomeCompleto} em ${params.dataCesarea}`);
        }
        return { success: true, atualizado: data.atualizado, cirurgiaId: data.cirurgiaId, message: data.message };
      } else {
        console.error(`[Integração] Erro: ${data.error}`);
        return { success: false, error: data.error };
      }
    } else {
      // Data removida - deletar agendamento no sistema admin
      const response = await fetch(
        `${url}/api/integration/cesarea/gestante-${params.id}`,
        {
          method: 'DELETE',
          headers: { 'X-API-Key': apiKey },
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log(`[Integração] Agendamento removido: ${params.nomeCompleto}`);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Falha ao remover' };
      }
    }
  } catch (error) {
    // Não bloqueia o fluxo principal
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Integração] Falha na comunicação com sistema administrativo:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sincroniza todas as gestantes com data de cesárea em lote.
 * Usa upsert, pode ser executada múltiplas vezes sem duplicar.
 */
export async function sincronizarTodasCesareasComAdmin(
  gestantes: Array<{
    id: number;
    nome: string;
    dataPartoProgramado: string;
    planoSaudeNome?: string;
  }>,
  onProgress?: (current: number, total: number, nome: string) => void
): Promise<{ sucesso: number; falhas: number; total: number; detalhes: Array<{ nome: string; status: 'sucesso' | 'falha'; mensagem: string }> }> {
  const { url, apiKey } = getAdminConfig();

  if (!url || !apiKey) {
    console.warn('[Integração] URL ou API Key não configurada');
    return { sucesso: 0, falhas: 0, total: 0, detalhes: [] };
  }

  let sucesso = 0;
  let falhas = 0;
  const detalhes: Array<{ nome: string; status: 'sucesso' | 'falha'; mensagem: string }> = [];

  for (let i = 0; i < gestantes.length; i++) {
    const gestante = gestantes[i];
    onProgress?.(i + 1, gestantes.length, gestante.nome);

    const result = await sincronizarCesareaComAdmin({
      id: gestante.id,
      nomeCompleto: gestante.nome,
      dataCesarea: gestante.dataPartoProgramado,
      convenio: mapearConvenio(gestante.planoSaudeNome),
      observacoes: 'Sincronização em lote - APP Gestantes',
    });

    if (result.success) {
      sucesso++;
      detalhes.push({
        nome: gestante.nome,
        status: 'sucesso',
        mensagem: result.atualizado ? 'Atualizado' : 'Criado',
      });
    } else {
      falhas++;
      detalhes.push({
        nome: gestante.nome,
        status: 'falha',
        mensagem: result.error || 'Erro desconhecido',
      });
    }
  }

  console.log(`[Sync] Concluído: ${sucesso} sucesso, ${falhas} falhas, ${gestantes.length} total`);
  return { sucesso, falhas, total: gestantes.length, detalhes };
}

/**
 * Mapeia o nome do plano de saúde para o formato esperado pela API do sistema administrativo.
 */
function mapearConvenio(planoSaudeNome?: string): string {
  if (!planoSaudeNome) return 'Particular';
  
  const nome = planoSaudeNome.toLowerCase();
  if (nome.includes('unimed')) return 'Unimed';
  if (nome.includes('fusex') || nome.includes('fus')) return 'FUSEX';
  if (nome.includes('cortesia')) return 'Cortesia';
  if (nome.includes('particular')) return 'Particular';
  
  // Se não reconhecer, retorna o nome original
  return planoSaudeNome;
}
