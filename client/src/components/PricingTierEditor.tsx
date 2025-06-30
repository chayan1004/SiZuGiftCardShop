import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, DollarSign, Hash, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PricingTier {
  id: number;
  merchantId: number;
  minQuantity: number;
  pricePerUnit: number;
  createdAt: Date;
  updatedAt: Date;
}

interface NewPricingTier {
  minQuantity: number;
  pricePerUnit: number;
}

interface PricingTierEditorProps {
  merchantId: number;
  tiers: PricingTier[];
  isLoading: boolean;
}

export default function PricingTierEditor({ merchantId, tiers, isLoading }: PricingTierEditorProps) {
  const [editableTiers, setEditableTiers] = useState<(PricingTier | NewPricingTier)[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize editable tiers
  useEffect(() => {
    if (tiers.length > 0) {
      setEditableTiers([...tiers]);
    } else {
      // Default tiers for new merchants
      setEditableTiers([
        { minQuantity: 1, pricePerUnit: 2500 },
        { minQuantity: 10, pricePerUnit: 2300 },
        { minQuantity: 50, pricePerUnit: 2000 },
      ]);
    }
    setHasChanges(false);
  }, [tiers]);

  // Add new tier
  const addTier = () => {
    const lastTier = editableTiers[editableTiers.length - 1];
    const newMinQuantity = lastTier ? lastTier.minQuantity + 10 : 1;
    const newPricePerUnit = lastTier ? Math.max(1000, lastTier.pricePerUnit - 200) : 2500;

    setEditableTiers([
      ...editableTiers,
      { minQuantity: newMinQuantity, pricePerUnit: newPricePerUnit }
    ]);
    setHasChanges(true);
  };

  // Remove tier
  const removeTier = (index: number) => {
    if (editableTiers.length > 1) {
      const newTiers = editableTiers.filter((_, i) => i !== index);
      setEditableTiers(newTiers);
      setHasChanges(true);
    }
  };

  // Update tier
  const updateTier = (index: number, field: 'minQuantity' | 'pricePerUnit', value: number) => {
    const newTiers = [...editableTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setEditableTiers(newTiers);
    setHasChanges(true);
  };

  // Save pricing tiers mutation
  const saveTiersMutation = useMutation({
    mutationFn: async (tiersData: NewPricingTier[]) => {
      return apiRequest("POST", `/api/admin/merchant/${merchantId}/pricing-tiers`, {
        tiers: tiersData
      });
    },
    onSuccess: () => {
      toast({
        title: "Pricing Tiers Updated",
        description: "Merchant pricing tiers have been saved successfully.",
      });
      setHasChanges(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/merchant', merchantId, 'pricing-tiers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save pricing tiers.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validate tiers
    const sortedTiers = editableTiers
      .map(tier => ({
        minQuantity: tier.minQuantity,
        pricePerUnit: tier.pricePerUnit
      }))
      .sort((a, b) => a.minQuantity - b.minQuantity);

    // Check for overlapping quantities
    for (let i = 1; i < sortedTiers.length; i++) {
      if (sortedTiers[i].minQuantity <= sortedTiers[i - 1].minQuantity) {
        toast({
          title: "Invalid Pricing Tiers",
          description: "Minimum quantities must be unique and in ascending order.",
          variant: "destructive",
        });
        return;
      }
    }

    saveTiersMutation.mutate(sortedTiers);
  };

  // Calculate savings for display
  const calculateSavings = (pricePerUnit: number) => {
    const basePrice = 2500; // $25.00 base price
    const savings = ((basePrice - pricePerUnit) / basePrice) * 100;
    return Math.max(0, Math.round(savings));
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading pricing tiers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Pricing Tiers
          </h3>
          <p className="text-gray-400 text-sm">
            Configure volume-based pricing for this merchant
          </p>
        </div>
        <Button
          onClick={addTier}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {/* Pricing Tiers Table */}
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Volume Pricing Configuration</CardTitle>
          <CardDescription className="text-gray-300">
            Set different prices based on quantity purchased
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-white/5 rounded-lg">
              <div className="col-span-3 text-gray-300 text-sm font-medium">Min Quantity</div>
              <div className="col-span-3 text-gray-300 text-sm font-medium">Price per Card</div>
              <div className="col-span-3 text-gray-300 text-sm font-medium">Savings</div>
              <div className="col-span-2 text-gray-300 text-sm font-medium">Preview</div>
              <div className="col-span-1 text-gray-300 text-sm font-medium">Actions</div>
            </div>

            {/* Tier Rows */}
            {editableTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                {/* Min Quantity */}
                <div className="col-span-3">
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={tier.minQuantity}
                      onChange={(e) => updateTier(index, 'minQuantity', parseInt(e.target.value) || 0)}
                      className="pl-10 bg-white/5 border-white/20 text-white"
                      min="1"
                    />
                  </div>
                </div>

                {/* Price per Unit */}
                <div className="col-span-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={(tier.pricePerUnit / 100).toFixed(2)}
                      onChange={(e) => updateTier(index, 'pricePerUnit', Math.round(parseFloat(e.target.value) * 100) || 0)}
                      className="pl-10 bg-white/5 border-white/20 text-white"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Savings */}
                <div className="col-span-3 flex items-center">
                  {calculateSavings(tier.pricePerUnit) > 0 ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {calculateSavings(tier.pricePerUnit)}% OFF
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">Base Price</span>
                  )}
                </div>

                {/* Preview */}
                <div className="col-span-2 flex items-center">
                  <div className="text-white text-sm">
                    {tier.minQuantity}+ cards = ${(tier.pricePerUnit / 100).toFixed(2)} each
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center">
                  <Button
                    onClick={() => removeTier(index)}
                    variant="ghost"
                    size="sm"
                    disabled={editableTiers.length <= 1}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Save Button */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end mt-6 pt-6 border-t border-white/10"
            >
              <Button
                onClick={handleSave}
                disabled={saveTiersMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {saveTiersMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Pricing Tiers
                  </div>
                )}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Pricing Summary</CardTitle>
          <CardDescription className="text-gray-300">
            Overview of your pricing strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {editableTiers.length}
              </div>
              <div className="text-gray-300 text-sm">Price Tiers</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                ${Math.min(...editableTiers.map(t => t.pricePerUnit / 100)).toFixed(2)}
              </div>
              <div className="text-gray-300 text-sm">Lowest Price</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {Math.max(...editableTiers.map(t => calculateSavings(t.pricePerUnit)))}%
              </div>
              <div className="text-gray-300 text-sm">Max Savings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}