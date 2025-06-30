import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  FileText,
  Upload,
  Eye,
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
  lastFourDigits?: string;
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

export default function AdminRefundsDisputes() {
  const [activeTab, setActiveTab] = useState('refunds');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [createRefundDialog, setCreateRefundDialog] = useState(false);
  const [evidenceDialog, setEvidenceDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    state: '',
    dateFrom: '',
    dateTo: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch refunds
  const { data: refunds = [], isLoading: refundsLoading } = useQuery({
    queryKey: ['/api/admin/refunds', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest(`/api/admin/refunds?${params.toString()}`);
    }
  });

  // Fetch disputes
  const { data: disputes = [], isLoading: disputesLoading } = useQuery({
    queryKey: ['/api/admin/disputes', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest(`/api/admin/disputes?${params.toString()}`);
    }
  });

  // Fetch refund analytics
  const { data: refundAnalytics } = useQuery<RefundAnalytics>({
    queryKey: ['/api/admin/refunds/analytics'],
    queryFn: () => apiRequest('/api/admin/refunds/analytics')
  });

  // Fetch dispute analytics
  const { data: disputeAnalytics } = useQuery<DisputeAnalytics>({
    queryKey: ['/api/admin/disputes/analytics'],
    queryFn: () => apiRequest('/api/admin/disputes/analytics')
  });

  // Create refund mutation
  const createRefundMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/refunds', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/refunds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/refunds/analytics'] });
      setCreateRefundDialog(false);
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
    mutationFn: (disputeId: string) => apiRequest(`/api/admin/disputes/${disputeId}/accept`, 'POST'),
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

  // Submit evidence mutation
  const submitEvidenceMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/disputes/${selectedDispute?.id}/evidence`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
      setEvidenceDialog(false);
      toast({
        title: "Success",
        description: "Evidence submitted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit evidence",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'COMPLETED': 'default',
      'FAILED': 'destructive',
      'REJECTED': 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getDisputeStateBadge = (state: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'INQUIRY_EVIDENCE_REQUIRED': 'outline',
      'INQUIRY_PROCESSING': 'outline',
      'CHARGEBACK_EVIDENCE_REQUIRED': 'destructive',
      'CHARGEBACK_PROCESSING': 'destructive',
      'WON': 'default',
      'LOST': 'destructive',
      'ACCEPTED': 'secondary'
    };
    return <Badge variant={variants[state] || 'secondary'}>{state}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Refunds & Disputes</h1>
            <p className="text-blue-200">Manage payment refunds and dispute resolution</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Refunds</CardTitle>
              <RotateCcw className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{refundAnalytics?.totalRefunds || 0}</div>
              <p className="text-xs text-blue-200">
                ${((refundAnalytics?.totalAmount || 0) / 100).toFixed(2)} total amount
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Disputes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{disputeAnalytics?.totalDisputes || 0}</div>
              <p className="text-xs text-blue-200">
                ${((disputeAnalytics?.totalAmount || 0) / 100).toFixed(2)} disputed amount
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Dispute Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{disputeAnalytics?.winRate.toFixed(1) || 0}%</div>
              <p className="text-xs text-blue-200">
                Success rate in dispute resolution
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {disputes.filter((d: Dispute) => d.state.includes('REQUIRED')).length}
              </div>
              <p className="text-xs text-blue-200">
                Disputes requiring evidence
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Refunds & Disputes Management</CardTitle>
                <CardDescription className="text-blue-200">
                  Monitor and manage payment refunds and dispute resolution
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={createRefundDialog} onOpenChange={setCreateRefundDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Create Refund
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 text-white border-gray-700">
                    <DialogHeader>
                      <DialogTitle>Create New Refund</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Create a refund for a payment transaction
                      </DialogDescription>
                    </DialogHeader>
                    <CreateRefundForm onSubmit={(data) => createRefundMutation.mutate(data)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger value="refunds" className="text-white data-[state=active]:bg-white/20">
                  Refunds ({refunds.length})
                </TabsTrigger>
                <TabsTrigger value="disputes" className="text-white data-[state=active]:bg-white/20">
                  Disputes ({disputes.length})
                </TabsTrigger>
              </TabsList>

              {/* Filters */}
              <div className="flex gap-4 mb-4 mt-4">
                <div className="flex-1">
                  <Label className="text-white">Status/State</Label>
                  <Select 
                    value={activeTab === 'refunds' ? filters.status : filters.state} 
                    onValueChange={(value) => setFilters(prev => 
                      activeTab === 'refunds' 
                        ? { ...prev, status: value }
                        : { ...prev, state: value }
                    )}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by status/state" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {activeTab === 'refunds' ? (
                        <>
                          <SelectItem value="">All Statuses</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="">All States</SelectItem>
                          <SelectItem value="INQUIRY_EVIDENCE_REQUIRED">Inquiry Evidence Required</SelectItem>
                          <SelectItem value="CHARGEBACK_EVIDENCE_REQUIRED">Chargeback Evidence Required</SelectItem>
                          <SelectItem value="WON">Won</SelectItem>
                          <SelectItem value="LOST">Lost</SelectItem>
                          <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-white">Date From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-white">Date To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ status: '', state: '', dateFrom: '', dateTo: '' })}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <TabsContent value="refunds" className="space-y-4">
                <RefundsTable 
                  refunds={refunds} 
                  loading={refundsLoading}
                  onSelect={setSelectedRefund}
                />
              </TabsContent>

              <TabsContent value="disputes" className="space-y-4">
                <DisputesTable 
                  disputes={disputes} 
                  loading={disputesLoading}
                  onSelect={setSelectedDispute}
                  onAccept={(id) => acceptDisputeMutation.mutate(id)}
                  onSubmitEvidence={(dispute) => {
                    setSelectedDispute(dispute);
                    setEvidenceDialog(true);
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Evidence Submission Dialog */}
        <Dialog open={evidenceDialog} onOpenChange={setEvidenceDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Submit Dispute Evidence</DialogTitle>
              <DialogDescription className="text-gray-400">
                Submit evidence for dispute {selectedDispute?.squareDisputeId}
              </DialogDescription>
            </DialogHeader>
            <EvidenceForm onSubmit={(data) => submitEvidenceMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Create Refund Form Component
function CreateRefundForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    paymentId: '',
    amount: '',
    reason: '',
    currency: 'USD'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseInt(formData.amount) * 100 // Convert to cents
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Payment ID</Label>
        <Input
          value={formData.paymentId}
          onChange={(e) => setFormData(prev => ({ ...prev, paymentId: e.target.value }))}
          placeholder="Square Payment ID"
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>
      <div>
        <Label>Amount (USD)</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          placeholder="50.00"
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>
      <div>
        <Label>Reason</Label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Reason for refund"
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Create Refund
        </Button>
      </DialogFooter>
    </form>
  );
}

// Evidence Form Component
function EvidenceForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    evidenceType: '',
    evidenceCategory: '',
    evidenceText: '',
    evidenceFile: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Evidence Type</Label>
        <Select value={formData.evidenceType} onValueChange={(value) => setFormData(prev => ({ ...prev, evidenceType: value }))}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select evidence type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="RECEIPT">Receipt</SelectItem>
            <SelectItem value="CUSTOMER_COMMUNICATION">Customer Communication</SelectItem>
            <SelectItem value="SHIPPING_DOCUMENTATION">Shipping Documentation</SelectItem>
            <SelectItem value="SERVICE_DOCUMENTATION">Service Documentation</SelectItem>
            <SelectItem value="CANCELLATION_POLICY">Cancellation Policy</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Evidence Category</Label>
        <Select value={formData.evidenceCategory} onValueChange={(value) => setFormData(prev => ({ ...prev, evidenceCategory: value }))}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select evidence category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="ONLINE_OR_APP_PURCHASE_CONFIRMATION">Online/App Purchase Confirmation</SelectItem>
            <SelectItem value="RECEIPT">Receipt</SelectItem>
            <SelectItem value="CUSTOMER_COMMUNICATION">Customer Communication</SelectItem>
            <SelectItem value="AUTHORIZATION">Authorization</SelectItem>
            <SelectItem value="CANCELLATION_POLICY_DISCLOSURE">Cancellation Policy Disclosure</SelectItem>
            <SelectItem value="GENERIC_EVIDENCE">Generic Evidence</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Evidence Text</Label>
        <Textarea
          value={formData.evidenceText}
          onChange={(e) => setFormData(prev => ({ ...prev, evidenceText: e.target.value }))}
          placeholder="Describe the evidence"
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Submit Evidence
        </Button>
      </DialogFooter>
    </form>
  );
}

// Refunds Table Component
function RefundsTable({ refunds, loading, onSelect }: { refunds: Refund[], loading: boolean, onSelect: (refund: Refund) => void }) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'COMPLETED': 'default',
      'FAILED': 'destructive',
      'REJECTED': 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading refunds...</div>;
  }

  return (
    <div className="rounded-md border border-white/20 bg-white/5">
      <Table>
        <TableHeader>
          <TableRow className="border-white/20">
            <TableHead className="text-white">Refund ID</TableHead>
            <TableHead className="text-white">Payment ID</TableHead>
            <TableHead className="text-white">Amount</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white">Customer</TableHead>
            <TableHead className="text-white">Created</TableHead>
            <TableHead className="text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {refunds.map((refund: Refund) => (
            <TableRow key={refund.id} className="border-white/20">
              <TableCell className="text-white font-mono text-xs">
                {refund.squareRefundId.substring(0, 8)}...
              </TableCell>
              <TableCell className="text-white font-mono text-xs">
                {refund.paymentId.substring(0, 8)}...
              </TableCell>
              <TableCell className="text-white">
                ${(refund.amount / 100).toFixed(2)} {refund.currency}
              </TableCell>
              <TableCell>{getStatusBadge(refund.status)}</TableCell>
              <TableCell className="text-white">
                <div>
                  <div className="font-medium">{refund.customerName || 'N/A'}</div>
                  <div className="text-sm text-gray-400">{refund.customerEmail || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell className="text-white">
                {format(new Date(refund.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(refund)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Disputes Table Component
function DisputesTable({ 
  disputes, 
  loading, 
  onSelect, 
  onAccept, 
  onSubmitEvidence 
}: { 
  disputes: Dispute[], 
  loading: boolean, 
  onSelect: (dispute: Dispute) => void,
  onAccept: (id: string) => void,
  onSubmitEvidence: (dispute: Dispute) => void
}) {
  const getDisputeStateBadge = (state: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'INQUIRY_EVIDENCE_REQUIRED': 'outline',
      'INQUIRY_PROCESSING': 'outline',
      'CHARGEBACK_EVIDENCE_REQUIRED': 'destructive',
      'CHARGEBACK_PROCESSING': 'destructive',
      'WON': 'default',
      'LOST': 'destructive',
      'ACCEPTED': 'secondary'
    };
    return <Badge variant={variants[state] || 'secondary'}>{state}</Badge>;
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading disputes...</div>;
  }

  return (
    <div className="rounded-md border border-white/20 bg-white/5">
      <Table>
        <TableHeader>
          <TableRow className="border-white/20">
            <TableHead className="text-white">Dispute ID</TableHead>
            <TableHead className="text-white">Payment ID</TableHead>
            <TableHead className="text-white">Amount</TableHead>
            <TableHead className="text-white">State</TableHead>
            <TableHead className="text-white">Type</TableHead>
            <TableHead className="text-white">Card</TableHead>
            <TableHead className="text-white">Created</TableHead>
            <TableHead className="text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disputes.map((dispute: Dispute) => (
            <TableRow key={dispute.id} className="border-white/20">
              <TableCell className="text-white font-mono text-xs">
                {dispute.squareDisputeId.substring(0, 8)}...
              </TableCell>
              <TableCell className="text-white font-mono text-xs">
                {dispute.paymentId.substring(0, 8)}...
              </TableCell>
              <TableCell className="text-white">
                ${(dispute.amount / 100).toFixed(2)} {dispute.currency}
              </TableCell>
              <TableCell>{getDisputeStateBadge(dispute.state)}</TableCell>
              <TableCell className="text-white">
                <Badge variant="outline">{dispute.disputeType || 'N/A'}</Badge>
              </TableCell>
              <TableCell className="text-white">
                <div>
                  <div className="font-medium">{dispute.cardBrand || 'N/A'}</div>
                  <div className="text-sm text-gray-400">****{dispute.lastFourDigits || '0000'}</div>
                </div>
              </TableCell>
              <TableCell className="text-white">
                {format(new Date(dispute.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(dispute)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {dispute.state.includes('EVIDENCE_REQUIRED') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSubmitEvidence(dispute)}
                      className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  {dispute.state.includes('INQUIRY') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAccept(dispute.id)}
                      className="border-green-400 text-green-400 hover:bg-green-400/10"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}