import { useState, useEffect } from "react";
import { Gift, BarChart3, Users, Settings, LogOut, Plus, Eye, Download, Cog, DollarSign, ShoppingCart, TrendingUp, CheckCircle, CreditCard, Loader2, History, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth, logout } from "@/components/ProtectedRoute";
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
  const auth = useAuth();
  const [, setLocation] = useLocation();

  // Use authenticated merchant ID
  const merchantId = auth.merchantId || "";

  // Redirect if not authenticated as merchant
  useEffect(() => {
    if (!auth.isAuthenticated || auth.role !== 'merchant') {
      setLocation("/merchant-login");
    }
  }, [auth.isAuthenticated, auth.role, setLocation]);

  // Fetch merchant stats with 30-second refresh
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!merchantId && auth.isAuthenticated && auth.role === 'merchant',
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  // Auto-refresh effect
  useEffect(() => {
    if (merchantId && auth.isAuthenticated) {
      const interval = setInterval(() => {
        refetchStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [merchantId, auth.isAuthenticated, refetchStats]);

  const handleLogout = async () => {
    try {
      await logout();
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
  if (!auth.isAuthenticated || auth.role !== 'merchant' || statsLoading) {
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
      <EmailVerificationBanner merchantEmail={auth.merchantId || ""} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Merchant Dashboard</h1>
            <p className="text-gray-300">Welcome back! Here's your business overview.</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/10 p-1 rounded-xl backdrop-blur-sm border border-white/20">
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
              className={`flex-1 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
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
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Total Sales</p>
                        <p className="text-2xl font-bold text-white">${stats?.data?.totalRevenue?.toFixed(2) || '0.00'}</p>
                      </div>
                      <DollarSign className="text-green-400" size={24} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Active Cards</p>
                        <p className="text-2xl font-bold text-white">{stats?.data?.activeCards || 0}</p>
                      </div>
                      <Gift className="text-blue-400" size={24} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Redemptions</p>
                        <p className="text-2xl font-bold text-white">{stats?.data?.totalRedemptions || 0}</p>
                      </div>
                      <CreditCard className="text-purple-400" size={24} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Customers</p>
                        <p className="text-2xl font-bold text-white">{stats?.data?.customers || 0}</p>
                      </div>
                      <Users className="text-cyan-400" size={24} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {stats?.data?.chartData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/10 backdrop-blur-2xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats?.data?.chartData || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                          <YAxis stroke="rgba(255,255,255,0.5)" />
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
                    <CardHeader>
                      <CardTitle className="text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats?.data?.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                              <div>
                                <p className="text-white text-sm font-medium">{activity.type}</p>
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