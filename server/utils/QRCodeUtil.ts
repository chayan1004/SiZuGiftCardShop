import QRCode from 'qrcode';

export class QRCodeUtil {
  /**
   * Generate QR code as PNG buffer for PDF embedding
   */
  static async generateQRCodeBuffer(data: string, options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }): Promise<Buffer> {
    const qrOptions = {
      type: 'png' as const,
      width: options?.width || 120,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      }
    };

    return QRCode.toBuffer(data, qrOptions);
  }

  /**
   * Generate QR code as data URI for web display
   */
  static async generateQRCodeDataURI(data: string, options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }): Promise<string> {
    const qrOptions = {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      }
    };

    return QRCode.toDataURL(data, qrOptions);
  }

  /**
   * Generate receipt URL for QR code
   */
  static generateReceiptURL(orderId: string, baseUrl?: string): string {
    const base = baseUrl || (process.env.NODE_ENV === 'production' 
      ? 'https://sizu-giftcardshop.replit.app' 
      : 'http://localhost:5000');
    
    return `${base}/giftcard-store/success/${orderId}`;
  }

  /**
   * Validate QR code data before generation
   */
  static validateQRData(data: string): boolean {
    if (!data || data.trim().length === 0) {
      return false;
    }
    
    // QR code data length limit (depending on error correction level)
    if (data.length > 2953) {
      return false;
    }
    
    return true;
  }
}