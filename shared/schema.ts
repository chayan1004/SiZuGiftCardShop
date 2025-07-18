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
  // Phase 17A: Enhanced merchant settings
  themeColor: text("theme_color").default("#613791"),
  supportEmail: text("support_email"),
  brandName: text("brand_name"),
  // GDPR Compliance Fields
  gdprConsent: boolean("gdpr_consent").default(false),
  gdprConsentDate: timestamp("gdpr_consent_date"),
  marketingConsent: boolean("marketing_consent").default(false),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  privacyPolicyAccepted: boolean("privacy_policy_accepted").default(false),
  privacyPolicyVersion: text("privacy_policy_version"),
  lastDataExportRequest: timestamp("last_data_export_request"),
  dataRetentionPeriod: integer("data_retention_period").default(2555), // Days (7 years default)
  createdAt: timestamp("created_at").defaultNow(),
});

// Square Cards API - Customer Payment Profiles
export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  squareCustomerId: text("square_customer_id").unique(), // Square Customer ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Square Cards API - Stored Payment Methods (Card-on-File)
export const savedCards = pgTable("saved_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customerProfiles.id, { onDelete: 'cascade' }),
  squareCardId: text("square_card_id").notNull().unique(), // Square Card-on-File ID
  cardBrand: text("card_brand"), // VISA, MASTERCARD, etc.
  last4: text("last_4"), // Last 4 digits for display
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  cardType: text("card_type"), // CREDIT, DEBIT
  fingerprint: text("fingerprint"), // Unique card fingerprint
  billingAddress: text("billing_address"), // JSON string of address
  cardNickname: text("card_nickname"), // User-friendly name
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Square Cards API - Card Tokenization Events
export const cardTokenEvents = pgTable("card_token_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customerProfiles.id),
  savedCardId: uuid("saved_card_id").references(() => savedCards.id),
  tokenType: text("token_type").notNull(), // PAYMENT_TOKEN, CARD_NONCE
  tokenId: text("token_id").notNull(),
  usageType: text("usage_type").notNull(), // GIFT_CARD_PURCHASE, RECURRING_PAYMENT
  amount: integer("amount"), // Amount in cents
  currency: text("currency").default("USD"),
  status: text("status").notNull(), // CREATED, USED, EXPIRED
  expiresAt: timestamp("expires_at"),
  usedAt: timestamp("used_at"),
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
  // Phase 21B: Enhanced public storefront fields
  publicVisible: boolean("public_visible").default(true),
  cardDesignTheme: text("card_design_theme").default("classic"),
  giftCategory: text("gift_category").default("general"), // Gaming, Food, Event Gifts, Productivity, Wellness
  occasionTag: text("occasion_tag"), // Christmas, Birthday, Graduation, Valentine's
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
  senderName: text("sender_name"), // Person purchasing the gift card
  recipientName: text("recipient_name"), // Person receiving the gift card
  isGift: boolean("is_gift").default(false), // Whether this is a gift or self-purchase
  emailSent: boolean("email_sent").notNull().default(false), // Email delivery tracking
  emailSentAt: timestamp("email_sent_at"), // Timestamp when email was successfully sent
  emailResendCount: integer("email_resend_count").notNull().default(0), // Number of times email was resent
  emailLastResendAt: timestamp("email_last_resend_at"), // Last time email was resent
  manuallyMarkedFailed: boolean("manually_marked_failed").notNull().default(false), // Admin marked as failed
  pdfReceiptUrl: text("pdf_receipt_url"), // URL to hosted PDF receipt
  pdfGeneratedAt: timestamp("pdf_generated_at"), // Timestamp when PDF was generated
  // Interactive Gifting Workflow Fields
  emotionTheme: text("emotion_theme"), // love, celebration, gratitude, friendship, achievement, comfort
  giftOccasion: text("gift_occasion"), // birthday, anniversary, graduation, holiday, just_because
  personalizedDesign: text("personalized_design"), // JSON string with design preferences
  deliveryDate: timestamp("delivery_date"), // Scheduled delivery date
  isScheduled: boolean("is_scheduled").default(false), // Whether delivery is scheduled
  giftWrapStyle: text("gift_wrap_style"), // elegant, festive, minimal, romantic, playful
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
  deviceFingerprint: text("device_fingerprint"),
  threatType: text("threat_type").default("unknown"),
  metadata: text("metadata"), // JSON string for additional threat data
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

// Webhook Retry Queue Schema - Phase 16B Enhanced
export const webhookRetryQueue = pgTable("webhook_retry_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  deliveryId: uuid("delivery_id").notNull(),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at").notNull(),
  lastStatus: text("last_status"), // e.g., "timeout", "500", "network_error"
  manualRetryCount: integer("manual_retry_count").default(0),
  lastManualRetryStatus: text("last_manual_retry_status"),
  replayedAt: timestamp("replayed_at"),
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

// Webhook Failure Log Schema - Phase 16B Enhanced
export const webhookFailureLog = pgTable("webhook_failure_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  deliveryId: uuid("delivery_id").notNull(),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  requestHeaders: text("request_headers"), // JSON string
  requestBody: text("request_body"),
  responseHeaders: text("response_headers"), // JSON string
  responseBody: text("response_body"),
  responseStatus: integer("response_status"),
  manualRetryCount: integer("manual_retry_count").default(0),
  lastManualRetryStatus: text("last_manual_retry_status"),
  replayedAt: timestamp("replayed_at"),
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

// Phase 17A: Merchant API Keys Management
export const merchantApiKeys = pgTable("merchant_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: text("merchant_id").notNull().references(() => merchants.merchantId),
  keyHash: text("key_hash").notNull(), // Store hashed API key for security
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for display
  name: text("name"), // Optional user-defined name for the key
  lastUsedAt: timestamp("last_used_at"),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchantApiKeySchema = createInsertSchema(merchantApiKeys).omit({
  id: true,
  createdAt: true,
});

export type MerchantApiKey = typeof merchantApiKeys.$inferSelect;
export type InsertMerchantApiKey = z.infer<typeof insertMerchantApiKeySchema>;

// Phase 17B: Gift Card Transactions Table for Real-Time Monitoring
export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type", { enum: ["issue", "redeem", "refund"] }).notNull(),
  merchantId: text("merchant_id").references(() => merchants.merchantId),
  cardId: text("card_id"), // Gift card GAN or ID
  amount: integer("amount").notNull(), // Amount in cents
  status: text("status").notNull().default("pending"), // pending, completed, failed
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceId: text("device_id"), // SHA256 hash of user agent
  attemptCount: integer("attempt_count").default(1),
  success: boolean("success").default(false),
  failureReason: text("failure_reason"),
  customerEmail: text("customer_email"),
  orderReference: text("order_reference"), // Reference to public order or bulk order
  squareTransactionId: text("square_transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGiftCardTransactionSchema = createInsertSchema(giftCardTransactions).omit({
  id: true,
  createdAt: true,
});

export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type InsertGiftCardTransaction = z.infer<typeof insertGiftCardTransactionSchema>;

// Phase 18: Admin Command Center - Global Settings Management
export const globalSettings = pgTable("global_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // JSON string for complex values
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGlobalSettingSchema = createInsertSchema(globalSettings).omit({
  id: true,
  updatedAt: true,
});

export type GlobalSetting = typeof globalSettings.$inferSelect;
export type InsertGlobalSetting = z.infer<typeof insertGlobalSettingSchema>;

// Phase 18: Gateway Feature Toggles
export const gatewayFeatureToggles = pgTable("gateway_feature_toggles", {
  id: uuid("id").primaryKey().defaultRandom(),
  gatewayName: text("gateway_name").notNull(), // 'square', 'stripe', 'paypal', etc.
  feature: text("feature").notNull(), // 'ach', 'refunds', 'crypto', 'giftcards', etc.
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGatewayFeatureToggleSchema = createInsertSchema(gatewayFeatureToggles).omit({
  id: true,
  updatedAt: true,
});

export type GatewayFeatureToggle = typeof gatewayFeatureToggles.$inferSelect;
export type InsertGatewayFeatureToggle = z.infer<typeof insertGatewayFeatureToggleSchema>;

// Phase 19: Fraud Clusters Schema
export const fraudClusters = pgTable("fraud_clusters", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(), // e.g., "Replay Attack", "IP Spoofing", "Rapid Redemptions"
  score: numeric("score", { precision: 5, scale: 2 }).notNull(), // risk score (0.00-99.99)
  severity: integer("severity").notNull().default(1), // 1-5 severity level
  threatCount: integer("threat_count").notNull().default(0), // Number of threats in cluster
  patternType: text("pattern_type").notNull(), // IP, device_fingerprint, velocity, etc.
  metadata: text("metadata"), // JSON string with cluster details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFraudClusterSchema = createInsertSchema(fraudClusters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FraudCluster = typeof fraudClusters.$inferSelect;
export type InsertFraudCluster = z.infer<typeof insertFraudClusterSchema>;

// Phase 19: Cluster Patterns Schema
export const clusterPatterns = pgTable("cluster_patterns", {
  id: uuid("id").defaultRandom().primaryKey(),
  clusterId: uuid("cluster_id").notNull().references(() => fraudClusters.id, { onDelete: "cascade" }),
  fraudLogId: uuid("fraud_log_id").notNull().references(() => fraudLogs.id, { onDelete: "cascade" }),
  metadata: text("metadata"), // JSON string with pattern-specific data (device, IP, timing, etc.)
  similarity: numeric("similarity", { precision: 5, scale: 2 }), // Similarity score to cluster center
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClusterPatternSchema = createInsertSchema(clusterPatterns).omit({
  id: true,
  createdAt: true,
});

export type ClusterPattern = typeof clusterPatterns.$inferSelect;
export type InsertClusterPattern = z.infer<typeof insertClusterPatternSchema>;

// Phase 20: AI Defense Actions Schema
export const defenseActions = pgTable("defense_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "IP Block", "Rate Limit", "Step-up Auth"
  actionType: text("action_type").notNull(), // block_ip, block_device, rate_limit, alert, quarantine
  triggeredBy: text("triggered_by").notNull(), // cluster_id, manual, threshold
  targetValue: text("target_value"), // IP address, device fingerprint, etc.
  severity: integer("severity").notNull().default(1), // 1-5 action severity
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"), // Auto-expire time for temporary blocks
  metadata: text("metadata"), // JSON with action-specific config
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDefenseActionSchema = createInsertSchema(defenseActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DefenseAction = typeof defenseActions.$inferSelect;
export type InsertDefenseAction = z.infer<typeof insertDefenseActionSchema>;

// Phase 20: Action Rules Schema
export const actionRules = pgTable("action_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "High Risk IP Auto-Block"
  condition: text("condition").notNull(), // JSON condition logic
  actionType: text("action_type").notNull(), // block_ip, block_device, alert, etc.
  severity: integer("severity").notNull().default(3), // 1-5 rule severity
  isActive: boolean("is_active").notNull().default(true),
  triggerCount: integer("trigger_count").notNull().default(0), // How many times triggered
  lastTriggered: timestamp("last_triggered"),
  metadata: text("metadata"), // JSON with rule-specific config
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertActionRuleSchema = createInsertSchema(actionRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ActionRule = typeof actionRules.$inferSelect;
export type InsertActionRule = z.infer<typeof insertActionRuleSchema>;

// Phase 20: Defense History Schema
export const defenseHistory = pgTable("defense_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  actionId: uuid("action_id").notNull().references(() => defenseActions.id, { onDelete: "cascade" }),
  clusterId: uuid("cluster_id").references(() => fraudClusters.id, { onDelete: "set null" }),
  ruleId: uuid("rule_id").references(() => actionRules.id, { onDelete: "set null" }),
  result: text("result").notNull(), // success, failed, partial
  impactMetrics: text("impact_metrics"), // JSON with metrics (threats_blocked, false_positives, etc.)
  duration: integer("duration"), // Action duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDefenseHistorySchema = createInsertSchema(defenseHistory).omit({
  id: true,
  createdAt: true,
});

export type DefenseHistory = typeof defenseHistory.$inferSelect;
export type InsertDefenseHistory = z.infer<typeof insertDefenseHistorySchema>;

// GDPR Compliance Tables
// Data Processing Records - Article 30 GDPR
export const dataProcessingRecords = pgTable("data_processing_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
  processingPurpose: text("processing_purpose").notNull(), // Contact, Marketing, Analytics, etc.
  dataCategories: text("data_categories").notNull(), // JSON array of data types
  legalBasis: text("legal_basis").notNull(), // consent, contract, legitimate_interest
  retentionPeriod: integer("retention_period").notNull(), // Days
  thirdPartySharing: boolean("third_party_sharing").default(false),
  recipients: text("recipients"), // JSON array of third parties
  crossBorderTransfer: boolean("cross_border_transfer").default(false),
  transferSafeguards: text("transfer_safeguards"), // adequacy_decision, bcr, scc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Consent Management - Article 7 GDPR
export const userConsentRecords = pgTable("user_consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => merchants.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(), // marketing, analytics, cookies, data_processing
  consentGiven: boolean("consent_given").notNull(),
  consentDate: timestamp("consent_date").notNull(),
  consentMethod: text("consent_method").notNull(), // website_form, email_confirmation, api
  consentVersion: text("consent_version").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  withdrawalDate: timestamp("withdrawal_date"),
  withdrawalMethod: text("withdrawal_method"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data Subject Rights Requests - Article 15-22 GDPR
export const dataSubjectRequests = pgTable("data_subject_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: integer("requester_id").references(() => merchants.id, { onDelete: "cascade" }),
  requestType: text("request_type").notNull(), // access, portability, rectification, erasure, restriction, objection
  requestStatus: text("request_status").notNull().default("pending"), // pending, processing, completed, rejected
  requestDate: timestamp("request_date").defaultNow(),
  completionDate: timestamp("completion_date"),
  requestDetails: text("request_details"), // JSON with specific request information
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  verificationMethod: text("verification_method"), // email, phone, document
  responseData: text("response_data"), // JSON with provided data for access/portability requests
  rejectionReason: text("rejection_reason"),
  deadlineDate: timestamp("deadline_date"), // 30 days from request
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data Breach Incidents - Article 33-34 GDPR
export const dataBreachIncidents = pgTable("data_breach_incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentReference: text("incident_reference").notNull().unique(),
  discoveryDate: timestamp("discovery_date").notNull(),
  incidentDate: timestamp("incident_date").notNull(),
  breachType: text("breach_type").notNull(), // confidentiality, integrity, availability
  affectedDataTypes: text("affected_data_types").notNull(), // JSON array
  affectedRecords: integer("affected_records").notNull(),
  affectedIndividuals: integer("affected_individuals").notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high
  containmentMeasures: text("containment_measures"),
  supervisoryAuthorityNotified: boolean("supervisory_authority_notified").default(false),
  supervisoryNotificationDate: timestamp("supervisory_notification_date"),
  individualNotificationRequired: boolean("individual_notification_required").default(false),
  individualNotificationDate: timestamp("individual_notification_date"),
  incidentStatus: text("incident_status").default("investigating"), // investigating, contained, resolved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy Impact Assessments - Article 35 GDPR
export const privacyImpactAssessments = pgTable("privacy_impact_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentTitle: text("assessment_title").notNull(),
  processingDescription: text("processing_description").notNull(),
  necessityAssessment: text("necessity_assessment").notNull(),
  proportionalityAssessment: text("proportionality_assessment").notNull(),
  risksIdentified: text("risks_identified").notNull(), // JSON array
  mitigationMeasures: text("mitigation_measures").notNull(), // JSON array
  residualRisk: text("residual_risk").notNull(), // low, medium, high
  consultationRequired: boolean("consultation_required").default(false),
  consultationDate: timestamp("consultation_date"),
  assessmentStatus: text("assessment_status").default("draft"), // draft, review, approved, rejected
  assessorName: text("assessor_name").notNull(),
  reviewDate: timestamp("review_date"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for GDPR tables
export const insertDataProcessingRecordSchema = createInsertSchema(dataProcessingRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserConsentRecordSchema = createInsertSchema(userConsentRecords).omit({
  id: true,
  createdAt: true,
});

export const insertDataSubjectRequestSchema = createInsertSchema(dataSubjectRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataBreachIncidentSchema = createInsertSchema(dataBreachIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrivacyImpactAssessmentSchema = createInsertSchema(privacyImpactAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types for GDPR tables
export type DataProcessingRecord = typeof dataProcessingRecords.$inferSelect;
export type InsertDataProcessingRecord = z.infer<typeof insertDataProcessingRecordSchema>;

export type UserConsentRecord = typeof userConsentRecords.$inferSelect;
export type InsertUserConsentRecord = z.infer<typeof insertUserConsentRecordSchema>;

export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;
export type InsertDataSubjectRequest = z.infer<typeof insertDataSubjectRequestSchema>;

export type DataBreachIncident = typeof dataBreachIncidents.$inferSelect;
export type InsertDataBreachIncident = z.infer<typeof insertDataBreachIncidentSchema>;

export type PrivacyImpactAssessment = typeof privacyImpactAssessments.$inferSelect;
export type InsertPrivacyImpactAssessment = z.infer<typeof insertPrivacyImpactAssessmentSchema>;

// ===== PCI DSS COMPLIANCE TABLES =====

export const pciComplianceAssessments = pgTable("pci_compliance_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentType: text("assessment_type").notNull(), // 'self_assessment', 'external_audit', 'penetration_test'
  assessmentDate: timestamp("assessment_date").notNull(),
  assessmentVersion: text("assessment_version").notNull(), // PCI DSS version (e.g., '4.0')
  complianceLevel: text("compliance_level").notNull(), // 'level_1', 'level_2', 'level_3', 'level_4'
  assessorName: text("assessor_name"),
  assessorCompany: text("assessor_company"),
  assessmentStatus: text("assessment_status").notNull().default('in_progress'), // 'in_progress', 'completed', 'failed'
  complianceScore: integer("compliance_score"), // 0-100%
  findings: text("findings"), // JSON string of findings
  remediationPlan: text("remediation_plan"), // JSON string of remediation actions
  nextAssessmentDue: timestamp("next_assessment_due"),
  certificateNumber: text("certificate_number"),
  certificateExpiry: timestamp("certificate_expiry"),
  documentPath: text("document_path"), // Path to assessment documents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const pciSecurityScans = pgTable("pci_security_scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanType: text("scan_type").notNull(), // 'quarterly_scan', 'vulnerability_scan', 'penetration_test'
  scanDate: timestamp("scan_date").notNull(),
  scanProvider: text("scan_provider").notNull(), // ASV company name
  scanScope: text("scan_scope"), // JSON string of scanned systems/IPs
  scanStatus: text("scan_status").notNull().default('scheduled'), // 'scheduled', 'in_progress', 'completed', 'failed'
  vulnerabilitiesFound: integer("vulnerabilities_found").default(0),
  criticalVulnerabilities: integer("critical_vulnerabilities").default(0),
  highVulnerabilities: integer("high_vulnerabilities").default(0),
  mediumVulnerabilities: integer("medium_vulnerabilities").default(0),
  lowVulnerabilities: integer("low_vulnerabilities").default(0),
  scanResults: text("scan_results"), // JSON string of detailed results
  remediationStatus: text("remediation_status").default('pending'), // 'pending', 'in_progress', 'completed'
  nextScanDue: timestamp("next_scan_due"),
  reportPath: text("report_path"), // Path to scan reports
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const pciSecurityControls = pgTable("pci_security_controls", {
  id: uuid("id").primaryKey().defaultRandom(),
  requirementNumber: text("requirement_number").notNull(), // e.g., '1.1.1', '2.2.1'
  requirementTitle: text("requirement_title").notNull(),
  controlCategory: text("control_category").notNull(), // 'network_security', 'access_control', 'encryption', etc.
  implementationStatus: text("implementation_status").notNull().default('not_implemented'), // 'not_implemented', 'partially_implemented', 'implemented', 'not_applicable'
  controlDescription: text("control_description").notNull(),
  implementationDetails: text("implementation_details"),
  evidenceDocuments: text("evidence_documents"), // JSON array of document paths
  testingProcedures: text("testing_procedures"),
  lastTested: timestamp("last_tested"),
  testResults: text("test_results"),
  complianceStatus: text("compliance_status").default('pending'), // 'compliant', 'non_compliant', 'pending', 'not_applicable'
  riskLevel: text("risk_level").default('medium'), // 'low', 'medium', 'high', 'critical'
  responsiblePerson: text("responsible_person"),
  targetCompletionDate: timestamp("target_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const pciIncidentResponses = pgTable("pci_incident_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: text("incident_id").notNull().unique(),
  incidentType: text("incident_type").notNull(), // 'data_breach', 'security_incident', 'compliance_violation'
  discoveryDate: timestamp("discovery_date").notNull(),
  incidentDate: timestamp("incident_date"),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  affectedSystems: text("affected_systems"), // JSON array of affected systems
  cardDataInvolved: boolean("card_data_involved").default(false),
  estimatedRecordsAffected: integer("estimated_records_affected").default(0),
  incidentDescription: text("incident_description").notNull(),
  rootCause: text("root_cause"),
  containmentActions: text("containment_actions"),
  investigationStatus: text("investigation_status").default('open'), // 'open', 'investigating', 'contained', 'resolved'
  forensicsRequired: boolean("forensics_required").default(false),
  forensicsProvider: text("forensics_provider"),
  brandNotificationRequired: boolean("brand_notification_required").default(false),
  brandNotificationDate: timestamp("brand_notification_date"),
  acquirerNotificationRequired: boolean("acquirer_notification_required").default(false),
  acquirerNotificationDate: timestamp("acquirer_notification_date"),
  lawEnforcementNotified: boolean("law_enforcement_notified").default(false),
  lawEnforcementNotificationDate: timestamp("law_enforcement_notification_date"),
  publicDisclosureRequired: boolean("public_disclosure_required").default(false),
  publicDisclosureDate: timestamp("public_disclosure_date"),
  lessonsLearned: text("lessons_learned"),
  preventiveMeasures: text("preventive_measures"),
  incidentCost: integer("incident_cost").default(0),
  resolutionDate: timestamp("resolution_date"),
  reportPath: text("report_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const pciNetworkDiagrams = pgTable("pci_network_diagrams", {
  id: uuid("id").primaryKey().defaultRandom(),
  diagramName: text("diagram_name").notNull(),
  diagramType: text("diagram_type").notNull(), // 'network_topology', 'data_flow', 'system_architecture'
  diagramVersion: text("diagram_version").notNull().default('1.0'),
  scope: text("scope").notNull(), // 'full_environment', 'cde_only', 'specific_system'
  description: text("description"),
  cardDataEnvironments: text("card_data_environments"), // JSON array of CDE components
  networkSegmentation: text("network_segmentation"), // JSON description of segmentation
  firewallRules: text("firewall_rules"), // JSON array of firewall configurations
  accessPoints: text("access_points"), // JSON array of access points
  dataFlows: text("data_flows"), // JSON description of data flows
  approvedBy: text("approved_by"),
  approvalDate: timestamp("approval_date"),
  reviewDate: timestamp("review_date"),
  nextReviewDue: timestamp("next_review_due"),
  diagramPath: text("diagram_path").notNull(), // Path to diagram file
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const pciAuditLogs = pgTable("pci_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(), // 'user_access', 'admin_action', 'system_change', 'security_event'
  eventCategory: text("event_category").notNull(), // 'authentication', 'authorization', 'data_access', 'configuration'
  userId: text("user_id"),
  userRole: text("user_role"),
  sourceIp: text("source_ip"),
  userAgent: text("user_agent"),
  eventDescription: text("event_description").notNull(),
  resourceAccessed: text("resource_accessed"),
  actionPerformed: text("action_performed"),
  eventResult: text("event_result").notNull(), // 'success', 'failure', 'blocked'
  riskLevel: text("risk_level").default('low'), // 'low', 'medium', 'high', 'critical'
  sessionId: text("session_id"),
  transactionId: text("transaction_id"),
  cardDataAccessed: boolean("card_data_accessed").default(false),
  eventData: text("event_data"), // JSON string of additional event data
  alertGenerated: boolean("alert_generated").default(false),
  reviewRequired: boolean("review_required").default(false),
  reviewedBy: text("reviewed_by"),
  reviewDate: timestamp("review_date"),
  reviewNotes: text("review_notes"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// PCI DSS Insert Schemas
export const insertPciComplianceAssessmentSchema = createInsertSchema(pciComplianceAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPciSecurityScanSchema = createInsertSchema(pciSecurityScans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPciSecurityControlSchema = createInsertSchema(pciSecurityControls).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPciIncidentResponseSchema = createInsertSchema(pciIncidentResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPciNetworkDiagramSchema = createInsertSchema(pciNetworkDiagrams).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPciAuditLogSchema = createInsertSchema(pciAuditLogs).omit({
  id: true,
  createdAt: true
});

// PCI DSS Types
export type PciComplianceAssessment = typeof pciComplianceAssessments.$inferSelect;
export type InsertPciComplianceAssessment = z.infer<typeof insertPciComplianceAssessmentSchema>;

export type PciSecurityScan = typeof pciSecurityScans.$inferSelect;
export type InsertPciSecurityScan = z.infer<typeof insertPciSecurityScanSchema>;

export type PciSecurityControl = typeof pciSecurityControls.$inferSelect;
export type InsertPciSecurityControl = z.infer<typeof insertPciSecurityControlSchema>;

export type PciIncidentResponse = typeof pciIncidentResponses.$inferSelect;
export type InsertPciIncidentResponse = z.infer<typeof insertPciIncidentResponseSchema>;

export type PciNetworkDiagram = typeof pciNetworkDiagrams.$inferSelect;
export type InsertPciNetworkDiagram = z.infer<typeof insertPciNetworkDiagramSchema>;

export type PciAuditLog = typeof pciAuditLogs.$inferSelect;
export type InsertPciAuditLog = z.infer<typeof insertPciAuditLogSchema>;

// Pricing Configuration Table
export const pricingConfigurations = pgTable("pricing_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull().default("100.00"),
  merchantBuyRate: decimal("merchant_buy_rate", { precision: 5, scale: 2 }).notNull().default("5.00"), // % markup for merchant purchases
  merchantSellRate: decimal("merchant_sell_rate", { precision: 5, scale: 2 }).notNull().default("-3.00"), // % discount for merchant sales
  individualBuyRate: decimal("individual_buy_rate", { precision: 5, scale: 2 }).notNull().default("8.00"), // % markup for individual purchases
  individualSellRate: decimal("individual_sell_rate", { precision: 5, scale: 2 }).notNull().default("-5.00"), // % discount for individual sales
  isActive: boolean("is_active").default(true),
  updatedBy: text("updated_by").notNull().default("admin"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Pricing History Table for audit trail
export const pricingHistory = pgTable("pricing_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  configurationId: uuid("configuration_id").references(() => pricingConfigurations.id),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  merchantBuyRate: decimal("merchant_buy_rate", { precision: 5, scale: 2 }).notNull(),
  merchantSellRate: decimal("merchant_sell_rate", { precision: 5, scale: 2 }).notNull(),
  individualBuyRate: decimal("individual_buy_rate", { precision: 5, scale: 2 }).notNull(),
  individualSellRate: decimal("individual_sell_rate", { precision: 5, scale: 2 }).notNull(),
  changedBy: text("changed_by").notNull(),
  changeReason: text("change_reason"),
  previousValues: text("previous_values"), // JSON string of previous values
  createdAt: timestamp("created_at").defaultNow()
});

// Pricing Configuration Schemas
export const insertPricingConfigurationSchema = createInsertSchema(pricingConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPricingHistorySchema = createInsertSchema(pricingHistory).omit({
  id: true,
  createdAt: true
});

// Pricing Configuration Types
export type PricingConfiguration = typeof pricingConfigurations.$inferSelect;
export type InsertPricingConfiguration = z.infer<typeof insertPricingConfigurationSchema>;

export type PricingHistory = typeof pricingHistory.$inferSelect;
export type InsertPricingHistory = z.infer<typeof insertPricingHistorySchema>;

// Physical Gift Card System
export const physicalGiftCards = pgTable("physical_gift_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardType: text("card_type").notNull(), // 'plastic', 'metal', 'premium'
  cardDesign: text("card_design"), // Template or custom design ID
  isCustomDesign: boolean("is_custom_design").default(false),
  customDesignUrl: text("custom_design_url"), // URL to uploaded design
  quantity: integer("quantity").notNull(),
  denomination: integer("denomination").notNull(), // Amount in cents
  squareBasePrice: integer("square_base_price").notNull(), // Square's cost in cents
  adminFeePercentage: decimal("admin_fee_percentage", { precision: 5, scale: 2 }).notNull(), // Your fee %
  totalCost: integer("total_cost").notNull(), // Final cost including fees
  customerType: text("customer_type").notNull(), // 'merchant', 'individual'
  customerId: text("customer_id"), // Merchant ID or customer ID
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state").notNull(),
  shippingZip: text("shipping_zip").notNull(),
  shippingCountry: text("shipping_country").default("US"),
  status: text("status").notNull().default("pending"), // pending, processing, printed, shipped, delivered
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  squareOrderId: text("square_order_id"),
  squarePaymentId: text("square_payment_id"),
  printJobId: text("print_job_id"), // For tracking with printing service
  trackingNumber: text("tracking_number"),
  shippingCost: integer("shipping_cost").default(0),
  estimatedDelivery: timestamp("estimated_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const physicalCardActivations = pgTable("physical_card_activations", {
  id: uuid("id").primaryKey().defaultRandom(),
  physicalCardId: uuid("physical_card_id").notNull(),
  cardNumber: text("card_number").notNull().unique(), // Printed card number
  squareGiftCardId: text("square_gift_card_id").unique(), // Created when activated
  gan: text("gan").unique(), // Gift card account number
  activatedBy: text("activated_by"), // Customer who activated
  activatedAt: timestamp("activated_at"),
  currentBalance: integer("current_balance"), // Balance in cents
  isActive: boolean("is_active").default(false),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cardReloadTransactions = pgTable("card_reload_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardActivationId: uuid("card_activation_id").notNull(),
  reloadAmount: integer("reload_amount").notNull(), // Amount added in cents
  adminFeePercentage: decimal("admin_fee_percentage", { precision: 5, scale: 2 }).notNull(),
  totalCharged: integer("total_charged").notNull(), // Amount charged including fee
  reloadedBy: text("reloaded_by").notNull(), // Customer email/ID
  paymentMethod: text("payment_method").notNull(), // 'square', 'stripe', etc
  squarePaymentId: text("square_payment_id"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const cardBalanceChecks = pgTable("card_balance_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardNumber: text("card_number").notNull(),
  checkedBy: text("checked_by"), // IP or customer ID
  balance: integer("balance"), // Balance at time of check
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customCardDesigns = pgTable("custom_card_designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: text("customer_id").notNull(),
  customerType: text("customer_type").notNull(), // 'merchant', 'individual'
  designName: text("design_name").notNull(),
  designUrl: text("design_url").notNull(), // URL to uploaded design file
  designType: text("design_type").notNull(), // 'image', 'template'
  isApproved: boolean("is_approved").default(false),
  approvedBy: text("approved_by"), // Admin who approved
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  designSpecs: text("design_specs"), // JSON with design specifications
  printCost: integer("print_cost"), // Additional cost for custom design
  createdAt: timestamp("created_at").defaultNow(),
});

// Checkout Configuration Table
export const checkoutConfigurations = pgTable("checkout_configurations", {
  id: serial("id").primaryKey(),
  // Branding
  brandName: text("brand_name").notNull().default("SiZu GiftCard"),
  brandLogo: text("brand_logo"),
  tagline: text("tagline"),
  
  // Colors & Theme
  primaryColor: text("primary_color").notNull().default("#7c3aed"),
  secondaryColor: text("secondary_color").notNull().default("#ec4899"),
  accentColor: text("accent_color").notNull().default("#3b82f6"),
  backgroundColor: text("background_color").notNull().default("#0f0a19"),
  textColor: text("text_color").notNull().default("#ffffff"),
  
  // Layout Options
  layout: text("layout").notNull().default("multi-step"), // 'single-page', 'multi-step', 'sidebar'
  theme: text("theme").notNull().default("dark"), // 'dark', 'light', 'auto'
  animation: text("animation").notNull().default("enhanced"), // 'minimal', 'standard', 'enhanced'
  
  // Payment Options (JSON stored as text)
  acceptedPaymentMethods: text("accepted_payment_methods").notNull().default('{"creditCard":true,"debitCard":true,"applePay":true,"googlePay":true,"cashApp":true,"paypal":false,"bankTransfer":false}'),
  
  // Security Features
  requireCVV: boolean("require_cvv").notNull().default(true),
  requireBillingAddress: boolean("require_billing_address").notNull().default(true),
  enableSavePayment: boolean("enable_save_payment").notNull().default(true),
  enableGuestCheckout: boolean("enable_guest_checkout").notNull().default(true),
  
  // Content Customization
  welcomeMessage: text("welcome_message"),
  footerText: text("footer_text"),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsOfServiceUrl: text("terms_of_service_url"),
  
  // Advanced Settings
  sessionTimeout: integer("session_timeout").notNull().default(30),
  enableAnalytics: boolean("enable_analytics").notNull().default(true),
  enableA11y: boolean("enable_a11y").notNull().default(true),
  enablePWA: boolean("enable_pwa").notNull().default(false),
  
  // System tracking
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertPhysicalGiftCardSchema = createInsertSchema(physicalGiftCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhysicalCardActivationSchema = createInsertSchema(physicalCardActivations).omit({
  id: true,
  createdAt: true,
});

export const insertCardReloadTransactionSchema = createInsertSchema(cardReloadTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertCardBalanceCheckSchema = createInsertSchema(cardBalanceChecks).omit({
  id: true,
  createdAt: true,
});

export const insertCustomCardDesignSchema = createInsertSchema(customCardDesigns).omit({
  id: true,
  createdAt: true,
});

export const insertCheckoutConfigurationSchema = createInsertSchema(checkoutConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type PhysicalGiftCard = typeof physicalGiftCards.$inferSelect;
export type InsertPhysicalGiftCard = z.infer<typeof insertPhysicalGiftCardSchema>;
export type PhysicalCardActivation = typeof physicalCardActivations.$inferSelect;
export type InsertPhysicalCardActivation = z.infer<typeof insertPhysicalCardActivationSchema>;
export type CardReloadTransaction = typeof cardReloadTransactions.$inferSelect;
export type InsertCardReloadTransaction = z.infer<typeof insertCardReloadTransactionSchema>;
export type CardBalanceCheck = typeof cardBalanceChecks.$inferSelect;
export type InsertCardBalanceCheck = z.infer<typeof insertCardBalanceCheckSchema>;
export type CustomCardDesign = typeof customCardDesigns.$inferSelect;
export type InsertCustomCardDesign = z.infer<typeof insertCustomCardDesignSchema>;
export type CheckoutConfiguration = typeof checkoutConfigurations.$inferSelect;
export type InsertCheckoutConfiguration = z.infer<typeof insertCheckoutConfigurationSchema>;

// Refunds Table - Square Refunds Management
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  squareRefundId: text("square_refund_id").notNull().unique(),
  paymentId: text("payment_id").notNull(), // Original Square payment ID
  orderId: text("order_id"), // Associated order ID (optional)
  giftCardOrderId: uuid("gift_card_order_id"), // Link to gift card orders
  amount: integer("amount").notNull(), // Refund amount in cents
  currency: text("currency").notNull().default("USD"),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // PENDING, COMPLETED, FAILED, REJECTED
  processingFee: integer("processing_fee").default(0), // Any processing fees
  merchantId: text("merchant_id"), // For merchant-specific refunds
  initiatedBy: text("initiated_by"), // admin, merchant, customer
  refundMethod: text("refund_method"), // original_payment_method, store_credit, cash
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  adminNotes: text("admin_notes"),
  squareLocationId: text("square_location_id"),
  approvedBy: text("approved_by"), // Admin who approved the refund
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disputes Table - Square Disputes Management  
export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  squareDisputeId: text("square_dispute_id").notNull().unique(),
  paymentId: text("payment_id").notNull(), // Disputed Square payment ID
  orderId: text("order_id"), // Associated order ID (optional)
  giftCardOrderId: uuid("gift_card_order_id"), // Link to gift card orders
  amount: integer("amount").notNull(), // Disputed amount in cents
  currency: text("currency").notNull().default("USD"),
  reason: text("reason").notNull(), // Dispute reason from Square
  state: text("state").notNull(), // INQUIRY_EVIDENCE_REQUIRED, INQUIRY_PROCESSING, etc.
  disputeType: text("dispute_type"), // CHARGEBACK, INQUIRY, RETRIEVAL
  cardBrand: text("card_brand"), // VISA, MASTERCARD, AMEX, DISCOVER
  lastFourDigits: text("last_four_digits"),
  merchantId: text("merchant_id"), // For merchant-specific disputes
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  evidenceSubmitted: boolean("evidence_submitted").default(false),
  evidenceDeadline: timestamp("evidence_deadline"),
  responseRequired: boolean("response_required").default(false),
  adminNotes: text("admin_notes"),
  squareLocationId: text("square_location_id"),
  dueAt: timestamp("due_at"), // When response is due
  disputedAt: timestamp("disputed_at"), // When dispute was created
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"), // WON, LOST, ACCEPTED, WITHDRAWN
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dispute Evidence Table - Evidence submitted for disputes
export const disputeEvidence = pgTable("dispute_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  disputeId: uuid("dispute_id").notNull().references(() => disputes.id),
  squareEvidenceId: text("square_evidence_id"), // Square's evidence ID
  evidenceType: text("evidence_type").notNull(), // RECEIPT, CUSTOMER_COMMUNICATION, etc.
  evidenceCategory: text("evidence_category"), // ONLINE_OR_APP_PURCHASE_CONFIRMATION, etc.
  evidenceText: text("evidence_text"),
  evidenceFile: text("evidence_file"), // File path or URL
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: text("uploaded_by"), // admin, merchant
  isSubmitted: boolean("is_submitted").default(false),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Refund Activities Table - Audit trail for refund actions
export const refundActivities = pgTable("refund_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  refundId: uuid("refund_id").notNull().references(() => refunds.id),
  activityType: text("activity_type").notNull(), // CREATED, APPROVED, PROCESSED, FAILED, CANCELLED
  performedBy: text("performed_by").notNull(), // User who performed the action
  userRole: text("user_role"), // admin, merchant, system
  description: text("description").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  metadata: text("metadata"), // JSON string for additional data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dispute Activities Table - Audit trail for dispute actions
export const disputeActivities = pgTable("dispute_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  disputeId: uuid("dispute_id").notNull().references(() => disputes.id),
  activityType: text("activity_type").notNull(), // EVIDENCE_SUBMITTED, RESPONSE_SENT, RESOLVED, etc.
  performedBy: text("performed_by").notNull(),
  userRole: text("user_role"), // admin, merchant, system
  description: text("description").notNull(),
  previousState: text("previous_state"),
  newState: text("new_state"),
  metadata: text("metadata"), // JSON string for additional data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for refunds and disputes
export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDisputeEvidenceSchema = createInsertSchema(disputeEvidence).omit({
  id: true,
  createdAt: true,
});

export const insertRefundActivitySchema = createInsertSchema(refundActivities).omit({
  id: true,
  createdAt: true,
});

export const insertDisputeActivitySchema = createInsertSchema(disputeActivities).omit({
  id: true,
  createdAt: true,
});

// Types for refunds and disputes
export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;

export type DisputeEvidence = typeof disputeEvidence.$inferSelect;
export type InsertDisputeEvidence = z.infer<typeof insertDisputeEvidenceSchema>;

export type RefundActivity = typeof refundActivities.$inferSelect;
export type InsertRefundActivity = z.infer<typeof insertRefundActivitySchema>;

export type DisputeActivity = typeof disputeActivities.$inferSelect;
export type InsertDisputeActivity = z.infer<typeof insertDisputeActivitySchema>;
