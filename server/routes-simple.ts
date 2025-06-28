import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { requireAdmin } from "./middleware/authMiddleware";
import { realSquareService } from "./services/realSquareService";
import { insertMerchantSchema, insertGiftCardSchema, insertGiftCardActivitySchema } from "@shared/schema";

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Gift card purchase endpoint
  app.post("/api/giftcards/purchase", async (req, res) => {
    try {
      const { amount, recipientName, recipientEmail, senderName, personalMessage, deliveryTime } = req.body;

      // Validate required fields
      if (!amount || !recipientName || !recipientEmail || !senderName) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields"
        });
      }

      // Validate amount (in dollars)
      if (amount < 10 || amount > 1000) {
        return res.status(400).json({
          success: false,
          error: "Amount must be between $10 and $1,000"
        });
      }

      // Create gift card (simplified implementation)
      const newGan = `77${Math.random().toString().slice(2, 15)}`;
      const newGiftCard = {
        id: `gftc:${crypto.randomUUID()}`,
        type: 'DIGITAL',
        gan_source: 'SQUARE',
        state: 'ACTIVE',
        balance_money: {
          amount: amount * 100,
          currency: 'USD'
        },
        gan: newGan,
        created_at: new Date().toISOString()
      };

      // Store gift card in database
      const storedGiftCard = await storage.createGiftCard({
        merchantId: process.env.SQUARE_APPLICATION_ID || 'demo-merchant',
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

    } catch (error) {
      console.error("Gift card purchase error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Get gift card by GAN for public display
  app.get("/api/giftcards/:gan/public", async (req, res) => {
    try {
      const { gan } = req.params;
      
      if (!gan) {
        return res.status(400).json({
          success: false,
          error: "Gift Account Number is required"
        });
      }

      const giftCard = await storage.getGiftCardByGan(gan);
      
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: "Gift card not found"
        });
      }

      res.json({
        success: true,
        giftCard: {
          gan: giftCard.gan,
          amount: giftCard.amount,
          balance: giftCard.balance,
          status: giftCard.status,
          recipientName: giftCard.recipientName,
          senderName: giftCard.senderName,
          personalMessage: giftCard.personalMessage,
          createdAt: giftCard.createdAt
        }
      });

    } catch (error) {
      console.error("Error fetching gift card:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch gift card"
      });
    }
  });

  // Promo Codes API
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

  // Balance Check API
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

  // Refund to Gift Card API
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