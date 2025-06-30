import { storage } from "../storage";

export interface PhysicalCardPricingOptions {
  cardType: 'plastic' | 'metal' | 'premium';
  quantity: number;
  denomination: number; // in cents
  customerType: 'merchant' | 'individual';
  customDesign?: boolean;
  shippingMethod?: 'standard' | 'expedited' | 'overnight';
}

export interface PhysicalCardPricing {
  squareBasePrice: number; // Square's cost per card in cents
  adminFeePercentage: number; // Your markup percentage
  adminFeeAmount: number; // Calculated fee amount
  printingCost: number; // Cost for printing/manufacturing
  customDesignFee: number; // Additional fee for custom design
  shippingCost: number; // Shipping cost based on method
  totalPerCard: number; // Total cost per card including all fees
  totalOrder: number; // Total order cost
  breakdown: {
    squareBaseCost: number;
    adminFee: number;
    printing: number;
    customDesign: number;
    shipping: number;
  };
}

export class PhysicalCardPricingService {
  private static readonly CARD_TYPE_COSTS = {
    plastic: 350, // $3.50 in cents
    metal: 850, // $8.50 in cents
    premium: 1250 // $12.50 in cents
  };

  private static readonly SHIPPING_COSTS = {
    standard: 799, // $7.99
    expedited: 1499, // $14.99
    overnight: 2999 // $29.99
  };

  private static readonly CUSTOM_DESIGN_FEE = 2500; // $25.00

  /**
   * Calculate pricing for physical gift cards with admin fee markup
   */
  static async calculatePricing(options: PhysicalCardPricingOptions): Promise<PhysicalCardPricing> {
    // Get current pricing configuration for fee percentages
    const pricingConfig = await storage.getActivePricingConfiguration();
    
    // Determine admin fee percentage based on customer type
    let adminFeePercentage: number;
    if (options.customerType === 'merchant') {
      adminFeePercentage = pricingConfig ? parseFloat(pricingConfig.merchantBuyRate) : 5.0;
    } else {
      adminFeePercentage = pricingConfig ? parseFloat(pricingConfig.individualBuyRate) : 8.0;
    }

    // Base costs
    const squareBasePrice = this.CARD_TYPE_COSTS[options.cardType];
    const printingCost = squareBasePrice; // Same as Square cost for simplicity
    const customDesignFee = options.customDesign ? this.CUSTOM_DESIGN_FEE : 0;
    const shippingCost = this.SHIPPING_COSTS[options.shippingMethod || 'standard'];

    // Calculate per-card costs
    const basePerCard = squareBasePrice + printingCost;
    const adminFeeAmount = Math.round(basePerCard * (adminFeePercentage / 100));
    const totalPerCard = basePerCard + adminFeeAmount + (customDesignFee / options.quantity);

    // Calculate total order cost
    const totalCards = totalPerCard * options.quantity;
    const totalOrder = totalCards + shippingCost;

    return {
      squareBasePrice,
      adminFeePercentage,
      adminFeeAmount,
      printingCost,
      customDesignFee,
      shippingCost,
      totalPerCard,
      totalOrder,
      breakdown: {
        squareBaseCost: squareBasePrice * options.quantity,
        adminFee: adminFeeAmount * options.quantity,
        printing: printingCost * options.quantity,
        customDesign: customDesignFee,
        shipping: shippingCost
      }
    };
  }

  /**
   * Calculate reload pricing with admin fee
   */
  static async calculateReloadPricing(reloadAmount: number, customerType: 'merchant' | 'individual'): Promise<{
    reloadAmount: number;
    adminFeePercentage: number;
    adminFeeAmount: number;
    totalCharged: number;
  }> {
    const pricingConfig = await storage.getActivePricingConfiguration();
    
    // Determine admin fee percentage based on customer type
    let adminFeePercentage: number;
    if (customerType === 'merchant') {
      adminFeePercentage = pricingConfig ? parseFloat(pricingConfig.merchantBuyRate) : 3.0;
    } else {
      adminFeePercentage = pricingConfig ? parseFloat(pricingConfig.individualBuyRate) : 5.0;
    }

    const adminFeeAmount = Math.round(reloadAmount * (adminFeePercentage / 100));
    const totalCharged = reloadAmount + adminFeeAmount;

    return {
      reloadAmount,
      adminFeePercentage,
      adminFeeAmount,
      totalCharged
    };
  }

  /**
   * Get pricing tiers for bulk orders
   */
  static getPricingTiers(cardType: 'plastic' | 'metal' | 'premium', customerType: 'merchant' | 'individual') {
    const basePrice = this.CARD_TYPE_COSTS[cardType];
    const discountMultiplier = customerType === 'merchant' ? 0.9 : 1.0; // 10% discount for merchants

    return [
      {
        minQuantity: 1,
        maxQuantity: 9,
        pricePerCard: Math.round(basePrice * discountMultiplier),
        description: '1-9 cards'
      },
      {
        minQuantity: 10,
        maxQuantity: 49,
        pricePerCard: Math.round(basePrice * 0.95 * discountMultiplier),
        description: '10-49 cards (5% discount)'
      },
      {
        minQuantity: 50,
        maxQuantity: 99,
        pricePerCard: Math.round(basePrice * 0.90 * discountMultiplier),
        description: '50-99 cards (10% discount)'
      },
      {
        minQuantity: 100,
        maxQuantity: 999,
        pricePerCard: Math.round(basePrice * 0.85 * discountMultiplier),
        description: '100+ cards (15% discount)'
      },
      {
        minQuantity: 1000,
        maxQuantity: null,
        pricePerCard: Math.round(basePrice * 0.80 * discountMultiplier),
        description: '1000+ cards (20% discount)'
      }
    ];
  }

  /**
   * Generate a unique card number for physical cards
   */
  static generateCardNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SIZU${timestamp}${random}`;
  }

  /**
   * Estimate delivery date based on shipping method
   */
  static estimateDeliveryDate(shippingMethod: string): Date {
    const now = new Date();
    const businessDays = {
      standard: 7, // 7 business days
      expedited: 3, // 3 business days
      overnight: 1 // 1 business day
    };

    const days = businessDays[shippingMethod as keyof typeof businessDays] || 7;
    
    // Add business days (excluding weekends)
    let deliveryDate = new Date(now);
    let addedDays = 0;
    
    while (addedDays < days) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      // Skip weekends
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return deliveryDate;
  }
}