import pg from 'pg';

async function addCreditsToUser() {
  console.log('💰 Adding Credits to User Account\n');
  console.log('='.repeat(70));

  // Get parameters
  const userEmail = process.argv[2];
  const creditsToAdd = parseInt(process.argv[3]) || 10000;

  if (!userEmail) {
    console.error('❌ Missing required parameter: email');
    console.error('');
    console.error('Usage:');
    console.error('  node add-credits-to-user.js <email> [credits]');
    console.error('');
    console.error('Example:');
    console.error('  node add-credits-to-user.js jevintanjh@gmail.com 10000');
    console.error('');
    process.exit(1);
  }

  // Get staging database URL from environment variable
  const stagingUrl = process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL;

  if (!stagingUrl) {
    console.error('❌ DATABASE_URL_STAGING or DATABASE_URL environment variable not set');
    console.error('');
    console.error('Set it using:');
    console.error('export DATABASE_URL_STAGING="postgresql://app_user_staging:PASSWORD@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging?sslmode=require"');
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
      process.exit(1);
    }

    console.log('');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id, email, role, credit_balance, top_up_credits FROM users WHERE email = $1',
      [userEmail]
    );

    if (existingUser.rows.length === 0) {
      console.error(`❌ User not found: ${userEmail}`);
      console.error('');
      console.error('Available users:');
      const allUsers = await client.query(
        'SELECT email FROM users ORDER BY created_at DESC LIMIT 10'
      );
      allUsers.rows.forEach(u => console.error(`  - ${u.email}`));
      process.exit(1);
    }

    const user = existingUser.rows[0];
    console.log('📋 Current User Details:');
    console.log(`   Email:            ${user.email}`);
    console.log(`   Role:             ${user.role}`);
    console.log(`   Current Credits:  ${user.credit_balance}`);
    console.log(`   Top-up Credits:   ${user.top_up_credits}`);
    console.log('');

    // Calculate new balances
    const newCreditBalance = user.credit_balance + creditsToAdd;
    const newTopUpCredits = user.top_up_credits + creditsToAdd;

    console.log(`💰 Adding ${creditsToAdd} credits...`);
    console.log('');

    // Update user credits
    const result = await client.query(`
      UPDATE users
      SET
        credit_balance = credit_balance + $1,
        top_up_credits = top_up_credits + $1,
        updated_at = NOW()
      WHERE email = $2
      RETURNING id, email, role, credit_balance, top_up_credits
    `, [creditsToAdd, userEmail]);

    const updatedUser = result.rows[0];

    console.log('='.repeat(70));
    console.log('✅ CREDITS ADDED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 Updated Account Details:');
    console.log(`   User ID:          ${updatedUser.id}`);
    console.log(`   Email:            ${updatedUser.email}`);
    console.log(`   Role:             ${updatedUser.role}`);
    console.log(`   New Balance:      ${updatedUser.credit_balance} (+${creditsToAdd})`);
    console.log(`   Top-up Credits:   ${updatedUser.top_up_credits}`);
    console.log('');
    console.log('💡 Summary:');
    console.log(`   Credits Added:    ${creditsToAdd}`);
    console.log(`   Previous Balance: ${user.credit_balance}`);
    console.log(`   New Balance:      ${updatedUser.credit_balance}`);
    console.log('');

    // Log the transaction for audit trail
    await client.query(`
      INSERT INTO credit_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        balance_after,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      updatedUser.id,
      creditsToAdd,
      'admin_adjustment',
      `Admin added credits for UAT testing`,
      updatedUser.credit_balance
    ]);

    console.log('✅ Transaction logged in credit_transactions table');
    console.log('');
    console.log('🎯 Ready for UAT Testing!');
    console.log('   The user can now test all credit-based features.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Tip: Check your database host in DATABASE_URL_STAGING');
    } else if (error.code === '28P01') {
      console.error('💡 Tip: Check your database password in DATABASE_URL_STAGING');
    } else if (error.code === '23503') {
      console.error('💡 Tip: Foreign key constraint - check user_id exists');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

addCreditsToUser();
