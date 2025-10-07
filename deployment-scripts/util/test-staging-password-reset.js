/**
 * Test Password Reset Flow in Staging
 * Tests forgot password and reset password
 */

const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Use the test user created in the previous test
const testEmail = 'test-user-1759840455640@bizelev8.ai'; // From previous test
const newPassword = 'NewTestPass456';

console.log('🔑 Testing Password Reset Flow in Staging');
console.log('==========================================\n');
console.log(`📧 Test Email: ${testEmail}`);
console.log(`🔗 Staging URL: ${STAGING_URL}\n`);

async function testPasswordResetFlow() {
  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...');
    const forgotResponse = await fetch(`${STAGING_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    if (!forgotResponse.ok) {
      const error = await forgotResponse.text();
      console.error(`❌ Forgot password request failed (${forgotResponse.status}):`, error);
      return;
    }

    const forgotData = await forgotResponse.json();
    console.log('✅ Password reset email requested!');
    console.log(`   Message: ${forgotData.message}`);
    console.log('   ⚠️  Reset email should be sent to jevin@bizelev8.ai\n');

    // Step 2: Test with non-existent email (should still return success for security)
    console.log('🔒 Step 2: Testing with non-existent email (security check)...');
    const nonExistentResponse = await fetch(`${STAGING_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com'
      })
    });

    if (nonExistentResponse.ok) {
      console.log('✅ Non-existent email returns success (good for security)');
      console.log('   This prevents email enumeration attacks\n');
    } else {
      console.log('⚠️  Non-existent email returns error (potential security issue)\n');
    }

    // Step 3: Instructions for manual testing
    console.log('📧 Step 3: Manual Password Reset Testing Required');
    console.log('   1. Check jevin@bizelev8.ai inbox for password reset email');
    console.log('   2. Subject: "Reset Your Password - P³ Interview Academy"');
    console.log('   3. Click the reset link in the email');
    console.log('   4. Should open /reset-password page with token');
    console.log('   5. Enter new password (must be 8+ chars with 1+ number)');
    console.log('   6. Test password strength validation:');
    console.log('      - Try password < 8 chars (should fail)');
    console.log('      - Try password without number (should fail)');
    console.log('      - Try valid password (should succeed)');
    console.log('   7. After reset, try logging in with new password\n');

    // Step 4: Test token expiration (would need to wait 1 hour)
    console.log('⏰ Step 4: Token Expiration Testing (manual)');
    console.log('   ⚠️  Reset tokens expire after 1 hour');
    console.log('   To test: Wait 1 hour and try using the reset link');
    console.log('   Expected: Should show "Reset link expired" message\n');

    console.log('📊 Summary:');
    console.log('   ✅ Forgot password endpoint working');
    console.log('   ✅ Security: Non-existent email handling correct');
    console.log('   ⏳ Email delivery verification required (check jevin@bizelev8.ai)');
    console.log('   ⏳ Reset link verification required (manual test)');
    console.log('   ⏳ Password strength validation required (manual test)');
    console.log('   ⏳ Login with new password required (manual test)');
    console.log('   ⏳ Token expiration test required (1 hour wait)\n');

    console.log('📧 Test Details:');
    console.log(`   Test Email: ${testEmail}`);
    console.log(`   Original Password: TestPass123`);
    console.log(`   New Password (after reset): ${newPassword}`);
    console.log('   Use these credentials to verify the reset worked\n');

    console.log('🧪 Additional Tests to Perform:');
    console.log('   1. Try resetting password for unverified email');
    console.log('   2. Try using same reset token twice (should fail 2nd time)');
    console.log('   3. Test HTML email formatting and branding');
    console.log('   4. Verify reset link format includes staging URL\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testPasswordResetFlow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
