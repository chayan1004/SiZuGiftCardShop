/**
 * Simplified Square SDK integration without complex type definitions
 * This provides a clean interface for Square Web Payments SDK
 */

interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
}

interface TokenResult {
  status: string;
  token?: string;
  errors?: Array<{ message: string }>;
}

class SquareSDK {
  private config: SquareConfig | null = null;
  private payments: any = null;
  private card: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get configuration from backend first
      const configResponse = await fetch('/api/config/square');
      if (!configResponse.ok) {
        throw new Error('Failed to fetch Square configuration');
      }
      
      this.config = await configResponse.json();
      console.log('Initializing Square with config:', this.config);

      if (!this.config?.applicationId || !this.config?.locationId) {
        throw new Error('Square configuration missing');
      }

      // Load Square SDK with correct environment
      await this.loadSquareScript();

      // Initialize Square payments
      if (window.Square) {
        this.payments = await window.Square.payments(
          this.config.applicationId, 
          this.config.locationId
        );
        this.isInitialized = true;
      } else {
        throw new Error('Square SDK not available');
      }
    } catch (error) {
      console.error('Square initialization error:', error);
      throw error;
    }
  }

  private async loadSquareScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      // Use the correct script URL based on environment
      const scriptUrl = this.config?.environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox-web.squarecdn.com/v1/square.js';
      
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Square SDK'));
      document.head.appendChild(script);
    });
  }

  async createCardForm(containerId: string): Promise<any> {
    await this.initialize();

    if (!this.payments) {
      throw new Error('Square payments not initialized');
    }

    this.card = await this.payments.card();
    await this.card.attach(`#${containerId}`);
    return this.card;
  }

  async tokenizeCard(): Promise<TokenResult> {
    if (!this.card) {
      throw new Error('Card not initialized');
    }

    const result = await this.card.tokenize();
    
    if (result.status === 'OK' && result.token) {
      return result;
    } else {
      throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
    }
  }

  async processGiftCardPayment(data: {
    amount: number;
    recipientEmail?: string;
    personalMessage?: string;
    merchantId: string;
  }): Promise<{ success: boolean; giftCard?: any; error?: string }> {
    try {
      const tokenResult = await this.tokenizeCard();
      
      const response = await fetch('/api/giftcards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sourceId: tokenResult.token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      return { success: true, giftCard: result.giftCard };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  destroy(): void {
    if (this.card) {
      this.card.destroy();
      this.card = null;
    }
    this.payments = null;
    this.isInitialized = false;
  }
}

// Global type declaration
declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => Promise<any>;
    };
  }
}

export const squareSDK = new SquareSDK();