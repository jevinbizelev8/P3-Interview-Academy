-- Migration: Add CSV Question Tracking Columns
-- Date: 2025-10-08
-- Purpose: Track which questions come from Google Sheets curated bank vs AI-generated
-- Related: PRD_PREPARE_MODULE_MODEL_ANSWERS.md - Phase 4

-- Add CSV tracking columns to ai_prepare_questions table
ALTER TABLE ai_prepare_questions
ADD COLUMN IF NOT EXISTS csv_question_number INTEGER,
ADD COLUMN IF NOT EXISTS csv_question_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_from_curated_bank BOOLEAN DEFAULT false;

-- Add index on csv_question_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_csv_question_number
ON ai_prepare_questions(csv_question_number);

-- Add index on is_from_curated_bank for filtering
CREATE INDEX IF NOT EXISTS idx_is_from_curated_bank
ON ai_prepare_questions(is_from_curated_bank);

-- Add comment to columns for documentation
COMMENT ON COLUMN ai_prepare_questions.csv_question_number IS 'Question number from Google Sheets (1-125), NULL if AI-generated';
COMMENT ON COLUMN ai_prepare_questions.csv_question_stage IS 'Interview stage from CSV (phone-screening, functional-team, hiring-manager, sme-expert, executive-leadership)';
COMMENT ON COLUMN ai_prepare_questions.is_from_curated_bank IS 'True if question sourced from Google Sheets, False if AI-generated';

-- Verification query (run after migration)
-- SELECT csv_question_number, csv_question_stage, is_from_curated_bank, question_text
-- FROM ai_prepare_questions
-- WHERE created_at > NOW() - INTERVAL '1 hour'
-- ORDER BY created_at DESC
-- LIMIT 10;
