CREATE TABLE `ultrassons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestanteId` int NOT NULL,
	`tipoUltrassom` enum('primeiro_ultrassom','morfologico_1tri','ultrassom_obstetrico','morfologico_2tri','ecocardiograma_fetal','ultrassom_seguimento') NOT NULL,
	`dataExame` varchar(10),
	`idadeGestacional` varchar(50),
	`dados` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ultrassons_id` PRIMARY KEY(`id`)
);
