CREATE TABLE `mensagensAgendadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int NOT NULL,
	`gestanteId` int NOT NULL,
	`templateId` int NOT NULL,
	`consultaId` int NOT NULL,
	`dataEnvio` date NOT NULL,
	`status` enum('pendente','enviado','cancelado','falhou') NOT NULL DEFAULT 'pendente',
	`erroMensagem` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `mensagensAgendadas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mensagemTemplates` MODIFY COLUMN `gatilhoTipo` enum('idade_gestacional','evento','manual','pos_consulta_conduta') NOT NULL DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `mensagemTemplates` ADD `condutaGatilho` varchar(255);--> statement-breakpoint
ALTER TABLE `mensagemTemplates` ADD `diasAposConsulta` int;