import pg from 'pg';
import bcrypt from 'bcryptjs';

async function seedFounderAccount() {
  console.log('🌱 Seeding Founder Account for Staging\n');
  console.log('='.repeat(70));

  // Get staging database URL from environment variable
  const stagingUrl = process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL;

  if (!stagingUrl) {
    console.error('❌ DATABASE_URL_STAGING or DATABASE_URL environment variable not set');
    console.error('');
    console.error('Set it using:');
    console.error('export DATABASE_URL_STAGING="postgresql://app_user_staging:PASSWORD@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging?sslmode=require"');
    console.error('');
    console.error('Or copy the staging DATABASE_URL from AWS Elastic Beanstalk environment variables.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: stagingUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to staging database\n');

    // Verify we're on the right database
    const dbCheck = await client.query('SELECT current_database()');
    console.log(`📊 Current Database: ${dbCheck.rows[0].current_database}`);

    if (dbCheck.rows[0].current_database !== 'p3_staging') {
      console.error('❌ ERROR: Not connected to p3_staging database!');
      console.error(`   Connected to: ${dbCheck.rows[0].current_database}`);
      console.error('   Please check your DATABASE_URL_STAGING');
      process.exit(1);
    }

    console.log('');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email, role, credit_balance FROM users WHERE email = $1',
      ['founder@bizelev8.ai']
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User founder@bizelev8.ai already exists:');
      console.log(`   ID: ${existingUser.rows[0].id}`);
      console.log(`   Email: ${existingUser.rows[0].email}`);
      console.log(`   Role: ${existingUser.rows[0].role}`);
      console.log(`   Credits: ${existingUser.rows[0].credit_balance}`);
      console.log('');
      console.log('🔄 Updating password and credits...');
    } else {
      console.log('📝 Creating new founder account...');
    }

    // Hash password: FounderPass123
    const passwordHash = await bcrypt.hash('FounderPass123', 12);

    // Insert or update user
    const result = await client.query(`
      INSERT INTO users (
        email,
        first_name,
        last_name,
        password_hash,
        role,
        credit_balance,
        top_up_credits,
        email_verified,
        plan_type,
        account_tier
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        credit_balance = EXCLUDED.credit_balance,
        top_up_credits = EXCLUDED.top_up_credits,
        email_verified = EXCLUDED.email_verified
      RETURNING id, email, role, credit_balance, top_up_credits, plan_type
    `, [
      'founder@bizelev8.ai',
      'Founder',
      'Test',
      passwordHash,
      'user',  // Regular user, not admin
      10020,   // Total credits
      10000,   // Top-up credits
      true,    // Email verified
      'PREMIUM',
      'premium'
    ]);

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ FOUNDER ACCOUNT CREATED/UPDATED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 Account Details:');
    console.log(`   User ID:       ${result.rows[0].id}`);
    console.log(`   Email:         ${result.rows[0].email}`);
    console.log(`   Role:          ${result.rows[0].role} (regular user, not admin)`);
    console.log(`   Credits:       ${result.rows[0].credit_balance}`);
    console.log(`   Top-up:        ${result.rows[0].top_up_credits}`);
    console.log(`   Plan:          ${result.rows[0].plan_type}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   URL:           https://p3app-staging.bizelev8.ai');
    console.log('   Email:         founder@bizelev8.ai');
    console.log('   Password:      FounderPass123');
    console.log('');
    console.log('✅ The user will be redirected to /dashboard (not /admin)');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Test login at staging URL');
    console.log('   2. Verify regular user dashboard access');
    console.log('   3. Verify 10,020 credits are available');
    console.log('   4. Test platform features with credits');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Tip: Check your database host in DATABASE_URL_STAGING');
    } else if (error.code === '28P01') {
      console.error('💡 Tip: Check your database password in DATABASE_URL_STAGING');
    } else if (error.code === '3D000') {
      console.error('💡 Tip: Database "p3_staging" might not exist');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedFounderAccount();
