-- Manual schema deployment for P3 Interview Academy
-- Run this SQL directly against the production database

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-session-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
  user_id VARCHAR(255) NOT NULL,
  scenario_id VARCHAR(255) NOT NULL,
  interview_stage VARCHAR(100) NOT NULL,
  job_position VARCHAR(255),
  company_name VARCHAR(255),
  difficulty_level VARCHAR(50) DEFAULT 'intermediate',
  preferred_language VARCHAR(10) DEFAULT 'en',
  total_questions INTEGER DEFAULT 20,
  current_question_number INTEGER DEFAULT 1,
  session_status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  overall_score DECIMAL(5,2),
  feedback_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create practice_messages table
CREATE TABLE IF NOT EXISTS practice_messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-message-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
  session_id VARCHAR(255) NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  question_number INTEGER,
  response_time INTEGER,
  star_score DECIMAL(5,2),
  feedback TEXT,
  cultural_context TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create practice_reports table
CREATE TABLE IF NOT EXISTS practice_reports (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-report-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
  session_id VARCHAR(255) NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) NOT NULL,
  star_breakdown JSONB,
  detailed_feedback TEXT,
  strengths TEXT[],
  improvement_areas TEXT[],
  recommendations TEXT[],
  cultural_insights TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_practice_messages_session_id ON practice_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_messages_type ON practice_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_practice_reports_session_id ON practice_reports(session_id);

-- Verify tables were created
SELECT
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables
WHERE tablename LIKE 'practice_%'
ORDER BY tablename;