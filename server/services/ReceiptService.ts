import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { PublicGiftCardOrder, MerchantBranding } from '@shared/schema';
import { QRCodeUtil } from '../utils/QRCodeUtil';
import { storage } from '../storage';

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

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0.38, g: 0.22, b: 0.57 }; // Default purple
  }

  static async generatePDFReceipt(order: PublicGiftCardOrder): Promise<ReceiptGenerationResult> {
    try {
      await this.ensureReceiptsDirectory();

      // Fetch merchant branding if merchant ID is provided
      let branding: MerchantBranding | null = null;
      if (order.merchantId) {
        // Find merchant by merchant ID (string) and get their branding
        const merchant = await storage.getMerchantBySquareId(order.merchantId);
        if (merchant) {
          branding = await storage.getMerchantBranding(merchant.id) || null;
        }
      }

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const { width, height } = page.getSize();
      
      // Load fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Colors - use merchant branding if available
      const themeColor = branding?.themeColor || '#6366f1';
      const colorValues = this.hexToRgb(themeColor);
      const primaryColor = rgb(colorValues.r, colorValues.g, colorValues.b);
      const textColor = rgb(0.2, 0.2, 0.2);
      const grayColor = rgb(0.6, 0.6, 0.6);

      let yPosition = height - 80;

      // Header with merchant branding
      const headerText = branding?.tagline || 'SiZu Gift Card Receipt';
      page.drawText(headerText, {
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

      // Add QR Code in bottom-right corner
      try {
        const receiptURL = QRCodeUtil.generateReceiptURL(order.id);
        const qrCodeBuffer = await QRCodeUtil.generateQRCodeBuffer(receiptURL, {
          width: 80,
          margin: 1
        });
        
        const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer);
        const qrCodeDims = qrCodeImage.scale(0.8);
        
        // Position QR code in bottom-right corner
        page.drawImage(qrCodeImage, {
          x: width - qrCodeDims.width - 30,
          y: 30,
          width: qrCodeDims.width,
          height: qrCodeDims.height,
        });
        
        // Add QR code caption
        page.drawText('Scan to Reopen Receipt', {
          x: width - qrCodeDims.width - 30,
          y: 15,
          size: 8,
          font: font,
          color: grayColor,
        });
      } catch (qrError) {
        console.error('QR code generation failed:', qrError);
        // Continue without QR code if generation fails
      }

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