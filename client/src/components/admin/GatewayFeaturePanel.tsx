import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  Zap, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';

interface GatewayFeaturesData {
  features: Record<string, Record<string, boolean>>;
}

interface FeatureUpdate {
  gatewayName: string;
  feature: string;
  enabled: boolean;
}

const GATEWAY_CONFIGS = {
  'square': {
    name: 'Square Payment Gateway',
    description: 'Primary payment processor for gift cards and transactions',
    icon: CreditCard,
    color: 'from-blue-500 to-blue-600',
    features: {
      'payment_processing': {
        label: 'Payment Processing',
        description: 'Enable credit card payment processing',
        icon: DollarSign
      },
      'gift_card_creation': {
        label: 'Gift Card Creation',
        description: 'Allow new gift card generation',
        icon: Zap
      },
      'refunds': {
        label: 'Refund Processing',
        description: 'Enable refund transactions',
        icon: RefreshCw
      },
      'webhooks': {
        label: 'Webhook Events',
        description: 'Send real-time event notifications',
        icon: Shield
      }
    }
  },
  'fraud_detection': {
    name: 'Fraud Detection Gateway',
    description: 'Real-time fraud monitoring and prevention system',
    icon: Shield,
    color: 'from-red-500 to-red-600',
    features: {
      'ip_blocking': {
        label: 'IP Address Blocking',
        description: 'Block suspicious IP addresses',
        icon: Shield
      },
      'device_fingerprinting': {
        label: 'Device Fingerprinting',
        description: 'Track and analyze device patterns',
        icon: AlertTriangle
      },
      'rate_limiting': {
        label: 'Rate Limiting',
        description: 'Limit request frequency per IP',
        icon: RefreshCw
      },
      'real_time_alerts': {
        label: 'Real-time Alerts',
        description: 'Send immediate fraud notifications',
        icon: Zap
      }
    }
  },
  'webhook_system': {
    name: 'Webhook System Gateway',
    description: 'Merchant notification and integration system',
    icon: Zap,
    color: 'from-green-500 to-green-600',
    features: {
      'delivery': {
        label: 'Webhook Delivery',
        description: 'Send webhooks to merchant endpoints',
        icon: DollarSign
      },
      'retry_logic': {
        label: 'Automatic Retries',
        description: 'Retry failed webhook deliveries',
        icon: RefreshCw
      },
      'signature_verification': {
        label: 'Signature Verification',
        description: 'HMAC signature validation',
        icon: Shield
      },
      'failure_alerts': {
        label: 'Failure Alerts',
        description: 'Alert on webhook delivery failures',
        icon: AlertTriangle
      }
    }
  }
};

export default function GatewayFeaturePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  const { data: featuresData, isLoading } = useQuery({
    queryKey: ['admin', 'gateway-features'],
    queryFn: () => apiRequest('GET', '/api/admin/settings/gateway')
  });

  const updateFeatureMutation = useMutation({
    mutationFn: ({ gatewayName, feature, enabled }: FeatureUpdate) => 
      apiRequest('PUT', `/api/admin/settings/gateway/${gatewayName}/${feature}`, { enabled }),
    onSuccess: (_, { gatewayName, feature }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gateway-features'] });
      const changeKey = `${gatewayName}.${feature}`;
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[changeKey];
        return newChanges;
      });
      toast({
        title: "Feature Updated",
        description: `Gateway feature "${feature}" has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update gateway feature",
        variant: "destructive",
      });
    }
  });

  const handleFeatureToggle = (gatewayName: string, feature: string, enabled: boolean) => {
    const changeKey = `${gatewayName}.${feature}`;
    setPendingChanges(prev => ({ ...prev, [changeKey]: enabled }));
  };

  const saveChanges = async () => {
    for (const [changeKey, enabled] of Object.entries(pendingChanges)) {
      const [gatewayName, feature] = changeKey.split('.');
      await updateFeatureMutation.mutateAsync({ gatewayName, feature, enabled });
    }
  };

  const getCurrentFeatureState = (gatewayName: string, feature: string) => {
    const changeKey = `${gatewayName}.${feature}`;
    if (pendingChanges[changeKey] !== undefined) {
      return pendingChanges[changeKey];
    }
    return featuresData?.features?.[gatewayName]?.[feature] || false;
  };

  const getGatewayStatus = (gatewayName: string) => {
    const gateway = GATEWAY_CONFIGS[gatewayName];
    if (!gateway) return { enabled: 0, total: 0, percentage: 0 };
    
    const features = Object.keys(gateway.features);
    const enabledCount = features.filter(feature => 
      getCurrentFeatureState(gatewayName, feature)
    ).length;
    
    return {
      enabled: enabledCount,
      total: features.length,
      percentage: Math.round((enabledCount / features.length) * 100)
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingAnimation 
          size="lg" 
          message="Loading gateway features..." 
          className="scale-90"
        />
      </div>
    );
  }

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gateway Feature Toggles
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Control gateway-specific features and capabilities
          </p>
        </div>
        
        {hasPendingChanges && (
          <Button 
            onClick={saveChanges} 
            disabled={updateFeatureMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes ({Object.keys(pendingChanges).length})
          </Button>
        )}
      </div>

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(GATEWAY_CONFIGS).map(([gatewayName, gateway]) => {
          const IconComponent = gateway.icon;
          const status = getGatewayStatus(gatewayName);
          
          return (
            <Card 
              key={gatewayName}
              className="relative overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gateway.color} shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        {gateway.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300">
                        {gateway.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {status.percentage === 100 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : status.percentage === 0 ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <Badge 
                        variant={status.percentage === 100 ? "default" : status.percentage === 0 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {status.enabled}/{status.total} Active
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {status.percentage}% Enabled
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(gateway.features).map(([featureName, feature]) => {
                    const FeatureIcon = feature.icon;
                    const isEnabled = getCurrentFeatureState(gatewayName, featureName);
                    const changeKey = `${gatewayName}.${featureName}`;
                    const hasPendingChange = pendingChanges[changeKey] !== undefined;
                    
                    return (
                      <div 
                        key={featureName}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/50"
                      >
                        <div className="flex items-center space-x-3">
                          <FeatureIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <div>
                            <Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                              {feature.label}
                              {hasPendingChange && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Pending
                                </Badge>
                              )}
                            </Label>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleFeatureToggle(gatewayName, featureName, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Status Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(GATEWAY_CONFIGS).map(([gatewayName, gateway]) => {
              const status = getGatewayStatus(gatewayName);
              return (
                <div key={gatewayName} className="text-center">
                  <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {status.percentage}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">
                    {gateway.name}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">
                    {status.enabled} of {status.total} features
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">Pending Changes:</span>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                {Object.keys(pendingChanges).length}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-blue-700 dark:text-blue-300">Last Update:</span>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}