CREATE TABLE `historicoTextos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('observacao','conduta_complementacao') NOT NULL,
	`texto` text NOT NULL,
	`contadorUso` int NOT NULL DEFAULT 1,
	`ultimoUso` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `historicoTextos_id` PRIMARY KEY(`id`)
);
