import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, CreditCard, Users, DollarSign, Activity, 
  Mail, QrCode, Calendar, Download, RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {}

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
  const [adminToken, setAdminToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Admin authentication
  const handleAdminLogin = () => {
    if (!adminToken.trim()) {
      toast({
        title: "Authentication Required",
        description: "Please enter your admin token",
        variant: "destructive"
      });
      return;
    }
    setIsAuthenticated(true);
  };

  // Fetch admin metrics with authentication
  const { 
    data: metricsData, 
    isLoading: metricsLoading, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery({
    queryKey: ['/api/admin/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/metrics', {
        headers: {
          'x-admin-token': adminToken
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch admin metrics');
      }
      return response.json();
    },
    enabled: isAuthenticated && !!adminToken,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const metrics: DashboardMetrics = metricsData?.metrics || {};
  const recentActivity: RecentActivity[] = metricsData?.recentActivity || [];
  const weeklyRevenue: WeeklyRevenue[] = metricsData?.weeklyRevenue || [];

  // Chart colors
  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Admin Dashboard</h2>
              <p className="text-blue-100 mt-1">Real-time gift card analytics and management</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => refetchMetrics()}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                Home
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!isAuthenticated ? (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-4">Admin Authentication Required</h3>
                <input
                  type="password"
                  placeholder="Enter admin token"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-4"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
                <Button onClick={handleAdminLogin} className="w-full">
                  Access Dashboard
                </Button>
              </div>
            </div>
          ) : metricsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard metrics...</p>
            </div>
          ) : metricsError ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Failed to load admin metrics. Please check your token and try again.</p>
              <Button onClick={() => setIsAuthenticated(false)} className="mt-4">
                Re-authenticate
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Gift Cards"
                  value={metrics.totalGiftCards?.toString() || "0"}
                  icon={<CreditCard className="w-6 h-6" />}
                  color="blue"
                  subtitle={`$${metrics.totalValue?.toFixed(2) || "0.00"} total value`}
                />
                <MetricCard
                  title="Active Cards"
                  value={metrics.activeCards?.toString() || "0"}
                  icon={<Activity className="w-6 h-6" />}
                  color="green"
                  subtitle={`${metrics.conversionRate || "0"}% conversion rate`}
                />
                <MetricCard
                  title="Redeemed Cards"
                  value={metrics.redeemedCards?.toString() || "0"}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="purple"
                  subtitle={`$${((metrics.redemptions || 0) / 100).toFixed(2)} redeemed`}
                />
                <MetricCard
                  title="Average Value"
                  value={`$${metrics.averageValue?.toFixed(2) || "0.00"}`}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="orange"
                  subtitle={`${metrics.customers || 0} unique customers`}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Revenue Trend</CardTitle>
                    <CardDescription>Gift card sales over the last 8 weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weeklyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? `$${value}` : value,
                            name === 'revenue' ? 'Revenue' : 'Cards Sold'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="giftCardsSold" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gift Card Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gift Card Status</CardTitle>
                    <CardDescription>Distribution of active vs redeemed cards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: metrics.activeCards || 0, color: '#10b981' },
                            { name: 'Redeemed', value: metrics.redeemedCards || 0, color: '#3b82f6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {[
                            { name: 'Active', value: metrics.activeCards || 0, color: '#10b981' },
                            { name: 'Redeemed', value: metrics.redeemedCards || 0, color: '#3b82f6' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest gift card transactions and activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'PURCHASE' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {activity.type === 'PURCHASE' ? <CreditCard className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium">
                              {activity.type === 'PURCHASE' ? 'Gift Card Purchase' : 'Gift Card Redemption'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.email && `${activity.email} • `}
                              {activity.gan && `GAN: ${activity.gan}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(activity.amount / 100).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{activity.timeAgo}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-gray-500 py-8">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}