import { Client, Environment } from "squareup";
import { storage } from "../storage";

/**
 * Real Square API Service using official Square SDK
 * Based on the correct Square API documentation and SDK methods
 */
class RealSquareService {
  private client: Client;
  private accessToken: string;
  private locationId: string;
  private environment: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    
    this.client = new Client({
      accessToken: this.accessToken,
      environment: this.environment === 'production' ? Environment.Production : Environment.Sandbox
    });
  }

  /**
   * Create gift card using Square SDK
   */
  async createGiftCard(amountCents: number, options?: {
    orderId?: string;
    lineItemUid?: string;
  }): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const idempotencyKey = `giftcard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const requestBody: any = {
        idempotencyKey,
        locationId: this.locationId,
        giftCard: {
          type: 'DIGITAL'
        }
      };

      // Add order information if provided
      if (options?.orderId && options?.lineItemUid) {
        requestBody.giftCard.order = {
          orderId: options.orderId,
          lineItemUid: options.lineItemUid
        };
      }

      const { result } = await this.client.giftCards.create(requestBody);

      if (result.giftCard) {
        return {
          success: true,
          giftCard: result.giftCard
        };
      } else {
        return {
          success: false,
          error: 'Failed to create gift card'
        };
      }
    } catch (error) {
      console.error('Error creating gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create gift card'
      };
    }
  }

  /**
   * Retrieve gift card by GAN using Square SDK
   */
  async getGiftCardByGan(gan: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const { result } = await this.client.giftCards.getFromGan({
        gan: gan
      });

      if (result.giftCard) {
        return {
          success: true,
          giftCard: result.giftCard
        };
      } else {
        return {
          success: false,
          error: 'Gift card not found'
        };
      }
    } catch (error) {
      console.error('Error retrieving gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gift card not found'
      };
    }
  }

  /**
   * List all gift cards using Square SDK
   */
  async listGiftCards(cursor?: string): Promise<{
    success: boolean;
    giftCards?: any[];
    cursor?: string;
    error?: string;
  }> {
    try {
      const requestParams: any = {};
      if (cursor) {
        requestParams.cursor = cursor;
      }

      const { result } = await this.client.giftCards.list(requestParams);

      return {
        success: true,
        giftCards: result.giftCards || [],
        cursor: result.cursor
      };
    } catch (error) {
      console.error('Error listing gift cards:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list gift cards'
      };
    }
  }

  /**
   * Check if Square API is configured properly
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.locationId);
  }

  /**
   * Validate gift card and get current balance
   */
  async validateGiftCard(gan: string): Promise<{
    success: boolean;
    valid?: boolean;
    balance?: number;
    status?: string;
    error?: string;
  }> {
    try {
      const result = await this.getGiftCardByGan(gan);
      
      if (result.success && result.giftCard) {
        return {
          success: true,
          valid: result.giftCard.state === 'ACTIVE',
          balance: result.giftCard.balance_money?.amount || 0,
          status: result.giftCard.state
        };
      } else {
        return {
          success: true,
          valid: false,
          error: 'Gift card not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }
}

export const realSquareService = new RealSquareService();