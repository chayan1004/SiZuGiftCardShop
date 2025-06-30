import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CustomerPaymentProfile from '@/components/cards/CustomerPaymentProfile';
import { CreditCard, User, History, Settings } from 'lucide-react';

export default function CustomerDashboard() {
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    if (customerEmail) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-4">
        <div className="container mx-auto max-w-md pt-20">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <User className="h-6 w-6" />
                Customer Dashboard
              </CardTitle>
              <p className="text-white/80">Access your payment profile and saved cards</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white/90">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Button 
                onClick={handleLogin}
                disabled={!customerEmail}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600"
              >
                Access Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="h-6 w-6" />
              Customer Dashboard
            </h1>
            <div className="flex items-center gap-2 text-white/80">
              <Badge variant="secondary" className="bg-white/10 text-white/90">
                {customerEmail}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsLoggedIn(false)}
                className="text-white/80 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Profile
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Purchase History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <CustomerPaymentProfile 
              customerEmail={customerEmail}
              onProfileCreate={(profile) => {
                console.log('Profile created:', profile);
              }}
              onCardSave={(card) => {
                console.log('Card saved:', card);
              }}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Purchase History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-white/40 mb-4" />
                  <h3 className="text-lg font-semibold text-white/80 mb-2">No Purchase History</h3>
                  <p className="text-white/60">
                    Your gift card purchases will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/90">Email Notifications</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input type="checkbox" id="notifications" className="rounded" />
                      <label htmlFor="notifications" className="text-white/80 text-sm">
                        Receive email notifications for purchases
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-white/90">Security</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input type="checkbox" id="security" className="rounded" defaultChecked />
                      <label htmlFor="security" className="text-white/80 text-sm">
                        Two-factor authentication (recommended)
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/90">Marketing</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input type="checkbox" id="marketing" className="rounded" />
                      <label htmlFor="marketing" className="text-white/80 text-sm">
                        Receive promotional offers and updates
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}