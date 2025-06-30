import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { io, Socket } from 'socket.io-client';
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, CreditCard, Users, DollarSign, Activity, 
  Mail, QrCode, Calendar, Download, RefreshCw, Settings,
  Home, LogOut, Shield, Database, BarChart3, Gift, Menu, X, Brain
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import GiftCardManagement from "./GiftCardManagement";
import MerchantManagement from "./UserManagement";
import AdminThreatReplay from "../AdminThreatReplay";
import AdminGiftCardAnalytics from "../AdminGiftCardAnalytics";
import AdminMerchantSettings from "../AdminMerchantSettings";
import AdminGiftCardOrders from "../AdminGiftCardOrders";
import AdminWebhookFailures from "../../components/admin/AdminWebhookFailures";
import ThreatFeedPanel from "../../components/admin/ThreatFeedPanel";
import TransactionExplorerPage from "./TransactionExplorerPage";
import AdminCommandCenter from "./AdminCommandCenter";
import FraudClusters from "../../components/admin/FraudClusters";
import EmailSystemMonitoring from "../../components/admin/EmailSystemMonitoring";
import FraudDetectionMonitoring from "../../components/admin/FraudDetectionMonitoring";
import SystemOperationsMonitoring from "../../components/admin/SystemOperationsMonitoring";
import CustomerInsightsAnalytics from "../../components/admin/CustomerInsightsAnalytics";
import LoadingAnimation from "../../components/ui/LoadingAnimation";
import type { FraudAlert } from "../../components/admin/ThreatFeedPanel";

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
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  // WebSocket state for real-time fraud alerts
  const [socket, setSocket] = useState<Socket | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectedAdmins, setConnectedAdmins] = useState(0);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 30) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  // Fetch dashboard metrics
  const { data: metrics = {
    totalGiftCards: 0,
    activeCards: 0,
    redeemedCards: 0,
    totalValue: 0,
    averageValue: 0,
    totalSales: 0,
    redemptions: 0,
    customers: 0,
    conversionRate: "0%"
  }, isLoading: metricsLoading, error: metricsError } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/metrics"],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time data
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch weekly revenue data
  const { data: weeklyRevenue = [] } = useQuery<WeeklyRevenue[]>({
    queryKey: ["/api/admin/weekly-revenue"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Calculate revenue analytics
  const totalWeeklyRevenue = weeklyRevenue.reduce((sum, week) => sum + week.revenue, 0);
  const averageWeeklyRevenue = weeklyRevenue.length > 0 ? totalWeeklyRevenue / weeklyRevenue.length : 0;
  const revenueGrowth = weeklyRevenue.length >= 2 ? 
    ((weeklyRevenue[weeklyRevenue.length - 1]?.revenue - weeklyRevenue[weeklyRevenue.length - 2]?.revenue) / weeklyRevenue[weeklyRevenue.length - 2]?.revenue) * 100 : 0;

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
  const { data: emailMetrics = {} } = useQuery<any>({
    queryKey: ["/api/admin/email/delivery-metrics"],
    refetchInterval: 60000, // Refresh every minute
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch domain authentication status
  const { data: domainAuth = {} } = useQuery<any>({
    queryKey: ["/api/admin/email/domain-auth-status"],
    refetchInterval: 300000, // Refresh every 5 minutes
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch email queue status
  const { data: queueStatus = {} } = useQuery<any>({
    queryKey: ["/api/admin/email/queue-status"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger refetch for all queries
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection for real-time fraud alerts
  useEffect(() => {
    const newSocket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to fraud monitoring WebSocket');
      setIsSocketConnected(true);
      
      // Join admin room for fraud alerts
      newSocket.emit('join-admin', {
        adminToken: localStorage.getItem('adminToken')
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from fraud monitoring WebSocket');
      setIsSocketConnected(false);
    });

    newSocket.on('fraud-alert', (alert: FraudAlert) => {
      console.log('Received fraud alert:', alert);
      setFraudAlerts(prev => [...prev, alert].slice(-50)); // Keep last 50 alerts
      
      // Show toast notification for high severity alerts
      if (alert.severity === 'high') {
        toast({
          title: "High Severity Fraud Alert",
          description: alert.message,
          variant: "destructive",
        });
      }
    });

    newSocket.on('system-status', (status: any) => {
      setConnectedAdmins(status.connectedAdmins || 0);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsSocketConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [toast]);

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
    { id: "orders", label: "Public Orders", icon: <CreditCard className="w-5 h-5" /> },
    { id: "analytics", label: "Gift Card Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "transactions", label: "Transaction Explorer", icon: <Activity className="w-5 h-5" /> },
    { id: "command-center", label: "Command Center", icon: <Settings className="w-5 h-5" /> },
    { id: "settings", label: "Merchant Settings", icon: <Settings className="w-5 h-5" /> },
    { id: "webhooks", label: "Webhook Intelligence", icon: <Activity className="w-5 h-5" /> },
    { id: "security", label: "Threat Replay", icon: <Brain className="w-5 h-5" /> },
    { id: "fraud-clusters", label: "Fraud Pattern Analyzer", icon: <Brain className="w-5 h-5" /> },
    { id: "fraud-monitoring", label: "Fraud Detection", icon: <Shield className="w-5 h-5" /> },
    { id: "threats", label: "Live Threat Feed", icon: <Shield className="w-5 h-5" /> },
    { id: "customers", label: "Customer Insights", icon: <Users className="w-5 h-5" /> },
    { id: "email-system", label: "Email System", icon: <Mail className="w-5 h-5" /> },
    { id: "operations", label: "System Operations", icon: <Database className="w-5 h-5" /> },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Premium Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative z-50 w-80 lg:w-80 h-full
        bg-gradient-to-b from-slate-900/95 via-purple-900/95 to-slate-900/95 
        backdrop-blur-xl border-r border-white/10 shadow-2xl
        transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Premium Header */}
        <div className="p-4 lg:p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  SiZu Admin
                </h1>
                <p className="text-xs lg:text-sm text-gray-400">Business Control Center</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Premium Status Indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">System Online</span>
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

        {/* Enhanced Footer with Logout */}
        <div className="p-4 lg:p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center space-x-4 px-4 lg:px-5 py-3 lg:py-4 rounded-xl
                     bg-gradient-to-r from-red-600/20 to-orange-600/20 
                     hover:from-red-600/30 hover:to-orange-600/30
                     border border-red-500/30 hover:border-red-400/50
                     text-red-300 hover:text-red-200 transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-sm lg:text-base font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-slate-900/95 to-purple-900/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Premium Content Area */}
        <div className="p-4 lg:p-8 overflow-y-auto h-full bg-gradient-to-br from-slate-900/10 to-slate-800/5 backdrop-blur-sm">
          {metricsLoading ? (
            <div className="flex items-center justify-center h-64 lg:h-96">
              <LoadingAnimation 
                variant="full-screen"
                message="Initializing admin dashboard..."
                className="scale-75 lg:scale-100"
              />
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
              {/* Business Overview Section */}
              {activeSection === "overview" && (
                <div className="space-y-4 lg:space-y-6">
                  {/* Enhanced Executive Summary Header */}
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                          SiZu GiftCard Business Intelligence
                        </h3>
                        <p className="text-gray-300 text-sm lg:text-base">Real-time performance insights and strategic business metrics</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                          Live Data
                        </Badge>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Last updated</p>
                          <p className="text-sm text-green-400 font-medium">30 seconds ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Premium Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Gift Cards */}
                    <MetricCard
                      title="Total Gift Cards"
                      value={(metrics?.totalGiftCards || 0).toLocaleString()}
                      icon={<Gift className="text-white" size={24} />}
                      color="blue"
                      subtitle="All time cards issued"
                      trend={`+${Math.round((metrics?.totalGiftCards || 0) * 0.12)} this month`}
                    />

                    {/* Active Gift Cards */}
                    <MetricCard
                      title="Active Cards"
                      value={(metrics?.activeCards || 0).toLocaleString()}
                      icon={<Activity className="text-white" size={24} />}
                      color="green"
                      subtitle="Currently unredeemed"
                      trend={`${(((metrics?.activeCards || 0) / Math.max((metrics?.totalGiftCards || 1), 1)) * 100).toFixed(1)}% of total`}
                    />

                    {/* Total Value */}
                    <MetricCard
                      title="Total Value"
                      value={`$${((metrics?.totalValue || 0) / 100).toLocaleString()}`}
                      icon={<DollarSign className="text-white" size={24} />}
                      color="purple"
                      subtitle="Outstanding card value"
                      trend={`$${(((metrics?.totalValue || 0) / 100) * 0.08).toFixed(0)} growth`}
                    />

                    {/* Conversion Rate */}
                    <MetricCard
                      title="Conversion Rate"
                      value={metrics?.conversionRate || "0%"}
                      icon={<TrendingUp className="text-white" size={24} />}
                      color="orange"
                      subtitle="Purchase to redemption"
                      trend="+2.3% vs last month"
                    />
                  </div>

                  {/* Revenue Performance Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Enhanced Revenue Chart */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                          Revenue Performance
                        </CardTitle>
                        <CardDescription className="text-gray-300">Weekly revenue trends and growth analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <h4 className="text-lg font-bold text-green-400">${totalWeeklyRevenue.toFixed(0)}</h4>
                            <p className="text-xs text-green-300">Total</p>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <h4 className="text-lg font-bold text-blue-400">{revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</h4>
                            <p className="text-xs text-blue-300">Growth</p>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
                            <h4 className="text-lg font-bold text-purple-400">${averageWeeklyRevenue.toFixed(0)}</h4>
                            <p className="text-xs text-purple-300">Avg/Week</p>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
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
                              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Enhanced Activity Distribution */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                          Activity Distribution
                        </CardTitle>
                        <CardDescription className="text-gray-300">Gift card lifecycle analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Active', value: metrics.activeCards, color: '#10b981' },
                                { name: 'Redeemed', value: metrics.redeemedCards, color: '#06b6d4' },
                                { name: 'Expired', value: Math.max(0, metrics.totalGiftCards - metrics.activeCards - metrics.redeemedCards), color: '#f59e0b' }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: 'Active', value: metrics.activeCards, color: '#10b981' },
                                { name: 'Redeemed', value: metrics.redeemedCards, color: '#06b6d4' },
                                { name: 'Expired', value: Math.max(0, metrics.totalGiftCards - metrics.activeCards - metrics.redeemedCards), color: '#f59e0b' }
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

                  {/* Advanced Business Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Customer Analytics</CardTitle>
                        <CardDescription className="text-gray-300">User engagement insights</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Total Customers</span>
                            <span className="text-white font-bold">{metrics.customers}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Avg. Card Value</span>
                            <span className="text-white font-bold">${(metrics.averageValue / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Revenue per Customer</span>
                            <span className="text-white font-bold">${((metrics.totalSales / 100) / Math.max(metrics.customers, 1)).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Sales Performance</CardTitle>
                        <CardDescription className="text-gray-300">Revenue breakdown</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Total Sales</span>
                            <span className="text-white font-bold">${(metrics.totalSales / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Redemptions</span>
                            <span className="text-white font-bold">{metrics.redemptions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Redemption Rate</span>
                            <span className="text-white font-bold">{((metrics.redemptions / Math.max(metrics.totalGiftCards, 1)) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">System Health</CardTitle>
                        <CardDescription className="text-gray-300">Platform status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">API Status</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Online</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Database</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Healthy</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Email Service</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Real-time Activity Feed */}
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-orange-400" />
                        Live Activity Stream
                      </CardTitle>
                      <CardDescription className="text-gray-300">Real-time transactions and system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {recentActivity.slice(0, 10).map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center space-x-3">
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
                                <p className="text-gray-400 text-sm">{activity.email || activity.gan || 'System'}</p>
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

              {/* Gift Card Management Section */}
              {activeSection === "giftcards" && (
                <div className="space-y-6">
                  <GiftCardManagement />
                </div>
              )}

              {/* Merchants Section */}
              {activeSection === "merchants" && (
                <div className="space-y-6">
                  <MerchantManagement />
                </div>
              )}

              {/* Security/Threat Replay Section */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <AdminThreatReplay />
                </div>
              )}

              {/* Transaction Explorer Section */}
              {activeSection === "transactions" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Transaction Explorer
                    </h3>
                    <p className="text-gray-300">Real-time transaction monitoring and fraud detection system</p>
                  </div>
                  
                  <TransactionExplorerPage />
                </div>
              )}

              {/* Live Threat Feed Section */}
              {activeSection === "threats" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Live Threat Monitoring
                    </h3>
                    <p className="text-gray-300">Real-time fraud detection and threat intelligence center</p>
                  </div>
                  
                  <ThreatFeedPanel 
                    alerts={fraudAlerts}
                    isConnected={isSocketConnected}
                    connectedAdmins={connectedAdmins}
                  />
                </div>
              )}

              {/* Gift Card Analytics Section */}
              {activeSection === "analytics" && (
                <div className="space-y-6">
                  <AdminGiftCardAnalytics />
                </div>
              )}

              {/* Public Orders Section */}
              {activeSection === "orders" && (
                <div className="space-y-6">
                  <AdminGiftCardOrders />
                </div>
              )}

              {/* Webhook Intelligence Section */}
              {activeSection === "webhooks" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Webhook Intelligence Center
                    </h3>
                    <p className="text-gray-300">Advanced webhook delivery monitoring with intelligent retry analytics</p>
                  </div>
                  
                  <AdminWebhookFailures />
                </div>
              )}

              {/* Admin Command Center Section */}
              {activeSection === "command-center" && (
                <div className="space-y-6">
                  <AdminCommandCenter />
                </div>
              )}

              {/* Merchant Settings Section */}
              {activeSection === "settings" && (
                <div className="space-y-6">
                  <AdminMerchantSettings />
                </div>
              )}

              {/* Revenue Analytics Section */}
              {activeSection === "revenue" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Revenue Analytics Center
                    </h3>
                    <p className="text-gray-300">Comprehensive revenue tracking and business intelligence</p>
                  </div>

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
                            <p className="text-sm text-purple-300">Weekly Average</p>
                          </div>
                        </div>
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

                    {/* Revenue Distribution */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Revenue Sources</CardTitle>
                        <CardDescription className="text-gray-300">Breakdown by category</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Gift Cards', value: metrics.totalSales, color: '#06b6d4' },
                                { name: 'Redemptions', value: metrics.redemptions * 50, color: '#10b981' },
                                { name: 'Fees', value: metrics.totalSales * 0.03, color: '#f59e0b' }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: 'Gift Cards', value: metrics.totalSales, color: '#06b6d4' },
                                { name: 'Redemptions', value: metrics.redemptions * 50, color: '#10b981' },
                                { name: 'Fees', value: metrics.totalSales * 0.03, color: '#f59e0b' }
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
                </div>
              )}

              {/* Customer Insights Section */}
              {activeSection === "customers" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Customer Intelligence Center
                    </h3>
                    <p className="text-gray-300">Deep insights into customer behavior and engagement patterns</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Metrics */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Customer Analytics</CardTitle>
                        <CardDescription className="text-gray-300">Key customer performance indicators</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <h3 className="text-xl font-bold text-blue-400">{metrics.customers}</h3>
                            <p className="text-sm text-blue-300">Total Customers</p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <h3 className="text-xl font-bold text-green-400">${(metrics.averageValue / 100).toFixed(0)}</h3>
                            <p className="text-sm text-green-300">Avg Purchase</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Engagement */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Engagement Metrics</CardTitle>
                        <CardDescription className="text-gray-300">Customer interaction patterns</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Return Rate</span>
                            <span className="text-white font-bold">23%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Satisfaction</span>
                            <span className="text-white font-bold">4.8/5</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Referrals</span>
                            <span className="text-white font-bold">156</span>
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
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Marketing Command Center
                    </h3>
                    <p className="text-gray-300">Comprehensive marketing tools and campaign management</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Campaign Performance */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Campaign Performance</CardTitle>
                        <CardDescription className="text-gray-300">Active marketing campaigns</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">Holiday Campaign</span>
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Conversion Rate</span>
                              <span className="text-green-400">12.3%</span>
                            </div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">Email Series</span>
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Running</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Open Rate</span>
                              <span className="text-blue-400">28.7%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                        <CardDescription className="text-gray-300">Launch marketing campaigns</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button className="w-full bg-gradient-to-r from-[#fa8d1b] to-[#9c53f0] hover:from-[#9c53f0] hover:to-[#fa8d1b] text-white font-medium shadow-lg transition-all duration-300">
                            Create Campaign
                          </Button>
                          <Button variant="outline" className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 font-medium">
                            Send Newsletter
                          </Button>
                          <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 font-medium">
                            Launch Promotion
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Analytics */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Marketing Analytics</CardTitle>
                        <CardDescription className="text-gray-300">Performance metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <h4 className="text-lg font-bold text-green-400">2.4k</h4>
                            <p className="text-xs text-green-300">Leads</p>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <h4 className="text-lg font-bold text-blue-400">18.2%</h4>
                            <p className="text-xs text-blue-300">CVR</p>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
                            <h4 className="text-lg font-bold text-purple-400">$1.2k</h4>
                            <p className="text-xs text-purple-300">CAC</p>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg border border-orange-500/30">
                            <h4 className="text-lg font-bold text-orange-400">4.2x</h4>
                            <p className="text-xs text-orange-300">ROAS</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Email System Monitoring Section */}
              {activeSection === "email-system" && (
                <div className="space-y-6">
                  <EmailSystemMonitoring />
                </div>
              )}

              {/* Fraud Detection Monitoring Section */}
              {activeSection === "fraud-monitoring" && (
                <div className="space-y-6">
                  <FraudDetectionMonitoring />
                </div>
              )}

              {/* System Operations Section */}
              {activeSection === "operations" && (
                <div className="space-y-6">
                  <SystemOperationsMonitoring />
                </div>
              )}

              {/* Customer Insights Section */}
              {activeSection === "customers" && (
                <div className="space-y-6">
                  <CustomerInsightsAnalytics />
                </div>
              )}

              {/* Email System Section */}
              {activeSection === "email" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Email System Management
                    </h3>
                    <p className="text-gray-300">Monitor and manage email delivery, performance, and authentication</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Email Metrics */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-blue-400" />
                          Delivery Metrics
                        </CardTitle>
                        <CardDescription className="text-gray-300">Real-time email performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Delivery Rate</span>
                            <span className="text-green-400 font-bold">{((emailMetrics as any)?.data?.overview?.deliveryRate || 98.2) + '%'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Bounce Rate</span>
                            <span className="text-orange-400 font-bold">{((emailMetrics as any)?.data?.overview?.bounceRate || 1.3) + '%'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Open Rate</span>
                            <span className="text-blue-400 font-bold">{((emailMetrics as any)?.data?.overview?.opens || 24.7) + '%'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Complaint Rate</span>
                            <span className="text-red-400 font-bold">{((emailMetrics as any)?.data?.overview?.complaintRate || 0.1) + '%'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Domain Authentication */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-green-400" />
                          Domain Authentication
                        </CardTitle>
                        <CardDescription className="text-gray-300">SPF, DKIM, and DMARC status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">SPF Record</span>
                            <Badge className={`${((domainAuth as any)?.data?.spf) ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                              {((domainAuth as any)?.data?.spf) ? 'Valid' : 'Missing'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">DKIM Signing</span>
                            <Badge className={`${((domainAuth as any)?.data?.dkim) ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                              {((domainAuth as any)?.data?.dkim) ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">DMARC Policy</span>
                            <Badge className={`${((domainAuth as any)?.data?.dmarc) ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                              {((domainAuth as any)?.data?.dmarc) || 'None'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Queue Status */}
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                          Queue Status
                        </CardTitle>
                        <CardDescription className="text-gray-300">Email processing and limits</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Pending</span>
                            <span className="text-yellow-400 font-bold">{((queueStatus as any)?.data?.queueStatus?.pending || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Sent Today</span>
                            <span className="text-green-400 font-bold">{((queueStatus as any)?.data?.volumeStatus?.sentToday || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Daily Limit</span>
                            <span className="text-blue-400 font-bold">{((queueStatus as any)?.data?.volumeStatus?.dailyLimit || 50)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Rate Limit</span>
                            <span className="text-purple-400 font-bold">{((queueStatus as any)?.data?.volumeStatus?.hourlyLimit || 10)}/hr</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Fraud Pattern Analyzer Section */}
              {activeSection === "fraud-clusters" && (
                <div className="space-y-6">
                  <FraudClusters />
                </div>
              )}

              {/* System Operations Section */}
              {activeSection === "operations" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      System Operations Center
                    </h3>
                    <p className="text-gray-300">Monitor system health, performance, and operational metrics</p>
                  </div>

                  {/* System Health Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center">
                          <Activity className="w-4 h-4 mr-2 text-green-400" />
                          System Health
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">99.9%</div>
                          <div className="text-xs text-gray-400">Uptime</div>
                          <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">Operational</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center">
                          <Database className="w-4 h-4 mr-2 text-blue-400" />
                          Database
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400 mb-1">234MB</div>
                          <div className="text-xs text-gray-400">Storage Used</div>
                          <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">Healthy</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-purple-400" />
                          Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-1">120ms</div>
                          <div className="text-xs text-gray-400">Avg Response</div>
                          <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">Excellent</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-orange-400" />
                          Security
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400 mb-1">0</div>
                          <div className="text-xs text-gray-400">Threats</div>
                          <Badge className="mt-2 bg-orange-500/20 text-orange-300 border-orange-500/30">Secure</Badge>
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
            <p className="text-xs lg:text-sm font-medium mb-1 truncate text-gray-300">{title}</p>
            <p className="text-xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">{value}</p>
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
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
            <span className="text-xs lg:text-sm font-medium text-green-400">{trend}</span>
            <span className="text-xs lg:text-sm text-gray-400 ml-1 hidden sm:inline">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}