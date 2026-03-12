CREATE TABLE `mensagemTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`mensagem` text NOT NULL,
	`pdfUrl` text,
	`pdfKey` text,
	`pdfNome` varchar(255),
	`gatilhoTipo` enum('idade_gestacional','evento','manual') NOT NULL DEFAULT 'manual',
	`igSemanas` int,
	`igDias` int DEFAULT 0,
	`evento` enum('pos_cesarea','pos_parto_normal','cadastro_gestante','primeira_consulta'),
	`ativo` int NOT NULL DEFAULT 1,
	`criadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mensagemTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int NOT NULL,
	`apiKey` text,
	`ativo` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappHistorico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int NOT NULL,
	`gestanteId` int,
	`templateId` int,
	`telefone` varchar(20) NOT NULL,
	`mensagem` text NOT NULL,
	`pdfUrl` text,
	`status` enum('enviado','falhou','pendente') NOT NULL DEFAULT 'pendente',
	`erroMensagem` text,
	`nomeGestante` varchar(255),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappHistorico_id` PRIMARY KEY(`id`)
);
