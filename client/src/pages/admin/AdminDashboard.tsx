import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
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
import UserManagement from "./UserManagement";

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

  // Fetch weekly revenue data
  const { data: weeklyRevenue = [] } = useQuery<WeeklyRevenue[]>({
    queryKey: ["/api/admin/weekly-revenue"],
    refetchInterval: 30000,
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

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

  // Sidebar navigation items
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "giftcards", label: "Gift Cards", icon: <Gift className="w-5 h-5" /> },
    { id: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "email", label: "Email System", icon: <Mail className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex relative">
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
        w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:block backdrop-blur-xl
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
            <span className="text-xs text-green-300 font-medium">System Online</span>
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
        <div className="absolute bottom-0 w-72 p-4 lg:p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
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
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200"
              >
                <Home className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Back to Site</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Main Content */}
      <div className="flex-1 overflow-hidden lg:ml-0 pt-16 lg:pt-0">
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
                  {activeSection === "users" && "View and manage user accounts"}
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${refreshing ? 'animate-spin' : ''} ${refreshing ? '' : 'lg:mr-2'}`} />
                <span className="hidden lg:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          {metricsLoading ? (
            <div className="flex items-center justify-center h-32 lg:h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm lg:text-base text-gray-600">Loading dashboard data...</p>
              </div>
            </div>
          ) : metricsError ? (
            <div className="flex items-center justify-center h-32 lg:h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4 text-sm lg:text-base">Failed to load admin metrics</p>
                <Button onClick={() => window.location.href = '/admin-login'} size="sm">
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
                    <Card className="col-span-1">
                      <CardHeader className="pb-2 lg:pb-6">
                        <CardTitle className="text-lg lg:text-xl">Revenue Trend</CardTitle>
                        <CardDescription className="text-sm">Weekly gift card sales performance</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 lg:pt-0">
                        <ResponsiveContainer width="100%" height={250} className="lg:!h-[300px]">
                          <LineChart data={weeklyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="week" className="text-sm" />
                            <YAxis className="text-sm" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value, name) => [
                                name === 'revenue' ? `$${value}` : value,
                                name === 'revenue' ? 'Revenue' : 'Cards Sold'
                              ]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#3B82F6" 
                              strokeWidth={3}
                              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Gift Card Status Distribution */}
                    <Card className="col-span-1">
                      <CardHeader className="pb-2 lg:pb-6">
                        <CardTitle className="text-lg lg:text-xl">Gift Card Status</CardTitle>
                        <CardDescription className="text-sm">Distribution of card statuses</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 lg:pt-0">
                        <ResponsiveContainer width="100%" height={250} className="lg:!h-[300px]">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Active', value: metrics.activeCards || 0, color: '#10B981' },
                                { name: 'Redeemed', value: metrics.redeemedCards || 0, color: '#3B82F6' },
                                { name: 'Expired', value: Math.max(0, (metrics.totalGiftCards || 0) - (metrics.activeCards || 0) - (metrics.redeemedCards || 0)), color: '#F59E0B' }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: 'Active', value: metrics.activeCards || 0, color: '#10B981' },
                                { name: 'Redeemed', value: metrics.redeemedCards || 0, color: '#3B82F6' },
                                { name: 'Expired', value: Math.max(0, (metrics.totalGiftCards || 0) - (metrics.activeCards || 0) - (metrics.redeemedCards || 0)), color: '#F59E0B' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="pb-2 lg:pb-6">
                      <CardTitle className="text-lg lg:text-xl">Recent Activity</CardTitle>
                      <CardDescription className="text-sm">Latest gift card transactions and system events</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 lg:pt-0">
                      <div className="space-y-3 lg:space-y-4">
                        {recentActivity.length > 0 ? (
                          recentActivity.slice(0, 6).map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3 lg:space-x-4 p-2 lg:p-3 bg-gray-50 rounded-lg">
                              <div className={`p-1.5 lg:p-2 rounded-full flex-shrink-0 ${
                                activity.type === 'purchase' ? 'bg-green-100 text-green-600' :
                                activity.type === 'redemption' ? 'bg-blue-100 text-blue-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {activity.type === 'purchase' && <CreditCard className="w-3 h-3 lg:w-4 lg:h-4" />}
                                {activity.type === 'redemption' && <QrCode className="w-3 h-3 lg:w-4 lg:h-4" />}
                                {activity.type !== 'purchase' && activity.type !== 'redemption' && <Activity className="w-3 h-3 lg:w-4 lg:h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm lg:text-base font-medium capitalize truncate">{activity.type}</p>
                                <div className="text-xs lg:text-sm text-gray-500 space-y-1">
                                  {activity.email && <p className="truncate">{activity.email}</p>}
                                  <p className="flex items-center justify-between">
                                    <span>{activity.gan && `${activity.gan.slice(0, 8)}...`}</span>
                                    <span className="font-medium">${(activity.amount / 100).toFixed(2)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs lg:text-sm text-gray-400 flex-shrink-0">
                                {activity.timeAgo}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 lg:py-8 text-gray-500">
                            <Activity className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-4 opacity-50" />
                            <p className="text-sm lg:text-base">No recent activity to display</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "giftcards" && <GiftCardManagement />}
              {activeSection === "users" && <UserManagement />}
              
              {!["overview", "giftcards", "users"].includes(activeSection) && (
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 capitalize">
                    {activeSection} Section
                  </h3>
                  <p className="text-gray-500 mb-6">
                    This section is being developed. More features coming soon.
                  </p>
                  <Button onClick={() => setActiveSection("overview")}>
                    Back to Overview
                  </Button>
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
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
            <p className="text-xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">{value}</p>
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          </div>
          <div className={`p-2 lg:p-3 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
            <div className="w-5 h-5 lg:w-6 lg:h-6">
              {icon}
            </div>
          </div>
        </div>
        {trend && (
          <div className="mt-3 lg:mt-4 flex items-center">
            <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-xs lg:text-sm font-medium text-green-600">{trend}</span>
            <span className="text-xs lg:text-sm text-gray-500 ml-1 hidden sm:inline">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}