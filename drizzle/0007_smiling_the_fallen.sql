CREATE TABLE `useful_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section` enum('bd','awesome','osint') NOT NULL,
	`source` enum('bd_official','bd_app','bd_general','awesome','osint') NOT NULL,
	`category` varchar(160) NOT NULL,
	`categoryBn` varchar(180),
	`name` varchar(240) NOT NULL,
	`nameBn` varchar(240),
	`description` varchar(600) NOT NULL,
	`url` text NOT NULL,
	`urlHash` varchar(64) NOT NULL,
	`isGovernment` boolean NOT NULL DEFAULT false,
	`isApp` boolean NOT NULL DEFAULT false,
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `useful_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `useful_links_urlHash_unique` UNIQUE(`urlHash`)
);
--> statement-breakpoint
CREATE INDEX `useful_links_section_category_idx` ON `useful_links` (`section`,`category`);--> statement-breakpoint
CREATE INDEX `useful_links_source_idx` ON `useful_links` (`source`);--> statement-breakpoint
CREATE INDEX `useful_links_name_idx` ON `useful_links` (`name`);