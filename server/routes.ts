import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMerchantSchema, insertGiftCardSchema, insertGiftCardActivitySchema } from "@shared/schema";
import { squareService } from "./services/squareService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
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
