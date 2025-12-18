CREATE TABLE `partosRealizados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`dataParto` date NOT NULL,
	`tipoParto` enum('normal','cesarea') NOT NULL,
	`medicoId` int NOT NULL,
	`pdfUrl` text,
	`pdfKey` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partosRealizados_id` PRIMARY KEY(`id`)
);
