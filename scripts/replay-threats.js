#!/usr/bin/env node

/**
 * CLI Utility for Threat Replay Engine
 * Triggers threat replay analysis from command line
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-test-token';

async function runThreatReplayCLI() {
  console.log('🧠 Threat Replay Engine CLI\n');

  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 50;

  if (isNaN(limit) || limit < 1 || limit > 200) {
    console.error('❌ Invalid limit. Please provide a number between 1 and 200.');
    process.exit(1);
  }

  console.log(`🔍 Analyzing last ${limit} fraud logs...`);

  try {
    // Trigger threat replay analysis
    const response = await fetch(`${BASE_URL}/api/admin/replay-threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ limit })
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Authentication failed. Please set ADMIN_TOKEN environment variable.');
        process.exit(1);
      }
      const error = await response.json();
      console.error(`❌ API Error: ${error.error}`);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ Threat replay analysis completed!\n');
    
    // Display results
    displayResults(data);
    
    // Fetch and display current defense rules
    await displayDefenseRules();
    
  } catch (error) {
    console.error(`❌ Network Error: ${error.message}`);
    process.exit(1);
  }
}

function displayResults(data) {
  const { replay, learning } = data;
  
  console.log('📊 REPLAY ANALYSIS RESULTS');
  console.log('═'.repeat(50));
  console.log(`Total Analyzed:      ${replay.totalAnalyzed}`);
  console.log(`Blocked Correctly:   ${replay.blockedCorrectly} (${Math.round(replay.blockedCorrectly/replay.totalAnalyzed*100)}%)`);
  console.log(`Should Have Blocked: ${replay.shouldHaveBlocked} (${Math.round(replay.shouldHaveBlocked/replay.totalAnalyzed*100)}%)`);
  console.log(`False Positives:     ${replay.falsePositives} (${Math.round(replay.falsePositives/replay.totalAnalyzed*100)}%)`);
  console.log(`Ignored:             ${replay.ignored} (${Math.round(replay.ignored/replay.totalAnalyzed*100)}%)`);
  console.log();
  
  console.log('🤖 AUTO-DEFENSE LEARNING RESULTS');
  console.log('═'.repeat(50));
  console.log(`New Rules Created:   ${learning.rulesCreated}`);
  console.log(`Rules Updated:       ${learning.rulesUpdated}`);
  console.log(`Learning Effectiveness: ${learning.learningEffectiveness}%`);
  console.log();
  
  if (learning.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS');
    console.log('═'.repeat(50));
    learning.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();
  }
  
  // Display sample threat reports
  if (replay.reports.length > 0) {
    console.log('🔍 SAMPLE THREAT ANALYSIS (Top 10)');
    console.log('═'.repeat(80));
    
    replay.reports.slice(0, 10).forEach((report, index) => {
      const outcome = getOutcomeSymbol(report.learningOutcome);
      const blocked = report.replayResult.blocked ? 'BLOCKED' : 'ALLOWED';
      const newRule = report.replayResult.wouldCreateRule ? 'NEW_RULE' : '';
      
      console.log(`${(index + 1).toString().padStart(2)}. ${outcome} ${blocked} ${newRule} ${report.originalAttempt.ip} -> ${report.originalAttempt.gan.substring(0, 12)}...`);
      console.log(`    Reason: ${report.originalAttempt.reason}`);
      
      if (report.replayResult.suggestedRule) {
        console.log(`    New Rule: ${report.replayResult.suggestedRule.type.toUpperCase()} - ${report.replayResult.suggestedRule.reason} (${report.replayResult.suggestedRule.confidence}%)`);
      }
      console.log();
    });
  }
}

async function displayDefenseRules() {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/defense-rules`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    if (!response.ok) return;

    const data = await response.json();
    
    if (data.rules && data.rules.length > 0) {
      console.log('🛡️ ACTIVE DEFENSE RULES');
      console.log('═'.repeat(80));
      
      const rulesByType = {};
      data.rules.forEach(rule => {
        if (!rulesByType[rule.type]) {
          rulesByType[rule.type] = [];
        }
        rulesByType[rule.type].push(rule);
      });
      
      Object.entries(rulesByType).forEach(([type, rules]) => {
        console.log(`\n${type.toUpperCase()} Rules (${rules.length}):`);
        console.log('─'.repeat(50));
        
        rules.slice(0, 5).forEach((rule, index) => {
          const hits = rule.hitCount > 0 ? `(${rule.hitCount} hits)` : '';
          console.log(`  ${index + 1}. ${rule.value} - ${rule.reason} ${hits}`);
          console.log(`     Confidence: ${rule.confidence}% | Created: ${new Date(rule.createdAt).toLocaleDateString()}`);
        });
        
        if (rules.length > 5) {
          console.log(`  ... and ${rules.length - 5} more rules`);
        }
      });
      
      console.log('\n📈 DEFENSE STATISTICS');
      console.log('═'.repeat(50));
      console.log(`Total Rules:         ${data.statistics.totalRules}`);
      console.log(`Active Rules:        ${data.statistics.activeRules}`);
      console.log(`Recently Triggered:  ${data.statistics.recentlyTriggered}`);
      console.log(`Average Confidence:  ${data.statistics.averageConfidence}%`);
    } else {
      console.log('🛡️ No active defense rules found');
    }
    console.log();
    
  } catch (error) {
    console.log('⚠️ Could not fetch defense rules');
  }
}

function getOutcomeSymbol(outcome) {
  switch (outcome) {
    case 'blocked_correctly': return '✅';
    case 'should_have_blocked': return '❌';
    case 'false_positive': return '⚠️';
    case 'ignored': return '⏸️';
    default: return '❓';
  }
}

function displayUsage() {
  console.log('Usage: node scripts/replay-threats.js [limit]');
  console.log('');
  console.log('Arguments:');
  console.log('  limit    Number of fraud logs to analyze (1-200, default: 50)');
  console.log('');
  console.log('Environment Variables:');
  console.log('  BASE_URL      API base URL (default: http://localhost:5000)');
  console.log('  ADMIN_TOKEN   Admin authentication token');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/replay-threats.js           # Analyze last 50 fraud logs');
  console.log('  node scripts/replay-threats.js 100       # Analyze last 100 fraud logs');
  console.log('  ADMIN_TOKEN=xxx node scripts/replay-threats.js 25');
}

// Handle help flags
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayUsage();
  process.exit(0);
}

// Run the CLI
runThreatReplayCLI().catch(console.error);