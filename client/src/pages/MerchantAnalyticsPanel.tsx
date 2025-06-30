import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Calendar, TrendingUp, CreditCard, DollarSign, Users, BarChart3 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AnalyticsSummary {
  totalIssued: number;
  totalRedeemed: number;
  totalRevenue: number;
  outstandingBalance: number;
  redemptionRate: number;
}

interface IssuanceData {
  gan: string;
  amount: number;
  issuedDate: Date;
  recipientEmail?: string;
  status: string;
  orderId?: string;
}

interface RedemptionData {
  gan: string;
  amount: number;
  redeemedBy: string;
  redeemedAt: Date;
  ipAddress?: string;
  deviceFingerprint?: string;
}

interface TopRedeemedCard {
  gan: string;
  totalRedeemed: number;
  redemptionCount: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  issuanceData: IssuanceData[];
  redemptionData: RedemptionData[];
  topRedeemedCards: TopRedeemedCard[];
}

export default function MerchantAnalyticsPanel() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  // Fetch analytics data
  const { data: analyticsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/merchant/analytics/giftcards', startDate, endDate],
    queryFn: () => apiRequest('GET', `/api/merchant/analytics/giftcards?${queryParams.toString()}`),
    enabled: !!startDate && !!endDate
  });

  const analytics: AnalyticsData | null = analyticsResponse?.data || null;

  // Handle export downloads
  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', format);

      const response = await fetch(`/api/merchant/analytics/giftcards?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || 
        `giftcard_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${format.toUpperCase()} report downloaded successfully`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to download ${format.toUpperCase()} report`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Gift Card Analytics
              </h1>
              <p className="text-white/80">
                Comprehensive analytics and export capabilities for your gift card program
              </p>
            </div>
            
            {/* Date Range Controls */}
            <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-white/90">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-white/90">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white border-none"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Download CSV'}
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting || isLoading}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/80">Loading analytics data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md rounded-2xl border border-red-500/30 p-6">
            <p className="text-red-200">
              Failed to load analytics data. Please try again.
            </p>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && (
          <>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white/80">Total Issued</p>
                      <p className="text-2xl font-bold text-white">{analytics.summary.totalIssued}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-white/80">Total Redeemed</p>
                      <p className="text-2xl font-bold text-white">{analytics.summary.totalRedeemed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-white/80">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(analytics.summary.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white/80">Outstanding</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(analytics.summary.outstandingBalance)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-white/80">Redemption Rate</p>
                      <p className="text-2xl font-bold text-white">{analytics.summary.redemptionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Redeemed Cards */}
            {analytics.topRedeemedCards.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Top Redeemed Cards (Last 30 Days)</CardTitle>
                  <CardDescription className="text-white/70">
                    Most actively used gift cards in your program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topRedeemedCards.slice(0, 10).map((card, index) => (
                      <div key={card.gan} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{card.gan.substring(0, 20)}...</p>
                            <p className="text-white/60 text-sm">{card.redemptionCount} redemptions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(card.totalRedeemed)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Issuances */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Issuances</CardTitle>
                  <CardDescription className="text-white/70">
                    Latest gift cards issued ({analytics.issuanceData.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analytics.issuanceData.slice(0, 5).map((card) => (
                      <div key={`${card.gan}-${card.orderId}`} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm font-medium">{card.gan?.substring(0, 16)}...</p>
                          <p className="text-white/60 text-xs">{card.recipientEmail || 'Anonymous'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(card.amount)}</p>
                          <p className="text-white/60 text-xs">{formatDate(card.issuedDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Redemptions */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Redemptions</CardTitle>
                  <CardDescription className="text-white/70">
                    Latest gift card redemptions ({analytics.redemptionData.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analytics.redemptionData.slice(0, 5).map((redemption, index) => (
                      <div key={`${redemption.gan}-${index}`} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm font-medium">{redemption.gan?.substring(0, 16)}...</p>
                          <p className="text-white/60 text-xs">{redemption.redeemedBy}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(redemption.amount)}</p>
                          <p className="text-white/60 text-xs">{formatDate(redemption.redeemedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}