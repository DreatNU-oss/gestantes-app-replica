CREATE TABLE `feedbackInterpretacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`historicoInterpretacaoId` int NOT NULL,
	`gestanteId` int NOT NULL,
	`userId` int NOT NULL,
	`tipoInterpretacao` enum('exames_laboratoriais','ultrassom') NOT NULL,
	`avaliacao` int NOT NULL,
	`precisaoData` enum('correta','incorreta','nao_extraiu'),
	`precisaoValores` enum('todos_corretos','alguns_incorretos','maioria_incorreta'),
	`comentario` text,
	`camposIncorretos` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedbackInterpretacoes_id` PRIMARY KEY(`id`)
);
