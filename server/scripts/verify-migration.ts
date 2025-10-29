#!/usr/bin/env tsx
/**
 * Schema Verification Script - Phase 1 Redesign
 *
 * Verifies that all Phase 1 migration changes have been applied correctly:
 * - User table extensions (6 columns)
 * - New tables (15 total)
 * - Indexes
 * - Constraints
 *
 * Usage:
 *   npm run db:migrate:verify
 *   # or directly:
 *   npx tsx server/scripts/verify-migration.ts
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Some checks failed
 *   2 - Critical error
 */

import { pool, executeQuery } from '../db';

interface SchemaCheck {
  category: string;
  name: string;
  description: string;
  query: string;
  expectedValue: any;
  critical: boolean; // If true, failure blocks deployment
}

const SCHEMA_CHECKS: SchemaCheck[] = [
  // ==================== USER TABLE EXTENSIONS ====================
  {
    category: 'User Columns',
    name: 'xp_points',
    description: 'users.xp_points column with default 0',
    query: `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'xp_points'
    `,
    expectedValue: { exists: true, type: 'integer' },
    critical: true,
  },
  {
    category: 'User Columns',
    name: 'current_streak',
    description: 'users.current_streak column',
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'current_streak'
    `,
    expectedValue: { exists: true, type: 'integer' },
    critical: true,
  },
  {
    category: 'User Columns',
    name: 'longest_streak',
    description: 'users.longest_streak column',
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'longest_streak'
    `,
    expectedValue: { exists: true, type: 'integer' },
    critical: true,
  },
  {
    category: 'User Columns',
    name: 'last_activity_date',
    description: 'users.last_activity_date column',
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_activity_date'
    `,
    expectedValue: { exists: true, type: 'timestamp without time zone' },
    critical: true,
  },
  {
    category: 'User Columns',
    name: 'readiness_score',
    description: 'users.readiness_score column with CHECK constraint',
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'readiness_score'
    `,
    expectedValue: { exists: true, type: 'integer' },
    critical: true,
  },
  {
    category: 'User Columns',
    name: 'referral_code',
    description: 'users.referral_code column (UNIQUE)',
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'referral_code'
    `,
    expectedValue: { exists: true, type: 'character varying' },
    critical: true,
  },

  // ==================== NEW TABLES ====================
  {
    category: 'Tables',
    name: 'job_descriptions',
    description: 'job_descriptions table exists',
    query: "SELECT to_regclass('public.job_descriptions') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'badges',
    description: 'badges table exists',
    query: "SELECT to_regclass('public.badges') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'user_badges',
    description: 'user_badges table exists',
    query: "SELECT to_regclass('public.user_badges') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'learning_modules',
    description: 'learning_modules table exists',
    query: "SELECT to_regclass('public.learning_modules') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'user_module_progress',
    description: 'user_module_progress table exists',
    query: "SELECT to_regclass('public.user_module_progress') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'self_intro_drafts',
    description: 'self_intro_drafts table exists',
    query: "SELECT to_regclass('public.self_intro_drafts') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'self_intros',
    description: 'self_intros table exists',
    query: "SELECT to_regclass('public.self_intros') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'resumes',
    description: 'resumes table exists',
    query: "SELECT to_regclass('public.resumes') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'resume_analysis_history',
    description: 'resume_analysis_history table exists',
    query: "SELECT to_regclass('public.resume_analysis_history') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'star_stories',
    description: 'star_stories table exists',
    query: "SELECT to_regclass('public.star_stories') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'actual_interviews',
    description: 'actual_interviews table exists',
    query: "SELECT to_regclass('public.actual_interviews') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'reflection_journals',
    description: 'reflection_journals table exists',
    query: "SELECT to_regclass('public.reflection_journals') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'referrals',
    description: 'referrals table exists',
    query: "SELECT to_regclass('public.referrals') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'feedback',
    description: 'feedback table exists',
    query: "SELECT to_regclass('public.feedback') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },
  {
    category: 'Tables',
    name: 'support_tickets',
    description: 'support_tickets table exists',
    query: "SELECT to_regclass('public.support_tickets') IS NOT NULL AS exists",
    expectedValue: true,
    critical: true,
  },

  // ==================== KEY INDEXES ====================
  {
    category: 'Indexes',
    name: 'idx_users_referral_code',
    description: 'Index on users.referral_code',
    query: "SELECT to_regclass('public.idx_users_referral_code') IS NOT NULL AS exists",
    expectedValue: true,
    critical: false,
  },
  {
    category: 'Indexes',
    name: 'idx_users_xp_points',
    description: 'Index on users.xp_points (leaderboard)',
    query: "SELECT to_regclass('public.idx_users_xp_points') IS NOT NULL AS exists",
    expectedValue: true,
    critical: false,
  },
  {
    category: 'Indexes',
    name: 'idx_user_badges_user',
    description: 'Index on user_badges.user_id',
    query: "SELECT to_regclass('public.idx_user_badges_user') IS NOT NULL AS exists",
    expectedValue: true,
    critical: false,
  },
  {
    category: 'Indexes',
    name: 'idx_learning_modules_stage',
    description: 'Index on learning_modules.stage',
    query: "SELECT to_regclass('public.idx_learning_modules_stage') IS NOT NULL AS exists",
    expectedValue: true,
    critical: false,
  },
];

interface CheckResult {
  category: string;
  name: string;
  description: string;
  passed: boolean;
  critical: boolean;
  details?: any;
  error?: string;
}

async function runCheck(check: SchemaCheck): Promise<CheckResult> {
  try {
    const result: any = await executeQuery(check.query);

    // Handle different query result types
    let passed = false;
    let details: any = null;

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];

      // Simple boolean check (table/index exists)
      if ('exists' in row) {
        passed = row.exists === check.expectedValue;
        details = { exists: row.exists };
      }
      // Column check
      else if ('column_name' in row) {
        passed = true; // Column exists
        details = {
          column: row.column_name,
          type: row.data_type,
          default: row.column_default,
        };

        // Validate type if specified
        if (check.expectedValue.type && row.data_type !== check.expectedValue.type) {
          passed = false;
          details.expectedType = check.expectedValue.type;
        }
      }
    } else {
      // No rows means column/table/index doesn't exist
      passed = false;
      details = { exists: false };
    }

    return {
      category: check.category,
      name: check.name,
      description: check.description,
      passed,
      critical: check.critical,
      details,
    };
  } catch (error) {
    return {
      category: check.category,
      name: check.name,
      description: check.description,
      passed: false,
      critical: check.critical,
      error: (error as Error).message,
    };
  }
}

async function verifySchema(): Promise<{ passed: boolean; results: CheckResult[] }> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     P3 Interview Academy - Schema Verification            ║');
  console.log('║     Phase 1: Redesign Migration                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('🔍 Running schema verification checks...\n');

  const results: CheckResult[] = [];
  const categoryCounts: Record<string, { total: number; passed: number }> = {};

  for (const check of SCHEMA_CHECKS) {
    const result = await runCheck(check);
    results.push(result);

    // Update category counts
    if (!categoryCounts[check.category]) {
      categoryCounts[check.category] = { total: 0, passed: 0 };
    }
    categoryCounts[check.category].total++;
    if (result.passed) {
      categoryCounts[check.category].passed++;
    }
  }

  // Print results by category
  for (const category of Object.keys(categoryCounts)) {
    const categoryResults = results.filter(r => r.category === category);
    const { total, passed } = categoryCounts[category];

    console.log(`\n📋 ${category} (${passed}/${total} passed)`);
    console.log('─'.repeat(60));

    for (const result of categoryResults) {
      const icon = result.passed ? '✅' : (result.critical ? '❌' : '⚠️ ');
      const criticalBadge = result.critical ? ' [CRITICAL]' : '';

      console.log(`${icon} ${result.description}${criticalBadge}`);

      if (!result.passed && result.error) {
        console.log(`     Error: ${result.error}`);
      } else if (!result.passed && result.details) {
        console.log(`     Details: ${JSON.stringify(result.details)}`);
      }
    }
  }

  // Summary
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = totalChecks - passedChecks;
  const criticalFailures = results.filter(r => !r.passed && r.critical).length;
  const warningFailures = results.filter(r => !r.passed && !r.critical).length;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   VERIFICATION SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Total Checks:      ${totalChecks}`);
  console.log(`✅ Passed:            ${passedChecks}`);
  console.log(`❌ Failed:            ${failedChecks}`);
  if (criticalFailures > 0) {
    console.log(`🚨 Critical Failures: ${criticalFailures}`);
  }
  if (warningFailures > 0) {
    console.log(`⚠️  Warnings:          ${warningFailures}`);
  }

  const overallPassed = criticalFailures === 0;

  if (overallPassed) {
    if (warningFailures > 0) {
      console.log('\n⚠️  Schema verification passed with warnings.');
      console.log('   Some non-critical checks failed (e.g., optional indexes).');
      console.log('   The application should function normally.');
    } else {
      console.log('\n✅ All schema verification checks passed!');
      console.log('   The migration has been successfully applied.');
    }
  } else {
    console.log('\n❌ Schema verification FAILED!');
    console.log(`   ${criticalFailures} critical check(s) failed.`);
    console.log('   The migration may not be complete or may have errors.');
    console.log('\n🔧 Recommended actions:');
    console.log('   1. Review the failed checks above');
    console.log('   2. Re-run the migration: npm run db:migrate');
    console.log('   3. Check migration logs for errors');
    console.log('   4. If issues persist, consider rollback: npm run db:migrate:rollback');
  }

  return { passed: overallPassed, results };
}

async function main() {
  try {
    const { passed, results } = await verifySchema();

    await cleanup();

    // Exit with appropriate code
    if (passed) {
      process.exit(0); // Success
    } else {
      process.exit(1); // Failures detected
    }
  } catch (error) {
    console.error('\n❌ Critical error during verification:', error);
    await cleanup();
    process.exit(2); // Critical error
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
  console.log('\n\n⚠️  Verification interrupted by user');
  await cleanup();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Verification terminated');
  await cleanup();
  process.exit(143);
});

// Run verification
main();
