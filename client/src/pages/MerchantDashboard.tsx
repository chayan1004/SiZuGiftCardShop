import { useState, useEffect } from "react";
import { Gift, BarChart3, Users, Settings, LogOut, Plus, Eye, Download, Cog, DollarSign, ShoppingCart, TrendingUp, CheckCircle, CreditCard, Loader2, History, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Authentication utilities simplified - using localStorage directly
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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

  // Fetch merchant stats with 30-second refresh
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!merchantId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  // Auto-refresh effect
  useEffect(() => {
    if (merchantId && localStorage.getItem('merchantToken')) {
      const interval = setInterval(() => {
        refetchStats();
      }, 30000);
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-xs lg:text-sm font-medium">Total Sales</p>
                        <p className="text-lg lg:text-2xl font-bold text-white truncate">${stats?.data?.totalRevenue?.toFixed(2) || '0.00'}</p>
                      </div>
                      <DollarSign className="text-green-400 flex-shrink-0" size={20} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-xs lg:text-sm font-medium">Active Cards</p>
                        <p className="text-lg lg:text-2xl font-bold text-white">{stats?.data?.activeCards || 0}</p>
                      </div>
                      <Gift className="text-blue-400 flex-shrink-0" size={20} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-xs lg:text-sm font-medium">Redemptions</p>
                        <p className="text-lg lg:text-2xl font-bold text-white">{stats?.data?.totalRedemptions || 0}</p>
                      </div>
                      <CreditCard className="text-purple-400 flex-shrink-0" size={20} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-xs lg:text-sm font-medium">Customers</p>
                        <p className="text-lg lg:text-2xl font-bold text-white">{stats?.data?.customers || 0}</p>
                      </div>
                      <Users className="text-cyan-400 flex-shrink-0" size={20} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {stats?.data?.chartData && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                  <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                    <CardHeader className="pb-2 lg:pb-6">
                      <CardTitle className="text-white text-lg lg:text-xl">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 lg:pt-0">
                      <ResponsiveContainer width="100%" height={250} className="lg:!h-[300px]">
                        <BarChart data={stats?.data?.chartData || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" className="text-xs lg:text-sm" />
                          <YAxis stroke="rgba(255,255,255,0.5)" className="text-xs lg:text-sm" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              color: 'white'
                            }} 
                          />
                          <Bar dataKey="revenue" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                    <CardHeader className="pb-2 lg:pb-6">
                      <CardTitle className="text-white text-lg lg:text-xl">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 lg:pt-0">
                      <div className="space-y-3 lg:space-y-4">
                        {stats?.data?.recentActivity?.slice(0, 4).map((activity: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 lg:p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-xs lg:text-sm font-medium truncate">{activity.type}</p>
                                <p className="text-gray-400 text-xs">{activity.timeAgo}</p>
                              </div>
                            </div>
                            <span className="text-green-400 font-medium">{activity.formattedAmount}</span>
                          </div>
                        )) || <p className="text-gray-400 text-center">No recent activity</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
      </div>
    </div>
  );
}