import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Shield, 
  Play, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Target,
  Brain,
  Zap,
  Trash2
} from 'lucide-react';

interface ThreatReplayReport {
  fraudLogId: string;
  originalAttempt: {
    gan: string;
    ip: string;
    userAgent: string;
    merchantId?: string;
    reason: string;
    timestamp: string;
  };
  replayResult: {
    blocked: boolean;
    blockReason?: string;
    httpStatus: number;
    responseTime: number;
    wouldCreateRule: boolean;
    suggestedRule?: {
      type: string;
      value: string;
      reason: string;
      confidence: number;
    };
  };
  learningOutcome: 'blocked_correctly' | 'should_have_blocked' | 'false_positive' | 'ignored';
}

interface DefenseRule {
  id: string;
  type: string;
  value: string;
  reason: string;
  confidence: number;
  hitCount: number;
  lastTriggered?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminThreatReplay() {
  const [replayLimit, setReplayLimit] = useState(50);
  const [replayResults, setReplayResults] = useState<any>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch defense rules and statistics
  const { data: defenseData, isLoading: defenseLoading } = useQuery({
    queryKey: ['/api/admin/defense-rules'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Threat replay mutation
  const replayMutation = useMutation({
    mutationFn: async (limit: number) => {
      const response = await apiRequest('POST', '/api/admin/replay-threats', { limit });
      return response.json();
    },
    onSuccess: (data) => {
      setReplayResults(data);
      setIsReplaying(false);
      toast({
        title: "Threat Replay Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/defense-rules'] });
    },
    onError: (error: any) => {
      setIsReplaying(false);
      toast({
        title: "Replay Failed",
        description: error.message || "Failed to run threat replay analysis",
        variant: "destructive",
      });
    }
  });

  // Deactivate rule mutation
  const deactivateMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/defense-rules/${ruleId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rule Deactivated",
        description: "Defense rule has been deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/defense-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deactivation Failed",
        description: error.message || "Failed to deactivate defense rule",
        variant: "destructive",
      });
    }
  });

  const handleRunReplay = () => {
    setIsReplaying(true);
    replayMutation.mutate(replayLimit);
  };

  const handleDeactivateRule = (ruleId: string) => {
    if (confirm('Are you sure you want to deactivate this defense rule?')) {
      deactivateMutation.mutate(ruleId);
    }
  };

  const getLearningOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'blocked_correctly':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Blocked Correctly</Badge>;
      case 'should_have_blocked':
        return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />Should Have Blocked</Badge>;
      case 'false_positive':
        return <Badge className="bg-yellow-500"><XCircle className="w-3 h-3 mr-1" />False Positive</Badge>;
      case 'ignored':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Ignored</Badge>;
      default:
        return <Badge variant="outline">{outcome}</Badge>;
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const colors = {
      ip: "bg-blue-500",
      fingerprint: "bg-purple-500",
      merchant: "bg-orange-500"
    };
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-500"}>{type.toUpperCase()}</Badge>;
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Threat Replay Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Adaptive firewall that learns from past attacks and strengthens defenses
          </p>
        </div>
      </div>

      <Tabs defaultValue="replay" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="replay" className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Threat Replay</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Defense Rules</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Statistics</span>
          </TabsTrigger>
        </TabsList>

        {/* Threat Replay Tab */}
        <TabsContent value="replay" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b">
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>Run Threat Replay Analysis</span>
              </CardTitle>
              <CardDescription>
                Replay historical fraud attempts to train the auto-defense system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="replayLimit">Number of fraud logs to analyze</Label>
                    <Input
                      id="replayLimit"
                      type="number"
                      value={replayLimit}
                      onChange={(e) => setReplayLimit(Number(e.target.value))}
                      min="10"
                      max="200"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleRunReplay}
                    disabled={isReplaying}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isReplaying ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Replay
                      </>
                    )}
                  </Button>
                </div>

                {replayResults && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm text-green-600 dark:text-green-400">Blocked Correctly</p>
                              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {replayResults.replay.blockedCorrectly}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-sm text-red-600 dark:text-red-400">Should Have Blocked</p>
                              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {replayResults.replay.shouldHaveBlocked}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-5 h-5 text-yellow-600" />
                            <div>
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">False Positives</p>
                              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                                {replayResults.replay.falsePositives}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-blue-600 dark:text-blue-400">New Rules Created</p>
                              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {replayResults.learning.rulesCreated}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Learning Effectiveness</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Overall Effectiveness</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {replayResults.learning.learningEffectiveness}%
                              </span>
                            </div>
                            <Progress value={replayResults.learning.learningEffectiveness} className="h-2" />
                          </div>
                          
                          {replayResults.learning.recommendations.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Recommendations</h4>
                              <ul className="space-y-1">
                                {replayResults.learning.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Replay Report Details</CardTitle>
                        <CardDescription>
                          Analysis of {replayResults.replay.totalAnalyzed} historical threats
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {replayResults.replay.reports.slice(0, 20).map((report: ThreatReplayReport, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    {report.originalAttempt.ip}
                                  </code>
                                  <span className="text-sm truncate max-w-32">
                                    {report.originalAttempt.gan}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {getLearningOutcomeBadge(report.learningOutcome)}
                                  {report.replayResult.wouldCreateRule && (
                                    <Badge variant="outline" className="text-xs">
                                      <Zap className="w-3 h-3 mr-1" />New Rule
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defense Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Auto Defense Rules</span>
              </CardTitle>
              <CardDescription>
                Active defense rules learned from threat analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {defenseLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {defenseData?.rules?.length > 0 ? (
                    <div className="space-y-3">
                      {defenseData.rules.map((rule: DefenseRule) => (
                        <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                          <div className="flex items-center space-x-4">
                            {getRuleTypeBadge(rule.type)}
                            <div>
                              <p className="font-medium text-sm">{rule.reason}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Value: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{rule.value}</code>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
                              <p className="font-semibold">{rule.confidence}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Hits</p>
                              <p className="font-semibold">{rule.hitCount}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivateRule(rule.id)}
                              disabled={deactivateMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No defense rules created yet</p>
                      <p className="text-sm">Run threat replay analysis to generate auto-defense rules</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defenseData?.statistics && (
              <>
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Rules</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {defenseData.statistics.totalRules}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Active Rules</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {defenseData.statistics.activeRules}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Recently Triggered</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {defenseData.statistics.recentlyTriggered}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Target className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-orange-600 dark:text-orange-400">Avg Confidence</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {defenseData.statistics.averageConfidence}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {defenseData?.statistics?.rulesByType && (
            <Card>
              <CardHeader>
                <CardTitle>Defense Rules by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(defenseData.statistics.rulesByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getRuleTypeBadge(type)}
                        <span className="font-medium capitalize">{type} Rules</span>
                      </div>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}