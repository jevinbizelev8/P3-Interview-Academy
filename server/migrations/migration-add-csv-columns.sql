-- Migration: Add CSV Question Tracking Columns
-- Date: 2025-10-08
-- PR: #6 - Google Sheets Model Answer Integration
-- Purpose: Add columns to track CSV question metadata for model answer integration

-- Add CSV tracking columns to ai_prepare_questions table
ALTER TABLE ai_prepare_questions
ADD COLUMN IF NOT EXISTS csv_question_number INTEGER,
ADD COLUMN IF NOT EXISTS csv_question_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_from_curated_bank BOOLEAN DEFAULT false;

-- Add index for performance on csv_question_number lookups
CREATE INDEX IF NOT EXISTS idx_csv_question_number
ON ai_prepare_questions(csv_question_number);

-- Verify columns were created successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ai_prepare_questions'
AND column_name IN ('csv_question_number', 'csv_question_stage', 'is_from_curated_bank')
ORDER BY column_name;

-- Expected output:
-- column_name             | data_type         | is_nullable | column_default
-- ------------------------+-------------------+-------------+----------------
-- csv_question_number     | integer           | YES         | NULL
-- csv_question_stage      | character varying | YES         | NULL
-- is_from_curated_bank    | boolean           | YES         | false
