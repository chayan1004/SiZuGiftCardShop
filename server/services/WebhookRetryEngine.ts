import { storage } from '../storage';
import { MultiEventWebhookDispatcher } from './MultiEventWebhookDispatcher';
import { FraudSocketService } from './FraudSocketService';
import type { WebhookRetryQueue, WebhookFailureLog, InsertWebhookRetryQueue, InsertWebhookFailureLog } from '@shared/schema';

interface RetryResult {
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  shouldRetry: boolean;
}

/**
 * Webhook Retry Engine - Phase 16A
 * Provides intelligent retry logic with exponential backoff and failure analytics
 */
export class WebhookRetryEngine {
  private static instance: WebhookRetryEngine;
  private retryTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): WebhookRetryEngine {
    if (!WebhookRetryEngine.instance) {
      WebhookRetryEngine.instance = new WebhookRetryEngine();
    }
    return WebhookRetryEngine.instance;
  }

  /**
   * Start the retry engine with periodic checking
   */
  start(): void {
    if (this.isRunning) {
      console.log('🔄 WebhookRetryEngine already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 WebhookRetryEngine started - checking every 60 seconds');
    
    // Run immediately, then every minute
    this.processRetryQueue();
    this.retryTimer = setInterval(() => {
      this.processRetryQueue();
    }, 60000); // 60 seconds
  }

  /**
   * Stop the retry engine
   */
  stop(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    this.isRunning = false;
    console.log('⏹️ WebhookRetryEngine stopped');
  }

  /**
   * Process retry queue and attempt delivery for ready items
   */
  private async processRetryQueue(): Promise<void> {
    try {
      const readyRetries = await storage.getReadyWebhookRetries();
      
      if (readyRetries.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${readyRetries.length} webhook retries`);

      for (const retry of readyRetries) {
        await this.processRetryItem(retry);
      }
    } catch (error) {
      console.error('❌ Error processing retry queue:', error);
    }
  }

  /**
   * Process individual retry item
   */
  private async processRetryItem(retry: WebhookRetryQueue): Promise<void> {
    try {
      // Get original delivery log
      const deliveryLog = await storage.getWebhookDeliveryLogById(retry.deliveryId);
      if (!deliveryLog) {
        console.error(`❌ Delivery log not found for retry: ${retry.id}`);
        await storage.deleteWebhookRetry(retry.id);
        return;
      }

      // Get webhook event details
      const webhookEvent = deliveryLog.webhookEventId 
        ? await storage.getWebhookEventById(deliveryLog.webhookEventId)
        : null;

      if (!webhookEvent) {
        console.error(`❌ Webhook event not found for delivery: ${deliveryLog.id}`);
        await storage.deleteWebhookRetry(retry.id);
        return;
      }

      console.log(`🔄 Retrying webhook delivery: ${retry.deliveryId} (attempt ${(retry.retryCount || 0) + 1}/5)`);

      // Attempt delivery with fresh HMAC signature
      const result = await this.attemptDelivery(webhookEvent, deliveryLog.payload);

      // Update retry count
      const newRetryCount = (retry.retryCount || 0) + 1;

      if (result.success) {
        // Success - update delivery log and remove from retry queue
        await storage.updateWebhookDeliveryLog(deliveryLog.id, {
          success: true,
          statusCode: result.statusCode || 200,
          deliveredAt: new Date(),
          retryCount: newRetryCount
        });

        await storage.deleteWebhookRetry(retry.id);
        console.log(`✅ Webhook delivery succeeded on retry ${newRetryCount}: ${retry.deliveryId}`);
        
      } else if (newRetryCount >= 5) {
        // Max retries reached - mark as failed permanently
        await storage.updateWebhookDeliveryLog(deliveryLog.id, {
          success: false,
          statusCode: result.statusCode,
          errorMessage: result.errorMessage,
          retryCount: newRetryCount
        });

        // Log permanent failure
        await this.logFailure(deliveryLog.id, result.statusCode, result.errorMessage);
        
        await storage.deleteWebhookRetry(retry.id);
        console.log(`❌ Webhook delivery permanently failed after ${newRetryCount} attempts: ${retry.deliveryId}`);

        // Check for failure spike and emit alert
        await this.checkFailureSpike(webhookEvent.merchantId);
        
      } else {
        // Schedule next retry with exponential backoff
        const nextRetryAt = this.calculateNextRetry(newRetryCount);
        
        await storage.updateWebhookRetry(retry.id, {
          retryCount: newRetryCount,
          nextRetryAt,
          lastStatus: result.errorMessage || `${result.statusCode}` || 'unknown'
        });

        console.log(`⏰ Webhook retry scheduled for ${nextRetryAt.toISOString()}: ${retry.deliveryId}`);
      }

    } catch (error) {
      console.error(`❌ Error processing retry item ${retry.id}:`, error);
    }
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(webhookEvent: any, payload: string): Promise<RetryResult> {
    try {
      const parsedPayload = JSON.parse(payload);
      
      // Use MultiEventWebhookDispatcher for delivery with fresh HMAC signature
      const dispatcher = new MultiEventWebhookDispatcher();
      const result = await dispatcher.dispatchWebhook(
        webhookEvent.eventType,
        parsedPayload,
        webhookEvent.merchantId
      );

      return {
        success: result.success,
        statusCode: result.statusCode,
        errorMessage: result.errorMessage,
        shouldRetry: this.shouldRetryStatusCode(result.statusCode)
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        statusCode: 0,
        errorMessage,
        shouldRetry: true
      };
    }
  }

  /**
   * Calculate next retry time with exponential backoff and jitter
   */
  private calculateNextRetry(retryCount: number): Date {
    // Exponential backoff: 1s → 3s → 9s → 27s → 81s
    const baseDelay = Math.pow(3, retryCount - 1) * 1000;
    
    // Add jitter (±25% random variation)
    const jitter = (Math.random() - 0.5) * 0.5 * baseDelay;
    const delay = baseDelay + jitter;
    
    return new Date(Date.now() + delay);
  }

  /**
   * Log webhook failure for analytics
   */
  private async logFailure(deliveryId: string, statusCode?: number, errorMessage?: string): Promise<void> {
    try {
      const failureLog: InsertWebhookFailureLog = {
        deliveryId,
        statusCode: statusCode || null,
        errorMessage: errorMessage || null,
        resolved: false
      };

      await storage.createWebhookFailureLog(failureLog);
      console.log(`📝 Webhook failure logged for delivery: ${deliveryId}`);
    } catch (error) {
      console.error('❌ Error logging webhook failure:', error);
    }
  }

  /**
   * Check for failure spike and emit real-time alert
   */
  private async checkFailureSpike(merchantId: string): Promise<void> {
    try {
      // Check failures in last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentFailures = await storage.getWebhookFailuresSince(merchantId, tenMinutesAgo);
      
      if (recentFailures.length >= 3) {
        console.log(`🚨 Webhook failure spike detected for merchant ${merchantId}: ${recentFailures.length} failures in 10 minutes`);
        
        // Emit real-time alert via Socket.IO
        const socketService = FraudSocketService.getInstance();
        socketService.emitFraudAlert({
          type: 'suspicious_activity',
          severity: 'high',
          message: `Webhook failure spike: ${recentFailures.length} failures in 10 minutes`,
          metadata: {
            merchantId,
            failureCount: recentFailures.length,
            timeWindow: '10 minutes',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('❌ Error checking failure spike:', error);
    }
  }

  /**
   * Determine if status code should trigger retry
   */
  private shouldRetryStatusCode(statusCode?: number): boolean {
    if (!statusCode) return true; // Network errors should retry
    
    // Don't retry client errors (4xx) except 408, 429
    if (statusCode >= 400 && statusCode < 500) {
      return statusCode === 408 || statusCode === 429;
    }
    
    // Retry server errors (5xx) and timeouts
    return statusCode >= 500 || statusCode === 0;
  }

  /**
   * Add webhook to retry queue
   */
  static async scheduleRetry(deliveryId: string, initialStatus?: string): Promise<void> {
    try {
      const nextRetryAt = new Date(Date.now() + 1000); // Start with 1 second delay
      
      const retryQueueItem: InsertWebhookRetryQueue = {
        deliveryId,
        retryCount: 0,
        nextRetryAt,
        lastStatus: initialStatus || 'initial_failure'
      };

      await storage.createWebhookRetry(retryQueueItem);
      console.log(`📥 Webhook scheduled for retry: ${deliveryId}`);
    } catch (error) {
      console.error('❌ Error scheduling webhook retry:', error);
    }
  }

  /**
   * Force immediate retry for admin action
   */
  static async forceRetry(deliveryId: string): Promise<boolean> {
    try {
      const engine = WebhookRetryEngine.getInstance();
      
      // Find existing retry or create new one
      let retry = await storage.getWebhookRetryByDeliveryId(deliveryId);
      
      if (!retry) {
        // Create new retry entry
        await WebhookRetryEngine.scheduleRetry(deliveryId, 'admin_force_retry');
        retry = await storage.getWebhookRetryByDeliveryId(deliveryId);
      }

      if (retry) {
        // Update to retry immediately
        await storage.updateWebhookRetry(retry.id, {
          nextRetryAt: new Date(),
          lastStatus: 'admin_force_retry'
        });

        console.log(`🔄 Force retry scheduled for delivery: ${deliveryId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error forcing webhook retry:', error);
      return false;
    }
  }
}

export default WebhookRetryEngine;