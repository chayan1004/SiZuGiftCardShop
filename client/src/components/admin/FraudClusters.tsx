import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Brain, 
  TrendingUp, 
  Eye, 
  RefreshCw,
  Zap,
  Target,
  Network,
  Clock,
  Hash
} from "lucide-react";
import { format } from "date-fns";

interface FraudCluster {
  id: string;
  label: string;
  score: string;
  severity: number;
  threatCount: number;
  patternType: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClusterPattern {
  id: string;
  clusterId: string;
  fraudLogId: string;
  metadata: string | null;
  similarity: string | null;
  createdAt: string;
}

interface ClusterStats {
  totalClusters: number;
  activeClusters: number;
  avgSeverity: number;
  recentClusters: number;
  patternTypes: Record<string, number>;
}

const severityColors = {
  1: "bg-green-500/20 text-green-400 border-green-500/30",
  2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", 
  3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  4: "bg-red-500/20 text-red-400 border-red-500/30",
  5: "bg-purple-500/20 text-purple-400 border-purple-500/30"
};

const patternTypeIcons = {
  ip_based: Network,
  device_fingerprint: Hash,
  velocity: Zap,
  user_agent: Target
};

export default function FraudClusters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch fraud clusters with stats
  const { data: clustersData, isLoading: clustersLoading, refetch: refetchClusters } = useQuery({
    queryKey: ["/api/admin/fraud-clusters"],
    refetchInterval: autoRefresh ? 30000 : false, // 30 second refresh
  });

  // Fetch cluster analysis status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/admin/threat-analysis/status"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch specific cluster details
  const { data: clusterDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/admin/fraud-clusters", selectedCluster],
    enabled: !!selectedCluster,
  });

  // Manual threat analysis trigger
  const triggerAnalysis = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/threat-analysis/trigger"),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Analysis Complete",
        description: `Found ${data.result.clustersFound} new clusters from ${data.result.threatsAnalyzed} threats`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fraud-clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/threat-analysis/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to trigger threat analysis",
        variant: "destructive",
      });
    },
  });

  const clusters: FraudCluster[] = (clustersData as any)?.clusters || [];
  const stats: ClusterStats = (clustersData as any)?.stats || {
    totalClusters: 0,
    activeClusters: 0,
    avgSeverity: 0,
    recentClusters: 0,
    patternTypes: {}
  };

  const status = (statusData as any)?.status || {
    engineRunning: false,
    lastAnalysis: null,
    totalClusters: 0,
    recentClusters: 0,
    avgSeverity: 0,
    patternTypes: {}
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchClusters();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchClusters]);

  if (clustersLoading && !clusters.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">Fraud Pattern Analyzer</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">Fraud Pattern Analyzer</h2>
          <p className="text-gray-400">AI-powered threat clustering and pattern recognition</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-gray-700 ${autoRefresh ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}
          >
            <Activity className="mr-2 h-4 w-4" />
            Auto Refresh
          </Button>
          <Button
            onClick={() => triggerAnalysis.mutate()}
            disabled={triggerAnalysis.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {triggerAnalysis.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Clusters</p>
                <p className="text-2xl font-bold text-white">{stats.totalClusters}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Recent (24h)</p>
                <p className="text-2xl font-bold text-white">{stats.recentClusters}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg Severity</p>
                <p className="text-2xl font-bold text-white">{stats.avgSeverity.toFixed(1)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Engine Status</p>
                <p className="text-sm font-bold text-green-400">
                  {status.engineRunning ? 'Running' : 'Stopped'}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${status.engineRunning ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clusters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border-gray-800">
          <TabsTrigger value="clusters" className="data-[state=active]:bg-gray-800">
            Active Clusters
          </TabsTrigger>
          <TabsTrigger value="patterns" className="data-[state=active]:bg-gray-800">
            Pattern Types
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-gray-800">
            Engine Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clusters" className="space-y-4">
          <div className="grid gap-4">
            {clusters.map((cluster) => {
              const metadata = cluster.metadata ? JSON.parse(cluster.metadata) : {};
              const PatternIcon = patternTypeIcons[cluster.patternType as keyof typeof patternTypeIcons] || Target;
              
              return (
                <Card key={cluster.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <PatternIcon className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-white">{cluster.label}</h3>
                            <Badge 
                              className={`${severityColors[cluster.severity as keyof typeof severityColors]} border`}
                            >
                              Severity {cluster.severity}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {cluster.patternType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Score: {parseFloat(cluster.score).toFixed(1)}</span>
                            <span>Threats: {cluster.threatCount}</span>
                            <span>Created: {format(new Date(cluster.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          {metadata.uniqueIPs && (
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Unique IPs: {metadata.uniqueIPs}</span>
                              <span>Devices: {metadata.uniqueDevices}</span>
                              <span>Time Span: {Math.round(metadata.timeSpan / 1000)}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCluster(cluster.id)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Inspect
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800">
                          <DialogHeader>
                            <DialogTitle className="text-white">Cluster Analysis: {cluster.label}</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Detailed pattern analysis and threat breakdown
                            </DialogDescription>
                          </DialogHeader>
                          {detailsLoading ? (
                            <div className="space-y-4 py-6">
                              <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                <div className="h-20 bg-gray-700 rounded"></div>
                              </div>
                            </div>
                          ) : clusterDetails ? (
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-400">Risk Score</p>
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      value={parseFloat((clusterDetails as any).score) * 10} 
                                      className="flex-1 h-2"
                                    />
                                    <span className="text-sm text-white">
                                      {parseFloat((clusterDetails as any).score).toFixed(1)}/10
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-400">Pattern Confidence</p>
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      value={95} 
                                      className="flex-1 h-2"
                                    />
                                    <span className="text-sm text-white">95%</span>
                                  </div>
                                </div>
                              </div>
                              
                              <Separator className="bg-gray-800" />
                              
                              <div className="space-y-4">
                                <h4 className="font-medium text-white">Pattern Details</h4>
                                {clusterDetails.metadata && (
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-400">Threat Types</p>
                                      <p className="text-white">
                                        {clusterDetails.metadata.threatTypes?.join(', ') || 'Mixed'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Unique IPs</p>
                                      <p className="text-white">{clusterDetails.metadata.uniqueIPs || 0}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Time Window</p>
                                      <p className="text-white">
                                        {Math.round((clusterDetails.metadata?.timeSpan || 0) / 1000)}s
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {clusterDetails.patterns && clusterDetails.patterns.length > 0 && (
                                <div className="space-y-4">
                                  <h4 className="font-medium text-white">
                                    Associated Patterns ({clusterDetails.patterns.length})
                                  </h4>
                                  <div className="max-h-48 overflow-y-auto space-y-2">
                                    {clusterDetails.patterns.map((pattern: ClusterPattern, index: number) => {
                                      const patternMeta = pattern.metadata ? JSON.parse(pattern.metadata) : {};
                                      return (
                                        <div 
                                          key={pattern.id}
                                          className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                              <p className="text-sm font-medium text-white">
                                                Pattern #{index + 1}
                                              </p>
                                              {patternMeta.ipAddress && (
                                                <p className="text-xs text-gray-400">
                                                  IP: {patternMeta.ipAddress}
                                                </p>
                                              )}
                                              {patternMeta.timestamp && (
                                                <p className="text-xs text-gray-400">
                                                  {format(new Date(patternMeta.timestamp), 'MMM d, HH:mm:ss')}
                                                </p>
                                              )}
                                            </div>
                                            {pattern.similarity && (
                                              <Badge variant="outline" className="border-green-600 text-green-400">
                                                {parseFloat(pattern.similarity).toFixed(0)}% match
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {clusters.length === 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Brain className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Fraud Clusters Detected</h3>
                  <p className="text-gray-400 mb-4">
                    The AI analysis hasn't identified any significant threat patterns yet.
                  </p>
                  <Button
                    onClick={() => triggerAnalysis.mutate()}
                    disabled={triggerAnalysis.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {triggerAnalysis.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 h-4 w-4" />
                    )}
                    Trigger Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(stats.patternTypes).map(([type, count]) => {
              const PatternIcon = patternTypeIcons[type as keyof typeof patternTypeIcons] || Target;
              return (
                <Card key={type} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <PatternIcon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white capitalize">
                            {type.replace('_', ' ')} Patterns
                          </h3>
                          <p className="text-sm text-gray-400">
                            Active threat clusters
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{count}</p>
                        <p className="text-sm text-gray-400">clusters</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Threat Analysis Engine</CardTitle>
              <CardDescription className="text-gray-400">
                Real-time fraud pattern detection and clustering system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Engine Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status.engineRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-white font-medium">
                      {status.engineRunning ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Last Analysis</p>
                  <p className="text-white">
                    {status.lastAnalysis 
                      ? format(new Date(status.lastAnalysis), 'MMM d, HH:mm:ss')
                      : 'Never'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Analysis Interval</p>
                  <p className="text-white">Every 5 minutes</p>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              <div className="space-y-4">
                <h4 className="font-medium text-white">Detection Capabilities</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                    <Network className="h-5 w-5 text-blue-400" />
                    <span className="text-white">IP-based clustering</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                    <Hash className="h-5 w-5 text-green-400" />
                    <span className="text-white">Device fingerprinting</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span className="text-white">Velocity analysis</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                    <Target className="h-5 w-5 text-purple-400" />
                    <span className="text-white">User agent patterns</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}