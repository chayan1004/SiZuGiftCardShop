import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  TrendingUp, DollarSign, Users, CreditCard, 
  Calendar, Target, ArrowUp, ArrowDown, RefreshCw, Download
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BusinessMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  giftCardsIssued: number;
  redemptionRate: number;
  netProfit: number;
  profitMargin: number;
}

interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
}

interface CustomerSegments {
  segment: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
}

interface PerformanceGoals {
  metric: string;
  current: number;
  target: number;
  progress: number;
  status: 'ahead' | 'on-track' | 'behind';
}

export default function MerchantBusinessAnalytics() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const { toast } = useToast();
  const merchantToken = localStorage.getItem('merchantToken');

  // Fetch business metrics
  const { data: businessMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<BusinessMetrics>({
    queryKey: ["/api/merchant/business-metrics", { timeRange }],
    refetchInterval: 60000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  // Fetch revenue trends
  const { data: revenueData = [], isLoading: revenueLoading, refetch: refetchRevenue } = useQuery<RevenueData[]>({
    queryKey: ["/api/merchant/revenue-trends", { timeRange }],
    refetchInterval: 300000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  // Fetch customer segments
  const { data: customerSegments = [], isLoading: segmentsLoading, refetch: refetchSegments } = useQuery<CustomerSegments[]>({
    queryKey: ["/api/merchant/customer-segments", { timeRange }],
    refetchInterval: 300000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  // Fetch performance goals
  const { data: performanceGoals = [], isLoading: goalsLoading, refetch: refetchGoals } = useQuery<PerformanceGoals[]>({
    queryKey: ["/api/merchant/performance-goals"],
    refetchInterval: 600000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchMetrics(),
      refetchRevenue(),
      refetchSegments(),
      refetchGoals()
    ]);
    setRefreshing(false);
    toast({
      title: "Analytics refreshed",
      description: "Latest business metrics have been loaded",
    });
  };

  const exportAnalytics = () => {
    const data = {
      metrics: businessMetrics,
      revenue: revenueData,
      segments: customerSegments,
      goals: performanceGoals,
      exportDate: new Date().toISOString(),
      timeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Analytics exported",
      description: "Business data has been downloaded",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? 
      <ArrowUp className="w-4 h-4 text-green-400" /> : 
      <ArrowDown className="w-4 h-4 text-red-400" />;
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'on-track': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'behind': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (metricsLoading || revenueLoading || segmentsLoading || goalsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/10 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Business Analytics</h2>
          <p className="text-gray-300">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={exportAnalytics}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-400" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(businessMetrics?.totalRevenue || 0)}
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(businessMetrics?.revenueGrowth || 0)}
              <span className={`text-sm ml-1 ${getGrowthColor(businessMetrics?.revenueGrowth || 0)}`}>
                {formatPercentage(businessMetrics?.revenueGrowth || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-400" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(businessMetrics?.totalCustomers || 0).toLocaleString()}
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(businessMetrics?.customerGrowth || 0)}
              <span className={`text-sm ml-1 ${getGrowthColor(businessMetrics?.customerGrowth || 0)}`}>
                {formatPercentage(businessMetrics?.customerGrowth || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-purple-400" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(businessMetrics?.averageOrderValue || 0)}
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(businessMetrics?.aovGrowth || 0)}
              <span className={`text-sm ml-1 ${getGrowthColor(businessMetrics?.aovGrowth || 0)}`}>
                {formatPercentage(businessMetrics?.aovGrowth || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2 text-orange-400" />
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(businessMetrics?.profitMargin || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">
              Net: {formatCurrency(businessMetrics?.netProfit || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Revenue Trends
          </CardTitle>
          <CardDescription className="text-gray-300">
            Revenue, orders, and customer acquisition over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0088FE" 
                  strokeWidth={3}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 6 }}
                  name="revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                  name="orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments and Performance Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-400" />
              Customer Segments
            </CardTitle>
            <CardDescription className="text-gray-300">
              Customer distribution by value and behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {customerSegments.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white text-sm">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">{segment.count}</div>
                    <div className="text-gray-400 text-xs">{formatCurrency(segment.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-400" />
              Performance Goals
            </CardTitle>
            <CardDescription className="text-gray-300">
              Progress toward business objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceGoals.map((goal, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-medium text-sm">{goal.metric}</h4>
                    <Badge className={`text-xs ${getGoalStatusColor(goal.status)}`}>
                      {goal.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Current: {goal.current}</span>
                    <span className="text-gray-400">Target: {goal.target}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.progress >= 100 ? 'bg-green-500' : 
                        goal.progress >= 75 ? 'bg-blue-500' : 
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {goal.progress.toFixed(1)}% complete
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Card Performance */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-orange-400" />
            Gift Card Performance
          </CardTitle>
          <CardDescription className="text-gray-300">
            Gift card issuance, redemption rates, and revenue impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
              <h3 className="text-2xl font-bold text-blue-400">
                {businessMetrics?.giftCardsIssued || 0}
              </h3>
              <p className="text-sm text-blue-300">Cards Issued</p>
              <p className="text-xs text-gray-400 mt-1">This period</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
              <h3 className="text-2xl font-bold text-green-400">
                {(businessMetrics?.redemptionRate || 0).toFixed(1)}%
              </h3>
              <p className="text-sm text-green-300">Redemption Rate</p>
              <p className="text-xs text-gray-400 mt-1">Industry avg: 85%</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
              <h3 className="text-2xl font-bold text-purple-400">
                {formatCurrency(businessMetrics?.averageOrderValue || 0)}
              </h3>
              <p className="text-sm text-purple-300">Avg Card Value</p>
              <p className="text-xs text-gray-400 mt-1">Per gift card</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg border border-orange-500/30">
              <h3 className="text-2xl font-bold text-orange-400">
                {formatCurrency((businessMetrics?.totalRevenue || 0) * 0.75)}
              </h3>
              <p className="text-sm text-orange-300">Gift Card Revenue</p>
              <p className="text-xs text-gray-400 mt-1">75% of total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}