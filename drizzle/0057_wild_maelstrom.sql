CREATE TABLE `abortamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`dataAbortamento` date NOT NULL,
	`igSemanas` int,
	`igDias` int,
	`tipoAbortamento` enum('espontaneo','retido','incompleto','inevitavel','outro') DEFAULT 'espontaneo',
	`observacoes` text,
	`nomeGestante` varchar(255) NOT NULL,
	`medicoId` int,
	`planoSaudeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abortamentos_id` PRIMARY KEY(`id`)
);
