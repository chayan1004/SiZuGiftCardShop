import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, Percent, Save, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PricingConfig {
  id: string;
  basePrice: number;
  merchantBuyRate: number; // % we charge merchants when they buy from us
  merchantSellRate: number; // % we pay merchants when they sell to us
  individualBuyRate: number; // % we charge individuals
  individualSellRate: number; // % we pay individuals
  lastUpdated: string;
  updatedBy: string;
  isActive: boolean;
}

interface LivePricing {
  squareBasePrice: number;
  merchantBuyPrice: number;
  merchantSellPrice: number;
  individualBuyPrice: number;
  individualSellPrice: number;
  profitMarginMerchant: number;
  profitMarginIndividual: number;
  lastRefresh: string;
}

export default function PricingManagement() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<Partial<PricingConfig>>({});

  // Fetch current pricing configuration
  const { data: pricingData, isLoading: configLoading, refetch: refetchConfig } = useQuery({
    queryKey: ['/api/admin/pricing-config'],
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Memoize config to prevent infinite re-renders
  const config: PricingConfig = useMemo(() => {
    return (pricingData as any)?.config ? {
      id: (pricingData as any).config.id || 'default',
      basePrice: parseFloat((pricingData as any).config.basePrice) || 100,
      merchantBuyRate: parseFloat((pricingData as any).config.merchantBuyRate) || 5,
      merchantSellRate: parseFloat((pricingData as any).config.merchantSellRate) || -3,
      individualBuyRate: parseFloat((pricingData as any).config.individualBuyRate) || 8,
      individualSellRate: parseFloat((pricingData as any).config.individualSellRate) || -5,
      lastUpdated: (pricingData as any).config.updatedAt || new Date().toISOString(),
      updatedBy: (pricingData as any).config.updatedBy || 'admin',
      isActive: (pricingData as any).config.isActive || true
    } : {
      id: 'default',
      basePrice: 100,
      merchantBuyRate: 5,
      merchantSellRate: -3,
      individualBuyRate: 8,
      individualSellRate: -5,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin',
      isActive: true
    };
  }, [pricingData]);

  // Fetch live calculated pricing
  const { data: livePricingData, isLoading: liveLoading, refetch: refetchLive } = useQuery({
    queryKey: ['/api/admin/live-pricing'],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  // Memoize live pricing to prevent infinite re-renders
  const livePricing: LivePricing = useMemo(() => {
    return (livePricingData as any)?.pricing ? {
      squareBasePrice: (livePricingData as any).pricing.squareBasePrice || config.basePrice,
      merchantBuyPrice: (livePricingData as any).pricing.merchantBuyPrice || config.basePrice * (1 + config.merchantBuyRate / 100),
      merchantSellPrice: (livePricingData as any).pricing.merchantSellPrice || config.basePrice * (1 + config.merchantSellRate / 100),
      individualBuyPrice: (livePricingData as any).pricing.individualBuyPrice || config.basePrice * (1 + config.individualBuyRate / 100),
      individualSellPrice: (livePricingData as any).pricing.individualSellPrice || config.basePrice * (1 + config.individualSellRate / 100),
      profitMarginMerchant: (livePricingData as any).pricing.profitMarginMerchant || (config.merchantBuyRate + Math.abs(config.merchantSellRate)),
      profitMarginIndividual: (livePricingData as any).pricing.profitMarginIndividual || (config.individualBuyRate + Math.abs(config.individualSellRate)),
      lastRefresh: (livePricingData as any).pricing.lastRefresh || new Date().toISOString()
    } : {
      squareBasePrice: config.basePrice,
      merchantBuyPrice: config.basePrice * (1 + config.merchantBuyRate / 100),
      merchantSellPrice: config.basePrice * (1 + config.merchantSellRate / 100),
      individualBuyPrice: config.basePrice * (1 + config.individualBuyRate / 100),
      individualSellPrice: config.basePrice * (1 + config.individualSellRate / 100),
      profitMarginMerchant: config.merchantBuyRate + Math.abs(config.merchantSellRate),
      profitMarginIndividual: config.individualBuyRate + Math.abs(config.individualSellRate),
      lastRefresh: new Date().toISOString()
    };
  }, [livePricingData, config]);

  // Update pricing configuration
  const updatePricingMutation = useMutation({
    mutationFn: async (newConfig: Partial<PricingConfig>) => {
      const response = await apiRequest('POST', '/api/admin/pricing-config', newConfig);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pricing Updated",
        description: "Live pricing rates have been updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/live-pricing'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update pricing configuration",
        variant: "destructive",
      });
    }
  });

  // Initialize local config when config loads
  useEffect(() => {
    if (config && !isEditing) {
      setLocalConfig(config);
    }
  }, [config, isEditing]);

  const handleSave = () => {
    updatePricingMutation.mutate(localConfig);
  };

  const handleRefresh = () => {
    refetchConfig();
    refetchLive();
    toast({
      title: "Data Refreshed",
      description: "Latest pricing data has been fetched from Square API",
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Square Gift Card Pricing Management</h2>
          <p className="text-gray-300">Control real-time buy/sell rates for merchants and individual users</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-white/30 text-gray-300 hover:bg-white/10"
            disabled={configLoading || liveLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(configLoading || liveLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border-white/30 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updatePricingMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePricingMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <Percent className="w-4 h-4 mr-2" />
              Edit Rates
            </Button>
          )}
        </div>
      </div>

      {/* Live Pricing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Square Base Price */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Square Base Price</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(livePricing.squareBasePrice)}</p>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs mt-1">
                  Real-time
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Profit Margin */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                <Building2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Merchant Margin</p>
                <p className="text-2xl font-bold text-white">{formatPercentage(livePricing.profitMarginMerchant)}</p>
                <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs mt-1">
                  Total Profit
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Profit Margin */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Individual Margin</p>
                <p className="text-2xl font-bold text-white">{formatPercentage(livePricing.profitMarginIndividual)}</p>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs mt-1">
                  Total Profit
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Update */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Last Refresh</p>
                <p className="text-sm font-medium text-white">
                  {new Date(livePricing.lastRefresh).toLocaleTimeString()}
                </p>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs mt-1">
                  Auto-refresh
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Rates */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Merchant Rates
            </CardTitle>
            <CardDescription className="text-gray-300">
              Configure rates for merchant transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buy Rate */}
            <div className="space-y-2">
              <Label className="text-gray-300">Buy Rate (We sell to merchants)</Label>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <Input
                  type="number"
                  step="0.1"
                  value={isEditing ? localConfig.merchantBuyRate : config.merchantBuyRate}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, merchantBuyRate: parseFloat(e.target.value) }))}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white"
                />
                <span className="text-gray-300">%</span>
              </div>
              <div className="text-sm text-gray-400">
                Price: {formatCurrency(livePricing.merchantBuyPrice)}
              </div>
            </div>

            {/* Sell Rate */}
            <div className="space-y-2">
              <Label className="text-gray-300">Sell Rate (We buy from merchants)</Label>
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <Input
                  type="number"
                  step="0.1"
                  value={isEditing ? localConfig.merchantSellRate : config.merchantSellRate}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, merchantSellRate: parseFloat(e.target.value) }))}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white"
                />
                <span className="text-gray-300">%</span>
              </div>
              <div className="text-sm text-gray-400">
                Price: {formatCurrency(livePricing.merchantSellPrice)}
              </div>
            </div>

            <Separator className="bg-white/20" />

            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-green-300 font-medium">Total Merchant Margin:</span>
                <span className="text-green-300 font-bold text-lg">
                  {formatPercentage(livePricing.profitMarginMerchant)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual User Rates */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Individual User Rates
            </CardTitle>
            <CardDescription className="text-gray-300">
              Configure rates for individual customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buy Rate */}
            <div className="space-y-2">
              <Label className="text-gray-300">Buy Rate (We sell to individuals)</Label>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <Input
                  type="number"
                  step="0.1"
                  value={isEditing ? localConfig.individualBuyRate : config.individualBuyRate}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, individualBuyRate: parseFloat(e.target.value) }))}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white"
                />
                <span className="text-gray-300">%</span>
              </div>
              <div className="text-sm text-gray-400">
                Price: {formatCurrency(livePricing.individualBuyPrice)}
              </div>
            </div>

            {/* Sell Rate */}
            <div className="space-y-2">
              <Label className="text-gray-300">Sell Rate (We buy from individuals)</Label>
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <Input
                  type="number"
                  step="0.1"
                  value={isEditing ? localConfig.individualSellRate : config.individualSellRate}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, individualSellRate: parseFloat(e.target.value) }))}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white"
                />
                <span className="text-gray-300">%</span>
              </div>
              <div className="text-sm text-gray-400">
                Price: {formatCurrency(livePricing.individualSellPrice)}
              </div>
            </div>

            <Separator className="bg-white/20" />

            <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-medium">Total Individual Margin:</span>
                <span className="text-purple-300 font-bold text-lg">
                  {formatPercentage(livePricing.profitMarginIndividual)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Explanation */}
      <Card className="bg-amber-500/10 border border-amber-400/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-amber-300 font-semibold">Rate Configuration Guide</h4>
              <div className="text-amber-200 text-sm space-y-1">
                <p><strong>Positive rates (+)</strong>: Markup above base price (profit on selling)</p>
                <p><strong>Negative rates (-)</strong>: Discount below base price (profit on buying)</p>
                <p><strong>Total Margin</strong>: Combined profit from both buy and sell transactions</p>
                <p><strong>Real-time pricing</strong>: Rates are applied to live Square base prices</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}