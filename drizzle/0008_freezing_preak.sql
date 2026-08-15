ALTER TABLE `useful_links` DROP INDEX `useful_links_urlHash_unique`;--> statement-breakpoint
ALTER TABLE `useful_links` DROP INDEX `useful_links_urlHash_unique`;
ALTER TABLE `useful_links` ADD CONSTRAINT `useful_links_section_category_url_hash_unique` UNIQUE(`section`,`category`,`urlHash`);
