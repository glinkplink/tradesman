/**
 * Twilio SMS integration and Resend email delivery
 * Handles sending SMS messages and processing webhooks
 */

import { Resend } from 'resend';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

let twilioConfig: TwilioConfig | null = null;
let resendClient: Resend | null = null;

export function initTwilio(config: TwilioConfig) {
  twilioConfig = config;
}

export function initResend(apiKey: string) {
  resendClient = new Resend(apiKey);
}

export function getTwilioConfig(): TwilioConfig | null {
  return twilioConfig;
}

/**
 * Send SMS message via Twilio
 */
export async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!twilioConfig) {
    console.warn("[Twilio] Not configured, skipping SMS send");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioConfig.phoneNumber,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Twilio] Failed to send SMS:", error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("[Twilio] Error sending SMS:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email via Resend with PDF attachment
 */
export async function sendEmail(
  to: string, 
  subject: string, 
  body: string, 
  pdfBuffer?: Buffer,
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resendClient) {
    console.warn("[Resend] Not configured, skipping email send");
    return { success: false, error: "Resend not configured" };
  }

  const fromEmail = process.env.FROM_EMAIL || 'invoices@yourdomain.com';

  try {
    const emailData: any = {
      from: fromEmail,
      to,
      subject,
      text: body,
    };

    // Add PDF attachment if provided
    if (pdfBuffer) {
      emailData.attachments = [{
        filename: filename || 'document.pdf',
        content: pdfBuffer,
      }];
    }

    await resendClient.emails.send(emailData);
    return { success: true };
  } catch (error) {
    console.error("[Resend] Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Parse incoming Twilio webhook
 */
export interface IncomingSms {
  from: string;
  to: string;
  body: string;
  messageSid: string;
}

export function parseTwilioWebhook(body: any): IncomingSms {
  return {
    from: body.From,
    to: body.To,
    body: body.Body,
    messageSid: body.MessageSid,
  };
}

