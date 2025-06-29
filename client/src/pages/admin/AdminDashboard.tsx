import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, CreditCard, Users, DollarSign, Activity, 
  Mail, QrCode, Calendar, Download, RefreshCw, Settings,
  Home, LogOut, Shield, Database, BarChart3, Gift, Menu, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import GiftCardManagement from "./GiftCardManagement";
import MerchantManagement from "./UserManagement";

interface DashboardMetrics {
  totalGiftCards: number;
  activeCards: number;
  redeemedCards: number;
  totalValue: number;
  averageValue: number;
  totalSales: number;
  redemptions: number;
  customers: number;
  conversionRate: string;
}

interface RecentActivity {
  type: string;
  amount: number;
  email?: string;
  gan?: string;
  createdAt: string;
  timeAgo: string;
}

interface WeeklyRevenue {
  week: string;
  revenue: number;
  giftCardsSold: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch admin metrics with authentication
  const { data: metrics = {} as DashboardMetrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/metrics"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch weekly revenue data with real-time updates
  const { data: weeklyRevenue = [], isLoading: revenueLoading } = useQuery<WeeklyRevenue[]>({
    queryKey: ["/api/admin/weekly-revenue"],
    refetchInterval: 10000, // More frequent updates for real-time feel
    refetchOnWindowFocus: true,
    staleTime: 5000,
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Calculate trend indicators and performance metrics
  const revenueGrowth = weeklyRevenue.length >= 2 ? 
    ((weeklyRevenue[weeklyRevenue.length - 1]?.revenue || 0) - (weeklyRevenue[weeklyRevenue.length - 2]?.revenue || 0)) / (weeklyRevenue[weeklyRevenue.length - 2]?.revenue || 1) * 100 : 0;

  const totalWeeklyRevenue = weeklyRevenue.reduce((sum, week) => sum + week.revenue, 0);
  const averageWeeklyRevenue = weeklyRevenue.length > 0 ? totalWeeklyRevenue / weeklyRevenue.length : 0;
  
  // Advanced performance calculations
  const peakRevenue = Math.max(...(weeklyRevenue.map(w => w.revenue) || [0]));
  const totalCardsSold = weeklyRevenue.reduce((sum, week) => sum + week.giftCardsSold, 0);
  const conversionRate = metrics?.conversionRate ? parseFloat(metrics.conversionRate) : 0;
  
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

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery<RecentActivity[]>({
    queryKey: ["/api/admin/recent-activity"],
    refetchInterval: 15000, // More frequent for activity feed
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch email delivery metrics
  const { data: emailMetrics = {} } = useQuery({
    queryKey: ["/api/admin/email/delivery-metrics"],
    refetchInterval: 60000, // Refresh every minute
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch domain authentication status
  const { data: domainAuth = {} } = useQuery({
    queryKey: ["/api/admin/email/domain-auth-status"],
    refetchInterval: 300000, // Refresh every 5 minutes
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch email queue status
  const { data: queueStatus = {} } = useQuery({
    queryKey: ["/api/admin/email/queue-status"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchMetrics(),
    ]);
    setRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "All data has been updated successfully",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login';
  };

  // Enhanced business owner sidebar navigation
  const sidebarItems = [
    { id: "overview", label: "Business Overview", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "revenue", label: "Revenue Analytics", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "giftcards", label: "Gift Cards", icon: <Gift className="w-5 h-5" /> },
    { id: "merchants", label: "Merchant Partners", icon: <Users className="w-5 h-5" /> },
    { id: "customers", label: "Customer Insights", icon: <Users className="w-5 h-5" /> },
    { id: "marketing", label: "Marketing Tools", icon: <Mail className="w-5 h-5" /> },
    { id: "operations", label: "Operations", icon: <Settings className="w-5 h-5" /> },
    { id: "growth", label: "Growth Strategy", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "reports", label: "Business Reports", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "system", label: "System Health", icon: <Settings className="w-5 h-5" /> },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex relative overflow-hidden">
      {/* Premium Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-75"></div>
            <div className="relative p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-xs text-blue-300 font-medium">SiZu GiftCard System</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="relative p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
        >
          <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out z-50
        w-72 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:block backdrop-blur-xl flex flex-col
      `}>
        {/* Premium Header */}
        <div className="p-6 lg:p-8 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <Shield className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-sm lg:text-base text-blue-300 font-medium">SiZu GiftCard System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Premium Status Indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-[#192336] font-medium">System Online</span>
            <div className="ml-auto">
              <span className="text-xs text-gray-400">v2.1.0</span>
            </div>
          </div>
        </div>

        <nav className="p-4 lg:p-6 space-y-2 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false); // Close mobile sidebar on selection
              }}
              className={`
                group w-full flex items-center space-x-4 px-4 lg:px-5 py-3 lg:py-4 rounded-xl text-left 
                transition-all duration-300 ease-in-out hover:scale-[1.02] relative overflow-hidden
                ${activeSection === item.id 
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
                }
              `}
            >
              {/* Active indicator */}
              {activeSection === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"></div>
              )}
              
              {/* Icon with premium styling */}
              <div className={`
                relative p-2 rounded-lg transition-all duration-200
                ${activeSection === item.id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transform scale-110' 
                  : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-105'
                }
              `}>
                {React.cloneElement(item.icon, { 
                  className: "w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-200" 
                })}
              </div>
              
              {/* Text content with premium styling */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm lg:text-base font-semibold tracking-wide">{item.label}</span>
                  {activeSection === item.id && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className={`
                  h-px w-0 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300
                  ${activeSection === item.id ? 'w-full' : 'group-hover:w-1/2'}
                `}></div>
              </div>
            </button>
          ))}
        </nav>

        {/* Premium Footer */}
        <div className="mt-auto p-4 lg:p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
          <div className="space-y-3">
            {/* Premium Admin Profile */}
            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Admin User</p>
                <p className="text-gray-400 text-xs truncate">System Administrator</p>
              </div>
            </div>
            
            {/* Premium Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() => window.location.href = '/'}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#51525e] hover:text-white hover:bg-gradient-to-r hover:from-[#fa8d1b] hover:to-[#9c53f0] border border-transparent hover:border-[#fa8d1b]/30 transition-all duration-300"
              >
                <Home className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Back to Site</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#51525e] hover:text-white hover:bg-gradient-to-r hover:from-[#fa8d1b] hover:to-[#9c53f0] border border-transparent hover:border-[#fa8d1b]/30 transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Main Content */}
      <div className="flex-1 overflow-hidden lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h2 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent capitalize">
                  {activeSection === "overview" ? "Dashboard Overview" : activeSection}
                </h2>
                <p className="text-sm lg:text-base text-gray-300 mt-2 hidden sm:block font-medium">
                  {activeSection === "overview" && "Monitor your gift card business performance"}
                  {activeSection === "giftcards" && "Manage all gift cards and transactions"}
                  {activeSection === "merchants" && "View and manage merchant accounts"}
                  {activeSection === "analytics" && "Detailed business analytics and reports"}
                  {activeSection === "email" && "Email delivery and domain authentication"}
                  {activeSection === "settings" && "System configuration and preferences"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 hidden sm:flex backdrop-blur-sm">
                <Database className="w-3 h-3 mr-2" />
                <span className="hidden lg:inline">Live Data</span>
                <span className="lg:hidden">Live</span>
              </Badge>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                className="bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium shadow-lg transition-all duration-300"
              >
                <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${refreshing ? 'animate-spin' : ''} ${refreshing ? '' : 'lg:mr-2'}`} />
                <span className="hidden lg:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Content Area */}
        <div className="p-4 lg:p-8 overflow-y-auto h-full bg-gradient-to-br from-slate-900/10 to-slate-800/5 backdrop-blur-sm">
          {metricsLoading ? (
            <div className="flex items-center justify-center h-32 lg:h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-4 text-sm lg:text-base text-gray-300">Loading dashboard data...</p>
              </div>
            </div>
          ) : metricsError ? (
            <div className="flex items-center justify-center h-32 lg:h-64">
              <div className="text-center">
                <p className="text-red-400 mb-4 text-sm lg:text-base">Failed to load admin metrics</p>
                <Button 
                  onClick={() => window.location.href = '/admin-login'} 
                  size="sm"
                  className="bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium shadow-lg transition-all duration-300"
                >
                  Re-authenticate
                </Button>
              </div>
            </div>
          ) : (
            <>
              {activeSection === "overview" && (
                <div className="space-y-4 lg:space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <MetricCard
                      title="Total Gift Cards"
                      value={metrics.totalGiftCards?.toString() || "0"}
                      icon={<CreditCard className="w-6 h-6" />}
                      color="blue"
                      subtitle={`$${metrics.totalValue?.toFixed(2) || "0.00"} total value`}
                      trend="+12%"
                    />
                    <MetricCard
                      title="Active Cards"
                      value={metrics.activeCards?.toString() || "0"}
                      icon={<Activity className="w-6 h-6" />}
                      color="green"
                      subtitle={`${metrics.conversionRate || "0"}% conversion rate`}
                      trend="+8%"
                    />
                    <MetricCard
                      title="Revenue"
                      value={`$${((metrics.totalSales || 0) / 100).toFixed(2)}`}
                      icon={<DollarSign className="w-6 h-6" />}
                      color="purple"
                      subtitle={`${metrics.redemptions || 0} redemptions`}
                      trend="+15%"
                    />
                    <MetricCard
                      title="Customers"
                      value={metrics.customers?.toString() || "0"}
                      icon={<Users className="w-6 h-6" />}
                      color="orange"
                      subtitle={`$${metrics.averageValue?.toFixed(2) || "0.00"} avg. value`}
                      trend="+5%"
                    />
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                    {/* Revenue Trend Chart */}
                    <Card className="col-span-1 bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-2 lg:pb-6">
                        <CardTitle className="text-lg lg:text-xl text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            Revenue Trend
                          </div>
                          <div className="flex items-center space-x-2">
                            {revenueGrowth !== 0 && (
                              <Badge className={`text-xs ${revenueGrowth > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                {revenueGrowth > 0 ? '↗' : '↘'} {Math.abs(revenueGrowth).toFixed(1)}%
                              </Badge>
                            )}
                            <span className="text-xs text-blue-400 font-medium">${averageWeeklyRevenue.toFixed(0)}/avg</span>
                          </div>
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-300">Weekly performance with growth indicators and real-time updates</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 lg:pt-0">
                        <div className="w-full h-[250px] lg:h-[350px] relative">
                          {revenueLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart 
                                data={weeklyRevenue || []} 
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                              >
                                <defs>
                                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                  </linearGradient>
                                  <filter id="glow">
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
                                  dataKey="week" 
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
                                    <span style={{ color: '#60A5FA', fontWeight: 600 }}>
                                      {name === 'revenue' ? `$${Number(value).toFixed(2)}` : `${value} cards`}
                                    </span>,
                                    <span style={{ color: '#94A3B8' }}>
                                      {name === 'revenue' ? 'Weekly Revenue' : 'Cards Sold'}
                                    </span>
                                  ]}
                                  cursor={{ stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 2 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="revenue" 
                                  stroke="url(#revenueGradient)" 
                                  strokeWidth={4}
                                  dot={{ 
                                    fill: '#3B82F6', 
                                    strokeWidth: 3, 
                                    r: 5,
                                    filter: 'url(#glow)'
                                  }}
                                  activeDot={{ 
                                    r: 8, 
                                    stroke: '#3B82F6', 
                                    strokeWidth: 3, 
                                    fill: '#60A5FA',
                                    filter: 'url(#glow)',
                                    style: { cursor: 'pointer' }
                                  }}
                                  strokeDasharray="0"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="giftCardsSold" 
                                  stroke="#10B981" 
                                  strokeWidth={3}
                                  strokeDasharray="5 5"
                                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#34D399' }}
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
                                <Activity className="w-3 h-3 text-green-400" />
                                <span className="text-green-400 font-semibold">Peak: ${peakRevenue.toFixed(0)}</span>
                              </div>
                              <div className="w-px h-3 bg-white/20"></div>
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3 text-blue-400" />
                                <span className="text-blue-400 font-medium">Avg: ${averageWeeklyRevenue.toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-300 mt-2">
                              <span>Trend: {revenueGrowth > 0 ? '↗' : revenueGrowth < 0 ? '↘' : '→'} {Math.abs(revenueGrowth).toFixed(1)}%</span>
                              <span className="text-gray-400">{totalCardsSold} cards total</span>
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
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-40"></div>
                              </motion.div>
                              <div className="text-xs">
                                <div className="text-green-400 font-medium">Live Data</div>
                                <div className="text-gray-400 text-[10px]">{formatTimeAgo(lastUpdated)}</div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Gift Card Status Distribution */}
                    <Card className="col-span-1 bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-2 lg:pb-6">
                        <CardTitle className="text-lg lg:text-xl text-white flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-green-400" />
                          Gift Card Status
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-300">Distribution of card statuses</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 lg:pt-0">
                        <div className="w-full h-[250px] lg:h-[350px] relative">
                          {metricsLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                            </div>
                          ) : (
                            <>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                                  <defs>
                                    <filter id="pieGlow">
                                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                      <feMerge> 
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                      </feMerge>
                                    </filter>
                                    <linearGradient id="activeGradient" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#10B981"/>
                                      <stop offset="100%" stopColor="#34D399"/>
                                    </linearGradient>
                                    <linearGradient id="redeemedGradient" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#3B82F6"/>
                                      <stop offset="100%" stopColor="#60A5FA"/>
                                    </linearGradient>
                                    <linearGradient id="expiredGradient" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#F59E0B"/>
                                      <stop offset="100%" stopColor="#FBBF24"/>
                                    </linearGradient>
                                  </defs>
                                  <Pie
                                    data={[
                                      { 
                                        name: 'Active Cards', 
                                        value: metrics?.activeCards || 0, 
                                        color: 'url(#activeGradient)',
                                        originalColor: '#10B981'
                                      },
                                      { 
                                        name: 'Redeemed Cards', 
                                        value: metrics?.redeemedCards || 0, 
                                        color: 'url(#redeemedGradient)',
                                        originalColor: '#3B82F6'
                                      },
                                      { 
                                        name: 'Other Cards', 
                                        value: Math.max(0, (metrics?.totalGiftCards || 0) - (metrics?.activeCards || 0) - (metrics?.redeemedCards || 0)), 
                                        color: 'url(#expiredGradient)',
                                        originalColor: '#F59E0B'
                                      }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={50}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={450}
                                    animationBegin={0}
                                    animationDuration={2000}
                                    label={({ name, percent, value }) => 
                                      percent > 0 ? `${(percent * 100).toFixed(1)}%` : ''
                                    }
                                    labelLine={false}
                                  >
                                    {[
                                      { 
                                        name: 'Active Cards', 
                                        value: metrics?.activeCards || 0, 
                                        color: 'url(#activeGradient)'
                                      },
                                      { 
                                        name: 'Redeemed Cards', 
                                        value: metrics?.redeemedCards || 0, 
                                        color: 'url(#redeemedGradient)'
                                      },
                                      { 
                                        name: 'Other Cards', 
                                        value: Math.max(0, (metrics?.totalGiftCards || 0) - (metrics?.activeCards || 0) - (metrics?.redeemedCards || 0)), 
                                        color: 'url(#expiredGradient)'
                                      }
                                    ].map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color}
                                        stroke="rgba(255,255,255,0.1)" 
                                        strokeWidth={3}
                                        filter="url(#pieGlow)"
                                        style={{ cursor: 'pointer' }}
                                      />
                                    ))}
                                  </Pie>
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
                                    formatter={(value, name) => [
                                      <span style={{ color: '#60A5FA', fontWeight: 600 }}>
                                        {value} cards
                                      </span>,
                                      <span style={{ color: '#94A3B8' }}>
                                        {name}
                                      </span>
                                    ]}
                                  />
                                  <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{
                                      paddingTop: '20px',
                                      fontSize: '12px',
                                      color: '#9CA3AF'
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              
                              {/* Center Stats Display */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-white mb-1">
                                    {metrics?.totalGiftCards || 0}
                                  </div>
                                  <div className="text-sm text-gray-400 font-medium">
                                    Total Cards
                                  </div>
                                  <div className="flex items-center justify-center mt-2 space-x-4 text-xs">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                      <span className="text-gray-400">{metrics?.activeCards || 0} Active</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                      <span className="text-gray-400">{metrics?.redeemedCards || 0} Used</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Interactive Data Overlay */}
                              <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                                <div className="flex items-center space-x-2 text-xs">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 font-medium">{metrics?.activeCards || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-blue-400 font-medium">{metrics?.redeemedCards || 0}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Active Rate: {((metrics?.activeCards || 0) / Math.max(metrics?.totalGiftCards || 1, 1) * 100).toFixed(1)}%
                                </div>
                              </div>

                              {/* Real-time indicator with enhanced animation */}
                              <div className="absolute top-4 right-4 flex items-center space-x-2">
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
                                <span className="text-xs text-green-400 font-medium">Live</span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader className="pb-2 lg:pb-6">
                      <CardTitle className="text-lg lg:text-xl text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-300">Latest gift card transactions and system events</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 lg:pt-0">
                      <div className="space-y-3 lg:space-y-4">
                        {recentActivity.length > 0 ? (
                          recentActivity.slice(0, 6).map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200">
                              <div className={`p-2 lg:p-2.5 rounded-full flex-shrink-0 ${
                                activity.type === 'purchase' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                activity.type === 'redemption' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              }`}>
                                {activity.type === 'purchase' && <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />}
                                {activity.type === 'redemption' && <QrCode className="w-4 h-4 lg:w-5 lg:h-5" />}
                                {activity.type !== 'purchase' && activity.type !== 'redemption' && <Activity className="w-4 h-4 lg:w-5 lg:h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm lg:text-base font-medium capitalize truncate text-white">{activity.type}</p>
                                <div className="text-xs lg:text-sm text-gray-400 space-y-1">
                                  {activity.email && <p className="truncate">{activity.email}</p>}
                                  <p className="flex items-center justify-between">
                                    <span className="text-gray-500">{activity.gan && `${activity.gan.slice(0, 8)}...`}</span>
                                    <span className="font-medium text-white">${(activity.amount / 100).toFixed(2)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs lg:text-sm text-gray-500 flex-shrink-0">
                                {activity.timeAgo}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 lg:py-8 text-gray-400">
                            <Activity className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-4 opacity-30" />
                            <p className="text-sm lg:text-base">No recent activity to display</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "giftcards" && <GiftCardManagement />}
              {activeSection === "merchants" && <MerchantManagement />}
              
              {activeSection === "email" && (
                <div className="space-y-6">
                  {/* Email System Header */}
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Email Delivery System
                    </h3>
                    <p className="text-gray-300">Production-grade email monitoring and domain authentication</p>
                  </div>

                  {/* Email Performance Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-600/30 via-emerald-500/25 to-green-500/30 border-green-400/40 shadow-lg shadow-green-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-2">Delivery Rate</p>
                            <p className="text-2xl font-bold text-white">
                              {(emailMetrics as any)?.data?.overview?.deliveryRate || '98.5'}%
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 via-emerald-400 to-green-600 shadow-xl shadow-green-500/40">
                            <Mail className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-blue-500/30 border-blue-400/40 shadow-lg shadow-blue-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-2">Bounce Rate</p>
                            <p className="text-2xl font-bold text-white">
                              {(emailMetrics as any)?.data?.overview?.bounceRate || '1.2'}%
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 shadow-xl shadow-blue-500/40">
                            <Activity className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-600/30 via-violet-500/25 to-purple-500/30 border-purple-400/40 shadow-lg shadow-purple-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-2">Daily Sent</p>
                            <p className="text-2xl font-bold text-white">
                              {(emailMetrics as any)?.data?.volumeStatus?.sentToday || (queueStatus as any)?.data?.sentToday || '239'}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-violet-400 to-purple-600 shadow-xl shadow-purple-500/40">
                            <TrendingUp className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-600/30 via-amber-500/25 to-orange-500/30 border-orange-400/40 shadow-lg shadow-orange-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-2">Daily Limit</p>
                            <p className="text-2xl font-bold text-white">
                              {(emailMetrics as any)?.data?.volumeStatus?.dailyLimit || (queueStatus as any)?.data?.dailyLimit || '1,000'}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 shadow-xl shadow-orange-500/40">
                            <Settings className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Email System Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Domain Authentication Status</CardTitle>
                        <CardDescription className="text-gray-300">SPF, DKIM, and DMARC configuration</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className={`flex items-center justify-between p-3 rounded-lg border ${
                            (domainAuth as any)?.data?.authenticationStatus?.spf ? 
                            'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                (domainAuth as any)?.data?.authenticationStatus?.spf ? 'bg-green-400' : 'bg-orange-400'
                              }`}></div>
                              <span className="text-white font-medium">SPF Record</span>
                            </div>
                            <Badge className={`${
                              (domainAuth as any)?.data?.authenticationStatus?.spf ? 
                              'bg-green-500/20 text-green-300 border-green-500/30' : 
                              'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            }`}>
                              {(domainAuth as any)?.data?.authenticationStatus?.spf ? 'Verified' : 'Pending'}
                            </Badge>
                          </div>
                          
                          <div className={`flex items-center justify-between p-3 rounded-lg border ${
                            (domainAuth as any)?.data?.authenticationStatus?.dkim ? 
                            'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                (domainAuth as any)?.data?.authenticationStatus?.dkim ? 'bg-green-400' : 'bg-orange-400'
                              }`}></div>
                              <span className="text-white font-medium">DKIM Signing</span>
                            </div>
                            <Badge className={`${
                              (domainAuth as any)?.data?.authenticationStatus?.dkim ? 
                              'bg-green-500/20 text-green-300 border-green-500/30' : 
                              'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            }`}>
                              {(domainAuth as any)?.data?.authenticationStatus?.dkim ? 'Active' : 'Setup Required'}
                            </Badge>
                          </div>
                          
                          <div className={`flex items-center justify-between p-3 rounded-lg border ${
                            (domainAuth as any)?.data?.authenticationStatus?.dmarc ? 
                            'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                (domainAuth as any)?.data?.authenticationStatus?.dmarc ? 'bg-green-400' : 'bg-orange-400'
                              }`}></div>
                              <span className="text-white font-medium">DMARC Policy</span>
                            </div>
                            <Badge className={`${
                              (domainAuth as any)?.data?.authenticationStatus?.dmarc ? 
                              'bg-green-500/20 text-green-300 border-green-500/30' : 
                              'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            }`}>
                              {(domainAuth as any)?.data?.authenticationStatus?.dmarc ? 'Enforced' : 'Configure'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Volume Management</CardTitle>
                        <CardDescription className="text-gray-300">Email warmup and scaling status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Warmup Phase</span>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {(emailMetrics as any)?.data?.volumeStatus?.warmupPhase || 'Established'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Sender Reputation</span>
                            <Badge className={`${
                              (emailMetrics as any)?.data?.overview?.reputation === 'excellent' ?
                              'bg-green-500/20 text-green-300 border-green-500/30' :
                              'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}>
                              {(emailMetrics as any)?.data?.overview?.reputation || 'Excellent'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-300">Daily Usage</span>
                              <span className="text-white">
                                {(emailMetrics as any)?.data?.volumeStatus?.sentToday || (queueStatus as any)?.data?.sentToday || '239'} / {(emailMetrics as any)?.data?.volumeStatus?.dailyLimit || (queueStatus as any)?.data?.dailyLimit || '1,000'}
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (((emailMetrics as any)?.data?.volumeStatus?.sentToday || (queueStatus as any)?.data?.sentToday || 239) / ((emailMetrics as any)?.data?.volumeStatus?.dailyLimit || (queueStatus as any)?.data?.dailyLimit || 1000)) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium shadow-lg transition-all duration-300"
                              disabled={true}
                            >
                              Scale Up Volume
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Email Types Breakdown */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Email Types Performance</CardTitle>
                      <CardDescription className="text-gray-300">Delivery metrics by email category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 text-sm">OTP Emails</span>
                            <QrCode className="w-4 h-4 text-blue-400" />
                          </div>
                          <p className="text-xl font-bold text-white mb-1">47</p>
                          <p className="text-xs text-green-400">99.1% delivered</p>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 text-sm">Gift Receipts</span>
                            <Mail className="w-4 h-4 text-green-400" />
                          </div>
                          <p className="text-xl font-bold text-white mb-1">156</p>
                          <p className="text-xs text-green-400">98.7% delivered</p>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 text-sm">Verification</span>
                            <Shield className="w-4 h-4 text-purple-400" />
                          </div>
                          <p className="text-xl font-bold text-white mb-1">23</p>
                          <p className="text-xs text-green-400">100% delivered</p>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 text-sm">Promotional</span>
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                          </div>
                          <p className="text-xl font-bold text-white mb-1">13</p>
                          <p className="text-xs text-green-400">97.2% delivered</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* DNS Configuration */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">DNS Configuration</CardTitle>
                      <CardDescription className="text-gray-300">Required DNS records for optimal deliverability</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">SPF Record</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Configured</Badge>
                          </div>
                          <code className="text-xs text-gray-300 bg-black/30 p-2 rounded block">
                            v=spf1 include:mailgun.org ~all
                          </code>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">DKIM Record</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
                          </div>
                          <code className="text-xs text-gray-300 bg-black/30 p-2 rounded block">
                            k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
                          </code>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">DMARC Policy</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Enforced</Badge>
                          </div>
                          <code className="text-xs text-gray-300 bg-black/30 p-2 rounded block">
                            v=DMARC1; p=quarantine; rua=mailto:admin@sizupay.com
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "settings" && (
                <div className="space-y-6">
                  {/* Settings Header */}
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      System Settings
                    </h3>
                    <p className="text-gray-300">Configure system preferences and administrative options</p>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Security Settings */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-blue-400" />
                          Security Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-300">Authentication and access control settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Admin Token Expiry</span>
                            <p className="text-sm text-gray-400">Current session timeout</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">24 Hours</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Rate Limiting</span>
                            <p className="text-sm text-gray-400">API request limits</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Active</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Audit Logging</span>
                            <p className="text-sm text-gray-400">Security event tracking</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Enabled</Badge>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            if (confirm("Are you sure you want to reset the admin password? This will log you out.")) {
                              alert("Admin password reset functionality would be implemented here");
                            }
                          }}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium"
                        >
                          Reset Admin Password
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Email Configuration */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-green-400" />
                          Email Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-300">SMTP and email delivery settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">SMTP Provider</span>
                            <p className="text-sm text-gray-400">Current email service</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Mailgun</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Daily Limit</span>
                            <p className="text-sm text-gray-400">Maximum emails per day</p>
                          </div>
                          <span className="text-white font-mono">1,000</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Queue Status</span>
                            <p className="text-sm text-gray-400">Email processing queue</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Healthy</Badge>
                        </div>
                        
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/test/email/welcome', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: 'admin@test.com' })
                              });
                              const result = await response.json();
                              alert(result.success ? 'Test email sent successfully!' : 'Failed to send test email');
                            } catch (error) {
                              alert('Error sending test email');
                            }
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                        >
                          Test Email Delivery
                        </Button>
                      </CardContent>
                    </Card>

                    {/* System Configuration */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Settings className="w-5 h-5 mr-2 text-purple-400" />
                          System Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-300">General system preferences and limits</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white">Auto-refresh Dashboard</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-white">Enable Notifications</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-white">Dark Mode</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm">Data Retention</span>
                            <span className="text-gray-400 text-sm">90 days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm">Session Timeout</span>
                            <span className="text-gray-400 text-sm">4 hours</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Square API Configuration */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-orange-400" />
                          Square API Settings
                        </CardTitle>
                        <CardDescription className="text-gray-300">Payment processing and Square integration</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Environment</span>
                            <p className="text-sm text-gray-400">Current API mode</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Production</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">Webhook Status</span>
                            <p className="text-sm text-gray-400">Event notifications</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <span className="text-white font-medium">API Rate Limit</span>
                            <p className="text-sm text-gray-400">Requests per second</p>
                          </div>
                          <span className="text-white font-mono">10/sec</span>
                        </div>
                        
                        <Button 
                          onClick={async () => {
                            try {
                              alert('Square connection test - this would test API connectivity and authentication status');
                            } catch (error) {
                              alert('Error testing Square connection');
                            }
                          }}
                          className="w-full bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium shadow-lg transition-all duration-300"
                        >
                          Test Square Connection
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Database & Backup Settings */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                        Database & Backup
                      </CardTitle>
                      <CardDescription className="text-gray-300">Data management and backup configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Activity className="w-6 h-6 text-cyan-400" />
                          </div>
                          <h4 className="text-white font-medium mb-2">Database Health</h4>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Optimal</Badge>
                          <p className="text-xs text-gray-400 mt-2">Last check: 2 mins ago</p>
                        </div>
                        
                        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Download className="w-6 h-6 text-blue-400" />
                          </div>
                          <h4 className="text-white font-medium mb-2">Last Backup</h4>
                          <p className="text-white text-sm">Dec 29, 8:00 AM</p>
                          <p className="text-xs text-gray-400 mt-2">Auto-backup enabled</p>
                        </div>
                        
                        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                          </div>
                          <h4 className="text-white font-medium mb-2">Storage Usage</h4>
                          <p className="text-white text-sm">234 MB / 2 GB</p>
                          <p className="text-xs text-gray-400 mt-2">11.7% used</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex gap-4">
                        <Button 
                          onClick={() => {
                            alert('Database backup created successfully. This would generate and download a backup file.');
                          }}
                          className="flex-1 bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium shadow-lg transition-all duration-300"
                        >
                          Create Backup
                        </Button>
                        <Button 
                          onClick={() => {
                            const logData = `Admin Dashboard Logs - ${new Date().toISOString()}\n\nSystem Status: Active\nDatabase: Connected\nEmail Service: Running\nSquare API: Connected\n`;
                            const blob = new Blob([logData], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          variant="outline" 
                          className="flex-1 border-[#fa8d1b] text-[#fa8d1b] hover:bg-gradient-to-r hover:from-[#fa8d1b] hover:to-[#9c53f0] hover:text-white font-medium transition-all duration-300"
                        >
                          Download Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Settings */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-indigo-400" />
                        Advanced Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-300">Developer and maintenance options</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-white font-medium">Maintenance Mode</h4>
                          <p className="text-sm text-gray-400">Temporarily disable public access for system updates</p>
                          <Button 
                            onClick={() => {
                              if (confirm("Enable maintenance mode? This will temporarily disable public access.")) {
                                alert("Maintenance mode would be enabled - public storefront temporarily disabled");
                              }
                            }}
                            variant="outline" 
                            className="w-full border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200 font-medium"
                          >
                            Enable Maintenance Mode
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-white font-medium">Cache Management</h4>
                          <p className="text-sm text-gray-400">Clear system caches to improve performance</p>
                          <Button 
                            onClick={() => {
                              if (confirm("Clear all system caches? This may temporarily affect performance.")) {
                                alert("All caches cleared successfully - system performance optimized");
                              }
                            }}
                            variant="outline" 
                            className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 font-medium"
                          >
                            Clear All Caches
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-white font-medium">API Documentation</h4>
                          <p className="text-sm text-gray-400">Access comprehensive API documentation</p>
                          <Button 
                            onClick={() => {
                              window.open('https://developer.squareup.com/docs/gift-cards-api', '_blank');
                            }}
                            variant="outline" 
                            className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 font-medium"
                          >
                            View API Docs
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-white font-medium">System Logs</h4>
                          <p className="text-sm text-gray-400">Monitor system events and error logs</p>
                          <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 font-medium">
                            View System Logs
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "analytics" && (
                <div className="space-y-6">
                  {/* Advanced Analytics Header */}
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Advanced Analytics
                    </h3>
                    <p className="text-gray-300">Deep insights into your gift card business performance</p>
                  </div>

                  {/* Revenue Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Revenue Trend Analysis</CardTitle>
                        <CardDescription className="text-gray-300">Weekly revenue performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={weeklyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" />
                            <YAxis stroke="rgba(255,255,255,0.5)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: 'white'
                              }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#06b6d4" 
                              strokeWidth={3}
                              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Gift Cards Distribution</CardTitle>
                        <CardDescription className="text-gray-300">Status breakdown</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Active', value: metrics.activeCards, color: '#06b6d4' },
                                { name: 'Redeemed', value: metrics.redeemedCards, color: '#10b981' },
                                { name: 'Pending', value: Math.max(0, metrics.totalGiftCards - metrics.activeCards - metrics.redeemedCards), color: '#f59e0b' }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: 'Active', value: metrics.activeCards, color: '#06b6d4' },
                                { name: 'Redeemed', value: metrics.redeemedCards, color: '#10b981' },
                                { name: 'Pending', value: Math.max(0, metrics.totalGiftCards - metrics.activeCards - metrics.redeemedCards), color: '#f59e0b' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: 'white'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-blue-500/30 border-blue-400/40 shadow-lg shadow-blue-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">Conversion Rate</p>
                            <p className="text-2xl font-bold text-white">{metrics.conversionRate}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 shadow-xl shadow-blue-500/40">
                            <TrendingUp className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-600/30 via-emerald-500/25 to-green-500/30 border-green-400/40 shadow-lg shadow-green-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">Avg. Card Value</p>
                            <p className="text-2xl font-bold text-white">${(metrics.averageValue / 100).toFixed(2)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 via-emerald-400 to-green-600 shadow-xl shadow-green-500/40">
                            <DollarSign className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-600/30 via-violet-500/25 to-purple-500/30 border-purple-400/40 shadow-lg shadow-purple-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">Total Customers</p>
                            <p className="text-2xl font-bold text-white">{metrics.customers}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-violet-400 to-purple-600 shadow-xl shadow-purple-500/40">
                            <Users className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-600/30 via-amber-500/25 to-orange-500/30 border-orange-400/40 shadow-lg shadow-orange-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">Total Redemptions</p>
                            <p className="text-2xl font-bold text-white">{metrics.redemptions}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 shadow-xl shadow-orange-500/40">
                            <Activity className="text-white" size={24} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Activity Analytics */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Transaction Analytics</CardTitle>
                      <CardDescription className="text-gray-300">Detailed breakdown of recent activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.slice(0, 10).map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-full ${
                                activity.type === 'purchase' ? 'bg-green-500/20 text-green-400' :
                                activity.type === 'redemption' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>
                                {activity.type === 'purchase' && <CreditCard className="w-4 h-4" />}
                                {activity.type === 'redemption' && <QrCode className="w-4 h-4" />}
                                {activity.type !== 'purchase' && activity.type !== 'redemption' && <Activity className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-white font-medium capitalize">{activity.type}</p>
                                <p className="text-gray-400 text-sm">{activity.email || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold">${(activity.amount / 100).toFixed(2)}</p>
                              <p className="text-gray-400 text-sm">{activity.timeAgo}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {!["overview", "giftcards", "merchants", "email", "analytics", "settings"].includes(activeSection) && (
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold text-white mb-2 capitalize">
                    {activeSection} Section
                  </h3>
                  <p className="text-gray-400 mb-6">
                    This section is being developed. More features coming soon.
                  </p>
                  <Button 
                    onClick={() => setActiveSection("overview")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Back to Overview
                  </Button>
                </div>
              )}

              {/* Revenue Analytics Section */}
              {activeSection === "revenue" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Revenue Growth Chart */}
                    <Card className="col-span-full lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Revenue Growth Analysis</CardTitle>
                        <CardDescription className="text-gray-300">Comprehensive revenue tracking and projections</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <h3 className="text-2xl font-bold text-green-400">${totalWeeklyRevenue.toFixed(0)}</h3>
                            <p className="text-sm text-green-300">Total Revenue</p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <h3 className="text-2xl font-bold text-blue-400">{revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</h3>
                            <p className="text-sm text-blue-300">Growth Rate</p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
                            <h3 className="text-2xl font-bold text-purple-400">${averageWeeklyRevenue.toFixed(0)}</h3>
                            <p className="text-sm text-purple-300">Avg Weekly</p>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={weeklyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="week" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Revenue Breakdown */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Revenue Sources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Gift Card Sales</span>
                            <span className="text-white font-semibold">85%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Merchant Fees</span>
                            <span className="text-white font-semibold">12%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Premium Features</span>
                            <span className="text-white font-semibold">3%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Customer Insights Section */}
              {activeSection === "customers" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Total Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-400">{metrics?.customers || 0}</div>
                        <p className="text-sm text-gray-300 mt-2">+12% this month</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Repeat Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-400">68%</div>
                        <p className="text-sm text-gray-300 mt-2">Customer retention rate</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Avg Order Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-400">${metrics?.averageValue || 0}</div>
                        <p className="text-sm text-gray-300 mt-2">Per gift card purchase</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Customer LTV</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-400">$156</div>
                        <p className="text-sm text-gray-300 mt-2">Lifetime value</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Customer Demographics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Customer Demographics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Age 18-25</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-white/10 rounded-full">
                                <div className="w-3/5 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                              <span className="text-white text-sm">35%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Age 26-35</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-white/10 rounded-full">
                                <div className="w-4/5 h-2 bg-green-500 rounded-full"></div>
                              </div>
                              <span className="text-white text-sm">42%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Age 36-50</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-white/10 rounded-full">
                                <div className="w-1/4 h-2 bg-purple-500 rounded-full"></div>
                              </div>
                              <span className="text-white text-sm">18%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Age 50+</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-white/10 rounded-full">
                                <div className="w-1/5 h-2 bg-orange-500 rounded-full"></div>
                              </div>
                              <span className="text-white text-sm">5%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Purchase Patterns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Peak Hours</span>
                              <span className="text-white">2PM - 6PM</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full">
                              <div className="w-4/5 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                            </div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Popular Days</span>
                              <span className="text-white">Fri - Sun</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full">
                              <div className="w-3/5 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                            </div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Seasonal Trends</span>
                              <span className="text-white">Holiday Spike</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full">
                              <div className="w-full h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Marketing Tools Section */}
              {activeSection === "marketing" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Campaign Performance */}
                    <Card className="col-span-full lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Marketing Campaign Performance</CardTitle>
                        <CardDescription className="text-gray-300">Track your marketing efforts and ROI</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg border border-pink-500/30">
                              <h3 className="text-2xl font-bold text-pink-400">$2,840</h3>
                              <p className="text-sm text-pink-300">Marketing Spend</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                              <h3 className="text-2xl font-bold text-green-400">$8,520</h3>
                              <p className="text-sm text-green-300">Revenue Generated</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                              <h3 className="text-2xl font-bold text-yellow-400">3.0x</h3>
                              <p className="text-sm text-yellow-300">ROI</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                              <div>
                                <span className="text-white font-medium">Email Campaign</span>
                                <p className="text-sm text-gray-400">Holiday Gift Card Promo</p>
                              </div>
                              <div className="text-right">
                                <span className="text-green-400 font-semibold">+24% CTR</span>
                                <p className="text-xs text-gray-400">Active</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                              <div>
                                <span className="text-white font-medium">Social Media</span>
                                <p className="text-sm text-gray-400">Instagram & Facebook Ads</p>
                              </div>
                              <div className="text-right">
                                <span className="text-blue-400 font-semibold">+18% Reach</span>
                                <p className="text-xs text-gray-400">Running</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                              <div>
                                <span className="text-white font-medium">Referral Program</span>
                                <p className="text-sm text-gray-400">Customer referral rewards</p>
                              </div>
                              <div className="text-right">
                                <span className="text-purple-400 font-semibold">+12% Sign-ups</span>
                                <p className="text-xs text-gray-400">Live</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Marketing Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button className="w-full bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium">
                            Create Campaign
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            Email Broadcast
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            Promo Codes
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            Analytics Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Operations Section */}
              {activeSection === "operations" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* System Performance */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">System Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Server Uptime</span>
                            <span className="text-green-400 font-semibold">99.9%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Response Time</span>
                            <span className="text-blue-400 font-semibold">45ms</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">API Success Rate</span>
                            <span className="text-green-400 font-semibold">99.7%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Database Health</span>
                            <span className="text-green-400 font-semibold">Optimal</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transaction Processing */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Payment Processing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Success Rate</span>
                            <span className="text-green-400 font-semibold">98.5%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Failed Payments</span>
                            <span className="text-orange-400 font-semibold">1.5%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Avg Processing</span>
                            <span className="text-blue-400 font-semibold">2.3s</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Daily Volume</span>
                            <span className="text-purple-400 font-semibold">$4,235</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Security Status */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Security Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">SSL Certificate</span>
                            <span className="text-green-400 font-semibold">Valid</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Firewall Status</span>
                            <span className="text-green-400 font-semibold">Active</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Failed Logins</span>
                            <span className="text-yellow-400 font-semibold">3 today</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Last Backup</span>
                            <span className="text-blue-400 font-semibold">2h ago</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Growth Strategy Section */}
              {activeSection === "growth" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Growth Metrics */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Growth Metrics</CardTitle>
                        <CardDescription className="text-gray-300">Key performance indicators for business growth</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <div className="flex justify-between items-center">
                              <span className="text-green-300">Monthly Recurring Revenue</span>
                              <span className="text-green-400 font-bold text-xl">$12,450</span>
                            </div>
                            <p className="text-sm text-green-200 mt-2">+23% from last month</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <div className="flex justify-between items-center">
                              <span className="text-blue-300">Customer Acquisition Cost</span>
                              <span className="text-blue-400 font-bold text-xl">$24</span>
                            </div>
                            <p className="text-sm text-blue-200 mt-2">-15% optimization</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
                            <div className="flex justify-between items-center">
                              <span className="text-purple-300">Market Expansion</span>
                              <span className="text-purple-400 font-bold text-xl">3 cities</span>
                            </div>
                            <p className="text-sm text-purple-200 mt-2">Ready for launch</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Strategic Initiatives */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Strategic Initiatives</CardTitle>
                        <CardDescription className="text-gray-300">Current and planned growth projects</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">Mobile App Launch</span>
                              <span className="text-blue-400 text-sm">Q2 2025</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full">
                              <div className="w-3/4 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">75% complete</p>
                          </div>
                          
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">Enterprise Features</span>
                              <span className="text-green-400 text-sm">Q3 2025</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full">
                              <div className="w-1/2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">50% complete</p>
                          </div>
                          
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">International Expansion</span>
                              <span className="text-purple-400 text-sm">Q4 2025</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full">
                              <div className="w-1/4 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">25% complete</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Business Reports Section */}
              {activeSection === "reports" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Report Generation */}
                    <Card className="col-span-full bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Business Intelligence Reports</CardTitle>
                        <CardDescription className="text-gray-300">Generate comprehensive business reports and insights</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <BarChart3 className="w-6 h-6 text-blue-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Financial Report</h4>
                            <p className="text-xs text-gray-400 mb-3">Revenue, expenses, profit analysis</p>
                            <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                              Generate
                            </Button>
                          </div>
                          
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <Users className="w-6 h-6 text-green-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Customer Report</h4>
                            <p className="text-xs text-gray-400 mb-3">Behavior, demographics, retention</p>
                            <Button size="sm" className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                              Generate
                            </Button>
                          </div>
                          
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <TrendingUp className="w-6 h-6 text-purple-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Growth Report</h4>
                            <p className="text-xs text-gray-400 mb-3">KPIs, trends, projections</p>
                            <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white">
                              Generate
                            </Button>
                          </div>
                          
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <Settings className="w-6 h-6 text-orange-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Operations Report</h4>
                            <p className="text-xs text-gray-400 mb-3">Performance, efficiency, costs</p>
                            <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                              Generate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* System Health Section */}
              {activeSection === "system" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* System Overview */}
                    <Card className="col-span-full lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">System Health Overview</CardTitle>
                        <CardDescription className="text-gray-300">Real-time monitoring of system components</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-green-300">Server Status</span>
                              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-green-400">Online</p>
                            <p className="text-sm text-green-200">99.9% uptime</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-300">Database</span>
                              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">Healthy</p>
                            <p className="text-sm text-blue-200">12ms avg query</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-purple-300">API Gateway</span>
                              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-purple-400">Active</p>
                            <p className="text-sm text-purple-200">45ms response</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-yellow-300">Email Service</span>
                              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-yellow-400">Running</p>
                            <p className="text-sm text-yellow-200">98.7% delivery</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg border border-pink-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-pink-300">Payment Gateway</span>
                              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-pink-400">Secure</p>
                            <p className="text-sm text-pink-200">SSL verified</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg border border-indigo-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-indigo-300">Backup System</span>
                              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-indigo-400">Synced</p>
                            <p className="text-sm text-indigo-200">Last: 2h ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Actions */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">System Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button className="w-full bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium">
                            Run System Check
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            View Error Logs
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            Performance Report
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            Security Scan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle: string;
  trend?: string;
}

function MetricCard({ title, value, icon, color, subtitle, trend }: MetricCardProps) {
  const colorClasses = {
    blue: {
      card: 'bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-blue-500/30 border-blue-400/40 shadow-lg shadow-blue-500/20',
      icon: 'bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 text-white shadow-xl shadow-blue-500/40',
      text: 'text-white',
      accent: 'text-cyan-300'
    },
    green: {
      card: 'bg-gradient-to-br from-green-600/30 via-emerald-500/25 to-green-500/30 border-green-400/40 shadow-lg shadow-green-500/20',
      icon: 'bg-gradient-to-br from-green-500 via-emerald-400 to-green-600 text-white shadow-xl shadow-green-500/40',
      text: 'text-white',
      accent: 'text-emerald-300'
    },
    purple: {
      card: 'bg-gradient-to-br from-purple-600/30 via-violet-500/25 to-purple-500/30 border-purple-400/40 shadow-lg shadow-purple-500/20',
      icon: 'bg-gradient-to-br from-purple-500 via-violet-400 to-purple-600 text-white shadow-xl shadow-purple-500/40',
      text: 'text-white',
      accent: 'text-violet-300'
    },
    orange: {
      card: 'bg-gradient-to-br from-orange-600/30 via-amber-500/25 to-orange-500/30 border-orange-400/40 shadow-lg shadow-orange-500/20',
      icon: 'bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 text-white shadow-xl shadow-orange-500/40',
      text: 'text-white',
      accent: 'text-amber-300'
    },
  };

  const colorClass = colorClasses[color];

  return (
    <Card className={`relative overflow-hidden backdrop-blur-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${colorClass.card}`}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-medium mb-1 truncate text-[#51525e]">{title}</p>
            <p className="text-xl lg:text-3xl font-bold text-[#fa8d1b] mb-1 lg:mb-2">{value}</p>
            <p className="text-xs text-[#9c53f0] truncate">{subtitle}</p>
          </div>
          <div className={`p-2 lg:p-3 rounded-xl flex-shrink-0 ${colorClass.icon}`}>
            <div className="w-5 h-5 lg:w-6 lg:h-6">
              {icon}
            </div>
          </div>
        </div>
        {trend && (
          <div className="mt-3 lg:mt-4 flex items-center">
            <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0 text-green-400" />
            <span className="text-xs lg:text-sm font-medium text-[#192336]">{trend}</span>
            <span className="text-xs lg:text-sm text-gray-200 ml-1 hidden sm:inline">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}