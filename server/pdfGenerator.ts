import PDFDocument from "pdfkit";
import { Invoice, Quote, BusinessProfile } from "../drizzle/schema";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";

interface InvoicePdfData {
  invoice: Invoice;
  businessProfile: BusinessProfile;
}

interface QuotePdfData {
  quote: Quote;
  businessProfile: BusinessProfile;
}

/**
 * Generate a professional invoice PDF
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<{ url: string; key: string }> {
  const { invoice, businessProfile } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `invoices/${invoice.id}-${nanoid()}.pdf`;
        const result = await storagePut(key, pdfBuffer, "application/pdf");
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    // Header with logo (if available)
    let currentY = 50;
    
    if (businessProfile.logoUrl) {
      // Note: In production, you'd fetch and embed the logo
      // For now, we'll just add space for it
      currentY += 80;
    }

    // Business information
    doc.fontSize(20).font("Helvetica-Bold").text(businessProfile.businessName, 50, currentY);
    currentY += 25;

    doc.fontSize(10).font("Helvetica");
    if (businessProfile.businessAddress) {
      doc.text(businessProfile.businessAddress, 50, currentY);
      currentY += 15;
    }
    doc.text(businessProfile.businessEmail, 50, currentY);
    currentY += 15;
    doc.text(businessProfile.phoneNumber, 50, currentY);
    currentY += 30;

    // Invoice title and number
    doc.fontSize(28).font("Helvetica-Bold").text("INVOICE", 50, currentY);
    doc.fontSize(12).font("Helvetica").text(`Invoice #: ${invoice.invoiceNumber}`, 400, currentY);
    currentY += 20;
    doc.fontSize(10).text(`Date: ${new Date(invoice.createdAt!).toLocaleDateString()}`, 400, currentY);
    if (invoice.dueDate) {
      currentY += 15;
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, currentY);
    }
    currentY += 40;

    // Bill to section
    if (invoice.clientName) {
      doc.fontSize(12).font("Helvetica-Bold").text("BILL TO:", 50, currentY);
      currentY += 20;
      doc.fontSize(10).font("Helvetica").text(invoice.clientName, 50, currentY);
      currentY += 15;
      if (invoice.clientEmail) {
        doc.text(invoice.clientEmail, 50, currentY);
        currentY += 15;
      }
      if (invoice.clientPhone) {
        doc.text(invoice.clientPhone, 50, currentY);
        currentY += 15;
      }
      currentY += 20;
    }

    // Description
    doc.fontSize(12).font("Helvetica-Bold").text("Description:", 50, currentY);
    currentY += 20;
    doc.fontSize(10).font("Helvetica").text(invoice.description, 50, currentY, { width: 500 });
    currentY += 40;

    // Line items table
    const tableTop = currentY;
    const itemX = 50;
    const amountX = 450;

    // Table header
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Item", itemX, tableTop);
    doc.text("Amount", amountX, tableTop);
    currentY = tableTop + 20;

    // Draw line under header
    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();

    // Line items
    doc.font("Helvetica");
    
    if (invoice.laborAmount && invoice.laborAmount > 0) {
      doc.text("Labor", itemX, currentY);
      doc.text(`$${(invoice.laborAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    if (invoice.materialsAmount && invoice.materialsAmount > 0) {
      doc.text("Materials", itemX, currentY);
      doc.text(`$${(invoice.materialsAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    if (invoice.partsAmount && invoice.partsAmount > 0) {
      doc.text("Parts", itemX, currentY);
      doc.text(`$${(invoice.partsAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    currentY += 10;

    // Subtotal
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;
    doc.text("Subtotal", itemX, currentY);
    doc.text(`$${(invoice.subtotal / 100).toFixed(2)}`, amountX, currentY);
    currentY += 20;

    // Tax (if applicable)
    if (invoice.taxAmount && invoice.taxAmount > 0) {
      doc.text(`Tax (${(invoice.taxRate! / 100).toFixed(2)}%)`, itemX, currentY);
      doc.text(`$${(invoice.taxAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    // Total
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("TOTAL", itemX, currentY);
    doc.text(`$${(invoice.totalAmount / 100).toFixed(2)}`, amountX, currentY);
    currentY += 40;

    // Payment terms
    doc.fontSize(10).font("Helvetica");
    const paymentTermsText = getPaymentTermsText(businessProfile.paymentTerms || "due_on_receipt");
    doc.text(`Payment Terms: ${paymentTermsText}`, 50, currentY);
    currentY += 30;

    // Footer
    if (businessProfile.defaultInvoiceFooter) {
      doc.fontSize(9).font("Helvetica-Oblique");
      doc.text(businessProfile.defaultInvoiceFooter, 50, currentY, { width: 500, align: "center" });
    }

    // Tax ID (if available)
    if (businessProfile.taxId) {
      currentY = doc.page.height - 80;
      doc.fontSize(8).font("Helvetica");
      doc.text(`Tax ID: ${businessProfile.taxId}`, 50, currentY);
    }

    doc.end();
  });
}

/**
 * Generate a professional quote PDF
 */
export async function generateQuotePdf(data: QuotePdfData): Promise<{ url: string; key: string }> {
  const { quote, businessProfile } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `quotes/${quote.id}-${nanoid()}.pdf`;
        const result = await storagePut(key, pdfBuffer, "application/pdf");
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    // Header with logo (if available)
    let currentY = 50;
    
    if (businessProfile.logoUrl) {
      currentY += 80;
    }

    // Business information
    doc.fontSize(20).font("Helvetica-Bold").text(businessProfile.businessName, 50, currentY);
    currentY += 25;

    doc.fontSize(10).font("Helvetica");
    if (businessProfile.businessAddress) {
      doc.text(businessProfile.businessAddress, 50, currentY);
      currentY += 15;
    }
    doc.text(businessProfile.businessEmail, 50, currentY);
    currentY += 15;
    doc.text(businessProfile.phoneNumber, 50, currentY);
    currentY += 30;

    // Quote title and number
    doc.fontSize(28).font("Helvetica-Bold").text("QUOTE", 50, currentY);
    doc.fontSize(12).font("Helvetica").text(`Quote #: ${quote.quoteNumber}`, 400, currentY);
    currentY += 20;
    doc.fontSize(10).text(`Date: ${new Date(quote.createdAt!).toLocaleDateString()}`, 400, currentY);
    if (quote.validUntil) {
      currentY += 15;
      doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, 400, currentY);
    }
    currentY += 40;

    // Quote for section
    if (quote.clientName) {
      doc.fontSize(12).font("Helvetica-Bold").text("QUOTE FOR:", 50, currentY);
      currentY += 20;
      doc.fontSize(10).font("Helvetica").text(quote.clientName, 50, currentY);
      currentY += 15;
      if (quote.clientEmail) {
        doc.text(quote.clientEmail, 50, currentY);
        currentY += 15;
      }
      if (quote.clientPhone) {
        doc.text(quote.clientPhone, 50, currentY);
        currentY += 15;
      }
      currentY += 20;
    }

    // Description
    doc.fontSize(12).font("Helvetica-Bold").text("Description:", 50, currentY);
    currentY += 20;
    doc.fontSize(10).font("Helvetica").text(quote.description, 50, currentY, { width: 500 });
    currentY += 40;

    // Line items table
    const tableTop = currentY;
    const itemX = 50;
    const amountX = 450;

    // Table header
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Item", itemX, tableTop);
    doc.text("Amount", amountX, tableTop);
    currentY = tableTop + 20;

    // Draw line under header
    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();

    // Line items
    doc.font("Helvetica");
    
    if (quote.laborAmount && quote.laborAmount > 0) {
      doc.text("Labor", itemX, currentY);
      doc.text(`$${(quote.laborAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    if (quote.materialsAmount && quote.materialsAmount > 0) {
      doc.text("Materials", itemX, currentY);
      doc.text(`$${(quote.materialsAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    if (quote.partsAmount && quote.partsAmount > 0) {
      doc.text("Parts", itemX, currentY);
      doc.text(`$${(quote.partsAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    currentY += 10;

    // Subtotal
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;
    doc.text("Subtotal", itemX, currentY);
    doc.text(`$${(quote.subtotal / 100).toFixed(2)}`, amountX, currentY);
    currentY += 20;

    // Tax (if applicable)
    if (quote.taxAmount && quote.taxAmount > 0) {
      doc.text(`Tax (${(quote.taxRate! / 100).toFixed(2)}%)`, itemX, currentY);
      doc.text(`$${(quote.taxAmount / 100).toFixed(2)}`, amountX, currentY);
      currentY += 20;
    }

    // Total
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("TOTAL", itemX, currentY);
    doc.text(`$${(quote.totalAmount / 100).toFixed(2)}`, amountX, currentY);
    currentY += 40;

    // Quote validity notice
    doc.fontSize(10).font("Helvetica");
    doc.text("This quote is an estimate and may be subject to change.", 50, currentY);
    currentY += 30;

    // Footer
    if (businessProfile.defaultInvoiceFooter) {
      doc.fontSize(9).font("Helvetica-Oblique");
      doc.text(businessProfile.defaultInvoiceFooter, 50, currentY, { width: 500, align: "center" });
    }

    // Tax ID (if available)
    if (businessProfile.taxId) {
      currentY = doc.page.height - 80;
      doc.fontSize(8).font("Helvetica");
      doc.text(`Tax ID: ${businessProfile.taxId}`, 50, currentY);
    }

    doc.end();
  });
}

/**
 * Helper function to convert payment terms to readable text
 */
function getPaymentTermsText(terms: string): string {
  const termsMap: Record<string, string> = {
    due_on_receipt: "Due on Receipt",
    net_7: "Net 7 Days",
    net_15: "Net 15 Days",
    net_30: "Net 30 Days",
    net_60: "Net 60 Days",
  };
  return termsMap[terms] || terms;
}

