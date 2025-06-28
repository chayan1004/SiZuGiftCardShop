import QRCode from 'qrcode';

export class SimpleQRService {
  private baseUrl: string;

  constructor() {
    // Use Replit's dynamic URL or fallback to production URL
    this.baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER || 'replit'}.repl.co`
      : process.env.PRODUCTION_URL || 'https://sizu-giftcard.replit.app';
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
    
    // Create an SVG overlay with SiZu branded logo matching the provided design
    const brandedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <defs>
          <!-- Gradient for SiZu text matching the brand design -->
          <linearGradient id="sizuGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
          </linearGradient>
          
          <!-- Purple background gradient -->
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- QR Code Background -->
        <image href="${qrDataURL}" x="0" y="0" width="400" height="400"/>
        
        <!-- Branded logo background with rounded rectangle matching design -->
        <rect x="140" y="160" width="120" height="80" 
              fill="url(#bgGradient)" 
              rx="12" ry="12" 
              stroke="#ffffff" 
              stroke-width="2"/>
        
        <!-- SiZu Text Logo with brand styling -->
        <text x="200" y="195" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="28" 
              font-weight="bold" 
              fill="url(#sizuGradient)">SiZu</text>
              
        <!-- GIFT CARD subtitle -->
        <text x="200" y="218" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="10" 
              font-weight="normal" 
              letter-spacing="2px"
              fill="#ffffff">GIFT CARD</text>
      </svg>
    `;

    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(brandedSvg).toString('base64')}`;
    
    return svgDataUrl;
  }
}

export const simpleQRService = new SimpleQRService();