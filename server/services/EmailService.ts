import * as nodemailer from 'nodemailer';
import axios from 'axios';

interface GiftCardEmailData {
  recipientEmail: string;
  recipientName: string;
  giftCardId: string;
  amount: number; // Amount in cents
  giftCardGan?: string;
  businessName: string;
  customMessage?: string;
  orderId: string;
}

interface EmailDeliveryResult {
  success: boolean;
  method: 'mailgun' | 'smtp';
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export class EmailService {
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeSMTP();
  }

  private initializeSMTP(): void {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.smtpTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log('SMTP transporter initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
    }
  }

  async sendGiftCardEmail(data: GiftCardEmailData): Promise<EmailDeliveryResult> {
    console.log(`📧 Attempting to send gift card email to ${data.recipientEmail} for order ${data.orderId}`);

    // Try Mailgun first
    try {
      const mailgunResult = await this.sendViaMailgun(data);
      if (mailgunResult.success) {
        console.log(`✅ Email sent via Mailgun: ${mailgunResult.messageId}`);
        return mailgunResult;
      }
    } catch (mailgunError) {
      console.error('Mailgun delivery failed:', mailgunError);
    }

    // Fallback to SMTP
    if (this.smtpTransporter) {
      try {
        const smtpResult = await this.sendViaSMTP(data);
        if (smtpResult.success) {
          console.log(`✅ Email sent via SMTP fallback: ${smtpResult.messageId}`);
          return smtpResult;
        }
      } catch (smtpError) {
        console.error('SMTP fallback failed:', smtpError);
      }
    }

    // Both methods failed
    const failureResult: EmailDeliveryResult = {
      success: false,
      method: 'mailgun',
      error: 'Both Mailgun and SMTP delivery failed',
      timestamp: new Date()
    };
    
    console.error(`❌ Failed to send email to ${data.recipientEmail}: ${failureResult.error}`);
    return failureResult;
  }

  private async sendViaMailgun(data: GiftCardEmailData): Promise<EmailDeliveryResult> {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun credentials not configured');
    }

    const htmlTemplate = this.generateGiftCardEmailTemplate(data);
    const textTemplate = this.generateTextTemplate(data);

    const formData = new FormData();
    formData.append('from', `SiZu Gift Cards <giftcards@${process.env.MAILGUN_DOMAIN}>`);
    formData.append('to', data.recipientEmail);
    formData.append('subject', `🎁 Your SiZu Gift Card for ${this.formatCurrency(data.amount)} is Ready!`);
    formData.append('text', textTemplate);
    formData.append('html', htmlTemplate);

    const response = await axios.post(
      `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
      formData,
      {
        auth: {
          username: 'api',
          password: process.env.MAILGUN_API_KEY,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      success: true,
      method: 'mailgun',
      messageId: response.data.id,
      timestamp: new Date()
    };
  }

  private async sendViaSMTP(data: GiftCardEmailData): Promise<EmailDeliveryResult> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const htmlTemplate = this.generateGiftCardEmailTemplate(data);
    const textTemplate = this.generateTextTemplate(data);

    const mailOptions = {
      from: '"SiZu Gift Cards" <giftcards@sizu.com>',
      to: data.recipientEmail,
      subject: `🎁 Your SiZu Gift Card for ${this.formatCurrency(data.amount)} is Ready!`,
      text: textTemplate,
      html: htmlTemplate,
    };

    const info = await this.smtpTransporter.sendMail(mailOptions);

    return {
      success: true,
      method: 'smtp',
      messageId: info.messageId,
      timestamp: new Date()
    };
  }

  private generateGiftCardEmailTemplate(data: GiftCardEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your SiZu Gift Card</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .gift-card {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            margin: 30px;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(255,107,107,0.3);
        }
        .amount {
            font-size: 48px;
            font-weight: 800;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .card-number {
            font-size: 18px;
            font-weight: 600;
            margin: 15px 0;
            letter-spacing: 2px;
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
        }
        .content {
            padding: 30px;
        }
        .message-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .instructions {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
        }
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .gift-card {
                margin: 20px;
                padding: 20px;
            }
            .amount {
                font-size: 36px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎁 Your Gift Card is Ready!</h1>
            <p>From ${data.businessName}</p>
        </div>
        
        <div class="gift-card">
            <div class="amount">${this.formatCurrency(data.amount)}</div>
            ${data.giftCardGan ? `<div class="card-number">Card: ${data.giftCardGan}</div>` : ''}
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">SiZu Digital Gift Card</p>
        </div>
        
        <div class="content">
            <h2>Hello ${data.recipientName}!</h2>
            <p>Congratulations! Your digital gift card has been successfully created and is ready to use immediately.</p>
            
            ${data.customMessage ? `
            <div class="message-box">
                <h3>Personal Message:</h3>
                <p style="font-style: italic; margin: 0;">"${data.customMessage}"</p>
            </div>
            ` : ''}
            
            <div class="instructions">
                <h3>📱 How to Use Your Gift Card:</h3>
                <ol>
                    <li><strong>Present this email</strong> at participating locations</li>
                    ${data.giftCardGan ? `<li><strong>Card Number:</strong> ${data.giftCardGan}</li>` : ''}
                    <li><strong>Gift Card ID:</strong> ${data.giftCardId}</li>
                    <li><strong>Check balance</strong> anytime at our website</li>
                </ol>
            </div>
            
            <div class="warning-box">
                <p style="margin: 0;"><strong>💡 Important:</strong> Keep this email safe! Your gift card information is contained here. This gift card never expires and can be used for any purchase.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>SiZu Gift Card Store</strong></p>
            <p style="font-size: 12px; color: #999;">Order ID: ${data.orderId}</p>
            <p style="font-size: 12px; color: #999;">Questions? Contact support@sizu.com</p>
            <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateTextTemplate(data: GiftCardEmailData): string {
    return `
🎁 Your SiZu Gift Card is Ready!

Hello ${data.recipientName}!

You've received a digital gift card for ${this.formatCurrency(data.amount)} from ${data.businessName}.

Gift Card Details:
- Amount: ${this.formatCurrency(data.amount)}
- Gift Card ID: ${data.giftCardId}
${data.giftCardGan ? `- Card Number: ${data.giftCardGan}` : ''}

${data.customMessage ? `Personal Message: "${data.customMessage}"` : ''}

How to Use:
1. Present this email at participating locations
2. Use Gift Card ID: ${data.giftCardId}
3. Check balance anytime at our website
4. Never expires!

Order ID: ${data.orderId}

Questions? Contact support@sizu.com

--
SiZu Gift Card Store
This is an automated message. Please do not reply.
    `;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  }
}

export const emailService = new EmailService();