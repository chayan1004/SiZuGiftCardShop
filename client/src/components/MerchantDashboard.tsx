import { useState, useEffect } from "react";
import { X, Gift, BarChart3, Users, Settings, LogOut, Plus, Eye, Download, Cog, DollarSign, ShoppingCart, TrendingUp, CheckCircle, CreditCard, Loader2, History, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Authentication utilities simplified - using localStorage directly
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TransactionHistoryPanel from "./TransactionHistoryPanel";
import EmailVerificationBanner from "./EmailVerificationBanner";
import MerchantBulkPurchase from "./MerchantBulkPurchase";

interface MerchantDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function MerchantDashboard({ isOpen, onClose }: MerchantDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const auth = useAuth();

  // Use authenticated merchant ID
  const merchantId = auth.merchantId || "";

  // Redirect if not authenticated as merchant
  useEffect(() => {
    if (isOpen && (!auth.isAuthenticated || auth.role !== 'merchant')) {
      toast({
        title: "Access Denied",
        description: "Please log in as a merchant to access the dashboard",
        variant: "destructive"
      });
      onClose();
    }
  }, [isOpen, auth, onClose, toast]);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{
    success: boolean;
    data: {
      totalGiftCards: number;
      totalRevenue: number;
      totalRedemptions: number;
      totalRefunds: number;
      activeCards: number;
      averageCardValue: number;
      customers: number;
      recentActivity: Array<{
        type: string;
        amount: number;
        email?: string;
        gan?: string;
        createdAt: string;
        timeAgo: string;
        formattedAmount: string;
      }>;
      chartData: Array<{
        date: string;
        day: string;
        purchases: number;
        redemptions: number;
        revenue: number;
      }>;
      lastUpdated: string;
    };
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isOpen && auth.isAuthenticated && auth.role === 'merchant',
    refetchInterval: 30000, // Refresh every 30 seconds for live data
    meta: {
      headers: {
        'x-merchant-token': auth.token || ''
      }
    }
  });

  const [isSquareConnected, setIsSquareConnected] = useState(false);
  const [squareBusinessName, setSquareBusinessName] = useState("");

  // Check Square connection status
  useEffect(() => {
    const checkSquareConnection = async () => {
      if (!auth.isAuthenticated || !merchantId) return;
      
      try {
        const response = await fetch("/api/merchant/me", {
          headers: {
            'x-merchant-token': auth.token || '',
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        if (data.success && data.merchant) {
          // Check if merchant has Square tokens (not demo tokens)
          const hasSquareConnection = data.merchant.accessToken && 
                                     !data.merchant.accessToken.startsWith('demo_') &&
                                     !data.merchant.accessToken.includes('pending');
          setIsSquareConnected(hasSquareConnection);
        }
      } catch (error) {
        console.error('Failed to check Square connection:', error);
      }
    };

    checkSquareConnection();
  }, [auth, merchantId]);

  // Listen for Square OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SQUARE_OAUTH_SUCCESS') {
        setIsSquareConnected(true);
        if (event.data.merchantInfo?.businessName) {
          setSquareBusinessName(event.data.merchantInfo.businessName);
        }
        toast({
          title: "Square Connected",
          description: "Your Square account has been successfully linked!",
        });
      } else if (event.data.type === 'SQUARE_OAUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: "Failed to connect Square account. Please try again.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const squareOAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/square", {
        method: "GET",
        headers: {
          'x-merchant-token': auth.token || '',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get auth URL');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Open Square OAuth in popup
        const popup = window.open(
          data.authUrl, 
          'square-oauth', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // Check if popup was blocked
        if (!popup) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups and try again",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate Square OAuth flow",
        variant: "destructive",
      });
    }
  });

  const handleLogout = () => {
    logout();
    onClose();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "transactions", label: "Transactions", icon: History },
    { id: "giftcards", label: "Gift Cards", icon: Gift },
    { id: "bulk-purchase", label: "Bulk Purchase", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleSquareLogin = () => {
    squareOAuthMutation.mutate();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100">
      <div className="flex h-full">
        {/* Sidebar */}
        <motion.div 
          className="w-64 bg-white shadow-lg border-r border-slate-200"
          initial={{ x: -264 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-square-blue to-square-blue-dark rounded-lg flex items-center justify-center">
                <Gift className="text-white" size={16} />
              </div>
              <span className="text-lg font-bold text-slate-800">SiZu Dashboard</span>
            </div>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:text-square-blue hover:bg-slate-50 text-[#4d1b78]"
                  >
                    <item.icon size={20} />
                    <span className="font-medium text-[#9333ea]">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <Button
              variant="outline"
              className="w-full text-red-600 hover:bg-red-50 border-red-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-2" size={16} />
              Logout
            </Button>
            <Button
              variant="outline"
              className="w-full text-slate-600 hover:bg-slate-200"
              onClick={onClose}
            >
              <X className="mr-2" size={16} />
              Close
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">
                {sidebarItems.find(item => item.id === activeTab)?.label || "Dashboard"}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </Button>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600 text-sm">Total Revenue</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {analyticsLoading ? "..." : `$${(analyticsData?.data?.totalRevenue || 0).toFixed(2)}`}
                          </p>
                          <p className="text-green-600 text-sm">↗ {analyticsData?.data?.totalGiftCards || 0} gift cards</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="text-green-600" size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600 text-sm">Active Cards</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {analyticsLoading ? "..." : analyticsData?.data?.activeCards || 0}
                          </p>
                          <p className="text-blue-600 text-sm">Avg: ${(analyticsData?.data?.averageCardValue || 0).toFixed(2)}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Gift className="text-blue-600" size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600 text-sm">Redemptions</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {analyticsLoading ? "..." : analyticsData?.data?.totalRedemptions || 0}
                          </p>
                          <p className="text-purple-600 text-sm">Refunds: {analyticsData?.data?.totalRefunds || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="text-purple-600" size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600 text-sm">Customers</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {analyticsLoading ? "..." : analyticsData?.data?.customers || 0}
                          </p>
                          <p className="text-amber-600 text-sm">
                            {analyticsData?.data?.lastUpdated ? 
                              `Updated ${new Date(analyticsData.data.lastUpdated).toLocaleTimeString()}` : 
                              'Live data'
                            }
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Users className="text-amber-600" size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        7-Day Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      ) : analyticsData?.data?.chartData?.length ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={analyticsData.data.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                name === 'revenue' ? `$${value}` : value,
                                name === 'purchases' ? 'Purchases' : 
                                name === 'redemptions' ? 'Redemptions' : 'Revenue'
                              ]}
                            />
                            <Bar dataKey="purchases" fill="#3b82f6" name="purchases" />
                            <Bar dataKey="redemptions" fill="#8b5cf6" name="redemptions" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                          <div className="text-center">
                            <BarChart3 className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                            <p>No data to display</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Performance Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">
                                {analyticsData?.data?.totalGiftCards || 0}
                              </p>
                              <p className="text-sm text-green-700">Total Cards</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">
                                ${(analyticsData?.data?.averageCardValue || 0).toFixed(0)}
                              </p>
                              <p className="text-sm text-blue-700">Avg Value</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Active Cards</span>
                              <span className="font-medium">{analyticsData?.data?.activeCards || 0}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${analyticsData?.data?.totalGiftCards ? 
                                    (analyticsData.data.activeCards / analyticsData.data.totalGiftCards) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Redemption Rate</span>
                              <span className="font-medium">
                                {analyticsData?.data?.totalGiftCards ? 
                                  `${((analyticsData.data.totalRedemptions / analyticsData.data.totalGiftCards) * 100).toFixed(1)}%` : 
                                  '0%'
                                }
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${analyticsData?.data?.totalGiftCards ? 
                                    (analyticsData.data.totalRedemptions / analyticsData.data.totalGiftCards) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity and Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-pulse">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                                <div>
                                  <div className="w-24 h-4 bg-slate-300 rounded mb-1"></div>
                                  <div className="w-32 h-3 bg-slate-300 rounded"></div>
                                </div>
                              </div>
                              <div className="w-16 h-4 bg-slate-300 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : analyticsData?.data?.recentActivity?.length ? (
                        <div className="space-y-4">
                          {analyticsData.data.recentActivity.slice(0, 5).map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  transaction.type === 'PURCHASE' ? 'bg-green-100' : 'bg-blue-100'
                                }`}>
                                  {transaction.type === 'PURCHASE' ? (
                                    <Plus className={`text-green-600`} size={16} />
                                  ) : (
                                    <ShoppingCart className={`text-blue-600`} size={16} />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">
                                    Gift Card {transaction.type === 'PURCHASE' ? 'Purchased' : 'Redeemed'}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {transaction.email || transaction.gan}
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold text-slate-800">
                                {transaction.type === 'PURCHASE' ? '+' : '-'}${(transaction.amount / 100).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <p>No transactions yet</p>
                          <p className="text-sm">Start by connecting your Square account</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {isSquareConnected ? (
                          <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-green-800">Square Connected</p>
                              {squareBusinessName && (
                                <p className="text-sm text-green-600">{squareBusinessName}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => squareOAuthMutation.mutate()}
                            disabled={squareOAuthMutation.isPending}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            <CreditCard className="mr-2" size={16} />
                            {squareOAuthMutation.isPending ? "Connecting..." : "Connect Square Account"}
                          </Button>
                        )}
                        <Button variant="outline" className="w-full">
                          <Eye className="mr-2" size={16} />
                          View All Gift Cards
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="mr-2" size={16} />
                          Download Report
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Cog className="mr-2" size={16} />
                          Manage Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === "transactions" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <TransactionHistoryPanel />
              </motion.div>
            )}

            {activeTab === "giftcards" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Gift Cards Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-slate-500">
                      <Gift size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Gift Cards Management</p>
                      <p className="text-sm">Connect your Square account to manage gift cards</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "customers" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-slate-500">
                      <Users size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Customer Management</p>
                      <p className="text-sm">View and manage your customers</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "bulk-purchase" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MerchantBulkPurchase />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-slate-500">
                      <Settings size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Account Settings</p>
                      <p className="text-sm">Configure your Square integration and preferences</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
