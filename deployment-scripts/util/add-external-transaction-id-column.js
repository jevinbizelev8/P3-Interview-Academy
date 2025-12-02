#!/usr/bin/env node

/**
 * Add external_transaction_id column to credit_transactions table
 * This column is required for Stripe webhook idempotency
 *
 * Run on staging first, then production after validation
 */

import pkg from 'pg';
const { Pool } = pkg;

// Database connection URLs
const stagingDbUrl = 'postgresql://app_user:ZgVs0A8jEJurQezzkp37txtJ@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging';
const productionDbUrl = 'postgresql://app_user_prod:REPLACE_WITH_PROD_PASSWORD@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres';

async function addExternalTransactionIdColumn(dbUrl, envName) {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`\n🔧 Adding external_transaction_id column to ${envName} database...\n`);

    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'credit_transactions'
      AND column_name = 'external_transaction_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log(`✅ Column external_transaction_id already exists in ${envName}`);
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE credit_transactions
      ADD COLUMN external_transaction_id VARCHAR(255) UNIQUE
    `);

    console.log(`✅ Successfully added external_transaction_id column to ${envName}`);

    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'credit_transactions'
      AND column_name = 'external_transaction_id'
    `);

    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log('\n📋 Column details:');
      console.log(`   - Name: ${col.column_name}`);
      console.log(`   - Type: ${col.data_type}(${col.character_maximum_length})`);
      console.log(`   - Nullable: ${col.is_nullable}`);
      console.log(`   - Unique constraint: YES`);
    }

    // Check for any existing transactions (should be none with external_transaction_id)
    const countResult = await pool.query(`
      SELECT COUNT(*) as total_transactions
      FROM credit_transactions
    `);

    console.log(`\n📊 Existing transactions: ${countResult.rows[0].total_transactions}`);
    console.log('   (All existing transactions will have NULL external_transaction_id)');

  } catch (error) {
    console.error(`\n❌ Error adding column to ${envName}:`, error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('P3 Interview Academy - Database Migration');
  console.log('Add external_transaction_id column to credit_transactions');
  console.log('=========================================================\n');

  const args = process.argv.slice(2);
  const environment = args[0] || 'staging';

  if (environment === 'staging') {
    await addExternalTransactionIdColumn(stagingDbUrl, 'STAGING');
  } else if (environment === 'production') {
    console.log('⚠️  WARNING: You are about to modify the PRODUCTION database!');
    console.log('Make sure you have:');
    console.log('1. Tested this migration on staging');
    console.log('2. Verified the application works with the new column');
    console.log('3. Updated the production database password in this script');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    await addExternalTransactionIdColumn(productionDbUrl, 'PRODUCTION');
  } else {
    console.error('❌ Invalid environment. Use "staging" or "production"');
    process.exit(1);
  }

  console.log('\n✅ Migration complete!\n');
}

main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
