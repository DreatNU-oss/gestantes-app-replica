CREATE TABLE `agendamentosConsultas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`dataAgendada` date NOT NULL,
	`igSemanas` int,
	`igDias` int,
	`exameComplementar` enum('nenhum','us_obstetrico','cardiotocografia') DEFAULT 'nenhum',
	`status` enum('agendado','realizado','cancelado','remarcado') DEFAULT 'agendado',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agendamentosConsultas_id` PRIMARY KEY(`id`)
);
