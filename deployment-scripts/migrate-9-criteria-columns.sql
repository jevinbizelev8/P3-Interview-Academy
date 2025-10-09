-- Production Database Migration Script
-- Feature: 9-Criteria Scoring for AI Prepare Module
-- Date: 2025-10-09
-- PR: #6 Integrate Google Sheets Model Answers

-- ============================================================
-- IMPORTANT: Run this script BEFORE deploying application code
-- ============================================================

-- Add 9-criteria scoring columns to ai_prepare_responses table
-- These columns store the official interview evaluation rubric scores

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

-- Add performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_weighted_overall_score
ON ai_prepare_responses(weighted_overall_score);

CREATE INDEX IF NOT EXISTS idx_overall_rating
ON ai_prepare_responses(overall_rating);

-- Verify migration success
SELECT
  column_name,
  data_type,
  character_maximum_length,
  numeric_precision,
  numeric_scale
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

-- Expected output: 9 rows showing all new columns with correct types
-- star_structure_score     | numeric | null | 3 | 2
-- specific_evidence_score  | numeric | null | 3 | 2
-- role_alignment_score     | numeric | null | 3 | 2
-- outcome_oriented_score   | numeric | null | 3 | 2
-- problem_solving_score    | numeric | null | 3 | 2
-- cultural_fit_score       | numeric | null | 3 | 2
-- learning_agility_score   | numeric | null | 3 | 2
-- weighted_overall_score   | numeric | null | 3 | 2
-- overall_rating           | varchar | 30   | null | null

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next Steps:
-- 1. Verify all 9 columns appear in the query results above
-- 2. Verify indexes created successfully
-- 3. Deploy application code (PR #6)
-- 4. Run smoke tests: node testing-scripts/test-production-smoke.js
-- ============================================================
