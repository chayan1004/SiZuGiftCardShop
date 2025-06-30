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
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'fraud_alert') {
            setFraudAlerts(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 alerts
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Store callback for event handling
      socketRef.current.addEventListener('message', (messageEvent) => {
        try {
          const data = JSON.parse(messageEvent.data);
          if (data.event === event) {
            callback(data.payload || data);
          }
        } catch (error) {
          console.error('Error parsing socket message:', error);
        }
      });
    }
  };

  const off = (event: string) => {
    // WebSocket doesn't have direct event removal, but we handle this in cleanup
    console.log(`Removing listener for event: ${event}`);
  };

  return {
    isConnected,
    fraudAlerts,
    clearAlerts: () => setFraudAlerts([]),
    on,
    off
  };
}