CREATE TABLE `preConsulta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`clinicaId` int,
	`peso` varchar(20) NOT NULL,
	`pressaoArterial` varchar(20) NOT NULL,
	`tipoConsulta` enum('1a_consulta','consulta_rotina','consulta_urgencia') NOT NULL,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`utilizado` int NOT NULL DEFAULT 0,
	`utilizadoEm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preConsulta_id` PRIMARY KEY(`id`)
);
