#!/usr/bin/env node

import newman from 'newman';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI Test Runner for SiZu Gift Card API Tests
console.log('🧪 Starting SiZu Gift Card API Test Suite...\n');

const collectionPath = path.join(__dirname, '../postman/sizu-giftcard-tests.postman_collection.json');

// Verify collection file exists
if (!fs.existsSync(collectionPath)) {
  console.error('❌ Error: Postman collection not found at:', collectionPath);
  process.exit(1);
}

// Newman configuration
const options = {
  collection: collectionPath,
  environment: {
    id: 'test-env',
    name: 'Test Environment',
    values: [
      {
        key: 'baseUrl',
        value: process.env.BASE_URL || 'http://localhost:5000',
        enabled: true
      }
    ]
  },
  reporters: ['cli', 'json'],
  reporter: {
    json: {
      export: path.join(__dirname, '../test-results.json')
    }
  },
  delayRequest: 2000, // 2 second delay between requests to allow processing
  timeout: 30000, // 30 second timeout for each request
  insecure: true, // Allow self-signed certificates in development
  color: 'on'
};

// Run the test suite
newman.run(options, (err, summary) => {
  if (err) {
    console.error('❌ Newman execution failed:', err);
    process.exit(1);
  }

  console.log('\n📊 Test Suite Results:');
  console.log('='.repeat(50));
  
  const stats = summary.run.stats;
  const failures = summary.run.failures;
  
  console.log(`Total Requests: ${stats.requests.total}`);
  console.log(`Requests Failed: ${stats.requests.failed}`);
  console.log(`Test Assertions: ${stats.assertions.total}`);
  console.log(`Assertions Failed: ${stats.assertions.failed}`);
  console.log(`Average Response Time: ${Math.round(stats.requests.average)}ms`);
  
  if (failures.length > 0) {
    console.log('\n❌ Test Failures:');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.error.test || failure.error.name}`);
      console.log(`   ${failure.error.message}`);
      if (failure.source) {
        console.log(`   Request: ${failure.source.name}`);
      }
    });
    console.log('\n💡 Check server logs and ensure all services are running properly.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed successfully!');
    console.log('🎉 Gift card order flow is working correctly.');
    
    // Log test summary to file
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Test Suite PASSED - ${stats.assertions.total} assertions, ${Math.round(stats.requests.average)}ms avg response\n`;
    fs.appendFileSync(path.join(__dirname, '../test-history.log'), logEntry);
    
    process.exit(0);
  }
});

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n⚠️ Test suite interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception during test execution:', error);
  process.exit(1);
});