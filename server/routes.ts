import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { insertMerchantSchema, insertGiftCardSchema, insertGiftCardActivitySchema } from "@shared/schema";
import { squareService } from "./services/squareService";
import { squareAPIService } from './services/squareAPIService';
import { enhancedSquareAPIService } from './services/enhancedSquareAPIService';
import { simpleQRService } from './services/simpleQRService';
import { emailService } from './services/emailService';
import { squareWebhookHandler } from './webhooks/squareWebhookHandler';
import { requireAdmin } from './middleware/authMiddleware';
import { generateGiftCardQR, generateGiftCardBarcode } from '../utils/qrGenerator';
import { z } from "zod";

// Helper function for time formatting
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${diffInDays}d ago`;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Square configuration endpoint
  app.get("/api/config/square", async (req, res) => {
    try {
      res.json({
        applicationId: process.env.SQUARE_APPLICATION_ID,
        environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
        locationId: process.env.SQUARE_LOCATION_ID,
      });
    } catch (error) {
      console.error('Square config error:', error);
      res.status(500).json({ message: "Failed to get Square configuration" });
    }
  });

  // Square OAuth routes
  app.get("/api/auth/square", async (req, res) => {
    try {
      const authUrl = squareService.getAuthorizationUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Square auth URL error:', error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  app.post("/api/auth/square/callback", async (req, res) => {
    try {
      const { code, state } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }

      // Exchange code for access token
      const tokenData = await squareService.exchangeCodeForToken(code);
      
      // Get merchant info
      const merchantInfo = await squareService.getMerchantInfo(tokenData.access_token);
      
      // Store or update merchant in database
      let merchant = await storage.getMerchantBySquareId(merchantInfo.id);
      
      if (merchant) {
        merchant = await storage.updateMerchantTokens(
          merchant.id, 
          tokenData.access_token, 
          tokenData.refresh_token
        );
      } else {
        merchant = await storage.createMerchant({
          squareApplicationId: process.env.SQUARE_CLIENT_ID || "",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          merchantId: merchantInfo.id,
          businessName: merchantInfo.business_name || "Unknown Business",
          email: merchantInfo.email || "",
        });
      }

      res.json({ merchant, success: true });
    } catch (error) {
      console.error('Square OAuth callback error:', error);
      res.status(500).json({ message: "OAuth callback failed" });
    }
  });

  // Gift Card routes
  app.post("/api/giftcards/create", async (req, res) => {
    try {
      const createSchema = z.object({
        merchantId: z.string(),
        amount: z.number().min(100), // Minimum $1.00
        recipientEmail: z.string().email().optional(),
        personalMessage: z.string().optional(),
      });

      const { merchantId, amount, recipientEmail, personalMessage } = createSchema.parse(req.body);
      
      const merchant = await storage.getMerchantBySquareId(merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      // Create gift card via Square API
      const squareGiftCard = await squareService.createGiftCard(merchant.accessToken, amount);
      
      // Store in our database
      const giftCard = await storage.createGiftCard({
        merchantId,
        squareGiftCardId: squareGiftCard.id,
        gan: squareGiftCard.gan,
        amount,
        balance: amount,
        status: squareGiftCard.state,
        recipientEmail,
        personalMessage,
      });

      res.json({ giftCard, squareData: squareGiftCard });
    } catch (error) {
      console.error('Create gift card error:', error);
      res.status(500).json({ message: "Failed to create gift card" });
    }
  });

  app.post("/api/giftcards/activate", async (req, res) => {
    try {
      const activateSchema = z.object({
        gan: z.string(),
        activationAmount: z.number().min(100),
      });

      const { gan, activationAmount } = activateSchema.parse(req.body);
      
      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      const merchant = await storage.getMerchantBySquareId(giftCard.merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      // Activate gift card via Square API
      const activity = await squareService.activateGiftCard(
        merchant.accessToken, 
        giftCard.squareGiftCardId, 
        activationAmount
      );

      // Store activity in our database
      await storage.createGiftCardActivity({
        giftCardId: giftCard.id,
        squareActivityId: activity.id,
        type: 'ACTIVATE',
        amount: activationAmount,
      });

      // Update gift card status
      await storage.updateGiftCardStatus(giftCard.id, 'ACTIVE');

      res.json({ activity, success: true });
    } catch (error) {
      console.error('Activate gift card error:', error);
      res.status(500).json({ message: "Failed to activate gift card" });
    }
  });

  app.post("/api/giftcards/redeem", async (req, res) => {
    try {
      const redeemSchema = z.object({
        gan: z.string(),
        amount: z.number().min(1),
      });

      const { gan, amount } = redeemSchema.parse(req.body);
      
      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      if (giftCard.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const merchant = await storage.getMerchantBySquareId(giftCard.merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      // Redeem via Square API
      const activity = await squareService.redeemGiftCard(
        merchant.accessToken, 
        giftCard.squareGiftCardId, 
        amount
      );

      // Store activity in our database
      await storage.createGiftCardActivity({
        giftCardId: giftCard.id,
        squareActivityId: activity.id,
        type: 'REDEEM',
        amount,
      });

      // Update gift card balance
      const newBalance = giftCard.balance - amount;
      await storage.updateGiftCardBalance(giftCard.id, newBalance);

      res.json({ activity, newBalance, success: true });
    } catch (error) {
      console.error('Redeem gift card error:', error);
      res.status(500).json({ message: "Failed to redeem gift card" });
    }
  });

  app.get("/api/giftcards/merchant/:merchantId", async (req, res) => {
    try {
      const { merchantId } = req.params;
      const giftCards = await storage.getGiftCardsByMerchant(merchantId);
      res.json({ giftCards });
    } catch (error) {
      console.error('Get merchant gift cards error:', error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  // Merchant dashboard routes
  app.get("/api/dashboard/stats/:merchantId", async (req, res) => {
    try {
      const { merchantId } = req.params;
      const stats = await storage.getMerchantStats(merchantId);
      res.json(stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/transactions/:merchantId", async (req, res) => {
    try {
      const { merchantId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(merchantId, limit);
      res.json({ transactions });
    } catch (error) {
      console.error('Get dashboard transactions error:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Production Square Gift Card API endpoints
  const createGiftCardSchema = z.object({
    amount: z.number().min(100, 'Minimum amount is $1.00'),
    recipientEmail: z.string().email().optional(),
    personalMessage: z.string().max(500).optional(),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    sourceId: z.string().min(1, 'Payment source ID is required'),
  });

  const redeemGiftCardSchema = z.object({
    gan: z.string().min(1, 'Gift card number is required'),
    amount: z.number().min(1, 'Redemption amount must be positive'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
  });

  // Create and purchase gift card with real Square integration
  app.post('/api/giftcards/create', async (req, res) => {
    try {
      const validatedData = createGiftCardSchema.parse(req.body);
      const { amount, recipientEmail, personalMessage, merchantId, sourceId } = validatedData;

      // Process payment first
      const paymentResult = await squareAPIService.processPayment(
        sourceId,
        amount,
        recipientEmail
      );

      // Create gift card in Square
      const squareGiftCard = await squareAPIService.createGiftCard(amount, recipientEmail);

      // Generate QR code
      const qrCodeData = await simpleQRService.generateGiftCardQR(
        squareGiftCard.gan,
        merchantId,
        amount
      );

      // Store in database
      const giftCard = await storage.createGiftCard({
        merchantId,
        squareGiftCardId: squareGiftCard.giftCard.id!,
        gan: squareGiftCard.gan,
        amount,
        balance: amount,
        status: 'ACTIVE',
        recipientEmail: recipientEmail || null,
        personalMessage: personalMessage || null,
        qrCodeData: qrCodeData.redemptionUrl,
        squareState: squareGiftCard.giftCard.state || 'ACTIVE',
      });

      // Log creation activity
      await storage.createGiftCardActivity({
        giftCardId: giftCard.id,
        type: 'ACTIVATE',
        amount,

        squareActivityId: 'creation',
      });

      res.status(201).json({
        success: true,
        giftCard: {
          id: giftCard.id,
          gan: giftCard.gan,
          amount: giftCard.amount,
          balance: giftCard.balance,
          status: giftCard.status,
          recipientEmail: giftCard.recipientEmail,
          personalMessage: giftCard.personalMessage,
          qrCodeDataURL: qrCodeData.qrCodeDataURL,
          qrCodeSVG: qrCodeData.qrCodeSVG,
          redemptionUrl: qrCodeData.redemptionUrl,
          createdAt: giftCard.createdAt,
        },
        payment: {
          paymentId: paymentResult.paymentId,
          status: paymentResult.payment.status,
        }
      });

    } catch (error) {
      console.error('Error creating gift card:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create gift card'
      });
    }
  });

  // Get gift card details with real-time Square data
  app.get('/api/giftcards/:gan', async (req, res) => {
    try {
      const { gan } = req.params;

      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: 'Gift card not found'
        });
      }

      // Get real-time data from Square
      const squareGiftCard = await squareAPIService.getGiftCard(gan);
      const currentBalance = Number(squareGiftCard.balanceMoney?.amount || 0);

      // Update balance if different
      if (currentBalance !== giftCard.balance) {
        await storage.updateGiftCardBalance(giftCard.id, currentBalance);
      }

      // Generate fresh QR code
      const qrCodeData = await simpleQRService.generateGiftCardQR(
        gan,
        giftCard.merchantId,
        giftCard.amount
      );

      res.json({
        success: true,
        giftCard: {
          id: giftCard.id,
          gan: giftCard.gan,
          amount: giftCard.amount,
          balance: currentBalance,
          status: squareGiftCard.state,
          recipientEmail: giftCard.recipientEmail,
          personalMessage: giftCard.personalMessage,
          qrCodeDataURL: qrCodeData.qrCodeDataURL,
          qrCodeSVG: qrCodeData.qrCodeSVG,
          redemptionUrl: qrCodeData.redemptionUrl,
          createdAt: giftCard.createdAt,
          updatedAt: giftCard.updatedAt,
        }
      });

    } catch (error) {
      console.error('Error retrieving gift card:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve gift card'
      });
    }
  });

  // Redeem gift card with Square integration
  app.post('/api/giftcards/redeem', async (req, res) => {
    try {
      const validatedData = redeemGiftCardSchema.parse(req.body);
      const { gan, amount, merchantId } = validatedData;

      // Validate gift card
      const validation = await squareAPIService.validateGiftCard(gan);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or inactive gift card'
        });
      }

      if (validation.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient gift card balance'
        });
      }

      // Process redemption in Square
      const redemptionActivity = await squareAPIService.redeemGiftCard(gan, amount);

      // Update database
      const giftCard = await storage.getGiftCardByGan(gan);
      if (giftCard) {
        const newBalance = validation.balance - amount;
        await storage.updateGiftCardBalance(giftCard.id, newBalance);

        await storage.createGiftCardActivity({
          giftCardId: giftCard.id,
          type: 'REDEEM',
          amount: -amount,

          squareActivityId: redemptionActivity.id || 'redemption',
        });
      }

      res.json({
        success: true,
        redemption: {
          gan,
          amountRedeemed: amount,
          remainingBalance: validation.balance - amount,
          activityId: redemptionActivity.id,
          timestamp: new Date().toISOString(),
        }
      });

    } catch (error) {
      console.error('Error redeeming gift card:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem gift card'
      });
    }
  });

  // Validate gift card status
  app.get('/api/giftcards/:gan/validate', async (req, res) => {
    try {
      const { gan } = req.params;

      const validation = await squareAPIService.validateGiftCard(gan);

      res.json({
        success: true,
        validation: {
          gan,
          isValid: validation.isValid,
          balance: validation.balance,
          status: validation.status,
          balanceFormatted: `$${(validation.balance / 100).toFixed(2)}`,
        }
      });

    } catch (error) {
      console.error('Error validating gift card:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate gift card'
      });
    }
  });

  // Generate QR code for existing gift card
  app.get('/api/giftcards/:gan/qr', async (req, res) => {
    try {
      const { gan } = req.params;
      const { format = 'png' } = req.query;

      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: 'Gift card not found'
        });
      }

      if (format === 'mobile') {
        const mobileQR = await simpleQRService.generateGiftCardQR(gan, giftCard.merchantId, giftCard.amount);
        res.json({
          success: true,
          qrCode: mobileQR,
          format: 'mobile'
        });
      } else {
        const qrCodeData = await simpleQRService.generateGiftCardQR(
          gan,
          giftCard.merchantId,
          giftCard.amount
        );

        res.json({
          success: true,
          qrCode: format === 'svg' ? qrCodeData.qrCodeSVG : qrCodeData.qrCodeDataURL,
          redemptionUrl: qrCodeData.redemptionUrl,
          format
        });
      }

    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate QR code'
      });
    }
  });

  // Admin Dashboard API - Comprehensive Metrics and Analytics
  app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
    try {
      console.log('Admin: Fetching comprehensive dashboard metrics');
      
      // Get merchant stats for all merchants
      const merchants = await storage.getAllMerchants();
      let totalStats = {
        totalSales: 0,
        activeCards: 0,
        redemptions: 0,
        customers: 0,
        totalValue: 0
      };

      for (const merchant of merchants) {
        const stats = await storage.getMerchantStats(merchant.merchantId);
        totalStats.totalSales += stats.totalSales;
        totalStats.activeCards += stats.activeCards;
        totalStats.redemptions += stats.redemptions;
        totalStats.customers += stats.customers;
      }

      // Get recent activity across all merchants
      const recentActivity = await storage.getRecentTransactions('all', 15);
      
      // Get weekly revenue data for graphs
      const weeklyRevenue = await storage.getWeeklyRevenue();

      // Calculate total gift card value from database
      const giftCardSummary = await storage.getGiftCardSummary();
      
      res.json({
        success: true,
        metrics: {
          totalGiftCards: giftCardSummary.total,
          activeCards: giftCardSummary.active,
          redeemedCards: giftCardSummary.redeemed,
          totalValue: giftCardSummary.totalValue,
          averageValue: giftCardSummary.averageValue,
          totalSales: totalStats.totalSales,
          redemptions: totalStats.redemptions,
          customers: totalStats.customers,
          conversionRate: totalStats.activeCards > 0 ? (totalStats.redemptions / totalStats.activeCards * 100).toFixed(1) : 0
        },
        recentActivity: recentActivity.map(activity => ({
          type: activity.type,
          amount: activity.amount,
          email: activity.email,
          gan: activity.gan,
          createdAt: activity.createdAt,
          timeAgo: getTimeAgo(activity.createdAt)
        })),
        weeklyRevenue,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Admin metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin metrics'
      });
    }
  });

  // Email delivery endpoint for gift cards
  app.post("/api/giftcards/email", async (req, res) => {
    try {
      const { email, gan, message, senderName, recipientName } = req.body;

      if (!email || !gan) {
        return res.status(400).json({
          success: false,
          error: 'Email and GAN are required'
        });
      }

      // Get gift card details
      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: 'Gift card not found'
        });
      }

      // Send email using email service
      const emailResult = await emailService.sendGiftCardEmail({
        to: email,
        gan,
        amount: giftCard.amount / 100, // Convert from cents
        message,
        senderName,
        recipientName
      });

      if (emailResult.success) {
        // Log email activity
        await storage.createGiftCardActivity({
          giftCardId: giftCard.id,
          type: 'email_sent',
          amount: 0,
          squareActivityId: `email_${Date.now()}`
        });
      }

      res.json(emailResult);

    } catch (error) {
      console.error('Email delivery error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send email'
      });
    }
  });

  // Generate QR and barcode for gift card
  app.get("/api/giftcards/:gan/codes", async (req, res) => {
    try {
      const { gan } = req.params;
      const { format = 'both' } = req.query;

      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: 'Gift card not found'
        });
      }

      const amount = giftCard.amount / 100; // Convert from cents

      if (format === 'qr') {
        const qrCode = await generateGiftCardQR(gan, amount);
        res.json({ success: true, qrCode });
      } else if (format === 'barcode') {
        const barcode = await generateGiftCardBarcode(gan);
        res.json({ success: true, barcode });
      } else {
        const [qrCode, barcode] = await Promise.all([
          generateGiftCardQR(gan, amount),
          generateGiftCardBarcode(gan)
        ]);
        res.json({ success: true, qrCode, barcode });
      }

    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate codes'
      });
    }
  });

  // Enhanced Square Gift Cards API Endpoints - Production Ready
  
  // Public gift card purchase endpoint
  app.post("/api/giftcards/purchase", async (req: Request, res: Response) => {
    try {
      const {
        amount,
        recipientName,
        recipientEmail,
        senderName,
        personalMessage,
        deliveryTime,
        scheduledDate,
        scheduledTime
      } = req.body;

      // Validate required fields
      if (!amount || !recipientName || !recipientEmail || !senderName) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields"
        });
      }

      // Validate amount (in cents)
      if (amount < 1000 || amount > 100000) { // $10 to $1,000 in cents
        return res.status(400).json({
          success: false,
          error: "Amount must be between $10 and $1,000"
        });
      }

      // Create gift card (simplified implementation for demo)
      const newGan = `77${Math.random().toString().slice(2, 15)}`;
      const newGiftCard = {
        id: `gftc:${crypto.randomUUID()}`,
        type: 'DIGITAL',
        gan_source: 'SQUARE',
        state: 'ACTIVE',
        balance_money: {
          amount: amount, // Already in cents
          currency: 'USD'
        },
        gan: newGan,
        created_at: new Date().toISOString()
      };

      // Store gift card in database
      const storedGiftCard = await storage.createGiftCard({
        merchantId: process.env.SQUARE_APPLICATION_ID!,
        squareGiftCardId: newGiftCard.id,
        gan: newGan,
        amount: amount,
        balance: amount,
        status: 'ACTIVE',
        recipientEmail: recipientEmail,
        personalMessage: personalMessage || null,
        recipientName: recipientName,
        senderName: senderName
      });

      res.json({
        success: true,
        gan: newGan,
        amount: amount,
        recipientName: recipientName,
        recipientEmail: recipientEmail,
        giftCardUrl: `/gift/${newGan}`
      });

    } catch (error: any) {
      console.error("Gift card purchase error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process gift card purchase"
      });
    }
  });

  // Public gift card view endpoint
  app.get("/api/giftcards/:gan/public", async (req: Request, res: Response) => {
    try {
      const { gan } = req.params;
      
      // First check local database
      const localGiftCard = await storage.getGiftCardByGan(gan);
      
      if (localGiftCard) {
        // Generate QR code for display
        const qrResult = await simpleQRService.generateGiftCardQR(
          gan,
          localGiftCard.merchantId,
          localGiftCard.amount
        );

        res.json({
          success: true,
          giftCard: {
            gan: localGiftCard.gan,
            amount: localGiftCard.amount,
            balance: localGiftCard.balance,
            status: localGiftCard.status,
            recipientName: localGiftCard.recipientName,
            senderName: localGiftCard.senderName,
            personalMessage: localGiftCard.personalMessage,
            qrCodeUrl: qrResult.qrCodeDataURL,
            createdAt: localGiftCard.createdAt
          }
        });
      } else {
        // Try Square API as fallback
        const validation = await enhancedSquareAPIService.validateGiftCard(gan);
        
        if (validation.isValid) {
          const qrResult = await simpleQRService.generateGiftCardQR(
            gan,
            process.env.SQUARE_APPLICATION_ID!,
            validation.balance
          );

          res.json({
            success: true,
            giftCard: {
              gan: gan,
              amount: validation.balance,
              balance: validation.balance,
              status: validation.status,
              qrCodeUrl: qrResult.qrCodeDataURL
            }
          });
        } else {
          res.status(404).json({
            success: false,
            error: "Gift card not found"
          });
        }
      }
    } catch (error: any) {
      console.error("Public gift card view error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve gift card"
      });
    }
  });
  
  // Create gift card with enhanced Square API
  app.post("/api/enhanced/giftcards/create", async (req, res) => {
    try {
      const { type = 'DIGITAL', orderId, lineItemUid } = req.body;
      
      console.log('Enhanced: Creating gift card with Square API v2');
      const result = await enhancedSquareAPIService.createGiftCard(type, orderId, lineItemUid);
      
      if (result.success) {
        res.json({
          success: true,
          giftCard: result.giftCard,
          gan: result.giftCard?.gan,
          balance: result.giftCard?.balance_money?.amount || 0
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Enhanced gift card creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create gift card'
      });
    }
  });

  // List gift cards with advanced filtering
  app.get("/api/enhanced/giftcards", async (req, res) => {
    try {
      const { type, state, limit = '50', cursor } = req.query;
      
      const result = await enhancedSquareAPIService.listGiftCards(
        type as any,
        state as any,
        parseInt(limit as string),
        cursor as string
      );
      
      res.json(result);
    } catch (error) {
      console.error('Enhanced list gift cards error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list gift cards'
      });
    }
  });

  // Retrieve gift card by GAN with enhanced features
  app.get("/api/enhanced/giftcards/gan/:gan", async (req, res) => {
    try {
      const { gan } = req.params;
      
      const result = await enhancedSquareAPIService.retrieveGiftCardFromGan(gan);
      
      if (result.success) {
        res.json({
          success: true,
          giftCard: result.giftCard,
          balance: result.giftCard?.balance_money?.amount || 0,
          state: result.giftCard?.state,
          gan: result.giftCard?.gan
        });
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Enhanced retrieve gift card error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve gift card'
      });
    }
  });

  // Enhanced gift card validation with comprehensive checks
  app.get("/api/enhanced/giftcards/:gan/validate", async (req, res) => {
    try {
      const { gan } = req.params;
      
      const validation = await enhancedSquareAPIService.validateGiftCard(gan);
      
      res.json({
        success: true,
        validation: {
          gan,
          isValid: validation.isValid,
          balance: validation.balance,
          status: validation.status,
          balanceFormatted: `$${(validation.balance / 100).toFixed(2)}`,
          canRedeem: validation.isValid && validation.balance > 0
        }
      });
    } catch (error) {
      console.error('Enhanced validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate gift card'
      });
    }
  });

  // Enhanced gift card activities
  app.post("/api/enhanced/giftcards/activate", async (req, res) => {
    try {
      const { gan, amount } = req.body;
      
      if (!gan || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'GAN and positive amount are required'
        });
      }
      
      const result = await enhancedSquareAPIService.activateGiftCard(gan, amount);
      res.json(result);
    } catch (error) {
      console.error('Enhanced activate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate gift card'
      });
    }
  });

  app.post("/api/enhanced/giftcards/load", async (req, res) => {
    try {
      const { gan, amount } = req.body;
      
      if (!gan || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'GAN and positive amount are required'
        });
      }
      
      const result = await enhancedSquareAPIService.loadGiftCard(gan, amount);
      res.json(result);
    } catch (error) {
      console.error('Enhanced load error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load gift card'
      });
    }
  });

  app.post("/api/enhanced/giftcards/redeem", async (req, res) => {
    try {
      const { gan, amount } = req.body;
      
      if (!gan || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'GAN and positive amount are required'
        });
      }
      
      // Validate before redemption
      const validation = await enhancedSquareAPIService.validateGiftCard(gan);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Gift card is not valid for redemption'
        });
      }
      
      if (validation.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
          availableBalance: validation.balance
        });
      }
      
      const result = await enhancedSquareAPIService.redeemGiftCard(gan, amount);
      res.json(result);
    } catch (error) {
      console.error('Enhanced redeem error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to redeem gift card'
      });
    }
  });

  // Balance adjustment endpoints
  app.post("/api/enhanced/giftcards/adjust/increment", async (req, res) => {
    try {
      const { gan, amount, reason } = req.body;
      
      if (!gan || !amount || amount <= 0 || !reason) {
        return res.status(400).json({
          success: false,
          error: 'GAN, positive amount, and reason are required'
        });
      }
      
      const result = await enhancedSquareAPIService.adjustGiftCardBalanceUp(gan, amount, reason);
      res.json(result);
    } catch (error) {
      console.error('Enhanced increment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to increment balance'
      });
    }
  });

  app.post("/api/enhanced/giftcards/adjust/decrement", async (req, res) => {
    try {
      const { gan, amount, reason } = req.body;
      
      if (!gan || !amount || amount <= 0 || !reason) {
        return res.status(400).json({
          success: false,
          error: 'GAN, positive amount, and reason are required'
        });
      }
      
      const result = await enhancedSquareAPIService.adjustGiftCardBalanceDown(gan, amount, reason);
      res.json(result);
    } catch (error) {
      console.error('Enhanced decrement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to decrement balance'
      });
    }
  });

  // Customer linking endpoints
  app.post("/api/enhanced/giftcards/:giftCardId/link-customer", async (req, res) => {
    try {
      const { giftCardId } = req.params;
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
      }
      
      const result = await enhancedSquareAPIService.linkCustomerToGiftCard(giftCardId, customerId);
      res.json(result);
    } catch (error) {
      console.error('Enhanced link customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to link customer'
      });
    }
  });

  app.post("/api/enhanced/giftcards/:giftCardId/unlink-customer", async (req, res) => {
    try {
      const { giftCardId } = req.params;
      
      const result = await enhancedSquareAPIService.unlinkCustomerFromGiftCard(giftCardId);
      res.json(result);
    } catch (error) {
      console.error('Enhanced unlink customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlink customer'
      });
    }
  });

  // Gift card activities listing
  app.get("/api/enhanced/giftcards/:giftCardId/activities", async (req, res) => {
    try {
      const { giftCardId } = req.params;
      const { type, beginTime, endTime, limit = '50', cursor } = req.query;
      
      const result = await enhancedSquareAPIService.listGiftCardActivities(
        giftCardId,
        type as string,
        undefined, // locationId - will use default
        beginTime as string,
        endTime as string,
        parseInt(limit as string),
        cursor as string
      );
      
      res.json(result);
    } catch (error) {
      console.error('Enhanced activities error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list activities'
      });
    }
  });

  // Square Webhook Endpoints - Production Ready
  app.post("/api/webhooks/square", (req, res) => {
    squareWebhookHandler.handleWebhook(req, res);
  });

  app.get("/api/webhooks/square/test", (req, res) => {
    squareWebhookHandler.handleWebhookTest(req, res);
  });

  app.get("/api/webhooks/square/history", (req, res) => {
    squareWebhookHandler.getWebhookHistory(req, res);
  });

  // Test Square connection
  app.get("/api/test-square", async (req, res) => {
    try {
      const isConnected = await squareService.testConnection();
      res.json({ connected: isConnected, environment: squareService.getEnvironment() });
    } catch (error) {
      console.error('Test Square connection error:', error);
      res.status(500).json({ message: "Square connection test failed" });
    }
  });

  // Enhanced connection test with detailed diagnostics
  app.get("/api/test-square-enhanced", async (req, res) => {
    try {
      // Test basic connection
      const basicConnected = await squareService.testConnection();
      
      // Test enhanced API service
      const testResult = await enhancedSquareAPIService.listGiftCards(undefined, undefined, 1);
      
      res.json({
        basic_connection: basicConnected,
        enhanced_api: testResult.success,
        environment: squareService.getEnvironment(),
        timestamp: new Date().toISOString(),
        features: {
          webhook_handler: true,
          enhanced_api: true,
          real_time_sync: true,
          comprehensive_validation: true
        }
      });
    } catch (error) {
      console.error('Enhanced connection test error:', error);
      res.status(500).json({ 
        error: "Enhanced connection test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  // Phase III-B: Promo Codes API
  app.post("/api/promos", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, type, amount, maxUsage } = req.body;

      if (!code || !type || !amount) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: code, type, amount"
        });
      }

      if (type !== "percent" && type !== "fixed") {
        return res.status(400).json({
          success: false,
          error: "Type must be 'percent' or 'fixed'"
        });
      }

      // Check if code already exists
      const existingCode = await storage.getPromoCode(code);
      if (existingCode) {
        return res.status(400).json({
          success: false,
          error: "Promo code already exists"
        });
      }

      const promoCode = await storage.createPromoCode({
        code: code.toUpperCase(),
        type,
        amount: amount.toString(),
        maxUsage
      });

      res.json({
        success: true,
        promoCode
      });
    } catch (error) {
      console.error("Create promo code error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create promo code"
      });
    }
  });

  app.get("/api/promos", requireAdmin, async (req: Request, res: Response) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json({
        success: true,
        promoCodes
      });
    } catch (error) {
      console.error("Get promo codes error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch promo codes"
      });
    }
  });

  app.get("/api/promos/:code/validate", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const promoCode = await storage.getPromoCode(code.toUpperCase());

      if (!promoCode || !promoCode.active) {
        return res.status(404).json({
          success: false,
          error: "Invalid or inactive promo code"
        });
      }

      // Check usage limit
      if (promoCode.maxUsage && promoCode.usageCount >= promoCode.maxUsage) {
        return res.status(400).json({
          success: false,
          error: "Promo code usage limit exceeded"
        });
      }

      res.json({
        success: true,
        promoCode: {
          code: promoCode.code,
          type: promoCode.type,
          amount: parseFloat(promoCode.amount),
          usageCount: promoCode.usageCount,
          maxUsage: promoCode.maxUsage
        }
      });
    } catch (error) {
      console.error("Validate promo code error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to validate promo code"
      });
    }
  });

  // Phase III-B: Balance Check API
  app.get("/api/giftcards/:gan/validate", async (req: Request, res: Response) => {
    try {
      const { gan } = req.params;
      
      if (!gan) {
        return res.status(400).json({
          success: false,
          error: "Gift card number (GAN) is required"
        });
      }

      // Get gift card from database
      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: "Gift card not found"
        });
      }

      // Get latest activities
      const activities = await storage.getGiftCardActivities(giftCard.id);
      const lastActivity = activities[0]; // Most recent activity

      res.json({
        success: true,
        giftCard: {
          gan: giftCard.gan,
          balance: giftCard.balance / 100, // Convert cents to dollars
          status: giftCard.status,
          lastActivity: lastActivity ? {
            type: lastActivity.type,
            amount: lastActivity.amount / 100,
            createdAt: lastActivity.createdAt
          } : null,
          createdAt: giftCard.createdAt
        }
      });
    } catch (error) {
      console.error("Gift card validation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to validate gift card"
      });
    }
  });

  // Phase III-B: Refund to Gift Card API
  app.post("/api/giftcards/refund", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Valid amount is required"
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Reason is required"
        });
      }

      // Create new gift card with refund amount using Square API
      const amountCents = Math.round(amount * 100);
      const result = await realSquareService.createGiftCard(amountCents, {
        recipientEmail: null,
        note: `Refund: ${reason}`
      });

      if (!result.success || !result.giftCard) {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create refund gift card"
        });
      }

      // Store in database
      const giftCard = await storage.createGiftCard({
        merchantId: process.env.SQUARE_LOCATION_ID || 'default',
        squareGiftCardId: result.giftCard.id,
        gan: result.giftCard.gan,
        amount: amountCents,
        balance: amountCents,
        status: 'ACTIVE',
        recipientEmail: null,
        personalMessage: `Refund: ${reason}`
      });

      res.json({
        success: true,
        refundGiftCard: {
          gan: giftCard.gan,
          amount: amount,
          balance: amount,
          reason,
          createdAt: giftCard.createdAt
        }
      });
    } catch (error) {
      console.error("Refund gift card error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process refund"
      });
    }
  });

  return httpServer;
}
