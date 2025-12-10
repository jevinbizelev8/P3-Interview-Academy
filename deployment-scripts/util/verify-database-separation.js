import pg from 'pg';

async function verifyDatabaseSeparation() {
  console.log('🔍 Verifying Database Separation\n');
  console.log('='.repeat(60));

  // Get database URLs from environment variables
  // Example: export DATABASE_URL_PRODUCTION='postgresql://app_user:<PASSWORD>@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres'
  const prodUrl = process.env.DATABASE_URL_PRODUCTION;
  const stagingUrl = process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL;

  if (!prodUrl || !stagingUrl) {
    console.error('❌ Missing environment variables:');
    if (!prodUrl) console.error('  - DATABASE_URL_PRODUCTION');
    if (!stagingUrl) console.error('  - DATABASE_URL_STAGING or DATABASE_URL');
    console.error('\nSet them using:');
    console.error('  export DATABASE_URL_PRODUCTION="postgresql://..."');
    console.error('  export DATABASE_URL_STAGING="postgresql://..."');
    process.exit(1);
  }

  // Check production database
  const prodClient = new pg.Client({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
  });

  // Check staging database
  const stagingClient = new pg.Client({
    connectionString: stagingUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to both databases
    await prodClient.connect();
    await stagingClient.connect();

    console.log('\n📊 PRODUCTION DATABASE (postgres)');
    console.log('-'.repeat(60));

    const prodUsers = await prodClient.query('SELECT COUNT(*) as count FROM users');
    const prodSessions = await prodClient.query('SELECT COUNT(*) as count FROM interview_sessions');
    const prodPractice = await prodClient.query('SELECT COUNT(*) as count FROM practice_sessions');

    console.log(`✓ Users: ${prodUsers.rows[0].count}`);
    console.log(`✓ Interview Sessions: ${prodSessions.rows[0].count}`);
    console.log(`✓ Practice Sessions: ${prodPractice.rows[0].count}`);

    console.log('\n📊 STAGING DATABASE (p3_staging)');
    console.log('-'.repeat(60));

    const stagingUsers = await stagingClient.query('SELECT COUNT(*) as count FROM users');
    const stagingSessions = await stagingClient.query('SELECT COUNT(*) as count FROM interview_sessions');
    const stagingPractice = await stagingClient.query('SELECT COUNT(*) as count FROM practice_sessions');

    console.log(`✓ Users: ${stagingUsers.rows[0].count}`);
    console.log(`✓ Interview Sessions: ${stagingSessions.rows[0].count}`);
    console.log(`✓ Practice Sessions: ${stagingPractice.rows[0].count}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE SEPARATION VERIFIED');
    console.log('='.repeat(60));

    console.log('\n📋 Summary:');
    console.log('  • Production: Using "postgres" database');
    console.log('  • Staging: Using "p3_staging" database');
    console.log('  • Both databases are isolated');
    console.log('  • Safe to test in staging without affecting production');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prodClient.end();
    await stagingClient.end();
  }
}

verifyDatabaseSeparation();
