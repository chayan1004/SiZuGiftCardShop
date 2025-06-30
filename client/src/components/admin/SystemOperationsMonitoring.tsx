import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Database, Server, Cpu, HardDrive, Activity, 
  Clock, Zap, RefreshCw, AlertCircle, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SystemMetrics {
  database: {
    status: string;
    connectionCount: number;
    queryResponseTime: number;
    totalTables: number;
    totalRecords: number;
  };
  api: {
    status: string;
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface HealthCheck {
  component: string;
  status: "healthy" | "warning" | "critical";
  message: string;
  lastCheck: string;
  responseTime?: number;
}

export default function SystemOperationsMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/admin/system-metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch health checks
  const { data: healthChecks = [], isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthCheck[]>({
    queryKey: ["/api/admin/health-checks"],
    refetchInterval: 15000, // Refresh every 15 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchHealth()]);
    setRefreshing(false);
    toast({
      title: "System data refreshed",
      description: "Latest system metrics have been loaded",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: "bg-green-500/20 text-green-300 border-green-500/30",
      warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      critical: "bg-red-500/20 text-red-300 border-red-500/30",
      online: "bg-green-500/20 text-green-300 border-green-500/30",
      offline: "bg-red-500/20 text-red-300 border-red-500/30"
    };
    return variants[status as keyof typeof variants] || variants.warning;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case "critical":
      case "offline":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (metricsLoading || healthLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/10 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Operations</h2>
          <p className="text-gray-300">Real-time system health and performance monitoring</p>
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

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Database className="w-4 h-4 mr-2 text-blue-400" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status</span>
                <Badge className={getStatusBadge(systemMetrics?.database.status || 'unknown')}>
                  {systemMetrics?.database.status || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Response</span>
                <span className="text-white font-bold">
                  {systemMetrics?.database.queryResponseTime || 0}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Records</span>
                <span className="text-white font-bold">
                  {systemMetrics?.database.totalRecords?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Server className="w-4 h-4 mr-2 text-green-400" />
              API Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status</span>
                <Badge className={getStatusBadge(systemMetrics?.api.status || 'unknown')}>
                  {systemMetrics?.api.status || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Response</span>
                <span className="text-white font-bold">
                  {systemMetrics?.api.responseTime || 0}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Requests/min</span>
                <span className="text-white font-bold">
                  {systemMetrics?.api.requestsPerMinute || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-purple-400" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Used</span>
                <span className="text-white font-bold">
                  {systemMetrics?.memory.percentage || 0}%
                </span>
              </div>
              <Progress 
                value={systemMetrics?.memory.percentage || 0} 
                className="bg-white/10"
              />
              <div className="text-xs text-gray-400">
                {((systemMetrics?.memory.used || 0) / 1024 / 1024).toFixed(1)}MB / 
                {((systemMetrics?.memory.total || 0) / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <HardDrive className="w-4 h-4 mr-2 text-orange-400" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Used</span>
                <span className="text-white font-bold">
                  {systemMetrics?.storage.percentage || 0}%
                </span>
              </div>
              <Progress 
                value={systemMetrics?.storage.percentage || 0} 
                className="bg-white/10"
              />
              <div className="text-xs text-gray-400">
                {((systemMetrics?.storage.used || 0) / 1024 / 1024 / 1024).toFixed(1)}GB / 
                {((systemMetrics?.storage.total || 0) / 1024 / 1024 / 1024).toFixed(1)}GB
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-400" />
            System Health Checks
          </CardTitle>
          <CardDescription className="text-gray-300">
            Automated health monitoring for all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthChecks.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-white font-medium">All systems operational</p>
                <p className="text-gray-400 text-sm">No health issues detected</p>
              </div>
            ) : (
              healthChecks.map((check, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(check.status)}
                      <h4 className="text-white font-medium">{check.component}</h4>
                    </div>
                    <Badge className={getStatusBadge(check.status)}>
                      {check.status}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{check.message}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Last check: {new Date(check.lastCheck).toLocaleString()}</span>
                    {check.responseTime && (
                      <span>Response: {check.responseTime}ms</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-400" />
              API Performance
            </CardTitle>
            <CardDescription className="text-gray-300">
              Real-time API metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Response Time</span>
                <span className="text-white font-bold">
                  {systemMetrics?.api.responseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Requests per Minute</span>
                <span className="text-white font-bold">
                  {systemMetrics?.api.requestsPerMinute || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Error Rate</span>
                <span className="text-white font-bold">
                  {systemMetrics?.api.errorRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Uptime</span>
                <span className="text-white font-bold">
                  {((systemMetrics?.api.uptime || 0) / 3600).toFixed(1)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-400" />
              Database Performance
            </CardTitle>
            <CardDescription className="text-gray-300">
              Database health and performance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Query Response Time</span>
                <span className="text-white font-bold">
                  {systemMetrics?.database.queryResponseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Connections</span>
                <span className="text-white font-bold">
                  {systemMetrics?.database.connectionCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Tables</span>
                <span className="text-white font-bold">
                  {systemMetrics?.database.totalTables || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Records</span>
                <span className="text-white font-bold">
                  {systemMetrics?.database.totalRecords?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}