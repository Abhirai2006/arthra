CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`spaceId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`kind` enum('cash','bank','wallet','credit_card','other') NOT NULL DEFAULT 'bank',
	`openingBalancePaise` bigint NOT NULL DEFAULT 0,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`spaceId` int NOT NULL,
	`categoryId` int NOT NULL,
	`monthKey` varchar(7) NOT NULL,
	`amountPaise` bigint NOT NULL,
	`alertAtPercent` int NOT NULL DEFAULT 80,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`),
	CONSTRAINT `budgets_space_category_month_unique` UNIQUE(`spaceId`,`categoryId`,`monthKey`)
);
--> statement-breakpoint
CREATE TABLE `ca_share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`spaceId` int,
	`financialYear` varchar(9) NOT NULL,
	`token` varchar(96) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ca_share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `ca_share_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`kind` enum('expense','income') NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT 'violet',
	`icon` varchar(32) NOT NULL DEFAULT 'circle',
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_owner_name_kind_unique` UNIQUE(`ownerId`,`name`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `space_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`createdById` int NOT NULL,
	`email` varchar(320),
	`role` enum('editor','viewer') NOT NULL DEFAULT 'editor',
	`token` varchar(96) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `space_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `space_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `space_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','editor','viewer') NOT NULL DEFAULT 'viewer',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `space_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `space_members_unique` UNIQUE(`spaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `spaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT 'violet',
	`icon` varchar(32) NOT NULL DEFAULT 'home',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `spaces_owner_name_unique` UNIQUE(`ownerId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `transaction_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`uploadedById` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`createdById` int NOT NULL,
	`accountId` int,
	`categoryId` int,
	`kind` enum('expense','income') NOT NULL,
	`amountPaise` bigint NOT NULL,
	`description` varchar(180) NOT NULL,
	`note` text,
	`occurredAt` timestamp NOT NULL,
	`isGstApplicable` boolean NOT NULL DEFAULT false,
	`gstKind` enum('cgst_sgst','igst'),
	`gstRateBasisPoints` int,
	`isUnusual` boolean NOT NULL DEFAULT false,
	`recurringRule` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastLoggedOn` varchar(10),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_streaks_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_digest_preferences` (
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`destinationEmail` varchar(320),
	`scheduleCronTaskUid` varchar(65),
	`lastSentForWeek` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_digest_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ca_share_links` ADD CONSTRAINT `ca_share_links_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ca_share_links` ADD CONSTRAINT `ca_share_links_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `space_invites` ADD CONSTRAINT `space_invites_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `space_invites` ADD CONSTRAINT `space_invites_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `space_members` ADD CONSTRAINT `space_members_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `space_members` ADD CONSTRAINT `space_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `spaces` ADD CONSTRAINT `spaces_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_receipts` ADD CONSTRAINT `transaction_receipts_transactionId_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_receipts` ADD CONSTRAINT `transaction_receipts_uploadedById_users_id_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_spaceId_spaces_id_fk` FOREIGN KEY (`spaceId`) REFERENCES `spaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_streaks` ADD CONSTRAINT `user_streaks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekly_digest_preferences` ADD CONSTRAINT `weekly_digest_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_owner_space_idx` ON `accounts` (`ownerId`,`spaceId`);--> statement-breakpoint
CREATE INDEX `budgets_space_month_idx` ON `budgets` (`spaceId`,`monthKey`);--> statement-breakpoint
CREATE INDEX `ca_share_links_owner_idx` ON `ca_share_links` (`ownerId`);--> statement-breakpoint
CREATE INDEX `categories_owner_idx` ON `categories` (`ownerId`);--> statement-breakpoint
CREATE INDEX `space_invites_space_idx` ON `space_invites` (`spaceId`);--> statement-breakpoint
CREATE INDEX `space_members_space_idx` ON `space_members` (`spaceId`);--> statement-breakpoint
CREATE INDEX `space_members_user_idx` ON `space_members` (`userId`);--> statement-breakpoint
CREATE INDEX `spaces_owner_idx` ON `spaces` (`ownerId`);--> statement-breakpoint
CREATE INDEX `transaction_receipts_transaction_idx` ON `transaction_receipts` (`transactionId`);--> statement-breakpoint
CREATE INDEX `transactions_space_date_idx` ON `transactions` (`spaceId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `transactions_creator_date_idx` ON `transactions` (`createdById`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `transactions_category_date_idx` ON `transactions` (`categoryId`,`occurredAt`);