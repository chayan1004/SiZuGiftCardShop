import crypto from 'crypto';
import { storage } from '../storage';
import type { WebhookEvent, WebhookDeliveryLog } from '@shared/schema';

export interface WebhookConfigData {
  id?: string;
  merchantId: string;
  url: string;
  eventTypes: ('gift_card_issued' | 'gift_card_redeemed' | 'gift_card_refunded')[];
  enabled: boolean;
  secret?: string;
}

export interface WebhookLogSummary {
  id: string;
  webhook_id: string;
  event_type: string;
  status: 'success' | 'failed' | 'retry';
  response_code: number | null;
  created_at: Date;
  error_message?: string;
}

export class WebhookConfigService {
  
  /**
   * Generate a secure webhook secret
   */
  static generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mask webhook secret for display
   */
  static maskSecret(secret: string): string {
    if (!secret || secret.length < 8) return '••••••••';
    return secret.substring(0, 4) + '•'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  }

  /**
   * Validate webhook URL format
   */
  static validateWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate event types array
   */
  static validateEventTypes(eventTypes: string[]): boolean {
    const validEvents = ['gift_card_issued', 'gift_card_redeemed', 'gift_card_refunded'];
    return eventTypes.length > 0 && eventTypes.every(event => validEvents.includes(event));
  }

  /**
   * Create a new webhook configuration
   */
  static async createWebhook(merchantId: string, data: Omit<WebhookConfigData, 'id' | 'merchantId' | 'secret'>): Promise<WebhookEvent> {
    if (!this.validateWebhookUrl(data.url)) {
      throw new Error('Invalid webhook URL format');
    }

    if (!this.validateEventTypes(data.eventTypes)) {
      throw new Error('Invalid event types specified');
    }

    const secret = this.generateWebhookSecret();

    // Create webhook configurations for each event type
    const webhookPromises = data.eventTypes.map(eventType => 
      storage.createWebhookEvent({
        merchantId,
        eventType: eventType as 'gift_card_issued' | 'gift_card_redeemed' | 'gift_card_refunded',
        url: data.url,
        enabled: data.enabled,
        secret
      })
    );

    const webhooks = await Promise.all(webhookPromises);
    return webhooks[0]; // Return first webhook as representative
  }

  /**
   * Get all webhooks for a merchant (grouped by URL)
   */
  static async getMerchantWebhooks(merchantId: string, revealSecrets: boolean = false): Promise<Array<WebhookConfigData & { id: string; created_at: Date }>> {
    const webhooks = await storage.getWebhookEventsByMerchant(merchantId);
    
    // Group webhooks by URL to consolidate multiple event types
    const groupedWebhooks = new Map<string, Array<WebhookEvent>>();
    
    webhooks.forEach(webhook => {
      const key = webhook.url;
      if (!groupedWebhooks.has(key)) {
        groupedWebhooks.set(key, []);
      }
      groupedWebhooks.get(key)!.push(webhook);
    });

    // Convert grouped webhooks to config format
    return Array.from(groupedWebhooks.entries()).map(([url, webhookGroup]) => {
      const firstWebhook = webhookGroup[0];
      return {
        id: firstWebhook.id,
        merchantId: firstWebhook.merchantId,
        url,
        eventTypes: webhookGroup.map(w => w.eventType) as ('gift_card_issued' | 'gift_card_redeemed' | 'gift_card_refunded')[],
        enabled: firstWebhook.enabled || false,
        secret: revealSecrets ? firstWebhook.secret : this.maskSecret(firstWebhook.secret),
        created_at: firstWebhook.createdAt || new Date()
      };
    });
  }

  /**
   * Update webhook configuration
   */
  static async updateWebhook(webhookId: string, merchantId: string, data: Partial<WebhookConfigData>): Promise<void> {
    if (data.url && !this.validateWebhookUrl(data.url)) {
      throw new Error('Invalid webhook URL format');
    }

    if (data.eventTypes && !this.validateEventTypes(data.eventTypes)) {
      throw new Error('Invalid event types specified');
    }

    // Get existing webhooks for this merchant with the same base ID
    const existingWebhooks = await storage.getWebhookEventsByMerchant(merchantId);
    const targetWebhook = await storage.getWebhookEventById(webhookId);
    const webhooksToUpdate = existingWebhooks.filter(w => w.id === webhookId || (targetWebhook && w.url === targetWebhook.url));

    if (webhooksToUpdate.length === 0) {
      throw new Error('Webhook not found or access denied');
    }

    // Update existing webhooks
    const updatePromises = webhooksToUpdate.map(webhook => 
      storage.updateWebhookEvent(webhook.id, {
        url: data.url || webhook.url,
        enabled: data.enabled !== undefined ? data.enabled : webhook.enabled
      })
    );

    await Promise.all(updatePromises);

    // Handle event type changes if specified
    if (data.eventTypes) {
      const currentUrl = webhooksToUpdate[0].url;
      const currentEventTypes = webhooksToUpdate.map(w => w.eventType);
      const newEventTypes = data.eventTypes;

      // Remove webhooks for event types no longer needed
      const toRemove = currentEventTypes.filter(eventType => !newEventTypes.includes(eventType));
      const removePromises = toRemove.map(eventType => {
        const webhook = webhooksToUpdate.find(w => w.eventType === eventType);
        return webhook ? storage.deleteWebhookEvent(webhook.id) : Promise.resolve();
      });

      // Add webhooks for new event types
      const toAdd = newEventTypes.filter(eventType => !currentEventTypes.includes(eventType));
      const addPromises = toAdd.map(eventType => 
        storage.createWebhookEvent({
          merchantId,
          eventType: eventType as 'gift_card_issued' | 'gift_card_redeemed' | 'gift_card_refunded',
          url: data.url || currentUrl,
          enabled: data.enabled !== undefined ? data.enabled : webhooksToUpdate[0].enabled,
          secret: webhooksToUpdate[0].secret
        })
      );

      await Promise.all([...removePromises, ...addPromises]);
    }
  }

  /**
   * Delete webhook configuration
   */
  static async deleteWebhook(webhookId: string, merchantId: string): Promise<void> {
    // Get all webhooks for this merchant with the same URL as the target webhook
    const targetWebhook = await storage.getWebhookEventById(webhookId);
    if (!targetWebhook || targetWebhook.merchantId !== merchantId) {
      throw new Error('Webhook not found or access denied');
    }

    const allMerchantWebhooks = await storage.getWebhookEventsByMerchant(merchantId);
    const webhooksToDelete = allMerchantWebhooks.filter(w => w.url === targetWebhook.url);

    // Delete all webhooks with the same URL (all event types)
    const deletePromises = webhooksToDelete.map(webhook => storage.deleteWebhookEvent(webhook.id));
    await Promise.all(deletePromises);
  }

  /**
   * Get delivery logs for a specific webhook
   */
  static async getWebhookLogs(webhookId: string, merchantId: string, limit: number = 10): Promise<WebhookLogSummary[]> {
    // Verify webhook belongs to merchant
    const webhook = await storage.getWebhookEventById(webhookId);
    if (!webhook || webhook.merchantId !== merchantId) {
      throw new Error('Webhook not found or access denied');
    }

    const logs = await storage.getWebhookDeliveryLogs(webhookId, limit);
    
    return logs.map(log => ({
      id: log.id,
      webhook_id: log.webhookEventId || 'unknown',
      event_type: log.eventType || 'unknown',
      status: log.success ? 'success' : 'failed',
      response_code: log.statusCode,
      created_at: log.deliveredAt || new Date(),
      error_message: log.errorMessage || undefined
    }));
  }

  /**
   * Get all webhook logs for admin (with merchant filtering)
   */
  static async getAllWebhookLogs(merchantId?: string, limit: number = 50): Promise<Array<WebhookLogSummary & { merchant_id: string; webhook_url: string }>> {
    const logs = merchantId 
      ? await storage.getWebhookDeliveryLogsByMerchant(merchantId, limit)
      : await storage.getAllWebhookDeliveryLogs(limit);

    return logs.map(log => ({
      id: log.id,
      webhook_id: log.webhookId,
      event_type: log.eventType || 'unknown',
      status: log.success ? 'success' : 'failed',
      response_code: log.responseCode,
      created_at: log.createdAt,
      error_message: log.errorMessage || undefined,
      merchant_id: log.merchantId || 'unknown',
      webhook_url: log.webhookUrl || 'unknown'
    }));
  }

  /**
   * Get webhook statistics for admin dashboard
   */
  static async getWebhookStats(): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  }> {
    const [webhooks, logs] = await Promise.all([
      storage.getAllWebhookEvents(),
      storage.getAllWebhookDeliveryLogs(1000) // Get recent logs for stats
    ]);

    const totalWebhooks = webhooks.length;
    const activeWebhooks = webhooks.filter(w => w.enabled).length;
    const totalDeliveries = logs.length;
    const successfulDeliveries = logs.filter(l => l.success).length;
    const failedDeliveries = totalDeliveries - successfulDeliveries;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return {
      totalWebhooks,
      activeWebhooks,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}