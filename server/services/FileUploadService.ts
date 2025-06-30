import { Request } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface UploadValidation {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  size?: number;
}

export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads', 'card-designs');
  private readonly baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://sizu-giftcardshop.replit.app' 
    : 'http://localhost:5000';

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  private generateSecureFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `card-design-${timestamp}-${randomBytes}${ext}`;
  }

  private validateFile(buffer: Buffer, originalName: string, validation: UploadValidation): { valid: boolean; error?: string } {
    // Check file size
    if (buffer.length > validation.maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size of ${Math.floor(validation.maxSize / 1024 / 1024)}MB` 
      };
    }

    // Check file extension
    const ext = path.extname(originalName).toLowerCase();
    if (!validation.allowedExtensions.includes(ext)) {
      return { 
        valid: false, 
        error: `File type ${ext} not allowed. Allowed types: ${validation.allowedExtensions.join(', ')}` 
      };
    }

    // Basic magic number validation for images
    const magicNumbers = {
      '.png': [0x89, 0x50, 0x4E, 0x47],
      '.jpg': [0xFF, 0xD8, 0xFF],
      '.jpeg': [0xFF, 0xD8, 0xFF],
      '.webp': [0x52, 0x49, 0x46, 0x46]
    };

    const magic = magicNumbers[ext as keyof typeof magicNumbers];
    if (magic && !this.checkMagicNumber(buffer, magic)) {
      return { 
        valid: false, 
        error: 'Invalid file format. File appears corrupted or not a valid image.' 
      };
    }

    return { valid: true };
  }

  private checkMagicNumber(buffer: Buffer, magic: number[]): boolean {
    if (buffer.length < magic.length) return false;
    
    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) return false;
    }
    return true;
  }

  async uploadFromBase64(
    base64Data: string, 
    originalName: string, 
    validation: UploadValidation = {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
      allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp']
    }
  ): Promise<UploadResult> {
    try {
      // Remove data URL prefix if present
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64String, 'base64');
      
      // Validate file
      const validation_result = this.validateFile(buffer, originalName, validation);
      if (!validation_result.valid) {
        return {
          success: false,
          error: validation_result.error
        };
      }

      // Generate secure filename
      const fileName = this.generateSecureFileName(originalName);
      const filePath = path.join(this.uploadDir, fileName);

      // Save file
      await fs.writeFile(filePath, buffer);
      
      // Generate public URL
      const url = `${this.baseURL}/uploads/card-designs/${fileName}`;

      return {
        success: true,
        url,
        fileName,
        size: buffer.length
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: 'Failed to upload file. Please try again.'
      };
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  extractFileNameFromUrl(url: string): string | null {
    try {
      const urlPath = new URL(url).pathname;
      return path.basename(urlPath);
    } catch {
      return null;
    }
  }

  getValidationConfig() {
    return {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
      allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp']
    };
  }
}

export const fileUploadService = new FileUploadService();