import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  RotateCcw, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar
} from 'lucide-react';

interface Refund {
  id: string;
  squareRefundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  customerEmail?: string;
  customerName?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

interface Dispute {
  id: string;
  squareDisputeId: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  state: string;
  disputeType?: string;
  cardBrand?: string;
  customerEmail?: string;
  customerName?: string;
  evidenceDeadline?: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

interface RefundAnalytics {
  totalRefunds: number;
  totalAmount: number;
  refundsByStatus: { status: string; count: number; amount: number }[];
  refundsByMethod: { method: string; count: number; amount: number }[];
}

interface DisputeAnalytics {
  totalDisputes: number;
  totalAmount: number;
  disputesByState: { state: string; count: number; amount: number }[];
  disputesByType: { type: string; count: number; amount: number }[];
  winRate: number;
}

export default function AdminRefundsDisputesFixed() {
  const [activeTab, setActiveTab] = useState('refunds');
  const [filters, setFilters] = useState({
    status: '',
    state: '',
    dateFrom: '',
    dateTo: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch refunds with proper error handling
  const { data: refundsData, isLoading: refundsLoading, error: refundsError } = useQuery({
    queryKey: ['/api/admin/refunds', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const response = await apiRequest('GET', `/api/admin/refunds?${params.toString()}`);
        const data = await response.json();
        return data.refunds || [];
      } catch (error) {
        console.error('Failed to fetch refunds:', error);
        return [];
      }
    }
  });

  // Fetch disputes with proper error handling
  const { data: disputesData, isLoading: disputesLoading, error: disputesError } = useQuery({
    queryKey: ['/api/admin/disputes', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const response = await apiRequest('GET', `/api/admin/disputes?${params.toString()}`);
        const data = await response.json();
        return data.disputes || [];
      } catch (error) {
        console.error('Failed to fetch disputes:', error);
        return [];
      }
    }
  });

  // Fetch analytics with error handling
  const { data: refundAnalytics } = useQuery({
    queryKey: ['/api/admin/refunds/analytics'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/refunds/analytics');
        const data = await response.json();
        return data.analytics || {};
      } catch (error) {
        console.error('Failed to fetch refund analytics:', error);
        return { totalRefunds: 0, totalAmount: 0, refundsByStatus: [], refundsByMethod: [] };
      }
    }
  });

  const { data: disputeAnalytics } = useQuery({
    queryKey: ['/api/admin/disputes/analytics'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/disputes/analytics');
        const data = await response.json();
        return data.analytics || {};
      } catch (error) {
        console.error('Failed to fetch dispute analytics:', error);
        return { totalDisputes: 0, totalAmount: 0, disputesByState: [], disputesByType: [], winRate: 0 };
      }
    }
  });

  // Create refund mutation
  const createRefundMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/refunds', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/refunds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/refunds/analytics'] });
      toast({
        title: "Success",
        description: "Refund created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create refund",
        variant: "destructive"
      });
    }
  });

  // Accept dispute mutation
  const acceptDisputeMutation = useMutation({
    mutationFn: async (disputeId: string) => {
      const response = await apiRequest('POST', `/api/admin/disputes/${disputeId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes/analytics'] });
      toast({
        title: "Success",
        description: "Dispute accepted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept dispute",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: Clock },
      approved: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/50', icon: CheckCircle },
      completed: { color: 'bg-green-500/20 text-green-300 border-green-500/50', icon: CheckCircle },
      failed: { color: 'bg-red-500/20 text-red-300 border-red-500/50', icon: XCircle },
      rejected: { color: 'bg-red-500/20 text-red-300 border-red-500/50', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const refunds = refundsData || [];
  const disputes = disputesData || [];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Refunds & Disputes Management
        </h1>
        <p className="text-gray-400 mt-2">
          Comprehensive management of payment refunds and dispute resolution
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Refunds Analytics */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Total Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{refundAnalytics?.totalRefunds || 0}</div>
            <p className="text-purple-300 text-sm">
              ${((refundAnalytics?.totalAmount || 0) / 100).toFixed(2)} total value
            </p>
          </CardContent>
        </Card>

        {/* Disputes Analytics */}
        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{disputeAnalytics?.totalDisputes || 0}</div>
            <p className="text-red-300 text-sm">
              ${((disputeAnalytics?.totalAmount || 0) / 100).toFixed(2)} disputed amount
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dispute Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(disputeAnalytics?.winRate || 0).toFixed(1)}%</div>
            <p className="text-green-300 text-sm">Resolution success rate</p>
          </CardContent>
        </Card>

        {/* Processing Volume */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Processing Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(((refundAnalytics?.totalAmount || 0) + (disputeAnalytics?.totalAmount || 0)) / 100).toFixed(2)}
            </div>
            <p className="text-blue-300 text-sm">Combined processing value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="refunds" className="data-[state=active]:bg-purple-500/20">
            Refunds ({refunds.length})
          </TabsTrigger>
          <TabsTrigger value="disputes" className="data-[state=active]:bg-red-500/20">
            Disputes ({disputes.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {activeTab === 'refunds' ? (
                <div className="space-y-2">
                  <Label className="text-gray-300">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-gray-300">State</Label>
                  <Select value={filters.state} onValueChange={(value) => setFilters({...filters, state: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All states</SelectItem>
                      <SelectItem value="inquiry_evidence_required">Evidence Required</SelectItem>
                      <SelectItem value="inquiry_processing">Processing</SelectItem>
                      <SelectItem value="chargeback">Chargeback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-gray-300">Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => setFilters({ status: '', state: '', dateFrom: '', dateTo: '' })}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Refunds Management</CardTitle>
              <CardDescription className="text-gray-300">
                {refundsLoading ? 'Loading refunds...' : `${refunds.length} refunds found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <div className="text-center py-8 text-gray-400">Loading refunds...</div>
              ) : refundsError ? (
                <div className="text-center py-8 text-red-400">Error loading refunds</div>
              ) : refunds.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No refunds found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-300">ID</TableHead>
                      <TableHead className="text-gray-300">Customer</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Reason</TableHead>
                      <TableHead className="text-gray-300">Created</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund: Refund) => (
                      <TableRow key={refund.id} className="border-white/10">
                        <TableCell className="text-white font-mono text-xs">
                          {refund.squareRefundId}
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{refund.customerName || 'N/A'}</div>
                            <div className="text-sm text-gray-400">{refund.customerEmail || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-mono">
                          ${(refund.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell className="text-gray-300">{refund.reason}</TableCell>
                        <TableCell className="text-gray-300">
                          {format(new Date(refund.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => {
                              // View refund details
                              toast({
                                title: "Refund Details",
                                description: `Payment ID: ${refund.paymentId}`
                              });
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Disputes Management</CardTitle>
              <CardDescription className="text-gray-300">
                {disputesLoading ? 'Loading disputes...' : `${disputes.length} disputes found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputesLoading ? (
                <div className="text-center py-8 text-gray-400">Loading disputes...</div>
              ) : disputesError ? (
                <div className="text-center py-8 text-red-400">Error loading disputes</div>
              ) : disputes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No disputes found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-300">ID</TableHead>
                      <TableHead className="text-gray-300">Customer</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">State</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300">Created</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute: Dispute) => (
                      <TableRow key={dispute.id} className="border-white/10">
                        <TableCell className="text-white font-mono text-xs">
                          {dispute.squareDisputeId}
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{dispute.customerName || 'N/A'}</div>
                            <div className="text-sm text-gray-400">{dispute.customerEmail || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-mono">
                          ${(dispute.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(dispute.state)}</TableCell>
                        <TableCell className="text-gray-300">{dispute.disputeType || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">
                          {format(new Date(dispute.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => {
                                toast({
                                  title: "Dispute Details",
                                  description: `Payment ID: ${dispute.paymentId}`
                                });
                              }}
                            >
                              View
                            </Button>
                            {dispute.state === 'inquiry_evidence_required' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => acceptDisputeMutation.mutate(dispute.id)}
                                disabled={acceptDisputeMutation.isPending}
                              >
                                {acceptDisputeMutation.isPending ? 'Processing...' : 'Accept'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}