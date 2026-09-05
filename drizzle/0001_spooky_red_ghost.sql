CREATE TABLE `curator_post_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`excerpt` text NOT NULL,
	`story` text NOT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`status` enum('draft','published') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curator_post_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `curator_posts` ADD `imageKey` text;--> statement-breakpoint
ALTER TABLE `curator_posts` ADD `videoKey` text;--> statement-breakpoint
ALTER TABLE `curator_posts` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `curator_posts` ADD `scheduledFor` timestamp;--> statement-breakpoint
ALTER TABLE `curator_posts` ADD `publishedAt` timestamp;