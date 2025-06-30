import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebhookFailure {
  id: string;
  deliveryId: string;
  statusCode?: number;
  errorMessage?: string;
  failedAt: string;
  resolved: boolean;
}

interface RetryQueueItem {
  id: string;
  deliveryId: string;
  retryCount: number;
  nextRetryAt: string;
  status: string;
  createdAt: string;
}

function AdminWebhookFailures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'failures' | 'queue'>('failures');

  // Fetch webhook failures
  const { data: failuresData, isLoading: failuresLoading } = useQuery({
    queryKey: ['/api/admin/webhook-failures'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch retry queue
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['/api/admin/webhook-retry-queue'],
    refetchInterval: 30000,
  });

  // Force retry mutation
  const forceRetryMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      const response = await apiRequest("POST", `/api/admin/webhook-retry/${deliveryId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Retry Initiated",
        description: "Webhook retry has been initiated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/webhook-retry-queue'] });
    },
    onError: (error: any) => {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to initiate webhook retry",
        variant: "destructive",
      });
    },
  });

  // Resolve failure mutation
  const resolveFailureMutation = useMutation({
    mutationFn: async (failureId: string) => {
      const response = await apiRequest("POST", `/api/admin/webhook-failure/${failureId}/resolve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Failure Resolved",
        description: "Webhook failure has been marked as resolved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/webhook-failures'] });
    },
    onError: (error: any) => {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve webhook failure",
        variant: "destructive",
      });
    },
  });

  const failures = (failuresData as any)?.failures || [];
  const queue = (queueData as any)?.queue || { totalPending: 0, retries: [] };

  const getStatusBadge = (statusCode?: number) => {
    if (!statusCode) return <Badge variant="destructive">Unknown</Badge>;
    if (statusCode >= 500) return <Badge variant="destructive">{statusCode}</Badge>;
    if (statusCode >= 400) return <Badge variant="secondary">{statusCode}</Badge>;
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Webhook Intelligence</h2>
          <p className="text-muted-foreground">
            Monitor webhook failures and manage retry operations
          </p>
        </div>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/webhook-failures'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/webhook-retry-queue'] });
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Failures</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failures.length}</div>
            <p className="text-xs text-muted-foreground">
              {failures.filter((f: any) => !f.resolved).length} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Retries</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.totalPending}</div>
            <p className="text-xs text-muted-foreground">
              In retry queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {failures.filter((f: any) => f.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('failures')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'failures'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Failure Logs
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Retry Queue
        </button>
      </div>

      {/* Failures Tab */}
      {activeTab === 'failures' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Webhook Failures
            </CardTitle>
            <CardDescription>
              Recent webhook delivery failures and their resolution status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {failuresLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : failures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <p>No webhook failures found</p>
                <p className="text-sm">All webhook deliveries are successful</p>
              </div>
            ) : (
              <div className="space-y-4">
                {failures.map((failure: any) => (
                  <div
                    key={failure.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{failure.deliveryId}</span>
                        {getStatusBadge(failure.statusCode)}
                        {failure.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {failure.errorMessage || 'No error message'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Failed at: {formatDate(failure.failedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!failure.resolved && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => forceRetryMutation.mutate(failure.deliveryId)}
                            disabled={forceRetryMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveFailureMutation.mutate(failure.id)}
                            disabled={resolveFailureMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Retry Queue Tab */}
      {activeTab === 'queue' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Retry Queue
            </CardTitle>
            <CardDescription>
              Webhooks currently scheduled for automatic retry
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : queue.retries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>No pending retries</p>
                <p className="text-sm">All webhook deliveries are up to date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.retries.map((retry: any) => (
                  <div
                    key={retry.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{retry.deliveryId}</span>
                        <Badge variant="outline">
                          Attempt {retry.retryCount + 1}
                        </Badge>
                        <Badge variant={retry.status === 'pending' ? 'secondary' : 'outline'}>
                          {retry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Next retry: {formatDate(retry.nextRetryAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {formatDate(retry.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => forceRetryMutation.mutate(retry.deliveryId)}
                      disabled={forceRetryMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Force Retry
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminWebhookFailures;