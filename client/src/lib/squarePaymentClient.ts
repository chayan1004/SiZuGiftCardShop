export interface SquarePaymentForm {
  payments: (applicationId: string, locationId?: string) => Promise<Payments>;
}

export interface Payments {
  card: () => Promise<Card>;
  applePay: (options: any) => Promise<ApplePay>;
  googlePay: (options: any) => Promise<GooglePay>;
  ach: (options: any) => Promise<ACH>;
  giftCard: () => Promise<GiftCard>;
}

export interface Card {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => void;
}

export interface TokenResult {
  status: 'OK' | 'INVALID_CARD' | 'ADDRESS_VERIFICATION_FAILURE' | 'CVV_FAILURE' | 'EXPIRED_CARD' | 'CARD_DECLINED' | 'GENERIC_DECLINE' | 'INSUFFICIENT_FUNDS' | 'PAN_FAILURE' | 'UNSUPPORTED_CARD_BRAND' | 'VALIDATION_ERROR';
  token?: string;
  details?: any;
  errors?: Array<{
    type: string;
    message: string;
  }>;
}

declare global {
  interface Window {
    Square?: SquarePaymentForm;
  }
}

class SquarePaymentClient {
  private payments: Payments | null = null;
  private card: Card | null = null;
  private isInitialized = false;

  constructor() {
    this.loadSquareSDK();
  }

  /**
   * Load Square Web Payments SDK
   */
  private async loadSquareSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sandbox-web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Square SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Square Payments
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadSquareSDK();

      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      // Get configuration from environment
      const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
      const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

      if (!applicationId || !locationId) {
        throw new Error('Square configuration missing');
      }

      this.payments = await window.Square.payments(applicationId, locationId);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Square payments:', error);
      throw new Error('Failed to initialize Square payments');
    }
  }

  /**
   * Create and attach card payment form
   */
  async createCardPayment(containerId: string): Promise<Card> {
    await this.initialize();

    if (!this.payments) {
      throw new Error('Square payments not initialized');
    }

    this.card = await this.payments.card();
    await this.card.attach(`#${containerId}`);

    return this.card;
  }

  /**
   * Tokenize card for payment
   */
  async tokenizeCard(): Promise<TokenResult> {
    if (!this.card) {
      throw new Error('Card not initialized');
    }

    try {
      const result = await this.card.tokenize();
      
      if (result.status === 'OK' && result.token) {
        return result;
      } else {
        throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
      }
    } catch (error) {
      console.error('Error tokenizing card:', error);
      throw error;
    }
  }

  /**
   * Process gift card payment
   */
  async processGiftCardPayment(data: {
    amount: number;
    recipientEmail?: string;
    personalMessage?: string;
    merchantId: string;
  }): Promise<{
    success: boolean;
    giftCard?: any;
    payment?: any;
    error?: string;
  }> {
    try {
      // First tokenize the card
      const tokenResult = await this.tokenizeCard();
      
      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        throw new Error('Payment method is invalid');
      }

      // Send to server for processing
      const response = await fetch('/api/giftcards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          sourceId: tokenResult.token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      return {
        success: true,
        giftCard: result.giftCard,
        payment: result.payment,
      };
    } catch (error) {
      console.error('Error processing gift card payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Validate gift card
   */
  async validateGiftCard(gan: string): Promise<{
    isValid: boolean;
    balance: number;
    status: string;
    balanceFormatted: string;
  }> {
    try {
      const response = await fetch(`/api/giftcards/${gan}/validate`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Validation failed');
      }

      return result.validation;
    } catch (error) {
      console.error('Error validating gift card:', error);
      return {
        isValid: false,
        balance: 0,
        status: 'ERROR',
        balanceFormatted: '$0.00',
      };
    }
  }

  /**
   * Redeem gift card
   */
  async redeemGiftCard(gan: string, amount: number, merchantId: string): Promise<{
    success: boolean;
    redemption?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/giftcards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gan,
          amount,
          merchantId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Redemption failed');
      }

      return {
        success: true,
        redemption: result.redemption,
      };
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Redemption failed',
      };
    }
  }

  /**
   * Get gift card details
   */
  async getGiftCard(gan: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/giftcards/${gan}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch gift card');
      }

      return {
        success: true,
        giftCard: result.giftCard,
      };
    } catch (error) {
      console.error('Error fetching gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gift card',
      };
    }
  }

  /**
   * Cleanup payment methods
   */
  destroy(): void {
    if (this.card) {
      this.card.destroy();
      this.card = null;
    }
    this.payments = null;
    this.isInitialized = false;
  }
}

export const squarePaymentClient = new SquarePaymentClient();