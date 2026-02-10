CREATE TABLE `lembretesConduta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`consultaOrigemId` int NOT NULL,
	`conduta` varchar(255) NOT NULL,
	`resolvido` int NOT NULL DEFAULT 0,
	`resolvidoNaConsultaId` int,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`resolvidoEm` timestamp,
	CONSTRAINT `lembretesConduta_id` PRIMARY KEY(`id`)
);
