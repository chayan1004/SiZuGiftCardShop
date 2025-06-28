import crypto from 'crypto';

/**
 * Square API service using direct HTTP requests
 * Production-ready implementation for gift card operations
 */
class SquareAPIService {
  private accessToken: string;
  private locationId: string;
  private environment: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    if (!this.accessToken || !this.locationId) {
      console.warn('Square API credentials not configured');
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

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        console.error('Square API Error:', data);
        throw new Error(`Square API Error: ${data.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Square API request failed:', error);
      throw error;
    }
  }

  /**
   * Create a gift card using Square Gift Cards API
   */
  async createGiftCard(amountMoney: number, recipientEmail?: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const requestBody = {
        idempotency_key: crypto.randomUUID(),
        location_id: this.locationId,
        gift_card: {
          type: 'DIGITAL'
        }
      };

      const response = await this.makeSquareRequest('/v2/gift-cards', 'POST', requestBody);
      
      return {
        success: true,
        giftCard: response.gift_card
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create gift card'
      };
    }
  }

  /**
   * Activate a gift card with specified amount
   */
  async activateGiftCard(gan: string, amountMoney: number): Promise<any> {
    try {
      const requestBody = {
        idempotency_key: crypto.randomUUID(),
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
    } catch (error) {
      console.error('Error activating gift card:', error);
      throw error;
    }
  }

  /**
   * Get gift card by GAN
   */
  async getGiftCard(gan: string): Promise<any> {
    try {
      const response = await this.makeSquareRequest(`/v2/gift-cards/from-gan/${gan}`);
      return response.gift_card;
    } catch (error) {
      console.error('Error getting gift card:', error);
      throw error;
    }
  }

  /**
   * Load money onto a gift card
   */
  async loadGiftCard(gan: string, amountMoney: number): Promise<any> {
    try {
      const requestBody = {
        idempotency_key: crypto.randomUUID(),
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
    } catch (error) {
      console.error('Error loading gift card:', error);
      throw error;
    }
  }

  /**
   * Redeem money from a gift card
   */
  async redeemGiftCard(gan: string, amountMoney: number): Promise<any> {
    try {
      const requestBody = {
        idempotency_key: crypto.randomUUID(),
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
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      throw error;
    }
  }

  /**
   * Process payment using Square Payments API
   */
  async processPayment(sourceId: string, amountMoney: number, recipientEmail?: string): Promise<{
    success: boolean;
    paymentId?: string;
    giftCardId?: string;
    error?: string;
  }> {
    try {
      // First create payment
      const paymentBody = {
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount: amountMoney,
          currency: 'USD'
        },
        location_id: this.locationId
      };

      const paymentResponse = await this.makeSquareRequest('/v2/payments', 'POST', paymentBody);
      
      if (paymentResponse.payment?.status === 'COMPLETED') {
        // Create gift card after successful payment
        const giftCardResult = await this.createGiftCard(amountMoney, recipientEmail);
        
        if (giftCardResult.success && giftCardResult.giftCard) {
          // Activate the gift card
          await this.activateGiftCard(giftCardResult.giftCard.gan, amountMoney);
          
          return {
            success: true,
            paymentId: paymentResponse.payment.id,
            giftCardId: giftCardResult.giftCard.id
          };
        }
      }

      throw new Error('Payment processing failed');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
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
      
      const balance = Number(giftCard.balance_money?.amount || 0);
      const status = giftCard.state || 'UNKNOWN';
      const isValid = status === 'ACTIVE' && balance > 0;

      return {
        isValid,
        balance,
        status,
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
    const redemptionUrl = `${process.env.REPLIT_DOMAINS || 'https://localhost:5000'}/redeem/${gan}`;
    return redemptionUrl;
  }
}

export const squareAPIService = new SquareAPIService();