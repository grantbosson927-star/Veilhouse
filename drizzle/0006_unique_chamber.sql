CREATE TABLE `curator_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`category` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text,
	`imageKey` text,
	`recipient` varchar(320) NOT NULL DEFAULT 'curator@veilhouse.monster',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curator_submissions_id` PRIMARY KEY(`id`)
);
