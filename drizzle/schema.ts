import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Business profiles - stores all business information for each user
 * Each user can have one business profile
 */
export const businessProfiles = mysqlTable("businessProfiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  businessEmail: varchar("businessEmail", { length: 320 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
  businessAddress: text("businessAddress"),
  taxId: varchar("taxId", { length: 100 }), // EIN or Tax ID
  defaultHourlyRate: int("defaultHourlyRate"), // in cents
  paymentProcessor: mysqlEnum("paymentProcessor", ["stripe", "square", "paypal", "manual"]).default("manual").notNull(),
  paymentTerms: varchar("paymentTerms", { length: 100 }).default("due_on_receipt"), // due_on_receipt, net_7, net_30, etc.
  defaultInvoiceFooter: text("defaultInvoiceFooter"),
  logoUrl: varchar("logoUrl", { length: 512 }), // S3 URL for uploaded logo
  logoKey: varchar("logoKey", { length: 512 }), // S3 key for uploaded logo
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // Stripe connected account ID
  squareAccessToken: varchar("squareAccessToken", { length: 512 }), // Square access token (encrypted)
  paypalEmail: varchar("paypalEmail", { length: 320 }), // PayPal email for manual payment instructions
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;

/**
 * Invoices - stores all invoice data
 */
export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessProfileId: varchar("businessProfileId", { length: 64 }).notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull(), // Auto-generated or custom
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  description: text("description").notNull(),
  laborAmount: int("laborAmount").default(0).notNull(), // in cents
  materialsAmount: int("materialsAmount").default(0).notNull(), // in cents
  partsAmount: int("partsAmount").default(0).notNull(), // in cents
  subtotal: int("subtotal").notNull(), // in cents
  taxRate: int("taxRate").default(0), // percentage * 100 (e.g., 8.5% = 850)
  taxAmount: int("taxAmount").default(0).notNull(), // in cents
  totalAmount: int("totalAmount").notNull(), // in cents
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).default("unpaid").notNull(),
  pdfUrl: varchar("pdfUrl", { length: 512 }), // S3 URL for generated PDF
  pdfKey: varchar("pdfKey", { length: 512 }), // S3 key for generated PDF
  paymentLink: varchar("paymentLink", { length: 512 }), // Stripe/Square payment link
  paymentProcessor: mysqlEnum("paymentProcessor", ["stripe", "square", "paypal", "manual"]),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  smsContext: text("smsContext"), // Original SMS message for reference
}, (table) => ({
  businessProfileIdIdx: index("businessProfileId_idx").on(table.businessProfileId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Quotes - stores all quote data
 */
export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessProfileId: varchar("businessProfileId", { length: 64 }).notNull(),
  quoteNumber: varchar("quoteNumber", { length: 100 }).notNull(), // Auto-generated or custom
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  description: text("description").notNull(),
  laborAmount: int("laborAmount").default(0).notNull(), // in cents
  materialsAmount: int("materialsAmount").default(0).notNull(), // in cents
  partsAmount: int("partsAmount").default(0).notNull(), // in cents
  subtotal: int("subtotal").notNull(), // in cents
  taxRate: int("taxRate").default(0), // percentage * 100
  taxAmount: int("taxAmount").default(0).notNull(), // in cents
  totalAmount: int("totalAmount").notNull(), // in cents
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  pdfUrl: varchar("pdfUrl", { length: 512 }), // S3 URL for generated PDF
  pdfKey: varchar("pdfKey", { length: 512 }), // S3 key for generated PDF
  validUntil: timestamp("validUntil"), // Quote expiration date
  acceptedAt: timestamp("acceptedAt"),
  convertedToInvoiceId: varchar("convertedToInvoiceId", { length: 64 }), // Link to invoice if quote was accepted
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  smsContext: text("smsContext"), // Original SMS message for reference
}, (table) => ({
  businessProfileIdIdx: index("businessProfileId_idx").on(table.businessProfileId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Payments - tracks payment transactions
 */
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  invoiceId: varchar("invoiceId", { length: 64 }).notNull(),
  amount: int("amount").notNull(), // in cents
  paymentProcessor: mysqlEnum("paymentProcessor", ["stripe", "square", "paypal", "manual"]).notNull(),
  processorPaymentId: varchar("processorPaymentId", { length: 255 }), // External payment ID from processor
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }), // card, bank_transfer, cash, etc.
  notes: text("notes"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  invoiceIdIdx: index("invoiceId_idx").on(table.invoiceId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * SMS Messages - logs all SMS interactions
 */
export const smsMessages = mysqlTable("smsMessages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessProfileId: varchar("businessProfileId", { length: 64 }),
  fromNumber: varchar("fromNumber", { length: 50 }).notNull(),
  toNumber: varchar("toNumber", { length: 50 }).notNull(),
  messageBody: text("messageBody").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  twilioMessageSid: varchar("twilioMessageSid", { length: 255 }),
  status: varchar("status", { length: 50 }), // Twilio status: queued, sent, delivered, failed, etc.
  relatedInvoiceId: varchar("relatedInvoiceId", { length: 64 }),
  relatedQuoteId: varchar("relatedQuoteId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  businessProfileIdIdx: index("businessProfileId_idx").on(table.businessProfileId),
  fromNumberIdx: index("fromNumber_idx").on(table.fromNumber),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

/**
 * Uploaded Files - tracks all uploaded files (logos, attachments, etc.)
 */
export const uploadedFiles = mysqlTable("uploadedFiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessProfileId: varchar("businessProfileId", { length: 64 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(), // MIME type
  fileSize: int("fileSize").notNull(), // in bytes
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: varchar("s3Url", { length: 512 }).notNull(),
  purpose: mysqlEnum("purpose", ["logo", "attachment", "other"]).default("other").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  businessProfileIdIdx: index("businessProfileId_idx").on(table.businessProfileId),
}));

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

/**
 * Clients - stores client information for each business
 */
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessProfileId: varchar("businessProfileId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  businessProfileIdIdx: index("businessProfileId_idx").on(table.businessProfileId),
  nameIdx: index("name_idx").on(table.name),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * SMS Conversations - tracks multi-step SMS interactions
 */
export const smsConversations = mysqlTable("smsConversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessProfileId: varchar("businessProfileId", { length: 64 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
  state: mysqlEnum("state", ["awaiting_client_phone", "awaiting_client_address", "completed"]).notNull(),
  pendingInvoiceData: text("pendingInvoiceData"), // JSON string of parsed invoice data
  pendingQuoteData: text("pendingQuoteData"), // JSON string of parsed quote data
  clientName: varchar("clientName", { length: 255 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  clientAddress: text("clientAddress"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  businessProfileIdIdx: index("businessProfileId_idx").on(table.businessProfileId),
  phoneNumberIdx: index("phoneNumber_idx").on(table.phoneNumber),
  stateIdx: index("state_idx").on(table.state),
}));

export type SmsConversation = typeof smsConversations.$inferSelect;
export type InsertSmsConversation = typeof smsConversations.$inferInsert;

