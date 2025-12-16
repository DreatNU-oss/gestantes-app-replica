import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { 
  gestantes, 
  codigosAcessoGestante, 
  sessoesGestante, 
  logsAcessoGestante 
} from '../drizzle/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { ENV } from './_core/env';
import { enviarEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'gestante-app-secret';
const CODIGO_EXPIRACAO_MINUTOS = 15;
const SESSAO_EXPIRACAO_DIAS = 30;

// Gerar código de 6 dígitos
function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Buscar gestante por email ou telefone
export async function buscarGestantePorContato(contato: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Limpar contato (remover espaços, traços, parênteses)
  const contatoLimpo = contato.replace(/[\s\-\(\)]/g, '');
  
  // Buscar por email ou telefone
  const gestante = await db.select()
    .from(gestantes)
    .where(
      contato.includes('@') 
        ? eq(gestantes.email, contato)
        : eq(gestantes.telefone, contatoLimpo)
    )
    .limit(1);
  
  return gestante[0] || null;
}

// Solicitar código de acesso
export async function solicitarCodigoAcesso(
  contato: string, 
  tipo: 'email' | 'sms' | 'whatsapp' = 'email'
) {
  const db = await getDb();
  if (!db) return { success: false, error: 'Erro de conexão com banco' };
  
  // Buscar gestante
  const gestante = await buscarGestantePorContato(contato);
  if (!gestante) {
    return { success: false, error: 'Gestante não encontrada com este contato' };
  }
  
  // Gerar código
  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_EXPIRACAO_MINUTOS * 60 * 1000);
  
  // Salvar código no banco
  await db.insert(codigosAcessoGestante).values({
    gestanteId: gestante.id,
    codigo,
    tipo,
    destino: contato,
    expiraEm,
  });
  
  // Enviar código por email
  if (tipo === 'email' && gestante.email) {
    try {
      await enviarEmail({
        gestanteId: gestante.id,
        destinatario: gestante.email,
        assunto: 'Código de Acesso - Pré-Natal Mais Mulher',
        titulo: 'Código de Acesso',
        conteudo: `
          <p>Olá, ${gestante.nome}!</p>
          <p>Você solicitou acesso ao seu acompanhamento pré-natal.</p>
          <p>Seu código de acesso é:</p>
          <div style="background: #F5E6E8; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8B4557;">${codigo}</span>
          </div>
          <p style="color: #666;">Este código expira em ${CODIGO_EXPIRACAO_MINUTOS} minutos.</p>
          <p style="color: #666;">Se você não solicitou este código, ignore este email.</p>
        `,
        tipoLembrete: 'codigo_acesso',
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error: 'Erro ao enviar código por email' };
    }
  }
  
  return { 
    success: true, 
    message: `Código enviado para ${tipo === 'email' ? 'seu email' : 'seu telefone'}`,
    gestanteNome: gestante.nome.split(' ')[0], // Primeiro nome apenas
  };
}

// Validar código e criar sessão
export async function validarCodigoECriarSessao(
  contato: string,
  codigo: string,
  dispositivo?: string,
  ip?: string
) {
  const db = await getDb();
  if (!db) return { success: false, error: 'Erro de conexão com banco' };
  
  // Buscar gestante
  const gestante = await buscarGestantePorContato(contato);
  if (!gestante) {
    return { success: false, error: 'Gestante não encontrada' };
  }
  
  // Buscar código válido
  const codigoValido = await db.select()
    .from(codigosAcessoGestante)
    .where(
      and(
        eq(codigosAcessoGestante.gestanteId, gestante.id),
        eq(codigosAcessoGestante.codigo, codigo),
        eq(codigosAcessoGestante.usado, 0),
        gt(codigosAcessoGestante.expiraEm, new Date())
      )
    )
    .orderBy(desc(codigosAcessoGestante.createdAt))
    .limit(1);
  
  if (!codigoValido[0]) {
    return { success: false, error: 'Código inválido ou expirado' };
  }
  
  // Marcar código como usado
  await db.update(codigosAcessoGestante)
    .set({ usado: 1 })
    .where(eq(codigosAcessoGestante.id, codigoValido[0].id));
  
  // Gerar JWT
  const expiraEm = new Date(Date.now() + SESSAO_EXPIRACAO_DIAS * 24 * 60 * 60 * 1000);
  const token = jwt.sign(
    { 
      gestanteId: gestante.id,
      tipo: 'gestante',
      exp: Math.floor(expiraEm.getTime() / 1000)
    },
    JWT_SECRET
  );
  
  // Criar sessão
  const [sessao] = await db.insert(sessoesGestante).values({
    gestanteId: gestante.id,
    token,
    dispositivo,
    ip,
    expiraEm,
  });
  
  // Registrar log de acesso
  await db.insert(logsAcessoGestante).values({
    gestanteId: gestante.id,
    sessaoId: sessao.insertId,
    acao: 'login',
    recurso: '/api/gestante/auth/validar',
    ip,
  });
  
  return {
    success: true,
    token,
    gestante: {
      id: gestante.id,
      nome: gestante.nome,
      email: gestante.email,
    },
    expiraEm: expiraEm.toISOString(),
  };
}

// Verificar token JWT de gestante
export async function verificarTokenGestante(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      gestanteId: number; 
      tipo: string;
      exp: number;
    };
    
    if (decoded.tipo !== 'gestante') {
      return null;
    }
    
    const db = await getDb();
    if (!db) return null;
    
    // Verificar se sessão ainda está ativa
    const sessao = await db.select()
      .from(sessoesGestante)
      .where(
        and(
          eq(sessoesGestante.gestanteId, decoded.gestanteId),
          eq(sessoesGestante.token, token),
          eq(sessoesGestante.ativo, 1),
          gt(sessoesGestante.expiraEm, new Date())
        )
      )
      .limit(1);
    
    if (!sessao[0]) {
      return null;
    }
    
    // Atualizar último acesso
    if (db) {
      await db.update(sessoesGestante)
        .set({ ultimoAcesso: new Date() })
        .where(eq(sessoesGestante.id, sessao[0].id));
    }
    
    return {
      gestanteId: decoded.gestanteId,
      sessaoId: sessao[0].id,
    };
  } catch (error) {
    return null;
  }
}

// Registrar log de acesso
export async function registrarLogAcesso(
  gestanteId: number,
  sessaoId: number | null,
  acao: string,
  recurso: string,
  ip?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(logsAcessoGestante).values({
    gestanteId,
    sessaoId,
    acao,
    recurso,
    ip,
    userAgent,
  });
}

// Encerrar sessão (logout)
export async function encerrarSessao(token: string) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db.update(sessoesGestante)
    .set({ ativo: 0 })
    .where(eq(sessoesGestante.token, token));
  
  return { success: true };
}

// Listar sessões ativas de uma gestante
export async function listarSessoesAtivas(gestanteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const sessoes = await db.select()
    .from(sessoesGestante)
    .where(
      and(
        eq(sessoesGestante.gestanteId, gestanteId),
        eq(sessoesGestante.ativo, 1),
        gt(sessoesGestante.expiraEm, new Date())
      )
    )
    .orderBy(desc(sessoesGestante.ultimoAcesso));
  
  return sessoes;
}
