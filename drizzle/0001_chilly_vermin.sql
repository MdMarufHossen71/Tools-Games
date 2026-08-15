CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180),
	`messages` json NOT NULL,
	`model` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clipboard_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` varchar(96),
	`title` varchar(160),
	`contentCiphertext` text NOT NULL,
	`category` enum('text','password','code','link') NOT NULL DEFAULT 'text',
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `clipboard_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId1` int NOT NULL,
	`userId2` int NOT NULL,
	`status` enum('pending','accepted','blocked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `friendships_id` PRIMARY KEY(`id`),
	CONSTRAINT `friendships_pair_unique` UNIQUE(`userId1`,`userId2`)
);
--> statement-breakpoint
CREATE TABLE `games_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameSlug` varchar(100) NOT NULL,
	`bestScore` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`resources` json,
	`deviceType` varchar(24),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_progress_user_game_unique` UNIQUE(`userId`,`gameSlug`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameSlug` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `link_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkId` int NOT NULL,
	`visitorHash` varchar(128),
	`country` varchar(2),
	`deviceType` varchar(20),
	`browser` varchar(80),
	`referrer` varchar(512),
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `link_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multiplayer_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomToken` varchar(64) NOT NULL,
	`hostUserId` int,
	`gameSlug` varchar(100) NOT NULL,
	`displayName` varchar(100),
	`privacy` enum('public','private') NOT NULL DEFAULT 'private',
	`status` enum('open','active','finished','expired') NOT NULL DEFAULT 'open',
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `multiplayer_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `multiplayer_rooms_roomToken_unique` UNIQUE(`roomToken`)
);
--> statement-breakpoint
CREATE TABLE `note_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`version` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `note_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `note_versions_note_version_unique` UNIQUE(`noteId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`folderId` varchar(64),
	`title` varchar(200) NOT NULL,
	`content` text,
	`tags` json,
	`color` varchar(24) DEFAULT 'amber',
	`isPinned` boolean NOT NULL DEFAULT false,
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `notes_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `saved_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`toolId` varchar(120) NOT NULL,
	`inputSnapshot` json,
	`label` varchar(120),
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_tools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploaderId` int,
	`fileKey` varchar(512) NOT NULL,
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(120),
	`size` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`passwordCiphertext` text,
	`expiryAt` timestamp,
	`maxDownloads` int,
	`downloadCount` int NOT NULL DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`),
	CONSTRAINT `files_fileKey_unique` UNIQUE(`fileKey`),
	CONSTRAINT `files_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `short_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int,
	`alias` varchar(80) NOT NULL,
	`targetUrlCiphertext` text NOT NULL,
	`passwordCiphertext` text,
	`expiryAt` timestamp,
	`clickLimit` int,
	`clickCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `short_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `short_links_alias_unique` UNIQUE(`alias`)
);
--> statement-breakpoint
CREATE TABLE `tool_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`toolId` varchar(120) NOT NULL,
	`anonymousToken` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tool_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` enum('en','bn') NOT NULL DEFAULT 'en',
	`appearance` varchar(48) NOT NULL DEFAULT 'system',
	`customColors` json,
	`aiPreferences` json,
	`weeklyDigest` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_user_id_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` varchar(280);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `ai_conversations_user_updated_idx` ON `ai_conversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `clipboard_user_created_idx` ON `clipboard_sync` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `leaderboard_game_score_idx` ON `leaderboard` (`gameSlug`,`score`);--> statement-breakpoint
CREATE INDEX `link_clicks_link_clicked_idx` ON `link_clicks` (`linkId`,`clickedAt`);--> statement-breakpoint
CREATE INDEX `multiplayer_rooms_status_expiry_idx` ON `multiplayer_rooms` (`status`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `notes_user_updated_idx` ON `notes` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `saved_tools_user_tool_idx` ON `saved_tools` (`userId`,`toolId`);--> statement-breakpoint
CREATE INDEX `files_uploader_created_idx` ON `files` (`uploaderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `short_links_owner_created_idx` ON `short_links` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tool_history_tool_created_idx` ON `tool_history` (`toolId`,`createdAt`);