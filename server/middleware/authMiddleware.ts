import { Request, Response, NextFunction } from 'express';

/**
 * Admin authentication middleware
 * Protects admin routes with token-based authentication
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers['x-admin-token'] as string;
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    console.error('ADMIN_TOKEN not configured in environment');
    return res.status(500).json({ 
      success: false, 
      error: 'Admin authentication not configured' 
    });
  }

  if (!adminToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'Admin token required. Provide x-admin-token header.' 
    });
  }

  if (adminToken !== expectedToken) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid admin token' 
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