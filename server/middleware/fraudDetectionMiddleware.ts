import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// In-memory rate limiting cache
interface RateLimitEntry {
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
}

const rateLimitCache = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// Track suspicious activity for fraud signal emission
interface SuspiciousActivity {
  ip: string;
  failedAttempts: number;
  lastFailure: Date;
}

const suspiciousActivityCache = new Map<string, SuspiciousActivity>();
const SUSPICIOUS_WINDOW = 5 * 60 * 1000; // 5 minutes
const SUSPICIOUS_THRESHOLD = 3;

/**
 * Rate limiter middleware for redemption attempts
 * Tracks attempts per IP/device combo, max 5 per 10 minutes
 */
export const rateLimitRedemptionAttempts = (req: Request, res: Response, next: NextFunction) => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const deviceFingerprint = req.get('X-Device-Fingerprint') || req.get('User-Agent') || 'unknown';
  const key = `${ipAddress}-${deviceFingerprint}`;
  
  const now = new Date();
  const existing = rateLimitCache.get(key);
  
  if (existing) {
    const timeSinceFirst = now.getTime() - existing.firstAttempt.getTime();
    
    // Reset if window has passed
    if (timeSinceFirst > RATE_LIMIT_WINDOW) {
      rateLimitCache.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return next();
    }
    
    // Check if limit exceeded
    if (existing.attempts >= MAX_ATTEMPTS) {
      console.log(`🚫 Rate limit exceeded for ${key} - ${existing.attempts} attempts in ${Math.round(timeSinceFirst / 1000)}s`);
      
      // Log suspicious activity
      trackSuspiciousActivity(ipAddress);
      
      return res.status(429).json({
        success: false,
        error: 'Too many redemption attempts. Please try again later.',
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW - timeSinceFirst) / 1000)
      });
    }
    
    // Increment attempts
    existing.attempts++;
    existing.lastAttempt = now;
    rateLimitCache.set(key, existing);
  } else {
    // First attempt
    rateLimitCache.set(key, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now
    });
  }
  
  next();
};

/**
 * Prevent replay redemption middleware
 * Checks if gift card has already been redeemed
 */
export const preventReplayRedemption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return next(); // Let validation middleware handle this
    }
    
    // Extract GAN from QR data
    let gan = qrData;
    if (qrData.includes('/')) {
      const parts = qrData.split('/');
      const orderId = parts[parts.length - 1];
      
      const order = await storage.getPublicGiftCardOrderById(orderId);
      if (order && order.giftCardGan) {
        gan = order.giftCardGan;
      }
    }
    
    // Check if card is already redeemed using validation
    const merchantId = (req as any).merchant?.merchantId;
    if (merchantId) {
      const validation = await storage.validateGiftCardForRedemption(gan, merchantId);
      
      if (!validation.valid && validation.error?.includes('already been redeemed')) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        const deviceFingerprint = req.get('X-Device-Fingerprint') || `${ipAddress}-${userAgent}`;
        
        // Log replay attempt
        await storage.createCardRedemption({
          cardId: validation.card?.id || 0,
          merchantId,
          giftCardGan: gan,
          amount: req.body.amount || 0,
          ipAddress,
          deviceFingerprint,
          userAgent,
          success: false,
          failureReason: 'Replay attack - card already redeemed'
        });
        
        console.log(`🔄 Replay attack detected for GAN ${gan} from IP ${ipAddress}`);
        
        // Track suspicious activity
        trackSuspiciousActivity(ipAddress);
        
        return res.status(409).json({
          success: false,
          error: 'Gift card has already been redeemed',
          code: 'REPLAY_DETECTED'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Replay prevention error:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};

/**
 * Validate QR payload integrity middleware
 * Basic sanity checks for QR data format and content
 */
export const validateQRPayloadIntegrity = (req: Request, res: Response, next: NextFunction) => {
  const { qrData } = req.body;
  
  if (!qrData || typeof qrData !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid QR data format',
      code: 'INVALID_FORMAT'
    });
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Non-printable characters
    /[<>\"'&]/g, // HTML/script injection attempts
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data URLs
    /vbscript:/i, // VBScript protocol
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(qrData)) {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      console.log(`🚨 Tampered QR payload detected from IP ${ipAddress}: ${qrData.substring(0, 50)}`);
      
      // Track suspicious activity
      trackSuspiciousActivity(ipAddress);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or tampered QR code detected',
        code: 'TAMPERED_PAYLOAD'
      });
    }
  }
  
  // Length validation
  if (qrData.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'QR data too long',
      code: 'INVALID_LENGTH'
    });
  }
  
  if (qrData.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'QR data too short',
      code: 'INVALID_LENGTH'
    });
  }
  
  next();
};

/**
 * Track suspicious activity and emit fraud signals
 */
function trackSuspiciousActivity(ipAddress: string) {
  const now = new Date();
  const existing = suspiciousActivityCache.get(ipAddress);
  
  if (existing) {
    const timeSinceFirst = now.getTime() - existing.lastFailure.getTime();
    
    // Reset if window has passed
    if (timeSinceFirst > SUSPICIOUS_WINDOW) {
      suspiciousActivityCache.set(ipAddress, {
        ip: ipAddress,
        failedAttempts: 1,
        lastFailure: now
      });
      return;
    }
    
    // Increment failed attempts
    existing.failedAttempts++;
    existing.lastFailure = now;
    suspiciousActivityCache.set(ipAddress, existing);
    
    // Emit fraud signal if threshold reached
    if (existing.failedAttempts >= SUSPICIOUS_THRESHOLD) {
      emitFraudSignal(ipAddress, existing.failedAttempts);
    }
  } else {
    // First failure
    suspiciousActivityCache.set(ipAddress, {
      ip: ipAddress,
      failedAttempts: 1,
      lastFailure: now
    });
  }
}

/**
 * Emit fraud signal via WebSocket for suspicious redemption attempts
 */
function emitFraudSignal(ipAddress: string, failedAttempts: number) {
  try {
    // Import WebSocket service dynamically to avoid circular dependencies
    const { FraudSocketService } = require('../services/FraudSocketService');
    
    const fraudAlert = {
      type: 'redemption-suspicious',
      ip: ipAddress,
      failedAttempts,
      timestamp: new Date().toISOString(),
      severity: failedAttempts >= 5 ? 'high' : 'medium',
      message: `Suspicious redemption activity detected from IP ${ipAddress} - ${failedAttempts} failed attempts`
    };
    
    FraudSocketService.emitFraudAlert('fraud/redemption-suspicious', fraudAlert);
    
    console.log(`🚨 Fraud signal emitted for IP ${ipAddress} - ${failedAttempts} failed attempts`);
  } catch (error) {
    console.error('Error emitting fraud signal:', error);
  }
}

/**
 * Helper function to log redemption attempts
 */
export const logRedemptionAttempt = async (
  cardId: number,
  status: 'success' | 'failure',
  reason: string | null,
  req: Request
) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const deviceFingerprint = req.get('X-Device-Fingerprint') || `${ipAddress}-${userAgent}`;
    const merchantId = (req as any).merchant?.merchantId || 'unknown';
    
    await storage.createCardRedemption({
      cardId,
      merchantId,
      giftCardGan: req.body.qrData || 'unknown',
      amount: req.body.amount || 0,
      ipAddress,
      deviceFingerprint,
      userAgent,
      success: status === 'success',
      failureReason: status === 'failure' ? reason : null
    });
    
    console.log(`📝 Logged redemption attempt: ${status} - ${reason || 'N/A'} for card ${cardId}`);
  } catch (error) {
    console.error('Error logging redemption attempt:', error);
  }
};

/**
 * Cleanup expired entries from caches
 */
export const cleanupExpiredEntries = () => {
  const now = new Date();
  
  // Cleanup rate limit cache
  Array.from(rateLimitCache.entries()).forEach(([key, entry]) => {
    if (now.getTime() - entry.firstAttempt.getTime() > RATE_LIMIT_WINDOW) {
      rateLimitCache.delete(key);
    }
  });
  
  // Cleanup suspicious activity cache
  Array.from(suspiciousActivityCache.entries()).forEach(([key, entry]) => {
    if (now.getTime() - entry.lastFailure.getTime() > SUSPICIOUS_WINDOW) {
      suspiciousActivityCache.delete(key);
    }
  });
};

// Schedule cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);