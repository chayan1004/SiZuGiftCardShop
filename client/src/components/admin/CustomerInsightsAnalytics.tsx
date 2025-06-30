import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, TrendingUp, CreditCard, Calendar, 
  MapPin, Clock, RefreshCw, Filter, Download
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CustomerMetrics {
  totalCustomers: number;
  newCustomersToday: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  repeatCustomerRate: number;
  churnRate: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  averageSpend: number;
  color: string;
}

interface GeographicData {
  region: string;
  customers: number;
  revenue: number;
  averageOrderValue: number;
}

interface CustomerBehavior {
  timeframe: string;
  newCustomers: number;
  returningCustomers: number;
  totalOrders: number;
  revenue: number;
}

export default function CustomerInsightsAnalytics() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const { toast } = useToast();

  // Fetch customer metrics
  const { data: customerMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<CustomerMetrics>({
    queryKey: ["/api/admin/customer-metrics", { timeRange }],
    refetchInterval: 60000, // Refresh every minute
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch customer segments
  const { data: customerSegments = [], isLoading: segmentsLoading, refetch: refetchSegments } = useQuery<CustomerSegment[]>({
    queryKey: ["/api/admin/customer-segments", { timeRange }],
    refetchInterval: 300000, // Refresh every 5 minutes
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch geographic data
  const { data: geographicData = [], isLoading: geoLoading, refetch: refetchGeo } = useQuery<GeographicData[]>({
    queryKey: ["/api/admin/customer-geography", { timeRange }],
    refetchInterval: 300000,
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch customer behavior trends
  const { data: behaviorTrends = [], isLoading: behaviorLoading, refetch: refetchBehavior } = useQuery<CustomerBehavior[]>({
    queryKey: ["/api/admin/customer-behavior", { timeRange }],
    refetchInterval: 300000,
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
      refetchSegments(),
      refetchGeo(),
      refetchBehavior()
    ]);
    setRefreshing(false);
    toast({
      title: "Customer data refreshed",
      description: "Latest customer insights have been loaded",
    });
  };

  const exportData = () => {
    const data = {
      metrics: customerMetrics,
      segments: customerSegments,
      geographic: geographicData,
      behavior: behaviorTrends,
      exportDate: new Date().toISOString(),
      timeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-insights-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Customer insights data has been downloaded",
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (metricsLoading || segmentsLoading || geoLoading || behaviorLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/10 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Customer Insights</h2>
          <p className="text-gray-300">Comprehensive customer analytics and behavior tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={exportData}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-400" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {customerMetrics?.totalCustomers?.toLocaleString() || 0}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400 text-sm">
                +{customerMetrics?.newCustomersToday || 0} today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-green-400" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${((customerMetrics?.averageOrderValue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-sm text-gray-400">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-purple-400" />
              Customer LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${((customerMetrics?.customerLifetimeValue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-sm text-gray-400">Lifetime value</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-400" />
              Repeat Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(customerMetrics?.repeatCustomerRate || 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-400">Return customers</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-red-400" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(customerMetrics?.churnRate || 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-400">Lost customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Behavior Trends */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Customer Behavior Trends
          </CardTitle>
          <CardDescription className="text-gray-300">
            New vs returning customer patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={behaviorTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timeframe" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="newCustomers" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="New Customers"
                />
                <Line 
                  type="monotone" 
                  dataKey="returningCustomers" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="Returning Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments and Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-400" />
              Customer Segments
            </CardTitle>
            <CardDescription className="text-gray-300">
              Customer categorization by behavior and value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {customerSegments.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white text-sm">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">{segment.count}</div>
                    <div className="text-gray-400 text-xs">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-400" />
              Geographic Distribution
            </CardTitle>
            <CardDescription className="text-gray-300">
              Customer distribution by region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {geographicData.map((region, index) => (
                <div key={region.region} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-medium">{region.region}</h4>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {region.customers} customers
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Revenue</span>
                      <p className="text-white font-bold">
                        ${(region.revenue / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Order</span>
                      <p className="text-white font-bold">
                        ${(region.averageOrderValue / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}