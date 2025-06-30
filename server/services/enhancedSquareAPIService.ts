import crypto from 'crypto';
import { storage } from '../storage';
import { SquareClient, SquareEnvironment, SquareError } from 'square';
import fetch, { RequestInit } from 'node-fetch';

/**
 * Enhanced Square API Service - Production Ready Implementation
 * Based on comprehensive analysis of Square Gift Cards API documentation:
 * 
 * Key Features Implemented:
 * 1. Complete Gift Cards API coverage with all endpoints
 * 2. Gift Card Activities API integration
 * 3. Webhook handling for real-time updates
 * 4. Proper error handling and retry logic
 * 5. Idempotency key management
 * 6. Comprehensive validation and type safety
 * 7. Activity tracking and audit logging
 * 8. Balance management with real-time sync
 */

interface GiftCardRequest {
  type: 'DIGITAL' | 'PHYSICAL';
  locationId: string;
  order?: {
    orderId: string;
    lineItemUid: string;
  };
  giftCardGan?: string;
}

interface GiftCardActivityRequest {
  type: 'ACTIVATE' | 'LOAD' | 'REDEEM' | 'CLEAR_BALANCE' | 'DEACTIVATE' | 'ADJUST_INCREMENT' | 'ADJUST_DECREMENT' | 'UNLINKED_ACTIVITY_REFUND' | 'UNLINKED_ACTIVITY_OTHER';
  locationId: string;
  giftCardGan: string;
  giftCardBalanceMoney?: {
    amount: number;
    currency: string;
  };
  loadActivityDetails?: {
    amountMoney: {
      amount: number;
      currency: string;
    };
  };
  redeemActivityDetails?: {
    amountMoney: {
      amount: number;
      currency: string;
    };
  };
  adjustIncrementActivityDetails?: {
    amountMoney: {
      amount: number;
      currency: string;
    };
    reason: string;
  };
  adjustDecrementActivityDetails?: {
    amountMoney: {
      amount: number;
      currency: string;
    };
    reason: string;
  };
}

interface WebhookPayload {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: any;
  };
}

class EnhancedSquareAPIService {
  private client: SquareClient;
  private accessToken: string;
  private locationId: string;
  private environment: string;
  private baseUrl: string;
  private applicationId: string;
  private webhookSignatureKey: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    this.applicationId = process.env.SQUARE_APPLICATION_ID || '';
    this.webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    if (!this.accessToken || !this.locationId) {
      console.warn('Square API credentials not configured properly');
    }

    // Initialize Square SDK client
    this.client = new SquareClient({
      token: this.accessToken,
      environment: this.environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox
    });
  }

  /**
   * Generate idempotency key for Square API requests
   */
  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Enhanced Square API request with retry logic and proper error handling
   */
  private async makeSquareRequest(
    endpoint: string, 
    method: string = 'GET', 
    body?: Record<string, any>,
    retries: number = 3
  ): Promise<Record<string, any>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18',
        'User-Agent': 'SiZu-GiftCard/1.0'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Handle empty responses
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          const textResponse = await response.text();
          if (textResponse.trim()) {
            data = JSON.parse(textResponse);
          } else {
            data = {};
          }
        } else {
          data = {};
        }

        if (!response.ok) {
          // Handle specific Square API errors
          if (response.status === 429 && attempt < retries) {
            // Rate limited - wait and retry
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1') * 1000;
            await this.delay(retryAfter);
            continue;
          }
          
          if (response.status >= 500 && attempt < retries) {
            // Server error - retry with exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }

          throw new Error(`Square API Error (${response.status}): ${JSON.stringify(data.errors || data)}`);
        }

        return data;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Network error - retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    // This should never be reached, but TypeScript requires a return
    throw new Error('Maximum retries exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create Gift Card - Enhanced implementation using Square SDK
   * POST /v2/gift-cards
   */
  async createGiftCard(
    amountMoney: number,
    locationId: string,
    options?: {
      type?: 'DIGITAL' | 'PHYSICAL';
      orderId?: string;
      lineItemUid?: string;
    }
  ): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const idempotencyKey = this.generateIdempotencyKey();
      const type = options?.type || 'DIGITAL';
      
      const requestBody: any = {
        idempotencyKey: idempotencyKey,
        locationId: locationId,
        giftCard: {
          type: type
        }
      };

      // Add order information if provided
      if (options?.orderId && options?.lineItemUid) {
        requestBody.giftCard.order = {
          orderId: options.orderId,
          lineItemUid: options.lineItemUid
        };
      }

      const response = await (this.client as any).giftCardsApi.createGiftCard(requestBody);

      if (response.result.giftCard) {
        // Store gift card in database with comprehensive tracking
        await this.syncGiftCardToDatabase(response.result.giftCard);
        
        return {
          success: true,
          giftCard: response.result.giftCard
        };
      }

      return {
        success: false,
        error: 'No gift card returned from Square API'
      };

    } catch (error) {
      console.error('Create gift card error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating gift card'
      };
    }
  }

  /**
   * List Gift Cards with advanced filtering
   * GET /v2/gift-cards
   */
  async listGiftCards(
    type?: 'DIGITAL' | 'PHYSICAL',
    state?: 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'DEACTIVATED',
    limit: number = 50,
    cursor?: string
  ): Promise<{
    success: boolean;
    giftCards?: any[];
    cursor?: string;
    error?: string;
  }> {
    try {
      let query = `/v2/gift-cards?location_id=${this.locationId}&limit=${limit}`;
      
      if (type) query += `&type=${type}`;
      if (state) query += `&state=${state}`;
      if (cursor) query += `&cursor=${cursor}`;

      const response = await this.makeSquareRequest(query);

      return {
        success: true,
        giftCards: response.gift_cards || [],
        cursor: response.cursor
      };

    } catch (error) {
      console.error('List gift cards error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list gift cards'
      };
    }
  }

  /**
   * Retrieve Gift Card by ID or GAN
   * GET /v2/gift-cards/{gift_card_id}
   */
  async retrieveGiftCard(giftCardId: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const response = await this.makeSquareRequest(`/v2/gift-cards/${giftCardId}`);

      if (response.gift_card) {
        // Sync latest data to database
        await this.syncGiftCardToDatabase(response.gift_card);
        
        return {
          success: true,
          giftCard: response.gift_card
        };
      }

      return {
        success: false,
        error: 'Gift card not found'
      };

    } catch (error) {
      console.error('Retrieve gift card error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve gift card'
      };
    }
  }

  /**
   * Retrieve Gift Card by GAN (Gift Account Number)
   * GET /v2/gift-cards/from-gan
   */
  async retrieveGiftCardFromGan(gan: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const response = await this.makeSquareRequest(
        `/v2/gift-cards/from-gan?gan=${encodeURIComponent(gan)}`
      );

      if (response.gift_card) {
        await this.syncGiftCardToDatabase(response.gift_card);
        
        return {
          success: true,
          giftCard: response.gift_card
        };
      }

      return {
        success: false,
        error: 'Gift card not found'
      };

    } catch (error) {
      console.error('Retrieve gift card from GAN error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve gift card'
      };
    }
  }

  /**
   * Link Customer to Gift Card
   * POST /v2/gift-cards/{gift_card_id}/link-customer
   */
  async linkCustomerToGiftCard(giftCardId: string, customerId: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const response = await this.makeSquareRequest(
        `/v2/gift-cards/${giftCardId}/link-customer`,
        'POST',
        { customer_id: customerId }
      );

      if (response.gift_card) {
        await this.syncGiftCardToDatabase(response.gift_card);
        
        return {
          success: true,
          giftCard: response.gift_card
        };
      }

      return {
        success: false,
        error: 'Failed to link customer to gift card'
      };

    } catch (error) {
      console.error('Link customer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link customer'
      };
    }
  }

  /**
   * Unlink Customer from Gift Card
   * POST /v2/gift-cards/{gift_card_id}/unlink-customer
   */
  async unlinkCustomerFromGiftCard(giftCardId: string): Promise<{
    success: boolean;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const response = await this.makeSquareRequest(
        `/v2/gift-cards/${giftCardId}/unlink-customer`,
        'POST'
      );

      if (response.gift_card) {
        await this.syncGiftCardToDatabase(response.gift_card);
        
        return {
          success: true,
          giftCard: response.gift_card
        };
      }

      return {
        success: false,
        error: 'Failed to unlink customer from gift card'
      };

    } catch (error) {
      console.error('Unlink customer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink customer'
      };
    }
  }

  /**
   * Create Gift Card Activity - Enhanced implementation
   * POST /v2/gift-card-activities
   */
  async createGiftCardActivity(activityRequest: GiftCardActivityRequest): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    try {
      const idempotencyKey = this.generateIdempotencyKey();
      
      const requestBody = {
        idempotency_key: idempotencyKey,
        gift_card_activity: activityRequest
      };

      const response = await this.makeSquareRequest('/v2/gift-card-activities', 'POST', requestBody);

      if (response.gift_card_activity) {
        // Store activity in database for tracking
        await this.syncActivityToDatabase(response.gift_card_activity);
        
        return {
          success: true,
          activity: response.gift_card_activity
        };
      }

      return {
        success: false,
        error: 'No activity returned from Square API'
      };

    } catch (error) {
      console.error('Create gift card activity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create gift card activity'
      };
    }
  }

  /**
   * List Gift Card Activities
   * GET /v2/gift-card-activities
   */
  async listGiftCardActivities(
    giftCardId?: string,
    type?: string,
    locationId?: string,
    beginTime?: string,
    endTime?: string,
    limit: number = 50,
    cursor?: string
  ): Promise<{
    success: boolean;
    activities?: any[];
    cursor?: string;
    error?: string;
  }> {
    try {
      let query = `/v2/gift-card-activities?limit=${limit}`;
      
      if (giftCardId) query += `&gift_card_id=${giftCardId}`;
      if (type) query += `&type=${type}`;
      if (locationId) query += `&location_id=${locationId}`;
      if (beginTime) query += `&begin_time=${beginTime}`;
      if (endTime) query += `&end_time=${endTime}`;
      if (cursor) query += `&cursor=${cursor}`;

      const response = await this.makeSquareRequest(query);

      return {
        success: true,
        activities: response.gift_card_activities || [],
        cursor: response.cursor
      };

    } catch (error) {
      console.error('List gift card activities error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list activities'
      };
    }
  }

  /**
   * Create a payment link for Cash App Pay and other payment methods
   */
  async createPaymentLink(paymentData: {
    amount: number;
    currency: string;
    redirectUrl: string;
    acceptedPaymentMethods?: {
      applePay?: boolean;
      googlePay?: boolean;
      cashApp?: boolean;
      creditCard?: boolean;
      debitCard?: boolean;
    };
    merchantSupportEmail?: string;
    itemName?: string;
    itemDescription?: string;
  }): Promise<{
    success: boolean;
    checkoutUrl?: string;
    checkoutId?: string;
    error?: string;
  }> {
    try {
      console.log('🔧 Creating payment link with Cash App Pay support...');
      
      const { SquareClient, SquareEnvironment } = await import('square');
      
      const client = new SquareClient({
        environment: process.env.SQUARE_ENVIRONMENT === 'production' 
          ? SquareEnvironment.Production 
          : SquareEnvironment.Sandbox,
        token: process.env.SQUARE_ACCESS_TOKEN || "EAAAlxqLNvlPZ0CtBPELxpPe6Hjq9--DfFPA45gVsXFnhmR4pyHhvqHc79HFaPMn"
      });

      const amountCents = Math.round(paymentData.amount * 100);
      
      const createPaymentLinkRequest = {
        idempotencyKey: crypto.randomUUID(),
        checkoutOptions: {
          acceptedPaymentMethods: {
            applePay: paymentData.acceptedPaymentMethods?.applePay || true,
            googlePay: paymentData.acceptedPaymentMethods?.googlePay || true,
            cashAppPay: paymentData.acceptedPaymentMethods?.cashApp || true,
            afterpayClearpay: false
          },
          allowTipping: false,
          askForShippingAddress: false,
          merchantSupportEmail: paymentData.merchantSupportEmail || 'support@sizugiftcard.com',
          redirectUrl: paymentData.redirectUrl
        },
        order: {
          locationId: process.env.SQUARE_LOCATION_ID || "LD50VRHA8P636",
          lineItems: [
            {
              quantity: "1",
              basePriceMoney: {
                amount: BigInt(amountCents),
                currency: 'USD'
              },
              name: paymentData.itemName || "SiZu Gift Card",
              note: paymentData.itemDescription || "Digital Gift Card Purchase"
            }
          ]
        },
        paymentNote: paymentData.itemDescription || ""
      };

      console.log('💳 Sending payment link request to Square...');
      const result = await client.checkout.paymentLinks.create(createPaymentLinkRequest);

      if (result.paymentLink) {
        console.log('✅ Payment link created successfully');
        return {
          success: true,
          checkoutUrl: result.paymentLink.url,
          checkoutId: result.paymentLink.id
        };
      }

      console.log('❌ No payment link in response');
      return {
        success: false,
        error: 'Failed to create payment link'
      };

    } catch (error) {
      console.error('Create payment link error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment link creation failed'
      };
    }
  }

  /**
   * Create hosted checkout session for Square payments
   */
  async createHostedCheckout(checkoutData: {
    amount: number;
    currency: string;
    redirectUrl: string;
    note?: string;
    prePopulatedData?: {
      buyerEmail?: string;
      buyerPhoneNumber?: string;
      buyerAddress?: {
        firstName?: string;
        lastName?: string;
        addressLine1?: string;
        locality?: string;
        administrativeDistrictLevel1?: string;
        postalCode?: string;
        country?: string;
      };
    };
  }): Promise<{
    success: boolean;
    checkoutUrl?: string;
    checkoutId?: string;
    error?: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();
      
      const requestBody = {
        idempotencyKey: idempotencyKey,
        checkoutOptions: {
          acceptedPaymentMethods: {
            applePay: true,
            googlePay: true,
            afterpayClearpay: true,
            cashApp: true
          },
          allowTipping: false,
          customFields: [],
          redirectUrl: checkoutData.redirectUrl,
          merchantSupportEmail: 'support@sizu-giftcard.com'
        },
        order: {
          locationId: this.locationId,
          lineItems: [
            {
              quantity: "1",
              itemType: "ITEM",
              basePriceMoney: {
                amount: BigInt(checkoutData.amount),
                currency: checkoutData.currency || 'USD'
              },
              name: "Physical Gift Card",
              note: checkoutData.note || "Custom physical gift card order"
            }
          ]
        },
        paymentNote: checkoutData.note,
        prePopulatedData: checkoutData.prePopulatedData ? {
          buyerEmail: checkoutData.prePopulatedData.buyerEmail,
          buyerPhoneNumber: checkoutData.prePopulatedData.buyerPhoneNumber,
          buyerAddress: checkoutData.prePopulatedData.buyerAddress ? {
            addressLine1: checkoutData.prePopulatedData.buyerAddress.addressLine1,
            locality: checkoutData.prePopulatedData.buyerAddress.locality,
            administrativeDistrictLevel1: checkoutData.prePopulatedData.buyerAddress.administrativeDistrictLevel1,
            postalCode: checkoutData.prePopulatedData.buyerAddress.postalCode,
            country: 'US' as const // Use proper Country enum value
          } : undefined
        } : undefined
      };

      console.log('Creating payment link with Square SDK...');
      const response = await this.client.checkout.paymentLinks.create(requestBody);

      if (response.result.paymentLink) {
        return {
          success: true,
          checkoutUrl: response.result.paymentLink.url,
          checkoutId: response.result.paymentLink.id
        };
      }

      return {
        success: false,
        error: 'Failed to create checkout session'
      };

    } catch (error) {
      console.error('Create hosted checkout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
      };
    }
  }

  /**
   * Webhook signature verification for secure webhook handling
   */
  verifyWebhookSignature(body: string, signature: string, url: string): boolean {
    if (!this.webhookSignatureKey) {
      console.warn('Webhook signature key not configured');
      return false;
    }

    const payload = url + body;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSignatureKey)
      .update(payload, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  }

  /**
   * Process webhook events for real-time updates
   */
  async processWebhook(payload: WebhookPayload): Promise<{
    success: boolean;
    processed?: boolean;
    error?: string;
  }> {
    try {
      console.log(`Processing webhook: ${payload.type} for merchant ${payload.merchant_id}`);

      switch (payload.type) {
        case 'gift_card.created':
          await this.handleGiftCardCreated(payload.data.object);
          break;
          
        case 'gift_card.updated':
          await this.handleGiftCardUpdated(payload.data.object);
          break;
          
        case 'gift_card_activity.created':
          await this.handleGiftCardActivityCreated(payload.data.object);
          break;
          
        default:
          console.log(`Unhandled webhook type: ${payload.type}`);
          return { success: true, processed: false };
      }

      return { success: true, processed: true };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }

  /**
   * Handle gift card created webhook
   */
  private async handleGiftCardCreated(giftCard: any): Promise<void> {
    await this.syncGiftCardToDatabase(giftCard);
    console.log(`Gift card created: ${giftCard.gan}`);
  }

  /**
   * Handle gift card updated webhook
   */
  private async handleGiftCardUpdated(giftCard: any): Promise<void> {
    await this.syncGiftCardToDatabase(giftCard);
    console.log(`Gift card updated: ${giftCard.gan}`);
  }

  /**
   * Handle gift card activity created webhook
   */
  private async handleGiftCardActivityCreated(activity: any): Promise<void> {
    await this.syncActivityToDatabase(activity);
    console.log(`Gift card activity created: ${activity.type} for ${activity.gift_card_gan}`);
  }

  /**
   * Sync gift card data to local database
   */
  private async syncGiftCardToDatabase(giftCard: any): Promise<void> {
    try {
      const existingCard = await storage.getGiftCardByGan(giftCard.gan);
      
      if (existingCard) {
        // Update existing card
        await storage.updateGiftCardBalance(
          existingCard.id,
          parseInt(giftCard.balance_money?.amount || '0')
        );
        await storage.updateGiftCardStatus(existingCard.id, giftCard.state);
      } else {
        // Create new card record
        await storage.createGiftCard({
          squareGiftCardId: giftCard.id,
          gan: giftCard.gan,
          merchantId: giftCard.location_id || this.locationId,
          amount: parseInt(giftCard.balance_money?.amount || '0'),
          balance: parseInt(giftCard.balance_money?.amount || '0'),
          status: giftCard.state,
          recipientEmail: null,
          personalMessage: null
        });
      }
    } catch (error) {
      console.error('Error syncing gift card to database:', error);
    }
  }

  /**
   * Sync activity data to local database
   */
  private async syncActivityToDatabase(activity: Record<string, any>): Promise<void> {
    try {
      const giftCard = await storage.getGiftCardByGan(activity.gift_card_gan);
      
      if (giftCard) {
        await storage.createGiftCardActivity({
          giftCardId: giftCard.id,
          type: activity.type,
          amount: parseInt(activity.gift_card_balance_money?.amount || '0'),
          squareActivityId: activity.id
        });
      }
    } catch (error) {
      console.error('Error syncing activity to database:', error);
    }
  }

  /**
   * Comprehensive gift card validation with real-time balance check
   */
  async validateGiftCard(gan: string): Promise<{
    isValid: boolean;
    balance: number;
    status: string;
    giftCard?: any;
    error?: string;
  }> {
    try {
      const result = await this.retrieveGiftCardFromGan(gan);
      
      if (!result.success || !result.giftCard) {
        return {
          isValid: false,
          balance: 0,
          status: 'NOT_FOUND',
          error: result.error || 'Gift card not found'
        };
      }

      const giftCard = result.giftCard;
      const balance = parseInt(giftCard.balance_money?.amount || '0');
      
      return {
        isValid: giftCard.state === 'ACTIVE' && balance > 0,
        balance,
        status: giftCard.state,
        giftCard
      };

    } catch (error) {
      console.error('Gift card validation error:', error);
      return {
        isValid: false,
        balance: 0,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * High-level gift card operations
   */

  // Activate gift card with initial balance
  async activateGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'ACTIVATE',
      locationId: this.locationId,
      giftCardGan: gan,
      giftCardBalanceMoney: {
        amount: amountCents,
        currency: 'USD'
      }
    });
  }

  // Load money onto gift card
  async loadGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'LOAD',
      locationId: this.locationId,
      giftCardGan: gan,
      loadActivityDetails: {
        amountMoney: {
          amount: amountCents,
          currency: 'USD'
        }
      }
    });
  }

  // Redeem money from gift card
  async redeemGiftCard(gan: string, amountCents: number): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'REDEEM',
      locationId: this.locationId,
      giftCardGan: gan,
      redeemActivityDetails: {
        amountMoney: {
          amount: amountCents,
          currency: 'USD'
        }
      }
    });
  }

  // Adjust gift card balance (increment)
  async adjustGiftCardBalanceUp(gan: string, amountCents: number, reason: string): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'ADJUST_INCREMENT',
      locationId: this.locationId,
      giftCardGan: gan,
      adjustIncrementActivityDetails: {
        amountMoney: {
          amount: amountCents,
          currency: 'USD'
        },
        reason
      }
    });
  }

  // Adjust gift card balance (decrement)
  async adjustGiftCardBalanceDown(gan: string, amountCents: number, reason: string): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'ADJUST_DECREMENT',
      locationId: this.locationId,
      giftCardGan: gan,
      adjustDecrementActivityDetails: {
        amountMoney: {
          amount: amountCents,
          currency: 'USD'
        },
        reason
      }
    });
  }

  // Deactivate gift card
  async deactivateGiftCard(gan: string): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'DEACTIVATE',
      locationId: this.locationId,
      giftCardGan: gan
    });
  }

  // Clear gift card balance
  async clearGiftCardBalance(gan: string): Promise<{
    success: boolean;
    activity?: any;
    error?: string;
  }> {
    return this.createGiftCardActivity({
      type: 'CLEAR_BALANCE',
      locationId: this.locationId,
      giftCardGan: gan
    });
  }
}

export const enhancedSquareAPIService = new EnhancedSquareAPIService();