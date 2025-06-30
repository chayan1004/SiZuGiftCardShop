// Square production gift card service using HTTP API directly with proper Zod validation
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
  gift_card: SquareGiftCardSchema.optional(),
  errors: z.array(z.object({
    detail: z.string().optional()
  })).optional()
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
  }).optional(),
  activate_activity_details: z.object({
    amount_money: z.object({
      amount: z.number(),
      currency: z.string()
    })
  }).optional(),
  load_activity_details: z.object({
    amount_money: z.object({
      amount: z.number(),
      currency: z.string()
    })
  }).optional(),
  redeem_activity_details: z.object({
    amount_money: z.object({
      amount: z.number(),
      currency: z.string()
    })
  }).optional()
});

const SquareGiftCardActivityResponseSchema = z.object({
  gift_card_activity: SquareGiftCardActivitySchema.optional(),
  errors: z.array(z.object({
    detail: z.string().optional()
  })).optional()
});

const SquareGiftCardActivitiesResponseSchema = z.object({
  gift_card_activities: z.array(SquareGiftCardActivitySchema).optional(),
  errors: z.array(z.object({
    detail: z.string().optional()
  })).optional()
});

// Error response schema for all Square API calls
const SquareErrorResponseSchema = z.object({
  errors: z.array(z.object({
    detail: z.string().optional(),
    field: z.string().optional(),
    code: z.string().optional()
  })).optional()
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
}

export interface SquareGiftCardActivity {
  id: string;
  type: string;
  gift_card_gan?: string;
  created_at?: string;
  location_id?: string;
  gift_card_id?: string;
  gift_card_balance_money?: {
    amount: number;
    currency: string;
  };
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
   * Generate unique idempotency key for Square API requests
   */
  private generateIdempotencyKey(): string {
    return `sizu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new gift card in Square with proper Zod validation
   */
  async createGiftCard(request: CreateGiftCardRequest): Promise<{
    success: boolean;
    giftCard?: SquareGiftCard;
    gan?: string;
    error?: string;
  }> {
    try {
      const createRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        location_id: this.locationId,
        gift_card: {
          type: 'DIGITAL'
        }
      };

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
        const errorData = SquareErrorResponseSchema.parse(responseData);
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card creation failed'}`
        };
      }

      const validated = SquareGiftCardResponseSchema.parse(responseData);
      if (validated.gift_card) {
        return {
          success: true,
          giftCard: validated.gift_card,
          gan: validated.gift_card.gan
        };
      }

      return {
        success: false,
        error: 'No gift card returned from Square API'
      };
    } catch (error) {
      console.error('Error creating gift card:', error);
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
          activate_activity_details: {
            amount_money: {
              amount: amountCents,
              currency: 'USD'
            }
          }
        }
      };

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
        const errorData = SquareErrorResponseSchema.parse(responseData);
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
        error: 'No activity returned from Square API'
      };
    } catch (error) {
      console.error('Error activating gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error activating gift card'
      };
    }
  }

  /**
   * Validate gift card and get balance
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
        const errorData = SquareErrorResponseSchema.parse(responseData);
        return {
          isValid: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card validation failed'}`
        };
      }

      const validated = SquareGiftCardResponseSchema.parse(responseData);
      if (validated.gift_card) {
        const giftCard = validated.gift_card;
        const balance = giftCard.balance_money?.amount ? Number(giftCard.balance_money.amount) : 0;
        
        return {
          isValid: true,
          balance,
          status: giftCard.state
        };
      }

      return {
        isValid: false,
        error: 'Gift card not found'
      };
    } catch (error) {
      console.error('Error validating gift card:', error);
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
          redeem_activity_details: {
            amount_money: {
              amount: amountCents,
              currency: 'USD'
            }
          }
        }
      };

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
        const errorData = SquareErrorResponseSchema.parse(responseData);
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card redemption failed'}`
        };
      }

      const validated = SquareGiftCardActivityResponseSchema.parse(responseData);
      if (validated.gift_card_activity) {
        const activity = validated.gift_card_activity as SquareGiftCardActivity;
        const newBalance = activity.gift_card_balance_money?.amount ? Number(activity.gift_card_balance_money.amount) : 0;
        
        return {
          success: true,
          activity,
          newBalance
        };
      }

      return {
        success: false,
        error: 'No activity returned from Square API'
      };
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown redemption error'
      };
    }
  }

  /**
   * Load additional amount to gift card
   */
  async loadGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    newBalance?: number;
    error?: string;
  }> {
    try {
      const loadRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        gift_card_activity: {
          type: 'LOAD',
          location_id: this.locationId,
          load_activity_details: {
            amount_money: {
              amount: amountCents,
              currency: 'USD'
            }
          }
        }
      };

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
        const errorData = SquareErrorResponseSchema.parse(responseData);
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card load failed'}`
        };
      }

      const validated = SquareGiftCardActivityResponseSchema.parse(responseData);
      if (validated.gift_card_activity) {
        const activity = validated.gift_card_activity;
        const newBalance = activity.gift_card_balance_money?.amount ? Number(activity.gift_card_balance_money.amount) : 0;
        
        return {
          success: true,
          activity,
          newBalance
        };
      }

      return {
        success: false,
        error: 'No activity returned from Square API'
      };
    } catch (error) {
      console.error('Error loading gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown load error'
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
      const response = await fetch(`${this.baseUrl}/v2/gift-card-activities?gift_card_gan=${encodeURIComponent(gan)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        }
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorData = SquareErrorResponseSchema.parse(responseData);
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Failed to get gift card activities'}`
        };
      }

      const validated = SquareGiftCardActivitiesResponseSchema.parse(responseData);
      if (validated.gift_card_activities) {
        const activities = validated.gift_card_activities.map((activity) => {
          const typedActivity = activity as SquareGiftCardActivity;
          return {
            id: typedActivity.id,
            type: typedActivity.type,
            amount: typedActivity.activate_activity_details?.amount_money?.amount || 
                   typedActivity.load_activity_details?.amount_money?.amount || 
                   typedActivity.redeem_activity_details?.amount_money?.amount || 0,
            createdAt: new Date(typedActivity.created_at || ''),
            description: `${typedActivity.type} activity`
          };
        });

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
      console.error('Error getting gift card activities:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting activities'
      };
    }
  }

  /**
   * Deactivate a gift card
   */
  async deactivateGiftCard(gan: string): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    try {
      const deactivateRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        gift_card_activity: {
          type: 'BLOCK',
          location_id: this.locationId,
          block_activity_details: {
            reason: 'CHARGEBACK'
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/v2/gift-card-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(deactivateRequest)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorData = SquareErrorResponseSchema.parse(responseData);
        return {
          success: false,
          error: `Square API error: ${errorData.errors?.[0]?.detail || 'Gift card deactivation failed'}`
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
        error: 'No activity returned from Square API'
      };
    } catch (error) {
      console.error('Error deactivating gift card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deactivation error'
      };
    }
  }
}

// Export a singleton instance
export const squareGiftCardService = new SquareGiftCardService();