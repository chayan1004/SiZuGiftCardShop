import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Eye, Save, Palette } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CardDesign {
  designUrl: string | null;
  logoUrl: string | null;
  themeColor: string;
  customMessage: string | null;
  isActive: boolean;
}

interface ValidationConfig {
  maxSize: number;
  maxSizeMB: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

export default function MerchantCardDesign() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [customMessage, setCustomMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Fetch validation config
  const { data: validationData } = useQuery({
    queryKey: ['/api/merchant/card-design/validation'],
    queryFn: () => apiRequest('GET', '/api/merchant/card-design/validation')
  });

  const validation = (validationData as any)?.validation as ValidationConfig;

  // Fetch existing card design
  const { data: designData, isLoading: isLoadingDesign } = useQuery({
    queryKey: ['/api/merchant/card-design'],
    queryFn: () => apiRequest('GET', '/api/merchant/card-design')
  });

  const existingDesign = (designData as any)?.design as CardDesign;

  // Load existing design data
  useEffect(() => {
    if (existingDesign) {
      setThemeColor(existingDesign.themeColor || '#6366f1');
      setCustomMessage(existingDesign.customMessage || '');
      setDesignPreview(existingDesign.designUrl);
      setLogoPreview(existingDesign.logoUrl);
    }
  }, [existingDesign]);

  // Save card design mutation
  const saveDesignMutation = useMutation({
    mutationFn: async (designData: {
      designImageBase64?: string;
      logoImageBase64?: string;
      themeColor: string;
      customMessage: string;
    }) => {
      return apiRequest('POST', '/api/merchant/card-design', designData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Card design saved successfully!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/card-design'] });
      setDesignFile(null);
      setLogoFile(null);
      setUploadProgress(null);
    },
    onError: (error: any) => {
      console.error('Error saving card design:', error);
      toast({
        title: 'Error',
        description: error?.error || 'Failed to save card design',
        variant: 'destructive'
      });
      setUploadProgress(null);
    }
  });

  const handleFileUpload = (file: File, type: 'design' | 'logo') => {
    if (!validation) {
      toast({
        title: 'Error',
        description: 'Upload configuration not loaded',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    if (file.size > validation.maxSize) {
      toast({
        title: 'File Too Large',
        description: `File size must be less than ${validation.maxSizeMB}MB`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validation.allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Invalid File Type',
        description: `Allowed types: ${validation.allowedExtensions.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'design') {
        setDesignFile(file);
        setDesignPreview(result);
      } else {
        setLogoFile(file);
        setLogoPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveDesign = async () => {
    try {
      setUploadProgress('Preparing files...');
      
      const designData: any = {
        themeColor,
        customMessage: customMessage.trim() || undefined
      };

      if (designFile) {
        setUploadProgress('Uploading design image...');
        designData.designImageBase64 = await convertFileToBase64(designFile);
      }

      if (logoFile) {
        setUploadProgress('Uploading logo image...');
        designData.logoImageBase64 = await convertFileToBase64(logoFile);
      }

      setUploadProgress('Saving design...');
      await saveDesignMutation.mutateAsync(designData);
    } catch (error) {
      console.error('Error preparing design data:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare design data',
        variant: 'destructive'
      });
      setUploadProgress(null);
    }
  };

  const hasChanges = designFile || logoFile || 
    themeColor !== (existingDesign?.themeColor || '#6366f1') ||
    customMessage !== (existingDesign?.customMessage || '');

  if (isLoadingDesign) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Card Design</h2>
        <p className="text-gray-300">Customize your gift card appearance with your branding</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          {/* Background Design Upload */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Background Design
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload a background image for your gift cards
                {validation && ` (Max ${validation.maxSizeMB}MB)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                {designPreview ? (
                  <div className="space-y-3">
                    <img 
                      src={designPreview} 
                      alt="Design preview" 
                      className="mx-auto max-h-32 rounded border border-gray-600"
                    />
                    <p className="text-sm text-gray-400">
                      {designFile ? `New: ${designFile.name}` : 'Current design'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-500 mx-auto" />
                    <p className="text-gray-400">No design uploaded</p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'design');
                  }}
                  className="mt-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Logo
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload your business logo
                {validation && ` (Max ${validation.maxSizeMB}MB)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                {logoPreview ? (
                  <div className="space-y-3">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="mx-auto max-h-24 rounded border border-gray-600"
                    />
                    <p className="text-sm text-gray-400">
                      {logoFile ? `New: ${logoFile.name}` : 'Current logo'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-500 mx-auto" />
                    <p className="text-gray-400">No logo uploaded</p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                  className="mt-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme & Message */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Message
              </CardTitle>
              <CardDescription className="text-gray-400">
                Set your brand colors and custom message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="themeColor" className="text-gray-300">Theme Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="themeColor"
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                  />
                  <Input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customMessage" className="text-gray-300">Custom Message</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to your gift cards..."
                  maxLength={200}
                  className="bg-gray-700 border-gray-600 text-white resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  {customMessage.length}/200 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription className="text-gray-400">
                See how your gift card will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/2] relative rounded-lg overflow-hidden border border-gray-600">
                {/* Background */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: themeColor,
                    backgroundImage: designPreview ? `url(${designPreview})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Overlay for text readability */}
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Logo */}
                {logoPreview && (
                  <div className="absolute top-4 left-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="h-8 w-auto max-w-24 object-contain"
                    />
                  </div>
                )}

                {/* Gift Card Content */}
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center">
                  <div className="bg-white/90 rounded-lg p-4 shadow-lg max-w-xs">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">Gift Card</h3>
                    <div className="text-3xl font-bold text-gray-800 mb-2" style={{ color: themeColor }}>
                      $50.00
                    </div>
                    {customMessage && (
                      <p className="text-sm text-gray-600 italic">
                        "{customMessage}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Brand Name */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-black/50 px-3 py-1 rounded text-white text-sm">
                    Your Business
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Help */}
          {validation && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400 text-sm">Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-300 space-y-2">
                <p>• Maximum file size: {validation.maxSizeMB}MB</p>
                <p>• Supported formats: {validation.allowedExtensions.join(', ')}</p>
                <p>• Recommended aspect ratio: 3:2 for backgrounds</p>
                <p>• Logo should be square or rectangular with transparent background</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={handleSaveDesign}
          disabled={!hasChanges || saveDesignMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          {saveDesignMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {uploadProgress || 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Design
            </>
          )}
        </Button>
      </div>
    </div>
  );
}