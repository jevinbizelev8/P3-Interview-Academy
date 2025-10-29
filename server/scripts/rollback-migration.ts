#!/usr/bin/env tsx
/**
 * Migration Rollback Script - Phase 1 Redesign
 *
 * ⚠️  WARNING: This script will REMOVE all Phase 1 changes!
 * - Drops 15 new tables
 * - Removes 6 user table columns
 * - This is DESTRUCTIVE and cannot be undone!
 *
 * Usage:
 *   npm run db:migrate:rollback
 *   # or directly:
 *   npx tsx server/scripts/rollback-migration.ts
 *
 * Prerequisites:
 * - Create rollback SQL first (see DATABASE_SCHEMA.md for template)
 * - Take RDS snapshot before running: npm run db:snapshot
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { pool, executeQuery } from '../db';
import * as readline from 'readline';

const ROLLBACK_FILE = 'server/migrations/2025-10-redesign/rollback.sql';

async function confirmRollback(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  ═══════════════════════════════════════════════════════════');
    console.log('⚠️   WARNING: DESTRUCTIVE OPERATION');
    console.log('⚠️  ═══════════════════════════════════════════════════════════\n');
    console.log('This will:');
    console.log('  • DROP 15 database tables (badges, learning_modules, etc.)');
    console.log('  • REMOVE 6 columns from users table');
    console.log('  • DELETE all data in these tables');
    console.log('  • This operation CANNOT BE UNDONE\n');

    rl.question('Type "ROLLBACK" to confirm (or anything else to cancel): ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'ROLLBACK');
    });
  });
}

async function executeRollback(): Promise<{ success: boolean; error?: Error }> {
  const rollbackPath = join(process.cwd(), ROLLBACK_FILE);

  // Check if rollback file exists
  if (!existsSync(rollbackPath)) {
    console.error('\n❌ Rollback SQL file not found!');
    console.error(`   Expected location: ${rollbackPath}`);
    console.error('\n📝 Create the rollback SQL file first:');
    console.error('   See docs/redesign/DATABASE_SCHEMA.md for the rollback template');
    console.error('   Copy the rollback SQL section and save it to:');
    console.error(`   ${ROLLBACK_FILE}`);
    return { success: false, error: new Error('Rollback SQL file not found') };
  }

  try {
    console.log('\n📄 Loading rollback SQL...');
    const rollbackSql = readFileSync(rollbackPath, 'utf8');

    console.log(`   Size: ${(rollbackSql.length / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${rollbackSql.split('\n').length}`);

    console.log('\n⏳ Executing rollback...');
    const startTime = Date.now();

    await executeQuery(rollbackSql);

    const duration = Date.now() - startTime;
    console.log(`✅ Rollback executed successfully in ${duration}ms`);

    return { success: true };
  } catch (error) {
    console.error('\n❌ Rollback execution failed:', error);
    return { success: false, error: error as Error };
  }
}

async function verifyRollback(): Promise<boolean> {
  console.log('\n🔍 Verifying rollback...');

  const tablesToCheck = [
    'badges',
    'user_badges',
    'learning_modules',
    'user_module_progress',
    'self_intro_drafts',
  ];

  try {
    for (const table of tablesToCheck) {
      const result: any = await executeQuery(
        `SELECT to_regclass('public.${table}') IS NOT NULL AS exists`
      );
      const exists = result.rows?.[0]?.exists || false;

      if (exists) {
        console.log(`  ❌ Table '${table}' still exists`);
        return false;
      } else {
        console.log(`  ✅ Table '${table}' removed`);
      }
    }

    // Check if user columns removed
    const userColumns = ['xp_points', 'current_streak', 'readiness_score', 'referral_code'];

    for (const column of userColumns) {
      const result: any = await executeQuery(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = '${column}'
        ) AS exists
      `);
      const exists = result.rows?.[0]?.exists || false;

      if (exists) {
        console.log(`  ❌ Column 'users.${column}' still exists`);
        return false;
      } else {
        console.log(`  ✅ Column 'users.${column}' removed`);
      }
    }

    console.log('\n✅ Rollback verification passed');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    P3 Interview Academy - Migration Rollback Script        ║');
  console.log('║    Phase 1: Redesign Schema Rollback                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Step 1: Confirm with user
    const confirmed = await confirmRollback();

    if (!confirmed) {
      console.log('\n✅ Rollback cancelled. No changes made.');
      await cleanup();
      process.exit(0);
    }

    // Step 2: Execute rollback
    const rollbackResult = await executeRollback();

    if (!rollbackResult.success) {
      console.error('\n❌ Rollback failed.');
      await cleanup();
      process.exit(1);
    }

    // Step 3: Verify rollback
    const verified = await verifyRollback();

    if (!verified) {
      console.error('\n❌ Rollback verification failed!');
      console.error('   Some schema changes may not have been rolled back correctly.');
      await cleanup();
      process.exit(1);
    }

    // Success!
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                 ✅ ROLLBACK SUCCESSFUL                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log('   • 15 tables dropped');
    console.log('   • 6 user columns removed');
    console.log('   • Database restored to pre-migration state');
    console.log('\n🎯 Next steps:');
    console.log('   • If needed, restore from RDS snapshot for complete rollback');
    console.log('   • Review application functionality');
    console.log('   • Fix migration issues before re-applying');

    await cleanup();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Unexpected error during rollback:', error);
    await cleanup();
    process.exit(1);
  }
}

async function cleanup() {
  try {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Rollback interrupted by user');
  await cleanup();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Rollback terminated');
  await cleanup();
  process.exit(143);
});

// Run rollback
main();
