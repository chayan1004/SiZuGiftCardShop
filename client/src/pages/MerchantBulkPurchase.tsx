import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CreditCard, Package, Calculator, 
  ShoppingCart, DollarSign, CheckCircle, AlertCircle,
  Info, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface PricingTier {
  name: string;
  minQuantity: number;
  maxQuantity: number;
  discountPercentage: number;
}

interface BulkOrderRequest {
  quantity: number;
  unit_price: number;
}

export default function MerchantBulkPurchase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [quantity, setQuantity] = useState<number>(25);
  const [unitPrice, setUnitPrice] = useState<number>(25.00);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check authentication
  const merchantToken = localStorage.getItem('merchantToken');
  
  if (!merchantToken) {
    window.location.href = '/merchant-login';
    return null;
  }

  // Fetch pricing tiers
  const { data: pricingTiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: async () => {
      const response = await fetch('/api/merchant/pricing-tiers', {
        headers: {
          'x-merchant-token': merchantToken
        }
      });
      const data = await response.json();
      return data.tiers || [];
    }
  });

  // Calculate pricing based on quantity
  const getCurrentTier = (): PricingTier | null => {
    return pricingTiers.find((tier: PricingTier) => 
      quantity >= tier.minQuantity && quantity <= tier.maxQuantity
    ) || null;
  };

  const calculateDiscountedPrice = (): number => {
    const tier = getCurrentTier();
    if (!tier) return unitPrice;
    
    const discount = tier.discountPercentage / 100;
    return unitPrice * (1 - discount);
  };

  const totalPrice = quantity * calculateDiscountedPrice();
  const currentTier = getCurrentTier();
  const savings = quantity * (unitPrice - calculateDiscountedPrice());

  // Create bulk order mutation
  const createBulkOrderMutation = useMutation({
    mutationFn: async (orderData: BulkOrderRequest) => {
      const response = await fetch('/api/merchant/bulk-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-token': merchantToken
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
        title: "Order created successfully",
        description: `Bulk order ${data.order.id} has been created and is pending payment.`
      });
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['merchant-bulk-orders'] });
      
      // Redirect to payment processing or success page
      setLocation('/merchant-dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity (minimum 1).",
        variant: "destructive"
      });
      return;
    }
    
    if (unitPrice < 1) {
      toast({
        title: "Invalid unit price",
        description: "Please enter a valid unit price (minimum $1.00).",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    const orderData: BulkOrderRequest = {
      quantity,
      unit_price: calculateDiscountedPrice()
    };

    createBulkOrderMutation.mutate(orderData);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const predefinedQuantities = [10, 25, 50, 100, 250, 500];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation('/merchant-dashboard')}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Bulk Gift Card Purchase</h1>
              <p className="text-gray-300">Create gift cards in bulk with volume discounts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Pricing Tiers Info */}
        {!tiersLoading && pricingTiers.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Volume Pricing Tiers
              </CardTitle>
              <CardDescription className="text-gray-300">
                Save more with larger orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pricingTiers.map((tier: PricingTier) => (
                  <div
                    key={tier.name}
                    className={`p-4 rounded-lg border ${
                      currentTier?.name === tier.name
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="text-white font-semibold">{tier.name}</div>
                    <div className="text-sm text-gray-300">
                      {tier.minQuantity}-{tier.maxQuantity} cards
                    </div>
                    <div className="text-lg font-bold text-green-400">
                      {tier.discountPercentage}% off
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Form */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure your bulk gift card order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quantity Selection */}
                <div className="space-y-3">
                  <Label className="text-white">Quantity</Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {predefinedQuantities.map((qty) => (
                      <Button
                        key={qty}
                        type="button"
                        variant={quantity === qty ? "default" : "outline"}
                        size="sm"
                        className={
                          quantity === qty
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "border-white/20 text-white hover:bg-white/10"
                        }
                        onClick={() => setQuantity(qty)}
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
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                    placeholder="Custom quantity"
                  />
                </div>

                {/* Unit Price */}
                <div className="space-y-3">
                  <Label className="text-white">Base Unit Price (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      max="1000"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                      placeholder="25.00"
                    />
                  </div>
                </div>

                {/* Custom Message */}
                <div className="space-y-3">
                  <Label className="text-white">Custom Message (Optional)</Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a custom message to all gift cards in this order..."
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-400">
                    {customMessage.length}/200 characters
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Order Summary
              </CardTitle>
              <CardDescription className="text-gray-300">
                Review your order before checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Quantity:</span>
                  <span className="text-white font-semibold">{quantity} cards</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Base price per card:</span>
                  <span className="text-white">{formatCurrency(unitPrice)}</span>
                </div>

                {currentTier && currentTier.discountPercentage > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Discount ({currentTier.name}):</span>
                      <span className="text-green-400">-{currentTier.discountPercentage}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Discounted price per card:</span>
                      <span className="text-white">{formatCurrency(calculateDiscountedPrice())}</span>
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
                    <span className="text-gray-300">You save:</span>
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
                disabled={isProcessing || quantity < 1 || unitPrice < 1}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3"
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

        {/* Additional Info */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
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
  );
}