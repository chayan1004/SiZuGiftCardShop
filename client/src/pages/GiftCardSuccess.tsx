import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail, CreditCard, Gift, QrCode, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GiftCardOrder {
  id: string;
  recipientEmail: string;
  amount: number;
  status: string;
  giftCardId: string | null;
  giftCardGan: string | null;
  pdfReceiptUrl: string | null;
  emailSent: boolean;
  createdAt: string;
}

export default function GiftCardSuccess() {
  const [, params] = useRoute("/giftcard-store/success/:orderId");
  const [, setLocation] = useLocation();
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [showQRCode, setShowQRCode] = useState(false);
  const { toast } = useToast();
  const orderId = params?.orderId;

  const { data: order, isLoading, error } = useQuery<GiftCardOrder>({
    queryKey: ["/api/public/order", orderId],
    enabled: !!orderId,
    retry: false,
  });

  useEffect(() => {
    if (!orderId) {
      setLocation("/giftcard-store");
    }
  }, [orderId, setLocation]);

  // Load QR code when order data is available
  useEffect(() => {
    if (order?.id && !qrCodeDataURL) {
      loadQRCode();
    }
  }, [order?.id]);

  const loadQRCode = async () => {
    try {
      const response = await fetch(`/api/public/qr/${orderId}`);
      const data = await response.json();
      if (data.success && data.qrCodeDataURI) {
        setQrCodeDataURL(data.qrCodeDataURI);
      }
    } catch (error) {
      console.error('Failed to load QR code:', error);
    }
  };

  const copyReceiptLink = async () => {
    const receiptURL = `${window.location.origin}/giftcard-store/success/${orderId}`;
    try {
      await navigator.clipboard.writeText(receiptURL);
      toast({
        title: "Link Copied!",
        description: "Receipt link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareReceipt = async () => {
    const receiptURL = `${window.location.origin}/giftcard-store/success/${orderId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SiZu Gift Card Receipt',
          text: `Gift card receipt for ${formatCurrency(order?.amount || 0)}`,
          url: receiptURL,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyReceiptLink();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md w-full">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Order Not Found</h2>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">The gift card order could not be found.</p>
            <Button onClick={() => setLocation("/giftcard-store")} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
              Return to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto pt-4 sm:pt-8">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full mb-4 sm:mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4 px-4">
            Gift Card Created Successfully!
          </h1>
          <p className="text-base sm:text-xl text-slate-300 px-4">
            Your gift card has been processed and is ready to use.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Details Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Gift Card Details
                </CardTitle>
                <CardDescription className="text-slate-300 text-sm sm:text-base">
                  Order #{order.id.substring(0, 8).toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs sm:text-sm text-slate-400">Recipient Email</label>
                    <p className="text-white font-medium text-sm sm:text-base break-all">{order.recipientEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-slate-400">Amount</label>
                    <p className="text-white font-medium text-lg sm:text-xl">{formatCurrency(order.amount)}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-slate-400">Status</label>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-green-400 font-medium capitalize text-sm sm:text-base">{order.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-slate-400">Created</label>
                    <p className="text-slate-300 text-sm sm:text-base">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {order.giftCardGan && (
                  <div className="mt-4 p-3 sm:p-4 bg-black/20 rounded-lg">
                    <label className="text-xs sm:text-sm text-slate-400">Gift Card Number</label>
                    <p className="text-white font-mono text-sm sm:text-base break-all">{order.giftCardGan}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Status Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Email Delivery Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${order.emailSent ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className={`font-medium text-sm sm:text-base ${order.emailSent ? 'text-green-400' : 'text-yellow-400'}`}>
                    {order.emailSent ? 'Email Sent Successfully' : 'Email Pending'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mt-2">
                  {order.emailSent 
                    ? 'The gift card has been delivered to the recipient\'s email address.' 
                    : 'The gift card email is being processed and will be sent shortly.'
                  }
                </p>
              </CardContent>
            </Card>

            {/* PDF Receipt Download */}
            {order.pdfReceiptUrl && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    Receipt Download
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-slate-300 text-sm sm:text-base mb-4">
                    Download your official receipt for this gift card purchase.
                  </p>
                  <Button 
                    asChild 
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <a href={order.pdfReceiptUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt PDF
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - QR Code & Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* QR Code Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <QrCode className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Quick Access
                </CardTitle>
                <CardDescription className="text-slate-300 text-sm">
                  Scan to reopen this receipt
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {qrCodeDataURL ? (
                  <div className="text-center">
                    <div className="bg-white p-3 sm:p-4 rounded-lg inline-block mb-4">
                      <img 
                        src={qrCodeDataURL} 
                        alt="Receipt QR Code" 
                        className="w-32 h-32 sm:w-40 sm:h-40"
                      />
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Scan with your phone's camera to quickly access this receipt again
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse bg-white/20 w-32 h-32 sm:w-40 sm:h-40 rounded-lg mx-auto mb-4"></div>
                    <p className="text-slate-400 text-xs sm:text-sm">Loading QR code...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Actions Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Share Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                <Button 
                  onClick={shareReceipt}
                  className="bg-purple-600 hover:bg-purple-700 w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Receipt
                </Button>
                <Button 
                  onClick={copyReceiptLink}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </CardContent>
            </Card>

            {/* Return to Store */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 sm:p-6">
                <Button 
                  onClick={() => setLocation("/giftcard-store")}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Purchase Another Gift Card
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 pb-8">
          <p className="text-slate-400 text-xs sm:text-sm">
            Thank you for choosing SiZu Gift Card Store
          </p>
          <p className="text-slate-500 text-xs mt-2">
            For support, contact us at support@sizugiftcard.com
          </p>
        </div>
      </div>
    </div>
  );
}