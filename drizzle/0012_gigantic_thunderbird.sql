CREATE TABLE `mensagensWhatsapp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`telefone` varchar(20) NOT NULL,
	`tipoMensagem` varchar(100) NOT NULL,
	`templateUsado` varchar(100),
	`mensagem` text NOT NULL,
	`helenaMessageId` varchar(100),
	`helenaSessionId` varchar(100),
	`status` enum('processando','enviado','erro') NOT NULL DEFAULT 'processando',
	`mensagemErro` text,
	`dataEnvio` timestamp NOT NULL DEFAULT (now()),
	`enviadoPor` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mensagensWhatsapp_id` PRIMARY KEY(`id`)
);
