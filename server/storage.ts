import { 
  users, merchants, giftCards, giftCardActivities,
  type User, type InsertUser,
  type Merchant, type InsertMerchant, 
  type GiftCard, type InsertGiftCard,
  type GiftCardActivity, type InsertGiftCardActivity
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Merchant methods
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantBySquareId(merchantId: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchantTokens(id: number, accessToken: string, refreshToken?: string): Promise<Merchant | undefined>;
  
  // Gift Card methods
  getGiftCard(id: number): Promise<GiftCard | undefined>;
  getGiftCardByGan(gan: string): Promise<GiftCard | undefined>;
  getGiftCardsByMerchant(merchantId: string): Promise<GiftCard[]>;
  createGiftCard(giftCard: InsertGiftCard): Promise<GiftCard>;
  updateGiftCardBalance(id: number, balance: number): Promise<GiftCard | undefined>;
  updateGiftCardStatus(id: number, status: string): Promise<GiftCard | undefined>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private merchants: Map<number, Merchant>;
  private giftCards: Map<number, GiftCard>;
  private giftCardActivities: Map<number, GiftCardActivity>;
  private currentUserId: number;
  private currentMerchantId: number;
  private currentGiftCardId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.merchants = new Map();
    this.giftCards = new Map();
    this.giftCardActivities = new Map();
    this.currentUserId = 1;
    this.currentMerchantId = 1;
    this.currentGiftCardId = 1;
    this.currentActivityId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    return this.merchants.get(id);
  }

  async getMerchantBySquareId(merchantId: string): Promise<Merchant | undefined> {
    return Array.from(this.merchants.values()).find(merchant => merchant.merchantId === merchantId);
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    const id = this.currentMerchantId++;
    const merchant: Merchant = { 
      ...insertMerchant, 
      id, 
      isActive: true,
      createdAt: new Date() 
    };
    this.merchants.set(id, merchant);
    return merchant;
  }

  async updateMerchantTokens(id: number, accessToken: string, refreshToken?: string): Promise<Merchant | undefined> {
    const merchant = this.merchants.get(id);
    if (!merchant) return undefined;
    
    const updated = { ...merchant, accessToken, refreshToken };
    this.merchants.set(id, updated);
    return updated;
  }

  async getGiftCard(id: number): Promise<GiftCard | undefined> {
    return this.giftCards.get(id);
  }

  async getGiftCardByGan(gan: string): Promise<GiftCard | undefined> {
    return Array.from(this.giftCards.values()).find(card => card.gan === gan);
  }

  async getGiftCardsByMerchant(merchantId: string): Promise<GiftCard[]> {
    return Array.from(this.giftCards.values()).filter(card => card.merchantId === merchantId);
  }

  async createGiftCard(insertGiftCard: InsertGiftCard): Promise<GiftCard> {
    const id = this.currentGiftCardId++;
    const giftCard: GiftCard = { 
      ...insertGiftCard, 
      id, 
      createdAt: new Date() 
    };
    this.giftCards.set(id, giftCard);
    return giftCard;
  }

  async updateGiftCardBalance(id: number, balance: number): Promise<GiftCard | undefined> {
    const giftCard = this.giftCards.get(id);
    if (!giftCard) return undefined;
    
    const updated = { ...giftCard, balance };
    this.giftCards.set(id, updated);
    return updated;
  }

  async updateGiftCardStatus(id: number, status: string): Promise<GiftCard | undefined> {
    const giftCard = this.giftCards.get(id);
    if (!giftCard) return undefined;
    
    const updated = { ...giftCard, status };
    this.giftCards.set(id, updated);
    return updated;
  }

  async getGiftCardActivities(giftCardId: number): Promise<GiftCardActivity[]> {
    return Array.from(this.giftCardActivities.values()).filter(activity => activity.giftCardId === giftCardId);
  }

  async createGiftCardActivity(insertActivity: InsertGiftCardActivity): Promise<GiftCardActivity> {
    const id = this.currentActivityId++;
    const activity: GiftCardActivity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date() 
    };
    this.giftCardActivities.set(id, activity);
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
    
    const allActivities = Array.from(this.giftCardActivities.values());
    const merchantActivities = allActivities.filter(activity => {
      const card = this.giftCards.get(activity.giftCardId);
      return card && card.merchantId === merchantId;
    });
    
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
        email: card.recipientEmail,
        gan: card.gan,
        createdAt: card.createdAt || new Date()
      });
    });

    // Add redemptions
    const allActivities = Array.from(this.giftCardActivities.values());
    allActivities.forEach(activity => {
      const card = this.giftCards.get(activity.giftCardId);
      if (card && card.merchantId === merchantId && activity.type === 'REDEEM') {
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
}

export const storage = new MemStorage();
