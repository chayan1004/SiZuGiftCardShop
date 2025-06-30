import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Gift, Gamepad2, Pizza, PartyPopper, Briefcase, Heart, Star, Calendar, Filter, DollarSign, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card3DDesign } from '@/components/ui/3d-card-designs';

interface PublicGiftCard {
  id: string;
  merchantId: string;
  merchantName: string;
  businessType: string;
  logo?: string;
  themeColor: string;
  amount: number;
  cardDesignTheme: string;
  giftCategory: string;
  occasionTag?: string;
  description?: string;
  isActive: boolean;
  publicVisible: boolean;
}

interface PurchaseFormData {
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  amount: number;
  isGift: boolean;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: Filter },
  { id: 'Gaming', name: '🎮 Gaming', icon: Gamepad2 },
  { id: 'Food', name: '🍕 Food & Dining', icon: Pizza },
  { id: 'Event Gifts', name: '🎁 Event Gifts', icon: PartyPopper },
  { id: 'Productivity', name: '💼 Productivity', icon: Briefcase },
  { id: 'Wellness', name: '💄 Wellness & Beauty', icon: Heart },
];

const occasions = [
  { id: 'all', name: 'All Occasions', icon: Calendar },
  { id: 'Christmas', name: '🎄 Christmas', color: 'bg-red-500' },
  { id: 'Birthday', name: '🎂 Birthdays', color: 'bg-pink-500' },
  { id: 'Graduation', name: '🎓 Graduation', color: 'bg-blue-500' },
  { id: 'Valentine', name: '❤️ Valentine\'s', color: 'bg-red-600' },
  { id: 'Anniversary', name: '💍 Anniversary', color: 'bg-purple-500' },
];

const themes = [
  { id: 'classic', name: 'Classic', preview: 'bg-gradient-to-br from-blue-500 to-purple-600' },
  { id: 'modern', name: 'Modern', preview: 'bg-gradient-to-br from-gray-800 to-gray-600' },
  { id: 'festive', name: 'Festive', preview: 'bg-gradient-to-br from-red-500 to-green-500' },
  { id: 'elegant', name: 'Elegant', preview: 'bg-gradient-to-br from-purple-600 to-pink-500' },
];

export default function PublicGiftCardStore() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [occasionFilter, setOccasionFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState<PublicGiftCard | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [formData, setFormData] = useState<PurchaseFormData>({
    senderName: '',
    senderEmail: '',
    recipientEmail: '',
    recipientName: '',
    message: '',
    amount: 2500,
    isGift: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch public gift cards with filters
  const { data: giftCardsData, isLoading } = useQuery({
    queryKey: ['/api/public/giftcards', { category: categoryFilter, occasion: occasionFilter, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (occasionFilter !== 'all') params.append('occasion', occasionFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiRequest('GET', `/api/public/giftcards?${params.toString()}`);
      return response.json();
    }
  });

  // Purchase gift card mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData & { cardId: string }) => {
      const response = await apiRequest('POST', '/api/public/purchase', {
        cardId: data.cardId,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName || data.senderName,
        message: data.message,
        amount: data.amount,
        isGift: data.isGift,
        paymentMethodId: `test-payment-${Date.now()}` // Mock payment for demo
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gift Card Purchased!",
        description: `Order ID: ${data.orderId}. Check your email for receipt.`
      });
      setShowBuyModal(false);
      setFormData({
        senderName: '',
        senderEmail: '',
        recipientEmail: '',
        recipientName: '',
        message: '',
        amount: 2500,
        isGift: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/giftcards'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase gift card",
        variant: "destructive"
      });
    }
  });

  const giftCards = giftCardsData?.giftCards || [];

  const filteredCards = giftCards.filter((card: PublicGiftCard) => {
    const matchesSearch = card.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handlePurchase = () => {
    if (!selectedCard) return;
    
    if (!formData.senderName || !formData.senderEmail || !formData.recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    purchaseMutation.mutate({
      ...formData,
      cardId: selectedCard.id
    });
  };

  const getThemePreview = (theme: string) => {
    const themeObj = themes.find(t => t.id === theme) || themes[0];
    return themeObj.preview;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            SiZu Gift Card Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the perfect gift cards for every occasion. Browse by category, filter by special occasions, and give the gift of choice.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search gift cards, merchants, or occasions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(category.id)}
                  className="flex items-center gap-2"
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Occasion Filter */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Special Occasions</Label>
            <div className="flex flex-wrap gap-2">
              {occasions.map((occasion) => (
                <Button
                  key={occasion.id}
                  variant={occasionFilter === occasion.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOccasionFilter(occasion.id)}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {occasion.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Gift Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-80 animate-pulse">
                <div className="h-full bg-muted rounded-lg" />
              </Card>
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No gift cards found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredCards.map((card: PublicGiftCard) => (
              <Card key={card.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="mb-4">
                    <Card3DDesign 
                      category={card.giftCategory}
                      amount={card.amount}
                      merchantName={card.merchantName}
                      className="h-32"
                    />
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{card.merchantName}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </div>
                    {card.occasionTag && (
                      <Badge variant="secondary" className="ml-2">
                        {occasions.find(o => o.id === card.occasionTag)?.name || card.occasionTag}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${(card.amount / 100).toFixed(2)}</span>
                    </div>
                    <Badge variant="outline">
                      {categories.find(c => c.id === card.giftCategory)?.name || card.giftCategory}
                    </Badge>
                  </div>

                  <Dialog open={showBuyModal && selectedCard?.id === card.id} onOpenChange={(open) => {
                    setShowBuyModal(open);
                    if (open) setSelectedCard(card);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full" onClick={() => setSelectedCard(card)}>
                        <Gift className="h-4 w-4 mr-2" />
                        Buy Gift Card
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Purchase Gift Card</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Form */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="senderName">Your Name *</Label>
                            <Input
                              id="senderName"
                              value={formData.senderName}
                              onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                              placeholder="John Doe"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="senderEmail">Your Email *</Label>
                            <Input
                              id="senderEmail"
                              type="email"
                              value={formData.senderEmail}
                              onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
                              placeholder="john@example.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="recipientEmail">Recipient Email *</Label>
                            <Input
                              id="recipientEmail"
                              type="email"
                              value={formData.recipientEmail}
                              onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                              placeholder="recipient@example.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="recipientName">Recipient Name</Label>
                            <Input
                              id="recipientName"
                              value={formData.recipientName}
                              onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                              placeholder="Jane Smith"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Select
                              value={formData.amount.toString()}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, amount: parseInt(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2500">$25.00</SelectItem>
                                <SelectItem value="5000">$50.00</SelectItem>
                                <SelectItem value="10000">$100.00</SelectItem>
                                <SelectItem value="15000">$150.00</SelectItem>
                                <SelectItem value="25000">$250.00</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message">Personal Message</Label>
                            <Textarea
                              id="message"
                              value={formData.message}
                              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                              placeholder="Happy Birthday! Hope you enjoy this gift card."
                              rows={3}
                            />
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Gift Card Preview</Label>
                            <div className={`h-48 rounded-lg ${getThemePreview(card.cardDesignTheme)} flex flex-col items-center justify-center text-white relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-black/20" />
                              <div className="relative text-center p-4">
                                <Gift className="h-8 w-8 mx-auto mb-2" />
                                <div className="text-lg font-bold">{card.merchantName}</div>
                                <div className="text-2xl font-bold mt-2">${(formData.amount / 100).toFixed(2)}</div>
                                {formData.message && (
                                  <div className="text-xs mt-2 opacity-90 max-w-32 truncate">
                                    "{formData.message}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Order Summary</Label>
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span>Gift Card Value:</span>
                                <span className="font-medium">${(formData.amount / 100).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Processing Fee:</span>
                                <span className="font-medium">$0.00</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total:</span>
                                <span>${(formData.amount / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <Button 
                            onClick={handlePurchase} 
                            disabled={purchaseMutation.isPending}
                            className="w-full"
                            size="lg"
                          >
                            {purchaseMutation.isPending ? (
                              "Processing..."
                            ) : (
                              <>
                                <Gift className="h-4 w-4 mr-2" />
                                Complete Purchase
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}