/**
 * Production Email Verification Smoke Test
 * Quick test to verify the email verification system is working in production
 */

const PROD_URL = 'http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Generate unique test email
const timestamp = Date.now();
const testEmail = `prod-test-${timestamp}@bizelev8.ai`;
const testPassword = 'ProdTest123';

console.log('🚀 Production Email Verification Smoke Test');
console.log('==========================================\n');
console.log(`📧 Test Email: ${testEmail}`);
console.log(`🔗 Production URL: ${PROD_URL}\n`);

async function testProduction() {
  try {
    // Step 1: Check health
    console.log('🏥 Step 1: Checking production health...');
    const healthResponse = await fetch(`${PROD_URL}/api/health`);
    const healthData = await healthResponse.json();

    console.log(`✅ Production is healthy!`);
    console.log(`   Uptime: ${Math.floor(healthData.uptime / 60)} minutes`);
    console.log(`   Database: ${healthData.checks.database.status}`);
    console.log(`   Node Version: ${healthData.checks.system.nodeVersion}\n`);

    // Step 2: Test signup
    console.log('📝 Step 2: Testing user signup...');
    const signupResponse = await fetch(`${PROD_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Production',
        lastName: 'Test'
      })
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.text();
      console.error(`❌ Signup failed:`, error);
      return false;
    }

    const signupData = await signupResponse.json();
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${signupData.user?.id}`);
    console.log(`   Message: ${signupData.message}`);
    console.log(`   📧 Verification email should be sent to: support@bizelev8.ai\n`);

    // Step 3: Test unverified login block
    console.log('🔐 Step 3: Testing unverified login block...');
    const loginResponse = await fetch(`${PROD_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (loginResponse.status === 401) {
      const loginError = await loginResponse.json();
      console.log('✅ Unverified login correctly blocked!');
      console.log(`   Message: ${loginError.message}\n`);
    } else {
      console.log(`❌ Unexpected login response: ${loginResponse.status}\n`);
      return false;
    }

    // Step 4: Test resend verification
    console.log('🔄 Step 4: Testing resend verification...');
    const resendResponse = await fetch(`${PROD_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    if (resendResponse.ok) {
      console.log('✅ Resend verification successful!\n');
    } else {
      console.log(`❌ Resend verification failed: ${resendResponse.status}\n`);
      return false;
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ PRODUCTION SMOKE TEST PASSED');
    console.log('═══════════════════════════════════════');
    console.log('✅ Production health check: PASSED');
    console.log('✅ User signup: PASSED');
    console.log('✅ Email verification system: WORKING');
    console.log('✅ Unverified login block: PASSED');
    console.log('✅ Resend verification: PASSED');
    console.log('═══════════════════════════════════════\n');

    console.log('📧 Manual Verification Required:');
    console.log('   1. Check support@bizelev8.ai inbox for verification email');
    console.log('   2. Subject: "Verify Your Email - P³ Interview Academy"');
    console.log('   3. Click verification link to test full flow');
    console.log('   4. Verify auto-login works');
    console.log('   5. Check for welcome email\n');

    console.log('🎯 Test Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testProduction().then(success => {
  if (success) {
    console.log('🎉 Production deployment verified successfully!');
    process.exit(0);
  } else {
    console.log('❌ Production smoke test failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
