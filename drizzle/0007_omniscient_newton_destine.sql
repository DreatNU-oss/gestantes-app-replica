CREATE TABLE `configuracoesEmail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` text NOT NULL,
	`descricao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracoesEmail_id` PRIMARY KEY(`id`),
	CONSTRAINT `configuracoesEmail_chave_unique` UNIQUE(`chave`)
);
--> statement-breakpoint
CREATE TABLE `logsEmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipoLembrete` varchar(100) NOT NULL,
	`emailDestinatario` varchar(320) NOT NULL,
	`assunto` varchar(500) NOT NULL,
	`corpo` text NOT NULL,
	`status` enum('enviado','erro') NOT NULL DEFAULT 'enviado',
	`mensagemErro` text,
	`dataEnvio` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logsEmails_id` PRIMARY KEY(`id`)
);
