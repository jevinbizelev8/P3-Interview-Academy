# MASTER PLAN: P3 Interview Academy Redesign

**Branch**: `redesign/mvp-founder-design`
**Start Date**: 2025-10-28
**Phase 0 Complete**: 2025-10-28
**Base44 MVP Location**: `/tmp/elev8interview`
**Status**: ✅ Phase 0 Complete → Phase 1 Ready

---

## 📋 Project Overview

### Goal
Integrate founder's Base44 MVP design with P3's robust backend infrastructure to deliver a world-class interview preparation platform with gamification, learning modules, and enhanced user experience.

### Approach
- **Incremental Integration**: Feature flags for gradual rollout (not big-bang rewrite)
- **Frontend**: Copy Base44 UI components, convert JSX→TSX, integrate with P3 APIs
- **Backend**: Build 48 new endpoints, preserve existing services
- **Database**: Add 13 new tables (gamification, learning, user content)
- **Infrastructure**: Deploy on existing AWS Elastic Beanstalk with CI/CD pipeline
- **AI Services**: OpenAI-only (SeaLion removed, Qwen planned Q1 2026)

### Success Criteria
- ✅ Gamification system fully functional (XP, badges, readiness score)
- ✅ 11 interactive learning modules implemented
- ✅ Base44 design integrated pixel-perfect
- ✅ All existing P3 features preserved (9-criteria evaluation, ASEAN languages)
- ✅ Zero downtime deployment with feature flags
- ✅ User retention improved by +20%

---

## ⏱️ Timeline & Milestones

**Updated Timeline**: 16-20 weeks (realistic with buffer)

| Phase | Duration | Target Date | Status |
|-------|----------|-------------|--------|
| Phase 0: Preparation & Cleanup | 1 day | Week 1 | ✅ **COMPLETE** |
| Phase 1: Database Migration | 2 weeks | Weeks 2-3 | ⏳ Next |
| Phase 2: Backend Services | 3 weeks | Weeks 4-6 | ⏳ Pending |
| Phase 3: API Development | 3 weeks | Weeks 7-9 | ⏳ Pending |
| Phase 4: Frontend Conversion | 3 weeks | Weeks 10-12 | ⏳ Pending |
| Phase 5: Quick Wins Deployment | 1 week | Week 13 | ⏳ Pending |
| Phase 6: Major Features Rollout | 3 weeks | Weeks 14-16 | ⏳ Pending |
| Phase 7: Polish & Optimization | 2 weeks | Weeks 17-18 | ⏳ Pending |
| Phase 8: Production Deployment | 2 weeks | Weeks 19-20 | ⏳ Pending |
| Phase 9: Cleanup & Retrospective | 1 week | Week 21 | ⏳ Pending |
| **Total Realistic** | **16-20 weeks** | **~4-5 months** | - |

---

### ✅ Quality Assurance Milestones

- **Phase 1 (Database Migration)**: Automated migration test suite (`npm run test:db-redesign`) executes Drizzle migration against ephemeral PostgreSQL container and reverts cleanly; seed script dry-run completes with no diff. Generate SQL diff artifact and attach to ops-log.
- **Phase 2 (Backend Services)**: Component smoke tests and API contract tests run against mocked services; record Base44 dependency parity diff in Master Plan Appendix A for reviewer sign-off.
- **Phase 3 (API Development)**: End-to-end Postman/Vitest collection covering 48 endpoints executed in CI; readiness-score unit tests validate weight calculations and edge cases (0%, 50%, 100%).
- **Phase 4 (Frontend Conversion)**: Visual regression screenshots captured against Base44 reference for high-traffic pages; shadcn/tailwind token diff report attached to PR.
- **Phase 5+ (Deployments)**: Staging smoke checklist (login, module progression, credit purchase) signed off before prod promotion; feature flags toggled via runbook below to limit blast radius.

Add test artifacts and signoffs to `docs/ops-log/` after each milestone before promoting the phase as complete.

---

## 📦 Phase Breakdown

### Phase 0: Preparation & Cleanup (1 day) ✅ **COMPLETE**

**Objectives**:
- Remove SeaLion AI service (consolidate to OpenAI-only)
- Complete comprehensive documentation
- Design database schema and gamification system
- Establish project foundation

**Tasks**:
- [x] Clone Base44 MVP repository → `/tmp/elev8interview` ✅
- [x] Comprehensive analysis of both codebases ✅
- [x] Create redesign branch `redesign/mvp-founder-design` ✅
- [x] **Remove SeaLion AI** from all files (now OpenAI-only) ✅
- [x] **Create DATABASE_SCHEMA.md** (1000+ lines, 13 tables) ✅
- [x] **Update CLAUDE.md** v3.0 with redesign documentation ✅
- [x] **Update README.md** (remove SeaLion, add redesign section) ✅
- [x] **Update SECURITY.md** (remove SEALION_API_KEY) ✅
- [x] **Update .env.example** (remove SeaLion variables) ✅
- [x] **Update ops-log** with project kickoff entry ✅
- [x] Update MASTER_PLAN.md (this file) ✅
- [x] Update QUICK_START.md ✅
- [x] Update API_MAPPING.md with gamification endpoints ✅
- [x] Update FEATURES_INVENTORY.md with XP/badges details ✅
- [x] Design gamification system (XP, badges, readiness score) ✅
- [x] Document 48 new API endpoints ✅
- [x] Commit all documentation ✅

**Deliverables**:
- ✅ Complete documentation set in `docs/redesign/` (5 files)
- ✅ SeaLion AI fully removed from codebase
- ✅ Database schema designed (13 tables, 6 user columns)
- ✅ Gamification system fully documented
- ✅ All core documentation updated (CLAUDE.md, README.md, SECURITY.md)
- ✅ Clear understanding of all 51 features
- ✅ Ready-to-implement technical specs

**Status**: ✅ **COMPLETE** (2025-10-28)

---

### Phase 1: Database Migration (2 weeks) ⏳ NEXT

**Objectives**:
- Implement 13 new database tables
- Extend users table with gamification columns
- Deploy schema to staging and production

**Tasks**:
- [ ] Create Drizzle migration file
- [ ] Generate migration skeleton via `npx drizzle-kit generate:pg --out server/migrations/2025-10-redesign`
- [ ] Add 13 new tables (badges, learning_modules, resumes, etc.)
- [ ] Extend users table (xp_points, current_streak, readiness_score, etc.)
- [ ] Add indexes for performance
- [ ] Test migration in local development
- [ ] Add migration regression test (`server/__tests__/migrations/redesign-schema.test.ts`)
- [ ] Create `server/scripts/seed-redesign.ts` for idempotent seeding
- [ ] Deploy schema to staging database
- [ ] Seed initial data (badges, learning modules)
- [ ] Verify schema integrity
- [ ] Deploy to production database
- [ ] Update shared/schema.ts with TypeScript definitions
- [ ] Schedule nightly GitHub Action to run `npm run test:db-redesign`

**Deliverables**:
- Database schema deployed to both environments
- Initial seed data loaded
- All tables verified and indexed
- Migration + seed automation validated via CI artifact

---

### Phase 2: Backend Services Development (3 weeks) ⏳ PENDING

**Objectives**:
- Copy Base44 frontend files to P3
- Install required dependencies
- Configure build system

**Tasks**:
- [ ] Copy `/tmp/elev8interview/src/components/` → `client/src/components/mvp/`
- [ ] Copy `/tmp/elev8interview/src/pages/` → `client/src/pages/mvp/`
- [ ] Copy `/tmp/elev8interview/src/hooks/` → `client/src/hooks/mvp/`
- [ ] Copy `/tmp/elev8interview/src/utils/` → `client/src/utils/mvp/`
- [ ] Install new dependencies from Base44
- [ ] Update tailwind.config.js with Base44 config
- [ ] Test basic page rendering
- [ ] Create stub API client (`client/src/api/mvp-client.ts`)
- [ ] Commit project setup

**Deliverables**:
- All Base44 frontend files in P3
- Dependencies installed
- Basic rendering confirmed

---

### Phase 3: Backend API Development (3-4 weeks) ⏳ PENDING

#### Week 1: Database Schema & Prepare Module APIs

**Database Schema**:
- [ ] Create `migrations/2025-10-redesign-schema.sql`
- [ ] Add tables: badges, user_badges, learning_modules, user_module_progress
- [ ] Add tables: self_intro_drafts, resumes
- [ ] Add tables: reflection_journals, actual_interviews
- [ ] Add tables: referrals, credit_ledger, feedback, support_tickets
- [ ] Update `shared/schema.ts` with new table definitions
- [ ] Add Zod validators for new tables
- [ ] Test migrations on local database

**Prepare Module APIs**:
- [ ] `GET /api/prepare/modules` - Get all learning modules
- [ ] `GET /api/prepare/modules/:stage` - Get modules by stage
- [ ] `POST /api/prepare/modules/progress` - Update progress
- [ ] `GET /api/prepare/modules/progress` - Get user progress
- [ ] `POST /api/prepare/self-intro/draft` - Save draft
- [ ] `GET /api/prepare/self-intro/draft` - Get draft
- [ ] `POST /api/prepare/self-intro/finalize` - Finalize intro
- [ ] `POST /api/prepare/resume/upload` - Upload resume (multipart)
- [ ] `POST /api/prepare/resume/analyze` - Analyze with AI
- [ ] `GET /api/prepare/resume/:id` - Get resume
- [ ] `POST /api/prepare/star-stories` - Save STAR story
- [ ] `GET /api/prepare/star-stories` - Get user stories
- [ ] `GET /api/prepare/readiness-score` - Calculate score

**Services**:
- [ ] Create `server/services/learning-module-service.ts`
- [ ] Create `server/services/resume-service.ts`
- [ ] Create `server/services/self-intro-service.ts`
- [ ] Create `server/services/readiness-service.ts`

**Tests**:
- [ ] Write tests for all Prepare endpoints
- [ ] Test AI integration for resume analysis

#### Week 2: Gamification APIs

**Gamification System**:
- [ ] `GET /api/gamification/badges` - List all badges
- [ ] `GET /api/gamification/user-badges` - Get user badges
- [ ] `POST /api/gamification/award-badge` - Award badge (internal)
- [ ] `POST /api/gamification/add-points` - Add reward points
- [ ] `GET /api/gamification/points` - Get user points
- [ ] `POST /api/gamification/update-streak` - Update streak
- [ ] `GET /api/gamification/streak` - Get user streak
- [ ] `GET /api/gamification/leaderboard` - Leaderboard data

**Services**:
- [ ] Create `server/services/gamification-service.ts`
- [ ] Create `server/services/badge-service.ts`
- [ ] Implement badge award triggers
- [ ] Implement points calculation logic
- [ ] Implement streak tracking logic

**Tests**:
- [ ] Write tests for gamification endpoints
- [ ] Test badge award triggers
- [ ] Test points calculation

#### Week 3: Practice & Perform Module APIs

**Practice Module Enhancements**:
- [ ] `GET /api/practice/history` - Get simulation history
- [ ] `GET /api/practice/assessment/:id` - Detailed assessment
- [ ] Enhance existing assessment format
- [ ] Add detailed scoring breakdown
- [ ] Add reflection prompts after practice

**Perform Module APIs**:
- [ ] `POST /api/perform/actual-interviews` - Log real interview
- [ ] `GET /api/perform/actual-interviews` - Get logged interviews
- [ ] `PUT /api/perform/actual-interviews/:id` - Update interview
- [ ] `POST /api/perform/reflections` - Create reflection journal
- [ ] `GET /api/perform/reflections` - Get user reflections
- [ ] `GET /api/perform/insights` - Analytics data
- [ ] `GET /api/perform/performance-chart` - Chart data
- [ ] `GET /api/perform/stats` - Performance stats

**Services**:
- [ ] Create `server/services/reflection-service.ts`
- [ ] Create `server/services/analytics-service.ts`
- [ ] Create `server/services/performance-service.ts`

**Tests**:
- [ ] Write tests for Practice enhancements
- [ ] Write tests for Perform endpoints

#### Week 4: Credits, Referrals & Support

**Credits System**:
- [ ] `GET /api/credits/balance` - Get user balance
- [ ] `GET /api/credits/history` - Transaction history
- [ ] `POST /api/credits/topup` - Stripe integration (extend existing)
- [ ] `POST /api/credits/deduct` - Deduct credits (internal)
- [ ] Extend Stripe webhook for credit packages

**Referral System**:
- [ ] `POST /api/referrals/create` - Generate referral code
- [ ] `GET /api/referrals/code` - Get user's referral code
- [ ] `POST /api/referrals/apply` - Apply referral code
- [ ] `GET /api/referrals/stats` - Referral statistics
- [ ] `GET /api/referrals/referrals` - List referrals

**Support System**:
- [ ] `POST /api/support/tickets` - Create support ticket
- [ ] `GET /api/support/tickets` - Get user tickets
- [ ] `PUT /api/support/tickets/:id` - Update ticket
- [ ] `POST /api/support/feedback` - Submit feedback
- [ ] `GET /api/support/feedback` - Get user feedback

**Services**:
- [ ] Create `server/services/credit-service.ts`
- [ ] Create `server/services/referral-service.ts`
- [ ] Create `server/services/support-service.ts`

**Tests**:
- [ ] Write tests for Credits endpoints
- [ ] Write tests for Referrals endpoints
- [ ] Write tests for Support endpoints

---

### Phase 4: Frontend Integration (2-3 weeks) ⏳ PENDING

#### Week 1: API Client & Core Components

**API Client**:
- [ ] Create `client/src/api/mvp-client.ts` - Base Axios client
- [ ] Create `client/src/api/prepare.ts` - Prepare APIs
- [ ] Create `client/src/api/practice.ts` - Practice APIs
- [ ] Create `client/src/api/perform.ts` - Perform APIs
- [ ] Create `client/src/api/gamification.ts` - Gamification APIs
- [ ] Create `client/src/api/credits.ts` - Credits APIs
- [ ] Create `client/src/api/referrals.ts` - Referrals APIs
- [ ] Create `client/src/api/support.ts` - Support APIs
- [ ] Add React Query hooks for all endpoints

**Update Shared Components**:
- [ ] Update `FloatingAICoach.jsx` - Connect to real API
- [ ] Update `ReadinessScoreBadge.jsx` - Connect to real score
- [ ] Update `CreditCostBadge.jsx` - Connect to real credits
- [ ] Test component rendering

#### Week 2: Pages Integration

**Dashboard Page**:
- [ ] Update `Dashboard.jsx` - Connect to real APIs
- [ ] Wire up navigation
- [ ] Test user flow

**Prepare Page**:
- [ ] Update `Prepare.jsx` - Connect tabs to APIs
- [ ] Update `LearningHub.jsx` - Connect modules and progress
- [ ] Update `SelfIntroScriptingWizard.jsx` - Connect drafts API
- [ ] Update `ResumeAnalyzer.jsx` - Connect upload and analysis
- [ ] Update all interactive modules (11 components)
- [ ] Update practice components (STARStoryBuilder, etc.)
- [ ] Test all interactive features

**Practice Page**:
- [ ] Update `Practice.jsx` - Connect to APIs
- [ ] Update `SimulationSetup.jsx` - Connect setup logic
- [ ] Update `SimulationInterface.jsx` - Connect session logic
- [ ] Update `AssessmentViewer.jsx` - Connect assessment data
- [ ] Update `SimulationHistory.jsx` - Connect history API
- [ ] Update `ReflectionJournal.jsx` - Connect reflections
- [ ] Test practice flow

**Perform Page**:
- [ ] Update `Perform.jsx` - Connect to APIs
- [ ] Update `ActualInterviewTracker.jsx` - Connect tracker
- [ ] Update `ReflectionJournalList.jsx` - Connect journals
- [ ] Update `InsightsPanel.jsx` - Connect analytics
- [ ] Update `PerformanceChart.jsx` - Connect chart data
- [ ] Update `BadgeGallery.jsx` - Connect badges
- [ ] Test analytics and tracking

#### Week 3: Additional Pages & Polish

**Billing Page**:
- [ ] Update `Billing.jsx` - Integrate existing Stripe
- [ ] Add credit packages
- [ ] Test Stripe flow

**Profile Page**:
- [ ] Update `Profile.jsx` - Connect user data
- [ ] Add badge display
- [ ] Add stats display
- [ ] Test profile updates

**Referral Page**:
- [ ] Update `Referral.jsx` - Connect referral API
- [ ] Show referral code
- [ ] Show referral stats
- [ ] Test referral flow

**Landing Page**:
- [ ] Update `Landing.jsx` - Marketing content
- [ ] Connect sign-up flow
- [ ] Test landing → signup flow

**Authentication**:
- [ ] Replace Base44 auth with Passport.js
- [ ] Update login forms
- [ ] Update signup forms
- [ ] Test authentication flow
- [ ] Verify email verification still works

---

### Phase 5: Service Integrations (1 week) ⏳ PENDING

**Email Templates**:
- [ ] Create badge awarded email template
- [ ] Create milestone reached email template
- [ ] Create referral success email template
- [ ] Create credit top-up confirmation email template
- [ ] Test email sending

**AI Service Extensions**:
- [ ] Add resume analysis prompts
- [ ] Add self-intro feedback prompts
- [ ] Add reflection insights prompts
- [ ] Test AI responses
- [ ] Add error handling

**Stripe Credit Packages**:
- [ ] Create credit products in Stripe
- [ ] Add credit package prices
- [ ] Update webhook handlers
- [ ] Test credit purchases
- [ ] Test credit deduction

---

### Phase 6: Testing (1-2 weeks) ⏳ PENDING

#### Week 1: Component & Integration Testing

**Component Tests**:
- [ ] Test all new Prepare components
- [ ] Test all gamification components
- [ ] Test all Perform components
- [ ] Test all new pages
- [ ] Fix any failing tests

**Integration Tests**:
- [ ] Test complete Prepare user journey
- [ ] Test complete Practice user journey
- [ ] Test complete Perform user journey
- [ ] Test gamification triggers
- [ ] Test credit system end-to-end
- [ ] Test referral system end-to-end
- [ ] Fix integration issues

**API Tests**:
- [ ] Test all new API endpoints
- [ ] Test authentication on all endpoints
- [ ] Test error handling
- [ ] Test data validation
- [ ] Fix API issues

#### Week 2: Staging Deployment & UAT

**Staging Deployment**:
- [ ] Deploy to staging environment
- [ ] Run database migrations on staging
- [ ] Run smoke tests
- [ ] Verify all features working

**User Acceptance Testing**:
- [ ] Test as new user (signup → prepare → practice → perform)
- [ ] Test as existing user (verify no breakage)
- [ ] Test all interactive modules
- [ ] Test badge awards
- [ ] Test credit purchases
- [ ] Test referral system
- [ ] Collect feedback
- [ ] Fix critical issues

---

### Phase 7: Production Deployment (1 week) ⏳ PENDING

**Pre-Deployment**:
- [ ] Review all code changes
- [ ] Update CHANGELOG.md
- [ ] Create deployment checklist
- [ ] Backup production database
- [ ] Prepare rollback plan

**Database Migration**:
- [ ] Review migration scripts
- [ ] Test migrations on staging (again)
- [ ] Run migrations on production
- [ ] Verify schema changes
- [ ] Verify no data loss

**Deployment**:
- [ ] Merge redesign branch to main
- [ ] Deploy via GitHub Actions
- [ ] Monitor deployment progress
- [ ] Run smoke tests on production
- [ ] Verify health checks passing

**Post-Deployment**:
- [ ] Monitor error logs (24h)
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Fix any critical issues immediately
- [ ] Document lessons learned

---

## ✅ Feature Checklist

### Prepare Module

#### Learning Hub
- [ ] Stage 1: HR/Recruiter Screening (4 modules)
  - [ ] Understanding Screening Interviews (Interactive Game)
  - [ ] Perfect Your Elevator Pitch (Interactive Builder)
  - [ ] Common HR Questions (Interactive Game)
  - [ ] Self-Branding Basics (Interactive Workshop)
- [ ] Stage 2: Functional/Team Round (4 modules)
  - [ ] Behavioural Interviewing - STAR Method (Practice)
  - [ ] Team Dynamics 101 (Interactive Game)
  - [ ] Handling Conflict & Feedback (Practice)
  - [ ] Communication Styles & Adaptability (Practice + Quiz)
- [ ] Stage 3: Manager/Leadership Round (2 modules)
  - [ ] Manager Perspective Game (Interactive)
  - [ ] Technical Framework Game (Interactive)
- [ ] Stage 4: Executive/Senior Leadership (1 module)
  - [ ] Executive Presence Builder (Interactive)
- [ ] Progress tracking per module
- [ ] Completion badges per stage
- [ ] Overall readiness score

#### Self-Introduction Wizard
- [ ] Multi-step wizard interface
- [ ] Draft saving functionality
- [ ] Video recording integration
- [ ] AI feedback on intro
- [ ] Finalization and sharing

#### Resume Analyzer
- [ ] Resume upload (PDF/DOCX)
- [ ] AI-powered analysis
- [ ] Strengths & weaknesses identification
- [ ] Improvement suggestions
- [ ] Resume storage and retrieval

### Practice Module

#### Enhanced Features
- [ ] Simulation setup with credit cost display
- [ ] Interactive simulation interface
- [ ] Detailed assessment viewer with STAR scoring
- [ ] Simulation history with filters
- [ ] Post-practice reflection journal
- [ ] Credit deduction on simulation start

### Perform Module

#### New Features
- [ ] Actual interview tracker
  - [ ] Log interview details
  - [ ] Track outcomes
  - [ ] Link to preparation/practice
- [ ] Reflection journal system
  - [ ] Post-interview reflections
  - [ ] AI-powered insights
  - [ ] Pattern analysis
- [ ] Analytics dashboard
  - [ ] Performance charts
  - [ ] Trend analysis
  - [ ] Improvement tracking
- [ ] Badge gallery display

### Gamification System

#### Core Features
- [ ] Badges system
  - [ ] Badge definitions
  - [ ] Badge artwork/icons
  - [ ] Award triggers
  - [ ] Badge display in profile
- [ ] Rewards points
  - [ ] Point accumulation
  - [ ] Point tracking
  - [ ] Leaderboard
- [ ] Readiness score
  - [ ] Calculation logic
  - [ ] Score display
  - [ ] Score tracking over time
- [ ] Streak tracking
  - [ ] Daily login streaks
  - [ ] Activity streaks
  - [ ] Streak rewards

### Credits & Billing

#### Features
- [ ] Credit balance display
- [ ] Credit transaction history
- [ ] Credit packages (100, 500, 2000)
- [ ] Stripe integration for top-ups
- [ ] Credit deduction on usage
- [ ] Low balance warnings

### Referral System

#### Features
- [ ] Referral code generation
- [ ] Referral code sharing
- [ ] Referral tracking
- [ ] Referral rewards (credits)
- [ ] Referral statistics dashboard

### Support & Feedback

#### Features
- [ ] Support ticket creation
- [ ] Ticket tracking
- [ ] Ticket status updates
- [ ] Feedback submission
- [ ] Feedback display (for admin)

### Additional Pages

- [ ] Landing page (marketing)
- [ ] Enhanced dashboard
- [ ] Enhanced profile page
- [ ] Billing page updates
- [ ] Referral page

---

## 🗺️ Base44 → Express API Mapping

### Authentication
| Base44 | Express | Notes |
|--------|---------|-------|
| `base44.auth.login()` | `POST /api/auth/login` | Existing Passport.js |
| `base44.auth.signup()` | `POST /api/auth/signup` | Existing with email verification |
| `base44.auth.getUser()` | `GET /api/auth/user` | Existing |
| `base44.auth.logout()` | `POST /api/auth/logout` | Existing |

### User Profile
| Base44 | Express | Notes |
|--------|---------|-------|
| `UserProfile.get()` | `GET /api/user/profile` | Existing, extend |
| `UserProfile.update()` | `PUT /api/user/profile` | Existing, extend |

### Prepare Module
| Base44 | Express | Notes |
|--------|---------|-------|
| `LearningModule.list()` | `GET /api/prepare/modules` | New |
| `LearningModule.getByStage()` | `GET /api/prepare/modules/:stage` | New |
| `UserModuleProgress.get()` | `GET /api/prepare/modules/progress` | New |
| `UserModuleProgress.update()` | `POST /api/prepare/modules/progress` | New |
| `SelfIntroDraft.save()` | `POST /api/prepare/self-intro/draft` | New |
| `SelfIntroDraft.get()` | `GET /api/prepare/self-intro/draft` | New |
| `SelfIntro.create()` | `POST /api/prepare/self-intro/finalize` | New |
| `Resume.upload()` | `POST /api/prepare/resume/upload` | New |
| `Resume.analyze()` | `POST /api/prepare/resume/analyze` | New (AI) |
| `Resume.get()` | `GET /api/prepare/resume/:id` | New |

### Practice Module
| Base44 | Express | Notes |
|--------|---------|-------|
| `InterviewSimulation.create()` | `POST /api/practice/sessions` | Existing, extend |
| `InterviewSimulation.getHistory()` | `GET /api/practice/history` | New |
| `InterviewSimulation.getAssessment()` | `GET /api/practice/assessment/:id` | Extend existing |

### Perform Module
| Base44 | Express | Notes |
|--------|---------|-------|
| `ActualInterview.create()` | `POST /api/perform/actual-interviews` | New |
| `ActualInterview.list()` | `GET /api/perform/actual-interviews` | New |
| `ActualInterview.update()` | `PUT /api/perform/actual-interviews/:id` | New |
| `ReflectionJournal.create()` | `POST /api/perform/reflections` | New |
| `ReflectionJournal.list()` | `GET /api/perform/reflections` | New |
| Analytics | `GET /api/perform/insights` | New |
| Performance Chart | `GET /api/perform/performance-chart` | New |

### Gamification
| Base44 | Express | Notes |
|--------|---------|-------|
| `Badge.list()` | `GET /api/gamification/badges` | New |
| `UserBadge.get()` | `GET /api/gamification/user-badges` | New |
| Award Badge | `POST /api/gamification/award-badge` | New (internal) |
| Add Points | `POST /api/gamification/add-points` | New |
| Get Points | `GET /api/gamification/points` | New |
| Update Streak | `POST /api/gamification/update-streak` | New |
| Get Streak | `GET /api/gamification/streak` | New |
| Leaderboard | `GET /api/gamification/leaderboard` | New |

### Credits & Billing
| Base44 | Express | Notes |
|--------|---------|-------|
| `CreditLedger.getBalance()` | `GET /api/credits/balance` | New |
| `CreditLedger.getHistory()` | `GET /api/credits/history` | New |
| `Subscription.topup()` | `POST /api/credits/topup` | New (Stripe) |

### Referrals
| Base44 | Express | Notes |
|--------|---------|-------|
| `Referral.create()` | `POST /api/referrals/create` | New |
| `Referral.getCode()` | `GET /api/referrals/code` | New |
| `Referral.apply()` | `POST /api/referrals/apply` | New |
| `Referral.getStats()` | `GET /api/referrals/stats` | New |

### Support
| Base44 | Express | Notes |
|--------|---------|-------|
| `SupportTicket.create()` | `POST /api/support/tickets` | New |
| `SupportTicket.list()` | `GET /api/support/tickets` | New |
| `Feedback.submit()` | `POST /api/support/feedback` | New |

---

## 📊 Progress Tracking

### Session Log Template

```markdown
## Session: YYYY-MM-DD HH:MM

**Duration**: X hours
**Phase**: Phase Name
**Completed**:
- [x] Task 1
- [x] Task 2

**In Progress**:
- [ ] Task 3 (estimated 50% done)

**Blockers**:
- None / Issue description with details

**Decisions Made**:
- Decision 1: Rationale
- Decision 2: Rationale

**Next Session Priorities**:
1. High priority task
2. Medium priority task
3. Low priority task

**Notes**:
- Any important findings
- Things to remember
- Questions for next session
```

---

## Session History

### Session 1: 2025-10-28 (Initial Setup)

**Duration**: 1 hour
**Phase**: Phase 1 - Analysis & Documentation
**Completed**:
- [x] Cloned Base44 MVP repository to `/tmp/elev8interview`
- [x] Analyzed Base44 structure and tech stack
- [x] Analyzed current P3 Interview Academy codebase
- [x] Performed housekeeping (deleted 419MB of duplicate files)
- [x] Created `docs/` folder structure
- [x] Fixed Stripe deployment crash
- [x] Created redesign branch: `redesign/mvp-founder-design`
- [x] Started MASTER_PLAN.md creation

**In Progress**:
- [ ] Finalizing comprehensive documentation

**Blockers**: None

**Decisions Made**:
- Use Base44 as visual reference, rebuild on Express/PostgreSQL
- Keep existing AWS infrastructure
- Frontend must match Base44 pixel-perfect
- Estimated timeline: 8-12 weeks

**Next Session Priorities**:
1. Complete all documentation files (QUICK_START.md, API_MAPPING.md, etc.)
2. Commit initial documentation
3. Begin Phase 2: Project Setup (copy Base44 files)

**Notes**:
- Base44 uses shadcn/ui components (we have most already)
- Base44 has 11+ interactive learning modules to implement
- Gamification system is entirely new
- Credits & referral systems are new
- All backend must be rebuilt on Express

---

## 🔧 Technical Reference

### Current Tech Stack
- **Frontend**: React 18, Vite, TanStack Query, Wouter, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, TypeScript, PostgreSQL, Drizzle ORM
- **Auth**: Passport.js with email verification
- **Services**: Gmail SMTP, OpenAI/SeaLion AI, Stripe
- **Deployment**: AWS Elastic Beanstalk, GitHub Actions CI/CD

### Base44 MVP Tech Stack
- **Frontend**: React 18, Vite, TanStack Query, React Router, Tailwind CSS, Shadcn/ui
- **Backend**: Base44 BaaS (SDK-based)
- **UI Libraries**: Framer Motion, Embla Carousel, Recharts, Sonner
- **Auth**: Base44 Auth SDK

### New Dependencies to Install
From Base44 package.json:
- `framer-motion` - Animations
- `embla-carousel-react` - Carousels
- `next-themes` - Theme support
- `input-otp` - OTP inputs
- `vaul` - Drawer component
- `sonner` - Toast notifications (different from our current toast)
- `recharts` - Charts for analytics
- `react-resizable-panels` - Resizable panels

### Database Schema Changes

**New Tables**:
1. `badges` - Badge definitions
2. `user_badges` - User badge awards
3. `learning_modules` - Module metadata
4. `user_module_progress` - Progress tracking
5. `self_intro_drafts` - Draft storage
6. `resumes` - Resume metadata
7. `reflection_journals` - Reflection entries
8. `actual_interviews` - Interview tracking
9. `referrals` - Referral codes
10. `credit_ledger` - Credit transactions (may extend existing)
11. `feedback` - User feedback
12. `support_tickets` - Support tickets

**Modified Tables**:
- `users` - Add: `total_points`, `current_streak`, `longest_streak`, `readiness_score`, `referral_code`
- `practice_sessions` - Add: `reflection_id`, `credits_used`
- `subscriptions` - Extend for credit packages

---

## 🎯 Key Success Metrics

### Technical Metrics
- [ ] 100% of Base44 components migrated
- [ ] All API endpoints functional
- [ ] All tests passing
- [ ] No performance degradation
- [ ] Health checks passing in production

### User Experience Metrics
- [ ] UI matches Base44 design
- [ ] All interactive modules working
- [ ] Gamification triggers correctly
- [ ] No existing user disruption
- [ ] Positive user feedback

### Business Metrics
- [ ] Feature parity with Base44 MVP
- [ ] Credit system operational
- [ ] Referral system driving signups
- [ ] Support tickets trackable
- [ ] Analytics providing insights

---

## 🚨 Risk Management

### Identified Risks

1. **Scope Creep**: Base44 has many features
   - **Mitigation**: Stick to documented features, phase implementation

2. **Database Migration**: Schema changes may affect existing users
   - **Mitigation**: Thorough testing on staging, backup before production migration

3. **API Compatibility**: Base44 SDK calls may not map cleanly to REST
   - **Mitigation**: Document all mappings upfront, test edge cases

4. **Performance**: New features may impact performance
   - **Mitigation**: Load testing, optimization phase

5. **Timeline**: 8-12 weeks is ambitious
   - **Mitigation**: Weekly progress reviews, adjust scope if needed

---

## 📎 Appendix A: Dependency Parity Log

Use this table to document npm package diffs between Base44 MVP and P3 after each sync run.

| Date | Reviewer | Command Output | Follow-up Actions |
|------|----------|----------------|-------------------|
| TBD  | TBD      | `node scripts/compare-packages.mjs` diff saved to `tmp/dependency-diff-<date>.md` | Pending |

Attach additional rows as dependency updates occur and link associated PRs/commits.

---

## 📞 Quick Reference

### Important Files
- **Base44 Reference**: `/tmp/elev8interview`
- **This Plan**: `docs/redesign/MASTER_PLAN.md`
- **Quick Start**: `docs/redesign/QUICK_START.md`
- **API Mapping**: `docs/redesign/API_MAPPING.md`
- **Features List**: `docs/redesign/FEATURES_INVENTORY.md`

### Commands
```bash
# Switch to redesign branch
git checkout redesign/mvp-founder-design

# View Base44 structure
ls -la /tmp/elev8interview/src/

# Run development server
npm run dev

# Run tests
npm run test:run

# Build project
npm run build
```

### Contacts
- **Founder**: [Contact info]
- **Team**: [Team info]

---

**Last Updated**: 2025-10-28
**Document Version**: 1.0
**Status**: 🟡 Phase 1 in progress
