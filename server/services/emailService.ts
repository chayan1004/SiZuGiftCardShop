import nodemailer from 'nodemailer';
import { generateGiftCardQR } from '../../utils/qrGenerator';
import { emailDeliveryMonitor } from './emailDeliveryMonitor';
import { domainAuthentication } from './domainAuthentication';

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

// Email Data Interfaces for Modular System
interface ReceiptEmailData {
  to: string;
  gan: string;
  amount: number;
  message?: string;
  senderName?: string;
  recipientName?: string;
}

interface OtpEmailData {
  to: string;
  code: string;
  expiresInMinutes?: number;
  recipientName?: string;
  purpose?: 'registration' | 'login' | 'password_reset' | 'verification' | 'admin_access';
}

interface PromoEmailData {
  to: string;
  subject: string;
  promoCode?: string;
  discount?: string;
  expiryDate?: string;
  recipientName?: string;
  promoType?: 'seasonal' | 'welcome' | 'loyalty' | 'referral' | 'flash_sale' | 'birthday';
}

interface ReminderEmailData {
  to: string;
  gan: string;
  amount: number;
  balance: number;
  expiryDate?: string;
  recipientName?: string;
}

interface RefundEmailData {
  to: string;
  refundAmount: number;
  originalAmount: number;
  gan: string;
  refundReason?: string;
  refundId: string;
  recipientName?: string;
}

interface FraudEmailData {
  adminEmail: string;
  alertType: string;
  details: string;
  userEmail?: string;
  gan?: string;
  suspiciousActivity: string;
  timestamp: Date;
}

// Legacy interface for backward compatibility
interface GiftCardEmailData extends ReceiptEmailData {}

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
   * Send gift card receipt email with QR code (Primary Method)
   */
  async sendGiftCardReceipt(data: ReceiptEmailData): Promise<{
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
        from: 'SiZu GiftCard Receipt <noreply@receipt.sizupay.com>',
        to: data.to,
        subject: 'Your SiZu GiftCard Receipt - Purchase Confirmation',
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no, date=no, email=no, address=no">
    <title>SiZu GiftCard Gift Card Receipt</title>
    <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Base Styles */
        * { 
            box-sizing: border-box; 
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            margin: 0 !important;
            padding: 0 !important;
            background: #f5f7fa;
            color: #2d3748;
            line-height: 1.6;
            width: 100% !important;
            min-width: 100% !important;
            height: 100% !important;
        }
        
        /* Prevent email clients from adding space */
        table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
        }
        
        /* Email wrapper with fluid container */
        .email-wrapper {
            width: 100% !important;
            max-width: 650px !important;
            margin: 0 auto !important;
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        /* Responsive container */
        .container {
            width: 100% !important;
            max-width: 650px !important;
            margin: 0 auto !important;
            padding: 0 !important;
        }
        
        /* Header responsive design */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px !important;
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
            font-size: 2rem !important;
            font-weight: 800;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: -1px;
        }
        
        .tagline {
            font-size: 0.9rem !important;
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .receipt-title {
            font-size: 1.2rem !important;
            margin: 15px 0 0 0;
            font-weight: 600;
        }
        
        /* Content area responsive */
        .content {
            padding: 20px !important;
        }
        
        /* Receipt header responsive */
        .receipt-header {
            display: block !important;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
            text-align: center;
        }
        
        .receipt-info {
            margin-bottom: 15px;
        }
        
        .receipt-number {
            font-size: 0.85rem !important;
            color: #718096;
            margin: 0 0 5px 0;
        }
        
        .receipt-date {
            font-size: 1rem !important;
            font-weight: 600;
            margin: 0;
        }
        
        .status-badge {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 6px 12px !important;
            border-radius: 20px;
            font-size: 0.8rem !important;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
        }
        
        /* Customer section responsive */
        .customer-section {
            background: #f7fafc;
            border-radius: 12px;
            padding: 20px !important;
            margin: 20px 0 !important;
            border-left: 4px solid #667eea;
        }
        
        .section-title {
            font-size: 1rem !important;
            font-weight: 600;
            margin: 0 0 15px 0;
            color: #2d3748;
        }
        
        .customer-details {
            display: block !important;
        }
        
        .detail-item {
            margin: 0 0 12px 0;
        }
        
        .detail-label {
            font-size: 0.75rem !important;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
            display: block;
        }
        
        .detail-value {
            font-size: 0.9rem !important;
            font-weight: 600;
            margin: 0;
            color: #2d3748;
            word-break: break-word;
        }
        
        /* Gift card section responsive */
        .gift-card-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 25px 15px !important;
            margin: 20px 0 !important;
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
            font-size: 1.1rem !important;
            font-weight: 600;
            margin: 0 0 15px 0;
            opacity: 0.9;
        }
        
        .gift-card-amount {
            font-size: 2.5rem !important;
            font-weight: 800;
            margin: 10px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            word-break: break-word;
        }
        
        .gift-card-number {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 1rem !important;
            background: rgba(255,255,255,0.2);
            padding: 12px 15px !important;
            border-radius: 8px;
            margin: 15px 0 !important;
            letter-spacing: 2px !important;
            font-weight: 600;
            backdrop-filter: blur(10px);
            word-break: break-all;
        }
        
        /* Transaction details responsive */
        .transaction-details {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin: 20px 0 !important;
            overflow: hidden;
        }
        
        .transaction-header {
            background: #f7fafc;
            padding: 15px 20px !important;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .transaction-row {
            display: block !important;
            padding: 12px 20px !important;
            border-bottom: 1px solid #f1f5f9;
            text-align: center;
        }
        
        .transaction-row:last-child {
            border-bottom: none;
            background: #f7fafc;
            font-weight: 600;
        }
        
        .transaction-label {
            color: #4a5568;
            font-size: 0.9rem !important;
            margin-bottom: 4px;
            display: block;
        }
        
        .transaction-value {
            font-weight: 600;
            color: #2d3748;
            font-size: 1rem !important;
        }
        
        /* QR section responsive */
        .qr-section {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px !important;
            margin: 20px 0 !important;
            text-align: center;
        }
        
        .qr-title {
            font-size: 1.1rem !important;
            font-weight: 600;
            margin: 0 0 15px 0;
            color: #2d3748;
        }
        
        .qr-code img {
            max-width: 180px !important;
            width: 100% !important;
            height: auto !important;
            border: 3px solid #667eea;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
        }
        
        .qr-instructions {
            margin: 15px 0 0 0;
            color: #718096;
            font-size: 0.85rem !important;
            line-height: 1.4;
        }
        
        /* Personal message responsive */
        .personal-message {
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
            border-radius: 12px;
            padding: 20px !important;
            margin: 20px 0 !important;
            border-left: 4px solid #e17055;
        }
        
        .message-title {
            font-size: 1rem !important;
            font-weight: 600;
            margin: 0 0 10px 0;
            color: #1a202c;
        }
        
        .message-content {
            font-style: italic;
            font-size: 0.95rem !important;
            line-height: 1.5;
            color: #2d3748;
            margin: 0;
            word-break: break-word;
        }
        
        /* Usage guide responsive */
        .usage-guide {
            background: #ebf8ff;
            border-radius: 12px;
            padding: 20px !important;
            margin: 20px 0 !important;
            border-left: 4px solid #3182ce;
        }
        
        .guide-steps {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
        }
        
        .guide-step {
            display: flex;
            align-items: flex-start;
            margin: 10px 0;
        }
        
        .step-number {
            background: #3182ce;
            color: white;
            width: 20px !important;
            height: 20px !important;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem !important;
            font-weight: 600;
            margin-right: 10px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .step-text {
            color: #2d3748;
            line-height: 1.4;
            font-size: 0.9rem !important;
        }
        
        /* Footer responsive */
        .footer {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px !important;
            text-align: center;
        }
        
        .footer-logo {
            font-size: 1.3rem !important;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 12px 0;
        }
        
        .footer-links {
            margin: 15px 0;
        }
        
        .footer-link {
            color: #90cdf4;
            text-decoration: none;
            margin: 0 8px;
            font-size: 0.8rem !important;
            display: inline-block;
            margin-bottom: 8px;
        }
        
        .footer-text {
            color: #cbd5e0;
            font-size: 0.75rem !important;
            margin: 8px 0;
            line-height: 1.4;
        }
        
        .security-note {
            background: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 12px !important;
            margin: 15px 0 !important;
            font-size: 0.8rem !important;
            color: #742a2a;
            line-height: 1.4;
        }
        
        /* Desktop styles */
        @media screen and (min-width: 481px) {
            .header {
                padding: 40px 30px !important;
            }
            
            .brand-logo {
                font-size: 2.5rem !important;
            }
            
            .tagline {
                font-size: 1rem !important;
            }
            
            .receipt-title {
                font-size: 1.5rem !important;
            }
            
            .content {
                padding: 40px 30px !important;
            }
            
            .receipt-header {
                display: flex !important;
                justify-content: space-between;
                align-items: center;
                text-align: left;
            }
            
            .receipt-info {
                margin-bottom: 0;
            }
            
            .customer-details {
                display: grid !important;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .transaction-row {
                display: flex !important;
                justify-content: space-between;
                align-items: center;
                text-align: left;
            }
            
            .transaction-label,
            .transaction-value {
                margin: 0;
            }
            
            .gift-card-section {
                padding: 35px !important;
            }
            
            .gift-card-amount {
                font-size: 3.5rem !important;
            }
            
            .gift-card-number {
                font-size: 1.4rem !important;
                letter-spacing: 3px !important;
            }
            
            .qr-code img {
                max-width: 220px !important;
            }
        }
        
        /* Large desktop styles */
        @media screen and (min-width: 769px) {
            .email-wrapper {
                margin: 20px auto !important;
            }
        }
        
        /* High DPI displays */
        @media screen and (-webkit-min-device-pixel-ratio: 2),
               screen and (min-resolution: 192dpi) {
            .qr-code img {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-wrapper {
                background: #1a202c !important;
                color: #e2e8f0 !important;
            }
            
            .customer-section,
            .transaction-details,
            .qr-section {
                background: #2d3748 !important;
                border-color: #4a5568 !important;
            }
            
            .footer {
                background: #171923 !important;
            }
        }
        
        /* Print styles */
        @media print {
            .email-wrapper {
                box-shadow: none !important;
                margin: 0 !important;
            }
            
            .footer-links {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <div class="logo-section">
                <h1 class="brand-logo">SiZu GiftCard</h1>
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
                <strong>Security Notice:</strong> Treat this gift card like cash. SiZu GiftCard is not responsible for lost, stolen, or unauthorized use of gift cards. Report any suspicious activity immediately.
            </div>
        </div>

        <div class="footer">
            <h3 class="footer-logo">SiZu GiftCard</h3>
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
            <p class="footer-text" style="margin-top: 20px; font-size: 0.75rem; color: #a0aec0;">
                © ${currentDate.getFullYear()} SiZu GiftCard Technologies, Inc. All rights reserved.<br>
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
🎁 Gift Card from SiZu GiftCard

${data.recipientName ? `Hi ${data.recipientName}!` : 'You\'ve received a gift card!'}
${data.senderName ? `This gift card is from ${data.senderName}` : ''}

Your Gift Card Details:
- Amount: $${data.amount}
- Gift Card Number: ${data.gan}

${data.message ? `Personal Message: "${data.message}"` : ''}

To redeem your gift card:
1. Visit any participating SiZu GiftCard merchant
2. Show the QR code in this email or provide the gift card number
3. Your gift card balance will be applied to your purchase

For support, contact us at support@sizupay.com

Gift card terms and conditions apply. Not redeemable for cash.
`;
    return text.trim();
  }

  /**
   * Send OTP/Login Code Email
   */
  async sendOtpCode(data: OtpEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      this.initializeSMTP();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const htmlContent = this.createOtpEmailHTML(data);
      
      // Dynamic sender name and subject based on purpose
      const senderConfig = this.getOtpSenderConfig(data.purpose);
      
      // Use authenticated sender address for better deliverability
      const authenticatedFromAddress = process.env.MAIL_FROM || this.config!.from;
      
      const mailOptions = {
        from: `${senderConfig.senderName} <${authenticatedFromAddress}>`,
        to: data.to,
        subject: senderConfig.subject,
        html: htmlContent,
        text: this.createOtpPlainText(data),
        // Optimized headers for inbox delivery
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'SiZu GiftCard Authentication Service',
          'X-Message-Source': 'Transactional Authentication',
          'X-Entity-ID': `SiZu-Auth-${Date.now()}`,
          'X-Email-Type': 'transactional',
          'X-Auto-Response-Suppress': 'All',
          'Precedence': 'list',
          'Authentication-Results': `spf=pass smtp.mailfrom=${authenticatedFromAddress}`,
          'X-Spam-Score': '0.0',
          'X-Spam-Flag': 'NO',
          'X-Spam-Status': 'No',
          'List-Unsubscribe': '<mailto:unsubscribe@sizupay.com>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Send Promotional Email
   */
  async sendPromoEmail(data: PromoEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      this.initializeSMTP();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const htmlContent = this.createPromoEmailHTML(data);
      
      // Dynamic sender name and subject based on promo type
      const promoConfig = this.getPromoSenderConfig(data.promoType);
      
      const mailOptions = {
        from: `${promoConfig.senderName} <${process.env.MAIL_FROM || this.config!.from}>`,
        to: data.to,
        subject: data.subject || promoConfig.defaultSubject,
        html: htmlContent,
        text: this.createPromoPlainText(data)
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Failed to send promo email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Send Gift Card Reminder Email
   */
  async sendGiftCardReminder(data: ReminderEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      this.initializeSMTP();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const htmlContent = this.createReminderEmailHTML(data);
      
      const mailOptions = {
        from: process.env.MAIL_FROM || this.config!.from,
        to: data.to,
        subject: '💳 Don\'t Forget Your SiZu Pay Gift Card',
        html: htmlContent,
        text: this.createReminderPlainText(data)
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Send Refund Notice Email
   */
  async sendRefundNotice(data: RefundEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      this.initializeSMTP();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const htmlContent = this.createRefundEmailHTML(data);
      
      const mailOptions = {
        from: 'SiZu GiftCard Refunds <' + (process.env.MAIL_FROM || this.config!.from) + '>',
        to: data.to,
        subject: '💰 Refund Processed - SiZu GiftCard Transaction',
        html: htmlContent,
        text: this.createRefundPlainText(data)
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Failed to send refund email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Send Admin Fraud Alert Email
   */
  async sendAdminFraudAlert(data: FraudEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      this.initializeSMTP();
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const htmlContent = this.createFraudAlertHTML(data);
      
      const mailOptions = {
        from: process.env.MAIL_FROM || this.config!.from,
        to: data.adminEmail,
        subject: `🚨 FRAUD ALERT: ${data.alertType} - SiZu Pay`,
        html: htmlContent,
        text: this.createFraudAlertPlainText(data)
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Failed to send fraud alert email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Send Gift Card Delivery Email (for gifting to others)
   */
  async sendGiftCardDelivery(data: GiftCardEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      this.initializeSMTP();
      if (!this.isConfigured()) {
        return { success: false, error: 'Email service not configured' };
      }
    }

    try {
      console.log('Creating QR code for gift card delivery:', data.gan);
      const qrCodeDataUrl = await generateGiftCardQR(
        data.gan,
        data.amount,
        { width: 300, margin: 2 }
      );

      const mailOptions = {
        from: 'SiZu GiftCard Delivery <' + (process.env.MAIL_FROM || this.config!.from) + '>',
        to: data.to,
        subject: '🎁 You\'ve Received a SiZu GiftCard - Ready to Use!',
        html: this.createGiftCardEmailHTML({ ...data, qrCodeDataUrl }),
        text: this.createPlainTextEmail(data),
        attachments: [{
          filename: 'gift-card-qr.png',
          content: qrCodeDataUrl.split(',')[1],
          encoding: 'base64',
          cid: 'qrcode'
        }]
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Failed to send gift card delivery email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async sendGiftCardEmail(data: GiftCardEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    return this.sendGiftCardReceipt(data);
  }

  /**
   * Send admin notification email (Legacy)
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

  /**
   * Get dynamic sender configuration based on OTP purpose
   */
  private getOtpSenderConfig(purpose?: string) {
    switch (purpose) {
      case 'registration':
        return {
          senderName: 'SiZu GiftCard Security',
          subject: 'Secure Account Registration - Verification Required'
        };
      case 'login':
        return {
          senderName: 'SiZu GiftCard Security',
          subject: 'Account Access Verification - Security Code Required'
        };
      case 'password_reset':
        return {
          senderName: 'SiZu GiftCard Security',
          subject: 'Password Reset Authorization - Security Verification'
        };
      case 'admin_access':
        return {
          senderName: 'SiZu GiftCard Security',
          subject: 'Administrative Access Verification - Security Code Required'
        };
      case 'verification':
        return {
          senderName: 'SiZu GiftCard Security',
          subject: 'Account Verification Required - Security Authentication'
        };
      default:
        return {
          senderName: 'SiZu GiftCard Security',
          subject: 'Security Verification Required - Authentication Code'
        };
    }
  }

  /**
   * Get dynamic sender configuration based on promotional email type
   */
  private getPromoSenderConfig(promoType?: string) {
    switch (promoType) {
      case 'seasonal':
        return {
          senderName: 'SiZu GiftCard Seasonal Offers',
          defaultSubject: '🎉 Seasonal Gift Card Promotion - Limited Time Offer'
        };
      case 'welcome':
        return {
          senderName: 'SiZu GiftCard Welcome',
          defaultSubject: '🎁 Welcome to SiZu GiftCard - Special Welcome Offer'
        };
      case 'loyalty':
        return {
          senderName: 'SiZu GiftCard Rewards',
          defaultSubject: '⭐ Loyalty Reward - Exclusive Gift Card Offer'
        };
      case 'referral':
        return {
          senderName: 'SiZu GiftCard Referral',
          defaultSubject: '🤝 Referral Bonus - Gift Card Reward Inside'
        };
      case 'flash_sale':
        return {
          senderName: 'SiZu GiftCard Flash Sale',
          defaultSubject: '⚡ Flash Sale Alert - Limited Time Gift Card Deals'
        };
      case 'birthday':
        return {
          senderName: 'SiZu GiftCard Birthday',
          defaultSubject: '🎂 Happy Birthday - Special Gift Card Surprise'
        };
      default:
        return {
          senderName: 'SiZu GiftCard Promotions',
          defaultSubject: '🎁 Special Gift Card Promotion - Don\'t Miss Out'
        };
    }
  }

  // Template Creation Methods
  private createOtpEmailHTML(data: OtpEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no, date=no, email=no, address=no">
    <title>SiZu GiftCard Security Code</title>
    <style>
        * { 
            box-sizing: border-box; 
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            margin: 0 !important;
            padding: 15px !important;
            background: #f5f7fa;
            color: #2d3748;
            line-height: 1.6;
            width: 100% !important;
            min-width: 100% !important;
        }
        
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 25px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .brand-title {
            color: #667eea;
            font-size: 1.8rem !important;
            font-weight: 800;
            margin: 0;
        }
        
        .subtitle {
            color: #718096;
            font-size: 0.9rem !important;
            margin: 8px 0 0 0;
        }
        
        .code-section {
            text-align: center;
            padding: 25px !important;
            background: #f7fafc;
            border-radius: 12px;
            margin: 20px 0;
            border: 2px solid #e2e8f0;
        }
        
        .code-title {
            color: #2d3748;
            font-size: 1.1rem !important;
            font-weight: 600;
            margin: 0 0 15px 0;
        }
        
        .security-code {
            font-size: 2rem !important;
            font-weight: bold;
            color: #667eea;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            letter-spacing: 6px !important;
            margin: 15px 0;
            word-break: break-all;
            line-height: 1.2;
        }
        
        .expiry-text {
            color: #718096;
            font-size: 0.85rem !important;
            margin: 15px 0 0 0;
        }
        
        .instructions {
            color: #4a5568;
            text-align: center;
            margin: 20px 0;
            font-size: 0.95rem !important;
            line-height: 1.5;
        }
        
        .warning {
            background: #fed7d7;
            border: 1px solid #fc8181;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        
        .warning-text {
            color: #742a2a;
            margin: 0;
            font-size: 0.85rem !important;
            line-height: 1.4;
        }
        
        /* Tablet styles */
        @media screen and (min-width: 481px) {
            body {
                padding: 20px !important;
            }
            
            .container {
                padding: 40px !important;
            }
            
            .brand-title {
                font-size: 2rem !important;
            }
            
            .subtitle {
                font-size: 1rem !important;
            }
            
            .code-section {
                padding: 30px !important;
            }
            
            .code-title {
                font-size: 1.2rem !important;
            }
            
            .security-code {
                font-size: 2.5rem !important;
                letter-spacing: 8px !important;
            }
            
            .expiry-text {
                font-size: 0.9rem !important;
            }
            
            .instructions {
                font-size: 1rem !important;
            }
            
            .warning-text {
                font-size: 0.9rem !important;
            }
        }
        
        /* Desktop styles */
        @media screen and (min-width: 769px) {
            .container {
                margin: 40px auto;
            }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
            .code-section {
                border-width: 3px;
            }
            
            .security-code {
                background: #667eea;
                color: white;
                padding: 10px;
                border-radius: 8px;
            }
        }
        
        /* Print styles */
        @media print {
            body {
                background: white !important;
            }
            
            .container {
                box-shadow: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="brand-title">SiZu GiftCard</h1>
            <p class="subtitle">Secure Authentication</p>
        </div>
        
        <div class="code-section">
            <h2 class="code-title">Your Security Code</h2>
            <div class="security-code">${data.code}</div>
            <p class="expiry-text">This code expires in ${data.expiresInMinutes || 10} minutes</p>
        </div>
        
        <p class="instructions">Enter this code to complete your secure authentication with SiZu GiftCard.</p>
        
        <div class="security-info" style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="color: #234e52; margin: 0; font-size: 0.85rem; line-height: 1.4;">
                <strong>Security Notice:</strong> This is an automated security message from SiZu GiftCard. 
                We will never ask you to share this code via phone, email, or any other method.
            </p>
        </div>
        
        <div class="auth-details" style="background: #f7fafc; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="color: #4a5568; margin: 0; font-size: 0.8rem;">
                Request Time: ${new Date().toLocaleString()}<br>
                Security Level: High Priority Authentication<br>
                Service: SiZu GiftCard Account Access
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private createOtpPlainText(data: OtpEmailData): string {
    const currentTime = new Date().toLocaleString();
    return `SiZu GiftCard Security Authentication

SECURITY CODE: ${data.code}

This is an automated security message from SiZu GiftCard.

Code Details:
- Expires in: ${data.expiresInMinutes || 10} minutes
- Request Time: ${currentTime}
- Security Level: High Priority Authentication
- Service: SiZu GiftCard Account Access

Instructions:
Enter this code to complete your secure authentication with SiZu GiftCard.

IMPORTANT SECURITY NOTICE:
This is a legitimate security code from SiZu GiftCard. We will never ask you to share this code via phone, email, or any other method. If you did not request this code, please ignore this message.

---
SiZu GiftCard Security Team
This message was sent to: ${data.to}
If you have concerns about this message, contact: security@sizupay.com`;
  }

  private createPromoEmailHTML(data: PromoEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no, date=no, email=no, address=no">
    <title>${data.subject}</title>
    <style>
        * { 
            box-sizing: border-box; 
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            margin: 0 !important;
            padding: 0 !important;
            background: #f5f7fa;
            color: #2d3748;
            line-height: 1.6;
            width: 100% !important;
            min-width: 100% !important;
        }
        
        .container {
            width: 100% !important;
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px !important;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .brand-title {
            margin: 0;
            font-size: 2rem !important;
            font-weight: 800;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .promo-subtitle {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 0.9rem !important;
            font-weight: 300;
        }
        
        .content {
            padding: 25px 20px !important;
        }
        
        .greeting {
            color: #2d3748;
            margin: 0 0 20px 0;
            font-size: 1.2rem !important;
            font-weight: 600;
            text-align: center;
        }
        
        .promo-section {
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
            padding: 20px !important;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            border: 2px solid #e17055;
        }
        
        .promo-label {
            margin: 0 0 8px 0;
            color: #2d3748;
            font-size: 1rem !important;
            font-weight: 600;
        }
        
        .promo-code {
            font-size: 1.3rem !important;
            font-weight: bold;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            color: #e17055;
            background: rgba(255,255,255,0.7);
            padding: 10px 15px;
            border-radius: 8px;
            letter-spacing: 2px;
            word-break: break-all;
            margin: 10px 0;
        }
        
        .discount-text {
            margin: 8px 0 0 0;
            color: #4a5568;
            font-size: 0.9rem !important;
            font-weight: 600;
        }
        
        .expiry-notice {
            color: #718096;
            text-align: center;
            margin: 20px 0;
            font-size: 0.85rem !important;
            font-style: italic;
        }
        
        .cta-section {
            text-align: center;
            margin: 25px 0;
        }
        
        .cta-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 12px 25px !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem !important;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: transform 0.2s ease;
        }
        
        .footer-note {
            background: #ebf8ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            border-left: 4px solid #3182ce;
        }
        
        .footer-text {
            color: #2d3748;
            font-size: 0.8rem !important;
            margin: 0;
            line-height: 1.4;
        }
        
        /* Tablet styles */
        @media screen and (min-width: 481px) {
            .header {
                padding: 40px 30px !important;
            }
            
            .brand-title {
                font-size: 2.5rem !important;
            }
            
            .promo-subtitle {
                font-size: 1rem !important;
            }
            
            .content {
                padding: 40px 30px !important;
            }
            
            .greeting {
                font-size: 1.4rem !important;
                text-align: left;
            }
            
            .promo-section {
                padding: 25px !important;
            }
            
            .promo-label {
                font-size: 1.1rem !important;
            }
            
            .promo-code {
                font-size: 1.5rem !important;
                padding: 12px 20px;
            }
            
            .discount-text {
                font-size: 1rem !important;
            }
            
            .expiry-notice {
                font-size: 0.9rem !important;
            }
            
            .cta-button {
                font-size: 1rem !important;
                padding: 15px 30px !important;
            }
            
            .footer-text {
                font-size: 0.85rem !important;
                color: #cbd5e0;
            }
        }
        
        /* Desktop styles */
        @media screen and (min-width: 769px) {
            .container {
                margin: 20px auto;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
            .promo-section {
                border-width: 3px;
            }
            
            .promo-code {
                background: white;
                border: 2px solid #e17055;
            }
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            .cta-button {
                transition: none;
            }
        }
        
        /* Print styles */
        @media print {
            body {
                background: white !important;
            }
            
            .container {
                box-shadow: none !important;
            }
            
            .cta-button {
                background: #667eea !important;
                border: 2px solid #667eea;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="brand-title">SiZu GiftCard</h1>
            <p class="promo-subtitle">Special Promotion</p>
        </div>
        
        <div class="content">
            <h2 class="greeting">Hello ${data.recipientName || 'Valued Customer'}!</h2>
            
            ${data.promoCode ? `
            <div class="promo-section">
                <h3 class="promo-label">Promo Code</h3>
                <div class="promo-code">${data.promoCode}</div>
                ${data.discount ? `<p class="discount-text">Save ${data.discount}</p>` : ''}
            </div>` : ''}
            
            ${data.expiryDate ? `<p class="expiry-notice">Offer expires: ${data.expiryDate}</p>` : ''}
            
            <div class="cta-section">
                <a href="#" class="cta-button">Shop Now</a>
            </div>
            
            <div class="footer-note">
                <p class="footer-text">Terms and conditions apply. Cannot be combined with other offers. Valid for new purchases only.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private createPromoPlainText(data: PromoEmailData): string {
    return `SiZu Pay - Special Promotion\n\nHello ${data.recipientName || 'Valued Customer'}!\n\n${data.promoCode ? `Promo Code: ${data.promoCode}\n` : ''}${data.discount ? `Save: ${data.discount}\n` : ''}${data.expiryDate ? `Expires: ${data.expiryDate}\n` : ''}\nVisit SiZu Pay to take advantage of this special offer.`;
  }

  private createReminderEmailHTML(data: ReminderEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Gift Card Reminder</title></head>
<body style="font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #667eea; font-size: 2rem; margin: 0;">SiZu Pay</h1>
      <p style="color: #718096; margin: 10px 0 0 0;">Gift Card Reminder</p>
    </div>
    <h2 style="color: #2d3748; text-align: center;">Don't Forget Your Gift Card!</h2>
    <p style="color: #4a5568; text-align: center;">Hello ${data.recipientName || 'there'}! You have an unused gift card.</p>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; color: white; text-align: center;">
      <h3 style="margin: 0 0 15px 0;">Gift Card Balance</h3>
      <div style="font-size: 2.5rem; font-weight: bold; margin: 15px 0;">$${data.balance}</div>
      <div style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px; margin: 15px 0;">${data.gan}</div>
    </div>
    ${data.expiryDate ? `<p style="color: #e53e3e; text-align: center; font-weight: 600;">Expires: ${data.expiryDate}</p>` : ''}
  </div>
</body>
</html>`;
  }

  private createReminderPlainText(data: ReminderEmailData): string {
    return `SiZu Pay Gift Card Reminder\n\nHello ${data.recipientName || 'there'}!\n\nYou have an unused gift card with a balance of $${data.balance}.\n\nGift Card Number: ${data.gan}\n${data.expiryDate ? `Expires: ${data.expiryDate}\n` : ''}\nDon't let your gift card go to waste! Use it at any participating SiZu Pay merchant.`;
  }

  private createRefundEmailHTML(data: RefundEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Refund Processed</title></head>
<body style="font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #667eea; font-size: 2rem; margin: 0;">SiZu Pay</h1>
      <p style="color: #718096; margin: 10px 0 0 0;">Refund Confirmation</p>
    </div>
    <div style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h2 style="color: #2d3748; margin: 0 0 15px 0;">Refund Processed Successfully</h2>
      <div style="font-size: 2rem; font-weight: bold; color: #38b2ac;">$${data.refundAmount}</div>
    </div>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2d3748; margin: 0 0 15px 0;">Refund Details</h3>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Refund ID:</strong> ${data.refundId}</p>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Original Amount:</strong> $${data.originalAmount}</p>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Gift Card:</strong> ${data.gan}</p>
      ${data.refundReason ? `<p style="margin: 5px 0; color: #4a5568;"><strong>Reason:</strong> ${data.refundReason}</p>` : ''}
    </div>
    <p style="color: #4a5568; text-align: center;">The refund will appear in your original payment method within 3-5 business days.</p>
  </div>
</body>
</html>`;
  }

  private createRefundPlainText(data: RefundEmailData): string {
    return `SiZu Pay Refund Confirmation\n\nYour refund has been processed successfully.\n\nRefund Amount: $${data.refundAmount}\nRefund ID: ${data.refundId}\nOriginal Amount: $${data.originalAmount}\nGift Card: ${data.gan}\n${data.refundReason ? `Reason: ${data.refundReason}\n` : ''}\nThe refund will appear in your original payment method within 3-5 business days.`;
  }

  private createFraudAlertHTML(data: FraudEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Fraud Alert</title></head>
<body style="font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
    <div style="background: #fed7d7; border: 2px solid #e53e3e; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
      <h1 style="color: #742a2a; margin: 0; font-size: 1.5rem;">🚨 FRAUD ALERT</h1>
      <p style="color: #742a2a; margin: 10px 0 0 0; font-weight: 600;">${data.alertType}</p>
    </div>
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2d3748; margin: 0 0 15px 0;">Alert Details</h3>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Timestamp:</strong> ${data.timestamp.toLocaleString()}</p>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Suspicious Activity:</strong> ${data.suspiciousActivity}</p>
      ${data.userEmail ? `<p style="margin: 5px 0; color: #4a5568;"><strong>User Email:</strong> ${data.userEmail}</p>` : ''}
      ${data.gan ? `<p style="margin: 5px 0; color: #4a5568;"><strong>Gift Card:</strong> ${data.gan}</p>` : ''}
    </div>
    <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="color: #742a2a; margin: 0 0 10px 0;">Details</h4>
      <p style="color: #4a5568; margin: 0;">${data.details}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private createFraudAlertPlainText(data: FraudEmailData): string {
    return `SiZu Pay FRAUD ALERT: ${data.alertType}\n\nTimestamp: ${data.timestamp.toLocaleString()}\nSuspicious Activity: ${data.suspiciousActivity}\n${data.userEmail ? `User Email: ${data.userEmail}\n` : ''}${data.gan ? `Gift Card: ${data.gan}\n` : ''}\nDetails:\n${data.details}\n\nPlease investigate this alert immediately.`;
  }
}

export const emailService = new EmailService();