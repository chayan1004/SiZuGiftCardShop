import { Request, Response } from 'express';
import crypto from 'crypto';
import { enhancedSquareAPIService } from '../services/enhancedSquareAPIService';
import { storage } from '../storage';

/**
 * Square Webhook Handler - Production Ready
 * Handles real-time webhook events from Square for gift cards and activities
 * 
 * Webhook Events Supported:
 * - gift_card.created
 * - gift_card.updated 
 * - gift_card_activity.created
 * - payment.created (for gift card purchases)
 * - order.updated (for gift card orders)
 */

interface SquareWebhookEvent {
  merchant_id: string;
  location_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: any;
  };
}

class SquareWebhookHandler {
  // In-memory cache for replay protection (5-minute TTL)
  private processedEvents = new Map<string, { timestamp: number }>();
  private readonly REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Verify webhook signature using Square's signature verification
   */
  private verifyWebhookSignature(body: string, signature: string, url: string): boolean {
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    
    if (!signatureKey) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return false;
    }

    if (!signature) {
      console.error('Missing x-square-signature header');
      return false;
    }

    try {
      // Create HMAC with SHA1 and signature key
      const hmac = crypto.createHmac('sha1', signatureKey);
      hmac.update(url + body);
      const expectedSignature = hmac.digest('base64');

      // Compare signatures securely
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'base64'),
        Buffer.from(expectedSignature, 'base64')
      );

      if (!isValid) {
        console.error('Webhook signature verification failed', {
          received: signature.substring(0, 10) + '...',
          expected: expectedSignature.substring(0, 10) + '...',
          url,
          bodyLength: body.length
        });
      }

      return isValid;
    } catch (error) {
      console.error('Error during signature verification:', error);
      return false;
    }
  }

  /**
   * Check for replay attacks using event_id caching
   */
  private isReplayAttack(eventId: string): boolean {
    const now = Date.now();
    
    // Clean up expired entries
    const entries = Array.from(this.processedEvents.entries());
    entries.forEach(([id, data]) => {
      if (now - data.timestamp > this.REPLAY_WINDOW_MS) {
        this.processedEvents.delete(id);
      }
    });

    // Check if event already processed
    if (this.processedEvents.has(eventId)) {
      console.warn('Replay attack detected', { eventId, originalTimestamp: this.processedEvents.get(eventId)?.timestamp });
      return true;
    }

    // Cache this event
    this.processedEvents.set(eventId, { timestamp: now });
    return false;
  }

  /**
   * Main webhook endpoint handler with full security verification
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let eventId = 'unknown';
    
    try {
      const signature = req.headers['x-square-signature'] as string;
      const body = JSON.stringify(req.body);
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const event: SquareWebhookEvent = req.body;
      eventId = event.event_id || 'unknown';

      console.log('Webhook received', {
        eventId,
        type: event.type,
        merchantId: event.merchant_id,
        timestamp: new Date().toISOString(),
        bodySize: body.length
      });

      // Step 1: Verify webhook signature
      if (!this.verifyWebhookSignature(body, signature, url)) {
        console.error('Webhook rejected - invalid signature', {
          eventId,
          type: event.type,
          merchantId: event.merchant_id,
          clientIP: req.ip || req.connection.remoteAddress
        });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Step 2: Check for replay attacks
      if (this.isReplayAttack(eventId)) {
        console.error('Webhook rejected - replay attack', {
          eventId,
          type: event.type,
          merchantId: event.merchant_id
        });
        res.status(400).json({ error: 'Duplicate event' });
        return;
      }

      console.log('Webhook authenticated successfully', {
        eventId,
        type: event.type,
        merchantId: event.merchant_id
      });

      // Step 3: Process the webhook event
      const result = await this.processWebhookEvent(event);

      if (result.success) {
        console.log('Webhook processed successfully', {
          eventId,
          type: event.type,
          processed: result.processed,
          processingTime: Date.now() - startTime
        });
        
        res.status(200).json({ 
          status: 'processed',
          event_id: eventId,
          processed: result.processed 
        });
      } else {
        console.error('Webhook processing failed', {
          eventId,
          type: event.type,
          error: result.error,
          processingTime: Date.now() - startTime
        });
        
        res.status(500).json({ 
          error: 'Processing failed',
          event_id: eventId 
        });
      }

    } catch (error) {
      console.error('Webhook handler error', {
        eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTime: Date.now() - startTime
      });
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process individual webhook events
   */
  private async processWebhookEvent(event: SquareWebhookEvent): Promise<{
    success: boolean;
    processed?: boolean;
    error?: string;
  }> {
    try {
      switch (event.type) {
        case 'gift_card.created':
          return await this.handleGiftCardCreated(event);
          
        case 'gift_card.updated':
          return await this.handleGiftCardUpdated(event);
          
        case 'gift_card_activity.created':
          return await this.handleGiftCardActivityCreated(event);
          
        case 'payment.created':
          return await this.handlePaymentCreated(event);
          
        case 'order.updated':
          return await this.handleOrderUpdated(event);
          
        default:
          console.log(`Unhandled webhook type: ${event.type}`);
          return { success: true, processed: false };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }

  /**
   * Handle gift card created event
   */
  private async handleGiftCardCreated(event: SquareWebhookEvent): Promise<{
    success: boolean;
    processed: boolean;
  }> {
    const giftCard = event.data.object;
    
    try {
      // Check if gift card already exists in database
      const existing = await storage.getGiftCardByGan(giftCard.gan);
      
      if (!existing) {
        // Create new gift card record
        await storage.createGiftCard({
          squareGiftCardId: giftCard.id,
          gan: giftCard.gan,
          merchantId: event.location_id,
          amount: parseInt(giftCard.balance_money?.amount || '0'),
          balance: parseInt(giftCard.balance_money?.amount || '0'),
          status: giftCard.state,
          recipientEmail: null,
          personalMessage: null
        });

        console.log(`Created gift card in database: ${giftCard.gan}`);
      } else {
        console.log(`Gift card already exists: ${giftCard.gan}`);
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling gift card created:', error);
      throw error;
    }
  }

  /**
   * Handle gift card updated event
   */
  private async handleGiftCardUpdated(event: SquareWebhookEvent): Promise<{
    success: boolean;
    processed: boolean;
  }> {
    const giftCard = event.data.object;
    
    try {
      const existing = await storage.getGiftCardByGan(giftCard.gan);
      
      if (existing) {
        // Update existing gift card
        await storage.updateGiftCardBalance(
          existing.id,
          parseInt(giftCard.balance_money?.amount || '0')
        );
        
        await storage.updateGiftCardStatus(existing.id, giftCard.state);
        
        console.log(`Updated gift card: ${giftCard.gan} - Balance: $${(parseInt(giftCard.balance_money?.amount || '0') / 100).toFixed(2)}`);
      } else {
        console.warn(`Gift card not found in database: ${giftCard.gan}`);
        // Create the gift card if it doesn't exist
        await this.handleGiftCardCreated(event);
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling gift card updated:', error);
      throw error;
    }
  }

  /**
   * Handle gift card activity created event
   */
  private async handleGiftCardActivityCreated(event: SquareWebhookEvent): Promise<{
    success: boolean;
    processed: boolean;
  }> {
    const activity = event.data.object;
    
    try {
      const giftCard = await storage.getGiftCardByGan(activity.gift_card_gan);
      
      if (giftCard) {
        // Create activity record
        await storage.createGiftCardActivity({
          giftCardId: giftCard.id,
          type: activity.type,
          amount: parseInt(activity.gift_card_balance_money?.amount || '0'),
          squareActivityId: activity.id
        });

        // Update gift card balance if changed
        if (activity.gift_card_balance_money?.amount) {
          await storage.updateGiftCardBalance(
            giftCard.id,
            parseInt(activity.gift_card_balance_money.amount)
          );
        }

        console.log(`Created activity: ${activity.type} for gift card ${activity.gift_card_gan}`);
      } else {
        console.warn(`Gift card not found for activity: ${activity.gift_card_gan}`);
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling gift card activity:', error);
      throw error;
    }
  }

  /**
   * Handle payment created event (for gift card purchases)
   */
  private async handlePaymentCreated(event: SquareWebhookEvent): Promise<{
    success: boolean;
    processed: boolean;
  }> {
    const payment = event.data.object;
    
    try {
      // Check if this payment is for a gift card purchase
      if (payment.order_id) {
        // Log payment for analytics
        console.log(`Payment created: ${payment.id} for order ${payment.order_id}`);
        
        // Additional processing for gift card payments can be added here
        // For example, sending confirmation emails, updating analytics, etc.
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling payment created:', error);
      throw error;
    }
  }

  /**
   * Handle order updated event (for gift card orders)
   */
  private async handleOrderUpdated(event: SquareWebhookEvent): Promise<{
    success: boolean;
    processed: boolean;
  }> {
    const order = event.data.object;
    
    try {
      // Check if order contains gift card line items
      const hasGiftCards = order.line_items?.some((item: any) => 
        item.item_type === 'GIFT_CARD' || 
        item.base_price_money?.amount > 0
      );

      if (hasGiftCards) {
        console.log(`Order updated with gift cards: ${order.id}`);
        
        // Process gift card orders
        // This could trigger gift card creation, email sending, etc.
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling order updated:', error);
      throw error;
    }
  }

  /**
   * Handle webhook test events with security verification
   */
  async handleWebhookTest(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-square-signature'] as string;
      const body = JSON.stringify(req.body);
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      console.log('Webhook test received', {
        hasSignature: !!signature,
        bodySize: body.length,
        timestamp: new Date().toISOString()
      });

      // Verify signature even for test events
      if (!this.verifyWebhookSignature(body, signature, url)) {
        console.error('Webhook test rejected - invalid signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      console.log('Webhook test authenticated successfully');
      res.status(200).json({ 
        status: 'test_received',
        timestamp: new Date().toISOString(),
        security: 'verified'
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      res.status(500).json({ error: 'Test failed' });
    }
  }

  /**
   * Get webhook event history for debugging
   */
  async getWebhookHistory(req: Request, res: Response): Promise<void> {
    try {
      // This would typically fetch from a webhook events log table
      // For now, return a simple response
      res.json({
        status: 'success',
        message: 'Webhook history endpoint ready',
        webhook_url: `${req.protocol}://${req.get('host')}/api/webhooks/square`,
        supported_events: [
          'gift_card.created',
          'gift_card.updated',
          'gift_card_activity.created',
          'payment.created',
          'order.updated'
        ]
      });
    } catch (error) {
      console.error('Webhook history error:', error);
      res.status(500).json({ error: 'Failed to get history' });
    }
  }
}

export const squareWebhookHandler = new SquareWebhookHandler();