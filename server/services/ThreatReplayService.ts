/**
 * ThreatReplayService.ts
 * 
 * Threat Replay Engine that loads fraud logs from database and simulates
 * redemption attempts to train the auto-defense system.
 */

import { storage } from '../storage';
import { FraudLog } from '@shared/schema';

export interface ThreatReplayReport {
  fraudLogId: string;
  originalAttempt: {
    gan: string;
    ip: string;
    userAgent: string;
    merchantId?: string;
    reason: string;
    timestamp: Date;
  };
  replayResult: {
    blocked: boolean;
    blockReason?: string;
    httpStatus: number;
    responseTime: number;
    wouldCreateRule: boolean;
    suggestedRule?: {
      type: string;
      value: string;
      reason: string;
      confidence: number;
    };
  };
  learningOutcome: 'blocked_correctly' | 'should_have_blocked' | 'false_positive' | 'ignored';
}

export class ThreatReplayService {
  
  /**
   * Load recent fraud logs from database for replay analysis
   */
  static async loadRecentFraudLogs(limit = 100): Promise<FraudLog[]> {
    try {
      console.log(`Loading ${limit} recent fraud logs for threat replay...`);
      const fraudLogs = await storage.getRecentFraudLogs(limit);
      
      console.log(`Loaded ${fraudLogs.length} fraud logs for analysis`);
      return fraudLogs;
    } catch (error) {
      console.error('Error loading fraud logs for replay:', error);
      throw new Error('Failed to load fraud logs for threat replay');
    }
  }

  /**
   * Simulate a redemption attempt based on historical fraud log
   * This does NOT actually redeem cards - it's purely simulated
   */
  static async simulateRedemptionAttempt(fraudLog: FraudLog): Promise<ThreatReplayReport> {
    const startTime = Date.now();
    
    try {
      console.log(`Simulating redemption attempt from fraud log ${fraudLog.id}`);
      
      // Check if current defense rules would block this attempt
      const ipRule = await storage.checkAutoDefenseRule('ip', fraudLog.ipAddress);
      const deviceRule = fraudLog.userAgent ? 
        await storage.checkAutoDefenseRule('fingerprint', fraudLog.userAgent) : null;
      const merchantRule = fraudLog.merchantId ? 
        await storage.checkAutoDefenseRule('merchant', fraudLog.merchantId) : null;

      const responseTime = Date.now() - startTime;
      let blocked = false;
      let blockReason = '';
      let httpStatus = 200;

      // Determine if current rules would block this attempt
      if (ipRule) {
        blocked = true;
        blockReason = `Blocked by IP rule: ${ipRule.reason}`;
        httpStatus = 429;
      } else if (deviceRule) {
        blocked = true;
        blockReason = `Blocked by device fingerprint rule: ${deviceRule.reason}`;
        httpStatus = 429;
      } else if (merchantRule) {
        blocked = true;
        blockReason = `Blocked by merchant rule: ${merchantRule.reason}`;
        httpStatus = 429;
      }

      // Analyze if we should create new rules based on this fraud attempt
      const suggestedRule = this.analyzeFraudForRuleCreation(fraudLog);
      const wouldCreateRule = suggestedRule !== null;

      // Determine learning outcome
      let learningOutcome: ThreatReplayReport['learningOutcome'];
      if (blocked && fraudLog.reason.includes('suspicious')) {
        learningOutcome = 'blocked_correctly';
      } else if (!blocked && fraudLog.reason.includes('attack')) {
        learningOutcome = 'should_have_blocked';
      } else if (blocked && fraudLog.reason.includes('legitimate')) {
        learningOutcome = 'false_positive';
      } else {
        learningOutcome = 'ignored';
      }

      const report: ThreatReplayReport = {
        fraudLogId: fraudLog.id,
        originalAttempt: {
          gan: fraudLog.gan,
          ip: fraudLog.ipAddress,
          userAgent: fraudLog.userAgent || 'unknown',
          merchantId: fraudLog.merchantId || undefined,
          reason: fraudLog.reason,
          timestamp: fraudLog.createdAt
        },
        replayResult: {
          blocked,
          blockReason: blocked ? blockReason : undefined,
          httpStatus,
          responseTime,
          wouldCreateRule,
          suggestedRule: suggestedRule || undefined
        },
        learningOutcome
      };

      console.log(`Replay completed for ${fraudLog.id}: ${learningOutcome}, blocked: ${blocked}`);
      return report;

    } catch (error) {
      console.error(`Error simulating redemption for fraud log ${fraudLog.id}:`, error);
      
      // Return error report
      const responseTime = Date.now() - startTime;
      return {
        fraudLogId: fraudLog.id,
        originalAttempt: {
          gan: fraudLog.gan,
          ip: fraudLog.ipAddress,
          userAgent: fraudLog.userAgent || 'unknown',
          merchantId: fraudLog.merchantId || undefined,
          reason: fraudLog.reason,
          timestamp: fraudLog.createdAt
        },
        replayResult: {
          blocked: false,
          httpStatus: 500,
          responseTime,
          wouldCreateRule: false
        },
        learningOutcome: 'ignored'
      };
    }
  }

  /**
   * Analyze fraud log to suggest new defense rules
   */
  private static analyzeFraudForRuleCreation(fraudLog: FraudLog): ThreatReplayReport['replayResult']['suggestedRule'] | null {
    // Analyze IP patterns
    if (fraudLog.reason.includes('multiple_attempts') || fraudLog.reason.includes('rate_limit')) {
      return {
        type: 'ip',
        value: fraudLog.ipAddress,
        reason: `IP ${fraudLog.ipAddress} detected in multiple fraud attempts`,
        confidence: 85
      };
    }

    // Analyze device fingerprint patterns
    if (fraudLog.userAgent && fraudLog.reason.includes('device_fingerprint')) {
      return {
        type: 'fingerprint',
        value: fraudLog.userAgent,
        reason: `Device fingerprint involved in fraudulent activity`,
        confidence: 75
      };
    }

    // Analyze merchant patterns
    if (fraudLog.merchantId && fraudLog.reason.includes('merchant_abuse')) {
      return {
        type: 'merchant',
        value: fraudLog.merchantId,
        reason: `Merchant ${fraudLog.merchantId} experiencing unusual fraud patterns`,
        confidence: 70
      };
    }

    // Check for reused GAN patterns
    if (fraudLog.reason.includes('reused_gan') || fraudLog.reason.includes('already_redeemed')) {
      return {
        type: 'ip',
        value: fraudLog.ipAddress,
        reason: `IP attempting to reuse already redeemed gift cards`,
        confidence: 90
      };
    }

    return null;
  }

  /**
   * Run comprehensive threat replay analysis
   */
  static async runThreatReplay(limit = 50): Promise<{
    totalAnalyzed: number;
    blockedCorrectly: number;
    shouldHaveBlocked: number;
    falsePositives: number;
    ignored: number;
    newRulesSuggested: number;
    reports: ThreatReplayReport[];
  }> {
    console.log(`Starting comprehensive threat replay analysis (limit: ${limit})`);
    
    const fraudLogs = await this.loadRecentFraudLogs(limit);
    const reports: ThreatReplayReport[] = [];
    
    let blockedCorrectly = 0;
    let shouldHaveBlocked = 0;
    let falsePositives = 0;
    let ignored = 0;
    let newRulesSuggested = 0;

    // Process each fraud log
    for (const fraudLog of fraudLogs) {
      const report = await this.simulateRedemptionAttempt(fraudLog);
      reports.push(report);

      // Count outcomes
      switch (report.learningOutcome) {
        case 'blocked_correctly':
          blockedCorrectly++;
          break;
        case 'should_have_blocked':
          shouldHaveBlocked++;
          break;
        case 'false_positive':
          falsePositives++;
          break;
        case 'ignored':
          ignored++;
          break;
      }

      if (report.replayResult.wouldCreateRule) {
        newRulesSuggested++;
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const summary = {
      totalAnalyzed: fraudLogs.length,
      blockedCorrectly,
      shouldHaveBlocked,
      falsePositives,
      ignored,
      newRulesSuggested,
      reports
    };

    console.log(`Threat replay completed: ${summary.totalAnalyzed} analyzed, ${summary.newRulesSuggested} new rules suggested`);
    return summary;
  }
}