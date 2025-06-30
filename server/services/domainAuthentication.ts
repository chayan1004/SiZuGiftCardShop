/**
 * Production Domain Authentication System
 * Handles SPF, DKIM, and DMARC record validation and configuration
 */

import * as dns from 'dns';
import { promisify } from 'util';
import crypto from 'crypto';

const resolveTxt = promisify(dns.resolveTxt);

interface DomainAuthConfig {
  domain: string;
  spfRecord: string;
  dkimSelector: string;
  dkimPrivateKey: string;
  dkimPublicKey: string;
  dmarcPolicy: string;
  dmarcReportEmail: string;
}

interface AuthenticationStatus {
  spf: {
    configured: boolean;
    record?: string;
    status: 'pass' | 'fail' | 'none';
    details: string;
  };
  dkim: {
    configured: boolean;
    selector: string;
    publicKey?: string;
    status: 'pass' | 'fail' | 'none';
    details: string;
  };
  dmarc: {
    configured: boolean;
    policy?: string;
    status: 'pass' | 'fail' | 'none';
    details: string;
  };
  overall: 'authenticated' | 'partial' | 'none';
}

class DomainAuthentication {
  private config: DomainAuthConfig;
  private dkimKeys: { private: string; public: string } | null = null;

  constructor() {
    this.config = {
      domain: 'sizupay.com',
      spfRecord: 'v=spf1 include:mailgun.org include:_spf.google.com ~all',
      dkimSelector: 'sizugift',
      dkimPrivateKey: '',
      dkimPublicKey: '',
      dmarcPolicy: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@sizupay.com; ruf=mailto:dmarc@sizupay.com; fo=1',
      dmarcReportEmail: 'dmarc@sizupay.com'
    };

    this.generateDKIMKeys();
  }

  /**
   * Generate DKIM key pair for email signing
   */
  private generateDKIMKeys(): void {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Extract public key for DNS record
      const publicKeyBase64 = publicKey
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\n/g, '');

      this.dkimKeys = { private: privateKey, public: publicKeyBase64 };
      this.config.dkimPrivateKey = privateKey;
      this.config.dkimPublicKey = publicKeyBase64;

      console.log('DKIM keys generated successfully');
    } catch (error) {
      console.error('Failed to generate DKIM keys:', error);
    }
  }

  /**
   * Validate current domain authentication status
   */
  async validateDomainAuth(): Promise<AuthenticationStatus> {
    const status: AuthenticationStatus = {
      spf: { configured: false, status: 'none', details: '' },
      dkim: { configured: false, selector: this.config.dkimSelector, status: 'none', details: '' },
      dmarc: { configured: false, status: 'none', details: '' },
      overall: 'none'
    };

    try {
      // Check SPF record
      status.spf = await this.checkSPF();
      
      // Check DKIM record
      status.dkim = await this.checkDKIM();
      
      // Check DMARC record
      status.dmarc = await this.checkDMARC();

      // Determine overall status
      if (status.spf.status === 'pass' && status.dkim.status === 'pass' && status.dmarc.status === 'pass') {
        status.overall = 'authenticated';
      } else if (status.spf.configured || status.dkim.configured || status.dmarc.configured) {
        status.overall = 'partial';
      }

    } catch (error) {
      console.error('Domain authentication validation failed:', error);
    }

    return status;
  }

  /**
   * Check SPF record
   */
  private async checkSPF(): Promise<AuthenticationStatus['spf']> {
    try {
      const records = await resolveTxt(this.config.domain);
      const spfRecord = records.find(record => 
        record.join('').toLowerCase().startsWith('v=spf1')
      );

      if (spfRecord) {
        const recordText = spfRecord.join('');
        return {
          configured: true,
          record: recordText,
          status: recordText.includes('include:mailgun.org') ? 'pass' : 'none',
          details: `SPF record found: ${recordText}`
        };
      }

      return {
        configured: false,
        status: 'none',
        details: 'No SPF record found'
      };
    } catch (error) {
      return {
        configured: false,
        status: 'fail',
        details: `SPF check failed: ${error}`
      };
    }
  }

  /**
   * Check DKIM record
   */
  private async checkDKIM(): Promise<AuthenticationStatus['dkim']> {
    try {
      const dkimDomain = `${this.config.dkimSelector}._domainkey.${this.config.domain}`;
      const records = await resolveTxt(dkimDomain);
      
      if (records && records.length > 0) {
        const dkimRecord = records[0].join('');
        return {
          configured: true,
          selector: this.config.dkimSelector,
          publicKey: dkimRecord,
          status: dkimRecord.includes('v=DKIM1') ? 'pass' : 'none',
          details: `DKIM record found for selector ${this.config.dkimSelector}`
        };
      }

      return {
        configured: false,
        selector: this.config.dkimSelector,
        status: 'none',
        details: `No DKIM record found for selector ${this.config.dkimSelector}`
      };
    } catch (error) {
      return {
        configured: false,
        selector: this.config.dkimSelector,
        status: 'fail',
        details: `DKIM check failed: ${error}`
      };
    }
  }

  /**
   * Check DMARC record
   */
  private async checkDMARC(): Promise<AuthenticationStatus['dmarc']> {
    try {
      const dmarcDomain = `_dmarc.${this.config.domain}`;
      const records = await resolveTxt(dmarcDomain);
      
      if (records && records.length > 0) {
        const dmarcRecord = records[0].join('');
        return {
          configured: true,
          policy: dmarcRecord,
          status: dmarcRecord.includes('v=DMARC1') ? 'pass' : 'none',
          details: `DMARC record found: ${dmarcRecord}`
        };
      }

      return {
        configured: false,
        status: 'none',
        details: 'No DMARC record found'
      };
    } catch (error) {
      return {
        configured: false,
        status: 'fail',
        details: `DMARC check failed: ${error}`
      };
    }
  }

  /**
   * Generate DNS records for domain setup
   */
  getDNSRecords(): {
    spf: { type: 'TXT'; name: string; value: string };
    dkim: { type: 'TXT'; name: string; value: string };
    dmarc: { type: 'TXT'; name: string; value: string };
  } {
    return {
      spf: {
        type: 'TXT',
        name: this.config.domain,
        value: this.config.spfRecord
      },
      dkim: {
        type: 'TXT',
        name: `${this.config.dkimSelector}._domainkey.${this.config.domain}`,
        value: `v=DKIM1; k=rsa; p=${this.config.dkimPublicKey}`
      },
      dmarc: {
        type: 'TXT',
        name: `_dmarc.${this.config.domain}`,
        value: this.config.dmarcPolicy
      }
    };
  }

  /**
   * Sign email with DKIM
   */
  signEmailDKIM(emailHeaders: Record<string, string>, emailBody: string): string {
    if (!this.dkimKeys) {
      return '';
    }

    try {
      // Create DKIM signature
      const headerNames = ['from', 'to', 'subject', 'date'];
      const canonicalizedHeaders = headerNames
        .map((name: string) => `${name}:${emailHeaders[name.toLowerCase()] || ''}`)
        .join('\r\n');

      const signatureData = `${canonicalizedHeaders}\r\n${emailBody}`;
      const signature = crypto
        .createSign('RSA-SHA256')
        .update(signatureData)
        .sign(this.dkimKeys.private, 'base64');

      return `v=1; a=rsa-sha256; c=relaxed/simple; d=${this.config.domain}; s=${this.config.dkimSelector}; t=${Math.floor(Date.now() / 1000)}; h=${headerNames.join(':')}; b=${signature}`;
    } catch (error) {
      console.error('DKIM signing failed:', error);
      return '';
    }
  }

  /**
   * Get current authentication configuration
   */
  getConfig(): DomainAuthConfig {
    return { ...this.config };
  }

  /**
   * Update domain configuration
   */
  updateConfig(updates: Partial<DomainAuthConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.dkimPrivateKey || updates.dkimPublicKey) {
      this.dkimKeys = {
        private: this.config.dkimPrivateKey,
        public: this.config.dkimPublicKey
      };
    }
  }

  /**
   * Get setup instructions for domain authentication
   */
  getSetupInstructions(): {
    steps: string[];
    dnsRecords: ReturnType<DomainAuthentication['getDNSRecords']>;
    verificationUrl: string;
  } {
    return {
      steps: [
        '1. Add the SPF record to your domain DNS settings',
        '2. Add the DKIM record to your domain DNS settings',
        '3. Add the DMARC record to your domain DNS settings',
        '4. Wait 24-48 hours for DNS propagation',
        '5. Test email authentication using the verification endpoint',
        '6. Monitor delivery rates and adjust policies as needed'
      ],
      dnsRecords: this.getDNSRecords(),
      verificationUrl: '/api/admin/email/verify-domain-auth'
    };
  }

  /**
   * Check if domain is ready for production email sending
   */
  async isProductionReady(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const authStatus = await this.validateDomainAuth();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (authStatus.spf.status !== 'pass') {
      issues.push('SPF record not properly configured');
      recommendations.push('Add SPF record to authorize Mailgun servers');
    }

    if (authStatus.dkim.status !== 'pass') {
      issues.push('DKIM signing not configured');
      recommendations.push('Add DKIM public key to DNS records');
    }

    if (authStatus.dmarc.status !== 'pass') {
      issues.push('DMARC policy not configured');
      recommendations.push('Add DMARC record to prevent email spoofing');
    }

    if (issues.length === 0) {
      recommendations.push('Domain authentication is properly configured');
      recommendations.push('Monitor delivery rates and sender reputation');
    }

    return {
      ready: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export const domainAuthentication = new DomainAuthentication();