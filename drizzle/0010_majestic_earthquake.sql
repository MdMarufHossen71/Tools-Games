CREATE TABLE `support_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int,
	`kind` enum('support','bug','abuse','privacy') NOT NULL DEFAULT 'support',
	`subject` varchar(180) NOT NULL,
	`emailCiphertext` text,
	`messageCiphertext` text NOT NULL,
	`pageUrl` varchar(512),
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `support_messages_status_created_idx` ON `support_messages` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `support_messages_reporter_idx` ON `support_messages` (`reporterId`);