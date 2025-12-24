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
  dum: varchar("dum", { length: 50 }), // YYYY-MM-DD ou "Incerta" ou "Incompatível com US"
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
 * Tabela de fatores de risco das gestantes
 */
export const fatoresRisco = mysqlTable("fatoresRisco", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipo: mysqlEnum("tipo", [
    "idade_avancada",
    "hipotireoidismo",
    "hipertensao",
    "diabetes_tipo2",
    "trombofilia",
    "mal_passado_obstetrico",
    "incompetencia_istmo_cervical",
    "epilepsia",
    "malformacoes_mullerianas",
    "historico_familiar_dheg",
    "outro"
  ]).notNull(),
  descricao: text("descricao"), // Para "outro" ou detalhes adicionais
  ativo: int("ativo").default(1).notNull(), // 1 = ativo, 0 = resolvido/inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FatorRisco = typeof fatoresRisco.$inferSelect;
export type InsertFatorRisco = typeof fatoresRisco.$inferInsert;

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
  conduta: text("conduta"), // JSON array com condutas selecionadas
  condutaComplementacao: text("condutaComplementacao"), // texto livre para complementação
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
  dataExame: date("dataExame"), // Data em que o exame foi realizado
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

/**
 * Tabela de condutas personalizadas
 */
export const condutasPersonalizadas = mysqlTable("condutasPersonalizadas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: int("ativo").default(1).notNull(), // 1 = ativo, 0 = inativo
  ordem: int("ordem").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CondutaPersonalizada = typeof condutasPersonalizadas.$inferSelect;
export type InsertCondutaPersonalizada = typeof condutasPersonalizadas.$inferInsert;

/**
 * Tabela de histórico de interpretações de IA
 */
export const historicoInterpretacoes = mysqlTable("historicoInterpretacoes", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipoInterpretacao: mysqlEnum("tipoInterpretacao", ["exames_laboratoriais", "ultrassom"]).notNull(),
  tipoExame: varchar("tipoExame", { length: 100 }), // Para ultrassom: primeiro_ultrassom, morfologico_1tri, etc. Para exames: trimestre
  arquivosProcessados: int("arquivosProcessados").default(1).notNull(), // Quantidade de arquivos processados
  resultadoJson: json("resultadoJson").notNull(), // JSON com os dados extraídos pela IA
  dataInterpretacao: timestamp("dataInterpretacao").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HistoricoInterpretacao = typeof historicoInterpretacoes.$inferSelect;
export type InsertHistoricoInterpretacao = typeof historicoInterpretacoes.$inferInsert;

/**
 * Tabela de códigos de acesso para gestantes (App Mobile)
 */
export const codigosAcessoGestante = mysqlTable("codigosAcessoGestante", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  codigo: varchar("codigo", { length: 6 }).notNull(), // Código de 6 dígitos
  tipo: mysqlEnum("tipo", ["email", "sms", "whatsapp"]).notNull(),
  destino: varchar("destino", { length: 320 }).notNull(), // Email ou telefone
  usado: int("usado").default(0).notNull(), // 0 = não usado, 1 = usado
  expiraEm: timestamp("expiraEm").notNull(), // Expira em 15 minutos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodigoAcessoGestante = typeof codigosAcessoGestante.$inferSelect;
export type InsertCodigoAcessoGestante = typeof codigosAcessoGestante.$inferInsert;

/**
 * Tabela de sessões de gestantes (App Mobile)
 */
export const sessoesGestante = mysqlTable("sessoesGestante", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  token: varchar("token", { length: 500 }).notNull(),
  dispositivo: varchar("dispositivo", { length: 255 }), // Info do dispositivo
  ip: varchar("ip", { length: 45 }),
  ativo: int("ativo").default(1).notNull(),
  ultimoAcesso: timestamp("ultimoAcesso").defaultNow().notNull(),
  expiraEm: timestamp("expiraEm").notNull(), // Expira em 30 dias
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessaoGestante = typeof sessoesGestante.$inferSelect;
export type InsertSessaoGestante = typeof sessoesGestante.$inferInsert;

/**
 * Tabela de logs de acesso de gestantes (LGPD)
 */
export const logsAcessoGestante = mysqlTable("logsAcessoGestante", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  sessaoId: int("sessaoId"),
  acao: varchar("acao", { length: 100 }).notNull(), // ex: "login", "visualizar_exames", "visualizar_consultas"
  recurso: varchar("recurso", { length: 255 }), // ex: "/api/gestante/exames"
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LogAcessoGestante = typeof logsAcessoGestante.$inferSelect;
export type InsertLogAcessoGestante = typeof logsAcessoGestante.$inferInsert;

/**
 * Tabela de feedback das interpretações de IA
 */
export const feedbackInterpretacoes = mysqlTable("feedbackInterpretacoes", {
  id: int("id").autoincrement().primaryKey(),
  historicoInterpretacaoId: int("historicoInterpretacaoId").notNull(), // Referência ao histórico
  gestanteId: int("gestanteId").notNull(),
  userId: int("userId").notNull(), // Usuário que deu o feedback
  tipoInterpretacao: mysqlEnum("tipoInterpretacao", ["exames_laboratoriais", "ultrassom"]).notNull(),
  avaliacao: int("avaliacao").notNull(), // 1-5 estrelas
  precisaoData: mysqlEnum("precisaoData", ["correta", "incorreta", "nao_extraiu"]), // Feedback específico sobre data
  precisaoValores: mysqlEnum("precisaoValores", ["todos_corretos", "alguns_incorretos", "maioria_incorreta"]),
  comentario: text("comentario"), // Comentário livre do usuário
  camposIncorretos: text("camposIncorretos"), // JSON array com nomes dos campos incorretos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedbackInterpretacao = typeof feedbackInterpretacoes.$inferSelect;
export type InsertFeedbackInterpretacao = typeof feedbackInterpretacoes.$inferInsert;

/**
 * Tabela de mensagens WhatsApp enviadas via Helena
 */


/**
 * Tabela de partos realizados
 */
export const partosRealizados = mysqlTable("partosRealizados", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  dataParto: date("dataParto").notNull(),
  tipoParto: mysqlEnum("tipoParto", ["normal", "cesarea"]).notNull(),
  medicoId: int("medicoId").notNull(),
  pdfUrl: text("pdfUrl"), // URL do PDF do cartão pré-natal no S3
  pdfKey: text("pdfKey"), // Key do arquivo no S3 para referência
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartoRealizado = typeof partosRealizados.$inferSelect;
export type InsertPartoRealizado = typeof partosRealizados.$inferInsert;

/**
 * Tabela de medicamentos em uso durante a gestação
 */
export const medicamentosGestacao = mysqlTable("medicamentosGestacao", {
  id: int("id").autoincrement().primaryKey(),
  gestanteId: int("gestanteId").notNull(),
  tipo: mysqlEnum("tipo", [
    "polivitaminicos",
    "aas",
    "calcio",
    "psicotropicos",
    "progestagenos",
    "enoxaparina",
    "levotiroxina",
    "anti_hipertensivos",
    "outros"
  ]).notNull(),
  especificacao: text("especificacao"), // Para anti-hipertensivos e outros
  ativo: int("ativo").default(1).notNull(), // 1 = em uso, 0 = descontinuado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicamentoGestacao = typeof medicamentosGestacao.$inferSelect;
export type InsertMedicamentoGestacao = typeof medicamentosGestacao.$inferInsert;
