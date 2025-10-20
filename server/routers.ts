import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getBusinessProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new Error("Business profile not found");
      }

      return await db.getClientsByBusinessProfileId(profile.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getBusinessProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new Error("Business profile not found");
        }

        const client = await db.createClient({
          id: nanoid(),
          businessProfileId: profile.id,
          ...input,
        });

        return client;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateClient(id, updates);
        return await db.getClientById(id);
      }),
  }),

  quickbooks: router({
    exportInvoices: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getBusinessProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new Error("Business profile not found");
      }

      const invoices = await db.getInvoicesByBusinessProfileId(profile.id);
      const { generateInvoicesCSV } = await import("./quickbooksExport");
      const csv = generateInvoicesCSV(invoices);

      return { csv, filename: `invoices-${Date.now()}.csv` };
    }),

    exportQuotes: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getBusinessProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new Error("Business profile not found");
      }

      const quotes = await db.getQuotesByBusinessProfileId(profile.id);
      const { generateQuotesCSV } = await import("./quickbooksExport");
      const csv = generateQuotesCSV(quotes);

      return { csv, filename: `quotes-${Date.now()}.csv` };
    }),
  }),

  businessProfile: router({
    create: protectedProcedure
      .input(
        z.object({
          businessName: z.string(),
          contactName: z.string(),
          businessEmail: z.string().email(),
          phoneNumber: z.string(),
          businessAddress: z.string().optional(),
          taxId: z.string().optional(),
          defaultHourlyRate: z.number().optional(),
          paymentProcessor: z.enum(["stripe", "square", "paypal", "manual"]),
          paymentTerms: z.string(),
          defaultInvoiceFooter: z.string().optional(),
          logoUrl: z.string().optional(),
          logoKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if user already has a profile
        const existing = await db.getBusinessProfileByUserId(ctx.user.id);
        if (existing) {
          throw new Error("Business profile already exists");
        }

        const profile = await db.createBusinessProfile({
          id: nanoid(),
          userId: ctx.user.id,
          ...input,
          onboardingCompleted: true,
        });

        return profile;
      }),

    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBusinessProfileByUserId(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          businessName: z.string().optional(),
          contactName: z.string().optional(),
          businessEmail: z.string().email().optional(),
          phoneNumber: z.string().optional(),
          businessAddress: z.string().optional(),
          taxId: z.string().optional(),
          defaultHourlyRate: z.number().optional(),
          paymentProcessor: z.enum(["stripe", "square", "paypal", "manual"]).optional(),
          paymentTerms: z.string().optional(),
          defaultInvoiceFooter: z.string().optional(),
          logoUrl: z.string().optional(),
          logoKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getBusinessProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new Error("Business profile not found");
        }

        await db.updateBusinessProfile(profile.id, input);
        return await db.getBusinessProfileById(profile.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
