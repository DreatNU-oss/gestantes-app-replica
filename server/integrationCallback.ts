/**
 * Endpoint de Callback para Integração Bidirecional
 * 
 * Recebe atualizações do sistema administrativo (Mapa Cirúrgico)
 * quando uma cesárea é reagendada ou cancelada.
 * 
 * Autenticação via header X-API-Key usando GESTANTES_INTEGRATION_API_KEY.
 * 
 * Endpoints:
 *   POST /api/integration/callback/reagendamento - Reagendar cesárea
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getDb, getGestanteById, updateGestante } from './db';
import { gestantes, planosSaude } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sincronizarCesareaComAdmin, mapearHospital } from './cesareanSync';

const router = Router();

/**
 * Middleware de autenticação por API Key
 */
function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.GESTANTES_INTEGRATION_API_KEY;

  if (!expectedKey) {
    console.error('[Callback] GESTANTES_INTEGRATION_API_KEY não configurada');
    return res.status(500).json({ 
      success: false, 
      error: 'Configuração do servidor incompleta' 
    });
  }

  if (!apiKey || apiKey !== expectedKey) {
    console.warn('[Callback] Tentativa de acesso com API Key inválida');
    return res.status(401).json({ 
      success: false, 
      error: 'API Key inválida ou não fornecida' 
    });
  }

  next();
}

/**
 * GET /api/integration/callback/health
 * 
 * Health check para verificar se o endpoint está acessível e configurado.
 * Não requer autenticação.
 */
router.get('/health', async (_req: Request, res: Response) => {
  const hasApiKey = !!process.env.GESTANTES_INTEGRATION_API_KEY;
  
  return res.json({
    success: true,
    service: 'APP Gestantes - Integration Callback',
    timestamp: new Date().toISOString(),
    configured: hasApiKey,
  });
});

// Aplicar autenticação em todas as rotas abaixo
router.use(validateApiKey);

/**
 * POST /api/integration/callback/reagendamento
 * 
 * Recebe notificação de reagendamento de cesárea do sistema administrativo.
 * Atualiza a data de parto programado da gestante e re-sincroniza.
 * 
 * Body:
 *   - externalId: string (formato "gestante-{id}")
 *   - novaDataCirurgia: string (YYYY-MM-DD)
 *   - motivo?: string (motivo do reagendamento)
 * 
 * Response:
 *   - success: boolean
 *   - message: string
 *   - gestanteId?: number
 *   - nomeGestante?: string
 *   - dataAnterior?: string
 *   - novaData?: string
 */
router.post('/reagendamento', async (req: Request, res: Response) => {
  try {
    const { externalId, novaDataCirurgia, motivo } = req.body;

    // Validar campos obrigatórios
    if (!externalId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campo obrigatório ausente: externalId' 
      });
    }

    if (!novaDataCirurgia) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campo obrigatório ausente: novaDataCirurgia' 
      });
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(novaDataCirurgia)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de data inválido. Use YYYY-MM-DD' 
      });
    }

    // Validar que a data é válida
    const parsedDate = new Date(novaDataCirurgia + 'T12:00:00');
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Data inválida' 
      });
    }

    // Extrair ID da gestante do externalId (formato: "gestante-{id}")
    const match = externalId.match(/^gestante-(\d+)$/);
    if (!match) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de externalId inválido. Esperado: gestante-{id}' 
      });
    }

    const gestanteId = parseInt(match[1], 10);

    // Buscar gestante no banco
    const gestante = await getGestanteById(gestanteId);
    if (!gestante) {
      return res.status(404).json({ 
        success: false, 
        error: `Gestante não encontrada com ID ${gestanteId}` 
      });
    }

    const dataAnterior = gestante.dataPartoProgramado;

    // Verificar se a gestante tem cesárea programada
    if (gestante.tipoPartoDesejado !== 'cesariana') {
      return res.status(400).json({ 
        success: false, 
        error: `Gestante ${gestante.nome} não tem cesárea programada (tipo: ${gestante.tipoPartoDesejado})` 
      });
    }

    // Atualizar a data de parto programado
    await updateGestante(gestanteId, {
      dataPartoProgramado: novaDataCirurgia,
    });

    console.log(`[Callback] Cesárea reagendada: ${gestante.nome} | ${dataAnterior} → ${novaDataCirurgia} | Motivo: ${motivo || 'Não informado'}`);

    // Re-sincronizar com o sistema administrativo para confirmar a atualização
    // Buscar nome do plano de saúde para o convênio
    let planoSaudeNome: string | undefined;
    if (gestante.planoSaudeId) {
      const db = await getDb();
      if (db) {
        const planoResult = await db.select().from(planosSaude).where(eq(planosSaude.id, gestante.planoSaudeId)).limit(1);
        if (planoResult[0]) {
          planoSaudeNome = planoResult[0].nome;
        }
      }
    }

    // Mapear convênio
    const mapearConvenio = (nome?: string): string => {
      if (!nome) return 'Particular';
      const n = nome.toLowerCase();
      if (n.includes('unimed')) return 'Unimed';
      if (n.includes('fusex') || n.includes('fus')) return 'FUSEX';
      if (n.includes('cortesia')) return 'Cortesia';
      if (n.includes('particular')) return 'Particular';
      return nome;
    };

    const syncResult = await sincronizarCesareaComAdmin({
      id: gestanteId,
      nomeCompleto: gestante.nome,
      dataCesarea: novaDataCirurgia,
      convenio: mapearConvenio(planoSaudeNome),
      hospital: mapearHospital(gestante.hospitalParto),
      observacoes: motivo 
        ? `Reagendamento via Mapa Cirúrgico: ${motivo}` 
        : 'Reagendamento confirmado via callback',
    });

    return res.json({
      success: true,
      message: `Data de cesárea atualizada com sucesso`,
      gestanteId,
      nomeGestante: gestante.nome,
      dataAnterior: dataAnterior || 'Não definida',
      novaData: novaDataCirurgia,
      sincronizado: syncResult.success,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Callback] Erro ao processar reagendamento:', errorMsg);
    return res.status(500).json({ 
      success: false, 
      error: `Erro interno: ${errorMsg}` 
    });
  }
});

export const integrationCallbackRouter = router;
