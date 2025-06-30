import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';

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

export class FraudSocketService {
  private io: SocketIOServer;
  private static instance: FraudSocketService;

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: "/socket.io"
    });

    this.setupSocketHandlers();
    console.log('FraudSocketService initialized');
  }

  static getInstance(server?: Server): FraudSocketService {
    if (!FraudSocketService.instance && server) {
      FraudSocketService.instance = new FraudSocketService(server);
    }
    return FraudSocketService.instance;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Join admin room for authenticated admin users
      socket.on('join-admin', (data) => {
        const { adminToken } = data;
        if (adminToken === 'sizu-admin-2025') {
          socket.join('admin');
          socket.emit('admin-joined', { success: true });
          console.log(`Admin socket ${socket.id} joined admin room`);
        } else {
          socket.emit('admin-joined', { success: false, error: 'Invalid admin token' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // Emit fraud alert to all admin users
  public emitFraudAlert(alert: Omit<FraudAlert, 'id' | 'timestamp'>) {
    const fraudAlert: FraudAlert = {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...alert
    };

    console.log('Emitting fraud alert:', fraudAlert);
    this.io.to('admin').emit('fraud-alert', fraudAlert);
    
    return fraudAlert;
  }

  // Emit system status updates
  public emitSystemStatus(status: { 
    type: 'system_restart' | 'security_update' | 'maintenance_mode';
    message: string;
    timestamp?: string;
  }) {
    const systemAlert = {
      id: `system_${Date.now()}`,
      timestamp: status.timestamp || new Date().toISOString(),
      ...status
    };

    this.io.to('admin').emit('system-alert', systemAlert);
    return systemAlert;
  }

  // Get connected admin count
  public getConnectedAdminCount(): Promise<number> {
    return new Promise((resolve) => {
      this.io.in('admin').allSockets().then(sockets => {
        resolve(sockets.size);
      });
    });
  }

  // Broadcast to all connected sockets
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}

// Helper function to determine severity based on threat type and context
export function calculateThreatSeverity(
  type: FraudAlert['type'], 
  context: { attemptCount?: number; timeWindow?: number; isRepeated?: boolean }
): 'low' | 'medium' | 'high' {
  const { attemptCount = 1, isRepeated = false } = context;

  // High severity conditions
  if (isRepeated || attemptCount >= 5) return 'high';
  if (type === 'reused_code' || type === 'device_fingerprint_violation') return 'high';
  
  // Medium severity conditions
  if (type === 'rate_limit_ip_violation' && attemptCount >= 3) return 'medium';
  if (type === 'merchant_rate_limit') return 'medium';
  
  // Low severity (default)
  return 'low';
}

export default FraudSocketService;