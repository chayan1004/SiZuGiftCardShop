import { storage } from "../storage";
import { Request } from "express";
import type { InsertFraudLog } from "@shared/schema";
import { FraudSocketService, calculateThreatSeverity } from "./FraudSocketService";

export interface FraudCheckResult {
  isBlocked: boolean;
  reason?: string;
  riskLevel: "low" | "medium" | "high";
}

export class FraudDetectionService {
  private static readonly RATE_LIMIT_IP_WINDOW = 1; // 1 minute
  private static readonly RATE_LIMIT_IP_MAX = 3; // 3 attempts per IP per minute
  private static readonly RATE_LIMIT_MERCHANT_WINDOW = 5; // 5 minutes
  private static readonly RATE_LIMIT_MERCHANT_MAX = 10; // 10 redemptions per merchant per 5 minutes
  private static readonly DEVICE_FINGERPRINT_WINDOW = 60; // 60 minutes
  private static readonly DEVICE_FINGERPRINT_MAX = 5; // 5 failed attempts per device

  static async checkRedemptionFraud(
    req: Request,
    gan: string,
    merchantId?: string
  ): Promise<FraudCheckResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";

    // Check 1: Rate limiting by IP (3 attempts per minute)
    const ipAttempts = await storage.getFraudLogsByIP(ipAddress, this.RATE_LIMIT_IP_WINDOW);
    if (ipAttempts.length >= this.RATE_LIMIT_IP_MAX) {
      await this.logFraudAttempt({
        gan,
        ipAddress,
        merchantId,
        userAgent,
        threatType: "rate_limit_ip_violation",
        reason: "rate_limit_ip_violation"
      });
      return {
        isBlocked: true,
        reason: "Too many attempts from this IP address. Please try again later.",
        riskLevel: "high"
      };
    }

    // Check 2: Check if GAN is already redeemed
    const existingCard = await storage.getGiftCardByGan(gan);
    if (existingCard && existingCard.redeemed) {
      await this.logFraudAttempt({
        gan,
        ipAddress,
        merchantId,
        userAgent,
        threatType: "reused_code",
        reason: "reused_code_attempt"
      });
      return {
        isBlocked: true,
        reason: "This gift card has already been redeemed.",
        riskLevel: "high"
      };
    }

    // Check 3: Merchant rate limiting (10 redemptions per 5 minutes)
    if (merchantId) {
      const merchantAttempts = await storage.getFraudLogsByMerchant(merchantId, this.RATE_LIMIT_MERCHANT_WINDOW);
      if (merchantAttempts.length >= this.RATE_LIMIT_MERCHANT_MAX) {
        await this.logFraudAttempt({
          gan,
          ipAddress,
          merchantId,
          userAgent,
          reason: "rate_limit_merchant_violation"
        });
        return {
          isBlocked: true,
          reason: "Too many redemptions for this merchant. Please try again later.",
          riskLevel: "high"
        };
      }
    }

    // Check 4: Device fingerprinting (multiple failed attempts from same IP+UA)
    const deviceAttempts = await storage.getFraudLogsByIP(ipAddress, this.DEVICE_FINGERPRINT_WINDOW);
    const deviceFailures = deviceAttempts.filter(log => 
      log.userAgent === userAgent && 
      (log.reason === "invalid_code" || log.reason === "redemption_failed")
    );
    
    if (deviceFailures.length >= this.DEVICE_FINGERPRINT_MAX) {
      await this.logFraudAttempt({
        gan,
        ipAddress,
        merchantId,
        userAgent,
        reason: "device_fingerprint_violation"
      });
      return {
        isBlocked: true,
        reason: "Too many failed attempts from this device. Please try again later.",
        riskLevel: "high"
      };
    }

    // Check 5: Suspicious pattern detection
    const recentGANAttempts = await storage.getFraudLogsByGAN(gan);
    if (recentGANAttempts.length > 0) {
      const uniqueIPs = new Set(recentGANAttempts.map(log => log.ipAddress));
      if (uniqueIPs.size > 3) {
        await this.logFraudAttempt({
          gan,
          ipAddress,
          merchantId,
          userAgent,
          reason: "suspicious_pattern_multiple_ips"
        });
        return {
          isBlocked: true,
          reason: "Suspicious activity detected for this gift card.",
          riskLevel: "high"
        };
      }
    }

    // All checks passed
    return {
      isBlocked: false,
      riskLevel: "low"
    };
  }

  static async logFraudAttempt(fraudData: InsertFraudLog): Promise<void> {
    try {
      await storage.createFraudLog(fraudData);
      
      // Emit real-time fraud alert via WebSocket
      await this.emitRealTimeFraudAlert(fraudData);
      
      // Trigger webhook if configured
      await this.triggerFraudWebhook(fraudData);
    } catch (error) {
      console.error("Failed to log fraud attempt:", error);
    }
  }

  private static async emitRealTimeFraudAlert(fraudData: InsertFraudLog): Promise<void> {
    try {
      const fraudSocketService = FraudSocketService.getInstance();
      if (!fraudSocketService) {
        console.warn("FraudSocketService not initialized, skipping real-time alert");
        return;
      }

      // Map fraud reasons to WebSocket alert types
      const alertTypeMap: Record<string, any> = {
        'rate_limit_ip_violation': 'rate_limit_ip_violation',
        'reused_code_attempt': 'reused_code',
        'rate_limit_merchant_violation': 'merchant_rate_limit',
        'device_fingerprint_violation': 'device_fingerprint_violation',
        'suspicious_pattern_multiple_ips': 'suspicious_activity',
        'invalid_code': 'invalid_code',
        'redemption_failed': 'invalid_code'
      };

      const alertType = (alertTypeMap[fraudData.reason] || 'suspicious_activity') as 'invalid_code' | 'rate_limit_ip_violation' | 'device_fingerprint_violation' | 'reused_code' | 'merchant_rate_limit' | 'suspicious_activity';
      const severity = calculateThreatSeverity(alertType, { 
        attemptCount: 1, 
        isRepeated: false 
      });

      // Generate human-readable messages
      const messageMap: Record<string, string> = {
        'rate_limit_ip_violation': `IP ${fraudData.ipAddress} exceeded rate limit (3 attempts/min)`,
        'reused_code_attempt': `Attempt to reuse already redeemed gift card: ${fraudData.gan}`,
        'rate_limit_merchant_violation': `Merchant ${fraudData.merchantId} exceeded rate limit (10 redemptions/5min)`,
        'device_fingerprint_violation': `Device ${fraudData.ipAddress} exceeded failure threshold (5 attempts/hour)`,
        'suspicious_pattern_multiple_ips': `Suspicious activity: Gift card ${fraudData.gan} targeted from multiple IPs`,
        'invalid_code': `Invalid gift card redemption attempt: ${fraudData.gan}`,
        'redemption_failed': `Failed redemption attempt for gift card: ${fraudData.gan}`
      };

      const message = messageMap[fraudData.reason] || `Fraud attempt detected: ${fraudData.reason}`;

      fraudSocketService.emitFraudAlert({
        ip: fraudData.ipAddress,
        type: alertType,
        severity,
        message,
        userAgent: fraudData.userAgent || undefined,
        additionalData: {
          gan: fraudData.gan,
          merchantId: fraudData.merchantId,
          reason: fraudData.reason
        }
      });

      console.log(`Real-time fraud alert emitted: ${alertType} - ${message}`);
    } catch (error) {
      console.error("Failed to emit real-time fraud alert:", error);
    }
  }

  static async logRedemptionFailure(
    req: Request,
    gan: string,
    merchantId?: string,
    reason: string = "redemption_failed"
  ): Promise<void> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";

    await this.logFraudAttempt({
      gan,
      ipAddress,
      merchantId,
      userAgent,
      reason
    });
  }

  private static async triggerFraudWebhook(fraudData: InsertFraudLog): Promise<void> {
    const webhookUrl = process.env.FRAUD_ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }

    try {
      const payload = {
        gan: fraudData.gan,
        ip: fraudData.ipAddress,
        reason: fraudData.reason,
        merchantId: fraudData.merchantId,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SiZu-GiftCard-FraudDetection/1.0"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("Fraud webhook failed:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to trigger fraud webhook:", error);
    }
  }

  private static getClientIP(req: Request): string {
    return (
      req.headers["x-forwarded-for"] as string ||
      req.headers["x-real-ip"] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown"
    ).split(",")[0].trim();
  }

  static async getRecentFraudLogs(limit: number = 50) {
    return await storage.getRecentFraudLogs(limit);
  }

  static async getFraudStatistics() {
    const recentLogs = await storage.getRecentFraudLogs(1000);
    const last24Hours = recentLogs.filter(log => 
      new Date(log.createdAt!).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    const reasonCounts = last24Hours.reduce((acc, log) => {
      acc[log.reason] = (acc[log.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAttempts: recentLogs.length,
      last24Hours: last24Hours.length,
      topReasons: Object.entries(reasonCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      uniqueIPs: new Set(last24Hours.map(log => log.ipAddress)).size
    };
  }
}