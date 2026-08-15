CREATE TABLE `blog_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int,
	`authorName` varchar(120) NOT NULL DEFAULT 'ToolsHUB Team',
	`title` varchar(240) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`language` varchar(12) NOT NULL DEFAULT 'en',
	`coverImage` text,
	`categories` json NOT NULL,
	`tags` json NOT NULL,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isPinnedHome` boolean NOT NULL DEFAULT false,
	`metaTitle` varchar(255),
	`metaDescription` varchar(320),
	`readingMinutes` int NOT NULL DEFAULT 3,
	`publishedAt` timestamp,
	`scheduledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_likes_article_user_unique` UNIQUE(`articleId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `blog_articles_status_published_idx` ON `blog_articles` (`status`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `blog_articles_author_updated_idx` ON `blog_articles` (`authorId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `blog_likes_article_idx` ON `blog_likes` (`articleId`);