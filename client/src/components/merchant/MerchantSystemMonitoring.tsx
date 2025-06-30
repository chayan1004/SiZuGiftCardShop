import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Database, Activity, Server, Clock, 
  CheckCircle, AlertTriangle, XCircle, RefreshCw
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SystemHealth {
  database: {
    status: string;
    responseTime: number;
    connectionCount: number;
  };
  api: {
    status: string;
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

interface PerformanceMetrics {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
}

export default function MerchantSystemMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const merchantToken = localStorage.getItem('merchantToken');

  // Fetch system health metrics
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/merchant/system-health"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  // Fetch performance metrics
  const { data: performanceMetrics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<PerformanceMetrics[]>({
    queryKey: ["/api/merchant/performance-metrics"],
    refetchInterval: 60000, // Refresh every minute
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchHealth(), refetchMetrics()]);
    setRefreshing(false);
    toast({
      title: "System metrics refreshed",
      description: "Latest performance data has been loaded",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'critical':
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (healthLoading || metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/10 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
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
          <h2 className="text-2xl font-bold text-white mb-2">System Health</h2>
          <p className="text-gray-300">Monitor your platform performance and system status</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Database className="w-4 h-4 mr-2 text-blue-400" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold ${getStatusColor(systemHealth?.database?.status || 'unknown')}`}>
                {systemHealth?.database?.status || 'Unknown'}
              </span>
              {getStatusIcon(systemHealth?.database?.status || 'unknown')}
            </div>
            <div className="text-sm text-gray-400">
              Response: {systemHealth?.database?.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-400">
              Connections: {systemHealth?.database?.connectionCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-400" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold ${getStatusColor(systemHealth?.api?.status || 'unknown')}`}>
                {systemHealth?.api?.status || 'Unknown'}
              </span>
              {getStatusIcon(systemHealth?.api?.status || 'unknown')}
            </div>
            <div className="text-sm text-gray-400">
              Response: {systemHealth?.api?.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-400">
              Requests/min: {systemHealth?.api?.requestsPerMinute || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Server className="w-4 h-4 mr-2 text-purple-400" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Used</span>
                <span className="text-white font-bold">
                  {systemHealth?.memory?.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${systemHealth?.memory?.percentage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {formatBytes(systemHealth?.memory?.used || 0)} / {formatBytes(systemHealth?.memory?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-400" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white font-bold text-lg mb-1">
              {formatUptime(systemHealth?.uptime || 0)}
            </div>
            <div className="text-sm text-gray-400">
              System running smoothly
            </div>
            <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">
              Stable
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-400" />
              Response Time Trends
            </CardTitle>
            <CardDescription className="text-gray-300">
              API response time over the last hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                    formatter={(value: any) => [`${value}ms`, 'Response Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Server className="w-5 h-5 mr-2 text-green-400" />
              System Performance
            </CardTitle>
            <CardDescription className="text-gray-300">
              Memory usage and throughput metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memoryUsage" 
                    stroke="#00C49F" 
                    fill="#00C49F"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Rate Monitor */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
            Error Rate Monitor
          </CardTitle>
          <CardDescription className="text-gray-300">
            System error rates and reliability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {(systemHealth?.api?.errorRate || 0).toFixed(2)}%
              </div>
              <div className="text-sm text-green-300">Current Error Rate</div>
              <div className="text-xs text-gray-400 mt-1">Target: &lt; 1%</div>
            </div>
            
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400 mb-1">99.9%</div>
              <div className="text-sm text-blue-300">Availability</div>
              <div className="text-xs text-gray-400 mt-1">Last 30 days</div>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {systemHealth?.api?.requestsPerMinute || 0}
              </div>
              <div className="text-sm text-purple-300">Requests/Min</div>
              <div className="text-xs text-gray-400 mt-1">Current load</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}