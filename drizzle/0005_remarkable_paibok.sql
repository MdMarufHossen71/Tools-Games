CREATE TABLE `multiplayer_room_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`status` enum('joined','ready','left') NOT NULL DEFAULT 'joined',
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `multiplayer_room_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `multiplayer_room_members_room_user_unique` UNIQUE(`roomId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `multiplayer_room_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`body` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `multiplayer_room_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE INDEX `multiplayer_room_members_room_activity_idx` ON `multiplayer_room_members` (`roomId`,`lastActivityAt`);--> statement-breakpoint
CREATE INDEX `multiplayer_room_messages_room_created_idx` ON `multiplayer_room_messages` (`roomId`,`createdAt`);