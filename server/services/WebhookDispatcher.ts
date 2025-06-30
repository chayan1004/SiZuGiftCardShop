import crypto from 'crypto';
import { storage } from '../storage';
import { webhook_delivery_logs } from '@shared/schema';
import { db } from '../db';

interface RedemptionWebhookPayload {
  event: 'gift_card.redeemed';
  timestamp: string;
  merchantId: string;
  giftCardCode: string;
  amountRedeemed: number;
  currency: 'USD';
  redeemedBy: {
    ip: string;
    device: string;
  };
}

interface WebhookDeliveryResult {
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  httpStatus?: number;
  retryCount: number;
}

class WebhookDispatcher {
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 10000; // 10 second timeout
  private readonly RETRY_DELAYS = [1000, 3000, 9000]; // Exponential backoff: 1s, 3s, 9s
  private readonly WEBHOOK_SECRET_KEY = process.env.WEBHOOK_SECRET_KEY || 'sizu-webhook-secret-2025';

  /**
   * Dispatch redemption webhook to merchant's configured URL
   * Fire and forget - does not block redemption response
   */
  async dispatchRedemptionWebhook(merchantId: string, data: RedemptionWebhookPayload): Promise<void> {
    // Fire asynchronously to avoid blocking redemption response
    setImmediate(async () => {
      try {
        console.log(`🎯 WebhookDispatcher: Starting dispatch for merchant ${merchantId}`);
        
        // Get merchant webhook configuration
        const merchant = await storage.getMerchantByMerchantId(merchantId);
        if (!merchant) {
          console.log(`⚠️  WebhookDispatcher: Merchant ${merchantId} not found`);
          return;
        }

        if (!merchant.webhookUrl || !merchant.webhookEnabled) {
          console.log(`⚠️  WebhookDispatcher: Webhook not configured or disabled for merchant ${merchantId}`);
          return;
        }

        console.log(`📡 WebhookDispatcher: Webhook enabled for merchant ${merchantId}: ${merchant.webhookUrl}`);

        let lastError: string = '';
        let totalResponseTime = 0;
        let retryCount = 0;

        // Attempt delivery with retries
        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
          const isRetry = attempt > 0;
          
          if (isRetry) {
            const delay = this.RETRY_DELAYS[attempt - 1];
            console.log(`🔄 WebhookDispatcher: Retry attempt ${attempt + 1}/${this.MAX_RETRIES} for merchant ${merchantId}, waiting ${delay}ms`);
            await this.sleep(delay);
            retryCount++;
          }

          const result = await this.deliverWebhook(merchant.webhookUrl, data);
          totalResponseTime += result.responseTimeMs;

          if (result.success) {
            console.log(`✅ WebhookDispatcher: Webhook delivered successfully to merchant ${merchantId} (attempt ${attempt + 1})`);
            
            // Log successful delivery
            await this.logWebhookDelivery({
              merchantId,
              cardId: data.giftCardCode,
              amount: data.amountRedeemed,
              status: 'success',
              responseTimeMs: result.responseTimeMs,
              retryCount,
              payload: JSON.stringify(data)
            });

            return;
          }

          // Check if error is retryable (5xx status codes)
          const isRetryable = result.httpStatus && result.httpStatus >= 500 && result.httpStatus < 600;
          if (!isRetryable && attempt === 0) {
            // Non-retryable error on first attempt
            console.log(`❌ WebhookDispatcher: Non-retryable error for merchant ${merchantId}: ${result.errorMessage}`);
            break;
          }

          lastError = result.errorMessage || `HTTP ${result.httpStatus}`;
          console.log(`❌ WebhookDispatcher: Webhook delivery failed for merchant ${merchantId} (attempt ${attempt + 1}): ${lastError}`);
        }

        // All retries failed or non-retryable error
        console.log(`💥 WebhookDispatcher: Final failure for merchant ${merchantId} after ${retryCount + 1} attempts`);
        await this.logWebhookDelivery({
          merchantId,
          cardId: data.giftCardCode,
          amount: data.amountRedeemed,
          status: 'fail',
          errorMessage: `Failed after ${retryCount + 1} attempts: ${lastError}`,
          responseTimeMs: Math.round(totalResponseTime / (retryCount + 1)),
          retryCount,
          payload: JSON.stringify(data)
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
        console.error(`💥 WebhookDispatcher: Critical error for merchant ${merchantId}:`, errorMessage);
        
        // Log critical error
        await this.logWebhookDelivery({
          merchantId,
          cardId: data.giftCardCode,
          amount: data.amountRedeemed,
          status: 'fail',
          errorMessage: `Critical error: ${errorMessage}`,
          responseTimeMs: 0,
          retryCount: 0,
          payload: JSON.stringify(data)
        });
      }
    });
  }

  /**
   * Deliver webhook to specific URL with HMAC signature and timeout handling
   */
  private async deliverWebhook(webhookUrl: string, payload: RedemptionWebhookPayload): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const payloadString = JSON.stringify(payload);
      const signature = this.generateHMACSignature(payloadString);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiZu-GiftCard-Webhook/1.0',
          'X-Sizu-Signature': signature,
          'X-Webhook-Source': 'sizu-giftcard-platform',
          'X-Webhook-Event': payload.event
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          responseTimeMs,
          httpStatus: response.status,
          retryCount: 0
        };
      } else {
        return {
          success: false,
          responseTimeMs,
          httpStatus: response.status,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          retryCount: 0
        };
      }

    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          responseTimeMs,
          errorMessage: `Timeout after ${this.TIMEOUT_MS}ms`,
          retryCount: 0
        };
      }

      return {
        success: false,
        responseTimeMs,
        errorMessage: error instanceof Error ? error.message : 'Network error',
        retryCount: 0
      };
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  private generateHMACSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.WEBHOOK_SECRET_KEY);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify HMAC-SHA256 signature for incoming webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = this.generateHMACSignature(payload);
      const receivedSignature = signature.replace('sha256=', '');
      
      // Ensure both signatures are the same length for timing-safe comparison
      if (receivedSignature.length !== expectedSignature.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('WebhookDispatcher: Signature verification error:', error);
      return false;
    }
  }

  /**
   * Log webhook delivery attempt to database
   */
  private async logWebhookDelivery(logData: {
    merchantId: string;
    cardId: string;
    amount: number;
    status: 'success' | 'fail';
    errorMessage?: string;
    responseTimeMs: number;
    retryCount: number;
    payload: string;
  }): Promise<void> {
    try {
      await db.insert(webhook_delivery_logs).values({
        merchantId: logData.merchantId,
        cardId: logData.cardId,
        amount: logData.amount,
        status: logData.status,
        errorMessage: logData.errorMessage,
        responseTimeMs: logData.responseTimeMs,
        payload: logData.payload
      });

      console.log(`📝 WebhookDispatcher: Delivery log saved for merchant ${logData.merchantId} with status: ${logData.status}`);
    } catch (error) {
      console.error(`💥 WebhookDispatcher: Failed to log webhook delivery for merchant ${logData.merchantId}:`, error);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create structured webhook payload from redemption data
   */
  createRedemptionPayload(
    merchantId: string,
    giftCardCode: string,
    amountRedeemed: number,
    clientInfo: { ip: string; userAgent?: string }
  ): RedemptionWebhookPayload {
    return {
      event: 'gift_card.redeemed',
      timestamp: new Date().toISOString(),
      merchantId,
      giftCardCode,
      amountRedeemed,
      currency: 'USD',
      redeemedBy: {
        ip: clientInfo.ip,
        device: this.generateDeviceFingerprint(clientInfo.userAgent || 'unknown')
      }
    };
  }

  /**
   * Generate device fingerprint from user agent
   */
  private generateDeviceFingerprint(userAgent: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(userAgent);
    return `Device-${hash.digest('hex').substring(0, 12)}`;
  }

  /**
   * Test webhook endpoint (for validation)
   */
  async testWebhook(webhookUrl: string): Promise<WebhookDeliveryResult> {
    const testPayload: RedemptionWebhookPayload = {
      event: 'gift_card.redeemed',
      timestamp: new Date().toISOString(),
      merchantId: 'test-merchant-123',
      giftCardCode: 'TEST-GC-12345',
      amountRedeemed: 2500, // $25.00
      currency: 'USD',
      redeemedBy: {
        ip: '127.0.0.1',
        device: 'Device-test123'
      }
    };

    return await this.deliverWebhook(webhookUrl, testPayload);
  }
}

export const webhookDispatcher = new WebhookDispatcher();
export type { RedemptionWebhookPayload };