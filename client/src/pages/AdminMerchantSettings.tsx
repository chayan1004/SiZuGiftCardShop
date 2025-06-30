import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Settings, Users, Palette, DollarSign, Save, 
  Search, Edit, Trash2, Plus, Upload, Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MerchantBrandingForm from "@/components/MerchantBrandingForm";
import PricingTierEditor from "@/components/PricingTierEditor";

interface Merchant {
  id: number;
  businessName: string;
  email: string;
  squareLocationId: string;
  emailVerified: boolean;
  createdAt: Date;
}

interface MerchantBranding {
  id: number;
  merchantId: number;
  logoUrl: string | null;
  themeColor: string;
  tagline: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PricingTier {
  id: number;
  merchantId: number;
  minQuantity: number;
  pricePerUnit: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminMerchantSettings() {
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all merchants
  const { data: merchantsResponse, isLoading: merchantsLoading } = useQuery({
    queryKey: ['/api/admin/merchants'],
  });

  const merchants: Merchant[] = merchantsResponse?.merchants || [];

  // Filter merchants based on search term
  const filteredMerchants = merchants.filter(merchant =>
    merchant.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch selected merchant's branding
  const { data: brandingResponse, isLoading: brandingLoading } = useQuery({
    queryKey: ['/api/admin/merchant', selectedMerchantId, 'branding'],
    enabled: !!selectedMerchantId,
  });

  // Fetch selected merchant's pricing tiers
  const { data: pricingResponse, isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/admin/merchant', selectedMerchantId, 'pricing-tiers'],
    enabled: !!selectedMerchantId,
  });

  const selectedMerchant = merchants.find(m => m.id === selectedMerchantId);
  const branding: MerchantBranding | null = brandingResponse?.branding || null;
  const pricingTiers: PricingTier[] = pricingResponse?.tiers || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Merchant Settings</h1>
              <p className="text-gray-300">Manage merchant branding and pricing tiers</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Merchant Selection Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4"
          >
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Merchant
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Choose a merchant to manage their settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search merchants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Merchant List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {merchantsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-400 text-sm">Loading merchants...</p>
                    </div>
                  ) : filteredMerchants.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No merchants found</p>
                  ) : (
                    filteredMerchants.map((merchant) => (
                      <motion.div
                        key={merchant.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedMerchantId === merchant.id
                            ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/25'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedMerchantId(merchant.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium text-sm">{merchant.businessName}</h3>
                            <p className="text-gray-400 text-xs">{merchant.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {merchant.emailVerified && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8"
          >
            {selectedMerchant ? (
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Settings for {selectedMerchant.businessName}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Configure branding and pricing for this merchant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="branding" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5">
                      <TabsTrigger value="branding" className="data-[state=active]:bg-purple-500/20">
                        <Palette className="w-4 h-4 mr-2" />
                        Branding
                      </TabsTrigger>
                      <TabsTrigger value="pricing" className="data-[state=active]:bg-purple-500/20">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Pricing Tiers
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="branding" className="mt-6">
                      <MerchantBrandingForm
                        merchantId={selectedMerchantId}
                        branding={branding}
                        isLoading={brandingLoading}
                      />
                    </TabsContent>

                    <TabsContent value="pricing" className="mt-6">
                      <PricingTierEditor
                        merchantId={selectedMerchantId}
                        tiers={pricingTiers}
                        isLoading={pricingLoading}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Merchant</h3>
                  <p className="text-gray-400 text-center">
                    Choose a merchant from the sidebar to configure their branding and pricing settings
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}