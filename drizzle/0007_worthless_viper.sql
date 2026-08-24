CREATE TABLE `health_check_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`targetBaseUrl` varchar(2048) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`lastStatus` varchar(16),
	`lastSummary` varchar(500),
	`lastRunAt` timestamp,
	`lastFailureAlertAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_check_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_check_configs_task_uid_unique` UNIQUE(`taskUid`)
);
