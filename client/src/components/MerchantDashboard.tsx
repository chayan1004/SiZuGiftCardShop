import { useState, useEffect } from "react";
import { X, Gift, BarChart3, Users, Settings, LogOut, Plus, Eye, Download, Cog, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  // For demo purposes, using a placeholder merchant ID
  const merchantId = "demo-merchant";

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", merchantId],
    enabled: isOpen,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<{transactions: Transaction[]}>({
    queryKey: ["/api/dashboard/transactions", merchantId],
    enabled: isOpen,
  });

  const squareOAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/auth/square");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate Square OAuth flow",
        variant: "destructive",
      });
    }
  });

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "giftcards", label: "Gift Cards", icon: Gift },
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

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              variant="outline"
              className="w-full text-slate-600 hover:bg-slate-200"
              onClick={onClose}
            >
              <LogOut className="mr-2" size={16} />
              Close Dashboard
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
                          <p className="text-slate-600 text-sm">Total Sales</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {statsLoading ? "..." : `$${stats?.totalSales?.toLocaleString() || 0}`}
                          </p>
                          <p className="text-green-600 text-sm">↗ +12.5% from last month</p>
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
                            {statsLoading ? "..." : stats?.activeCards || 0}
                          </p>
                          <p className="text-blue-600 text-sm">↗ +8.3% from last month</p>
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
                            {statsLoading ? "..." : stats?.redemptions || 0}
                          </p>
                          <p className="text-purple-600 text-sm">↗ +15.7% from last month</p>
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
                            {statsLoading ? "..." : stats?.customers || 0}
                          </p>
                          <p className="text-amber-600 text-sm">↗ +5.2% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Users className="text-amber-600" size={24} />
                        </div>
                      </div>
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
                      {transactionsLoading ? (
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
                      ) : transactionsData?.transactions?.length ? (
                        <div className="space-y-4">
                          {transactionsData.transactions.slice(0, 5).map((transaction, index) => (
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
                        <Button 
                          onClick={handleSquareLogin}
                          disabled={squareOAuthMutation.isPending}
                          className="w-full bg-square-blue text-white hover:bg-square-blue-dark"
                        >
                          <Plus className="mr-2" size={16} />
                          {squareOAuthMutation.isPending ? "Connecting..." : "Connect Square Account"}
                        </Button>
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
