import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';

interface GiftCardEmailData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  amount: number;
  gan: string;
  qrCodeData: string;
  personalMessage?: string;
  orderId: string;
}

export class GiftCardEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USERNAME,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    });
  }

  async sendGiftCardEmail(data: GiftCardEmailData): Promise<boolean> {
    try {
      // Generate QR code as base64 image
      const qrCodeBuffer = await QRCode.toBuffer(data.qrCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const qrCodeBase64 = qrCodeBuffer.toString('base64');
      
      const htmlTemplate = this.generateGiftCardEmailTemplate(data, qrCodeBase64);
      const textTemplate = this.generateGiftCardTextTemplate(data);

      const mailOptions = {
        from: '"SiZu Gift Card Store" <giftcards@sizu.com>',
        to: data.recipientEmail,
        subject: `🎁 Your SiZu Gift Card for ${this.formatCurrency(data.amount)} is Ready!`,
        text: textTemplate,
        html: htmlTemplate,
        attachments: [
          {
            filename: 'gift-card-qr.png',
            content: qrCodeBuffer,
            cid: 'qrcode'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Gift card email sent successfully to ${data.recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send gift card email:', error);
      return false;
    }
  }

  private generateGiftCardEmailTemplate(data: GiftCardEmailData, qrCodeBase64: string): string {
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
            margin: 0 auto;
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
            position: relative;
            box-shadow: 0 10px 30px rgba(255,107,107,0.3);
        }
        .gift-card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24, #ff6b6b);
            border-radius: 12px;
            z-index: -1;
        }
        .amount {
            font-size: 48px;
            font-weight: 800;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .gan {
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
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        .qr-code {
            border: 4px solid white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
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
            <p>From ${data.senderName}</p>
        </div>
        
        <div class="gift-card">
            <div class="amount">${this.formatCurrency(data.amount)}</div>
            <div class="gan">Card Number: ${data.gan}</div>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">SiZu Gift Card</p>
        </div>
        
        <div class="content">
            <h2>Hello ${data.recipientName}!</h2>
            <p>Congratulations! You've received a digital gift card. This card can be used for purchases and is ready to use immediately.</p>
            
            ${data.personalMessage ? `
            <div class="message-box">
                <h3>Personal Message:</h3>
                <p style="font-style: italic; margin: 0;">"${data.personalMessage}"</p>
            </div>
            ` : ''}
            
            <div class="qr-section">
                <h3>Quick Access QR Code</h3>
                <img src="data:image/png;base64,${qrCodeBase64}" alt="Gift Card QR Code" class="qr-code" width="200" height="200">
                <p style="margin: 15px 0 0; color: #666; font-size: 14px;">Scan this code with your phone to access your gift card instantly</p>
            </div>
            
            <div class="instructions">
                <h3>📱 How to Use Your Gift Card:</h3>
                <ol>
                    <li><strong>Scan the QR code</strong> above with your phone camera</li>
                    <li><strong>Or visit:</strong> <a href="${data.qrCodeData}" target="_blank">${data.qrCodeData}</a></li>
                    <li><strong>Show at checkout</strong> or enter the card number: <strong>${data.gan}</strong></li>
                    <li><strong>Enjoy your purchase!</strong> Check your balance anytime online</li>
                </ol>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.qrCodeData}" class="btn" target="_blank">Access Your Gift Card Online</a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>💡 Tip:</strong> Save this email or take a screenshot of the QR code for easy access to your gift card.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>SiZu Gift Card Store</strong></p>
            <p style="font-size: 12px; color: #999;">Order ID: ${data.orderId}</p>
            <p style="font-size: 12px; color: #999;">This gift card never expires and can be used for any purchase.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateGiftCardTextTemplate(data: GiftCardEmailData): string {
    return `
🎁 Your SiZu Gift Card is Ready!

Hello ${data.recipientName}!

You've received a digital gift card for ${this.formatCurrency(data.amount)} from ${data.senderName}.

Gift Card Details:
- Amount: ${this.formatCurrency(data.amount)}
- Card Number: ${data.gan}
- Access Link: ${data.qrCodeData}

${data.personalMessage ? `Personal Message: "${data.personalMessage}"` : ''}

How to Use:
1. Visit: ${data.qrCodeData}
2. Or use card number: ${data.gan}
3. Present at checkout or enter online
4. Enjoy your purchase!

This gift card never expires and can be used for any purchase.

Order ID: ${data.orderId}

--
SiZu Gift Card Store
    `;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  }
}

export const giftCardEmailService = new GiftCardEmailService();