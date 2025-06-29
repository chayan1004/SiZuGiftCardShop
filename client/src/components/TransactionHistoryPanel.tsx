import { useState, useEffect } from "react";
import { Search, Filter, Calendar, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Transaction {
  id: number;
  date: string;
  giftCardGan: string;
  recipientEmail?: string;
  amount: number;
  formattedAmount: string;
  status: string;
  type: string;
  notes?: string;
  timeAgo: string;
  balanceAfter: number;
  formattedBalance: string;
}

interface TransactionHistoryResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TransactionHistoryPanelProps {
  onClose?: () => void;
}

export default function TransactionHistoryPanel({ onClose }: TransactionHistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate]);

  const { data: transactionData, isLoading, error } = useQuery<TransactionHistoryResponse>({
    queryKey: [
      '/api/dashboard/transactions',
      debouncedSearch,
      statusFilter,
      startDate,
      endDate,
      currentPage
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/dashboard/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('merchantToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'ACTIVATE': { color: 'bg-green-100 text-green-800', label: 'Purchased' },
      'LOAD': { color: 'bg-blue-100 text-blue-800', label: 'Loaded' },
      'REDEEM': { color: 'bg-purple-100 text-purple-800', label: 'Redeemed' },
      'REFUND': { color: 'bg-orange-100 text-orange-800', label: 'Refunded' },
      'DEACTIVATE': { color: 'bg-red-100 text-red-800', label: 'Deactivated' },
    };

    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log("Export functionality to be implemented");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <Card className="w-full bg-white/10 backdrop-blur-xl border border-white/20">
      <CardHeader className="pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <span className="text-base sm:text-lg">Transaction History</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2 border-white/20 text-gray-300 hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-300 hover:bg-white/10">
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Mobile-First Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="activate">Purchased</SelectItem>
              <SelectItem value="redeem">Redeemed</SelectItem>
              <SelectItem value="load">Loaded</SelectItem>
              <SelectItem value="refund">Refunded</SelectItem>
              <SelectItem value="deactivate">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm bg-white/5 border-white/20 text-white"
            />
            <span className="text-sm text-gray-400 hidden sm:inline">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm bg-white/5 border-white/20 text-white"
            />
          </div>

          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-sm border-white/20 text-gray-300 hover:bg-white/10"
          >
            Clear Filters
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-4 bg-slate-300 rounded"></div>
                  <div className="w-32 h-4 bg-slate-300 rounded"></div>
                  <div className="w-24 h-4 bg-slate-300 rounded"></div>
                </div>
                <div className="w-20 h-4 bg-slate-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">Failed to load transaction history</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-2 border-white/20 text-gray-300 hover:bg-white/10"
            >
              Retry
            </Button>
          </div>
        ) : !transactionData?.transactions?.length ? (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
            <p className="text-gray-300 mb-4">
              {searchTerm || statusFilter !== 'all' || startDate || endDate
                ? "Try adjusting your filters to see more results"
                : "Your transaction history will appear here once you start processing gift cards"
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || startDate || endDate) && (
              <Button variant="outline" onClick={clearFilters} className="border-white/20 text-gray-300 hover:bg-white/10">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Transaction Results Summary */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-blue-200">
                Showing {transactionData.transactions.length} of {transactionData.pagination.total} transactions
              </p>
              <p className="text-sm text-blue-300">
                Page {transactionData.pagination.page} of {transactionData.pagination.totalPages}
              </p>
            </div>

            {/* Mobile-Responsive Transaction List */}
            <div className="space-y-3">
              {transactionData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  {/* Mobile Layout - Stacked */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white text-sm mb-1">
                          {transaction.giftCardGan}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.timeAgo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{transaction.formattedAmount}</p>
                        <p className="text-xs text-gray-400">Bal: {transaction.formattedBalance}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      {transaction.recipientEmail && (
                        <p className="text-xs text-gray-400 truncate max-w-[150px]">{transaction.recipientEmail}</p>
                      )}
                    </div>
                    
                    {transaction.notes && (
                      <p className="text-xs text-gray-300 p-2 bg-white/5 rounded border border-white/10">{transaction.notes}</p>
                    )}
                  </div>

                  {/* Desktop Layout - Horizontal */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="text-sm text-gray-300 min-w-[120px]">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        <br />
                        <span className="text-xs text-gray-400">{transaction.timeAgo}</span>
                      </div>
                      
                      <div className="min-w-[140px]">
                        <p className="font-medium text-white text-sm">
                          {transaction.giftCardGan}
                        </p>
                        {transaction.recipientEmail && (
                          <p className="text-xs text-gray-400 truncate">{transaction.recipientEmail}</p>
                        )}
                      </div>
                      
                      <div className="min-w-[120px]">
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      {transaction.notes && (
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 truncate">{transaction.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="font-semibold text-white">{transaction.formattedAmount}</p>
                      <p className="text-xs text-gray-400">Balance: {transaction.formattedBalance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile-Responsive Pagination */}
            {transactionData.pagination.totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-white/20">
                {/* Mobile Pagination - Compact */}
                <div className="sm:hidden flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  
                  <span className="text-sm text-gray-300">
                    {currentPage} of {transactionData.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(transactionData.pagination.totalPages, prev + 1))}
                    disabled={currentPage >= transactionData.pagination.totalPages}
                    className="flex items-center gap-1 border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Desktop Pagination - Full */}
                <div className="hidden sm:flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, transactionData.pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === pageNum 
                              ? "bg-blue-600 text-white" 
                              : "border-white/20 text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {transactionData.pagination.totalPages > 5 && (
                      <>
                        {transactionData.pagination.totalPages > 6 && <span className="text-gray-400">...</span>}
                        <Button
                          variant={currentPage === transactionData.pagination.totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(transactionData.pagination.totalPages)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === transactionData.pagination.totalPages 
                              ? "bg-blue-600 text-white" 
                              : "border-white/20 text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {transactionData.pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(transactionData.pagination.totalPages, prev + 1))}
                    disabled={currentPage >= transactionData.pagination.totalPages}
                    className="flex items-center gap-2 border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}