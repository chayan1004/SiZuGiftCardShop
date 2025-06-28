export interface SquareConfig {
  applicationId: string;
  environment: 'sandbox' | 'production';
  locationId?: string;
}

export class SquareClient {
  private config: SquareConfig;

  constructor(config: SquareConfig) {
    this.config = config;
  }

  async initializePaymentForm(containerId: string, callbacks: {
    onPaymentSubmit?: (paymentResult: any) => void;
    onError?: (error: any) => void;
  }): Promise<any> {
    // This would integrate with Square's Web SDK
    // For now, return a mock implementation
    console.log('Square Payment Form would be initialized here', { containerId, callbacks });
    
    return {
      attach: () => Promise.resolve(),
      destroy: () => Promise.resolve(),
    };
  }

  async processPayment(paymentData: {
    amount: number;
    currency: string;
    sourceId: string;
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    // This would make the actual payment request to Square
    console.log('Square payment would be processed here', paymentData);
    
    // Mock successful payment for demo
    return {
      success: true,
      paymentId: `payment_${Date.now()}`,
    };
  }

  generateQRCode(giftCardGan: string): string {
    // Generate QR code for gift card
    // In production, this would create an actual QR code
    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="white"/>
        <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="monospace" font-size="8">${giftCardGan}</text>
      </svg>`
    )}`;
  }
}

// Create a default Square client instance
const squareConfig: SquareConfig = {
  applicationId: import.meta.env.VITE_SQUARE_APPLICATION_ID || 'demo-app-id',
  environment: (import.meta.env.VITE_SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

export const squareClient = new SquareClient(squareConfig);
