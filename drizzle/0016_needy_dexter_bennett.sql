CREATE TABLE `historicoInterpretacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipoInterpretacao` enum('exames_laboratoriais','ultrassom') NOT NULL,
	`tipoExame` varchar(100),
	`arquivosProcessados` int NOT NULL DEFAULT 1,
	`resultadoJson` json NOT NULL,
	`dataInterpretacao` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historicoInterpretacoes_id` PRIMARY KEY(`id`)
);
