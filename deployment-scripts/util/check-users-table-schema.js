/**
 * Check the actual schema of the users table in staging
 */

import pg from 'pg';

const { Pool } = pg;

const stagingDbUrl = 'postgresql://app_user:<PASSWORD>@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging';

const pool = new Pool({
  connectionString: stagingDbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkUsersTableSchema() {
  console.log('🔍 Checking users table schema in staging...\n');

  try {
    // Get all columns from users table
    const columnsQuery = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Users Table Columns:\n');
    console.table(columnsQuery.rows);

    // Check specifically for email verification columns
    const emailVerifColumns = columnsQuery.rows.filter(col =>
      col.column_name.includes('email_verif') ||
      col.column_name.includes('emailVerif')
    );

    console.log('\n📧 Email Verification Columns:');
    if (emailVerifColumns.length === 0) {
      console.log('   ❌ No email verification columns found!');
      console.log('   Expected columns:');
      console.log('      - email_verified (or emailVerified)');
      console.log('      - email_verification_token (or emailVerificationToken)');
      console.log('      - email_verification_expires (or emailVerificationExpires)');
    } else {
      emailVerifColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });
    }

    // Check for password reset columns
    const passwordResetColumns = columnsQuery.rows.filter(col =>
      col.column_name.includes('password_reset') ||
      col.column_name.includes('passwordReset')
    );

    console.log('\n🔑 Password Reset Columns:');
    if (passwordResetColumns.length === 0) {
      console.log('   ❌ No password reset columns found!');
    } else {
      passwordResetColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });
    }

    // Sample data from test user
    const testEmail = 'test-user-1759840455640@bizelev8.ai';
    const userData = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [testEmail]
    );

    if (userData.rows.length > 0) {
      console.log(`\n👤 Test User Data for ${testEmail}:`);
      const user = userData.rows[0];
      const verificationFields = {};

      Object.keys(user).forEach(key => {
        if (key.toLowerCase().includes('email') ||
            key.toLowerCase().includes('verif') ||
            key.toLowerCase().includes('password')) {
          verificationFields[key] = user[key];
        }
      });

      console.log(JSON.stringify(verificationFields, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

checkUsersTableSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
