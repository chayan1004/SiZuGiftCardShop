import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, TrendingUp, Activity, 
  Clock, Ban, CheckCircle, RefreshCw, Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface FraudLog {
  id: string;
  ipAddress: string;
  userAgent: string;
  merchantId: string;
  giftCardGan: string;
  failureReason: string;
  severity: string;
  timestamp: string;
  blocked: boolean;
}

interface FraudStatistics {
  totalAttempts: number;
  blockedAttempts: number;
  blockRate: number;
  topThreats: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  recentHours: Array<{
    hour: string;
    attempts: number;
    blocked: number;
  }>;
}

export default function FraudDetectionMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch fraud logs
  const { data: fraudLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<FraudLog[]>({
    queryKey: ["/api/admin/fraud-logs", { limit: 100 }],
    refetchInterval: 15000, // Refresh every 15 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch fraud statistics
  const { data: fraudStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<FraudStatistics>({
    queryKey: ["/api/admin/fraud-statistics"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLogs(), refetchStats()]);
    setRefreshing(false);
    toast({
      title: "Fraud data refreshed",
      description: "Latest fraud detection data has been loaded",
    });
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "bg-red-500/20 text-red-300 border-red-500/30",
      medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      low: "bg-blue-500/20 text-blue-300 border-blue-500/30"
    };
    return variants[severity as keyof typeof variants] || variants.low;
  };

  const filteredLogs = (fraudLogs?.fraudLogs || []).filter((log: any) => {
    const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;
    const matchesSearch = searchTerm === "" || 
      log.ipAddress?.includes(searchTerm) ||
      log.merchantId?.includes(searchTerm) ||
      log.giftCardGan?.includes(searchTerm) ||
      log.failureReason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesSearch;
  });

  if (logsLoading || statsLoading) {
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
          <h2 className="text-2xl font-bold text-white mb-2">Fraud Detection Monitoring</h2>
          <p className="text-gray-300">Real-time fraud prevention and threat analysis</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-red-600 hover:bg-red-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2 text-red-400" />
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fraudStats?.totalAttempts?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-400">Fraud attempts detected</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Ban className="w-4 h-4 mr-2 text-orange-400" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fraudStats?.blockedAttempts?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-400">Successfully blocked</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
              Block Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fraudStats?.blockRate?.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-400">Prevention effectiveness</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fraudLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return logTime > hourAgo;
              }).length}
            </div>
            <p className="text-sm text-gray-400">Last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Threats */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
            Top Threat Types
          </CardTitle>
          <CardDescription className="text-gray-300">
            Most common fraud patterns detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fraudStats?.topThreats?.map((threat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-red-300 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{threat.type}</p>
                    <Badge className={getSeverityBadge(threat.severity)}>
                      {threat.severity} severity
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{threat.count}</p>
                  <p className="text-gray-400 text-sm">attempts</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fraud Logs */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Recent Fraud Attempts
          </CardTitle>
          <CardDescription className="text-gray-300">
            Latest fraud detection events and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by IP, merchant, or GAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-white font-medium">No fraud attempts detected</p>
                <p className="text-gray-400 text-sm">System is secure and monitoring</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityBadge(log.severity)}>
                        {log.severity}
                      </Badge>
                      {log.blocked && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">IP Address</span>
                      <p className="text-white font-mono">{log.ipAddress}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Merchant</span>
                      <p className="text-white">{log.merchantId}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Gift Card</span>
                      <p className="text-white font-mono">{log.giftCardGan}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Reason</span>
                      <p className="text-white">{log.failureReason}</p>
                    </div>
                  </div>
                  
                  {log.userAgent && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-gray-400 text-sm">User Agent</span>
                      <p className="text-gray-300 text-sm font-mono break-all">{log.userAgent}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}