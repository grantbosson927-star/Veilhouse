CREATE TABLE `dream_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`dreamText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dream_submissions_id` PRIMARY KEY(`id`)
);
