import crypto from 'crypto';
import * as Square from 'square';

/**
 * Real Square API integration using official Square SDK
 * Based on: https://developer.squareup.com/reference/square/gift-cards-api
 */
class RealSquareService {
  private client: any;
  private locationId: string;
  private environment: string;

  constructor() {
    this.locationId = process.env.SQUARE_LOCATION_ID!;
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    
    const accessToken = process.env.SQUARE_ACCESS_TOKEN!;
    
    this.client = new Square.Client({
      accessToken,
      environment: this.environment === 'production' ? Square.Environment.Production : Square.Environment.Sandbox,
    });

    if (!accessToken || !this.locationId) {
      throw new Error('Square API credentials not configured');
    }
  }

  /**
   * Make authenticated request to Square API
   */
  private async makeSquareRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API Error: ${data.errors?.[0]?.detail || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Create a gift card using Square Gift Cards API
   */
  async createGiftCard(amountMoney: number, recipientEmail?: string): Promise<{
    giftCard: any;
    gan: string;
  }> {
    const idempotencyKey = crypto.randomUUID();
    
    const requestBody = {
      idempotency_key: idempotencyKey,
      location_id: this.locationId,
      gift_card: {
        type: 'DIGITAL'
      }
    };

    const response = await this.makeSquareRequest('/v2/gift-cards', 'POST', requestBody);
    const giftCard = response.gift_card;
    
    // Activate the gift card with the specified amount
    await this.activateGiftCard(giftCard.gan, amountMoney);
    
    return {
      giftCard,
      gan: giftCard.gan
    };
  }

  /**
   * Activate a gift card with specified amount
   */
  async activateGiftCard(gan: string, amountMoney: number): Promise<any> {
    const idempotencyKey = crypto.randomUUID();
    
    const requestBody = {
      idempotency_key: idempotencyKey,
      gift_card_activity: {
        type: 'ACTIVATE',
        location_id: this.locationId,
        gift_card_gan: gan,
        activate_activity_details: {
          amount_money: {
            amount: amountMoney,
            currency: 'USD'
          }
        }
      }
    };

    const response = await this.makeSquareRequest('/v2/gift-card-activities', 'POST', requestBody);
    return response.gift_card_activity;
  }

  /**
   * Load money onto a gift card
   */
  async loadGiftCard(gan: string, amountMoney: number): Promise<any> {
    const idempotencyKey = crypto.randomUUID();
    
    const requestBody = {
      idempotency_key: idempotencyKey,
      gift_card_activity: {
        type: 'LOAD',
        location_id: this.locationId,
        gift_card_gan: gan,
        load_activity_details: {
          amount_money: {
            amount: amountMoney,
            currency: 'USD'
          }
        }
      }
    };

    const response = await this.makeSquareRequest('/v2/gift-card-activities', 'POST', requestBody);
    return response.gift_card_activity;
  }

  /**
   * Redeem money from a gift card
   */
  async redeemGiftCard(gan: string, amountMoney: number): Promise<any> {
    const idempotencyKey = crypto.randomUUID();
    
    const requestBody = {
      idempotency_key: idempotencyKey,
      gift_card_activity: {
        type: 'REDEEM',
        location_id: this.locationId,
        gift_card_gan: gan,
        redeem_activity_details: {
          amount_money: {
            amount: amountMoney,
            currency: 'USD'
          }
        }
      }
    };

    const response = await this.makeSquareRequest('/v2/gift-card-activities', 'POST', requestBody);
    return response.gift_card_activity;
  }

  /**
   * Get gift card by GAN
   */
  async getGiftCard(gan: string): Promise<any> {
    const response = await this.makeSquareRequest(`/v2/gift-cards/from-gan?gan=${gan}`);
    return response.gift_card;
  }

  /**
   * Get gift card activities (transaction history)
   */
  async getGiftCardActivities(gan: string): Promise<any[]> {
    const response = await this.makeSquareRequest(`/v2/gift-card-activities?gift_card_gan=${gan}`);
    return response.gift_card_activities || [];
  }

  /**
   * Process payment using Square Payments API
   */
  async processPayment(sourceId: string, amountMoney: number, recipientEmail?: string): Promise<{
    payment: any;
    paymentId: string;
  }> {
    const idempotencyKey = crypto.randomUUID();
    
    const requestBody = {
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: {
        amount: amountMoney,
        currency: 'USD'
      },
      location_id: this.locationId,
      note: 'Gift Card Purchase',
      ...(recipientEmail && { buyer_email_address: recipientEmail })
    };

    const response = await this.makeSquareRequest('/v2/payments', 'POST', requestBody);
    const payment = response.payment;
    
    return {
      payment,
      paymentId: payment.id
    };
  }

  /**
   * Validate gift card status and balance
   */
  async validateGiftCard(gan: string): Promise<{
    isValid: boolean;
    balance: number;
    status: string;
    balanceFormatted: string;
  }> {
    try {
      const giftCard = await this.getGiftCard(gan);
      
      if (!giftCard) {
        return {
          isValid: false,
          balance: 0,
          status: 'NOT_FOUND',
          balanceFormatted: '$0.00'
        };
      }

      const balance = giftCard.balance_money?.amount || 0;
      const isValid = giftCard.state === 'ACTIVE' && balance > 0;
      
      return {
        isValid,
        balance,
        status: giftCard.state,
        balanceFormatted: `$${(balance / 100).toFixed(2)}`
      };
    } catch (error) {
      return {
        isValid: false,
        balance: 0,
        status: 'ERROR',
        balanceFormatted: '$0.00'
      };
    }
  }

  /**
   * Generate QR code data for gift card redemption
   */
  generateQRCodeData(gan: string): string {
    return `https://gift.sizu.com/redeem/${gan}`;
  }
}

export const realSquareService = new RealSquareService();