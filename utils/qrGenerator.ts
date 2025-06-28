import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

/**
 * QR Code and Barcode generation utilities for gift cards
 * Supports both QR codes for mobile scanning and Code128 barcodes for POS systems
 */

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface BarcodeOptions {
  width?: number;
  height?: number;
  includetext?: boolean;
  textxalign?: 'center' | 'left' | 'right';
  textsize?: number;
}

/**
 * Generate QR code data URL for gift card redemption
 * Creates scannable QR code containing gift card information
 */
export async function generateGiftCardQR(
  gan: string, 
  amount: number,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = `sqgc://${gan}?amount=${amount}&type=giftcard`;
  
  const qrOptions = {
    width: options.width || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const,
  };

  try {
    return await QRCode.toDataURL(qrData, qrOptions);
  } catch (error) {
    console.error('QR Code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate Code128 barcode for POS system scanning
 * Creates linear barcode for traditional retail scanning
 */
export async function generateGiftCardBarcode(
  gan: string,
  options: BarcodeOptions = {}
): Promise<string> {
  const barcodeOptions = {
    bcid: 'code128',
    text: gan,
    scale: options.width || 2,
    height: options.height || 50,
    includetext: options.includetext !== false,
    textxalign: options.textxalign || 'center' as const,
    textsize: options.textsize || 10,
  };

  try {
    // Generate barcode as PNG buffer then convert to data URL
    const png = await bwipjs.toBuffer(barcodeOptions);
    const base64 = png.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Barcode generation failed:', error);
    throw new Error('Failed to generate barcode');
  }
}

/**
 * Generate both QR code and barcode for comprehensive scanning support
 */
export async function generateGiftCardCodes(
  gan: string,
  amount: number,
  qrOptions?: QRCodeOptions,
  barcodeOptions?: BarcodeOptions
): Promise<{
  qrCode: string;
  barcode: string;
}> {
  const [qrCode, barcode] = await Promise.all([
    generateGiftCardQR(gan, amount, qrOptions),
    generateGiftCardBarcode(gan, barcodeOptions)
  ]);

  return { qrCode, barcode };
}

/**
 * Generate mobile-optimized QR code for app integration
 */
export async function generateMobileQR(gan: string, amount: number): Promise<string> {
  return generateGiftCardQR(gan, amount, {
    width: 200,
    margin: 1,
    color: {
      dark: '#1a1a1a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
}

/**
 * Generate print-ready barcode for physical cards
 */
export async function generatePrintBarcode(gan: string): Promise<string> {
  return generateGiftCardBarcode(gan, {
    width: 3,
    height: 60,
    includetext: true,
    textsize: 12
  });
}