import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  CreditCard, 
  Shield, 
  Eye,
  Save,
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Crown,
  Zap,
  Gift,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Checkout configuration schema
const checkoutConfigSchema = z.object({
  // Branding
  brandName: z.string().min(2, "Brand name is required"),
  brandLogo: z.string().optional(),
  tagline: z.string().optional(),
  
  // Colors & Theme
  primaryColor: z.string().default("#7c3aed"),
  secondaryColor: z.string().default("#ec4899"),
  accentColor: z.string().default("#3b82f6"),
  backgroundColor: z.string().default("#0f0a19"),
  textColor: z.string().default("#ffffff"),
  
  // Layout Options
  layout: z.enum(['single-page', 'multi-step', 'sidebar']).default('multi-step'),
  theme: z.enum(['dark', 'light', 'auto']).default('dark'),
  animation: z.enum(['minimal', 'standard', 'enhanced']).default('enhanced'),
  
  // Payment Options
  acceptedPaymentMethods: z.object({
    creditCard: z.boolean().default(true),
    debitCard: z.boolean().default(true),
    applePay: z.boolean().default(true),
    googlePay: z.boolean().default(true),
    paypal: z.boolean().default(false),
    bankTransfer: z.boolean().default(false)
  }),
  
  // Security Features
  requireCVV: z.boolean().default(true),
  requireBillingAddress: z.boolean().default(true),
  enableSavePayment: z.boolean().default(true),
  enableGuestCheckout: z.boolean().default(true),
  
  // Content Customization
  welcomeMessage: z.string().optional(),
  footerText: z.string().optional(),
  privacyPolicyUrl: z.string().optional(),
  termsOfServiceUrl: z.string().optional(),
  
  // Advanced Settings
  sessionTimeout: z.number().default(30),
  enableAnalytics: z.boolean().default(true),
  enableA11y: z.boolean().default(true),
  enablePWA: z.boolean().default(false)
});

type CheckoutConfigData = z.infer<typeof checkoutConfigSchema>;

// Preview component for different device sizes
const CheckoutPreview = ({ config, deviceType }: { config: CheckoutConfigData; deviceType: 'desktop' | 'tablet' | 'mobile' }) => {
  const deviceClasses = {
    desktop: 'w-full max-w-4xl mx-auto',
    tablet: 'w-full max-w-2xl mx-auto',
    mobile: 'w-full max-w-sm mx-auto'
  };

  return (
    <motion.div
      layout
      className={`${deviceClasses[deviceType]} transition-all duration-300`}
    >
      <div 
        className="rounded-lg overflow-hidden shadow-2xl border border-white/10"
        style={{ backgroundColor: config.backgroundColor }}
      >
        {/* Preview Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: config.textColor }}>
                {config.brandName}
              </h3>
              {config.tagline && (
                <p className="text-sm opacity-80" style={{ color: config.textColor }}>
                  {config.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Preview Content */}
        <div className="p-6">
          {config.welcomeMessage && (
            <div className="mb-6 p-4 rounded-lg bg-white/5">
              <p style={{ color: config.textColor }} className="text-sm">
                {config.welcomeMessage}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Preview */}
            <div className="space-y-4">
              <div>
                <label className="text-sm" style={{ color: config.textColor }}>Email Address</label>
                <div 
                  className="mt-1 p-3 rounded border bg-white/10 border-white/20"
                  style={{ borderColor: config.primaryColor + '40' }}
                >
                  <span className="text-sm opacity-60" style={{ color: config.textColor }}>
                    example@email.com
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm" style={{ color: config.textColor }}>Card Number</label>
                <div 
                  className="mt-1 p-3 rounded border bg-white/10 border-white/20"
                  style={{ borderColor: config.primaryColor + '40' }}
                >
                  <span className="text-sm font-mono opacity-60" style={{ color: config.textColor }}>
                    •••• •••• •••• 1234
                  </span>
                </div>
              </div>
              
              <button
                className="w-full py-3 rounded-lg font-semibold text-white transition-colors"
                style={{ 
                  background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` 
                }}
              >
                Complete Payment
              </button>
            </div>
            
            {/* Order Summary Preview */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold mb-4" style={{ color: config.textColor }}>
                Order Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: config.textColor }}>Gift Card</span>
                  <span style={{ color: config.textColor }}>$50.00</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: config.textColor }}>Processing Fee</span>
                  <span style={{ color: config.textColor }}>$2.50</span>
                </div>
                <hr className="border-white/20" />
                <div className="flex justify-between font-semibold">
                  <span style={{ color: config.textColor }}>Total</span>
                  <span style={{ color: config.primaryColor }}>$52.50</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Methods Preview */}
          <div className="mt-6">
            <h5 className="text-sm font-medium mb-3" style={{ color: config.textColor }}>
              Accepted Payment Methods
            </h5>
            <div className="flex flex-wrap gap-2">
              {config.acceptedPaymentMethods.creditCard && (
                <Badge variant="outline" className="border-white/20 text-white">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Credit Card
                </Badge>
              )}
              {config.acceptedPaymentMethods.applePay && (
                <Badge variant="outline" className="border-white/20 text-white">
                  Apple Pay
                </Badge>
              )}
              {config.acceptedPaymentMethods.googlePay && (
                <Badge variant="outline" className="border-white/20 text-white">
                  Google Pay
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Preview Footer */}
        {config.footerText && (
          <div className="p-4 border-t border-white/10 text-center">
            <p className="text-xs opacity-60" style={{ color: config.textColor }}>
              {config.footerText}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function AdminCheckoutConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  // Form setup
  const form = useForm<CheckoutConfigData>({
    resolver: zodResolver(checkoutConfigSchema),
    defaultValues: {
      brandName: "SiZu GiftCard",
      primaryColor: "#7c3aed",
      secondaryColor: "#ec4899",
      accentColor: "#3b82f6",
      backgroundColor: "#0f0a19",
      textColor: "#ffffff",
      layout: "multi-step",
      theme: "dark",
      animation: "enhanced",
      acceptedPaymentMethods: {
        creditCard: true,
        debitCard: true,
        applePay: true,
        googlePay: true,
        paypal: false,
        bankTransfer: false
      },
      requireCVV: true,
      requireBillingAddress: true,
      enableSavePayment: true,
      enableGuestCheckout: true,
      sessionTimeout: 30,
      enableAnalytics: true,
      enableA11y: true,
      enablePWA: false
    }
  });

  // Fetch current configuration
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['/api/admin/checkout-config'],
    enabled: true
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: CheckoutConfigData) => {
      const response = await fetch('/api/admin/checkout-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Checkout page configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/checkout-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Reset to defaults
  const resetToDefaults = () => {
    form.reset();
    toast({
      title: "Reset to Defaults",
      description: "Configuration has been reset to default values.",
    });
  };

  const onSubmit = (data: CheckoutConfigData) => {
    saveConfigMutation.mutate(data);
  };

  // Watch form values for live preview
  const watchedValues = form.watch();

  useEffect(() => {
    if (currentConfig) {
      form.reset(currentConfig);
    }
  }, [currentConfig, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            Checkout Configuration
          </h2>
          <p className="text-gray-400 mt-1">
            Customize your branded checkout experience
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveConfigMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Configuration Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="branding" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/10">
                <TabsTrigger value="branding" className="text-white data-[state=active]:bg-purple-500">
                  Branding
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-white data-[state=active]:bg-purple-500">
                  Layout
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-white data-[state=active]:bg-purple-500">
                  Payment
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-white data-[state=active]:bg-purple-500">
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-4">
                <div>
                  <Label className="text-white">Brand Name</Label>
                  <Input
                    {...form.register('brandName')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Your Brand Name"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Tagline (Optional)</Label>
                  <Input
                    {...form.register('tagline')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Secure checkout experience"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        {...form.register('primaryColor')}
                        type="color"
                        className="w-12 h-10 bg-white/10 border-white/20"
                      />
                      <Input
                        {...form.register('primaryColor')}
                        className="flex-1 bg-white/10 border-white/20 text-white font-mono"
                        placeholder="#7c3aed"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-white">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        {...form.register('secondaryColor')}
                        type="color"
                        className="w-12 h-10 bg-white/10 border-white/20"
                      />
                      <Input
                        {...form.register('secondaryColor')}
                        className="flex-1 bg-white/10 border-white/20 text-white font-mono"
                        placeholder="#ec4899"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-white">Welcome Message (Optional)</Label>
                  <Textarea
                    {...form.register('welcomeMessage')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Welcome to our secure checkout..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-4">
                <div>
                  <Label className="text-white">Layout Style</Label>
                  <Select 
                    value={form.watch('layout')} 
                    onValueChange={(value) => form.setValue('layout', value as any)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-page">Single Page</SelectItem>
                      <SelectItem value="multi-step">Multi-Step</SelectItem>
                      <SelectItem value="sidebar">Sidebar Layout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-white">Theme</Label>
                  <Select 
                    value={form.watch('theme')} 
                    onValueChange={(value) => form.setValue('theme', value as any)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-white">Animation Level</Label>
                  <Select 
                    value={form.watch('animation')} 
                    onValueChange={(value) => form.setValue('animation', value as any)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-6">
                <div>
                  <Label className="text-white mb-4 block">Accepted Payment Methods</Label>
                  <div className="space-y-3">
                    {Object.entries(form.watch('acceptedPaymentMethods') || {}).map(([method, enabled]) => (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-white capitalize">
                          {method.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            form.setValue(`acceptedPaymentMethods.${method as any}`, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Require CVV</Label>
                    <Switch
                      {...form.register('requireCVV')}
                      checked={form.watch('requireCVV')}
                      onCheckedChange={(checked) => form.setValue('requireCVV', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Require Billing Address</Label>
                    <Switch
                      checked={form.watch('requireBillingAddress')}
                      onCheckedChange={(checked) => form.setValue('requireBillingAddress', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Save Payment</Label>
                    <Switch
                      checked={form.watch('enableSavePayment')}
                      onCheckedChange={(checked) => form.setValue('enableSavePayment', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Guest Checkout</Label>
                    <Switch
                      checked={form.watch('enableGuestCheckout')}
                      onCheckedChange={(checked) => form.setValue('enableGuestCheckout', checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    {...form.register('sessionTimeout', { valueAsNumber: true })}
                    type="number"
                    min="5"
                    max="120"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Footer Text (Optional)</Label>
                  <Textarea
                    {...form.register('footerText')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Powered by SiZu GiftCard"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Analytics</Label>
                    <Switch
                      checked={form.watch('enableAnalytics')}
                      onCheckedChange={(checked) => form.setValue('enableAnalytics', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Accessibility</Label>
                    <Switch
                      checked={form.watch('enableA11y')}
                      onCheckedChange={(checked) => form.setValue('enableA11y', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable PWA</Label>
                    <Switch
                      checked={form.watch('enablePWA')}
                      onCheckedChange={(checked) => form.setValue('enablePWA', checked)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <AnimatePresence>
          {isPreviewMode && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="space-y-4"
            >
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-400" />
                      Live Preview
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                        className="p-2"
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('tablet')}
                        className="p-2"
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                        className="p-2"
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border border-white/10 rounded-lg p-4 bg-gray-900/50">
                    <CheckoutPreview config={watchedValues} deviceType={previewDevice} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}