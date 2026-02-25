CREATE TABLE `queixasPersonalizadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`texto` varchar(500) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 1,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `queixasPersonalizadas_id` PRIMARY KEY(`id`),
	CONSTRAINT `queixasPersonalizadas_texto_unique` UNIQUE(`texto`)
);
