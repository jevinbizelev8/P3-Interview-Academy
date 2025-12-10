/**
 * Production Database Migration Script
 * PR #6: Model Answer Integration with 9-Criteria Scoring
 *
 * This script applies TWO critical migrations:
 * 1. CSV question tracking columns
 * 2. 9-criteria scoring columns
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const prodDbUrl = 'postgresql://app_user:<PASSWORD>@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres';

const pool = new Pool({
  connectionString: prodDbUrl,
  ssl: {
    rejectUnauthorized: false  // RDS uses self-signed certificates
  }
});

async function runMigrations() {
  console.log('🚀 Starting Production Database Migrations for PR #6\n');
  console.log('Database: Production RDS (postgres)\n');
  console.log('=' .repeat(60));

  try {
    // Test connection
    console.log('\n📡 Testing database connection...');
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ Connected successfully at ${testResult.rows[0].current_time}\n`);

    // Migration 1: CSV Question Tracking Columns
    console.log('=' .repeat(60));
    console.log('📋 MIGRATION 1: CSV Question Tracking Columns');
    console.log('=' .repeat(60));

    console.log('\n🔍 Checking if CSV columns already exist...');
    const csvColumnsCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ai_prepare_questions'
      AND column_name IN ('csv_question_number', 'csv_question_stage', 'is_from_curated_bank')
      ORDER BY column_name;
    `);

    if (csvColumnsCheck.rows.length === 3) {
      console.log('✅ CSV columns already exist:');
      console.table(csvColumnsCheck.rows);
    } else {
      console.log('⚙️  Adding CSV tracking columns...');

      await pool.query(`
        ALTER TABLE ai_prepare_questions
        ADD COLUMN IF NOT EXISTS csv_question_number INTEGER,
        ADD COLUMN IF NOT EXISTS csv_question_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS is_from_curated_bank BOOLEAN DEFAULT false;
      `);
      console.log('✅ CSV columns added successfully');

      // Create index
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_csv_question_number
        ON ai_prepare_questions(csv_question_number);
      `);
      console.log('✅ Index created: idx_csv_question_number');

      // Verify
      const verifyResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ai_prepare_questions'
        AND column_name IN ('csv_question_number', 'csv_question_stage', 'is_from_curated_bank')
        ORDER BY column_name;
      `);
      console.log('\n📊 Verification:');
      console.table(verifyResult.rows);
    }

    // Migration 2: 9-Criteria Scoring Columns
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION 2: 9-Criteria Scoring Columns');
    console.log('=' .repeat(60));

    console.log('\n🔍 Checking if 9-criteria columns already exist...');
    const criteriaColumnsCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ai_prepare_responses'
      AND column_name IN (
        'star_structure_score',
        'specific_evidence_score',
        'role_alignment_score',
        'outcome_oriented_score',
        'problem_solving_score',
        'cultural_fit_score',
        'learning_agility_score',
        'weighted_overall_score',
        'overall_rating'
      )
      ORDER BY column_name;
    `);

    if (criteriaColumnsCheck.rows.length === 9) {
      console.log('✅ 9-criteria columns already exist:');
      console.table(criteriaColumnsCheck.rows);
    } else {
      console.log(`⚙️  Found ${criteriaColumnsCheck.rows.length}/9 columns. Adding missing columns...`);

      await pool.query(`
        ALTER TABLE ai_prepare_responses
        ADD COLUMN IF NOT EXISTS star_structure_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS specific_evidence_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS role_alignment_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS outcome_oriented_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS problem_solving_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS cultural_fit_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS learning_agility_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS weighted_overall_score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS overall_rating VARCHAR(30);
      `);
      console.log('✅ 9-criteria columns added successfully');

      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_weighted_overall_score
        ON ai_prepare_responses(weighted_overall_score);
      `);
      console.log('✅ Index created: idx_weighted_overall_score');

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_overall_rating
        ON ai_prepare_responses(overall_rating);
      `);
      console.log('✅ Index created: idx_overall_rating');

      // Verify
      const verifyResult = await pool.query(`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_name = 'ai_prepare_responses'
        AND column_name IN (
          'star_structure_score',
          'specific_evidence_score',
          'role_alignment_score',
          'outcome_oriented_score',
          'problem_solving_score',
          'cultural_fit_score',
          'learning_agility_score',
          'weighted_overall_score',
          'overall_rating'
        )
        ORDER BY column_name;
      `);
      console.log('\n📊 Verification:');
      console.table(verifyResult.rows);
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📊 Migration Summary:');
    console.log('  ✅ CSV Question Tracking: ai_prepare_questions (3 columns + 1 index)');
    console.log('  ✅ 9-Criteria Scoring: ai_prepare_responses (9 columns + 2 indexes)');
    console.log('\n🎯 Next Steps:');
    console.log('  1. Merge PR #6 to main branch');
    console.log('  2. Deploy application code via GitHub Actions');
    console.log('  3. Run smoke tests: node testing-scripts/test-production-smoke.js');
    console.log('  4. Monitor production for 30 minutes\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n🔴 ROLLBACK REQUIRED - DO NOT DEPLOY APPLICATION CODE');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
