CREATE TABLE `website_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`displayName` varchar(80),
	`email` varchar(320),
	`rating` int NOT NULL,
	`message` text NOT NULL,
	`permissionToContact` boolean NOT NULL DEFAULT false,
	`status` enum('pending','approved','archived') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `website_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `website_feedback_status_created_idx` ON `website_feedback` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `website_feedback_email_created_idx` ON `website_feedback` (`email`,`createdAt`);