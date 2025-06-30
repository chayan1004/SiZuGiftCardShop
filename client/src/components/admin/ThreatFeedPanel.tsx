import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, Search, AlertTriangle, Clock, Globe, Activity } from 'lucide-react';

export interface FraudAlert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  ip: string;
  type: 'rate_limit_ip_violation' | 'device_fingerprint_violation' | 'invalid_code' | 'reused_code' | 'merchant_rate_limit' | 'suspicious_activity';
  message: string;
  timestamp: string;
  userAgent?: string;
  location?: string;
  additionalData?: any;
}

interface ThreatFeedPanelProps {
  alerts: FraudAlert[];
  isConnected: boolean;
  connectedAdmins: number;
}

const ThreatFeedPanel: React.FC<ThreatFeedPanelProps> = ({ 
  alerts, 
  isConnected, 
  connectedAdmins 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to newest alerts
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [alerts, autoScroll]);

  // Filter alerts based on search and severity
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rate_limit_ip_violation': return '🚫';
      case 'device_fingerprint_violation': return '🔍';
      case 'invalid_code': return '❌';
      case 'reused_code': return '🔄';
      case 'merchant_rate_limit': return '⏱️';
      case 'suspicious_activity': return '⚠️';
      default: return '🛡️';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Header with connection status */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-cyan-400" />
              Live Threat Feed
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400">{connectedAdmins} Admin(s)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by IP, type, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            
            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                autoScroll 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'bg-white/5 text-gray-400 border border-white/20'
              }`}
            >
              Auto-scroll
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Threat feed */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">
                Recent Threats ({filteredAlerts.length})
              </span>
            </div>
            {alerts.length > 0 && (
              <span className="text-xs text-gray-400">
                Latest: {formatTime(alerts[alerts.length - 1]?.timestamp)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={feedRef}
            className="max-h-[400px] overflow-y-auto space-y-3 pr-2"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
              setAutoScroll(isAtBottom);
            }}
          >
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">
                  {alerts.length === 0 
                    ? 'No threats detected yet. System monitoring...' 
                    : 'No threats match your filters.'}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`
                    p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01]
                    ${alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                      alert.severity === 'medium' ? 'bg-orange-500/10 border-orange-500/30' :
                      'bg-gray-500/10 border-gray-500/30'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(alert.type)}</span>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-300 font-medium">
                        {formatType(alert.type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-white">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span className="text-blue-400 font-mono">{alert.ip}</span>
                      </div>
                      
                      {alert.location && (
                        <span className="text-gray-400">📍 {alert.location}</span>
                      )}
                      
                      {alert.userAgent && (
                        <span className="text-gray-500 truncate max-w-[200px]">
                          {alert.userAgent.substring(0, 50)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatFeedPanel;