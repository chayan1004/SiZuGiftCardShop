import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Calendar, Mail, CreditCard, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Download, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PublicGiftCardOrder {
  id: string;
  recipientEmail: string;
  merchantId: string | null;
  amount: number;
  message: string | null;
  status: string;
  squarePaymentId: string | null;
  giftCardGan: string | null;
  giftCardId: string | null;
  giftCardState: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  emailResendCount: number;
  emailLastResendAt: string | null;
  manuallyMarkedFailed: boolean;
  pdfReceiptUrl: string | null;
  pdfGeneratedAt: string | null;
  createdAt: string;
}

export default function AdminGiftCardOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: orders = [], isLoading, error } = useQuery<PublicGiftCardOrder[]>({
    queryKey: ["/api/admin/giftcard-orders"],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.giftCardId && order.giftCardId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    const matchesEmail = 
      emailFilter === "all" ||
      (emailFilter === "sent" && order.emailSent) ||
      (emailFilter === "not_sent" && !order.emailSent);
    
    return matchesSearch && matchesStatus && matchesEmail;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'issued':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle className="w-3 h-3 mr-1" />Issued</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailBadge = (emailSent: boolean) => {
    return emailSent ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        <Mail className="w-3 h-3 mr-1" />Sent
      </Badge>
    ) : (
      <Badge variant="outline">Not Sent</Badge>
    );
  };

  const handleResendEmail = async (orderId: string) => {
    setLoadingActions(prev => ({ ...prev, [`resend-${orderId}`]: true }));
    
    try {
      const response = await apiRequest("POST", `/api/admin/giftcard-orders/${orderId}/resend-email`);
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Email Resent",
          description: result.message || "Gift card email has been resent successfully",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/admin/giftcard-orders"] });
      } else {
        const error = await response.json();
        toast({
          title: "Resend Failed",
          description: error.message || "Failed to resend email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: "Error",
        description: "An error occurred while resending the email",
        variant: "destructive",
      });
    } finally {
      setLoadingActions(prev => ({ ...prev, [`resend-${orderId}`]: false }));
    }
  };

  const handleDownloadQR = async (orderId: string) => {
    setLoadingActions(prev => ({ ...prev, [`qr-${orderId}`]: true }));
    
    try {
      const response = await fetch(`/api/public/qr/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.qrCodeDataURI) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.qrCodeDataURI;
        link.download = `receipt-qr-${orderId.substring(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "QR Code Downloaded",
          description: "Receipt QR code has been downloaded",
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "An error occurred while generating QR code",
        variant: "destructive",
      });
    } finally {
      setLoadingActions(prev => ({ ...prev, [`qr-${orderId}`]: false }));
    }
  };

  const handleMarkAsFailed = async (orderId: string) => {
    if (!confirm("Are you sure you want to mark this order as failed? This action cannot be undone.")) {
      return;
    }
    
    setLoadingActions(prev => ({ ...prev, [`fail-${orderId}`]: true }));
    
    try {
      const response = await apiRequest("POST", `/api/admin/giftcard-orders/${orderId}/mark-failed`);
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Order Updated",
          description: result.message || "Order has been marked as failed",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/admin/giftcard-orders"] });
      } else {
        const error = await response.json();
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update order status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error marking order as failed:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the order",
        variant: "destructive",
      });
    } finally {
      setLoadingActions(prev => ({ ...prev, [`fail-${orderId}`]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-6">
              <p className="text-red-600 dark:text-red-400">Failed to load gift card orders. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Public Gift Card Orders
          </h1>
          <p className="text-slate-300">
            Monitor all gift card purchases from the public storefront
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-300">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm text-slate-300">Issued</p>
                  <p className="text-2xl font-bold text-white">
                    {orders.filter((o) => o.status === 'issued').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-300">Emails Sent</p>
                  <p className="text-2xl font-bold text-white">
                    {orders.filter((o) => o.emailSent).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-sm text-slate-300">Total Value</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(orders.reduce((sum, o) => sum + o.amount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by email, order ID, or gift card ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-slate-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Status Filter</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Email Status</label>
                <Select value={emailFilter} onValueChange={setEmailFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Email Statuses</SelectItem>
                    <SelectItem value="sent">Email Sent</SelectItem>
                    <SelectItem value="not_sent">Email Not Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Gift Card Orders ({filteredOrders.length})</CardTitle>
            <CardDescription className="text-slate-300">
              Recent orders are shown first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-slate-300">Order ID</TableHead>
                    <TableHead className="text-slate-300">Recipient Email</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Gift Card ID</TableHead>
                    <TableHead className="text-slate-300">Email Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                        No orders found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white font-mono text-xs">
                          {order.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-white">
                          {order.recipientEmail}
                          {order.merchantId && (
                            <div className="text-xs text-slate-400">
                              Merchant: {order.merchantId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          {formatCurrency(order.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-white">
                          {order.giftCardId ? (
                            <div className="space-y-1">
                              <div className="font-mono text-xs">{order.giftCardId.substring(0, 8)}...</div>
                              {order.giftCardGan && (
                                <div className="text-xs text-slate-400">GAN: {order.giftCardGan}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getEmailBadge(order.emailSent)}
                          {order.emailSentAt && (
                            <div className="text-xs text-slate-400 mt-1">
                              {formatDate(order.emailSentAt)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* Resend Email Button */}
                            {order.status === 'issued' && order.giftCardGan && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendEmail(order.id)}
                                disabled={loadingActions[`resend-${order.id}`]}
                                className="h-8 px-2 text-xs bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30 text-blue-300"
                              >
                                {loadingActions[`resend-${order.id}`] ? (
                                  <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                <span className="ml-1">Resend</span>
                              </Button>
                            )}
                            
                            {/* Mark Failed Button */}
                            {order.status !== 'failed' && !order.manuallyMarkedFailed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsFailed(order.id)}
                                disabled={loadingActions[`fail-${order.id}`]}
                                className="h-8 px-2 text-xs bg-red-600/20 border-red-500/30 hover:bg-red-600/30 text-red-300"
                              >
                                {loadingActions[`fail-${order.id}`] ? (
                                  <div className="animate-spin w-3 h-3 border border-red-300 border-t-transparent rounded-full" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3" />
                                )}
                                <span className="ml-1">Mark Failed</span>
                              </Button>
                            )}

                            {/* PDF Receipt Download */}
                            {order.pdfReceiptUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(order.pdfReceiptUrl!, '_blank')}
                                className="h-8 px-2 text-xs bg-green-600/20 border-green-500/30 hover:bg-green-600/30 text-green-300"
                              >
                                <Download className="w-3 h-3" />
                                <span className="ml-1">Receipt</span>
                              </Button>
                            )}

                            {/* QR Code Download */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadQR(order.id)}
                              disabled={loadingActions[`qr-${order.id}`]}
                              className="h-8 px-2 text-xs bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/30 text-purple-300"
                            >
                              {loadingActions[`qr-${order.id}`] ? (
                                <div className="animate-spin w-3 h-3 border border-purple-300 border-t-transparent rounded-full" />
                              ) : (
                                <QrCode className="w-3 h-3" />
                              )}
                              <span className="ml-1">QR</span>
                            </Button>

                            {/* Show resend count if > 0 */}
                            {order.emailResendCount > 0 && (
                              <div className="text-xs text-slate-400 self-center">
                                Resent: {order.emailResendCount}x
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}