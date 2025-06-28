import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QrCode, Download, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface QRCodePreviewProps {
  gan: string;
  amount: number;
  onEmailSend?: (email: string) => void;
}

export default function QRCodePreview({ gan, amount, onEmailSend }: QRCodePreviewProps) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const { toast } = useToast();

  // Fetch QR code and barcode for the gift card
  const { data: codesData, isLoading } = useQuery({
    queryKey: ['/api/giftcards', gan, 'codes'],
    queryFn: async () => {
      const response = await fetch(`/api/giftcards/${gan}/codes`);
      if (!response.ok) {
        throw new Error('Failed to generate codes');
      }
      return response.json();
    },
    enabled: !!gan
  });

  const handleCopyGAN = () => {
    navigator.clipboard.writeText(gan);
    toast({
      title: "Copied to clipboard",
      description: "Gift card number copied successfully"
    });
  };

  const handleDownloadQR = () => {
    if (codesData?.qrCode) {
      const link = document.createElement('a');
      link.href = codesData.qrCode;
      link.download = `gift-card-qr-${gan}.png`;
      link.click();
    }
  };

  const handleDownloadBarcode = () => {
    if (codesData?.barcode) {
      const link = document.createElement('a');
      link.href = codesData.barcode;
      link.download = `gift-card-barcode-${gan}.png`;
      link.click();
    }
  };

  const handleEmailSend = () => {
    if (!emailAddress.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    onEmailSend?.(emailAddress);
    setShowEmailInput(false);
    setEmailAddress("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Gift Card Codes
        </CardTitle>
        <CardDescription>
          Scannable codes for easy redemption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gift Card Info */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Gift Card Value</p>
          <p className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
              {gan}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyGAN}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* QR Code and Barcode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 mb-3">
              {codesData?.qrCode ? (
                <img 
                  src={codesData.qrCode} 
                  alt="Gift Card QR Code"
                  className="mx-auto max-w-[200px] max-h-[200px]"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <Badge variant="secondary" className="mb-2">QR Code</Badge>
            <p className="text-xs text-gray-500 mb-3">Scan with mobile device</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              disabled={!codesData?.qrCode}
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </div>

          {/* Barcode */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 mb-3 min-h-[232px] flex items-center justify-center">
              {codesData?.barcode ? (
                <img 
                  src={codesData.barcode} 
                  alt="Gift Card Barcode"
                  className="max-w-full max-h-[200px]"
                />
              ) : (
                <div className="w-48 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-xs">Barcode</div>
                </div>
              )}
            </div>
            <Badge variant="secondary" className="mb-2">Barcode</Badge>
            <p className="text-xs text-gray-500 mb-3">Scan at POS system</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBarcode}
              disabled={!codesData?.barcode}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Barcode
            </Button>
          </div>
        </div>

        {/* Email Delivery */}
        <div className="border-t pt-4">
          {!showEmailInput ? (
            <Button
              onClick={() => setShowEmailInput(true)}
              className="w-full"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send via Email
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <input
                type="email"
                placeholder="Enter email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full p-3 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleEmailSend()}
              />
              <div className="flex gap-2">
                <Button onClick={handleEmailSend} className="flex-1">
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEmailInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to Redeem</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Show QR code at checkout for mobile scanning</li>
            <li>• Present barcode for traditional POS systems</li>
            <li>• Provide gift card number manually if needed</li>
            <li>• Use online or in-store until balance is zero</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}