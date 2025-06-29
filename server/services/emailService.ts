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
        from: 'SiZu Pay Receipt <noreply@receipt.sizupay.com>',
        to: data.to,
        subject: 'Gift Card Receipt - SiZu Pay',
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
   * Create premium designed HTML email receipt for gift card
   */
  private createGiftCardEmailHTML(data: GiftCardEmailData & { qrCodeDataUrl: string }): string {
    const currentDate = new Date();
    const receiptNumber = `RCPT-${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const transactionId = `TXN-${Date.now().toString().slice(-8)}`;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiZu Pay Gift Card Receipt</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f7fa;
            color: #2d3748;
            line-height: 1.6;
        }
        .email-wrapper {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
            z-index: 1;
        }
        .logo-section {
            position: relative;
            z-index: 2;
        }
        .brand-logo {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: -1px;
        }
        .tagline {
            font-size: 1rem;
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-weight: 300;
        }
        .receipt-title {
            font-size: 1.5rem;
            margin: 20px 0 0 0;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .receipt-info {
            text-align: left;
        }
        .receipt-number {
            font-size: 0.9rem;
            color: #718096;
            margin: 0;
        }
        .receipt-date {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 5px 0 0 0;
        }
        .status-badge {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .customer-section {
            background: #f7fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #667eea;
        }
        .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 15px 0;
            color: #2d3748;
        }
        .customer-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .detail-item {
            margin: 0;
        }
        .detail-label {
            font-size: 0.85rem;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
        }
        .detail-value {
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
            color: #2d3748;
        }
        .gift-card-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 35px;
            margin: 30px 0;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .gift-card-section::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            z-index: 1;
        }
        .gift-card-content {
            position: relative;
            z-index: 2;
        }
        .gift-card-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin: 0 0 20px 0;
            opacity: 0.9;
        }
        .gift-card-amount {
            font-size: 3.5rem;
            font-weight: 800;
            margin: 10px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .gift-card-number {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 1.4rem;
            background: rgba(255,255,255,0.2);
            padding: 15px 20px;
            border-radius: 8px;
            margin: 20px 0;
            letter-spacing: 3px;
            font-weight: 600;
            backdrop-filter: blur(10px);
        }
        .transaction-details {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin: 30px 0;
            overflow: hidden;
        }
        .transaction-header {
            background: #f7fafc;
            padding: 20px 25px;
            border-bottom: 1px solid #e2e8f0;
        }
        .transaction-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 25px;
            border-bottom: 1px solid #f1f5f9;
        }
        .transaction-row:last-child {
            border-bottom: none;
            background: #f7fafc;
            font-weight: 600;
        }
        .transaction-label {
            color: #4a5568;
        }
        .transaction-value {
            font-weight: 600;
            color: #2d3748;
        }
        .qr-section {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .qr-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 20px 0;
            color: #2d3748;
        }
        .qr-code img {
            max-width: 220px;
            width: 100%;
            border: 3px solid #667eea;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
        }
        .qr-instructions {
            margin: 20px 0 0 0;
            color: #718096;
            font-size: 0.95rem;
        }
        .personal-message {
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #e17055;
        }
        .message-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: #2d3748;
        }
        .message-content {
            font-style: italic;
            font-size: 1.05rem;
            line-height: 1.6;
            color: #4a5568;
            margin: 0;
        }
        .usage-guide {
            background: #ebf8ff;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #3182ce;
        }
        .guide-steps {
            list-style: none;
            padding: 0;
            margin: 15px 0 0 0;
        }
        .guide-step {
            display: flex;
            align-items: flex-start;
            margin: 12px 0;
        }
        .step-number {
            background: #3182ce;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            margin-right: 12px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .step-text {
            color: #2d3748;
            line-height: 1.5;
        }
        .footer {
            background: #2d3748;
            color: #a0aec0;
            padding: 30px;
            text-align: center;
        }
        .footer-logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
            margin: 0 0 15px 0;
        }
        .footer-links {
            margin: 20px 0;
        }
        .footer-link {
            color: #667eea;
            text-decoration: none;
            margin: 0 15px;
            font-size: 0.9rem;
        }
        .footer-text {
            font-size: 0.85rem;
            margin: 10px 0;
            line-height: 1.5;
        }
        .security-note {
            background: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 0.9rem;
            color: #742a2a;
        }
        @media (max-width: 600px) {
            .email-wrapper { margin: 0; }
            .content { padding: 20px; }
            .receipt-header { flex-direction: column; gap: 15px; text-align: center; }
            .customer-details { grid-template-columns: 1fr; }
            .transaction-row { flex-direction: column; gap: 5px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <div class="logo-section">
                <h1 class="brand-logo">SiZu Pay</h1>
                <p class="tagline">Premium Digital Gift Card Solutions</p>
                <h2 class="receipt-title">Gift Card Purchase Receipt</h2>
            </div>
        </div>

        <div class="content">
            <div class="receipt-header">
                <div class="receipt-info">
                    <p class="receipt-number">Receipt #${receiptNumber}</p>
                    <p class="receipt-date">${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="status-badge">Activated</div>
            </div>

            <div class="customer-section">
                <h3 class="section-title">Customer Information</h3>
                <div class="customer-details">
                    <div class="detail-item">
                        <p class="detail-label">Recipient</p>
                        <p class="detail-value">${data.recipientName || 'Gift Card Holder'}</p>
                    </div>
                    <div class="detail-item">
                        <p class="detail-label">From</p>
                        <p class="detail-value">${data.senderName || 'SiZu Pay'}</p>
                    </div>
                    <div class="detail-item">
                        <p class="detail-label">Email</p>
                        <p class="detail-value">${data.to}</p>
                    </div>
                    <div class="detail-item">
                        <p class="detail-label">Transaction ID</p>
                        <p class="detail-value">${transactionId}</p>
                    </div>
                </div>
            </div>

            <div class="gift-card-section">
                <div class="gift-card-content">
                    <h3 class="gift-card-title">Digital Gift Card</h3>
                    <div class="gift-card-amount">$${data.amount}</div>
                    <div class="gift-card-number">${data.gan}</div>
                    <p style="margin: 15px 0 0 0; opacity: 0.9;">Present this code at any participating merchant</p>
                </div>
            </div>

            <div class="transaction-details">
                <div class="transaction-header">
                    <h3 class="section-title" style="margin: 0;">Transaction Summary</h3>
                </div>
                <div class="transaction-row">
                    <span class="transaction-label">Gift Card Value</span>
                    <span class="transaction-value">$${data.amount}.00</span>
                </div>
                <div class="transaction-row">
                    <span class="transaction-label">Processing Fee</span>
                    <span class="transaction-value">$0.00</span>
                </div>
                <div class="transaction-row">
                    <span class="transaction-label">Tax</span>
                    <span class="transaction-value">$0.00</span>
                </div>
                <div class="transaction-row">
                    <span class="transaction-label">Total Paid</span>
                    <span class="transaction-value">$${data.amount}.00</span>
                </div>
            </div>

            ${data.message ? `
            <div class="personal-message">
                <h4 class="message-title">Personal Message</h4>
                <p class="message-content">"${data.message}"</p>
            </div>` : ''}

            <div class="qr-section">
                <h3 class="qr-title">Scan to Redeem</h3>
                <div class="qr-code">
                    <img src="cid:qrcode" alt="Gift Card QR Code" />
                </div>
                <p class="qr-instructions">Use your smartphone camera to scan this QR code for instant redemption</p>
            </div>

            <div class="usage-guide">
                <h3 class="section-title">How to Use Your Gift Card</h3>
                <ul class="guide-steps">
                    <li class="guide-step">
                        <span class="step-number">1</span>
                        <span class="step-text">Visit any participating SiZu Pay merchant location</span>
                    </li>
                    <li class="guide-step">
                        <span class="step-number">2</span>
                        <span class="step-text">Present this QR code or provide the gift card number at checkout</span>
                    </li>
                    <li class="guide-step">
                        <span class="step-number">3</span>
                        <span class="step-text">Your gift card balance will be applied to your purchase automatically</span>
                    </li>
                    <li class="guide-step">
                        <span class="step-number">4</span>
                        <span class="step-text">Keep this receipt for your records and balance inquiries</span>
                    </li>
                </ul>
            </div>

            <div class="security-note">
                <strong>Security Notice:</strong> Treat this gift card like cash. SiZu Pay is not responsible for lost, stolen, or unauthorized use of gift cards. Report any suspicious activity immediately.
            </div>
        </div>

        <div class="footer">
            <h3 class="footer-logo">SiZu Pay</h3>
            <p class="footer-text">Leading provider of digital payment solutions and gift card services</p>
            <div class="footer-links">
                <a href="#" class="footer-link">Support Center</a>
                <a href="#" class="footer-link">Terms of Service</a>
                <a href="#" class="footer-link">Privacy Policy</a>
                <a href="#" class="footer-link">Merchant Portal</a>
            </div>
            <p class="footer-text">
                For customer support, contact us at support@sizupay.com or call 1-800-SIZU-PAY<br>
                Business hours: Monday - Friday, 9:00 AM - 6:00 PM EST
            </p>
            <p class="footer-text" style="margin-top: 20px; font-size: 0.75rem; opacity: 0.7;">
                © ${currentDate.getFullYear()} SiZu Pay Technologies, Inc. All rights reserved.<br>
                Gift cards do not expire and are non-refundable. Terms and conditions apply.
            </p>
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