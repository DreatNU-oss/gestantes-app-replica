CREATE TABLE `hospitais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int,
	`nome` varchar(255) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hospitais_id` PRIMARY KEY(`id`)
);
