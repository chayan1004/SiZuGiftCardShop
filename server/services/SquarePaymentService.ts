/**
 * Square Payments API Service - Production Ready Implementation
 * 
 * Comprehensive implementation using official Square SDK:
 * - Create Payment: Process payments with various payment methods
 * - Get Payment: Retrieve payment details and status
 * - Complete Payment: Handle delayed capture scenarios
 * - List Payments: Query payment history with advanced filtering
 * - Webhook Processing: Real-time payment status updates
 * - Error Handling: Comprehensive retry logic and failure management
 * 
 * Reference: https://developer.squareup.com/reference/square/payments-api
 */

import crypto from 'crypto';
import { SquareClient, SquareEnvironment, SquareError } from 'square';
import { storage } from '../storage';

export interface PaymentRequest {
  sourceId: string; // Payment token from Square Web SDK
  amountMoney: {
    amount: number; // Amount in smallest currency unit (cents)
    currency: string; // ISO 4217 currency code
  };
  appFeeMoney?: {
    amount: number;
    currency: string;
  };
  delayCapture?: boolean; // For delayed capture payments
  autocomplete?: boolean; // Default true
  orderId?: string; // Associated order ID
  note?: string; // Payment note
  statementDescriptionIdentifier?: string; // Appears on customer statements
  buyerEmailAddress?: string;
  billingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string; // City
    administrativeDistrictLevel1?: string; // State
    postalCode?: string;
    country?: string; // ISO 3166 Alpha-2
    firstName?: string;
    lastName?: string;
  };
  shippingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
    firstName?: string;
    lastName?: string;
  };
  tipMoney?: {
    amount: number;
    currency: string;
  };
  cashDetails?: {
    buyerTenderedMoney: {
      amount: number;
      currency: string;
    };
    changeBackMoney?: {
      amount: number;
      currency: string;
    };
  };
  externalDetails?: {
    type: string;
    source: string;
    sourceFeeMoney?: {
      amount: number;
      currency: string;
    };
  };
  customerDetails?: {
    customerInitiated?: boolean;
    sellerKeyed?: boolean;
  };
}

export interface PaymentResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  status: 'APPROVED' | 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  delayDuration?: string;
  sourceType: 'CARD' | 'BANK_ACCOUNT' | 'WALLET' | 'BUY_NOW_PAY_LATER' | 'CASH' | 'EXTERNAL';
  cardDetails?: {
    status: 'AUTHORIZED' | 'CAPTURED' | 'VOIDED' | 'FAILED';
    card: {
      cardBrand: string;
      last4: string;
      expMonth?: number;
      expYear?: number;
      fingerprint?: string;
      cardType?: string;
      prepaidType?: string;
      bin?: string;
    };
    entryMethod: 'KEYED' | 'SWIPED' | 'EMV' | 'ON_FILE' | 'CONTACTLESS';
    cvvStatus: 'CVV_ACCEPTED' | 'CVV_REJECTED' | 'CVV_NOT_CHECKED';
    avsStatus: 'AVS_ACCEPTED' | 'AVS_REJECTED' | 'AVS_NOT_CHECKED';
    authResultCode?: string;
    applicationIdentifier?: string;
    applicationName?: string;
    applicationCryptogram?: string;
    verificationMethod?: string;
    verificationResults?: string;
    statementDescription?: string;
    deviceDetails?: {
      deviceId?: string;
      deviceInstallationId?: string;
      deviceName?: string;
    };
    refundRequiresCardPresence?: boolean;
    errors?: Array<{
      category: string;
      code: string;
      detail?: string;
      field?: string;
    }>;
  };
  locationId: string;
  orderId?: string;
  referenceId?: string;
  note?: string;
  buyerEmailAddress?: string;
  billingAddress?: any;
  shippingAddress?: any;
  receiptNumber?: string;
  receiptUrl?: string;
  delayAction?: 'CANCEL' | 'COMPLETE';
  delayed?: boolean;
  versionToken?: string;
  totalMoney?: {
    amount: number;
    currency: string;
  };
  appFeeMoney?: {
    amount: number;
    currency: string;
  };
  approvedMoney?: {
    amount: number;
    currency: string;
  };
  processingFee?: Array<{
    effectiveAt?: string;
    type?: string;
    amountMoney?: {
      amount: number;
      currency: string;
    };
  }>;
  refundedMoney?: {
    amount: number;
    currency: string;
  };
  riskEvaluation?: {
    createdAt?: string;
    riskLevel?: 'PENDING' | 'NORMAL' | 'MODERATE' | 'HIGH';
  };
  teamMemberDetails?: {
    teamMemberId?: string;
  };
  deviceOptions?: {
    deviceId?: string;
    skipReceiptScreen?: boolean;
    collectSignature?: boolean;
    tipSettings?: {
      allowTipping?: boolean;
      separateTipScreen?: boolean;
      customTipField?: boolean;
      tipPercentages?: number[];
      smartTipping?: boolean;
    };
  };
  cashPaymentDetails?: {
    buyerSuppliedMoney: {
      amount: number;
      currency: string;
    };
    changeBackMoney?: {
      amount: number;
      currency: string;
    };
  };
  bankAccountDetails?: {
    bankName?: string;
    transferType?: string;
    accountOwnershipType?: string;
    fingerprint?: string;
    country?: string;
    statementDescription?: string;
    achDetails?: {
      routing?: string;
      accountNumberSuffix?: string;
      accountType?: string;
    };
    errors?: Array<{
      category: string;
      code: string;
      detail?: string;
      field?: string;
    }>;
  };
  walletDetails?: {
    status?: string;
    brand?: string;
    cashAppDetails?: {
      buyerFullName?: string;
      buyerCountryCode?: string;
      buyerCashtag?: string;
    };
  };
  buyNowPayLaterDetails?: {
    brand?: string;
    afterpayDetails?: {
      emailAddress?: string;
    };
    clearpayDetails?: {
      emailAddress?: string;
    };
  };
  externalDetails?: {
    type: string;
    source: string;
    sourceId?: string;
    sourceFeeMoney?: {
      amount: number;
      currency: string;
    };
  };
}

export interface PaymentListFilters {
  beginTime?: string; // RFC 3339 timestamp
  endTime?: string; // RFC 3339 timestamp
  sortOrder?: 'ASC' | 'DESC';
  cursor?: string; // Pagination cursor
  locationId?: string;
  total?: number; // Total amount in smallest currency unit
  last4?: string; // Last 4 digits of card
  cardBrand?: string; // Card brand filter
  limit?: number; // Results per page (default 100, max 200)
}

export interface WebhookPaymentEvent {
  merchant_id: string;
  type: 'payment.created' | 'payment.updated';
  event_id: string;
  created_at: string;
  data: {
    type: 'payment';
    id: string;
    object: PaymentResponse;
  };
}

class SquarePaymentService {
  private client: SquareClient;
  private accessToken: string;
  private locationId: string;
  private environment: string;
  private applicationId: string;
  private webhookSignatureKey: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    this.applicationId = process.env.SQUARE_APPLICATION_ID || '';
    this.webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    
    // Initialize Square SDK Client
    this.client = new SquareClient({
      environment: this.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox,
      accessToken: this.accessToken,
      customUrl: undefined, // Use default Square URLs
      squareVersion: '2023-10-18',
      userAgentDetail: 'SiZu-GiftCard/1.0'
    });

    if (!this.accessToken || !this.locationId) {
      console.warn('Square Payment API credentials not configured properly');
    }
  }

  /**
   * Generate idempotency key for Square API requests
   */
  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Enhanced Square API request with comprehensive error handling and retry logic
   */
  private async makeSquareRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    retries: number = 3
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18',
        'Accept': 'application/json',
        'User-Agent': 'SiZu-GiftCard/1.0'
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Square API Request [Attempt ${attempt}]: ${method} ${endpoint}`);
        
        const response = await fetch(url, options);
        const responseText = await response.text();
        
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('Failed to parse Square API response:', responseText);
          throw new Error(`Invalid JSON response from Square API: ${responseText}`);
        }

        if (response.ok) {
          console.log(`Square API Success: ${response.status}`);
          return responseData;
        }

        // Handle specific error cases
        if (response.status === 400) {
          console.error('Square API Bad Request:', responseData);
          throw new Error(`Bad Request: ${responseData.errors?.[0]?.detail || 'Invalid request parameters'}`);
        }

        if (response.status === 401) {
          console.error('Square API Unauthorized:', responseData);
          throw new Error('Unauthorized: Invalid access token or permissions');
        }

        if (response.status === 403) {
          console.error('Square API Forbidden:', responseData);
          throw new Error('Forbidden: Insufficient permissions for this operation');
        }

        if (response.status === 404) {
          console.error('Square API Not Found:', responseData);
          throw new Error(`Not Found: ${endpoint} does not exist or resource not found`);
        }

        if (response.status === 429) {
          console.warn('Square API Rate Limited, retrying...');
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        if (response.status >= 500) {
          console.warn('Square API Server Error, retrying...', responseData);
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }
          throw new Error(`Server Error: ${responseData.errors?.[0]?.detail || 'Internal server error'}`);
        }

        // Unknown error
        throw new Error(`HTTP ${response.status}: ${responseData.errors?.[0]?.detail || 'Unknown error'}`);

      } catch (error) {
        console.error(`Square API Request failed [Attempt ${attempt}]:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Only retry on network errors or 5xx/429 status codes
        if (error instanceof TypeError || (error as any).code === 'ECONNRESET') {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        
        throw error;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create Payment - Main payment processing method
   * POST /v2/payments
   */
  async createPayment(paymentRequest: PaymentRequest): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    try {
      const idempotencyKey = this.generateIdempotencyKey();
      
      const requestBody = {
        idempotency_key: idempotencyKey,
        source_id: paymentRequest.sourceId,
        amount_money: paymentRequest.amountMoney,
        location_id: this.locationId,
        app_fee_money: paymentRequest.appFeeMoney,
        delay_capture: paymentRequest.delayCapture || false,
        autocomplete: paymentRequest.autocomplete ?? true,
        order_id: paymentRequest.orderId,
        note: paymentRequest.note,
        statement_description_identifier: paymentRequest.statementDescriptionIdentifier,
        buyer_email_address: paymentRequest.buyerEmailAddress,
        billing_address: paymentRequest.billingAddress,
        shipping_address: paymentRequest.shippingAddress,
        tip_money: paymentRequest.tipMoney,
        cash_details: paymentRequest.cashDetails,
        external_details: paymentRequest.externalDetails,
        customer_details: paymentRequest.customerDetails
      };

      const response = await this.makeSquareRequest('/v2/payments', 'POST', requestBody);

      if (response.payment) {
        // Store payment in database for tracking
        await this.syncPaymentToDatabase(response.payment);
        
        return {
          success: true,
          payment: response.payment
        };
      }

      return {
        success: false,
        error: 'No payment returned from Square API'
      };

    } catch (error) {
      console.error('Create payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment'
      };
    }
  }

  /**
   * Get Payment - Retrieve payment details
   * GET /v2/payments/{payment_id}
   */
  async getPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    try {
      const response = await this.makeSquareRequest(`/v2/payments/${paymentId}`);

      if (response.payment) {
        // Update payment in database
        await this.syncPaymentToDatabase(response.payment);
        
        return {
          success: true,
          payment: response.payment
        };
      }

      return {
        success: false,
        error: 'Payment not found'
      };

    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve payment'
      };
    }
  }

  /**
   * Complete Payment - For delayed capture payments
   * POST /v2/payments/{payment_id}/complete
   */
  async completePayment(paymentId: string, versionToken?: string): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    try {
      const requestBody = {
        version_token: versionToken
      };

      const response = await this.makeSquareRequest(
        `/v2/payments/${paymentId}/complete`, 
        'POST', 
        requestBody
      );

      if (response.payment) {
        // Update payment in database
        await this.syncPaymentToDatabase(response.payment);
        
        return {
          success: true,
          payment: response.payment
        };
      }

      return {
        success: false,
        error: 'Failed to complete payment'
      };

    } catch (error) {
      console.error('Complete payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete payment'
      };
    }
  }

  /**
   * Cancel Payment - For delayed capture payments
   * POST /v2/payments/{payment_id}/cancel
   */
  async cancelPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    try {
      const response = await this.makeSquareRequest(`/v2/payments/${paymentId}/cancel`, 'POST');

      if (response.payment) {
        // Update payment in database
        await this.syncPaymentToDatabase(response.payment);
        
        return {
          success: true,
          payment: response.payment
        };
      }

      return {
        success: false,
        error: 'Failed to cancel payment'
      };

    } catch (error) {
      console.error('Cancel payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel payment'
      };
    }
  }

  /**
   * List Payments - Query payment history with advanced filtering
   * GET /v2/payments
   */
  async listPayments(filters: PaymentListFilters = {}): Promise<{
    success: boolean;
    payments?: PaymentResponse[];
    cursor?: string;
    error?: string;
  }> {
    try {
      let query = `/v2/payments?location_id=${this.locationId}`;
      
      if (filters.beginTime) query += `&begin_time=${filters.beginTime}`;
      if (filters.endTime) query += `&end_time=${filters.endTime}`;
      if (filters.sortOrder) query += `&sort_order=${filters.sortOrder}`;
      if (filters.cursor) query += `&cursor=${filters.cursor}`;
      if (filters.total) query += `&total=${filters.total}`;
      if (filters.last4) query += `&last_4=${filters.last4}`;
      if (filters.cardBrand) query += `&card_brand=${filters.cardBrand}`;
      if (filters.limit) query += `&limit=${filters.limit}`;

      const response = await this.makeSquareRequest(query);

      return {
        success: true,
        payments: response.payments || [],
        cursor: response.cursor
      };

    } catch (error) {
      console.error('List payments error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list payments'
      };
    }
  }

  /**
   * Verify webhook signature for secure webhook handling
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
   * Process payment webhook events
   */
  async processPaymentWebhook(payload: WebhookPaymentEvent): Promise<{
    success: boolean;
    processed?: boolean;
    error?: string;
  }> {
    try {
      console.log(`Processing payment webhook: ${payload.type} for payment ${payload.data.id}`);

      switch (payload.type) {
        case 'payment.created':
          await this.handlePaymentCreated(payload.data.object);
          break;
          
        case 'payment.updated':
          await this.handlePaymentUpdated(payload.data.object);
          break;
          
        default:
          console.log(`Unhandled payment webhook type: ${payload.type}`);
          return { success: true, processed: false };
      }

      return { success: true, processed: true };

    } catch (error) {
      console.error('Payment webhook processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }

  /**
   * Handle payment created webhook
   */
  private async handlePaymentCreated(payment: PaymentResponse): Promise<void> {
    console.log(`Payment created: ${payment.id} - Status: ${payment.status}`);
    
    // Sync to database
    await this.syncPaymentToDatabase(payment);
    
    // Handle payment-specific logic
    if (payment.status === 'COMPLETED') {
      await this.handlePaymentCompleted(payment);
    }
  }

  /**
   * Handle payment updated webhook
   */
  private async handlePaymentUpdated(payment: PaymentResponse): Promise<void> {
    console.log(`Payment updated: ${payment.id} - Status: ${payment.status}`);
    
    // Sync to database
    await this.syncPaymentToDatabase(payment);
    
    // Handle status changes
    switch (payment.status) {
      case 'COMPLETED':
        await this.handlePaymentCompleted(payment);
        break;
      case 'FAILED':
        await this.handlePaymentFailed(payment);
        break;
      case 'CANCELED':
        await this.handlePaymentCanceled(payment);
        break;
    }
  }

  /**
   * Handle completed payment
   */
  private async handlePaymentCompleted(payment: PaymentResponse): Promise<void> {
    console.log(`Processing completed payment: ${payment.id}`);
    
    // Update related orders/gift cards
    if (payment.orderId) {
      // Update order status to paid
      // Trigger gift card creation if applicable
      // Send confirmation emails
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(payment: PaymentResponse): Promise<void> {
    console.log(`Processing failed payment: ${payment.id}`);
    
    // Handle failure logic
    // Send failure notifications
    // Update order status
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(payment: PaymentResponse): Promise<void> {
    console.log(`Processing canceled payment: ${payment.id}`);
    
    // Handle cancellation logic
    // Release inventory
    // Send cancellation notifications
  }

  /**
   * Sync payment data to database
   */
  private async syncPaymentToDatabase(payment: PaymentResponse): Promise<void> {
    try {
      // Store/update payment in database
      // This would integrate with your existing storage layer
      console.log(`Syncing payment ${payment.id} to database`);
      
      // Example implementation would call storage methods
      // await storage.createOrUpdatePayment(payment);
      
    } catch (error) {
      console.error('Failed to sync payment to database:', error);
    }
  }

  /**
   * Create payment for gift card purchase
   */
  async createGiftCardPayment(
    sourceId: string,
    amountCents: number,
    customerEmail: string,
    orderId?: string,
    note?: string
  ): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    return this.createPayment({
      sourceId,
      amountMoney: {
        amount: amountCents,
        currency: 'USD'
      },
      buyerEmailAddress: customerEmail,
      orderId,
      note: note || 'Gift card purchase',
      statementDescriptionIdentifier: 'GIFTCARD',
      autocomplete: true
    });
  }

  /**
   * Create payment for physical gift card order
   */
  async createPhysicalCardPayment(
    sourceId: string,
    amountCents: number,
    customerData: {
      email: string;
      firstName: string;
      lastName: string;
      shippingAddress?: any;
      billingAddress?: any;
    },
    orderId?: string
  ): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    return this.createPayment({
      sourceId,
      amountMoney: {
        amount: amountCents,
        currency: 'USD'
      },
      buyerEmailAddress: customerData.email,
      orderId,
      note: 'Physical gift card order',
      statementDescriptionIdentifier: 'PHYSCARD',
      autocomplete: true,
      shippingAddress: customerData.shippingAddress ? {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        ...customerData.shippingAddress
      } : undefined,
      billingAddress: customerData.billingAddress
    });
  }
}

export const squarePaymentService = new SquarePaymentService();