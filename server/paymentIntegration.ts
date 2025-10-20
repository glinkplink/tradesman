import Stripe from "stripe";
import { Invoice, BusinessProfile } from "../drizzle/schema";

/**
 * Generate a Stripe payment link for an invoice
 */
export async function generateStripePaymentLink(
  invoice: Invoice,
  businessProfile: BusinessProfile
): Promise<string> {
  if (!businessProfile.stripeAccountId) {
    throw new Error("Stripe account not connected");
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Stripe secret key not configured");
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    // Create a payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: invoice.description,
            },
            unit_amount: invoice.totalAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        business_profile_id: businessProfile.id,
      },
    });

    return paymentLink.url;
  } catch (error) {
    console.error("[Stripe] Payment link creation error:", error);
    throw new Error("Failed to create Stripe payment link");
  }
}

/**
 * Generate a Square payment link for an invoice
 * Note: Square payment link generation requires manual setup via Square Dashboard
 * This is a placeholder that returns instructions
 */
export async function generateSquarePaymentLink(
  invoice: Invoice,
  businessProfile: BusinessProfile
): Promise<string> {
  if (!businessProfile.squareAccessToken) {
    throw new Error("Square account not connected");
  }

  // For MVP, we'll return a placeholder URL
  // In production, integrate with Square Checkout API
  console.log("[Square] Payment link generation not fully implemented - returning placeholder");
  return `https://square.link/u/PLACEHOLDER?amount=${invoice.totalAmount / 100}`;
}

/**
 * Generate a PayPal payment instructions text
 */
export function generatePayPalInstructions(
  invoice: Invoice,
  businessProfile: BusinessProfile
): string {
  if (!businessProfile.paypalEmail) {
    throw new Error("PayPal email not configured");
  }

  return `To pay via PayPal, send $${(invoice.totalAmount / 100).toFixed(2)} to ${businessProfile.paypalEmail} with reference: Invoice ${invoice.invoiceNumber}`;
}

/**
 * Generate manual payment instructions
 */
export function generateManualPaymentInstructions(
  invoice: Invoice,
  businessProfile: BusinessProfile
): string {
  return `Please contact ${businessProfile.businessName} at ${businessProfile.businessEmail} or ${businessProfile.phoneNumber} to arrange payment for Invoice ${invoice.invoiceNumber}. Total amount: $${(invoice.totalAmount / 100).toFixed(2)}`;
}

/**
 * Main function to generate payment link based on payment processor
 */
export async function generatePaymentLink(
  invoice: Invoice,
  businessProfile: BusinessProfile
): Promise<string | null> {
  const processor = invoice.paymentProcessor || businessProfile.paymentProcessor;

  try {
    switch (processor) {
      case "stripe":
        return await generateStripePaymentLink(invoice, businessProfile);
      
      case "square":
        return await generateSquarePaymentLink(invoice, businessProfile);
      
      case "paypal":
        // PayPal doesn't have a direct payment link API, return instructions
        return null;
      
      case "manual":
        // Manual payment doesn't need a link
        return null;
      
      default:
        return null;
    }
  } catch (error) {
    console.error(`[Payment] Failed to generate ${processor} payment link:`, error);
    return null;
  }
}

