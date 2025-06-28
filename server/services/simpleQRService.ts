import QRCode from 'qrcode';

export class SimpleQRService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_URL || 'https://sizu-giftcard.replit.app'
      : 'http://localhost:5000';
  }

  async generateGiftCardQR(gan: string, merchantId: string, amount: number) {
    try {
      const redemptionUrl = `${this.baseUrl}/gift/${gan}`;
      
      // Generate QR code as Data URL (base64 PNG)
      const qrCodeDataURL = await QRCode.toDataURL(redemptionUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrCodeDataURL,
        qrCodeSVG: '',
        redemptionUrl
      };
    } catch (error) {
      console.error('QR Code generation error:', error);
      return {
        qrCodeDataURL: null,
        qrCodeSVG: null,
        redemptionUrl: `${this.baseUrl}/gift/${gan}`
      };
    }
  }
}

export const simpleQRService = new SimpleQRService();