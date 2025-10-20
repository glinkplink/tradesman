import { Invoice, Quote } from "../drizzle/schema";

/**
 * QuickBooks Invoice CSV format
 * Reference: https://quickbooks.intuit.com/learn-support/en-us/help-article/import-data/import-invoices-quickbooks-desktop/L7Wqz9eVV_US_en_US
 */
interface QuickBooksInvoiceRow {
  InvoiceNo: string;
  Customer: string;
  InvoiceDate: string;
  DueDate: string;
  Terms: string;
  Location: string;
  Memo: string;
  Item: string;
  ItemDescription: string;
  ItemQuantity: string;
  ItemRate: string;
  ItemAmount: string;
  ItemTaxCode: string;
  ItemTaxAmount: string;
  Currency: string;
}

/**
 * Convert invoices to QuickBooks-compatible CSV format
 */
export function generateInvoicesCSV(invoices: Invoice[]): string {
  const headers = [
    "InvoiceNo",
    "Customer",
    "InvoiceDate",
    "DueDate",
    "Terms",
    "Location",
    "Memo",
    "Item",
    "ItemDescription",
    "ItemQuantity",
    "ItemRate",
    "ItemAmount",
    "ItemTaxCode",
    "ItemTaxAmount",
    "Currency",
  ];

  const rows: string[][] = [headers];

  for (const invoice of invoices) {
    const invoiceDate = invoice.createdAt 
      ? new Date(invoice.createdAt).toLocaleDateString("en-US") 
      : "";
    const dueDate = invoice.dueDate 
      ? new Date(invoice.dueDate).toLocaleDateString("en-US") 
      : "";

    // Add labor line item if present
    if (invoice.laborAmount && invoice.laborAmount > 0) {
      rows.push([
        invoice.invoiceNumber,
        invoice.clientName || "Customer",
        invoiceDate,
        dueDate,
        getQuickBooksTerms(invoice),
        "",
        invoice.description,
        "Labor",
        "Labor charges",
        "1",
        (invoice.laborAmount / 100).toFixed(2),
        (invoice.laborAmount / 100).toFixed(2),
        invoice.taxRate ? "TAX" : "NON",
        "0.00",
        "USD",
      ]);
    }

    // Add materials line item if present
    if (invoice.materialsAmount && invoice.materialsAmount > 0) {
      rows.push([
        invoice.invoiceNumber,
        invoice.clientName || "Customer",
        invoiceDate,
        dueDate,
        getQuickBooksTerms(invoice),
        "",
        invoice.description,
        "Materials",
        "Materials charges",
        "1",
        (invoice.materialsAmount / 100).toFixed(2),
        (invoice.materialsAmount / 100).toFixed(2),
        invoice.taxRate ? "TAX" : "NON",
        "0.00",
        "USD",
      ]);
    }

    // Add parts line item if present
    if (invoice.partsAmount && invoice.partsAmount > 0) {
      rows.push([
        invoice.invoiceNumber,
        invoice.clientName || "Customer",
        invoiceDate,
        dueDate,
        getQuickBooksTerms(invoice),
        "",
        invoice.description,
        "Parts",
        "Parts charges",
        "1",
        (invoice.partsAmount / 100).toFixed(2),
        (invoice.partsAmount / 100).toFixed(2),
        invoice.taxRate ? "TAX" : "NON",
        "0.00",
        "USD",
      ]);
    }

    // If no line items, add a single line with total
    if (!invoice.laborAmount && !invoice.materialsAmount && !invoice.partsAmount) {
      rows.push([
        invoice.invoiceNumber,
        invoice.clientName || "Customer",
        invoiceDate,
        dueDate,
        getQuickBooksTerms(invoice),
        "",
        invoice.description,
        "Service",
        invoice.description,
        "1",
        (invoice.totalAmount / 100).toFixed(2),
        (invoice.totalAmount / 100).toFixed(2),
        invoice.taxRate ? "TAX" : "NON",
        invoice.taxAmount ? (invoice.taxAmount / 100).toFixed(2) : "0.00",
        "USD",
      ]);
    }
  }

  return rows.map(row => row.map(escapeCSVField).join(",")).join("\n");
}

/**
 * Convert quotes to QuickBooks-compatible CSV format (as estimates)
 */
export function generateQuotesCSV(quotes: Quote[]): string {
  const headers = [
    "EstimateNo",
    "Customer",
    "EstimateDate",
    "ExpirationDate",
    "Memo",
    "Item",
    "ItemDescription",
    "ItemQuantity",
    "ItemRate",
    "ItemAmount",
    "ItemTaxCode",
    "Currency",
  ];

  const rows: string[][] = [headers];

  for (const quote of quotes) {
    const quoteDate = quote.createdAt 
      ? new Date(quote.createdAt).toLocaleDateString("en-US") 
      : "";
    const expirationDate = quote.validUntil 
      ? new Date(quote.validUntil).toLocaleDateString("en-US") 
      : "";

    // Add labor line item if present
    if (quote.laborAmount && quote.laborAmount > 0) {
      rows.push([
        quote.quoteNumber,
        quote.clientName || "Customer",
        quoteDate,
        expirationDate,
        quote.description,
        "Labor",
        "Labor charges",
        "1",
        (quote.laborAmount / 100).toFixed(2),
        (quote.laborAmount / 100).toFixed(2),
        quote.taxRate ? "TAX" : "NON",
        "USD",
      ]);
    }

    // Add materials line item if present
    if (quote.materialsAmount && quote.materialsAmount > 0) {
      rows.push([
        quote.quoteNumber,
        quote.clientName || "Customer",
        quoteDate,
        expirationDate,
        quote.description,
        "Materials",
        "Materials charges",
        "1",
        (quote.materialsAmount / 100).toFixed(2),
        (quote.materialsAmount / 100).toFixed(2),
        quote.taxRate ? "TAX" : "NON",
        "USD",
      ]);
    }

    // Add parts line item if present
    if (quote.partsAmount && quote.partsAmount > 0) {
      rows.push([
        quote.quoteNumber,
        quote.clientName || "Customer",
        quoteDate,
        expirationDate,
        quote.description,
        "Parts",
        "Parts charges",
        "1",
        (quote.partsAmount / 100).toFixed(2),
        (quote.partsAmount / 100).toFixed(2),
        quote.taxRate ? "TAX" : "NON",
        "USD",
      ]);
    }

    // If no line items, add a single line with total
    if (!quote.laborAmount && !quote.materialsAmount && !quote.partsAmount) {
      rows.push([
        quote.quoteNumber,
        quote.clientName || "Customer",
        quoteDate,
        expirationDate,
        quote.description,
        "Service",
        quote.description,
        "1",
        (quote.totalAmount / 100).toFixed(2),
        (quote.totalAmount / 100).toFixed(2),
        quote.taxRate ? "TAX" : "NON",
        "USD",
      ]);
    }
  }

  return rows.map(row => row.map(escapeCSVField).join(",")).join("\n");
}

/**
 * Helper function to escape CSV fields
 */
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Helper function to convert payment terms to QuickBooks format
 */
function getQuickBooksTerms(invoice: Invoice): string {
  // QuickBooks expects terms like "Net 30", "Due on receipt", etc.
  // We'll map our payment terms to QuickBooks format
  return "Net 30"; // Default, can be customized based on invoice payment terms
}

