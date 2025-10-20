import { Router } from "express";
import twilio from "twilio";
import { nanoid } from "nanoid";
import * as db from "./db";
import { parseSmsMessage } from "./smsParser";
import { generateInvoicePdf, generateQuotePdf } from "./pdfGenerator";
import { generatePaymentLink } from "./paymentIntegration";

const router = Router();

// Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Twilio webhook endpoint for incoming SMS messages
 * POST /api/twilio/sms
 */
router.post("/twilio/sms", async (req, res) => {
  try {
    const { From, To, Body, MessageSid } = req.body;

    console.log(`[Twilio] Received SMS from ${From}: ${Body}`);

    // Log the incoming SMS
    await db.createSmsMessage({
      id: nanoid(),
      fromNumber: From,
      toNumber: To,
      messageBody: Body,
      direction: "inbound",
      twilioMessageSid: MessageSid,
      status: "received",
    });

    // Check if the sender has a business profile
    const profile = await db.getBusinessProfileByPhoneNumber(From);

    if (!profile) {
      // New user - send onboarding link
      const onboardingUrl = `${process.env.APP_URL || "http://localhost:3000"}/onboarding`;
      const responseMessage = `Welcome to SMS Invoice! 📱\n\nTo get started, please complete your business profile:\n${onboardingUrl}\n\nOnce set up, you can create invoices and quotes by texting this number.`;

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(responseMessage);

      res.type("text/xml");
      res.send(twiml.toString());
      return;
    }

    // Check if there's an active conversation (multi-step interaction)
    const existingConversation = await db.getSmsConversationByPhone(profile.id, From);

    if (existingConversation && existingConversation.state !== "completed") {
      // Handle conversation flow
      await handleConversationFlow(existingConversation, Body, From, To, profile, res);
      return;
    }

    // Parse the SMS message
    let parsedData;
    try {
      parsedData = await parseSmsMessage(Body);
    } catch (error) {
      console.error("[Twilio] SMS parsing error:", error);
      const errorMessage = `Sorry, I couldn't understand that message. Please try again with a format like:\n\n"John Smith - faucet $25, labor $100"\n\nor\n\n"Quote for Jane Doe - deck repair labor $300 materials $200"`;

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(errorMessage);

      res.type("text/xml");
      res.send(twiml.toString());
      return;
    }

    // Check if client name was provided
    if (!parsedData.clientName) {
      // No client name - ask for it
      const responseMessage = `Please provide the client name for this ${parsedData.type}.\n\nExample: "John Smith"`;

      // Store the pending data in a conversation
      await db.createSmsConversation({
        id: nanoid(),
        businessProfileId: profile.id,
        phoneNumber: From,
        state: "awaiting_client_phone",
        pendingInvoiceData: parsedData.type === "invoice" ? JSON.stringify(parsedData) : undefined,
        pendingQuoteData: parsedData.type === "quote" ? JSON.stringify(parsedData) : undefined,
      });

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(responseMessage);

      res.type("text/xml");
      res.send(twiml.toString());
      return;
    }

    // Client name provided - check if client exists
    const existingClient = await db.findClientByName(profile.id, parsedData.clientName);

    if (existingClient) {
      // Client exists - use their information
      await createInvoiceOrQuote(parsedData, profile, existingClient, From, To, res);
    } else {
      // New client - request phone and address
      const responseMessage = `New client "${parsedData.clientName}" detected!\n\nPlease provide their phone number:`;

      // Store the pending data in a conversation
      await db.createSmsConversation({
        id: nanoid(),
        businessProfileId: profile.id,
        phoneNumber: From,
        state: "awaiting_client_phone",
        pendingInvoiceData: parsedData.type === "invoice" ? JSON.stringify(parsedData) : undefined,
        pendingQuoteData: parsedData.type === "quote" ? JSON.stringify(parsedData) : undefined,
        clientName: parsedData.clientName,
      });

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(responseMessage);

      res.type("text/xml");
      res.send(twiml.toString());
    }
  } catch (error) {
    console.error("[Twilio] Webhook error:", error);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, an error occurred. Please try again later.");

    res.type("text/xml");
    res.send(twiml.toString());
  }
});

/**
 * Handle multi-step conversation flow
 */
async function handleConversationFlow(
  conversation: any,
  messageBody: string,
  fromNumber: string,
  toNumber: string,
  profile: any,
  res: any
) {
  const twiml = new twilio.twiml.MessagingResponse();

  if (conversation.state === "awaiting_client_phone") {
    // User provided phone number
    const phoneNumber = messageBody.trim();

    // Update conversation with phone number
    await db.updateSmsConversation(conversation.id, {
      clientPhone: phoneNumber,
      state: "awaiting_client_address",
    });

    // Ask for address
    const responseMessage = `Great! Now please provide ${conversation.clientName}'s address:`;
    twiml.message(responseMessage);

    res.type("text/xml");
    res.send(twiml.toString());
    return;
  }

  if (conversation.state === "awaiting_client_address") {
    // User provided address
    const address = messageBody.trim();

    // Create the client
    const newClient = await db.createClient({
      id: nanoid(),
      businessProfileId: profile.id,
      name: conversation.clientName!,
      phone: conversation.clientPhone!,
      address: address,
    });

    // Mark conversation as completed
    await db.updateSmsConversation(conversation.id, {
      clientAddress: address,
      state: "completed",
    });

    // Get the pending invoice/quote data
    const parsedData = conversation.pendingInvoiceData
      ? JSON.parse(conversation.pendingInvoiceData)
      : JSON.parse(conversation.pendingQuoteData!);

    // Add client info to parsed data
    parsedData.clientName = newClient.name;
    parsedData.clientPhone = newClient.phone;

    // Create the invoice or quote
    await createInvoiceOrQuote(parsedData, profile, newClient, fromNumber, toNumber, res);

    // Clean up conversation
    await db.deleteSmsConversation(conversation.id);
    return;
  }
}

/**
 * Create invoice or quote with client information
 */
async function createInvoiceOrQuote(
  parsedData: any,
  profile: any,
  client: any,
  fromNumber: string,
  toNumber: string,
  res: any
) {
  const twiml = new twilio.twiml.MessagingResponse();

  if (parsedData.type === "invoice") {
    const invoiceNumber = await db.getNextInvoiceNumber(profile.id);
    const subtotal = parsedData.totalAmount || 0;
    
    const invoice = await db.createInvoice({
      id: nanoid(),
      businessProfileId: profile.id,
      invoiceNumber,
      clientName: client.name,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      description: parsedData.description,
      laborAmount: parsedData.laborAmount || 0,
      materialsAmount: parsedData.materialsAmount || 0,
      partsAmount: parsedData.partsAmount || 0,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: subtotal,
      status: "draft",
      paymentStatus: "unpaid",
      smsContext: JSON.stringify(parsedData),
    });

    // Generate PDF
    try {
      const pdfResult = await generateInvoicePdf({ invoice, businessProfile: profile });
      await db.updateInvoice(invoice.id, {
        pdfUrl: pdfResult.url,
        pdfKey: pdfResult.key,
      });
    } catch (error) {
      console.error("[Twilio] PDF generation error:", error);
    }

    // Generate payment link
    let paymentLink: string | null = null;
    try {
      paymentLink = await generatePaymentLink(invoice, profile);
      if (paymentLink) {
        await db.updateInvoice(invoice.id, {
          paymentLink,
          paymentProcessor: profile.paymentProcessor,
        });
      }
    } catch (error) {
      console.error("[Twilio] Payment link generation error:", error);
    }

    // Send response
    const responseMessage = `✅ Invoice ${invoiceNumber} created for ${client.name}!\n\nTotal: $${(subtotal / 100).toFixed(2)}\n\nView: ${process.env.APP_URL || "http://localhost:3000"}/invoices/${invoice.id}${paymentLink ? `\n\nPayment: ${paymentLink}` : ""}`;

    // Log outbound SMS
    await db.createSmsMessage({
      id: nanoid(),
      businessProfileId: profile.id,
      fromNumber: toNumber,
      toNumber: fromNumber,
      messageBody: responseMessage,
      direction: "outbound",
      relatedInvoiceId: invoice.id,
      status: "queued",
    });

    twiml.message(responseMessage);
  } else {
    // Create quote
    const quoteNumber = await db.getNextQuoteNumber(profile.id);
    const subtotal = parsedData.totalAmount || 0;

    const quote = await db.createQuote({
      id: nanoid(),
      businessProfileId: profile.id,
      quoteNumber,
      clientName: client.name,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      description: parsedData.description,
      laborAmount: parsedData.laborAmount || 0,
      materialsAmount: parsedData.materialsAmount || 0,
      partsAmount: parsedData.partsAmount || 0,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: subtotal,
      status: "draft",
      smsContext: JSON.stringify(parsedData),
    });

    // Generate PDF
    try {
      const pdfResult = await generateQuotePdf({ quote, businessProfile: profile });
      await db.updateQuote(quote.id, {
        pdfUrl: pdfResult.url,
        pdfKey: pdfResult.key,
      });
    } catch (error) {
      console.error("[Twilio] PDF generation error:", error);
    }

    // Send response
    const responseMessage = `✅ Quote ${quoteNumber} created for ${client.name}!\n\nTotal: $${(subtotal / 100).toFixed(2)}\n\nView: ${process.env.APP_URL || "http://localhost:3000"}/quotes/${quote.id}`;

    // Log outbound SMS
    await db.createSmsMessage({
      id: nanoid(),
      businessProfileId: profile.id,
      fromNumber: toNumber,
      toNumber: fromNumber,
      messageBody: responseMessage,
      direction: "outbound",
      relatedQuoteId: quote.id,
      status: "queued",
    });

    twiml.message(responseMessage);
  }

  res.type("text/xml");
  res.send(twiml.toString());
}

/**
 * Twilio webhook endpoint for SMS status updates
 * POST /api/twilio/sms-status
 */
router.post("/twilio/sms-status", async (req, res) => {
  try {
    const { MessageSid, MessageStatus } = req.body;
    console.log(`[Twilio] SMS status update: ${MessageSid} - ${MessageStatus}`);
    
    res.sendStatus(200);
  } catch (error) {
    console.error("[Twilio] Status webhook error:", error);
    res.sendStatus(500);
  }
});

export default router;

