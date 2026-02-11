ALTER TABLE `consultasPrenatal` ADD `isUrgencia` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `queixasUrgencia` json;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `detalhamentoQueixa` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `auf` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `atividadeUterina` json;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `toqueVaginal` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `usgHoje` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `hipoteseDiagnostica` text;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `condutaUrgencia` json;--> statement-breakpoint
ALTER TABLE `consultasPrenatal` ADD `outraCondutaDescricao` text;