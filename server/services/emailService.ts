import nodemailer from 'nodemailer';
import { generateGiftCardQR } from '../../utils/qrGenerator';

/**
 * Email delivery service for gift cards using Nodemailer SMTP
 * Sends beautifully formatted gift cards with QR codes via Mailgun SMTP
 */

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
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
  private transporter: nodemailer.Transporter | null = null;
  private config: SMTPConfig | null = null;

  constructor() {
    this.initializeSMTP();
  }

  private initializeSMTP() {
    const host = process.env.SMTP_HOST || 'smtp.mailgun.org';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER || 'SiZuGiftCardReceipt@receipt.sizupay.com';
    const pass = process.env.SMTP_PASS || 'Chayan38125114@';
    const from = process.env.MAIL_FROM || 'SiZu GiftCards <SiZuGiftCardReceipt@receipt.sizupay.com>';

    if (!user || !pass) {
      console.log('SMTP configuration missing - will attempt to initialize when env vars are available');
      this.config = { host: '', port: 587, user: '', pass: '', from };
      return;
    }

    this.config = { host, port, user, pass, from };
    
    // Initialize Nodemailer SMTP transporter
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // Use TLS
      auth: {
        user,
        pass
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });
    
    console.log('SMTP initialized successfully for host:', host);
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
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
      this.initializeSMTP();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.'
      };
    }

    try {
      // Generate QR code for the gift card
      const qrCodeDataUrl = await generateGiftCardQR(data.gan, data.amount);
      
      // Convert data URL to buffer for attachment
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      
      // Create email HTML content with inline QR code
      const htmlContent = this.createGiftCardEmailHTML({
        ...data,
        qrCodeDataUrl
      });

      const mailOptions = {
        from: this.config!.from,
        to: data.to,
        subject: '🎁 Your Gift Card from SiZu Pay',
        html: htmlContent,
        text: this.createPlainTextEmail(data),
        attachments: [
          {
            filename: 'gift-card-qr.png',
            content: qrBuffer,
            cid: 'qrcode' // Content ID for inline embedding
          }
        ]
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
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
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px 12px 0 0;
            color: white;
            margin: -20px -20px 30px -20px;
        }
        .gift-card {
            background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 20px 0;
            color: white;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .amount {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
        }
        .gan {
            font-family: 'Courier New', monospace;
            font-size: 1.2rem;
            background: rgba(255,255,255,0.2);
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            letter-spacing: 2px;
        }
        .qr-code {
            text-align: center;
            margin: 30px 0;
        }
        .qr-code img {
            max-width: 200px;
            border: 4px solid #fff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .message {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .brand {
            font-size: 2rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">SiZu Pay</div>
            <h1>🎁 Gift Card Delivery</h1>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            ${data.recipientName ? `<h2>Hi ${data.recipientName}!</h2>` : '<h2>You\'ve received a gift card!</h2>'}
            ${data.senderName ? `<p>This gift card is from <strong>${data.senderName}</strong></p>` : ''}
        </div>

        <div class="gift-card">
            <h3>Your Gift Card</h3>
            <div class="amount">$${data.amount}</div>
            <div class="gan">${data.gan}</div>
            <p>Present this code at checkout or scan the QR code below</p>
        </div>

        ${data.message ? `
        <div class="message">
            <h4>Personal Message:</h4>
            <p style="font-style: italic; font-size: 16px; line-height: 1.5;">"${data.message}"</p>
        </div>` : ''}

        <div class="qr-code">
            <h4>Scan to Redeem</h4>
            <img src="cid:qrcode" alt="Gift Card QR Code" />
            <p style="color: #666; font-size: 14px;">Scan this QR code with your phone to redeem instantly</p>
        </div>

        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">How to Use Your Gift Card:</h4>
            <ol style="color: #333; line-height: 1.6;">
                <li>Visit any participating SiZu Pay merchant</li>
                <li>Show this QR code or provide the gift card number</li>
                <li>Your gift card balance will be applied to your purchase</li>
                <li>Enjoy your shopping!</li>
            </ol>
        </div>

        <div class="footer">
            <p>This gift card was delivered by <strong>SiZu Pay</strong></p>
            <p>For support, please contact us at support@sizupay.com</p>
            <p style="font-size: 12px; color: #999;">Gift card terms and conditions apply. Not redeemable for cash.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Create plain text version of the email
   */
  private createPlainTextEmail(data: GiftCardEmailData): string {
    let text = `
🎁 Gift Card from SiZu Pay

${data.recipientName ? `Hi ${data.recipientName}!` : 'You\'ve received a gift card!'}
${data.senderName ? `This gift card is from ${data.senderName}` : ''}

Your Gift Card Details:
- Amount: $${data.amount}
- Gift Card Number: ${data.gan}

${data.message ? `Personal Message: "${data.message}"` : ''}

To redeem your gift card:
1. Visit any participating SiZu Pay merchant
2. Show the QR code in this email or provide the gift card number
3. Your gift card balance will be applied to your purchase

For support, contact us at support@sizupay.com

Gift card terms and conditions apply. Not redeemable for cash.
`;
    return text.trim();
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
      await this.transporter!.sendMail({
        from: this.config!.from,
        to: adminEmail,
        subject: `[GiftCard Admin] ${subject}`,
        text: content,
        html: `<p>${content.replace(/\n/g, '<br>')}</p>`
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