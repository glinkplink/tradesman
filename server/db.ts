import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  businessProfiles, 
  InsertBusinessProfile,
  BusinessProfile,
  invoices,
  InsertInvoice,
  Invoice,
  quotes,
  InsertQuote,
  Quote,
  payments,
  InsertPayment,
  Payment,
  smsMessages,
  InsertSmsMessage,
  SmsMessage,
  uploadedFiles,
  InsertUploadedFile,
  UploadedFile,
  clients,
  InsertClient,
  Client,
  smsConversations,
  InsertSmsConversation,
  SmsConversation
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ BUSINESS PROFILE OPERATIONS ============

export async function createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(businessProfiles).values(profile);
  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.id, profile.id!)).limit(1);
  return result[0];
}

export async function getBusinessProfileByUserId(userId: string): Promise<BusinessProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBusinessProfileById(id: string): Promise<BusinessProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBusinessProfile(id: string, updates: Partial<InsertBusinessProfile>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(businessProfiles).set(updates).where(eq(businessProfiles.id, id));
}

export async function getBusinessProfileByPhoneNumber(phoneNumber: string): Promise<BusinessProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.phoneNumber, phoneNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ INVOICE OPERATIONS ============

export async function createInvoice(invoice: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(invoices).values(invoice);
  const result = await db.select().from(invoices).where(eq(invoices.id, invoice.id!)).limit(1);
  return result[0];
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvoicesByBusinessProfileId(businessProfileId: string): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(invoices)
    .where(eq(invoices.businessProfileId, businessProfileId))
    .orderBy(desc(invoices.createdAt));
}

export async function updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(invoices).set(updates).where(eq(invoices.id, id));
}

export async function getNextInvoiceNumber(businessProfileId: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allInvoices = await db.select().from(invoices)
    .where(eq(invoices.businessProfileId, businessProfileId))
    .orderBy(desc(invoices.createdAt));

  const nextNumber = allInvoices.length + 1;
  return `INV-${String(nextNumber).padStart(5, '0')}`;
}

// ============ QUOTE OPERATIONS ============

export async function createQuote(quote: InsertQuote): Promise<Quote> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(quotes).values(quote);
  const result = await db.select().from(quotes).where(eq(quotes.id, quote.id!)).limit(1);
  return result[0];
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getQuotesByBusinessProfileId(businessProfileId: string): Promise<Quote[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(quotes)
    .where(eq(quotes.businessProfileId, businessProfileId))
    .orderBy(desc(quotes.createdAt));
}

export async function updateQuote(id: string, updates: Partial<InsertQuote>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(quotes).set(updates).where(eq(quotes.id, id));
}

export async function getNextQuoteNumber(businessProfileId: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allQuotes = await db.select().from(quotes)
    .where(eq(quotes.businessProfileId, businessProfileId))
    .orderBy(desc(quotes.createdAt));

  const nextNumber = allQuotes.length + 1;
  return `QUO-${String(nextNumber).padStart(5, '0')}`;
}

// ============ PAYMENT OPERATIONS ============

export async function createPayment(payment: InsertPayment): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(payments).values(payment);
  const result = await db.select().from(payments).where(eq(payments.id, payment.id!)).limit(1);
  return result[0];
}

export async function getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(desc(payments.createdAt));
}

export async function updatePayment(id: string, updates: Partial<InsertPayment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payments).set(updates).where(eq(payments.id, id));
}

// ============ SMS MESSAGE OPERATIONS ============

export async function createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(smsMessages).values(message);
  const result = await db.select().from(smsMessages).where(eq(smsMessages.id, message.id!)).limit(1);
  return result[0];
}

export async function getSmsMessagesByBusinessProfileId(businessProfileId: string): Promise<SmsMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(smsMessages)
    .where(eq(smsMessages.businessProfileId, businessProfileId))
    .orderBy(desc(smsMessages.createdAt));
}

export async function getSmsMessagesByPhoneNumber(phoneNumber: string): Promise<SmsMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(smsMessages)
    .where(eq(smsMessages.fromNumber, phoneNumber))
    .orderBy(desc(smsMessages.createdAt));
}

// ============ UPLOADED FILE OPERATIONS ============

export async function createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(uploadedFiles).values(file);
  const result = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, file.id!)).limit(1);
  return result[0];
}

export async function getUploadedFilesByBusinessProfileId(businessProfileId: string): Promise<UploadedFile[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(uploadedFiles)
    .where(eq(uploadedFiles.businessProfileId, businessProfileId))
    .orderBy(desc(uploadedFiles.createdAt));
}

// ============ CLIENT OPERATIONS ============

export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(clients).values(client);
  const result = await db.select().from(clients).where(eq(clients.id, client.id!)).limit(1);
  return result[0];
}

export async function getClientById(id: string): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClientsByBusinessProfileId(businessProfileId: string): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clients)
    .where(eq(clients.businessProfileId, businessProfileId))
    .orderBy(desc(clients.createdAt));
}

export async function findClientByName(businessProfileId: string, name: string): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients)
    .where(and(eq(clients.businessProfileId, businessProfileId), eq(clients.name, name)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateClient(id: string, updates: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(updates).where(eq(clients.id, id));
}

// ============ SMS CONVERSATION OPERATIONS ============

export async function createSmsConversation(conversation: InsertSmsConversation): Promise<SmsConversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(smsConversations).values(conversation);
  const result = await db.select().from(smsConversations).where(eq(smsConversations.id, conversation.id!)).limit(1);
  return result[0];
}

export async function getSmsConversationByPhone(businessProfileId: string, phoneNumber: string): Promise<SmsConversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(smsConversations)
    .where(and(
      eq(smsConversations.businessProfileId, businessProfileId),
      eq(smsConversations.phoneNumber, phoneNumber)
    ))
    .orderBy(desc(smsConversations.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSmsConversation(id: string, updates: Partial<InsertSmsConversation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(smsConversations).set(updates).where(eq(smsConversations.id, id));
}

export async function deleteSmsConversation(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(smsConversations).where(eq(smsConversations.id, id));
}

