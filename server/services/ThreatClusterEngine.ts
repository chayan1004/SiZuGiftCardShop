import { db } from "../db";
import { fraudLogs, fraudClusters, clusterPatterns, type FraudCluster, type InsertFraudCluster, type InsertClusterPattern } from "@shared/schema";
import { eq, gte, sql, desc, and } from "drizzle-orm";
import { createHash } from "crypto";
import { ActionRuleEngine } from "./ActionRuleEngine";

interface ThreatPattern {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
  merchantId: string | null;
  timestamp: Date;
  threatType: string;
  metadata: any;
}

interface ClusterCandidate {
  patterns: ThreatPattern[];
  score: number;
  patternType: string;
  label: string;
  severity: number;
}

export class ThreatClusterEngine {
  private static instance: ThreatClusterEngine;
  private isRunning = false;
  private lastAnalysisTime: Date = new Date(0);
  private actionRuleEngine: ActionRuleEngine;

  private constructor() {
    this.actionRuleEngine = ActionRuleEngine.getInstance();
  }

  static getInstance(): ThreatClusterEngine {
    if (!ThreatClusterEngine.instance) {
      ThreatClusterEngine.instance = new ThreatClusterEngine();
    }
    return ThreatClusterEngine.instance;
  }

  /**
   * Main clustering analysis function - runs every 5 minutes
   */
  async analyzeThreats(): Promise<void> {
    if (this.isRunning) {
      console.log('ThreatClusterEngine: Analysis already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔍 ThreatClusterEngine: Starting threat pattern analysis...');

    try {
      // Get new fraud logs since last analysis
      const newThreats = await this.getNewThreats();
      
      if (newThreats.length === 0) {
        console.log('ThreatClusterEngine: No new threats to analyze');
        return;
      }

      console.log(`ThreatClusterEngine: Analyzing ${newThreats.length} new threats`);

      // Perform different types of clustering
      const clusters = await Promise.all([
        this.detectIPClusters(newThreats),
        this.detectDeviceFingerprintClusters(newThreats),
        this.detectVelocityClusters(newThreats),
        this.detectUserAgentClusters(newThreats),
      ]);

      // Flatten and filter significant clusters
      const significantClusters = clusters
        .flat()
        .filter(cluster => cluster.score >= 3.0 && cluster.patterns.length >= 2);

      console.log(`ThreatClusterEngine: Found ${significantClusters.length} significant clusters`);

      // Create clusters in database
      for (const cluster of significantClusters) {
        await this.createCluster(cluster);
      }

      this.lastAnalysisTime = new Date();
      console.log('✅ ThreatClusterEngine: Analysis completed successfully');

    } catch (error) {
      console.error('❌ ThreatClusterEngine: Analysis failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get new fraud logs since last analysis
   */
  private async getNewThreats(): Promise<ThreatPattern[]> {
    const results = await db
      .select({
        id: fraudLogs.id,
        ipAddress: fraudLogs.ipAddress,
        userAgent: fraudLogs.userAgent,
        deviceFingerprint: fraudLogs.deviceFingerprint,
        merchantId: fraudLogs.merchantId,
        timestamp: fraudLogs.createdAt,
        threatType: fraudLogs.threatType,
        metadata: fraudLogs.metadata,
      })
      .from(fraudLogs)
      .where(gte(fraudLogs.createdAt, this.lastAnalysisTime))
      .orderBy(desc(fraudLogs.createdAt))
      .limit(1000); // Limit to prevent memory issues

    return results
      .filter(result => result.timestamp !== null)
      .map(result => ({
        id: result.id,
        ipAddress: result.ipAddress,
        userAgent: result.userAgent,
        deviceFingerprint: result.deviceFingerprint,
        merchantId: result.merchantId,
        timestamp: result.timestamp!,
        threatType: result.threatType,
        metadata: result.metadata ? JSON.parse(result.metadata) : null,
      }));
  }

  /**
   * Detect IP-based clustering patterns
   */
  private async detectIPClusters(threats: ThreatPattern[]): Promise<ClusterCandidate[]> {
    const ipGroups = new Map<string, ThreatPattern[]>();
    
    // Group threats by IP address
    threats.forEach(threat => {
      if (threat.ipAddress) {
        const key = threat.ipAddress;
        if (!ipGroups.has(key)) {
          ipGroups.set(key, []);
        }
        ipGroups.get(key)!.push(threat);
      }
    });

    const clusters: ClusterCandidate[] = [];

    // Analyze each IP group
    for (const [ip, ipThreats] of ipGroups) {
      if (ipThreats.length >= 2) {
        // Calculate time proximity score
        const timeSpan = this.calculateTimeSpan(ipThreats);
        const score = this.calculateIPClusterScore(ipThreats, timeSpan);

        if (score >= 3.0) {
          clusters.push({
            patterns: ipThreats,
            score,
            patternType: 'ip_based',
            label: `IP Cluster: ${ip}`,
            severity: this.calculateSeverity(score, ipThreats.length),
          });
        }
      }
    }

    return clusters;
  }

  /**
   * Detect device fingerprint clustering patterns
   */
  private async detectDeviceFingerprintClusters(threats: ThreatPattern[]): Promise<ClusterCandidate[]> {
    const deviceGroups = new Map<string, ThreatPattern[]>();
    
    threats.forEach(threat => {
      if (threat.deviceFingerprint) {
        const key = threat.deviceFingerprint;
        if (!deviceGroups.has(key)) {
          deviceGroups.set(key, []);
        }
        deviceGroups.get(key)!.push(threat);
      }
    });

    const clusters: ClusterCandidate[] = [];

    for (const [fingerprint, deviceThreats] of deviceGroups) {
      if (deviceThreats.length >= 2) {
        const timeSpan = this.calculateTimeSpan(deviceThreats);
        const score = this.calculateDeviceClusterScore(deviceThreats, timeSpan);

        if (score >= 3.0) {
          clusters.push({
            patterns: deviceThreats,
            score,
            patternType: 'device_fingerprint',
            label: `Device Cluster: ${fingerprint.substring(0, 8)}...`,
            severity: this.calculateSeverity(score, deviceThreats.length),
          });
        }
      }
    }

    return clusters;
  }

  /**
   * Detect velocity-based clustering (rapid actions)
   */
  private async detectVelocityClusters(threats: ThreatPattern[]): Promise<ClusterCandidate[]> {
    const clusters: ClusterCandidate[] = [];
    const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Sort threats by timestamp
    const sortedThreats = [...threats].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sortedThreats.length; i++) {
      const baseTime = sortedThreats[i].timestamp.getTime();
      const velocityGroup: ThreatPattern[] = [sortedThreats[i]];

      // Find threats within time window
      for (let j = i + 1; j < sortedThreats.length; j++) {
        const threatTime = sortedThreats[j].timestamp.getTime();
        if (threatTime - baseTime <= timeWindow) {
          velocityGroup.push(sortedThreats[j]);
        } else {
          break;
        }
      }

      if (velocityGroup.length >= 3) { // At least 3 threats in 5 minutes
        const score = this.calculateVelocityScore(velocityGroup, timeWindow);
        
        if (score >= 4.0) {
          clusters.push({
            patterns: velocityGroup,
            score,
            patternType: 'velocity',
            label: `Velocity Attack: ${velocityGroup.length} threats in 5min`,
            severity: this.calculateSeverity(score, velocityGroup.length),
          });
        }
      }
    }

    return clusters;
  }

  /**
   * Detect user agent clustering patterns
   */
  private async detectUserAgentClusters(threats: ThreatPattern[]): Promise<ClusterCandidate[]> {
    const uaGroups = new Map<string, ThreatPattern[]>();
    
    threats.forEach(threat => {
      if (threat.userAgent) {
        // Create a simplified user agent signature
        const signature = this.createUserAgentSignature(threat.userAgent);
        if (!uaGroups.has(signature)) {
          uaGroups.set(signature, []);
        }
        uaGroups.get(signature)!.push(threat);
      }
    });

    const clusters: ClusterCandidate[] = [];

    for (const [signature, uaThreats] of uaGroups) {
      if (uaThreats.length >= 3) { // Higher threshold for UA clustering
        const score = this.calculateUserAgentScore(uaThreats);

        if (score >= 3.5) {
          clusters.push({
            patterns: uaThreats,
            score,
            patternType: 'user_agent',
            label: `User Agent Pattern: ${signature}`,
            severity: this.calculateSeverity(score, uaThreats.length),
          });
        }
      }
    }

    return clusters;
  }

  /**
   * Calculate time span between first and last threat
   */
  private calculateTimeSpan(threats: ThreatPattern[]): number {
    if (threats.length < 2) return 0;
    
    const times = threats.map(t => t.timestamp.getTime()).sort();
    return times[times.length - 1] - times[0];
  }

  /**
   * Calculate IP cluster risk score
   */
  private calculateIPClusterScore(threats: ThreatPattern[], timeSpan: number): number {
    let score = threats.length * 1.5; // Base score by threat count
    
    // Time proximity bonus (closer in time = higher score)
    if (timeSpan < 60 * 1000) { // Within 1 minute
      score += 3.0;
    } else if (timeSpan < 5 * 60 * 1000) { // Within 5 minutes
      score += 2.0;
    } else if (timeSpan < 60 * 60 * 1000) { // Within 1 hour
      score += 1.0;
    }

    // Threat type diversity penalty (same types = more suspicious)
    const uniqueTypes = new Set(threats.map(t => t.threatType)).size;
    if (uniqueTypes === 1) {
      score += 1.5; // Same threat type is more suspicious
    }

    return Math.min(score, 10.0); // Cap at 10.0
  }

  /**
   * Calculate device fingerprint cluster score
   */
  private calculateDeviceClusterScore(threats: ThreatPattern[], timeSpan: number): number {
    let score = threats.length * 2.0; // Higher base score for device clustering
    
    // Time proximity bonus
    if (timeSpan < 30 * 1000) { // Within 30 seconds
      score += 4.0;
    } else if (timeSpan < 2 * 60 * 1000) { // Within 2 minutes
      score += 2.5;
    } else if (timeSpan < 10 * 60 * 1000) { // Within 10 minutes
      score += 1.0;
    }

    return Math.min(score, 10.0);
  }

  /**
   * Calculate velocity attack score
   */
  private calculateVelocityScore(threats: ThreatPattern[], timeWindow: number): number {
    const rate = threats.length / (timeWindow / (60 * 1000)); // Threats per minute
    let score = rate * 2.0;

    // Bonus for extremely high velocity
    if (rate >= 5) { // 5+ threats per minute
      score += 3.0;
    } else if (rate >= 2) { // 2+ threats per minute
      score += 1.5;
    }

    return Math.min(score, 10.0);
  }

  /**
   * Calculate user agent pattern score
   */
  private calculateUserAgentScore(threats: ThreatPattern[]): number {
    let score = threats.length * 1.0;
    
    // Check for suspicious patterns in user agent
    const sampleUA = threats[0].userAgent || '';
    if (sampleUA.includes('bot') || sampleUA.includes('crawler')) {
      score += 2.0;
    }
    if (sampleUA.length < 20) { // Very short user agent
      score += 1.5;
    }

    return Math.min(score, 10.0);
  }

  /**
   * Calculate severity level (1-5)
   */
  private calculateSeverity(score: number, threatCount: number): number {
    if (score >= 8.0 || threatCount >= 10) return 5; // Critical
    if (score >= 6.0 || threatCount >= 7) return 4;  // High
    if (score >= 4.0 || threatCount >= 5) return 3;  // Medium
    if (score >= 2.0 || threatCount >= 3) return 2;  // Low
    return 1; // Very Low
  }

  /**
   * Create a simplified user agent signature for clustering
   */
  private createUserAgentSignature(userAgent: string): string {
    // Extract key components and create a hash
    const simplified = userAgent
      .replace(/[\d.]+/g, 'X') // Replace version numbers
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .toLowerCase();
    
    return createHash('md5').update(simplified).digest('hex').substring(0, 12);
  }

  /**
   * Create a new fraud cluster in the database
   */
  private async createCluster(cluster: ClusterCandidate): Promise<void> {
    try {
      const metadata = {
        patternType: cluster.patternType,
        threatIds: cluster.patterns.map(p => p.id),
        timeSpan: this.calculateTimeSpan(cluster.patterns),
        uniqueIPs: new Set(cluster.patterns.map(p => p.ipAddress).filter(Boolean)).size,
        uniqueDevices: new Set(cluster.patterns.map(p => p.deviceFingerprint).filter(Boolean)).size,
        threatTypes: [...new Set(cluster.patterns.map(p => p.threatType))],
      };

      // Insert fraud cluster
      const [newCluster] = await db
        .insert(fraudClusters)
        .values({
          label: cluster.label,
          score: cluster.score.toString(),
          severity: cluster.severity,
          threatCount: cluster.patterns.length,
          patternType: cluster.patternType,
          metadata: JSON.stringify(metadata),
        })
        .returning();

      // Insert cluster patterns
      for (const pattern of cluster.patterns) {
        await db.insert(clusterPatterns).values({
          clusterId: newCluster.id,
          fraudLogId: pattern.id,
          metadata: JSON.stringify({
            ipAddress: pattern.ipAddress,
            userAgent: pattern.userAgent,
            deviceFingerprint: pattern.deviceFingerprint,
            timestamp: pattern.timestamp.toISOString(),
          }),
          similarity: "95.0", // Default high similarity for same cluster
        });
      }

      console.log(`✅ Created cluster: ${cluster.label} (${cluster.patterns.length} threats, score: ${cluster.score.toFixed(2)})`);

      // Phase 20: Trigger AI-Powered Defense Actions
      await this.actionRuleEngine.evaluateCluster(newCluster);

      // Emit real-time update via Socket.IO
      this.emitClusterAlert(newCluster, cluster.patterns.length);

    } catch (error) {
      console.error('❌ Failed to create cluster:', error);
    }
  }

  /**
   * Emit real-time cluster alert via Socket.IO
   */
  private emitClusterAlert(cluster: any, threatCount: number): void {
    try {
      // Import Socket.IO instance and emit
      const { getSocketIO } = require('../index');
      const io = getSocketIO();
      
      if (io) {
        io.emit('new-fraud-cluster', {
          clusterId: cluster.id,
          title: cluster.label,
          severity: cluster.severity,
          score: parseFloat(cluster.score),
          matchedThreatCount: threatCount,
          timestamp: new Date().toISOString(),
          patternType: cluster.patternType,
        });
        
        console.log(`📡 Emitted cluster alert: ${cluster.label}`);
      }
    } catch (error) {
      console.error('❌ Failed to emit cluster alert:', error);
    }
  }

  /**
   * Start the threat clustering engine with 5-minute intervals
   */
  startEngine(): void {
    console.log('🚀 ThreatClusterEngine: Starting with 5-minute analysis intervals');
    
    // Run initial analysis
    this.analyzeThreats();
    
    // Schedule recurring analysis every 5 minutes
    setInterval(() => {
      this.analyzeThreats();
    }, 5 * 60 * 1000);
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerManualAnalysis(): Promise<{ clustersFound: number; threatsAnalyzed: number }> {
    const startTime = new Date();
    const initialThreats = await this.getNewThreats();
    
    await this.analyzeThreats();
    
    // Get clusters created in this session
    const newClusters = await db
      .select()
      .from(fraudClusters)
      .where(gte(fraudClusters.createdAt, startTime));

    return {
      clustersFound: newClusters.length,
      threatsAnalyzed: initialThreats.length,
    };
  }
}

export default ThreatClusterEngine;