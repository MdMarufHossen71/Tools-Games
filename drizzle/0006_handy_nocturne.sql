CREATE TABLE `daily_challenge_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`gameSlug` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_challenge_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_challenge_scores_date_game_user_unique` UNIQUE(`dateKey`,`gameSlug`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `daily_challenge_scores_date_game_score_idx` ON `daily_challenge_scores` (`dateKey`,`gameSlug`,`score`);