CREATE TABLE `curator_specimens` (
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`story` text,
	`imageUrl` text,
	`videoUrl` text,
	`imageKey` text,
	`videoKey` text,
	`heroMedia` enum('image','video') NOT NULL DEFAULT 'image',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curator_specimens_slug` PRIMARY KEY(`slug`)
);
