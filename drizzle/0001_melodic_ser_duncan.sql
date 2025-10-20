CREATE TABLE `businessProfiles` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`businessEmail` varchar(320) NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`businessAddress` text,
	`taxId` varchar(100),
	`defaultHourlyRate` int,
	`paymentProcessor` enum('stripe','square','paypal','manual') NOT NULL DEFAULT 'manual',
	`paymentTerms` varchar(100) DEFAULT 'due_on_receipt',
	`defaultInvoiceFooter` text,
	`logoUrl` varchar(512),
	`logoKey` varchar(512),
	`stripeAccountId` varchar(255),
	`squareAccessToken` varchar(512),
	`paypalEmail` varchar(320),
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(64) NOT NULL,
	`businessProfileId` varchar(64) NOT NULL,
	`invoiceNumber` varchar(100) NOT NULL,
	`clientName` varchar(255),
	`clientEmail` varchar(320),
	`clientPhone` varchar(50),
	`description` text NOT NULL,
	`laborAmount` int NOT NULL DEFAULT 0,
	`materialsAmount` int NOT NULL DEFAULT 0,
	`partsAmount` int NOT NULL DEFAULT 0,
	`subtotal` int NOT NULL,
	`taxRate` int DEFAULT 0,
	`taxAmount` int NOT NULL DEFAULT 0,
	`totalAmount` int NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`pdfUrl` varchar(512),
	`pdfKey` varchar(512),
	`paymentLink` varchar(512),
	`paymentProcessor` enum('stripe','square','paypal','manual'),
	`dueDate` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`smsContext` text,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(64) NOT NULL,
	`invoiceId` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`paymentProcessor` enum('stripe','square','paypal','manual') NOT NULL,
	`processorPaymentId` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(100),
	`notes` text,
	`paidAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(64) NOT NULL,
	`businessProfileId` varchar(64) NOT NULL,
	`quoteNumber` varchar(100) NOT NULL,
	`clientName` varchar(255),
	`clientEmail` varchar(320),
	`clientPhone` varchar(50),
	`description` text NOT NULL,
	`laborAmount` int NOT NULL DEFAULT 0,
	`materialsAmount` int NOT NULL DEFAULT 0,
	`partsAmount` int NOT NULL DEFAULT 0,
	`subtotal` int NOT NULL,
	`taxRate` int DEFAULT 0,
	`taxAmount` int NOT NULL DEFAULT 0,
	`totalAmount` int NOT NULL,
	`status` enum('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`pdfUrl` varchar(512),
	`pdfKey` varchar(512),
	`validUntil` timestamp,
	`acceptedAt` timestamp,
	`convertedToInvoiceId` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`smsContext` text,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsMessages` (
	`id` varchar(64) NOT NULL,
	`businessProfileId` varchar(64),
	`fromNumber` varchar(50) NOT NULL,
	`toNumber` varchar(50) NOT NULL,
	`messageBody` text NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`twilioMessageSid` varchar(255),
	`status` varchar(50),
	`relatedInvoiceId` varchar(64),
	`relatedQuoteId` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `smsMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploadedFiles` (
	`id` varchar(64) NOT NULL,
	`businessProfileId` varchar(64) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`s3Url` varchar(512) NOT NULL,
	`purpose` enum('logo','attachment','other') NOT NULL DEFAULT 'other',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `uploadedFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `businessProfiles` (`userId`);--> statement-breakpoint
CREATE INDEX `businessProfileId_idx` ON `invoices` (`businessProfileId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `invoices` (`createdAt`);--> statement-breakpoint
CREATE INDEX `invoiceId_idx` ON `payments` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `businessProfileId_idx` ON `quotes` (`businessProfileId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `quotes` (`createdAt`);--> statement-breakpoint
CREATE INDEX `businessProfileId_idx` ON `smsMessages` (`businessProfileId`);--> statement-breakpoint
CREATE INDEX `fromNumber_idx` ON `smsMessages` (`fromNumber`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `smsMessages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `businessProfileId_idx` ON `uploadedFiles` (`businessProfileId`);