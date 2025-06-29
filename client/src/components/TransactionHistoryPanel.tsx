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
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Transaction History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="activate">Purchased</SelectItem>
              <SelectItem value="redeem">Redeemed</SelectItem>
              <SelectItem value="load">Loaded</SelectItem>
              <SelectItem value="refund">Refunded</SelectItem>
              <SelectItem value="deactivate">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm"
            />
            <span className="text-sm text-gray-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm"
            />
          </div>

          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-sm"
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
            <p className="text-red-600">Failed to load transaction history</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : !transactionData?.transactions?.length ? (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter !== 'all' || startDate || endDate
                ? "Try adjusting your filters to see more results"
                : "Your transaction history will appear here once you start processing gift cards"
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || startDate || endDate) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Transaction Results Summary */}
            <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Showing {transactionData.transactions.length} of {transactionData.pagination.total} transactions
              </p>
              <p className="text-sm text-blue-600">
                Page {transactionData.pagination.page} of {transactionData.pagination.totalPages}
              </p>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
              {transactionData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-slate-600 min-w-[100px]">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      <br />
                      <span className="text-xs text-slate-400">{transaction.timeAgo}</span>
                    </div>
                    
                    <div className="min-w-[120px]">
                      <p className="font-medium text-slate-900 text-sm">
                        {transaction.giftCardGan}
                      </p>
                      {transaction.recipientEmail && (
                        <p className="text-xs text-slate-500">{transaction.recipientEmail}</p>
                      )}
                    </div>
                    
                    <div className="min-w-[100px]">
                      {getStatusBadge(transaction.status)}
                    </div>
                    
                    {transaction.notes && (
                      <div className="max-w-[200px]">
                        <p className="text-xs text-slate-600 truncate">{transaction.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{transaction.formattedAmount}</p>
                    <p className="text-xs text-slate-500">Balance: {transaction.formattedBalance}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {transactionData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
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
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {transactionData.pagination.totalPages > 5 && (
                    <>
                      {transactionData.pagination.totalPages > 6 && <span className="text-slate-500">...</span>}
                      <Button
                        variant={currentPage === transactionData.pagination.totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(transactionData.pagination.totalPages)}
                        className="w-8 h-8 p-0"
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
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}