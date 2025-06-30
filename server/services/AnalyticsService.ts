import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { storage } from '../storage';

export class AnalyticsService {
  /**
   * Generate CSV export for merchant analytics
   */
  static async generateCSV(merchantId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<string> {
    const analytics = await storage.getGiftCardAnalyticsForMerchant(merchantId, filters);
    
    // CSV Header
    let csv = 'Type,GAN,Amount,Date,Recipient/Redeemer,Status,Order ID,IP Address\n';
    
    // Add issuance data
    for (const card of analytics.issuanceData) {
      const amount = (card.amount / 100).toFixed(2); // Convert cents to dollars
      const date = card.issuedDate.toISOString().split('T')[0];
      csv += `Issued,"${card.gan}","$${amount}","${date}","${card.recipientEmail || 'N/A'}","${card.status}","${card.orderId || 'N/A'}","N/A"\n`;
    }
    
    // Add redemption data
    for (const redemption of analytics.redemptionData) {
      const amount = (redemption.amount / 100).toFixed(2); // Convert cents to dollars
      const date = redemption.redeemedAt.toISOString().split('T')[0];
      csv += `Redeemed,"${redemption.gan}","$${amount}","${date}","${redemption.redeemedBy}","Redeemed","N/A","${redemption.ipAddress || 'N/A'}"\n`;
    }
    
    return csv;
  }

  /**
   * Generate PDF analytics report with merchant branding
   */
  static async generatePDF(merchantId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<Uint8Array> {
    const analytics = await storage.getGiftCardAnalyticsForMerchant(merchantId, filters);
    const merchantBranding = await storage.getMerchantBranding(parseInt(merchantId));
    
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard letter size
    
    // Load fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Colors
    const primaryColorRgb = merchantBranding?.themeColor ? 
      this.hexToRgb(merchantBranding.themeColor) : 
      { r: 0.2, g: 0.4, b: 0.6 };
    const primaryColor = rgb(primaryColorRgb.r, primaryColorRgb.g, primaryColorRgb.b);
    const textColor = rgb(0.2, 0.2, 0.2);
    const headerColor = rgb(0.95, 0.95, 0.95);
    
    let yPosition = 750;
    
    // Title
    page.drawText('Gift Card Analytics Report', {
      x: 50,
      y: yPosition,
      size: 24,
      font: titleFont,
      color: primaryColor
    });
    yPosition -= 30;
    
    // Business name (use tagline as business name alternative)
    if (merchantBranding?.tagline) {
      page.drawText(merchantBranding.tagline, {
        x: 50,
        y: yPosition,
        size: 16,
        font: regularFont,
        color: textColor
      });
      yPosition -= 25;
    }
    
    // Date range
    const dateRange = this.getDateRangeText(filters);
    page.drawText(`Report Period: ${dateRange}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: regularFont,
      color: textColor
    });
    yPosition -= 40;
    
    // Summary section
    page.drawText('Summary Statistics', {
      x: 50,
      y: yPosition,
      size: 18,
      font: titleFont,
      color: primaryColor
    });
    yPosition -= 25;
    
    // Summary data
    const summaryData = [
      ['Total Cards Issued:', analytics.summary.totalIssued.toString()],
      ['Total Redemptions:', analytics.summary.totalRedeemed.toString()],
      ['Total Revenue:', `$${(analytics.summary.totalRevenue / 100).toFixed(2)}`],
      ['Outstanding Balance:', `$${(analytics.summary.outstandingBalance / 100).toFixed(2)}`],
      ['Redemption Rate:', `${analytics.summary.redemptionRate.toFixed(1)}%`]
    ];
    
    for (const [label, value] of summaryData) {
      page.drawText(label, {
        x: 70,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: textColor
      });
      page.drawText(value, {
        x: 250,
        y: yPosition,
        size: 12,
        font: titleFont,
        color: primaryColor
      });
      yPosition -= 20;
    }
    
    yPosition -= 20;
    
    // Top Redeemed Cards section
    if (analytics.topRedeemedCards.length > 0) {
      page.drawText('Top Redeemed Cards (Last 30 Days)', {
        x: 50,
        y: yPosition,
        size: 16,
        font: titleFont,
        color: primaryColor
      });
      yPosition -= 25;
      
      // Table headers
      page.drawRectangle({
        x: 50,
        y: yPosition - 15,
        width: 500,
        height: 20,
        color: headerColor
      });
      
      page.drawText('Gift Card', {
        x: 60,
        y: yPosition - 10,
        size: 10,
        font: titleFont,
        color: textColor
      });
      page.drawText('Total Redeemed', {
        x: 200,
        y: yPosition - 10,
        size: 10,
        font: titleFont,
        color: textColor
      });
      page.drawText('Redemptions', {
        x: 350,
        y: yPosition - 10,
        size: 10,
        font: titleFont,
        color: textColor
      });
      
      yPosition -= 25;
      
      // Table data
      for (const card of analytics.topRedeemedCards.slice(0, 10)) {
        page.drawText(card.gan.substring(0, 20) + '...', {
          x: 60,
          y: yPosition,
          size: 9,
          font: regularFont,
          color: textColor
        });
        page.drawText(`$${(card.totalRedeemed / 100).toFixed(2)}`, {
          x: 200,
          y: yPosition,
          size: 9,
          font: regularFont,
          color: textColor
        });
        page.drawText(card.redemptionCount.toString(), {
          x: 350,
          y: yPosition,
          size: 9,
          font: regularFont,
          color: textColor
        });
        yPosition -= 15;
        
        if (yPosition < 100) break; // Prevent overflow
      }
    }
    
    // Footer
    page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: 50,
      size: 8,
      font: smallFont,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    page.drawText('SiZu GiftCard Analytics', {
      x: 450,
      y: 50,
      size: 8,
      font: smallFont,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    // Serialize PDF
    return await pdfDoc.save();
  }
  
  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      };
    }
    return { r: 0.2, g: 0.4, b: 0.6 }; // Default blue
  }
  
  /**
   * Get formatted date range text
   */
  private static getDateRangeText(filters?: { startDate?: Date; endDate?: Date }): string {
    if (!filters || (!filters.startDate && !filters.endDate)) {
      return 'All Time';
    }
    
    const start = filters.startDate ? filters.startDate.toLocaleDateString() : 'Beginning';
    const end = filters.endDate ? filters.endDate.toLocaleDateString() : 'Present';
    
    return `${start} - ${end}`;
  }
}