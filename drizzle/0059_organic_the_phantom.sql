CREATE TABLE `observacoesPersonalizadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`texto` varchar(1000) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 1,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `observacoesPersonalizadas_id` PRIMARY KEY(`id`),
	CONSTRAINT `observacoesPersonalizadas_texto_unique` UNIQUE(`texto`)
);
