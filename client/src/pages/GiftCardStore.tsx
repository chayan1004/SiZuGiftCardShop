import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, CreditCard, Mail, User, MessageSquare, ShoppingCart, ArrowRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// Validation schema
const giftCardOrderSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid email address"),
  merchantId: z.string().optional(),
  amount: z.number().min(500, "Minimum amount is $5.00").max(50000, "Maximum amount is $500.00"),
  message: z.string().max(500, "Message cannot exceed 500 characters").optional(),
});

type GiftCardOrderData = z.infer<typeof giftCardOrderSchema>;

const predefinedAmounts = [
  { value: 2500, label: "$25" },
  { value: 5000, label: "$50" },
  { value: 10000, label: "$100" },
  { value: 15000, label: "$150" },
  { value: 20000, label: "$200" },
  { value: 25000, label: "$250" },
];

// Pricing tiers for merchants
const merchantPricingTiers = [
  { minQuantity: 1, maxQuantity: 9, discountPercentage: 0, name: "Individual" },
  { minQuantity: 10, maxQuantity: 49, discountPercentage: 12, name: "Small Business" },
  { minQuantity: 50, maxQuantity: 99, discountPercentage: 20, name: "Medium Business" },
  { minQuantity: 100, maxQuantity: Infinity, discountPercentage: 28, name: "Enterprise" },
];

export default function GiftCardStore() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [merchantValid, setMerchantValid] = useState<boolean | null>(null);
  const [merchantValidating, setMerchantValidating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [merchantBranding, setMerchantBranding] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Square Payment SDK integration
  const [squarePaymentForm, setSquarePaymentForm] = useState<any>(null);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    // Initialize Square Payment SDK
    initializeSquarePayment();
  }, []);

  const initializeSquarePayment = async () => {
    try {
      // Load Square Web Payments SDK
      const script = document.createElement('script');
      script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.onload = async () => {
        const payments = (window as any).Square.payments(
          process.env.VITE_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-your-app-id',
          process.env.VITE_SQUARE_LOCATION_ID || 'your-location-id'
        );
        
        const card = await payments.card();
        await card.attach('#square-card-container');
        
        setSquarePaymentForm({ payments, card });
        setPaymentReady(true);
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to initialize Square payment:', error);
      toast({
        title: "Payment System Error",
        description: "Unable to initialize payment system. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Validate merchant ID
  const validateMerchantId = async (merchantId: string) => {
    if (!merchantId.trim()) {
      setMerchantValid(null);
      return;
    }

    setMerchantValidating(true);
    try {
      const response = await fetch(`/api/public/validate-merchant/${encodeURIComponent(merchantId)}`);
      const data = await response.json();
      setMerchantValid(data.valid);
    } catch (error) {
      setMerchantValid(false);
    } finally {
      setMerchantValidating(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateMerchantId(merchantId);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [merchantId]);

  // Calculate final amount with merchant discount
  const getFinalAmount = () => {
    const baseAmount = selectedAmount || (customAmount ? parseFloat(customAmount) * 100 : 0);
    if (!merchantValid || !merchantId) return baseAmount;
    
    // Apply merchant discount
    const tier = merchantPricingTiers.find(t => t.minQuantity <= 1 && t.maxQuantity >= 1) || merchantPricingTiers[0];
    return Math.round(baseAmount * (1 - tier.discountPercentage / 100));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const validateForm = (): GiftCardOrderData | null => {
    const finalAmount = getFinalAmount();
    const formData = {
      recipientEmail,
      merchantId: merchantId.trim() || undefined,
      amount: finalAmount,
      message: message.trim() || undefined,
    };

    try {
      const validatedData = giftCardOrderSchema.parse(formData);
      setValidationErrors({});
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return null;
    }
  };

  const handleSubmit = async () => {
    const validatedData = validateForm();
    if (!validatedData || !squarePaymentForm || !paymentReady) {
      if (!paymentReady) {
        toast({
          title: "Payment Not Ready",
          description: "Payment system is still loading. Please wait a moment.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Get payment token from Square
      const tokenResult = await squarePaymentForm.card.tokenize();
      
      if (tokenResult.status === 'OK') {
        // Submit payment to backend
        const response = await fetch('/api/public/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validatedData,
            paymentToken: tokenResult.token,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: "Payment Successful!",
            description: `Gift card for ${formatCurrency(validatedData.amount)} has been created and sent to ${validatedData.recipientEmail}`,
          });
          
          // Redirect to success page with order ID
          setLocation(`/giftcard-store/success/${data.orderId}`);
        } else {
          throw new Error(data.message || 'Payment failed');
        }
      } else {
        throw new Error(tokenResult.errors?.[0]?.detail || 'Payment tokenization failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const finalAmount = getFinalAmount();
  const baseAmount = selectedAmount || (customAmount ? parseFloat(customAmount) * 100 : 0);
  const savings = baseAmount - finalAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
              <Gift className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Gift Card Store
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Send the perfect gift with our digital gift cards. Instant delivery, secure payments, and no expiration dates.
            </p>
          </motion.div>

          {/* Success Message */}
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className="bg-green-500/20 border-green-400/30 backdrop-blur-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Check className="text-green-400 w-6 h-6" />
                    <div>
                      <h3 className="text-green-400 font-semibold">Gift Card Created Successfully!</h3>
                      <p className="text-green-300 text-sm">Your gift card has been sent to the recipient's email.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Gift Card Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Create Your Gift Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Select Amount</label>
                    <div className="grid grid-cols-3 gap-3">
                      {predefinedAmounts.map((amount) => (
                        <Button
                          key={amount.value}
                          variant={selectedAmount === amount.value ? "default" : "outline"}
                          onClick={() => {
                            setSelectedAmount(amount.value);
                            setCustomAmount("");
                          }}
                          className={`h-12 ${
                            selectedAmount === amount.value
                              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                          }`}
                        >
                          {amount.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Or enter custom amount"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 pl-8"
                        min="5"
                        max="500"
                        step="0.01"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    </div>
                    {validationErrors.amount && (
                      <p className="text-red-400 text-sm">{validationErrors.amount}</p>
                    )}
                  </div>

                  {/* Recipient Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Recipient Email
                    </label>
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400"
                      required
                    />
                    {validationErrors.recipientEmail && (
                      <p className="text-red-400 text-sm">{validationErrors.recipientEmail}</p>
                    )}
                  </div>

                  {/* Merchant ID (Optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Merchant ID (Optional - for business discounts)
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter merchant ID for business pricing"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 pr-10"
                      />
                      {merchantValidating && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                        </div>
                      )}
                      {!merchantValidating && merchantValid === true && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                      )}
                      {!merchantValidating && merchantValid === false && merchantId && (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 w-4 h-4" />
                      )}
                    </div>
                    {merchantValid === false && merchantId && (
                      <p className="text-red-400 text-sm">Merchant ID not found</p>
                    )}
                    {merchantValid === true && (
                      <p className="text-green-400 text-sm">Valid merchant - business pricing applied</p>
                    )}
                  </div>

                  {/* Personal Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Personal Message (Optional)
                    </label>
                    <Textarea
                      placeholder="Add a personal message to your gift card..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-gray-400 text-xs">{message.length}/500 characters</p>
                    {validationErrors.message && (
                      <p className="text-red-400 text-sm">{validationErrors.message}</p>
                    )}
                  </div>

                  {/* Square Payment Form */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Information
                    </label>
                    <div 
                      id="square-card-container" 
                      className="bg-white/10 border border-white/20 rounded-lg p-4"
                      style={{ minHeight: '200px' }}
                    >
                      {!paymentReady && (
                        <div className="flex items-center justify-center h-48">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                            <p className="text-gray-400">Loading secure payment form...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Gift Card Value:</span>
                    <span className="text-white font-semibold">
                      {baseAmount > 0 ? formatCurrency(baseAmount) : "--"}
                    </span>
                  </div>

                  {merchantValid && savings > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Business Discount:</span>
                        <span className="text-green-400 font-semibold">
                          -{formatCurrency(savings)}
                        </span>
                      </div>
                      <div className="border-t border-white/20 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Total Amount:</span>
                          <span className="text-white font-bold text-xl">
                            {formatCurrency(finalAmount)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {!merchantValid && (
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Amount:</span>
                        <span className="text-white font-bold text-xl">
                          {finalAmount > 0 ? formatCurrency(finalAmount) : "--"}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing || !paymentReady || finalAmount === 0 || !recipientEmail}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Purchase Gift Card
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </Button>

                  <div className="text-center text-xs text-gray-400 mt-4">
                    <p>Secure payment powered by Square</p>
                    <p>Your card information is encrypted and secure</p>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-2xl border border-purple-400/30">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4">Why Choose Our Gift Cards?</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Instant digital delivery</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>No expiration dates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Secure and encrypted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Business discounts available</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}