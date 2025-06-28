import crypto from 'crypto';

class SquarePaymentService {
  private client: any;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.locationId = process.env.SQUARE_LOCATION_ID!;

    if (!process.env.SQUARE_ACCESS_TOKEN || !this.locationId) {
      throw new Error('Square credentials not properly configured');
    }
    
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const squareModule = await import('squareup');
      const SquareUp = squareModule.default || squareModule;
      
      // Initialize with access token and location
      this.client = SquareUp(process.env.SQUARE_ACCESS_TOKEN, this.locationId);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Square client:', error);
      throw new Error('Square SDK initialization failed');
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeClient();
    }
  }

  /**
   * Process payment for gift card purchase
   */
  async processGiftCardPayment(
    sourceId: string,
    amountMoney: number,
    recipientEmail?: string,
    note?: string
  ): Promise<{
    payment: any;
    paymentId: string;
  }> {
    try {
      await this.ensureInitialized();
      const idempotencyKey = crypto.randomUUID();
      
      const request: any = {
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(amountMoney), // Amount in cents
          currency: 'USD'
        },
        locationId: this.locationId,
        ...(note && { note }),
        ...(recipientEmail && {
          buyerEmailAddress: recipientEmail
        })
      };

      const response = await this.client.paymentsApi.createPayment(request);
      
      if (response.result.errors) {
        throw new Error(`Payment Error: ${response.result.errors.map((e: any) => e.detail).join(', ')}`);
      }

      const payment = response.result.payment!;
      
      return {
        payment,
        paymentId: payment.id!
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.client.paymentsApi.getPayment(paymentId);
      
      if (response.result.errors) {
        throw new Error(`Square API Error: ${response.result.errors.map((e: any) => e.detail).join(', ')}`);
      }

      return response.result.payment!;
    } catch (error) {
      console.error('Error retrieving payment:', error);
      throw new Error(`Failed to retrieve payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    amountMoney: number,
    reason?: string
  ): Promise<{
    refundId: string;
    status: string;
  }> {
    try {
      const idempotencyKey = crypto.randomUUID();
      
      const response = await this.client.refundsApi.refundPayment({
        bodyAmountMoney: {
          amount: BigInt(amountMoney),
          currency: 'USD'
        },
        bodyIdempotencyKey: idempotencyKey,
        bodyPaymentId: paymentId,
        ...(reason && { bodyReason: reason })
      });
      
      if (response.result.errors) {
        throw new Error(`Refund Error: ${response.result.errors.map((e: any) => e.detail).join(', ')}`);
      }

      const refund = response.result.refund!;
      
      return {
        refundId: refund.id!,
        status: refund.status!
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(sourceId: string): Promise<boolean> {
    try {
      // Create a minimal payment to validate the payment method
      const testAmount = 100; // $1.00 in cents
      const idempotencyKey = crypto.randomUUID();
      
      const request: any = {
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(testAmount),
          currency: 'USD'
        },
        locationId: this.locationId,
        autocomplete: false // Don't actually charge
      };

      const response = await this.client.paymentsApi.createPayment(request);
      
      if (response.result.errors) {
        return false;
      }

      // Cancel the test payment
      const paymentId = response.result.payment?.id;
      if (paymentId) {
        await this.client.paymentsApi.cancelPayment(paymentId, {});
      }

      return true;
    } catch (error) {
      console.error('Error validating payment method:', error);
      return false;
    }
  }
}

export const squarePaymentService = new SquarePaymentService();