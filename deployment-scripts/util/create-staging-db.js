import pg from 'pg';

const client = new pg.Client({
  host: 'p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com',
  user: 'app_user',
  password: 'ZgVs0A8jEJurQezzkp37txtJ',
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function createStagingDb() {
  try {
    await client.connect();
    console.log('✅ Connected to RDS');

    // Check if staging database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'p3_staging'"
    );

    if (checkDb.rows.length > 0) {
      console.log('ℹ️  Staging database already exists');
    } else {
      await client.query('CREATE DATABASE p3_staging');
      console.log('✅ Created p3_staging database');
    }

    // List all databases
    const databases = await client.query(
      'SELECT datname FROM pg_database WHERE datistemplate = false'
    );
    console.log('\n📊 Available databases:');
    databases.rows.forEach(row => console.log(`  - ${row.datname}`));

    console.log('\n✅ Staging database setup complete!');
    console.log('Next steps:');
    console.log('1. Update staging environment DATABASE_URL');
    console.log('2. Run schema migration on p3_staging');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createStagingDb();
