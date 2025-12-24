CREATE TABLE `medicamentosGestacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipo` enum('polivitaminicos','aas','calcio','psicotropicos','progestagenos','enoxaparina','levotiroxina','anti_hipertensivos','outros') NOT NULL,
	`especificacao` text,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicamentosGestacao_id` PRIMARY KEY(`id`)
);
