import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
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

  return httpServer;
}