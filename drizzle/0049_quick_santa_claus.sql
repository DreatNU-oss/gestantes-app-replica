ALTER TABLE `consultasPrenatal` ADD `isPrimeiraConsulta` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `historiaPatologicaPregressa` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `historiaSocial` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `historiaFamiliar` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `condutaCheckboxes` json;