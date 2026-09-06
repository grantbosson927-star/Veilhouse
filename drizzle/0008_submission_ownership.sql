ALTER TABLE `curator_submissions` ADD COLUMN `userId` integer;
--> statement-breakpoint
ALTER TABLE `dream_submissions` ADD COLUMN `userId` integer;
--> statement-breakpoint
CREATE TABLE `specimen_unlocks` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `userId` integer NOT NULL,
  `specimenSlug` text NOT NULL,
  `kind` text NOT NULL,
  `createdAt` integer NOT NULL
);
