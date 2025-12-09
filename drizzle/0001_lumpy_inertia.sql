CREATE TABLE `alertasEnviados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipoAlerta` varchar(100) NOT NULL,
	`dataEnvio` timestamp NOT NULL DEFAULT (now()),
	`emailDestinatario` varchar(320),
	`status` enum('enviado','erro') DEFAULT 'enviado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertasEnviados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultasPrenatal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`dataConsulta` date NOT NULL,
	`igSemanas` int,
	`igDias` int,
	`peso` int,
	`pressaoArterial` varchar(20),
	`alturaUterina` int,
	`bcf` int,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultasPrenatal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credenciaisHilum` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicoId` int NOT NULL,
	`login` varchar(100) NOT NULL,
	`senha` text NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`ultimoUso` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credenciaisHilum_id` PRIMARY KEY(`id`),
	CONSTRAINT `credenciaisHilum_medicoId_unique` UNIQUE(`medicoId`)
);
--> statement-breakpoint
CREATE TABLE `examesLaboratoriais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipoExame` varchar(255) NOT NULL,
	`dataExame` date NOT NULL,
	`igSemanas` int,
	`igDias` int,
	`resultado` text,
	`observacoes` text,
	`arquivoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `examesLaboratoriais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gestantes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`telefone` varchar(20),
	`email` varchar(320),
	`dataNascimento` date,
	`planoSaudeId` int,
	`carteirinhaUnimed` varchar(50),
	`medicoId` int,
	`tipoPartoDesejado` enum('cesariana','normal','a_definir') DEFAULT 'a_definir',
	`gesta` int,
	`para` int,
	`partosNormais` int,
	`cesareas` int,
	`abortos` int,
	`dum` date,
	`igUltrassomSemanas` int,
	`igUltrassomDias` int,
	`dataUltrassom` date,
	`cartaoPrenatalUrl` text,
	`guiaExameUrl` text,
	`documentosUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gestantes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parametrosExames` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exameId` int NOT NULL,
	`nomeParametro` varchar(255) NOT NULL,
	`valor` varchar(255),
	`unidade` varchar(50),
	`valorReferencia` varchar(255),
	`status` enum('normal','alterado','critico') DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parametrosExames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedidosExames` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`medicoId` int NOT NULL,
	`tipoExame` varchar(255) NOT NULL,
	`status` enum('pendente','solicitado','erro') DEFAULT 'pendente',
	`dataInicio` date,
	`dataFim` date,
	`observacoes` text,
	`erroMensagem` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pedidosExames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planosSaude` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planosSaude_id` PRIMARY KEY(`id`)
);
