ALTER TABLE `users` ADD COLUMN `offerings` integer NOT NULL DEFAULT 1000;
--> statement-breakpoint
CREATE TABLE `offering_ledger` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `userId` integer NOT NULL,
  `amount` integer NOT NULL,
  `reason` text NOT NULL,
  `createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `generated_dreams` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `userId` integer NOT NULL,
  `title` text NOT NULL,
  `prompt` text NOT NULL,
  `imageUrl` text NOT NULL,
  `createdAt` integer NOT NULL
);
