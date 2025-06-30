#!/usr/bin/env node

import newman from 'newman';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  collection: path.join(__dirname, '..', 'postman', 'phase14d-webhook-redemption.postman_collection.json'),
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  delayRequest: 2000,
  reporters: ['cli', 'json'],
  reporter: {
    json: {
      export: path.join(__dirname, '..', 'test-results', 'phase14d-webhook-results.json')
    }
  }
};

console.log('\n🎯 Phase 14D: Webhook Trigger on Redemption Test Suite');
console.log('='.repeat(65));
console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
console.log(`📋 Collection: ${CONFIG.collection}`);
console.log(`⏱️  Request Delay: ${CONFIG.delayRequest}ms`);
console.log(`🔐 Security: HMAC-SHA256 signature verification`);
console.log(`🧪 Mock Endpoint: /api/test/mock-webhook`);
console.log('='.repeat(65));

// Ensure test results directory exists
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

newman.run({
  collection: CONFIG.collection,
  delayRequest: CONFIG.delayRequest,
  reporters: CONFIG.reporters,
  reporter: CONFIG.reporter,
  globals: {
    values: [
      { key: 'baseUrl', value: CONFIG.baseUrl, type: 'string' }
    ]
  },
  iterationCount: 1,
  bail: false,
  color: 'on'
}, function (err, summary) {
  if (err) {
    console.error('\n❌ Newman execution failed:', err);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(65));
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('='.repeat(65));

  const stats = summary.run.stats;
  const failures = summary.run.failures;

  console.log(`✅ Total Tests: ${stats.tests.total}`);
  console.log(`✅ Passed: ${stats.tests.total - stats.tests.failed}`);
  console.log(`❌ Failed: ${stats.tests.failed}`);
  console.log(`📡 Total Requests: ${stats.requests.total}`);
  console.log(`⏱️  Average Response Time: ${Math.round(stats.requests.average)}ms`);

  if (failures.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    console.log('-'.repeat(50));
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.error.test || 'Unknown test'}`);
      console.log(`   📍 ${failure.source.name || 'Unknown request'}`);
      console.log(`   ❌ ${failure.error.message}`);
      console.log('');
    });
  }

  // Webhook-specific validation
  console.log('\n🔗 WEBHOOK VALIDATION RESULTS:');
  console.log('-'.repeat(50));
  
  const webhookTests = [
    'Webhook URL configured',
    'Webhook test successful', 
    'Gift card redemption successful',
    'Mock webhook responds correctly',
    'Invalid signature rejected'
  ];

  webhookTests.forEach(testName => {
    const testPassed = !failures.some(f => f.error.test === testName);
    console.log(`${testPassed ? '✅' : '❌'} ${testName}`);
  });

  console.log('\n🎯 PHASE 14D COMPLETION STATUS:');
  console.log('-'.repeat(50));
  console.log(`${stats.tests.failed === 0 ? '✅' : '❌'} All webhook tests passing`);
  console.log(`${stats.tests.failed === 0 ? '✅' : '❌'} HMAC-SHA256 security verified`);
  console.log(`${stats.tests.failed === 0 ? '✅' : '❌'} Redemption webhooks operational`);
  console.log(`${stats.tests.failed === 0 ? '✅' : '❌'} Phase 14D production ready`);

  if (stats.tests.failed === 0) {
    console.log('\n🎉 Phase 14D: Webhook Trigger on Redemption - COMPLETE');
    console.log('   Secure merchant automation system is production ready!');
  } else {
    console.log('\n⚠️  Phase 14D has test failures - review and fix before deployment');
  }

  console.log('\n' + '='.repeat(65));
  
  process.exit(stats.tests.failed > 0 ? 1 : 0);
});