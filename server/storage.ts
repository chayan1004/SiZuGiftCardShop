import { 
  users, merchants, giftCards, giftCardActivities, promoCodes, promoUsage, merchantGiftCards, merchant_bulk_orders, publicGiftCardOrders, merchantPricingTiers, merchantBranding, fraudLogs,
  type User, type InsertUser,
  type Merchant, type InsertMerchant, 
  type GiftCard, type InsertGiftCard,
  type GiftCardActivity, type InsertGiftCardActivity,
  type PromoCode, type InsertPromoCode,
  type PromoUsage, type InsertPromoUsage,
  type MerchantGiftCard, type InsertMerchantGiftCard,
  type MerchantBulkOrder, type InsertMerchantBulkOrder,
  type PublicGiftCardOrder, type InsertPublicGiftCardOrder,
  type MerchantPricingTier, type InsertMerchantPricingTier,
  type MerchantBranding, type InsertMerchantBranding,
  type FraudLog, type InsertFraudLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count, sum, and, gte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Merchant methods
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantBySquareId(merchantId: string): Promise<Merchant | undefined>;
  getMerchantByEmail(email: string): Promise<Merchant | undefined>;
  getMerchantByVerificationToken(token: string): Promise<Merchant | undefined>;
  getAllMerchants(): Promise<Merchant[]>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchantTokens(id: number, accessToken: string, refreshToken?: string): Promise<Merchant | undefined>;
  updateMerchantVerificationToken(id: number, token: string, expiresAt: Date): Promise<Merchant | undefined>;
  markMerchantEmailVerified(id: number): Promise<Merchant | undefined>;

  // Merchant Pricing Tiers methods
  getMerchantPricingTiers(merchantId: number): Promise<MerchantPricingTier[]>;
  createMerchantPricingTier(tier: InsertMerchantPricingTier): Promise<MerchantPricingTier>;
  updateMerchantPricingTier(id: number, tier: Partial<InsertMerchantPricingTier>): Promise<MerchantPricingTier | undefined>;
  deleteMerchantPricingTier(id: number): Promise<boolean>;

  // Merchant Branding methods
  getMerchantBranding(merchantId: number): Promise<MerchantBranding | undefined>;
  createMerchantBranding(branding: InsertMerchantBranding): Promise<MerchantBranding>;
  updateMerchantBranding(merchantId: number, branding: Partial<InsertMerchantBranding>): Promise<MerchantBranding | undefined>;

  // Merchant Bulk Purchase methods
  createMerchantBulkOrder(order: InsertMerchantBulkOrder): Promise<MerchantBulkOrder>;
  getMerchantBulkOrders(merchantId: string): Promise<MerchantBulkOrder[]>;
  updateMerchantBulkOrderStatus(bulkOrderId: string, status: string): Promise<MerchantBulkOrder | undefined>;
  updateMerchantBulkOrderPayment(bulkOrderId: string, paymentId: string): Promise<MerchantBulkOrder | undefined>;
  
  createMerchantGiftCard(card: InsertMerchantGiftCard): Promise<MerchantGiftCard>;
  getMerchantGiftCards(merchantId: string, bulkOrderId?: string): Promise<MerchantGiftCard[]>;
  getMerchantGiftCardByGan(gan: string): Promise<MerchantGiftCard | undefined>;
  
  // Public Gift Card Order methods
  createPublicGiftCardOrder(order: InsertPublicGiftCardOrder): Promise<PublicGiftCardOrder>;
  updatePublicGiftCardOrderStatus(orderId: string, status: string, squarePaymentId?: string, giftCardGan?: string, giftCardId?: string, giftCardState?: string): Promise<PublicGiftCardOrder | undefined>;
  updatePublicGiftCardOrderEmailStatus(orderId: string, emailSent: boolean, emailSentAt?: Date): Promise<PublicGiftCardOrder | undefined>;
  markEmailAsResent(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  markOrderAsFailed(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  updateReceiptUrl(orderId: string, pdfReceiptUrl: string, pdfGeneratedAt?: Date): Promise<PublicGiftCardOrder | undefined>;
  getPublicGiftCardOrderById(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  getAllPublicGiftCardOrders(): Promise<PublicGiftCardOrder[]>;
  validateMerchantById(merchantId: string): Promise<boolean>;
  
  // Gift Card methods
  getGiftCard(id: number): Promise<GiftCard | undefined>;
  getGiftCardByGan(gan: string): Promise<GiftCard | undefined>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  getGiftCardsByMerchant(merchantId: string): Promise<GiftCard[]>;
  createGiftCard(giftCard: InsertGiftCard): Promise<GiftCard>;
  updateGiftCardBalance(id: number, balance: number): Promise<GiftCard | undefined>;
  updateGiftCardStatus(id: number, status: string): Promise<GiftCard | undefined>;
  redeemGiftCard(code: string, redeemedBy: string, amount?: number): Promise<GiftCard | undefined>;
  getGiftCardAnalytics(merchantId?: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalIssued: number;
    totalRedeemed: number;
    totalUnused: number;
    totalValue: number;
    redemptionRate: number;
    dailyStats: Array<{ date: string; issued: number; redeemed: number }>;
    recentRedemptions: Array<{
      gan: string;
      amount: number;
      redeemedBy: string;
      redeemedAt: Date;
      recipientEmail?: string;
    }>;
  }>;
  
  // Gift Card Activity methods
  getGiftCardActivities(giftCardId: number): Promise<GiftCardActivity[]>;
  createGiftCardActivity(activity: InsertGiftCardActivity): Promise<GiftCardActivity>;
  
  // Analytics methods
  getMerchantStats(merchantId: string): Promise<{
    totalSales: number;
    activeCards: number;
    redemptions: number;
    customers: number;
  }>;
  getRecentTransactions(merchantId: string, limit?: number): Promise<Array<{
    type: string;
    amount: number;
    email?: string;
    gan?: string;
    createdAt: Date;
  }>>;
  
  // Admin dashboard analytics
  getGiftCardSummary(): Promise<{
    total: number;
    active: number;
    redeemed: number;
    totalValue: number;
    averageValue: number;
  }>;
  getWeeklyRevenue(): Promise<Array<{
    week: string;
    revenue: number;
    giftCardsSold: number;
  }>>;

  // Fraud Detection methods
  createFraudLog(fraudLog: InsertFraudLog): Promise<FraudLog>;
  getFraudLogsByIP(ipAddress: string, timeWindowMinutes?: number): Promise<FraudLog[]>;
  getFraudLogsByGAN(gan: string): Promise<FraudLog[]>;
  getFraudLogsByMerchant(merchantId: string, timeWindowMinutes?: number): Promise<FraudLog[]>;
  getRecentFraudLogs(limit?: number): Promise<FraudLog[]>;

  // Promo Code methods
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  getPromoCodeById(id: number): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCodeUsage(id: number, increment: number): Promise<PromoCode | undefined>;
  recordPromoUsage(usage: InsertPromoUsage): Promise<PromoUsage>;
  getPromoUsageByCode(promoCodeId: number): Promise<PromoUsage[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant || undefined;
  }

  async getMerchantBySquareId(merchantId: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.merchantId, merchantId));
    return merchant || undefined;
  }

  async getMerchantByEmail(email: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.email, email));
    return merchant || undefined;
  }

  async getMerchantByVerificationToken(token: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.emailVerificationToken, token));
    return merchant || undefined;
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    const [merchant] = await db
      .insert(merchants)
      .values(insertMerchant)
      .returning();
    return merchant;
  }

  async updateMerchantTokens(id: number, accessToken: string, refreshToken?: string): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set({ accessToken, refreshToken: refreshToken || null })
      .where(eq(merchants.id, id))
      .returning();
    return merchant || undefined;
  }

  async updateMerchantVerificationToken(id: number, token: string, expiresAt: Date): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt
      })
      .where(eq(merchants.id, id))
      .returning();
    return merchant || undefined;
  }

  async markMerchantEmailVerified(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      })
      .where(eq(merchants.id, id))
      .returning();
    return merchant || undefined;
  }

  // Merchant Pricing Tiers methods
  async getMerchantPricingTiers(merchantId: number): Promise<MerchantPricingTier[]> {
    const tiers = await db
      .select()
      .from(merchantPricingTiers)
      .where(eq(merchantPricingTiers.merchantId, merchantId))
      .orderBy(merchantPricingTiers.minQuantity);
    return tiers;
  }

  async createMerchantPricingTier(insertTier: InsertMerchantPricingTier): Promise<MerchantPricingTier> {
    const [tier] = await db
      .insert(merchantPricingTiers)
      .values(insertTier)
      .returning();
    return tier;
  }

  async updateMerchantPricingTier(id: number, updateData: Partial<InsertMerchantPricingTier>): Promise<MerchantPricingTier | undefined> {
    const [tier] = await db
      .update(merchantPricingTiers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(merchantPricingTiers.id, id))
      .returning();
    return tier || undefined;
  }

  async deleteMerchantPricingTier(id: number): Promise<boolean> {
    const result = await db
      .delete(merchantPricingTiers)
      .where(eq(merchantPricingTiers.id, id));
    return result.rowCount > 0;
  }

  // Merchant Branding methods
  async getMerchantBranding(merchantId: number): Promise<MerchantBranding | undefined> {
    const [branding] = await db
      .select()
      .from(merchantBranding)
      .where(eq(merchantBranding.merchantId, merchantId));
    return branding || undefined;
  }

  async createMerchantBranding(insertBranding: InsertMerchantBranding): Promise<MerchantBranding> {
    const [branding] = await db
      .insert(merchantBranding)
      .values(insertBranding)
      .returning();
    return branding;
  }

  async updateMerchantBranding(merchantId: number, updateData: Partial<InsertMerchantBranding>): Promise<MerchantBranding | undefined> {
    const [branding] = await db
      .update(merchantBranding)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(merchantBranding.merchantId, merchantId))
      .returning();
    return branding || undefined;
  }

  async getGiftCard(id: number): Promise<GiftCard | undefined> {
    const [giftCard] = await db.select().from(giftCards).where(eq(giftCards.id, id));
    return giftCard || undefined;
  }

  async getGiftCardByGan(gan: string): Promise<GiftCard | undefined> {
    const [giftCard] = await db.select().from(giftCards).where(eq(giftCards.gan, gan));
    return giftCard || undefined;
  }

  async getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
    // Use GAN as code for Square gift cards
    const [giftCard] = await db.select().from(giftCards).where(eq(giftCards.gan, code));
    return giftCard || undefined;
  }

  async redeemGiftCard(code: string, redeemedBy: string, amount?: number): Promise<GiftCard | undefined> {
    const [updated] = await db
      .update(giftCards)
      .set({ 
        redeemed: true, 
        redeemedAt: new Date(), 
        redeemedBy,
        lastRedemptionAmount: amount || 0,
        updatedAt: new Date()
      })
      .where(eq(giftCards.gan, code))
      .returning();
    return updated || undefined;
  }

  async getGiftCardAnalytics(merchantId?: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalIssued: number;
    totalRedeemed: number;
    totalUnused: number;
    totalValue: number;
    redemptionRate: number;
    dailyStats: Array<{ date: string; issued: number; redeemed: number }>;
    recentRedemptions: Array<{
      gan: string;
      amount: number;
      redeemedBy: string;
      redeemedAt: Date;
      recipientEmail?: string;
    }>;
  }> {
    let giftCardQuery = db.select().from(giftCards);
    
    if (merchantId) {
      giftCardQuery = giftCardQuery.where(eq(giftCards.merchantId, merchantId));
    }
    
    if (dateRange) {
      giftCardQuery = giftCardQuery.where(
        and(
          sql`${giftCards.createdAt} >= ${dateRange.start}`,
          sql`${giftCards.createdAt} <= ${dateRange.end}`
        )
      );
    }
    
    const allCards = await giftCardQuery;
    
    const totalIssued = allCards.length;
    const redeemedCards = allCards.filter(card => card.redeemed);
    const totalRedeemed = redeemedCards.length;
    const totalUnused = totalIssued - totalRedeemed;
    const totalValue = allCards.reduce((sum, card) => sum + card.amount, 0);
    const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;
    
    // Generate daily stats for the last 30 days
    const dailyStats: Array<{ date: string; issued: number; redeemed: number }> = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayIssued = allCards.filter(card => 
        card.createdAt && card.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayRedeemed = allCards.filter(card => 
        card.redeemedAt && card.redeemedAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      dailyStats.push({ date: dateStr, issued: dayIssued, redeemed: dayRedeemed });
    }
    
    // Get recent redemptions (last 20)
    const recentRedemptions = redeemedCards
      .filter(card => card.redeemedAt && card.redeemedBy)
      .sort((a, b) => (b.redeemedAt?.getTime() || 0) - (a.redeemedAt?.getTime() || 0))
      .slice(0, 20)
      .map(card => ({
        gan: card.gan,
        amount: card.lastRedemptionAmount || card.amount,
        redeemedBy: card.redeemedBy!,
        redeemedAt: card.redeemedAt!,
        recipientEmail: card.recipientEmail || undefined
      }));
    
    return {
      totalIssued,
      totalRedeemed,
      totalUnused,
      totalValue: Math.floor(totalValue / 100), // Convert cents to dollars
      redemptionRate: Math.round(redemptionRate * 100) / 100,
      dailyStats,
      recentRedemptions
    };
  }

  async getGiftCardsByMerchant(merchantId: string): Promise<GiftCard[]> {
    const cards = await db.select().from(giftCards).where(eq(giftCards.merchantId, merchantId));
    return cards;
  }

  async createGiftCard(insertGiftCard: InsertGiftCard): Promise<GiftCard> {
    const [giftCard] = await db
      .insert(giftCards)
      .values(insertGiftCard)
      .returning();
    return giftCard;
  }

  async updateGiftCardBalance(id: number, balance: number): Promise<GiftCard | undefined> {
    const [giftCard] = await db
      .update(giftCards)
      .set({ balance })
      .where(eq(giftCards.id, id))
      .returning();
    return giftCard || undefined;
  }

  async updateGiftCardStatus(id: number, status: string): Promise<GiftCard | undefined> {
    const [giftCard] = await db
      .update(giftCards)
      .set({ status })
      .where(eq(giftCards.id, id))
      .returning();
    return giftCard || undefined;
  }

  async getGiftCardActivities(giftCardId: number): Promise<GiftCardActivity[]> {
    const activities = await db.select().from(giftCardActivities).where(eq(giftCardActivities.giftCardId, giftCardId));
    return activities;
  }

  async createGiftCardActivity(insertActivity: InsertGiftCardActivity): Promise<GiftCardActivity> {
    const [activity] = await db
      .insert(giftCardActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getMerchantStats(merchantId: string): Promise<{
    totalSales: number;
    activeCards: number;
    redemptions: number;
    customers: number;
  }> {
    const merchantCards = await this.getGiftCardsByMerchant(merchantId);
    const totalSales = merchantCards.reduce((sum, card) => sum + card.amount, 0);
    const activeCards = merchantCards.filter(card => card.status === 'ACTIVE').length;
    
    const allActivities = await db.select().from(giftCardActivities);
    const merchantActivities = [];
    
    for (const activity of allActivities) {
      const card = merchantCards.find(c => c.id === activity.giftCardId);
      if (card) {
        merchantActivities.push(activity);
      }
    }
    
    const redemptions = merchantActivities.filter(activity => activity.type === 'REDEEM').length;
    const uniqueEmails = new Set(merchantCards.filter(card => card.recipientEmail).map(card => card.recipientEmail));
    const customers = uniqueEmails.size;

    return {
      totalSales: Math.floor(totalSales / 100), // Convert cents to dollars
      activeCards,
      redemptions,
      customers
    };
  }

  async getRecentTransactions(merchantId: string, limit = 10): Promise<Array<{
    type: string;
    amount: number;
    email?: string;
    gan?: string;
    createdAt: Date;
  }>> {
    const merchantCards = await this.getGiftCardsByMerchant(merchantId);
    const transactions: Array<{
      type: string;
      amount: number;
      email?: string;
      gan?: string;
      createdAt: Date;
    }> = [];

    // Add gift card purchases
    merchantCards.forEach(card => {
      transactions.push({
        type: 'PURCHASE',
        amount: card.amount,
        email: card.recipientEmail ? card.recipientEmail : undefined,
        gan: card.gan,
        createdAt: card.createdAt || new Date()
      });
    });

    // Add redemptions
    const allActivities = await db.select().from(giftCardActivities);
    allActivities.forEach(activity => {
      const card = merchantCards.find(c => c.id === activity.giftCardId);
      if (card && activity.type === 'REDEEM') {
        transactions.push({
          type: 'REDEEM',
          amount: activity.amount,
          gan: card.gan,
          createdAt: activity.createdAt || new Date()
        });
      }
    });

    return transactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getAllMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants);
  }

  async getGiftCardSummary(): Promise<{
    total: number;
    active: number;
    redeemed: number;
    totalValue: number;
    averageValue: number;
  }> {
    const allCards = await db.select().from(giftCards);
    const allActivities = await db.select().from(giftCardActivities);

    const total = allCards.length;
    const totalValue = allCards.reduce((sum, card) => sum + card.amount, 0);
    const averageValue = total > 0 ? totalValue / total : 0;

    // Count redeemed cards (cards with redemption activities)
    const redeemedCardIds = new Set(
      allActivities
        .filter(activity => activity.type === 'REDEEM')
        .map(activity => activity.giftCardId)
    );
    const redeemed = redeemedCardIds.size;
    const active = total - redeemed;

    return {
      total,
      active,
      redeemed,
      totalValue: totalValue / 100, // Convert from cents to dollars
      averageValue: averageValue / 100 // Convert from cents to dollars
    };
  }

  async getWeeklyRevenue(): Promise<Array<{
    week: string;
    revenue: number;
    giftCardsSold: number;
  }>> {
    const allCards = await db.select().from(giftCards);
    
    // Group by week
    const weeklyData = new Map<string, { revenue: number; count: number }>();
    
    allCards.forEach(card => {
      const date = card.createdAt || new Date();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const existing = weeklyData.get(weekKey) || { revenue: 0, count: 0 };
      existing.revenue += card.amount / 100; // Convert from cents
      existing.count += 1;
      weeklyData.set(weekKey, existing);
    });

    // Convert to array and sort by week
    const result = Array.from(weeklyData.entries())
      .sort(([weekA], [weekB]) => new Date(weekA).getTime() - new Date(weekB).getTime())
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: data.revenue,
        giftCardsSold: data.count
      }))
      .slice(-8); // Last 8 weeks

    // If no data, return empty array (charts will handle this)
    return result;
  }

  // Promo Code methods
  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.code, code));
    return promoCode || undefined;
  }

  async getPromoCodeById(id: number): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    return promoCode || undefined;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async createPromoCode(insertPromoCode: InsertPromoCode): Promise<PromoCode> {
    const [promoCode] = await db
      .insert(promoCodes)
      .values(insertPromoCode)
      .returning();
    return promoCode;
  }

  async updatePromoCodeUsage(id: number, increment: number): Promise<PromoCode | undefined> {
    const [updated] = await db
      .update(promoCodes)
      .set({ 
        usageCount: sql`${promoCodes.usageCount} + ${increment}`,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, id))
      .returning();
    return updated || undefined;
  }

  async recordPromoUsage(insertUsage: InsertPromoUsage): Promise<PromoUsage> {
    const [usage] = await db
      .insert(promoUsage)
      .values(insertUsage)
      .returning();
    return usage;
  }

  async getPromoUsageByCode(promoCodeId: number): Promise<PromoUsage[]> {
    return await db
      .select()
      .from(promoUsage)
      .where(eq(promoUsage.promoCodeId, promoCodeId))
      .orderBy(desc(promoUsage.createdAt));
  }

  // Merchant Bulk Purchase methods
  async createMerchantBulkOrder(insertOrder: InsertMerchantBulkOrder): Promise<MerchantBulkOrder> {
    const [order] = await db
      .insert(merchant_bulk_orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getMerchantBulkOrders(merchantId: string): Promise<MerchantBulkOrder[]> {
    return await db
      .select()
      .from(merchant_bulk_orders)
      .where(eq(merchant_bulk_orders.merchant_id, parseInt(merchantId)))
      .orderBy(desc(merchant_bulk_orders.created_at));
  }

  async updateMerchantBulkOrderStatus(bulkOrderId: string, status: string): Promise<MerchantBulkOrder | undefined> {
    const [order] = await db
      .update(merchant_bulk_orders)
      .set({ status })
      .where(eq(merchant_bulk_orders.id, bulkOrderId))
      .returning();
    return order || undefined;
  }

  async updateMerchantBulkOrderPayment(bulkOrderId: string, paymentId: string): Promise<MerchantBulkOrder | undefined> {
    const [order] = await db
      .update(merchant_bulk_orders)
      .set({ status: 'fulfilled' })
      .where(eq(merchant_bulk_orders.id, bulkOrderId))
      .returning();
    return order || undefined;
  }

  async createMerchantGiftCard(insertCard: InsertMerchantGiftCard): Promise<MerchantGiftCard> {
    const [card] = await db
      .insert(merchantGiftCards)
      .values(insertCard)
      .returning();
    return card;
  }

  async getMerchantGiftCards(merchantId: string, bulkOrderId?: string): Promise<MerchantGiftCard[]> {
    if (bulkOrderId) {
      return await db
        .select()
        .from(merchantGiftCards)
        .where(and(
          eq(merchantGiftCards.merchantId, merchantId),
          eq(merchantGiftCards.bulkOrderId, bulkOrderId)
        ))
        .orderBy(desc(merchantGiftCards.createdAt));
    }

    return await db
      .select()
      .from(merchantGiftCards)
      .where(eq(merchantGiftCards.merchantId, merchantId))
      .orderBy(desc(merchantGiftCards.createdAt));
  }

  async getMerchantGiftCardByGan(gan: string): Promise<MerchantGiftCard | undefined> {
    const [card] = await db
      .select()
      .from(merchantGiftCards)
      .where(eq(merchantGiftCards.gan, gan));
    return card || undefined;
  }

  // Public Gift Card Order methods
  async createPublicGiftCardOrder(insertOrder: InsertPublicGiftCardOrder): Promise<PublicGiftCardOrder> {
    const [order] = await db
      .insert(publicGiftCardOrders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updatePublicGiftCardOrderStatus(orderId: string, status: string, squarePaymentId?: string, giftCardGan?: string, giftCardId?: string, giftCardState?: string): Promise<PublicGiftCardOrder | undefined> {
    const updateData: any = { status };
    if (squarePaymentId) updateData.squarePaymentId = squarePaymentId;
    if (giftCardGan) updateData.giftCardGan = giftCardGan;
    if (giftCardId) updateData.giftCardId = giftCardId;
    if (giftCardState) updateData.giftCardState = giftCardState;

    const [updated] = await db
      .update(publicGiftCardOrders)
      .set(updateData)
      .where(eq(publicGiftCardOrders.id, orderId))
      .returning();
    return updated || undefined;
  }

  async updatePublicGiftCardOrderEmailStatus(orderId: string, emailSent: boolean, emailSentAt?: Date): Promise<PublicGiftCardOrder | undefined> {
    const updateData: any = { emailSent };
    if (emailSentAt) updateData.emailSentAt = emailSentAt;

    const [updated] = await db
      .update(publicGiftCardOrders)
      .set(updateData)
      .where(eq(publicGiftCardOrders.id, orderId))
      .returning();
    return updated || undefined;
  }

  async markEmailAsResent(orderId: string): Promise<PublicGiftCardOrder | undefined> {
    const [updated] = await db
      .update(publicGiftCardOrders)
      .set({ 
        emailResendCount: sql`${publicGiftCardOrders.emailResendCount} + 1`,
        emailLastResendAt: new Date()
      })
      .where(eq(publicGiftCardOrders.id, orderId))
      .returning();
    return updated || undefined;
  }

  async markOrderAsFailed(orderId: string): Promise<PublicGiftCardOrder | undefined> {
    const [updated] = await db
      .update(publicGiftCardOrders)
      .set({ 
        status: 'failed',
        manuallyMarkedFailed: true
      })
      .where(eq(publicGiftCardOrders.id, orderId))
      .returning();
    return updated || undefined;
  }

  async updateReceiptUrl(orderId: string, pdfReceiptUrl: string, pdfGeneratedAt?: Date): Promise<PublicGiftCardOrder | undefined> {
    const updateData: any = { pdfReceiptUrl };
    if (pdfGeneratedAt) {
      updateData.pdfGeneratedAt = pdfGeneratedAt;
    }

    const [updated] = await db
      .update(publicGiftCardOrders)
      .set(updateData)
      .where(eq(publicGiftCardOrders.id, orderId))
      .returning();
    return updated || undefined;
  }

  async getPublicGiftCardOrderById(orderId: string): Promise<PublicGiftCardOrder | undefined> {
    const [order] = await db
      .select()
      .from(publicGiftCardOrders)
      .where(eq(publicGiftCardOrders.id, orderId));
    return order || undefined;
  }

  async getAllPublicGiftCardOrders(): Promise<PublicGiftCardOrder[]> {
    return await db
      .select()
      .from(publicGiftCardOrders)
      .orderBy(desc(publicGiftCardOrders.createdAt));
  }

  async validateMerchantById(merchantId: string): Promise<boolean> {
    const [merchant] = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.merchantId, merchantId))
      .limit(1);
    return !!merchant;
  }

  // Fraud Detection methods
  async createFraudLog(insertFraudLog: InsertFraudLog): Promise<FraudLog> {
    const [fraudLog] = await db
      .insert(fraudLogs)
      .values(insertFraudLog)
      .returning();
    return fraudLog;
  }

  async getFraudLogsByIP(ipAddress: string, timeWindowMinutes = 60): Promise<FraudLog[]> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return await db
      .select()
      .from(fraudLogs)
      .where(and(
        eq(fraudLogs.ipAddress, ipAddress),
        gte(fraudLogs.createdAt, cutoffTime)
      ))
      .orderBy(desc(fraudLogs.createdAt));
  }

  async getFraudLogsByGAN(gan: string): Promise<FraudLog[]> {
    return await db
      .select()
      .from(fraudLogs)
      .where(eq(fraudLogs.gan, gan))
      .orderBy(desc(fraudLogs.createdAt));
  }

  async getFraudLogsByMerchant(merchantId: string, timeWindowMinutes = 300): Promise<FraudLog[]> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return await db
      .select()
      .from(fraudLogs)
      .where(and(
        eq(fraudLogs.merchantId, merchantId),
        gte(fraudLogs.createdAt, cutoffTime)
      ))
      .orderBy(desc(fraudLogs.createdAt));
  }

  async getRecentFraudLogs(limit = 50): Promise<FraudLog[]> {
    return await db
      .select()
      .from(fraudLogs)
      .orderBy(desc(fraudLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
