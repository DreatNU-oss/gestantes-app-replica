CREATE TABLE `codigosAcessoGestante` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`codigo` varchar(6) NOT NULL,
	`tipo` enum('email','sms','whatsapp') NOT NULL,
	`destino` varchar(320) NOT NULL,
	`usado` int NOT NULL DEFAULT 0,
	`expiraEm` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codigosAcessoGestante_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logsAcessoGestante` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`sessaoId` int,
	`acao` varchar(100) NOT NULL,
	`recurso` varchar(255),
	`ip` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logsAcessoGestante_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessoesGestante` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`dispositivo` varchar(255),
	`ip` varchar(45),
	`ativo` int NOT NULL DEFAULT 1,
	`ultimoAcesso` timestamp NOT NULL DEFAULT (now()),
	`expiraEm` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessoesGestante_id` PRIMARY KEY(`id`)
);
