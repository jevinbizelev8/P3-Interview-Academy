#!/usr/bin/env tsx
/**
 * Automated Migration Runner - Phase 1 Redesign
 *
 * This script executes the Phase 1 database migration with safety checks:
 * - Pre-flight checks to detect if migration already applied
 * - Transaction-wrapped execution (idempotent)
 * - Post-migration verification
 * - Detailed logging and error handling
 *
 * Usage:
 *   npm run db:migrate
 *   # or directly:
 *   npx tsx server/scripts/run-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { pool, executeQuery } from '../db';

const MIGRATION_FILE = 'server/migrations/2025-10-redesign/phase1.sql';
const MIGRATION_NAME = 'Phase 1: Redesign Database Migration';

interface PreFlightCheck {
  name: string;
  description: string;
  query: string;
  expectedWhenNotApplied: boolean;
}

const PRE_FLIGHT_CHECKS: PreFlightCheck[] = [
  {
    name: 'badges_table',
    description: 'Check if badges table exists',
    query: "SELECT to_regclass('public.badges') IS NOT NULL AS exists",
    expectedWhenNotApplied: false,
  },
  {
    name: 'user_xp_points',
    description: 'Check if users.xp_points column exists',
    query: `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'xp_points'
    ) AS exists`,
    expectedWhenNotApplied: false,
  },
  {
    name: 'learning_modules_table',
    description: 'Check if learning_modules table exists',
    query: "SELECT to_regclass('public.learning_modules') IS NOT NULL AS exists",
    expectedWhenNotApplied: false,
  },
];

interface VerificationCheck {
  name: string;
  description: string;
  query: string;
  expectedAfterMigration: boolean;
}

const VERIFICATION_CHECKS: VerificationCheck[] = [
  // User table extensions
  {
    name: 'users_xp_points',
    description: 'users.xp_points column exists',
    query: "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'xp_points') AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'users_current_streak',
    description: 'users.current_streak column exists',
    query: "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_streak') AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'users_readiness_score',
    description: 'users.readiness_score column exists',
    query: "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'readiness_score') AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'users_referral_code',
    description: 'users.referral_code column exists',
    query: "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') AS exists",
    expectedAfterMigration: true,
  },

  // New tables
  {
    name: 'badges',
    description: 'badges table exists',
    query: "SELECT to_regclass('public.badges') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'user_badges',
    description: 'user_badges table exists',
    query: "SELECT to_regclass('public.user_badges') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'learning_modules',
    description: 'learning_modules table exists',
    query: "SELECT to_regclass('public.learning_modules') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'user_module_progress',
    description: 'user_module_progress table exists',
    query: "SELECT to_regclass('public.user_module_progress') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'self_intro_drafts',
    description: 'self_intro_drafts table exists',
    query: "SELECT to_regclass('public.self_intro_drafts') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'self_intros',
    description: 'self_intros table exists',
    query: "SELECT to_regclass('public.self_intros') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'resumes',
    description: 'resumes table exists',
    query: "SELECT to_regclass('public.resumes') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'star_stories',
    description: 'star_stories table exists',
    query: "SELECT to_regclass('public.star_stories') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'actual_interviews',
    description: 'actual_interviews table exists',
    query: "SELECT to_regclass('public.actual_interviews') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'reflection_journals',
    description: 'reflection_journals table exists',
    query: "SELECT to_regclass('public.reflection_journals') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'referrals',
    description: 'referrals table exists',
    query: "SELECT to_regclass('public.referrals') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'feedback',
    description: 'feedback table exists',
    query: "SELECT to_regclass('public.feedback') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'support_tickets',
    description: 'support_tickets table exists',
    query: "SELECT to_regclass('public.support_tickets') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'job_descriptions',
    description: 'job_descriptions table exists',
    query: "SELECT to_regclass('public.job_descriptions') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
  {
    name: 'resume_analysis_history',
    description: 'resume_analysis_history table exists',
    query: "SELECT to_regclass('public.resume_analysis_history') IS NOT NULL AS exists",
    expectedAfterMigration: true,
  },
];

async function checkQuery(check: PreFlightCheck | VerificationCheck): Promise<boolean> {
  try {
    const result: any = await executeQuery(check.query);
    const exists = result.rows?.[0]?.exists || false;
    return exists;
  } catch (error) {
    console.error(`❌ Error checking ${check.name}:`, error);
    return false;
  }
}

async function runPreFlightChecks(): Promise<{ alreadyApplied: boolean; checks: Array<{ name: string; passed: boolean }> }> {
  console.log('\n🔍 Running pre-flight checks...');

  const checkResults = [];
  let appliedCount = 0;

  for (const check of PRE_FLIGHT_CHECKS) {
    const exists = await checkQuery(check);
    const passed = exists === !check.expectedWhenNotApplied;

    checkResults.push({ name: check.name, passed, exists });

    if (exists) {
      appliedCount++;
    }

    const icon = exists ? '✅' : '⚪';
    console.log(`  ${icon} ${check.description}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  }

  const alreadyApplied = appliedCount === PRE_FLIGHT_CHECKS.length;

  if (alreadyApplied) {
    console.log('\n✅ All checks indicate migration already applied (idempotent - safe to re-run)');
  } else if (appliedCount > 0 && appliedCount < PRE_FLIGHT_CHECKS.length) {
    console.log(`\n⚠️  Partial migration detected (${appliedCount}/${PRE_FLIGHT_CHECKS.length} checks passed)`);
    console.log('   Migration will attempt to complete remaining changes...');
  } else {
    console.log('\n✅ Migration not yet applied - ready to execute');
  }

  return { alreadyApplied, checks: checkResults };
}

async function executeMigration(): Promise<{ success: boolean; error?: Error }> {
  console.log(`\n🚀 Executing migration: ${MIGRATION_NAME}`);
  console.log(`📄 Migration file: ${MIGRATION_FILE}\n`);

  try {
    // Read migration SQL file
    const migrationPath = join(process.cwd(), MIGRATION_FILE);
    const migrationSql = readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration SQL loaded successfully');
    console.log(`   Size: ${(migrationSql.length / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${migrationSql.split('\n').length}`);

    // Execute migration (already wrapped in BEGIN/COMMIT transaction)
    console.log('\n⏳ Executing migration...');
    const startTime = Date.now();

    await executeQuery(migrationSql);

    const duration = Date.now() - startTime;
    console.log(`✅ Migration executed successfully in ${duration}ms`);

    return { success: true };
  } catch (error) {
    console.error('❌ Migration execution failed:', error);
    return { success: false, error: error as Error };
  }
}

async function runVerificationChecks(): Promise<{ allPassed: boolean; checks: Array<{ name: string; passed: boolean }> }> {
  console.log('\n🔍 Running post-migration verification...');

  const checkResults = [];
  let passedCount = 0;

  for (const check of VERIFICATION_CHECKS) {
    const exists = await checkQuery(check);
    const passed = exists === check.expectedAfterMigration;

    checkResults.push({ name: check.name, passed, exists });

    if (passed) {
      passedCount++;
    }

    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${check.description}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }

  const allPassed = passedCount === VERIFICATION_CHECKS.length;

  console.log(`\n📊 Verification: ${passedCount}/${VERIFICATION_CHECKS.length} checks passed`);

  if (allPassed) {
    console.log('✅ All verification checks passed!');
  } else {
    console.log(`❌ ${VERIFICATION_CHECKS.length - passedCount} verification checks failed`);
  }

  return { allPassed, checks: checkResults };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   P3 Interview Academy - Database Migration Runner        ║');
  console.log('║   Phase 1: Redesign Schema (Gamification + Learning)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Step 1: Pre-flight checks
    const preFlightResult = await runPreFlightChecks();

    if (preFlightResult.alreadyApplied) {
      console.log('\n🔄 Migration already applied. Running verification to confirm...');
      const verifyResult = await runVerificationChecks();

      if (verifyResult.allPassed) {
        console.log('\n✅ Migration is already applied and verified. No action needed.');
        await cleanup();
        process.exit(0);
      } else {
        console.log('\n⚠️  Migration appears applied but verification failed.');
        console.log('   Re-running migration to ensure completeness (idempotent operations)...');
      }
    }

    // Step 2: Execute migration
    const migrationResult = await executeMigration();

    if (!migrationResult.success) {
      console.error('\n❌ Migration failed. Transaction rolled back.');
      console.error('   Error:', migrationResult.error?.message);
      await cleanup();
      process.exit(1);
    }

    // Step 3: Verify migration
    const verifyResult = await runVerificationChecks();

    if (!verifyResult.allPassed) {
      console.error('\n❌ Post-migration verification failed!');
      console.error('   Some schema changes may not have been applied correctly.');
      console.error('   Please review the failed checks above and investigate.');
      await cleanup();
      process.exit(1);
    }

    // Success!
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ MIGRATION SUCCESSFUL                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log(`   • Migration: ${MIGRATION_NAME}`);
    console.log(`   • New tables: 15`);
    console.log(`   • User columns added: 6`);
    console.log(`   • Status: All verification checks passed ✅`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Run seed script: npm run db:seed-redesign');
    console.log('   2. Verify application startup: npm run dev');
    console.log('   3. Run smoke tests: npm run test:run');

    await cleanup();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Unexpected error during migration:', error);
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
  console.log('\n\n⚠️  Migration interrupted by user');
  await cleanup();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Migration terminated');
  await cleanup();
  process.exit(143);
});

// Run migration
main();
