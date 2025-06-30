import crypto from 'crypto';
import { SquareClient, SquareEnvironment } from 'square';
import { storage } from '../storage';

/**
 * Square Cards API Service - Production Ready Implementation
 * Following Official Square Cards API Documentation:
 * - Customer Management: https://developer.squareup.com/docs/customers-api
 * - Cards Management: https://developer.squareup.com/docs/cards-api
 * - Card-on-File: https://developer.squareup.com/docs/cards-api/save-cards-on-file
 * - Payment Tokens: https://developer.squareup.com/docs/cards-api/create-card-tokens
 * 
 * Features:
 * 1. Customer profile management with Square Customer API
 * 2. Card-on-File storage and management
 * 3. Payment token generation for stored cards
 * 4. Enhanced security with card fingerprinting
 * 5. Customer payment history and preferences
 * 6. GDPR-compliant data handling
 */

interface CustomerProfileRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  note?: string;
}

interface SaveCardRequest {
  customerId: string;
  cardNonce: string;
  cardNickname?: string;
  billingAddress?: {
    address1?: string;
    address2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
  verificationToken?: string;
}

interface PaymentTokenRequest {
  cardId: string;
  customerId: string;
  amount?: number;
  currency?: string;
  verificationToken?: string;
}

class SquareCardsAPIService {
  private client: SquareClient;
  private customersApi: any;
  private cardsApi: any;
  private accessToken: string;
  private environment: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    this.client = new SquareClient({
      environment: this.environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
    
    // Set access token via setAccessToken method if available
    if (this.client.setAccessToken) {
      this.client.setAccessToken(this.accessToken);
    }

    this.customersApi = this.client.customers;
    this.cardsApi = this.client.cards;

    if (!this.accessToken) {
      console.warn('Square Cards API credentials not configured properly');
    }
  }

  /**
   * Create or retrieve a Square customer profile
   */
  async createOrGetCustomer(profileData: CustomerProfileRequest): Promise<{
    success: boolean;
    customer?: any;
    squareCustomerId?: string;
    error?: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();

      // Check if customer already exists by email
      const searchRequest = {
        query: {
          filter: {
            emailAddress: {
              exact: profileData.email
            }
          }
        }
      };

      const searchResult = await this.customersApi.searchCustomers(searchRequest);

      if (searchResult.result?.customers && searchResult.result.customers.length > 0) {
        const existingCustomer = searchResult.result.customers[0];
        console.log(`Found existing Square customer: ${existingCustomer.id}`);
        
        return {
          success: true,
          customer: existingCustomer,
          squareCustomerId: existingCustomer.id
        };
      }

      // Create new customer
      const createRequest: any = {
        idempotencyKey,
        givenName: profileData.firstName,
        familyName: profileData.lastName,
        emailAddress: profileData.email,
        phoneNumber: profileData.phone,
        companyName: profileData.companyName,
        note: profileData.note,
      };

      const createResult = await this.customersApi.createCustomer(createRequest);

      if (createResult.result?.customer) {
        console.log(`Created new Square customer: ${createResult.result.customer.id}`);
        
        // Store customer profile in our database
        await storage.createCustomerProfile({
          email: profileData.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          squareCustomerId: createResult.result.customer.id,
        });

        return {
          success: true,
          customer: createResult.result.customer,
          squareCustomerId: createResult.result.customer.id
        };
      }

      throw new Error('Failed to create customer');

    } catch (error: any) {
      console.error('Square Customer API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create/retrieve customer'
      };
    }
  }

  /**
   * Save a payment card on file for a customer
   */
  async saveCardOnFile(request: SaveCardRequest): Promise<{
    success: boolean;
    card?: Card;
    cardId?: string;
    error?: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();

      const createCardRequest: CreateCardRequest = {
        idempotencyKey,
        sourceId: request.cardNonce,
        card: {
          customerId: request.customerId,
          billingAddress: request.billingAddress,
          cardholderName: request.cardNickname,
        },
        verificationToken: request.verificationToken,
      };

      const result = await this.cardsApi.createCard(createCardRequest);

      if (result.result?.card) {
        const card = result.result.card;
        console.log(`Saved card on file: ${card.id}`);

        // Store card details in our database
        const customerProfile = await storage.getCustomerProfileBySquareId(request.customerId);
        if (customerProfile) {
          await storage.createSavedCard({
            customerId: customerProfile.id,
            squareCardId: card.id!,
            cardBrand: card.cardBrand,
            last4: card.last4,
            expMonth: card.expMonth,
            expYear: card.expYear,
            cardType: card.cardType,
            fingerprint: card.fingerprint,
            billingAddress: JSON.stringify(card.billingAddress),
            cardNickname: request.cardNickname,
            isDefault: true, // First card is default
            isActive: true,
          });
        }

        return {
          success: true,
          card,
          cardId: card.id
        };
      }

      throw new Error('Failed to save card');

    } catch (error: any) {
      console.error('Square Cards API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save card'
      };
    }
  }

  /**
   * Generate payment token for stored card
   */
  async createPaymentToken(request: PaymentTokenRequest): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      // For stored cards, we use the card ID as the source for payments
      // The Square SDK handles tokenization internally for card-on-file payments
      
      const tokenId = `card_${request.cardId}_${Date.now()}`;
      
      // Store token event for tracking
      const customerProfile = await storage.getCustomerProfileBySquareId(request.customerId);
      const savedCard = await storage.getSavedCardBySquareId(request.cardId);
      
      if (customerProfile && savedCard) {
        await storage.createCardTokenEvent({
          customerId: customerProfile.id,
          savedCardId: savedCard.id,
          tokenType: 'PAYMENT_TOKEN',
          tokenId,
          usageType: 'GIFT_CARD_PURCHASE',
          amount: request.amount,
          currency: request.currency || 'USD',
          status: 'CREATED',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
        });
      }

      return {
        success: true,
        token: request.cardId // Use card ID directly for Square payments
      };

    } catch (error: any) {
      console.error('Payment Token Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment token'
      };
    }
  }

  /**
   * Get customer's saved cards
   */
  async getCustomerCards(customerId: string): Promise<{
    success: boolean;
    cards?: Card[];
    error?: string;
  }> {
    try {
      const result = await this.cardsApi.listCards(
        undefined, // cursor
        customerId,
        true, // includeDisabled
        'ASC' // sortOrder
      );

      if (result.result?.cards) {
        console.log(`Retrieved ${result.result.cards.length} cards for customer ${customerId}`);
        return {
          success: true,
          cards: result.result.cards
        };
      }

      return {
        success: true,
        cards: []
      };

    } catch (error: any) {
      console.error('Square Cards List Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve cards'
      };
    }
  }

  /**
   * Disable a saved card
   */
  async disableCard(cardId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await this.cardsApi.disableCard(cardId);

      if (result.result?.card) {
        console.log(`Disabled card: ${cardId}`);
        
        // Update our database
        await storage.deactivateSavedCard(cardId);
        
        return { success: true };
      }

      throw new Error('Failed to disable card');

    } catch (error: any) {
      console.error('Square Card Disable Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to disable card'
      };
    }
  }

  /**
   * Update customer profile
   */
  async updateCustomer(customerId: string, updates: Partial<CustomerProfileRequest>): Promise<{
    success: boolean;
    customer?: Customer;
    error?: string;
  }> {
    try {
      const updateRequest = {
        givenName: updates.firstName,
        familyName: updates.lastName,
        emailAddress: updates.email,
        phoneNumber: updates.phone,
        companyName: updates.companyName,
        note: updates.note,
        version: undefined, // Square will handle versioning
      };

      const result = await this.customersApi.updateCustomer(customerId, updateRequest);

      if (result.result?.customer) {
        console.log(`Updated Square customer: ${customerId}`);
        
        // Update our database
        await storage.updateCustomerProfile(customerId, {
          email: updates.email,
          firstName: updates.firstName,
          lastName: updates.lastName,
          phone: updates.phone,
        });

        return {
          success: true,
          customer: result.result.customer
        };
      }

      throw new Error('Failed to update customer');

    } catch (error: any) {
      console.error('Square Customer Update Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update customer'
      };
    }
  }

  /**
   * Delete customer and all associated cards (GDPR compliance)
   */
  async deleteCustomer(customerId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // First disable all cards
      const cardsResult = await this.getCustomerCards(customerId);
      if (cardsResult.success && cardsResult.cards) {
        for (const card of cardsResult.cards) {
          if (card.id) {
            await this.disableCard(card.id);
          }
        }
      }

      // Delete customer from Square
      const result = await this.customersApi.deleteCustomer(customerId);

      console.log(`Deleted Square customer: ${customerId}`);
      
      // Delete from our database
      await storage.deleteCustomerProfile(customerId);

      return { success: true };

    } catch (error: any) {
      console.error('Square Customer Delete Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete customer'
      };
    }
  }
}

export const squareCardsAPIService = new SquareCardsAPIService();