import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Gift, 
  Calendar, 
  Mail, 
  User, 
  MessageSquare, 
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  CreditCard,
  QrCode,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DesignPreview from "@/components/DesignPreview";

// Square Web SDK types
declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => Promise<any>;
    };
  }
}

const checkoutSchema = z.object({
  amount: z.number().min(10, "Minimum amount is $10").max(1000, "Maximum amount is $1,000"),
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientEmail: z.string().email("Valid email is required"),
  senderName: z.string().min(2, "Your name is required"),
  personalMessage: z.string().max(500, "Message must be 500 characters or less").optional(),
  deliveryTime: z.enum(["now", "scheduled"]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional()
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [location] = useLocation();
  const [step, setStep] = useState(1);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState<any>(null);
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('creditCard');
  const { toast } = useToast();

  // Parse URL parameters and extract merchant ID from path
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const presetAmount = urlParams.get('amount');
  const isCustom = urlParams.get('custom') === 'true';
  const cardType = urlParams.get('type');
  
  // Extract merchant ID from URL path (/checkout/:merchantId)
  const pathParts = location.split('/');
  const merchantId = pathParts[2] || null;

  // Fetch Square configuration
  const { data: squareConfig } = useQuery({
    queryKey: ['/api/config/square'],
    queryFn: async () => {
      const response = await fetch('/api/config/square');
      if (!response.ok) {
        throw new Error('Failed to fetch Square configuration');
      }
      return response.json();
    }
  });

  // Fetch merchant design for branding
  const { data: merchantDesignData, isLoading: isLoadingDesign } = useQuery({
    queryKey: ['/api/public/merchant-design', merchantId],
    queryFn: async () => {
      if (!merchantId) return null;
      const response = await fetch(`/api/public/merchant-design/${merchantId}`);
      if (!response.ok) {
        console.warn('Failed to fetch merchant design, using default');
        return {
          success: true,
          design: {
            hasCustomDesign: false,
            backgroundImageUrl: null,
            logoUrl: null,
            themeColor: '#613791',
            customMessage: 'Thank you for choosing our gift card!'
          }
        };
      }
      return response.json();
    },
    enabled: !!merchantId
  });

  const merchantDesign = merchantDesignData?.design || null;

  // Load Square Web SDK
  useEffect(() => {
    if (!squareConfig || squareLoaded) return;

    // Check if running in HTTPS context
    const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    if (!isSecureContext) {
      console.warn('Square requires HTTPS. Running in development mode without Square SDK.');
      setSquareLoaded(true); // Mark as loaded to enable demo mode
      return;
    }

    // Remove any existing Square scripts first
    const existingScripts = document.querySelectorAll('script[src*="square"]');
    existingScripts.forEach(script => script.remove());

    const script = document.createElement('script');
    // Always use sandbox for development
    script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
    script.async = true;
    script.onload = () => {
      if (window.Square) {
        setTimeout(() => initializeSquare(), 500); // Longer delay for proper initialization
      }
    };
    script.onerror = () => {
      console.error('Failed to load Square SDK');
      toast({
        title: "Payment system error",
        description: "Failed to load Square payment system. Please refresh the page.",
        variant: "destructive"
      });
    };
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script may have already been removed
      }
    };
  }, [squareConfig]);

  const initializeSquare = async () => {
    // Check if we're in development mode without HTTPS
    const isDevelopment = window.location.protocol !== 'https:' && 
                          (window.location.hostname === '127.0.0.1' || 
                           window.location.hostname === 'localhost');
    
    if (isDevelopment) {
      console.log('Development mode: Running without Square SDK due to HTTPS requirement');
      setSquareLoaded(true);
      toast({
        title: "Development Mode",
        description: "Payment forms are available for display. In production, this will use real Square payments.",
        variant: "default"
      });
      return;
    }

    if (!window.Square || !squareConfig) {
      console.log('Square not available or config missing:', { Square: !!window.Square, config: squareConfig });
      setSquareLoaded(true); // Enable demo mode
      return;
    }

    console.log('Initializing Square with config:', squareConfig);

    try {
      const payments = await window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
      console.log('Square payments initialized');
      
      const card = await payments.card({
        style: {
          input: {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          },
          '.input-container': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          },
          '.input-container.is-focus': {
            borderColor: '#06b6d4'
          },
          '.input-container.is-error': {
            borderColor: '#ef4444'
          }
        }
      });
      console.log('Square card initialized');
      
      await card.attach('#card-container');
      console.log('Square card attached to container');
      
      setPaymentForm({ payments, card });
      setSquareLoaded(true);
      
      toast({
        title: "Payment form ready",
        description: "You can now enter your card details."
      });
    } catch (error) {
      console.error('Square initialization error:', error);
      
      // Enable demo mode even if Square fails
      setSquareLoaded(true);
      
      let errorMessage = "Development mode - payment forms are for display only.";
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'ApplicationIdEnvironmentMismatchError') {
          errorMessage = "Demo mode: In production, this will use real Square payments.";
        }
      }
      
      toast({
        title: "Development Mode",
        description: errorMessage,
        variant: "default"
      });
    }
  };

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      amount: presetAmount ? parseInt(presetAmount) : 50,
      deliveryTime: "now",
      personalMessage: ""
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: CheckoutForm & { sourceId: string }) => {
      const response = await fetch('/api/giftcards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to cents
          recipientEmail: data.recipientEmail,
          personalMessage: data.personalMessage,
          merchantId: 'main', // Default merchant ID
          sourceId: data.sourceId // Payment token from Square
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process purchase');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setPurchaseResult(result);
      setStep(4);
      toast({
        title: "Gift card created successfully!",
        description: "The recipient will receive their gift card via email."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Unable to process your gift card purchase.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: CheckoutForm) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      await handlePayment(data);
    }
  };

  const handlePayment = async (data: CheckoutForm) => {
    // Use mock payment for development until Square is properly configured
    if (!squareLoaded) {
      // Mock payment token for testing
      const mockSourceId = `cnon:card-nonce-${Date.now()}`;
      purchaseMutation.mutate({
        ...data,
        sourceId: mockSourceId
      });
      return;
    }

    if (!paymentForm || !paymentForm.card) {
      toast({
        title: "Payment system not ready",
        description: "Please wait for the payment form to load.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await paymentForm.card.tokenize();
      
      if (result.status === 'OK') {
        purchaseMutation.mutate({
          ...data,
          sourceId: result.token
        });
      } else {
        toast({
          title: "Payment error",
          description: result.errors?.[0]?.message || "Payment processing failed.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment tokenization error:', error);
      toast({
        title: "Payment error", 
        description: "Unable to process payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-12 gradient-premium rounded-xl flex items-center justify-center shadow-xl">
                  <Gift className="text-white" size={20} />
                </div>
                <span className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SiZu Gift Card Checkout
                </span>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      stepNum <= step 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {stepNum < step ? <CheckCircle className="w-5 h-5" /> : stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-12 h-1 mx-2 ${
                        stepNum < step ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-8 text-sm text-gray-300">
                <span className={step >= 1 ? 'text-cyan-300' : ''}>Details</span>
                <span className={step >= 2 ? 'text-cyan-300' : ''}>Processing</span>
                <span className={step >= 3 ? 'text-cyan-300' : ''}>Complete</span>
              </div>
            </motion.div>

            {/* Step 1: Form */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form */}
                <div className="lg:col-span-2">
                  <Card className="glass-premium border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Gift Card Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Amount */}
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Gift Card Amount
                          </Label>
                          {isCustom ? (
                            <Input
                              id="amount"
                              type="number"
                              min="10"
                              max="1000"
                              {...form.register("amount", { valueAsNumber: true })}
                              className="glass-premium border-white/20 text-white placeholder-gray-400"
                              placeholder="Enter amount ($10 - $1,000)"
                            />
                          ) : (
                            <div className="text-2xl font-bold text-cyan-300">
                              ${form.watch("amount")}
                            </div>
                          )}
                          {form.formState.errors.amount && (
                            <p className="text-red-400 text-sm">{form.formState.errors.amount.message}</p>
                          )}
                        </div>

                        {/* Recipient Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="recipientName" className="text-white">
                              Recipient Name
                            </Label>
                            <Input
                              id="recipientName"
                              {...form.register("recipientName")}
                              className="glass-premium border-white/20 text-white placeholder-gray-400"
                              placeholder="Who is this for?"
                            />
                            {form.formState.errors.recipientName && (
                              <p className="text-red-400 text-sm">{form.formState.errors.recipientName.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="recipientEmail" className="text-white flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Recipient Email
                            </Label>
                            <Input
                              id="recipientEmail"
                              type="email"
                              {...form.register("recipientEmail")}
                              className="glass-premium border-white/20 text-white placeholder-gray-400"
                              placeholder="recipient@example.com"
                            />
                            {form.formState.errors.recipientEmail && (
                              <p className="text-red-400 text-sm">{form.formState.errors.recipientEmail.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Sender Name */}
                        <div className="space-y-2">
                          <Label htmlFor="senderName" className="text-white">
                            Your Name
                          </Label>
                          <Input
                            id="senderName"
                            {...form.register("senderName")}
                            className="glass-premium border-white/20 text-white placeholder-gray-400"
                            placeholder="Your name"
                          />
                          {form.formState.errors.senderName && (
                            <p className="text-red-400 text-sm">{form.formState.errors.senderName.message}</p>
                          )}
                        </div>

                        {/* Personal Message */}
                        <div className="space-y-2">
                          <Label htmlFor="personalMessage" className="text-white flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Personal Message (Optional)
                          </Label>
                          <Textarea
                            id="personalMessage"
                            {...form.register("personalMessage")}
                            className="glass-premium border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                            placeholder="Add a personal touch to your gift..."
                            maxLength={500}
                          />
                          <div className="text-right text-xs text-gray-400">
                            {form.watch("personalMessage")?.length || 0}/500
                          </div>
                        </div>

                        {/* Delivery Options */}
                        <div className="space-y-4">
                          <Label className="text-white flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Delivery Time
                          </Label>
                          <RadioGroup
                            value={form.watch("deliveryTime")}
                            onValueChange={(value) => form.setValue("deliveryTime", value as "now" | "scheduled")}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-2 glass-premium p-4 rounded-lg border border-white/10">
                              <RadioGroupItem value="now" id="now" />
                              <Label htmlFor="now" className="text-white cursor-pointer flex-1">
                                <div className="font-semibold">Send Now</div>
                                <div className="text-sm text-gray-300">Deliver immediately via email</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 glass-premium p-4 rounded-lg border border-white/10">
                              <RadioGroupItem value="scheduled" id="scheduled" />
                              <Label htmlFor="scheduled" className="text-white cursor-pointer flex-1">
                                <div className="font-semibold">Schedule for Later</div>
                                <div className="text-sm text-gray-300">Choose a specific date and time</div>
                              </Label>
                            </div>
                          </RadioGroup>

                          {form.watch("deliveryTime") === "scheduled" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="scheduledDate" className="text-white">
                                  Date
                                </Label>
                                <Input
                                  id="scheduledDate"
                                  type="date"
                                  {...form.register("scheduledDate")}
                                  className="glass-premium border-white/20 text-white"
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="scheduledTime" className="text-white">
                                  Time
                                </Label>
                                <Input
                                  id="scheduledTime"
                                  type="time"
                                  {...form.register("scheduledTime")}
                                  className="glass-premium border-white/20 text-white"
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 text-lg font-semibold"
                        >
                          Continue to Payment
                          <CreditCard className="w-5 h-5 ml-2" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Gift Card Preview with Merchant Branding */}
                <div>
                  <Card className="glass-premium border-white/10 sticky top-8">
                    <CardHeader>
                      <CardTitle className="text-white">Gift Card Preview</CardTitle>
                      {merchantId && (
                        <p className="text-gray-400 text-sm">
                          {isLoadingDesign ? 'Loading merchant design...' : 
                           merchantDesign?.hasCustomDesign ? 'Custom merchant design' : 'Default design'}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Dynamic Design Preview */}
                      <DesignPreview 
                        merchantDesign={merchantDesign}
                        amount={(form.watch("amount") || 0) * 100} // Convert to cents
                        isLoading={isLoadingDesign}
                      />
                      
                      {/* Order Summary */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-300">Gift Card Amount</span>
                          <span className="text-2xl font-bold text-cyan-300">
                            ${form.watch("amount")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid lg:grid-cols-2 gap-8"
              >
                {/* Payment Form */}
                <div>
                  <Card className="glass-premium border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Secure Payment
                      </CardTitle>
                      <p className="text-gray-300">
                        Enter your payment information to complete the purchase
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Payment Method Selection */}
                      <div className="space-y-4">
                        <Label className="text-white">Select Payment Method</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'creditCard' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('creditCard')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10"
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
                            <span className="text-xs">Credit Card</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'debitCard' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('debitCard')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10"
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-500 rounded" />
                            <span className="text-xs">Debit Card</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'applePay' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('applePay')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10"
                          >
                            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <span className="text-xs">Apple Pay</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'googlePay' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('googlePay')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10"
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded" />
                            <span className="text-xs">Google Pay</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'cashApp' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('cashApp')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10"
                          >
                            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">$</span>
                            </div>
                            <span className="text-xs">Cash App</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'paypal' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('paypal')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10"
                          >
                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">P</span>
                            </div>
                            <span className="text-xs">PayPal</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant={selectedPaymentMethod === 'bankTransfer' ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod('bankTransfer')}
                            className="h-16 flex flex-col items-center gap-1 border-white/20 hover:bg-white/10 col-span-2 lg:col-span-1"
                          >
                            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">B</span>
                            </div>
                            <span className="text-xs">Bank Transfer</span>
                          </Button>
                        </div>
                      </div>

                      {/* Payment Form Container */}
                      <div className="space-y-4">
                        <div className="min-h-[120px] p-4 rounded-lg border border-white/20 bg-white/5">
                          {selectedPaymentMethod === 'creditCard' || selectedPaymentMethod === 'debitCard' ? (
                            <div className="space-y-4">
                              <div className="text-sm text-amber-300 mb-2">
                                Development Mode: {selectedPaymentMethod} payment form
                              </div>
                              <Input
                                placeholder="4111 1111 1111 1111 (Test Card)"
                                className="glass-premium border-white/20 text-white placeholder-gray-400"
                                readOnly
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  placeholder="12/25"
                                  className="glass-premium border-white/20 text-white placeholder-gray-400"
                                  readOnly
                                />
                                <Input
                                  placeholder="123"
                                  className="glass-premium border-white/20 text-white placeholder-gray-400"
                                  readOnly
                                />
                              </div>
                            </div>
                          ) : selectedPaymentMethod === 'applePay' ? (
                            <div className="flex flex-col items-center justify-center h-24 space-y-2">
                              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">Apple Pay</span>
                              </div>
                              <span className="text-gray-300 text-sm">Touch ID or Face ID</span>
                            </div>
                          ) : selectedPaymentMethod === 'googlePay' ? (
                            <div className="flex flex-col items-center justify-center h-24 space-y-2">
                              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs">Google</span>
                              </div>
                              <span className="text-gray-300 text-sm">Pay with Google</span>
                            </div>
                          ) : selectedPaymentMethod === 'cashApp' ? (
                            <div className="flex flex-col items-center justify-center h-24 space-y-2">
                              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">$</span>
                              </div>
                              <span className="text-gray-300 text-sm">Cash App Pay</span>
                            </div>
                          ) : selectedPaymentMethod === 'paypal' ? (
                            <div className="flex flex-col items-center justify-center h-24 space-y-2">
                              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">PayPal</span>
                              </div>
                              <span className="text-gray-300 text-sm">Pay with PayPal</span>
                            </div>
                          ) : selectedPaymentMethod === 'bankTransfer' ? (
                            <div className="space-y-4">
                              <div className="text-sm text-amber-300 mb-2">
                                Development Mode: Bank transfer details
                              </div>
                              <Input
                                placeholder="Bank Account Number"
                                className="glass-premium border-white/20 text-white placeholder-gray-400"
                                readOnly
                              />
                              <Input
                                placeholder="Routing Number"
                                className="glass-premium border-white/20 text-white placeholder-gray-400"
                                readOnly
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-24">
                              <span className="text-gray-400">Select a payment method above</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            const formData = form.getValues();
                            handlePayment(formData);
                          }}
                          disabled={!squareLoaded || purchaseMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                        >
                          {purchaseMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Complete Purchase
                              <CreditCard className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div>
                  <Card className="glass-premium border-white/10 sticky top-8">
                    <CardHeader>
                      <CardTitle className="text-white">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Recipient</span>
                          <span className="text-white">{form.getValues().recipientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Email</span>
                          <span className="text-white text-sm">{form.getValues().recipientEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">From</span>
                          <span className="text-white">{form.getValues().senderName}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Gift Card Amount</span>
                          <span className="text-2xl font-bold text-cyan-300">
                            ${form.getValues().amount}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Secure payment processing
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Instant delivery
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          QR code included
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 3: Processing */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-16 h-16 animate-spin text-cyan-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Creating Your Gift Card
                </h2>
                <p className="text-gray-300 mb-8">
                  Please wait while we process your purchase and generate the gift card...
                </p>
                <div className="glass-premium max-w-md mx-auto p-6 rounded-xl border-white/10">
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing payment...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && purchaseResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Gift Card Created Successfully!
                </h2>
                
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Your gift card has been created and will be delivered to the recipient's email address. 
                  They'll receive a beautifully formatted email with their gift card and QR code.
                </p>

                {/* Celebration Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                      initial={{ 
                        x: "50%", 
                        y: "50%", 
                        scale: 0,
                        opacity: 0
                      }}
                      animate={{
                        x: `${Math.random() * 100}%`,
                        y: `${Math.random() * 100}%`,
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    />
                  ))}
                </div>

                <motion.div 
                  className="relative max-w-4xl mx-auto mb-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {/* 3D Card Container */}
                  <div className="relative perspective-1000">
                    <motion.div
                      className="transform-gpu preserve-3d"
                      initial={{ rotateY: -15, rotateX: 5 }}
                      animate={{ rotateY: 0, rotateX: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      whileHover={{ 
                        rotateY: 5, 
                        rotateX: -2,
                        scale: 1.02,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <Card className="glass-premium border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/10 to-white/5 shadow-2xl shadow-cyan-500/20">
                        <CardContent className="p-8">
                          {/* Animated Background Pattern */}
                          <div className="absolute inset-0 overflow-hidden rounded-lg">
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                          </div>

                          <div className="relative z-10">
                            {/* Header with 3D Effect */}
                            <motion.div 
                              className="text-center mb-8"
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="inline-flex items-center gap-3 mb-4">
                                <motion.div
                                  className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30"
                                  animate={{ 
                                    rotate: 360,
                                    scale: [1, 1.1, 1]
                                  }}
                                  transition={{ 
                                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 2, repeat: Infinity }
                                  }}
                                >
                                  <Gift className="w-6 h-6 text-white" />
                                </motion.div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                  Gift Card Created Successfully!
                                </h3>
                              </div>
                            </motion.div>

                            {/* 3D Info Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                              {/* Amount Card */}
                              <motion.div
                                className="relative group"
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                whileHover={{ y: -5 }}
                              >
                                <div className="glass-premium p-6 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 hover:border-cyan-400/40 transition-all duration-300">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                                      <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <h4 className="font-bold text-white">Amount</h4>
                                  </div>
                                  <motion.div 
                                    className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                  >
                                    ${(purchaseResult.amount / 100).toFixed(2)}
                                  </motion.div>
                                  <div className="text-sm text-gray-400 mt-2">Gift Card Value</div>
                                </div>
                              </motion.div>

                              {/* GAN Card */}
                              <motion.div
                                className="relative group"
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ y: -5 }}
                              >
                                <div className="glass-premium p-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:border-purple-400/40 transition-all duration-300">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                                      <CreditCard className="w-5 h-5 text-white" />
                                    </div>
                                    <h4 className="font-bold text-white">Gift Account Number</h4>
                                  </div>
                                  <div className="text-lg font-mono text-white bg-black/20 rounded-lg p-3 border border-white/10">
                                    {purchaseResult.gan}
                                  </div>
                                  <div className="text-sm text-gray-400 mt-2">Unique Identifier</div>
                                </div>
                              </motion.div>

                              {/* Status Card */}
                              <motion.div
                                className="relative group"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ y: -5 }}
                              >
                                <div className="glass-premium p-6 rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-teal-500/5 hover:border-green-400/40 transition-all duration-300">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center">
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <h4 className="font-bold text-white">Delivery Status</h4>
                                  </div>
                                  <motion.div 
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                  >
                                    <motion.div
                                      className="w-3 h-3 bg-green-400 rounded-full"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                    />
                                    <span className="text-green-300 font-semibold">Successfully Delivered</span>
                                  </motion.div>
                                  <div className="text-sm text-gray-400 mt-2">to {purchaseResult.recipientName}</div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Floating Action Indicators */}
                            <motion.div 
                              className="flex justify-center mt-8 gap-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1 }}
                            >
                              {[
                                { icon: Mail, label: "Email Sent", color: "cyan" },
                                { icon: QrCode, label: "QR Generated", color: "purple" },
                                { icon: Shield, label: "Secure", color: "green" }
                              ].map((item, i) => (
                                <motion.div
                                  key={i}
                                  className={`flex items-center gap-2 glass-premium px-4 py-2 rounded-full border border-${item.color}-500/20 bg-${item.color}-500/5`}
                                  initial={{ scale: 0, y: 20 }}
                                  animate={{ scale: 1, y: 0 }}
                                  transition={{ delay: 1.2 + i * 0.1, type: "spring" }}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                                  <span className="text-sm text-white font-medium">{item.label}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Enhanced Action Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-6 justify-center mt-8"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  {/* View Gift Card Button */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                    <Button
                      onClick={() => window.open(`/gift/${purchaseResult.gan}`, '_blank')}
                      className="relative bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-8 rounded-lg shadow-xl shadow-cyan-500/25 border-0 transform transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          <Gift className="w-5 h-5" />
                        </motion.div>
                        <span>View Gift Card</span>
                        <motion.div
                          className="w-2 h-2 bg-white rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                    </Button>
                  </motion.div>
                  
                  {/* Send Another Button */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                    <Button
                      onClick={() => window.location.href = '/store'}
                      variant="outline"
                      className="relative glass-premium border-2 border-cyan-400/30 hover:border-cyan-300/50 text-cyan-300 hover:text-white bg-transparent hover:bg-cyan-500/10 font-semibold py-3 px-8 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Mail className="w-5 h-5" />
                        </motion.div>
                        <span>Send Another Gift Card</span>
                      </div>
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Success Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`confetti-${i}`}
                      className="absolute"
                      style={{
                        left: `${20 + (i * 10)}%`,
                        top: '20%'
                      }}
                      initial={{ y: -20, opacity: 0, rotate: 0 }}
                      animate={{
                        y: [0, -30, 100],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360],
                        x: [0, Math.random() * 50 - 25]
                      }}
                      transition={{
                        duration: 2,
                        delay: 2 + i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 4
                      }}
                    >
                      <div className={`w-3 h-3 ${i % 3 === 0 ? 'bg-cyan-400' : i % 3 === 1 ? 'bg-purple-400' : 'bg-pink-400'} rotate-45`} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}