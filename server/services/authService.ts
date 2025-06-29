import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';
const JWT_EXPIRES_IN = '7d';

export interface MerchantTokenPayload {
  merchantId: string;
  role: 'merchant';
  email: string;
  businessName: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  merchant?: {
    id: number;
    merchantId: string;
    businessName: string;
    email: string;
  };
  error?: string;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a merchant
   */
  static generateMerchantToken(merchant: any): string {
    const payload = {
      id: merchant.id,
      merchantId: merchant.merchantId,
      role: 'merchant',
      email: merchant.email,
      businessName: merchant.businessName
    };

    try {
      const token = jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'sizu-giftcard',
        audience: 'merchant'
      });

      // Log token structure for debugging
      const decoded = jwt.decode(token) as any;
      console.log(`🔐 Generated JWT token for merchant ${merchant.email}:`, {
        merchantId: decoded.merchantId,
        role: decoded.role,
        businessName: decoded.businessName,
        exp: new Date(decoded.exp * 1000).toISOString()
      });

      return token;
    } catch (error) {
      console.error('JWT generation error:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): MerchantTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'sizu-giftcard',
        audience: 'merchant'
      }) as MerchantTokenPayload;
      
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Authenticate merchant with email and password
   */
  static async authenticateMerchant(email: string, password: string): Promise<AuthResult> {
    try {
      // Find merchant by email
      const merchant = await storage.getMerchantByEmail(email);
      
      if (!merchant) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if merchant is active
      if (!merchant.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.'
        };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, merchant.passwordHash);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = this.generateMerchantToken(merchant);

      return {
        success: true,
        token,
        merchant: {
          id: merchant.id,
          merchantId: merchant.merchantId,
          businessName: merchant.businessName,
          email: merchant.email
        }
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      };
    }
  }

  /**
   * Create a demo merchant for testing (with default password)
   */
  static async createDemoMerchant(): Promise<AuthResult> {
    try {
      const email = 'demo@merchant.com';
      const password = 'demo123';
      
      // Check if demo merchant already exists
      const existingMerchant = await storage.getMerchantByEmail(email);
      if (existingMerchant) {
        // Return existing demo merchant
        const token = this.generateMerchantToken(existingMerchant);
        return {
          success: true,
          token,
          merchant: {
            id: existingMerchant.id,
            merchantId: existingMerchant.merchantId,
            businessName: existingMerchant.businessName,
            email: existingMerchant.email
          }
        };
      }

      // Create demo merchant
      const passwordHash = await this.hashPassword(password);
      const demoMerchant = await storage.createMerchant({
        squareApplicationId: 'demo-app-id',
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        merchantId: 'demo-merchant',
        businessName: 'Demo Business',
        email,
        passwordHash,
        isActive: true
      });

      const token = this.generateMerchantToken(demoMerchant);

      return {
        success: true,
        token,
        merchant: {
          id: demoMerchant.id,
          merchantId: demoMerchant.merchantId,
          businessName: demoMerchant.businessName,
          email: demoMerchant.email
        }
      };

    } catch (error) {
      console.error('Demo merchant creation error:', error);
      return {
        success: false,
        error: 'Failed to create demo merchant'
      };
    }
  }
}