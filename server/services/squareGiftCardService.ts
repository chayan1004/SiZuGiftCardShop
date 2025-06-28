import { Client, Environment, GiftCardActivity, GiftCard, CreateGiftCardRequest, CreateGiftCardActivityRequest } from 'squareup';
import crypto from 'crypto';

class SquareGiftCardService {
  private client: Client;
  private locationId: string;

  constructor() {
    const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? Environment.Production 
      : Environment.Sandbox;
    
    this.client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: environment,
    });

    this.locationId = process.env.SQUARE_LOCATION_ID!;

    if (!process.env.SQUARE_ACCESS_TOKEN || !this.locationId) {
      throw new Error('Square credentials not properly configured');
    }
  }

  /**
   * Create a new gift card with Square
   */
  async createGiftCard(amountMoney: number, recipientEmail?: string): Promise<{
    giftCard: GiftCard;
    gan: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();
      
      const request: CreateGiftCardRequest = {
        idempotencyKey,
        locationId: this.locationId,
        giftCard: {
          type: 'DIGITAL',
          ...(recipientEmail && {
            recipientDetails: {
              recipientEmail
            }
          })
        }
      };

      const response = await this.client.giftCardsApi.createGiftCard(request);
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      const giftCard = response.result.giftCard!;
      const gan = giftCard.gan!;

      // Activate the gift card with the specified amount
      await this.activateGiftCard(gan, amountMoney);

      return {
        giftCard,
        gan
      };
    } catch (error) {
      console.error('Error creating gift card:', error);
      throw new Error(`Failed to create gift card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Activate a gift card with a specific amount
   */
  async activateGiftCard(gan: string, amountMoney: number): Promise<GiftCardActivity> {
    try {
      const idempotencyKey = crypto.randomUUID();
      
      const request: CreateGiftCardActivityRequest = {
        idempotencyKey,
        giftCardActivity: {
          type: 'ACTIVATE',
          locationId: this.locationId,
          giftCardGan: gan,
          activateActivityDetails: {
            amountMoney: {
              amount: BigInt(amountMoney), // Amount in cents
              currency: 'USD'
            }
          }
        }
      };

      const response = await this.client.giftCardActivitiesApi.createGiftCardActivity(request);
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivity!;
    } catch (error) {
      console.error('Error activating gift card:', error);
      throw new Error(`Failed to activate gift card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get gift card details by GAN
   */
  async getGiftCard(gan: string): Promise<GiftCard> {
    try {
      const response = await this.client.giftCardsApi.retrieveGiftCardFromGAN({
        gan
      });
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCard!;
    } catch (error) {
      console.error('Error retrieving gift card:', error);
      throw new Error(`Failed to retrieve gift card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load money onto a gift card
   */
  async loadGiftCard(gan: string, amountMoney: number): Promise<GiftCardActivity> {
    try {
      const idempotencyKey = crypto.randomUUID();
      
      const request: CreateGiftCardActivityRequest = {
        idempotencyKey,
        giftCardActivity: {
          type: 'LOAD',
          locationId: this.locationId,
          giftCardGan: gan,
          loadActivityDetails: {
            amountMoney: {
              amount: BigInt(amountMoney),
              currency: 'USD'
            }
          }
        }
      };

      const response = await this.client.giftCardActivitiesApi.createGiftCardActivity(request);
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivity!;
    } catch (error) {
      console.error('Error loading gift card:', error);
      throw new Error(`Failed to load gift card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Redeem money from a gift card
   */
  async redeemGiftCard(gan: string, amountMoney: number): Promise<GiftCardActivity> {
    try {
      const idempotencyKey = crypto.randomUUID();
      
      const request: CreateGiftCardActivityRequest = {
        idempotencyKey,
        giftCardActivity: {
          type: 'REDEEM',
          locationId: this.locationId,
          giftCardGan: gan,
          redeemActivityDetails: {
            amountMoney: {
              amount: BigInt(amountMoney),
              currency: 'USD'
            }
          }
        }
      };

      const response = await this.client.giftCardActivitiesApi.createGiftCardActivity(request);
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivity!;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      throw new Error(`Failed to redeem gift card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get gift card activities (transaction history)
   */
  async getGiftCardActivities(gan: string): Promise<GiftCardActivity[]> {
    try {
      const response = await this.client.giftCardActivitiesApi.listGiftCardActivities({
        giftCardGan: gan,
        locationId: this.locationId
      });
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivities || [];
    } catch (error) {
      console.error('Error getting gift card activities:', error);
      throw new Error(`Failed to get gift card activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate QR code data for gift card redemption
   */
  generateQRCodeData(gan: string): string {
    // This creates a redemption URL that can be scanned by mobile devices
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:5000';
    
    return `${baseUrl}/redeem/${gan}`;
  }

  /**
   * Validate gift card status and balance
   */
  async validateGiftCard(gan: string): Promise<{
    isValid: boolean;
    balance: number;
    status: string;
  }> {
    try {
      const giftCard = await this.getGiftCard(gan);
      
      return {
        isValid: giftCard.state === 'ACTIVE',
        balance: Number(giftCard.balanceMoney?.amount || 0),
        status: giftCard.state || 'UNKNOWN'
      };
    } catch (error) {
      return {
        isValid: false,
        balance: 0,
        status: 'ERROR'
      };
    }
  }
}

export const squareGiftCardService = new SquareGiftCardService();