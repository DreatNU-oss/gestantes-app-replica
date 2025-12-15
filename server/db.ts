import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  gestantes,
  InsertGestante,
  Gestante,
  medicos,
  InsertMedico,
  Medico,
  planosSaude,
  InsertPlanoSaude,
  PlanoSaude,
  consultasPrenatal,
  InsertConsultaPrenatal,
  ConsultaPrenatal,
  examesLaboratoriais,
  InsertExameLaboratorial,
  ExameLaboratorial,
  parametrosExames,
  InsertParametroExame,
  ParametroExame,
  pedidosExames,
  InsertPedidoExame,
  PedidoExame,
  credenciaisHilum,
  InsertCredencialHilum,
  CredencialHilum,
  alertasEnviados,
  InsertAlertaEnviado,
  AlertaEnviado,
  condutasPersonalizadas,
  InsertCondutaPersonalizada,
  CondutaPersonalizada
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USERS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ GESTANTES ============
export async function createGestante(data: InsertGestante): Promise<Gestante> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(gestantes).values(data);
  const insertedId = Number(result[0].insertId);
  return getGestanteById(insertedId) as Promise<Gestante>;
}

// Função auxiliar para normalizar texto (remover acentos)
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export async function getGestantesByUserId(userId: number, searchTerm?: string): Promise<Gestante[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Retorna todas as gestantes (compartilhadas entre todos os usuários)
  const allGestantes = await db.select().from(gestantes);
  
  // Se houver termo de busca, filtrar por nome ignorando acentuação
  if (searchTerm && searchTerm.trim()) {
    const normalizedSearch = normalizeText(searchTerm.trim());
    return allGestantes.filter(g => 
      g.nome && normalizeText(g.nome).includes(normalizedSearch)
    );
  }
  
  return allGestantes;
}

export async function getGestanteById(id: number): Promise<Gestante | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(gestantes).where(eq(gestantes.id, id)).limit(1);
  return result[0];
}

export async function updateGestante(id: number, data: Partial<InsertGestante>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(gestantes).set(data).where(eq(gestantes.id, id));
}

export async function deleteGestante(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(gestantes).where(eq(gestantes.id, id));
}

// ============ MÉDICOS ============
export async function listarMedicos(): Promise<Medico[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(medicos).where(eq(medicos.ativo, 1)).orderBy(medicos.ordem);
}

export async function listarTodosMedicos(): Promise<Medico[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(medicos).orderBy(medicos.ordem);
}

export async function criarMedico(data: InsertMedico): Promise<Medico> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicos).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(medicos).where(eq(medicos.id, insertedId)).limit(1);
  return inserted[0] as Medico;
}

export async function atualizarMedico(id: number, data: Partial<InsertMedico>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicos).set(data).where(eq(medicos.id, id));
}

export async function desativarMedico(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicos).set({ ativo: 0 }).where(eq(medicos.id, id));
}

export async function ativarMedico(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicos).set({ ativo: 1 }).where(eq(medicos.id, id));
}

export async function deletarMedico(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(medicos).where(eq(medicos.id, id));
}

// ============ PLANOS DE SAÚDE ============
export async function listarPlanosAtivos(): Promise<PlanoSaude[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(planosSaude).where(eq(planosSaude.ativo, 1));
}

export async function listarTodosPlanos(): Promise<PlanoSaude[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(planosSaude);
}

export async function criarPlano(data: InsertPlanoSaude): Promise<PlanoSaude> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(planosSaude).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(planosSaude).where(eq(planosSaude.id, insertedId)).limit(1);
  return inserted[0] as PlanoSaude;
}

export async function atualizarPlano(id: number, data: Partial<InsertPlanoSaude>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planosSaude).set(data).where(eq(planosSaude.id, id));
}

export async function toggleAtivoPlano(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const plano = await db.select().from(planosSaude).where(eq(planosSaude.id, id)).limit(1);
  if (plano[0]) {
    await db.update(planosSaude).set({ ativo: plano[0].ativo === 1 ? 0 : 1 }).where(eq(planosSaude.id, id));
  }
}

export async function deletarPlano(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(planosSaude).where(eq(planosSaude.id, id));
}

// ============ CONSULTAS PRÉ-NATAL ============
export async function createConsultaPrenatal(data: InsertConsultaPrenatal): Promise<ConsultaPrenatal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(consultasPrenatal).values(data);
  const insertedId = Number(result[0].insertId);
  return getConsultaById(insertedId) as Promise<ConsultaPrenatal>;
}

export async function getConsultasByGestanteId(gestanteId: number): Promise<ConsultaPrenatal[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(consultasPrenatal)
    .where(eq(consultasPrenatal.gestanteId, gestanteId))
    .orderBy(asc(consultasPrenatal.dataConsulta));
}

export async function getConsultaById(id: number): Promise<ConsultaPrenatal | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(consultasPrenatal).where(eq(consultasPrenatal.id, id)).limit(1);
  return result[0];
}

export async function updateConsulta(id: number, data: Partial<InsertConsultaPrenatal>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(consultasPrenatal).set(data).where(eq(consultasPrenatal.id, id));
}

export async function deleteConsulta(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(consultasPrenatal).where(eq(consultasPrenatal.id, id));
}

// ============ EXAMES LABORATORIAIS ============
export async function createExameLaboratorial(data: InsertExameLaboratorial): Promise<ExameLaboratorial> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(examesLaboratoriais).values(data);
  const insertedId = Number(result[0].insertId);
  return getExameById(insertedId) as Promise<ExameLaboratorial>;
}

export async function getExamesByGestanteId(gestanteId: number): Promise<ExameLaboratorial[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(examesLaboratoriais)
    .where(eq(examesLaboratoriais.gestanteId, gestanteId))
    .orderBy(desc(examesLaboratoriais.dataExame));
}

export async function getExameById(id: number): Promise<ExameLaboratorial | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(examesLaboratoriais).where(eq(examesLaboratoriais.id, id)).limit(1);
  return result[0];
}

export async function updateExame(id: number, data: Partial<InsertExameLaboratorial>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(examesLaboratoriais).set(data).where(eq(examesLaboratoriais.id, id));
}

export async function deleteExame(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(examesLaboratoriais).where(eq(examesLaboratoriais.id, id));
}

// ============ PARÂMETROS DE EXAMES ============
export async function createParametroExame(data: InsertParametroExame): Promise<ParametroExame> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(parametrosExames).values(data);
  const insertedId = Number(result[0].insertId);
  return getParametroById(insertedId) as Promise<ParametroExame>;
}

export async function getParametrosByExameId(exameId: number): Promise<ParametroExame[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(parametrosExames).where(eq(parametrosExames.exameId, exameId));
}

export async function getParametroById(id: number): Promise<ParametroExame | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(parametrosExames).where(eq(parametrosExames.id, id)).limit(1);
  return result[0];
}

export async function updateParametro(id: number, data: Partial<InsertParametroExame>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(parametrosExames).set(data).where(eq(parametrosExames.id, id));
}

export async function deleteParametro(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(parametrosExames).where(eq(parametrosExames.id, id));
}

// ============ PEDIDOS DE EXAMES ============
export async function createPedidoExame(data: InsertPedidoExame): Promise<PedidoExame> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pedidosExames).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(pedidosExames).where(eq(pedidosExames.id, insertedId)).limit(1);
  return inserted[0] as PedidoExame;
}

export async function getPedidosByGestanteId(gestanteId: number): Promise<PedidoExame[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(pedidosExames)
    .where(eq(pedidosExames.gestanteId, gestanteId))
    .orderBy(desc(pedidosExames.createdAt));
}

export async function updatePedidoExame(id: number, data: Partial<InsertPedidoExame>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pedidosExames).set(data).where(eq(pedidosExames.id, id));
}

// ============ CREDENCIAIS HILUM ============
export async function getCredencialByMedicoId(medicoId: number): Promise<CredencialHilum | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(credenciaisHilum)
    .where(and(eq(credenciaisHilum.medicoId, medicoId), eq(credenciaisHilum.ativo, 1)))
    .limit(1);
  return result[0];
}

export async function createCredencialHilum(data: InsertCredencialHilum): Promise<CredencialHilum> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(credenciaisHilum).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(credenciaisHilum).where(eq(credenciaisHilum.id, insertedId)).limit(1);
  return inserted[0] as CredencialHilum;
}

// ============ ALERTAS ENVIADOS ============
export async function createAlertaEnviado(data: InsertAlertaEnviado): Promise<AlertaEnviado> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(alertasEnviados).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(alertasEnviados).where(eq(alertasEnviados.id, insertedId)).limit(1);
  return inserted[0] as AlertaEnviado;
}

export async function getAlertasByGestanteId(gestanteId: number): Promise<AlertaEnviado[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(alertasEnviados)
    .where(eq(alertasEnviados.gestanteId, gestanteId))
    .orderBy(desc(alertasEnviados.dataEnvio));
}

// ============ CONDUTAS PERSONALIZADAS ============

export async function getCondutasPersonalizadas(): Promise<CondutaPersonalizada[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(condutasPersonalizadas)
    .where(eq(condutasPersonalizadas.ativo, 1))
    .orderBy(asc(condutasPersonalizadas.ordem), asc(condutasPersonalizadas.nome));
}

export async function createCondutaPersonalizada(data: InsertCondutaPersonalizada): Promise<CondutaPersonalizada> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(condutasPersonalizadas).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(condutasPersonalizadas).where(eq(condutasPersonalizadas.id, insertedId)).limit(1);
  return inserted[0] as CondutaPersonalizada;
}

export async function updateCondutaPersonalizada(id: number, data: Partial<InsertCondutaPersonalizada>): Promise<CondutaPersonalizada | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(condutasPersonalizadas).set(data).where(eq(condutasPersonalizadas.id, id));
  const updated = await db.select().from(condutasPersonalizadas).where(eq(condutasPersonalizadas.id, id)).limit(1);
  return updated[0] || null;
}

export async function deleteCondutaPersonalizada(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete - apenas marca como inativo
  await db.update(condutasPersonalizadas).set({ ativo: 0 }).where(eq(condutasPersonalizadas.id, id));
}
