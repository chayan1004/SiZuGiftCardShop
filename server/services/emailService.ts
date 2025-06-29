import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { generateGiftCardQR } from '../../utils/qrGenerator';

/**
 * Email delivery service for gift cards using Mailgun
 * Sends beautifully formatted gift cards with QR codes
 */

interface EmailConfig {
  apiKey: string;
  domain: string;
  from: string;
}

interface GiftCardEmailData {
  to: string;
  gan: string;
  amount: number;
  message?: string;
  senderName?: string;
  recipientName?: string;
}

class EmailService {
  private mg: any = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeMailgun();
  }

  private initializeMailgun() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const from = process.env.MAIL_FROM || 'noreply@giftcardhq.com';

    if (!apiKey || !domain) {
      console.log('Mailgun configuration missing - will attempt to initialize when env vars are available');
      this.config = { apiKey: '', domain: '', from };
      return;
    }

    this.config = { apiKey, domain, from };
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: apiKey
    });
    console.log('Mailgun initialized successfully for domain:', domain);
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    return this.mg !== null && this.config !== null;
  }

  /**
   * Send gift card email with QR code
   */
  async sendGiftCardEmail(data: GiftCardEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Re-initialize if not configured but env vars now available
    if (!this.isConfigured()) {
      this.initializeMailgun();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.'
      };
    }

    try {
      // Generate QR code for the gift card
      const qrCodeDataUrl = await generateGiftCardQR(data.gan, data.amount);
      
      // Create email HTML content
      const htmlContent = this.createGiftCardEmailHTML({
        ...data,
        qrCodeDataUrl
      });

      const emailData = {
        from: this.config!.from,
        to: [data.to],
        subject: `🎁 You've received a gift card worth $${data.amount}!`,
        html: htmlContent,
        text: this.createPlainTextEmail(data)
      };

      const result = await this.mg.messages.create(this.config!.domain, emailData);
      
      return {
        success: true,
        messageId: result.id
      };

    } catch (error) {
      console.error('Failed to send gift card email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Create beautifully formatted HTML email for gift card
   */
  private createGiftCardEmailHTML(data: GiftCardEmailData & { qrCodeDataUrl: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Gift Card</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .amount {
            font-size: 48px;
            font-weight: bold;
            color: #2d3748;
            margin: 20px 0;
        }
        .gan {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #4a5568;
            background: #f7fafc;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            letter-spacing: 2px;
        }
        .qr-code {
            margin: 30px 0;
        }
        .qr-code img {
            max-width: 200px;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        .message {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 10px 10px 0;
            font-style: italic;
            color: #4a5568;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .redeem-info {
            background: #ebf8ff;
            border: 2px solid #bee3f8;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">🎁 Gift Card</div>
            
            <div class="amount">$${data.amount}</div>
            
            ${data.senderName ? `<p>From: <strong>${data.senderName}</strong></p>` : ''}
            ${data.recipientName ? `<p>To: <strong>${data.recipientName}</strong></p>` : ''}
            
            ${data.message ? `
                <div class="message">
                    "${data.message}"
                </div>
            ` : ''}
            
            <div class="gan">
                Gift Card Number: ${data.gan}
            </div>
            
            <div class="qr-code">
                <img src="${data.qrCodeDataUrl}" alt="Gift Card QR Code" />
                <p><strong>Scan this QR code to redeem</strong></p>
            </div>
            
            <div class="redeem-info">
                <h3>How to Redeem:</h3>
                <p>1. Show this QR code at checkout</p>
                <p>2. Or provide the gift card number above</p>
                <p>3. Use online or in-store</p>
            </div>
            
            <div class="footer">
                <p>This gift card never expires and can be used for multiple purchases until the balance is zero.</p>
                <p>Keep this email safe - it contains your gift card information.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Create plain text version of the email
   */
  private createPlainTextEmail(data: GiftCardEmailData): string {
    return `
🎁 You've received a gift card worth $${data.amount}!

${data.senderName ? `From: ${data.senderName}` : ''}
${data.recipientName ? `To: ${data.recipientName}` : ''}

${data.message ? `Message: "${data.message}"` : ''}

Gift Card Number: ${data.gan}

How to Redeem:
1. Show the QR code from the HTML version at checkout
2. Or provide the gift card number above
3. Use online or in-store

This gift card never expires and can be used for multiple purchases until the balance is zero.
Keep this email safe - it contains your gift card information.
`;
  }

  /**
   * Send admin notification email
   */
  async sendAdminNotification(subject: string, content: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return {
        success: false,
        error: 'Admin email not configured'
      };
    }

    try {
      await this.mailgun!.messages().send({
        from: this.config!.from,
        to: adminEmail,
        subject: `[GiftCard Admin] ${subject}`,
        text: content
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailService = new EmailService();