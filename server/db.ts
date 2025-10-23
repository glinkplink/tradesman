import { eq, desc, and, gte, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, documents, smsMessages, InsertClient, InsertDocument, InsertSmsMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.phoneNumber) {
    throw new Error("User openId or phoneNumber is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {};
    const updateSet: Record<string, unknown> = {};

    if (user.openId) {
      values.openId = user.openId;
    }
    if (user.phoneNumber) {
      values.phoneNumber = user.phoneNumber;
      updateSet.phoneNumber = user.phoneNumber;
    }

    const textFields = ["name", "email", "loginMethod", "companyName", "businessAddress", "paymentInfo"] as const;
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
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.onboardingStep !== undefined) {
      values.onboardingStep = user.onboardingStep;
      updateSet.onboardingStep = user.onboardingStep;
    }
    if (user.sendPdfCopies !== undefined) {
      values.sendPdfCopies = user.sendPdfCopies;
      updateSet.sendPdfCopies = user.sendPdfCopies;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
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

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhone(phoneNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateUserByPhone(phoneNumber: string, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserByPhone(phoneNumber);
  
  if (existing) {
    await db.update(users).set(data).where(eq(users.phoneNumber, phoneNumber));
    return { ...existing, ...data };
  } else {
    await db.insert(users).values({ phoneNumber, ...data });
    return await getUserByPhone(phoneNumber);
  }
}

export async function findOrCreateClient(userId: number, name: string, phone?: string | null, email?: string | null, address?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to find existing client by name (case-insensitive)
  const existing = await db.select().from(clients)
    .where(and(
      eq(clients.userId, userId),
      sql`LOWER(${clients.name}) = LOWER(${name})`
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update contact info if provided
    if (phone || email || address) {
      await db.update(clients)
        .set({
          contactPhone: phone || existing[0].contactPhone,
          contactEmail: email || existing[0].contactEmail,
          address: address || existing[0].address,
        })
        .where(eq(clients.id, existing[0].id));
    }
    return existing[0];
  }

  // Create new client
  const newClient: InsertClient = {
    userId,
    name,
    contactPhone: phone || null,
    contactEmail: email || null,
    address: address || null,
  };

  await db.insert(clients).values(newClient);
  
  const result = await db.select().from(clients)
    .where(and(
      eq(clients.userId, userId),
      sql`LOWER(${clients.name}) = LOWER(${name})`
    ))
    .limit(1);

  return result[0];
}

export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate document number
  const count = await db.select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(and(
      eq(documents.userId, doc.userId),
      eq(documents.type, doc.type)
    ));

  const docNumber = `${doc.type === 'invoice' ? 'INV' : 'QUO'}-${String(Number(count[0].count) + 1).padStart(4, '0')}`;

  await db.insert(documents).values({
    ...doc,
    documentNumber: docNumber,
  });

  const result = await db.select().from(documents)
    .where(eq(documents.documentNumber, docNumber))
    .limit(1);

  return result[0];
}

export async function logSmsMessage(msg: InsertSmsMessage) {
  const db = await getDb();
  if (!db) return;

  await db.insert(smsMessages).values(msg);
}

// Dashboard queries
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total users
  const totalUsers = await db.select({ count: count() }).from(users).where(sql`${users.phoneNumber} IS NOT NULL`);
  
  // New users this week
  const newUsersWeek = await db.select({ count: count() }).from(users)
    .where(and(
      sql`${users.phoneNumber} IS NOT NULL`,
      gte(users.createdAt, startOfWeek)
    ));
  
  // New users this month
  const newUsersMonth = await db.select({ count: count() }).from(users)
    .where(and(
      sql`${users.phoneNumber} IS NOT NULL`,
      gte(users.createdAt, startOfMonth)
    ));
  
  // Active users (last 30 days)
  const activeUsers = await db.select({ count: sql<number>`COUNT(DISTINCT ${documents.userId})` })
    .from(documents)
    .where(gte(documents.createdAt, thirtyDaysAgo));

  // Document stats
  const totalInvoices = await db.select({ count: count() }).from(documents).where(eq(documents.type, 'invoice'));
  const totalQuotes = await db.select({ count: count() }).from(documents).where(eq(documents.type, 'quote'));
  
  const invoicesToday = await db.select({ count: count() }).from(documents)
    .where(and(eq(documents.type, 'invoice'), gte(documents.createdAt, startOfToday)));
  
  const invoicesWeek = await db.select({ count: count() }).from(documents)
    .where(and(eq(documents.type, 'invoice'), gte(documents.createdAt, startOfWeek)));
  
  const invoicesMonth = await db.select({ count: count() }).from(documents)
    .where(and(eq(documents.type, 'invoice'), gte(documents.createdAt, startOfMonth)));

  const quotesToday = await db.select({ count: count() }).from(documents)
    .where(and(eq(documents.type, 'quote'), gte(documents.createdAt, startOfToday)));
  
  const quotesWeek = await db.select({ count: count() }).from(documents)
    .where(and(eq(documents.type, 'quote'), gte(documents.createdAt, startOfWeek)));
  
  const quotesMonth = await db.select({ count: count() }).from(documents)
    .where(and(eq(documents.type, 'quote'), gte(documents.createdAt, startOfMonth)));

  // SMS stats
  const totalSms = await db.select({ count: count() }).from(smsMessages);
  const smsToday = await db.select({ count: count() }).from(smsMessages).where(gte(smsMessages.createdAt, startOfToday));

  // Average invoices per user
  const avgInvoicesPerUser = totalUsers[0].count > 0 
    ? (totalInvoices[0].count / totalUsers[0].count).toFixed(2)
    : '0';

  return {
    users: {
      total: totalUsers[0].count,
      newThisWeek: newUsersWeek[0].count,
      newThisMonth: newUsersMonth[0].count,
      active: activeUsers[0].count,
    },
    documents: {
      totalInvoices: totalInvoices[0].count,
      totalQuotes: totalQuotes[0].count,
      invoicesToday: invoicesToday[0].count,
      invoicesWeek: invoicesWeek[0].count,
      invoicesMonth: invoicesMonth[0].count,
      quotesToday: quotesToday[0].count,
      quotesWeek: quotesWeek[0].count,
      quotesMonth: quotesMonth[0].count,
    },
    sms: {
      total: totalSms[0].count,
      today: smsToday[0].count,
    },
    avgInvoicesPerUser,
  };
}

export async function getDocumentsTimeSeries(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await db.select({
    date: sql<string>`DATE(${documents.createdAt})`,
    type: documents.type,
    count: count(),
  })
    .from(documents)
    .where(gte(documents.createdAt, startDate))
    .groupBy(sql`DATE(${documents.createdAt})`, documents.type)
    .orderBy(sql`DATE(${documents.createdAt})`);

  return results;
}

export async function getNewUsersPerWeek(weeks: number = 8) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  const results = await db.select({
    week: sql<string>`YEARWEEK(${users.createdAt})`,
    count: count(),
  })
    .from(users)
    .where(and(
      sql`${users.phoneNumber} IS NOT NULL`,
      gte(users.createdAt, startDate)
    ))
    .groupBy(sql`YEARWEEK(${users.createdAt})`)
    .orderBy(sql`YEARWEEK(${users.createdAt})`);

  return results;
}

