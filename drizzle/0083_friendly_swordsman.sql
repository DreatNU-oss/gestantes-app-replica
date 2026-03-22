ALTER TABLE `arquivosExames` ADD `tipoExame` enum('laboratorial','ultrassom') DEFAULT 'laboratorial' NOT NULL;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `status` enum('confirmado','pendente_revisao','rejeitado') DEFAULT 'confirmado' NOT NULL;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `origemEnvio` enum('web','app_mobile') DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `resultadoIA` json;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `iaProcessado` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `iaErro` text;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `revisadoPor` int;--> statement-breakpoint
ALTER TABLE `arquivosExames` ADD `revisadoEm` timestamp;