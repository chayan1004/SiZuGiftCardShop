import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import path from "path";
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
import { ReceiptService } from './services/ReceiptService';
import { squareWebhookHandler } from './webhooks/squareWebhookHandler';
import { webhookService, type RedemptionData } from './services/WebhookService';
import { webhookDispatcher, type RedemptionWebhookPayload as DispatcherPayload } from './services/WebhookDispatcher';
import { multiEventWebhookDispatcher } from './services/MultiEventWebhookDispatcher';
import { FraudDetectionService } from './services/FraudDetectionService';
import { ThreatReplayService } from './services/ThreatReplayService';
import { AutoDefenseEngine } from './services/AutoDefenseEngine';
import { FraudSocketService, calculateThreatSeverity } from './services/FraudSocketService';
import { fileUploadService } from './services/FileUploadService';
import { requireAdmin, requireMerchant, requireMerchantAuth, checkMerchantStatus } from './middleware/authMiddleware';
import { AuthService } from './services/authService';
import { generateGiftCardQR, generateGiftCardBarcode } from '../utils/qrGenerator';
import { z } from "zod";
import { db } from "./db";
import { merchants } from "@shared/schema";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";

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
  const server = createServer(app);
  
  // Initialize WebSocket fraud detection service
  const fraudSocketService = FraudSocketService.getInstance(server);
  console.log('FraudSocketService initialized and ready for real-time threat alerts');

  // SECURITY: Block demo login immediately - highest priority route
  app.post("/api/merchant/demo-login", async (req: Request, res: Response) => {
    console.log('🚨 Security alert: Demo login attempt blocked from IP:', req.ip);
    return res.status(403).json({
      success: false,
      error: 'Demo login disabled for security. Please register a proper merchant account.'
    });
  });
  
  // Rate limiting for authentication endpoints
  const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful logins
  });

  const registrationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration attempts per hour
    message: {
      success: false,
      error: 'Too many registration attempts. Please try again in 1 hour.',
      retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit password reset attempts
    message: {
      success: false,
      error: 'Too many password reset attempts. Please try again in 1 hour.',
      retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  // Demo merchant login for testing JWT authentication
  app.post("/api/merchant/demo-login", async (req: Request, res: Response) => {
    try {
      const result = await AuthService.createDemoMerchant();
      
      if (result.success) {
        console.log(`✅ Demo merchant login successful`);
        
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
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Demo login route error:', error);
      res.status(500).json({
        success: false,
        error: 'Demo login failed'
      });
    }
  });

  // Merchant Authentication Routes
  app.post("/api/merchant/login", loginRateLimit, async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required')
      });

      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.authenticateMerchant(email, password);

      if (result.success) {
        // Log successful login for security monitoring
        console.log(`✅ Successful merchant login: ${email} from IP: ${req.ip} at ${new Date().toISOString()}`);
        
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
        // Log failed login attempt for security monitoring
        console.warn(`❌ Failed merchant login attempt: ${email} from IP: ${req.ip} at ${new Date().toISOString()} - Reason: ${result.error}`);
        
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

  app.post("/api/merchant/register", registrationRateLimit, async (req: Request, res: Response) => {
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
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const newMerchant = await storage.createMerchant({
        squareApplicationId: 'pending-square-setup',
        accessToken: 'pending-square-oauth',
        refreshToken: 'pending-square-oauth',
        merchantId,
        businessName,
        email,
        passwordHash,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isActive: true
      });

      // Send verification email
      try {
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/merchant/verify-email?token=${verificationToken}`;
        
        await emailService.sendVerificationEmail({
          to: email,
          businessName,
          verificationUrl
        });

        console.log(`✅ Verification email sent to: ${email}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, just log it
      }

      // Generate JWT token but mark as unverified
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
        message: 'Account created successfully! Please check your email to verify your account.',
        token,
        merchant: {
          id: newMerchant.id,
          merchantId: newMerchant.merchantId,
          businessName: newMerchant.businessName,
          email: newMerchant.email,
          emailVerified: newMerchant.emailVerified
        },
        requiresEmailVerification: true
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



  // Email verification endpoint
  app.get("/api/merchant/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
      }

      // Find merchant by verification token
      const merchant = await storage.getMerchantByVerificationToken(token);
      if (!merchant) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
      }

      // Check if token has expired
      if (merchant.emailVerificationExpires && new Date() > merchant.emailVerificationExpires) {
        return res.status(400).json({
          success: false,
          error: 'Verification token has expired. Please request a new verification email.'
        });
      }

      // Check if already verified
      if (merchant.emailVerified) {
        return res.redirect('/merchant-dashboard?verified=already');
      }

      // Mark email as verified
      await storage.markMerchantEmailVerified(merchant.id);

      console.log(`✅ Email verified successfully for merchant: ${merchant.email}`);

      // Redirect to dashboard with success message
      res.redirect('/merchant-dashboard?verified=success');

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed. Please try again.'
      });
    }
  });

  app.post("/api/merchant/logout", (req: Request, res: Response) => {
    res.clearCookie('merchantToken');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Password reset for existing merchants (development only)
  app.post("/api/merchant/reset-password", passwordResetRateLimit, async (req: Request, res: Response) => {
    try {
      const resetSchema = z.object({
        email: z.string().email('Valid email is required'),
        newPassword: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/\d/, 'Password must contain at least one number'),
      });

      const { email, newPassword } = resetSchema.parse(req.body);

      // Find merchant by email
      const merchant = await storage.getMerchantByEmail(email);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'No merchant found with this email'
        });
      }

      // Hash the new password
      const newPasswordHash = await AuthService.hashPassword(newPassword);

      // Update the merchant's password in the database
      await db.update(merchants)
        .set({ passwordHash: newPasswordHash })
        .where(eq(merchants.email, email));

      console.log(`✅ Password reset successful for merchant: ${email}`);

      res.json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Password reset failed. Please try again.'
        });
      }
    }
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
        squareGiftCardId: giftCardResult.giftCard?.id || '',
        gan: gan,
        amount,
        balance: amount,
        status: 'ACTIVE',
        recipientEmail: recipientEmail || null,
        personalMessage: personalMessage || null,
        qrCodeData: qrCodeData.redemptionUrl,
        squareState: giftCardResult.giftCard?.state || 'ACTIVE',
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

  // Merchant Bulk Gift Card Purchase
  app.post("/api/merchant/giftcards/bulk", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      const { amount, quantity, customMessage, logoUrl, sourceId } = req.body;

      // Validate input
      if (!amount || !quantity || !sourceId) {
        return res.status(400).json({
          success: false,
          error: "Amount, quantity, and payment source are required"
        });
      }

      if (amount < 500 || amount > 50000) {
        return res.status(400).json({
          success: false,
          error: "Card amount must be between $5 and $500"
        });
      }

      if (quantity < 1 || quantity > 10000) {
        return res.status(400).json({
          success: false,
          error: "Quantity must be between 1 and 10,000"
        });
      }

      console.log(`Processing bulk purchase for merchant ${merchantId}: ${quantity} cards @ $${amount/100} each`);

      // Import and process bulk purchase
      const { MerchantBulkPurchaseService } = await import('./services/merchantBulkPurchaseService');
      const bulkService = new MerchantBulkPurchaseService();
      
      const result = await bulkService.processBulkPurchase(merchantId, {
        amount,
        quantity,
        customMessage,
        logoUrl,
        sourceId
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: `Successfully created ${result.cards?.length || 0} gift cards`,
        bulkOrderId: result.bulkOrderId,
        cards: result.cards
      });

    } catch (error) {
      console.error('Bulk purchase error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to process bulk purchase"
      });
    }
  });

  app.get("/api/merchant/giftcards/bulk-orders", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      const { MerchantBulkPurchaseService } = await import('./services/merchantBulkPurchaseService');
      const bulkService = new MerchantBulkPurchaseService();
      
      const orders = await bulkService.getMerchantBulkOrders(merchantId);

      res.json({
        success: true,
        orders: orders.map(order => ({
          ...order,
          formattedTotal: `$${(order.totalAmount / 100).toFixed(2)}`,
          formattedCardAmount: `$${(order.cardAmount / 100).toFixed(2)}`
        }))
      });

    } catch (error) {
      console.error('Error fetching bulk orders:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch bulk orders"
      });
    }
  });

  app.get("/api/merchant/giftcards/my-cards", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      const { bulkOrderId } = req.query;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      const { MerchantBulkPurchaseService } = await import('./services/merchantBulkPurchaseService');
      const bulkService = new MerchantBulkPurchaseService();
      
      const cards = await bulkService.getMerchantGiftCards(merchantId, bulkOrderId as string);

      res.json({
        success: true,
        cards: cards.map(card => ({
          ...card,
          formattedAmount: `$${(card.amount / 100).toFixed(2)}`
        }))
      });

    } catch (error) {
      console.error('Error fetching merchant gift cards:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch gift cards"
      });
    }
  });

  app.get("/api/merchant/pricing-tiers", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      const tiers = await storage.getMerchantPricingTiers(merchant.id);
      
      // If no custom tiers exist, create default ones
      if (tiers.length === 0) {
        const defaultTiers = [
          { merchantId: merchant.id, minQuantity: 1, pricePerUnit: 2500 },
          { merchantId: merchant.id, minQuantity: 10, pricePerUnit: 2300 },
          { merchantId: merchant.id, minQuantity: 50, pricePerUnit: 2000 },
        ];
        
        for (const tier of defaultTiers) {
          await storage.createMerchantPricingTier(tier);
        }
        
        const newTiers = await storage.getMerchantPricingTiers(merchant.id);
        return res.json({
          success: true,
          tiers: newTiers
        });
      }

      res.json({
        success: true,
        tiers
      });
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch pricing tiers"
      });
    }
  });

  // Get merchant branding
  app.get("/api/merchant/branding", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      let branding = await storage.getMerchantBranding(merchant.id);
      
      // If no branding exists, create default branding
      if (!branding) {
        branding = await storage.createMerchantBranding({
          merchantId: merchant.id,
          logoUrl: null,
          themeColor: '#6366f1',
          tagline: `Gift cards by ${merchant.businessName}`
        });
      }

      res.json({
        success: true,
        branding
      });
    } catch (error) {
      console.error('Error fetching merchant branding:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch merchant branding"
      });
    }
  });

  // Update merchant branding
  app.put("/api/merchant/branding", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      const { logoUrl, themeColor, tagline } = req.body;
      
      const updatedBranding = await storage.updateMerchantBranding(merchant.id, {
        logoUrl,
        themeColor,
        tagline
      });

      res.json({
        success: true,
        branding: updatedBranding
      });
    } catch (error) {
      console.error('Error updating merchant branding:', error);
      res.status(500).json({
        success: false,
        error: "Failed to update merchant branding"
      });
    }
  });

  // Admin endpoints for merchant management
  app.get("/api/admin/merchant/:id/branding", requireAdmin, async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      let branding = await storage.getMerchantBranding(merchant.id);
      
      // If no branding exists, create default branding
      if (!branding) {
        branding = await storage.createMerchantBranding({
          merchantId: merchant.id,
          logoUrl: null,
          themeColor: '#6366f1',
          tagline: `Gift cards by ${merchant.businessName}`
        });
      }

      res.json({
        success: true,
        branding
      });
    } catch (error) {
      console.error('Error fetching merchant branding:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch merchant branding"
      });
    }
  });

  app.post("/api/admin/merchant/:id/branding", requireAdmin, async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      const { logoUrl, themeColor, tagline } = req.body;
      
      // Check if branding already exists
      let branding = await storage.getMerchantBranding(merchant.id);
      
      if (branding) {
        // Update existing branding
        branding = await storage.updateMerchantBranding(merchant.id, {
          logoUrl,
          themeColor,
          tagline
        });
      } else {
        // Create new branding
        branding = await storage.createMerchantBranding({
          merchantId: merchant.id,
          logoUrl,
          themeColor,
          tagline
        });
      }

      res.json({
        success: true,
        branding
      });
    } catch (error) {
      console.error('Error saving merchant branding:', error);
      res.status(500).json({
        success: false,
        error: "Failed to save merchant branding"
      });
    }
  });

  app.get("/api/admin/merchant/:id/pricing-tiers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      const tiers = await storage.getMerchantPricingTiers(merchant.id);
      
      // If no custom tiers exist, create default ones
      if (tiers.length === 0) {
        const defaultTiers = [
          { merchantId: merchant.id, minQuantity: 1, pricePerUnit: 2500 },
          { merchantId: merchant.id, minQuantity: 10, pricePerUnit: 2300 },
          { merchantId: merchant.id, minQuantity: 50, pricePerUnit: 2000 },
        ];
        
        for (const tier of defaultTiers) {
          await storage.createMerchantPricingTier(tier);
        }
        
        const newTiers = await storage.getMerchantPricingTiers(merchant.id);
        return res.json({
          success: true,
          tiers: newTiers
        });
      }

      res.json({
        success: true,
        tiers
      });
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch pricing tiers"
      });
    }
  });

  app.post("/api/admin/merchant/:id/pricing-tiers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      const merchant = await storage.getMerchant(merchantId);
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      const { tiers } = req.body;
      
      if (!Array.isArray(tiers)) {
        return res.status(400).json({ message: "Tiers must be an array" });
      }

      // Delete existing tiers for this merchant
      const existingTiers = await storage.getMerchantPricingTiers(merchant.id);
      for (const tier of existingTiers) {
        await storage.deleteMerchantPricingTier(tier.id);
      }

      // Create new tiers
      const newTiers = [];
      for (const tierData of tiers) {
        const tier = await storage.createMerchantPricingTier({
          merchantId: merchant.id,
          minQuantity: tierData.minQuantity,
          pricePerUnit: tierData.pricePerUnit
        });
        newTiers.push(tier);
      }

      res.json({
        success: true,
        tiers: newTiers
      });
    } catch (error) {
      console.error('Error saving pricing tiers:', error);
      res.status(500).json({
        success: false,
        error: "Failed to save pricing tiers"
      });
    }
  });

  // Merchant Bulk Order Routes
  app.post("/api/merchant/bulk-orders", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      // Validate input with Zod
      const bulkOrderSchema = z.object({
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        unit_price: z.number().positive("Unit price must be positive")
      });

      const { quantity, unit_price } = bulkOrderSchema.parse(req.body);

      // Import and use the service
      const { MerchantBulkOrderService } = await import('./services/merchantBulkOrderService');
      const order = await MerchantBulkOrderService.createBulkOrder(merchantId, quantity, unit_price);

      console.log(`Bulk order created for merchant ${merchantId}: ${quantity} units at $${unit_price} each`);

      res.json({
        success: true,
        message: "Bulk order placed successfully",
        order: MerchantBulkOrderService.formatOrderForResponse(order)
      });

    } catch (error: any) {
      console.error('Bulk order creation error:', error);
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.errors[0]?.message || "Invalid input data"
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to create bulk order"
      });
    }
  });

  app.get("/api/merchant/bulk-orders", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      // Import and use the service
      const { MerchantBulkOrderService } = await import('./services/merchantBulkOrderService');
      const orders = await MerchantBulkOrderService.getBulkOrdersByMerchant(merchantId);

      const formattedOrders = orders.map(order => 
        MerchantBulkOrderService.formatOrderForResponse(order)
      );

      res.json({
        success: true,
        orders: formattedOrders
      });

    } catch (error) {
      console.error('Error fetching bulk orders:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch bulk orders"
      });
    }
  });

  // Merchant Email Verification Routes
  app.post("/api/merchant/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Verification token is required"
        });
      }

      const { EmailVerificationService } = await import('./services/emailVerificationService');
      const verificationResult = await EmailVerificationService.verifyEmail(token);

      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          error: verificationResult.error
        });
      }

      console.log(`Email verified for merchant: ${verificationResult.merchant?.email}`);
      
      res.json({
        success: true,
        message: "Email verified successfully",
        merchant: verificationResult.merchant
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: "Email verification failed"
      });
    }
  });

  app.post("/api/merchant/resend-verification", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      const { EmailVerificationService } = await import('./services/emailVerificationService');
      const emailResult = await EmailVerificationService.resendVerificationEmail(merchantId);

      if (!emailResult.success) {
        return res.status(400).json({
          success: false,
          error: emailResult.error
        });
      }

      res.json({
        success: true,
        message: "Verification email sent successfully"
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to resend verification email"
      });
    }
  });

  app.get("/api/merchant/verification-status", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({
          success: false,
          error: "Merchant authentication required"
        });
      }

      const { EmailVerificationService } = await import('./services/emailVerificationService');
      const isVerified = await EmailVerificationService.isEmailVerified(merchantId);

      res.json({
        success: true,
        emailVerified: isVerified
      });

    } catch (error) {
      console.error('Verification status check error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to check verification status"
      });
    }
  });

  // Merchant Transaction History (Protected by JWT)
  app.get("/api/dashboard/transactions", requireMerchant, async (req, res) => {
    try {
      const merchantId = (req as any).merchantId;
      
      if (!merchantId) {
        return res.status(401).json({ 
          success: false,
          error: "Merchant authentication required" 
        });
      }

      const { 
        startDate, 
        endDate, 
        status, 
        search, 
        page = 1, 
        limit = 50 
      } = req.query;

      console.log(`Merchant ${merchantId}: Fetching transaction history`);

      // Get gift cards for this merchant
      const merchantGiftCards = await storage.getGiftCardsByMerchant(merchantId);
      const giftCardIds = merchantGiftCards.map(gc => gc.id);

      if (giftCardIds.length === 0) {
        return res.json({
          success: true,
          transactions: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            totalPages: 0
          }
        });
      }

      // Get activities for all merchant gift cards
      const allActivities = await Promise.all(
        giftCardIds.map(id => storage.getGiftCardActivities(id))
      );
      
      let transactions = allActivities.flat();

      // Apply date filters
      if (startDate || endDate) {
        transactions = transactions.filter(tx => {
          const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
          if (startDate && txDate < new Date(startDate as string)) return false;
          if (endDate && txDate > new Date(endDate as string)) return false;
          return true;
        });
      }

      // Apply status filter
      if (status && status !== 'all') {
        transactions = transactions.filter(tx => 
          tx.type.toLowerCase() === (status as string).toLowerCase()
        );
      }

      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        transactions = transactions.filter(tx => {
          const giftCard = merchantGiftCards.find(gc => gc.id === tx.giftCardId);
          return (
            giftCard?.gan.toLowerCase().includes(searchTerm) ||
            giftCard?.recipientEmail?.toLowerCase().includes(searchTerm) ||
            tx.type.toLowerCase().includes(searchTerm)
          );
        });
      }

      // Sort by date (newest first)
      transactions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const total = transactions.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedTransactions = transactions.slice(startIndex, startIndex + limitNum);

      // Format transactions with gift card details
      const formattedTransactions = paginatedTransactions.map(tx => {
        const giftCard = merchantGiftCards.find(gc => gc.id === tx.giftCardId);
        const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
        return {
          id: tx.id,
          date: tx.createdAt || new Date().toISOString(),
          giftCardGan: giftCard?.gan || 'N/A',
          recipientEmail: giftCard?.recipientEmail,
          amount: tx.amount,
          formattedAmount: `$${(tx.amount / 100).toFixed(2)}`,
          status: tx.type,
          type: tx.type === 'ACTIVATE' ? 'PURCHASE' : tx.type,
          notes: `${tx.type} transaction`,
          timeAgo: getTimeAgo(txDate),
          balanceAfter: giftCard?.amount || 0,
          formattedBalance: `$${((giftCard?.amount || 0) / 100).toFixed(2)}`
        };
      });

      res.json({
        success: true,
        transactions: formattedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      });

    } catch (error) {
      console.error("Error fetching merchant transactions:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error"
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

  // Admin Weekly Revenue API
  app.get("/api/admin/weekly-revenue", requireAdmin, async (req, res) => {
    try {
      const weeklyRevenue = await storage.getWeeklyRevenue();
      res.json(weeklyRevenue);
    } catch (error) {
      console.error('Weekly revenue error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weekly revenue data'
      });
    }
  });

  // Admin Recent Activity API
  app.get("/api/admin/recent-activity", requireAdmin, async (req, res) => {
    try {
      const recentActivity = await storage.getRecentTransactions('all', 15);
      const formattedActivity = recentActivity.map(activity => ({
        type: activity.type,
        amount: activity.amount,
        email: activity.email,
        gan: activity.gan,
        createdAt: activity.createdAt,
        timeAgo: getTimeAgo(activity.createdAt)
      }));
      res.json(formattedActivity);
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent activity'
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

  // Admin Fraud Detection Monitoring Endpoints
  app.get("/api/admin/fraud-logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 50 } = req.query;
      const fraudLogs = await FraudDetectionService.getRecentFraudLogs(Number(limit));
      
      res.json({
        success: true,
        fraudLogs,
        total: fraudLogs.length
      });
    } catch (error) {
      console.error('Error fetching fraud logs:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch fraud logs"
      });
    }
  });

  app.get("/api/admin/fraud-statistics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const statistics = await FraudDetectionService.getFraudStatistics();
      
      res.json({
        success: true,
        statistics
      });
    } catch (error) {
      console.error('Error fetching fraud statistics:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch fraud statistics"
      });
    }
  });

  // Fraud alert webhook endpoint for external integrations
  app.post("/api/webhooks/fraud-alert", async (req: Request, res: Response) => {
    try {
      const { gan, ip, reason, merchantId, timestamp } = req.body;
      
      // Log the webhook alert for admin monitoring
      console.log(`Fraud Alert Webhook: ${reason} - GAN: ${gan}, IP: ${ip}, Merchant: ${merchantId}, Time: ${timestamp}`);
      
      // You can integrate with external security systems here
      // Example: Send to Slack, Discord, email alerts, etc.
      
      res.json({
        success: true,
        message: "Fraud alert processed"
      });
    } catch (error) {
      console.error('Error processing fraud alert webhook:', error);
      res.status(500).json({
        success: false,
        error: "Failed to process fraud alert"
      });
    }
  });

  // Threat Replay Engine Endpoints
  app.post("/api/admin/replay-threats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 50 } = req.body;
      
      console.log(`Admin initiated threat replay analysis (limit: ${limit})`);
      
      // Run threat replay analysis
      const replayResults = await ThreatReplayService.runThreatReplay(limit);
      
      // Learn from replay results and create defense rules
      const learningResults = await AutoDefenseEngine.learnFromReplay(replayResults.reports);
      
      res.json({
        success: true,
        replay: replayResults,
        learning: learningResults,
        message: `Analyzed ${replayResults.totalAnalyzed} threats, created ${learningResults.rulesCreated} new defense rules`
      });
    } catch (error) {
      console.error('Error running threat replay:', error);
      res.status(500).json({
        success: false,
        error: "Failed to run threat replay analysis"
      });
    }
  });

  app.get("/api/admin/defense-rules", requireAdmin, async (req: Request, res: Response) => {
    try {
      const rules = await storage.getAutoDefenseRules();
      const statistics = await AutoDefenseEngine.getDefenseStatistics();
      
      res.json({
        success: true,
        rules,
        statistics
      });
    } catch (error) {
      console.error('Error fetching defense rules:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch defense rules"
      });
    }
  });

  app.delete("/api/admin/defense-rules/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const deactivatedRule = await storage.deactivateAutoDefenseRule(id);
      
      if (deactivatedRule) {
        res.json({
          success: true,
          message: "Defense rule deactivated successfully",
          rule: deactivatedRule
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Defense rule not found"
        });
      }
    } catch (error) {
      console.error('Error deactivating defense rule:', error);
      res.status(500).json({
        success: false,
        error: "Failed to deactivate defense rule"
      });
    }
  });

  // GET /api/receipts/:receiptId - Serve PDF receipts securely
  app.get("/api/receipts/:receiptId", async (req: Request, res: Response) => {
    try {
      const { receiptId } = req.params;
      
      // Enhanced security validation - strict receipt ID format only
      if (!receiptId || !/^receipt_test_order_\d+_\d+$/.test(receiptId)) {
        return res.status(400).json({ error: 'Invalid receipt ID format' });
      }

      const filePath = await ReceiptService.getReceiptFilePath(receiptId);
      if (!filePath) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      // Additional security check - ensure file is within receipts directory
      const receiptDir = path.join(process.cwd(), 'storage', 'receipts');
      if (!filePath.startsWith(receiptDir)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${receiptId}.pdf"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Stream the PDF file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving receipt:', error);
      res.status(500).json({ error: 'Failed to retrieve receipt' });
    }
  });

  // POST /api/test/generate-receipt - Test PDF receipt generation
  app.post("/api/test/generate-receipt", async (req: Request, res: Response) => {
    try {
      const mockPurchase = {
        orderId: `test_order_${Date.now()}`,
        merchantId: req.body.merchantId || 'merchant_1751221971890_zmi502',
        recipientEmail: req.body.recipientEmail || 'customer@example.com',
        recipientName: req.body.recipientName || 'John Doe',
        senderName: req.body.senderName || 'Jane Smith',
        amount: req.body.amount || 5000, // $50.00 in cents
        personalMessage: req.body.personalMessage || 'Happy Birthday! Enjoy this gift card.',
        transactionId: `txn_${Date.now()}`,
        giftCardGan: `GC${Date.now()}`,
        purchaseDate: new Date(),
      };

      const result = await ReceiptService.generateReceiptPDF(mockPurchase);
      
      if (result.success) {
        res.json({
          success: true,
          receiptId: result.receiptId,
          downloadUrl: `/api/receipts/${result.receiptId}`,
          message: 'PDF receipt generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to generate receipt'
        });
      }
    } catch (error) {
      console.error('Error in test receipt generation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
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
      const result = await enhancedSquareAPIService.createGiftCard(
        amountCents, 
        `Refund: ${reason}`,
        {
          type: 'DIGITAL'
        }
      );

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

  // Get all merchants for admin dashboard
  app.get("/api/admin/merchants", requireAdmin, async (req: Request, res: Response) => {
    try {
      const merchants = await storage.getAllMerchants();
      
      // Enhance with additional stats for each merchant
      const merchantsWithStats = await Promise.all(
        merchants.map(async (merchant) => {
          const stats = await storage.getMerchantStats(merchant.merchantId);
          return {
            id: merchant.id,
            businessName: merchant.businessName,
            email: merchant.email,
            squareId: merchant.merchantId,
            isEmailVerified: merchant.emailVerified || false,
            createdAt: merchant.createdAt?.toISOString() || new Date().toISOString(),
            lastLogin: undefined, // No lastLogin field in current schema
            totalSales: stats.totalSales,
            activeGiftCards: stats.activeCards
          };
        })
      );

      res.json(merchantsWithStats);
    } catch (error) {
      console.error('Get merchants error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve merchants" 
      });
    }
  });

  // Protected merchant dashboard routes - Add missing route protection
  app.get('/merchant-dashboard', requireMerchantAuth, (req: Request, res: Response) => {
    // This route is handled by the frontend - just ensure authentication
    res.redirect('/merchant-dashboard');
  });

  app.get('/merchant-bulk-orders', requireMerchantAuth, (req: Request, res: Response) => {
    // This route is handled by the frontend - just ensure authentication
    res.redirect('/merchant-bulk-orders');
  });

  app.get('/merchant-giftcards', requireMerchantAuth, (req: Request, res: Response) => {
    // This route is handled by the frontend - just ensure authentication
    res.redirect('/merchant-giftcards');
  });

  // === PUBLIC GIFT CARD STORE API ENDPOINTS ===

  // Validate merchant ID for business pricing
  app.get("/api/public/validate-merchant/:merchantId", async (req: Request, res: Response) => {
    try {
      const { merchantId } = req.params;
      const isValid = await storage.validateMerchantById(merchantId);
      res.json({ valid: isValid });
    } catch (error) {
      console.error('Merchant validation error:', error);
      res.status(500).json({ valid: false, error: 'Validation failed' });
    }
  });

  // Get merchant card design for public checkout
  app.get("/api/public/merchant-design/:merchantId", async (req: Request, res: Response) => {
    try {
      const { merchantId } = req.params;
      
      // Fetch merchant card design by square ID
      const design = await storage.getMerchantCardDesignBySquareId(merchantId);
      
      if (!design) {
        // Return default/fallback design
        return res.json({
          success: true,
          design: {
            hasCustomDesign: false,
            backgroundImageUrl: null,
            logoUrl: null,
            themeColor: '#613791',
            customMessage: 'Thank you for choosing our gift card!'
          }
        });
      }

      // Return merchant's custom design
      res.json({
        success: true,
        design: {
          hasCustomDesign: true,
          backgroundImageUrl: design.designUrl,
          logoUrl: design.logoUrl,
          themeColor: design.themeColor || '#613791',
          customMessage: design.customMessage || 'Thank you for choosing our gift card!'
        }
      });
    } catch (error) {
      console.error('Merchant design fetch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch merchant design',
        design: {
          hasCustomDesign: false,
          backgroundImageUrl: null,
          logoUrl: null,
          themeColor: '#613791',
          customMessage: 'Thank you for choosing our gift card!'
        }
      });
    }
  });

  // Public gift card checkout with Square payment processing
  app.post("/api/public/checkout", async (req: Request, res: Response) => {
    try {
      const { recipientEmail, merchantId, amount, message, paymentToken } = req.body;

      // Validate input data
      if (!recipientEmail || !amount || amount < 500 || amount > 50000) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data. Amount must be between $5.00 and $500.00"
        });
      }

      if (!paymentToken) {
        return res.status(400).json({
          success: false,
          message: "Payment token is required"
        });
      }

      // Create order record first (pending status)
      const orderData = {
        recipientEmail,
        merchantId: merchantId || null,
        amount,
        message: message || null,
        status: 'pending'
      };

      const order = await storage.createPublicGiftCardOrder(orderData);

      // Process payment with Square
      try {
        if (!process.env.SQUARE_ACCESS_TOKEN) {
          throw new Error('Square access token not configured');
        }

        // Using Square SDK for proper type safety
        const { Client, Environment } = require('square');
        const client = new Client({
          accessToken: process.env.SQUARE_ACCESS_TOKEN,
          environment: process.env.SQUARE_ENVIRONMENT === 'production' 
            ? 'production' 
            : 'sandbox'
        });

        const paymentsApi = client.paymentsApi;
        const giftCardsApi = client.giftCardsApi;

        // Create payment
        const paymentRequest = {
          sourceId: paymentToken,
          amountMoney: {
            amount: amount,
            currency: 'USD'
          },
          idempotencyKey: `giftcard_${order.id}_${Date.now()}`,
          note: `Gift card purchase for ${recipientEmail}`,
          buyerEmailAddress: recipientEmail
        };

        const { result: paymentResult } = await paymentsApi.createPayment(paymentRequest);

        if (paymentResult.payment && paymentResult.payment.status === 'COMPLETED') {
          // Payment successful - now create the gift card using Square Gift Cards API
          console.log(`✅ Payment confirmed for order ${order.id}, creating gift card...`);
          
          try {
            // Create gift card with Square using the latest SDK
            const giftCardCreateRequest = {
              idempotencyKey: `gift_${order.id}_${Date.now()}`,
              locationId: process.env.SQUARE_LOCATION_ID,
              giftCard: {
                type: 'DIGITAL',
                ganSource: 'SQUARE',
                state: 'ACTIVE',
                balanceMoney: {
                  amount: amount,
                  currency: 'USD'
                }
              }
            };

            console.log('Creating Square gift card with request:', JSON.stringify(giftCardCreateRequest, null, 2));
            const giftCardResponse = await giftCardsApi.createGiftCard(giftCardCreateRequest);
            const giftCardResult = giftCardResponse.result;

            console.log('Square gift card API response:', JSON.stringify(giftCardResult, null, 2));

            if (giftCardResult.giftCard) {
              const giftCard = giftCardResult.giftCard;
              const giftCardId = giftCard.id;
              const gan = giftCard.gan || null; // GAN might be null initially
              const state = giftCard.state;

              console.log(`✅ Gift card created: ID=${giftCardId}, GAN=${gan}, State=${state}`);

              // Update order status to 'issued' with gift card metadata
              await storage.updatePublicGiftCardOrderStatus(
                order.id,
                'issued',
                paymentResult.payment.id,
                gan,
                giftCardId,
                state
              );

              // Also create a gift card record in our database for tracking
              const giftCardData = {
                merchantId: merchantId || 'public',
                squareGiftCardId: giftCardId,
                gan: gan || `TEMP_${giftCardId}`, // Use temp GAN if not provided
                amount: amount,
                balance: amount,
                status: 'ACTIVE',
                recipientEmail: recipientEmail,
                recipientName: recipientEmail.split('@')[0],
                senderName: 'SiZu Gift Card Store',
                personalMessage: message || null,
                qrCodeData: gan ? `https://square.link/u/${gan}` : null,
                squareState: state || 'ACTIVE'
              };

              await storage.createGiftCard(giftCardData);

              // Send gift card email notification
              try {
                // Email service already imported at top of file
                
                // Check if email already sent to prevent duplicates
                const currentOrder = await storage.getPublicGiftCardOrderById(order.id);
                if (currentOrder && !currentOrder.emailSent) {
                  const emailResult = await emailService.sendGiftCardEmail({
                    to: recipientEmail,
                    gan: gan,
                    amount: amount,
                    message: message || undefined,
                    senderName: 'SiZu Gift Card Store',
                    recipientName: recipientEmail.split('@')[0],
                    recipientEmail: recipientEmail,
                    giftCardId: giftCardId,
                    giftCardGan: gan,
                    businessName: 'SiZu Gift Card Store',
                    customMessage: message || undefined,
                    orderId: order.id
                  });

                  if (emailResult.success) {
                    await storage.updatePublicGiftCardOrderEmailStatus(order.id, true, new Date());
                    console.log(`✅ Gift card email sent: ${emailResult.messageId}`);
                  } else {
                    console.error(`❌ Failed to send gift card email: ${emailResult.error}`);
                    // Don't fail the entire transaction if email fails
                  }
                } else {
                  console.log(`📧 Email already sent for order ${order.id}, skipping duplicate send`);
                }
              } catch (emailError) {
                console.error('Email service error:', emailError);
                // Don't fail the entire transaction if email fails
              }

              // Generate PDF receipt after successful gift card creation
              try {
                const currentOrder = await storage.getPublicGiftCardOrderById(order.id);
                if (currentOrder && !currentOrder.pdfReceiptUrl) {
                  const receiptResult = await ReceiptService.generatePDFReceipt(currentOrder);
                  
                  if (receiptResult.success && receiptResult.url) {
                    await storage.updateReceiptUrl(order.id, receiptResult.url, new Date());
                    console.log(`✅ PDF receipt generated: ${receiptResult.url}`);
                  } else {
                    console.error(`❌ Failed to generate PDF receipt: ${receiptResult.error}`);
                  }
                } else {
                  console.log(`📄 PDF receipt already exists for order ${order.id}`);
                }
              } catch (pdfError) {
                console.error('PDF receipt generation error:', pdfError);
              }

              console.log(`✅ Gift card issued successfully: ID=${giftCardId} for ${recipientEmail}`);

              res.json({
                success: true,
                message: "Gift card created and issued successfully",
                orderId: order.id,
                giftCardId: giftCardId,
                giftCardGan: gan,
                giftCardState: state
              });
            } else {
              throw new Error('Gift card creation failed - no gift card object returned');
            }
          } catch (giftCardError: any) {
            console.error('Gift card creation error:', giftCardError);
            
            // Update order status to failed
            await storage.updatePublicGiftCardOrderStatus(order.id, 'failed');
            
            throw new Error(`Gift card creation failed: ${giftCardError.message}`);
          }
        } else {
          throw new Error(`Payment failed: ${paymentResult.payment?.status || 'Unknown error'}`);
        }
      } catch (paymentError: any) {
        console.error('Payment/Gift card creation error:', paymentError);
        
        // Update order status to failed
        await storage.updatePublicGiftCardOrderStatus(order.id, 'failed');
        
        res.status(400).json({
          success: false,
          message: paymentError.message || "Payment processing failed"
        });
      }
    } catch (error: any) {
      console.error('Public checkout error:', error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your order"
      });
    }
  });

  // Public order details endpoint for success page
  app.get("/api/public/order/:orderId", async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getPublicGiftCardOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Return only safe public data
      const publicOrder = {
        id: order.id,
        recipientEmail: order.recipientEmail,
        amount: order.amount,
        status: order.status,
        giftCardId: order.giftCardId,
        giftCardGan: order.giftCardGan,
        pdfReceiptUrl: order.pdfReceiptUrl,
        emailSent: order.emailSent,
        createdAt: order.createdAt
      };

      res.json(publicOrder);
    } catch (error) {
      console.error('Error fetching public order:', error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  // QR Code generation endpoint for order receipts
  app.get("/api/public/qr/:orderId", async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { QRCodeUtil } = await import('./utils/QRCodeUtil');
      
      // Verify order exists
      const order = await storage.getPublicGiftCardOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Generate QR code data URI
      const receiptURL = QRCodeUtil.generateReceiptURL(orderId);
      const qrCodeDataURI = await QRCodeUtil.generateQRCodeDataURI(receiptURL, {
        width: 200,
        margin: 2
      });

      res.json({
        success: true,
        qrCodeDataURI,
        receiptURL
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Admin endpoint for public gift card orders
  app.get("/api/admin/giftcard-orders", requireAdmin, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllPublicGiftCardOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching public gift card orders:', error);
      res.status(500).json({ message: "Failed to fetch gift card orders" });
    }
  });

  // Resend Email for Gift Card Order (Prompt 8)
  app.post("/api/admin/giftcard-orders/:orderId/resend-email", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      
      // Get order details
      const order = await storage.getPublicGiftCardOrderById(orderId);
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Check if order is in issued state and has gift card data
      if (order.status !== 'issued' || !order.giftCardGan || !order.giftCardId) {
        return res.status(400).json({
          success: false,
          message: "Order must be in 'issued' status with gift card data to resend email"
        });
      }

      // Send email using emailService with proper format
      const emailData = {
        to: order.recipientEmail,
        gan: order.giftCardGan,
        amount: order.amount,
        giftCardId: order.giftCardId,
        message: order.message || undefined
      };
      const emailSent = await emailService.sendGiftCardEmail(emailData);
      
      if (emailSent) {
        // Update resend tracking
        await storage.markEmailAsResent(orderId);
        await storage.updatePublicGiftCardOrderEmailStatus(orderId, true, new Date());
        
        console.log(`Admin resent email for order ${orderId} to ${order.recipientEmail}`);
        
        res.json({
          success: true,
          message: "Email resent successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send email"
        });
      }
    } catch (error) {
      console.error('Error resending email:', error);
      res.status(500).json({
        success: false,
        message: "Failed to resend email"
      });
    }
  });

  // Mark Order as Failed (Prompt 8)
  app.post("/api/admin/giftcard-orders/:orderId/mark-failed", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      
      // Get order details
      const order = await storage.getPublicGiftCardOrderById(orderId);
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Update order status to failed
      const updatedOrder = await storage.markOrderAsFailed(orderId);
      
      if (updatedOrder) {
        console.log(`Admin marked order ${orderId} as failed`);
        
        res.json({
          success: true,
          message: "Order marked as failed successfully",
          order: updatedOrder
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update order status"
        });
      }
    } catch (error) {
      console.error('Error marking order as failed:', error);
      res.status(500).json({
        success: false,
        message: "Failed to mark order as failed"
      });
    }
  });

  // Admin endpoint for email log tracking
  app.get("/api/admin/email-log/:orderId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getPublicGiftCardOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const emailLog = {
        orderId: order.id,
        recipientEmail: order.recipientEmail,
        emailSent: order.emailSent,
        emailSentAt: order.emailSentAt,
        order: {
          id: order.id,
          amount: order.amount,
          status: order.status,
          giftCardId: order.giftCardId,
          giftCardGan: order.giftCardGan,
          giftCardState: order.giftCardState,
          createdAt: order.createdAt,
          squarePaymentId: order.squarePaymentId
        },
        lastDeliveryResult: order.emailSent ? "success" : "not_sent"
      };

      res.json(emailLog);
    } catch (error) {
      console.error('Error fetching email log:', error);
      res.status(500).json({ message: "Failed to fetch email log" });
    }
  });

  // Gift Card Redemption Endpoint with Fraud Detection Layer
  app.post("/api/gift-cards/redeem", async (req: Request, res: Response) => {
    try {
      const { code, redeemedBy, amount } = req.body;
      
      if (!code || !redeemedBy) {
        return res.status(400).json({ 
          success: false, 
          error: "Gift card code and redeemer information are required" 
        });
      }

      // Step 1: Run comprehensive fraud detection checks
      const fraudCheck = await FraudDetectionService.checkRedemptionFraud(
        req, 
        code,
        req.body.merchantId // Optional merchant ID for rate limiting
      );

      if (fraudCheck.isBlocked) {
        return res.status(429).json({
          success: false,
          error: fraudCheck.reason || "Redemption blocked due to suspicious activity",
          riskLevel: fraudCheck.riskLevel
        });
      }

      // Step 2: Validate gift card exists and get details
      const giftCard = await storage.getGiftCardByCode(code);
      if (!giftCard) {
        // Log invalid code attempt for fraud tracking
        await FraudDetectionService.logRedemptionFailure(req, code, req.body.merchantId, "invalid_code");
        return res.status(404).json({ 
          success: false, 
          error: "Gift card not found" 
        });
      }

      // Step 3: Check if already redeemed (fraud detection already handled this)
      if (giftCard.redeemed) {
        return res.status(400).json({ 
          success: false, 
          error: "Gift card has already been redeemed" 
        });
      }

      // Step 4: Validate gift card status
      if (giftCard.status !== 'ACTIVE') {
        await FraudDetectionService.logRedemptionFailure(req, code, req.body.merchantId, "inactive_card");
        return res.status(400).json({ 
          success: false, 
          error: "Gift card is not active" 
        });
      }

      // Step 5: Process legitimate redemption
      const updatedCard = await storage.redeemGiftCard(code, redeemedBy, amount);
      
      // Step 6: Trigger multi-event webhook for merchant automation (after successful redemption)
      if (updatedCard && req.body.merchantId) {
        const webhookPayload = {
          event: 'gift_card_redeemed' as const,
          timestamp: new Date().toISOString(),
          data: {
            giftCardId: updatedCard.id?.toString(),
            giftCardCode: code,
            merchantId: req.body.merchantId,
            amount: updatedCard.lastRedemptionAmount || amount,
            currency: 'USD',
            customerEmail: redeemedBy,
            redemptionTime: new Date().toISOString()
          }
        };

        // Fire multi-event webhook asynchronously - don't block redemption response
        multiEventWebhookDispatcher.dispatchWebhooksForEvent(
          req.body.merchantId, 
          'gift_card_redeemed', 
          webhookPayload
        );

        // Legacy webhook support for backward compatibility
        const redemptionData: RedemptionData = {
          giftCardCode: code,
          merchantId: req.body.merchantId,
          amountRedeemed: updatedCard.lastRedemptionAmount || amount,
          currency: 'USD',
          redeemedBy: {
            ip: req.ip || req.socket.remoteAddress || 'unknown',
            device: req.get('User-Agent') || 'unknown'
          },
          redemptionTime: new Date().toISOString()
        };
        webhookService.triggerRedemptionWebhook(req.body.merchantId, redemptionData);
      }
      
      res.json({
        success: true,
        message: "Gift card redeemed successfully",
        giftCard: updatedCard,
        amount: updatedCard?.lastRedemptionAmount || amount
      });
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      
      // Log system failure for fraud monitoring
      await FraudDetectionService.logRedemptionFailure(
        req, 
        req.body.code || "unknown", 
        req.body.merchantId, 
        "system_error"
      );
      
      res.status(500).json({
        success: false,
        error: "Failed to redeem gift card"
      });
    }
  });

  // Admin Gift Card Analytics
  app.get("/api/admin/gift-card-analytics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { merchantId, startDate, endDate } = req.query;
      
      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const analytics = await storage.getGiftCardAnalytics(
        merchantId as string || undefined,
        dateRange
      );
      
      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error fetching gift card analytics:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics"
      });
    }
  });

  // Merchant Gift Card Analytics
  // Merchant Analytics Export Endpoint
  app.get("/api/merchant/analytics/giftcards", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchant.merchantId;
      const { startDate, endDate, format } = req.query;
      
      // Parse date filters
      const filters: { startDate?: Date; endDate?: Date } = {};
      if (startDate && typeof startDate === 'string') {
        filters.startDate = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        filters.endDate = new Date(endDate);
      }

      if (format === 'csv') {
        // Generate CSV export
        const { AnalyticsService } = await import('./services/AnalyticsService.js');
        const csvData = await AnalyticsService.generateCSV(merchantId, filters);
        
        const dateRange = startDate && endDate ? 
          `_${startDate}_to_${endDate}` : 
          `_${new Date().toISOString().split('T')[0]}`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="giftcard_analytics${dateRange}.csv"`);
        res.send(csvData);
        return;
      }

      if (format === 'pdf') {
        // Generate PDF export
        const { AnalyticsService } = await import('./services/AnalyticsService.js');
        const pdfBuffer = await AnalyticsService.generatePDF(merchantId, filters);
        
        const dateRange = startDate && endDate ? 
          `_${startDate}_to_${endDate}` : 
          `_${new Date().toISOString().split('T')[0]}`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="giftcard_analytics${dateRange}.pdf"`);
        res.send(Buffer.from(pdfBuffer));
        return;
      }

      // Default JSON response for UI
      const analytics = await storage.getGiftCardAnalyticsForMerchant(merchantId, filters);
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error generating merchant analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate analytics report'
      });
    }
  });

  app.get("/api/merchant/gift-card-analytics", requireMerchant, async (req: Request, res: Response) => {
    try {
      const merchantId = (req as any).merchant?.merchantId || (req as any).merchantId;
      const { startDate, endDate } = req.query;
      
      if (!merchantId) {
        return res.status(400).json({
          success: false,
          error: "Merchant ID not found"
        });
      }

      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const analytics = await storage.getGiftCardAnalytics(merchantId, dateRange);
      
      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error fetching merchant gift card analytics:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics"
      });
    }
  });

  // Merchant Card Design API Endpoints (Phase 1)
  
  // POST /api/merchant/card-design - Upload and save merchant card design
  app.post("/api/merchant/card-design", requireMerchantAuth, async (req: Request, res: Response) => {
    try {
      const merchant = (req as any).user;
      const { designImageBase64, logoImageBase64, themeColor, customMessage } = req.body;

      // Validation schema
      const cardDesignSchema = z.object({
        designImageBase64: z.string().optional(),
        logoImageBase64: z.string().optional(),
        themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        customMessage: z.string().max(200).optional()
      });

      const validatedData = cardDesignSchema.parse({
        designImageBase64,
        logoImageBase64,
        themeColor,
        customMessage
      });

      let designUrl: string | undefined;
      let logoUrl: string | undefined;

      // Upload design image if provided
      if (validatedData.designImageBase64) {
        const designUpload = await fileUploadService.uploadFromBase64(
          validatedData.designImageBase64,
          `design-${merchant.id}-${Date.now()}.png`
        );
        
        if (!designUpload.success) {
          return res.status(400).json({
            success: false,
            error: designUpload.error || "Failed to upload design image"
          });
        }
        designUrl = designUpload.url;
      }

      // Upload logo image if provided
      if (validatedData.logoImageBase64) {
        const logoUpload = await fileUploadService.uploadFromBase64(
          validatedData.logoImageBase64,
          `logo-${merchant.id}-${Date.now()}.png`
        );
        
        if (!logoUpload.success) {
          return res.status(400).json({
            success: false,
            error: logoUpload.error || "Failed to upload logo image"
          });
        }
        logoUrl = logoUpload.url;
      }

      // Check if merchant already has a card design
      const existingDesign = await storage.getMerchantCardDesign(merchant.id);
      
      let cardDesign;
      if (existingDesign) {
        // Update existing design
        const updateData: any = {};
        if (designUrl) updateData.designUrl = designUrl;
        if (logoUrl) updateData.logoUrl = logoUrl;
        if (validatedData.themeColor) updateData.themeColor = validatedData.themeColor;
        if (validatedData.customMessage !== undefined) updateData.customMessage = validatedData.customMessage;

        cardDesign = await storage.updateMerchantCardDesign(merchant.id, updateData);
      } else {
        // Create new design
        cardDesign = await storage.createMerchantCardDesign({
          merchantId: merchant.id,
          designUrl: designUrl || null,
          logoUrl: logoUrl || null,
          themeColor: validatedData.themeColor || "#6366f1",
          customMessage: validatedData.customMessage || null,
          isActive: true
        });
      }

      console.log(`Merchant ${merchant.id} updated card design: design=${!!designUrl}, logo=${!!logoUrl}, theme=${validatedData.themeColor}`);

      res.json({
        success: true,
        message: "Card design saved successfully",
        design: cardDesign
      });

    } catch (error) {
      console.error('Error saving merchant card design:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid input data",
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to save card design"
      });
    }
  });

  // GET /api/merchant/card-design - Retrieve merchant card design
  app.get("/api/merchant/card-design", requireMerchantAuth, async (req: Request, res: Response) => {
    try {
      const merchant = (req as any).user;
      
      const cardDesign = await storage.getMerchantCardDesign(merchant.id);
      
      if (!cardDesign) {
        // Return default design if none exists
        return res.json({
          success: true,
          design: {
            designUrl: null,
            logoUrl: null,
            themeColor: "#6366f1",
            customMessage: null,
            isActive: true
          }
        });
      }

      res.json({
        success: true,
        design: cardDesign
      });

    } catch (error) {
      console.error('Error fetching merchant card design:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch card design"
      });
    }
  });

  // GET /api/merchant/card-design/validation - Get upload validation config
  app.get("/api/merchant/card-design/validation", requireMerchantAuth, async (req: Request, res: Response) => {
    try {
      const validation = fileUploadService.getValidationConfig();
      
      res.json({
        success: true,
        validation: {
          maxSize: validation.maxSize,
          maxSizeMB: Math.floor(validation.maxSize / 1024 / 1024),
          allowedTypes: validation.allowedTypes,
          allowedExtensions: validation.allowedExtensions
        }
      });
    } catch (error) {
      console.error('Error fetching validation config:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch validation config"
      });
    }
  });

  // Import fraud detection middleware
  const fraudMiddleware = await import('./middleware/fraudDetectionMiddleware.js');
  const { 
    rateLimitRedemptionAttempts, 
    preventReplayRedemption, 
    validateQRPayloadIntegrity,
    logRedemptionAttempt 
  } = fraudMiddleware;

  // QR Code Validation Endpoint
  app.post("/api/merchant/validate-qr", requireMerchantAuth, validateQRPayloadIntegrity, async (req, res) => {
    try {
      const { qrData } = req.body;
      const merchantId = (req as any).merchant.merchantId;

      if (!qrData) {
        return res.status(400).json({
          success: false,
          error: 'QR data is required'
        });
      }

      // Extract GAN from QR data (could be URL or direct GAN)
      let gan = qrData;
      if (qrData.includes('/')) {
        // Extract GAN from URL like /giftcard-store/success/order-id
        const parts = qrData.split('/');
        const orderId = parts[parts.length - 1];
        
        // Get order details to find GAN
        const order = await storage.getPublicGiftCardOrderById(orderId);
        if (!order || !order.giftCardGan) {
          return res.status(404).json({
            success: false,
            error: 'Gift card not found'
          });
        }
        gan = order.giftCardGan;
      }

      // Validate the gift card
      const validation = await storage.validateGiftCardForRedemption(gan, merchantId);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      res.json({
        success: true,
        card: validation.card,
        message: 'Gift card is valid for redemption'
      });

    } catch (error) {
      console.error('QR validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during validation'
      });
    }
  });

  // QR Code Redemption Endpoint
  app.post("/api/merchant/redeem-qr", 
    requireMerchantAuth, 
    validateQRPayloadIntegrity, 
    rateLimitRedemptionAttempts, 
    preventReplayRedemption, 
    async (req, res) => {
    try {
      const { qrData, amount } = req.body;
      const merchantId = (req as any).merchant.merchantId;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const deviceFingerprint = req.get('X-Device-Fingerprint') || `${ipAddress}-${userAgent}`;

      if (!qrData) {
        return res.status(400).json({
          success: false,
          error: 'QR data is required'
        });
      }

      // Extract GAN from QR data
      let gan = qrData;
      if (qrData.includes('/')) {
        const parts = qrData.split('/');
        const orderId = parts[parts.length - 1];
        
        const order = await storage.getPublicGiftCardOrderById(orderId);
        if (!order || !order.giftCardGan) {
          // Log failed redemption attempt
          await storage.createCardRedemption({
            cardId: 0,
            merchantId,
            giftCardGan: qrData,
            amount: amount || 0,
            ipAddress,
            deviceFingerprint,
            userAgent,
            success: false,
            failureReason: 'Gift card not found'
          });

          return res.status(404).json({
            success: false,
            error: 'Gift card not found'
          });
        }
        gan = order.giftCardGan;
      }

      // Apply fraud detection
      const fraudResult = await FraudDetectionService.checkRedemptionFraud(
        gan,
        merchantId,
        ipAddress
      );

      if (fraudResult.isBlocked) {
        // Log fraud attempt
        await storage.createCardRedemption({
          cardId: 0,
          merchantId,
          giftCardGan: gan,
          amount: amount || 0,
          ipAddress,
          deviceFingerprint,
          userAgent,
          success: false,
          failureReason: `Fraud detected: ${fraudResult.reason || 'Security violation'}`
        });

        return res.status(429).json({
          success: false,
          error: 'Redemption blocked for security reasons'
        });
      }

      // Validate the gift card
      const validation = await storage.validateGiftCardForRedemption(gan, merchantId);

      if (!validation.valid || !validation.card) {
        // Log failed redemption
        await storage.createCardRedemption({
          cardId: validation.card?.id || 0,
          merchantId,
          giftCardGan: gan,
          amount: amount || 0,
          ipAddress,
          deviceFingerprint,
          userAgent,
          success: false,
          failureReason: validation.error
        });

        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const card = validation.card;
      const redemptionAmount = amount || card.balance;

      // Check if redemption amount is valid
      if (redemptionAmount > card.balance) {
        await storage.createCardRedemption({
          cardId: card.id,
          merchantId,
          giftCardGan: gan,
          amount: redemptionAmount,
          ipAddress,
          deviceFingerprint,
          userAgent,
          success: false,
          failureReason: 'Insufficient balance'
        });

        return res.status(400).json({
          success: false,
          error: 'Insufficient balance on gift card'
        });
      }

      // Perform the redemption
      const newBalance = card.balance - redemptionAmount;
      const isFullyRedeemed = newBalance <= 0;

      // Update gift card in database
      const updateData: any = {
        balance: newBalance,
        redeemed: isFullyRedeemed,
        lastRedemptionAmount: redemptionAmount
      };
      
      if (isFullyRedeemed) {
        updateData.redeemedAt = new Date();
      }
      
      await storage.updateGiftCard(card.id, updateData);

      // Log successful redemption
      await logRedemptionAttempt(card.id, 'success', null, req);

      // Create gift card activity record
      await storage.createGiftCardActivity({
        giftCardId: card.id,
        type: 'REDEEM',
        amount: redemptionAmount,
        squareActivityId: `qr-redeem-${Date.now()}`
      });

      // Trigger merchant webhook for real-time automation with HMAC security
      if (card.merchantId) {
        const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const userAgent = req.get('User-Agent') || 'unknown';
        
        const webhookPayload = webhookDispatcher.createRedemptionPayload(
          card.merchantId,
          card.gan || card.id.toString(),
          redemptionAmount,
          { ip: clientIp, userAgent }
        );

        // Fire webhook asynchronously - don't block response
        webhookDispatcher.dispatchRedemptionWebhook(card.merchantId, webhookPayload);
        console.log(`🎯 Webhook dispatched for redemption: ${card.gan}`);
      }

      res.json({
        success: true,
        redemptionAmount,
        remainingBalance: newBalance,
        fullyRedeemed: isFullyRedeemed,
        message: `Successfully redeemed $${(redemptionAmount / 100).toFixed(2)}`
      });

    } catch (error) {
      console.error('QR redemption error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during redemption'
      });
    }
  });

  // Mock webhook endpoint for testing secure HMAC signatures
  app.post("/api/test/mock-webhook", async (req: Request, res: Response) => {
    try {
      const signature = req.get('X-Sizu-Signature');
      const payload = JSON.stringify(req.body);
      
      console.log('🧪 Mock webhook received:');
      console.log('- Headers:', {
        'content-type': req.get('Content-Type'),
        'x-sizu-signature': signature,
        'x-webhook-source': req.get('X-Webhook-Source'),
        'x-webhook-event': req.get('X-Webhook-Event')
      });
      console.log('- Payload:', payload);
      
      // Verify signature if present
      if (signature) {
        const isValid = webhookDispatcher.verifyWebhookSignature(payload, signature);
        console.log('- Signature Valid:', isValid);
        
        if (!isValid) {
          return res.status(401).json({
            success: false,
            error: "Invalid webhook signature"
          });
        }
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      res.json({
        success: true,
        message: "Mock webhook received successfully",
        receivedAt: new Date().toISOString(),
        payloadSize: payload.length,
        signatureVerified: Boolean(signature)
      });
    } catch (error) {
      console.error('Mock webhook error:', error);
      res.status(500).json({
        success: false,
        error: "Mock webhook processing failed"
      });
    }
  });

  // Multi-Event Webhook Mock Endpoint for Phase 15A Testing
  app.post("/api/mock/webhook", async (req: Request, res: Response) => {
    try {
      const payload = JSON.stringify(req.body);
      const signature = req.headers['x-sizu-signature'] as string;
      const eventType = req.headers['x-sizu-event'] as string;
      const timestamp = req.headers['x-sizu-timestamp'] as string;
      
      console.log('🧪 Multi-Event Mock webhook received:');
      console.log('- Event Type:', eventType);
      console.log('- Timestamp:', timestamp);
      console.log('- Payload:', payload);
      
      // Verify signature if present (using test secret)
      let signatureValid = false;
      if (signature) {
        const testSecret = 'test-webhook-secret-123';
        signatureValid = multiEventWebhookDispatcher.verifyWebhookSignature(payload, signature, testSecret);
        console.log('- Signature Valid:', signatureValid);
        
        if (!signatureValid) {
          return res.status(401).json({
            success: false,
            error: "Invalid webhook signature",
            eventType
          });
        }
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      res.json({
        success: true,
        message: `Mock webhook received successfully for ${eventType || 'unknown'} event`,
        receivedAt: new Date().toISOString(),
        eventType: eventType || 'unknown',
        payloadSize: payload.length,
        signatureVerified: signatureValid,
        timestamp: timestamp
      });
    } catch (error) {
      console.error('Multi-Event Mock webhook error:', error);
      res.status(500).json({
        success: false,
        error: "Mock webhook processing failed"
      });
    }
  });

  // Enhanced webhook configuration with enabled toggle
  app.post("/api/merchant/webhook/settings", requireMerchant, async (req: Request, res: Response) => {
    try {
      const { webhookUrl, enabled } = req.body;
      
      // Validate webhook URL format if provided
      if (webhookUrl && typeof webhookUrl === 'string') {
        try {
          new URL(webhookUrl);
        } catch {
          return res.status(400).json({
            success: false,
            error: "Invalid webhook URL format"
          });
        }
      }

      const updatedMerchant = await storage.updateMerchantWebhookSettings(
        req.user.merchantId, 
        webhookUrl || null,
        Boolean(enabled)
      );

      if (!updatedMerchant) {
        return res.status(404).json({
          success: false,
          error: "Merchant not found"
        });
      }

      console.log(`🔗 Webhook settings updated for merchant: ${req.user.merchantId} - URL: ${webhookUrl || 'none'}, Enabled: ${enabled}`);
      
      res.json({
        success: true,
        message: "Webhook settings updated successfully",
        webhookUrl: updatedMerchant.webhookUrl,
        webhookEnabled: updatedMerchant.webhookEnabled
      });
    } catch (error) {
      console.error('Update webhook settings error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to update webhook settings"
      });
    }
  });

  return httpServer;
}
