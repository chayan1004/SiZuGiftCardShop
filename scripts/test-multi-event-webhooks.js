#!/usr/bin/env node

import newman from 'newman';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
  COLLECTION_PATH: path.join(__dirname, '..', 'postman', 'phase15a-multi-event-webhooks.postman_collection.json'),
  OUTPUT_DIR: path.join(__dirname, '..', 'test-results'),
  DELAY_REQUEST: 2000, // 2 seconds between requests
  TIMEOUT_REQUEST: 30000, // 30 seconds timeout
  ITERATIONS: 1,
  BAIL: true // Stop on first failure for debugging
};

console.log('🚀 Phase 15A: Multi-Event Webhook System - Test Runner');
console.log('='.repeat(70));
console.log(`📡 Base URL: ${CONFIG.BASE_URL}`);
console.log(`📋 Collection: ${path.basename(CONFIG.COLLECTION_PATH)}`);
console.log(`🔄 Event Types: gift_card_issued, gift_card_redeemed, gift_card_refunded`);
console.log(`🔐 Security: HMAC-SHA256 signature verification`);
console.log(`🧪 Mock Endpoint: /api/mock/webhook`);
console.log('='.repeat(70));

// Ensure test results directory exists
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Check if collection file exists
if (!fs.existsSync(CONFIG.COLLECTION_PATH)) {
  console.error(`❌ Collection file not found: ${CONFIG.COLLECTION_PATH}`);
  process.exit(1);
}

// Configure test environment
const environment = {
  id: 'phase15a-test-env',
  name: 'Phase 15A Test Environment',
  values: [
    {
      key: 'base_url',
      value: CONFIG.BASE_URL,
      enabled: true,
      type: 'default'
    },
    {
      key: 'current_timestamp',
      value: new Date().toISOString(),
      enabled: true,
      type: 'default'
    }
  ]
};

// Newman configuration
const newmanOptions = {
  collection: CONFIG.COLLECTION_PATH,
  environment: environment,
  reporters: ['cli', 'json'],
  reporter: {
    json: {
      export: path.join(CONFIG.OUTPUT_DIR, `phase15a-webhook-test-results-${Date.now()}.json`)
    }
  },
  delayRequest: CONFIG.DELAY_REQUEST,
  timeoutRequest: CONFIG.TIMEOUT_REQUEST,
  iterationCount: CONFIG.ITERATIONS,
  bail: CONFIG.BAIL,
  color: 'on',
  verbose: true
};

console.log('🧪 Starting multi-event webhook tests...\n');

newman.run(newmanOptions, function (err, summary) {
  if (err) {
    console.error('❌ Newman execution failed:', err);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Phase 15A Multi-Event Webhook Test Results');
  console.log('='.repeat(70));

  // Test execution summary
  const stats = summary.run.stats;
  const timings = summary.run.timings;
  
  console.log(`📈 Requests: ${stats.requests.total} total, ${stats.requests.pending} pending, ${stats.requests.failed} failed`);
  console.log(`✅ Assertions: ${stats.assertions.total} total, ${stats.assertions.pending} pending, ${stats.assertions.failed} failed`);
  console.log(`⏱️  Duration: ${Math.round(timings.completed - timings.started)}ms`);
  console.log(`📡 Average Response Time: ${Math.round(timings.responseAverage)}ms`);

  // Detailed test results
  if (summary.run.failures && summary.run.failures.length > 0) {
    console.log('\n❌ Test Failures:');
    summary.run.failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.source.name || 'Unknown Test'}`);
      console.log(`   Error: ${failure.error.message || 'Unknown error'}`);
      if (failure.error.test) {
        console.log(`   Test: ${failure.error.test}`);
      }
    });
  }

  // Event-specific validation
  const executions = summary.run.executions;
  const eventTests = {
    'gift_card_issued': { passed: 0, failed: 0 },
    'gift_card_redeemed': { passed: 0, failed: 0 },
    'gift_card_refunded': { passed: 0, failed: 0 },
    'security': { passed: 0, failed: 0 },
    'performance': { passed: 0, failed: 0 }
  };

  executions.forEach(execution => {
    const requestName = execution.item.name.toLowerCase();
    
    if (requestName.includes('issued')) {
      execution.assertions.forEach(assertion => {
        if (assertion.error) {
          eventTests.gift_card_issued.failed++;
        } else {
          eventTests.gift_card_issued.passed++;
        }
      });
    } else if (requestName.includes('redeemed')) {
      execution.assertions.forEach(assertion => {
        if (assertion.error) {
          eventTests.gift_card_redeemed.failed++;
        } else {
          eventTests.gift_card_redeemed.passed++;
        }
      });
    } else if (requestName.includes('refunded')) {
      execution.assertions.forEach(assertion => {
        if (assertion.error) {
          eventTests.gift_card_refunded.failed++;
        } else {
          eventTests.gift_card_refunded.passed++;
        }
      });
    } else if (requestName.includes('signature') || requestName.includes('invalid')) {
      execution.assertions.forEach(assertion => {
        if (assertion.error) {
          eventTests.security.failed++;
        } else {
          eventTests.security.passed++;
        }
      });
    } else if (requestName.includes('performance')) {
      execution.assertions.forEach(assertion => {
        if (assertion.error) {
          eventTests.performance.failed++;
        } else {
          eventTests.performance.passed++;
        }
      });
    }
  });

  console.log('\n📋 Event Type Test Results:');
  Object.entries(eventTests).forEach(([eventType, results]) => {
    const total = results.passed + results.failed;
    if (total > 0) {
      const symbol = results.failed === 0 ? '✅' : '❌';
      console.log(`   ${symbol} ${eventType}: ${results.passed}/${total} passed`);
    }
  });

  // Final status
  const overallSuccess = stats.assertions.failed === 0 && stats.requests.failed === 0;
  
  console.log('\n' + '='.repeat(70));
  if (overallSuccess) {
    console.log('🎉 Phase 15A Multi-Event Webhook System: ALL TESTS PASSED');
    console.log('✅ Multi-event webhook system is production ready');
    console.log('✅ HMAC-SHA256 signature verification working');
    console.log('✅ All event types (issued, redeemed, refunded) supported');
    console.log('✅ Security validation and performance tests passed');
  } else {
    console.log('❌ Phase 15A Multi-Event Webhook System: TESTS FAILED');
    console.log(`   ${stats.assertions.failed} assertion(s) failed`);
    console.log(`   ${stats.requests.failed} request(s) failed`);
  }
  console.log('='.repeat(70));

  // Save summary to file
  const summaryFile = path.join(CONFIG.OUTPUT_DIR, `phase15a-webhook-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    phase: 'Phase 15A: Multi-Event Webhook System',
    baseUrl: CONFIG.BASE_URL,
    overallSuccess,
    stats: {
      requests: stats.requests,
      assertions: stats.assertions,
      duration: timings.completed - timings.started,
      averageResponseTime: timings.responseAverage
    },
    eventTests,
    failures: summary.run.failures || []
  }, null, 2));

  console.log(`📄 Detailed results saved to: ${summaryFile}`);

  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted');
  process.exit(130);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});