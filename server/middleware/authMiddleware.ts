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