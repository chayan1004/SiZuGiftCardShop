import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Package, Truck, Users, Building2, Calculator, Palette, FileText, CheckCircle, AlertCircle, Sparkles, Zap, Star, Layers, Eye, ArrowLeft, Menu, Home, ShoppingCart, Gift, Shield, Crown, Diamond, Flame, Rocket, Hexagon, Activity, Target, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

const customerInfoSchema = z.object({
  // Customer Details
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  emailOptIn: z.boolean().default(false),
  
  // Shipping Address
  shippingAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "ZIP code is required"),
    country: z.string().default('US')
  }),
  
  // Order Details
  cardType: z.enum(['plastic', 'metal', 'premium']),
  quantity: z.number().min(1),
  expeditedShipping: z.boolean().default(false),
  
  // Customization
  customText: z.string().optional(),
  customImage: z.string().optional(),
  selectedEmoji: z.string().optional(),
  themeColor: z.string().optional()
});

const physicalCardOrderSchema = z.object({
  customerType: z.enum(['merchant', 'individual']),
  businessName: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  cardType: z.enum(['plastic', 'metal', 'premium']),
  quantity: z.number().min(1),
  customDesign: z.boolean().default(false),
  designNotes: z.string().optional(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('US')
  }),
  expeditedShipping: z.boolean().default(false)
});

type PhysicalCardOrderForm = z.infer<typeof physicalCardOrderSchema>;
type CustomerInfoForm = z.infer<typeof customerInfoSchema>;

// Premium Physical Card Preview Component
const PhysicalCardPreview = ({ 
  cardType, 
  customDesign, 
  themeColor, 
  customImage,
  customText,
  selectedEmoji 
}: { 
  cardType: 'plastic' | 'metal' | 'premium', 
  customDesign: boolean,
  themeColor: string,
  customImage?: string,
  customText?: string,
  selectedEmoji?: string
}) => {
  const cardStyles = {
    plastic: {
      background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}20)`,
      border: `2px solid ${themeColor}60`,
      shadow: '0 8px 32px rgba(0,0,0,0.1)',
      material: 'Durable PVC'
    },
    metal: {
      background: `linear-gradient(135deg, #c0c0c0, #808080, ${themeColor}30)`,
      border: '2px solid #606060',
      shadow: '0 12px 40px rgba(0,0,0,0.2)',
      material: 'Brushed Metal'
    },
    premium: {
      background: `linear-gradient(135deg, #ffd700, ${themeColor}, #ff6b6b)`,
      border: '3px solid #ffd700',
      shadow: '0 16px 48px rgba(255,215,0,0.3)',
      material: 'Premium Composite'
    }
  };

  const style = cardStyles[cardType];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative w-80 h-48 mx-auto"
    >
      <motion.div
        whileHover={{ scale: 1.05, rotateY: 5 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full rounded-xl p-6 text-white relative overflow-hidden"
        style={{
          background: style.background,
          border: style.border,
          boxShadow: style.shadow,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-10 -right-10 w-32 h-32 opacity-10"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <motion.h3 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold"
              >
                SiZu GiftCard
              </motion.h3>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm opacity-80"
              >
                {style.material}
              </motion.p>
              
              {/* Custom Text Display */}
              {customText && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs mt-1 opacity-90 italic"
                >
                  "{customText}"
                </motion.p>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              {/* Emoji Display - Top Right */}
              {selectedEmoji && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-2xl"
                >
                  {selectedEmoji}
                </motion.div>
              )}
              
              {/* Card Type Icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {cardType === 'premium' ? <Crown className="w-6 h-6" /> : 
                 cardType === 'metal' ? <Diamond className="w-6 h-6" /> : 
                 <Gift className="w-6 h-6" />}
              </motion.div>
            </div>
          </div>
          
          {/* Custom Image Logo - Beside Brand Name */}
          {customImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-6 right-16"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 bg-white/5 backdrop-blur-sm shadow-lg">
                <img 
                  src={customImage} 
                  alt="Custom logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          )}
          
          <div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-mono tracking-widest mb-2"
            >
              •••• •••• •••• 1234
            </motion.div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm opacity-80"
            >
              VALID THRU 12/28
            </motion.div>
          </div>
        </div>
        
        {customDesign && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold"
          >
            CUSTOM
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Premium Navigation Header Component
const PremiumHeader = () => {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/20 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Physical Cards</h1>
                <p className="text-xs text-purple-300">Premium Gift Experience</p>
              </div>
            </motion.div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {[
              { label: 'Home', href: '/', icon: Home },
              { label: 'Digital Cards', href: '/gift-cards', icon: Gift },
              { label: 'Store', href: '/store', icon: ShoppingCart },
            ].map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      location === item.href 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default function PhysicalGiftCardStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCardType, setSelectedCardType] = useState<'plastic' | 'metal' | 'premium'>('plastic');
  const [selectedCustomerType, setSelectedCustomerType] = useState<'merchant' | 'individual'>('individual');
  const [currentPricing, setCurrentPricing] = useState<any>(null);
  const [themeColor, setThemeColor] = useState('#7c3aed');
  const [customDesign, setCustomDesign] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [customImage, setCustomImage] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [orderStep, setOrderStep] = useState<'customization' | 'customer-info' | 'checkout'>('customization');

  // Popular emoji options for gift cards
  const emojiOptions = [
    '🎁', '🎉', '💝', '🎊', '✨', '💫', '🌟', '⭐', 
    '🎈', '🎀', '💖', '💕', '🎂', '🍰', '🥳', '😊',
    '😍', '🤗', '👏', '🎯', '🔥', '💯', '🚀', '🎪'
  ];

  const form = useForm<PhysicalCardOrderForm>({
    resolver: zodResolver(physicalCardOrderSchema),
    defaultValues: {
      customerType: 'individual',
      cardType: 'plastic',
      quantity: 25,
      customDesign: false,
      expeditedShipping: false,
      shippingAddress: {
        country: 'US'
      }
    }
  });

  // Fetch pricing data
  const { data: pricingData, isLoading: isPricingLoading } = useQuery({
    queryKey: ['/api/physical-cards/pricing'],
    enabled: true
  });

  // Calculate pricing mutation
  const calculatePricingMutation = useMutation({
    mutationFn: async (orderData: { cardType: string; quantity: number; customerType: string; customDesign: boolean; expeditedShipping: boolean }) => {
      const response = await fetch('/api/physical-cards/calculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to calculate pricing');
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.pricing) {
        setCurrentPricing(data.pricing);
      }
    },
    onError: (error) => {
      console.error('Pricing calculation error:', error);
      setCurrentPricing(null);
    }
  });

  // Create checkout session mutation for Square Hosted Checkout
  const createCheckoutMutation = useMutation({
    mutationFn: async (orderData: CustomerInfoForm) => {
      const response = await fetch('/api/physical-cards/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutUrl) {
        // Redirect to Square's hosted checkout page
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Invalid checkout response');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Failed",
        description: error.message || "Unable to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: PhysicalCardOrderForm) => {
      const response = await fetch('/api/physical-cards/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to submit order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Submitted Successfully!",
        description: "Your physical gift card order has been received and will be processed within 1-2 business days.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/physical-cards/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "There was an error submitting your order. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PhysicalCardOrderForm) => {
    submitOrderMutation.mutate(data);
  };

  // Customer form setup
  const customerForm = useForm<CustomerInfoForm>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      emailOptIn: false,
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      },
      cardType: "plastic",
      quantity: 1,
      expeditedShipping: false,
      customText: customText,
      customImage: customImage,
      selectedEmoji: selectedEmoji,
      themeColor: themeColor
    }
  });

  const onCustomerSubmit = (data: CustomerInfoForm) => {
    createCheckoutMutation.mutate(data);
  };

  // Update pricing when form values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.cardType && values.quantity && values.customerType !== undefined) {
        calculatePricingMutation.mutate({
          cardType: values.cardType,
          quantity: values.quantity,
          customerType: values.customerType,
          customDesign: values.customDesign || false,
          expeditedShipping: values.expeditedShipping || false
        });
        setSelectedCardType(values.cardType);
        setSelectedCustomerType(values.customerType);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const cardTypes = {
    plastic: {
      name: "Standard Plastic",
      price: "Starting at $2.50",
      description: "Durable PVC cards with full-color printing",
      features: ["Full-color printing", "Magnetic stripe", "Standard durability", "Quick production"]
    },
    metal: {
      name: "Premium Metal",
      price: "Starting at $8.00",
      description: "Luxury metal cards with brushed finish",
      features: ["Brushed metal finish", "Magnetic stripe", "Premium weight", "Engraved details"]
    },
    premium: {
      name: "Ultra Premium",
      price: "Starting at $15.00",
      description: "Ultra-premium cards with custom finishes",
      features: ["Multiple material options", "Custom textures", "Embossed elements", "Luxury packaging"]
    }
  };

  return (
    <>
      <PremiumHeader />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              background: [
                "radial-gradient(circle at 20% 80%, #7c3aed40 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, #ec489940 0%, transparent 50%)",
                "radial-gradient(circle at 40% 40%, #8b5cf640 0%, transparent 50%)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0"
          />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                x: [0, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)],
                y: [0, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
          {/* Enhanced Hero Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6"
            >
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-white">Premium Physical Experience</span>
              <Zap className="w-5 h-5 text-blue-400" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Physical
              <motion.span
                animate={{ 
                  background: [
                    "linear-gradient(45deg, #7c3aed, #ec4899)",
                    "linear-gradient(45deg, #ec4899, #8b5cf6)",
                    "linear-gradient(45deg, #8b5cf6, #7c3aed)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="bg-clip-text ml-4 text-[#fdfdfe]"
                style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}
              >
                Gift Cards
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your gift-giving with premium physical cards featuring custom designs, 
              luxury materials, and seamless activation. From plastic to premium metal finishes.
            </motion.p>

            {/* Live Preview Toggle */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center justify-center space-x-4"
            >
              <span className="text-sm text-gray-300">Live Preview</span>
              <Switch
                checked={previewMode}
                onCheckedChange={setPreviewMode}
                className="data-[state=checked]:bg-purple-600"
              />
              <Eye className="w-4 h-4 text-gray-300" />
            </motion.div>
          </motion.div>

          {/* Live Preview Section */}
          <AnimatePresence>
            {previewMode && (
              <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -50, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">Live Preview</h2>
                  <p className="text-gray-300">See your customizations in real-time</p>
                </div>
                
                <PhysicalCardPreview 
                  cardType={selectedCardType}
                  customDesign={customDesign}
                  themeColor={themeColor}
                  customImage={customImage}
                  customText={customText}
                  selectedEmoji={selectedEmoji}
                />
                
                {/* Customization Controls */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 max-w-md mx-auto"
                >
                  <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Customize Your Card
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Image Upload Section */}
                      <div className="space-y-3">
                        <Label className="text-white text-sm font-medium flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Custom Image
                        </Label>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setCustomImage(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="bg-white/10 border-white/20 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                          />
                          {customImage && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded border border-white/20 overflow-hidden">
                                <img src={customImage} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCustomImage('')}
                                className="text-red-400 hover:text-red-300 h-6 px-2"
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Custom Text Section */}
                      <div className="space-y-3">
                        <Label className="text-white text-sm font-medium flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Custom Message
                        </Label>
                        <Input
                          placeholder="Happy Birthday! 🎉"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          maxLength={50}
                        />
                        <p className="text-xs text-gray-400">{customText.length}/50 characters</p>
                      </div>

                      {/* Emoji Selection */}
                      <div className="space-y-3">
                        <Label className="text-white text-sm font-medium flex items-center gap-2">
                          <span className="text-lg">😊</span>
                          Choose Emoji (Top Right)
                        </Label>
                        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                          {emojiOptions.map((emoji, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                              className={`w-8 h-8 rounded-lg border transition-all ${
                                selectedEmoji === emoji 
                                  ? 'border-purple-400 bg-purple-500/30' 
                                  : 'border-white/20 hover:border-white/40'
                              } flex items-center justify-center text-lg`}
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                        {selectedEmoji && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEmoji('')}
                            className="text-red-400 hover:text-red-300 w-full h-8"
                          >
                            Clear Emoji
                          </Button>
                        )}
                      </div>

                      {/* Theme Color Picker */}
                      <div className="space-y-3">
                        <Label className="text-white text-sm font-medium">Theme Color</Label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                          />
                          <div className="flex-1">
                            <Slider
                              value={[parseInt(themeColor.slice(1), 16)]}
                              onValueChange={([value]) => {
                                const hex = value.toString(16).padStart(6, '0');
                                setThemeColor(`#${hex}`);
                              }}
                              max={16777215}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                        
                        {/* Quick Color Presets */}
                        <div className="flex space-x-2">
                          {['#7c3aed', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'].map((color) => (
                            <motion.button
                              key={color}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setThemeColor(color)}
                              className="w-8 h-8 rounded-full border-2 border-white/30 cursor-pointer"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Design Toggle */}
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm font-medium">Custom Design</Label>
                        <Switch
                          checked={customDesign}
                          onCheckedChange={setCustomDesign}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="order" className="w-full">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2">
                  {[
                    { value: "order", icon: Package, label: "Order Cards", gradient: "from-purple-500 to-pink-500" },
                    { value: "activate", icon: CreditCard, label: "Activate Card", gradient: "from-blue-500 to-cyan-500" },
                    { value: "balance", icon: CheckCircle, label: "Check Balance", gradient: "from-green-500 to-emerald-500" },
                    { value: "reload", icon: Calculator, label: "Reload Card", gradient: "from-orange-500 to-red-500" }
                  ].map((tab, index) => (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value} 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300 rounded-xl py-3"
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>

              <TabsContent value="order" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid lg:grid-cols-3 gap-6"
                >
                  {/* Order Form */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-6">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <CardTitle className="flex items-center gap-3 text-white text-2xl">
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
                            >
                              <Package className="h-6 w-6 text-white" />
                            </motion.div>
                            Order Physical Gift Cards
                          </CardTitle>
                          <CardDescription className="text-gray-300 text-lg mt-2">
                            Create premium physical gift cards with custom designs and luxury materials
                          </CardDescription>
                        </motion.div>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          {/* Customer Type Selection */}
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-3"
                          >
                            <Label className="text-white text-sm font-medium">Customer Type</Label>
                            <Select onValueChange={(value) => form.setValue('customerType', value as 'merchant' | 'individual')}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select customer type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="individual">Individual Customer</SelectItem>
                                <SelectItem value="merchant">Business/Merchant</SelectItem>
                              </SelectContent>
                            </Select>
                          </motion.div>

                          {/* Card Type Selection */}
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-3"
                          >
                            <Label className="text-white text-sm font-medium">Card Material</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {Object.entries(cardTypes).map(([type, info]) => (
                                <motion.div
                                  key={type}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    selectedCardType === type
                                      ? 'border-purple-400 bg-purple-500/20'
                                      : 'border-white/20 bg-white/5 hover:border-white/40'
                                  }`}
                                  onClick={() => {
                                    form.setValue('cardType', type as 'plastic' | 'metal' | 'premium');
                                    setSelectedCardType(type as 'plastic' | 'metal' | 'premium');
                                  }}
                                >
                                  <div className="text-center">
                                    <h3 className="text-white font-semibold">{info.name}</h3>
                                    <p className="text-purple-300 text-sm">{info.price}</p>
                                    <div className="mt-2 flex justify-center">
                                      {type === 'premium' ? <Crown className="w-6 h-6 text-yellow-400" /> : 
                                       type === 'metal' ? <Diamond className="w-6 h-6 text-gray-400" /> : 
                                       <CreditCard className="w-6 h-6 text-blue-400" />}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                          {/* Quantity and Custom Design */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="space-y-2"
                            >
                              <Label className="text-white text-sm font-medium">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                                placeholder="25"
                                {...form.register('quantity', { valueAsNumber: true })}
                              />
                            </motion.div>

                            <motion.div
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="space-y-2"
                            >
                              <Label className="text-white text-sm font-medium">Contact Email</Label>
                              <Input
                                type="email"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                                placeholder="you@company.com"
                                {...form.register('contactEmail')}
                              />
                            </motion.div>
                          </div>

                          {/* Proceed to Checkout Button */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="pt-4"
                          >
                            <Button 
                              type="button"
                              onClick={() => setOrderStep('customer-info')}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl"
                            >
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Proceed to Checkout
                              </div>
                            </Button>
                          </motion.div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pricing Summary */}
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl border border-white/20 sticky top-24">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          Pricing Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {calculatePricingMutation.isPending ? (
                          <div className="text-center text-gray-400">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                            Calculating pricing...
                          </div>
                        ) : currentPricing && currentPricing.basePrice !== undefined ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between text-white">
                                <span>Base Price:</span>
                                <span>${(currentPricing.basePrice || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-white">
                                <span>Square Fee:</span>
                                <span>${(currentPricing.squareFee || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-white">
                                <span>Our Fee:</span>
                                <span>${(currentPricing.ourFee || 0).toFixed(2)}</span>
                              </div>
                              <Separator className="bg-white/20" />
                              <div className="flex justify-between text-white font-bold text-lg">
                                <span>Total:</span>
                                <span>${(currentPricing.totalPrice || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="w-full justify-center bg-green-500/20 text-green-300">
                              {currentPricing.savings > 0 && `Save $${(currentPricing.savings || 0).toFixed(2)} with bulk pricing`}
                            </Badge>
                          </motion.div>
                        ) : (
                          <div className="text-center text-gray-400">
                            Configure your order to see pricing
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* Other Tabs */}
              <TabsContent value="activate" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Activate Physical Card
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Activate your physical gift card and link it to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-white">Card Number</Label>
                          <Input
                            placeholder="SIZU12345678901234"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400 font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Your Email</Label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          />
                        </div>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Activate Card
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="balance" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Check Card Balance
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Check the current balance on your physical gift card
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-white">Card Number</Label>
                          <Input
                            placeholder="SIZU12345678901234"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400 font-mono"
                          />
                        </div>
                        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Check Balance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="reload" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Reload Card Balance
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Add funds to your existing physical gift card
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-white">Card Number</Label>
                          <Input
                            placeholder="SIZU12345678901234"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400 font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Reload Amount</Label>
                          <Input
                            type="number"
                            placeholder="50.00"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          />
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                          <Calculator className="w-4 h-4 mr-2" />
                          Reload Card
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Customer Information Form Modal */}
          <AnimatePresence>
            {orderStep === 'customer-info' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Customer Information</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrderStep('customization')}
                      className="text-white hover:bg-white/10"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>

                  <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">First Name</Label>
                          <Input
                            {...customerForm.register('firstName')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="John"
                          />
                          {customerForm.formState.errors.firstName && (
                            <p className="text-red-400 text-sm">{customerForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Last Name</Label>
                          <Input
                            {...customerForm.register('lastName')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="Doe"
                          />
                          {customerForm.formState.errors.lastName && (
                            <p className="text-red-400 text-sm">{customerForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Email Address</Label>
                        <Input
                          {...customerForm.register('email')}
                          type="email"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          placeholder="john.doe@example.com"
                        />
                        {customerForm.formState.errors.email && (
                          <p className="text-red-400 text-sm">{customerForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Phone Number</Label>
                        <Input
                          {...customerForm.register('phone')}
                          type="tel"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          placeholder="+1 (555) 123-4567"
                        />
                        {customerForm.formState.errors.phone && (
                          <p className="text-red-400 text-sm">{customerForm.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          {...customerForm.register('emailOptIn')}
                          id="emailOptIn"
                        />
                        <Label htmlFor="emailOptIn" className="text-white text-sm">
                          I want to receive updates and offers via email
                        </Label>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Shipping Address</h3>
                      <div className="space-y-2">
                        <Label className="text-white">Street Address</Label>
                        <Input
                          {...customerForm.register('shippingAddress.street')}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          placeholder="123 Main Street"
                        />
                        {customerForm.formState.errors.shippingAddress?.street && (
                          <p className="text-red-400 text-sm">{customerForm.formState.errors.shippingAddress.street.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">City</Label>
                          <Input
                            {...customerForm.register('shippingAddress.city')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="New York"
                          />
                          {customerForm.formState.errors.shippingAddress?.city && (
                            <p className="text-red-400 text-sm">{customerForm.formState.errors.shippingAddress.city.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">State</Label>
                          <Input
                            {...customerForm.register('shippingAddress.state')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="NY"
                          />
                          {customerForm.formState.errors.shippingAddress?.state && (
                            <p className="text-red-400 text-sm">{customerForm.formState.errors.shippingAddress.state.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">ZIP Code</Label>
                          <Input
                            {...customerForm.register('shippingAddress.zipCode')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="10001"
                          />
                          {customerForm.formState.errors.shippingAddress?.zipCode && (
                            <p className="text-red-400 text-sm">{customerForm.formState.errors.shippingAddress.zipCode.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Options */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Order Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Card Type</Label>
                          <Select {...customerForm.register('cardType')}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select card type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="plastic">Standard Plastic</SelectItem>
                              <SelectItem value="metal">Premium Metal</SelectItem>
                              <SelectItem value="premium">Ultra Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Quantity</Label>
                          <Input
                            {...customerForm.register('quantity', { valueAsNumber: true })}
                            type="number"
                            min="1"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          {...customerForm.register('expeditedShipping')}
                          id="expeditedShipping"
                        />
                        <Label htmlFor="expeditedShipping" className="text-white text-sm">
                          Expedited Shipping (+$15)
                        </Label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOrderStep('customization')}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Back to Customization
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCheckoutMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {createCheckoutMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Creating Checkout...
                          </div>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Proceed to Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}