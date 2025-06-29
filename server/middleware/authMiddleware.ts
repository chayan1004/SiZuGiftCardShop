import { Request, Response, NextFunction } from 'express';

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
 * Protects merchant routes with session-based authentication
 */
export const requireMerchant = (req: Request, res: Response, next: NextFunction) => {
  const merchantToken = req.headers['authorization']?.replace('Bearer ', '') || 
                       req.headers['x-merchant-token'] as string ||
                       req.cookies?.merchantToken;
  
  if (!merchantToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'Merchant authentication required. Provide authorization header or x-merchant-token.' 
    });
  }

  try {
    // For demo purposes, validate simple token format: merchant-{merchantId}
    if (!merchantToken.startsWith('merchant-')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid merchant token format' 
      });
    }

    const merchantId = merchantToken.replace('merchant-', '');
    
    // Validate merchant ID from token matches route parameter (if exists)
    const routeMerchantId = req.params.merchantId;
    if (routeMerchantId && routeMerchantId !== merchantId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Merchant ID mismatch. Cannot access another merchant\'s data.' 
      });
    }

    // Store merchant ID in request for use in route handlers
    (req as any).merchantId = merchantId;
    (req as any).isMerchant = true;
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid merchant token' 
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