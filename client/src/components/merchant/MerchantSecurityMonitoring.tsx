import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, Eye, Lock, 
  Activity, Globe, Clock, RefreshCw
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SecurityMetrics {
  totalAttempts: number;
  blockedAttempts: number;
  blockRate: number;
  uniqueIPs: number;
  suspiciousActivity: number;
  lastThreatTime: string;
}

interface ThreatLog {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  ipAddress: string;
  blocked: boolean;
  description: string;
}

interface SecurityStatus {
  overallStatus: string;
  riskLevel: string;
  activeThreats: number;
  protectionLevel: string;
}

export default function MerchantSecurityMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const merchantToken = localStorage.getItem('merchantToken');

  // Fetch security metrics
  const { data: securityMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<SecurityMetrics>({
    queryKey: ["/api/merchant/security-metrics"],
    refetchInterval: 30000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  // Fetch recent threat logs
  const { data: threatLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<ThreatLog[]>({
    queryKey: ["/api/merchant/threat-logs"],
    refetchInterval: 60000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  // Fetch security status
  const { data: securityStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<SecurityStatus>({
    queryKey: ["/api/merchant/security-status"],
    refetchInterval: 30000,
    meta: {
      headers: {
        'x-merchant-token': merchantToken || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchLogs(), refetchStatus()]);
    setRefreshing(false);
    toast({
      title: "Security data refreshed",
      description: "Latest threat monitoring data loaded",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const threatTypeData = [
    { name: 'Rate Limiting', value: 45, color: '#0088FE' },
    { name: 'Invalid Codes', value: 30, color: '#00C49F' },
    { name: 'Suspicious IPs', value: 15, color: '#FFBB28' },
    { name: 'Bot Activity', value: 10, color: '#FF8042' }
  ];

  if (metricsLoading || logsLoading || statusLoading) {
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
          <h2 className="text-2xl font-bold text-white mb-2">Security Dashboard</h2>
          <p className="text-gray-300">Monitor threats and security events for your merchant account</p>
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

      {/* Security Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2 text-green-400" />
              Protection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white font-bold text-lg mb-1">
              {securityStatus?.overallStatus || 'Active'}
            </div>
            <div className="text-sm text-gray-400">
              Level: {securityStatus?.protectionLevel || 'Standard'}
            </div>
            <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">
              Protected
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
              Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`font-bold text-lg mb-1 ${getRiskColor(securityStatus?.riskLevel || 'low')}`}>
              {securityStatus?.riskLevel || 'Low'}
            </div>
            <div className="text-sm text-gray-400">
              Active threats: {securityStatus?.activeThreats || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last check: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-400" />
              Blocked Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white font-bold text-lg mb-1">
              {securityMetrics?.blockedAttempts || 0}
            </div>
            <div className="text-sm text-gray-400">
              Block rate: {(securityMetrics?.blockRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total attempts: {securityMetrics?.totalAttempts || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Globe className="w-4 h-4 mr-2 text-purple-400" />
              Unique IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white font-bold text-lg mb-1">
              {securityMetrics?.uniqueIPs || 0}
            </div>
            <div className="text-sm text-gray-400">
              Suspicious: {securityMetrics?.suspiciousActivity || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Monitoring active
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-400" />
              Threat Distribution
            </CardTitle>
            <CardDescription className="text-gray-300">
              Types of security threats detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatTypeData.map((entry, index) => (
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
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-400" />
              Security Timeline
            </CardTitle>
            <CardDescription className="text-gray-300">
              Security events over the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { hour: '00:00', threats: 2, blocked: 2 },
                  { hour: '06:00', threats: 5, blocked: 4 },
                  { hour: '12:00', threats: 8, blocked: 7 },
                  { hour: '18:00', threats: 12, blocked: 11 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="threats" fill="#0088FE" name="Total Threats" />
                  <Bar dataKey="blocked" fill="#00C49F" name="Blocked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Threat Activity */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Eye className="w-5 h-5 mr-2 text-yellow-400" />
            Recent Threat Activity
          </CardTitle>
          <CardDescription className="text-gray-300">
            Latest security events and threat detections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {threatLogs.slice(0, 8).map((threat) => (
              <div key={threat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${threat.blocked ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <div className="text-white font-medium text-sm">{threat.type}</div>
                    <div className="text-gray-400 text-xs">{threat.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`text-xs ${getSeverityColor(threat.severity)}`}>
                    {threat.severity}
                  </Badge>
                  <div className="text-gray-400 text-xs">
                    {new Date(threat.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {threatLogs.length === 0 && (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">No recent threats detected</p>
                <p className="text-gray-400 text-sm">Your account is secure</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lock className="w-5 h-5 mr-2 text-purple-400" />
            Security Recommendations
          </CardTitle>
          <CardDescription className="text-gray-300">
            Suggested actions to enhance your security posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-white font-medium mb-2">Enable 2FA</h4>
              <p className="text-gray-400 text-sm mb-3">
                Add an extra layer of security to your account with two-factor authentication.
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Configure 2FA
              </Button>
            </div>
            
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <h4 className="text-white font-medium mb-2">API Key Rotation</h4>
              <p className="text-gray-400 text-sm mb-3">
                Regularly rotate your API keys to maintain security best practices.
              </p>
              <Button size="sm" variant="outline" className="border-green-500/30 text-green-300 hover:bg-green-500/10">
                Manage Keys
              </Button>
            </div>
            
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <h4 className="text-white font-medium mb-2">Webhook Security</h4>
              <p className="text-gray-400 text-sm mb-3">
                Ensure your webhook endpoints use HTTPS and proper signature validation.
              </p>
              <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                Check Config
              </Button>
            </div>
            
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <h4 className="text-white font-medium mb-2">Monitor Logs</h4>
              <p className="text-gray-400 text-sm mb-3">
                Regular monitoring of access logs helps detect unusual activity patterns.
              </p>
              <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
                View Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}