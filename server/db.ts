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
  CondutaPersonalizada,
  partosRealizados,
  fatoresRisco,
  InsertFatorRisco,
  FatorRisco,
  medicamentosGestacao,
  InsertMedicamentoGestacao,
  MedicamentoGestacao,
  justificativasAlerta,
  InsertJustificativaAlerta,
  JustificativaAlerta
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
  
  // Buscar IDs de gestantes que já tiveram parto registrado
  const partosRegistrados = await db.select({ gestanteId: partosRealizados.gestanteId }).from(partosRealizados);
  const gestantesComParto = new Set(partosRegistrados.map(p => p.gestanteId));
  
  // Filtrar gestantes que NÃO têm parto registrado
  let gestantesSemParto = allGestantes.filter(g => !gestantesComParto.has(g.id));
  
  // Se houver termo de busca, filtrar por nome ignorando acentuação
  if (searchTerm && searchTerm.trim()) {
    const normalizedSearch = normalizeText(searchTerm.trim());
    gestantesSemParto = gestantesSemParto.filter(g => 
      g.nome && normalizeText(g.nome).includes(normalizedSearch)
    );
  }
  
  return gestantesSemParto;
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
  
  // Excluir justificativas associadas à gestante
  await db.delete(justificativasAlerta).where(eq(justificativasAlerta.gestanteId, id));
  
  // Excluir a gestante
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

// ============ GESTANTES SEM CONSULTA RECENTE ============

// Função auxiliar para calcular idade gestacional atual
function calcularIGAtual(gestante: Gestante): { semanas: number; dias: number; totalDias: number } | null {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  
  // Prioridade: Ultrassom > DUM
  if (gestante.igUltrassomSemanas !== null && gestante.igUltrassomDias !== null && gestante.dataUltrassom) {
    const dataUS = new Date(gestante.dataUltrassom + 'T12:00:00');
    const diffMs = hoje.getTime() - dataUS.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + gestante.igUltrassomDias;
    const totalDias = igUltrassomDias + diasDesdeUS;
    const semanas = Math.floor(totalDias / 7);
    const dias = totalDias % 7;
    return { semanas, dias, totalDias };
  }
  
  // Fallback: DUM
  if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
    const dumDate = new Date(gestante.dum + 'T12:00:00');
    const diffMs = hoje.getTime() - dumDate.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(totalDias / 7);
    const dias = totalDias % 7;
    return { semanas, dias, totalDias };
  }
  
  return null;
}

// Função para determinar o limite de dias sem consulta baseado na IG
function getLimiteDiasConsulta(igSemanas: number | null): { limite: number; faixa: string } {
  if (igSemanas === null) {
    // Se não tem IG, usar limite padrão de 40 dias
    return { limite: 40, faixa: 'Sem IG' };
  }
  
  if (igSemanas < 34) {
    return { limite: 40, faixa: 'Até 34 semanas' };
  } else if (igSemanas >= 34 && igSemanas < 36) {
    return { limite: 15, faixa: '34-36 semanas' };
  } else {
    return { limite: 8, faixa: 'Após 36 semanas' };
  }
}

export async function getGestantesSemConsultaRecente(): Promise<{
  gestante: Gestante;
  ultimaConsulta: Date | null;
  diasSemConsulta: number;
  igAtual: { semanas: number; dias: number; totalDias: number } | null;
  limiteDias: number;
  faixaIG: string;
}[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar todas as gestantes
  const todasGestantes = await db.select().from(gestantes);
  
  // Buscar IDs das gestantes que já tiveram parto
  const partosRealizadosData = await db.select({ gestanteId: partosRealizados.gestanteId }).from(partosRealizados);
  const gestantesComParto = new Set(partosRealizadosData.map(p => p.gestanteId));
  
  // Buscar IDs das gestantes com justificativa ativa
  const justificativasData = await db.select({ gestanteId: justificativasAlerta.gestanteId })
    .from(justificativasAlerta)
    .where(eq(justificativasAlerta.ativo, 1));
  const gestantesComJustificativa = new Set(justificativasData.map(j => j.gestanteId));
  
  // Filtrar apenas gestantes ativas (sem parto realizado e sem justificativa)
  const gestantesAtivas = todasGestantes.filter(g => 
    !gestantesComParto.has(g.id) && !gestantesComJustificativa.has(g.id)
  );
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const resultado: {
    gestante: Gestante;
    ultimaConsulta: Date | null;
    diasSemConsulta: number;
    igAtual: { semanas: number; dias: number; totalDias: number } | null;
    limiteDias: number;
    faixaIG: string;
  }[] = [];
  
  for (const gestante of gestantesAtivas) {
    // Calcular idade gestacional atual
    const igAtual = calcularIGAtual(gestante);
    
    // Determinar limite de dias baseado na IG
    const { limite: limiteDias, faixa: faixaIG } = getLimiteDiasConsulta(igAtual?.semanas ?? null);
    
    // Buscar a consulta mais recente desta gestante
    const consultas = await db.select().from(consultasPrenatal)
      .where(eq(consultasPrenatal.gestanteId, gestante.id))
      .orderBy(desc(consultasPrenatal.dataConsulta))
      .limit(1);
    
    let ultimaConsulta: Date | null = null;
    let diasSemConsulta = Infinity;
    
    if (consultas.length > 0 && consultas[0].dataConsulta) {
      ultimaConsulta = new Date(consultas[0].dataConsulta);
      ultimaConsulta.setHours(0, 0, 0, 0);
      diasSemConsulta = Math.floor((hoje.getTime() - ultimaConsulta.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // Se nunca teve consulta, considerar a data de cadastro
      if (gestante.createdAt) {
        const dataCadastro = new Date(gestante.createdAt);
        dataCadastro.setHours(0, 0, 0, 0);
        diasSemConsulta = Math.floor((hoje.getTime() - dataCadastro.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    
    // Incluir apenas gestantes com mais de X dias sem consulta (limite dinâmico baseado na IG)
    if (diasSemConsulta >= limiteDias) {
      resultado.push({
        gestante,
        ultimaConsulta,
        diasSemConsulta,
        igAtual,
        limiteDias,
        faixaIG
      });
    }
  }
  
  // Ordenar por urgência: primeiro por faixa de IG (mais avançada primeiro), depois por dias sem consulta
  return resultado.sort((a, b) => {
    // Prioridade: gestantes com IG mais avançada primeiro
    const igA = a.igAtual?.semanas ?? 0;
    const igB = b.igAtual?.semanas ?? 0;
    if (igB !== igA) return igB - igA;
    
    // Dentro da mesma faixa, ordenar por dias sem consulta (mais tempo primeiro)
    return b.diasSemConsulta - a.diasSemConsulta;
  });
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

// ============ FATORES DE RISCO ============

export async function getFatoresRiscoByGestanteId(gestanteId: number): Promise<FatorRisco[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(fatoresRisco)
    .where(and(
      eq(fatoresRisco.gestanteId, gestanteId),
      eq(fatoresRisco.ativo, 1)
    ))
    .orderBy(desc(fatoresRisco.createdAt));
}

export async function createFatorRisco(data: InsertFatorRisco): Promise<FatorRisco> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(fatoresRisco).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(fatoresRisco).where(eq(fatoresRisco.id, insertedId)).limit(1);
  return inserted[0] as FatorRisco;
}

export async function updateFatorRisco(id: number, data: Partial<InsertFatorRisco>): Promise<FatorRisco | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(fatoresRisco).set(data).where(eq(fatoresRisco.id, id));
  const updated = await db.select().from(fatoresRisco).where(eq(fatoresRisco.id, id)).limit(1);
  return updated[0] || null;
}

export async function deleteFatorRisco(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete - apenas marca como inativo
  await db.update(fatoresRisco).set({ ativo: 0 }).where(eq(fatoresRisco.id, id));
}

export async function hasAltoRisco(gestanteId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const fatores = await db.select().from(fatoresRisco)
    .where(and(
      eq(fatoresRisco.gestanteId, gestanteId),
      eq(fatoresRisco.ativo, 1)
    ))
    .limit(1);
  
  return fatores.length > 0;
}

// ============ MEDICAMENTOS NA GESTAÇÃO ============

export async function getMedicamentosByGestanteId(gestanteId: number): Promise<MedicamentoGestacao[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(medicamentosGestacao)
    .where(and(
      eq(medicamentosGestacao.gestanteId, gestanteId),
      eq(medicamentosGestacao.ativo, 1)
    ))
    .orderBy(desc(medicamentosGestacao.createdAt));
}

export async function createMedicamento(data: InsertMedicamentoGestacao): Promise<MedicamentoGestacao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicamentosGestacao).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(medicamentosGestacao).where(eq(medicamentosGestacao.id, insertedId)).limit(1);
  return inserted[0] as MedicamentoGestacao;
}

export async function updateMedicamento(id: number, data: Partial<InsertMedicamentoGestacao>): Promise<MedicamentoGestacao | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicamentosGestacao).set(data).where(eq(medicamentosGestacao.id, id));
  const updated = await db.select().from(medicamentosGestacao).where(eq(medicamentosGestacao.id, id)).limit(1);
  return updated[0] || null;
}

export async function deleteMedicamento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete - apenas marca como inativo
  await db.update(medicamentosGestacao).set({ ativo: 0 }).where(eq(medicamentosGestacao.id, id));
}


// ============ JUSTIFICATIVAS DE ALERTA ============

export async function getJustificativaByGestanteId(gestanteId: number): Promise<JustificativaAlerta | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(justificativasAlerta)
    .where(and(
      eq(justificativasAlerta.gestanteId, gestanteId),
      eq(justificativasAlerta.ativo, 1)
    ))
    .orderBy(desc(justificativasAlerta.createdAt))
    .limit(1);
  
  return result[0] || null;
}

export async function getJustificativasAtivas(): Promise<JustificativaAlerta[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(justificativasAlerta)
    .where(eq(justificativasAlerta.ativo, 1))
    .orderBy(desc(justificativasAlerta.createdAt));
}

export async function createJustificativa(data: InsertJustificativaAlerta): Promise<JustificativaAlerta> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Desativar justificativas anteriores da mesma gestante
  await db.update(justificativasAlerta)
    .set({ ativo: 0 })
    .where(eq(justificativasAlerta.gestanteId, data.gestanteId));
  
  const result = await db.insert(justificativasAlerta).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(justificativasAlerta).where(eq(justificativasAlerta.id, insertedId)).limit(1);
  return inserted[0] as JustificativaAlerta;
}

export async function deleteJustificativa(gestanteId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete - apenas marca como inativo
  await db.update(justificativasAlerta)
    .set({ ativo: 0 })
    .where(eq(justificativasAlerta.gestanteId, gestanteId));
}

export async function getGestantesIdsComJustificativaAtiva(): Promise<Set<number>> {
  const db = await getDb();
  if (!db) return new Set();
  
  const justificativas = await db.select({ gestanteId: justificativasAlerta.gestanteId })
    .from(justificativasAlerta)
    .where(eq(justificativasAlerta.ativo, 1));
  
  return new Set(justificativas.map(j => j.gestanteId));
}
