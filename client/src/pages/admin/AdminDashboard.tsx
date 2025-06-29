import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, CreditCard, Users, DollarSign, Activity, 
  Mail, QrCode, Calendar, Download, RefreshCw, Settings,
  Home, LogOut, Shield, Database, BarChart3, Gift
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">SiZu GiftCard</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeSection === "overview" ? "Dashboard Overview" : activeSection}
              </h2>
              <p className="text-gray-500 mt-1">
                {activeSection === "overview" && "Monitor your gift card business performance"}
                {activeSection === "giftcards" && "Manage all gift cards and transactions"}
                {activeSection === "users" && "View and manage user accounts"}
                {activeSection === "analytics" && "Detailed business analytics and reports"}
                {activeSection === "email" && "Email delivery and domain authentication"}
                {activeSection === "settings" && "System configuration and preferences"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Database className="w-3 h-3 mr-1" />
                Live Data
              </Badge>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto h-full">
          {metricsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard data...</p>
              </div>
            </div>
          ) : metricsError ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">Failed to load admin metrics</p>
                <Button onClick={() => window.location.href = '/admin-login'}>
                  Re-authenticate
                </Button>
              </div>
            </div>
          ) : (
            <>
              {activeSection === "overview" && (
                <div className="space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend Chart */}
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Weekly gift card sales performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
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
                      <CardHeader>
                        <CardTitle>Gift Card Status</CardTitle>
                        <CardDescription>Distribution of card statuses</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
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
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest gift card transactions and system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                          recentActivity.slice(0, 8).map((activity, index) => (
                            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                              <div className={`p-2 rounded-full ${
                                activity.type === 'purchase' ? 'bg-green-100 text-green-600' :
                                activity.type === 'redemption' ? 'bg-blue-100 text-blue-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {activity.type === 'purchase' && <CreditCard className="w-4 h-4" />}
                                {activity.type === 'redemption' && <QrCode className="w-4 h-4" />}
                                {activity.type !== 'purchase' && activity.type !== 'redemption' && <Activity className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium capitalize">{activity.type}</p>
                                <p className="text-sm text-gray-500">
                                  {activity.email && `${activity.email} • `}
                                  {activity.gan && `${activity.gan} • `}
                                  ${(activity.amount / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-sm text-gray-400">
                                {activity.timeAgo}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No recent activity to display</p>
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">{trend}</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}