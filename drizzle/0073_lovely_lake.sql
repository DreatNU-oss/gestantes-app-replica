ALTER TABLE `mensagemTemplates` ADD `condicaoTipoParto` enum('cesariana','normal','a_definir');--> statement-breakpoint
ALTER TABLE `mensagemTemplates` ADD `condicaoMedicoId` int;