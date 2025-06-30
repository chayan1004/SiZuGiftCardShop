import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { 
  BarChart3, TrendingUp, Gift, Users, Calendar, 
  DollarSign, Target, Percent, Clock, CreditCard,
  CheckCircle, AlertCircle, Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GiftCardAnalytics {
  totalIssued: number;
  totalRedeemed: number;
  totalUnused: number;
  totalValue: number;
  redemptionRate: number;
  dailyStats: Array<{ date: string; issued: number; redeemed: number }>;
  recentRedemptions: Array<{
    gan: string;
    amount: number;
    redeemedBy: string;
    redeemedAt: Date;
    recipientEmail?: string;
  }>;
}

export default function MerchantGiftCardAnalytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Redemption form state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemedBy, setRedeemedBy] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date range based on selection
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "custom":
        if (startDate && endDate) {
          return {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString()
          };
        }
        return {};
      default:
        return {};
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  // Fetch merchant gift card analytics
  const { data: analyticsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/merchant/gift-card-analytics', dateRange, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      const dates = getDateRange();
      if (dates.startDate) params.append("startDate", dates.startDate);
      if (dates.endDate) params.append("endDate", dates.endDate);
      
      const response = await fetch(`/api/merchant/gift-card-analytics?${params}`);
      return response.json();
    },
  });

  const analytics: GiftCardAnalytics = analyticsResponse?.analytics || {
    totalIssued: 0,
    totalRedeemed: 0,
    totalUnused: 0,
    totalValue: 0,
    redemptionRate: 0,
    dailyStats: [],
    recentRedemptions: []
  };

  // Gift card redemption mutation
  const redeemMutation = useMutation({
    mutationFn: async (redeemData: { code: string; redeemedBy: string; amount?: number }) => {
      return apiRequest("POST", "/api/gift-cards/redeem", redeemData);
    },
    onSuccess: () => {
      toast({
        title: "Gift Card Redeemed",
        description: "The gift card has been successfully redeemed.",
      });
      setRedeemCode("");
      setRedeemedBy("");
      setRedeemAmount("");
      // Refresh analytics
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem gift card.",
        variant: "destructive",
      });
    },
  });

  // Handle gift card redemption
  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!redeemCode || !redeemedBy) {
      toast({
        title: "Missing Information",
        description: "Please enter both gift card code and customer information.",
        variant: "destructive",
      });
      return;
    }

    const redemptionData: any = {
      code: redeemCode,
      redeemedBy: redeemedBy
    };

    if (redeemAmount) {
      redemptionData.amount = Math.round(parseFloat(redeemAmount) * 100); // Convert to cents
    }

    redeemMutation.mutate(redemptionData);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Chart colors
  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];

  // Pie chart data
  const pieData = [
    { name: 'Redeemed', value: analytics.totalRedeemed, color: '#10b981' },
    { name: 'Unused', value: analytics.totalUnused, color: '#6b7280' }
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Gift Card Analytics</h1>
              <p className="text-gray-300">Track your gift card performance and redemptions</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="redemption" className="data-[state=active]:bg-purple-500/20">
              <CreditCard className="w-4 h-4 mr-2" />
              Redeem Gift Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Date Range Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Date Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Time Period</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {dateRange === "custom" && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-white">Start Date</Label>
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">End Date</Label>
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Total Issued</p>
                      <p className="text-3xl font-bold text-white">{analytics.totalIssued.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Total Redeemed</p>
                      <p className="text-3xl font-bold text-white">{analytics.totalRedeemed.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Total Value</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(analytics.totalValue)}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Redemption Rate</p>
                      <p className="text-3xl font-bold text-white">{analytics.redemptionRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <Percent className="w-6 h-6 text-pink-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Daily Activity Chart */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Daily Activity</CardTitle>
                  <CardDescription className="text-gray-300">
                    Gift cards issued vs redeemed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tickFormatter={formatDate}
                        />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#f3f4f6' }}
                        />
                        <Bar dataKey="issued" fill="#8b5cf6" name="Issued" />
                        <Bar dataKey="redeemed" fill="#10b981" name="Redeemed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Redemption Status */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Redemption Status</CardTitle>
                  <CardDescription className="text-gray-300">
                    Distribution of redeemed vs unused gift cards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-300 text-sm">
                          {entry.name}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Redemptions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Redemptions
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest gift card redemption activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.recentRedemptions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400">No redemptions found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.recentRedemptions.map((redemption, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {redemption.gan.slice(0, 8)}***
                              </p>
                              <p className="text-gray-400 text-sm">
                                Redeemed by {redemption.redeemedBy}
                              </p>
                              {redemption.recipientEmail && (
                                <p className="text-gray-500 text-xs">
                                  Original: {redemption.recipientEmail}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              {formatCurrency(redemption.amount / 100)}
                            </Badge>
                            <p className="text-gray-400 text-sm mt-1">
                              {new Date(redemption.redeemedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="redemption" className="space-y-6">
            {/* Gift Card Redemption Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Redeem Gift Card
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Process gift card redemptions for in-store purchases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRedeem} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-white">Gift Card Code</Label>
                        <Input
                          placeholder="Enter gift card code/GAN"
                          value={redeemCode}
                          onChange={(e) => setRedeemCode(e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Customer Email/ID</Label>
                        <Input
                          placeholder="Customer identification"
                          value={redeemedBy}
                          onChange={(e) => setRedeemedBy(e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Redemption Amount (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Leave blank for full balance"
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      />
                      <p className="text-gray-400 text-sm">
                        If left blank, the full balance will be redeemed
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={redeemMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {redeemMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Redeem Gift Card
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}