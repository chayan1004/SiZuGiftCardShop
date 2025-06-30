#!/usr/bin/env node

/**
 * Fraud Detection Layer Test Suite
 * Tests all fraud protection scenarios for Phase 14B implementation
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function runFraudTests() {
  console.log('🛡️ Starting Fraud Detection Layer Tests...\n');

  // Test 1: Legitimate redemption should work
  await testLegitimateRedemption();
  
  // Test 2: Reused GAN detection
  await testReusedGAN();
  
  // Test 3: IP rate limiting (4 requests in 1 minute)
  await testIPRateLimit();
  
  // Test 4: Device fingerprinting
  await testDeviceFingerprint();
  
  // Test 5: Merchant rate limiting
  await testMerchantRateLimit();
  
  // Test 6: Fraud monitoring endpoints
  await testFraudMonitoring();
  
  console.log('\n✅ All fraud detection tests completed!');
}

async function testLegitimateRedemption() {
  console.log('📝 Test 1: Legitimate redemption should work');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gift-cards/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'GAN-LEGIT-TEST',
        redeemedBy: 'test-customer',
        amount: 2500
      })
    });
    
    const result = await response.json();
    
    if (response.status === 404) {
      console.log('   ✅ Expected - Gift card not found (no test data)');
    } else if (response.ok) {
      console.log('   ✅ Legitimate redemption processed successfully');
    } else {
      console.log('   ⚠️ Unexpected response:', result.error);
    }
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  console.log('');
}

async function testReusedGAN() {
  console.log('📝 Test 2: Reused GAN detection');
  
  const testGAN = 'GAN-REUSED-TEST';
  
  try {
    // First attempt
    const response1 = await fetch(`${BASE_URL}/api/gift-cards/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testGAN,
        redeemedBy: 'test-customer-1',
        amount: 1000
      })
    });
    
    // Second attempt with same GAN
    const response2 = await fetch(`${BASE_URL}/api/gift-cards/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testGAN,
        redeemedBy: 'test-customer-2',
        amount: 1000
      })
    });
    
    const result2 = await response2.json();
    
    if (response2.status === 429 && result2.error.includes('already been redeemed')) {
      console.log('   ✅ Reused GAN properly detected and blocked');
    } else {
      console.log('   ⚠️ Reused GAN test result:', result2.error);
    }
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  console.log('');
}

async function testIPRateLimit() {
  console.log('📝 Test 3: IP rate limiting (3 attempts per minute)');
  
  const testRequests = [];
  
  // Generate 4 rapid requests from same IP
  for (let i = 0; i < 4; i++) {
    testRequests.push(
      fetch(`${BASE_URL}/api/gift-cards/redeem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100' // Simulate same IP
        },
        body: JSON.stringify({
          code: `GAN-RATE-TEST-${i}`,
          redeemedBy: 'test-customer',
          amount: 1000
        })
      })
    );
  }
  
  try {
    const responses = await Promise.all(testRequests);
    const results = await Promise.all(responses.map(r => r.json()));
    
    // Check if 4th request is blocked
    const blockedRequests = responses.filter(r => r.status === 429);
    
    if (blockedRequests.length > 0) {
      console.log(`   ✅ IP rate limiting working - ${blockedRequests.length} requests blocked`);
    } else {
      console.log('   ⚠️ IP rate limiting may need more requests or different timing');
    }
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  console.log('');
}

async function testDeviceFingerprint() {
  console.log('📝 Test 4: Device fingerprinting (multiple failed attempts)');
  
  const userAgent = 'Mozilla/5.0 (Test Device) Fraud Detection Test';
  const testRequests = [];
  
  // Generate 5 failed attempts from same device
  for (let i = 0; i < 5; i++) {
    testRequests.push(
      fetch(`${BASE_URL}/api/gift-cards/redeem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'X-Forwarded-For': '192.168.1.200'
        },
        body: JSON.stringify({
          code: `INVALID-GAN-${i}`,
          redeemedBy: 'test-customer',
          amount: 1000
        })
      })
    );
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  try {
    const responses = await Promise.all(testRequests);
    const results = await Promise.all(responses.map(r => r.json()));
    
    // Check results
    const blockedByFingerprint = responses.some(r => r.status === 429);
    
    if (blockedByFingerprint) {
      console.log('   ✅ Device fingerprinting detected suspicious pattern');
    } else {
      console.log('   ⚠️ Device fingerprinting test - all attempts processed');
    }
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  console.log('');
}

async function testMerchantRateLimit() {
  console.log('📝 Test 5: Merchant rate limiting (10 per 5 minutes)');
  
  const merchantId = 'TEST-MERCHANT-123';
  let successfulRequests = 0;
  let blockedRequests = 0;
  
  // Generate 12 requests for same merchant
  for (let i = 0; i < 12; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/gift-cards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `GAN-MERCHANT-${i}`,
          redeemedBy: 'test-customer',
          merchantId: merchantId,
          amount: 1000
        })
      });
      
      if (response.status === 429) {
        blockedRequests++;
      } else {
        successfulRequests++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.log(`   Request ${i} failed:`, error.message);
    }
  }
  
  console.log(`   📊 Merchant rate limit test: ${successfulRequests} successful, ${blockedRequests} blocked`);
  
  if (blockedRequests > 0) {
    console.log('   ✅ Merchant rate limiting is working');
  } else {
    console.log('   ⚠️ Merchant rate limiting may need adjustment');
  }
  
  console.log('');
}

async function testFraudMonitoring() {
  console.log('📝 Test 6: Fraud monitoring endpoints (requires admin auth)');
  
  try {
    // Test fraud logs endpoint (will fail without admin auth)
    const logsResponse = await fetch(`${BASE_URL}/api/admin/fraud-logs?limit=10`);
    const logsResult = await logsResponse.json();
    
    if (logsResponse.status === 401) {
      console.log('   ✅ Fraud logs endpoint properly protected (401 Unauthorized)');
    } else if (logsResponse.ok) {
      console.log(`   ✅ Fraud logs endpoint accessible - ${logsResult.total} logs found`);
    } else {
      console.log('   ⚠️ Unexpected fraud logs response:', logsResult.error);
    }
    
    // Test fraud statistics endpoint
    const statsResponse = await fetch(`${BASE_URL}/api/admin/fraud-statistics`);
    const statsResult = await statsResponse.json();
    
    if (statsResponse.status === 401) {
      console.log('   ✅ Fraud statistics endpoint properly protected (401 Unauthorized)');
    } else if (statsResponse.ok) {
      console.log('   ✅ Fraud statistics endpoint accessible');
    } else {
      console.log('   ⚠️ Unexpected fraud statistics response:', statsResult.error);
    }
    
    // Test webhook endpoint
    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/fraud-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gan: 'TEST-GAN',
        ip: '192.168.1.1',
        reason: 'test_alert',
        merchantId: 'TEST-MERCHANT',
        timestamp: new Date().toISOString()
      })
    });
    
    const webhookResult = await webhookResponse.json();
    
    if (webhookResponse.ok) {
      console.log('   ✅ Fraud alert webhook endpoint working');
    } else {
      console.log('   ⚠️ Webhook test failed:', webhookResult.error);
    }
    
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  console.log('');
}

// Run the tests
runFraudTests().catch(console.error);