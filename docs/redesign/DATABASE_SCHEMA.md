# DATABASE SCHEMA - Base44 MVP Redesign
## P3 Interview Academy - Database Extensions

**Last Updated**: 2025-10-28
**Status**: Planning Phase
**Migration Target**: Week 2-3 (Phase 1)

---

## Overview

This document defines the database schema extensions required for the Base44 MVP redesign. All changes are **additive** - no existing tables are modified destructively.

**Summary**:
- **13 new tables** for gamification, learning, and user content
- **6 new columns** added to existing `users` table
- **0 breaking changes** to existing schema
- **All migrations reversible** via drop table operations

---

## Table of Contents

1. [User Table Extensions](#user-table-extensions)
2. [Gamification Tables](#gamification-tables)
3. [Learning Module Tables](#learning-module-tables)
4. [User Content Tables](#user-content-tables)
5. [Support & Engagement Tables](#support--engagement-tables)
6. [Indexes & Performance](#indexes--performance)
7. [Seed Data Requirements](#seed-data-requirements)
8. [Migration Strategy](#migration-strategy)

---

## User Table Extensions

### Extend Existing `users` Table

Add the following columns to the existing `users` table:

```sql
ALTER TABLE users
ADD COLUMN xp_points INTEGER DEFAULT 0,
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN last_activity_date TIMESTAMP,
ADD COLUMN readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
ADD COLUMN referral_code VARCHAR(50) UNIQUE;

-- Create index for referral code lookups
CREATE INDEX idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Create index for leaderboard queries (if implemented)
CREATE INDEX idx_users_xp_points ON users(xp_points DESC);
```

**Column Descriptions**:
- `xp_points`: Total experience points earned (gamification)
- `current_streak`: Days of consecutive platform activity
- `longest_streak`: Record streak for user achievements
- `last_activity_date`: Tracks last engagement for streak calculation
- `readiness_score`: 0-100 percentage indicating interview readiness
- `referral_code`: Unique code for referral program (nullable)

**Drizzle Schema Addition**:
```typescript
export const users = pgTable("users", {
  // ... existing columns ...
  xpPoints: integer("xp_points").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  readinessScore: integer("readiness_score").default(0),
  referralCode: varchar("referral_code", { length: 50 }).unique(),
});
```

---

## Gamification Tables

### 1. `badges` - Badge Definitions

Stores all available badges users can earn.

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL, -- Lucide icon name
  category VARCHAR(50) NOT NULL, -- 'learning', 'practice', 'achievement', 'milestone'
  requirement_type VARCHAR(50) NOT NULL, -- 'simulations', 'modules', 'streak', 'xp', 'custom'
  requirement_value INTEGER NOT NULL, -- e.g., 10 simulations
  requirement_criteria JSONB, -- Additional criteria (e.g., {"stage": "executive", "min_score": 80})
  xp_reward INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_active ON badges(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_badges_requirement_type ON badges(requirement_type);
```

**Drizzle Schema**:
```typescript
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  iconName: varchar("icon_name", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  requirementType: varchar("requirement_type", { length: 50 }).notNull(),
  requirementValue: integer("requirement_value").notNull(),
  requirementCriteria: jsonb("requirement_criteria"),
  xpReward: integer("xp_reward").default(0),
  rarity: varchar("rarity", { length: 20 }).default("common"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Example Seed Data**:
```sql
INSERT INTO badges (name, description, icon_name, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
('First Steps', 'Complete your first learning module', 'Footprints', 'learning', 'modules', 1, 50, 'common'),
('Quick Learner', 'Complete 5 learning modules', 'Brain', 'learning', 'modules', 5, 100, 'uncommon'),
('Prepared Pro', 'Complete all learning modules in one stage', 'GraduationCap', 'learning', 'modules', 25, 250, 'rare'),
('Simulation Starter', 'Complete your first interview simulation', 'Play', 'practice', 'simulations', 1, 50, 'common'),
('Interview Ready', 'Complete 10 interview simulations', 'Target', 'practice', 'simulations', 10, 200, 'rare'),
('Streak Warrior', 'Maintain a 7-day practice streak', 'Flame', 'achievement', 'streak', 7, 150, 'uncommon'),
('Century Club', 'Earn 1000 XP points', 'Trophy', 'milestone', 'xp', 1000, 100, 'rare');
```

---

### 2. `user_badges` - User Badge Progress

Tracks users' earned badges and progress toward unearned badges.

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0, -- Current progress toward requirement
  earned_date TIMESTAMP, -- NULL if not earned yet
  is_claimed BOOLEAN DEFAULT FALSE, -- User has acknowledged earning
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(user_id, earned_date) WHERE earned_date IS NOT NULL;
CREATE INDEX idx_user_badges_unclaimed ON user_badges(user_id, is_claimed) WHERE is_claimed = FALSE AND earned_date IS NOT NULL;
```

**Drizzle Schema**:
```typescript
export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: uuid("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0),
  earnedDate: timestamp("earned_date"),
  isClaimed: boolean("is_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserBadge: unique().on(table.userId, table.badgeId),
}));
```

---

## Learning Module Tables

### 3. `learning_modules` - Learning Content Definitions

Stores all learning module definitions and content.

```sql
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage VARCHAR(50) NOT NULL, -- 'hr_screening', 'functional_team', 'hiring_manager', 'subject_matter', 'executive'
  module_number INTEGER NOT NULL, -- 1-12 per stage
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  module_type VARCHAR(50) NOT NULL, -- 'interactive', 'practice', 'content', 'quiz'
  component_name VARCHAR(100), -- React component to render (e.g., 'ElevatorPitchBuilder')
  estimated_minutes INTEGER DEFAULT 15,
  difficulty VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  xp_reward INTEGER DEFAULT 10,
  credit_cost INTEGER DEFAULT 0,
  prerequisites JSONB, -- Array of module IDs: ["uuid1", "uuid2"]
  learning_objectives JSONB, -- Array of objectives
  content JSONB, -- Module-specific content data
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stage, module_number)
);

-- Indexes
CREATE INDEX idx_learning_modules_stage ON learning_modules(stage, sort_order);
CREATE INDEX idx_learning_modules_active ON learning_modules(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_learning_modules_type ON learning_modules(module_type);
```

**Drizzle Schema**:
```typescript
export const learningModules = pgTable("learning_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  stage: varchar("stage", { length: 50 }).notNull(),
  moduleNumber: integer("module_number").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(),
  componentName: varchar("component_name", { length: 100 }),
  estimatedMinutes: integer("estimated_minutes").default(15),
  difficulty: varchar("difficulty", { length: 20 }).default("beginner"),
  xpReward: integer("xp_reward").default(10),
  creditCost: integer("credit_cost").default(0),
  prerequisites: jsonb("prerequisites"),
  learningObjectives: jsonb("learning_objectives"),
  content: jsonb("content"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStageModule: unique().on(table.stage, table.moduleNumber),
}));
```

**Example Seed Data** (see seed data section below)

---

### 4. `user_module_progress` - User Learning Progress

Tracks user progress through learning modules.

```sql
CREATE TABLE user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE,
  time_spent_minutes INTEGER DEFAULT 0,
  score INTEGER CHECK (score >= 0 AND score <= 100), -- For quizzes/assessments
  user_data JSONB, -- Module-specific user data (e.g., quiz answers, exercise results)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Indexes
CREATE INDEX idx_user_module_progress_user_id ON user_module_progress(user_id);
CREATE INDEX idx_user_module_progress_completed ON user_module_progress(user_id, is_completed);
CREATE INDEX idx_user_module_progress_module ON user_module_progress(module_id);
```

**Drizzle Schema**:
```typescript
export const userModuleProgress = pgTable("user_module_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: uuid("module_id").notNull().references(() => learningModules.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  isCompleted: boolean("is_completed").default(false),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  score: integer("score"),
  userData: jsonb("user_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserModule: unique().on(table.userId, table.moduleId),
}));
```

---

## User Content Tables

### 5. `self_intro_drafts` - Self-Introduction Auto-Save

Stores auto-saved drafts of the self-introduction wizard (6-step process).

```sql
CREATE TABLE self_intro_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 6),
  step_data JSONB NOT NULL, -- Form data for this step
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, step_number)
);

-- Index
CREATE INDEX idx_self_intro_drafts_user ON self_intro_drafts(user_id);
```

**Drizzle Schema**:
```typescript
export const selfIntroDrafts = pgTable("self_intro_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  stepData: jsonb("step_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserStep: unique().on(table.userId, table.stepNumber),
}));
```

---

### 6. `self_intros` - Finalized Self-Introductions

Stores finalized self-introduction scripts and videos.

```sql
CREATE TABLE self_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1, -- Allow multiple versions
  script TEXT NOT NULL,
  video_url VARCHAR(500), -- S3 URL or local path
  video_duration_seconds INTEGER,
  ai_feedback JSONB, -- AI analysis of script/video
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  is_active BOOLEAN DEFAULT TRUE, -- Current active version
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_self_intros_user ON self_intros(user_id);
CREATE INDEX idx_self_intros_active ON self_intros(user_id, is_active) WHERE is_active = TRUE;
```

**Drizzle Schema**:
```typescript
export const selfIntros = pgTable("self_intros", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").default(1),
  script: text("script").notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  videoDurationSeconds: integer("video_duration_seconds"),
  aiFeedback: jsonb("ai_feedback"),
  overallScore: integer("overall_score"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 7. `resumes` - Resume Storage & Analysis

Stores uploaded resumes and AI analysis results.

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL, -- S3 URL or local path
  file_size_bytes INTEGER,
  parsed_content TEXT, -- Extracted text from PDF
  ai_analysis JSONB, -- Complete AI analysis results
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  jd_match_percentage INTEGER CHECK (jd_match_percentage >= 0 AND jd_match_percentage <= 100),
  job_description_id UUID REFERENCES job_descriptions(id), -- Optional: associated JD
  keywords JSONB, -- Extracted keywords array
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_active ON resumes(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_resumes_jd ON resumes(job_description_id) WHERE job_description_id IS NOT NULL;
```

**Drizzle Schema**:
```typescript
export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  parsedContent: text("parsed_content"),
  aiAnalysis: jsonb("ai_analysis"),
  atsScore: integer("ats_score"),
  jdMatchPercentage: integer("jd_match_percentage"),
  jobDescriptionId: uuid("job_description_id").references(() => jobDescriptions.id),
  keywords: jsonb("keywords"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 8. `star_stories` - STAR Method Story Library

Stores user's behavioral interview stories using the STAR method.

```sql
CREATE TABLE star_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  tags JSONB, -- Array of tags: ["leadership", "conflict-resolution"]
  ai_feedback JSONB, -- AI analysis of story quality
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0, -- Times used in simulations
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_star_stories_user ON star_stories(user_id);
CREATE INDEX idx_star_stories_favorite ON star_stories(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_star_stories_tags ON star_stories USING GIN (tags);
```

**Drizzle Schema**:
```typescript
export const starStories = pgTable("star_stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  tags: jsonb("tags"),
  aiFeedback: jsonb("ai_feedback"),
  overallScore: integer("overall_score"),
  isFavorite: boolean("is_favorite").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 9. `actual_interviews` - Real Interview Tracking

Tracks user's actual job interviews for performance correlation.

```sql
CREATE TABLE actual_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  position VARCHAR(200) NOT NULL,
  job_description TEXT,
  interview_date TIMESTAMP NOT NULL,
  interview_type VARCHAR(50), -- 'phone', 'video', 'in-person', 'technical', 'behavioral'
  stage VARCHAR(50), -- 'screening', 'technical', 'manager', 'final', etc.
  outcome VARCHAR(50), -- 'passed', 'rejected', 'pending', 'offer', 'accepted', 'declined'
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  notes TEXT,
  follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_actual_interviews_user ON actual_interviews(user_id);
CREATE INDEX idx_actual_interviews_date ON actual_interviews(user_id, interview_date DESC);
CREATE INDEX idx_actual_interviews_outcome ON actual_interviews(user_id, outcome);
```

**Drizzle Schema**:
```typescript
export const actualInterviews = pgTable("actual_interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  jobDescription: text("job_description"),
  interviewDate: timestamp("interview_date").notNull(),
  interviewType: varchar("interview_type", { length: 50 }),
  stage: varchar("stage", { length: 50 }),
  outcome: varchar("outcome", { length: 50 }),
  confidenceLevel: integer("confidence_level"),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 10. `reflection_journals` - Post-Simulation Reflections

Stores user reflections after interview simulations.

```sql
CREATE TABLE reflection_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
  strengths TEXT NOT NULL,
  improvements TEXT NOT NULL,
  action_items TEXT,
  overall_feeling VARCHAR(50), -- 'confident', 'neutral', 'nervous', 'prepared', 'unprepared'
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reflection_journals_user ON reflection_journals(user_id);
CREATE INDEX idx_reflection_journals_session ON reflection_journals(practice_session_id);
CREATE INDEX idx_reflection_journals_date ON reflection_journals(user_id, created_at DESC);
```

**Drizzle Schema**:
```typescript
export const reflectionJournals = pgTable("reflection_journals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  practiceSessionId: uuid("practice_session_id").references(() => practiceSessions.id, { onDelete: "set null" }),
  strengths: text("strengths").notNull(),
  improvements: text("improvements").notNull(),
  actionItems: text("action_items"),
  overallFeeling: varchar("overall_feeling", { length: 50 }),
  moodScore: integer("mood_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Support & Engagement Tables

### 11. `referrals` - Referral Program

Tracks user referrals and rewards.

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL, -- Copy of referrer's code for tracking
  referred_email VARCHAR(255) NOT NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'signed_up', 'completed', 'rewarded'
  reward_type VARCHAR(50), -- 'credits', 'xp', 'subscription_discount'
  reward_value INTEGER,
  reward_given BOOLEAN DEFAULT FALSE,
  referred_at TIMESTAMP DEFAULT NOW(),
  signed_up_at TIMESTAMP,
  reward_given_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_email ON referrals(referred_email);
CREATE INDEX idx_referrals_status ON referrals(referrer_id, status);
```

**Drizzle Schema**:
```typescript
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 50 }).notNull(),
  referredEmail: varchar("referred_email", { length: 255 }).notNull(),
  referredUserId: uuid("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).default("pending"),
  rewardType: varchar("reward_type", { length: 50 }),
  rewardValue: integer("reward_value"),
  rewardGiven: boolean("reward_given").default(false),
  referredAt: timestamp("referred_at").defaultNow(),
  signedUpAt: timestamp("signed_up_at"),
  rewardGivenAt: timestamp("reward_given_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 12. `feedback` - User Feedback

Stores user feedback and feature requests.

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  feedback_type VARCHAR(50) NOT NULL, -- 'bug', 'feature_request', 'improvement', 'praise', 'other'
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  page_url VARCHAR(500), -- Where feedback was submitted
  browser_info JSONB, -- User agent, screen size, etc.
  screenshot_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_review', 'planned', 'in_progress', 'completed', 'wont_fix'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);
```

**Drizzle Schema**:
```typescript
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  pageUrl: varchar("page_url", { length: 500 }),
  browserInfo: jsonb("browser_info"),
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 13. `support_tickets` - Support Requests

Stores customer support tickets.

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "P3-2024-00123"
  category VARCHAR(50) NOT NULL, -- 'technical', 'billing', 'account', 'feedback', 'general'
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID REFERENCES users(id), -- Admin user
  resolution TEXT,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);
```

**Drizzle Schema**:
```typescript
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Indexes & Performance

### Summary of All Indexes

**User Table**:
- `idx_users_referral_code` - Referral code lookups
- `idx_users_xp_points` - Leaderboard queries (optional)

**Badges**:
- `idx_badges_category` - Filter by category
- `idx_badges_active` - Active badges only
- `idx_badges_requirement_type` - Filter by requirement type

**User Badges**:
- `idx_user_badges_user_id` - User's badges
- `idx_user_badges_earned` - Earned badges only
- `idx_user_badges_unclaimed` - Unclaimed rewards

**Learning Modules**:
- `idx_learning_modules_stage` - Stage-based queries with sorting
- `idx_learning_modules_active` - Active modules only
- `idx_learning_modules_type` - Filter by type

**User Module Progress**:
- `idx_user_module_progress_user_id` - User's progress
- `idx_user_module_progress_completed` - Completed modules
- `idx_user_module_progress_module` - Module popularity

**Self Intro Drafts**:
- `idx_self_intro_drafts_user` - User's drafts

**Self Intros**:
- `idx_self_intros_user` - User's versions
- `idx_self_intros_active` - Active version

**Resumes**:
- `idx_resumes_user` - User's resumes
- `idx_resumes_active` - Active resume
- `idx_resumes_jd` - JD associations

**STAR Stories**:
- `idx_star_stories_user` - User's stories
- `idx_star_stories_favorite` - Favorites
- `idx_star_stories_tags` - GIN index for tag search

**Actual Interviews**:
- `idx_actual_interviews_user` - User's interviews
- `idx_actual_interviews_date` - Chronological queries
- `idx_actual_interviews_outcome` - Filter by outcome

**Reflection Journals**:
- `idx_reflection_journals_user` - User's reflections
- `idx_reflection_journals_session` - Session associations
- `idx_reflection_journals_date` - Chronological queries

**Referrals**:
- `idx_referrals_referrer` - Referrer's referrals
- `idx_referrals_code` - Code lookups
- `idx_referrals_email` - Email lookups
- `idx_referrals_status` - Status queries

**Feedback**:
- `idx_feedback_user` - User's feedback
- `idx_feedback_type` - Type filtering
- `idx_feedback_status` - Status filtering
- `idx_feedback_created` - Chronological queries

**Support Tickets**:
- `idx_support_tickets_user` - User's tickets
- `idx_support_tickets_number` - Ticket number lookup
- `idx_support_tickets_status` - Status filtering
- `idx_support_tickets_assigned` - Assigned tickets
- `idx_support_tickets_created` - Chronological queries

---

## Seed Data Requirements

### Priority 1: Essential Data (Week 2)

**Badges** (15-20 badges):
```sql
-- See badges section above for examples
-- Categories: learning, practice, achievement, milestone
-- Total: 15-20 badges covering all user journeys
```

**Learning Modules** (11 modules across 5 stages):
```sql
-- Stage 1: HR Screening (3 modules)
INSERT INTO learning_modules (stage, module_number, title, description, module_type, component_name, xp_reward) VALUES
('hr_screening', 1, 'Understanding Screening Interviews', 'Learn the purpose and format of HR screening calls', 'content', NULL, 10),
('hr_screening', 2, 'Screening Interview Game', 'Interactive game to practice common screening questions', 'interactive', 'ScreeningInterviewGame', 15),
('hr_screening', 3, 'Elevator Pitch Builder', 'Craft your perfect 30-second introduction', 'interactive', 'ElevatorPitchBuilder', 15);

-- Stage 2: Functional Team (3 modules)
INSERT INTO learning_modules (stage, module_number, title, description, module_type, component_name, xp_reward) VALUES
('functional_team', 1, 'Behavioral Interviewing - STAR Method', 'Master the STAR framework for behavioral questions', 'content', NULL, 10),
('functional_team', 2, 'HR Questions Game', 'Practice common HR behavioral questions', 'interactive', 'HRQuestionsGame', 15),
('functional_team', 3, 'Personal Branding Workshop', 'Build your professional brand story', 'interactive', 'BrandingWorkshop', 20);

-- Stage 3: Hiring Manager (2 modules)
INSERT INTO learning_modules (stage, module_number, title, description, module_type, component_name, xp_reward) VALUES
('hiring_manager', 1, 'Team Dynamics Game', 'Navigate team collaboration scenarios', 'interactive', 'TeamDynamicsGame', 15),
('hiring_manager', 2, 'Manager Perspective Game', 'Understand hiring manager priorities', 'interactive', 'ManagerPerspectiveGame', 15);

-- Stage 4: Subject Matter Expertise (2 modules)
INSERT INTO learning_modules (stage, module_number, title, description, module_type, component_name, xp_reward) VALUES
('subject_matter', 1, 'Technical Framework Game', 'Practice explaining technical concepts clearly', 'interactive', 'TechnicalFrameworkGame', 20),
('subject_matter', 2, 'STAR Story Builder', 'Build your library of behavioral stories', 'practice', 'STARStoryBuilder', 15);

-- Stage 5: Executive/Leadership (1 module)
INSERT INTO learning_modules (stage, module_number, title, description, module_type, component_name, xp_reward) VALUES
('executive', 1, 'Executive Presence Builder', 'Develop executive-level communication skills', 'interactive', 'ExecutivePresenceBuilder', 25);

-- Additional Practice Modules (3 modules)
INSERT INTO learning_modules (stage, module_number, title, description, module_type, component_name, xp_reward) VALUES
('practice', 1, 'Conflict Scenario Practice', 'Handle difficult workplace situations', 'practice', 'ConflictScenarioPractice', 15),
('practice', 2, 'Communication Exercises', 'Improve clarity and confidence', 'practice', 'CommunicationExercises', 10),
('practice', 3, 'Communication Style Quiz', 'Discover your communication strengths', 'quiz', 'CommunicationStyleQuiz', 10);
```

### Priority 2: Reference Data (Week 3)

**Sample STAR Stories** (for templates):
- 3-5 example stories demonstrating high-quality STAR structure
- Used as templates/inspiration for users

**Referral Codes**:
- Generate unique referral codes for existing users
- Format: `P3-{USERNAME}-{RANDOM}` (e.g., "P3-JOHN-X7K9")

---

## Migration Strategy

### Phase 1: Staging Deployment (Week 2)

```bash
# 1. Create migration file
npm run db:generate

# 2. Review generated SQL
cat drizzle/migrations/0001_add_mvp_tables.sql

# 3. Test in local dev
npm run db:migrate

# 4. Deploy to staging
# (via Elastic Beanstalk deployment)

# 5. Verify schema
psql $STAGING_DATABASE_URL -c "\dt"
psql $STAGING_DATABASE_URL -c "\d users"

# 6. Seed initial data
npm run db:seed:mvp
```

### Phase 2: Production Deployment (Week 3)

```bash
# 1. Backup production database
aws rds create-db-snapshot \
  --db-instance-identifier p3-rds-production \
  --db-snapshot-identifier p3-mvp-pre-migration-$(date +%Y%m%d)

# 2. Deploy during maintenance window (low traffic)
npm run db:migrate:production

# 3. Verify schema
psql $PRODUCTION_DATABASE_URL -c "\dt"

# 4. Seed initial data
npm run db:seed:mvp:production

# 5. Monitor for 24 hours
# Check error logs, performance metrics
```

### Rollback Plan

**If migration fails:**
```sql
-- Drop all new tables (order matters due to foreign keys)
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS reflection_journals CASCADE;
DROP TABLE IF EXISTS actual_interviews CASCADE;
DROP TABLE IF EXISTS star_stories CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS self_intros CASCADE;
DROP TABLE IF EXISTS self_intro_drafts CASCADE;
DROP TABLE IF EXISTS user_module_progress CASCADE;
DROP TABLE IF EXISTS learning_modules CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- Remove user table extensions
ALTER TABLE users
DROP COLUMN IF EXISTS xp_points,
DROP COLUMN IF EXISTS current_streak,
DROP COLUMN IF EXISTS longest_streak,
DROP COLUMN IF EXISTS last_activity_date,
DROP COLUMN IF EXISTS readiness_score,
DROP COLUMN IF EXISTS referral_code;
```

**Restore from backup (if needed)**:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier p3-rds-production-restored \
  --db-snapshot-identifier p3-mvp-pre-migration-YYYYMMDD
```

---

## Data Retention & Privacy

### GDPR Compliance

**User Data Deletion**:
- All tables use `ON DELETE CASCADE` for user_id foreign keys
- When user deletes account, all related data is automatically removed
- Exceptions: `feedback` and `support_tickets` use `SET NULL` for user_id (retain feedback/tickets for product improvement, but anonymize)

**Data Export**:
- Users can request export of all personal data
- Include: badges, learning progress, self-intros, resumes, STAR stories, reflections, interviews

**Data Retention**:
- Active users: Retain all data indefinitely
- Inactive users (>2 years): Notify before deletion
- Deleted users: Immediate cascade deletion
- Backups: 7-day retention (per existing RDS policy)

---

## Performance Considerations

### Expected Data Growth

**Assumptions**:
- 10,000 users over 12 months
- Average user completes 5 modules, 3 simulations, earns 5 badges

**Estimated Row Counts (after 12 months)**:
- `badges`: 20 rows (static)
- `user_badges`: 50,000 rows (10k users × 5 badges)
- `learning_modules`: 50 rows (static)
- `user_module_progress`: 50,000 rows (10k users × 5 modules)
- `self_intro_drafts`: 60,000 rows (10k users × 6 steps, ephemeral)
- `self_intros`: 15,000 rows (10k users × 1.5 versions)
- `resumes`: 15,000 rows (10k users × 1.5 resumes)
- `star_stories`: 50,000 rows (10k users × 5 stories)
- `actual_interviews`: 30,000 rows (10k users × 3 interviews)
- `reflection_journals`: 30,000 rows (10k users × 3 reflections)
- `referrals`: 5,000 rows (50% referral rate)
- `feedback`: 2,000 rows (20% of users)
- `support_tickets`: 1,000 rows (10% of users)

**Total New Rows**: ~308,000 rows (manageable)

### Query Optimization

**Most Frequent Queries**:
1. Get user profile with XP, streak, readiness (1 query, indexed)
2. Get user's badges (indexed on user_id)
3. Get user's learning progress (indexed on user_id)
4. Calculate readiness score (aggregates across 5+ tables)

**Optimization Strategies**:
- Cache readiness score calculation (update on trigger, not calculate on read)
- Denormalize frequently accessed counts (e.g., total_badges_earned in users table)
- Use materialized views for leaderboards (if implemented)

---

## Testing Checklist

### Schema Validation
- [ ] All tables create successfully
- [ ] All foreign keys resolve
- [ ] All constraints work (CHECK, UNIQUE)
- [ ] All indexes created
- [ ] User table extensions applied

### Data Integrity
- [ ] Cascade deletes work correctly
- [ ] JSONB fields accept valid JSON
- [ ] Default values applied correctly
- [ ] Timestamps auto-populate

### Performance
- [ ] Queries use indexes (EXPLAIN ANALYZE)
- [ ] No full table scans on common queries
- [ ] Readiness score calculation < 100ms
- [ ] Badge awarding logic < 50ms

### Seed Data
- [ ] All badges seed successfully
- [ ] All learning modules seed successfully
- [ ] No duplicate seed data
- [ ] Foreign key references valid

---

## Summary

This schema adds **13 new tables** and **6 user table columns** to support:
- ✅ Gamification (badges, XP, streaks, readiness score)
- ✅ Learning Hub (11 interactive modules)
- ✅ User content (self-intros, resumes, STAR stories)
- ✅ Engagement (reflections, interview tracking, referrals)
- ✅ Support (feedback, tickets)

**Key Design Principles**:
- Additive only (no breaking changes)
- GDPR compliant (cascade deletes)
- Indexed for performance
- Reversible (rollback plan)
- Production-ready

**Next Steps**:
1. Review and approve schema
2. Generate Drizzle migration
3. Test in local dev environment
4. Deploy to staging with seed data
5. Monitor for 1 week
6. Deploy to production

---

**Document Version**: 1.0
**Created**: 2025-10-28
**Author**: Claude Code
**Status**: Ready for Review
