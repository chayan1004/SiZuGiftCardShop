import QRCode from 'qrcode';
import crypto from 'crypto';

interface QRCodeData {
  gan: string;
  merchantId: string;
  amount: number;
  redemptionUrl: string;
}

class QRCodeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_URL || 'https://sizu-giftcard.replit.app'
      : 'http://localhost:5000';
  }

  /**
   * Generate QR code for gift card redemption
   */
  async generateGiftCardQR(gan: string, merchantId: string, amount: number): Promise<{
    qrCodeDataURL: string;
    qrCodeSVG: string;
    redemptionUrl: string;
  }> {
    try {
      const redemptionUrl = `${this.baseUrl}/redeem/${gan}`;
      
      const qrData: QRCodeData = {
        gan,
        merchantId,
        amount,
        redemptionUrl
      };

      // Generate QR code as Data URL (base64 PNG)
      const qrCodeDataURL = await QRCode.toDataURL(redemptionUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Generate QR code as SVG for scalability
      const qrCodeSVG = await QRCode.toString(redemptionUrl, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return {
        qrCodeDataURL,
        qrCodeSVG,
        redemptionUrl
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate secure redemption token
   */
  generateRedemptionToken(gan: string, merchantId: string): string {
    const data = `${gan}:${merchantId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate redemption URL format
   */
  validateRedemptionUrl(url: string): {
    isValid: boolean;
    gan?: string;
    error?: string;
  } {
    try {
      const urlPattern = new RegExp(`^${this.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/redeem/([A-Za-z0-9-]+)$`);
      const match = url.match(urlPattern);
      
      if (!match) {
        return {
          isValid: false,
          error: 'Invalid redemption URL format'
        };
      }

      const gan = match[1];
      
      if (!gan || gan.length < 10) {
        return {
          isValid: false,
          error: 'Invalid gift card identifier'
        };
      }

      return {
        isValid: true,
        gan
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to validate URL'
      };
    }
  }

  /**
   * Generate mobile-optimized QR code
   */
  async generateMobileQR(gan: string, merchantId: string): Promise<string> {
    try {
      const redemptionUrl = `${this.baseUrl}/redeem/${gan}`;
      
      // Mobile-optimized QR code with higher error correction
      const qrCodeDataURL = await QRCode.toDataURL(redemptionUrl, {
        errorCorrectionLevel: 'H', // High error correction for mobile scanning
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        },
        width: 400 // Larger size for mobile
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating mobile QR code:', error);
      throw new Error(`Failed to generate mobile QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create redemption deep link for mobile apps
   */
  createDeepLink(gan: string, merchantId: string): {
    universalLink: string;
    appScheme: string;
    webFallback: string;
  } {
    const webFallback = `${this.baseUrl}/redeem/${gan}`;
    const universalLink = `https://sizu.app/redeem/${gan}`;
    const appScheme = `sizu://redeem/${gan}`;

    return {
      universalLink,
      appScheme,
      webFallback
    };
  }
}

export const qrCodeService = new QRCodeService();