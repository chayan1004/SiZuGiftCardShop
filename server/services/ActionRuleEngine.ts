import { db } from "../db";
import { actionRules, defenseActions, defenseHistory, fraudClusters, type ActionRule, type InsertDefenseAction, type InsertDefenseHistory } from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { FraudSocketService } from "./FraudSocketService";

interface DefenseActionRequest {
  actionType: string;
  targetValue: string;
  severity: number;
  triggeredBy: string;
  metadata?: any;
  expiresAt?: Date;
}

interface ActionCondition {
  field: string; // 'severity', 'score', 'threatCount', 'patternType'
  operator: string; // 'gte', 'gt', 'eq', 'contains'
  value: any;
}

export class ActionRuleEngine {
  private static instance: ActionRuleEngine;
  private fraudSocketService: FraudSocketService;

  private constructor() {
    this.fraudSocketService = FraudSocketService.getInstance();
  }

  static getInstance(): ActionRuleEngine {
    if (!ActionRuleEngine.instance) {
      ActionRuleEngine.instance = new ActionRuleEngine();
    }
    return ActionRuleEngine.instance;
  }

  /**
   * Main entry point - evaluate cluster against all active rules
   */
  async evaluateCluster(cluster: any): Promise<void> {
    console.log(`🛡️ ActionRuleEngine: Evaluating cluster ${cluster.id} against defense rules`);

    try {
      // Get all active action rules
      const activeRules = await db
        .select()
        .from(actionRules)
        .where(eq(actionRules.isActive, true))
        .orderBy(desc(actionRules.severity));

      console.log(`Found ${activeRules.length} active defense rules to evaluate`);

      // Evaluate each rule against the cluster
      for (const rule of activeRules) {
        const shouldTrigger = await this.evaluateRule(rule, cluster);
        
        if (shouldTrigger) {
          console.log(`🚨 Rule "${rule.name}" triggered for cluster ${cluster.id}`);
          await this.executeDefenseAction(rule, cluster);
        }
      }

    } catch (error) {
      console.error('❌ ActionRuleEngine: Error evaluating cluster:', error);
    }
  }

  /**
   * Evaluate a single rule against cluster data
   */
  private async evaluateRule(rule: ActionRule, cluster: any): Promise<boolean> {
    try {
      const condition: ActionCondition = JSON.parse(rule.condition);
      
      const clusterValue = this.getClusterValue(cluster, condition.field);
      const targetValue = condition.value;

      switch (condition.operator) {
        case 'gte':
          return clusterValue >= targetValue;
        case 'gt':
          return clusterValue > targetValue;
        case 'eq':
          return clusterValue === targetValue;
        case 'contains':
          return String(clusterValue).includes(String(targetValue));
        default:
          console.warn(`Unknown operator: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
      return false;
    }
  }

  /**
   * Extract value from cluster based on field name
   */
  private getClusterValue(cluster: any, field: string): any {
    switch (field) {
      case 'severity':
        return cluster.severity;
      case 'score':
        return parseFloat(cluster.score);
      case 'threatCount':
        return cluster.threatCount;
      case 'patternType':
        return cluster.patternType;
      default:
        return null;
    }
  }

  /**
   * Execute defense action based on triggered rule
   */
  private async executeDefenseAction(rule: ActionRule, cluster: any): Promise<void> {
    try {
      // Determine target value based on cluster type and rule metadata
      const targetValue = this.getTargetValue(cluster, rule);
      
      if (!targetValue) {
        console.warn(`No target value found for rule ${rule.name}`);
        return;
      }

      // Create defense action
      const actionData: InsertDefenseAction = {
        name: `Auto: ${rule.name}`,
        actionType: rule.actionType,
        triggeredBy: `cluster:${cluster.id}`,
        targetValue: targetValue,
        severity: rule.severity,
        isActive: true,
        expiresAt: this.calculateExpiry(rule.actionType, rule.severity),
        metadata: JSON.stringify({
          ruleId: rule.id,
          clusterId: cluster.id,
          timestamp: new Date().toISOString(),
          clusterMetadata: cluster.metadata
        })
      };

      const [action] = await db
        .insert(defenseActions)
        .values(actionData)
        .returning();

      console.log(`✅ Defense action created: ${action.id} (${rule.actionType})`);

      // Update rule trigger count
      await db
        .update(actionRules)
        .set({
          triggerCount: rule.triggerCount + 1,
          lastTriggered: new Date()
        })
        .where(eq(actionRules.id, rule.id));

      // Execute the actual defense mechanism
      await this.performDefenseAction(action, cluster);

      // Record defense history
      await this.recordDefenseHistory(action, cluster, rule, 'success');

      // Send real-time alert
      this.fraudSocketService.emitThreatAlert({
        type: 'defense_action_triggered',
        severity: rule.severity,
        message: `Defense action "${rule.actionType}" triggered by rule "${rule.name}"`,
        metadata: {
          actionId: action.id,
          clusterId: cluster.id,
          targetValue: targetValue
        }
      });

    } catch (error) {
      console.error(`Error executing defense action for rule ${rule.name}:`, error);
      
      // Record failed defense history
      await this.recordDefenseHistory(null, cluster, rule, 'failed');
    }
  }

  /**
   * Determine target value based on cluster pattern type
   */
  private getTargetValue(cluster: any, rule: ActionRule): string | null {
    const metadata = cluster.metadata ? JSON.parse(cluster.metadata) : {};
    
    switch (rule.actionType) {
      case 'block_ip':
        return metadata.primaryIP || metadata.ip || null;
      case 'block_device':
        return metadata.deviceFingerprint || metadata.device || null;
      case 'rate_limit':
        return metadata.primaryIP || metadata.ip || null;
      case 'alert':
        return cluster.id; // Use cluster ID for alerts
      case 'quarantine':
        return metadata.merchantId || 'global';
      default:
        return cluster.id;
    }
  }

  /**
   * Calculate expiry time based on action type and severity
   */
  private calculateExpiry(actionType: string, severity: number): Date | null {
    const now = new Date();
    
    switch (actionType) {
      case 'block_ip':
        // Higher severity = longer block (1-24 hours)
        const hours = Math.min(severity * 4, 24);
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      case 'block_device':
        // Device blocks last longer (1-7 days)
        const days = Math.min(severity, 7);
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      case 'rate_limit':
        // Rate limits are shorter (15min-4hours)
        const minutes = Math.min(severity * 30, 240);
        return new Date(now.getTime() + minutes * 60 * 1000);
      
      default:
        return null; // Permanent or manual expiry
    }
  }

  /**
   * Perform the actual defense action
   */
  private async performDefenseAction(action: any, cluster: any): Promise<void> {
    console.log(`🛡️ Executing ${action.actionType} on ${action.targetValue}`);

    switch (action.actionType) {
      case 'block_ip':
        await this.blockIP(action.targetValue, action.expiresAt);
        break;
      
      case 'block_device':
        await this.blockDevice(action.targetValue, action.expiresAt);
        break;
      
      case 'rate_limit':
        await this.applyRateLimit(action.targetValue, action.severity);
        break;
      
      case 'alert':
        await this.sendAlert(action, cluster);
        break;
      
      case 'quarantine':
        await this.quarantineMerchant(action.targetValue, action.expiresAt);
        break;
      
      default:
        console.warn(`Unknown action type: ${action.actionType}`);
    }
  }

  /**
   * Block IP address in defense system
   */
  private async blockIP(ipAddress: string, expiresAt: Date | null): Promise<void> {
    // In a real system, this would integrate with firewall/WAF
    console.log(`🚫 IP ${ipAddress} blocked until ${expiresAt}`);
    
    // Store in defense actions for middleware to check
    // This integrates with existing fraud detection middleware
  }

  /**
   * Block device fingerprint
   */
  private async blockDevice(deviceFingerprint: string, expiresAt: Date | null): Promise<void> {
    console.log(`🚫 Device ${deviceFingerprint} blocked until ${expiresAt}`);
    
    // Device blocks integrate with existing fraud detection
  }

  /**
   * Apply rate limiting to IP
   */
  private async applyRateLimit(ipAddress: string, severity: number): Promise<void> {
    const limit = Math.max(1, 10 - severity * 2); // Higher severity = lower limit
    console.log(`⏱️ Rate limit ${limit} req/min applied to ${ipAddress}`);
  }

  /**
   * Send alert to admin/merchant
   */
  private async sendAlert(action: any, cluster: any): Promise<void> {
    console.log(`🚨 Alert sent for cluster ${cluster.id}`);
    
    // This could integrate with email/SMS/webhook alerts
    this.fraudSocketService.emitThreatAlert({
      type: 'high_risk_cluster',
      severity: action.severity,
      message: `High-risk fraud cluster detected: ${cluster.label}`,
      metadata: {
        clusterId: cluster.id,
        score: cluster.score,
        threatCount: cluster.threatCount
      }
    });
  }

  /**
   * Quarantine merchant account
   */
  private async quarantineMerchant(merchantId: string, expiresAt: Date | null): Promise<void> {
    console.log(`🔒 Merchant ${merchantId} quarantined until ${expiresAt}`);
    
    // In production, this would disable merchant API access
  }

  /**
   * Record defense action history
   */
  private async recordDefenseHistory(
    action: any | null, 
    cluster: any, 
    rule: ActionRule, 
    result: string
  ): Promise<void> {
    try {
      const historyData: InsertDefenseHistory = {
        actionId: action?.id || null,
        clusterId: cluster.id,
        ruleId: rule.id,
        result: result,
        impactMetrics: JSON.stringify({
          threatsInCluster: cluster.threatCount,
          clusterScore: cluster.score,
          ruleSeverity: rule.severity,
          timestamp: new Date().toISOString()
        }),
        duration: action?.expiresAt ? 
          Math.floor((new Date(action.expiresAt).getTime() - Date.now()) / 1000) : null
      };

      await db.insert(defenseHistory).values(historyData);
      
    } catch (error) {
      console.error('Error recording defense history:', error);
    }
  }

  /**
   * Create default action rules for new installations
   */
  async createDefaultRules(): Promise<void> {
    console.log('🛡️ Creating default action rules...');

    const defaultRules = [
      {
        name: "High Severity IP Block",
        condition: JSON.stringify({ field: 'severity', operator: 'gte', value: 4 }),
        actionType: 'block_ip',
        severity: 4,
        metadata: JSON.stringify({ description: 'Auto-block IPs in high-severity clusters' })
      },
      {
        name: "High Score Device Block", 
        condition: JSON.stringify({ field: 'score', operator: 'gte', value: 8.0 }),
        actionType: 'block_device',
        severity: 3,
        metadata: JSON.stringify({ description: 'Block devices in high-score clusters' })
      },
      {
        name: "Velocity Attack Rate Limit",
        condition: JSON.stringify({ field: 'patternType', operator: 'eq', value: 'velocity' }),
        actionType: 'rate_limit',
        severity: 2,
        metadata: JSON.stringify({ description: 'Rate limit velocity-based attacks' })
      },
      {
        name: "Critical Threat Alert",
        condition: JSON.stringify({ field: 'severity', operator: 'gte', value: 5 }),
        actionType: 'alert',
        severity: 5,
        metadata: JSON.stringify({ description: 'Send alerts for critical threats' })
      }
    ];

    for (const ruleData of defaultRules) {
      try {
        const existing = await db
          .select()
          .from(actionRules)
          .where(eq(actionRules.name, ruleData.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(actionRules).values(ruleData);
          console.log(`✅ Created rule: ${ruleData.name}`);
        }
      } catch (error) {
        console.error(`Error creating rule ${ruleData.name}:`, error);
      }
    }
  }
}