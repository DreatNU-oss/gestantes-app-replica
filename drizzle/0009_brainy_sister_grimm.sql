CREATE TABLE `resultadosExames` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`nomeExame` varchar(255) NOT NULL,
	`trimestre` int NOT NULL,
	`resultado` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resultadosExames_id` PRIMARY KEY(`id`)
);
