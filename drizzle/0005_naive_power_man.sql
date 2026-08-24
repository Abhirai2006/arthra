CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`consentedToReply` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(80) NOT NULL DEFAULT 'website',
	`consentedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waitlist_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `waitlist_entries_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `contact_messages_email_created_idx` ON `contact_messages` (`email`,`createdAt`);