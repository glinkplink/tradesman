import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * For SMS users: phoneNumber is the primary identity (no OAuth needed)
 * For admin dashboard: uses standard OAuth flow
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Only for admin OAuth login
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  
  // SMS Invoicing specific fields
  phoneNumber: varchar("phoneNumber", { length: 20 }).unique(), // Primary identity for SMS users
  companyName: text("companyName"),
  businessAddress: text("businessAddress"),
  paymentInfo: text("paymentInfo"), // Stripe link, Venmo, CashApp, etc.
  
  // Onboarding state
  onboardingStep: int("onboardingStep").default(0).notNull(), // 0=new, 1=basic info collected, 2=complete
  sendPdfCopies: boolean("sendPdfCopies").default(false).notNull(), // Whether to email PDF copies to user
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - stores customer information for each user
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  name: text("name").notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Invoices and Quotes table
 * Line items format: [{description: string, quantity: number, unitPrice: number, total: number}]
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  clientId: int("clientId").notNull(), // Foreign key to clients table
  type: mysqlEnum("type", ["invoice", "quote"]).notNull(),
  
  lineItems: json("lineItems").notNull(), // Array of line items
  totalAmount: int("totalAmount").notNull(), // Stored in cents
  
  pdfUrl: text("pdfUrl"), // S3 URL for the generated PDF
  documentNumber: varchar("documentNumber", { length: 50 }), // Auto-generated number
  status: mysqlEnum("status", ["draft", "sent", "paid", "cancelled"]).default("sent").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * SMS Messages log - for debugging and tracking
 */
export const smsMessages = mysqlTable("smsMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Link to user if known
  fromNumber: varchar("fromNumber", { length: 20 }).notNull(),
  toNumber: varchar("toNumber", { length: 20 }).notNull(),
  messageBody: text("messageBody").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  twilioSid: varchar("twilioSid", { length: 100 }),
  status: varchar("status", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

