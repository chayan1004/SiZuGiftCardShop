import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

/**
 * Admin authentication middleware
 * Protects admin routes with token-based authentication
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers['x-admin-token'] as string;
  const expectedToken = process.env.ADMIN_TOKEN || 'sizu-admin-2025'; // Default admin token

  if (!adminToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'Admin token required. Provide x-admin-token header with value: sizu-admin-2025' 
    });
  }

  if (adminToken !== expectedToken) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid admin token. Use: sizu-admin-2025' 
    });
  }

  next();
};

/**
 * Optional admin check for read-only operations
 * Returns admin status without blocking request
 */
export const checkAdminStatus = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers['x-admin-token'] as string;
  const expectedToken = process.env.ADMIN_TOKEN;
  
  (req as any).isAdmin = adminToken && expectedToken && adminToken === expectedToken;
  next();
};

/**
 * Merchant authentication middleware
 * Protects merchant routes with JWT-based authentication
 */
export const requireMerchant = (req: Request, res: Response, next: NextFunction) => {
  const merchantToken = req.headers['authorization']?.replace('Bearer ', '') || 
                       req.headers['x-merchant-token'] as string ||
                       req.cookies?.merchantToken;
  

  
  if (!merchantToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'Merchant authentication required. Please log in.' 
    });
  }

  try {
    // Try JWT verification first
    const decoded = AuthService.verifyToken(merchantToken);
    if (decoded && decoded.role === 'merchant') {
      (req as any).merchantId = decoded.merchantId;
      (req as any).merchantEmail = decoded.email;
      (req as any).isMerchant = true;
      return next();
    }

    // Fallback to legacy token format for compatibility
    if (merchantToken.startsWith('merchant-')) {
      const merchantId = merchantToken.replace('merchant-', '');
      
      // Validate merchant ID from token matches route parameter (if exists)
      const routeMerchantId = req.params.merchantId;
      if (routeMerchantId && routeMerchantId !== merchantId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Merchant ID mismatch. Cannot access another merchant\'s data.' 
        });
      }

      (req as any).merchantId = merchantId;
      (req as any).isMerchant = true;
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      error: 'Invalid merchant token. Please log in again.' 
    });
    
  } catch (error) {
    console.error('Merchant auth error:', error);
    return res.status(403).json({ 
      success: false, 
      error: 'Authentication failed. Please log in again.' 
    });
  }
};

/**
 * Optional merchant check for mixed-access operations
 * Returns merchant status without blocking request
 */
export const checkMerchantStatus = (req: Request, res: Response, next: NextFunction) => {
  const merchantToken = req.headers['authorization']?.replace('Bearer ', '') || 
                       req.headers['x-merchant-token'] as string ||
                       req.cookies?.merchantToken;
  
  if (merchantToken && merchantToken.startsWith('merchant-')) {
    const merchantId = merchantToken.replace('merchant-', '');
    (req as any).merchantId = merchantId;
    (req as any).isMerchant = true;
  } else {
    (req as any).isMerchant = false;
  }
  
  next();
};