CREATE TABLE `justificativasAlerta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`motivo` enum('ja_agendada','desistiu_prenatal','abortamento','mudou_cidade','evoluiu_parto','espaco_maior_consultas') NOT NULL,
	`observacoes` text,
	`ativo` int NOT NULL DEFAULT 1,
	`criadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `justificativasAlerta_id` PRIMARY KEY(`id`)
);
