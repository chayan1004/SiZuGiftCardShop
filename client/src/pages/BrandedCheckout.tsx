import { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  ArrowLeft, 
  Gift,
  Star,
  Sparkles,
  Crown,
  Diamond
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

// Checkout configuration interface
interface CheckoutConfig {
  brandName: string;
  brandLogo?: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  layout: string;
  theme: string;
  animation: string;
  acceptedPaymentMethods: {
    creditCard: boolean;
    debitCard: boolean;
    applePay: boolean;
    googlePay: boolean;
    cashApp: boolean;
    paypal: boolean;
    bankTransfer: boolean;
  };
  requireCVV: boolean;
  requireBillingAddress: boolean;
  enableSavePayment: boolean;
  enableGuestCheckout: boolean;
  welcomeMessage?: string;
  footerText?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  sessionTimeout: number;
  enableAnalytics: boolean;
}

// Checkout form schema
const checkoutSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  
  // Billing Address
  billingAddress: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "ZIP code is required"),
    country: z.string().default("US")
  }),
  
  // Payment Information
  cardNumber: z.string().min(15, "Card number is required"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be MM/YY format"),
  cvv: z.string().min(3, "CVV is required"),
  
  // Optional
  marketingConsent: z.boolean().default(false),
  savePaymentMethod: z.boolean().default(false)
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutPageProps {
  orderId?: string;
  amount?: number;
  productType?: string;
  customization?: any;
}

// Dynamic background based on configuration
const CheckoutBackground = ({ config }: { config?: any }) => {
  const primaryColor = config?.primaryColor || '#7c3aed';
  const secondaryColor = config?.secondaryColor || '#ec4899';
  const backgroundColor = config?.backgroundColor || '#0f0a19';
  
  return (
    <div className="fixed inset-0 -z-10">
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}80, ${backgroundColor})`
        }}
      />
      
      {/* Animated particles with dynamic colors */}
      {config?.animation === 'enhanced' && [...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: `${primaryColor}40`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, ${primaryColor}10, transparent, ${secondaryColor}10)`
        }}
      />
    </div>
  );
};

// Secure badge component
const SecurityBadges = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.8 }}
    className="flex items-center justify-center space-x-6 mt-6"
  >
    <div className="flex items-center space-x-2 text-sm text-gray-400">
      <Shield className="w-4 h-4 text-green-400" />
      <span>256-bit SSL</span>
    </div>
    <div className="flex items-center space-x-2 text-sm text-gray-400">
      <Lock className="w-4 h-4 text-green-400" />
      <span>PCI Compliant</span>
    </div>
    <div className="flex items-center space-x-2 text-sm text-gray-400">
      <CheckCircle className="w-4 h-4 text-green-400" />
      <span>Secure</span>
    </div>
  </motion.div>
);

export default function BrandedCheckout() {
  const [match, params] = useRoute('/checkout/:orderId?');
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [orderData, setOrderData] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('creditCard');

  // Fetch checkout configuration
  const { data: checkoutConfig } = useQuery<CheckoutConfig>({
    queryKey: ['/api/admin/checkout-config'],
    enabled: true
  });

  // Form setup
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      billingAddress: {
        country: 'US'
      },
      marketingConsent: false,
      savePaymentMethod: false
    }
  });

  // Fetch checkout configuration
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['/api/admin/checkout-config'],
    enabled: true
  });

  // Fetch order details if orderId provided
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['/api/checkout/order', params?.orderId],
    enabled: !!params?.orderId
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (formData: CheckoutFormData) => {
      const response = await fetch('/api/checkout/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderId: params?.orderId,
          orderData: orderData
        })
      });
      if (!response.ok) throw new Error('Payment processing failed');
      return response.json();
    },
    onSuccess: (data) => {
      setStep('success');
      toast({
        title: "Payment Successful!",
        description: "Your order has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Please check your payment details and try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: CheckoutFormData) => {
    setStep('processing');
    processPaymentMutation.mutate(data);
  };

  // Format card number input
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  useEffect(() => {
    if (config) {
      setCheckoutConfig(config);
    }
    if (order) {
      setOrderData(order);
    }
  }, [config, order]);

  if (configLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const brandName = checkoutConfig?.brandName || "SiZu GiftCard";
  const primaryColor = checkoutConfig?.primaryColor || "#7c3aed";
  const secondaryColor = checkoutConfig?.secondaryColor || "#ec4899";
  const textColor = checkoutConfig?.textColor || "#ffffff";

  return (
    <>
      <CheckoutBackground config={checkoutConfig} />
      
      <div className="min-h-screen py-8 px-4 relative">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center space-x-3 mb-4"
            >
              {checkoutConfig?.brandLogo ? (
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img 
                    src={checkoutConfig.brandLogo} 
                    alt={brandName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                  }}
                >
                  <Gift className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 
                  className="text-3xl font-bold bg-clip-text text-transparent"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${checkoutConfig?.accentColor || '#3b82f6'})`,
                    WebkitBackgroundClip: 'text'
                  }}
                >
                  {brandName}
                </h1>
                <p className="text-sm" style={{ color: `${textColor}80` }}>
                  {checkoutConfig?.tagline || 'Secure Checkout'}
                </p>
              </div>
            </motion.div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              {['Details', 'Payment', 'Complete'].map((label, index) => (
                <div key={label} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    step === 'details' && index === 0 ? 'bg-purple-500 border-purple-500 text-white' :
                    step === 'payment' && index === 1 ? 'bg-purple-500 border-purple-500 text-white' :
                    step === 'processing' && index === 2 ? 'bg-purple-500 border-purple-500 text-white' :
                    step === 'success' && index === 2 ? 'bg-green-500 border-green-500 text-white' :
                    'border-gray-600 text-gray-400'
                  }`}>
                    {step === 'success' && index === 2 ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className="ml-2 text-sm text-gray-400">{label}</span>
                  {index < 2 && <div className="w-8 h-0.5 bg-gray-600 mx-4" />}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderData ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">{orderData.productName}</span>
                        <span className="text-white font-semibold">${orderData.amount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Quantity</span>
                        <span className="text-gray-300">{orderData.quantity || 1}</span>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-white">Total</span>
                        <span className="text-2xl text-purple-400">${orderData.total || orderData.amount}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Gift className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">Gift Card Purchase</h3>
                      <p className="text-gray-400 text-sm">Complete your secure checkout</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Checkout Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    {step === 'details' ? 'Contact Information' : 
                     step === 'payment' ? 'Payment Details' : 
                     step === 'processing' ? 'Processing...' : 'Payment Complete'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {step === 'details' && (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">First Name</Label>
                            <Input
                              {...form.register('firstName')}
                              className="bg-white/10 border-white/20 text-white"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Last Name</Label>
                            <Input
                              {...form.register('lastName')}
                              className="bg-white/10 border-white/20 text-white"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-white">Email</Label>
                          <Input
                            {...form.register('email')}
                            type="email"
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="john@example.com"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Phone</Label>
                          <Input
                            {...form.register('phone')}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>

                        <Button
                          onClick={() => setStep('payment')}
                          className="w-full text-white font-semibold transition-all duration-200"
                          style={{
                            background: config ? `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                            border: 'none'
                          }}
                        >
                          Continue to Payment
                        </Button>
                      </motion.div>
                    )}

                    {step === 'payment' && (
                      <motion.div
                        key="payment"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        {/* Payment Method Selection */}
                        <div className="space-y-3">
                          <Label className="text-white font-semibold">Select Payment Method</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {config?.acceptedPaymentMethods?.creditCard && (
                              <Button
                                type="button"
                                variant={selectedPaymentMethod === 'creditCard' ? 'default' : 'outline'}
                                onClick={() => setSelectedPaymentMethod('creditCard')}
                                className={`${
                                  selectedPaymentMethod === 'creditCard' 
                                    ? 'border-white/40 text-white' 
                                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                                }`}
                                style={selectedPaymentMethod === 'creditCard' ? {
                                  background: checkoutConfig ? `linear-gradient(135deg, ${checkoutConfig.primaryColor}, ${checkoutConfig.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                  border: 'none'
                                } : {}}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Credit Card
                              </Button>
                            )}

                            {checkoutConfig?.acceptedPaymentMethods?.applePay && (
                              <Button
                                type="button"
                                variant={selectedPaymentMethod === 'applePay' ? 'default' : 'outline'}
                                onClick={() => setSelectedPaymentMethod('applePay')}
                                className={`${
                                  selectedPaymentMethod === 'applePay' 
                                    ? 'border-white/40 text-white' 
                                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                                }`}
                                style={selectedPaymentMethod === 'applePay' ? {
                                  background: checkoutConfig ? `linear-gradient(135deg, ${checkoutConfig.primaryColor}, ${checkoutConfig.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                  border: 'none'
                                } : {}}
                              >
                                🍎 Apple Pay
                              </Button>
                            )}

                            {checkoutConfig?.acceptedPaymentMethods?.googlePay && (
                              <Button
                                type="button"
                                variant={selectedPaymentMethod === 'googlePay' ? 'default' : 'outline'}
                                onClick={() => setSelectedPaymentMethod('googlePay')}
                                className={`${
                                  selectedPaymentMethod === 'googlePay' 
                                    ? 'border-white/40 text-white' 
                                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                                }`}
                                style={selectedPaymentMethod === 'googlePay' ? {
                                  background: checkoutConfig ? `linear-gradient(135deg, ${checkoutConfig.primaryColor}, ${checkoutConfig.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                  border: 'none'
                                } : {}}
                              >
                                🟡 Google Pay
                              </Button>
                            )}

                            {checkoutConfig?.acceptedPaymentMethods?.cashApp && (
                              <Button
                                type="button"
                                variant={selectedPaymentMethod === 'cashApp' ? 'default' : 'outline'}
                                onClick={() => setSelectedPaymentMethod('cashApp')}
                                className={`${
                                  selectedPaymentMethod === 'cashApp' 
                                    ? 'border-white/40 text-white' 
                                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                                }`}
                                style={selectedPaymentMethod === 'cashApp' ? {
                                  background: checkoutConfig ? `linear-gradient(135deg, ${checkoutConfig.primaryColor}, ${checkoutConfig.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                  border: 'none'
                                } : {}}
                              >
                                💵 Cash App
                              </Button>
                            )}
                          </div>
                        </div>

                        {selectedPaymentMethod === 'creditCard' && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-white">Card Number</Label>
                          <Input
                            {...form.register('cardNumber')}
                            className="bg-white/10 border-white/20 text-white font-mono"
                            placeholder="1234 5678 9012 3456"
                            onChange={(e) => {
                              const formatted = formatCardNumber(e.target.value);
                              form.setValue('cardNumber', formatted);
                            }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Expiry Date</Label>
                            <Input
                              {...form.register('expiryDate')}
                              className="bg-white/10 border-white/20 text-white font-mono"
                              placeholder="MM/YY"
                              onChange={(e) => {
                                const formatted = formatExpiryDate(e.target.value);
                                form.setValue('expiryDate', formatted);
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-white">CVV</Label>
                            <Input
                              {...form.register('cvv')}
                              className="bg-white/10 border-white/20 text-white font-mono"
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              {...form.register('savePaymentMethod')}
                              className="border-white/20"
                            />
                            <Label className="text-sm text-gray-300">Save payment method for future purchases</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              {...form.register('marketingConsent')}
                              className="border-white/20"
                            />
                            <Label className="text-sm text-gray-300">Send me promotional offers and updates</Label>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => setStep('details')}
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={processPaymentMutation.isPending}
                            className="flex-1 text-white font-semibold transition-all duration-200"
                            style={{
                              background: checkoutConfig ? `linear-gradient(135deg, ${checkoutConfig.primaryColor}, ${checkoutConfig.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                              border: 'none'
                            }}
                          >
                            {processPaymentMutation.isPending ? 'Processing...' : 'Complete Payment'}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {step === 'processing' && (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 mx-auto mb-4 border-4 border-purple-400 border-t-transparent rounded-full"
                        />
                        <h3 className="text-white font-semibold mb-2">Processing Payment</h3>
                        <p className="text-gray-400">Please wait while we process your payment...</p>
                      </motion.div>
                    )}

                    {step === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                          className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-white font-semibold mb-2">Payment Successful!</h3>
                        <p className="text-gray-400 mb-6">Your order has been processed successfully.</p>
                        <Button
                          onClick={() => setLocation('/')}
                          className="text-white font-semibold transition-all duration-200"
                          style={{
                            background: checkoutConfig ? `linear-gradient(135deg, ${checkoutConfig.primaryColor}, ${checkoutConfig.secondaryColor})` : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                            border: 'none'
                          }}
                        >
                          Return to Home
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Security badges */}
          <SecurityBadges />

          {/* Admin Configuration Link */}
          <div className="mt-12 text-center">
            <Link to="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Admin: Configure Checkout Branding
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}