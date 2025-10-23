import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  getUserByPhone, 
  createOrUpdateUserByPhone, 
  findOrCreateClient, 
  createDocument, 
  logSmsMessage,
  getDashboardStats,
  getDocumentsTimeSeries,
  getNewUsersPerWeek,
} from "./db";
import { parseSmsMessage, parseOnboardingStep1, parseOnboardingStep2 } from "./smsParser";
import { sendSms, sendEmail, parseTwilioWebhook, initTwilio, initResend } from "./twilio";
import { generatePdf } from "./pdfGenerator";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// Initialize Twilio with environment variables
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  initTwilio({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  });
}

// Initialize Resend with environment variable
if (process.env.RESEND_API_KEY) {
  initResend(process.env.RESEND_API_KEY);
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // SMS webhook handler (public endpoint for Twilio)
  sms: router({
    webhook: publicProcedure
      .input(z.object({
        From: z.string(),
        To: z.string(),
        Body: z.string(),
        MessageSid: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { from, to, body, messageSid } = {
          from: input.From,
          to: input.To,
          body: input.Body,
          messageSid: input.MessageSid || '',
        };

        // Log incoming message
        const user = await getUserByPhone(from);
        await logSmsMessage({
          userId: user?.id,
          fromNumber: from,
          toNumber: to,
          messageBody: body,
          direction: 'inbound',
          twilioSid: messageSid,
          status: 'received',
        });

        // Get or create user
        let currentUser = await getUserByPhone(from);
        
        if (!currentUser) {
          // New user - create account and start onboarding
          currentUser = await createOrUpdateUserByPhone(from, {
            phoneNumber: from,
            onboardingStep: 0,
          });

          const welcomeMsg = `Welcome to SMS Invoice & Quote Generator! 📄\n\nLet's get you set up. Please reply with:\n1. Your full name\n2. Company name (optional)\n3. Business address (optional)\n4. Payment info - Venmo, CashApp, or Stripe link (optional)\n\nExample:\nJohn Smith\nSmith Plumbing LLC\n123 Main St, City, ST 12345\nVenmo: @johnsmith`;

          await sendSms(from, welcomeMsg);
          await logSmsMessage({
            userId: currentUser?.id,
            fromNumber: to,
            toNumber: from,
            messageBody: welcomeMsg,
            direction: 'outbound',
            status: 'sent',
          });

          return { success: true, message: 'Onboarding started' };
        }

        // Handle onboarding steps
        if (currentUser.onboardingStep === 0) {
          // Parse step 1 data
          const data = parseOnboardingStep1(body);
          
          await createOrUpdateUserByPhone(from, {
            name: data.name || currentUser.name,
            companyName: data.companyName || currentUser.companyName,
            businessAddress: data.businessAddress || currentUser.businessAddress,
            paymentInfo: data.paymentInfo || currentUser.paymentInfo,
            email: data.email || currentUser.email,
            onboardingStep: 1,
          });

          const step2Msg = `Great! ${data.name ? `Thanks, ${data.name}!` : 'Got it!'}\n\nOne more thing: Would you like to receive copies of your invoices/quotes via email?\n\n${data.email ? `Reply "yes" to use ${data.email}` : 'Reply with your email address'}, or reply "no" to skip.`;

          await sendSms(from, step2Msg);
          await logSmsMessage({
            userId: currentUser.id,
            fromNumber: to,
            toNumber: from,
            messageBody: step2Msg,
            direction: 'outbound',
            status: 'sent',
          });

          return { success: true, message: 'Step 1 complete' };
        }

        if (currentUser.onboardingStep === 1) {
          // Parse step 2 data
          const data = parseOnboardingStep2(body);
          
          await createOrUpdateUserByPhone(from, {
            email: data.email || currentUser.email,
            sendPdfCopies: data.sendPdfCopies,
            onboardingStep: 2,
          });

          const completeMsg = `✅ Setup complete!\n\nYou can now send invoice or quote requests anytime. Just text me with details like:\n\n"Invoice, 2 hrs @ $120, John Smith, john@email.com"\n\nor\n\n"Quote 4 hrs $150/hr, 3 boxes nails $50, Jane Doe, (555)123-4567"\n\nI'll handle the rest! 🚀`;

          await sendSms(from, completeMsg);
          await logSmsMessage({
            userId: currentUser.id,
            fromNumber: to,
            toNumber: from,
            messageBody: completeMsg,
            direction: 'outbound',
            status: 'sent',
          });

          return { success: true, message: 'Onboarding complete' };
        }

        // User is onboarded - parse invoice/quote request
        const parsed = parseSmsMessage(body);

        if (!parsed) {
          const errorMsg = `I couldn't understand that request. Please include:\n- "invoice" or "quote"\n- Hours/items with prices\n- Client name\n- Client phone or email\n\nExample: "Invoice 2 hrs @ $120, John Smith, john@email.com"`;

          await sendSms(from, errorMsg);
          await logSmsMessage({
            userId: currentUser.id,
            fromNumber: to,
            toNumber: from,
            messageBody: errorMsg,
            direction: 'outbound',
            status: 'sent',
          });

          return { success: false, message: 'Parse failed' };
        }

        // Create or update client
        if (!parsed.clientName) {
          const errorMsg = `Please include the client's name in your request.`;
          await sendSms(from, errorMsg);
          return { success: false, message: 'No client name' };
        }

        const client = await findOrCreateClient(
          currentUser.id,
          parsed.clientName,
          parsed.clientPhone,
          parsed.clientEmail,
          parsed.clientAddress
        );

        // Create document record
        const doc = await createDocument({
          userId: currentUser.id,
          clientId: client.id,
          type: parsed.type,
          lineItems: parsed.lineItems,
          totalAmount: parsed.totalAmount,
          status: 'sent',
        });

        // Generate PDF
        const pdfData = await generatePdf({
          type: parsed.type,
          documentNumber: doc.documentNumber || `${parsed.type.toUpperCase()}-0001`,
          date: new Date(),
          businessName: currentUser.companyName || currentUser.name || 'Business',
          businessAddress: currentUser.businessAddress || undefined,
          businessPhone: currentUser.phoneNumber || undefined,
          businessEmail: currentUser.email || undefined,
          clientName: parsed.clientName,
          clientAddress: parsed.clientAddress || undefined,
          clientPhone: parsed.clientPhone || undefined,
          clientEmail: parsed.clientEmail || undefined,
          lineItems: parsed.lineItems,
          totalAmount: parsed.totalAmount,
        });

        // Upload to S3
        const fileName = `${parsed.type}-${doc.documentNumber}-${Date.now()}.pdf`;
        const { url: pdfUrl } = await storagePut(fileName, pdfData, 'application/pdf');

        // Update document with PDF URL
        await createOrUpdateUserByPhone(from, {}); // Trigger update to refresh

        // Send PDF to client
        if (parsed.clientPhone) {
          const clientMsg = `${currentUser.companyName || currentUser.name || 'A business'} has sent you ${parsed.type === 'invoice' ? 'an invoice' : 'a quote'}.\n\nView it here: ${pdfUrl}${currentUser.paymentInfo ? `\n\nPayment: ${currentUser.paymentInfo}` : ''}`;
          
          await sendSms(parsed.clientPhone, clientMsg);
          await logSmsMessage({
            userId: currentUser.id,
            fromNumber: to,
            toNumber: parsed.clientPhone,
            messageBody: clientMsg,
            direction: 'outbound',
            status: 'sent',
          });
        }

        if (parsed.clientEmail) {
          const emailBody = `${currentUser.companyName || currentUser.name || 'A business'} has sent you ${parsed.type === 'invoice' ? 'an invoice' : 'a quote'}.\n\nView the PDF: ${pdfUrl}${currentUser.paymentInfo ? `\n\nPayment Information:\n${currentUser.paymentInfo}` : ''}`;
          
          await sendEmail(
            parsed.clientEmail,
            `${parsed.type === 'invoice' ? 'Invoice' : 'Quote'} from ${currentUser.companyName || currentUser.name}`,
            emailBody,
            pdfData,
            fileName
          );
        }

        // Send confirmation to user
        const confirmMsg = `✅ ${parsed.type === 'invoice' ? 'Invoice' : 'Quote'} ${doc.documentNumber} created!\n\nSent to: ${parsed.clientName}\nTotal: $${(parsed.totalAmount / 100).toFixed(2)}\n\nPDF: ${pdfUrl}`;

        await sendSms(from, confirmMsg);
        await logSmsMessage({
          userId: currentUser.id,
          fromNumber: to,
          toNumber: from,
          messageBody: confirmMsg,
          direction: 'outbound',
          status: 'sent',
        });

        // Send copy to user's email if enabled
        if (currentUser.sendPdfCopies && currentUser.email) {
          await sendEmail(
            currentUser.email,
            `Your ${parsed.type}: ${doc.documentNumber}`,
            `Here's a copy of your ${parsed.type} for ${parsed.clientName}.\n\nTotal: $${(parsed.totalAmount / 100).toFixed(2)}`,
            pdfData,
            fileName
          );
        }

        return { success: true, message: 'Document created and sent' };
      }),
  }),

  // Admin dashboard
  dashboard: router({
    stats: adminProcedure.query(async () => {
      return await getDashboardStats();
    }),

    documentsTimeSeries: adminProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        return await getDocumentsTimeSeries(input.days);
      }),

    newUsersPerWeek: adminProcedure
      .input(z.object({ weeks: z.number().default(8) }))
      .query(async ({ input }) => {
        return await getNewUsersPerWeek(input.weeks);
      }),
  }),
});

export type AppRouter = typeof appRouter;

