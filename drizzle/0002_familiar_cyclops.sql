CREATE TABLE `clients` (
	`id` varchar(64) NOT NULL,
	`businessProfileId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsConversations` (
	`id` varchar(64) NOT NULL,
	`businessProfileId` varchar(64) NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`state` enum('awaiting_client_phone','awaiting_client_address','completed') NOT NULL,
	`pendingInvoiceData` text,
	`pendingQuoteData` text,
	`clientName` varchar(255),
	`clientPhone` varchar(50),
	`clientAddress` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smsConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `businessProfileId_idx` ON `clients` (`businessProfileId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `clients` (`name`);--> statement-breakpoint
CREATE INDEX `businessProfileId_idx` ON `smsConversations` (`businessProfileId`);--> statement-breakpoint
CREATE INDEX `phoneNumber_idx` ON `smsConversations` (`phoneNumber`);--> statement-breakpoint
CREATE INDEX `state_idx` ON `smsConversations` (`state`);