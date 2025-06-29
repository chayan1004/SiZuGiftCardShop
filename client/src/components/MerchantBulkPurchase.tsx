import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CreditCard, Package, DollarSign, Users, ShoppingCart, Download, Gift } from 'lucide-react';

interface PricingTier {
  name: string;
  minQuantity: number;
  maxQuantity: number;
  discountPercentage: number;
}

interface BulkOrder {
  id: number;
  bulkOrderId: string;
  merchantId: string;
  cardAmount: number;
  quantity: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  customMessage?: string;
  logoUrl?: string;
  status: string;
  squarePaymentId?: string;
  createdAt: string;
  completedAt?: string;
  formattedTotal: string;
  formattedCardAmount: string;
}

interface MerchantGiftCard {
  id: number;
  gan: string;
  merchantId: string;
  bulkOrderId: string;
  amount: number;
  customMessage?: string;
  logoUrl?: string;
  status: string;
  squareGiftCardId?: string;
  createdAt: string;
  formattedAmount: string;
}

export default function MerchantBulkPurchase() {
  const [amount, setAmount] = useState<number>(2500); // Default $25
  const [quantity, setQuantity] = useState<number>(10);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  // Fetch pricing tiers
  const { data: tiersData } = useQuery({
    queryKey: ['/api/merchant/pricing-tiers'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch bulk orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/merchant/giftcards/bulk-orders'],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch merchant gift cards
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/merchant/giftcards/my-cards'],
    staleTime: 30 * 1000,
  });

  const tiers: PricingTier[] = (tiersData as any)?.tiers || [];
  const orders: BulkOrder[] = (ordersData as any)?.orders || [];
  const cards: MerchantGiftCard[] = (cardsData as any)?.cards || [];

  // Calculate pricing based on quantity
  useEffect(() => {
    const applicableTier = tiers.find(tier => 
      quantity >= tier.minQuantity && 
      (tier.maxQuantity === -1 || quantity <= tier.maxQuantity)
    );
    setSelectedTier(applicableTier || null);
  }, [quantity, tiers]);

  const calculatePricing = () => {
    const subtotal = amount * quantity;
    const discount = selectedTier ? Math.floor(subtotal * selectedTier.discountPercentage / 100) : 0;
    const total = subtotal - discount;
    
    return {
      subtotal,
      discount,
      total,
      savings: discount > 0 ? `${selectedTier?.discountPercentage}% off` : null
    };
  };

  const pricing = calculatePricing();

  // Bulk purchase mutation
  const bulkPurchaseMutation = useMutation({
    mutationFn: async (purchaseData: any) => {
      const response = await apiRequest('/api/merchant/giftcards/bulk', 'POST', purchaseData);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bulk Purchase Successful",
        description: `Created ${data.cards?.length || 0} gift cards successfully`,
      });
      
      // Reset form
      setAmount(2500);
      setQuantity(10);
      setCustomMessage('');
      setLogoUrl('');
      setShowPayment(false);
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/giftcards/bulk-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/giftcards/my-cards'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to process bulk purchase",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!amount || !quantity) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid amount and quantity",
        variant: "destructive",
      });
      return;
    }

    if (amount < 500 || amount > 50000) {
      toast({
        title: "Invalid Amount",
        description: "Card amount must be between $5 and $500",
        variant: "destructive",
      });
      return;
    }

    if (quantity < 1 || quantity > 10000) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be between 1 and 10,000",
        variant: "destructive",
      });
      return;
    }

    // For demo purposes, we'll simulate a payment source
    // In production, this would integrate with Square Web SDK
    const mockSourceId = `mock_source_${Date.now()}`;
    
    bulkPurchaseMutation.mutate({
      amount,
      quantity,
      customMessage: customMessage || undefined,
      logoUrl: logoUrl || undefined,
      sourceId: mockSourceId,
    });
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Bulk Purchase Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Bulk Gift Card Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gift Card Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Card Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="5"
                  max="500"
                  step="5"
                  value={amount / 100}
                  onChange={(e) => setAmount(Math.floor(parseFloat(e.target.value) * 100))}
                  className="pl-10"
                  placeholder="25.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10000"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="pl-10"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personalized message for your gift cards..."
              className="min-h-[80px]"
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL (Optional)</Label>
            <Input
              id="logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://your-business.com/logo.png"
            />
          </div>

          {/* Pricing Breakdown */}
          {quantity > 0 && amount > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Subtotal ({quantity} cards)</span>
                <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
              </div>
              
              {pricing.discount > 0 && selectedTier && (
                <>
                  <div className="flex items-center justify-between text-green-600">
                    <span className="text-sm flex items-center gap-2">
                      Bulk Discount ({selectedTier.name})
                      <Badge variant="secondary" className="text-xs">
                        {selectedTier.discountPercentage}% off
                      </Badge>
                    </span>
                    <span className="font-medium">-{formatCurrency(pricing.discount)}</span>
                  </div>
                  <Separator />
                </>
              )}
              
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(pricing.total)}</span>
              </div>
              
              {pricing.savings && (
                <div className="text-center text-sm text-green-600 font-medium">
                  You save {formatCurrency(pricing.discount)} with bulk pricing!
                </div>
              )}
            </div>
          )}

          {/* Pricing Tiers Display */}
          {tiers.length > 0 && (
            <div className="space-y-3">
              <Label>Bulk Pricing Tiers</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {tiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      selectedTier?.name === tier.name 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted'
                    }`}
                  >
                    <div className="text-sm font-medium">{tier.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tier.minQuantity}+ cards
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {tier.discountPercentage}% off
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={bulkPurchaseMutation.isPending || !amount || !quantity}
            className="w-full"
            size="lg"
          >
            {bulkPurchaseMutation.isPending ? (
              <>Processing...</>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Purchase {quantity} Gift Cards for {formatCurrency(pricing.total)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Bulk Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-4">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bulk orders yet</p>
              <p className="text-sm">Create your first bulk purchase above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.bulkOrderId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {order.quantity} × {order.formattedCardAmount} cards
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order #{order.bulkOrderId.slice(-8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="font-semibold">{order.formattedTotal}</div>
                    <Badge 
                      variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Gift Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            My Gift Cards ({cards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cardsLoading ? (
            <div className="text-center py-4">Loading gift cards...</div>
          ) : cards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No gift cards yet</p>
              <p className="text-sm">Purchase bulk gift cards to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.slice(0, 12).map((card) => (
                <div
                  key={card.gan}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {card.formattedAmount}
                    </Badge>
                    <Badge 
                      variant={card.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {card.status}
                    </Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {card.gan}
                  </div>
                  
                  {card.customMessage && (
                    <div className="text-xs text-muted-foreground italic">
                      "{card.customMessage}"
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(card.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}