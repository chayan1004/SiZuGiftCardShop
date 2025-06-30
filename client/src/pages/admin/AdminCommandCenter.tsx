import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlobalSettingsPanel from '@/components/admin/GlobalSettingsPanel';
import GatewayFeaturePanel from '@/components/admin/GatewayFeaturePanel';
import { Settings, Shield, Activity, AlertTriangle } from 'lucide-react';

export default function AdminCommandCenter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Command Center
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Centralized system administration and configuration management
              </p>
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    System Status
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Operational
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  All systems running normally
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Security Level
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  High
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Advanced protection active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Active Alerts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  0
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  No critical issues detected
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="global-settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger 
              value="global-settings" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Global Settings
            </TabsTrigger>
            <TabsTrigger 
              value="gateway-features"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Gateway Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global-settings" className="space-y-6">
            <GlobalSettingsPanel />
          </TabsContent>

          <TabsContent value="gateway-features" className="space-y-6">
            <GatewayFeaturePanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}