import { storage } from '../storage';
import { InsertMerchantBulkOrder, MerchantBulkOrder } from '@shared/schema';

export class MerchantBulkOrderService {
  /**
   * Create a new bulk order for a merchant
   */
  static async createBulkOrder(
    merchantId: number,
    quantity: number,
    unitPrice: number
  ): Promise<MerchantBulkOrder> {
    // Calculate total price server-side
    const totalPrice = quantity * unitPrice;

    const insertOrder: InsertMerchantBulkOrder = {
      merchant_id: merchantId,
      quantity,
      unit_price: unitPrice.toFixed(2),
      total_price: totalPrice.toFixed(2),
      status: 'pending'
    };

    return await storage.createMerchantBulkOrder(insertOrder);
  }

  /**
   * Get all bulk orders for a specific merchant
   */
  static async getBulkOrdersByMerchant(merchantId: number): Promise<MerchantBulkOrder[]> {
    return await storage.getMerchantBulkOrders(merchantId.toString());
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