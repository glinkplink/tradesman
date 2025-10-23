/**
 * SMS Parser for flexible invoice and quote generation
 * Handles various input formats like:
 * - "Invoice 2 hrs @ $120, John Smith, client@example.com"
 * - "$200 2 hrs, quote John Smith, 3 boxes of nails $50"
 * - "Quote 4 hrs 120/hr John Smith (555)555-1234"
 */

export interface ParsedLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  total: number; // in cents
}

export interface ParsedDocument {
  type: 'invoice' | 'quote';
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  lineItems: ParsedLineItem[];
  totalAmount: number; // in cents
}

/**
 * Parse SMS message into structured document data
 */
export function parseSmsMessage(message: string): ParsedDocument | null {
  const normalized = message.trim().toLowerCase();
  
  // Determine document type
  const isInvoice = /\binvoice\b/.test(normalized);
  const isQuote = /\bquote\b/.test(normalized);
  
  if (!isInvoice && !isQuote) {
    return null; // Not a valid invoice/quote request
  }
  
  const type = isInvoice ? 'invoice' : 'quote';
  
  // Extract client information
  const clientName = extractClientName(message);
  const clientPhone = extractPhone(message);
  const clientEmail = extractEmail(message);
  const clientAddress = extractAddress(message);
  
  // Extract line items
  const lineItems = extractLineItems(message);
  
  if (lineItems.length === 0) {
    return null; // No valid line items found
  }
  
  // Calculate total
  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);
  
  return {
    type,
    clientName,
    clientPhone,
    clientEmail,
    clientAddress,
    lineItems,
    totalAmount,
  };
}

/**
 * Extract client name from message
 * Looks for patterns like "John Smith" after common keywords
 */
function extractClientName(message: string): string | null {
  // Try to find name after common patterns
  const patterns = [
    /(?:for|client|customer|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?=\s*[,\(]|\s*$)/,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract phone number from message
 */
function extractPhone(message: string): string | null {
  const phonePattern = /(\+?1?\s*\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4}))/;
  const match = message.match(phonePattern);
  return match ? match[0].trim() : null;
}

/**
 * Extract email from message
 */
function extractEmail(message: string): string | null {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = message.match(emailPattern);
  return match ? match[0].trim() : null;
}

/**
 * Extract address from message (basic implementation)
 */
function extractAddress(message: string): string | null {
  // Look for address keywords
  const addressPattern = /(?:address|addr|location):\s*([^,\n]+)/i;
  const match = message.match(addressPattern);
  return match ? match[1].trim() : null;
}

/**
 * Extract line items from message
 * Handles patterns like:
 * - "2 hrs @ $120" or "2 hours at $120"
 * - "3 boxes of nails $50"
 * - "$200 2 hrs"
 * - "4 hrs 120/hr"
 */
function extractLineItems(message: string): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  
  // Pattern 1: "X hrs @ $Y" or "X hours at $Y" or "X hrs Y/hr"
  const hourPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)\s*(?:@|at)?\s*\$?(\d+(?:\.\d+)?)/gi,
    /(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)\s*(\d+(?:\.\d+)?)\s*(?:\/hr|per\s*hr)/gi,
    /\$?(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/gi,
  ];
  
  for (const pattern of hourPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const quantity = parseFloat(match[1]);
      const rate = parseFloat(match[2]);
      
      if (!isNaN(quantity) && !isNaN(rate)) {
        items.push({
          description: `Labor (${quantity} hrs)`,
          quantity,
          unitPrice: Math.round(rate * 100), // Convert to cents
          total: Math.round(quantity * rate * 100),
        });
      }
    }
  }
  
  // Pattern 2: "X [item description] $Y" or "X [item] @ $Y"
  const itemPattern = /(\d+(?:\.\d+)?)\s+([a-zA-Z\s]+?)\s+(?:@|at)?\s*\$(\d+(?:\.\d+)?)/gi;
  let match;
  while ((match = itemPattern.exec(message)) !== null) {
    const quantity = parseFloat(match[1]);
    const description = match[2].trim();
    const price = parseFloat(match[3]);
    
    // Skip if this looks like hours (already handled)
    if (/\b(?:hrs?|hours?)\b/i.test(description)) {
      continue;
    }
    
    if (!isNaN(quantity) && !isNaN(price)) {
      items.push({
        description: description.charAt(0).toUpperCase() + description.slice(1),
        quantity,
        unitPrice: Math.round(price * 100),
        total: Math.round(quantity * price * 100),
      });
    }
  }
  
  // Pattern 3: Standalone dollar amounts (e.g., "$200" without explicit quantity)
  if (items.length === 0) {
    const standalonePattern = /\$(\d+(?:\.\d+)?)/g;
    while ((match = standalonePattern.exec(message)) !== null) {
      const amount = parseFloat(match[1]);
      if (!isNaN(amount)) {
        items.push({
          description: 'Service',
          quantity: 1,
          unitPrice: Math.round(amount * 100),
          total: Math.round(amount * 100),
        });
      }
    }
  }
  
  return items;
}

/**
 * Parse onboarding responses
 */
export interface OnboardingData {
  name?: string;
  companyName?: string;
  businessAddress?: string;
  paymentInfo?: string;
  email?: string;
  sendPdfCopies?: boolean;
}

export function parseOnboardingStep1(message: string): OnboardingData {
  const data: OnboardingData = {};
  
  // Try to extract structured data
  const lines = message.split(/[,\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for email
    const emailMatch = trimmed.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      data.email = emailMatch[1];
      continue;
    }
    
    // Look for payment info (Venmo, CashApp, Stripe, PayPal)
    if (/venmo|cashapp|cash\s*app|stripe|paypal|payment/i.test(trimmed)) {
      data.paymentInfo = trimmed;
      continue;
    }
    
    // Look for company name keywords
    if (/company|business|llc|inc|corp/i.test(trimmed)) {
      data.companyName = trimmed.replace(/company:?|business:?/i, '').trim();
      continue;
    }
    
    // Look for address keywords
    if (/address|street|st|ave|road|rd|city|state|zip/i.test(trimmed)) {
      data.businessAddress = trimmed.replace(/address:?/i, '').trim();
      continue;
    }
  }
  
  // First line is likely the name if not already categorized
  if (!data.name && lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length > 0 && !/venmo|cashapp|payment|company|address/i.test(firstLine)) {
      data.name = firstLine;
    }
  }
  
  return data;
}

export function parseOnboardingStep2(message: string): { email?: string; sendPdfCopies: boolean } {
  const normalized = message.trim().toLowerCase();
  
  // Check for yes/no
  const isYes = /^(yes|y|yeah|yep|sure|ok|okay)$/i.test(normalized);
  const isNo = /^(no|n|nope|nah)$/i.test(normalized);
  
  if (isYes) {
    return { sendPdfCopies: true };
  }
  
  if (isNo) {
    return { sendPdfCopies: false };
  }
  
  // Try to extract email
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return { email: emailMatch[1], sendPdfCopies: true };
  }
  
  return { sendPdfCopies: false };
}

