import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Settings, Key, Copy, Trash2, Plus, Eye, EyeOff, Shield } from 'lucide-react';
import GDPRConsentManager from '@/components/merchant/GDPRConsentManager';

interface MerchantSettings {
  merchantId: string;
  businessName: string;
  email: string;
  themeColor?: string;
  webhookUrl?: string;
  webhookEnabled: boolean;
  supportEmail?: string;
  brandName?: string;
  isActive: boolean;
  emailVerified: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
  revoked: boolean;
}

interface NewApiKey extends ApiKey {
  fullKey: string;
}

export default function MerchantSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<MerchantSettings>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewApiKey | null>(null);
  const [showFullKey, setShowFullKey] = useState(false);

  // Fetch merchant settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/merchant/settings'],
    queryFn: () => apiRequest('GET', '/api/merchant/settings').then(res => res.json())
  });

  // Fetch API keys
  const { data: apiKeysData, isLoading: keysLoading } = useQuery({
    queryKey: ['/api/merchant/api-keys'],
    queryFn: () => apiRequest('GET', '/api/merchant/api-keys').then(res => res.json())
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<MerchantSettings>) => 
      apiRequest('PUT', '/api/merchant/settings', data),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your merchant settings have been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/settings'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: (name: string) => 
      apiRequest('POST', '/api/merchant/api-keys', { name }).then(res => res.json()),
    onSuccess: (data) => {
      setNewlyCreatedKey(data.apiKey);
      setNewKeyName('');
      toast({
        title: "API Key Created",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/api-keys'] });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create API key. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: (keyId: string) => 
      apiRequest('DELETE', `/api/merchant/api-keys/${keyId}`),
    onSuccess: () => {
      toast({
        title: "API Key Revoked",
        description: "The API key has been revoked successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/api-keys'] });
      setShowDeleteDialog(null);
    },
    onError: () => {
      toast({
        title: "Revoke Failed",
        description: "Failed to revoke API key. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settingsData?.settings) {
      setFormData(settingsData.settings);
    }
  }, [settingsData]);

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the API key.",
        variant: "destructive"
      });
      return;
    }
    createKeyMutation.mutate(newKeyName.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard."
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (settingsLoading || keysLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-64"></div>
            <div className="h-64 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const settings = settingsData?.settings;
  const apiKeys = apiKeysData?.apiKeys || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Merchant Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white/20 text-white">
              Profile Settings
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-white/20 text-white">
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Business Profile</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your business information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Business Name</Label>
                    <Input
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Brand Name</Label>
                    <Input
                      value={formData.brandName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Email</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Support Email</Label>
                    <Input
                      type="email"
                      value={formData.supportEmail || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Enter support email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Theme Color</Label>
                    <Input
                      type="color"
                      value={formData.themeColor || '#8b5cf6'}
                      onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                      className="bg-white/10 border-white/20 h-10 w-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Webhook URL</Label>
                    <Input
                      type="url"
                      value={formData.webhookUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {updateSettingsMutation.isPending ? 'Updating...' : 'Update Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys">
            <div className="space-y-6">
              {/* Create New API Key */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New API Key
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Generate a new API key for accessing merchant endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Enter API key name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Button 
                      onClick={handleCreateKey}
                      disabled={createKeyMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Newly Created Key Alert */}
              {newlyCreatedKey && (
                <Card className="bg-green-900/20 border-green-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-green-400">New API Key Created</CardTitle>
                    <CardDescription className="text-green-300">
                      Save this key securely - it won't be shown again
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-green-400">API Key</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showFullKey ? "text" : "password"}
                          value={newlyCreatedKey.fullKey}
                          readOnly
                          className="bg-green-900/20 border-green-500/30 text-green-300 font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFullKey(!showFullKey)}
                          className="border-green-500/30 text-green-400 hover:bg-green-900/20"
                        >
                          {showFullKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(newlyCreatedKey.fullKey)}
                          className="border-green-500/30 text-green-400 hover:bg-green-900/20"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setNewlyCreatedKey(null)}
                      className="border-green-500/30 text-green-400 hover:bg-green-900/20"
                    >
                      I've saved this key
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Existing API Keys */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Your API Keys
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage your existing API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No API keys found. Create your first key above.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((key: ApiKey) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{key.name}</span>
                              {key.revoked && <Badge variant="destructive">Revoked</Badge>}
                            </div>
                            <div className="text-sm text-gray-400 font-mono">{key.keyPrefix}...</div>
                            <div className="text-xs text-gray-500">
                              Created: {formatDate(key.createdAt)}
                              {key.lastUsedAt && ` • Last used: ${formatDate(key.lastUsedAt)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(key.keyPrefix + '...')}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {!key.revoked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteDialog(key.id)}
                                className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to revoke this API key? This action cannot be undone and will immediately invalidate the key.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteDialog && revokeKeyMutation.mutate(showDeleteDialog)}
                className="bg-red-600 hover:bg-red-700"
              >
                Revoke Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}