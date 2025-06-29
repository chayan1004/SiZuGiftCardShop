import { storage } from '../storage';
import { InsertMerchantGiftCard, InsertMerchantBulkOrder } from '@shared/schema';
import { Client, Environment } from 'squareup';

interface BulkPurchaseRequest {
  amount: number; // Individual card amount in cents
  quantity: number;
  customMessage?: string;
  logoUrl?: string;
  sourceId: string; // Square payment source
}

interface MerchantTier {
  name: string;
  minQuantity: number;
  maxQuantity: number;
  discountPercentage: number;
}

export class MerchantBulkPurchaseService {
  private squareClient: Client;

  constructor() {
    this.squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox
    });
  }

  /**
   * Get merchant pricing tiers
   */
  static getMerchantTiers(): MerchantTier[] {
    return [
      { name: 'Starter', minQuantity: 1, maxQuantity: 25, discountPercentage: 0 },
      { name: 'Business', minQuantity: 26, maxQuantity: 100, discountPercentage: 5 },
      { name: 'Enterprise', minQuantity: 101, maxQuantity: 500, discountPercentage: 10 },
      { name: 'Corporate', minQuantity: 501, maxQuantity: 10000, discountPercentage: 15 }
    ];
  }

  /**
   * Calculate pricing for bulk purchase
   */
  static calculateBulkPricing(amount: number, quantity: number): {
    tier: MerchantTier;
    subtotal: number;
    discount: number;
    total: number;
    perCardCost: number;
  } {
    const tiers = this.getMerchantTiers();
    const tier = tiers.find(t => quantity >= t.minQuantity && quantity <= t.maxQuantity) || tiers[0];

    const subtotal = amount * quantity;
    const discount = Math.floor(subtotal * (tier.discountPercentage / 100));
    const total = subtotal - discount;
    const perCardCost = Math.floor(total / quantity);

    return {
      tier,
      subtotal,
      discount,
      total,
      perCardCost
    };
  }

  /**
   * Generate unique bulk order ID
   */
  static generateBulkOrderId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique GAN for merchant gift card
   */
  static generateMerchantGAN(): string {
    const prefix = 'MGAN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Process bulk gift card purchase
   */
  async processBulkPurchase(
    merchantId: string, 
    request: BulkPurchaseRequest
  ): Promise<{ success: boolean; bulkOrderId?: string; error?: string; cards?: any[] }> {
    try {
      const { amount, quantity, customMessage, logoUrl, sourceId } = request;

      // Validate input
      if (amount < 500 || amount > 50000) { // $5 to $500
        return { success: false, error: 'Card amount must be between $5 and $500' };
      }

      if (quantity < 1 || quantity > 10000) {
        return { success: false, error: 'Quantity must be between 1 and 10,000' };
      }

      // Calculate pricing
      const pricing = MerchantBulkPurchaseService.calculateBulkPricing(amount, quantity);
      const bulkOrderId = MerchantBulkPurchaseService.generateBulkOrderId();

      console.log(`Processing bulk purchase for merchant ${merchantId}: ${quantity} cards @ $${amount/100} each`);

      // Create bulk order record
      const bulkOrder: InsertMerchantBulkOrder = {
        merchantId,
        bulkOrderId,
        totalAmount: pricing.total,
        quantity,
        cardAmount: amount,
        logoUrl,
        customMessage,
        status: 'PENDING'
      };

      await storage.createMerchantBulkOrder(bulkOrder);

      // Process payment with Square
      const paymentResult = await this.processSquarePayment(sourceId, pricing.total, bulkOrderId);
      if (!paymentResult.success) {
        await storage.updateMerchantBulkOrderStatus(bulkOrderId, 'FAILED');
        return { success: false, error: paymentResult.error };
      }

      // Update bulk order with payment ID
      await storage.updateMerchantBulkOrderPayment(bulkOrderId, paymentResult.paymentId!);

      // Create individual gift cards
      const cards = [];
      for (let i = 0; i < quantity; i++) {
        try {
          const gan = MerchantBulkPurchaseService.generateMerchantGAN();
          
          // Create Square gift card
          const squareResult = await this.createSquareGiftCard(amount, gan);
          if (!squareResult.success) {
            console.warn(`Failed to create Square gift card ${i + 1}/${quantity}: ${squareResult.error}`);
            continue;
          }

          // Store merchant gift card
          const merchantCard: InsertMerchantGiftCard = {
            merchantId,
            gan,
            amount,
            logoUrl,
            customMessage,
            status: 'ACTIVE',
            bulkOrderId,
            squareGiftCardId: squareResult.giftCardId
          };

          const createdCard = await storage.createMerchantGiftCard(merchantCard);
          cards.push({
            id: createdCard.id,
            gan: createdCard.gan,
            amount: createdCard.amount,
            status: createdCard.status,
            formattedAmount: `$${(amount / 100).toFixed(2)}`
          });

          console.log(`Created merchant gift card ${i + 1}/${quantity}: ${gan}`);
        } catch (error) {
          console.error(`Error creating gift card ${i + 1}/${quantity}:`, error);
        }
      }

      // Mark bulk order as completed
      await storage.updateMerchantBulkOrderStatus(bulkOrderId, 'COMPLETED');

      console.log(`Bulk purchase completed: ${cards.length}/${quantity} cards created for merchant ${merchantId}`);

      return {
        success: true,
        bulkOrderId,
        cards
      };

    } catch (error) {
      console.error('Bulk purchase processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process bulk purchase'
      };
    }
  }

  /**
   * Process payment through Square
   */
  private async processSquarePayment(
    sourceId: string, 
    amount: number, 
    bulkOrderId: string
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const paymentsApi = this.squareClient.paymentsApi;

      const createPaymentRequest = {
        sourceId,
        amountMoney: {
          amount: BigInt(amount),
          currency: 'USD'
        },
        idempotencyKey: `bulk_${bulkOrderId}_${Date.now()}`,
        note: `SiZu GiftCard Bulk Purchase - Order ${bulkOrderId}`,
        autocomplete: true
      };

      const response = await paymentsApi.createPayment(createPaymentRequest);
      
      if (response.result.payment?.id) {
        console.log(`Square payment processed: ${response.result.payment.id} for $${amount / 100}`);
        return {
          success: true,
          paymentId: response.result.payment.id
        };
      } else {
        return {
          success: false,
          error: 'Payment processing failed'
        };
      }

    } catch (error) {
      console.error('Square payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Create gift card in Square system
   */
  private async createSquareGiftCard(
    amount: number, 
    gan: string
  ): Promise<{ success: boolean; giftCardId?: string; error?: string }> {
    try {
      const giftCardsApi = this.squareClient.giftCardsApi;

      const createGiftCardRequest = {
        idempotencyKey: `gan_${gan}_${Date.now()}`,
        locationId: process.env.SQUARE_LOCATION_ID,
        giftCard: {
          type: 'DIGITAL',
          ganSource: 'OTHER',
          gan,
          state: 'ACTIVE'
        }
      };

      const response = await giftCardsApi.createGiftCard(createGiftCardRequest);

      if (response.result.giftCard?.id) {
        // Activate the gift card with initial value
        await this.activateSquareGiftCard(response.result.giftCard.id, amount, gan);
        
        return {
          success: true,
          giftCardId: response.result.giftCard.id
        };
      } else {
        return {
          success: false,
          error: 'Failed to create Square gift card'
        };
      }

    } catch (error) {
      console.error('Square gift card creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gift card creation failed'
      };
    }
  }

  /**
   * Activate Square gift card with initial balance
   */
  private async activateSquareGiftCard(
    giftCardId: string, 
    amount: number, 
    gan: string
  ): Promise<void> {
    try {
      const giftCardActivitiesApi = this.squareClient.giftCardActivitiesApi;

      const activateRequest = {
        idempotencyKey: `activate_${gan}_${Date.now()}`,
        giftCardActivity: {
          type: 'ACTIVATE',
          locationId: process.env.SQUARE_LOCATION_ID,
          giftCardId,
          activateActivityDetails: {
            amountMoney: {
              amount: BigInt(amount),
              currency: 'USD'
            }
          }
        }
      };

      await giftCardActivitiesApi.createGiftCardActivity(activateRequest);
      console.log(`Square gift card activated: ${giftCardId} with $${amount / 100}`);

    } catch (error) {
      console.error('Square gift card activation error:', error);
      throw error;
    }
  }

  /**
   * Get merchant's bulk orders
   */
  async getMerchantBulkOrders(merchantId: string): Promise<any[]> {
    try {
      return await storage.getMerchantBulkOrders(merchantId);
    } catch (error) {
      console.error('Error fetching merchant bulk orders:', error);
      return [];
    }
  }

  /**
   * Get merchant's gift cards
   */
  async getMerchantGiftCards(merchantId: string, bulkOrderId?: string): Promise<any[]> {
    try {
      return await storage.getMerchantGiftCards(merchantId, bulkOrderId);
    } catch (error) {
      console.error('Error fetching merchant gift cards:', error);
      return [];
    }
  }
}