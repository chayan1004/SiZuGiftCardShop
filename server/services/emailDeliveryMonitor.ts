/**
 * Production Email Delivery Monitoring System
 * Tracks delivery rates, sender reputation, and implements gradual volume scaling
 */

interface DeliveryMetrics {
  sent: number;
  delivered: number;
  bounced: number;
  complaints: number;
  opens: number;
  clicks: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

interface VolumeScaling {
  currentLimit: number;
  dailyLimit: number;
  hourlyLimit: number;
  lastScaleUp: Date;
  warmupPhase: 'initial' | 'growing' | 'established' | 'mature';
}

interface EmailQueue {
  id: string;
  type: 'otp' | 'receipt' | 'promo' | 'reminder' | 'refund' | 'fraud';
  priority: 'high' | 'medium' | 'low';
  recipient: string;
  scheduledTime: Date;
  attempts: number;
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'deferred';
  lastAttempt?: Date;
  errorMessage?: string;
}

class EmailDeliveryMonitor {
  private metrics: Map<string, DeliveryMetrics> = new Map();
  private volumeScaling: VolumeScaling;
  private emailQueue: EmailQueue[] = [];
  private sentToday: number = 0;
  private sentThisHour: number = 0;
  private lastHourReset: Date = new Date();
  private lastDayReset: Date = new Date();

  constructor() {
    this.volumeScaling = {
      currentLimit: 50,      // Start with 50 emails/day for new domain
      dailyLimit: 50,
      hourlyLimit: 10,       // 10 emails/hour initially
      lastScaleUp: new Date(),
      warmupPhase: 'initial'
    };

    // Reset counters periodically
    this.startResetTimers();
  }

  /**
   * Check if email can be sent based on volume limits
   */
  canSendEmail(priority: 'high' | 'medium' | 'low' = 'medium'): boolean {
    this.resetCountersIfNeeded();

    // High priority emails (OTP, security) get special treatment
    if (priority === 'high') {
      return this.sentThisHour < (this.volumeScaling.hourlyLimit * 1.5);
    }

    return this.sentToday < this.volumeScaling.dailyLimit && 
           this.sentThisHour < this.volumeScaling.hourlyLimit;
  }

  /**
   * Record email sending attempt
   */
  recordEmailSent(type: string, recipient: string, messageId: string): void {
    this.sentToday++;
    this.sentThisHour++;

    // Initialize metrics for this email type if not exists
    if (!this.metrics.has(type)) {
      this.metrics.set(type, {
        sent: 0,
        delivered: 0,
        bounced: 0,
        complaints: 0,
        opens: 0,
        clicks: 0,
        deliveryRate: 100,
        bounceRate: 0,
        complaintRate: 0,
        reputation: 'excellent'
      });
    }

    const metrics = this.metrics.get(type)!;
    metrics.sent++;
    this.updateReputation(type);

    console.log(`📧 Email sent - Type: ${type}, Daily: ${this.sentToday}/${this.volumeScaling.dailyLimit}, Hourly: ${this.sentThisHour}/${this.volumeScaling.hourlyLimit}`);
  }

  /**
   * Record delivery status from webhooks or bounce handling
   */
  recordDeliveryStatus(type: string, status: 'delivered' | 'bounced' | 'complaint' | 'opened' | 'clicked'): void {
    const metrics = this.metrics.get(type);
    if (!metrics) return;

    switch (status) {
      case 'delivered':
        metrics.delivered++;
        break;
      case 'bounced':
        metrics.bounced++;
        break;
      case 'complaint':
        metrics.complaints++;
        break;
      case 'opened':
        metrics.opens++;
        break;
      case 'clicked':
        metrics.clicks++;
        break;
    }

    this.updateMetrics(type);
    this.updateReputation(type);

    // Auto-scale volume based on performance
    this.checkAutoScale();
  }

  /**
   * Get current delivery metrics
   */
  getMetrics(type?: string): DeliveryMetrics | Map<string, DeliveryMetrics> {
    if (type) {
      return this.metrics.get(type) || this.getDefaultMetrics();
    }
    return this.metrics;
  }

  /**
   * Get volume scaling status
   */
  getVolumeStatus(): VolumeScaling & { sentToday: number; sentThisHour: number } {
    this.resetCountersIfNeeded();
    return {
      ...this.volumeScaling,
      sentToday: this.sentToday,
      sentThisHour: this.sentThisHour
    };
  }

  /**
   * Queue email for delayed sending to respect rate limits
   */
  queueEmail(email: Omit<EmailQueue, 'id' | 'scheduledTime' | 'attempts' | 'status'>): string {
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate when this email should be sent
    const now = new Date();
    let scheduledTime = now;

    if (!this.canSendEmail(email.priority)) {
      // Delay based on priority
      const delay = email.priority === 'high' ? 5 : email.priority === 'medium' ? 15 : 30;
      scheduledTime = new Date(now.getTime() + delay * 60000); // minutes to milliseconds
    }

    const queuedEmail: EmailQueue = {
      id: emailId,
      scheduledTime,
      attempts: 0,
      status: 'queued',
      ...email
    };

    this.emailQueue.push(queuedEmail);
    this.processQueue();

    return emailId;
  }

  /**
   * Process queued emails
   */
  private processQueue(): void {
    const now = new Date();
    const readyEmails = this.emailQueue.filter(
      email => email.status === 'queued' && email.scheduledTime <= now
    );

    for (const email of readyEmails) {
      if (this.canSendEmail(email.priority)) {
        email.status = 'sending';
        console.log(`📤 Processing queued email: ${email.id} (${email.type})`);
      }
    }
  }

  /**
   * Update delivery metrics calculations
   */
  private updateMetrics(type: string): void {
    const metrics = this.metrics.get(type)!;
    
    if (metrics.sent > 0) {
      metrics.deliveryRate = (metrics.delivered / metrics.sent) * 100;
      metrics.bounceRate = (metrics.bounced / metrics.sent) * 100;
      metrics.complaintRate = (metrics.complaints / metrics.sent) * 100;
    }
  }

  /**
   * Update sender reputation based on metrics
   */
  private updateReputation(type: string): void {
    const metrics = this.metrics.get(type)!;
    
    if (metrics.sent < 10) {
      metrics.reputation = 'good'; // Not enough data
      return;
    }

    if (metrics.bounceRate > 10 || metrics.complaintRate > 0.5) {
      metrics.reputation = 'critical';
    } else if (metrics.bounceRate > 5 || metrics.complaintRate > 0.3) {
      metrics.reputation = 'poor';
    } else if (metrics.bounceRate > 2 || metrics.complaintRate > 0.1) {
      metrics.reputation = 'fair';
    } else if (metrics.deliveryRate > 95 && metrics.bounceRate < 1) {
      metrics.reputation = 'excellent';
    } else {
      metrics.reputation = 'good';
    }
  }

  /**
   * Auto-scale email volume based on performance
   */
  private checkAutoScale(): void {
    const totalMetrics = this.getAggregatedMetrics();
    const daysSinceLastScale = (Date.now() - this.volumeScaling.lastScaleUp.getTime()) / (1000 * 60 * 60 * 24);

    // Only scale up if performance is good and enough time has passed
    if (daysSinceLastScale >= 3 && totalMetrics.reputation === 'excellent' && totalMetrics.deliveryRate > 95) {
      this.scaleUpVolume();
    } else if (totalMetrics.reputation === 'poor' || totalMetrics.reputation === 'critical') {
      this.scaleDownVolume();
    }
  }

  /**
   * Scale up email volume limits
   */
  private scaleUpVolume(): void {
    const currentPhase = this.volumeScaling.warmupPhase;
    
    switch (currentPhase) {
      case 'initial':
        this.volumeScaling.dailyLimit = Math.min(200, this.volumeScaling.dailyLimit * 2);
        this.volumeScaling.hourlyLimit = Math.min(25, this.volumeScaling.hourlyLimit * 2);
        this.volumeScaling.warmupPhase = 'growing';
        break;
      case 'growing':
        this.volumeScaling.dailyLimit = Math.min(1000, this.volumeScaling.dailyLimit * 1.5);
        this.volumeScaling.hourlyLimit = Math.min(100, this.volumeScaling.hourlyLimit * 1.5);
        if (this.volumeScaling.dailyLimit >= 1000) {
          this.volumeScaling.warmupPhase = 'established';
        }
        break;
      case 'established':
        this.volumeScaling.dailyLimit = Math.min(5000, this.volumeScaling.dailyLimit * 1.2);
        this.volumeScaling.hourlyLimit = Math.min(300, this.volumeScaling.hourlyLimit * 1.2);
        if (this.volumeScaling.dailyLimit >= 5000) {
          this.volumeScaling.warmupPhase = 'mature';
        }
        break;
      case 'mature':
        // Stable high-volume sending
        this.volumeScaling.dailyLimit = Math.min(10000, this.volumeScaling.dailyLimit * 1.1);
        this.volumeScaling.hourlyLimit = Math.min(500, this.volumeScaling.hourlyLimit * 1.1);
        break;
    }

    this.volumeScaling.lastScaleUp = new Date();
    console.log(`📈 Email volume scaled up - Daily: ${this.volumeScaling.dailyLimit}, Hourly: ${this.volumeScaling.hourlyLimit}, Phase: ${this.volumeScaling.warmupPhase}`);
  }

  /**
   * Scale down email volume due to poor performance
   */
  private scaleDownVolume(): void {
    this.volumeScaling.dailyLimit = Math.max(10, Math.floor(this.volumeScaling.dailyLimit * 0.7));
    this.volumeScaling.hourlyLimit = Math.max(2, Math.floor(this.volumeScaling.hourlyLimit * 0.7));
    this.volumeScaling.lastScaleUp = new Date();
    
    console.log(`📉 Email volume scaled down due to poor performance - Daily: ${this.volumeScaling.dailyLimit}, Hourly: ${this.volumeScaling.hourlyLimit}`);
  }

  /**
   * Get aggregated metrics across all email types
   */
  private getAggregatedMetrics(): DeliveryMetrics {
    let totalSent = 0, totalDelivered = 0, totalBounced = 0, totalComplaints = 0;

    Array.from(this.metrics.values()).forEach(metrics => {
      totalSent += metrics.sent;
      totalDelivered += metrics.delivered;
      totalBounced += metrics.bounced;
      totalComplaints += metrics.complaints;
    });

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 100;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const complaintRate = totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0;

    let reputation: DeliveryMetrics['reputation'] = 'excellent';
    if (bounceRate > 10 || complaintRate > 0.5) reputation = 'critical';
    else if (bounceRate > 5 || complaintRate > 0.3) reputation = 'poor';
    else if (bounceRate > 2 || complaintRate > 0.1) reputation = 'fair';
    else if (deliveryRate < 95) reputation = 'good';

    return {
      sent: totalSent,
      delivered: totalDelivered,
      bounced: totalBounced,
      complaints: totalComplaints,
      opens: 0,
      clicks: 0,
      deliveryRate,
      bounceRate,
      complaintRate,
      reputation
    };
  }

  /**
   * Reset daily/hourly counters when needed
   */
  private resetCountersIfNeeded(): void {
    const now = new Date();
    
    // Reset hourly counter
    if (now.getTime() - this.lastHourReset.getTime() >= 3600000) { // 1 hour
      this.sentThisHour = 0;
      this.lastHourReset = now;
    }

    // Reset daily counter
    if (now.getDate() !== this.lastDayReset.getDate()) {
      this.sentToday = 0;
      this.lastDayReset = now;
    }
  }

  /**
   * Start background timers for counter resets and queue processing
   */
  private startResetTimers(): void {
    // Process queue every minute
    setInterval(() => {
      this.processQueue();
    }, 60000);

    // Reset counters every hour
    setInterval(() => {
      this.resetCountersIfNeeded();
    }, 300000); // Check every 5 minutes
  }

  /**
   * Get default metrics structure
   */
  private getDefaultMetrics(): DeliveryMetrics {
    return {
      sent: 0,
      delivered: 0,
      bounced: 0,
      complaints: 0,
      opens: 0,
      clicks: 0,
      deliveryRate: 100,
      bounceRate: 0,
      complaintRate: 0,
      reputation: 'excellent'
    };
  }

  /**
   * Export metrics for monitoring dashboard
   */
  getDetailedReport(): {
    overview: DeliveryMetrics;
    byType: Map<string, DeliveryMetrics>;
    volumeStatus: VolumeScaling & { sentToday: number; sentThisHour: number };
    queueStatus: { total: number; pending: number; failed: number };
  } {
    return {
      overview: this.getAggregatedMetrics(),
      byType: this.metrics,
      volumeStatus: this.getVolumeStatus(),
      queueStatus: {
        total: this.emailQueue.length,
        pending: this.emailQueue.filter(e => e.status === 'queued').length,
        failed: this.emailQueue.filter(e => e.status === 'failed').length
      }
    };
  }
}

export const emailDeliveryMonitor = new EmailDeliveryMonitor();