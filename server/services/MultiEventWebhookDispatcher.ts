import crypto from 'crypto';
import fetch from 'node-fetch';
import { db } from "../db";
import { webhookEvents, webhookDeliveryLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export type WebhookEventType = 'gift_card_issued' | 'gift_card_redeemed' | 'gift_card_refunded';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: {
    giftCardId?: string;
    giftCardCode?: string;
    merchantId: string;
    amount?: number;
    currency?: string;
    customerEmail?: string;
    redemptionTime?: string;
    refundReason?: string;
    [key: string]: any;
  };
}

export class MultiEventWebhookDispatcher {
  private readonly WEBHOOK_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 3000, 9000]; // Exponential backoff

  /**
   * Dispatch webhooks for a specific event type to all enabled merchant webhooks
   */
  async dispatchWebhooksForEvent(
    merchantId: string,
    eventType: WebhookEventType,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      console.log(`🚀 MultiEventWebhookDispatcher: Dispatching ${eventType} for merchant ${merchantId}`);

      // Fetch all enabled webhooks for this merchant and event type
      const webhooks = await db
        .select()
        .from(webhookEvents)
        .where(
          and(
            eq(webhookEvents.merchantId, merchantId),
            eq(webhookEvents.eventType, eventType),
            eq(webhookEvents.enabled, true)
          )
        );

      if (webhooks.length === 0) {
        console.log(`📭 No enabled webhooks found for merchant ${merchantId} and event ${eventType}`);
        return;
      }

      console.log(`📡 Found ${webhooks.length} enabled webhook(s) for ${eventType}`);

      // Dispatch to all webhooks asynchronously (fire-and-forget)
      const dispatchPromises = webhooks.map(webhook => 
        this.dispatchSingleWebhook(webhook, payload)
      );

      // Don't await - fire and forget to prevent blocking
      Promise.allSettled(dispatchPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`✅ Webhook dispatch complete: ${successful} successful, ${failed} failed`);
      });

    } catch (error) {
      console.error('MultiEventWebhookDispatcher: Error in dispatchWebhooksForEvent:', error);
    }
  }

  /**
   * Dispatch a single webhook with retry logic
   */
  private async dispatchSingleWebhook(
    webhook: any,
    payload: WebhookPayload
  ): Promise<void> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.sendWebhookRequest(webhook, payload);
        const responseTime = Date.now() - startTime;

        // Log successful delivery
        await this.logWebhookDelivery({
          merchantId: webhook.merchantId,
          webhookEventId: webhook.id,
          webhookUrl: webhook.url,
          eventType: webhook.eventType,
          payload: JSON.stringify(payload),
          statusCode: response.status,
          responseTime,
          success: response.ok,
          errorMessage: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
          retryCount: attempt,
        });

        if (response.ok) {
          console.log(`✅ Webhook delivered successfully to ${webhook.url} (attempt ${attempt + 1})`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error: any) {
        lastError = error;
        console.error(`❌ Webhook delivery failed (attempt ${attempt + 1}/${this.MAX_RETRIES}):`, error.message);

        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAYS[attempt]));
        }
      }
    }

    // Log final failure after all retries
    const responseTime = Date.now() - startTime;
    await this.logWebhookDelivery({
      merchantId: webhook.merchantId,
      webhookEventId: webhook.id,
      webhookUrl: webhook.url,
      eventType: webhook.eventType,
      payload: JSON.stringify(payload),
      statusCode: null,
      responseTime,
      success: false,
      errorMessage: lastError?.message || 'Unknown error after all retries',
      retryCount: this.MAX_RETRIES,
    });

    console.error(`💥 Webhook delivery failed permanently to ${webhook.url} after ${this.MAX_RETRIES} attempts`);
  }

  /**
   * Send HTTP request to webhook URL with HMAC signature
   */
  private async sendWebhookRequest(webhook: any, payload: WebhookPayload): Promise<Response> {
    const payloadString = JSON.stringify(payload);
    const signature = this.generateHMACSignature(payloadString, webhook.secret);
    const timestamp = new Date().toISOString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.WEBHOOK_TIMEOUT);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SiZu-Signature': signature,
          'X-SiZu-Timestamp': timestamp,
          'X-SiZu-Event': webhook.eventType,
          'User-Agent': 'SiZu-Webhook/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook authentication
   */
  private generateHMACSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Log webhook delivery attempt to database
   */
  private async logWebhookDelivery(logData: {
    merchantId: string;
    webhookEventId: string;
    webhookUrl: string;
    eventType: string;
    payload: string;
    statusCode: number | null;
    responseTime: number;
    success: boolean;
    errorMessage: string | null;
    retryCount: number;
  }): Promise<void> {
    try {
      await db.insert(webhookDeliveryLogs).values(logData);
    } catch (error) {
      console.error('MultiEventWebhookDispatcher: Failed to log webhook delivery:', error);
    }
  }

  /**
   * Verify incoming webhook signature (for testing endpoints)
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = this.generateHMACSignature(payload, secret);
      const receivedSignature = signature.replace('sha256=', '');
      const expectedHash = expectedSignature.replace('sha256=', '');
      
      // Ensure both signatures are the same length for timing-safe comparison
      if (receivedSignature.length !== expectedHash.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (error) {
      console.error('MultiEventWebhookDispatcher: Signature verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const multiEventWebhookDispatcher = new MultiEventWebhookDispatcher();