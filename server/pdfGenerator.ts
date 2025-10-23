/**
 * PDF Generator for Invoices and Quotes
 * Creates professional-looking PDFs using PDFKit
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  total: number; // in cents
}

export interface DocumentData {
  type: 'invoice' | 'quote';
  documentNumber: string;
  date: Date;
  
  // Business info
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  
  // Client info
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  
  // Line items
  lineItems: LineItem[];
  totalAmount: number; // in cents
}

/**
 * Generate PDF document and return as Buffer
 */
export async function generatePdf(data: DocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).text(data.type === 'invoice' ? 'INVOICE' : 'QUOTE', { align: 'right' });
    doc.fontSize(10).text(data.documentNumber, { align: 'right' });
    doc.moveDown();

    // Business info (left side)
    doc.fontSize(12).text(data.businessName, 50, 120);
    if (data.businessAddress) {
      doc.fontSize(10).text(data.businessAddress);
    }
    if (data.businessPhone) {
      doc.text(data.businessPhone);
    }
    if (data.businessEmail) {
      doc.text(data.businessEmail);
    }

    // Client info (right side)
    const clientX = 350;
    doc.fontSize(10).text('Bill To:', clientX, 120);
    doc.fontSize(12).text(data.clientName, clientX, 135);
    if (data.clientAddress) {
      doc.fontSize(10).text(data.clientAddress, clientX);
    }
    if (data.clientPhone) {
      doc.text(data.clientPhone, clientX);
    }
    if (data.clientEmail) {
      doc.text(data.clientEmail, clientX);
    }

    // Date
    doc.fontSize(10).text(`Date: ${data.date.toLocaleDateString()}`, clientX, 200);

    // Line items table
    const tableTop = 250;
    doc.moveDown(3);

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
    doc.text('Rate', 360, tableTop, { width: 80, align: 'right' });
    doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });

    // Header line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table rows
    doc.font('Helvetica');
    let yPosition = tableTop + 25;

    for (const item of data.lineItems) {
      doc.text(item.description, 50, yPosition, { width: 240 });
      doc.text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'right' });
      doc.text(formatCurrency(item.unitPrice), 360, yPosition, { width: 80, align: 'right' });
      doc.text(formatCurrency(item.total), 450, yPosition, { width: 100, align: 'right' });
      
      yPosition += 25;
      
      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    }

    // Total line
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;

    // Total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 360, yPosition);
    doc.text(formatCurrency(data.totalAmount), 450, yPosition, { width: 100, align: 'right' });

    // Footer
    const footerY = 720;
    doc.fontSize(9).font('Helvetica');
    doc.text(
      data.type === 'invoice' 
        ? 'Thank you for your business!' 
        : 'This quote is valid for 30 days.',
      50,
      footerY,
      { align: 'center' }
    );

    doc.end();
  });
}

/**
 * Format cents to currency string
 */
function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Generate a readable stream from PDF data
 */
export function generatePdfStream(data: DocumentData): Readable {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

  // Same PDF generation logic as above, but return stream directly
  // Header
  doc.fontSize(24).text(data.type === 'invoice' ? 'INVOICE' : 'QUOTE', { align: 'right' });
  doc.fontSize(10).text(data.documentNumber, { align: 'right' });
  doc.moveDown();

  // Business info
  doc.fontSize(12).text(data.businessName, 50, 120);
  if (data.businessAddress) {
    doc.fontSize(10).text(data.businessAddress);
  }
  if (data.businessPhone) {
    doc.text(data.businessPhone);
  }
  if (data.businessEmail) {
    doc.text(data.businessEmail);
  }

  // Client info
  const clientX = 350;
  doc.fontSize(10).text('Bill To:', clientX, 120);
  doc.fontSize(12).text(data.clientName, clientX, 135);
  if (data.clientAddress) {
    doc.fontSize(10).text(data.clientAddress, clientX);
  }
  if (data.clientPhone) {
    doc.text(data.clientPhone, clientX);
  }
  if (data.clientEmail) {
    doc.text(data.clientEmail, clientX);
  }

  // Date
  doc.fontSize(10).text(`Date: ${data.date.toLocaleDateString()}`, clientX, 200);

  // Line items table
  const tableTop = 250;
  doc.moveDown(3);

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Description', 50, tableTop);
  doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
  doc.text('Rate', 360, tableTop, { width: 80, align: 'right' });
  doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  doc.font('Helvetica');
  let yPosition = tableTop + 25;

  for (const item of data.lineItems) {
    doc.text(item.description, 50, yPosition, { width: 240 });
    doc.text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'right' });
    doc.text(formatCurrency(item.unitPrice), 360, yPosition, { width: 80, align: 'right' });
    doc.text(formatCurrency(item.total), 450, yPosition, { width: 100, align: 'right' });
    
    yPosition += 25;
    
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
  }

  doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
  yPosition += 15;

  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Total:', 360, yPosition);
  doc.text(formatCurrency(data.totalAmount), 450, yPosition, { width: 100, align: 'right' });

  const footerY = 720;
  doc.fontSize(9).font('Helvetica');
  doc.text(
    data.type === 'invoice' 
      ? 'Thank you for your business!' 
      : 'This quote is valid for 30 days.',
    50,
    footerY,
    { align: 'center' }
  );

  doc.end();

  return doc as unknown as Readable;
}

