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
CREATE TABLE `curator_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`excerpt` text NOT NULL,
	`story` text NOT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`imageKey` text,
	`videoKey` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`scheduleCronTaskUid` varchar(65),
	`scheduledFor` timestamp,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curator_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `curator_posts_slug_unique` UNIQUE(`slug`)
);
