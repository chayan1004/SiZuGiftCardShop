import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Save, Upload, Eye, Palette, Type, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MerchantBranding {
  id: number;
  merchantId: number;
  logoUrl: string | null;
  themeColor: string;
  tagline: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MerchantBrandingFormProps {
  merchantId: number;
  branding: MerchantBranding | null;
  isLoading: boolean;
}

export default function MerchantBrandingForm({ merchantId, branding, isLoading }: MerchantBrandingFormProps) {
  const [logoUrl, setLogoUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#6366f1");
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with existing branding data
  useEffect(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl || "");
      setThemeColor(branding.themeColor || "#6366f1");
      setTagline(branding.tagline || "");
      setLogoPreview(branding.logoUrl);
    } else {
      // Reset form for new merchant
      setLogoUrl("");
      setThemeColor("#6366f1");
      setTagline("");
      setLogoPreview(null);
    }
  }, [branding]);

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setLogoPreview(base64);
        setLogoUrl(base64); // Store as base64 for now
      };
      reader.readAsDataURL(file);
    }
  };

  // Save branding mutation
  const saveBrandingMutation = useMutation({
    mutationFn: async (brandingData: any) => {
      const url = branding 
        ? `/api/admin/merchant/${merchantId}/branding`
        : `/api/admin/merchant/${merchantId}/branding`;
      
      return apiRequest(branding ? "PUT" : "POST", url, brandingData);
    },
    onSuccess: () => {
      toast({
        title: "Branding Updated",
        description: "Merchant branding has been saved successfully.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/merchant', merchantId, 'branding'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save branding settings.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const brandingData = {
      logoUrl: logoUrl || null,
      themeColor,
      tagline,
    };

    saveBrandingMutation.mutate(brandingData);
  };

  // Preview component
  const BrandingPreview = () => (
    <Card className="bg-white/5 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Live Preview
        </CardTitle>
        <CardDescription className="text-gray-300">
          See how the branding will look
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="p-6 rounded-lg border-2 border-dashed"
          style={{ 
            borderColor: themeColor + '50',
            backgroundColor: themeColor + '10'
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Logo Preview" 
                className="w-12 h-12 object-contain rounded-lg bg-white/10 p-2"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 
                className="font-semibold text-lg"
                style={{ color: themeColor }}
              >
                Gift Card Store
              </h3>
              <p className="text-gray-300 text-sm">
                {tagline || "Your custom tagline here"}
              </p>
            </div>
          </div>
          
          {/* Sample gift card preview */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: themeColor + '30',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">$25 Gift Card</span>
              <button 
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: themeColor }}
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading branding settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Branding Settings
            </CardTitle>
            <CardDescription className="text-gray-300">
              Configure the merchant's visual identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Image className="w-4 h-4" />
                Logo
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="bg-white/5 border-white/20 text-white file:bg-purple-500 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                />
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="w-10 h-10 object-contain rounded border border-white/20"
                  />
                )}
              </div>
              <p className="text-gray-400 text-xs">
                Upload a logo image (PNG, JPG, SVG recommended)
              </p>
            </div>

            {/* Logo URL (Alternative) */}
            <div className="space-y-2">
              <Label className="text-white">Logo URL (Alternative)</Label>
              <Input
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setLogoPreview(e.target.value);
                }}
                placeholder="https://example.com/logo.png"
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Theme Color */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Theme Color
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-16 h-10 rounded-lg border-white/20 bg-transparent"
                />
                <Input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#6366f1"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <p className="text-gray-400 text-xs">
                This color will be used for buttons, highlights, and accents
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Type className="w-4 h-4" />
                Tagline
              </Label>
              <Textarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Enter a memorable tagline for this merchant"
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-gray-400 text-xs">
                {tagline.length}/200 characters
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saveBrandingMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {saveBrandingMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Branding
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <BrandingPreview />
      </div>
    </div>
  );
}