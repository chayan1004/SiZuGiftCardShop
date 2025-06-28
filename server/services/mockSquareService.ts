import crypto from 'crypto';

// Mock Square Service for development/testing
class MockSquareService {
  private locationId: string;

  constructor() {
    this.locationId = process.env.SQUARE_LOCATION_ID || 'mock_location_id';
  }

  /**
   * Mock gift card creation
   */
  async createGiftCard(amountMoney: number, recipientEmail?: string): Promise<{
    giftCard: any;
    gan: string;
  }> {
    const gan = this.generateGAN();
    
    const giftCard = {
      id: crypto.randomUUID(),
      gan,
      state: 'ACTIVE',
      type: 'DIGITAL',
      created_at: new Date().toISOString(),
      balance_money: {
        amount: amountMoney,
        currency: 'USD'
      },
      recipient_email: recipientEmail
    };

    return { giftCard, gan };
  }

  /**
   * Mock gift card activation
   */
  async activateGiftCard(gan: string, amountMoney: number): Promise<any> {
    return {
      id: crypto.randomUUID(),
      type: 'ACTIVATE',
      location_id: this.locationId,
      created_at: new Date().toISOString(),
      gift_card_gan: gan,
      gift_card_balance_money: {
        amount: amountMoney,
        currency: 'USD'
      }
    };
  }

  /**
   * Mock get gift card
   */
  async getGiftCard(gan: string): Promise<any> {
    return {
      id: crypto.randomUUID(),
      gan,
      state: 'ACTIVE',
      type: 'DIGITAL',
      created_at: new Date().toISOString(),
      balance_money: {
        amount: 5000, // $50.00
        currency: 'USD'
      }
    };
  }

  /**
   * Mock load gift card
   */
  async loadGiftCard(gan: string, amountMoney: number): Promise<any> {
    return {
      id: crypto.randomUUID(),
      type: 'LOAD',
      location_id: this.locationId,
      created_at: new Date().toISOString(),
      gift_card_gan: gan,
      gift_card_balance_money: {
        amount: amountMoney,
        currency: 'USD'
      }
    };
  }

  /**
   * Mock redeem gift card
   */
  async redeemGiftCard(gan: string, amountMoney: number): Promise<any> {
    return {
      id: crypto.randomUUID(),
      type: 'REDEEM',
      location_id: this.locationId,
      created_at: new Date().toISOString(),
      gift_card_gan: gan,
      gift_card_balance_money: {
        amount: amountMoney,
        currency: 'USD'
      }
    };
  }

  /**
   * Mock payment processing
   */
  async processPayment(sourceId: string, amountMoney: number, recipientEmail?: string): Promise<{
    payment: any;
    paymentId: string;
  }> {
    const paymentId = crypto.randomUUID();
    
    const payment = {
      id: paymentId,
      amount_money: {
        amount: amountMoney,
        currency: 'USD'
      },
      source_type: 'CARD',
      status: 'COMPLETED',
      created_at: new Date().toISOString(),
      location_id: this.locationId,
      receipt_number: this.generateReceiptNumber(),
      buyer_email_address: recipientEmail
    };

    return { payment, paymentId };
  }

  /**
   * Mock gift card validation
   */
  async validateGiftCard(gan: string): Promise<{
    isValid: boolean;
    balance: number;
    status: string;
    balanceFormatted: string;
  }> {
    // Simulate validation logic
    const isValid = gan.length >= 8;
    const balance = isValid ? 5000 : 0; // $50.00 in cents
    
    return {
      isValid,
      balance,
      status: isValid ? 'ACTIVE' : 'INVALID',
      balanceFormatted: `$${(balance / 100).toFixed(2)}`
    };
  }

  /**
   * Generate Gift Account Number (GAN)
   */
  private generateGAN(): string {
    // Generate a realistic looking GAN
    const prefix = '7783';
    const middle = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${middle}${suffix}`;
  }

  /**
   * Generate receipt number
   */
  private generateReceiptNumber(): string {
    return `RC${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Generate QR code data
   */
  generateQRCodeData(gan: string): string {
    return `https://gift.sizu.com/redeem/${gan}`;
  }
}

export const mockSquareService = new MockSquareService();