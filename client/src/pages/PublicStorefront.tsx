import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Gift, Gamepad2, Pizza, PartyPopper, Briefcase, Heart, Star, Calendar, Filter } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PublicMerchant {
  id: string;
  businessName: string;
  businessType: string;
  logo?: string;
  themeColor?: string;
  tagline?: string;
  isActive: boolean;
  giftCardCount: number;
  avgRating?: number;
}

interface PublicGiftCard {
  merchantId: string;
  merchantName: string;
  businessType: string;
  logo?: string;
  themeColor: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  popularAmounts: number[];
  description?: string;
}

export default function PublicStorefront() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);

  // Fetch active merchants with gift cards
  const { data: merchants, isLoading: loadingMerchants } = useQuery({
    queryKey: ['/api/public/merchants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/merchants');
      return response.json();
    }
  });

  // Fetch public gift cards
  const { data: giftCards, isLoading: loadingCards } = useQuery({
    queryKey: ['/api/public/giftcards'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/giftcards');
      return response.json();
    }
  });

  const filteredCards = giftCards?.giftCards?.filter((card: PublicGiftCard) => {
    const matchesSearch = card.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.businessType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || card.businessType === categoryFilter;
    const matchesAmount = amountFilter === 'all' || 
                         (amountFilter === 'under50' && card.minAmount < 5000) ||
                         (amountFilter === '50to100' && card.minAmount >= 5000 && card.maxAmount <= 10000) ||
                         (amountFilter === 'over100' && card.minAmount > 10000);
    
    return matchesSearch && matchesCategory && matchesAmount;
  }) || [];

  const categories = [...new Set(giftCards?.giftCards?.map((card: PublicGiftCard) => card.businessType) || [])];

  if (loadingMerchants || loadingCards) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Gift className="h-12 w-12 mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold">SiZu GiftCard Store</h1>
          </div>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover amazing gift cards from local businesses and brands
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for businesses, categories, or gift cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/70"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8 bg-white/50 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filter Gift Cards</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount Range</Label>
                <Select value={amountFilter} onValueChange={setAmountFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Amounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Amounts</SelectItem>
                    <SelectItem value="under50">Under $50</SelectItem>
                    <SelectItem value="50to100">$50 - $100</SelectItem>
                    <SelectItem value="over100">Over $100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setAmountFilter('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gift Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card: PublicGiftCard) => (
            <Card 
              key={card.merchantId} 
              className="group hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm border-0 overflow-hidden"
            >
              <CardHeader className="relative">
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: card.themeColor || '#6366f1' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {card.businessType}
                    </Badge>
                    {card.logo && (
                      <img 
                        src={card.logo} 
                        alt={card.merchantName}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                  </div>
                  <CardTitle className="text-xl text-gray-800">
                    {card.merchantName}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {card.description || `Gift cards starting from $${(card.minAmount / 100).toFixed(0)}`}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Popular Amounts:</p>
                    <div className="flex flex-wrap gap-2">
                      {card.popularAmounts?.slice(0, 4).map((amount: number) => (
                        <Badge 
                          key={amount} 
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: card.themeColor || '#6366f1' }}
                        >
                          ${(amount / 100).toFixed(0)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      ${(card.minAmount / 100).toFixed(0)} - ${(card.maxAmount / 100).toFixed(0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">4.8</span>
                    </div>
                  </div>
                  
                  <Link href={`/giftcard-purchase/${card.merchantId}`}>
                    <Button 
                      className="w-full group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: card.themeColor || '#6366f1' }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase Gift Card
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No gift cards found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white/50 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Why Choose SiZu Gift Cards?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Delivery</h3>
              <p className="text-gray-600">Get your gift card immediately via email with QR code</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-gray-600">Simple checkout process with secure payment</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Businesses</h3>
              <p className="text-gray-600">Support amazing local merchants in your community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}