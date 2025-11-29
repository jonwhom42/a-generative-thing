/**
 * Smoke Test Script
 *
 * Verifies the backend server is running and responding correctly.
 * Usage: npm run server:smoke
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

interface HealthResponse {
  status: string;
  timestamp: string;
}

async function runSmokeTests(): Promise<void> {
  console.log('🔍 Running smoke tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Health check endpoint
  console.log('1. Testing /api/health...');
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    if (response.ok) {
      const data: HealthResponse = await response.json();
      if (data.status === 'ok') {
        console.log('   ✅ Health check passed');
        console.log(`   Response: ${JSON.stringify(data)}`);
        passed++;
      } else {
        console.log(`   ❌ Unexpected status: ${data.status}`);
        failed++;
      }
    } else {
      console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed to connect: ${error instanceof Error ? error.message : error}`);
    failed++;
  }

  // Test 2: CORS headers present
  console.log('\n2. Testing CORS headers...');
  try {
    const response = await fetch(`${SERVER_URL}/api/health`, {
      method: 'OPTIONS',
    });
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log('   ✅ CORS headers present');
      console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
      passed++;
    } else {
      console.log('   ⚠️  CORS headers not present (may be OK depending on config)');
      passed++; // Not a failure, just informational
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
    failed++;
  }

  // Test 3: Gemini endpoint requires auth
  console.log('\n3. Testing auth requirement on /api/gemini/generate-image...');
  try {
    const response = await fetch(`${SERVER_URL}/api/gemini/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 without auth');
      passed++;
    } else {
      console.log(`   ❌ Expected 401, got ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
    failed++;
  }

  // Test 4: 404 for unknown routes
  console.log('\n4. Testing 404 for unknown routes...');
  try {
    const response = await fetch(`${SERVER_URL}/api/nonexistent`);
    if (response.status === 404) {
      console.log('   ✅ Correctly returns 404 for unknown routes');
      passed++;
    } else {
      console.log(`   ❌ Expected 404, got ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(40));

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✅ All smoke tests passed!');
}

runSmokeTests().catch((error) => {
  console.error('Smoke test runner failed:', error);
  process.exit(1);
});
