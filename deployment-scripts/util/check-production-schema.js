/**
 * Check production database schema
 */

import pg from 'pg';

const { Pool } = pg;

const prodDbUrl = 'postgresql://app_user:ZgVs0A8jEJurQezzkp37txtJ@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres';

const pool = new Pool({
  connectionString: prodDbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkProductionSchema() {
  console.log('🔍 Checking production database schema...\n');

  try {
    // Get all columns from users table
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND (column_name LIKE '%email%' OR column_name LIKE '%password%' OR column_name LIKE '%verif%')
      ORDER BY ordinal_position;
    `);

    console.log('📋 Email/Verification Columns in Production:\n');
    if (columnsQuery.rows.length === 0) {
      console.log('❌ No email verification columns found!');
      console.log('   The database schema needs to be updated.\n');
    } else {
      console.table(columnsQuery.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

checkProductionSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
