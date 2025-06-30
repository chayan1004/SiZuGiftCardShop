import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    try {
      // Always use relative path to connect to current host
      const socket = io('/', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        forceNew: true,
        timeout: 10000,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
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

      socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
      });

      socket.on('fraud-alert', (data: FraudAlert) => {
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