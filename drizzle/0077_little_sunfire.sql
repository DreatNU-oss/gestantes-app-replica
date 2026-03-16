CREATE TABLE `orientacoesEnviadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`clinicaId` int NOT NULL,
	`tipoOrientacao` varchar(100) NOT NULL,
	`enviadoPorId` int NOT NULL,
	`enviadoPorNome` varchar(255),
	`enviadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orientacoesEnviadas_id` PRIMARY KEY(`id`)
);
