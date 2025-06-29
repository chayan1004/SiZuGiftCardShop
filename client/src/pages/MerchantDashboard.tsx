import { useState, useEffect } from "react";
import { 
  Gift, BarChart3, Users, Settings, LogOut, Plus, Eye, Download, Cog, 
  DollarSign, ShoppingCart, TrendingUp, CheckCircle, CreditCard, Loader2, 
  History, Package, Activity, Database, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Authentication utilities simplified - using localStorage directly
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import TransactionHistoryPanel from "@/components/TransactionHistoryPanel";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import MerchantBulkPurchase from "@/components/MerchantBulkPurchase";
import { useLocation } from "wouter";

interface DashboardStats {
  totalSales: number;
  activeCards: number;
  redemptions: number;
  customers: number;
}

interface Transaction {
  type: string;
  amount: number;
  email?: string;
  gan?: string;
  createdAt: string;
}

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get merchant data from localStorage
  const merchantData = localStorage.getItem('merchantData');
  const merchant = merchantData ? JSON.parse(merchantData) : null;
  const merchantId = merchant?.merchantId || "";

  // Redirect if not authenticated as merchant
  useEffect(() => {
    if (!merchantId || !localStorage.getItem('merchantToken')) {
      setLocation("/merchant-login");
    }
  }, [merchantId, setLocation]);

  // Enhanced merchant stats with real-time updates
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!merchantId,
    refetchInterval: 10000, // More frequent updates for real-time feel
    refetchOnWindowFocus: true,
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Fetch merchant transaction history for trend analysis
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/merchant/transactions'],
    enabled: !!merchantId,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // Calculate advanced performance metrics and trends
  const recentTransactions = transactions || [];
  const totalRevenue = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const avgTransactionValue = recentTransactions.length > 0 ? totalRevenue / recentTransactions.length : 0;
  
  // Growth calculations
  const last7Days = recentTransactions.filter(t => {
    const date = new Date(t.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });
  
  const revenueGrowth = last7Days.length >= 2 ? 
    ((last7Days[last7Days.length - 1]?.amount || 0) - (last7Days[0]?.amount || 0)) / (last7Days[0]?.amount || 1) * 100 : 0;

  // Real-time data freshness indicator
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 10000); // Update timestamp every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 30) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  // Auto-refresh effect with enhanced monitoring
  useEffect(() => {
    if (merchantId && localStorage.getItem('merchantToken')) {
      const interval = setInterval(() => {
        refetchStats();
        setLastUpdated(new Date());
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [merchantId, refetchStats]);

  const handleLogout = async () => {
    try {
      // Clear localStorage and redirect
      localStorage.removeItem('merchantToken');
      localStorage.removeItem('merchantData');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      setLocation("/");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an error logging out",
        variant: "destructive"
      });
    }
  };

  // Show loading while checking authentication or loading data
  if (!merchantId || !localStorage.getItem('merchantToken') || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Email Verification Banner */}
      <EmailVerificationBanner merchantEmail={merchantId || ""} />
      
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Merchant Dashboard</h1>
            <p className="text-sm lg:text-base text-gray-300">Welcome back! Here's your business overview.</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 self-start sm:self-auto"
          >
            <LogOut size={14} className="lg:mr-2" />
            <span className="hidden lg:inline">Logout</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 lg:mb-8 bg-white/10 p-1 rounded-xl backdrop-blur-sm border border-white/20">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "transactions", label: "Transactions", icon: History },
            { id: "bulk-purchase", label: "Bulk Purchase", icon: Package },
            { id: "settings", label: "Settings", icon: Settings }
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className={`flex-1 text-xs lg:text-sm ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon size={14} className="mr-1 lg:mr-2" />
              <span className="hidden sm:inline lg:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && stats && (
            <div className="space-y-4 lg:space-y-6">
              {/* Enhanced Premium Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-400 text-xs lg:text-sm font-medium">Total Sales</p>
                          <p className="text-lg lg:text-2xl font-bold text-white truncate">${stats?.data?.totalRevenue?.toFixed(2) || '0.00'}</p>
                          <div className="flex items-center mt-2">
                            <Badge className={`text-xs ${revenueGrowth > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                              {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                            </Badge>
                            <span className="text-xs text-gray-500 ml-2">vs last week</span>
                          </div>
                        </div>
                        <motion.div
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <DollarSign className="text-green-400" size={24} />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-400 text-xs lg:text-sm font-medium">Active Cards</p>
                          <p className="text-lg lg:text-2xl font-bold text-white">{stats?.data?.activeCards || 0}</p>
                          <div className="flex items-center mt-2">
                            <motion.div 
                              className="w-2 h-2 bg-blue-400 rounded-full mr-2"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-xs text-blue-400">Live tracking</span>
                          </div>
                        </div>
                        <motion.div
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Gift className="text-blue-400" size={24} />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-400 text-xs lg:text-sm font-medium">Redemptions</p>
                          <p className="text-lg lg:text-2xl font-bold text-white">{stats?.data?.totalRedemptions || 0}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-xs text-purple-400">
                              {stats?.data?.activeCards > 0 ? ((stats?.data?.totalRedemptions || 0) / stats?.data?.activeCards * 100).toFixed(1) : 0}% usage rate
                            </span>
                          </div>
                        </div>
                        <motion.div
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CreditCard className="text-purple-400" size={24} />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-400 text-xs lg:text-sm font-medium">Customers</p>
                          <p className="text-lg lg:text-2xl font-bold text-white">{stats?.data?.customers || 0}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-xs text-cyan-400">
                              ${avgTransactionValue.toFixed(0)} avg/customer
                            </span>
                          </div>
                        </div>
                        <motion.div
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Users className="text-cyan-400" size={24} />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Enhanced Premium Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Revenue Trend Chart with Premium Enhancements */}
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader className="pb-2 lg:pb-6">
                    <CardTitle className="text-lg lg:text-xl text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Revenue Performance
                      </div>
                      <div className="flex items-center space-x-2">
                        {revenueGrowth !== 0 && (
                          <Badge className={`text-xs ${revenueGrowth > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                            {revenueGrowth > 0 ? '↗' : '↘'} {Math.abs(revenueGrowth).toFixed(1)}%
                          </Badge>
                        )}
                        <span className="text-xs text-blue-400 font-medium">${avgTransactionValue.toFixed(0)}/avg</span>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-300">Sales performance with growth indicators and real-time updates</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 lg:pt-0">
                    <div className="w-full h-[250px] lg:h-[350px] relative">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={stats?.data?.chartData || []} 
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <defs>
                              <linearGradient id="merchantRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                              </linearGradient>
                              <filter id="merchantGlow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge> 
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            <CartesianGrid 
                              strokeDasharray="2 4" 
                              stroke="rgba(255,255,255,0.08)" 
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                            />
                            <YAxis 
                              tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value) => `$${value}`}
                              dx={-10}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '16px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                                color: '#fff',
                                padding: '12px 16px',
                                backdropFilter: 'blur(12px)'
                              }}
                              labelStyle={{ color: '#E2E8F0', fontWeight: 600, marginBottom: '8px' }}
                              formatter={(value, name) => [
                                <span style={{ color: '#06b6d4', fontWeight: 600 }}>
                                  ${Number(value).toFixed(2)}
                                </span>,
                                <span style={{ color: '#94A3B8' }}>
                                  Revenue
                                </span>
                              ]}
                              cursor={{ stroke: 'rgba(6, 182, 212, 0.3)', strokeWidth: 2 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#06b6d4" 
                              strokeWidth={4}
                              dot={{ 
                                fill: '#06b6d4', 
                                strokeWidth: 3, 
                                r: 5,
                                filter: 'url(#merchantGlow)'
                              }}
                              activeDot={{ 
                                r: 8, 
                                stroke: '#06b6d4', 
                                strokeWidth: 3, 
                                fill: '#22d3ee',
                                filter: 'url(#merchantGlow)',
                                style: { cursor: 'pointer' }
                              }}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      
                      {/* Advanced Performance Metrics Overlay */}
                      <motion.div 
                        className="absolute top-4 left-4 bg-black/40 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20 shadow-2xl"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-400 font-semibold">Total: ${totalRevenue.toFixed(0)}</span>
                          </div>
                          <div className="w-px h-3 bg-white/20"></div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 font-medium">Avg: ${avgTransactionValue.toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-300 mt-2">
                          <span>Growth: {revenueGrowth > 0 ? '↗' : revenueGrowth < 0 ? '↘' : '→'} {Math.abs(revenueGrowth).toFixed(1)}%</span>
                          <span className="text-gray-400">{recentTransactions.length} transactions</span>
                        </div>
                      </motion.div>

                      {/* Enhanced Real-time Status Panel */}
                      <motion.div 
                        className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20 shadow-xl"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <div className="flex items-center space-x-2">
                          <motion.div 
                            className="relative flex items-center"
                            animate={{ 
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-40"></div>
                          </motion.div>
                          <div className="text-xs">
                            <div className="text-cyan-400 font-medium">Live Data</div>
                            <div className="text-gray-400 text-[10px]">{formatTimeAgo(lastUpdated)}</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Activity Panel with Premium Features */}
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader className="pb-2 lg:pb-6">
                    <CardTitle className="text-lg lg:text-xl text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-400" />
                        Transaction Activity
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        {recentTransactions.length} total
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-300">Recent transaction activity with real-time updates</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 lg:pt-0">
                    <div className="w-full h-[250px] lg:h-[350px] relative">
                      {transactionsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                        </div>
                      ) : (
                        <div className="space-y-3 lg:space-y-4 max-h-full overflow-y-auto">
                          {(stats?.data?.recentActivity?.slice(0, 6).map((activity: any, index: number) => (
                            <motion.div 
                              key={index} 
                              className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <motion.div 
                                  className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-green-400 rounded-full flex-shrink-0"
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.7, 1, 0.7]
                                  }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.2
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white text-sm font-medium truncate">{activity.type}</p>
                                  <p className="text-gray-400 text-xs">{activity.timeAgo}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-green-400 font-semibold">{activity.formattedAmount}</span>
                                <div className="text-xs text-gray-400">
                                  {activity.email ? activity.email.substring(0, 15) + '...' : 'System'}
                                </div>
                              </div>
                            </motion.div>
                          ))) || (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Activity className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-400 text-center">No recent activity</p>
                                <p className="text-gray-500 text-xs mt-2">Transactions will appear here</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Real-time Activity Indicator */}
                      <motion.div 
                        className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20 shadow-xl"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className="flex items-center space-x-2">
                          <motion.div 
                            className="relative"
                            animate={{ 
                              rotate: [0, 360]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          >
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-30"></div>
                          </motion.div>
                          <div className="text-xs">
                            <div className="text-green-400 font-medium">Live</div>
                            <div className="text-gray-400 text-[10px]">{formatTimeAgo(lastUpdated)}</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <TransactionHistoryPanel />
          )}

          {activeTab === "bulk-purchase" && (
            <MerchantBulkPurchase />
          )}

          {activeTab === "settings" && (
            <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-gray-300">
                  <p>Account management features will be available here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Enhanced Merchant System Status Bar */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 z-40"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-cyan-400 font-medium">Merchant Portal Active</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <Database className="w-3 h-3" />
                <span>Connected</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <Activity className="w-3 h-3" />
                <span>API: {statsLoading ? 'Syncing...' : 'Ready'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-xs text-gray-400">
                Last Update: {formatTimeAgo(lastUpdated)}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-cyan-400">{stats?.data?.activeCards || 0} Active Cards</span>
                </div>
                <div className="w-px h-3 bg-white/20"></div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">${stats?.data?.totalRevenue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="w-px h-3 bg-white/20"></div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-400">{stats?.data?.customers || 0} Customers</span>
                </div>
              </div>
              
              <motion.div 
                className="text-xs text-gray-500 font-mono"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Auto-refresh: 10s
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}