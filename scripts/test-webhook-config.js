#!/usr/bin/env node

import newman from 'newman';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
  COLLECTION_PATH: path.join(__dirname, '..', 'postman', 'phase15b-webhook-config.postman_collection.json'),
  OUTPUT_DIR: path.join(__dirname, '..', 'test-results'),
  DELAY_REQUEST: 1500, // 1.5 seconds between requests
  TIMEOUT_REQUEST: 15000, // 15 seconds timeout
  ITERATIONS: 1,
  BAIL: false // Continue on failures to test all endpoints
};

console.log('🔗 Phase 15B: Webhook Configuration Management - Test Runner');
console.log('='.repeat(75));
console.log(`📡 Base URL: ${CONFIG.BASE_URL}`);
console.log(`📋 Collection: ${path.basename(CONFIG.COLLECTION_PATH)}`);
console.log(`🔐 Security: requireMerchant & requireAdmin middleware protection`);
console.log(`📊 Features: CRUD operations, secret masking, delivery logs, admin oversight`);
console.log(`🧪 Test Scope: 12 comprehensive test scenarios`);
console.log('='.repeat(75));

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
  id: 'phase15b-test-env',
  name: 'Phase 15B Webhook Config Test Environment',
  values: [
    {
      key: 'base_url',
      value: CONFIG.BASE_URL,
      enabled: true,
      type: 'default'
    },
    {
      key: 'merchant_token',
      value: 'test-merchant-token-123',
      enabled: true,
      type: 'default'
    },
    {
      key: 'admin_token',
      value: 'sizu-admin-2025',
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
      export: path.join(CONFIG.OUTPUT_DIR, `phase15b-webhook-config-results-${Date.now()}.json`)
    }
  },
  delayRequest: CONFIG.DELAY_REQUEST,
  timeoutRequest: CONFIG.TIMEOUT_REQUEST,
  iterationCount: CONFIG.ITERATIONS,
  bail: CONFIG.BAIL,
  color: 'on',
  verbose: true
};

console.log('🧪 Starting webhook configuration management tests...\n');

newman.run(newmanOptions, function (err, summary) {
  if (err) {
    console.error('❌ Newman execution failed:', err);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(75));
  console.log('📊 Phase 15B Webhook Configuration Test Results');
  console.log('='.repeat(75));

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

  // Feature-specific validation
  const executions = summary.run.executions;
  const featureTests = {
    'webhook_crud': { passed: 0, failed: 0 },
    'secret_masking': { passed: 0, failed: 0 },
    'delivery_logs': { passed: 0, failed: 0 },
    'admin_oversight': { passed: 0, failed: 0 },
    'security_validation': { passed: 0, failed: 0 },
    'data_validation': { passed: 0, failed: 0 }
  };

  executions.forEach(execution => {
    const requestName = execution.item.name.toLowerCase();
    
    // Categorize tests by feature
    let category = 'webhook_crud';
    if (requestName.includes('secret') || requestName.includes('mask') || requestName.includes('reveal')) {
      category = 'secret_masking';
    } else if (requestName.includes('logs') || requestName.includes('delivery')) {
      category = 'delivery_logs';
    } else if (requestName.includes('admin') || requestName.includes('stats')) {
      category = 'admin_oversight';
    } else if (requestName.includes('unauthorized') || requestName.includes('invalid')) {
      category = 'security_validation';
    } else if (requestName.includes('validation') || requestName.includes('missing')) {
      category = 'data_validation';
    }

    execution.assertions.forEach(assertion => {
      if (assertion.error) {
        featureTests[category].failed++;
      } else {
        featureTests[category].passed++;
      }
    });
  });

  console.log('\n📋 Feature Test Results:');
  Object.entries(featureTests).forEach(([feature, results]) => {
    const total = results.passed + results.failed;
    if (total > 0) {
      const symbol = results.failed === 0 ? '✅' : '❌';
      const percentage = Math.round((results.passed / total) * 100);
      console.log(`   ${symbol} ${feature.replace('_', ' ')}: ${results.passed}/${total} passed (${percentage}%)`);
    }
  });

  // Security validation summary
  const securityTests = executions.filter(exec => 
    exec.item.name.toLowerCase().includes('unauthorized') || 
    exec.item.name.toLowerCase().includes('invalid') ||
    exec.item.name.toLowerCase().includes('validation')
  );

  console.log('\n🔐 Security Test Summary:');
  console.log(`   🛡️  Authentication protection: ${securityTests.filter(t => t.item.name.includes('Unauthorized')).length > 0 ? 'TESTED' : 'NOT TESTED'}`);
  console.log(`   🔍 Input validation: ${securityTests.filter(t => t.item.name.includes('Validation')).length > 0 ? 'TESTED' : 'NOT TESTED'}`);
  console.log(`   🔒 Secret masking: ${executions.filter(t => t.item.name.includes('Masked')).length > 0 ? 'TESTED' : 'NOT TESTED'}`);

  // Final status
  const overallSuccess = stats.assertions.failed === 0 && stats.requests.failed === 0;
  
  console.log('\n' + '='.repeat(75));
  if (overallSuccess) {
    console.log('🎉 Phase 15B Webhook Configuration Management: ALL TESTS PASSED');
    console.log('✅ Secure CRUD operations working correctly');
    console.log('✅ Secret masking and revelation functionality operational');
    console.log('✅ Delivery log tracking and retrieval working');
    console.log('✅ Admin oversight and statistics endpoints functional');
    console.log('✅ Authentication and authorization security enforced');
    console.log('✅ Input validation and error handling comprehensive');
  } else {
    console.log('❌ Phase 15B Webhook Configuration Management: TESTS FAILED');
    console.log(`   ${stats.assertions.failed} assertion(s) failed`);
    console.log(`   ${stats.requests.failed} request(s) failed`);
    
    // Provide failure guidance
    if (stats.requests.failed > 0) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('   • Ensure the server is running on the correct port');
      console.log('   • Verify database connections are working');
      console.log('   • Check authentication middleware is properly configured');
    }
  }
  console.log('='.repeat(75));

  // Performance analysis
  const responseTimeThresholds = {
    excellent: 200,
    good: 500,
    acceptable: 1000
  };

  const avgResponseTime = timings.responseAverage;
  let performanceRating = 'needs improvement';
  if (avgResponseTime <= responseTimeThresholds.excellent) {
    performanceRating = 'excellent';
  } else if (avgResponseTime <= responseTimeThresholds.good) {
    performanceRating = 'good';
  } else if (avgResponseTime <= responseTimeThresholds.acceptable) {
    performanceRating = 'acceptable';
  }

  console.log(`\n⚡ Performance Rating: ${performanceRating.toUpperCase()}`);
  console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);

  // Save comprehensive summary to file
  const summaryFile = path.join(CONFIG.OUTPUT_DIR, `phase15b-webhook-config-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    phase: 'Phase 15B: Webhook Configuration Management',
    baseUrl: CONFIG.BASE_URL,
    overallSuccess,
    performanceRating,
    stats: {
      requests: stats.requests,
      assertions: stats.assertions,
      duration: timings.completed - timings.started,
      averageResponseTime: timings.responseAverage
    },
    featureTests,
    securityValidation: {
      authenticationProtection: securityTests.filter(t => t.item.name.includes('Unauthorized')).length > 0,
      inputValidation: securityTests.filter(t => t.item.name.includes('Validation')).length > 0,
      secretMasking: executions.filter(t => t.item.name.includes('Masked')).length > 0
    },
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