import { useEffect, useRef, useState } from 'react';

export interface FraudAlert {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  message: string;
  ip: string;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Use Socket.IO instead of raw WebSocket
    const { io } = require('socket.io-client');
    
    try {
      const socket = io('/', {
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
      });

      socket.on('fraud-alert', (data) => {
        try {
          if (data.type === 'fraud_alert' || data.type === 'suspicious_activity') {
            setFraudAlerts(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 alerts
          }
        } catch (error) {
          console.error('Error processing fraud alert:', error);
        }
      });

    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      setIsConnected(false);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  return {
    isConnected,
    fraudAlerts,
    clearAlerts: () => setFraudAlerts([]),
    on,
    off
  };
}