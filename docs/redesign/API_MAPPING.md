# API Mapping: Base44 SDK → Express REST API

This document provides the complete mapping from Base44 SDK calls to our Express REST API endpoints.

---

## 🔑 Authentication & Session

### Base44 SDK
```javascript
import { User } from '@/api/entities';

// Login
await User.login({ email, password });

// Signup
await User.signup({ email, password, name });

// Get current user
const user = await User.me();

// Logout
await User.logout();
```

### Express API
```typescript
// Login
POST /api/auth/login
Body: { username: string, password: string }
Response: { user: User, message: string }

// Signup
POST /api/auth/signup
Body: { username: string, email: string, password: string }
Response: { user: User, message: string }

// Get current user
GET /api/auth/user
Response: { user: User }

// Logout
POST /api/auth/logout
Response: { message: string }
```

**Notes**:
- Already implemented with Passport.js
- Email verification already in place
- Session management handled by connect-pg-simple

---

## 👤 User Profile

### Base44 SDK
```javascript
import { UserProfile } from '@/api/entities';

// Get profile
const profile = await UserProfile.get({ id: userId });

// Update profile
await UserProfile.update({ id: userId, ...data });
```

### Express API
```typescript
// Get profile
GET /api/user/profile
Response: {
  id: string,
  username: string,
  email: string,
  total_points: number,
  current_streak: number,
  readiness_score: number,
  ...
}

// Update profile
PUT /api/user/profile
Body: { name?: string, preferences?: object, ... }
Response: { user: User, message: string }
```

**New Fields to Add**:
- `total_points` (integer)
- `current_streak` (integer)
- `longest_streak` (integer)
- `readiness_score` (integer, 0-100)
- `referral_code` (string, unique)

---

## 📚 Learning Modules (Prepare)

### Base44 SDK
```javascript
import { LearningModule, UserModuleProgress } from '@/api/entities';

// Get all modules
const modules = await LearningModule.list();

// Get modules by stage
const modules = await LearningModule.list({ stage: 'hr_screening' });

// Get user progress
const progress = await UserModuleProgress.list({ userId });

// Update progress
await UserModuleProgress.create({
  userId,
  moduleId,
  completed: true,
  completedAt: new Date()
});
```

### Express API
```typescript
// Get all learning modules
GET /api/prepare/modules
Response: { modules: LearningModule[] }

// Get modules by stage
GET /api/prepare/modules?stage=hr_screening
Response: { modules: LearningModule[] }

// Get user progress for all modules
GET /api/prepare/modules/progress
Response: { progress: UserModuleProgress[] }

// Update module progress
POST /api/prepare/modules/progress
Body: {
  moduleId: string,
  completed: boolean,
  score?: number,
  timeSpent?: number
}
Response: { progress: UserModuleProgress, message: string }

// Get readiness score
GET /api/prepare/readiness-score
Response: {
  score: number,  // 0-100
  breakdown: {
    hr_screening: number,
    functional_team: number,
    manager: number,
    executive: number
  }
}
```

**Readiness Score Algorithm**:
1. Pull the latest `user_module_progress` rows grouped by stage and compute completion ratio per stage.
2. Weight stage completion using `{ hr_screening: 0.25, functional_team: 0.30, manager: 0.25, executive: 0.20 }`.
3. Apply score modifiers:
   - +5 points if `practice_sessions.completed >= 3` in trailing 7 days.
   - +5 points if latest resume feedback score ≥ 80.
   - +5 points if self-intro AI feedback overall ≥ 4/5.
4. Clamp final value between 0-100 and round to nearest integer.

```typescript
const weighted = Object.entries(stageScores).reduce((acc, [stage, score]) => (
  acc + score * STAGE_WEIGHTS[stage as StageKey]
), 0);
const modifiers = calcPracticeBonus(userId) + calcResumeBonus(userId) + calcSelfIntroBonus(userId);
return clamp(Math.round(weighted + modifiers), 0, 100);
```

Add Vitest coverage in `server/services/__tests__/readiness-service.test.ts` for thresholds (0%, 50%, 100%), modifier stacking, and regression for negative inputs.

**Database Tables Needed**:
```sql
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  stage TEXT NOT NULL,  -- 'hr_screening', 'functional_team', etc.
  description TEXT,
  is_interactive BOOLEAN DEFAULT false,
  interactive_component TEXT,  -- Component name
  practice_component TEXT,  -- Practice component name
  credit_cost INTEGER DEFAULT 0,
  estimated_time INTEGER,  -- minutes
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_module_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  module_id UUID REFERENCES learning_modules(id),
  completed BOOLEAN DEFAULT false,
  score INTEGER,  -- 0-100
  time_spent INTEGER,  -- seconds
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);
```

---

## 📝 Self-Introduction

### Base44 SDK
```javascript
import { SelfIntroDraft, SelfIntro } from '@/api/entities';

// Save draft
await SelfIntroDraft.create({ userId, content, step });

// Get draft
const draft = await SelfIntroDraft.get({ userId });

// Finalize self-intro
await SelfIntro.create({ userId, content, videoUrl });
```

### Express API
```typescript
// Save draft
POST /api/prepare/self-intro/draft
Body: {
  content: string,
  step: number,  // Current wizard step
  data: object  // Step-specific data
}
Response: { draft: SelfIntroDraft, message: string }

// Get latest draft
GET /api/prepare/self-intro/draft
Response: { draft: SelfIntroDraft | null }

// Finalize self-intro
POST /api/prepare/self-intro/finalize
Body: {
  content: string,
  video_url?: string,
  transcript?: string
}
Response: { selfIntro: SelfIntro, message: string }

// Get finalized self-intro
GET /api/prepare/self-intro
Response: { selfIntro: SelfIntro | null }
```

**Database Tables**:
```sql
CREATE TABLE self_intro_drafts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT,
  step INTEGER DEFAULT 1,
  data JSONB,  -- Step-specific data
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE self_intros (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  video_url TEXT,
  transcript TEXT,
  ai_feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**AI Feedback Flow (Self-Intro)**:
1. Build OpenAI prompt with sections: user persona, module stage, drafted content, and rubric emphasizing STAR storytelling and executive tone.
2. Call `POST https://api.openai.com/v1/responses` with `model=gpt-4o-mini` and max 800 tokens; temperature 0.4 for deterministic tone.
3. Parse response into `{ overallScore: 1-5, strengths: string[], improvements: string[], suggestedHook: string }`.
4. Persist structured feedback in `self_intros.ai_feedback` and broadcast via WebSocket event `selfIntro.feedback.generated` for real-time UI update.
5. Log prompt/response hashes in `audit_logs` to support moderation and rollback.

---

## 📄 Resume Analyzer

### Base44 SDK
```javascript
import { Resume } from '@/api/entities';

// Upload resume
const resume = await Resume.create({ userId, file });

// Analyze resume
const analysis = await Resume.analyze({ id: resumeId });

// Get resume
const resume = await Resume.get({ id: resumeId });
```

### Express API
```typescript
// Upload resume
POST /api/prepare/resume/upload
Content-Type: multipart/form-data
Body: { file: File }  // PDF or DOCX
Response: { resume: Resume, message: string }

// Analyze resume with AI
POST /api/prepare/resume/analyze
Body: { resumeId: string, jobDescription?: string }
Response: {
  analysis: {
    strengths: string[],
    weaknesses: string[],
    suggestions: string[],
    keywords: string[],
    score: number,  // 0-100
    detailed_feedback: string
  },
  message: string
}

// Get resume and analysis
GET /api/prepare/resume/:id
Response: { resume: Resume, analysis: object | null }

// List user resumes
GET /api/prepare/resumes
Response: { resumes: Resume[] }
```

**Database Table**:
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,  -- S3 or local storage
  file_size INTEGER,
  content_text TEXT,  -- Extracted text
  analysis JSONB,  -- AI analysis results
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**AI Feedback Flow (Resume Analyzer)**:
1. Extract plain text via `pdf-parse` (PDF) or `mammoth` (DOCX) and normalize whitespace.
2. Build comparison prompt with job description (if provided) including ATS keyword emphasis and bullet rewriting rubric.
3. Invoke OpenAI `responses` API (`model=gpt-4o-mini`, temperature 0.2, json_mode true) requesting schema `{ score, strengths[], gaps[], keywordMatches[], atsTips[] }`.
4. Persist analysis snapshot in `resumes.analysis` with `version` metadata for diffing and append summary to `resume_analysis_history` table (see Database Schema doc).
5. Emit `resume.analysis.completed` event for UI toast and gamification bonus evaluation.

**Notes**:
- Use existing OpenAI integration for analysis
- May need to add resume parsing library (pdf-parse, mammoth)
- Store files in S3 or local storage

---

## 🎯 STAR Stories & Practice

### Base44 SDK
```javascript
// (Base44 doesn't have explicit API, uses components)
```

### Express API
```typescript
// Save STAR story
POST /api/prepare/star-stories
Body: {
  title: string,
  situation: string,
  task: string,
  action: string,
  result: string,
  tags?: string[]
}
Response: { story: StarStory, message: string }

// Get user's STAR stories
GET /api/prepare/star-stories
Response: { stories: StarStory[] }

// Update STAR story
PUT /api/prepare/star-stories/:id
Body: { /* same as create */ }
Response: { story: StarStory, message: string }

// Delete STAR story
DELETE /api/prepare/star-stories/:id
Response: { message: string }
```

**Database Table**:
```sql
CREATE TABLE star_stories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  tags TEXT[],
  ai_feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎮 Practice Module (Simulations)

### Base44 SDK
```javascript
import { InterviewSimulation } from '@/api/entities';

// Create simulation
const simulation = await InterviewSimulation.create({ userId, config });

// Get simulation history
const history = await InterviewSimulation.list({ userId });

// Get assessment
const assessment = await InterviewSimulation.getAssessment({ id });
```

### Express API
```typescript
// Create new simulation (EXISTING - extend)
POST /api/practice/sessions
Body: {
  language: string,
  job_description?: string,
  difficulty?: string,
  credits_to_use?: number  // NEW
}
Response: { session: PracticeSession }

// Get simulation history (NEW)
GET /api/practice/history
Query: { limit?: number, offset?: number }
Response: {
  sessions: PracticeSession[],
  total: number
}

// Get detailed assessment (EXTEND existing)
GET /api/practice/assessment/:sessionId
Response: {
  assessment: {
    overall_score: number,
    star_breakdown: {
      situation: number,
      task: number,
      action: number,
      result: number
    },
    strengths: string[],
    improvements: string[],
    detailed_feedback: string,
    questions: AssessedQuestion[]
  }
}

// Add reflection after practice (NEW)
POST /api/practice/sessions/:id/reflection
Body: {
  reflection_text: string,
  what_went_well: string,
  what_to_improve: string,
  key_learnings: string
}
Response: { reflection: Reflection }
```

**Database Changes**:
```sql
-- Extend practice_sessions table
ALTER TABLE practice_sessions
ADD COLUMN credits_used INTEGER DEFAULT 0,
ADD COLUMN reflection_id UUID REFERENCES reflection_journals(id);
```

---

## 🏆 Gamification System

### Overview
Complete gamification system with XP points, badges, streaks, and readiness score.

---

### 1. User Profile & Gamification

**Get user profile with gamification stats**
```typescript
GET /api/user/profile
Response: {
  user: {
    id: string,
    username: string,
    email: string,
    xp_points: number,
    current_streak: number,
    longest_streak: number,
    last_activity_date: timestamp,
    readiness_score: number,
    referral_code: string,
    credit_balance: number,
    created_at: timestamp
  }
}
```

---

### 2. Badge System (8 endpoints)

**Get all available badges**
```typescript
GET /api/badges
Response: {
  badges: Badge[]  // All 15-20 badges
}
```

**Get user's earned badges**
```typescript
GET /api/user/badges
Response: {
  badges: UserBadge[],
  total_badges: number,
  earned_badges: number,
  progress: BadgeProgress[]  // Badges in progress
}
```

**Claim earned badge** (user acknowledges)
```typescript
POST /api/badges/:id/claim
Response: {
  userBadge: UserBadge,
  xp_awarded: number,
  message: string
}
```

**Get user's XP history**
```typescript
GET /api/user/xp/history
Query: { limit?: number, offset?: number }
Response: {
  history: XPTransaction[],
  total: number
}
```

**Get streak status**
```typescript
GET /api/user/streak
Response: {
  current_streak: number,
  longest_streak: number,
  last_activity_date: timestamp,
  daily_bonus_xp: number
}
```

**Log user activity** (updates streak)
```typescript
POST /api/user/activity
Body: { activity_type: string }
Response: {
  current_streak: number,
  streak_bonus_xp: number,
  message: string
}
```

**Get readiness score**
```typescript
GET /api/user/readiness
Response: {
  readiness_score: number,  // 0-100
  breakdown: {
    simulation_performance: { value: number, weight: 0.60 },
    module_completion: { value: number, weight: 0.20 },
    self_intro_score: { value: number, weight: 0.10 },
    resume_optimization: { value: number, weight: 0.05 },
    practice_consistency: { value: number, weight: 0.05 }
  },
  recommendations: string[]
}
```

**Internal: Award badge** (called by backend logic)
```typescript
POST /api/internal/badges/award
Body: { userId: string, badgeId: string }
Response: { userBadge: UserBadge, xp_awarded: number }
```

---

### 3. Database Schema

**See `docs/redesign/DATABASE_SCHEMA.md` for complete schema**

Key tables:
- `badges` - All available badges (15-20 rows)
- `user_badges` - User's earned badges with progress
- `users` extensions - xp_points, current_streak, longest_streak, readiness_score, referral_code

**XP Distribution** (automatic via gamification service):
- Learning modules: 10-20 XP
- Interview simulations: 50-100 XP (varies by difficulty)
- High performance bonus: +25 XP (>80%), +50 XP (>90%)
- Badge earning: 50-250 XP (varies by rarity)
- Self-intro assessment: 25-50 XP
- Resume analysis: 25 XP
- Daily streak: +5 to +N XP (scaling)
- Reflection journals: 15-20 XP

**Badge Trigger Matrix**:

| Badge Key | Requirement | Trigger Logic | Notes |
|-----------|-------------|---------------|-------|
| `first_steps` | Complete 1 learning module | Fire when `user_module_progress.completed_count === 1` | Grants +50 XP |
| `stage_master_{stage}` | Finish all modules in stage | Check on module completion when remaining_in_stage === 0 | Creates readiness bump (+3) |
| `streak_warrior` | 7-day streak | Evaluate during daily cron when `current_streak >= 7` | Resets if gap >24h |
| `simulation_pro` | 10 simulations with score ≥80 | Trigger after simulation save by aggregating last 90 days | Adds +100 XP |
| `resume_ace` | Resume score ≥90 twice | Trigger when storing resume analysis history | Unlocks resume template download |

Record all badge awards via `user_badges` insert + `audit_logs` entry for observability.

---

### 4. Backend Services

**To be created**:
- `server/services/gamification-service.ts` - Badge awarding, XP distribution
- `server/services/readiness-service.ts` - Readiness score calculation

---

## 📊 Perform Module (Analytics)

### Base44 SDK
```javascript
import { ActualInterview, ReflectionJournal } from '@/api/entities';

// Log actual interview
const interview = await ActualInterview.create({ userId, data });

// Create reflection
const reflection = await ReflectionJournal.create({ userId, content });

// Get reflections
const reflections = await ReflectionJournal.list({ userId });
```

### Express API
```typescript
// Log actual interview
POST /api/perform/actual-interviews
Body: {
  company: string,
  position: string,
  date: date,
  outcome?: string,
  notes?: string,
  preparation_used: string[],  // Module IDs
  practice_sessions_used: string[]  // Session IDs
}
Response: { interview: ActualInterview }

// Get logged interviews
GET /api/perform/actual-interviews
Response: { interviews: ActualInterview[] }

// Update interview
PUT /api/perform/actual-interviews/:id
Body: { /* same fields as create */ }
Response: { interview: ActualInterview }

// Create reflection journal
POST /api/perform/reflections
Body: {
  interview_id?: string,
  practice_session_id?: string,
  title: string,
  content: string,
  mood?: string,
  key_learnings?: string[]
}
Response: { reflection: ReflectionJournal }

// Get reflections
GET /api/perform/reflections
Query: { limit?: number, offset?: number }
Response: {
  reflections: ReflectionJournal[],
  total: number
}

// Get analytics/insights
GET /api/perform/insights
Response: {
  total_interviews: number,
  success_rate: number,
  preparation_time: number,
  practice_sessions: number,
  common_strengths: string[],
  areas_to_improve: string[],
  progress_trend: ChartData
}

// Get performance chart data
GET /api/perform/performance-chart
Query: { period: '7d' | '30d' | '90d' }
Response: {
  scores: DataPoint[],
  practice_frequency: DataPoint[],
  improvement_trend: DataPoint[]
}
```

**Database Tables**:
```sql
CREATE TABLE actual_interviews (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  interview_date DATE NOT NULL,
  outcome TEXT,  -- 'pending', 'offer', 'rejected', 'withdrew'
  notes TEXT,
  preparation_used TEXT[],  -- Array of module IDs
  practice_sessions_used TEXT[],  -- Array of session IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reflection_journals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  interview_id UUID REFERENCES actual_interviews(id),
  practice_session_id UUID REFERENCES practice_sessions(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  key_learnings TEXT[],
  ai_insights JSONB,  -- AI-generated insights
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 Credits & Billing

### Base44 SDK
```javascript
import { CreditLedger, Subscription } from '@/api/entities';

// Get balance
const balance = await CreditLedger.getBalance({ userId });

// Get history
const history = await CreditLedger.list({ userId });

// Topup (Stripe)
await Subscription.topup({ userId, amount, packageId });
```

### Express API
```typescript
// Get credit balance
GET /api/credits/balance
Response: {
  balance: number,
  total_earned: number,
  total_spent: number
}

// Get transaction history
GET /api/credits/history
Query: { limit?: number, offset?: number }
Response: {
  transactions: CreditTransaction[],
  total: number
}

// Purchase credits (Stripe integration)
POST /api/credits/topup
Body: {
  package: '100' | '500' | '2000',
  payment_method_id?: string  // Stripe payment method
}
Response: {
  client_secret?: string,  // For Stripe confirmation
  transaction: CreditTransaction
}

// Deduct credits (INTERNAL)
POST /api/credits/deduct
Body: {
  amount: number,
  reason: string,
  reference_id?: string  // Session ID, etc.
}
Response: {
  new_balance: number,
  transaction: CreditTransaction
}
```

**Database Table**:
```sql
CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,  -- Positive for credit, negative for debit
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,  -- 'purchase', 'usage', 'refund', 'bonus'
  reason TEXT,
  reference_id TEXT,  -- Link to session, purchase, etc.
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extend users table
ALTER TABLE users
ADD COLUMN credit_balance INTEGER DEFAULT 0;
```

**Notes**:
- Extend existing Stripe integration (`server/config/stripe.ts`)
- Add credit packages to Stripe products
- Update webhook handler for credit fulfillment

---

## 🔗 Referrals

### Base44 SDK
```javascript
import { Referral } from '@/api/entities';

// Create referral code
const referral = await Referral.create({ userId });

// Apply referral code
await Referral.apply({ code, userId });

// Get stats
const stats = await Referral.getStats({ userId });
```

### Express API
```typescript
// Get or create user's referral code
POST /api/referrals/create
Response: {
  referral_code: string,
  referral_url: string
}

// Get user's referral code
GET /api/referrals/code
Response: {
  referral_code: string,
  referral_url: string
}

// Apply referral code (during signup)
POST /api/referrals/apply
Body: { referral_code: string }
Response: {
  success: boolean,
  credits_awarded: number,
  referrer_credits: number
}

// Get referral statistics
GET /api/referrals/stats
Response: {
  total_referrals: number,
  successful_signups: number,
  credits_earned: number,
  pending_referrals: number
}

// Get list of referrals
GET /api/referrals/referrals
Response: {
  referrals: Referral[]
}
```

**Database Table**:
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID REFERENCES users(id),
  referred_user_id UUID REFERENCES users(id),
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'completed', 'rewarded'
  referrer_credits_awarded INTEGER DEFAULT 0,
  referred_credits_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Extend users table
ALTER TABLE users
ADD COLUMN referral_code TEXT UNIQUE;

-- Index for fast lookups
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
```

---

## 🎫 Support & Feedback

### Base44 SDK
```javascript
import { SupportTicket, Feedback } from '@/api/entities';

// Create support ticket
const ticket = await SupportTicket.create({ userId, subject, message });

// Get tickets
const tickets = await SupportTicket.list({ userId });

// Submit feedback
await Feedback.create({ userId, rating, comment });
```

### Express API
```typescript
// Create support ticket
POST /api/support/tickets
Body: {
  subject: string,
  message: string,
  category?: string,
  priority?: 'low' | 'medium' | 'high'
}
Response: { ticket: SupportTicket }

// Get user's tickets
GET /api/support/tickets
Response: { tickets: SupportTicket[] }

// Get ticket details
GET /api/support/tickets/:id
Response: { ticket: SupportTicket }

// Update ticket (add reply)
PUT /api/support/tickets/:id
Body: { message: string, status?: string }
Response: { ticket: SupportTicket }

// Submit feedback
POST /api/support/feedback
Body: {
  rating: number,  // 1-5
  category: string,
  comment: string,
  page?: string
}
Response: { feedback: Feedback }
```

**Database Tables**:
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'open',  -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'medium',
  admin_response TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  rating INTEGER NOT NULL,  -- 1-5
  category TEXT,
  comment TEXT,
  page TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 Summary Tables

### New API Endpoints Count

| Module | New Endpoints | Extended Endpoints |
|--------|---------------|-------------------|
| Prepare | 15 | 0 |
| Practice | 3 | 2 |
| Perform | 8 | 0 |
| Gamification | 8 | 0 |
| Credits | 4 | 0 |
| Referrals | 5 | 0 |
| Support | 5 | 0 |
| **Total** | **48** | **2** |

### New Database Tables

1. `learning_modules`
2. `user_module_progress`
3. `self_intro_drafts`
4. `self_intros`
5. `resumes`
6. `star_stories`
7. `badges`
8. `user_badges`
9. `point_activities`
10. `actual_interviews`
11. `reflection_journals`
12. `credit_ledger`
13. `referrals`
14. `support_tickets`
15. `feedback`

**Total**: 15 new tables + modifications to `users` and `practice_sessions`

---

**Last Updated**: 2025-10-28
