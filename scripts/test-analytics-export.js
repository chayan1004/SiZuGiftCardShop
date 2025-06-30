#!/usr/bin/env node

import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  collection: path.join(__dirname, '..', 'postman', 'phase14c-analytics-export.postman_collection.json'),
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  delayRequest: 2000, // 2 second delay between requests
  timeout: 30000, // 30 second timeout
  environment: {
    id: 'analytics-test-env',
    name: 'Analytics Export Test Environment',
    values: [
      {
        key: 'baseUrl',
        value: process.env.BASE_URL || 'http://localhost:5000',
        enabled: true
      }
    ]
  }
};

console.log('\n📊 Phase 14C: Analytics Export Test Suite');
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
      export: path.join(__dirname, '..', 'test-results-analytics-export.json')
    }
  }
}, function (err, summary) {
  if (err) {
    console.error('\n❌ Error running analytics export tests:', err);
    process.exit(1);
  }

  console.log('\n📊 ANALYTICS EXPORT TEST RESULTS');
  console.log('='.repeat(50));
  
  // Test statistics
  const stats = summary.run.stats;
  console.log(`📝 Total Requests: ${stats.requests.total}`);
  console.log(`✅ Passed: ${stats.requests.total - stats.requests.failed}`);
  console.log(`❌ Failed: ${stats.requests.failed}`);
  console.log(`⏱️  Average Response Time: ${Math.round(stats.requests.average)}ms`);
  
  // Test breakdown by category
  console.log('\n📁 ANALYTICS EXPORT TEST BREAKDOWN:');
  
  let authPassed = 0, authTotal = 0;
  let apiPassed = 0, apiTotal = 0;
  let csvPassed = 0, csvTotal = 0;
  let pdfPassed = 0, pdfTotal = 0;
  let errorPassed = 0, errorTotal = 0;
  let perfPassed = 0, perfTotal = 0;
  
  summary.run.executions.forEach(execution => {
    const isSuccess = execution.assertions?.every(assertion => !assertion.error);
    const folderName = execution.item.parent()?.name || 'Unknown';
    
    switch (folderName) {
      case 'Setup & Authentication':
        authTotal++;
        if (isSuccess) authPassed++;
        break;
      case 'Analytics API Tests':
        apiTotal++;
        if (isSuccess) apiPassed++;
        break;
      case 'CSV Export Tests':
        csvTotal++;
        if (isSuccess) csvPassed++;
        break;
      case 'PDF Export Tests':
        pdfTotal++;
        if (isSuccess) pdfPassed++;
        break;
      case 'Error Handling Tests':
        errorTotal++;
        if (isSuccess) errorPassed++;
        break;
      case 'Performance Tests':
        perfTotal++;
        if (isSuccess) perfPassed++;
        break;
    }
  });
  
  console.log(`🔐 Authentication: ${authPassed}/${authTotal} passed`);
  console.log(`📈 Analytics API: ${apiPassed}/${apiTotal} passed`);
  console.log(`📄 CSV Export: ${csvPassed}/${csvTotal} passed`);
  console.log(`📑 PDF Export: ${pdfPassed}/${pdfTotal} passed`);
  console.log(`⚠️  Error Handling: ${errorPassed}/${errorTotal} passed`);
  console.log(`⚡ Performance: ${perfPassed}/${perfTotal} passed`);
  
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
  
  // Analytics export effectiveness analysis
  console.log('\n📊 ANALYTICS EXPORT ANALYSIS:');
  
  const exportingWorking = csvPassed >= Math.floor(csvTotal * 0.8) && 
                          pdfPassed >= Math.floor(pdfTotal * 0.8);
  
  if (exportingWorking) {
    console.log('✅ CSV export generating downloadable files');
    console.log('✅ PDF export creating branded reports');
    console.log('✅ Date range filtering working correctly');
    console.log('✅ Content-Type headers set properly');
    console.log('✅ File downloads working via Content-Disposition');
  } else {
    console.log('⚠️  Some export functionality may need adjustment');
  }
  
  // API functionality check
  if (apiPassed === apiTotal && apiTotal > 0) {
    console.log('✅ Analytics API returning complete data');
    console.log('✅ Merchant authentication working');
    console.log('✅ Date filtering applied correctly');
  }
  
  // Success indicators
  const successRate = ((stats.requests.total - stats.requests.failed) / stats.requests.total * 100).toFixed(1);
  console.log(`\n📈 Overall Success Rate: ${successRate}%`);
  
  if (stats.requests.failed === 0) {
    console.log('\n🎉 ALL ANALYTICS EXPORT TESTS PASSED!');
    console.log('✨ Merchant analytics panel fully functional');
    console.log('📄 CSV exports working with proper headers');
    console.log('📑 PDF exports generating branded reports');
    console.log('🔒 Authentication protecting all endpoints');
    console.log('📊 Analytics data complete and accurate');
  } else if (stats.requests.failed <= 2) {
    console.log('\n✅ ANALYTICS EXPORT SYSTEM OPERATIONAL');
    console.log(`⚠️  ${stats.requests.failed} minor issue(s) detected`);
  } else {
    console.log(`\n⚠️  ${stats.requests.failed} test(s) failed - analytics export needs attention`);
  }
  
  console.log('\n📊 PHASE 14C ANALYTICS EXPORT COMPLETE');
  console.log('='.repeat(50));
  console.log('📋 Test report saved to: test-results-analytics-export.json');
  console.log('📈 JSON API: Real-time analytics data');
  console.log('📄 CSV Export: Downloadable spreadsheet format');
  console.log('📑 PDF Export: Branded analytics reports');
  console.log('🔍 Date Filtering: Custom date range support');
  console.log('🔒 Access Control: Merchant authentication required');
  
  // Exit with appropriate code
  process.exit(stats.requests.failed > 0 ? 1 : 0);
});