import crypto from 'crypto';
import { storage } from '../storage';
import { emailService } from './emailService';

export class EmailVerificationService {
  /**
   * Generate a secure verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send verification email to merchant
   */
  static async sendVerificationEmail(merchantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const merchant = await storage.getMerchantBySquareId(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      if (merchant.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      // Generate verification token and expiry (24 hours)
      const verificationToken = this.generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Update merchant with verification token
      await storage.updateMerchantVerificationToken(merchant.id, verificationToken, expiresAt);

      // Create verification URL
      const verificationUrl = `${process.env.REPLIT_DOMAINS || 'https://localhost:5000'}/merchant-verify?token=${verificationToken}`;

      // Send verification email
      const emailResult = await emailService.sendGiftCardReceipt({
        to: merchant.email,
        gan: 'VERIFICATION',
        amount: 0,
        message: `Please verify your email by clicking: ${verificationUrl}`,
        senderName: 'SiZu GiftCard System',
        recipientName: merchant.businessName
      });

      if (!emailResult.success) {
        return { success: false, error: 'Failed to send verification email' };
      }

      console.log(`Verification email sent to merchant ${merchantId}: ${merchant.email}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending verification email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Verify merchant email using token
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; merchant?: any; error?: string }> {
    try {
      if (!token) {
        return { success: false, error: 'Verification token is required' };
      }

      // Find merchant by verification token
      const merchant = await storage.getMerchantByVerificationToken(token);
      if (!merchant) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Check if token has expired
      if (merchant.emailVerificationExpires && new Date() > merchant.emailVerificationExpires) {
        return { success: false, error: 'Verification token has expired' };
      }

      // Mark email as verified and clear verification token
      await storage.markMerchantEmailVerified(merchant.id);

      console.log(`Email verified for merchant: ${merchant.email}`);
      return { 
        success: true, 
        merchant: {
          id: merchant.id,
          merchantId: merchant.merchantId,
          businessName: merchant.businessName,
          email: merchant.email,
          emailVerified: true
        }
      };

    } catch (error) {
      console.error('Error verifying email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if merchant email is verified
   */
  static async isEmailVerified(merchantId: string): Promise<boolean> {
    try {
      const merchant = await storage.getMerchantBySquareId(merchantId);
      return merchant?.emailVerified || false;
    } catch (error) {
      console.error('Error checking email verification status:', error);
      return false;
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(merchantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const merchant = await storage.getMerchantBySquareId(merchantId);
      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      if (merchant.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      // Check rate limiting (prevent sending more than 1 email per 5 minutes)
      if (merchant.emailVerificationExpires) {
        const timeSinceLastEmail = Date.now() - merchant.emailVerificationExpires.getTime() + (24 * 60 * 60 * 1000);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceLastEmail < fiveMinutes) {
          const waitTime = Math.ceil((fiveMinutes - timeSinceLastEmail) / 1000 / 60);
          return { 
            success: false, 
            error: `Please wait ${waitTime} minutes before requesting another verification email` 
          };
        }
      }

      return await this.sendVerificationEmail(merchantId);

    } catch (error) {
      console.error('Error resending verification email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}