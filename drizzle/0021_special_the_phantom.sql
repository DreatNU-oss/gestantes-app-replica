CREATE TABLE `fatoresRisco` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipo` enum('idade_avancada','hipotireoidismo','hipertensao','diabetes_tipo2','trombofilia','mal_passado_obstetrico','incompetencia_istmo_cervical','outro') NOT NULL,
	`descricao` text,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fatoresRisco_id` PRIMARY KEY(`id`)
);
