ALTER TABLE `curator_specimens` ADD COLUMN `audioUrl` text;
--> statement-breakpoint
ALTER TABLE `curator_specimens` ADD COLUMN `audioKey` text;
--> statement-breakpoint
ALTER TABLE `curator_specimens` ADD COLUMN `displayOrder` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `curator_specimens` ADD COLUMN `visible` integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `curator_specimens` ADD COLUMN `featured` integer NOT NULL DEFAULT 0;
