CREATE TABLE `vault_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`kind` enum('login','card','secure_note') NOT NULL DEFAULT 'login',
	`ciphertext` text NOT NULL,
	`iv` varchar(128) NOT NULL,
	`salt` varchar(128) NOT NULL,
	`cryptoVersion` varchar(24) NOT NULL DEFAULT 'aes-gcm-v1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vault_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD `metadataCiphertext` text;--> statement-breakpoint
ALTER TABLE `files` ADD `passwordHash` varchar(255);--> statement-breakpoint
CREATE INDEX `vault_entries_user_updated_idx` ON `vault_entries` (`userId`,`updatedAt`);