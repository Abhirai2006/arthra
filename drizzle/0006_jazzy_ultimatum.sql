ALTER TABLE `contact_messages` ADD `status` enum('new','in_progress','resolved','archived') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `lastActionAt` timestamp;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD `status` enum('new','reviewed','archived') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD `lastActionAt` timestamp;--> statement-breakpoint
CREATE INDEX `contact_messages_status_created_idx` ON `contact_messages` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `waitlist_entries_status_created_idx` ON `waitlist_entries` (`status`,`createdAt`);