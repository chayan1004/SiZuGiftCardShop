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
import { Search, Gift, Gamepad2, Pizza, PartyPopper, Briefcase, Heart, Star, Calendar, Filter, DollarSign, Download, Menu, X, ShoppingBag, Sparkles, Zap, Shield, Utensils, Users, Plane, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card3DDesign } from '@/components/ui/3d-card-designs';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';

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
  { 
    id: 'all', 
    name: 'All Categories', 
    icon: Filter, 
    gradient: 'from-slate-400 to-slate-600',
    description: 'Browse everything'
  },
  { 
    id: 'Gaming & Entertainment', 
    name: 'Gaming & Entertainment', 
    icon: Gamepad2, 
    gradient: 'from-purple-500 to-pink-500',
    description: 'Games & entertainment'
  },
  { 
    id: 'Food & Dining', 
    name: 'Food & Dining', 
    icon: Utensils, 
    gradient: 'from-orange-500 to-red-500',
    description: 'Restaurants & food'
  },
  { 
    id: 'Events & Celebrations', 
    name: 'Events & Celebrations', 
    icon: PartyPopper, 
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Special occasions'
  },
  { 
    id: 'Tech & Productivity', 
    name: 'Tech & Productivity', 
    icon: Briefcase, 
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Technology & work'
  },
  { 
    id: 'Health & Wellness', 
    name: 'Health & Wellness', 
    icon: Heart, 
    gradient: 'from-green-500 to-emerald-500',
    description: 'Health & beauty'
  },
  { 
    id: 'Shopping & Retail', 
    name: 'Shopping & Retail', 
    icon: ShoppingBag, 
    gradient: 'from-pink-500 to-rose-500',
    description: 'Shopping & fashion'
  },
  { 
    id: 'Travel & Experiences', 
    name: 'Travel & Experiences', 
    icon: Plane, 
    gradient: 'from-indigo-500 to-purple-500',
    description: 'Travel & adventures'
  },
];

const occasions = [
  { 
    id: 'all', 
    name: 'All Occasions', 
    icon: Calendar, 
    gradient: 'from-slate-400 to-slate-600',
    description: 'Perfect for any time'
  },
  { 
    id: 'Christmas', 
    name: 'Christmas', 
    icon: Gift, 
    gradient: 'from-red-500 to-green-500',
    description: 'Holiday season magic'
  },
  { 
    id: 'Birthday', 
    name: 'Birthdays', 
    icon: PartyPopper, 
    gradient: 'from-pink-500 to-purple-500',
    description: 'Celebrate another year'
  },
  { 
    id: 'Graduation', 
    name: 'Graduation', 
    icon: Star, 
    gradient: 'from-blue-500 to-indigo-500',
    description: 'Academic achievements'
  },
  { 
    id: 'Valentine', 
    name: 'Valentine\'s Day', 
    icon: Heart, 
    gradient: 'from-red-600 to-pink-500',
    description: 'Show your love'
  },
  { 
    id: 'Anniversary', 
    name: 'Anniversary', 
    icon: Sparkles, 
    gradient: 'from-purple-500 to-pink-600',
    description: 'Milestone moments'
  },
  { 
    id: 'Thank You', 
    name: 'Thank You', 
    icon: Heart, 
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Express gratitude'
  },
  { 
    id: 'Congratulations', 
    name: 'Congratulations', 
    icon: Zap, 
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Celebrate success'
  },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation Header */}
      <Navigation onOpenPurchaseModal={() => setShowBuyModal(true)} />
      
      {/* Mobile Header Bar */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Gift Cards
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-12">
        {/* Desktop Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 lg:mb-12 hidden lg:block bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 lg:p-12 border border-purple-200/30 dark:border-purple-800/30"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <Gift className="h-8 w-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white">
              Gift Card Store
            </h1>
          </div>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover premium gift cards from trusted merchants. Perfect for any occasion, designed to create memorable experiences.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`max-w-5xl mx-auto mb-8 lg:mb-12 ${showFilters || !isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}
        >
          {/* Search Bar */}
          <div className="relative mb-6 lg:mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search gift cards, merchants, or occasions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 lg:h-14 text-base lg:text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-400 dark:focus:border-purple-500 transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Category Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Store className="h-4 w-4" />
              </div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Browse Categories</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={categoryFilter === category.id ? "default" : "outline"}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`w-full h-auto p-4 rounded-xl border-2 transition-all duration-300 ${
                      categoryFilter === category.id
                        ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-lg transform scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-gray-800 hover:shadow-md text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <category.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                      <div>
                        <div className="text-xs lg:text-sm font-medium">{category.name}</div>
                        <div className={`text-xs ${categoryFilter === category.id ? 'opacity-90' : 'opacity-60'}`}>
                          {category.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Occasions Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Special Occasions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {occasions.map((occasion, index) => (
                <motion.div
                  key={occasion.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Button
                    variant={occasionFilter === occasion.id ? "default" : "outline"}
                    onClick={() => setOccasionFilter(occasion.id)}
                    className={`w-full h-auto p-4 rounded-xl border-2 transition-all duration-300 ${
                      occasionFilter === occasion.id
                        ? 'bg-pink-600 hover:bg-pink-700 text-white border-pink-600 shadow-lg transform scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500 bg-white dark:bg-gray-800 hover:shadow-md text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <occasion.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                      <div>
                        <div className="text-xs lg:text-sm font-medium">{occasion.name}</div>
                        <div className={`text-xs ${occasionFilter === occasion.id ? 'opacity-90' : 'opacity-60'}`}>
                          {occasion.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Gift Cards Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
                >
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </motion.div>
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 lg:py-24"
            >
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 inline-block mb-6">
                <Gift className="h-12 w-12 lg:h-16 lg:w-16 text-purple-600 dark:text-purple-400 mx-auto" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">No gift cards found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-base lg:text-lg max-w-md mx-auto">Try adjusting your search or filters to discover more gift cards</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setOccasionFilter('all');
                }}
                className="mt-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                      {filteredCards.length} Gift Card{filteredCards.length !== 1 ? 's' : ''} Available
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Premium cards from verified merchants</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filteredCards.map((card: PublicGiftCard, index: number) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden">
                      <CardHeader className="pb-3 p-4 lg:p-6">
                        <div className="mb-4 relative overflow-hidden rounded-xl">
                          <Card3DDesign 
                            category={card.giftCategory}
                            amount={card.amount}
                            merchantName={card.merchantName}
                            className="h-28 lg:h-32 transition-transform duration-300 group-hover:scale-105"
                          />
                          {card.occasionTag && (
                            <div className="absolute top-2 right-2">
                              <Badge 
                                variant="secondary" 
                                className="bg-white dark:bg-gray-900 text-xs border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                              >
                                {occasions.find(o => o.id === card.occasionTag)?.name || card.occasionTag}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <CardTitle className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {card.merchantName}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {card.description || 'Premium gift card perfect for any occasion'}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 lg:p-6 pt-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                              <DollarSign className="h-3 w-3" />
                            </div>
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                              ${(card.amount / 100).toFixed(2)}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200/50 dark:border-purple-800/50"
                          >
                            {categories.find(c => c.id === card.giftCategory)?.name || card.giftCategory}
                          </Badge>
                        </div>

                        <Dialog open={showBuyModal && selectedCard?.id === card.id} onOpenChange={(open) => {
                          setShowBuyModal(open);
                          if (open) setSelectedCard(card);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                              onClick={() => setSelectedCard(card)}
                              size="lg"
                            >
                              <Gift className="h-4 w-4 mr-2" />
                              Buy Gift Card
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                Purchase Gift Card - {selectedCard?.merchantName}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                              {/* Form */}
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="senderName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Name *</Label>
                                  <Input
                                    id="senderName"
                                    value={formData.senderName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                                    placeholder="John Doe"
                                    className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="senderEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Email *</Label>
                                  <Input
                                    id="senderEmail"
                                    type="email"
                                    value={formData.senderEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
                                    placeholder="john@example.com"
                                    className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="recipientEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipient Email *</Label>
                                  <Input
                                    id="recipientEmail"
                                    type="email"
                                    value={formData.recipientEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                    placeholder="recipient@example.com"
                                    className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="recipientName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipient Name</Label>
                                  <Input
                                    id="recipientName"
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                                    placeholder="Jane Smith"
                                    className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</Label>
                                  <Select
                                    value={formData.amount.toString()}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, amount: parseInt(value) }))}
                                  >
                                    <SelectTrigger className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600">
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
                                  <Label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">Personal Message</Label>
                                  <Textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Happy Birthday! Hope you enjoy this gift card."
                                    rows={3}
                                    className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
                                  />
                                </div>
                              </div>

                              {/* Preview */}
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gift Card Preview</Label>
                                  <div className="relative">
                                    <Card3DDesign 
                                      category={selectedCard?.giftCategory || 'general'}
                                      amount={formData.amount}
                                      merchantName={selectedCard?.merchantName || ''}
                                      className="h-48 lg:h-56"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl flex flex-col justify-end p-4 text-white">
                                      <div className="text-center">
                                        <div className="text-lg lg:text-xl font-bold">{selectedCard?.merchantName}</div>
                                        <div className="text-2xl lg:text-3xl font-bold mt-1">${(formData.amount / 100).toFixed(2)}</div>
                                        {formData.message && (
                                          <div className="text-xs lg:text-sm mt-2 opacity-90 max-w-full line-clamp-2">
                                            "{formData.message}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Summary</Label>
                                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl border border-purple-200/50 dark:border-purple-800/50 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600 dark:text-gray-400">Gift Card Value:</span>
                                      <span className="font-semibold text-gray-900 dark:text-white">${(formData.amount / 100).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                                      <span className="font-semibold text-green-600 dark:text-green-400">$0.00</span>
                                    </div>
                                    <div className="border-t border-purple-200/50 dark:border-purple-800/50 pt-3 flex justify-between items-center">
                                      <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                                      <span className="font-bold text-xl text-purple-600 dark:text-purple-400">${(formData.amount / 100).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                <Button 
                                  onClick={handlePurchase} 
                                  disabled={purchaseMutation.isPending}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                  size="lg"
                                >
                                  {purchaseMutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      Processing...
                                    </div>
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
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}