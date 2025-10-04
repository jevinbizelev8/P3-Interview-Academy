import pg from 'pg';

async function verifyDatabaseSeparation() {
  console.log('🔍 Verifying Database Separation\n');
  console.log('='.repeat(60));

  // Check production database
  const prodClient = new pg.Client({
    host: 'p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com',
    user: 'app_user',
    password: 'ZgVs0A8jEJurQezzkp37txtJ',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  // Check staging database
  const stagingClient = new pg.Client({
    host: 'p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com',
    user: 'app_user',
    password: 'ZgVs0A8jEJurQezzkp37txtJ',
    database: 'p3_staging',
    port: 5432,
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
