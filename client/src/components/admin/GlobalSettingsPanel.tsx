import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Save, AlertTriangle, Shield, Clock, Zap } from 'lucide-react';

interface GlobalSettingsData {
  settings: Record<string, string>;
}

interface SettingUpdate {
  key: string;
  value: string | boolean | number;
}

const SETTING_CONFIGS = {
  'fraud_detection_enabled': {
    label: 'Fraud Detection System',
    description: 'Enable real-time fraud detection and blocking',
    type: 'boolean',
    icon: Shield,
    category: 'Security'
  },
  'maintenance_mode': {
    label: 'Maintenance Mode',
    description: 'Put the entire system in maintenance mode',
    type: 'boolean',
    icon: AlertTriangle,
    category: 'System'
  },
  'api_rate_limit_per_minute': {
    label: 'API Rate Limit (per minute)',
    description: 'Maximum API requests per minute per IP',
    type: 'number',
    icon: Clock,
    category: 'Security'
  },
  'max_gift_card_amount': {
    label: 'Maximum Gift Card Amount',
    description: 'Maximum amount in cents for a single gift card',
    type: 'number',
    icon: Zap,
    category: 'Business'
  },
  'emergency_kill_switch': {
    label: 'Emergency Kill Switch',
    description: 'Disable all payment processing immediately',
    type: 'boolean',
    icon: AlertTriangle,
    category: 'Emergency'
  },
  'webhook_retry_attempts': {
    label: 'Webhook Retry Attempts',
    description: 'Number of times to retry failed webhooks',
    type: 'number',
    icon: Settings,
    category: 'System'
  }
};

export default function GlobalSettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'global-settings'],
    queryFn: () => apiRequest('GET', '/api/admin/settings/global')
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: SettingUpdate) => 
      apiRequest('PUT', `/api/admin/settings/global/${key}`, { value }),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-settings'] });
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[key];
        return newChanges;
      });
      toast({
        title: "Setting Updated",
        description: `Global setting "${key}" has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update global setting",
        variant: "destructive",
      });
    }
  });

  const handleValueChange = (key: string, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveChanges = async () => {
    for (const [key, value] of Object.entries(pendingChanges)) {
      await updateSettingMutation.mutateAsync({ key, value });
    }
  };

  const getCurrentValue = (key: string) => {
    if (pendingChanges[key] !== undefined) {
      return pendingChanges[key];
    }
    const currentValue = (settingsData as any)?.settings?.[key];
    const config = SETTING_CONFIGS[key as keyof typeof SETTING_CONFIGS];
    
    if (!currentValue) {
      return config?.type === 'boolean' ? false : config?.type === 'number' ? 0 : '';
    }
    
    if (config?.type === 'boolean') {
      return currentValue === 'true' || currentValue === true;
    }
    if (config?.type === 'number') {
      return parseInt(currentValue) || 0;
    }
    return currentValue;
  };

  const renderSettingInput = (key: string, config: any) => {
    const currentValue = getCurrentValue(key);
    const hasChanges = pendingChanges[key] !== undefined;

    if (config.type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={currentValue}
            onCheckedChange={(checked) => handleValueChange(key, checked)}
          />
          <Label className="text-sm">
            {currentValue ? 'Enabled' : 'Disabled'}
            {hasChanges && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Pending
              </Badge>
            )}
          </Label>
        </div>
      );
    }

    if (config.type === 'number') {
      return (
        <div className="space-y-2">
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(key, parseInt(e.target.value) || 0)}
            className="w-full"
          />
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              Pending: {pendingChanges[key]}
            </Badge>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Textarea
          value={currentValue}
          onChange={(e) => handleValueChange(key, e.target.value)}
          className="w-full"
          rows={3}
        />
        {hasChanges && (
          <Badge variant="secondary" className="text-xs">
            Modified
          </Badge>
        )}
      </div>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Security': 'bg-red-500/10 text-red-700 dark:text-red-300',
      'System': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      'Business': 'bg-green-500/10 text-green-700 dark:text-green-300',
      'Emergency': 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
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
            Global Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Configure system-wide settings and feature toggles
          </p>
        </div>
        
        {hasPendingChanges && (
          <Button 
            onClick={saveChanges} 
            disabled={updateSettingMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes ({Object.keys(pendingChanges).length})
          </Button>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(SETTING_CONFIGS).map(([key, config]) => {
          const IconComponent = config.icon;
          return (
            <Card 
              key={key} 
              className="relative overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {config.label}
                      </CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-1 ${getCategoryColor(config.category)}`}
                      >
                        {config.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                  {config.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {renderSettingInput(key, config)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Total Settings:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200">
              {Object.keys(SETTING_CONFIGS).length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Pending Changes:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200">
              {Object.keys(pendingChanges).length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Last Update:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}