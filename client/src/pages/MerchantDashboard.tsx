import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  CreditCard, Package, TrendingUp, DollarSign, Users, 
  RefreshCw, Settings, LogOut, Plus, Eye, Download,
  Calendar, Filter, Search, AlertCircle, Menu, X,
  ShoppingCart, Activity, Bell, Home, BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MerchantGiftCard {
  id: number;
  merchantId: string;
  gan: string;
  amount: number;
  status: string;
  customMessage?: string;
  createdAt: string;
  formattedAmount: string;
}

interface MerchantBulkOrder {
  id: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  status: string;
  created_at: string;
}

interface MerchantStats {
  totalGiftCards: number;
  totalRevenue: number;
  activeCards: number;
  totalRedemptions: number;
  averageCardValue: number;
  customers: number;
}

export default function MerchantDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
        console.log('🔍 Validating merchant token:', {
          role: payload.role,
          email: payload.email,
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

        console.log('✅ Valid merchant token confirmed');
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

  // Fetch merchant gift cards
  const { data: giftCards = [], isLoading: cardsLoading, error: cardsError, refetch: refetchCards } = useQuery({
    queryKey: ['merchant-giftcards'],
    queryFn: async () => {
      const response = await fetch('/api/merchant/giftcards/my-cards', {
        headers: {
          'x-merchant-token': merchantToken
        }
      });
      const data = await response.json();
      return data.cards || [];
    }
  });

  // Fetch bulk orders
  const { data: bulkOrders = [], isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ['merchant-bulk-orders'],
    queryFn: async () => {
      const response = await fetch('/api/merchant/bulk-orders', {
        headers: {
          'x-merchant-token': merchantToken
        }
      });
      const data = await response.json();
      return data.orders || [];
    }
  });

  // Fetch merchant stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['merchant-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'x-merchant-token': merchantToken
        }
      });
      const data = await response.json();
      return data.data || {};
    }
  });

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCards();
      refetchOrders();
      refetchStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetchCards, refetchOrders, refetchStats]);

  const handleLogout = () => {
    localStorage.removeItem('merchantToken');
    window.location.href = '/';
  };

  const handleRefresh = () => {
    refetchCards();
    refetchOrders();
    refetchStats();
    toast({ title: "Data refreshed", description: "Dashboard updated with latest information" });
  };

  // Filter gift cards
  const filteredCards = giftCards.filter((card: MerchantGiftCard) => {
    const matchesSearch = card.gan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.formattedAmount.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || card.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'redeemed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Mobile Navigation Component
  const MobileNavigation = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SiZu Merchant</h1>
            <p className="text-xs text-gray-400">Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-black/95 backdrop-blur-xl border-white/10">
              <div className="flex flex-col space-y-4 mt-8">
                <Button
                  variant="ghost"
                  className="justify-start text-white hover:bg-white/10"
                  onClick={() => {
                    setActiveTab("overview");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Overview
                </Button>
                
                <Button
                  variant="ghost"
                  className="justify-start text-white hover:bg-white/10"
                  onClick={() => {
                    setActiveTab("giftcards");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gift Cards
                </Button>
                
                <Button
                  variant="ghost"
                  className="justify-start text-white hover:bg-white/10"
                  onClick={() => {
                    setActiveTab("orders");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Bulk Orders
                </Button>
                
                <Button
                  variant="ghost"
                  className="justify-start text-white hover:bg-white/10"
                  onClick={() => {
                    window.location.href = '/merchant-bulk-purchase';
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Gift Cards
                </Button>
                
                <hr className="border-white/10 my-4" />
                
                <Button
                  variant="ghost"
                  className="justify-start text-red-400 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <div className="hidden lg:flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Merchant Dashboard</h1>
          <p className="text-gray-400">Manage your gift cards and bulk orders</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          onClick={() => window.location.href = '/merchant-bulk-purchase'}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buy Gift Cards
        </Button>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  // Stats Overview Component
  const StatsOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-purple-200">Total Cards</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {statsLoading ? '...' : (stats?.totalGiftCards || 0)}
                </p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-[#dd4bae]">Revenue</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {statsLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/20">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-[#dd4bae]">Active</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {statsLoading ? '...' : (stats?.activeCards || 0)}
                </p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border border-orange-500/20">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-[#dd4bae]">Customers</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {statsLoading ? '...' : (stats?.customers || 0)}
                </p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // Gift Cards Section
  const GiftCardsSection = () => (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
      <CardHeader className="pb-3 lg:pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
              <CreditCard className="w-5 h-5" />
              Gift Cards
            </CardTitle>
            <CardDescription className="text-[#dd4bae]">
              Manage your gift card inventory
            </CardDescription>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/20 text-[#613791] placeholder-[#dd4bae] text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(statusFilter === "all" ? "active" : "all")}
                className="border-white/20 text-[#613791] hover:bg-white/10 hover:text-[#613791] hover:border-white/30 whitespace-nowrap"
              >
                <Filter className="w-3 h-3 mr-1" />
                {statusFilter === "all" ? "All" : "Active"}
              </Button>
            </div>
            
            <Button
              onClick={() => window.location.href = '/merchant-bulk-purchase'}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
            >
              <Plus className="w-3 h-3 mr-1" />
              Buy Cards
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {cardsLoading ? (
          <div className="text-center py-8 lg:py-12">
            <div className="animate-spin w-6 h-6 lg:w-8 lg:h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#dd4bae]">Loading gift cards...</p>
          </div>
        ) : cardsError ? (
          <div className="text-center py-8 lg:py-12">
            <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#dd4bae] mb-4">Failed to load gift cards</p>
            <Button
              onClick={() => refetchCards()}
              variant="outline"
              className="border-white/20 text-[#613791] hover:bg-white/10 hover:text-[#613791] hover:border-white/30"
            >
              Try Again
            </Button>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <CreditCard className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[#dd4bae] mb-4">
              {giftCards.length === 0 ? "No gift cards found" : "No cards match your filters"}
            </p>
            {giftCards.length === 0 && (
              <Button
                onClick={() => window.location.href = '/merchant-bulk-purchase'}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
              >
                Create Your First Gift Cards
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            {filteredCards.map((card: MerchantGiftCard) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 lg:p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-lg lg:text-xl">{card.formattedAmount}</p>
                    <p className="text-[#dd4bae] text-xs lg:text-sm">GAN: {card.gan}</p>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(card.status)}`}>
                    {card.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#dd4bae]">Created:</span>
                    <span className="text-white">{formatDate(card.createdAt)}</span>
                  </div>
                  {card.customMessage && (
                    <div className="bg-white/10 rounded-lg p-2 lg:p-3">
                      <p className="text-[#dd4bae] text-xs lg:text-sm">{card.customMessage}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 border-white/20 text-[#613791] hover:bg-white/10 hover:text-[#613791] hover:border-white/30"
                    onClick={() => window.location.href = `/gift/${card.gan}`}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    <span className="hidden lg:inline">View</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-white/20 text-[#613791] hover:bg-white/10 hover:text-[#613791] hover:border-white/30"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Bulk Orders Section
  const BulkOrdersSection = () => (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
      <CardHeader className="pb-3 lg:pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
              <Package className="w-5 h-5" />
              Bulk Orders
            </CardTitle>
            <CardDescription className="text-[#dd4bae]">
              Track your bulk purchase orders
            </CardDescription>
          </div>
          
          <Button
            onClick={() => window.location.href = '/merchant-bulk-purchase'}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium lg:ml-auto"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Order
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {ordersLoading ? (
          <div className="text-center py-8 lg:py-12">
            <div className="animate-spin w-6 h-6 lg:w-8 lg:h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#dd4bae]">Loading bulk orders...</p>
          </div>
        ) : ordersError ? (
          <div className="text-center py-8 lg:py-12">
            <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#dd4bae] mb-4">Failed to load bulk orders</p>
            <Button
              onClick={() => refetchOrders()}
              variant="outline"
              className="border-white/20 text-[#613791] hover:bg-white/10 hover:text-[#613791] hover:border-white/30"
            >
              Try Again
            </Button>
          </div>
        ) : bulkOrders.length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <Package className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[#dd4bae] mb-4">No bulk orders found</p>
            <Button
              onClick={() => window.location.href = '/merchant-bulk-purchase'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
            >
              Place Your First Bulk Order
            </Button>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {bulkOrders.map((order: MerchantBulkOrder) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4 lg:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-2 lg:space-y-0">
                      <div>
                        <p className="text-white font-semibold text-sm lg:text-base">
                          Order #{order.id.slice(-8)}
                        </p>
                        <p className="text-[#dd4bae] text-xs lg:text-sm">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 lg:gap-6 text-sm">
                        <div>
                          <span className="text-[#dd4bae]">Quantity: </span>
                          <span className="text-white font-medium">{order.quantity}</span>
                        </div>
                        <div>
                          <span className="text-[#dd4bae]">Unit Price: </span>
                          <span className="text-white">{formatCurrency(order.unit_price)}</span>
                        </div>
                        <div>
                          <span className="text-[#dd4bae]">Total: </span>
                          <span className="text-white font-semibold">{formatCurrency(order.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={`${getStatusColor(order.status)} text-xs lg:text-sm`}>
                    {order.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <MobileNavigation />
      
      {/* Main Content */}
      <div className="pt-20 lg:pt-8 px-4 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <DesktopHeader />
          
          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <div className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg mb-6">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("overview")}
                className={`rounded-l-lg ${activeTab === "overview" ? "bg-white/20 text-white" : "text-[#613791] hover:bg-white/10"}`}
              >
                Overview
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("giftcards")}
                className={`rounded-none ${activeTab === "giftcards" ? "bg-white/20 text-white" : "text-[#613791] hover:bg-white/10"}`}
              >
                Cards
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("orders")}
                className={`rounded-r-lg ${activeTab === "orders" ? "bg-white/20 text-white" : "text-[#613791] hover:bg-white/10"}`}
              >
                Orders
              </Button>
            </div>
            
            {activeTab === "overview" && (
              <div className="space-y-6">
                <StatsOverview />
                <div className="grid gap-6">
                  <GiftCardsSection />
                  <BulkOrdersSection />
                </div>
              </div>
            )}
            
            {activeTab === "giftcards" && (
              <div className="space-y-6">
                <GiftCardsSection />
              </div>
            )}
            
            {activeTab === "orders" && (
              <div className="space-y-6">
                <BulkOrdersSection />
              </div>
            )}
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden lg:block space-y-8">
            <StatsOverview />
            <div className="grid gap-8">
              <GiftCardsSection />
              <BulkOrdersSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}