CREATE TABLE `whatsappAssinaturaObstetras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assinaturaId` int NOT NULL,
	`userId` int NOT NULL,
	`clinicaId` int NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappAssinaturaObstetras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappAssinaturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` enum('pendente_instalacao','aguardando_pagamento','ativa','cancelada','suspensa') NOT NULL DEFAULT 'pendente_instalacao',
	`quantidadeObstetras` int NOT NULL DEFAULT 1,
	`instalacaoConfirmadaEm` timestamp,
	`instalacaoConfirmadaPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappAssinaturas_id` PRIMARY KEY(`id`)
);
