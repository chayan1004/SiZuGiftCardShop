import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  CreditCard, Package, TrendingUp, DollarSign, Users, 
  RefreshCw, Settings, LogOut, Plus, Eye, Download,
  Calendar, Filter, Search, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

  // Check authentication
  const merchantToken = localStorage.getItem('merchantToken');
  
  if (!merchantToken) {
    window.location.href = '/merchant-login';
    return null;
  }

  // Fetch merchant gift cards
  const { data: giftCards = [], isLoading: cardsLoading, error: cardsError } = useQuery({
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
  const { data: bulkOrders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
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
  const { data: stats, isLoading: statsLoading } = useQuery({
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

  const handleLogout = () => {
    localStorage.removeItem('merchantToken');
    window.location.href = '/merchant-login';
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['merchant-giftcards'] });
    queryClient.invalidateQueries({ queryKey: ['merchant-bulk-orders'] });
    queryClient.invalidateQueries({ queryKey: ['merchant-stats'] });
    toast({
      title: "Data refreshed",
      description: "Dashboard data has been updated"
    });
  };

  // Filter gift cards
  const filteredCards = giftCards.filter((card: MerchantGiftCard) => {
    const matchesSearch = searchTerm === "" || 
      card.gan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.customMessage && card.customMessage.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || card.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'redeemed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'delivered': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Merchant Dashboard</h1>
            <p className="text-gray-300">Manage your gift cards and bulk orders</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleRefresh}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Total Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? "..." : stats?.totalGiftCards || giftCards.length}
              </div>
              <p className="text-sm text-gray-300">
                {formatCurrency(stats?.totalRevenue || 0)} total value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Active Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? "..." : stats?.activeCards || giftCards.filter((c: MerchantGiftCard) => c.status === 'active').length}
              </div>
              <p className="text-sm text-gray-300">Currently available</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-sm text-gray-300">
                {stats?.totalRedemptions || 0} redemptions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? "..." : stats?.customers || 0}
              </div>
              <p className="text-sm text-gray-300">
                {formatCurrency(stats?.averageCardValue || 0)} avg. value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gift Cards Section */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Gift Cards
                </CardTitle>
                <CardDescription className="text-gray-300">
                  View and manage your gift cards
                </CardDescription>
              </div>
              <Button
                onClick={() => window.location.href = '/merchant-bulk-purchase'}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buy Gift Cards
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by GAN or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Gift Cards Grid */}
            {cardsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-gray-300">Loading gift cards...</span>
              </div>
            ) : cardsError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-2">Failed to load gift cards</p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCards.map((card: MerchantGiftCard) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white/10 to-white/5 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(card.status)}>
                        {card.status}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {formatDate(card.createdAt)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(card.amount)}
                      </div>
                      <div className="text-sm text-gray-300 font-mono">
                        GAN: {card.gan}
                      </div>
                      {card.customMessage && (
                        <div className="text-xs text-gray-500 italic">
                          "{card.customMessage}"
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
                        onClick={() => window.location.href = `/gift/${card.gan}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
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

        {/* Bulk Orders Section */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Bulk Orders
            </CardTitle>
            <CardDescription className="text-gray-300">
              Track your bulk gift card orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-gray-300">Loading orders...</span>
              </div>
            ) : ordersError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-2">Failed to load bulk orders</p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : bulkOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No bulk orders found</p>
                <Button
                  onClick={() => window.location.href = '/merchant-bulk-purchase'}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
                >
                  Place Your First Bulk Order
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-gray-300">Order ID</th>
                      <th className="text-left py-3 px-4 text-gray-300">Quantity</th>
                      <th className="text-left py-3 px-4 text-gray-300">Unit Price</th>
                      <th className="text-left py-3 px-4 text-gray-300">Total</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkOrders.map((order: MerchantBulkOrder) => (
                      <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {order.id.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {order.quantity}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          ${parseFloat(order.unit_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          ${parseFloat(order.total_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}