import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de médicos responsáveis pelos partos
 */
export const medicos = mysqlTable("medicos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: int("ativo").default(1).notNull(), // 1 = ativo, 0 = inativo
  ordem: int("ordem").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Medico = typeof medicos.$inferSelect;
export type InsertMedico = typeof medicos.$inferInsert;

/**
 * Tabela de credenciais HILUM dos médicos
 */
export const credenciaisHilum = mysqlTable("credenciaisHilum", {
  id: int("id").autoincrement().primaryKey(),
  medicoId: int("medicoId").notNull().unique(),
  login: varchar("login", { length: 100 }).notNull(),
  senha: text("senha").notNull(),
  ativo: int("ativo").default(1).notNull(),
  ultimoUso: timestamp("ultimoUso"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CredencialHilum = typeof credenciaisHilum.$inferSelect;
export type InsertCredencialHilum = typeof credenciaisHilum.$inferInsert;

/**
 * Tabela de planos de saúde
 */
export const planosSaude = mysqlTable("planosSaude", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanoSaude = typeof planosSaude.$inferSelect;
export type InsertPlanoSaude = typeof planosSaude.$inferInsert;

/**
 * Tabela de gestantes
 */
export const gestantes = mysqlTable("gestantes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  dataNascimento: varchar("dataNascimento", { length: 10 }), // YYYY-MM-DD
  
  // Dados administrativos
  planoSaudeId: int("planoSaudeId"),
  carteirinhaUnimed: varchar("carteirinhaUnimed", { length: 50 }),
  medicoId: int("medicoId"),
  tipoPartoDesejado: mysqlEnum("tipoPartoDesejado", ["cesariana", "normal", "a_definir"]).default("a_definir"),
  
  // História obstétrica
  gesta: int("gesta"),
  para: int("para"),
  partosNormais: int("partosNormais"),
  cesareas: int("cesareas"),
  abortos: int("abortos"),
  
  // Dados obstétricos
  dum: varchar("dum", { length: 10 }), // YYYY-MM-DD
  igUltrassomSemanas: int("igUltrassomSemanas"),
  igUltrassomDias: int("igUltrassomDias"),
  dataUltrassom: varchar("dataUltrassom", { length: 10 }), // YYYY-MM-DD
  dataPartoProgramado: varchar("dataPartoProgramado", { length: 10 }), // YYYY-MM-DD
  
  // Dados antropométricos
  altura: int("altura"), // altura em cm
  pesoInicial: int("pesoInicial"), // peso pré-gestacional em gramas
  
  // Armazenamento de documentos
  cartaoPrenatalUrl: text("cartaoPrenatalUrl"),
  guiaExameUrl: text("guiaExameUrl"),
  documentosUrls: text("documentosUrls"), // JSON array de URLs
  
  // Observações
  observacoes: text("observacoes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gestante = typeof gestantes.$inferSelect;
export type InsertGestante = typeof gestantes.$inferInsert;

/**
 * Tabela de consultas pré-natais
 */
export const consultasPrenatal = mysqlTable("consultasPrenatal", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  dataConsulta: date("dataConsulta").notNull(),
  igSemanas: int("igSemanas"),
  igDias: int("igDias"),
  peso: int("peso"), // em gramas
  pressaoArterial: varchar("pressaoArterial", { length: 20 }),
  alturaUterina: int("alturaUterina"), // em mm
  bcf: int("bcf"), // batimentos cardíacos fetais
  mf: int("mf"), // movimento fetal (1 = sim, 0 = não)
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConsultaPrenatal = typeof consultasPrenatal.$inferSelect;
export type InsertConsultaPrenatal = typeof consultasPrenatal.$inferInsert;

/**
 * Tabela de exames laboratoriais
 */
export const examesLaboratoriais = mysqlTable("examesLaboratoriais", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipoExame: varchar("tipoExame", { length: 255 }).notNull(),
  dataExame: date("dataExame").notNull(),
  igSemanas: int("igSemanas"),
  igDias: int("igDias"),
  resultado: text("resultado"),
  observacoes: text("observacoes"),
  arquivoUrl: text("arquivoUrl"), // URL do PDF no S3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExameLaboratorial = typeof examesLaboratoriais.$inferSelect;
export type InsertExameLaboratorial = typeof examesLaboratoriais.$inferInsert;

/**
 * Tabela de parâmetros estruturados dos exames
 */
export const parametrosExames = mysqlTable("parametrosExames", {
  id: int("id").autoincrement().primaryKey(),
  exameId: int("exameId").notNull(),
  nomeParametro: varchar("nomeParametro", { length: 255 }).notNull(),
  valor: varchar("valor", { length: 255 }),
  unidade: varchar("unidade", { length: 50 }),
  valorReferencia: varchar("valorReferencia", { length: 255 }),
  status: mysqlEnum("status", ["normal", "alterado", "critico"]).default("normal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParametroExame = typeof parametrosExames.$inferSelect;
export type InsertParametroExame = typeof parametrosExames.$inferInsert;

/**
 * Tabela de pedidos de exames (integração HILUM)
 */
export const pedidosExames = mysqlTable("pedidosExames", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  medicoId: int("medicoId").notNull(),
  tipoExame: varchar("tipoExame", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pendente", "solicitado", "erro"]).default("pendente"),
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  observacoes: text("observacoes"),
  erroMensagem: text("erroMensagem"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PedidoExame = typeof pedidosExames.$inferSelect;
export type InsertPedidoExame = typeof pedidosExames.$inferInsert;

/**
 * Tabela de alertas enviados
 */
export const alertasEnviados = mysqlTable("alertasEnviados", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipoAlerta: varchar("tipoAlerta", { length: 100 }).notNull(), // morfo1tri, morfo2tri, dtpa, parto
  dataEnvio: timestamp("dataEnvio").defaultNow().notNull(),
  emailDestinatario: varchar("emailDestinatario", { length: 320 }),
  status: mysqlEnum("status", ["enviado", "erro"]).default("enviado"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertaEnviado = typeof alertasEnviados.$inferSelect;
export type InsertAlertaEnviado = typeof alertasEnviados.$inferInsert;

/**
 * Tabela de agendamentos de consultas pré-natais
 */
export const agendamentosConsultas = mysqlTable("agendamentosConsultas", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  dataAgendada: date("dataAgendada").notNull(),
  igSemanas: int("igSemanas"),
  igDias: int("igDias"),
  exameComplementar: mysqlEnum("exameComplementar", ["nenhum", "us_obstetrico", "cardiotocografia"]).default("nenhum"),
  status: mysqlEnum("status", ["agendado", "realizado", "cancelado", "remarcado"]).default("agendado"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgendamentoConsulta = typeof agendamentosConsultas.$inferSelect;
export type InsertAgendamentoConsulta = typeof agendamentosConsultas.$inferInsert;

/**
 * Tabela de configurações de e-mail
 */
export const configuracoesEmail = mysqlTable("configuracoesEmail", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  valor: text("valor").notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConfiguracaoEmail = typeof configuracoesEmail.$inferSelect;
export type InsertConfiguracaoEmail = typeof configuracoesEmail.$inferInsert;

/**
 * Tabela de log de e-mails enviados
 */
export const logsEmails = mysqlTable("logsEmails", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipoLembrete: varchar("tipoLembrete", { length: 100 }).notNull(), // dtpa, bronquiolite, morfo1tri_1sem, morfo2tri_2sem, morfo2tri_1sem
  emailDestinatario: varchar("emailDestinatario", { length: 320 }).notNull(),
  assunto: varchar("assunto", { length: 500 }).notNull(),
  corpo: text("corpo").notNull(),
  status: mysqlEnum("status", ["enviado", "erro"]).default("enviado").notNull(),
  mensagemErro: text("mensagemErro"),
  dataEnvio: timestamp("dataEnvio").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LogEmail = typeof logsEmails.$inferSelect;
export type InsertLogEmail = typeof logsEmails.$inferInsert;

/**
 * Tabela de resultados de exames laboratoriais
 */
export const resultadosExames = mysqlTable("resultadosExames", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  nomeExame: varchar("nomeExame", { length: 255 }).notNull(),
  trimestre: int("trimestre").notNull(), // 1, 2 ou 3
  resultado: text("resultado"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResultadoExame = typeof resultadosExames.$inferSelect;
export type InsertResultadoExame = typeof resultadosExames.$inferInsert;

/**
 * Tabela de ultrassons pré-natais
 */
export const ultrassons = mysqlTable("ultrassons", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipoUltrassom: mysqlEnum("tipoUltrassom", [
    "primeiro_ultrassom",
    "morfologico_1tri",
    "ultrassom_obstetrico",
    "morfologico_2tri",
    "ecocardiograma_fetal",
    "ultrassom_seguimento"
  ]).notNull(),
  dataExame: varchar("dataExame", { length: 10 }), // YYYY-MM-DD
  idadeGestacional: varchar("idadeGestacional", { length: 50 }), // Ex: "12s 3d"
  dados: json("dados").notNull(), // JSON com campos específicos de cada tipo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ultrassom = typeof ultrassons.$inferSelect;
export type InsertUltrassom = typeof ultrassons.$inferInsert;
