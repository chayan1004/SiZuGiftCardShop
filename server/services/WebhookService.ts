import { storage } from '../storage';
import { webhook_delivery_logs } from '@shared/schema';
import { db } from '../db';

interface RedemptionWebhookPayload {
  card_id: string;
  merchant_id: string;
  amount: number; // Amount in cents
  customer_email?: string;
  redemption_time: string;
  gift_card_gan?: string;
  event_type: 'gift_card_redeemed';
}

interface WebhookDeliveryResult {
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  httpStatus?: number;
}

class WebhookService {
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 10000; // 10 second timeout
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

  /**
   * Send redemption webhook to merchant's configured URL
   * Implements retry logic with exponential backoff and comprehensive logging
   */
  async sendRedemptionWebhook(merchantId: string, payload: RedemptionWebhookPayload): Promise<boolean> {
    console.log(`🎯 WebhookService: Initiating redemption webhook for merchant ${merchantId}`);

    try {
      // Get merchant webhook URL
      const merchant = await storage.getMerchantByMerchantId(merchantId);
      if (!merchant?.webhookUrl) {
        console.log(`⚠️  WebhookService: No webhook URL configured for merchant ${merchantId}, skipping`);
        return true; // Not an error - just no webhook configured
      }

      console.log(`📡 WebhookService: Webhook URL found for merchant ${merchantId}: ${merchant.webhookUrl}`);

      let lastError: string = '';
      let totalResponseTime = 0;

      // Attempt delivery with retries
      for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
        const isRetry = attempt > 0;
        
        if (isRetry) {
          const delay = this.RETRY_DELAYS[attempt - 1];
          console.log(`🔄 WebhookService: Retry attempt ${attempt + 1}/${this.MAX_RETRIES} for merchant ${merchantId}, waiting ${delay}ms`);
          await this.sleep(delay);
        }

        const result = await this.deliverWebhook(merchant.webhookUrl, payload);
        totalResponseTime += result.responseTimeMs;

        if (result.success) {
          console.log(`✅ WebhookService: Webhook delivered successfully to merchant ${merchantId} (attempt ${attempt + 1})`);
          
          // Log successful delivery
          await this.logWebhookDelivery({
            merchantId,
            cardId: payload.card_id,
            amount: payload.amount,
            status: 'success',
            responseTimeMs: result.responseTimeMs,
            payload: JSON.stringify(payload)
          });

          return true;
        }

        lastError = result.errorMessage || `HTTP ${result.httpStatus}`;
        console.log(`❌ WebhookService: Webhook delivery failed for merchant ${merchantId} (attempt ${attempt + 1}): ${lastError}`);
      }

      // All retries failed - log failure
      console.log(`💥 WebhookService: All ${this.MAX_RETRIES} delivery attempts failed for merchant ${merchantId}`);
      await this.logWebhookDelivery({
        merchantId,
        cardId: payload.card_id,
        amount: payload.amount,
        status: 'fail',
        errorMessage: `Failed after ${this.MAX_RETRIES} attempts: ${lastError}`,
        responseTimeMs: Math.round(totalResponseTime / this.MAX_RETRIES),
        payload: JSON.stringify(payload)
      });

      return false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
      console.error(`💥 WebhookService: Critical error sending webhook for merchant ${merchantId}:`, errorMessage);
      
      // Log critical error
      await this.logWebhookDelivery({
        merchantId,
        cardId: payload.card_id,
        amount: payload.amount,
        status: 'fail',
        errorMessage: `Critical error: ${errorMessage}`,
        responseTimeMs: 0,
        payload: JSON.stringify(payload)
      });

      return false;
    }
  }

  /**
   * Deliver webhook to specific URL with timeout handling
   */
  private async deliverWebhook(webhookUrl: string, payload: RedemptionWebhookPayload): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiZu-GiftCard-Webhook/1.0',
          'X-Webhook-Source': 'sizu-giftcard-platform'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          responseTimeMs,
          httpStatus: response.status
        };
      } else {
        return {
          success: false,
          responseTimeMs,
          httpStatus: response.status,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          responseTimeMs,
          errorMessage: `Timeout after ${this.TIMEOUT_MS}ms`
        };
      }

      return {
        success: false,
        responseTimeMs,
        errorMessage: error instanceof Error ? error.message : 'Network error'
      };
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

      console.log(`📝 WebhookService: Delivery log saved for merchant ${logData.merchantId} with status: ${logData.status}`);
    } catch (error) {
      console.error(`💥 WebhookService: Failed to log webhook delivery for merchant ${logData.merchantId}:`, error);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get webhook delivery logs for a merchant (admin/debug use)
   */
  async getWebhookLogs(merchantId: string, limit: number = 50): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(webhook_delivery_logs)
        .where(db.sql`${webhook_delivery_logs.merchantId} = ${merchantId}`)
        .orderBy(db.sql`${webhook_delivery_logs.createdAt} DESC`)
        .limit(limit);

      return logs;
    } catch (error) {
      console.error(`💥 WebhookService: Failed to fetch webhook logs for merchant ${merchantId}:`, error);
      return [];
    }
  }

  /**
   * Test webhook endpoint (for validation)
   */
  async testWebhook(webhookUrl: string): Promise<WebhookDeliveryResult> {
    const testPayload: RedemptionWebhookPayload = {
      card_id: 'test-card-123',
      merchant_id: 'test-merchant',
      amount: 2500, // $25.00
      customer_email: 'test@example.com',
      redemption_time: new Date().toISOString(),
      gift_card_gan: 'TEST-GAN-12345',
      event_type: 'gift_card_redeemed'
    };

    return await this.deliverWebhook(webhookUrl, testPayload);
  }
}

export const webhookService = new WebhookService();
export type { RedemptionWebhookPayload };