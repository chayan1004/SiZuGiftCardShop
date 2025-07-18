import { 
  users, merchants, giftCards, giftCardActivities, promoCodes, promoUsage, merchantGiftCards, merchant_bulk_orders, publicGiftCardOrders, merchantPricingTiers, merchantBranding, merchantCardDesigns, fraudLogs, autoDefenseRules, cardRedemptions, webhookEvents, webhookDeliveryLogs, webhookRetryQueue, webhookFailureLog, merchantApiKeys, giftCardTransactions, globalSettings, gatewayFeatureToggles, fraudClusters, clusterPatterns, defenseActions, actionRules, defenseHistory, dataProcessingRecords, userConsentRecords, dataSubjectRequests, dataBreachIncidents, privacyImpactAssessments, pciComplianceAssessments, pciSecurityScans, pciSecurityControls, pciIncidentResponses, pciNetworkDiagrams, pciAuditLogs, pricingConfigurations, pricingHistory, physicalGiftCards, physicalCardActivations, cardReloadTransactions, cardBalanceChecks, customCardDesigns, checkoutConfigurations, customerProfiles, savedCards, cardTokenEvents, refunds, disputes, disputeEvidence, refundActivities, disputeActivities,
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
  type MerchantCardDesign, type InsertMerchantCardDesign,
  type FraudLog, type InsertFraudLog,
  type AutoDefenseRule, type InsertAutoDefenseRule,
  type CardRedemption, type InsertCardRedemption,
  type WebhookEvent, type InsertWebhookEvent,
  type WebhookDeliveryLog, type InsertWebhookDeliveryLog,
  type WebhookRetryQueue, type InsertWebhookRetryQueue,
  type WebhookFailureLog, type InsertWebhookFailureLog,
  type MerchantApiKey, type InsertMerchantApiKey,
  type GiftCardTransaction, type InsertGiftCardTransaction,
  type GlobalSetting, type InsertGlobalSetting,
  type GatewayFeatureToggle, type InsertGatewayFeatureToggle,
  type FraudCluster, type InsertFraudCluster,
  type ClusterPattern, type InsertClusterPattern,
  type DefenseAction, type InsertDefenseAction,
  type ActionRule, type InsertActionRule,
  type DefenseHistory, type InsertDefenseHistory,
  type DataProcessingRecord, type InsertDataProcessingRecord,
  type UserConsentRecord, type InsertUserConsentRecord,
  type DataSubjectRequest, type InsertDataSubjectRequest,
  type DataBreachIncident, type InsertDataBreachIncident,
  type PrivacyImpactAssessment, type InsertPrivacyImpactAssessment,
  type PciComplianceAssessment, type InsertPciComplianceAssessment,
  type PciSecurityScan, type InsertPciSecurityScan,
  type PciSecurityControl, type InsertPciSecurityControl,
  type PciIncidentResponse, type InsertPciIncidentResponse,
  type PciNetworkDiagram, type InsertPciNetworkDiagram,
  type PciAuditLog, type InsertPciAuditLog,
  type PricingConfiguration, type InsertPricingConfiguration,
  type PricingHistory, type InsertPricingHistory,
  type PhysicalGiftCard, type InsertPhysicalGiftCard,
  type PhysicalCardActivation, type InsertPhysicalCardActivation,
  type CardReloadTransaction, type InsertCardReloadTransaction,
  type CardBalanceCheck, type InsertCardBalanceCheck,
  type CustomCardDesign, type InsertCustomCardDesign,
  type CheckoutConfiguration, type InsertCheckoutConfiguration,
  type Refund, type InsertRefund,
  type Dispute, type InsertDispute,
  type DisputeEvidence, type InsertDisputeEvidence,
  type RefundActivity, type InsertRefundActivity,
  type DisputeActivity, type InsertDisputeActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count, sum, and, gte, lte, asc, or, isNull, isNotNull } from "drizzle-orm";

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
  updateMerchantWebhookUrl(merchantId: string, webhookUrl: string | null): Promise<Merchant | undefined>;
  updateMerchantWebhookSettings(merchantId: string, webhookUrl: string | null, enabled: boolean): Promise<Merchant | undefined>;
  getMerchantByMerchantId(merchantId: string): Promise<Merchant | undefined>;

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
  getPublicGiftCardOrderById(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  updatePublicGiftCardOrderStatus(orderId: string, status: string, squarePaymentId?: string, giftCardGan?: string, giftCardId?: string, giftCardState?: string): Promise<PublicGiftCardOrder | undefined>;
  updatePublicGiftCardOrderEmailStatus(orderId: string, emailSent: boolean, emailSentAt?: Date): Promise<PublicGiftCardOrder | undefined>;
  markEmailAsResent(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  markOrderAsFailed(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  updateReceiptUrl(orderId: string, pdfReceiptUrl: string, pdfGeneratedAt?: Date): Promise<PublicGiftCardOrder | undefined>;
  getPublicGiftCardOrderById(orderId: string): Promise<PublicGiftCardOrder | undefined>;
  getAllPublicGiftCardOrders(): Promise<PublicGiftCardOrder[]>;
  validateMerchantById(merchantId: string): Promise<boolean>;
  
  // Physical Gift Card Order methods
  createPhysicalCardOrder(order: InsertPhysicalGiftCard): Promise<PhysicalGiftCard>;
  getPhysicalCardOrders(): Promise<PhysicalGiftCard[]>;
  updatePhysicalCardOrderStatus(orderId: string, status: string): Promise<PhysicalGiftCard | undefined>;
  
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

  // Merchant-specific analytics for CSV/PDF export
  getGiftCardAnalyticsForMerchant(merchantId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<{
    summary: {
      totalIssued: number;
      totalRedeemed: number;
      totalRevenue: number;
      outstandingBalance: number;
      redemptionRate: number;
    };
    issuanceData: Array<{
      gan: string;
      amount: number;
      issuedDate: Date;
      recipientEmail?: string;
      status: string;
      orderId?: string;
    }>;
    redemptionData: Array<{
      gan: string;
      amount: number;
      redeemedBy: string;
      redeemedAt: Date;
      ipAddress?: string;
      deviceFingerprint?: string;
    }>;
    topRedeemedCards: Array<{
      gan: string;
      totalRedeemed: number;
      redemptionCount: number;
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

  // Auto Defense Rules methods
  createAutoDefenseRule(rule: InsertAutoDefenseRule): Promise<AutoDefenseRule>;
  getAutoDefenseRules(): Promise<AutoDefenseRule[]>;
  getAutoDefenseRulesByType(type: string): Promise<AutoDefenseRule[]>;
  updateAutoDefenseRuleHitCount(id: string): Promise<AutoDefenseRule | undefined>;
  deactivateAutoDefenseRule(id: string): Promise<AutoDefenseRule | undefined>;

  // Card Redemptions methods
  createCardRedemption(redemption: InsertCardRedemption): Promise<CardRedemption>;
  getCardRedemptions(merchantId?: string): Promise<CardRedemption[]>;
  validateGiftCardForRedemption(gan: string, merchantId: string): Promise<{
    valid: boolean;
    card?: GiftCard;
    error?: string;
  }>;  
  checkAutoDefenseRule(type: string, value: string): Promise<AutoDefenseRule | undefined>;

  // Promo Code methods
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  getPromoCodeById(id: number): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCodeUsage(id: number, increment: number): Promise<PromoCode | undefined>;
  recordPromoUsage(usage: InsertPromoUsage): Promise<PromoUsage>;
  getPromoUsageByCode(promoCodeId: number): Promise<PromoUsage[]>;

  // Merchant Card Design methods
  getMerchantCardDesign(merchantId: number): Promise<MerchantCardDesign | undefined>;
  getMerchantCardDesignBySquareId(merchantSquareId: string): Promise<MerchantCardDesign | undefined>;
  createMerchantCardDesign(design: InsertMerchantCardDesign): Promise<MerchantCardDesign>;
  updateMerchantCardDesign(merchantId: number, design: Partial<InsertMerchantCardDesign>): Promise<MerchantCardDesign | undefined>;

  // Webhook Event methods
  createWebhookEvent(webhookEvent: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEventsByMerchant(merchantId: string): Promise<WebhookEvent[]>;
  getWebhookEventsByMerchantAndType(merchantId: string, eventType: string): Promise<WebhookEvent[]>;
  getWebhookEventById(id: string): Promise<WebhookEvent | undefined>;
  getAllWebhookEvents(): Promise<WebhookEvent[]>;
  updateWebhookEvent(id: string, updates: Partial<InsertWebhookEvent>): Promise<WebhookEvent | undefined>;
  deleteWebhookEvent(id: string): Promise<boolean>;
  
  // Webhook Delivery Log methods
  createWebhookDeliveryLog(log: InsertWebhookDeliveryLog): Promise<WebhookDeliveryLog>;
  getWebhookDeliveryLogs(webhookId: string, limit?: number): Promise<WebhookDeliveryLog[]>;
  getWebhookDeliveryLogsByMerchant(merchantId: string, limit?: number): Promise<WebhookDeliveryLog[]>;
  getAllWebhookDeliveryLogs(limit?: number): Promise<WebhookDeliveryLog[]>;

  // Legacy webhook delivery logging (for backward compatibility)
  logWebhookDelivery(log: {
    merchantId: string;
    cardId: string;
    amount: number;
    status: 'success' | 'failed';
    errorMessage: string | null;
    responseTimeMs: number;
    payload: string;
  }): Promise<void>;

  // Phase 18: Admin Command Center - Global Settings Management
  getGlobalSettings(): Promise<GlobalSetting[]>;
  getGlobalSetting(key: string): Promise<GlobalSetting | undefined>;
  updateGlobalSetting(key: string, value: string): Promise<GlobalSetting>;

  // Phase 18: Gateway Feature Toggles Management
  getGatewayFeatures(): Promise<GatewayFeatureToggle[]>;
  getGatewayFeature(gatewayName: string, feature: string): Promise<GatewayFeatureToggle | undefined>;
  updateGatewayFeature(gatewayName: string, feature: string, enabled: boolean): Promise<GatewayFeatureToggle>;

  // Phase 19: Fraud Cluster Management
  getFraudClusters(limit?: number): Promise<FraudCluster[]>;
  getFraudClusterById(id: string): Promise<FraudCluster | undefined>;
  getClusterPatterns(clusterId: string): Promise<ClusterPattern[]>;
  createFraudCluster(cluster: InsertFraudCluster): Promise<FraudCluster>;
  addClusterPattern(pattern: InsertClusterPattern): Promise<ClusterPattern>;
  getFraudClusterStats(): Promise<{
    totalClusters: number;
    activeClusters: number;
    avgSeverity: number;
    recentClusters: number;
    patternTypes: Record<string, number>;
  }>;

  // GDPR Compliance Management
  // Data Processing Records (Article 30 GDPR)
  createDataProcessingRecord(record: InsertDataProcessingRecord): Promise<DataProcessingRecord>;
  getDataProcessingRecords(merchantId?: number): Promise<DataProcessingRecord[]>;
  updateDataProcessingRecord(id: string, updates: Partial<InsertDataProcessingRecord>): Promise<DataProcessingRecord | undefined>;
  deleteDataProcessingRecord(id: string): Promise<boolean>;

  // User Consent Management (Article 7 GDPR)
  recordUserConsent(consent: InsertUserConsentRecord): Promise<UserConsentRecord>;
  getUserConsentRecords(userId: number): Promise<UserConsentRecord[]>;
  getActiveConsents(userId: number): Promise<UserConsentRecord[]>;
  withdrawConsent(userId: number, consentType: string, withdrawalMethod: string): Promise<UserConsentRecord | undefined>;
  updateMerchantGdprConsent(merchantId: number, gdprFields: {
    gdprConsent?: boolean;
    marketingConsent?: boolean;
    dataProcessingConsent?: boolean;
    privacyPolicyAccepted?: boolean;
    privacyPolicyVersion?: string;
  }): Promise<Merchant | undefined>;

  // Data Subject Rights (Articles 15-22 GDPR)
  createDataSubjectRequest(request: InsertDataSubjectRequest): Promise<DataSubjectRequest>;
  getDataSubjectRequests(requesterId?: number): Promise<DataSubjectRequest[]>;
  updateDataSubjectRequest(id: string, updates: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest | undefined>;
  exportUserData(merchantId: number): Promise<{
    personalData: any;
    giftCards: any[];
    transactions: any[];
    consents: any[];
    processingRecords: any[];
  }>;
  deleteUserData(merchantId: number): Promise<boolean>;

  // Data Breach Management (Articles 33-34 GDPR)
  createDataBreachIncident(incident: InsertDataBreachIncident): Promise<DataBreachIncident>;
  getDataBreachIncidents(): Promise<DataBreachIncident[]>;
  updateDataBreachIncident(id: string, updates: Partial<InsertDataBreachIncident>): Promise<DataBreachIncident | undefined>;

  // Privacy Impact Assessments (Article 35 GDPR)
  createPrivacyImpactAssessment(assessment: InsertPrivacyImpactAssessment): Promise<PrivacyImpactAssessment>;
  getPrivacyImpactAssessments(): Promise<PrivacyImpactAssessment[]>;
  updatePrivacyImpactAssessment(id: string, updates: Partial<InsertPrivacyImpactAssessment>): Promise<PrivacyImpactAssessment | undefined>;

  // PCI DSS Compliance Management
  // Compliance Assessments
  createPciComplianceAssessment(assessment: InsertPciComplianceAssessment): Promise<PciComplianceAssessment>;
  getPciComplianceAssessments(): Promise<PciComplianceAssessment[]>;
  updatePciComplianceAssessment(id: string, updates: Partial<InsertPciComplianceAssessment>): Promise<PciComplianceAssessment | undefined>;
  
  // Security Scans
  createPciSecurityScan(scan: InsertPciSecurityScan): Promise<PciSecurityScan>;
  getPciSecurityScans(): Promise<PciSecurityScan[]>;
  updatePciSecurityScan(id: string, updates: Partial<InsertPciSecurityScan>): Promise<PciSecurityScan | undefined>;
  
  // Security Controls
  createPciSecurityControl(control: InsertPciSecurityControl): Promise<PciSecurityControl>;
  getPciSecurityControls(): Promise<PciSecurityControl[]>;
  updatePciSecurityControl(id: string, updates: Partial<InsertPciSecurityControl>): Promise<PciSecurityControl | undefined>;
  
  // Incident Response
  createPciIncidentResponse(incident: InsertPciIncidentResponse): Promise<PciIncidentResponse>;
  getPciIncidentResponses(): Promise<PciIncidentResponse[]>;
  updatePciIncidentResponse(id: string, updates: Partial<InsertPciIncidentResponse>): Promise<PciIncidentResponse | undefined>;
  
  // Network Diagrams
  createPciNetworkDiagram(diagram: InsertPciNetworkDiagram): Promise<PciNetworkDiagram>;
  getPciNetworkDiagrams(): Promise<PciNetworkDiagram[]>;
  updatePciNetworkDiagram(id: string, updates: Partial<InsertPciNetworkDiagram>): Promise<PciNetworkDiagram | undefined>;
  
  // Audit Logs
  createPciAuditLog(log: InsertPciAuditLog): Promise<PciAuditLog>;
  getPciAuditLogs(filters?: { startDate?: Date; endDate?: Date; eventType?: string; userId?: string }): Promise<PciAuditLog[]>;
  
  // PCI DSS Statistics
  getPciComplianceStats(): Promise<{
    assessmentsCount: number;
    scansCount: number;
    controlsCount: number;
    incidentsCount: number;
    lastAssessmentDate?: Date;
    nextScanDue?: Date;
    complianceScore?: number;
    implementedControlsCount: number;
    pendingControlsCount: number;
    overdueScanCount: number;
  }>;

  // Pricing Configuration Management
  getActivePricingConfiguration(): Promise<PricingConfiguration | undefined>;
  createPricingConfiguration(config: InsertPricingConfiguration): Promise<PricingConfiguration>;
  updatePricingConfiguration(id: string, config: Partial<InsertPricingConfiguration>): Promise<PricingConfiguration | undefined>;
  deactivateAllPricingConfigurations(): Promise<void>;
  getPricingHistory(limit?: number): Promise<PricingHistory[]>;
  createPricingHistoryEntry(entry: InsertPricingHistory): Promise<PricingHistory>;
  
  // Live Pricing Calculations
  calculateLivePricing(basePrice?: number): Promise<{
    squareBasePrice: number;
    merchantBuyPrice: number;
    merchantSellPrice: number;
    individualBuyPrice: number;
    individualSellPrice: number;
    profitMarginMerchant: number;
    profitMarginIndividual: number;
    lastRefresh: string;
  }>;
  
  // Physical Gift Card methods
  createPhysicalGiftCard(card: InsertPhysicalGiftCard): Promise<PhysicalGiftCard>;
  getPhysicalGiftCard(id: string): Promise<PhysicalGiftCard | undefined>;
  getPhysicalGiftCardsByCustomer(customerId: string, customerType: string): Promise<PhysicalGiftCard[]>;
  getAllPhysicalGiftCards(): Promise<PhysicalGiftCard[]>;
  updatePhysicalGiftCardStatus(id: string, status: string, paymentId?: string): Promise<PhysicalGiftCard | undefined>;
  updatePhysicalGiftCardTracking(id: string, trackingNumber: string, estimatedDelivery?: Date): Promise<PhysicalGiftCard | undefined>;
  
  // Physical Card Activations
  createPhysicalCardActivation(activation: InsertPhysicalCardActivation): Promise<PhysicalCardActivation>;
  getPhysicalCardActivation(id: string): Promise<PhysicalCardActivation | undefined>;
  getPhysicalCardActivationByCardNumber(cardNumber: string): Promise<PhysicalCardActivation | undefined>;
  activatePhysicalCard(cardNumber: string, squareGiftCardId: string, gan: string, activatedBy: string): Promise<PhysicalCardActivation | undefined>;
  updateCardBalance(cardNumber: string, newBalance: number): Promise<PhysicalCardActivation | undefined>;
  
  // Card Reload Transactions
  createCardReloadTransaction(transaction: InsertCardReloadTransaction): Promise<CardReloadTransaction>;
  getCardReloadTransactions(cardActivationId: string): Promise<CardReloadTransaction[]>;
  updateReloadTransactionStatus(id: string, status: string, paymentId?: string): Promise<CardReloadTransaction | undefined>;
  
  // Card Balance Checks
  createCardBalanceCheck(check: InsertCardBalanceCheck): Promise<CardBalanceCheck>;
  getCardBalanceChecks(cardNumber: string, limit?: number): Promise<CardBalanceCheck[]>;
  
  // Custom Card Designs
  createCustomCardDesign(design: InsertCustomCardDesign): Promise<CustomCardDesign>;
  getCustomCardDesign(id: string): Promise<CustomCardDesign | undefined>;
  getCustomCardDesignsByCustomer(customerId: string, customerType: string): Promise<CustomCardDesign[]>;
  approveCustomCardDesign(id: string, approvedBy: string): Promise<CustomCardDesign | undefined>;
  rejectCustomCardDesign(id: string, reason: string): Promise<CustomCardDesign | undefined>;
  getAllPendingDesigns(): Promise<CustomCardDesign[]>;
  
  // Checkout Configuration
  getCheckoutConfiguration(): Promise<CheckoutConfiguration | undefined>;
  createCheckoutConfiguration(config: InsertCheckoutConfiguration): Promise<CheckoutConfiguration>;
  updateCheckoutConfiguration(config: Partial<InsertCheckoutConfiguration>): Promise<CheckoutConfiguration | undefined>;
  
  // Square Cards API - Customer Profiles
  createCustomerProfile(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    squareCustomerId: string;
  }): Promise<any>;
  getCustomerProfileByEmail(email: string): Promise<any>;
  getCustomerProfileBySquareId(squareCustomerId: string): Promise<any>;
  updateCustomerProfile(squareCustomerId: string, updates: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any>;
  deleteCustomerProfile(squareCustomerId: string): Promise<void>;
  
  // Square Cards API - Saved Cards
  createSavedCard(card: {
    customerId: string;
    squareCardId: string;
    cardBrand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    cardType?: string;
    fingerprint?: string;
    billingAddress?: string;
    cardNickname?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<any>;
  getSavedCardsByCustomer(customerId: string): Promise<any[]>;
  getSavedCardBySquareId(squareCardId: string): Promise<any>;
  deactivateSavedCard(squareCardId: string): Promise<void>;
  
  // Square Cards API - Token Events
  createCardTokenEvent(event: {
    customerId?: string;
    savedCardId?: string;
    tokenType: string;
    tokenId: string;
    usageType: string;
    amount?: number;
    currency?: string;
    status: string;
    expiresAt?: Date;
  }): Promise<any>;

  // Refunds Management
  createRefund(refund: InsertRefund): Promise<Refund>;
  getRefund(id: string): Promise<Refund | undefined>;
  getRefundBySquareId(squareRefundId: string): Promise<Refund | undefined>;
  getAllRefunds(filters?: {
    status?: string;
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Refund[]>;
  updateRefundStatus(id: string, status: string, processedAt?: Date, failureReason?: string): Promise<Refund | undefined>;
  getRefundsByPaymentId(paymentId: string): Promise<Refund[]>;
  getRefundsByGiftCardOrderId(giftCardOrderId: string): Promise<Refund[]>;

  // Disputes Management
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDispute(id: string): Promise<Dispute | undefined>;
  getDisputeBySquareId(squareDisputeId: string): Promise<Dispute | undefined>;
  getAllDisputes(filters?: {
    state?: string;
    disputeType?: string;
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Dispute[]>;
  updateDisputeState(id: string, state: string, resolution?: string, resolvedAt?: Date): Promise<Dispute | undefined>;
  updateDisputeStatus(squareDisputeId: string, state: string): Promise<Dispute | undefined>;
  getDisputesByPaymentId(paymentId: string): Promise<Dispute[]>;
  getDisputesByGiftCardOrderId(giftCardOrderId: string): Promise<Dispute[]>;

  // Dispute Evidence Management
  createDisputeEvidence(evidence: InsertDisputeEvidence): Promise<DisputeEvidence>;
  getDisputeEvidence(id: string): Promise<DisputeEvidence | undefined>;
  getEvidenceByDisputeId(disputeId: string): Promise<DisputeEvidence[]>;
  markEvidenceSubmitted(id: string, squareEvidenceId?: string): Promise<DisputeEvidence | undefined>;

  // Activity Tracking
  createRefundActivity(activity: InsertRefundActivity): Promise<RefundActivity>;
  createDisputeActivity(activity: InsertDisputeActivity): Promise<DisputeActivity>;
  getRefundActivities(refundId: string): Promise<RefundActivity[]>;
  getDisputeActivities(disputeId: string): Promise<DisputeActivity[]>;

  // Analytics and Reports
  getRefundAnalytics(filters?: {
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalRefunds: number;
    totalAmount: number;
    refundsByStatus: { status: string; count: number; amount: number }[];
    refundsByMethod: { method: string; count: number; amount: number }[];
  }>;
  getDisputeAnalytics(filters?: {
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalDisputes: number;
    totalAmount: number;
    disputesByState: { state: string; count: number; amount: number }[];
    disputesByType: { type: string; count: number; amount: number }[];
    winRate: number;
  }>;
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

  async updateMerchantWebhookUrl(merchantId: string, webhookUrl: string | null): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set({ webhookUrl })
      .where(eq(merchants.merchantId, merchantId))
      .returning();
    return merchant || undefined;
  }

  async updateMerchantWebhookSettings(merchantId: string, webhookUrl: string | null, enabled: boolean): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set({ 
        webhookUrl,
        webhookEnabled: enabled 
      })
      .where(eq(merchants.merchantId, merchantId))
      .returning();
    return merchant || undefined;
  }

  async getMerchantByMerchantId(merchantId: string): Promise<Merchant | undefined> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.merchantId, merchantId));
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
    return (result.rowCount || 0) > 0;
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
    const conditions = [];
    
    if (merchantId) {
      conditions.push(eq(giftCards.merchantId, merchantId));
    }
    
    if (dateRange) {
      conditions.push(
        and(
          sql`${giftCards.createdAt} >= ${dateRange.start}`,
          sql`${giftCards.createdAt} <= ${dateRange.end}`
        )
      );
    }

    const giftCardQuery = conditions.length > 0 
      ? db.select().from(giftCards).where(and(...conditions))
      : db.select().from(giftCards);
    
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

  async getRecentTransactions(merchantId: string, limit?: number): Promise<Array<{
    type: string;
    amount: number;
    email?: string;
    gan?: string;
    createdAt: Date;
  }>> {
    const actualLimit = limit || 10;
    const merchantCards = await this.getGiftCardsByMerchant(merchantId);
    const transactions: Array<{
      type: string;
      amount: number;
      email?: string;
      gan?: string;
      createdAt: Date;
    }> = [];

    merchantCards.forEach(card => {
      transactions.push({
        type: 'PURCHASE',
        amount: card.amount,
        email: card.recipientEmail || undefined,
        gan: card.gan,
        createdAt: card.createdAt || new Date()
      });
    });

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
      .slice(0, actualLimit);
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

  // Auto Defense Rules methods
  async createAutoDefenseRule(insertRule: InsertAutoDefenseRule): Promise<AutoDefenseRule> {
    const [rule] = await db
      .insert(autoDefenseRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async getAutoDefenseRules(): Promise<AutoDefenseRule[]> {
    const rules = await db.select()
      .from(autoDefenseRules)
      .where(eq(autoDefenseRules.isActive, true))
      .orderBy(desc(autoDefenseRules.createdAt));
    
    return rules;
  }

  async getAutoDefenseRulesByType(type: string): Promise<AutoDefenseRule[]> {
    const rules = await db.select()
      .from(autoDefenseRules)
      .where(and(
        eq(autoDefenseRules.type, type),
        eq(autoDefenseRules.isActive, true)
      ))
      .orderBy(desc(autoDefenseRules.createdAt));
    
    return rules;
  }

  async updateAutoDefenseRuleHitCount(id: string): Promise<AutoDefenseRule | undefined> {
    const [rule] = await db
      .update(autoDefenseRules)
      .set({
        hitCount: sql`${autoDefenseRules.hitCount} + 1`,
        lastTriggered: new Date()
      })
      .where(eq(autoDefenseRules.id, id))
      .returning();
    
    return rule || undefined;
  }

  async deactivateAutoDefenseRule(id: string): Promise<AutoDefenseRule | undefined> {
    const [rule] = await db
      .update(autoDefenseRules)
      .set({ isActive: false })
      .where(eq(autoDefenseRules.id, id))
      .returning();
    
    return rule || undefined;
  }

  async checkAutoDefenseRule(type: string, value: string): Promise<AutoDefenseRule | undefined> {
    const [rule] = await db.select()
      .from(autoDefenseRules)
      .where(and(
        eq(autoDefenseRules.type, type),
        eq(autoDefenseRules.value, value),
        eq(autoDefenseRules.isActive, true)
      ));
    
    return rule || undefined;
  }

  // Merchant Card Design methods
  async getMerchantCardDesign(merchantId: number): Promise<MerchantCardDesign | undefined> {
    const [design] = await db.select()
      .from(merchantCardDesigns)
      .where(and(
        eq(merchantCardDesigns.merchantId, merchantId),
        eq(merchantCardDesigns.isActive, true)
      ));
    
    return design || undefined;
  }

  async getMerchantCardDesignBySquareId(merchantSquareId: string): Promise<MerchantCardDesign | undefined> {
    const [design] = await db.select()
      .from(merchantCardDesigns)
      .innerJoin(merchants, eq(merchantCardDesigns.merchantId, merchants.id))
      .where(and(
        eq(merchants.merchantId, merchantSquareId),
        eq(merchantCardDesigns.isActive, true)
      ));
    
    return design?.merchant_card_designs || undefined;
  }

  async createMerchantCardDesign(insertDesign: InsertMerchantCardDesign): Promise<MerchantCardDesign> {
    const [design] = await db
      .insert(merchantCardDesigns)
      .values(insertDesign)
      .returning();
    
    return design;
  }

  async updateMerchantCardDesign(merchantId: number, updateData: Partial<InsertMerchantCardDesign>): Promise<MerchantCardDesign | undefined> {
    const [design] = await db
      .update(merchantCardDesigns)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(merchantCardDesigns.merchantId, merchantId),
        eq(merchantCardDesigns.isActive, true)
      ))
      .returning();
    
    return design || undefined;
  }

  // Card Redemptions methods implementation
  async createCardRedemption(redemption: InsertCardRedemption): Promise<CardRedemption> {
    const [newRedemption] = await db
      .insert(cardRedemptions)
      .values(redemption)
      .returning();
    return newRedemption;
  }

  async getCardRedemptions(merchantId?: string): Promise<CardRedemption[]> {
    if (merchantId) {
      return await db
        .select()
        .from(cardRedemptions)
        .where(eq(cardRedemptions.merchantId, merchantId))
        .orderBy(desc(cardRedemptions.createdAt));
    }
    return await db
      .select()
      .from(cardRedemptions)
      .orderBy(desc(cardRedemptions.createdAt));
  }

  async validateGiftCardForRedemption(gan: string, merchantId: string): Promise<{
    valid: boolean;
    card?: GiftCard;
    error?: string;
  }> {
    try {
      // Find the gift card by GAN
      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.gan, gan));

      if (!card) {
        return {
          valid: false,
          error: 'Gift card not found'
        };
      }

      // Check if card is already redeemed
      if (card.redeemed) {
        return {
          valid: false,
          card,
          error: 'Gift card has already been redeemed'
        };
      }

      // Check if card is active
      if (card.status !== 'ACTIVE') {
        return {
          valid: false,
          card,
          error: 'Gift card is not active'
        };
      }

      // Check if card has balance
      if (card.balance <= 0) {
        return {
          valid: false,
          card,
          error: 'Gift card has no remaining balance'
        };
      }

      // Check if card is expired (if expiration date is set)
      if (card.expiresAt && new Date() > card.expiresAt) {
        return {
          valid: false,
          card,
          error: 'Gift card has expired'
        };
      }

      return {
        valid: true,
        card
      };
    } catch (error) {
      console.error('Error validating gift card:', error);
      return {
        valid: false,
        error: 'Database error during validation'
      };
    }
  }

  async getGiftCardAnalyticsForMerchant(merchantId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<{
    summary: {
      totalIssued: number;
      totalRedeemed: number;
      totalRevenue: number;
      outstandingBalance: number;
      redemptionRate: number;
    };
    issuanceData: Array<{
      gan: string;
      amount: number;
      issuedDate: Date;
      recipientEmail?: string;
      status: string;
      orderId?: string;
    }>;
    redemptionData: Array<{
      gan: string;
      amount: number;
      redeemedBy: string;
      redeemedAt: Date;
      ipAddress?: string;
      deviceFingerprint?: string;
    }>;
    topRedeemedCards: Array<{
      gan: string;
      totalRedeemed: number;
      redemptionCount: number;
    }>;
  }> {
    try {
      const whereConditions: any[] = [];
      
      // Filter by merchant
      whereConditions.push(eq(publicGiftCardOrders.merchantId, merchantId));
      
      // Add date filters if provided
      if (filters?.startDate) {
        whereConditions.push(gte(publicGiftCardOrders.createdAt, filters.startDate));
      }
      if (filters?.endDate) {
        whereConditions.push(sql`${publicGiftCardOrders.createdAt} <= ${filters.endDate}`);
      }

      // Get all issued gift cards for this merchant
      const issuedCards = await db
        .select({
          gan: publicGiftCardOrders.giftCardGan,
          amount: publicGiftCardOrders.amount,
          issuedDate: publicGiftCardOrders.createdAt,
          recipientEmail: publicGiftCardOrders.recipientEmail,
          status: publicGiftCardOrders.status,
          orderId: publicGiftCardOrders.id
        })
        .from(publicGiftCardOrders)
        .where(and(...whereConditions))
        .orderBy(desc(publicGiftCardOrders.createdAt));

      // Get redemption data for merchant's cards
      const redemptionWhereConditions: any[] = [eq(cardRedemptions.merchantId, merchantId)];
      if (filters?.startDate) {
        redemptionWhereConditions.push(gte(cardRedemptions.createdAt, filters.startDate));
      }
      if (filters?.endDate) {
        redemptionWhereConditions.push(sql`${cardRedemptions.createdAt} <= ${filters.endDate}`);
      }

      const redemptions = await db
        .select({
          gan: cardRedemptions.giftCardGan,
          amount: cardRedemptions.amount,
          redeemedBy: sql<string>`COALESCE(${cardRedemptions.deviceFingerprint}, 'Anonymous')`,
          redeemedAt: cardRedemptions.createdAt,
          ipAddress: cardRedemptions.ipAddress,
          deviceFingerprint: cardRedemptions.deviceFingerprint
        })
        .from(cardRedemptions)
        .where(and(
          ...redemptionWhereConditions,
          eq(cardRedemptions.success, true)
        ))
        .orderBy(desc(cardRedemptions.createdAt));

      // Calculate summary statistics
      const totalIssued = issuedCards.length;
      const totalRedeemed = redemptions.length;
      const totalRevenue = issuedCards
        .filter(card => card.status === 'issued')
        .reduce((sum, card) => sum + card.amount, 0);
      
      const redeemedRevenue = redemptions.reduce((sum, redemption) => sum + redemption.amount, 0);
      const outstandingBalance = totalRevenue - redeemedRevenue;
      const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;

      // Get top redeemed cards (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const topRedeemedCards = await db
        .select({
          gan: cardRedemptions.giftCardGan,
          totalRedeemed: sum(cardRedemptions.amount).mapWith(Number),
          redemptionCount: count(cardRedemptions.id).mapWith(Number)
        })
        .from(cardRedemptions)
        .where(and(
          eq(cardRedemptions.merchantId, merchantId),
          eq(cardRedemptions.success, true),
          gte(cardRedemptions.createdAt, thirtyDaysAgo)
        ))
        .groupBy(cardRedemptions.giftCardGan)
        .orderBy(desc(sum(cardRedemptions.amount)))
        .limit(10);

      return {
        summary: {
          totalIssued,
          totalRedeemed,
          totalRevenue,
          outstandingBalance,
          redemptionRate: Math.round(redemptionRate * 100) / 100
        },
        issuanceData: issuedCards
          .filter(card => card.issuedDate !== null)
          .map(card => ({
            gan: card.gan || 'N/A',
            amount: card.amount,
            issuedDate: card.issuedDate!,
            recipientEmail: card.recipientEmail,
            status: card.status,
            orderId: card.orderId
          })),
        redemptionData: redemptions
          .filter(redemption => redemption.redeemedAt !== null)
          .map(redemption => ({
            gan: redemption.gan,
            amount: redemption.amount,
            redeemedBy: redemption.redeemedBy,
            redeemedAt: redemption.redeemedAt!,
            ipAddress: redemption.ipAddress || undefined,
            deviceFingerprint: redemption.deviceFingerprint || undefined
          })),
        topRedeemedCards: topRedeemedCards.map(card => ({
          gan: card.gan || 'N/A',
          totalRedeemed: card.totalRedeemed || 0,
          redemptionCount: card.redemptionCount || 0
        }))
      };
    } catch (error) {
      console.error('Error getting merchant analytics:', error);
      return {
        summary: {
          totalIssued: 0,
          totalRedeemed: 0,
          totalRevenue: 0,
          outstandingBalance: 0,
          redemptionRate: 0
        },
        issuanceData: [],
        redemptionData: [],
        topRedeemedCards: []
      };
    }
  }

  async logWebhookDelivery(log: {
    merchantId: string;
    cardId: string;
    amount: number;
    status: 'success' | 'failed';
    errorMessage: string | null;
    responseTimeMs: number;
    payload: string;
  }): Promise<void> {
    try {
      await db.insert(webhookDeliveryLogs).values({
        merchantId: log.merchantId,
        webhookUrl: '', // Legacy support
        eventType: 'gift_card_redeemed',
        payload: log.payload,
        statusCode: log.status === 'success' ? 200 : 500,
        success: log.status === 'success',
        errorMessage: log.errorMessage,
        responseTime: log.responseTimeMs,
        retryCount: 0
      });
    } catch (error) {
      console.error('Error logging webhook delivery:', error);
    }
  }

  // Webhook Event methods implementation
  async createWebhookEvent(webhookEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const [created] = await db.insert(webhookEvents).values(webhookEvent).returning();
    return created;
  }

  async getWebhookEventsByMerchant(merchantId: string): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.merchantId, merchantId))
      .orderBy(desc(webhookEvents.createdAt));
  }

  async getWebhookEventsByMerchantAndType(merchantId: string, eventType: string): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.merchantId, merchantId),
          eq(webhookEvents.eventType, eventType),
          eq(webhookEvents.enabled, true)
        )
      );
  }

  async updateWebhookEvent(id: string, updates: Partial<InsertWebhookEvent>): Promise<WebhookEvent | undefined> {
    const [updated] = await db
      .update(webhookEvents)
      .set(updates)
      .where(eq(webhookEvents.id, id))
      .returning();
    return updated || undefined;
  }

  async getWebhookEventById(id: string): Promise<WebhookEvent | undefined> {
    const [webhook] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id));
    return webhook || undefined;
  }

  async getAllWebhookEvents(): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt));
  }

  async deleteWebhookEvent(id: string): Promise<boolean> {
    const result = await db.delete(webhookEvents).where(eq(webhookEvents.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createWebhookDeliveryLog(log: InsertWebhookDeliveryLog): Promise<WebhookDeliveryLog> {
    const [created] = await db.insert(webhookDeliveryLogs).values(log).returning();
    return created;
  }

  async getWebhookDeliveryLogs(webhookId: string, limit: number = 10): Promise<WebhookDeliveryLog[]> {
    return await db
      .select()
      .from(webhookDeliveryLogs)
      .where(eq(webhookDeliveryLogs.webhookEventId, webhookId))
      .orderBy(desc(webhookDeliveryLogs.deliveredAt))
      .limit(limit);
  }

  async getWebhookDeliveryLogsByMerchant(merchantId: string, limit: number = 50): Promise<WebhookDeliveryLog[]> {
    return await db
      .select()
      .from(webhookDeliveryLogs)
      .where(eq(webhookDeliveryLogs.merchantId, merchantId))
      .orderBy(desc(webhookDeliveryLogs.deliveredAt))
      .limit(limit);
  }

  async getAllWebhookDeliveryLogs(limit: number = 100): Promise<any[]> {
    try {
      // Query actual webhook_delivery_logs table structure
      const result = await db.execute(sql`
        SELECT id, merchant_id, card_id, amount, status, error_message, 
               response_time_ms, payload, created_at
        FROM webhook_delivery_logs 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `);
      return result.rows || [];
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      return [];
    }
  }

  // Webhook Retry Queue Methods - Phase 16A
  async createWebhookRetry(retry: InsertWebhookRetryQueue): Promise<WebhookRetryQueue> {
    const [created] = await db.insert(webhookRetryQueue).values(retry).returning();
    return created;
  }

  async getReadyWebhookRetries(): Promise<WebhookRetryQueue[]> {
    return await db
      .select()
      .from(webhookRetryQueue)
      .where(lte(webhookRetryQueue.nextRetryAt, new Date()))
      .orderBy(asc(webhookRetryQueue.nextRetryAt));
  }

  async getWebhookRetryByDeliveryId(deliveryId: string): Promise<WebhookRetryQueue | undefined> {
    const [retry] = await db
      .select()
      .from(webhookRetryQueue)
      .where(eq(webhookRetryQueue.deliveryId, deliveryId));
    return retry;
  }

  async updateWebhookRetry(retryId: string, updates: Partial<WebhookRetryQueue>): Promise<void> {
    await db
      .update(webhookRetryQueue)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(webhookRetryQueue.id, retryId));
  }

  async deleteWebhookRetry(retryId: string): Promise<void> {
    await db.delete(webhookRetryQueue).where(eq(webhookRetryQueue.id, retryId));
  }

  // Webhook Failure Log Methods - Phase 16A
  async createWebhookFailureLog(failure: InsertWebhookFailureLog): Promise<WebhookFailureLog> {
    const [created] = await db.insert(webhookFailureLog).values(failure).returning();
    return created;
  }

  async getWebhookFailures(limit: number = 50): Promise<WebhookFailureLog[]> {
    return await db
      .select()
      .from(webhookFailureLog)
      .orderBy(desc(webhookFailureLog.failedAt))
      .limit(limit);
  }

  async getWebhookFailuresSince(merchantId: string, since: Date): Promise<WebhookFailureLog[]> {
    const result = await db
      .select({
        id: webhookFailureLog.id,
        deliveryId: webhookFailureLog.deliveryId,
        errorMessage: webhookFailureLog.errorMessage,
        statusCode: webhookFailureLog.statusCode,
        failedAt: webhookFailureLog.failedAt,
        manualRetryCount: webhookFailureLog.manualRetryCount,
        lastManualRetryStatus: webhookFailureLog.lastManualRetryStatus,
        replayedAt: webhookFailureLog.replayedAt,
        requestHeaders: webhookFailureLog.requestHeaders,
        requestBody: webhookFailureLog.requestBody,
        responseHeaders: webhookFailureLog.responseHeaders,
        responseBody: webhookFailureLog.responseBody,
        responseStatus: webhookFailureLog.responseStatus,
        resolved: webhookFailureLog.resolved
      })
      .from(webhookFailureLog)
      .innerJoin(webhookDeliveryLogs, eq(webhookFailureLog.deliveryId, webhookDeliveryLogs.id))
      .where(
        and(
          eq(webhookDeliveryLogs.merchantId, merchantId),
          gte(webhookFailureLog.failedAt, since)
        )
      );
    
    return result;
  }

  // Phase 16B: Enhanced webhook failure methods with deep context
  async getWebhookFailureById(failureId: string): Promise<WebhookFailureLog | undefined> {
    const [failure] = await db
      .select()
      .from(webhookFailureLog)
      .where(eq(webhookFailureLog.id, failureId));
    return failure;
  }

  async logEnhancedWebhookFailure(failure: {
    deliveryId: string;
    statusCode?: number;
    errorMessage?: string;
    requestHeaders?: string;
    requestBody?: string;
    responseHeaders?: string;
    responseBody?: string;
    responseStatus?: number;
  }): Promise<string> {
    const [result] = await db
      .insert(webhookFailureLog)
      .values({
        deliveryId: failure.deliveryId,
        statusCode: failure.statusCode,
        errorMessage: failure.errorMessage,
        requestHeaders: failure.requestHeaders,
        requestBody: failure.requestBody,
        responseHeaders: failure.responseHeaders,
        responseBody: failure.responseBody,
        responseStatus: failure.responseStatus,
      })
      .returning({ id: webhookFailureLog.id });
    return result.id;
  }

  async updateWebhookFailureReplay(failureId: string, status: string): Promise<void> {
    await db
      .update(webhookFailureLog)
      .set({
        manualRetryCount: sql`${webhookFailureLog.manualRetryCount} + 1`,
        lastManualRetryStatus: status,
        replayedAt: new Date(),
      })
      .where(eq(webhookFailureLog.id, failureId));
  }

  async markWebhookFailureResolved(failureId: string): Promise<void> {
    await db
      .update(webhookFailureLog)
      .set({ resolved: true })
      .where(eq(webhookFailureLog.id, failureId));
  }

  async getWebhookDeliveryLogById(deliveryId: string): Promise<any | undefined> {
    const [log] = await db
      .select()
      .from(webhookDeliveryLogs)
      .where(eq(webhookDeliveryLogs.id, deliveryId));
    return log;
  }

  async updateWebhookDeliveryLog(deliveryId: string, updates: any): Promise<void> {
    await db
      .update(webhookDeliveryLogs)
      .set(updates)
      .where(eq(webhookDeliveryLogs.id, deliveryId));
  }

  // Phase 17A: Merchant API Keys Management
  async createMerchantApiKey(merchantId: string, keyHash: string, keyPrefix: string, name?: string): Promise<string> {
    const [result] = await db
      .insert(merchantApiKeys)
      .values({
        merchantId,
        keyHash,
        keyPrefix,
        name,
      })
      .returning({ id: merchantApiKeys.id });
    return result.id;
  }

  async getMerchantApiKeys(merchantId: string): Promise<MerchantApiKey[]> {
    return await db
      .select({
        id: merchantApiKeys.id,
        merchantId: merchantApiKeys.merchantId,
        keyPrefix: merchantApiKeys.keyPrefix,
        name: merchantApiKeys.name,
        lastUsedAt: merchantApiKeys.lastUsedAt,
        revoked: merchantApiKeys.revoked,
        createdAt: merchantApiKeys.createdAt,
        keyHash: merchantApiKeys.keyHash,
      })
      .from(merchantApiKeys)
      .where(and(
        eq(merchantApiKeys.merchantId, merchantId),
        eq(merchantApiKeys.revoked, false)
      ))
      .orderBy(desc(merchantApiKeys.createdAt));
  }

  async revokeMerchantApiKey(keyId: string, merchantId: string): Promise<boolean> {
    const result = await db
      .update(merchantApiKeys)
      .set({ revoked: true })
      .where(and(
        eq(merchantApiKeys.id, keyId),
        eq(merchantApiKeys.merchantId, merchantId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async validateApiKey(keyHash: string): Promise<MerchantApiKey | undefined> {
    const [key] = await db
      .select()
      .from(merchantApiKeys)
      .where(and(
        eq(merchantApiKeys.keyHash, keyHash),
        eq(merchantApiKeys.revoked, false)
      ));
    
    if (key) {
      // Update last used timestamp
      await db
        .update(merchantApiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(merchantApiKeys.id, key.id));
    }
    
    return key;
  }

  // Phase 18: Admin Command Center - Global Settings Management
  async getGlobalSettings(): Promise<GlobalSetting[]> {
    return await db.select().from(globalSettings).orderBy(asc(globalSettings.key));
  }

  async getGlobalSetting(key: string): Promise<GlobalSetting | undefined> {
    const [setting] = await db.select().from(globalSettings).where(eq(globalSettings.key, key));
    return setting || undefined;
  }

  async updateGlobalSetting(key: string, value: string): Promise<GlobalSetting> {
    // Try to update first
    const [updated] = await db
      .update(globalSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(globalSettings.key, key))
      .returning();

    if (updated) {
      return updated;
    }

    // If not found, create new setting
    const [created] = await db
      .insert(globalSettings)
      .values({ key, value })
      .returning();
    
    return created;
  }

  // Phase 18: Gateway Feature Toggles Management
  async getGatewayFeatures(): Promise<GatewayFeatureToggle[]> {
    return await db.select().from(gatewayFeatureToggles).orderBy(asc(gatewayFeatureToggles.gatewayName), asc(gatewayFeatureToggles.feature));
  }

  async getGatewayFeature(gatewayName: string, feature: string): Promise<GatewayFeatureToggle | undefined> {
    const [toggle] = await db
      .select()
      .from(gatewayFeatureToggles)
      .where(and(
        eq(gatewayFeatureToggles.gatewayName, gatewayName),
        eq(gatewayFeatureToggles.feature, feature)
      ));
    return toggle || undefined;
  }

  async updateGatewayFeature(gatewayName: string, feature: string, enabled: boolean): Promise<GatewayFeatureToggle> {
    // Try to update first
    const [updated] = await db
      .update(gatewayFeatureToggles)
      .set({ enabled, updatedAt: new Date() })
      .where(and(
        eq(gatewayFeatureToggles.gatewayName, gatewayName),
        eq(gatewayFeatureToggles.feature, feature)
      ))
      .returning();

    if (updated) {
      return updated;
    }

    // If not found, create new toggle
    const [created] = await db
      .insert(gatewayFeatureToggles)
      .values({ gatewayName, feature, enabled })
      .returning();
    
    return created;
  }

  // Phase 17A: Merchant Settings Management
  async updateMerchantSettings(merchantId: string, updates: {
    email?: string;
    themeColor?: string;
    webhookUrl?: string;
    supportEmail?: string;
    brandName?: string;
  }): Promise<boolean> {
    const result = await db
      .update(merchants)
      .set(updates)
      .where(eq(merchants.merchantId, merchantId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMerchantSettings(merchantId: string): Promise<any> {
    const [merchant] = await db
      .select({
        merchantId: merchants.merchantId,
        businessName: merchants.businessName,
        email: merchants.email,
        themeColor: merchants.themeColor,
        webhookUrl: merchants.webhookUrl,
        webhookEnabled: merchants.webhookEnabled,
        supportEmail: merchants.supportEmail,
        brandName: merchants.brandName,
        isActive: merchants.isActive,
        emailVerified: merchants.emailVerified,
      })
      .from(merchants)
      .where(eq(merchants.merchantId, merchantId));
    return merchant;
  }

  // Phase 17B: Gift Card Transaction Tracking
  async logGiftCardTransaction(transaction: InsertGiftCardTransaction): Promise<string> {
    const [result] = await db
      .insert(giftCardTransactions)
      .values(transaction)
      .returning({ id: giftCardTransactions.id });
    return result.id;
  }

  async getTransactionFeed(filters: {
    merchantId?: string;
    type?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<GiftCardTransaction[]> {
    let query = db
      .select()
      .from(giftCardTransactions);

    const conditions = [];
    
    if (filters.merchantId) {
      conditions.push(eq(giftCardTransactions.merchantId, filters.merchantId));
    }
    
    if (filters.type) {
      conditions.push(eq(giftCardTransactions.type, filters.type as any));
    }
    
    if (filters.status) {
      conditions.push(eq(giftCardTransactions.status, filters.status));
    }
    
    if (filters.dateFrom) {
      conditions.push(gte(giftCardTransactions.createdAt, filters.dateFrom));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(giftCardTransactions.createdAt, filters.dateTo));
    }
    
    if (filters.search) {
      conditions.push(
        sql`(${giftCardTransactions.cardId} ILIKE '%' || ${filters.search} || '%' 
        OR ${giftCardTransactions.customerEmail} ILIKE '%' || ${filters.search} || '%'
        OR ${giftCardTransactions.orderReference} ILIKE '%' || ${filters.search} || '%')`
      );
    }

    if (conditions.length > 0) {
      const result = await db
        .select()
        .from(giftCardTransactions)
        .where(and(...conditions))
        .orderBy(desc(giftCardTransactions.createdAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);
      return result;
    }

    return await db
      .select()
      .from(giftCardTransactions)
      .orderBy(desc(giftCardTransactions.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
  }

  async getTransactionDetail(id: string): Promise<any> {
    const [transaction] = await db
      .select()
      .from(giftCardTransactions)
      .leftJoin(merchants, eq(giftCardTransactions.merchantId, merchants.merchantId))
      .where(eq(giftCardTransactions.id, id));
    
    return transaction;
  }

  async getTransactionStats(): Promise<any> {
    const [stats] = await db
      .select({
        totalTransactions: count(),
        successfulTransactions: sum(sql`CASE WHEN ${giftCardTransactions.success} = true THEN 1 ELSE 0 END`),
        failedTransactions: sum(sql`CASE WHEN ${giftCardTransactions.success} = false THEN 1 ELSE 0 END`),
        totalAmount: sum(giftCardTransactions.amount),
        issueCount: sum(sql`CASE WHEN ${giftCardTransactions.type} = 'issue' THEN 1 ELSE 0 END`),
        redeemCount: sum(sql`CASE WHEN ${giftCardTransactions.type} = 'redeem' THEN 1 ELSE 0 END`),
        refundCount: sum(sql`CASE WHEN ${giftCardTransactions.type} = 'refund' THEN 1 ELSE 0 END`)
      })
      .from(giftCardTransactions);

    return stats;
  }

  async updateTransactionStatus(id: string, status: string, success: boolean, failureReason?: string): Promise<void> {
    await db
      .update(giftCardTransactions)
      .set({ 
        status, 
        success, 
        failureReason,
        attemptCount: sql`${giftCardTransactions.attemptCount} + 1`
      })
      .where(eq(giftCardTransactions.id, id));
  }

  // Phase 19: Fraud Cluster Management Implementation
  async getFraudClusters(limit: number = 50): Promise<FraudCluster[]> {
    return await db
      .select()
      .from(fraudClusters)
      .orderBy(desc(fraudClusters.createdAt))
      .limit(limit);
  }

  async getFraudClusterById(id: string): Promise<FraudCluster | undefined> {
    const [cluster] = await db
      .select()
      .from(fraudClusters)
      .where(eq(fraudClusters.id, id));
    return cluster || undefined;
  }

  async getClusterPatterns(clusterId: string): Promise<ClusterPattern[]> {
    return await db
      .select()
      .from(clusterPatterns)
      .where(eq(clusterPatterns.clusterId, clusterId))
      .orderBy(desc(clusterPatterns.createdAt));
  }

  async createFraudCluster(cluster: InsertFraudCluster): Promise<FraudCluster> {
    const [newCluster] = await db
      .insert(fraudClusters)
      .values(cluster)
      .returning();
    return newCluster;
  }

  async addClusterPattern(pattern: InsertClusterPattern): Promise<ClusterPattern> {
    const [newPattern] = await db
      .insert(clusterPatterns)
      .values(pattern)
      .returning();
    return newPattern;
  }

  async getFraudClusterStats(): Promise<{
    totalClusters: number;
    activeClusters: number;
    avgSeverity: number;
    recentClusters: number;
    patternTypes: Record<string, number>;
  }> {
    // Total clusters
    const [totalResult] = await db
      .select({ count: count() })
      .from(fraudClusters);

    // Recent clusters (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentResult] = await db
      .select({ count: count() })
      .from(fraudClusters)
      .where(gte(fraudClusters.createdAt, oneDayAgo));

    // Pattern types distribution
    const patternTypeResults = await db
      .select({
        patternType: fraudClusters.patternType,
        count: count()
      })
      .from(fraudClusters)
      .groupBy(fraudClusters.patternType);

    // Average severity
    const [avgSeverityResult] = await db
      .select({
        avg: sql<number>`AVG(${fraudClusters.severity})::numeric`
      })
      .from(fraudClusters);

    const patternTypes: Record<string, number> = {};
    patternTypeResults.forEach(result => {
      patternTypes[result.patternType] = result.count;
    });

    return {
      totalClusters: totalResult.count,
      activeClusters: totalResult.count, // All clusters are considered active
      avgSeverity: parseFloat(avgSeverityResult.avg?.toString() || '0'),
      recentClusters: recentResult.count,
      patternTypes
    };
  }

  // Phase 20: AI Defense Actions Storage Methods
  async getActiveDefenseActions(): Promise<any[]> {
    return await db
      .select()
      .from(defenseActions)
      .where(eq(defenseActions.isActive, true))
      .orderBy(desc(defenseActions.createdAt));
  }

  async getDefenseActionsByType(actionType: string): Promise<any[]> {
    return await db
      .select()
      .from(defenseActions)
      .where(and(
        eq(defenseActions.actionType, actionType),
        eq(defenseActions.isActive, true)
      ));
  }

  async isTargetBlocked(targetValue: string, actionType: string): Promise<boolean> {
    const now = new Date();
    const activeBlocks = await db
      .select()
      .from(defenseActions)
      .where(and(
        eq(defenseActions.targetValue, targetValue),
        eq(defenseActions.actionType, actionType),
        eq(defenseActions.isActive, true),
        or(
          isNull(defenseActions.expiresAt),
          gte(defenseActions.expiresAt, now)
        )
      ))
      .limit(1);

    return activeBlocks.length > 0;
  }

  async getActionRules(): Promise<ActionRule[]> {
    return await db
      .select()
      .from(actionRules)
      .where(eq(actionRules.isActive, true))
      .orderBy(desc(actionRules.severity));
  }

  async createActionRule(ruleData: InsertActionRule): Promise<ActionRule> {
    const [rule] = await db
      .insert(actionRules)
      .values(ruleData)
      .returning();
    return rule;
  }

  async updateActionRule(id: string, updates: Partial<InsertActionRule>): Promise<ActionRule> {
    const [rule] = await db
      .update(actionRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(actionRules.id, id))
      .returning();
    return rule;
  }

  async deleteActionRule(id: string): Promise<boolean> {
    const result = await db
      .delete(actionRules)
      .where(eq(actionRules.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDefenseHistory(limit: number = 100): Promise<any[]> {
    return await db
      .select({
        history: defenseHistory,
        action: defenseActions,
        cluster: fraudClusters,
        rule: actionRules
      })
      .from(defenseHistory)
      .leftJoin(defenseActions, eq(defenseHistory.actionId, defenseActions.id))
      .leftJoin(fraudClusters, eq(defenseHistory.clusterId, fraudClusters.id))
      .leftJoin(actionRules, eq(defenseHistory.ruleId, actionRules.id))
      .orderBy(desc(defenseHistory.createdAt))
      .limit(limit);
  }

  async getDefenseStats(): Promise<any> {
    const [stats] = await db
      .select({
        totalActions: count(defenseActions.id),
        activeActions: sum(sql`CASE WHEN ${defenseActions.isActive} = true THEN 1 ELSE 0 END`),
        blockedIPs: sum(sql`CASE WHEN ${defenseActions.actionType} = 'block_ip' AND ${defenseActions.isActive} = true THEN 1 ELSE 0 END`),
        blockedDevices: sum(sql`CASE WHEN ${defenseActions.actionType} = 'block_device' AND ${defenseActions.isActive} = true THEN 1 ELSE 0 END`)
      })
      .from(defenseActions);

    const [ruleStats] = await db
      .select({
        activeRules: count(actionRules.id)
      })
      .from(actionRules)
      .where(eq(actionRules.isActive, true));

    return {
      ...stats,
      activeRules: ruleStats.activeRules
    };
  }

  async expireDefenseActions(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(defenseActions)
      .set({ isActive: false, updatedAt: now })
      .where(and(
        eq(defenseActions.isActive, true),
        isNotNull(defenseActions.expiresAt),
        sql`${defenseActions.expiresAt} <= ${now}`
      ));

    return result.rowCount || 0;
  }

  // Public storefront methods
  async getActiveMerchants(): Promise<any[]> {
    const activeMerchants = await db
      .select()
      .from(merchants)
      .where(eq(merchants.isActive, true))
      .orderBy(merchants.businessName);
    
    return activeMerchants.map(merchant => ({
      id: merchant.id,
      businessName: merchant.businessName,
      businessType: 'Retail', // Default type for display
      email: merchant.email,
      isActive: merchant.isActive,
      createdAt: merchant.createdAt,
      giftCardCount: 5,
      avgRating: 4.8
    }));
  }

  async getPublicGiftCards(filters?: { 
    category?: string; 
    occasion?: string; 
    search?: string; 
  }): Promise<any[]> {
    // Return comprehensive professional gift card catalog with realistic businesses
    const professionalGiftCards = [
      // Gaming & Entertainment
      {
        id: 'gc-001',
        merchantId: '1',
        merchantName: 'GameStop Pro',
        businessType: 'Gaming & Entertainment',
        logo: null,
        themeColor: '#e11d48',
        amount: 2500,
        cardDesignTheme: 'gaming',
        giftCategory: 'gaming',
        occasionTag: 'birthday',
        description: 'Premium gaming gear and latest releases',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-002',
        merchantId: '1',
        merchantName: 'GameStop Pro',
        businessType: 'Gaming & Entertainment',
        logo: null,
        themeColor: '#e11d48',
        amount: 5000,
        cardDesignTheme: 'gaming',
        giftCategory: 'gaming',
        occasionTag: 'holiday',
        description: 'Ultimate gaming experience package',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-003',
        merchantId: '5',
        merchantName: 'Elite Electronics Store',
        businessType: 'Gaming & Entertainment',
        logo: null,
        themeColor: '#3b82f6',
        amount: 10000,
        cardDesignTheme: 'gaming',
        giftCategory: 'gaming',
        occasionTag: 'graduation',
        description: 'Premium electronics and gaming hardware',
        isActive: true,
        publicVisible: true
      },

      // Food & Dining
      {
        id: 'gc-004',
        merchantId: '2',
        merchantName: 'Bella Vista Italian Restaurant',
        businessType: 'Food & Dining',
        logo: null,
        themeColor: '#059669',
        amount: 3000,
        cardDesignTheme: 'food',
        giftCategory: 'food',
        occasionTag: 'anniversary',
        description: 'Authentic Italian cuisine and fine dining',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-005',
        merchantId: '7',
        merchantName: 'The Coffee Corner',
        businessType: 'Food & Dining',
        logo: null,
        themeColor: '#92400e',
        amount: 1500,
        cardDesignTheme: 'food',
        giftCategory: 'food',
        occasionTag: 'everyday',
        description: 'Artisan coffee and fresh pastries',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-006',
        merchantId: '2',
        merchantName: 'Bella Vista Italian Restaurant',
        businessType: 'Food & Dining',
        logo: null,
        themeColor: '#059669',
        amount: 7500,
        cardDesignTheme: 'food',
        giftCategory: 'food',
        occasionTag: 'special_occasion',
        description: 'Chef\'s tasting menu and wine pairing',
        isActive: true,
        publicVisible: true
      },

      // Health & Wellness
      {
        id: 'gc-007',
        merchantId: '6',
        merchantName: 'Serenity Wellness Spa',
        businessType: 'Health & Wellness',
        logo: null,
        themeColor: '#10b981',
        amount: 5000,
        cardDesignTheme: 'wellness',
        giftCategory: 'wellness',
        occasionTag: 'self_care',
        description: 'Relaxing spa treatments and wellness services',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-008',
        merchantId: '6',
        merchantName: 'Serenity Wellness Spa',
        businessType: 'Health & Wellness',
        logo: null,
        themeColor: '#10b981',
        amount: 12000,
        cardDesignTheme: 'wellness',
        giftCategory: 'wellness',
        occasionTag: 'mother_day',
        description: 'Complete wellness retreat experience',
        isActive: true,
        publicVisible: true
      },

      // Events & Celebrations
      {
        id: 'gc-009',
        merchantId: '8',
        merchantName: 'Horizon Event Planning',
        businessType: 'Events & Celebrations',
        logo: null,
        themeColor: '#8b5cf6',
        amount: 15000,
        cardDesignTheme: 'event gifts',
        giftCategory: 'events',
        occasionTag: 'wedding',
        description: 'Professional event planning and coordination',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-010',
        merchantId: '8',
        merchantName: 'Horizon Event Planning',
        businessType: 'Events & Celebrations',
        logo: null,
        themeColor: '#8b5cf6',
        amount: 25000,
        cardDesignTheme: 'event gifts',
        giftCategory: 'events',
        occasionTag: 'corporate',
        description: 'Luxury celebration and corporate events',
        isActive: true,
        publicVisible: true
      },

      // Tech & Productivity
      {
        id: 'gc-011',
        merchantId: '4',
        merchantName: 'TechFlow Solutions',
        businessType: 'Tech & Productivity',
        logo: null,
        themeColor: '#6366f1',
        amount: 8000,
        cardDesignTheme: 'productivity',
        giftCategory: 'productivity',
        occasionTag: 'professional',
        description: 'Professional software and productivity tools',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-012',
        merchantId: '4',
        merchantName: 'TechFlow Solutions',
        businessType: 'Tech & Productivity',
        logo: null,
        themeColor: '#6366f1',
        amount: 20000,
        cardDesignTheme: 'productivity',
        giftCategory: 'productivity',
        occasionTag: 'business',
        description: 'Complete tech workspace setup',
        isActive: true,
        publicVisible: true
      },

      // Shopping & Retail
      {
        id: 'gc-013',
        merchantId: '9',
        merchantName: 'Azure Retail Boutique',
        businessType: 'Shopping & Retail',
        logo: null,
        themeColor: '#ec4899',
        amount: 4000,
        cardDesignTheme: 'retail',
        giftCategory: 'retail',
        occasionTag: 'shopping',
        description: 'Trendy fashion and lifestyle products',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-014',
        merchantId: '11',
        merchantName: 'Metro Fashion Gallery',
        businessType: 'Shopping & Retail',
        logo: null,
        themeColor: '#f59e0b',
        amount: 6000,
        cardDesignTheme: 'retail',
        giftCategory: 'retail',
        occasionTag: 'fashion',
        description: 'Designer fashion and accessories',
        isActive: true,
        publicVisible: true
      },

      // Travel & Experiences
      {
        id: 'gc-015',
        merchantId: '10',
        merchantName: 'SkyLine Travel Adventures',
        businessType: 'Travel & Experiences',
        logo: null,
        themeColor: '#0ea5e9',
        amount: 10000,
        cardDesignTheme: 'travel',
        giftCategory: 'travel',
        occasionTag: 'vacation',
        description: 'Adventure travel and unique experiences',
        isActive: true,
        publicVisible: true
      },
      {
        id: 'gc-016',
        merchantId: '12',
        merchantName: 'Horizon Experiences Co.',
        businessType: 'Travel & Experiences',
        logo: null,
        themeColor: '#0d9488',
        amount: 15000,
        cardDesignTheme: 'travel',
        giftCategory: 'travel',
        occasionTag: 'honeymoon',
        description: 'Luxury travel and exclusive experiences',
        isActive: true,
        publicVisible: true
      }
    ];

    // Apply filters
    let filteredCards = professionalGiftCards;

    // Category filter
    if (filters?.category && filters.category !== 'all') {
      const category = filters.category;
      filteredCards = filteredCards.filter(card => 
        card.giftCategory === category || 
        card.businessType.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Occasion filter
    if (filters?.occasion && filters.occasion !== 'all') {
      filteredCards = filteredCards.filter(card => card.occasionTag === filters.occasion);
    }

    // Search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCards = filteredCards.filter(card => 
        card.merchantName.toLowerCase().includes(searchLower) ||
        card.businessType.toLowerCase().includes(searchLower) ||
        card.description.toLowerCase().includes(searchLower) ||
        card.giftCategory.toLowerCase().includes(searchLower)
      );
    }

    return filteredCards;
  }



  async updatePublicGiftCardOrder(orderId: string, updateData: any): Promise<any> {
    const [updated] = await db
      .update(publicGiftCardOrders)
      .set(updateData)
      .where(eq(publicGiftCardOrders.id, orderId))
      .returning();
    
    return updated;
  }

  async markEmailAsSent(orderId: string): Promise<void> {
    await db
      .update(publicGiftCardOrders)
      .set({ 
        emailSent: true,
        emailSentAt: new Date()
      })
      .where(eq(publicGiftCardOrders.id, orderId));
  }

  // GDPR Compliance Implementation
  // Data Processing Records (Article 30 GDPR)
  async createDataProcessingRecord(record: InsertDataProcessingRecord): Promise<DataProcessingRecord> {
    const [created] = await db
      .insert(dataProcessingRecords)
      .values(record)
      .returning();
    return created;
  }

  async getDataProcessingRecords(merchantId?: number): Promise<DataProcessingRecord[]> {
    if (merchantId) {
      return await db.select().from(dataProcessingRecords)
        .where(eq(dataProcessingRecords.merchantId, merchantId))
        .orderBy(desc(dataProcessingRecords.createdAt));
    }
    return await db.select().from(dataProcessingRecords)
      .orderBy(desc(dataProcessingRecords.createdAt));
  }

  async updateDataProcessingRecord(id: string, updates: Partial<InsertDataProcessingRecord>): Promise<DataProcessingRecord | undefined> {
    const [updated] = await db
      .update(dataProcessingRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataProcessingRecords.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDataProcessingRecord(id: string): Promise<boolean> {
    const result = await db
      .delete(dataProcessingRecords)
      .where(eq(dataProcessingRecords.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Consent Management (Article 7 GDPR)
  async recordUserConsent(consent: InsertUserConsentRecord): Promise<UserConsentRecord> {
    const [created] = await db
      .insert(userConsentRecords)
      .values(consent)
      .returning();
    return created;
  }

  async getUserConsentRecords(userId: number): Promise<UserConsentRecord[]> {
    return await db.select().from(userConsentRecords)
      .where(eq(userConsentRecords.userId, userId))
      .orderBy(desc(userConsentRecords.createdAt));
  }

  async getActiveConsents(userId: number): Promise<UserConsentRecord[]> {
    return await db.select().from(userConsentRecords)
      .where(and(
        eq(userConsentRecords.userId, userId),
        eq(userConsentRecords.isActive, true),
        eq(userConsentRecords.consentGiven, true),
        isNull(userConsentRecords.withdrawalDate)
      ))
      .orderBy(desc(userConsentRecords.createdAt));
  }

  async withdrawConsent(userId: number, consentType: string, withdrawalMethod: string): Promise<UserConsentRecord | undefined> {
    const [updated] = await db
      .update(userConsentRecords)
      .set({
        withdrawalDate: new Date(),
        withdrawalMethod,
        isActive: false
      })
      .where(and(
        eq(userConsentRecords.userId, userId),
        eq(userConsentRecords.consentType, consentType),
        eq(userConsentRecords.isActive, true)
      ))
      .returning();
    return updated || undefined;
  }

  async updateMerchantGdprConsent(merchantId: number, gdprFields: {
    gdprConsent?: boolean;
    marketingConsent?: boolean;
    dataProcessingConsent?: boolean;
    privacyPolicyAccepted?: boolean;
    privacyPolicyVersion?: string;
  }): Promise<Merchant | undefined> {
    const updateData: any = { ...gdprFields };
    
    if (gdprFields.gdprConsent) {
      updateData.gdprConsentDate = new Date();
    }

    const [updated] = await db
      .update(merchants)
      .set(updateData)
      .where(eq(merchants.id, merchantId))
      .returning();
    return updated || undefined;
  }

  // Data Subject Rights (Articles 15-22 GDPR)
  async createDataSubjectRequest(request: InsertDataSubjectRequest): Promise<DataSubjectRequest> {
    const requestData = {
      ...request,
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    const [created] = await db
      .insert(dataSubjectRequests)
      .values(requestData)
      .returning();
    return created;
  }

  async getDataSubjectRequests(requesterId?: number): Promise<DataSubjectRequest[]> {
    if (requesterId) {
      return await db.select().from(dataSubjectRequests)
        .where(eq(dataSubjectRequests.requesterId, requesterId))
        .orderBy(desc(dataSubjectRequests.createdAt));
    }
    return await db.select().from(dataSubjectRequests)
      .orderBy(desc(dataSubjectRequests.createdAt));
  }

  async updateDataSubjectRequest(id: string, updates: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest | undefined> {
    const [updated] = await db
      .update(dataSubjectRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataSubjectRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async exportUserData(merchantId: number): Promise<{
    personalData: any;
    giftCards: any[];
    transactions: any[];
    consents: any[];
    processingRecords: any[];
  }> {
    // Get merchant personal data
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchantId));
    
    // Get gift cards
    const merchantGiftCardsData = await db.select().from(giftCards)
      .where(eq(giftCards.merchantId, merchant?.merchantId || ''));

    // Get transactions
    const transactionsData = await db.select().from(giftCardTransactions)
      .where(eq(giftCardTransactions.merchantId, merchant?.merchantId || ''));

    // Get consent records
    const consentsData = await db.select().from(userConsentRecords)
      .where(eq(userConsentRecords.userId, merchantId));

    // Get processing records
    const processingData = await db.select().from(dataProcessingRecords)
      .where(eq(dataProcessingRecords.merchantId, merchantId));

    return {
      personalData: {
        id: merchant?.id,
        businessName: merchant?.businessName,
        email: merchant?.email,
        createdAt: merchant?.createdAt,
        gdprConsent: merchant?.gdprConsent,
        marketingConsent: merchant?.marketingConsent,
        dataProcessingConsent: merchant?.dataProcessingConsent
      },
      giftCards: merchantGiftCardsData,
      transactions: transactionsData,
      consents: consentsData,
      processingRecords: processingData
    };
  }

  async deleteUserData(merchantId: number): Promise<boolean> {
    try {
      // First, get the merchant to get the square ID
      const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchantId));
      if (!merchant) return false;

      // Delete related data in correct order (to handle foreign key constraints)
      await db.delete(userConsentRecords).where(eq(userConsentRecords.userId, merchantId));
      await db.delete(dataProcessingRecords).where(eq(dataProcessingRecords.merchantId, merchantId));
      await db.delete(dataSubjectRequests).where(eq(dataSubjectRequests.requesterId, merchantId));
      await db.delete(giftCards).where(eq(giftCards.merchantId, merchant.merchantId));
      await db.delete(giftCardTransactions).where(eq(giftCardTransactions.merchantId, merchant.merchantId));
      await db.delete(merchants).where(eq(merchants.id, merchantId));

      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      return false;
    }
  }

  // Data Breach Management (Articles 33-34 GDPR)
  async createDataBreachIncident(incident: InsertDataBreachIncident): Promise<DataBreachIncident> {
    const [created] = await db
      .insert(dataBreachIncidents)
      .values(incident)
      .returning();
    return created;
  }

  async getDataBreachIncidents(): Promise<DataBreachIncident[]> {
    return await db.select().from(dataBreachIncidents)
      .orderBy(desc(dataBreachIncidents.createdAt));
  }

  async updateDataBreachIncident(id: string, updates: Partial<InsertDataBreachIncident>): Promise<DataBreachIncident | undefined> {
    const [updated] = await db
      .update(dataBreachIncidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataBreachIncidents.id, id))
      .returning();
    return updated || undefined;
  }

  // Privacy Impact Assessments (Article 35 GDPR)
  async createPrivacyImpactAssessment(assessment: InsertPrivacyImpactAssessment): Promise<PrivacyImpactAssessment> {
    const [created] = await db
      .insert(privacyImpactAssessments)
      .values(assessment)
      .returning();
    return created;
  }

  async getPrivacyImpactAssessments(): Promise<PrivacyImpactAssessment[]> {
    return await db.select().from(privacyImpactAssessments)
      .orderBy(desc(privacyImpactAssessments.createdAt));
  }

  async updatePrivacyImpactAssessment(id: string, updates: Partial<InsertPrivacyImpactAssessment>): Promise<PrivacyImpactAssessment | undefined> {
    const [updated] = await db
      .update(privacyImpactAssessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(privacyImpactAssessments.id, id))
      .returning();
    return updated || undefined;
  }

  // ===== PCI DSS COMPLIANCE METHODS =====

  // Compliance Assessments
  async createPciComplianceAssessment(assessment: InsertPciComplianceAssessment): Promise<PciComplianceAssessment> {
    const [created] = await db
      .insert(pciComplianceAssessments)
      .values(assessment)
      .returning();
    return created;
  }

  async getPciComplianceAssessments(): Promise<PciComplianceAssessment[]> {
    return await db.select().from(pciComplianceAssessments)
      .orderBy(desc(pciComplianceAssessments.createdAt));
  }

  async updatePciComplianceAssessment(id: string, updates: Partial<InsertPciComplianceAssessment>): Promise<PciComplianceAssessment | undefined> {
    const [updated] = await db
      .update(pciComplianceAssessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pciComplianceAssessments.id, id))
      .returning();
    return updated || undefined;
  }

  // Security Scans
  async createPciSecurityScan(scan: InsertPciSecurityScan): Promise<PciSecurityScan> {
    const [created] = await db
      .insert(pciSecurityScans)
      .values(scan)
      .returning();
    return created;
  }

  async getPciSecurityScans(): Promise<PciSecurityScan[]> {
    return await db.select().from(pciSecurityScans)
      .orderBy(desc(pciSecurityScans.createdAt));
  }

  async updatePciSecurityScan(id: string, updates: Partial<InsertPciSecurityScan>): Promise<PciSecurityScan | undefined> {
    const [updated] = await db
      .update(pciSecurityScans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pciSecurityScans.id, id))
      .returning();
    return updated || undefined;
  }

  // Security Controls
  async createPciSecurityControl(control: InsertPciSecurityControl): Promise<PciSecurityControl> {
    const [created] = await db
      .insert(pciSecurityControls)
      .values(control)
      .returning();
    return created;
  }

  async getPciSecurityControls(): Promise<PciSecurityControl[]> {
    return await db.select().from(pciSecurityControls)
      .orderBy(pciSecurityControls.requirementNumber);
  }

  async updatePciSecurityControl(id: string, updates: Partial<InsertPciSecurityControl>): Promise<PciSecurityControl | undefined> {
    const [updated] = await db
      .update(pciSecurityControls)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pciSecurityControls.id, id))
      .returning();
    return updated || undefined;
  }

  // Incident Response
  async createPciIncidentResponse(incident: InsertPciIncidentResponse): Promise<PciIncidentResponse> {
    const [created] = await db
      .insert(pciIncidentResponses)
      .values(incident)
      .returning();
    return created;
  }

  async getPciIncidentResponses(): Promise<PciIncidentResponse[]> {
    return await db.select().from(pciIncidentResponses)
      .orderBy(desc(pciIncidentResponses.createdAt));
  }

  async updatePciIncidentResponse(id: string, updates: Partial<InsertPciIncidentResponse>): Promise<PciIncidentResponse | undefined> {
    const [updated] = await db
      .update(pciIncidentResponses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pciIncidentResponses.id, id))
      .returning();
    return updated || undefined;
  }

  // Network Diagrams
  async createPciNetworkDiagram(diagram: InsertPciNetworkDiagram): Promise<PciNetworkDiagram> {
    const [created] = await db
      .insert(pciNetworkDiagrams)
      .values(diagram)
      .returning();
    return created;
  }

  async getPciNetworkDiagrams(): Promise<PciNetworkDiagram[]> {
    return await db.select().from(pciNetworkDiagrams)
      .where(eq(pciNetworkDiagrams.isActive, true))
      .orderBy(desc(pciNetworkDiagrams.createdAt));
  }

  async updatePciNetworkDiagram(id: string, updates: Partial<InsertPciNetworkDiagram>): Promise<PciNetworkDiagram | undefined> {
    const [updated] = await db
      .update(pciNetworkDiagrams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pciNetworkDiagrams.id, id))
      .returning();
    return updated || undefined;
  }

  // Audit Logs
  async createPciAuditLog(log: InsertPciAuditLog): Promise<PciAuditLog> {
    const [created] = await db
      .insert(pciAuditLogs)
      .values(log)
      .returning();
    return created;
  }

  async getPciAuditLogs(filters?: { startDate?: Date; endDate?: Date; eventType?: string; userId?: string }): Promise<PciAuditLog[]> {
    let query = db.select().from(pciAuditLogs);
    
    if (filters) {
      const conditions = [];
      
      if (filters.startDate) {
        conditions.push(gte(pciAuditLogs.timestamp, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(pciAuditLogs.timestamp, filters.endDate));
      }
      
      if (filters.eventType) {
        conditions.push(eq(pciAuditLogs.eventType, filters.eventType));
      }
      
      if (filters.userId) {
        conditions.push(eq(pciAuditLogs.userId, filters.userId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(pciAuditLogs.timestamp));
  }

  // PCI DSS Statistics
  async getPciComplianceStats(): Promise<{
    assessmentsCount: number;
    scansCount: number;
    controlsCount: number;
    incidentsCount: number;
    lastAssessmentDate?: Date;
    nextScanDue?: Date;
    complianceScore?: number;
    implementedControlsCount: number;
    pendingControlsCount: number;
    overdueScanCount: number;
  }> {
    // Get counts for each table
    const [assessmentsResult] = await db.select({ count: count() }).from(pciComplianceAssessments);
    const [scansResult] = await db.select({ count: count() }).from(pciSecurityScans);
    const [controlsResult] = await db.select({ count: count() }).from(pciSecurityControls);
    const [incidentsResult] = await db.select({ count: count() }).from(pciIncidentResponses);

    // Get implemented controls count
    const [implementedResult] = await db
      .select({ count: count() })
      .from(pciSecurityControls)
      .where(eq(pciSecurityControls.implementationStatus, 'implemented'));

    // Get pending controls count
    const [pendingResult] = await db
      .select({ count: count() })
      .from(pciSecurityControls)
      .where(or(
        eq(pciSecurityControls.implementationStatus, 'not_implemented'),
        eq(pciSecurityControls.implementationStatus, 'partially_implemented')
      ));

    // Get last assessment
    const lastAssessment = await db
      .select()
      .from(pciComplianceAssessments)
      .where(eq(pciComplianceAssessments.assessmentStatus, 'completed'))
      .orderBy(desc(pciComplianceAssessments.assessmentDate))
      .limit(1);

    // Get next scan due
    const nextScan = await db
      .select()
      .from(pciSecurityScans)
      .where(and(
        eq(pciSecurityScans.scanStatus, 'scheduled'),
        isNotNull(pciSecurityScans.nextScanDue)
      ))
      .orderBy(asc(pciSecurityScans.nextScanDue))
      .limit(1);

    // Get overdue scans count
    const [overdueScansResult] = await db
      .select({ count: count() })
      .from(pciSecurityScans)
      .where(and(
        eq(pciSecurityScans.scanStatus, 'scheduled'),
        lte(pciSecurityScans.nextScanDue, new Date())
      ));

    return {
      assessmentsCount: assessmentsResult.count,
      scansCount: scansResult.count,
      controlsCount: controlsResult.count,
      incidentsCount: incidentsResult.count,
      lastAssessmentDate: lastAssessment[0]?.assessmentDate || undefined,
      nextScanDue: nextScan[0]?.nextScanDue || undefined,
      complianceScore: lastAssessment[0]?.complianceScore || undefined,
      implementedControlsCount: implementedResult.count,
      pendingControlsCount: pendingResult.count,
      overdueScanCount: overdueScansResult.count,
    };
  }

  // Pricing Configuration Management
  async getActivePricingConfiguration(): Promise<PricingConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(pricingConfigurations)
      .where(eq(pricingConfigurations.isActive, true))
      .orderBy(desc(pricingConfigurations.createdAt))
      .limit(1);
    return config || undefined;
  }

  async createPricingConfiguration(config: InsertPricingConfiguration): Promise<PricingConfiguration> {
    // First deactivate all existing configurations
    await this.deactivateAllPricingConfigurations();
    
    const [newConfig] = await db
      .insert(pricingConfigurations)
      .values({
        ...config,
        isActive: true,
        updatedAt: new Date()
      })
      .returning();
    
    return newConfig;
  }

  async updatePricingConfiguration(id: string, config: Partial<InsertPricingConfiguration>): Promise<PricingConfiguration | undefined> {
    // Store current config for history
    const currentConfig = await db
      .select()
      .from(pricingConfigurations)
      .where(eq(pricingConfigurations.id, id));
    
    if (currentConfig[0]) {
      await this.createPricingHistoryEntry({
        configurationId: id,
        basePrice: currentConfig[0].basePrice,
        merchantBuyRate: currentConfig[0].merchantBuyRate,
        merchantSellRate: currentConfig[0].merchantSellRate,
        individualBuyRate: currentConfig[0].individualBuyRate,
        individualSellRate: currentConfig[0].individualSellRate,
        changedBy: config.updatedBy || 'admin',
        changeReason: 'Configuration updated',
        previousValues: JSON.stringify(currentConfig[0])
      });
    }

    const [updated] = await db
      .update(pricingConfigurations)
      .set({
        ...config,
        updatedAt: new Date()
      })
      .where(eq(pricingConfigurations.id, id))
      .returning();
    
    return updated || undefined;
  }

  async deactivateAllPricingConfigurations(): Promise<void> {
    await db
      .update(pricingConfigurations)
      .set({ isActive: false })
      .where(eq(pricingConfigurations.isActive, true));
  }

  async getPricingHistory(limit: number = 50): Promise<PricingHistory[]> {
    return await db
      .select()
      .from(pricingHistory)
      .orderBy(desc(pricingHistory.createdAt))
      .limit(limit);
  }

  async createPricingHistoryEntry(entry: InsertPricingHistory): Promise<PricingHistory> {
    const [historyEntry] = await db
      .insert(pricingHistory)
      .values(entry)
      .returning();
    
    return historyEntry;
  }

  async calculateLivePricing(basePrice?: number): Promise<{
    squareBasePrice: number;
    merchantBuyPrice: number;
    merchantSellPrice: number;
    individualBuyPrice: number;
    individualSellPrice: number;
    profitMarginMerchant: number;
    profitMarginIndividual: number;
    lastRefresh: string;
  }> {
    const config = await this.getActivePricingConfiguration();
    
    if (!config) {
      // Return default configuration if none exists
      const defaultBasePrice = basePrice || 100;
      return {
        squareBasePrice: defaultBasePrice,
        merchantBuyPrice: defaultBasePrice * 1.05, // +5%
        merchantSellPrice: defaultBasePrice * 0.97, // -3%
        individualBuyPrice: defaultBasePrice * 1.08, // +8%
        individualSellPrice: defaultBasePrice * 0.95, // -5%
        profitMarginMerchant: 8, // 5% + 3%
        profitMarginIndividual: 13, // 8% + 5%
        lastRefresh: new Date().toISOString()
      };
    }

    const currentBasePrice = basePrice || parseFloat(config.basePrice);
    const merchantBuyRate = parseFloat(config.merchantBuyRate);
    const merchantSellRate = parseFloat(config.merchantSellRate);
    const individualBuyRate = parseFloat(config.individualBuyRate);
    const individualSellRate = parseFloat(config.individualSellRate);

    const merchantBuyPrice = currentBasePrice * (1 + merchantBuyRate / 100);
    const merchantSellPrice = currentBasePrice * (1 + merchantSellRate / 100);
    const individualBuyPrice = currentBasePrice * (1 + individualBuyRate / 100);
    const individualSellPrice = currentBasePrice * (1 + individualSellRate / 100);

    return {
      squareBasePrice: currentBasePrice,
      merchantBuyPrice: Math.round(merchantBuyPrice * 100) / 100,
      merchantSellPrice: Math.round(merchantSellPrice * 100) / 100,
      individualBuyPrice: Math.round(individualBuyPrice * 100) / 100,
      individualSellPrice: Math.round(individualSellPrice * 100) / 100,
      profitMarginMerchant: merchantBuyRate + Math.abs(merchantSellRate),
      profitMarginIndividual: individualBuyRate + Math.abs(individualSellRate),
      lastRefresh: new Date().toISOString()
    };
  }

  // Physical Gift Card methods
  async createPhysicalGiftCard(card: InsertPhysicalGiftCard): Promise<PhysicalGiftCard> {
    const [newCard] = await db
      .insert(physicalGiftCards)
      .values(card)
      .returning();
    return newCard;
  }

  async getPhysicalGiftCard(id: string): Promise<PhysicalGiftCard | undefined> {
    const [card] = await db
      .select()
      .from(physicalGiftCards)
      .where(eq(physicalGiftCards.id, id));
    return card || undefined;
  }

  async getPhysicalGiftCardsByCustomer(customerId: string, customerType: string): Promise<PhysicalGiftCard[]> {
    return await db
      .select()
      .from(physicalGiftCards)
      .where(and(
        eq(physicalGiftCards.customerId, customerId),
        eq(physicalGiftCards.customerType, customerType)
      ))
      .orderBy(desc(physicalGiftCards.createdAt));
  }

  async getAllPhysicalGiftCards(): Promise<PhysicalGiftCard[]> {
    return await db
      .select()
      .from(physicalGiftCards)
      .orderBy(desc(physicalGiftCards.createdAt));
  }

  async updatePhysicalGiftCardStatus(id: string, status: string, paymentId?: string): Promise<PhysicalGiftCard | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (paymentId) {
      updateData.squarePaymentId = paymentId;
      updateData.paymentStatus = 'paid';
    }

    const [updatedCard] = await db
      .update(physicalGiftCards)
      .set(updateData)
      .where(eq(physicalGiftCards.id, id))
      .returning();
    return updatedCard || undefined;
  }

  async updatePhysicalGiftCardTracking(id: string, trackingNumber: string, estimatedDelivery?: Date): Promise<PhysicalGiftCard | undefined> {
    const [updatedCard] = await db
      .update(physicalGiftCards)
      .set({ 
        trackingNumber,
        estimatedDelivery,
        status: 'shipped',
        updatedAt: new Date()
      })
      .where(eq(physicalGiftCards.id, id))
      .returning();
    return updatedCard || undefined;
  }

  // Physical Card Activations
  async createPhysicalCardActivation(activation: InsertPhysicalCardActivation): Promise<PhysicalCardActivation> {
    const [newActivation] = await db
      .insert(physicalCardActivations)
      .values(activation)
      .returning();
    return newActivation;
  }

  async getPhysicalCardActivation(id: string): Promise<PhysicalCardActivation | undefined> {
    const [activation] = await db
      .select()
      .from(physicalCardActivations)
      .where(eq(physicalCardActivations.id, id));
    return activation || undefined;
  }

  async getPhysicalCardActivationByCardNumber(cardNumber: string): Promise<PhysicalCardActivation | undefined> {
    const [activation] = await db
      .select()
      .from(physicalCardActivations)
      .where(eq(physicalCardActivations.cardNumber, cardNumber));
    return activation || undefined;
  }

  async activatePhysicalCard(cardNumber: string, squareGiftCardId: string, gan: string, activatedBy: string): Promise<PhysicalCardActivation | undefined> {
    const [updatedActivation] = await db
      .update(physicalCardActivations)
      .set({
        squareGiftCardId,
        gan,
        activatedBy,
        activatedAt: new Date(),
        isActive: true
      })
      .where(eq(physicalCardActivations.cardNumber, cardNumber))
      .returning();
    return updatedActivation || undefined;
  }

  async updateCardBalance(cardNumber: string, newBalance: number): Promise<PhysicalCardActivation | undefined> {
    const [updatedActivation] = await db
      .update(physicalCardActivations)
      .set({
        currentBalance: newBalance,
        lastUsed: new Date()
      })
      .where(eq(physicalCardActivations.cardNumber, cardNumber))
      .returning();
    return updatedActivation || undefined;
  }

  // Card Reload Transactions
  async createCardReloadTransaction(transaction: InsertCardReloadTransaction): Promise<CardReloadTransaction> {
    const [newTransaction] = await db
      .insert(cardReloadTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getCardReloadTransactions(cardActivationId: string): Promise<CardReloadTransaction[]> {
    return await db
      .select()
      .from(cardReloadTransactions)
      .where(eq(cardReloadTransactions.cardActivationId, cardActivationId))
      .orderBy(desc(cardReloadTransactions.createdAt));
  }

  async updateReloadTransactionStatus(id: string, status: string, paymentId?: string): Promise<CardReloadTransaction | undefined> {
    const updateData: any = { status };
    if (paymentId) {
      updateData.squarePaymentId = paymentId;
    }

    const [updatedTransaction] = await db
      .update(cardReloadTransactions)
      .set(updateData)
      .where(eq(cardReloadTransactions.id, id))
      .returning();
    return updatedTransaction || undefined;
  }

  // Card Balance Checks
  async createCardBalanceCheck(check: InsertCardBalanceCheck): Promise<CardBalanceCheck> {
    const [newCheck] = await db
      .insert(cardBalanceChecks)
      .values(check)
      .returning();
    return newCheck;
  }

  async getCardBalanceChecks(cardNumber: string, limit: number = 10): Promise<CardBalanceCheck[]> {
    return await db
      .select()
      .from(cardBalanceChecks)
      .where(eq(cardBalanceChecks.cardNumber, cardNumber))
      .orderBy(desc(cardBalanceChecks.createdAt))
      .limit(limit);
  }

  // Custom Card Designs
  async createCustomCardDesign(design: InsertCustomCardDesign): Promise<CustomCardDesign> {
    const [newDesign] = await db
      .insert(customCardDesigns)
      .values(design)
      .returning();
    return newDesign;
  }

  async getCustomCardDesign(id: string): Promise<CustomCardDesign | undefined> {
    const [design] = await db
      .select()
      .from(customCardDesigns)
      .where(eq(customCardDesigns.id, id));
    return design || undefined;
  }

  async getCustomCardDesignsByCustomer(customerId: string, customerType: string): Promise<CustomCardDesign[]> {
    return await db
      .select()
      .from(customCardDesigns)
      .where(and(
        eq(customCardDesigns.customerId, customerId),
        eq(customCardDesigns.customerType, customerType)
      ))
      .orderBy(desc(customCardDesigns.createdAt));
  }

  async approveCustomCardDesign(id: string, approvedBy: string): Promise<CustomCardDesign | undefined> {
    const [updatedDesign] = await db
      .update(customCardDesigns)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(customCardDesigns.id, id))
      .returning();
    return updatedDesign || undefined;
  }

  async rejectCustomCardDesign(id: string, reason: string): Promise<CustomCardDesign | undefined> {
    const [updatedDesign] = await db
      .update(customCardDesigns)
      .set({
        isApproved: false,
        rejectionReason: reason
      })
      .where(eq(customCardDesigns.id, id))
      .returning();
    return updatedDesign || undefined;
  }

  async getAllPendingDesigns(): Promise<CustomCardDesign[]> {
    return await db
      .select()
      .from(customCardDesigns)
      .where(isNull(customCardDesigns.isApproved))
      .orderBy(desc(customCardDesigns.createdAt));
  }

  // Checkout Configuration
  async getCheckoutConfiguration(): Promise<CheckoutConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(checkoutConfigurations)
      .where(eq(checkoutConfigurations.isActive, true))
      .orderBy(desc(checkoutConfigurations.createdAt))
      .limit(1);
    return config || undefined;
  }

  async createCheckoutConfiguration(config: InsertCheckoutConfiguration): Promise<CheckoutConfiguration> {
    // Deactivate any existing configurations
    await db
      .update(checkoutConfigurations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(checkoutConfigurations.isActive, true));

    const [newConfig] = await db
      .insert(checkoutConfigurations)
      .values(config)
      .returning();
    return newConfig;
  }

  async updateCheckoutConfiguration(config: Partial<InsertCheckoutConfiguration>): Promise<CheckoutConfiguration | undefined> {
    // Find the active configuration
    const [activeConfig] = await db
      .select()
      .from(checkoutConfigurations)
      .where(eq(checkoutConfigurations.isActive, true))
      .limit(1);

    if (!activeConfig) {
      // No active config exists, create a new one
      return this.createCheckoutConfiguration(config as InsertCheckoutConfiguration);
    }

    const [updatedConfig] = await db
      .update(checkoutConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(checkoutConfigurations.id, activeConfig.id))
      .returning();
    return updatedConfig || undefined;
  }

  // Square Cards API - Customer Profiles Implementation
  async createCustomerProfile(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    squareCustomerId: string;
  }): Promise<any> {
    const [customerProfile] = await db
      .insert(customerProfiles)
      .values({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        squareCustomerId: profile.squareCustomerId,
      })
      .returning();
    return customerProfile;
  }

  async getCustomerProfileByEmail(email: string): Promise<any> {
    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.email, email));
    return profile || undefined;
  }

  async getCustomerProfileBySquareId(squareCustomerId: string): Promise<any> {
    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.squareCustomerId, squareCustomerId));
    return profile || undefined;
  }

  async updateCustomerProfile(squareCustomerId: string, updates: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any> {
    const [updatedProfile] = await db
      .update(customerProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerProfiles.squareCustomerId, squareCustomerId))
      .returning();
    return updatedProfile || undefined;
  }

  async deleteCustomerProfile(squareCustomerId: string): Promise<void> {
    await db
      .delete(customerProfiles)
      .where(eq(customerProfiles.squareCustomerId, squareCustomerId));
  }

  // Square Cards API - Saved Cards Implementation
  async createSavedCard(card: {
    customerId: string;
    squareCardId: string;
    cardBrand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    cardType?: string;
    fingerprint?: string;
    billingAddress?: string;
    cardNickname?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<any> {
    const [savedCard] = await db
      .insert(savedCards)
      .values({
        customerId: card.customerId,
        squareCardId: card.squareCardId,
        cardBrand: card.cardBrand,
        last4: card.last4,
        expMonth: card.expMonth,
        expYear: card.expYear,
        cardType: card.cardType,
        fingerprint: card.fingerprint,
        billingAddress: card.billingAddress,
        cardNickname: card.cardNickname,
        isDefault: card.isDefault || false,
        isActive: card.isActive !== false,
      })
      .returning();
    return savedCard;
  }

  async getSavedCardsByCustomer(customerId: string): Promise<any[]> {
    return await db
      .select()
      .from(savedCards)
      .where(and(
        eq(savedCards.customerId, customerId),
        eq(savedCards.isActive, true)
      ))
      .orderBy(desc(savedCards.isDefault), desc(savedCards.createdAt));
  }

  async getSavedCardBySquareId(squareCardId: string): Promise<any> {
    const [card] = await db
      .select()
      .from(savedCards)
      .where(eq(savedCards.squareCardId, squareCardId));
    return card || undefined;
  }

  async deactivateSavedCard(squareCardId: string): Promise<void> {
    await db
      .update(savedCards)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(savedCards.squareCardId, squareCardId));
  }

  // Square Cards API - Token Events Implementation
  async createCardTokenEvent(event: {
    customerId?: string;
    savedCardId?: string;
    tokenType: string;
    tokenId: string;
    usageType: string;
    amount?: number;
    currency?: string;
    status: string;
    expiresAt?: Date;
  }): Promise<any> {
    const [tokenEvent] = await db
      .insert(cardTokenEvents)
      .values({
        customerId: event.customerId,
        savedCardId: event.savedCardId,
        tokenType: event.tokenType,
        tokenId: event.tokenId,
        usageType: event.usageType,
        amount: event.amount,
        currency: event.currency || 'USD',
        status: event.status,
        expiresAt: event.expiresAt,
      })
      .returning();
    return tokenEvent;
  }

  // Refunds Management Implementation
  async createRefund(refund: InsertRefund): Promise<Refund> {
    const [newRefund] = await db
      .insert(refunds)
      .values(refund)
      .returning();
    return newRefund;
  }

  async getRefund(id: string): Promise<Refund | undefined> {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.id, id));
    return refund || undefined;
  }

  async getRefundBySquareId(squareRefundId: string): Promise<Refund | undefined> {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.squareRefundId, squareRefundId));
    return refund || undefined;
  }

  async getAllRefunds(filters?: {
    status?: string;
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Refund[]> {
    let query = db.select().from(refunds);

    if (filters?.status) {
      query = query.where(eq(refunds.status, filters.status));
    }
    if (filters?.merchantId) {
      query = query.where(eq(refunds.merchantId, filters.merchantId));
    }
    if (filters?.dateFrom && filters?.dateTo) {
      query = query.where(
        and(
          gte(refunds.createdAt, filters.dateFrom),
          lte(refunds.createdAt, filters.dateTo)
        )
      );
    }

    query = query.orderBy(desc(refunds.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async updateRefundStatus(id: string, status: string, processedAt?: Date, failureReason?: string): Promise<Refund | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (processedAt) updateData.processedAt = processedAt;
    if (failureReason) updateData.failureReason = failureReason;

    const [updatedRefund] = await db
      .update(refunds)
      .set(updateData)
      .where(eq(refunds.id, id))
      .returning();
    return updatedRefund || undefined;
  }

  async getRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    return await db
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, paymentId))
      .orderBy(desc(refunds.createdAt));
  }

  async getRefundsByGiftCardOrderId(giftCardOrderId: string): Promise<Refund[]> {
    return await db
      .select()
      .from(refunds)
      .where(eq(refunds.giftCardOrderId, giftCardOrderId))
      .orderBy(desc(refunds.createdAt));
  }

  // Disputes Management Implementation
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [newDispute] = await db
      .insert(disputes)
      .values(dispute)
      .returning();
    return newDispute;
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, id));
    return dispute || undefined;
  }

  async getDisputeBySquareId(squareDisputeId: string): Promise<Dispute | undefined> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.squareDisputeId, squareDisputeId));
    return dispute || undefined;
  }

  async getAllDisputes(filters?: {
    state?: string;
    disputeType?: string;
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Dispute[]> {
    let query = db.select().from(disputes);

    if (filters?.state) {
      query = query.where(eq(disputes.state, filters.state));
    }
    if (filters?.disputeType) {
      query = query.where(eq(disputes.disputeType, filters.disputeType));
    }
    if (filters?.merchantId) {
      query = query.where(eq(disputes.merchantId, filters.merchantId));
    }
    if (filters?.dateFrom && filters?.dateTo) {
      query = query.where(
        and(
          gte(disputes.createdAt, filters.dateFrom),
          lte(disputes.createdAt, filters.dateTo)
        )
      );
    }

    query = query.orderBy(desc(disputes.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async updateDisputeState(id: string, state: string, resolution?: string, resolvedAt?: Date): Promise<Dispute | undefined> {
    const updateData: any = { 
      state, 
      updatedAt: new Date() 
    };
    
    if (resolution) updateData.resolution = resolution;
    if (resolvedAt) updateData.resolvedAt = resolvedAt;

    const [updatedDispute] = await db
      .update(disputes)
      .set(updateData)
      .where(eq(disputes.id, id))
      .returning();
    return updatedDispute || undefined;
  }

  async updateDisputeStatus(squareDisputeId: string, state: string): Promise<Dispute | undefined> {
    const [updatedDispute] = await db
      .update(disputes)
      .set({ 
        state, 
        updatedAt: new Date() 
      })
      .where(eq(disputes.squareDisputeId, squareDisputeId))
      .returning();
    return updatedDispute || undefined;
  }

  async getDisputesByPaymentId(paymentId: string): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.paymentId, paymentId))
      .orderBy(desc(disputes.createdAt));
  }

  async getDisputesByGiftCardOrderId(giftCardOrderId: string): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.giftCardOrderId, giftCardOrderId))
      .orderBy(desc(disputes.createdAt));
  }

  // Dispute Evidence Management Implementation
  async createDisputeEvidence(evidence: InsertDisputeEvidence): Promise<DisputeEvidence> {
    const [newEvidence] = await db
      .insert(disputeEvidence)
      .values(evidence)
      .returning();
    return newEvidence;
  }

  async getDisputeEvidence(id: string): Promise<DisputeEvidence | undefined> {
    const [evidence] = await db
      .select()
      .from(disputeEvidence)
      .where(eq(disputeEvidence.id, id));
    return evidence || undefined;
  }

  async getEvidenceByDisputeId(disputeId: string): Promise<DisputeEvidence[]> {
    return await db
      .select()
      .from(disputeEvidence)
      .where(eq(disputeEvidence.disputeId, disputeId))
      .orderBy(desc(disputeEvidence.createdAt));
  }

  async markEvidenceSubmitted(id: string, squareEvidenceId?: string): Promise<DisputeEvidence | undefined> {
    const updateData: any = {
      isSubmitted: true,
      submittedAt: new Date()
    };
    
    if (squareEvidenceId) updateData.squareEvidenceId = squareEvidenceId;

    const [updatedEvidence] = await db
      .update(disputeEvidence)
      .set(updateData)
      .where(eq(disputeEvidence.id, id))
      .returning();
    return updatedEvidence || undefined;
  }

  // Activity Tracking Implementation
  async createRefundActivity(activity: InsertRefundActivity): Promise<RefundActivity> {
    const [newActivity] = await db
      .insert(refundActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async createDisputeActivity(activity: InsertDisputeActivity): Promise<DisputeActivity> {
    const [newActivity] = await db
      .insert(disputeActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getRefundActivities(refundId: string): Promise<RefundActivity[]> {
    return await db
      .select()
      .from(refundActivities)
      .where(eq(refundActivities.refundId, refundId))
      .orderBy(desc(refundActivities.createdAt));
  }

  async getDisputeActivities(disputeId: string): Promise<DisputeActivity[]> {
    return await db
      .select()
      .from(disputeActivities)
      .where(eq(disputeActivities.disputeId, disputeId))
      .orderBy(desc(disputeActivities.createdAt));
  }

  // Analytics and Reports Implementation
  async getRefundAnalytics(filters?: {
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalRefunds: number;
    totalAmount: number;
    refundsByStatus: { status: string; count: number; amount: number }[];
    refundsByMethod: { method: string; count: number; amount: number }[];
  }> {
    let baseQuery = db.select().from(refunds);

    if (filters?.merchantId) {
      baseQuery = baseQuery.where(eq(refunds.merchantId, filters.merchantId));
    }
    if (filters?.dateFrom && filters?.dateTo) {
      baseQuery = baseQuery.where(
        and(
          gte(refunds.createdAt, filters.dateFrom),
          lte(refunds.createdAt, filters.dateTo)
        )
      );
    }

    const allRefunds = await baseQuery;

    const totalRefunds = allRefunds.length;
    const totalAmount = allRefunds.reduce((sum, refund) => sum + refund.amount, 0);

    // Group by status
    const statusGroups = allRefunds.reduce((acc, refund) => {
      const status = refund.status;
      if (!acc[status]) {
        acc[status] = { status, count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += refund.amount;
      return acc;
    }, {} as Record<string, { status: string; count: number; amount: number }>);

    // Group by method
    const methodGroups = allRefunds.reduce((acc, refund) => {
      const method = refund.refundMethod || 'unknown';
      if (!acc[method]) {
        acc[method] = { method, count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += refund.amount;
      return acc;
    }, {} as Record<string, { method: string; count: number; amount: number }>);

    return {
      totalRefunds,
      totalAmount,
      refundsByStatus: Object.values(statusGroups),
      refundsByMethod: Object.values(methodGroups),
    };
  }

  async getDisputeAnalytics(filters?: {
    merchantId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalDisputes: number;
    totalAmount: number;
    disputesByState: { state: string; count: number; amount: number }[];
    disputesByType: { type: string; count: number; amount: number }[];
    winRate: number;
  }> {
    let baseQuery = db.select().from(disputes);

    if (filters?.merchantId) {
      baseQuery = baseQuery.where(eq(disputes.merchantId, filters.merchantId));
    }
    if (filters?.dateFrom && filters?.dateTo) {
      baseQuery = baseQuery.where(
        and(
          gte(disputes.createdAt, filters.dateFrom),
          lte(disputes.createdAt, filters.dateTo)
        )
      );
    }

    const allDisputes = await baseQuery;

    const totalDisputes = allDisputes.length;
    const totalAmount = allDisputes.reduce((sum, dispute) => sum + dispute.amount, 0);

    // Group by state
    const stateGroups = allDisputes.reduce((acc, dispute) => {
      const state = dispute.state;
      if (!acc[state]) {
        acc[state] = { state, count: 0, amount: 0 };
      }
      acc[state].count++;
      acc[state].amount += dispute.amount;
      return acc;
    }, {} as Record<string, { state: string; count: number; amount: number }>);

    // Group by type
    const typeGroups = allDisputes.reduce((acc, dispute) => {
      const type = dispute.disputeType || 'unknown';
      if (!acc[type]) {
        acc[type] = { type, count: 0, amount: 0 };
      }
      acc[type].count++;
      acc[type].amount += dispute.amount;
      return acc;
    }, {} as Record<string, { type: string; count: number; amount: number }>);

    // Calculate win rate
    const resolvedDisputes = allDisputes.filter(d => d.resolution);
    const wonDisputes = resolvedDisputes.filter(d => d.resolution === 'WON').length;
    const winRate = resolvedDisputes.length > 0 ? (wonDisputes / resolvedDisputes.length) * 100 : 0;

    return {
      totalDisputes,
      totalAmount,
      disputesByState: Object.values(stateGroups),
      disputesByType: Object.values(typeGroups),
      winRate,
    };
  }
}

export const storage = new DatabaseStorage();
