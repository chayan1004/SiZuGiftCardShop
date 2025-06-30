/**
 * AutoDefenseEngine.ts
 * 
 * Auto Defense Learning Engine that receives replay results from ThreatReplayService
 * and automatically creates/manages defense rules based on fraud patterns.
 */

import { storage } from '../storage';
import { ThreatReplayReport } from './ThreatReplayService';
import { InsertAutoDefenseRule, AutoDefenseRule } from '@shared/schema';

export interface DefenseRuleLearningResult {
  rulesCreated: number;
  rulesUpdated: number;
  rulesDeactivated: number;
  learningEffectiveness: number; // 0-100 score
  recommendations: string[];
}

export class AutoDefenseEngine {

  /**
   * Learn from threat replay reports and create/update defense rules
   */
  static async learnFromReplay(reports: ThreatReplayReport[]): Promise<DefenseRuleLearningResult> {
    console.log(`Auto Defense Engine analyzing ${reports.length} threat replay reports...`);
    
    let rulesCreated = 0;
    let rulesUpdated = 0;
    let rulesDeactivated = 0;
    const recommendations: string[] = [];

    // Analyze reports for patterns
    const ipPatterns = this.analyzeIPPatterns(reports);
    const devicePatterns = this.analyzeDevicePatterns(reports);
    const merchantPatterns = this.analyzeMerchantPatterns(reports);

    // Create IP-based rules
    for (const pattern of ipPatterns) {
      const existingRule = await storage.checkAutoDefenseRule('ip', pattern.ip);
      
      if (!existingRule && pattern.shouldBlock) {
        await this.createDefenseRule({
          type: 'ip',
          value: pattern.ip,
          reason: pattern.reason,
          confidence: pattern.confidence
        });
        rulesCreated++;
        console.log(`Created IP defense rule for ${pattern.ip}: ${pattern.reason}`);
      } else if (existingRule && pattern.shouldUpdate) {
        await storage.updateAutoDefenseRuleHitCount(existingRule.id);
        rulesUpdated++;
      }
    }

    // Create device fingerprint rules
    for (const pattern of devicePatterns) {
      const existingRule = await storage.checkAutoDefenseRule('fingerprint', pattern.userAgent);
      
      if (!existingRule && pattern.shouldBlock) {
        await this.createDefenseRule({
          type: 'fingerprint',
          value: pattern.userAgent,
          reason: pattern.reason,
          confidence: pattern.confidence
        });
        rulesCreated++;
        console.log(`Created device fingerprint rule: ${pattern.reason}`);
      }
    }

    // Create merchant-based rules
    for (const pattern of merchantPatterns) {
      const existingRule = await storage.checkAutoDefenseRule('merchant', pattern.merchantId);
      
      if (!existingRule && pattern.shouldBlock) {
        await this.createDefenseRule({
          type: 'merchant',
          value: pattern.merchantId,
          reason: pattern.reason,
          confidence: pattern.confidence
        });
        rulesCreated++;
        console.log(`Created merchant defense rule for ${pattern.merchantId}: ${pattern.reason}`);
      }
    }

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(reports, rulesCreated));

    // Calculate learning effectiveness
    const learningEffectiveness = this.calculateLearningEffectiveness(reports, rulesCreated);

    const result = {
      rulesCreated,
      rulesUpdated,
      rulesDeactivated,
      learningEffectiveness,
      recommendations
    };

    console.log(`Auto Defense Learning completed: ${rulesCreated} rules created, ${rulesUpdated} updated`);
    return result;
  }

  /**
   * Analyze IP patterns from replay reports
   */
  private static analyzeIPPatterns(reports: ThreatReplayReport[]): Array<{
    ip: string;
    attempts: number;
    shouldBlock: boolean;
    shouldUpdate: boolean;
    reason: string;
    confidence: number;
  }> {
    const ipMap = new Map<string, {
      attempts: number;
      fraudulent: number;
      shouldHaveBlocked: number;
      reasons: string[];
    }>();

    // Aggregate IP data
    reports.forEach(report => {
      const ip = report.originalAttempt.ip;
      if (!ipMap.has(ip)) {
        ipMap.set(ip, { attempts: 0, fraudulent: 0, shouldHaveBlocked: 0, reasons: [] });
      }
      
      const data = ipMap.get(ip)!;
      data.attempts++;
      
      if (report.learningOutcome === 'should_have_blocked') {
        data.fraudulent++;
        data.shouldHaveBlocked++;
      }
      
      data.reasons.push(report.originalAttempt.reason);
    });

    // Generate patterns
    const patterns: any[] = [];
    
    ipMap.forEach((data, ip) => {
      const fraudRate = data.fraudulent / data.attempts;
      const shouldBlock = fraudRate > 0.6 || data.shouldHaveBlocked > 2; // 60% fraud rate or 3+ should-blocks
      const confidence = Math.min(95, 50 + (fraudRate * 45)); // 50-95% confidence based on fraud rate
      
      if (shouldBlock) {
        patterns.push({
          ip,
          attempts: data.attempts,
          shouldBlock: true,
          shouldUpdate: false,
          reason: `IP ${ip} involved in ${data.fraudulent}/${data.attempts} fraudulent attempts (${Math.round(fraudRate * 100)}% fraud rate)`,
          confidence: Math.round(confidence)
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze device fingerprint patterns
   */
  private static analyzeDevicePatterns(reports: ThreatReplayReport[]): Array<{
    userAgent: string;
    shouldBlock: boolean;
    reason: string;
    confidence: number;
  }> {
    const deviceMap = new Map<string, {
      attempts: number;
      fraudulent: number;
      reasons: string[];
    }>();

    // Aggregate device data
    reports.forEach(report => {
      const userAgent = report.originalAttempt.userAgent;
      if (userAgent && userAgent !== 'unknown') {
        if (!deviceMap.has(userAgent)) {
          deviceMap.set(userAgent, { attempts: 0, fraudulent: 0, reasons: [] });
        }
        
        const data = deviceMap.get(userAgent)!;
        data.attempts++;
        
        if (report.learningOutcome === 'should_have_blocked') {
          data.fraudulent++;
        }
        
        data.reasons.push(report.originalAttempt.reason);
      }
    });

    // Generate patterns
    const patterns: any[] = [];
    
    deviceMap.forEach((data, userAgent) => {
      const fraudRate = data.fraudulent / data.attempts;
      const shouldBlock = fraudRate > 0.7 || data.fraudulent > 3; // 70% fraud rate or 4+ fraudulent attempts
      const confidence = Math.min(90, 40 + (fraudRate * 50)); // 40-90% confidence
      
      if (shouldBlock) {
        patterns.push({
          userAgent,
          shouldBlock: true,
          reason: `Device fingerprint involved in ${data.fraudulent}/${data.attempts} fraudulent attempts`,
          confidence: Math.round(confidence)
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze merchant patterns
   */
  private static analyzeMerchantPatterns(reports: ThreatReplayReport[]): Array<{
    merchantId: string;
    shouldBlock: boolean;
    reason: string;
    confidence: number;
  }> {
    const merchantMap = new Map<string, {
      attempts: number;
      fraudulent: number;
      uniqueIPs: Set<string>;
    }>();

    // Aggregate merchant data
    reports.forEach(report => {
      const merchantId = report.originalAttempt.merchantId;
      if (merchantId) {
        if (!merchantMap.has(merchantId)) {
          merchantMap.set(merchantId, { attempts: 0, fraudulent: 0, uniqueIPs: new Set() });
        }
        
        const data = merchantMap.get(merchantId)!;
        data.attempts++;
        data.uniqueIPs.add(report.originalAttempt.ip);
        
        if (report.learningOutcome === 'should_have_blocked') {
          data.fraudulent++;
        }
      }
    });

    // Generate patterns
    const patterns: any[] = [];
    
    merchantMap.forEach((data, merchantId) => {
      const fraudRate = data.fraudulent / data.attempts;
      const shouldBlock = fraudRate > 0.8 && data.fraudulent > 5; // 80% fraud rate and 5+ attempts
      const confidence = Math.min(85, 30 + (fraudRate * 55)); // 30-85% confidence
      
      if (shouldBlock) {
        patterns.push({
          merchantId,
          shouldBlock: true,
          reason: `Merchant ${merchantId} experiencing high fraud rate: ${data.fraudulent}/${data.attempts} attempts from ${data.uniqueIPs.size} IPs`,
          confidence: Math.round(confidence)
        });
      }
    });

    return patterns;
  }

  /**
   * Create a new defense rule
   */
  private static async createDefenseRule(rule: InsertAutoDefenseRule): Promise<AutoDefenseRule> {
    try {
      const newRule = await storage.createAutoDefenseRule(rule);
      
      // Log the rule creation for audit
      console.log(`AUTO-DEFENSE: Created ${rule.type} rule - ${rule.reason} (confidence: ${rule.confidence}%)`);
      
      return newRule;
    } catch (error) {
      console.error('Error creating auto defense rule:', error);
      throw error;
    }
  }

  /**
   * Generate actionable recommendations based on learning results
   */
  private static generateRecommendations(reports: ThreatReplayReport[], rulesCreated: number): string[] {
    const recommendations: string[] = [];
    
    const shouldHaveBlocked = reports.filter(r => r.learningOutcome === 'should_have_blocked').length;
    const falsePositives = reports.filter(r => r.learningOutcome === 'false_positive').length;
    const total = reports.length;

    if (shouldHaveBlocked > total * 0.3) {
      recommendations.push(`High miss rate detected: ${shouldHaveBlocked}/${total} threats should have been blocked. Consider tightening security rules.`);
    }

    if (falsePositives > total * 0.1) {
      recommendations.push(`High false positive rate: ${falsePositives}/${total} legitimate requests blocked. Review rule precision.`);
    }

    if (rulesCreated === 0 && shouldHaveBlocked > 0) {
      recommendations.push('No new rules created despite missed threats. Consider lowering confidence thresholds for rule creation.');
    }

    if (rulesCreated > 0) {
      recommendations.push(`Successfully created ${rulesCreated} new defense rules to improve threat detection.`);
    }

    return recommendations;
  }

  /**
   * Calculate learning effectiveness score (0-100)
   */
  private static calculateLearningEffectiveness(reports: ThreatReplayReport[], rulesCreated: number): number {
    const total = reports.length;
    if (total === 0) return 0;

    const blockedCorrectly = reports.filter(r => r.learningOutcome === 'blocked_correctly').length;
    const shouldHaveBlocked = reports.filter(r => r.learningOutcome === 'should_have_blocked').length;
    const falsePositives = reports.filter(r => r.learningOutcome === 'false_positive').length;

    // Base effectiveness on detection rate
    const detectionRate = blockedCorrectly / (blockedCorrectly + shouldHaveBlocked);
    
    // Penalty for false positives
    const falsePositiveRate = falsePositives / total;
    const falsePositivePenalty = falsePositiveRate * 30; // Up to 30 point penalty
    
    // Bonus for creating new rules when needed
    const ruleCreationBonus = (rulesCreated > 0 && shouldHaveBlocked > 0) ? 10 : 0;
    
    const effectiveness = Math.max(0, Math.min(100, 
      (detectionRate * 80) - falsePositivePenalty + ruleCreationBonus
    ));

    return Math.round(effectiveness);
  }

  /**
   * Get current defense statistics
   */
  static async getDefenseStatistics(): Promise<{
    totalRules: number;
    activeRules: number;
    rulesByType: { [key: string]: number };
    recentlyTriggered: number;
    averageConfidence: number;
  }> {
    try {
      const allRules = await storage.getAutoDefenseRules();
      const activeRules = allRules.filter(rule => rule.isActive);
      
      const rulesByType: { [key: string]: number } = {};
      let totalConfidence = 0;
      let recentlyTriggered = 0;
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      activeRules.forEach(rule => {
        rulesByType[rule.type] = (rulesByType[rule.type] || 0) + 1;
        totalConfidence += rule.confidence || 0;
        
        if (rule.lastTriggered && rule.lastTriggered > oneDayAgo) {
          recentlyTriggered++;
        }
      });
      
      const averageConfidence = activeRules.length > 0 ? totalConfidence / activeRules.length : 0;
      
      return {
        totalRules: allRules.length,
        activeRules: activeRules.length,
        rulesByType,
        recentlyTriggered,
        averageConfidence: Math.round(averageConfidence)
      };
    } catch (error) {
      console.error('Error getting defense statistics:', error);
      throw error;
    }
  }
}