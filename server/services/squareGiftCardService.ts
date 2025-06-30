// Square production gift card service using HTTP API directly
import fetch, { RequestInit } from 'node-fetch';
import { z } from 'zod';

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

// Zod schemas for Square API response validation
const SquareGiftCardSchema = z.object({
  id: z.string(),
  gan: z.string(),
  state: z.string(),
  type: z.string().optional(),
  balance_money: z.object({
    amount: z.number(),
    currency: z.string()
  }).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const SquareGiftCardResponseSchema = z.object({
  gift_card: SquareGiftCardSchema.optional()
});

const SquareGiftCardActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  location_id: z.string().optional(),
  created_at: z.string().optional(),
  gift_card_id: z.string().optional(),
  gift_card_gan: z.string().optional(),
  gift_card_balance_money: z.object({
    amount: z.number(),
    currency: z.string()
  }).optional()
});

const SquareGiftCardActivityResponseSchema = z.object({
  gift_card_activity: SquareGiftCardActivitySchema.optional()
});

const SquareGiftCardActivitiesResponseSchema = z.object({
  gift_card_activities: z.array(SquareGiftCardActivitySchema).optional()
});

export interface SquareGiftCard {
  id: string;
  gan: string;
  state: string;
  type?: string;
  balance_money?: {
    amount: number;
    currency: string;
  };
  created_at?: string;
  updated_at?: string;
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
        const errorData = responseData as { errors?: Array<{ detail?: string }> };
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card creation failed'}`
        };
      }

      const validated = SquareGiftCardResponseSchema.parse(responseData);
      if (validated.gift_card) {
        const giftCard = validated.gift_card;
        
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
        const errorData = responseData as { errors?: Array<{ detail?: string }> };
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card activation failed'}`
        };
      }

      const validated = SquareGiftCardActivityResponseSchema.parse(responseData);
      if (validated.gift_card_activity) {
        return {
          success: true,
          activity: validated.gift_card_activity
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
      const response = await fetch(`${this.baseUrl}/v2/gift-cards/from-gan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify({ gan })
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorData = responseData as { errors?: Array<{ detail?: string }> };
        return {
          isValid: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card validation failed'}`
        };
      }

      const data = responseData as { gift_card?: any };
      if (data.gift_card) {
        const giftCard = data.gift_card;
        const balance = giftCard.balance_money?.amount ? Number(giftCard.balance_money.amount) : 0;
        
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
    activity?: SquareGiftCardActivity;
    newBalance?: number;
    error?: string;
  }> {
    try {
      const redeemRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        gift_card_activity: {
          type: 'REDEEM',
          location_id: this.locationId,
          gift_card_gan: gan,
          redeem_activity_details: {
            amount_money: {
              amount: amountCents,
              currency: 'USD'
            }
          }
        }
      };

      console.log('Redeeming from gift card:', { gan, amount: amountCents });
      
      const response = await fetch(`${this.baseUrl}/v2/gift-card-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(redeemRequest)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorData = responseData as { errors?: Array<{ detail?: string }> };
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card redemption failed'}`
        };
      }

      const data = responseData as { gift_card_activity?: any };
      if (data.gift_card_activity) {
        const activity = data.gift_card_activity;
        const newBalance = activity.gift_card_balance_money?.amount ? Number(activity.gift_card_balance_money.amount) : 0;
        
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
      const response = await fetch(`${this.baseUrl}/v2/gift-card-activities?gift_card_gan=${gan}&location_id=${this.locationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorData = responseData as { errors?: Array<{ detail?: string }> };
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Failed to get gift card activities'}`
        };
      }

      const data = responseData as { gift_card_activities?: any[] };
      if (data.gift_card_activities) {
        const activities = data.gift_card_activities.map((activity: SquareGiftCardActivity) => ({
          id: activity.id || '',
          type: activity.type || '',
          amount: activity.activate_activity_details?.amount_money?.amount ? 
            Number(activity.activate_activity_details.amount_money.amount) :
            activity.redeem_activity_details?.amount_money?.amount ?
            Number(activity.redeem_activity_details.amount_money.amount) : 0,
          createdAt: activity.created_at ? new Date(activity.created_at) : new Date(),
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
    activity?: SquareGiftCardActivity;
    newBalance?: number;
    error?: string;
  }> {
    try {
      const loadRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        gift_card_activity: {
          type: 'LOAD',
          location_id: this.locationId,
          gift_card_gan: gan,
          load_activity_details: {
            amount_money: {
              amount: amountCents,
              currency: 'USD'
            }
          }
        }
      };

      console.log('Loading funds to gift card:', { gan, amount: amountCents });
      
      const response = await fetch(`${this.baseUrl}/v2/gift-card-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(loadRequest)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorData = responseData as { errors?: Array<{ detail?: string }> };
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card load failed'}`
        };
      }

      const data = responseData as { gift_card_activity?: any };
      if (data.gift_card_activity) {
        const activity = data.gift_card_activity;
        const newBalance = activity.gift_card_balance_money?.amount ? Number(activity.gift_card_balance_money.amount) : 0;
        
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
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown load error'
      };
    }
  }

  private generateIdempotencyKey(): string {
    return `giftcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getActivityDescription(activity: SquareGiftCardActivity): string {
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