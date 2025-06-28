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
      
      // Generate QR code with SiZu branding
      const qrCodeDataURL = await this.generateBrandedQR(redemptionUrl);

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

  private async generateBrandedQR(url: string): Promise<string> {
    // Generate a larger QR code with high error correction for logo overlay
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H', // High error correction for logo overlay
      margin: 3,
      width: 400,
      color: {
        dark: '#1f2937', // Dark gray
        light: '#ffffff'
      }
    });

    // Create branded QR code with SiZu logo overlay
    const brandedQR = await this.addBrandingToQR(qrCodeDataURL);
    
    return brandedQR;
  }

  private async addBrandingToQR(qrDataURL: string): Promise<string> {
    // For now, let's create a simple branded QR code by generating an SVG overlay
    // and returning the original QR code with a note that branding needs canvas processing
    
    // Create an SVG overlay with SiZu branding
    const brandedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <!-- QR Code Background -->
        <image href="${qrDataURL}" x="0" y="0" width="400" height="400"/>
        
        <!-- White background circle for logo -->
        <circle cx="200" cy="200" r="45" fill="#ffffff" stroke="#1f2937" stroke-width="3"/>
        
        <!-- SiZu Text Logo -->
        <text x="200" y="210" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="24" 
              font-weight="bold" 
              fill="#1f2937">SiZu</text>
              
        <!-- Small gift icon -->
        <g transform="translate(185, 175)">
          <rect x="0" y="0" width="30" height="20" 
                fill="none" stroke="#059669" stroke-width="2" rx="3"/>
          <path d="M7.5,0 L7.5,-8 M22.5,0 L22.5,-8" 
                stroke="#059669" stroke-width="2"/>
          <rect x="5" y="-10" width="20" height="6" 
                fill="#059669" rx="2"/>
        </g>
      </svg>
    `;

    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(brandedSvg).toString('base64')}`;
    
    return svgDataUrl;
  }
}

export const simpleQRService = new SimpleQRService();