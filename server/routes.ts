import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { insertMerchantSchema, insertGiftCardSchema, insertGiftCardActivitySchema } from "@shared/schema";
import { squareService } from "./services/squareService";
import { squareAPIService } from './services/squareAPIService';
import { enhancedSquareAPIService } from './services/enhancedSquareAPIService';
import { squareGiftCardService } from './services/squareGiftCardService';
import { squarePaymentService } from './services/squarePaymentService';
import { mockPaymentService } from './services/mockPaymentService';
import { simpleQRService } from './services/simpleQRService';
import { emailService } from './services/emailService';
import { emailDeliveryMonitor } from './services/emailDeliveryMonitor';
import { domainAuthentication } from './services/domainAuthentication';
import { pdfReceiptService } from './services/pdfReceiptService';
import { squareWebhookHandler } from './webhooks/squareWebhookHandler';
import { requireAdmin, requireMerchant, checkMerchantStatus } from './middleware/authMiddleware';
import { AuthService } from './services/authService';
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
  
  // Merchant Authentication Routes
  app.post("/api/merchant/login", async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required')
      });

      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.authenticateMerchant(email, password);

      if (result.success) {
        // Set secure HTTP-only cookie
        res.cookie('merchantToken', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
          success: true,
          token: result.token,
          merchant: result.merchant
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Login route error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  app.post("/api/merchant/register", async (req: Request, res: Response) => {
    try {
      const registerSchema = z.object({
        businessName: z.string().min(2, 'Business name must be at least 2 characters'),
        email: z.string().email('Valid email is required'),
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/\d/, 'Password must contain at least one number'),
        confirmPassword: z.string()
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });

      const { businessName, email, password } = registerSchema.parse(req.body);

      // Check if merchant already exists
      const existingMerchant = await storage.getMerchantByEmail(email);
      if (existingMerchant) {
        return res.status(409).json({
          success: false,
          error: 'A merchant account with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create merchant account
      const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const newMerchant = await storage.createMerchant({
        squareApplicationId: 'pending-square-setup',
        accessToken: 'pending-square-oauth',
        refreshToken: 'pending-square-oauth',
        merchantId,
        businessName,
        email,
        passwordHash,
        isActive: true
      });

      // Generate JWT token for auto-login
      const token = AuthService.generateMerchantToken(newMerchant);

      // Set secure HTTP-only cookie
      res.cookie('merchantToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'Merchant account created successfully',
        token,
        merchant: {
          id: newMerchant.id,
          merchantId: newMerchant.merchantId,
          businessName: newMerchant.businessName,
          email: newMerchant.email
        }
      });

    } catch (error) {
      console.error('Registration route error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Registration failed. Please try again.'
        });
      }
    }
  });

  app.post("/api/merchant/demo-login", async (req: Request, res: Response) => {
    try {
      const result = await AuthService.createDemoMerchant();

      if (result.success) {
        res.cookie('merchantToken', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
          success: true,
          token: result.token,
          merchant: result.merchant
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Demo login route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create demo login'
      });
    }
  });

  app.post("/api/merchant/logout", (req: Request, res: Response) => {
    res.clearCookie('merchantToken');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get("/api/merchant/me", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      const merchant = await storage.getMerchantBySquareId(merchantId);
      
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
      }

      res.json({
        success: true,
        merchant: {
          id: merchant.id,
          merchantId: merchant.merchantId,
          businessName: merchant.businessName,
          email: merchant.email,
          isActive: merchant.isActive
        }
      });
    } catch (error) {
      console.error('Get merchant profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get merchant profile'
      });
    }
  });

  // Square configuration endpoint
  app.get("/api/config/square", async (req, res) => {
    try {
      const config = squarePaymentService.getWebSDKConfig();
      res.json(config);
    } catch (error) {
      console.error('Square config error:', error);
      res.status(500).json({ message: "Failed to get Square configuration" });
    }
  });

  // Development-only email test route
  app.post("/api/test/send-email", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Route not available in production' });
    }

    try {
      const { to, gan, amount, senderName, recipientName, message } = req.body;

      if (!to || !gan || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields: to, gan, amount' 
        });
      }

      console.log('Testing email delivery with data:', {
        to,
        gan,
        amount,
        senderName,
        recipientName,
        message: message ? message.substring(0, 50) + '...' : 'No message'
      });

      const result = await emailService.sendGiftCardReceipt({
        to,
        gan,
        amount,
        senderName,
        recipientName,
        message
      });

      res.json({
        status: 'test_complete',
        timestamp: new Date().toISOString(),
        emailResult: result,
        smtpConfigured: emailService.isConfigured(),
        environment: process.env.NODE_ENV || 'development',
        smtpConfig: {
          host: process.env.SMTP_HOST || 'smtp.mailgun.org',
          port: process.env.SMTP_PORT || '587',
          user: process.env.SMTP_USER || 'SiZuGiftCardReceipt@receipt.sizupay.com',
          hasPassword: !!(process.env.SMTP_PASS || 'Chayan38125114@')
        }
      });

    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({
        error: 'Email test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Dynamic email test endpoint for modular email system
  app.post("/api/test/email/:type", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Route not available in production' });
    }

    try {
      const { type } = req.params;
      const { to, ...emailData } = req.body;

      if (!to) {
        return res.status(400).json({ error: 'Missing required field: to' });
      }

      console.log(`Testing ${type} email delivery to:`, to);

      let result;

      switch (type) {
        case 'receipt':
          const { gan, amount, message, senderName, recipientName } = emailData;
          if (!gan || !amount) {
            return res.status(400).json({ error: 'Missing required fields for receipt: gan, amount' });
          }
          result = await emailService.sendGiftCardReceipt({
            to, gan, amount, message, senderName, recipientName
          });
          break;

        case 'otp':
          const { code, expiresInMinutes, recipientName: otpRecipient } = emailData;
          if (!code) {
            return res.status(400).json({ error: 'Missing required field for OTP: code' });
          }
          result = await emailService.sendOtpCode({
            to, code, expiresInMinutes, recipientName: otpRecipient
          });
          break;

        case 'promo':
          const { subject, promoCode, discount, expiryDate, recipientName: promoRecipient } = emailData;
          if (!subject) {
            return res.status(400).json({ error: 'Missing required field for promo: subject' });
          }
          result = await emailService.sendPromoEmail({
            to, subject, promoCode, discount, expiryDate, recipientName: promoRecipient
          });
          break;

        case 'reminder':
          const { gan: reminderGan, amount: reminderAmount, balance, expiryDate: reminderExpiry, recipientName: reminderRecipient } = emailData;
          if (!reminderGan || !reminderAmount || balance === undefined) {
            return res.status(400).json({ error: 'Missing required fields for reminder: gan, amount, balance' });
          }
          result = await emailService.sendGiftCardReminder({
            to, gan: reminderGan, amount: reminderAmount, balance, expiryDate: reminderExpiry, recipientName: reminderRecipient
          });
          break;

        case 'refund':
          const { refundAmount, originalAmount, gan: refundGan, refundReason, refundId, recipientName: refundRecipient } = emailData;
          if (!refundAmount || !originalAmount || !refundGan || !refundId) {
            return res.status(400).json({ error: 'Missing required fields for refund: refundAmount, originalAmount, gan, refundId' });
          }
          result = await emailService.sendRefundNotice({
            to, refundAmount, originalAmount, gan: refundGan, refundReason, refundId, recipientName: refundRecipient
          });
          break;

        case 'fraud':
          const { alertType, details, userEmail, gan: fraudGan, suspiciousActivity } = emailData;
          if (!alertType || !details || !suspiciousActivity) {
            return res.status(400).json({ error: 'Missing required fields for fraud: alertType, details, suspiciousActivity' });
          }
          result = await emailService.sendAdminFraudAlert({
            adminEmail: to, alertType, details, userEmail, gan: fraudGan, suspiciousActivity, timestamp: new Date()
          });
          break;

        default:
          return res.status(400).json({ error: `Unknown email type: ${type}. Available types: receipt, otp, promo, reminder, refund, fraud` });
      }

      res.json({
        status: 'email_test_complete',
        type,
        timestamp: new Date().toISOString(),
        emailResult: result,
        smtpConfigured: emailService.isConfigured(),
        environment: process.env.NODE_ENV || 'development'
      });

    } catch (error) {
      console.error(`Email test error for type ${req.params.type}:`, error);
      res.status(500).json({
        error: 'Email test failed',
        type: req.params.type,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Square OAuth routes (Protected)
  app.get("/api/auth/square", requireMerchant, async (req, res) => {
    try {
      const merchantId = (req as any).merchantId;
      
      // Generate Square OAuth URL with merchant ID in state
      const authUrl = squareService.getAuthorizationUrl(merchantId);
      res.json({ 
        success: true,
        authUrl 
      });
    } catch (error) {
      console.error('Square auth URL error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate Square authorization URL" 
      });
    }
  });

  app.get("/api/auth/square/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).send(`
          <html><body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: #ef4444;">❌ Authorization Failed</h2>
            <p>Authorization code not provided</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body></html>
        `);
      }

      if (!state) {
        return res.status(400).send(`
          <html><body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: #ef4444;">❌ Connection Failed</h2>
            <p>Merchant ID not provided</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body></html>
        `);
      }

      // Exchange code for access token
      const tokenData = await squareService.exchangeCodeForToken(code as string);
      
      // Get Square merchant info
      const squareMerchantInfo = await squareService.getMerchantInfo(tokenData.access_token);
      
      // Find the merchant by the ID passed in state
      const localMerchant = await storage.getMerchantBySquareId(state as string);
      
      if (!localMerchant) {
        return res.status(404).send(`
          <html><body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: #ef4444;">❌ Merchant Not Found</h2>
            <p>Please log in again and try connecting Square</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body></html>
        `);
      }

      // Update merchant with Square tokens
      await storage.updateMerchantTokens(
        localMerchant.id, 
        tokenData.access_token, 
        tokenData.refresh_token
      );

      // Return success response
      res.send(`
        <html>
          <head>
            <title>Square Connected Successfully</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container { text-align: center; }
              .success { color: #4ade80; font-size: 24px; margin-bottom: 16px; }
              .message { font-size: 18px; margin-bottom: 20px; }
              .auto-close { font-size: 14px; color: #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✅ Square Connected Successfully!</div>
              <div class="message">Your Square account has been linked to SiZu GiftCard.</div>
              <div class="auto-close">This window will close automatically...</div>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'SQUARE_OAUTH_SUCCESS',
                    merchantInfo: ${JSON.stringify({ 
                      businessName: squareMerchantInfo.business_name,
                      squareId: squareMerchantInfo.id 
                    })}
                  }, '*');
                }
                window.close();
              }, 2000);
            </script>
          </body>
        </html>
      `);

    } catch (error) {
      console.error('Square OAuth callback error:', error);
      res.send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <h2 style="color: #ef4444;">❌ Connection Failed</h2>
          <p>Unable to connect your Square account. Please try again.</p>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ type: 'SQUARE_OAUTH_ERROR' }, '*');
              }
              window.close();
            }, 3000);
          </script>
        </body></html>
      `);
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

  app.get("/api/giftcards/merchant/:merchantId", requireMerchant, async (req, res) => {
    try {
      const { merchantId } = req.params;
      const giftCards = await storage.getGiftCardsByMerchant(merchantId);
      res.json({ giftCards });
    } catch (error) {
      console.error('Get merchant gift cards error:', error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  // Merchant dashboard routes (Protected)
  app.get("/api/dashboard/stats/:merchantId", requireMerchant, async (req, res) => {
    try {
      const { merchantId } = req.params;
      const stats = await storage.getMerchantStats(merchantId);
      res.json(stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/transactions/:merchantId", requireMerchant, async (req, res) => {
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

      // Process payment using mock service for development
      const paymentResult = await mockPaymentService.processPayment({
        sourceId,
        amount,
        customerEmail: recipientEmail,
        note: `Gift card purchase - $${(amount / 100).toFixed(2)}`
      });

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Payment processing failed: ' + paymentResult.error
        });
      }

      // Create gift card using production Square API
      const giftCardResult = await squareGiftCardService.createGiftCard({
        amount,
        recipientEmail,
        personalMessage
      });

      if (!giftCardResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Gift card creation failed: ' + giftCardResult.error
        });
      }

      const gan = giftCardResult.gan!;
      
      // Generate QR code
      const qrCodeData = await simpleQRService.generateGiftCardQR(
        gan,
        merchantId,
        amount
      );

      // Store in database
      const giftCard = await storage.createGiftCard({
        merchantId,
        squareGiftCardId: giftCardResult.giftCard.id!,
        gan: gan,
        amount,
        balance: amount,
        status: 'ACTIVE',
        recipientEmail: recipientEmail || null,
        personalMessage: personalMessage || null,
        qrCodeData: qrCodeData.redemptionUrl,
        squareState: giftCardResult.giftCard.state || 'ACTIVE',
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
          status: 'COMPLETED',
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

  // Download PDF receipt for gift card
  app.get("/api/giftcards/:gan/receipt", async (req: Request, res: Response) => {
    try {
      const { gan } = req.params;
      
      const giftCard = await storage.getGiftCardByGan(gan);
      if (!giftCard) {
        return res.status(404).json({ success: false, error: "Gift card not found" });
      }

      // Get QR code for receipt
      const qrResult = await simpleQRService.generateGiftCardQR(gan, giftCard.merchantId, giftCard.amount);
      
      // Prepare receipt data
      const receiptData = {
        gan: giftCard.gan,
        amount: giftCard.amount,
        balance: giftCard.balance,
        recipientName: giftCard.recipientName ?? undefined,
        senderName: giftCard.senderName ?? undefined,
        personalMessage: giftCard.personalMessage ?? undefined,
        createdAt: giftCard.createdAt || new Date(),
        status: giftCard.status
      };

      // Generate PDF receipt
      const pdfBuffer = await pdfReceiptService.generateReceipt(receiptData, qrResult.qrCodeDataURL ?? undefined);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SiZu-GiftCard-${gan}-Receipt.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF receipt:", error);
      res.status(500).json({ success: false, error: "Failed to generate receipt" });
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

  // Merchant Dashboard Analytics - Live Stats (Protected by JWT)
  app.get("/api/dashboard/stats", requireMerchant, async (req, res) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({ 
          success: false,
          error: "Merchant authentication required" 
        });
      }

      console.log(`Merchant ${merchantId}: Fetching live dashboard analytics`);

      // Get comprehensive merchant analytics
      const [giftCards, transactions] = await Promise.all([
        storage.getGiftCardsByMerchant(merchantId),
        storage.getRecentTransactions(merchantId, 50)
      ]);

      // Calculate comprehensive metrics
      const totalGiftCards = giftCards.length;
      const totalRevenue = giftCards.reduce((sum, card) => sum + (card.amount || 0), 0);
      const activeCards = giftCards.filter(card => card.status === 'ACTIVE').length;
      const totalRedemptions = transactions.filter(t => t.type === 'REDEEM').length;
      const totalRefunds = transactions.filter(t => t.type === 'REFUND').length;
      const averageCardValue = totalGiftCards > 0 ? totalRevenue / totalGiftCards : 0;

      // Group transactions by date for chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const chartData = last7Days.map(date => {
        const dayTransactions = transactions.filter(t => 
          new Date(t.createdAt).toISOString().split('T')[0] === date
        );
        
        return {
          date: date,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          purchases: dayTransactions.filter(t => t.type === 'PURCHASE').length,
          redemptions: dayTransactions.filter(t => t.type === 'REDEEM').length,
          revenue: dayTransactions
            .filter(t => t.type === 'PURCHASE')
            .reduce((sum, t) => sum + t.amount, 0) / 100
        };
      });

      // Get recent activity with formatted timestamps
      const recentActivity = transactions.slice(0, 10).map(transaction => ({
        ...transaction,
        timeAgo: getTimeAgo(transaction.createdAt),
        formattedAmount: `$${(transaction.amount / 100).toFixed(2)}`
      }));

      res.json({ 
        success: true,
        data: {
          totalGiftCards,
          totalRevenue: totalRevenue / 100, // Convert from cents
          totalRedemptions,
          totalRefunds,
          activeCards,
          averageCardValue: averageCardValue / 100, // Convert from cents
          customers: new Set(giftCards.map(card => card.recipientEmail).filter(Boolean)).size,
          recentActivity,
          chartData,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Merchant dashboard stats error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch dashboard analytics" 
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

  // Square configuration endpoint for Web SDK
  app.get("/api/config/square", (req, res) => {
    try {
      const applicationId = process.env.SQUARE_APPLICATION_ID;
      const locationId = process.env.SQUARE_LOCATION_ID;
      
      // Determine environment based on application ID prefix
      let environment = 'sandbox';
      if (applicationId?.startsWith('sq0app-')) {
        environment = 'production';
      } else if (applicationId?.startsWith('sq0idp-')) {
        environment = 'sandbox';
      } else {
        environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
      }

      if (!applicationId || !locationId) {
        return res.status(500).json({
          error: 'Square configuration missing'
        });
      }

      res.json({
        applicationId,
        locationId,
        environment
      });
    } catch (error) {
      console.error('Square config error:', error);
      res.status(500).json({ error: 'Failed to get Square configuration' });
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
      const result = await enhancedSquareAPIService.createGiftCard({
        type: 'DIGITAL',
        locationId: process.env.SQUARE_LOCATION_ID!
      }, amountCents, {
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

  // === PRODUCTION EMAIL MONITORING ENDPOINTS ===

  // Email delivery monitoring dashboard (Admin only)
  app.get("/api/admin/email/delivery-metrics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const detailedReport = emailDeliveryMonitor.getDetailedReport();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          overview: detailedReport.overview,
          emailTypes: Object.fromEntries(detailedReport.byType),
          volumeStatus: detailedReport.volumeStatus,
          queueStatus: detailedReport.queueStatus,
          recommendations: {
            currentPhase: detailedReport.volumeStatus.warmupPhase,
            canScaleUp: detailedReport.overview.reputation === 'excellent',
            nextScaleUpDate: new Date(detailedReport.volumeStatus.lastScaleUp.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Email metrics error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve email delivery metrics" 
      });
    }
  });

  // Domain authentication status (Admin only)
  app.get("/api/admin/email/domain-auth-status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const authStatus = await domainAuthentication.validateDomainAuth();
      const productionReadiness = await domainAuthentication.isProductionReady();
      const dnsRecords = domainAuthentication.getDNSRecords();
      const setupInstructions = domainAuthentication.getSetupInstructions();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          authenticationStatus: authStatus,
          productionReadiness,
          dnsRecords,
          setupInstructions,
          domainConfig: domainAuthentication.getConfig()
        }
      });
    } catch (error) {
      console.error('Domain auth status error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to check domain authentication status" 
      });
    }
  });

  // Record email delivery webhook for monitoring (Admin only)
  app.post("/api/admin/email/record-delivery", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { emailType, status, messageId } = req.body;
      
      if (!emailType || !status) {
        return res.status(400).json({
          success: false,
          message: "Email type and status are required"
        });
      }

      emailDeliveryMonitor.recordDeliveryStatus(emailType, status);
      
      res.json({
        success: true,
        message: `Delivery status recorded: ${emailType} - ${status}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Record delivery error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to record delivery status" 
      });
    }
  });

  // Email queue management (Admin only)
  app.get("/api/admin/email/queue-status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const volumeStatus = emailDeliveryMonitor.getVolumeStatus();
      const metrics = emailDeliveryMonitor.getMetrics();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          volumeLimits: {
            daily: volumeStatus.dailyLimit,
            hourly: volumeStatus.hourlyLimit,
            sentToday: volumeStatus.sentToday,
            sentThisHour: volumeStatus.sentThisHour
          },
          warmupPhase: volumeStatus.warmupPhase,
          canSendNow: emailDeliveryMonitor.canSendEmail('medium'),
          overallMetrics: metrics instanceof Map ? 'Available via detailed report' : metrics
        }
      });
    } catch (error) {
      console.error('Queue status error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve queue status" 
      });
    }
  });

  // Force domain authentication check (Admin only)
  app.post("/api/admin/email/verify-domain-auth", requireAdmin, async (req: Request, res: Response) => {
    try {
      const authStatus = await domainAuthentication.validateDomainAuth();
      const productionReadiness = await domainAuthentication.isProductionReady();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: productionReadiness.ready ? 
          "Domain authentication is properly configured for production" : 
          "Domain authentication needs configuration",
        data: {
          authStatus,
          productionReadiness,
          nextSteps: productionReadiness.recommendations
        }
      });
    } catch (error) {
      console.error('Domain verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to verify domain authentication" 
      });
    }
  });

  return httpServer;
}
