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
    // Generate QR code as SVG first for better quality
    const qrSvg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H', // High error correction for logo overlay
      margin: 2,
      width: 300,
      color: {
        dark: '#1f2937', // Dark gray
        light: '#ffffff'
      }
    });

    // Create branded SVG with SiZu logo in the center
    const brandedSvg = this.addBrandingToSVG(qrSvg);
    
    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(brandedSvg).toString('base64')}`;
    
    return svgDataUrl;
  }

  private addBrandingToSVG(qrSvg: string): string {
    // Parse the SVG to add branding
    const svgMatch = qrSvg.match(/<svg[^>]*>/);
    if (!svgMatch) return qrSvg;

    const svgTag = svgMatch[0];
    const svgContent = qrSvg.replace(svgTag, '').replace('</svg>', '');
    
    // Extract width and height
    const widthMatch = svgTag.match(/width="(\d+)"/);
    const heightMatch = svgTag.match(/height="(\d+)"/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 300;
    const height = heightMatch ? parseInt(heightMatch[1]) : 300;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const logoSize = Math.min(width, height) * 0.2; // 20% of QR code size

    // Create branded SVG with SiZu logo
    const brandedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${svgContent}
        
        <!-- White background circle for logo -->
        <circle cx="${centerX}" cy="${centerY}" r="${logoSize * 0.7}" fill="#ffffff" stroke="#1f2937" stroke-width="2"/>
        
        <!-- SiZu Text Logo -->
        <text x="${centerX}" y="${centerY + 4}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="${logoSize * 0.5}" 
              font-weight="bold" 
              fill="#1f2937">SiZu</text>
              
        <!-- Small gift icon -->
        <g transform="translate(${centerX - logoSize * 0.15}, ${centerY - logoSize * 0.35}) scale(0.8)">
          <rect x="0" y="0" width="${logoSize * 0.3}" height="${logoSize * 0.3}" 
                fill="none" stroke="#059669" stroke-width="1.5" rx="2"/>
          <path d="M${logoSize * 0.075},0 L${logoSize * 0.075},${-logoSize * 0.1} M${logoSize * 0.225},0 L${logoSize * 0.225},${-logoSize * 0.1}" 
                stroke="#059669" stroke-width="1.5"/>
          <rect x="${logoSize * 0.05}" y="${-logoSize * 0.12}" width="${logoSize * 0.2}" height="${logoSize * 0.06}" 
                fill="#059669" rx="1"/>
        </g>
      </svg>
    `;

    return brandedSvg;
  }
}

export const simpleQRService = new SimpleQRService();