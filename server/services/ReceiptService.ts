import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { storage } from '../storage';

interface GiftCardPurchase {
  orderId: string;
  merchantId?: string;
  recipientEmail: string;
  recipientName?: string;
  senderName?: string;
  amount: number; // in cents
  personalMessage?: string;
  transactionId?: string;
  giftCardGan?: string;
  purchaseDate: Date;
}

interface MerchantDesign {
  hasCustomDesign: boolean;
  backgroundImageUrl: string | null;
  logoUrl: string | null;
  themeColor: string;
  customMessage: string;
}

export class ReceiptService {
  private static RECEIPTS_DIR = path.join(process.cwd(), 'storage', 'receipts');

  static async ensureReceiptsDirectory(): Promise<void> {
    try {
      await fs.access(this.RECEIPTS_DIR);
    } catch {
      await fs.mkdir(this.RECEIPTS_DIR, { recursive: true });
    }
  }

  static async generateReceiptPDF(purchase: GiftCardPurchase): Promise<{
    success: boolean;
    receiptId?: string;
    filePath?: string;
    error?: string;
  }> {
    try {
      await this.ensureReceiptsDirectory();

      // Fetch merchant design for branding
      let merchantDesign: MerchantDesign | null = null;
      if (purchase.merchantId) {
        try {
          const response = await fetch(`http://localhost:5000/api/public/merchant-design/${purchase.merchantId}`);
          if (response.ok) {
            const data = await response.json() as { design: MerchantDesign };
            merchantDesign = data.design;
          }
        } catch (error) {
          console.warn('Failed to fetch merchant design, using default:', error);
        }
      }

      // Use default design if none found
      if (!merchantDesign) {
        merchantDesign = {
          hasCustomDesign: false,
          backgroundImageUrl: null,
          logoUrl: null,
          themeColor: '#613791',
          customMessage: 'Thank you for choosing our gift card!'
        };
      }

      // Generate unique receipt ID
      const receiptId = `receipt_${purchase.orderId}_${Date.now()}`;
      const filePath = path.join(this.RECEIPTS_DIR, `${receiptId}.pdf`);

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = page.getSize();

      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Parse theme color
      const themeColor = this.hexToRgb(merchantDesign.themeColor);
      const primaryColor = rgb(themeColor.r / 255, themeColor.g / 255, themeColor.b / 255);
      const lightGray = rgb(0.9, 0.9, 0.9);
      const darkGray = rgb(0.4, 0.4, 0.4);
      const black = rgb(0, 0, 0);

      let yPosition = height - 80;

      // Header with branding
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: primaryColor,
      });

      // Company logo area (if available)
      if (merchantDesign.logoUrl) {
        try {
          const logoResponse = await fetch(merchantDesign.logoUrl);
          if (logoResponse.ok) {
            const logoBytes = await logoResponse.arrayBuffer();
            const logoImage = await pdfDoc.embedPng(new Uint8Array(logoBytes));
            const logoSize = 60;
            page.drawImage(logoImage, {
              x: 50,
              y: height - 110,
              width: logoSize,
              height: logoSize,
            });
          }
        } catch (error) {
          console.warn('Failed to embed logo:', error);
        }
      }

      // Title
      page.drawText('SiZu Gift Card Receipt', {
        x: merchantDesign.logoUrl ? 130 : 50,
        y: height - 70,
        size: 24,
        font: helveticaBoldFont,
        color: rgb(1, 1, 1),
      });

      // Receipt ID
      page.drawText(`Receipt #${receiptId}`, {
        x: width - 200,
        y: height - 50,
        size: 12,
        font: helveticaFont,
        color: rgb(1, 1, 1),
      });

      // Date
      page.drawText(`Date: ${purchase.purchaseDate.toLocaleDateString()}`, {
        x: width - 200,
        y: height - 70,
        size: 12,
        font: helveticaFont,
        color: rgb(1, 1, 1),
      });

      yPosition = height - 160;

      // Gift Card Details Section
      page.drawText('Gift Card Details', {
        x: 50,
        y: yPosition,
        size: 18,
        font: helveticaBoldFont,
        color: primaryColor,
      });

      yPosition -= 40;

      // Gift card preview box
      const cardBoxHeight = 120;
      page.drawRectangle({
        x: 50,
        y: yPosition - cardBoxHeight,
        width: width - 100,
        height: cardBoxHeight,
        color: lightGray,
        borderColor: primaryColor,
        borderWidth: 2,
      });

      // Gift card content
      page.drawText(`Gift Card Amount: $${(purchase.amount / 100).toFixed(2)}`, {
        x: 70,
        y: yPosition - 30,
        size: 16,
        font: helveticaBoldFont,
        color: black,
      });

      if (purchase.giftCardGan) {
        page.drawText(`Gift Card Number: ${purchase.giftCardGan}`, {
          x: 70,
          y: yPosition - 50,
          size: 12,
          font: helveticaFont,
          color: darkGray,
        });
      }

      page.drawText(merchantDesign.customMessage, {
        x: 70,
        y: yPosition - 70,
        size: 11,
        font: helveticaFont,
        color: darkGray,
        maxWidth: width - 140,
      });

      page.drawText('Valid until used • No expiration • Digital delivery', {
        x: 70,
        y: yPosition - 90,
        size: 10,
        font: helveticaFont,
        color: darkGray,
      });

      yPosition -= 160;

      // Purchase Details Section
      page.drawText('Purchase Details', {
        x: 50,
        y: yPosition,
        size: 18,
        font: helveticaBoldFont,
        color: primaryColor,
      });

      yPosition -= 30;

      const details = [
        ['Order ID:', purchase.orderId],
        ['Transaction ID:', purchase.transactionId || 'N/A'],
        ['Recipient:', purchase.recipientName || 'N/A'],
        ['Recipient Email:', purchase.recipientEmail],
        ['Sender:', purchase.senderName || 'N/A'],
        ['Amount Paid:', `$${(purchase.amount / 100).toFixed(2)}`],
        ['Payment Method:', 'Credit Card (Square)'],
        ['Purchase Date:', purchase.purchaseDate.toLocaleString()],
      ];

      details.forEach(([label, value]) => {
        page.drawText(label, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBoldFont,
          color: black,
        });

        page.drawText(value, {
          x: 200,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: darkGray,
        });

        yPosition -= 20;
      });

      // Personal message if provided
      if (purchase.personalMessage) {
        yPosition -= 20;
        page.drawText('Personal Message:', {
          x: 50,
          y: yPosition,
          size: 14,
          font: helveticaBoldFont,
          color: primaryColor,
        });

        yPosition -= 25;
        page.drawText(purchase.personalMessage, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: black,
          maxWidth: width - 100,
        });
      }

      // Footer
      yPosition = 100;
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 80,
        color: lightGray,
      });

      page.drawText('Thank you for your purchase!', {
        x: 50,
        y: 50,
        size: 14,
        font: helveticaBoldFont,
        color: primaryColor,
      });

      page.drawText('SiZu Gift Card Shop • support@sizugiftcard.com • https://sizugiftcard.com', {
        x: 50,
        y: 30,
        size: 10,
        font: helveticaFont,
        color: darkGray,
      });

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(filePath, pdfBytes);

      console.log(`✅ PDF receipt generated: ${receiptId}`);

      return {
        success: true,
        receiptId,
        filePath,
      };

    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 97, g: 55, b: 145 }; // Default purple
  }

  static async getReceiptFilePath(receiptId: string): Promise<string | null> {
    const filePath = path.join(this.RECEIPTS_DIR, `${receiptId}.pdf`);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      return null;
    }
  }

  static async deleteReceipt(receiptId: string): Promise<boolean> {
    const filePath = path.join(this.RECEIPTS_DIR, `${receiptId}.pdf`);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}