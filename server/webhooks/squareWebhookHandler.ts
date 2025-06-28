import { Request, Response } from 'express';
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
  /**
   * Main webhook endpoint handler
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-square-signature'] as string;
      const body = JSON.stringify(req.body);
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      // Verify webhook signature for security
      if (!enhancedSquareAPIService.verifyWebhookSignature(body, signature, url)) {
        console.error('Invalid webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event: SquareWebhookEvent = req.body;
      console.log(`Received webhook: ${event.type} for merchant ${event.merchant_id}`);

      // Process the webhook event
      const result = await this.processWebhookEvent(event);

      if (result.success) {
        res.status(200).json({ 
          status: 'processed',
          event_id: event.event_id,
          processed: result.processed 
        });
      } else {
        console.error('Webhook processing failed:', result.error);
        res.status(500).json({ 
          error: 'Processing failed',
          event_id: event.event_id 
        });
      }

    } catch (error) {
      console.error('Webhook handler error:', error);
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
   * Handle webhook test events
   */
  async handleWebhookTest(req: Request, res: Response): Promise<void> {
    try {
      console.log('Webhook test received');
      res.status(200).json({ 
        status: 'test_received',
        timestamp: new Date().toISOString()
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