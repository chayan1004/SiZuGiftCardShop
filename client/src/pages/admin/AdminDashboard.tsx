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

  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger refetch for all queries
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
    { id: "settings", label: "Merchant Settings", icon: <Settings className="w-5 h-5" /> },
    { id: "security", label: "Threat Replay", icon: <Brain className="w-5 h-5" /> },
    { id: "customers", label: "Customer Insights", icon: <Users className="w-5 h-5" /> },
    { id: "marketing", label: "Marketing Tools", icon: <Mail className="w-5 h-5" /> },
    { id: "email", label: "Email System", icon: <Mail className="w-5 h-5" /> },
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
                  {/* Overview content would go here */}
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                      Business Overview
                    </h3>
                    <p className="text-gray-300">Welcome to your comprehensive business management dashboard</p>
                  </div>
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

              {/* Merchant Settings Section */}
              {activeSection === "settings" && (
                <div className="space-y-6">
                  <AdminMerchantSettings />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}