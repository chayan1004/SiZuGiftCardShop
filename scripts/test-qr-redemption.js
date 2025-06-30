#!/usr/bin/env node

import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  collection: path.join(__dirname, '..', 'postman', 'phase4-qr-redemption.postman_collection.json'),
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  delayRequest: 2000, // 2 second delay between requests
  timeout: 30000, // 30 second timeout
  environment: {
    id: 'qr-test-env',
    name: 'QR Redemption Test Environment',
    values: [
      {
        key: 'baseUrl',
        value: process.env.BASE_URL || 'http://localhost:5000',
        enabled: true
      }
    ]
  }
};

console.log('\n🔍 Phase 4: QR Scanner Mobile POS Redemption Test Suite');
console.log('='.repeat(60));
console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
console.log(`📋 Collection: ${CONFIG.collection}`);
console.log(`⏱️  Request Delay: ${CONFIG.delayRequest}ms`);
console.log('='.repeat(60));

// Run Newman tests
newman.run({
  collection: CONFIG.collection,
  environment: CONFIG.environment,
  delayRequest: CONFIG.delayRequest,
  timeout: CONFIG.timeout,
  reporters: ['cli', 'json'],
  reporter: {
    json: {
      export: path.join(__dirname, '..', 'test-results-qr-redemption.json')
    }
  }
}, function (err, summary) {
  if (err) {
    console.error('\n❌ Error running tests:', err);
    process.exit(1);
  }

  console.log('\n📊 QR REDEMPTION TEST RESULTS');
  console.log('='.repeat(50));
  
  // Test statistics
  const stats = summary.run.stats;
  console.log(`📝 Total Requests: ${stats.requests.total}`);
  console.log(`✅ Passed: ${stats.requests.total - stats.requests.failed}`);
  console.log(`❌ Failed: ${stats.requests.failed}`);
  console.log(`⏱️  Average Response Time: ${Math.round(stats.requests.average)}ms`);
  
  // Test breakdown by folder
  console.log('\n📁 TEST BREAKDOWN:');
  
  let authPassed = 0, authTotal = 0;
  let validationPassed = 0, validationTotal = 0;
  let redemptionPassed = 0, redemptionTotal = 0;
  let fraudPassed = 0, fraudTotal = 0;
  let errorPassed = 0, errorTotal = 0;
  let dbPassed = 0, dbTotal = 0;
  
  summary.run.executions.forEach(execution => {
    const isSuccess = execution.assertions?.every(assertion => !assertion.error);
    const folderName = execution.item.parent()?.name || 'Unknown';
    
    switch (folderName) {
      case 'Authentication Setup':
        authTotal++;
        if (isSuccess) authPassed++;
        break;
      case 'QR Validation Tests':
        validationTotal++;
        if (isSuccess) validationPassed++;
        break;
      case 'QR Redemption Tests':
        redemptionTotal++;
        if (isSuccess) redemptionPassed++;
        break;
      case 'Fraud Detection Tests':
        fraudTotal++;
        if (isSuccess) fraudPassed++;
        break;
      case 'Error Handling Tests':
        errorTotal++;
        if (isSuccess) errorPassed++;
        break;
      case 'Database Integration Tests':
        dbTotal++;
        if (isSuccess) dbPassed++;
        break;
    }
  });
  
  console.log(`🔐 Authentication: ${authPassed}/${authTotal} passed`);
  console.log(`✅ QR Validation: ${validationPassed}/${validationTotal} passed`);
  console.log(`💳 QR Redemption: ${redemptionPassed}/${redemptionTotal} passed`);
  console.log(`🛡️  Fraud Detection: ${fraudPassed}/${fraudTotal} passed`);
  console.log(`⚠️  Error Handling: ${errorPassed}/${errorTotal} passed`);
  console.log(`💾 Database Integration: ${dbPassed}/${dbTotal} passed`);
  
  // Failed test details
  if (stats.requests.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    summary.run.executions.forEach(execution => {
      if (execution.assertions?.some(assertion => assertion.error)) {
        console.log(`   • ${execution.item.name}`);
        execution.assertions.forEach(assertion => {
          if (assertion.error) {
            console.log(`     ↳ ${assertion.error.message}`);
          }
        });
      }
    });
  }
  
  // Success indicators
  const successRate = ((stats.requests.total - stats.requests.failed) / stats.requests.total * 100).toFixed(1);
  console.log(`\n📈 Overall Success Rate: ${successRate}%`);
  
  if (stats.requests.failed === 0) {
    console.log('\n🎉 ALL QR REDEMPTION TESTS PASSED!');
    console.log('✨ Mobile POS system is fully functional');
    console.log('🔒 Fraud detection is working correctly');
    console.log('💾 Database logging is operational');
    console.log('📱 QR scanner ready for production use');
  } else {
    console.log(`\n⚠️  ${stats.requests.failed} test(s) failed - review above for details`);
  }
  
  console.log('\n🔍 PHASE 4 VERIFICATION COMPLETE');
  console.log('='.repeat(50));
  console.log('📋 Test report saved to: test-results-qr-redemption.json');
  console.log('📱 QR Scanner available at: /merchant-qr-scanner');
  console.log('🛡️  Fraud detection: Active');
  console.log('💳 Redemption tracking: Enabled');
  
  // Exit with appropriate code
  process.exit(stats.requests.failed > 0 ? 1 : 0);
});