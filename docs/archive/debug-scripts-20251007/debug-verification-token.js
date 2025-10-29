/**
 * Debug script to check verification token in database
 */

import pg from 'pg';

const { Pool } = pg;

// Use DATABASE_URL environment variable for security
const stagingDbUrl = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;

if (!stagingDbUrl) {
  console.error('❌ Error: STAGING_DATABASE_URL or DATABASE_URL environment variable is required');
  console.error('   Set it before running this script:');
  console.error('   export STAGING_DATABASE_URL="postgresql://user:pass@host:port/p3_staging"');
  process.exit(1);
}

const pool = new Pool({
  connectionString: stagingDbUrl,
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

const testEmail = 'test-user-1759840455640@bizelev8.ai';

async function debugVerificationToken() {
  console.log('🔍 Debugging verification token for:', testEmail);
  console.log('================================================\n');

  try {
    // Get user from database
    const userQuery = await pool.query(
      'SELECT id, email, email_verified, email_verification_token, email_verification_expires, created_at FROM users WHERE email = $1',
      [testEmail]
    );

    if (userQuery.rows.length === 0) {
      console.log('❌ User not found in database!');
      console.log('   Email:', testEmail);
      console.log('\n📋 All users in database:');
      const allUsers = await pool.query('SELECT email, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10');
      console.table(allUsers.rows);
      return;
    }

    const user = userQuery.rows[0];
    console.log('✅ User found in database:\n');
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    console.log('✓ Email Verified:', user.email_verified);
    console.log('🔑 Token:', user.email_verification_token);
    console.log('⏰ Token Expires:', user.email_verification_expires);
    console.log('📅 Created At:', user.created_at);
    console.log('');

    if (!user.email_verification_token) {
      console.log('⚠️  WARNING: No verification token in database!');
      console.log('   This means the token was not saved during signup.');
      console.log('   Check the signup endpoint logic.\n');
      return;
    }

    if (user.email_verified) {
      console.log('✅ Email already verified!');
      console.log('   The user can now log in.\n');
      return;
    }

    // Check if token is expired
    const now = new Date();
    const expires = new Date(user.email_verification_expires);
    const isExpired = now > expires;

    if (isExpired) {
      console.log('⚠️  Token is EXPIRED:');
      console.log(`   Expired: ${expires.toISOString()}`);
      console.log(`   Now: ${now.toISOString()}`);
      console.log(`   Time difference: ${Math.round((now - expires) / 1000 / 60)} minutes ago\n`);
    } else {
      console.log('✅ Token is still valid:');
      console.log(`   Expires: ${expires.toISOString()}`);
      console.log(`   Now: ${now.toISOString()}`);
      console.log(`   Time remaining: ${Math.round((expires - now) / 1000 / 60 / 60)} hours\n`);
    }

    // Test the verification endpoint
    console.log('🧪 Testing verification endpoint...');
    const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';
    const verifyUrl = `${STAGING_URL}/api/auth/verify-email?token=${user.email_verification_token}`;

    console.log('📡 Request URL:', verifyUrl);
    console.log('');

    const response = await fetch(verifyUrl);
    const responseData = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ Verification successful!');

      // Check database again
      const updatedUser = await pool.query(
        'SELECT email_verified, email_verification_token FROM users WHERE email = $1',
        [testEmail]
      );
      console.log('📊 Updated user status:');
      console.log('   Email Verified:', updatedUser.rows[0].email_verified);
      console.log('   Token (should be null):', updatedUser.rows[0].email_verification_token);
    } else {
      console.log('❌ Verification failed!');
      console.log('   Status:', response.status);
      console.log('   Message:', responseData.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the debug script
debugVerificationToken().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
