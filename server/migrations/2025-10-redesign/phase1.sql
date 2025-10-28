-- Phase 1: Redesign Database Migration
-- Date: 2025-10-28
-- Implements gamification, learning, and user content schema for the Base44 redesign.

BEGIN;

-- Extend users table with gamification and referral tracking columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_referral_code
  ON users(referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_xp_points
  ON users(xp_points DESC);

-- Optional job descriptions table to support resume associations
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500),
  file_size_bytes INTEGER,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_user
  ON job_descriptions(user_id);

-- Gamification tables
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  requirement_criteria JSONB,
  xp_reward INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_badges_requirement_type ON badges(requirement_type);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  earned_date TIMESTAMP,
  is_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned
  ON user_badges(user_id, earned_date)
  WHERE earned_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_badges_unclaimed
  ON user_badges(user_id, is_claimed)
  WHERE is_claimed = FALSE AND earned_date IS NOT NULL;

-- Learning modules
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage VARCHAR(50) NOT NULL,
  module_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  module_type VARCHAR(50) NOT NULL,
  component_name VARCHAR(100),
  estimated_minutes INTEGER DEFAULT 15,
  difficulty VARCHAR(20) DEFAULT 'beginner',
  xp_reward INTEGER DEFAULT 10,
  credit_cost INTEGER DEFAULT 0,
  prerequisites JSONB,
  learning_objectives JSONB,
  content JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stage, module_number)
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_stage
  ON learning_modules(stage, sort_order);
CREATE INDEX IF NOT EXISTS idx_learning_modules_active
  ON learning_modules(is_active)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_modules_type
  ON learning_modules(module_type);

CREATE TABLE IF NOT EXISTS user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE,
  time_spent_minutes INTEGER DEFAULT 0,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  user_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_module_progress_user_id ON user_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_completed
  ON user_module_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_module ON user_module_progress(module_id);

-- Self introduction drafts and finalized scripts
CREATE TABLE IF NOT EXISTS self_intro_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 6),
  step_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_self_intro_drafts_user ON self_intro_drafts(user_id);

CREATE TABLE IF NOT EXISTS self_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  script TEXT NOT NULL,
  video_url VARCHAR(500),
  video_duration_seconds INTEGER,
  ai_feedback JSONB,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_self_intros_user ON self_intros(user_id);
CREATE INDEX IF NOT EXISTS idx_self_intros_active
  ON self_intros(user_id, is_active)
  WHERE is_active = TRUE;

-- Resume storage
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_bytes INTEGER,
  parsed_content TEXT,
  ai_analysis JSONB,
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  jd_match_percentage INTEGER CHECK (jd_match_percentage >= 0 AND jd_match_percentage <= 100),
  job_description_id UUID REFERENCES job_descriptions(id),
  keywords JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_active
  ON resumes(user_id, is_active)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_resumes_jd
  ON resumes(job_description_id)
  WHERE job_description_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS resume_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  strengths JSONB NOT NULL,
  gaps JSONB NOT NULL,
  keywords_matched JSONB,
  ats_tips JSONB,
  job_description_id UUID REFERENCES job_descriptions(id),
  model_version VARCHAR(50) NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL,
  response_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_user ON resume_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_resume ON resume_analysis_history(resume_id);

-- STAR stories
CREATE TABLE IF NOT EXISTS star_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  tags JSONB,
  ai_feedback JSONB,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_stories_user ON star_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_star_stories_favorite
  ON star_stories(user_id, is_favorite)
  WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_star_stories_tags ON star_stories USING GIN (tags);

-- Actual interview tracking
CREATE TABLE IF NOT EXISTS actual_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  position VARCHAR(200) NOT NULL,
  job_description TEXT,
  interview_date TIMESTAMP NOT NULL,
  interview_type VARCHAR(50),
  stage VARCHAR(50),
  outcome VARCHAR(50),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  notes TEXT,
  follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actual_interviews_user ON actual_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_actual_interviews_date
  ON actual_interviews(user_id, interview_date DESC);
CREATE INDEX IF NOT EXISTS idx_actual_interviews_outcome
  ON actual_interviews(user_id, outcome);

-- Reflection journals
CREATE TABLE IF NOT EXISTS reflection_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
  strengths TEXT NOT NULL,
  improvements TEXT NOT NULL,
  action_items TEXT,
  overall_feeling VARCHAR(50),
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflection_journals_user ON reflection_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_journals_session ON reflection_journals(practice_session_id);
CREATE INDEX IF NOT EXISTS idx_reflection_journals_date
  ON reflection_journals(user_id, created_at DESC);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  referred_email VARCHAR(255) NOT NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reward_type VARCHAR(50),
  reward_value INTEGER,
  reward_given BOOLEAN DEFAULT FALSE,
  referred_at TIMESTAMP DEFAULT NOW(),
  signed_up_at TIMESTAMP,
  reward_given_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(referrer_id, status);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  feedback_type VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  page_url VARCHAR(500),
  browser_info JSONB,
  screenshot_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to UUID REFERENCES users(id),
  resolution TEXT,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned
  ON support_tickets(assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

COMMIT;
