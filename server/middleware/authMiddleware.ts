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
    console.log('❌ No merchant token provided for route:', req.path);
    return res.status(401).json({ 
      success: false, 
      error: 'Merchant authentication required. Please log in.',
      redirectTo: '/merchant-login'
    });
  }

  try {
    // Try JWT verification first
    const decoded = AuthService.verifyToken(merchantToken);

    if (decoded && decoded.role === 'merchant') {
      console.log(`✅ Valid JWT token for merchant: ${decoded.email} (${decoded.merchantId})`);
      (req as any).merchant = decoded;
      (req as any).merchantId = decoded.merchantId;
      (req as any).merchantEmail = decoded.email;
      (req as any).isMerchant = true;
      return next();
    }

    // Security: Removed insecure fallback authentication - only verified JWTs allowed

    console.log('❌ Invalid merchant token format for route:', req.path);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid merchant token. Please log in again.',
      redirectTo: '/merchant-login'
    });
    
  } catch (error) {
    console.error('❌ Merchant auth error:', error);
    return res.status(403).json({ 
      success: false, 
      error: 'Authentication failed. Please log in again.',
      redirectTo: '/merchant-login'
    });
  }
};

/**
 * Dedicated middleware for merchant route protection
 * Redirects to login page for web routes, returns 401 for API routes
 */
export const requireMerchantAuth = (req: Request, res: Response, next: NextFunction) => {
  const merchantToken = req.headers['authorization']?.replace('Bearer ', '') || 
                       req.headers['x-merchant-token'] as string ||
                       req.cookies?.merchantToken;
  
  if (!merchantToken) {
    // For web routes, redirect to login
    if (req.path.startsWith('/merchant-') && !req.path.includes('/api/')) {
      return res.redirect('/merchant-login');
    }
    
    // For API routes, return 401
    return res.status(401).json({ 
      success: false, 
      error: 'Merchant authentication required. Please log in.',
      redirectTo: '/merchant-login'
    });
  }

  try {
    const decoded = AuthService.verifyToken(merchantToken);

    if (decoded && decoded.role === 'merchant') {
      (req as any).merchant = decoded;
      (req as any).merchantId = decoded.merchantId;
      (req as any).merchantEmail = decoded.email;
      (req as any).isMerchant = true;
      return next();
    }

    // For web routes, redirect to login
    if (req.path.startsWith('/merchant-') && !req.path.includes('/api/')) {
      return res.redirect('/merchant-login');
    }
    
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token. Please log in again.',
      redirectTo: '/merchant-login'
    });
    
  } catch (error) {
    console.error('Merchant authentication error:', error);
    
    // For web routes, redirect to login
    if (req.path.startsWith('/merchant-') && !req.path.includes('/api/')) {
      return res.redirect('/merchant-login');
    }
    
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed. Please log in again.',
      redirectTo: '/merchant-login'
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