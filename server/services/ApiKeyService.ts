import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class ApiKeyService {
  /**
   * Generate a new API key with secure format: sizu_live_xxxxxxxxxxxxxxxxxxxx
   */
  static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    const keyBody = randomBytes.toString('hex');
    return `sizu_live_${keyBody}`;
  }

  /**
   * Hash an API key for secure storage
   */
  static async hashApiKey(apiKey: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(apiKey, saltRounds);
  }

  /**
   * Verify an API key against a stored hash
   */
  static async verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(apiKey, hash);
  }

  /**
   * Extract the display prefix from an API key (first 8 chars after prefix)
   */
  static getKeyPrefix(apiKey: string): string {
    if (apiKey.startsWith('sizu_live_')) {
      return apiKey.substring(0, 18); // "sizu_live_" + first 8 chars
    }
    return apiKey.substring(0, 8);
  }

  /**
   * Validate API key format
   */
  static isValidFormat(apiKey: string): boolean {
    return /^sizu_live_[a-f0-9]{64}$/.test(apiKey);
  }

  /**
   * Generate a secure random name for unnamed keys
   */
  static generateKeyName(): string {
    const adjectives = ['swift', 'secure', 'reliable', 'efficient', 'robust'];
    const nouns = ['key', 'access', 'token', 'credential', 'auth'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${randomAdjective}-${randomNoun}-${randomNum}`;
  }
}