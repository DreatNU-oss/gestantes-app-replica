/**
 * WhatsApp notification service using WaSenderAPI
 * Adaptado para o APP Gestantes - envio de mensagens automáticas para gestantes
 * 
 * Suporta:
 * - Envio de texto simples
 * - Envio de PDF via URL (documentUrl)
 * - Variáveis de template: {nome}, {ig_semanas}, {ig_dias}, {dpp}, {medico}
 */

import { getDb } from './db';
import { whatsappHistorico, mensagemTemplates, whatsappConfig } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { storagePut } from './storage';

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppMessage {
  to: string;        // Phone number: 5535999999999 (no +, no spaces)
  text: string;
  documentUrl?: string; // URL do PDF para enviar como documento
}

export interface WhatsAppResult {
  success: boolean;
  error?: string;
}

export interface GestanteContext {
  nome: string;
  telefone: string;
  igSemanas?: number;
  igDias?: number;
  dpp?: string;
  medico?: string;
  telefoneMedico?: string;
  gestanteId?: number;
}

// ─── Phone Normalization ────────────────────────────────────────────────────

/**
 * Normaliza telefone brasileiro para formato E.164 (apenas dígitos com código do país).
 * Assume sempre Brasil (+55) pois o sistema atende apenas gestantes no Brasil.
 * Ex: "(35) 99137-5232" → "5535991375232"
 *     "35991375232"    → "5535991375232"
 *     "5535991375232"  → "5535991375232"
 *     "+5535991375232" → "5535991375232"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, '');
  // Se começa com 0, remove (ex: 035...)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  // Se não começa com 55, adiciona código do Brasil
  if (!digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

// ─── Core Send Function ───────────────────────────────────────────────────────

/**
 * Código da clínica principal (proprietário do sistema).
 * Esta clínica usa WASENDER_API_KEY (número exclusivo do proprietário).
 * Todas as outras clínicas usam WASENDER_API_KEY_OUTRAS_CLINICAS (número compartilhado).
 */
const CLINICA_PRINCIPAL_CODIGO = '00001';

/**
 * Obtém a API key do WaSenderAPI para uma clínica.
 * 
 * Roteamento:
 * - Clínica 00001 (principal): usa WASENDER_API_KEY
 * - Todas as outras clínicas: usa WASENDER_API_KEY_OUTRAS_CLINICAS
 * - Fallback: config por clínica no banco (whatsappConfig.apiKey)
 */
async function getApiKey(clinicaId?: number): Promise<string> {
  const db = await getDb();

  // Se temos clinicaId, verificar qual clínica é para escolher a chave correta
  if (clinicaId && db) {
    // Buscar o código da clínica para determinar qual API key usar
    const { clinicas } = await import('../drizzle/schema');
    const [clinica] = await db
      .select({ codigo: clinicas.codigo })
      .from(clinicas)
      .where(eq(clinicas.id, clinicaId))
      .limit(1);

    if (clinica) {
      if (clinica.codigo === CLINICA_PRINCIPAL_CODIGO) {
        // Clínica principal: usa a chave do proprietário
        const key = process.env.WASENDER_API_KEY;
        if (key) return key;
      } else {
        // Outras clínicas: usa a chave compartilhada
        const key = process.env.WASENDER_API_KEY_OUTRAS_CLINICAS;
        if (key) return key;
      }
    }

    // Fallback: config por clínica no banco
    const [config] = await db
      .select()
      .from(whatsappConfig)
      .where(and(eq(whatsappConfig.clinicaId, clinicaId), eq(whatsappConfig.ativo, 1)))
      .limit(1);
    if (config?.apiKey) return config.apiKey;
  }

  // Sem clinicaId: fallback para env var global (compatibilidade)
  const envKey = process.env.WASENDER_API_KEY;
  if (envKey) return envKey;

  return '';
}

/**
 * Send a single WhatsApp message via WaSenderAPI.
 * Never throws — always returns a result object.
 */
export async function sendWhatsApp(message: WhatsAppMessage, clinicaId?: number): Promise<WhatsAppResult> {
  const apiKey = await getApiKey(clinicaId);
  
  if (!apiKey) {
    return { success: false, error: 'WASENDER_API_KEY não configurada para esta clínica' };
  }

  try {
    // Always normalize phone number to ensure +55 country code
    const normalizedTo = normalizePhone(message.to) || message.to;
    const body: Record<string, string> = {
      to: normalizedTo,
      text: message.text,
    };
    if (message.documentUrl) body.documentUrl = message.documentUrl;

    const response = await fetch(WASENDER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ─── Template Variable Replacement ───────────────────────────────────────────

/**
 * Extrai o primeiro nome de um nome completo.
 * Ex: "Maria da Silva" → "Maria", "ANA CLARA" → "Ana Clara"
 */
export function extrairPrimeiroNome(nomeCompleto: string): string {
  if (!nomeCompleto) return '';
  const partes = nomeCompleto.trim().split(/\s+/);
  // Se o nome tem 2+ partes e a segunda é uma preposição curta, incluir a terceira parte
  // Ex: "Ana Clara Borges" → "Ana Clara", "Maria da Silva" → "Maria"
  let primeiro = partes[0] || '';
  if (partes.length >= 3 && ['da', 'de', 'do', 'das', 'dos'].includes(partes[1].toLowerCase())) {
    primeiro = partes[0]; // Só o primeiro nome
  } else if (partes.length >= 2) {
    // Verificar se o segundo nome é curto (possível nome composto como "Ana Clara")
    // Usar apenas o primeiro nome para manter pessoal
    primeiro = partes[0];
  }
  // Capitalizar corretamente: primeira letra maiúscula, resto minúsculo
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

/**
 * Substitui variáveis no template de mensagem com dados da gestante.
 * Variáveis suportadas: {nome} (primeiro nome), {nome_completo}, {ig_semanas}, {ig_dias}, {dpp}, {medico}, {telefone_medico}
 */
export function replaceTemplateVariables(template: string, context: GestanteContext): string {
  let msg = template;
  const primeiroNome = extrairPrimeiroNome(context.nome || '');
  msg = msg.replace(/\{nome\}/g, primeiroNome);
  msg = msg.replace(/\{nome_completo\}/g, context.nome || '');
  msg = msg.replace(/\{ig_semanas\}/g, String(context.igSemanas ?? ''));
  msg = msg.replace(/\{ig_dias\}/g, String(context.igDias ?? ''));
  msg = msg.replace(/\{dpp\}/g, context.dpp || '');
  msg = msg.replace(/\{medico\}/g, context.medico || '');
  msg = msg.replace(/\{telefone_medico\}/g, context.telefoneMedico || '');
  return msg;
}

// ─── Send to Gestante ────────────────────────────────────────────────────────

/**
 * Envia uma mensagem para uma gestante específica usando um template.
 * Registra no histórico.
 */
export async function sendToGestante(
  clinicaId: number,
  templateId: number,
  gestante: GestanteContext,
): Promise<WhatsAppResult> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database not available' };

  // Buscar template
  const [template] = await db
    .select()
    .from(mensagemTemplates)
    .where(and(
      eq(mensagemTemplates.id, templateId),
      eq(mensagemTemplates.clinicaId, clinicaId),
      eq(mensagemTemplates.ativo, 1),
    ))
    .limit(1);

  if (!template) {
    return { success: false, error: 'Template não encontrado ou inativo' };
  }

  if (!gestante.telefone) {
    return { success: false, error: 'Gestante sem telefone cadastrado' };
  }

  // Formatar número com código do país (+55 Brasil)
  const telefoneFormatado = normalizePhone(gestante.telefone);

  // Substituir variáveis
  const mensagemFinal = replaceTemplateVariables(template.mensagem, gestante);

  // Enviar
  const result = await sendWhatsApp(
    {
      to: telefoneFormatado,
      text: mensagemFinal,
      documentUrl: template.pdfUrl || undefined,
    },
    clinicaId,
  );

  // Registrar no histórico
  await db.insert(whatsappHistorico).values({
    clinicaId,
    gestanteId: gestante.gestanteId || null,
    templateId: template.id,
    telefone: telefoneFormatado,
    mensagem: mensagemFinal,
    pdfUrl: template.pdfUrl || null,
    status: result.success ? 'enviado' : 'falhou',
    erroMensagem: result.error || null,
    nomeGestante: gestante.nome || null,
  });

  return result;
}

/**
 * Envia uma mensagem manual (sem template) para um número específico.
 * Registra no histórico.
 */
export async function sendManualMessage(
  clinicaId: number,
  telefone: string,
  mensagem: string,
  pdfUrl?: string,
  nomeGestante?: string,
  gestanteId?: number,
): Promise<WhatsAppResult> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database not available' };

  const telefoneFormatado = normalizePhone(telefone);

  const result = await sendWhatsApp(
    {
      to: telefoneFormatado,
      text: mensagem,
      documentUrl: pdfUrl || undefined,
    },
    clinicaId,
  );

  // Registrar no histórico
  await db.insert(whatsappHistorico).values({
    clinicaId,
    gestanteId: gestanteId || null,
    templateId: null,
    telefone: telefoneFormatado,
    mensagem,
    pdfUrl: pdfUrl || null,
    status: result.success ? 'enviado' : 'falhou',
    erroMensagem: result.error || null,
    nomeGestante: nomeGestante || null,
  });

  return result;
}

// ─── PDF Upload Helper ───────────────────────────────────────────────────────

/**
 * Faz upload de um PDF para o S3 e retorna a URL.
 */
export async function uploadPdf(
  clinicaId: number,
  fileName: string,
  fileBuffer: Buffer,
): Promise<{ url: string; key: string }> {
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `clinicas/${clinicaId}/whatsapp-pdfs/${safeFileName}-${randomSuffix}.pdf`;
  
  const { url } = await storagePut(fileKey, fileBuffer, 'application/pdf');
  return { url, key: fileKey };
}
