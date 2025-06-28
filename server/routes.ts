import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMerchantSchema, insertGiftCardSchema, insertGiftCardActivitySchema } from "@shared/schema";
import { squareService } from "./services/squareService";
import { squareAPIService } from './services/squareAPIService';
import { qrCodeService } from './services/qrCodeService';
import { z } from "zod";

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
      const paymentResult = await realSquareService.processPayment(
        sourceId,
        amount,
        recipientEmail
      );

      // Create gift card in Square
      const squareGiftCard = await realSquareService.createGiftCard(amount, recipientEmail);

      // Generate QR code
      const qrCodeData = await qrCodeService.generateGiftCardQR(
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
      const squareGiftCard = await realSquareService.getGiftCard(gan);
      const currentBalance = Number(squareGiftCard.balanceMoney?.amount || 0);

      // Update balance if different
      if (currentBalance !== giftCard.balance) {
        await storage.updateGiftCardBalance(giftCard.id, currentBalance);
      }

      // Generate fresh QR code
      const qrCodeData = await qrCodeService.generateGiftCardQR(
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
      const validation = await realSquareService.validateGiftCard(gan);
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
      const redemptionActivity = await realSquareService.redeemGiftCard(gan, amount);

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

      const validation = await realSquareService.validateGiftCard(gan);

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
        const mobileQR = await qrCodeService.generateMobileQR(gan, giftCard.merchantId);
        res.json({
          success: true,
          qrCode: mobileQR,
          format: 'mobile'
        });
      } else {
        const qrCodeData = await qrCodeService.generateGiftCardQR(
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

  const httpServer = createServer(app);
  return httpServer;
}
