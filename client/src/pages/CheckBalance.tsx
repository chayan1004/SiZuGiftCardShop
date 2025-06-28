import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Search, CheckCircle, AlertCircle, Clock, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";

interface GiftCardBalance {
  gan: string;
  balance: number;
  status: string;
  lastActivity?: {
    type: string;
    amount: number;
    createdAt: string;
  } | null;
  createdAt: string;
}

export default function CheckBalance() {
  const [gan, setGan] = useState("");
  const [searchGan, setSearchGan] = useState("");

  // Navigation handlers
  const handleOpenPurchaseModal = () => {
    // Navigate to store page
    window.location.href = '/store';
  };

  const handleOpenDashboard = () => {
    // Navigate to admin page
    window.location.href = '/admin';
  };

  // Query for gift card balance
  const { data: balanceData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/giftcards', searchGan, 'validate'],
    enabled: !!searchGan,
    retry: false
  });

  const handleSearch = () => {
    if (gan.trim()) {
      setSearchGan(gan.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const maskGan = (ganNumber: string) => {
    if (ganNumber.length <= 4) return ganNumber;
    return '*'.repeat(ganNumber.length - 4) + ganNumber.slice(-4);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'deactivated': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'activate': return <CheckCircle className="text-green-600" size={16} />;
      case 'redeem': return <CreditCard className="text-blue-600" size={16} />;
      case 'adjust_increment': return <Gift className="text-purple-600" size={16} />;
      default: return <Clock className="text-gray-600" size={16} />;
    }
  };

  return (
    <>
      <Navigation 
        onOpenPurchaseModal={handleOpenPurchaseModal}
        onOpenDashboard={handleOpenDashboard}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 gradient-premium rounded-3xl flex items-center justify-center shadow-2xl">
                <CreditCard className="text-white" size={36} />
              </div>
            </div>
            
            <h1 className="font-display text-6xl font-black leading-tight mb-6">
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Check Balance
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Enter your gift card number to check your current balance and recent activity
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="glass-premium border-cyan-400/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-center text-white font-display text-2xl">
                  Gift Card Lookup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Enter gift card number (GAN)"
                      value={gan}
                      onChange={(e) => setGan(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-white/10 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 text-lg py-6"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={!gan.trim() || isLoading}
                    className="px-8 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <Search size={20} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-premium border-red-400/20 shadow-2xl mb-8">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                    <h3 className="text-xl font-semibold text-white mb-2">Gift Card Not Found</h3>
                    <p className="text-gray-300">
                      Please check the gift card number and try again.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {balanceData?.success && balanceData.giftCard && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Balance Card */}
                <Card className="glass-premium border-green-400/20 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-1">
                    <div className="bg-slate-900/80 rounded-2xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                            <CreditCard className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">Active Gift Card</h3>
                            <p className="text-gray-300">Card Number: {maskGan(balanceData.giftCard.gan)}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(balanceData.giftCard.status)}`}>
                          {balanceData.giftCard.status}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">Current Balance</h4>
                          <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            ${balanceData.giftCard.balance.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">Created</h4>
                          <div className="text-xl text-gray-300">
                            {formatDate(balanceData.giftCard.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Last Activity */}
                {balanceData.giftCard.lastActivity && (
                  <Card className="glass-premium border-blue-400/20 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="text-white font-display text-xl flex items-center space-x-2">
                        <Clock size={24} />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-4">
                          {getActivityIcon(balanceData.giftCard.lastActivity.type)}
                          <div>
                            <div className="text-white font-medium capitalize">
                              {balanceData.giftCard.lastActivity.type.replace('_', ' ')}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {formatDate(balanceData.giftCard.lastActivity.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">
                            ${Math.abs(balanceData.giftCard.lastActivity.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {balanceData.giftCard.lastActivity.amount > 0 ? 'Added' : 'Used'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </>
  );
}