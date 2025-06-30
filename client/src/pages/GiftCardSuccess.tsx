import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail, CreditCard, Gift } from "lucide-react";

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
  const orderId = params?.orderId;

  const { data: order, isLoading, error } = useQuery<GiftCardOrder>({
    queryKey: [`/api/public/order/${orderId}`],
    enabled: !!orderId,
    retry: false,
  });

  useEffect(() => {
    if (!orderId) {
      setLocation("/giftcard-store");
    }
  }, [orderId, setLocation]);

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
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Order Not Found</h2>
            <p className="text-slate-300 mb-6">The gift card order could not be found.</p>
            <Button onClick={() => setLocation("/giftcard-store")} className="bg-purple-600 hover:bg-purple-700">
              Return to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Gift Card Created Successfully!</h1>
          <p className="text-xl text-slate-300">Your gift card has been processed and is ready to use.</p>
        </div>

        {/* Order Details Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              Gift Card Details
            </CardTitle>
            <CardDescription className="text-slate-300">
              Order #{order.id.substring(0, 8).toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400">Recipient Email</label>
                <p className="text-white font-medium">{order.recipientEmail}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Amount</label>
                <p className="text-white font-medium text-lg">{formatCurrency(order.amount)}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Status</label>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <p className="text-green-400 font-medium capitalize">{order.status}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Created</label>
                <p className="text-white font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {order.giftCardId && (
              <div className="mt-6 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <label className="text-sm text-purple-300">Gift Card Information</label>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs text-slate-400">Gift Card ID: </span>
                    <span className="text-white font-mono text-sm">{order.giftCardId}</span>
                  </div>
                  {order.giftCardGan && (
                    <div>
                      <span className="text-xs text-slate-400">Gift Card Number: </span>
                      <span className="text-white font-mono text-sm">{order.giftCardGan}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Next Steps</CardTitle>
            <CardDescription className="text-slate-300">
              Download your receipt and check your email for gift card details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PDF Receipt Download */}
            {order.pdfReceiptUrl && (
              <div className="flex items-center justify-between p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="flex items-center">
                  <Download className="w-5 h-5 text-green-400 mr-3" />
                  <div>
                    <p className="text-white font-medium">PDF Receipt</p>
                    <p className="text-sm text-slate-300">Download your purchase receipt</p>
                  </div>
                </div>
                <Button
                  onClick={() => window.open(order.pdfReceiptUrl!, '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}

            {/* Email Status */}
            <div className="flex items-center justify-between p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Email Notification</p>
                  <p className="text-sm text-slate-300">
                    {order.emailSent ? "Gift card details sent to your email" : "Email is being processed"}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.emailSent 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}>
                {order.emailSent ? "Sent" : "Pending"}
              </div>
            </div>

            {/* Payment Confirmation */}
            <div className="flex items-center justify-between p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-purple-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Payment Processed</p>
                  <p className="text-sm text-slate-300">Your payment has been successfully processed</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                Completed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Store */}
        <div className="text-center">
          <Button 
            onClick={() => setLocation("/giftcard-store")}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Purchase Another Gift Card
          </Button>
        </div>
      </div>
    </div>
  );
}