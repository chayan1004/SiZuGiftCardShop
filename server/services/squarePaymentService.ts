/**
 * Square Payment Processing Service
 * Handles secure payment processing for gift card purchases
 */

interface PaymentRequest {
  sourceId: string; // Payment token from Square Web SDK
  amount: number; // Amount in cents
  currency?: string;
  customerEmail?: string;
  note?: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  receiptUrl?: string;
  error?: string;
}

export class SquarePaymentService {
  private baseUrl: string;
  private accessToken: string;
  private locationId: string;
  private applicationId: string;
  private environment: string;

  constructor() {
    this.baseUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';
    
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN!;
    this.locationId = process.env.SQUARE_LOCATION_ID!;
    this.applicationId = process.env.SQUARE_APPLICATION_ID!;
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    if (!this.accessToken || !this.locationId || !this.applicationId) {
      throw new Error('Square payment configuration missing. Please check your environment variables.');
    }
  }

  /**
   * Process a payment for gift card purchase
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const idempotencyKey = this.generateIdempotencyKey();
      
      const paymentRequest = {
        idempotency_key: idempotencyKey,
        amount_money: {
          amount: request.amount,
          currency: request.currency || 'USD'
        },
        source_id: request.sourceId,
        location_id: this.locationId,
        note: request.note || 'Gift card purchase',
        app_fee_money: {
          amount: 0, // No app fee for now
          currency: request.currency || 'USD'
        }
      };

      console.log('Processing payment:', { 
        amount: request.amount, 
        currency: request.currency,
        locationId: this.locationId 
      });

      const response = await fetch(`${this.baseUrl}/v2/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(paymentRequest)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Payment failed: ${responseData.errors?.[0]?.detail || 'Unknown error'}`
        };
      }

      if (responseData.payment) {
        const payment = responseData.payment;
        
        return {
          success: true,
          paymentId: payment.id,
          orderId: payment.order_id,
          receiptUrl: payment.receipt_url
        };
      }

      return {
        success: false,
        error: 'Payment processing failed - no payment returned'
      };

    } catch (error) {
      console.error('Square payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing payment'
      };
    }
  }

  /**
   * Create a payment order for gift card
   */
  async createOrder(amount: number, currency = 'USD'): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    try {
      const orderRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        order: {
          location_id: this.locationId,
          line_items: [
            {
              name: 'SiZu Gift Card',
              quantity: '1',
              item_type: 'ITEM',
              base_price_money: {
                amount: amount,
                currency: currency
              }
            }
          ]
        }
      };

      const response = await fetch(`${this.baseUrl}/v2/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(orderRequest)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Order creation failed: ${responseData.errors?.[0]?.detail || 'Unknown error'}`
        };
      }

      return {
        success: true,
        orderId: responseData.order?.id
      };

    } catch (error) {
      console.error('Square order creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating order'
      };
    }
  }

  /**
   * Get payment details by payment ID
   */
  async getPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Square-Version': '2023-10-18'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get payment: ${responseData.errors?.[0]?.detail || 'Unknown error'}`
        };
      }

      return {
        success: true,
        payment: responseData.payment
      };

    } catch (error) {
      console.error('Square get payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting payment'
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amountCents?: number): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      const refundRequest: any = {
        idempotency_key: this.generateIdempotencyKey(),
        payment_id: paymentId
      };

      if (amountCents) {
        refundRequest.amount_money = {
          amount: amountCents,
          currency: 'USD'
        };
      }

      const response = await fetch(`${this.baseUrl}/v2/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(refundRequest)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Refund failed: ${responseData.errors?.[0]?.detail || 'Unknown error'}`
        };
      }

      return {
        success: true,
        refundId: responseData.refund?.id
      };

    } catch (error) {
      console.error('Square refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing refund'
      };
    }
  }

  /**
   * Generate unique idempotency key for Square API calls
   */
  private generateIdempotencyKey(): string {
    return `giftcard_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get Square Web SDK configuration
   */
  getWebSDKConfig() {
    return {
      applicationId: this.applicationId,
      locationId: this.locationId,
      environment: this.environment
    };
  }
}

export const squarePaymentService = new SquarePaymentService();