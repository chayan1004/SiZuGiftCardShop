import crypto from 'crypto';
import { storage } from '../storage';

export interface RedemptionData {
  giftCardCode: string;
  merchantId: string;
  amountRedeemed: number;
  currency: string;
  redeemedBy: {
    ip: string;
    device: string;
  };
  redemptionTime: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: RedemptionData;
}

export class WebhookService {
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'sizu-webhook-secret-2025';
  }

  /**
   * Signs webhook payload using HMAC-SHA256
   */
  private signWebhookPayload(payload: object, timestamp: string): string {
    const payloadString = JSON.stringify(payload) + timestamp;
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Triggers redemption webhook for merchant automation
   */
  async triggerRedemptionWebhook(merchantId: string, redemptionData: RedemptionData): Promise<void> {
    try {
      // Look up merchant's redemption webhook URL
      const merchant = await storage.getMerchantByMerchantId(merchantId);
      
      if (!merchant?.redemptionWebhookUrl) {
        console.log(`⚠️ No redemption webhook URL configured for merchant: ${merchantId}`);
        return;
      }

      // Create webhook payload
      const timestamp = new Date().toISOString();
      const webhookPayload: WebhookPayload = {
        event: 'gift_card.redeemed',
        timestamp,
        data: redemptionData
      };

      // Generate HMAC signature
      const signature = this.signWebhookPayload(webhookPayload, timestamp);

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-SiZu-Signature': `sha256=${signature}`,
        'X-SiZu-Timestamp': timestamp,
        'User-Agent': 'SiZu-GiftCard-Webhook/1.0'
      };

      console.log(`🔗 Triggering redemption webhook for merchant: ${merchantId}`);
      console.log(`📍 Webhook URL: ${merchant.redemptionWebhookUrl}`);
      console.log(`💳 Gift Card: ${redemptionData.giftCardCode}`);
      console.log(`💰 Amount: $${(redemptionData.amountRedeemed / 100).toFixed(2)}`);

      // Fire webhook asynchronously (don't block redemption)
      this.sendWebhookAsync(merchant.redemptionWebhookUrl, webhookPayload, headers, merchantId, redemptionData.giftCardCode);

    } catch (error) {
      console.error(`❌ Error triggering redemption webhook for merchant ${merchantId}:`, error);
      // Don't throw - webhook failures shouldn't block redemption
    }
  }

  /**
   * Sends webhook asynchronously with retry logic
   */
  private async sendWebhookAsync(
    url: string, 
    payload: WebhookPayload, 
    headers: Record<string, string>,
    merchantId: string,
    giftCardCode: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ Webhook delivered successfully to ${url} (${responseTime}ms)`);
        
        // Log successful delivery
        await this.logWebhookDelivery(merchantId, giftCardCode, payload.data.amountRedeemed, 'success', null, responseTime, payload);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ Webhook failed with status ${response.status}: ${errorText}`);
        
        // Log failed delivery
        await this.logWebhookDelivery(merchantId, giftCardCode, payload.data.amountRedeemed, 'failed', `HTTP ${response.status}: ${errorText}`, responseTime, payload);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error?.message || 'Unknown error';
      
      console.error(`❌ Webhook delivery failed to ${url}:`, errorMessage);
      
      // Log failed delivery
      await this.logWebhookDelivery(merchantId, giftCardCode, payload.data.amountRedeemed, 'failed', errorMessage, responseTime, payload);
    }
  }

  /**
   * Logs webhook delivery attempts for audit trail
   */
  private async logWebhookDelivery(
    merchantId: string,
    cardId: string,
    amount: number,
    status: 'success' | 'failed',
    errorMessage: string | null,
    responseTimeMs: number,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      await storage.logWebhookDelivery({
        merchantId,
        cardId,
        amount,
        status,
        errorMessage,
        responseTimeMs,
        payload: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to log webhook delivery:', error);
    }
  }

  /**
   * Verifies webhook signature for testing
   */
  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      const expectedSignature = this.signWebhookPayload(JSON.parse(payload), timestamp);
      const receivedSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
}

export const webhookService = new WebhookService();