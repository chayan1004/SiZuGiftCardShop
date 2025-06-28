/**
 * Mock Payment Service for Development Testing
 * Simulates Square payment processing for development purposes
 */

interface MockPaymentRequest {
  sourceId: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  note?: string;
}

interface MockPaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  receiptUrl?: string;
  error?: string;
}

export class MockPaymentService {
  /**
   * Mock payment processing for development
   */
  async processPayment(request: MockPaymentRequest): Promise<MockPaymentResult> {
    console.log('Processing mock payment:', { 
      amount: request.amount, 
      email: request.customerEmail 
    });

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock payment success for valid amounts
    if (request.amount > 0 && request.amount <= 100000) { // Max $1000
      const paymentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const orderId = `mock_order_${Date.now()}`;

      return {
        success: true,
        paymentId,
        orderId,
        receiptUrl: `https://example.com/receipts/${paymentId}`
      };
    }

    return {
      success: false,
      error: 'Invalid payment amount'
    };
  }

  /**
   * Mock order creation
   */
  async createOrder(amount: number, currency = 'USD'): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    const orderId = `mock_order_${Date.now()}`;
    return {
      success: true,
      orderId
    };
  }

  /**
   * Mock payment retrieval
   */
  async getPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: string;
  }> {
    return {
      success: true,
      payment: {
        id: paymentId,
        status: 'COMPLETED',
        amount_money: { amount: 5000, currency: 'USD' },
        created_at: new Date().toISOString()
      }
    };
  }

  /**
   * Mock refund processing
   */
  async refundPayment(paymentId: string, amountCents?: number): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    const refundId = `mock_refund_${Date.now()}`;
    return {
      success: true,
      refundId
    };
  }

  /**
   * Get mock configuration for frontend
   */
  getWebSDKConfig() {
    return {
      applicationId: 'mock-app-id',
      locationId: 'mock-location-id',
      environment: 'mock'
    };
  }
}

export const mockPaymentService = new MockPaymentService();