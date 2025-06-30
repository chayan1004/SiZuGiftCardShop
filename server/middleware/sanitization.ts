import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Escape HTML and remove dangerous patterns
      return validator.escape(obj.trim());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize keys to prevent prototype pollution
        const sanitizedKey = validator.escape(key);
        if (sanitizedKey !== '__proto__' && sanitizedKey !== 'constructor' && sanitizedKey !== 'prototype') {
          sanitized[sanitizedKey] = sanitizeObject(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Email validation middleware
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email) && email.length <= 254;
};

// SQL injection prevention
export const sanitizeForSQL = (input: string): string => {
  return input.replace(/['"\\;]/g, '');
};

// XSS prevention
export const preventXSS = (input: string): string => {
  return validator.escape(input);
};