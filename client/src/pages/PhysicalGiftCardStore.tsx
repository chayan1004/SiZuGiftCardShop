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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Package, Truck, Users, Building2, Calculator, Palette, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Form validation schema
const physicalCardOrderSchema = z.object({
  cardType: z.enum(['plastic', 'metal', 'premium']),
  quantity: z.number().min(1).max(10000),
  denomination: z.number().min(500).max(50000), // $5 to $500 in cents
  customerType: z.enum(['merchant', 'individual']),
  customDesign: z.boolean().default(false),
  shippingMethod: z.enum(['standard', 'expedited', 'overnight']).default('standard'),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerId: z.string().optional(),
  shippingAddress: z.string().min(5),
  shippingCity: z.string().min(2),
  shippingState: z.string().min(2),
  shippingZip: z.string().min(5).max(10),
  shippingCountry: z.string().default('US'),
  notes: z.string().optional()
});

type PhysicalCardOrderForm = z.infer<typeof physicalCardOrderSchema>;

export default function PhysicalGiftCardStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCardType, setSelectedCardType] = useState<'plastic' | 'metal' | 'premium'>('plastic');
  const [selectedCustomerType, setSelectedCustomerType] = useState<'merchant' | 'individual'>('individual');
  const [currentPricing, setCurrentPricing] = useState<any>(null);

  const form = useForm<PhysicalCardOrderForm>({
    resolver: zodResolver(physicalCardOrderSchema),
    defaultValues: {
      cardType: 'plastic',
      quantity: 1,
      denomination: 2500, // $25 default
      customerType: 'individual',
      customDesign: false,
      shippingMethod: 'standard',
      shippingCountry: 'US'
    }
  });

  // Get pricing tiers
  const { data: pricingTiers, isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/physical-cards/pricing', selectedCardType, selectedCustomerType],
    queryFn: async () => {
      const response = await fetch(`/api/physical-cards/pricing/${selectedCardType}/${selectedCustomerType}`);
      return response.json();
    },
    enabled: !!selectedCardType && !!selectedCustomerType
  });

  // Calculate pricing mutation
  const calculatePricingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/physical-cards/calculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentPricing(data.pricing);
      }
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: PhysicalCardOrderForm) => {
      const response = await fetch('/api/physical-cards/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Order Created Successfully",
          description: `Your physical gift card order has been created. Order ID: ${data.order.id}`,
        });
        form.reset();
        setCurrentPricing(null);
        queryClient.invalidateQueries({ queryKey: ['/api/physical-cards'] });
      } else {
        toast({
          title: "Order Failed",
          description: data.message || "Failed to create order",
          variant: "destructive",
        });
      }
    }
  });

  // Watch form values for pricing calculation
  const watchedValues = form.watch();
  
  useEffect(() => {
    if (watchedValues.cardType && watchedValues.quantity && watchedValues.denomination) {
      calculatePricingMutation.mutate({
        cardType: watchedValues.cardType,
        quantity: watchedValues.quantity,
        denomination: watchedValues.denomination,
        customerType: watchedValues.customerType,
        customDesign: watchedValues.customDesign,
        shippingMethod: watchedValues.shippingMethod
      });
    }
  }, [watchedValues.cardType, watchedValues.quantity, watchedValues.denomination, watchedValues.customerType, watchedValues.customDesign, watchedValues.shippingMethod]);

  // Update selected values when form changes
  useEffect(() => {
    setSelectedCardType(watchedValues.cardType);
    setSelectedCustomerType(watchedValues.customerType);
  }, [watchedValues.cardType, watchedValues.customerType]);

  const onSubmit = (data: PhysicalCardOrderForm) => {
    createOrderMutation.mutate(data);
  };

  const cardTypeDetails = {
    plastic: {
      title: "Plastic Gift Cards",
      description: "Durable PVC cards perfect for everyday use",
      features: ["Standard PVC material", "Full-color printing", "Magnetic stripe optional", "2-3 year lifespan"]
    },
    metal: {
      title: "Metal Gift Cards", 
      description: "Premium metal cards for luxury experiences",
      features: ["Brushed metal finish", "Laser engraving", "Premium weight", "Lifetime durability"]
    },
    premium: {
      title: "Premium Gift Cards",
      description: "Ultra-premium cards with custom finishes",
      features: ["Multiple material options", "Custom textures", "Embossed elements", "Luxury packaging"]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Physical Gift Cards
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create tangible gift experiences with our premium physical gift cards. 
            Perfect for corporate gifts, special occasions, and retail environments.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="order" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="order" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Cards
              </TabsTrigger>
              <TabsTrigger value="activate" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Activate Card
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Check Balance
              </TabsTrigger>
              <TabsTrigger value="reload" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Reload Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Order Form */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        Physical Gift Card Order
                      </CardTitle>
                      <CardDescription>
                        Configure your custom physical gift cards with your business branding
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Card Type Selection */}
                        <div className="space-y-4">
                          <Label className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            Card Type
                          </Label>
                          <div className="grid md:grid-cols-3 gap-4">
                            {Object.entries(cardTypeDetails).map(([key, details]) => (
                              <Card 
                                key={key}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  form.watch('cardType') === key 
                                    ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => form.setValue('cardType', key as any)}
                              >
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">{details.title}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {details.description}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <ul className="text-xs space-y-1">
                                    {details.features.slice(0, 2).map((feature, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Customer Type & Quantity */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerType">Customer Type</Label>
                            <Select 
                              value={form.watch('customerType')}
                              onValueChange={(value: any) => form.setValue('customerType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="individual">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Individual Customer
                                  </div>
                                </SelectItem>
                                <SelectItem value="merchant">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Business/Merchant
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              max="10000"
                              {...form.register('quantity', { valueAsNumber: true })}
                              placeholder="Enter quantity"
                            />
                          </div>
                        </div>

                        {/* Denomination & Shipping */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="denomination">Card Value ($)</Label>
                            <Input
                              id="denomination"
                              type="number"
                              min="5"
                              max="500"
                              step="5"
                              {...form.register('denomination', { 
                                valueAsNumber: true,
                                setValueAs: (value) => value * 100 // Convert to cents
                              })}
                              placeholder="25"
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) * 100 || 0;
                                form.setValue('denomination', value);
                              }}
                              value={form.watch('denomination') / 100}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="shippingMethod">Shipping Method</Label>
                            <Select 
                              value={form.watch('shippingMethod')}
                              onValueChange={(value: any) => form.setValue('shippingMethod', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select shipping" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Standard (7-10 days) - $7.99
                                  </div>
                                </SelectItem>
                                <SelectItem value="expedited">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Expedited (3-5 days) - $14.99
                                  </div>
                                </SelectItem>
                                <SelectItem value="overnight">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Overnight (1-2 days) - $29.99
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div className="space-y-4">
                          <Label className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            Customer Information
                          </Label>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="customerName">Full Name</Label>
                              <Input
                                id="customerName"
                                {...form.register('customerName')}
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customerEmail">Email Address</Label>
                              <Input
                                id="customerEmail"
                                type="email"
                                {...form.register('customerEmail')}
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-4">
                          <Label className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            Shipping Address
                          </Label>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="shippingAddress">Street Address</Label>
                              <Input
                                id="shippingAddress"
                                {...form.register('shippingAddress')}
                                placeholder="123 Main Street"
                              />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="shippingCity">City</Label>
                                <Input
                                  id="shippingCity"
                                  {...form.register('shippingCity')}
                                  placeholder="New York"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="shippingState">State</Label>
                                <Input
                                  id="shippingState"
                                  {...form.register('shippingState')}
                                  placeholder="NY"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="shippingZip">ZIP Code</Label>
                                <Input
                                  id="shippingZip"
                                  {...form.register('shippingZip')}
                                  placeholder="10001"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="notes">Special Instructions (Optional)</Label>
                          <Textarea
                            id="notes"
                            {...form.register('notes')}
                            placeholder="Any special requirements or notes..."
                            rows={3}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={createOrderMutation.isPending}
                        >
                          {createOrderMutation.isPending ? 'Creating Order...' : 'Place Order'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Pricing Panel */}
                <div className="space-y-6">
                  {/* Live Pricing */}
                  {currentPricing && (
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-green-600" />
                          Order Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Square Base Cost:</span>
                            <span>${(currentPricing.breakdown.squareBaseCost / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Admin Fee ({currentPricing.adminFeePercentage}%):</span>
                            <span>${(currentPricing.breakdown.adminFee / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Printing & Materials:</span>
                            <span>${(currentPricing.breakdown.printing / 100).toFixed(2)}</span>
                          </div>
                          {currentPricing.breakdown.customDesign > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Custom Design Fee:</span>
                              <span>${(currentPricing.breakdown.customDesign / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>Shipping:</span>
                            <span>${(currentPricing.breakdown.shipping / 100).toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span className="text-green-600">${(currentPricing.totalOrder / 100).toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Per card: ${(currentPricing.totalPerCard / 100).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pricing Tiers */}
                  {pricingTiers?.success && (
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-sm">Volume Pricing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {pricingTiers.pricingTiers.map((tier: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800">
                            <span className="text-xs font-medium">{tier.description}</span>
                            <Badge variant="secondary" className="text-xs">
                              ${(tier.pricePerCard / 100).toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Features */}
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-sm">What's Included</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Professional card design
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Square integration
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Activation instructions
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Secure packaging
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Tracking information
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activate" className="mt-6">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Activate Your Card
                  </CardTitle>
                  <CardDescription>
                    Enter your card number to activate your physical gift card
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="activateCardNumber">Card Number</Label>
                      <Input
                        id="activateCardNumber"
                        placeholder="SIZU12345678901234"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activatedBy">Your Email</Label>
                      <Input
                        id="activatedBy"
                        type="email"
                        placeholder="your@email.com"
                      />
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Activate Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance" className="mt-6">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Check Card Balance
                  </CardTitle>
                  <CardDescription>
                    Enter your card number to check your current balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="balanceCardNumber">Card Number</Label>
                      <Input
                        id="balanceCardNumber"
                        placeholder="SIZU12345678901234"
                        className="font-mono"
                      />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Check Balance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reload" className="mt-6">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    Reload Your Card
                  </CardTitle>
                  <CardDescription>
                    Add money to your existing physical gift card
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reloadCardNumber">Card Number</Label>
                      <Input
                        id="reloadCardNumber"
                        placeholder="SIZU12345678901234"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reloadAmount">Amount to Add ($)</Label>
                      <Input
                        id="reloadAmount"
                        type="number"
                        min="5"
                        max="500"
                        step="5"
                        placeholder="25.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reloadedBy">Your Email</Label>
                      <Input
                        id="reloadedBy"
                        type="email"
                        placeholder="your@email.com"
                      />
                    </div>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Calculate Reload Cost
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}