ALTER TABLE `categories` ADD `spaceId` int;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_space_idx` ON `categories` (`spaceId`);