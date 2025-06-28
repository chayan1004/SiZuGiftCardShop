import jsPDF from 'jspdf';

// Type fix for jsPDF text alignment
declare module 'jspdf' {
  interface jsPDF {
    text(text: string, x: number, y: number, options?: { align?: string }): jsPDF;
    text(text: string[], x: number, y: number): jsPDF;
  }
}

export interface ReceiptData {
  gan: string;
  amount: number;
  balance: number;
  recipientName?: string;
  senderName?: string;
  personalMessage?: string;
  createdAt: Date;
  status: string;
}

export class PDFReceiptService {
  private brandColors = {
    primary: '#7C3AED',
    secondary: '#06B6D4',
    dark: '#1F2937',
    light: '#F9FAFB'
  };

  async generateReceipt(receiptData: ReceiptData, qrCodeDataUrl?: string): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header with brand styling
    this.addHeader(doc, pageWidth);
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(124, 58, 237); // Purple brand color
    const centerX = pageWidth / 2;
    doc.text('Gift Card Receipt', centerX, 60, { align: 'center' });

    // Receipt details
    let yPosition = 80;
    yPosition = this.addReceiptDetails(doc, receiptData, yPosition, pageWidth);

    // QR Code if provided
    if (qrCodeDataUrl) {
      yPosition = this.addQRCode(doc, qrCodeDataUrl, yPosition, pageWidth);
    }

    // Footer
    this.addFooter(doc, pageWidth, pageHeight);

    return Buffer.from(doc.output('arraybuffer'));
  }

  private addHeader(doc: jsPDF, pageWidth: number) {
    // Brand header background
    doc.setFillColor(124, 58, 237); // Purple
    doc.rect(0, 0, pageWidth, 40, 'F');

    // SiZu brand text
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('SiZu', 20, 25);
    
    doc.setFontSize(12);
    doc.text('GIFT CARD', 20, 35);
  }

  private addReceiptDetails(doc: jsPDF, data: ReceiptData, startY: number, pageWidth: number): number {
    let yPos = startY;
    
    // Receipt info box
    doc.setFillColor(249, 250, 251); // Light gray
    doc.rect(20, yPos - 5, pageWidth - 40, 80, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55); // Dark text

    // Gift Card Number
    doc.setFont('helvetica', 'bold');
    doc.text('Gift Card Number:', 30, yPos + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.gan, 30, yPos + 20);

    // Amount and Balance
    doc.setFont('helvetica', 'bold');
    doc.text('Amount:', 30, yPos + 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${(data.amount / 100).toFixed(2)}`, 30, yPos + 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Current Balance:', pageWidth / 2, yPos + 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${(data.balance / 100).toFixed(2)}`, pageWidth / 2, yPos + 45);

    // Names if provided
    if (data.recipientName || data.senderName) {
      yPos += 55;
      
      if (data.recipientName) {
        doc.setFont('helvetica', 'bold');
        doc.text('To:', 30, yPos + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(data.recipientName, 30, yPos + 20);
      }

      if (data.senderName) {
        doc.setFont('helvetica', 'bold');
        doc.text('From:', pageWidth / 2, yPos + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(data.senderName, pageWidth / 2, yPos + 20);
      }
      
      yPos += 25;
    } else {
      yPos += 55;
    }

    // Personal message if provided
    if (data.personalMessage) {
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Message:', 30, yPos);
      doc.setFont('helvetica', 'normal');
      
      // Wrap long messages
      const splitMessage = doc.splitTextToSize(data.personalMessage, pageWidth - 60);
      doc.text(splitMessage as string[], 30, yPos + 10);
      yPos += splitMessage.length * 5 + 10;
    }

    // Date and status
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Created:', 30, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.createdAt.toLocaleDateString(), 30, yPos + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', pageWidth / 2, yPos);
    doc.setFont('helvetica', 'normal');
    if (data.status === 'ACTIVE') {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(data.status, pageWidth / 2, yPos + 10);

    return yPos + 30;
  }

  private addQRCode(doc: jsPDF, qrCodeDataUrl: string, startY: number, pageWidth: number): number {
    // QR Code section
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const centerX = pageWidth / 2;
    doc.text('Scan to Redeem:', centerX, startY, { align: 'center' });

    // Add QR code image
    const qrSize = 60;
    const qrX = (pageWidth - qrSize) / 2;
    
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, startY + 10, qrSize, qrSize);
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
      // Fallback text if QR code fails
      doc.setFontSize(10);
      const centerX = pageWidth / 2;
      doc.text('QR Code unavailable', centerX, startY + 40, { align: 'center' });
    }

    return startY + qrSize + 20;
  }

  private addFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
    const footerY = pageHeight - 30;
    
    // Footer line
    doc.setDrawColor(124, 58, 237);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
    
    // Footer text
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const centerX = pageWidth / 2;
    doc.text('Thank you for choosing SiZu Gift Cards!', centerX, footerY, { align: 'center' });
    doc.text('Visit https://SiZu-GiftCardShop.replit.app for more information', centerX, footerY + 10, { align: 'center' });
  }
}

export const pdfReceiptService = new PDFReceiptService();