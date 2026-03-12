CREATE TABLE `procedimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicaId` int,
	`nome` varchar(255) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`padrao` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procedimentos_id` PRIMARY KEY(`id`)
);
