import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { PublicGiftCardOrder } from '@shared/schema';

export interface ReceiptGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ReceiptService {
  private static readonly RECEIPTS_DIR = path.join(process.cwd(), 'public', 'receipts');

  static async ensureReceiptsDirectory(): Promise<void> {
    try {
      await fs.access(this.RECEIPTS_DIR);
    } catch {
      await fs.mkdir(this.RECEIPTS_DIR, { recursive: true });
    }
  }

  static async generatePDFReceipt(order: PublicGiftCardOrder): Promise<ReceiptGenerationResult> {
    try {
      await this.ensureReceiptsDirectory();

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const { width, height } = page.getSize();
      
      // Load fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Colors
      const primaryColor = rgb(0.38, 0.22, 0.57); // Purple
      const textColor = rgb(0.2, 0.2, 0.2);
      const grayColor = rgb(0.6, 0.6, 0.6);

      let yPosition = height - 80;

      // Header
      page.drawText('SiZu Gift Card Receipt', {
        x: 50,
        y: yPosition,
        size: 24,
        font: boldFont,
        color: primaryColor,
      });

      yPosition -= 40;

      // Receipt info
      page.drawText(`Receipt #${order.id.substring(0, 8).toUpperCase()}`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: font,
        color: textColor,
      });

      page.drawText(`Date: ${new Date(order.createdAt || new Date()).toLocaleDateString()}`, {
        x: width - 200,
        y: yPosition,
        size: 12,
        font: font,
        color: grayColor,
      });

      yPosition -= 60;

      // Order details section
      page.drawText('Gift Card Details', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: textColor,
      });

      yPosition -= 30;

      // Gift card amount
      const amount = (order.amount / 100).toFixed(2);
      page.drawText(`Gift Card Value: $${amount}`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: textColor,
      });

      yPosition -= 25;

      // Recipient email
      page.drawText(`Recipient: ${order.recipientEmail}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: textColor,
      });

      yPosition -= 25;

      // Gift card ID and GAN
      if (order.giftCardId) {
        page.drawText(`Gift Card ID: ${order.giftCardId}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: grayColor,
        });
        yPosition -= 20;
      }

      if (order.giftCardGan) {
        page.drawText(`Gift Card Number: ${order.giftCardGan}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: grayColor,
        });
        yPosition -= 20;
      }

      // Message if provided
      if (order.message) {
        yPosition -= 20;
        page.drawText('Personal Message:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: textColor,
        });
        yPosition -= 20;
        page.drawText(`"${order.message}"`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: font,
          color: textColor,
        });
      }

      yPosition -= 60;

      // Payment details
      page.drawText('Payment Information', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: textColor,
      });

      yPosition -= 30;

      page.drawText(`Total Paid: $${amount}`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: textColor,
      });

      yPosition -= 25;

      page.drawText(`Payment Method: Credit Card`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: textColor,
      });

      yPosition -= 20;

      if (order.squarePaymentId) {
        page.drawText(`Transaction ID: ${order.squarePaymentId.substring(0, 16)}...`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: grayColor,
        });
      }

      // Footer
      yPosition = 100;
      page.drawText('Thank you for your purchase!', {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: primaryColor,
      });

      yPosition -= 25;
      page.drawText('SiZu Gift Card Store - Premium Digital Gift Cards', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: grayColor,
      });

      yPosition -= 15;
      page.drawText('For support, contact us at support@sizugiftcard.com', {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
        color: grayColor,
      });

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();

      // Save to file
      const filename = `receipt-${order.id}.pdf`;
      const filePath = path.join(this.RECEIPTS_DIR, filename);
      await fs.writeFile(filePath, pdfBytes);

      // Return URL for download
      const url = `/receipts/${filename}`;

      console.log(`PDF receipt generated successfully: ${filename}`);
      
      return {
        success: true,
        url
      };

    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}