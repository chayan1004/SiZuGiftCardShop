import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Gift, Download, Mail, Share2, QrCode, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function PurchaseSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['/api/public/purchase-success', orderId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/public/purchase-success/${orderId}`);
      return response.json();
    },
    enabled: !!orderId
  });

  const handleCopyGAN = async () => {
    if (orderData?.order?.giftCardGan) {
      await navigator.clipboard.writeText(orderData.order.giftCardGan);
      toast({
        title: "Copied!",
        description: "Gift card number copied to clipboard",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && orderData?.order) {
      try {
        await navigator.share({
          title: 'SiZu Gift Card',
          text: `I got you a gift card! Use code: ${orderData.order.giftCardGan}`,
          url: window.location.href
        });
      } catch (error) {
        handleCopyGAN();
      }
    } else {
      handleCopyGAN();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
                <p className="text-gray-600 mb-6">We couldn't find your order. Please check your email for order details.</p>
                <Link href="/store">
                  <Button>Back to Store</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const order = orderData.order;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {order.isGift ? 'Gift Card Sent!' : 'Purchase Complete!'}
            </h1>
            <p className="text-gray-600">
              {order.isGift 
                ? `Your gift card has been sent to ${order.recipientEmail}` 
                : `Your gift card is ready to use`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Gift Card Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Gift Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">SiZu Gift Card</h3>
                        <p className="text-purple-100">Digital Gift Card</p>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        ${(order.amount / 100).toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-purple-200 text-sm">Gift Card Number</p>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono bg-white/10 px-3 py-1 rounded">
                            {order.giftCardGan}
                          </code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={handleCopyGAN}
                            className="text-white hover:bg-white/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {order.message && (
                        <div>
                          <p className="text-purple-200 text-sm">Message</p>
                          <p className="text-white">{order.message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Order ID</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge variant="secondary" className="capitalize">
                        {order.status}
                      </Badge>
                    </div>
                    {order.isGift && (
                      <>
                        <div>
                          <p className="text-gray-500">From</p>
                          <p className="font-medium">{order.senderName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">To</p>
                          <p className="font-medium">{order.recipientName || order.recipientEmail}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Email Confirmation */}
              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Confirmation</h4>
                      <p className="text-sm text-gray-600">
                        A confirmation email with your gift card details has been sent to{' '}
                        <span className="font-medium">{order.recipientEmail}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              {/* QR Code Card */}
              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Quick Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <div className="w-32 h-32 bg-gray-100 rounded mx-auto flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Scan QR code to reopen this receipt
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* Share Actions */}
              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Share & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleShare} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Gift Card
                  </Button>
                  
                  {order.pdfReceiptUrl && (
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  )}
                  
                  <Link href="/store">
                    <Button variant="ghost" className="w-full">
                      Buy Another Gift Card
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Questions about your gift card purchase?
                  </p>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How to Use Section */}
          <Card className="mt-8 bg-white/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle>How to Use Your Gift Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium mb-2">Visit Merchant</h4>
                  <p className="text-sm text-gray-600">
                    Go to any participating merchant location or website
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium mb-2">Present Card</h4>
                  <p className="text-sm text-gray-600">
                    Show your gift card number or QR code at checkout
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium mb-2">Enjoy</h4>
                  <p className="text-sm text-gray-600">
                    Your gift card value will be applied to your purchase
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}