import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'issue' | 'redeem' | 'refund';
  merchantId: string | null;
  cardId: string | null;
  amount: number;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  attemptCount: number;
  success: boolean;
  failureReason: string | null;
  customerEmail: string | null;
  orderReference: string | null;
  squareTransactionId: string | null;
  createdAt: string;
}

interface TransactionStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  issueCount: number;
  redeemCount: number;
  refundCount: number;
}

interface TransactionDetail extends Transaction {
  merchant?: {
    merchantId: string;
    businessName: string;
    email: string;
  };
  fraudLogs?: Array<{
    id: string;
    attemptType: string;
    ipAddress: string;
    userAgent: string;
    severity: string;
    details: string;
    timestamp: string;
  }>;
}

const TransactionExplorerPage: React.FC = () => {
  const [filters, setFilters] = useState({
    merchantId: '',
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    page: 1,
    limit: 50
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [realtimeTransactions, setRealtimeTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  // Socket.IO for real-time updates
  const { isConnected, fraudAlerts, on, off } = useSocket();

  useEffect(() => {
    if (isConnected && on) {
      on('transaction-feed', (transaction: Transaction) => {
        setRealtimeTransactions(prev => [transaction, ...prev.slice(0, 4)]);
        toast({
          title: "New Transaction",
          description: `${transaction.type.toUpperCase()} - $${(transaction.amount / 100).toFixed(2)}`,
          duration: 3000,
        });
      });

      return () => {
        if (off) {
          off('transaction-feed');
        }
      };
    }
  }, [isConnected, on, off, toast]);

  // Fetch transactions with filters
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ['/api/admin/transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch transaction detail
  const { data: transactionDetail } = useQuery({
    queryKey: ['/api/admin/transactions', selectedTransaction],
    queryFn: async () => {
      if (!selectedTransaction) return null;
      
      const response = await fetch(`/api/admin/transactions/${selectedTransaction}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch transaction detail');
      return response.json();
    },
    enabled: !!selectedTransaction
  });

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/transactions/stats/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/transactions/stats/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 30000
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransaction(transactionId);
    setDrawerOpen(true);
  };

  const getStatusBadge = (status: string, success: boolean) => {
    if (status === 'completed' && success) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle className="w-3 h-3 mr-1" />
        Completed
      </Badge>;
    }
    if (status === 'failed' || !success) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      issue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      redeem: 'bg-green-500/20 text-green-400 border-green-500/30',
      refund: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    return <Badge className={colors[type as keyof typeof colors] || colors.issue}>
      {type.toUpperCase()}
    </Badge>;
  };

  const stats = statsData?.stats || {};
  const transactions = transactionData?.transactions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transaction Explorer</h1>
            <p className="text-gray-300">Monitor all gift card transactions in real-time</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold text-white">{stats.totalTransactions || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Successful</p>
                  <p className="text-2xl font-bold text-green-400">{stats.successfulTransactions || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{stats.failedTransactions || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ${((stats.totalAmount || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Feed */}
        {realtimeTransactions.length > 0 && (
          <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Live Transaction Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {realtimeTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      {getTypeBadge(tx.type)}
                      <span className="text-white">
                        ${(tx.amount / 100).toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {getStatusBadge(tx.status, tx.success)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Card ID, email, reference..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Type</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="redeem">Redeem</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading transactions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Card ID</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Customer</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="border-white/10">
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell className="text-white">
                        ${(transaction.amount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {transaction.cardId || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status, transaction.success)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {transaction.customerEmail || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewTransaction(transaction.id)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="bg-gray-900 border-white/10 max-w-4xl mx-auto">
            <DrawerHeader>
              <DrawerTitle className="text-white">Transaction Details</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 space-y-6">
              {transactionDetail?.transaction && (
                <TransactionDetailView transaction={transactionDetail.transaction} />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

// Transaction Detail Component
const TransactionDetailView: React.FC<{ transaction: TransactionDetail }> = ({ transaction }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Info */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Transaction Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Transaction ID</Label>
            <p className="text-white font-mono text-sm">{transaction.id}</p>
          </div>
          <div>
            <Label className="text-gray-400">Type</Label>
            <p className="text-white">{transaction.type.toUpperCase()}</p>
          </div>
          <div>
            <Label className="text-gray-400">Amount</Label>
            <p className="text-white">${(transaction.amount / 100).toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-gray-400">Status</Label>
            <p className="text-white">{transaction.status}</p>
          </div>
          <div>
            <Label className="text-gray-400">Gift Card ID</Label>
            <p className="text-white font-mono text-sm">{transaction.cardId || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Security Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">IP Address</Label>
            <p className="text-white font-mono text-sm">{transaction.ipAddress || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-gray-400">Device ID</Label>
            <p className="text-white font-mono text-sm">{transaction.deviceId || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-gray-400">Attempt Count</Label>
            <p className="text-white">{transaction.attemptCount}</p>
          </div>
          {transaction.failureReason && (
            <div>
              <Label className="text-gray-400">Failure Reason</Label>
              <p className="text-red-400">{transaction.failureReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merchant Info */}
      {transaction.merchant && (
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Merchant Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400">Business Name</Label>
              <p className="text-white">{transaction.merchant.businessName}</p>
            </div>
            <div>
              <Label className="text-gray-400">Merchant ID</Label>
              <p className="text-white font-mono text-sm">{transaction.merchant.merchantId}</p>
            </div>
            <div>
              <Label className="text-gray-400">Email</Label>
              <p className="text-white">{transaction.merchant.email}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fraud Logs */}
      {transaction.fraudLogs && transaction.fraudLogs.length > 0 && (
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Fraud Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transaction.fraudLogs.map((log) => (
                <div key={log.id} className="p-3 bg-red-500/10 rounded border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      {log.severity}
                    </Badge>
                    <span className="text-gray-400 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{log.details}</p>
                  <p className="text-gray-400 text-xs mt-1">IP: {log.ipAddress}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransactionExplorerPage;