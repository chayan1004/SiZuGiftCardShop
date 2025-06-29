import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  squareApplicationId: text("square_application_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  merchantId: text("merchant_id").notNull().unique(),
  businessName: text("business_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  merchantId: text("merchant_id").notNull(),
  squareGiftCardId: text("square_gift_card_id").notNull().unique(),
  gan: text("gan").notNull().unique(), // Gift card account number
  amount: integer("amount").notNull(), // Amount in cents
  balance: integer("balance").notNull(), // Current balance in cents
  status: text("status").notNull(), // PENDING, ACTIVE, DEACTIVATED
  customerId: text("customer_id"),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  senderName: text("sender_name"),
  personalMessage: text("personal_message"),
  qrCodeData: text("qr_code_data"), // QR code redemption URL
  squareState: text("square_state"), // Square's internal state
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const giftCardActivities = pgTable("gift_card_activities", {
  id: serial("id").primaryKey(),
  giftCardId: integer("gift_card_id").notNull(),
  squareActivityId: text("square_activity_id").notNull().unique(),
  type: text("type").notNull(), // ACTIVATE, REDEEM, ADJUST_INCREMENT, ADJUST_DECREMENT
  amount: integer("amount").notNull(), // Amount in cents
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "percent" | "fixed"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  maxUsage: integer("max_usage"), // null for unlimited
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const promoUsage = pgTable("promo_usage", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").references(() => promoCodes.id).notNull(),
  giftCardId: integer("gift_card_id").references(() => giftCards.id).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  purchaserEmail: text("purchaser_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const merchantGiftCards = pgTable("merchant_gift_cards", {
  id: serial("id").primaryKey(),
  merchantId: text("merchant_id").notNull(),
  gan: text("gan").notNull().unique(),
  amount: integer("amount").notNull(), // Amount in cents
  logoUrl: text("logo_url"),
  customMessage: text("custom_message"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, REDEEMED, EXPIRED
  bulkOrderId: text("bulk_order_id"), // Groups cards from same bulk purchase
  squareGiftCardId: text("square_gift_card_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const merchantBulkOrders = pgTable("merchant_bulk_orders", {
  id: serial("id").primaryKey(),
  merchantId: text("merchant_id").notNull(),
  bulkOrderId: text("bulk_order_id").notNull().unique(),
  totalAmount: integer("total_amount").notNull(), // Total cost in cents
  quantity: integer("quantity").notNull(),
  cardAmount: integer("card_amount").notNull(), // Individual card amount in cents
  logoUrl: text("logo_url"),
  customMessage: text("custom_message"),
  status: text("status").notNull().default("PENDING"), // PENDING, COMPLETED, FAILED
  squarePaymentId: text("square_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardActivitySchema = createInsertSchema(giftCardActivities).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertPromoUsageSchema = createInsertSchema(promoUsage).omit({
  id: true,
  createdAt: true,
});

export const insertMerchantGiftCardSchema = createInsertSchema(merchantGiftCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantBulkOrderSchema = createInsertSchema(merchantBulkOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCardActivity = typeof giftCardActivities.$inferSelect;
export type InsertGiftCardActivity = z.infer<typeof insertGiftCardActivitySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoUsage = typeof promoUsage.$inferSelect;
export type InsertPromoUsage = z.infer<typeof insertPromoUsageSchema>;
export type MerchantGiftCard = typeof merchantGiftCards.$inferSelect;
export type InsertMerchantGiftCard = z.infer<typeof insertMerchantGiftCardSchema>;
export type MerchantBulkOrder = typeof merchantBulkOrders.$inferSelect;
export type InsertMerchantBulkOrder = z.infer<typeof insertMerchantBulkOrderSchema>;
