import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Gift, CreditCard, Mail, Heart, ShoppingCart, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface MerchantDetails {
  id: string;
  businessName: string;
  businessType: string;
  logo?: string;
  themeColor: string;
  tagline?: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  popularAmounts: number[];
}

const popularAmounts = [2500, 5000, 10000, 15000, 25000]; // in cents

function PurchaseForm({ merchant }: { merchant: MerchantDetails }) {
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: async (purchaseData: any) => {
      const response = await apiRequest('POST', '/api/public/purchase', purchaseData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/giftcards'] });
      setLocation(`/purchase-success/${data.orderId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to process gift card purchase",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientEmail || !senderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const finalAmount = useCustomAmount ? 
      Math.round(parseFloat(customAmount) * 100) : 
      amount;

    if (finalAmount < merchant.minAmount || finalAmount > merchant.maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between $${merchant.minAmount/100} and $${merchant.maxAmount/100}`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: senderName,
          email: recipientEmail,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Process purchase
      await purchaseMutation.mutateAsync({
        merchantId: merchant.id,
        amount: finalAmount,
        recipientEmail,
        senderName,
        recipientName: isGift ? recipientName : senderName,
        message: message || null,
        isGift,
        paymentMethodId: paymentMethod.id
      });

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Select Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={useCustomAmount ? 'custom' : amount.toString()} 
            onValueChange={(value) => {
              if (value === 'custom') {
                setUseCustomAmount(true);
              } else {
                setUseCustomAmount(false);
                setAmount(parseInt(value));
              }
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {popularAmounts.map((amt) => (
                <Label
                  key={amt}
                  htmlFor={amt.toString()}
                  className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <RadioGroupItem value={amt.toString()} id={amt.toString()} />
                  <span className="font-medium">${(amt / 100).toFixed(0)}</span>
                </Label>
              ))}
            </div>
            
            <Label
              htmlFor="custom"
              className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RadioGroupItem value="custom" id="custom" />
              <span>Custom Amount</span>
            </Label>
          </RadioGroup>

          {useCustomAmount && (
            <div>
              <Label htmlFor="customAmount">Custom Amount (USD)</Label>
              <Input
                id="customAmount"
                type="number"
                min={merchant.minAmount / 100}
                max={merchant.maxAmount / 100}
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`$${merchant.minAmount / 100} - $${merchant.maxAmount / 100}`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Option */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGift"
              checked={isGift}
              onCheckedChange={(checked) => setIsGift(checked as boolean)}
            />
            <Label htmlFor="isGift" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              This is a gift for someone else
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {isGift ? 'Gift Information' : 'Your Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipientEmail">
              {isGift ? 'Recipient Email' : 'Your Email'} *
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="senderName">Your Name *</Label>
            <Input
              id="senderName"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          {isGift && (
            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient's name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isGift ? "Add a personal message for the recipient..." : "Add a note for yourself..."}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Gift Card Amount:</span>
              <span className="font-medium">
                ${useCustomAmount ? 
                  (parseFloat(customAmount) || 0).toFixed(2) : 
                  (amount / 100).toFixed(2)
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Processing Fee:</span>
              <span className="font-medium">$0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>
                ${useCustomAmount ? 
                  (parseFloat(customAmount) || 0).toFixed(2) : 
                  (amount / 100).toFixed(2)
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full py-3 text-lg"
        disabled={isProcessing || !stripe}
        style={{ backgroundColor: merchant.themeColor }}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Complete Purchase
          </div>
        )}
      </Button>
    </form>
  );
}

export default function GiftCardPurchase() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [, setLocation] = useLocation();

  const { data: merchant, isLoading, error } = useQuery({
    queryKey: ['/api/public/merchant', merchantId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/public/merchant/${merchantId}`);
      return response.json();
    },
    enabled: !!merchantId
  });

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
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Merchant Not Found</h2>
                <p className="text-gray-600 mb-6">The merchant you're looking for is not available.</p>
                <Button onClick={() => setLocation('/store')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Store
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/store')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: merchant.themeColor }}
                  >
                    {merchant.logo ? (
                      <img src={merchant.logo} alt={merchant.businessName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      merchant.businessName.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">
                      {merchant.businessName}
                    </h1>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{merchant.businessType}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">4.8</span>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {merchant.tagline || merchant.description || `Purchase gift cards for ${merchant.businessName}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Elements stripe={stripePromise}>
                <PurchaseForm merchant={merchant} />
              </Elements>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Why Choose This Gift Card?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Gift className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Instant Delivery</h4>
                      <p className="text-sm text-gray-600">Delivered immediately via email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">No Expiration</h4>
                      <p className="text-sm text-gray-600">Use anytime, never expires</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Secure Payment</h4>
                      <p className="text-sm text-gray-600">Protected by Stripe</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Have questions about your gift card purchase?
                  </p>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}