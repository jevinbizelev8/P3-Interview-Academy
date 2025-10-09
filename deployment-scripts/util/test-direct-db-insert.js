/**
 * Test direct database insert to isolate the issue
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const prodDbUrl = 'postgresql://app_user:ZgVs0A8jEJurQezzkp37txtJ@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres';

const pool = new Pool({
  connectionString: prodDbUrl,
  ssl: { rejectUnauthorized: false }
});

async function testDirectInsert() {
  console.log('🔍 Testing Direct Database Insert\n');

  try {
    const testUser = {
      id: crypto.randomUUID(),
      email: `db-test-${Date.now()}@bizelev8.ai`,
      firstName: 'Database',
      lastName: 'Test',
      passwordHash: '$2b$12$testtesthash',  // Dummy hash
      emailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      role: 'user',
      authProvider: 'local'
    };

    console.log('Attempting to insert user:');
    console.log(JSON.stringify(testUser, null, 2));
    console.log('');

    const insertQuery = `
      INSERT INTO users (
        id, email, first_name, last_name, password_hash,
        email_verified, email_verification_token, email_verification_expires,
        role, auth_provider, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING id, email, email_verified;
    `;

    const result = await pool.query(insertQuery, [
      testUser.id,
      testUser.email,
      testUser.firstName,
      testUser.lastName,
      testUser.passwordHash,
      testUser.emailVerified,
      testUser.emailVerificationToken,
      testUser.emailVerificationExpires,
      testUser.role,
      testUser.authProvider
    ]);

    console.log('✅ Insert successful!');
    console.log('Result:', result.rows[0]);
    console.log('');
    console.log('This confirms the database schema is working correctly.');
    console.log('The issue must be in the application code or email sending.');

  } catch (error) {
    console.error('❌ Insert failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testDirectInsert().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
