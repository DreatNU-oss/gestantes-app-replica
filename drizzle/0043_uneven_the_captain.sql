CREATE TABLE `arquivosExames` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`nomeArquivo` varchar(255) NOT NULL,
	`tipoArquivo` varchar(50) NOT NULL,
	`tamanhoBytes` int NOT NULL,
	`s3Url` text NOT NULL,
	`s3Key` text NOT NULL,
	`senhaPdf` text,
	`protegidoPorSenha` int NOT NULL DEFAULT 0,
	`trimestre` int,
	`dataColeta` date,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arquivosExames_id` PRIMARY KEY(`id`)
);
