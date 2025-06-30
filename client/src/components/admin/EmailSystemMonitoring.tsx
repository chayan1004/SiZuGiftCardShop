import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Mail, TrendingUp, Clock, CheckCircle, AlertTriangle, 
  RefreshCw, Download, Settings, BarChart3, Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface EmailMetrics {
  overview: {
    totalSent: number;
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
    reputation: string;
  };
  volumeStatus: {
    currentLimit: number;
    dailySent: number;
    warmupPhase: string;
    canScaleUp: boolean;
  };
  emailTypes: {
    [key: string]: {
      sent: number;
      delivered: number;
      bounced: number;
      complaints: number;
    };
  };
  queueStatus: {
    pending: number;
    processing: number;
    failed: number;
  };
}

interface DomainAuth {
  spf: { valid: boolean; record: string };
  dkim: { valid: boolean; selector: string };
  dmarc: { valid: boolean; policy: string };
  productionReady: boolean;
}

export default function EmailSystemMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Fetch email delivery metrics
  const { data: emailMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<EmailMetrics>({
    queryKey: ["/api/admin/email/delivery-metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Fetch domain authentication status
  const { data: domainAuth, isLoading: authLoading, refetch: refetchAuth } = useQuery<DomainAuth>({
    queryKey: ["/api/admin/email/domain-auth-status"],
    refetchInterval: 60000, // Refresh every minute
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchAuth()]);
    setRefreshing(false);
    toast({
      title: "Email metrics refreshed",
      description: "Latest email delivery data has been loaded",
    });
  };

  const getReputationBadge = (reputation: string) => {
    const variants = {
      excellent: "bg-green-500/20 text-green-300 border-green-500/30",
      good: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      fair: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      poor: "bg-red-500/20 text-red-300 border-red-500/30"
    };
    return variants[reputation as keyof typeof variants] || variants.fair;
  };

  if (metricsLoading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/10 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
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
          <h2 className="text-2xl font-bold text-white mb-2">Email System Monitoring</h2>
          <p className="text-gray-300">Real-time email delivery performance and domain authentication</p>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Mail className="w-4 h-4 mr-2 text-blue-400" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {emailMetrics?.overview.totalSent?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-400">All time emails</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {emailMetrics?.overview.deliveryRate?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={emailMetrics?.overview.deliveryRate || 0} 
              className="mt-2 bg-white/10"
            />
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2 text-purple-400" />
              Reputation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getReputationBadge(emailMetrics?.overview.reputation || 'fair')}>
              {emailMetrics?.overview.reputation || 'Unknown'}
            </Badge>
            <p className="text-sm text-gray-400 mt-2">Sender reputation</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-orange-400" />
              Daily Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {emailMetrics?.volumeStatus.dailySent || 0}/{emailMetrics?.volumeStatus.currentLimit || 0}
            </div>
            <Progress 
              value={((emailMetrics?.volumeStatus.dailySent || 0) / (emailMetrics?.volumeStatus.currentLimit || 1)) * 100} 
              className="mt-2 bg-white/10"
            />
          </CardContent>
        </Card>
      </div>

      {/* Domain Authentication Status */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-400" />
            Domain Authentication Status
          </CardTitle>
          <CardDescription className="text-gray-300">
            SPF, DKIM, and DMARC configuration for maximum deliverability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">SPF Record</span>
                <Badge className={domainAuth?.spf.valid ? 
                  "bg-green-500/20 text-green-300 border-green-500/30" : 
                  "bg-red-500/20 text-red-300 border-red-500/30"
                }>
                  {domainAuth?.spf.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-mono break-all">
                {domainAuth?.spf.record || 'Not configured'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">DKIM</span>
                <Badge className={domainAuth?.dkim.valid ? 
                  "bg-green-500/20 text-green-300 border-green-500/30" : 
                  "bg-red-500/20 text-red-300 border-red-500/30"
                }>
                  {domainAuth?.dkim.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Selector: {domainAuth?.dkim.selector || 'None'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">DMARC</span>
                <Badge className={domainAuth?.dmarc.valid ? 
                  "bg-green-500/20 text-green-300 border-green-500/30" : 
                  "bg-red-500/20 text-red-300 border-red-500/30"
                }>
                  {domainAuth?.dmarc.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Policy: {domainAuth?.dmarc.policy || 'None'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center">
              {domainAuth?.productionReady ? (
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
              )}
              <span className="text-white font-medium">
                {domainAuth?.productionReady ? 'Production Ready' : 'Configuration Required'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {domainAuth?.productionReady 
                ? 'All authentication records are properly configured'
                : 'Some authentication records need to be configured for optimal deliverability'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Types Performance */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Email Performance by Type
          </CardTitle>
          <CardDescription className="text-gray-300">
            Delivery statistics breakdown by email category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailMetrics?.emailTypes && Object.entries(emailMetrics.emailTypes).map(([type, stats]) => (
              <div key={type} className="p-4 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-white font-medium capitalize">{type}</h4>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {stats.sent} sent
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Delivered</span>
                    <p className="text-green-300 font-bold">{stats.delivered}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Bounced</span>
                    <p className="text-red-300 font-bold">{stats.bounced}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Complaints</span>
                    <p className="text-yellow-300 font-bold">{stats.complaints}</p>
                  </div>
                </div>
                <Progress 
                  value={(stats.delivered / Math.max(stats.sent, 1)) * 100} 
                  className="mt-2 bg-white/10"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Queue Status */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-400" />
            Queue Status
          </CardTitle>
          <CardDescription className="text-gray-300">
            Current email processing queue status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">
                {emailMetrics?.queueStatus.pending || 0}
              </div>
              <p className="text-gray-400 text-sm">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">
                {emailMetrics?.queueStatus.processing || 0}
              </div>
              <p className="text-gray-400 text-sm">Processing</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-300">
                {emailMetrics?.queueStatus.failed || 0}
              </div>
              <p className="text-gray-400 text-sm">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}