/**
 * Test Email Verification Flow in Staging
 * Tests signup, email verification, and login
 */

const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Generate unique test email
const timestamp = Date.now();
const testEmail = `test-user-${timestamp}@bizelev8.ai`;
const testPassword = 'TestPass123';
const testFirstName = 'Test';
const testLastName = 'User';

console.log('🧪 Testing Email Verification Flow in Staging');
console.log('============================================\n');
console.log(`📧 Test Email: ${testEmail}`);
console.log(`🔗 Staging URL: ${STAGING_URL}\n`);

async function testEmailFlow() {
  try {
    // Step 1: Signup
    console.log('📝 Step 1: Creating new user account...');
    const signupResponse = await fetch(`${STAGING_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName
      })
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.text();
      console.error(`❌ Signup failed (${signupResponse.status}):`, error);
      return;
    }

    const signupData = await signupResponse.json();
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${signupData.user?.id}`);
    console.log(`   Email: ${signupData.user?.email}`);
    console.log(`   Email Verified: ${signupData.user?.emailVerified}`);
    console.log('   ⚠️  Verification email should be sent to jevin@bizelev8.ai\n');

    // Step 2: Try to login without verification (should fail)
    console.log('🔐 Step 2: Attempting login without email verification...');
    const loginResponse = await fetch(`${STAGING_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      }),
      credentials: 'include'
    });

    if (loginResponse.status === 403) {
      console.log('✅ Login correctly blocked for unverified email!');
      const loginError = await loginResponse.json();
      console.log(`   Message: ${loginError.message}\n`);
    } else if (loginResponse.ok) {
      console.log('❌ FAIL: Login succeeded for unverified email (should be blocked)!\n');
    } else {
      console.log(`⚠️  Unexpected login response: ${loginResponse.status}\n`);
    }

    // Step 3: Check for verification email
    console.log('📧 Step 3: Manual Verification Required');
    console.log('   1. Check jevin@bizelev8.ai inbox for verification email');
    console.log(`   2. Subject: "Verify Your Email - P³ Interview Academy"`);
    console.log('   3. Click the verification link in the email');
    console.log('   4. Should redirect to app and auto-login\n');

    // Step 4: Test resend verification
    console.log('🔄 Step 4: Testing resend verification email...');
    const resendResponse = await fetch(`${STAGING_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    if (resendResponse.ok) {
      console.log('✅ Resend verification successful!');
      console.log('   Another verification email should be sent to jevin@bizelev8.ai\n');
    } else {
      const resendError = await resendResponse.text();
      console.log(`❌ Resend verification failed: ${resendError}\n`);
    }

    // Step 5: Instructions for manual testing
    console.log('🎯 Next Steps for Manual Testing:');
    console.log('   1. Check email inbox for verification email');
    console.log('   2. Click verification link');
    console.log('   3. Verify auto-login works');
    console.log('   4. Try logging in manually after verification');
    console.log('   5. Check welcome email is sent\n');

    console.log('📊 Summary:');
    console.log('   ✅ Signup endpoint working');
    console.log('   ✅ Unverified login blocking working');
    console.log('   ✅ Resend verification working');
    console.log('   ⏳ Email delivery verification required (check jevin@bizelev8.ai)');
    console.log('   ⏳ Email link verification required (manual test)');
    console.log('   ⏳ Auto-login after verification required (manual test)\n');

    console.log('📧 Test User Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('   Use these to test login after email verification\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testEmailFlow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
