/**
 * Square Payments API Service - Production Ready Implementation
 * Official Square SDK Integration
 */

import crypto from 'crypto';
import { SquareClient, SquareEnvironment } from 'square';

interface PaymentRequest {
  sourceId: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  buyerEmailAddress?: string;
  orderId?: string;
  note?: string;
  statementDescriptionIdentifier?: string;
  autocomplete?: boolean;
  verificationToken?: string;
}

interface PaymentResponse {
  id: string;
  status: string;
  sourceType: string;
  cardDetails?: any;
  totalMoney: {
    amount: number;
    currency: string;
  };
  orderId?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

class SquarePaymentService {
  private client: SquareClient;
  private accessToken: string;
  private locationId: string;
  private environment: string;

  constructor() {
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    
    // Initialize Square SDK Client
    this.client = new SquareClient({
      environment: this.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox,
      accessToken: this.accessToken
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
   * Create Payment using Square SDK
   */
  async createPayment(paymentRequest: PaymentRequest): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    try {
      const idempotencyKey = this.generateIdempotencyKey();
      
      const requestBody = {
        idempotencyKey,
        sourceId: paymentRequest.sourceId,
        amountMoney: {
          amount: BigInt(paymentRequest.amountMoney.amount),
          currency: paymentRequest.amountMoney.currency
        },
        locationId: this.locationId,
        buyerEmailAddress: paymentRequest.buyerEmailAddress,
        orderId: paymentRequest.orderId,
        note: paymentRequest.note,
        statementDescriptionIdentifier: paymentRequest.statementDescriptionIdentifier,
        autocomplete: paymentRequest.autocomplete,
        verificationToken: paymentRequest.verificationToken
      };

      console.log('Creating payment with Square SDK...');
      const response = await this.client.paymentsApi.createPayment(requestBody);

      if (response.result && response.result.payment) {
        const payment = this.formatPaymentResponse(response.result.payment);
        console.log(`Payment created successfully: ${payment.id}`);
        
        return {
          success: true,
          payment
        };
      }

      return {
        success: false,
        error: 'Failed to create payment'
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
   * Get Payment by ID using Square SDK
   */
  async getPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    error?: string;
  }> {
    try {
      console.log(`Retrieving payment: ${paymentId}`);
      const response = await this.client.paymentsApi.getPayment(paymentId);

      if (response.result && response.result.payment) {
        const payment = this.formatPaymentResponse(response.result.payment);
        return {
          success: true,
          payment
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
   * List Payments using Square SDK
   */
  async listPayments(options: {
    beginTime?: string;
    endTime?: string;
    sortOrder?: string;
    cursor?: string;
    locationId?: string;
    total?: number;
    last4?: string;
    cardBrand?: string;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    payments?: PaymentResponse[];
    cursor?: string;
    error?: string;
  }> {
    try {
      const requestParams = {
        beginTime: options.beginTime,
        endTime: options.endTime,
        sortOrder: options.sortOrder,
        cursor: options.cursor,
        locationId: options.locationId || this.locationId,
        total: options.total ? BigInt(options.total) : undefined,
        last4: options.last4,
        cardBrand: options.cardBrand,
        limit: options.limit
      };

      console.log('Listing payments with filters...');
      const response = await this.client.paymentsApi.listPayments(requestParams);

      if (response.result && response.result.payments) {
        const payments = response.result.payments.map((payment: any) => 
          this.formatPaymentResponse(payment)
        );

        return {
          success: true,
          payments,
          cursor: response.result.cursor
        };
      }

      return {
        success: true,
        payments: []
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
   * Format Square payment response to our interface
   */
  private formatPaymentResponse(payment: any): PaymentResponse {
    return {
      id: payment.id || '',
      status: payment.status || '',
      sourceType: payment.sourceType || '',
      cardDetails: payment.cardDetails,
      totalMoney: {
        amount: parseInt(payment.totalMoney?.amount?.toString() || '0'),
        currency: payment.totalMoney?.currency || 'USD'
      },
      orderId: payment.orderId,
      receiptNumber: payment.receiptNumber,
      receiptUrl: payment.receiptUrl,
      createdAt: payment.createdAt || new Date().toISOString(),
      updatedAt: payment.updatedAt || new Date().toISOString()
    };
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
   * Create payment for physical card purchase
   */
  async createPhysicalCardPayment(
    sourceId: string,
    amountCents: number,
    customerData: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      address?: any;
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
      note: `Physical gift card for ${customerData.firstName} ${customerData.lastName}`,
      statementDescriptionIdentifier: 'PHYSCARD',
      autocomplete: true
    });
  }

  /**
   * Get Web SDK Configuration
   */
  getWebSDKConfig() {
    return {
      applicationId: process.env.VITE_SQUARE_APPLICATION_ID || '',
      locationId: this.locationId,
      environment: this.environment
    };
  }
}

export const squarePaymentService = new SquarePaymentService();