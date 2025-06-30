import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CreditCard, Package, Calculator, 
  ShoppingCart, DollarSign, CheckCircle, AlertCircle,
  Info, Loader2, Menu, X, Home, Users, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface PricingTier {
  id: number;
  merchantId: number;
  minQuantity: number;
  pricePerUnit: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MerchantBranding {
  id: number;
  merchantId: number;
  logoUrl: string | null;
  themeColor: string;
  tagline: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BulkOrderRequest {
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function MerchantBulkPurchase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [quantity, setQuantity] = useState<number>(25);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check authentication
  const merchantToken = localStorage.getItem('merchantToken');
  
  useEffect(() => {
    if (!merchantToken) {
      console.log('❌ No merchant token found, redirecting to login');
      window.location.href = '/merchant-login';
      return;
    }

    // Validate JWT token
    if (merchantToken.startsWith('eyJ')) {
      try {
        const payload = JSON.parse(atob(merchantToken.split('.')[1]));
        console.log('🔍 Validating merchant token for bulk purchase:', {
          role: payload.role,
          merchantId: payload.merchantId,
          exp: new Date(payload.exp * 1000).toISOString(),
          isValid: payload.exp > Date.now() / 1000
        });

        if (payload.role !== 'merchant' || payload.exp <= Date.now() / 1000) {
          console.log('❌ Invalid or expired token, clearing storage and redirecting');
          localStorage.removeItem('merchantToken');
          localStorage.removeItem('merchantData');
          window.location.href = '/merchant-login';
          return;
        }
      } catch (error) {
        console.error('❌ Token validation failed:', error);
        localStorage.removeItem('merchantToken');
        localStorage.removeItem('merchantData');
        window.location.href = '/merchant-login';
        return;
      }
    } else {
      console.log('❌ Invalid token format, redirecting to login');
      window.location.href = '/merchant-login';
      return;
    }
  }, [merchantToken]);

  if (!merchantToken) {
    return null;
  }

  // Fetch real pricing tiers from database
  const { data: pricingTiersResponse, isLoading: tiersLoading } = useQuery({
    queryKey: ['/api/merchant/pricing-tiers'],
    enabled: !!merchantToken,
  });

  const pricingTiers = pricingTiersResponse?.tiers || [];

  // Fetch merchant branding
  const { data: brandingResponse } = useQuery({
    queryKey: ['/api/merchant/branding'],
    enabled: !!merchantToken,
  });

  const branding = brandingResponse?.branding;

  // Calculate pricing based on quantity tiers
  const getCurrentTier = () => {
    if (pricingTiers.length === 0) return null;
    
    // Find the highest tier that the quantity qualifies for
    const sortedTiers = [...pricingTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    return sortedTiers.find((tier) => quantity >= tier.minQuantity) || pricingTiers[0];
  };

  const currentTier = getCurrentTier();
  const currentUnitPrice = currentTier ? currentTier.pricePerUnit / 100 : 25.00; // Convert cents to dollars
  const totalPrice = quantity * currentUnitPrice;
  const basePrice = 25.00; // Base price for savings calculation
  const savings = quantity * (basePrice - currentUnitPrice);

  // Create bulk order mutation using apiRequest utility
  const createBulkOrderMutation = useMutation({
    mutationFn: async (orderData: BulkOrderRequest) => {
      const response = await fetch('/api/merchant/bulk-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${merchantToken}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create bulk order');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Placed!",
        description: `Successfully created order for ${quantity} gift cards`,
      });
      queryClient.invalidateQueries({ queryKey: ['merchant-bulk-orders'] });
      setLocation('/merchant-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to create bulk order",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    if (quantity < 1 || currentUnitPrice < 1) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid quantity",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      await createBulkOrderMutation.mutateAsync({
        quantity,
        unit_price: currentUnitPrice,
        total_price: totalPrice
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const quickQuantities = [10, 25, 50, 100, 250, 500];

  // Mobile Navigation Component
  const MobileNavigation = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/merchant-dashboard')}
            className="text-white hover:bg-white/10 p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Bulk Purchase</h1>
            <p className="text-xs text-[#dd4bae]">Buy Gift Cards</p>
          </div>
        </div>
        
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="text-[#613791] hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-black/95 backdrop-blur-xl border-white/10">
            <div className="flex flex-col space-y-4 mt-8">
              <Button
                variant="ghost"
                className="justify-start text-[#613791] hover:bg-white/10"
                onClick={() => {
                  setLocation('/merchant-dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-[#613791] hover:bg-white/10"
                onClick={() => {
                  setLocation('/merchant-dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                My Gift Cards
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start text-[#613791] hover:bg-white/10"
                onClick={() => {
                  setLocation('/merchant-dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Package className="w-4 h-4 mr-2" />
                Order History
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <div className="hidden lg:flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => setLocation('/merchant-dashboard')}
          className="border-white/20 text-[#613791] hover:bg-white/10 hover:text-[#613791] hover:border-white/30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Bulk Gift Card Purchase</h1>
          <p className="text-[#dd4bae]">Create gift cards in bulk with volume discounts</p>
        </div>
      </div>
    </div>
  );

  // Pricing Tiers Component
  const PricingTiersDisplay = () => (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20 mb-6 lg:mb-8">
      <CardHeader className="pb-3 lg:pb-6">
        <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
          <TrendingUp className="w-5 h-5" />
          Volume Pricing Tiers
        </CardTitle>
        <CardDescription className="text-[#dd4bae]">
          Save more with higher quantities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tiersLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-[#dd4bae] text-sm">Loading pricing...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {pricingTiers.map((tier: PricingTier, index: number) => {
              const tierName = `Tier ${index + 1}`;
              const unitPrice = tier.pricePerUnit / 100;
              const discountPercentage = Math.round(((25 - unitPrice) / 25) * 100);
              
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 lg:p-4 rounded-lg border transition-all ${
                    currentTier?.id === tier.id
                      ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/25'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm lg:text-base">{tierName}</h3>
                    {discountPercentage > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        {discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#dd4bae] text-xs lg:text-sm">
                    {tier.minQuantity}+ cards • ${unitPrice.toFixed(2)} each
                  </p>
                  {currentTier?.id === tier.id && (
                    <p className="text-green-400 text-xs mt-1">✓ Current selection</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Apply merchant branding theme
  const themeColor = branding?.themeColor || '#6366f1';
  const dynamicStyles = {
    '--brand-color': themeColor,
    '--brand-color-light': `${themeColor}20`,
    '--brand-color-border': `${themeColor}50`,
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-green-900 via-black to-emerald-900"
      style={dynamicStyles}
    >
      <MobileNavigation />
      
      {/* Main Content */}
      <div className="pt-20 lg:pt-8 px-4 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <DesktopHeader />
          <PricingTiersDisplay />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Order Configuration */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader className="pb-3 lg:pb-6">
                  <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                    <Package className="w-5 h-5" />
                    Order Configuration
                  </CardTitle>
                  <CardDescription className="text-[#dd4bae]">
                    Configure your bulk gift card order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form className="space-y-6">
                    {/* Quick Quantity Selection */}
                    <div className="space-y-3">
                      <Label className="text-white text-sm lg:text-base">Quick Quantity Selection</Label>
                      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
                        {quickQuantities.map((qty) => (
                          <Button
                            key={qty}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(qty)}
                            className={`border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30 text-[#613791] ${
                              quantity === qty ? 'bg-white/20 border-white/40' : ''
                            }`}
                          >
                            {qty}
                          </Button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max="10000"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="bg-white/5 border-white/20 text-[#613791] placeholder-[#dd4bae]"
                        placeholder="Custom quantity"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="space-y-3">
                      <Label className="text-white text-sm lg:text-base">Base Unit Price (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#dd4bae] w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          min="1"
                          max="1000"
                          value={currentUnitPrice}
                          disabled
                          className="pl-10 bg-white/5 border-white/20 text-[#613791] placeholder-[#dd4bae]"
                          placeholder="25.00"
                        />
                      </div>
                    </div>

                    {/* Custom Message */}
                    <div className="space-y-3">
                      <Label className="text-white text-sm lg:text-base">Custom Message (Optional)</Label>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Add a custom message to all gift cards in this order..."
                        className="bg-white/5 border-white/20 text-[#613791] placeholder-[#dd4bae] resize-none"
                        rows={3}
                        maxLength={200}
                      />
                      <div className="text-xs text-[#dd4bae]">
                        {customMessage.length}/200 characters
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 sticky top-24">
                <CardHeader className="pb-3 lg:pb-6">
                  <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                    <Calculator className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                  <CardDescription className="text-[#dd4bae]">
                    Review your order before checkout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#dd4bae] text-sm">Quantity:</span>
                      <span className="text-white font-semibold">{quantity} cards</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[#dd4bae] text-sm">Base price per card:</span>
                      <span className="text-white">{formatCurrency(currentUnitPrice)}</span>
                    </div>

                    {currentTier && currentTier.discountPercentage > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[#dd4bae] text-sm">Discount ({currentTier.name}):</span>
                          <span className="text-green-400">-{currentTier.discountPercentage}%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[#dd4bae] text-sm">Discounted price per card:</span>
                          <span className="text-white">{formatCurrency(currentUnitPrice)}</span>
                        </div>
                      </>
                    )}

                    <hr className="border-white/20" />
                    
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-white font-semibold">Total:</span>
                      <span className="text-white font-bold">{formatCurrency(totalPrice)}</span>
                    </div>

                    {savings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#dd4bae] text-sm">You save:</span>
                        <span className="text-green-400 font-semibold">{formatCurrency(savings)}</span>
                      </div>
                    )}

                    {currentTier && (
                      <Badge className="w-full justify-center bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {currentTier.name} Tier Applied
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing || quantity < 1 || currentUnitPrice < 1}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create Bulk Order - {formatCurrency(totalPrice)}
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-gray-400 text-center">
                    Your order will be created and marked as pending payment. 
                    You'll be redirected to complete the payment process.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 mt-6 lg:mt-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                  <h3 className="text-white font-semibold">Instant Delivery</h3>
                  <p className="text-gray-300 text-sm">
                    Gift cards are generated immediately after payment confirmation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <CreditCard className="w-8 h-8 text-blue-400 mx-auto" />
                  <h3 className="text-white font-semibold">Secure Payment</h3>
                  <p className="text-gray-300 text-sm">
                    All payments are processed securely through Square
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Package className="w-8 h-8 text-purple-400 mx-auto" />
                  <h3 className="text-white font-semibold">Bulk Management</h3>
                  <p className="text-gray-300 text-sm">
                    Track and manage all your gift cards from the merchant dashboard
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