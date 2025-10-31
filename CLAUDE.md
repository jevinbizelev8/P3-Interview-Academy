# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Documentation Structure

This project uses multiple documentation files for better organization:

- **CLAUDE.md** (this file) - Current status, architecture, development commands
- **[SECURITY.md](SECURITY.md)** - Security best practices, AWS credentials, incident history
- **[INTEGRATION.md](INTEGRATION.md)** - Bizelev8.ai, email verification, Google OAuth
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Comprehensive deployment procedures and guides
- **[ops-log/](docs/ops-log/)** - Monthly operational updates and historical changes
  - [2025-09.md](docs/ops-log/2025-09.md) - September deployment history
  - [2025-10.md](docs/ops-log/2025-10.md) - October deployment history
- **[CHANGELOG.md](CHANGELOG.md)** - Permanent release notes

---

## 🚀 Current Status (2025-10-28)

**✅ ALL SYSTEMS OPERATIONAL**: Production and staging environments healthy

### Quick Status Check
- **Production**: `p3-interview-academy-prod-v2` - ✅ Healthy (HTTP 200, 0.56s response)
- **Staging**: `p3-interview-academy-staging` - ✅ Healthy (HTTP 200, 0.49s response)
- **CI/CD Pipeline**: ✅ Fully operational (GitHub Actions)
- **Database**: ✅ PostgreSQL RDS with 7-day backups, staging/prod separated
- **Testing**: ✅ All tests passing (TypeScript + Vitest + Component)

### Recent Updates
- **2025-10-30**: ✅ **Stripe CLI installed** - Local webhook testing and payment flow verification now available
- **2025-10-28**: 🎯 **REDESIGN PROJECT KICKOFF** - Base44 MVP integration (16-20 week timeline)
- **2025-10-28**: Removed SeaLion AI service - now OpenAI-only (Qwen planned for 3 months)
- **2025-10-28**: Created comprehensive database schema (13 new tables, 6 user columns)
- **2025-10-28**: Documented gamification system (XP, badges, streaks, readiness score)
- **2025-10-28**: Fixed Stripe deployment crash by adding required environment variables to AWS
- **2025-10-28**: Enhanced CI/CD pipeline with staging → smoke tests → approval → production flow
- **2025-10-23**: Documentation reorganized into focused files
- **2025-10-12**: Database security hardened (per-env users, SSL required)
- **2025-10-04**: Email verification implemented, database separation complete
- **2025-10-02**: Practice module "End Session Early" fix deployed

### Current Branch
- **Branch**: `redesign/mvp-founder-design` (active development)
- **Main Branch**: `main` (production-ready, use for PRs)

### 🎨 Redesign Project (Active - Phase 0)
**Status**: 🟢 Phase 0 Complete - Documentation & Planning Done

**Overview**:
- **Goal**: Integrate Base44 MVP design with P3's robust backend
- **Approach**: Incremental integration with feature flags
- **Timeline**: 16-20 weeks (realistic estimate)
- **Current Phase**: Phase 0 - Preparation & Cleanup ✅ COMPLETE

**Key Features to Implement**:
- ✅ Gamification (XP points, badges, streaks, levels)
- ✅ Learning Hub (11 interactive modules)
- ✅ Readiness Score (0-100% interview preparedness)
- ✅ Self-Introduction Wizard (6-step with video)
- ✅ Resume Analyzer (AI-powered with ATS scoring)
- ✅ STAR Story Builder (behavioral interview prep)
- ✅ Reflection Journals (post-simulation insights)
- ✅ Referral Program (user growth)

**Documentation**: `docs/redesign/`
  - [MASTER_PLAN.md](docs/redesign/MASTER_PLAN.md) - Comprehensive 16-20 week plan
  - [DATABASE_SCHEMA.md](docs/redesign/DATABASE_SCHEMA.md) - 13 new tables, complete schema
  - [API_MAPPING.md](docs/redesign/API_MAPPING.md) - 48 new API endpoints
  - [FEATURES_INVENTORY.md](docs/redesign/FEATURES_INVENTORY.md) - 51 features breakdown
  - [QUICK_START.md](docs/redesign/QUICK_START.md) - Session resumption guide

**Base44 Reference**: `/tmp/elev8interview` (founder's MVP design codebase)

**Next Phase**: Phase 1 - Database Migration (Week 2-3)

### Outstanding Items
- 🚀 **Redesign Project**: Phase 1 - Database migration (13 new tables)
- 🚀 **Redesign Project**: Phase 2 - Backend services (6 new services)
- 🚀 **Redesign Project**: Phase 3 - API development (48 new endpoints)
- ⚠️ Cast legacy varchar `user_id` / `created_by` columns to UUID in staging/prod
- ⏳ Email verification system testing in staging
- ⏳ Google OAuth testing and production deployment
- ⏳ DNS configuration for p3app.bizelev8.ai (see [INTEGRATION.md](INTEGRATION.md))
- ⏳ SSL certificate setup for custom domain

---

## 💻 Development Workflow

### Developer Workflow
1. **Feature Development** → Create branch, make changes
2. **Pull Request** → Automatic staging deployment + testing
3. **Review & Test** → Staging URL provided in PR comments
4. **Merge to Main** → Automatic staging deployment → Smoke tests → Manual approval → Production deployment
5. **Monitor** → Health checks and deployment verification

### Development Tools

#### Chrome DevTools MCP Integration
- **Chrome MCP**: Installed globally for browser automation and testing
- **Location**: `C:\Users\User\.claude\chrome-mcp-tools\`
- **Quick Start**: Double-click `launch-chrome-debug.bat` then restart Claude Code
- **Capabilities**: Navigate URLs, take screenshots, inspect DOM, execute JavaScript, monitor network
- **Documentation**: See `C:\Users\User\.claude\chrome-mcp-tools\README.md`

#### Stripe CLI
- **Stripe CLI**: Installed for local payment testing and webhook forwarding
- **Capabilities**:
  - Forward webhooks to local development server: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
  - Trigger test webhook events: `stripe trigger payment_intent.succeeded`
  - View webhook logs and debugging information
  - Test payment flows without deploying to staging
- **Documentation**: Run `stripe --help` for commands or see [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- **Common Commands**:
  - `stripe login` - Authenticate with Stripe account
  - `stripe listen` - Listen for webhook events
  - `stripe trigger <event>` - Trigger test events
  - `stripe logs tail` - View real-time API logs

---

## 🤖 Codex/Claude Collaboration Blueprint

The Base44 redesign assumes that a human maintainer and an AI pair programmer (Claude Code or Codex) work in a tight loop. This
section defines the expected artifacts, hand-off points, and guardrails so both parties produce auditable progress every sessi
on.

### Roles & Responsibilities

- **Scope Alignment**
  - *Human*: Select the active item from `MASTER_PLAN.md`, clarify priorities, expose any production constraints.
  - *AI*: Restate the scope, enumerate the supporting specs to consult, and surface open questions before coding.
- **Execution Planning**
  - *Human*: Approve or refine the proposed outline, confirm environment access (feature flags, secrets, reference repo).
  - *AI*: Produce a numbered plan that lists file paths, schema/service updates, test commands, and documentation touchpoints.
- **Implementation**
  - *Human*: Review interim diffs, run privileged commands, guard conventions and security boundaries.
  - *AI*: Apply code exactly as planned, request approval before editing new files, keep diffs small and logically grouped.
- **Verification**
  - *Human*: Trigger additional QA when required, confirm the checklist in `MASTER_PLAN.md` is satisfied.
  - *AI*: Execute automated checks when accessible, capture output snippets, and escalate failures immediately.
- **Documentation & Logging**
  - *Human*: Update ops logs, check off completed tasks, coordinate PR reviews and releases.
  - *AI*: Draft the session summary, prepare PR body/testing notes, and propose follow-up actions for the next session.

### Closed-Loop Execution

1. **Confirm the Scope**
   - Start each session by pasting the exact checklist item from `docs/redesign/MASTER_PLAN.md` along with links to relevant sp
ecs.
   - Require the AI assistant to echo the scope in their own words and call out unanswered questions (e.g., missing API payloads
 or dependency versions).

2. **Draft & Approve the Plan**
   - Ask the assistant for a structured plan (bulleted or numbered) that includes: target files, schema/service updates, tests/c
ommands, and documentation touchpoints.
   - Review the plan for completeness. If changes are needed (additional tests, feature-flag toggles, environment migrations), a
pprove only after the assistant restates the revised plan.

3. **Implement with Guardrails**
   - The assistant performs work incrementally, pausing after each logical chunk (e.g., migration + schema update, API route + t
est).
   - If the assistant needs to touch an unapproved file, they must request permission and update the plan before proceeding.
   - Enforce naming/version parity with the specs—table names, route signatures, and component props should match the Base44 docu
ments exactly.

4. **Self-Test & Document**
   - Use the QA milestones defined in `MASTER_PLAN.md` to decide which commands must run (examples: `npm run test:api`, `npm run
 smoke:redesign`).
   - The assistant records command output blocks in the chat or PR description. Failures halt the session until investigated.
   - Capture screenshots for UI work using the browser MCP tooling; include links in the PR.

5. **Log & Handoff**
   - Update the relevant checkbox in `MASTER_PLAN.md` and append a short entry to `docs/ops-log/YYYY-MM.md` (date, summary, testi
ng proof).
   - Store any outstanding follow-up tasks under the same checklist item so future sessions resume seamlessly.
   - The assistant drafts the PR summary/tests section; the human reviews and submits.

### Session Log Template

```
#### Session YYYY-MM-DD (Claude/Codex + Human)
- **Scope**: [MASTER_PLAN.md → Phase X, Task Y]
- **Outline**: (paste final approved plan)
- **Changes Made**: bullet list of files/tables/endpoints touched
- **Validation**: commands + results, screenshots, manual checks
- **Follow-ups**: remaining blockers, next-session goals
```

Maintainers should keep this template in the ops log so auditors can trace how each redesign milestone progressed from plan to
production.

## 🛡️ Operational Safeguards & Runbooks

### Feature Flags
- **Config**: `server/config/featureFlags.ts` (toggle `redesign.mvp` groups for Prepare/Practice/Perform).
- **Rollout Strategy**: Enable flags in staging first, verify smoke checklist (login → readiness score → resume analysis) before enabling in production.
- **Emergency Disable**: Use `npm run feature-flags:disable redesign.mvp` (script wraps Redis toggle) and redeploy via GitHub Actions manual dispatch.

### Database Migration Guardrails
- Always run `npm run test:db-redesign` prior to `db:push`; script provisions ephemeral Postgres and validates migrations + seeds.
- Capture `drizzle-kit push --print` output and attach to ops-log entry for traceability.
- In production, snapshot RDS (`aws rds create-db-snapshot ...`) before applying migrations; rollback by `db:rollback --to <prev>` or restoring snapshot.

### Monitoring & Alerting
- **APM**: Datadog monitors readiness endpoint latency, resume analysis job duration, and AI cost spikes (OpenAI spend budget alerts at $150/day).
- **Logs**: CloudWatch log group `p3-interview-api` – use saved query `redesign-anomalies` to surface badge/XP errors.
- **User Impact Checks**: After each deployment, run smoke tests via `npm run smoke:redesign` (covers module progression, simulation creation, credit purchase).

### Incident Response
- Document incidents in `docs/ops-log/YYYY-MM.md` within 24 hours.
- Notify founders via Slack channel `#p3-redesign` with impact summary, mitigation steps, and follow-up tasks.
- Schedule post-incident review to update runbooks (this section) and acceptance criteria in `MASTER_PLAN.md` if needed.

Keep this section synchronized with deployment changes; update immediately when scripts or flag locations evolve.

---

## 🛠️ Development Commands

### Essential Development Commands
- `npm run dev` - Start development server (React frontend + Express backend)
- `npm run build` - Build for production (runs `npm run check` + `npm run test:run` first)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Testing Commands
- `npm test` - Run all tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Launch Vitest UI for interactive testing
- `npm run test:prepare` - Run specific component tests for validation
- `npm run test:integration` - Run integration tests only
- `npm run test:api` - Run API tests only

**Key Test Coverage**:
- Component tests: `LanguageSelector.test.tsx`, `JobDescriptionUpload.test.tsx`, `SignupForm.test.tsx`
- Integration tests: `prepare-session.integration.test.tsx`, `perform-dashboard.integration.test.tsx`
- API tests: `prepare-ai.routes.test.ts`, `practice.routes.test.ts`

### Payment Testing Commands (Stripe CLI)
- `stripe listen --forward-to localhost:5000/api/webhooks/stripe` - Forward webhooks to local server
- `stripe trigger payment_intent.succeeded` - Simulate successful payment
- `stripe trigger checkout.session.completed` - Simulate checkout completion
- `stripe logs tail` - Monitor Stripe API activity in real-time

### Database Commands
- `npm run db:push` - Push database schema changes using Drizzle Kit
- Database schema is defined in `shared/schema.ts`
- Uses PostgreSQL with Drizzle ORM

**Schema Management**:
- Boot-time schema guard: `ensureCriticalSchema()` in `server/services/schema-auditor.ts`
- Runs every server start to create AI Prepare tables and rename legacy columns
- After 2025-10-04 deploy: Cast `user_id` / `created_by` columns from varchar to uuid

---

## 🏗️ Architecture Overview

### Project Structure
Full-stack TypeScript application with React frontend and Express.js backend:

- **`client/`** - React frontend with Vite build system
- **`server/`** - Express.js backend with TypeScript
- **`shared/`** - Shared types, schemas, and utilities between client/server
- **`attached_assets/`** - Static assets and AI-generated images

### Tech Stack

#### Frontend
- **Vite** - Fast development and building
- **React** - UI framework
- **Tailwind CSS + Shadcn/ui** - Styling and components
- **TanStack Query** - Server state management and caching
- **Wouter** - Lightweight client-side routing
- **React Hook Form + Zod** - Form validation

#### Backend
- **Express.js** - Web server framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL + Drizzle ORM** - Database and ORM
- **Socket.IO** - Real-time WebSocket communication
- **Passport.js** - Authentication (simple password-based)

#### AI Services
- **Primary**: OpenAI GPT-4 (currently configured)
- **Future**: Qwen from Alicloud (planned for 3 months)
- All AI services abstracted through service classes in `server/services/`
- **Note**: SeaLion AI removed 2025-10-28 (now OpenAI-only)

### Key Architectural Patterns

#### Full-Stack TypeScript
- Strict TypeScript configuration across frontend and backend
- Shared types in `shared/types.ts` and database schema in `shared/schema.ts`
- Path aliases: `@/*` for client, `@shared/*` for shared code

#### Database Design
- PostgreSQL with Drizzle ORM
- Schema supports multi-language content (7 Southeast Asian languages)
- **Core Tables** (30 existing): users, interview_sessions, interview_messages, preparation_sessions, practice_sessions, subscriptions, credit_transactions, etc.
- **New MVP Tables** (13 tables): badges, user_badges, learning_modules, user_module_progress, self_intros, resumes, star_stories, reflection_journals, actual_interviews, referrals, feedback, support_tickets
- **User Extensions**: xp_points, current_streak, longest_streak, readiness_score, referral_code
- Session management for both authentication and interview state
- Separate databases for staging (`p3_staging`) and production (`postgres`)
- **Complete Schema**: See [DATABASE_SCHEMA.md](docs/redesign/DATABASE_SCHEMA.md)

#### Component Organization
- `client/src/components/` - Reusable UI components
- `client/src/pages/` - Route-specific page components
- `client/src/hooks/` - Custom React hooks
- `client/src/services/` - API client services

#### Backend Structure
- **Main entry**: `server/index.ts`
- **Route definitions**: `server/routes.ts` (main routes) + modular routers
- **Services layer**: `server/services/` for business logic
- **Middleware**: `server/middleware/` for auth, logging, etc.

---

## 🎯 Interview Platform Features

### Three Core Modules
1. **Prepare** - AI question generation and study plans
2. **Practice** - Real-time AI interview simulations with voice support
3. **Perform** - Analytics and performance tracking

### STAR Method Integration
The platform evaluates responses using the STAR framework:
- **Situation** - Context and background
- **Task** - Specific responsibilities
- **Action** - Steps taken
- **Result** - Outcomes achieved

Evaluation logic: `server/services/response-evaluation-service.ts`

### Practice Module Notes
- `client/src/pages/practice/interview-practice.tsx` auto-requests first AI prompt
- Voice playback reads `data.question.questionText` from `/api/practice/sessions/:id/ai-question`
- If seeding practice sessions manually, reset `current_question_number` to 1

### Voice Features
- Browser-based Speech-to-Text and Text-to-Speech APIs
- No server-side voice processing costs
- Multi-language voice support matching the 7 supported languages

### 🎮 Gamification System (Redesign Project)

**Status**: 📋 Planning Phase - Implementation in Phase 2-3

#### XP Points System
Users earn experience points through platform engagement:
- **Learning modules**: 10-20 XP per module
- **Interview simulations**: 50-100 XP (varies by difficulty)
- **High performance bonus**: +25 XP (>80%), +50 XP (>90%)
- **Badge earning**: 50-250 XP per badge
- **Self-intro assessment**: 25-50 XP
- **Resume analysis**: 25 XP
- **Daily streak**: +5 to +N XP (scaling)
- **Reflection journals**: 15-20 XP

**Implementation**: `server/services/gamification-service.ts` (to be created)

#### Interview Readiness Score (0-100%)

Calculated using weighted average of user performance:
- **60%** - AI Simulation Performance (average of last 5 simulations)
- **20%** - Learning Module Completion (percentage completed)
- **10%** - Self-Introduction Score (latest assessment)
- **5%** - Resume Optimization (ATS score + JD match)
- **5%** - Practice Consistency (streaks and recent engagement)

**Features**:
- Real-time updates after relevant actions
- Breakdown view showing contribution of each component
- Historical tracking to show improvement over time
- Personalized recommendations to improve score

**Implementation**: `server/services/readiness-service.ts` (to be created)

#### Badge System

15-20 badges across categories:
- **Learning**: Module completion achievements
- **Practice**: Simulation milestones
- **Achievement**: Performance excellence
- **Milestone**: Platform engagement

**Badge Tiers**: Common → Uncommon → Rare → Epic → Legendary

**Database**:
- `badges` table - All available badges with requirements
- `user_badges` table - User progress and earned badges

**Example Badges**:
- "First Steps" (1 module, 50 XP)
- "Quick Learner" (5 modules, 100 XP)
- "Interview Ready" (10 simulations, 200 XP)
- "Streak Warrior" (7-day streak, 150 XP)

#### Streak Tracking

- **Current Streak**: Consecutive days of platform activity
- **Longest Streak**: Personal record
- **Daily Bonus XP**: Scales with streak length (+5 day 1, +10 day 2, etc.)
- **Activity Definition**: Any meaningful engagement (module, simulation, exercise)

**Implementation**: Tracked in `users` table, updated by activity tracking service

---

## 🌍 Multi-Language Support

The application supports 7 Southeast Asian languages:
- English (en)
- Bahasa Malaysia (ms)
- Bahasa Indonesia (id)
- Thai (th)
- Vietnamese (vi)
- Filipino (fil)
- Chinese Singapore (zh-sg)

Language constants defined in `shared/schema.ts` as `SUPPORTED_LANGUAGES`.

---

## ⚙️ Environment Configuration

**🔒 SECURITY NOTE**: Never commit credentials to version control. See [SECURITY.md](SECURITY.md) for best practices.

### Key Environment Variables

See `.env.example` for complete list. Critical variables:

**AWS Credentials**:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (use AWS CLI profiles when possible)

**AI Services**:
- `OPENAI_API_KEY` (required - primary AI service)
- `ANTHROPIC_API_KEY` (optional - AWS Bedrock fallback)
- `QWEN_API_KEY` (future - Alicloud integration in 3 months)
- `GOOGLE_API_KEY`, `GCP_PROJECT_ID`, `GCP_REGION` (Google Cloud)

**Database**:
- `DATABASE_URL` (PostgreSQL connection string)

**Authentication**:
- `SESSION_SECRET` (required for session encryption)
- `BYPASS_AUTH` (dev only, set to `true` for local development)

**CORS/Integration**:
- `WS_ALLOWED_ORIGINS` (WebSocket cross-origin support)
- `FORCE_HTTPS` (enforces secure cookies in production)

**Email** (for verification system):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`, `EMAIL_FROM_NAME`
- `APP_URL_DEV`, `APP_URL_PROD`

**Google OAuth** (when configured):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`, `GOOGLE_SUCCESS_REDIRECT`, `GOOGLE_FAILURE_REDIRECT`
- `VITE_ENABLE_GOOGLE_OAUTH`

**Payment Processing (Stripe)**:
- `STRIPE_MODE` (test or live mode)
- `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY` (test mode credentials)
- `STRIPE_TEST_WEBHOOK_SECRET` (webhook verification for test mode)
- `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_PUBLISHABLE_KEY` (production credentials)
- `STRIPE_LIVE_WEBHOOK_SECRET` (webhook verification for live mode)
- Optional: `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, price IDs for subscription products

For detailed setup guides, see:
- Email verification: [INTEGRATION.md#email-verification](INTEGRATION.md)
- Google OAuth: [INTEGRATION.md#google-oauth](INTEGRATION.md)
- Bizelev8.ai integration: [INTEGRATION.md#bizelev8ai-integration](INTEGRATION.md)

---

## 🚢 Deployment Infrastructure

### AWS Elastic Beanstalk

**Production Environment**:
- Name: `p3-interview-academy-prod-v2`
- Platform: AWS Elastic Beanstalk (AL2023 Node.js 20)
- Region: ap-southeast-1 (Singapore)
- URL: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

**Staging Environment**:
- Name: `p3-interview-academy-staging`
- URL: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- Trigger: Automatic PR-based deployments

### Build & Runtime
- Build: `npm run build` → backend to `dist/`, frontend to `dist/public/`
- Start: `npm run start` → `node dist/index.js`
- Health endpoint: `GET /api/health`

### Health Check System
Three-tier health checking:
- **`/api/health/simple`** - Basic health check for load balancers
- **`/api/health`** - Enhanced health with database connectivity and system status
- **`/api/diagnostics`** - Detailed system diagnostics (requires authentication)

### CI/CD Pipeline (GitHub Actions)

**Main Branch Deployment** (`.github/workflows/deploy-main.yml`):
- **Trigger**: Push to `main` branch
- **Workflow**: Tests → Build → Deploy to Staging → Smoke Tests → **Manual Approval** → Deploy to Production
- **Approval Gate**: Requires repository admin approval via GitHub Environments
- **Key Feature**: Single build artifact deployed to both environments for consistency

**PR-Based Staging Deployment** (`.github/workflows/deploy-eb-staging.yml`):
- **Trigger**: PR creation/updates to `main`
- **Workflow**: Tests → Build → Deploy to staging → PR comment with URL
- **Purpose**: Test changes in staging before merging

**Pipeline Features**:
- Automated testing (TypeScript + Vitest + Component tests)
- **Smoke tests** validate staging before production (`deployment-scripts/smoke-tests.ts`)
- Single build artifact ensures staging-production parity
- Manual approval gate for production deployments (GitHub Environments)
- Rolling deployments with health verification
- PR integration with staging URLs and status updates
- Automatic cleanup of old application versions

**Smoke Test Coverage**:
- Health endpoints (`/api/health/simple`, `/api/health`)
- Database connectivity
- Authentication endpoints
- Prepare module API
- Practice module API

### Deployment Scripts

Located in `deployment-scripts/`:
- **`smoke-tests.ts`** - Automated smoke tests for staging validation (used in CI/CD)
- **`full-deployment.sh`** - Complete deployment orchestration (recommended)
- **`setup-environment-variables.sh`** - Interactive AWS environment variable configuration
- **`verify-database.sh`** - Database connectivity and schema verification
- **`create-deployment-bundle.sh`** - Production bundle creation
- **`deploy-to-eb.sh`** - AWS Elastic Beanstalk deployment automation
- **`check-environment-status.sh`** - Environment health and configuration checking

**Utility Scripts**: See `deployment-scripts/util/` for ad-hoc maintenance and debugging

### AWS Configuration

**EB Extensions** (`.ebextensions/`):
- **`01-nodejs.config`** - Node.js platform settings, health checks, static file serving
- **`02-environment-validation.config`** - Pre-deployment validation hooks
- **`03-logging.config`** - Enhanced logging and monitoring setup
- **`04-ssl.config`** - SSL certificate and HTTPS configuration for custom domains

### Database (PostgreSQL RDS)

**Configuration**:
- Production database: `postgres`
- Staging database: `p3_staging`
- Same RDS instance, separate databases for isolation
- Automated backups: 7-day retention
- SSL required: `sslmode=require` enforced

**Security**:
- Per-environment database users (`app_user_prod`, `app_user_staging`)
- Least-privilege grants
- Security groups: EB SG → SG, admin IP allowlisted
- External access blocked by `pg_hba.conf`

### Troubleshooting

For common deployment issues and solutions, see:
- [ops-log/2025-10.md](docs/ops-log/2025-10.md) - Recent deployment troubleshooting
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment guide
- `deployment-scripts/util/` - Debugging and maintenance scripts

**Quick Diagnostics**:
```bash
# Check environment health
curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health/simple

# Check deployment status
aws elasticbeanstalk describe-environments --environment-names p3-interview-academy-prod-v2

# Tail recent events
aws elasticbeanstalk describe-events --environment-name p3-interview-academy-prod-v2 --max-items 20
```

---

## 🔐 Security & Compliance

### Security Best Practices

**Critical Rules**:
- ❌ NEVER commit credentials to git repositories
- ✅ Use AWS CLI profiles for AWS access
- ✅ Use environment variables for secrets
- ✅ Enable MFA on AWS accounts
- ✅ Rotate access keys every 90 days
- ✅ Use least privilege principle

**For detailed security practices**, see [SECURITY.md](SECURITY.md):
- AWS credentials management
- Security incident history and response procedures
- Development security guidelines
- Environment separation best practices
- Monitoring and auditing procedures

### Data Protection

- **GDPR Compliance**: User data segregated (staging vs production databases)
- **Data Retention**: 7-day database backups, no long-term PII storage in logs
- **Session Security**: Encrypted sessions with `SESSION_SECRET`
- **Database Access**: Restricted by security groups and per-env users

---

## 🔗 Integrations

### Bizelev8.ai Iframe Embedding
- **Status**: ✅ Configuration Complete | ⏳ DNS Setup Pending
- **Custom Domain**: `p3app.bizelev8.ai` (DNS CNAME required)
- **CORS**: Configured for bizelev8.ai domains
- **SSL**: AWS Certificate Manager ready
- **WebSocket**: Real-time features supported in embedded mode

### Email Verification System
- **Status**: ✅ Implementation Complete | ⏳ Staging Testing Pending
- **SMTP**: Gmail integration (support@bizelev8.ai)
- **Features**: Email verification (24h), password reset (1h), branded templates
- **Branch**: `email-fix`

### Google OAuth
- **Status**: ✅ Backend Complete | ⏳ Google Cloud Setup Pending
- **Features**: "Sign in with Google" button, account linking
- **Endpoints**: `/api/auth/google`, `/api/auth/google/callback`

**For detailed integration guides**, see [INTEGRATION.md](INTEGRATION.md):
- Bizelev8.ai iframe setup with DNS and SSL
- Email verification system implementation
- Google OAuth complete setup guide
- Database separation documentation

---

## 🔮 Future Enhancements

### Short-term (1-3 months)
- **Qwen Integration**: Add Alicloud Qwen AI as secondary provider (planned Q1 2026)
- **Google OAuth**: Complete Google Cloud setup and testing
- **Email Verification**: Complete staging testing and production deployment

### Medium-term (3-6 months)
- **Single Sign-On**: Integrate with bizelev8.ai user authentication
- **Custom Domain**: Complete DNS and SSL setup for p3app.bizelev8.ai
- **Progressive Web App**: Standalone app installation from iframe

### Long-term (6+ months)
- **Custom Theming**: Brand customization for embedded iframe
- **Analytics Integration**: Cross-domain user behavior tracking
- **Mobile Apps**: Native iOS and Android applications

---

## 📋 Active Projects & Technical Debt

### Outstanding Technical Debt
- ⚠️ **Database Schema**: Cast legacy varchar `user_id` / `created_by` columns to UUID
  - Required before next deploy for FK constraints
  - Run in staging first, then production
- ⏳ **Email Testing**: Complete staging testing of email verification system
- ⏳ **OAuth Setup**: Configure Google Cloud Project and test OAuth flow
- ⏳ **Custom Domain**: Complete DNS and SSL setup for p3app.bizelev8.ai

---

## 📖 Additional Resources

### Documentation
- **Security**: [SECURITY.md](SECURITY.md) - Credentials, incidents, best practices
- **Integrations**: [INTEGRATION.md](INTEGRATION.md) - Bizelev8.ai, email, OAuth
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment procedures
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) - Permanent release notes

### Operational Logs
- **October 2025**: [ops-log/2025-10.md](docs/ops-log/2025-10.md)
- **September 2025**: [ops-log/2025-09.md](docs/ops-log/2025-09.md)

### Quick Links
- **Production**: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- **Staging**: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- **GitHub Repo**: `https://github.com/jevinbizelev8/P3-Interview-Academy`
- **AWS Region**: ap-southeast-1 (Singapore)

---

**Last Updated**: 2025-10-28
**Document Version**: 3.0 (Base44 MVP Redesign Project Kickoff)

**Major Changes in v3.0**:
- Added comprehensive redesign project documentation
- Removed SeaLion AI service (now OpenAI-only)
- Added gamification system documentation (XP, badges, readiness score)
- Added 13 new database tables documentation
- Updated all environment variables
- Reorganized future enhancements by timeline
