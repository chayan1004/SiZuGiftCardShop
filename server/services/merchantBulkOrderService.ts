import { storage } from '../storage';
import { InsertMerchantBulkOrder, MerchantBulkOrder } from '@shared/schema';

export class MerchantBulkOrderService {
  /**
   * Create a new bulk order for a merchant
   */
  static async createBulkOrder(
    merchantId: string | number,
    quantity: number,
    unitPrice: number
  ): Promise<MerchantBulkOrder> {
    console.log(`Creating bulk order for merchantId: ${merchantId} (type: ${typeof merchantId})`);
    
    // Get merchant by merchantId to get the database ID
    const merchant = typeof merchantId === 'string' 
      ? await storage.getMerchantBySquareId(merchantId)
      : await storage.getMerchant(merchantId);
    
    console.log(`Found merchant:`, merchant);
    
    if (!merchant) {
      throw new Error(`Merchant not found for ID: ${merchantId}`);
    }

    // Calculate total price server-side
    const totalPrice = quantity * unitPrice;

    const insertOrder: InsertMerchantBulkOrder = {
      merchant_id: merchant.id,
      quantity,
      unit_price: unitPrice.toFixed(2),
      total_price: totalPrice.toFixed(2),
      status: 'pending'
    };

    console.log(`Creating bulk order with data:`, insertOrder);

    return await storage.createMerchantBulkOrder(insertOrder);
  }

  /**
   * Get all bulk orders for a specific merchant
   */
  static async getBulkOrdersByMerchant(merchantId: string | number): Promise<MerchantBulkOrder[]> {
    // Get merchant by merchantId to get the database ID
    const merchant = typeof merchantId === 'string' 
      ? await storage.getMerchantBySquareId(merchantId)
      : await storage.getMerchant(merchantId);
    
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    return await storage.getMerchantBulkOrders(merchant.id.toString());
  }

  /**
   * Format bulk order for JSON response
   */
  static formatOrderForResponse(order: MerchantBulkOrder) {
    return {
      id: order.id,
      quantity: order.quantity,
      unit_price: order.unit_price,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at
    };
  }
}