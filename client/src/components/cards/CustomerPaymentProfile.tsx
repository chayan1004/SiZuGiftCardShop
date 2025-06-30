import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Plus, Trash2, Shield, CheckCircle } from 'lucide-react';

interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  squareCustomerId: string;
  createdAt: string;
}

interface SavedCard {
  id: string;
  squareCardId: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardType: string;
  cardNickname?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface CustomerPaymentProfileProps {
  customerEmail?: string;
  onProfileCreate?: (profile: CustomerProfile) => void;
  onCardSave?: (card: SavedCard) => void;
}

export default function CustomerPaymentProfile({ 
  customerEmail, 
  onProfileCreate,
  onCardSave 
}: CustomerPaymentProfileProps) {
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    email: customerEmail || '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['customer-profile', customerEmail],
    queryFn: async () => {
      if (!customerEmail) return null;
      
      const response = await apiRequest('POST', '/api/customers/profile', {
        email: customerEmail
      });
      return response.json();
    },
    enabled: !!customerEmail
  });

  // Fetch saved cards
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ['customer-cards', customerProfile?.squareCustomerId],
    queryFn: async () => {
      if (!customerProfile?.squareCustomerId) return { cards: [] };
      
      const response = await apiRequest('GET', `/api/customers/${customerProfile.squareCustomerId}/cards`);
      return response.json();
    },
    enabled: !!customerProfile?.squareCustomerId
  });

  // Create customer profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await apiRequest('POST', '/api/customers/profile', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCustomerProfile(data.customer);
        setIsCreatingProfile(false);
        onProfileCreate?.(data.customer);
        toast({
          title: "Profile Created",
          description: "Customer profile created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      } else {
        throw new Error(data.message);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Profile Creation Failed",
        description: error.message || "Failed to create customer profile",
        variant: "destructive",
      });
    }
  });

  // Remove card mutation
  const removeCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!customerProfile?.squareCustomerId) throw new Error('No customer profile');
      
      const response = await apiRequest('DELETE', `/api/customers/${customerProfile.squareCustomerId}/cards/${cardId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Card Removed",
          description: "Payment method removed successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['customer-cards'] });
      } else {
        throw new Error(data.message);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Card Removal Failed",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (profileData?.success && profileData.customer) {
      setCustomerProfile(profileData.customer);
    }
  }, [profileData]);

  const handleCreateProfile = () => {
    if (!profileForm.email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    createProfileMutation.mutate(profileForm);
  };

  const handleRemoveCard = (cardId: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      removeCardMutation.mutate(cardId);
    }
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const getCardBrandColor = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'bg-blue-500';
      case 'mastercard': return 'bg-red-500';
      case 'american_express': return 'bg-green-500';
      case 'discover': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Customer Payment Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!customerProfile && !isCreatingProfile && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Payment Profile</h3>
              <p className="text-muted-foreground mb-4">
                Save your payment information for faster checkout
              </p>
              <Button onClick={() => setIsCreatingProfile(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </div>
          )}

          {isCreatingProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateProfile}
                  disabled={createProfileMutation.isPending}
                >
                  {createProfileMutation.isPending ? 'Creating...' : 'Create Profile'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingProfile(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {customerProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Profile Active</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{customerProfile.email}</p>
                </div>
                {customerProfile.phone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{customerProfile.phone}</p>
                  </div>
                )}
                {(customerProfile.firstName || customerProfile.lastName) && (
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {[customerProfile.firstName, customerProfile.lastName].filter(Boolean).join(' ')}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Customer ID</Label>
                  <p className="font-mono text-xs">{customerProfile.squareCustomerId}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Cards Section */}
      {customerProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Saved Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cardsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {cardsData?.cards?.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No saved payment methods</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add a payment method during checkout to save it for future use
                    </p>
                  </div>
                ) : (
                  cardsData?.cards?.map((card: SavedCard) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-6 rounded ${getCardBrandColor(card.cardBrand)} flex items-center justify-center`}>
                          <CreditCard className="h-3 w-3 text-white" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              •••• •••• •••• {card.last4}
                            </span>
                            {card.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {card.cardBrand} • Expires {formatExpiryDate(card.expMonth, card.expYear)}
                            {card.cardNickname && ` • ${card.cardNickname}`}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCard(card.squareCardId)}
                        disabled={removeCardMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Secure Payment Storage
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Your payment information is securely stored using Square's PCI-compliant infrastructure. 
                We never store your full card details on our servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}