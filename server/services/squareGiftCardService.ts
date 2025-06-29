// Square production gift card service using HTTP API directly
import fetch, { RequestInit } from 'node-fetch';

export interface CreateGiftCardRequest {
  amount: number; // in cents
  recipientEmail?: string;
  personalMessage?: string;
  recipientName?: string;
  senderName?: string;
}

export interface GiftCardValidation {
  isValid: boolean;
  balance?: number;
  status?: string;
  error?: string;
}

export interface GiftCardActivity {
  id: string;
  type: string;
  amount: number;
  createdAt: Date;
  description?: string;
}

export interface SquareGiftCard {
  id: string;
  gan: string;
  state: string;
  balance_money?: {
    amount: number;
    currency: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SquareGiftCardActivity {
  id: string;
  type: string;
  gift_card_gan: string;
  created_at: string;
  activate_activity_details?: {
    amount_money: {
      amount: number;
      currency: string;
    };
  };
  load_activity_details?: {
    amount_money: {
      amount: number;
      currency: string;
    };
  };
  redeem_activity_details?: {
    amount_money: {
      amount: number;
      currency: string;
    };
  };
}

export class SquareGiftCardService {
  private baseUrl: string;
  private locationId: string;
  private accessToken: string;

  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !environment || !locationId) {
      throw new Error('Square API credentials not configured');
    }

    this.baseUrl = environment === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
    
    this.locationId = locationId;
    this.accessToken = accessToken;
  }

  /**
   * Create a new gift card in Square
   */
  async createGiftCard(request: CreateGiftCardRequest): Promise<{
    success: boolean;
    giftCard?: SquareGiftCard;
    gan?: string;
    error?: string;
  }> {
    try {
      const idempotencyKey = this.generateIdempotencyKey();
      
      const createRequest = {
        idempotency_key: idempotencyKey,
        location_id: this.locationId,
        gift_card: {
          type: 'DIGITAL'
        }
      };

      console.log('Creating gift card with Square API:', createRequest);
      
      const response = await fetch(`${this.baseUrl}/v2/gift-cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(createRequest)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: `Square API error: ${responseData.errors?.[0]?.detail || 'Gift card creation failed'}`
        };
      }

      if (responseData.gift_card) {
        const giftCard = responseData.gift_card;
        
        // Activate the gift card with the specified amount
        const activationResult = await this.activateGiftCard(
          giftCard.gan,
          request.amount
        );

        if (!activationResult.success) {
          return {
            success: false,
            error: `Gift card created but activation failed: ${activationResult.error}`
          };
        }

        return {
          success: true,
          giftCard: giftCard,
          gan: giftCard.gan
        };
      }

      return {
        success: false,
        error: 'Gift card creation failed - no gift card returned'
      };

    } catch (error) {
      console.error('Square gift card creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating gift card'
      };
    }
  }

  /**
   * Activate a gift card with initial balance
   */
  async activateGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    try {
      const activateRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        gift_card_activity: {
          type: 'ACTIVATE',
          location_id: this.locationId,
          gift_card_gan: gan,
          activate_activity_details: {
            amount_money: {
              amount: amountCents,
              currency: 'USD'
            }
          }
        }
      };

      console.log('Activating gift card:', { gan, amount: amountCents });
      
      const response = await fetch(`${this.baseUrl}/v2/gift-card-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(activateRequest)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: `Square API error: ${responseData.errors?.[0]?.detail || 'Gift card activation failed'}`
        };
      }

      if (responseData.gift_card_activity) {
        return {
          success: true,
          activity: responseData.gift_card_activity
        };
      }

      return {
        success: false,
        error: 'Gift card activation failed - no activity returned'
      };

    } catch (error) {
      console.error('Square gift card activation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error activating gift card'
      };
    }
  }

  /**
   * Validate and get gift card information
   */
  async validateGiftCard(gan: string): Promise<GiftCardValidation> {
    try {
      const { giftCardsApi } = this.client;
      
      const response = await giftCardsApi.retrieveGiftCardFromGan({
        gan
      });

      if (response.result.giftCard) {
        const giftCard = response.result.giftCard;
        const balance = giftCard.balanceMoney?.amount ? Number(giftCard.balanceMoney.amount) : 0;
        
        return {
          isValid: giftCard.state === 'ACTIVE',
          balance,
          status: giftCard.state || 'UNKNOWN'
        };
      }

      return {
        isValid: false,
        error: 'Gift card not found'
      };

    } catch (error) {
      console.error('Square gift card validation error:', error);
      
      if (error instanceof ApiError) {
        return {
          isValid: false,
          error: `Square API error: ${error.errors?.[0]?.detail || error.message}`
        };
      }

      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Redeem amount from gift card
   */
  async redeemGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    newBalance?: number;
    error?: string;
  }> {
    try {
      const { giftCardActivitiesApi } = this.client;

      const redeemRequest = {
        idempotencyKey: this.generateIdempotencyKey(),
        giftCardActivity: {
          type: 'REDEEM' as const,
          locationId: this.locationId,
          giftCardGan: gan,
          redeemActivityDetails: {
            amountMoney: {
              amount: BigInt(amountCents),
              currency: 'USD'
            }
          }
        }
      };

      console.log('Redeeming from gift card:', { gan, amount: amountCents });
      
      const response = await giftCardActivitiesApi.createGiftCardActivity(redeemRequest);
      
      if (response.result.giftCardActivity) {
        const activity = response.result.giftCardActivity;
        const newBalance = activity.giftCardBalanceMoney?.amount ? Number(activity.giftCardBalanceMoney.amount) : 0;
        
        return {
          success: true,
          activity,
          newBalance
        };
      }

      return {
        success: false,
        error: 'Gift card redemption failed - no activity returned'
      };

    } catch (error) {
      console.error('Square gift card redemption error:', error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: `Square API error: ${error.errors?.[0]?.detail || error.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown redemption error'
      };
    }
  }

  /**
   * Get gift card activities/transaction history
   */
  async getGiftCardActivities(gan: string): Promise<{
    success: boolean;
    activities?: GiftCardActivity[];
    error?: string;
  }> {
    try {
      const { giftCardActivitiesApi } = this.client;
      
      const response = await giftCardActivitiesApi.listGiftCardActivities({
        giftCardGan: gan,
        locationId: this.locationId
      });

      if (response.result.giftCardActivities) {
        const activities = response.result.giftCardActivities.map(activity => ({
          id: activity.id || '',
          type: activity.type || '',
          amount: activity.activateActivityDetails?.amountMoney?.amount ? 
            Number(activity.activateActivityDetails.amountMoney.amount) :
            activity.redeemActivityDetails?.amountMoney?.amount ?
            Number(activity.redeemActivityDetails.amountMoney.amount) : 0,
          createdAt: activity.createdAt ? new Date(activity.createdAt) : new Date(),
          description: this.getActivityDescription(activity)
        }));

        return {
          success: true,
          activities
        };
      }

      return {
        success: true,
        activities: []
      };

    } catch (error) {
      console.error('Square gift card activities error:', error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: `Square API error: ${error.errors?.[0]?.detail || error.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching activities'
      };
    }
  }

  /**
   * Load additional funds to gift card
   */
  async loadGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    newBalance?: number;
    error?: string;
  }> {
    try {
      const { giftCardActivitiesApi } = this.client;

      const loadRequest = {
        idempotencyKey: this.generateIdempotencyKey(),
        giftCardActivity: {
          type: 'LOAD' as const,
          locationId: this.locationId,
          giftCardGan: gan,
          loadActivityDetails: {
            amountMoney: {
              amount: BigInt(amountCents),
              currency: 'USD'
            }
          }
        }
      };

      console.log('Loading funds to gift card:', { gan, amount: amountCents });
      
      const response = await giftCardActivitiesApi.createGiftCardActivity(loadRequest);
      
      if (response.result.giftCardActivity) {
        const activity = response.result.giftCardActivity;
        const newBalance = activity.giftCardBalanceMoney?.amount ? Number(activity.giftCardBalanceMoney.amount) : 0;
        
        return {
          success: true,
          activity,
          newBalance
        };
      }

      return {
        success: false,
        error: 'Gift card load failed - no activity returned'
      };

    } catch (error) {
      console.error('Square gift card load error:', error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: `Square API error: ${error.errors?.[0]?.detail || error.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown load error'
      };
    }
  }

  private generateIdempotencyKey(): string {
    return `giftcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getActivityDescription(activity: any): string {
    switch (activity.type) {
      case 'ACTIVATE':
        return 'Gift card activated';
      case 'LOAD':
        return 'Funds added to gift card';
      case 'REDEEM':
        return 'Gift card redeemed';
      case 'ADJUST_INCREMENT':
        return 'Balance adjustment (increase)';
      case 'ADJUST_DECREMENT':
        return 'Balance adjustment (decrease)';
      default:
        return activity.type || 'Gift card activity';
    }
  }
}

export const squareGiftCardService = new SquareGiftCardService();