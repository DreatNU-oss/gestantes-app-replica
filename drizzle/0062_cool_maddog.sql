CREATE TABLE `clinicas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(5) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`logoUrl` text,
	`integracaoApiAtiva` int NOT NULL DEFAULT 0,
	`ativa` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinicas_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinicas_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
ALTER TABLE `condutasPersonalizadas` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `configuracoesEmail` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `emailsAutorizados` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `gestantes` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `historicoTextos` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `medicos` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `observacoesPersonalizadas` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `opcoesFatoresRisco` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `opcoesMedicamentos` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `planosSaude` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `queixasPersonalizadas` ADD `clinicaId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `clinicaId` int;