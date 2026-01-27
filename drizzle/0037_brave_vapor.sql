CREATE TABLE `opcoesFatoresRisco` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(100) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricaoPadrao` text,
	`permiteTextoLivre` int NOT NULL DEFAULT 0,
	`sistema` int NOT NULL DEFAULT 0,
	`ativo` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opcoesFatoresRisco_id` PRIMARY KEY(`id`),
	CONSTRAINT `opcoesFatoresRisco_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `opcoesMedicamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(100) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricaoPadrao` text,
	`permiteTextoLivre` int NOT NULL DEFAULT 0,
	`sistema` int NOT NULL DEFAULT 0,
	`ativo` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opcoesMedicamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `opcoesMedicamentos_codigo_unique` UNIQUE(`codigo`)
);
