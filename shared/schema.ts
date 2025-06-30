import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid, numeric } from "drizzle-orm/pg-core";
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
  webhookUrl: text("webhook_url"), // General merchant webhook URL
  webhookEnabled: boolean("webhook_enabled").default(false),
  redemptionWebhookUrl: text("redemption_webhook_url"), // Specific redemption webhook URL
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
  redeemed: boolean("redeemed").default(false),
  redeemedAt: timestamp("redeemed_at"),
  redeemedBy: text("redeemed_by"), // Customer email or ID who redeemed
  lastRedemptionAmount: integer("last_redemption_amount"), // Last redemption amount in cents
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

export const merchant_bulk_orders = pgTable("merchant_bulk_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchant_id: integer("merchant_id").notNull().references(() => merchants.id),
  quantity: integer("quantity").notNull(),
  unit_price: numeric("unit_price").notNull(),
  total_price: numeric("total_price").notNull(),
  status: text("status").default("pending"), // pending, fulfilled, failed
  created_at: timestamp("created_at").defaultNow(),
});

export const webhook_delivery_logs = pgTable("webhook_delivery_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: text("merchant_id").notNull(),
  cardId: text("card_id"),
  amount: integer("amount"), // Amount in cents
  status: text("status").notNull(), // success, fail
  errorMessage: text("error_message"),
  responseTimeMs: integer("response_time_ms"),
  payload: text("payload"), // JSON string of webhook payload
  createdAt: timestamp("created_at").defaultNow(),
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

export const merchantBulkOrdersSchema = createInsertSchema(merchant_bulk_orders).omit({
  id: true,
  created_at: true,
});

export const merchantPricingTiers = pgTable("merchant_pricing_tiers", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  minQuantity: integer("min_quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(), // Price in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const merchantBranding = pgTable("merchant_branding", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().unique(),
  logoUrl: text("logo_url"),
  themeColor: text("theme_color").default('#6366f1'),
  tagline: text("tagline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const publicGiftCardOrders = pgTable("public_giftcard_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientEmail: text("recipient_email").notNull(),
  merchantId: text("merchant_id"),
  amount: integer("amount").notNull(), // Amount in cents
  message: text("message"),
  status: text("status").notNull().default('pending'), // pending, issued, failed
  squarePaymentId: text("square_payment_id"),
  giftCardGan: text("gift_card_gan"), // Generated gift card GAN after successful payment
  giftCardId: text("gift_card_id"), // Square gift card ID
  giftCardState: text("gift_card_state"), // Square gift card state (ACTIVE, PENDING, etc.)
  emailSent: boolean("email_sent").notNull().default(false), // Email delivery tracking
  emailSentAt: timestamp("email_sent_at"), // Timestamp when email was successfully sent
  emailResendCount: integer("email_resend_count").notNull().default(0), // Number of times email was resent
  emailLastResendAt: timestamp("email_last_resend_at"), // Last time email was resent
  manuallyMarkedFailed: boolean("manually_marked_failed").notNull().default(false), // Admin marked as failed
  pdfReceiptUrl: text("pdf_receipt_url"), // URL to hosted PDF receipt
  pdfGeneratedAt: timestamp("pdf_generated_at"), // Timestamp when PDF was generated
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPublicGiftCardOrderSchema = createInsertSchema(publicGiftCardOrders).omit({
  id: true,
  createdAt: true,
});

export const insertMerchantPricingTierSchema = createInsertSchema(merchantPricingTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantBrandingSchema = createInsertSchema(merchantBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type MerchantBulkOrder = typeof merchant_bulk_orders.$inferSelect;
export type InsertMerchantBulkOrder = z.infer<typeof merchantBulkOrdersSchema>;
export type PublicGiftCardOrder = typeof publicGiftCardOrders.$inferSelect;
export type InsertPublicGiftCardOrder = z.infer<typeof insertPublicGiftCardOrderSchema>;
export type MerchantPricingTier = typeof merchantPricingTiers.$inferSelect;
export type InsertMerchantPricingTier = z.infer<typeof insertMerchantPricingTierSchema>;
export type MerchantBranding = typeof merchantBranding.$inferSelect;
export type InsertMerchantBranding = z.infer<typeof insertMerchantBrandingSchema>;

// Merchant Card Designs Schema
export const merchantCardDesigns = pgTable("merchant_card_designs", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  designUrl: text("design_url"), // Background image URL
  logoUrl: text("logo_url"), // Logo image URL
  themeColor: text("theme_color").default("#6366f1"), // Primary theme color
  customMessage: text("custom_message"), // Custom text message
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMerchantCardDesignSchema = createInsertSchema(merchantCardDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MerchantCardDesign = typeof merchantCardDesigns.$inferSelect;
export type InsertMerchantCardDesign = z.infer<typeof insertMerchantCardDesignSchema>;

// Fraud Detection Schema
export const fraudLogs = pgTable("fraud_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  gan: text("gan"),
  ipAddress: text("ip_address").notNull(),
  merchantId: text("merchant_id"),
  userAgent: text("user_agent"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFraudLogSchema = createInsertSchema(fraudLogs).omit({
  id: true,
  createdAt: true,
});

export type FraudLog = typeof fraudLogs.$inferSelect;
export type InsertFraudLog = z.infer<typeof insertFraudLogSchema>;

// Auto Defense Rules Schema
export const autoDefenseRules = pgTable("auto_defense_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // 'ip', 'fingerprint', 'merchant'
  value: text("value").notNull(),
  reason: text("reason").notNull(),
  confidence: integer("confidence").default(100), // 0-100 confidence score
  hitCount: integer("hit_count").default(0), // Number of times rule was triggered
  lastTriggered: timestamp("last_triggered"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAutoDefenseRuleSchema = createInsertSchema(autoDefenseRules).omit({
  id: true,
  createdAt: true,
});

export type AutoDefenseRule = typeof autoDefenseRules.$inferSelect;
export type InsertAutoDefenseRule = z.infer<typeof insertAutoDefenseRuleSchema>;

// Card Redemptions Schema
export const cardRedemptions = pgTable("card_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: integer("card_id").notNull(),
  merchantId: text("merchant_id").notNull(),
  giftCardGan: text("gift_card_gan").notNull(),
  amount: integer("amount").notNull(), // Amount redeemed in cents
  ipAddress: text("ip_address"),
  deviceFingerprint: text("device_fingerprint"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCardRedemptionSchema = createInsertSchema(cardRedemptions).omit({
  id: true,
  createdAt: true,
  redeemedAt: true,
});

export type CardRedemption = typeof cardRedemptions.$inferSelect;
export type InsertCardRedemption = z.infer<typeof insertCardRedemptionSchema>;

// Webhook Events Schema - Multi-Event System
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: text("merchant_id").notNull(),
  eventType: text("event_type").notNull(), // gift_card_issued, gift_card_redeemed, gift_card_refunded
  url: text("url").notNull(),
  enabled: boolean("enabled").default(true),
  secret: text("secret").notNull(), // Per-webhook secret for HMAC signing
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;

// Webhook Retry Queue Schema - Phase 16A
export const webhookRetryQueue = pgTable("webhook_retry_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  deliveryId: uuid("delivery_id").notNull(),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at").notNull(),
  lastStatus: text("last_status"), // e.g., "timeout", "500", "network_error"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebhookRetryQueueSchema = createInsertSchema(webhookRetryQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WebhookRetryQueue = typeof webhookRetryQueue.$inferSelect;
export type InsertWebhookRetryQueue = z.infer<typeof insertWebhookRetryQueueSchema>;

// Webhook Failure Log Schema - Phase 16A
export const webhookFailureLog = pgTable("webhook_failure_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  deliveryId: uuid("delivery_id").notNull(),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  failedAt: timestamp("failed_at").defaultNow(),
  resolved: boolean("resolved").default(false),
});

export const insertWebhookFailureLogSchema = createInsertSchema(webhookFailureLog).omit({
  id: true,
  failedAt: true,
});

export type WebhookFailureLog = typeof webhookFailureLog.$inferSelect;
export type InsertWebhookFailureLog = z.infer<typeof insertWebhookFailureLogSchema>;

// Enhanced Webhook Delivery Logs
export const webhookDeliveryLogs = pgTable("webhook_delivery_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: text("merchant_id").notNull(),
  webhookEventId: uuid("webhook_event_id"), // Reference to webhook_events table
  webhookUrl: text("webhook_url").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time_ms"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  deliveredAt: timestamp("delivered_at").defaultNow(),
});

export const insertWebhookDeliveryLogSchema = createInsertSchema(webhookDeliveryLogs).omit({
  id: true,
  deliveredAt: true,
});

export type WebhookDeliveryLog = typeof webhookDeliveryLogs.$inferSelect;
export type InsertWebhookDeliveryLog = z.infer<typeof insertWebhookDeliveryLogSchema>;
