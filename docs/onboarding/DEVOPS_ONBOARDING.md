# DevOps Engineer Onboarding Guide
**P3 Interview Academy**
**Version**: 1.0
**Last Updated**: 2025-12-02

Welcome to the P3 Interview Academy team! This document provides everything you need to understand our infrastructure, deployment processes, and current challenges.

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Infrastructure Setup](#infrastructure-setup)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Current Deployment Process](#current-deployment-process)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Observability](#monitoring--observability)
8. [Current Pain Points](#current-pain-points)
9. [Improvement Priorities](#improvement-priorities)
10. [Access Requirements](#access-requirements)
11. [Key Documentation](#key-documentation)
12. [Getting Started Checklist](#getting-started-checklist)

---

## Product Overview

**P3 Interview Academy** is an AI-powered interview preparation platform serving Southeast Asian markets.

### Key Features
- **AI Interview Simulations** - Real-time practice with voice support (OpenAI GPT-4)
- **Multi-language Support** - 7 languages (English, Bahasa Malaysia/Indonesia, Thai, Vietnamese, Filipino, Chinese)
- **Gamification** - XP points, badges, streaks, readiness score
- **Learning Hub** - 11 interactive modules for interview preparation
- **Payment Processing** - Stripe integration for credit purchases

### Current Status
- **Production**: Live with paying users
- **Active Development**: Phase 2 redesign (Base44 MVP integration)
- **Testing Phase**: Achieving 95%+ test coverage before production deployment

---

## Architecture & Tech Stack

### Application Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        User Traffic                          │
│                    (HTTPS via ALB)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Elastic Beanstalk (Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js Backend + React Frontend (SPA)           │   │
│  │  - API Routes: /api/*                                │   │
│  │  - Static Files: Vite-built React app               │   │
│  │  - WebSocket: Socket.IO for real-time features      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL RDS (ap-southeast-1)              │
│  - Production DB: postgres                                   │
│  - Staging DB: p3_staging                                    │
│  - Backups: 7-day automated retention                        │
│  - SSL: Required (sslmode=require)                           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  - OpenAI API (GPT-4) - Primary AI service                   │
│  - Stripe API - Payment processing                           │
│  - AWS Bedrock - Claude AI (optional fallback)              │
│  - Gmail SMTP - Email verification                           │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend**:
- React 18 with TypeScript
- Vite (build tool)
- TailStack Query (data fetching)
- Wouter (routing)
- Shadcn/ui + Tailwind CSS

**Backend**:
- Node.js 20 (LTS)
- Express.js with TypeScript
- Drizzle ORM (PostgreSQL)
- Socket.IO (WebSockets)
- Passport.js (authentication)

**Database**:
- PostgreSQL 16 (AWS RDS)
- Drizzle ORM with migrations
- Separate databases per environment

**Build & Runtime**:
- Build: `npm run build` → `dist/` (backend) + `dist/public/` (frontend)
- Start: `npm run start` → `node dist/index.js`
- Port: 5000 (Express serves both API and static files)

---

## Infrastructure Setup

### AWS Resources

**Region**: `ap-southeast-1` (Singapore)

#### Elastic Beanstalk Environments

**Production**:
- Name: `p3-interview-academy-prod-v2`
- Platform: `64bit Amazon Linux 2023 v6.x.x running Node.js 20`
- URL: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- Instance Type: `t3.micro` (can scale to `t3.small`)
- Auto Scaling: Min 1, Max 2 instances
- Health Check: `/api/health/simple`

**Staging**:
- Name: `p3-interview-academy-staging`
- Platform: Same as production
- URL: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- Instance Type: `t3.micro`
- Auto Scaling: Min 1, Max 1 (fixed)
- Health Check: `/api/health/simple`

#### RDS PostgreSQL

**Instance**:
- Identifier: `p3-interview-db`
- Engine: PostgreSQL 16
- Instance Class: `db.t3.micro` (1 vCPU, 1 GB RAM)
- Storage: 20 GB SSD (autoscaling enabled)
- Multi-AZ: No (single AZ for cost)
- Backup: 7-day retention
- SSL: Required

**Databases**:
- Production: `postgres` (default database)
- Staging: `p3_staging`

**Users**:
- `app_user_prod` - Production application user (least privilege)
- `app_user_staging` - Staging application user (least privilege)
- `postgres` - Master admin user (emergency only)

**Connection Strings**:
```bash
# Production
postgresql://app_user_prod:[PASSWORD]@p3-interview-db.xxxxx.ap-southeast-1.rds.amazonaws.com:5432/postgres?sslmode=require

# Staging
postgresql://app_user_staging:[PASSWORD]@p3-interview-db.xxxxx.ap-southeast-1.rds.amazonaws.com:5432/p3_staging?sslmode=require
```

#### Security Groups

**EB Security Group** (`sg-xxxxxx`):
- Inbound: HTTP (80), HTTPS (443) from ALB
- Outbound: All traffic

**RDS Security Group** (`sg-yyyyyy`):
- Inbound: PostgreSQL (5432) from EB Security Group
- Outbound: None

**Admin Access**:
- Specific IP allowlisted for RDS direct access (emergency only)

#### Application Load Balancer (ALB)

- Attached to EB environment
- Health checks: `/api/health/simple` (every 30s)
- HTTP → HTTPS redirect: Configured via `.ebextensions/01-https-redirect.config`
- SSL Certificate: AWS Certificate Manager (ACM)

### EB Extensions Configuration

Located in `.ebextensions/`:

**`01-nodejs.config`**:
- Node.js environment variables
- Health check configuration
- Static file serving rules
- Process management (PM2)

**`02-environment-validation.config`**:
- Pre-deployment validation hooks
- Required environment variables check
- Database connectivity validation

**`03-logging.config`**:
- CloudWatch log streaming
- Application log rotation
- Error log aggregation

**`04-ssl.config`** (when custom domain configured):
- SSL certificate setup
- HTTPS enforcement
- Security headers

---

## CI/CD Pipeline

### GitHub Actions Workflows

Located in `.github/workflows/`:

#### 1. Main Branch Deployment (`deploy-main.yml`)

**Trigger**: Push to `main` branch

**Workflow**:
```
1. Run Tests (TypeScript + Vitest)
2. Build Application (npm run build)
3. Deploy to Staging
4. Run Smoke Tests
5. Wait for Manual Approval (GitHub Environments)
6. Deploy to Production
7. Verify Production Health
```

**Key Features**:
- Single build artifact deployed to both environments
- Manual approval gate (repository admin required)
- Automated rollback on health check failure
- Slack/email notifications (if configured)

**Approval Process**:
- GitHub Environments: `staging` (auto-deploy), `production` (requires approval)
- Approvers: Repository admins only
- Timeout: 7 days (deployment expires if not approved)

#### 2. PR-Based Staging Deployment (`deploy-eb-staging.yml`)

**Trigger**: Pull request to `main` branch

**Workflow**:
```
1. Run Tests
2. Build Application
3. Deploy to Staging
4. Comment PR with Staging URL
5. Run Smoke Tests
6. Update PR Status
```

**Key Features**:
- Every PR gets automatic staging deployment
- PR comment includes staging URL and version
- Test results posted to PR
- Staging cleaned up after merge (optional)

#### 3. Smoke Tests (`smoke-tests.ts`)

Located in `deployment-scripts/smoke-tests.ts`

**Tests Run**:
- Health endpoints (`/api/health/simple`, `/api/health`)
- Database connectivity
- Authentication endpoints (`/api/auth/login`, `/api/auth/signup`)
- Prepare module API (`/api/prepare/*`)
- Practice module API (`/api/practice/*`)
- Credit system API (`/api/credits/*`)

**Execution**:
```bash
npx tsx ./deployment-scripts/smoke-tests.ts staging
npx tsx ./deployment-scripts/smoke-tests.ts production
```

### Current CI/CD Status

**✅ Working Well**:
- Automated testing on every commit
- Staging deployment for every PR
- Single artifact deployment (staging-production parity)
- Health check validation before production

**⚠️ Needs Improvement**:
- No monitoring/alerting integration (Datadog, New Relic, etc.)
- No automated rollback on production errors
- No blue-green deployment (zero-downtime)
- Manual approval slows down release cycle
- No staging environment auto-cleanup
- No deployment metrics/analytics

---

## Current Deployment Process

### Manual Deployment (Backup Method)

If GitHub Actions fails, manual deployment is available:

```bash
# 1. Build application
npm ci
npm run build

# 2. Create deployment bundle
bash deployment-scripts/create-deployment-bundle.sh

# 3. Deploy to staging
bash deployment-scripts/deploy-to-eb.sh staging

# 4. Run smoke tests
npx tsx deployment-scripts/smoke-tests.ts staging

# 5. Deploy to production (after approval)
bash deployment-scripts/deploy-to-eb.sh production

# 6. Verify production
npx tsx deployment-scripts/smoke-tests.ts production
```

### Deployment Scripts

Located in `deployment-scripts/`:

**Core Scripts**:
- `full-deployment.sh` - Orchestrates complete deployment
- `create-deployment-bundle.sh` - Creates `.zip` bundle for EB
- `deploy-to-eb.sh` - Deploys to specific environment
- `setup-environment-variables.sh` - Interactive env var configuration
- `verify-database.sh` - Database connectivity validation
- `check-environment-status.sh` - Environment health checking

**Utility Scripts** (`deployment-scripts/util/`):
- `list-versions.sh` - List all deployed versions
- `rollback.sh` - Rollback to previous version
- `tail-logs.sh` - Stream EB logs in real-time
- `describe-events.sh` - Show recent deployment events

### Rollback Procedure

**Automatic** (GitHub Actions):
- Health checks fail → automatic rollback
- Smoke tests fail → deployment marked failed (no promotion to prod)

**Manual**:
```bash
# List available versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy

# Rollback to previous version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label <PREVIOUS_VERSION_LABEL>
```

---

## Environment Configuration

### Environment Variables

**Required for All Environments**:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Session
SESSION_SECRET=<random-32-char-string>

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=<optional-bedrock-key>

# Stripe (test mode for staging, live mode for production)
STRIPE_MODE=test|live
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...

# Application
NODE_ENV=production
PORT=5000
FORCE_HTTPS=true

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@bizelev8.ai
SMTP_PASS=<app-password>
EMAIL_FROM=support@bizelev8.ai
EMAIL_FROM_NAME=P3 Interview Academy

# URLs
APP_URL_DEV=http://localhost:5000
APP_URL_PROD=https://p3app.bizelev8.ai
```

**Setting Environment Variables**:

Via AWS Console:
1. Go to Elastic Beanstalk → Environments → Configuration
2. Click "Software" → Edit
3. Add environment properties
4. Save and apply (triggers deployment)

Via Script:
```bash
bash deployment-scripts/setup-environment-variables.sh
```

Via AWS CLI:
```bash
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value=<value> \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=SESSION_SECRET,Value=<value>
```

### Secrets Management

**Current State**: ⚠️ Environment variables stored in EB configuration

**Recommended Improvement**:
- Move to AWS Secrets Manager or Parameter Store
- Automatic rotation for database passwords
- Audit logging for secret access

---

## Monitoring & Observability

### Current Monitoring

**AWS CloudWatch**:
- Application logs: `/aws/elasticbeanstalk/p3-interview-academy-*/var/log/nodejs/nodejs.log`
- Error logs: `/aws/elasticbeanstalk/p3-interview-academy-*/var/log/eb-engine.log`
- Access logs: ALB access logs (S3 bucket)

**Health Checks**:
- ALB health check: `/api/health/simple` (every 30s)
- Manual diagnostics: `/api/diagnostics` (requires auth)

**Metrics Available**:
- EB Environment health dashboard
- CloudWatch metrics (CPU, memory, network)
- RDS performance insights (basic)

### What's Missing

**No Automated Alerting**:
- ❌ No alerts on error rate spikes
- ❌ No alerts on API latency degradation
- ❌ No alerts on database connection issues
- ❌ No alerts on disk space/memory issues

**No APM (Application Performance Monitoring)**:
- ❌ No distributed tracing
- ❌ No request-level performance tracking
- ❌ No user session tracking
- ❌ No error aggregation (like Sentry)

**No Business Metrics**:
- ❌ No payment success rate tracking
- ❌ No API usage metrics per endpoint
- ❌ No user funnel tracking
- ❌ No cost analysis (OpenAI API, AWS costs)

### Recommended Monitoring Stack

**Option 1: AWS Native**
- CloudWatch Logs Insights (log analysis)
- CloudWatch Alarms (alerting)
- X-Ray (distributed tracing)
- Cost: ~$50-100/month

**Option 2: Third-Party (Recommended)**
- Datadog (APM + Infrastructure)
- Sentry (Error tracking)
- PagerDuty (On-call alerting)
- Cost: ~$200-300/month

---

## Current Pain Points

### 1. Slow Deployment Cycle
**Issue**: Manual approval gate delays production deployments
**Impact**: Features sit in staging for hours/days waiting for approval
**Priority**: High

### 2. No Zero-Downtime Deployments
**Issue**: Rolling deployments cause brief downtime (30-60s)
**Impact**: Users may experience connection drops during deployment
**Priority**: High

### 3. Limited Observability
**Issue**: No APM, no alerting, manual log diving
**Impact**: Issues discovered by users, not monitoring
**Priority**: High

### 4. Manual Rollback Process
**Issue**: Rollback requires manual AWS CLI commands
**Impact**: Slow incident response, potential extended outages
**Priority**: Medium

### 5. Single Region Deployment
**Issue**: All infrastructure in `ap-southeast-1`
**Impact**: Latency for non-Singapore users, single point of failure
**Priority**: Low (future consideration)

### 6. Test Suite Execution Time
**Issue**: Tests take 59 seconds to run
**Impact**: Slows down CI/CD pipeline
**Priority**: Medium

### 7. Environment Variable Management
**Issue**: Secrets stored in EB configuration (not rotated)
**Impact**: Security risk, difficult to audit
**Priority**: Medium

### 8. No Staging Auto-Cleanup
**Issue**: Old staging deployments from PRs not cleaned up
**Impact**: Clutter, potential confusion
**Priority**: Low

---

## Improvement Priorities

### Phase 1: Immediate (Week 1-2)

**1. Implement Monitoring & Alerting**
- Set up Datadog or CloudWatch dashboards
- Configure error rate alerts (>5% error rate)
- Configure latency alerts (p95 > 500ms)
- Configure database connection alerts
- PagerDuty integration for on-call

**2. Optimize CI/CD Pipeline**
- Remove manual approval gate (trust smoke tests)
- Implement automated rollback on health check failure
- Add deployment notifications (Slack/email)
- Parallelize test execution (reduce from 59s to <30s)

**3. Implement Error Tracking**
- Set up Sentry for frontend and backend
- Configure error grouping and alerting
- Add breadcrumbs for debugging

### Phase 2: Short-term (Week 3-4)

**4. Zero-Downtime Deployments**
- Implement blue-green deployment strategy
- Configure connection draining (30s)
- Health check grace period during deployment

**5. Secrets Management**
- Migrate secrets to AWS Secrets Manager
- Implement automatic secret rotation (90 days)
- Update deployment scripts to fetch from Secrets Manager

**6. Database Optimization**
- Enable RDS Performance Insights (enhanced monitoring)
- Set up slow query log analysis
- Configure connection pooling optimization
- Implement read replicas (if needed)

### Phase 3: Medium-term (Month 2)

**7. Infrastructure as Code**
- Convert EB configuration to Terraform/CloudFormation
- Version control infrastructure changes
- Automated environment provisioning

**8. Multi-Region Setup (Optional)**
- Replicate infrastructure to `us-east-1` or `eu-west-1`
- Implement global traffic routing (Route 53)
- Cross-region database replication

**9. Cost Optimization**
- Implement auto-scaling policies
- Scheduled scaling for off-peak hours
- Reserved instance pricing analysis
- AWS Cost Explorer dashboards

---

## Access Requirements

### Access Needed for DevOps Engineer

**AWS Access**:
- IAM user with permissions:
  - `ElasticBeanstalk*` (full access to EB)
  - `RDS*` (describe, modify)
  - `CloudWatch*` (logs, metrics, alarms)
  - `S3*` (deployment bundles, logs)
  - `EC2*` (instances, security groups)
  - `IAM:PassRole` (for EB service role)
- MFA enforced
- Access key rotation every 90 days

**GitHub Access**:
- Repository: `github.com/jevinbizelev8/P3-Interview-Academy`
- Permission level: Write (to modify workflows)
- Required for: CI/CD pipeline modifications

**Database Access**:
- Read-only access to production RDS
- Full access to staging RDS
- Connection via bastion host or VPN (not direct internet)

**Third-Party Services** (if implementing):
- Datadog admin access
- Sentry admin access
- PagerDuty admin access
- Stripe dashboard (view-only for monitoring)

### Security Best Practices

**Must Follow**:
- ✅ Use AWS SSO or IAM users (no root account access)
- ✅ Enable MFA on all accounts
- ✅ Use AWS CLI profiles, not hardcoded credentials
- ✅ Never commit credentials to git
- ✅ Use least privilege principle for IAM policies
- ✅ Rotate access keys every 90 days
- ✅ Use bastion host or VPN for database access
- ✅ Audit CloudTrail logs monthly

---

## Key Documentation

### Essential Reading (Priority Order)

1. **DEPLOYMENT.md** - Comprehensive deployment guide
   - Current deployment process
   - Troubleshooting common issues
   - Manual deployment procedures

2. **CLAUDE.md** - Project overview and current status
   - Architecture overview
   - Tech stack details
   - Active projects and roadmap

3. **SECURITY.md** - Security best practices
   - AWS credentials management
   - Security incident history
   - Development security guidelines

4. **INTEGRATION.md** - Third-party integrations
   - Stripe payment setup
   - Email verification system
   - OAuth configuration

5. **docs/development/COMMANDS.md** - Development commands
   - Testing commands
   - Database commands
   - Deployment commands

6. **OPTION_B_COMPREHENSIVE_TESTING_PLAN.md** - Current testing initiative
   - 3-week testing plan
   - Agent coordination
   - Success criteria

7. **PHASE_9_TESTING_PROGRESS.md** - Current testing status
   - Test coverage progress
   - Critical issues identified
   - Remaining work

### Architecture Diagrams

**Request Flow**:
```
User → ALB → EB (Express.js) → RDS (PostgreSQL)
                    ↓
                 OpenAI API
                 Stripe API
```

**Deployment Flow**:
```
GitHub Push → GitHub Actions → Build → Staging → Smoke Tests → Manual Approval → Production
```

**Database Schema**:
- See `shared/schema.ts` for complete schema
- 30+ tables covering users, sessions, transactions, gamification

---

## Getting Started Checklist

### Week 1: Environment Setup & Familiarization

- [ ] **Day 1-2: Access & Permissions**
  - [ ] Receive AWS IAM credentials with MFA setup
  - [ ] Receive GitHub repository access (Write permission)
  - [ ] Clone repository locally
  - [ ] Configure AWS CLI with profile (`aws configure sso`)
  - [ ] Test access: List EB environments
    ```bash
    aws elasticbeanstalk describe-environments
    ```

- [ ] **Day 2-3: Documentation Review**
  - [ ] Read DEPLOYMENT.md thoroughly
  - [ ] Read CLAUDE.md (architecture section)
  - [ ] Read SECURITY.md (credentials section)
  - [ ] Review `.github/workflows/` CI/CD pipelines
  - [ ] Review `deployment-scripts/` directory

- [ ] **Day 3-4: Environment Exploration**
  - [ ] Connect to staging environment:
    ```bash
    curl http://p3-interview-academy-staging.../api/health
    ```
  - [ ] Explore CloudWatch logs
  - [ ] Review EB environment configuration
  - [ ] Check current environment variables
  - [ ] Review RDS database configuration

- [ ] **Day 4-5: Hands-On Deployment**
  - [ ] Trigger a test PR deployment to staging
  - [ ] Review deployment logs in GitHub Actions
  - [ ] Run smoke tests manually:
    ```bash
    npx tsx deployment-scripts/smoke-tests.ts staging
    ```
  - [ ] Monitor deployment in EB dashboard

### Week 2: Quick Wins & Monitoring Setup

- [ ] **Monitoring Setup**
  - [ ] Set up CloudWatch dashboard for key metrics
  - [ ] Configure CloudWatch alarms:
    - [ ] Error rate > 5%
    - [ ] API latency p95 > 500ms
    - [ ] RDS CPU > 80%
    - [ ] RDS connections > 80%
  - [ ] Set up email/Slack notifications
  - [ ] (Optional) Set up Datadog trial

- [ ] **CI/CD Optimization**
  - [ ] Analyze GitHub Actions execution time
  - [ ] Identify bottlenecks in test suite
  - [ ] Propose parallelization strategy
  - [ ] Test optimized pipeline in feature branch

- [ ] **Documentation Updates**
  - [ ] Document any gaps found
  - [ ] Create runbook for common issues
  - [ ] Update DEPLOYMENT.md with learnings

### Week 3-4: Major Improvements

- [ ] **Implement Priority 1 Improvements**
  - [ ] Remove manual approval gate (if agreed)
  - [ ] Implement automated rollback
  - [ ] Set up error tracking (Sentry)
  - [ ] Optimize test execution time

- [ ] **Security Enhancements**
  - [ ] Audit current IAM policies
  - [ ] Propose Secrets Manager migration plan
  - [ ] Review security group rules
  - [ ] Enable AWS Config (compliance monitoring)

- [ ] **Documentation & Knowledge Transfer**
  - [ ] Create operational runbooks
  - [ ] Document new monitoring setup
  - [ ] Train team on new tools/processes
  - [ ] Establish on-call rotation (if applicable)

---

## Contact & Support

### Team Contacts

**Technical Lead** (AI Engineering):
- Role: Overall technical decisions, architecture
- Contact: [To be provided]

**Founder/Product**:
- Role: Product decisions, deployment approvals
- Contact: [To be provided]

**Development Team**:
- Contact: [To be provided]

### Emergency Procedures

**Production Incident Response**:
1. Alert team via Slack/PagerDuty
2. Check CloudWatch logs for errors
3. If critical: Rollback to previous version
4. If database issue: Contact technical lead
5. Document incident in post-mortem

**Rollback Command** (keep handy):
```bash
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label <PREVIOUS_VERSION_LABEL>
```

### Useful Commands Reference

```bash
# Check environment health
aws elasticbeanstalk describe-environment-health \
  --environment-name p3-interview-academy-prod-v2 \
  --attribute-names All

# Tail logs
aws elasticbeanstalk tail-logs \
  --environment-name p3-interview-academy-prod-v2

# List recent events
aws elasticbeanstalk describe-events \
  --environment-name p3-interview-academy-prod-v2 \
  --max-items 20

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier p3-interview-db

# Run smoke tests
npx tsx deployment-scripts/smoke-tests.ts production
```

---

## Questions to Ask in First Meeting

1. **Deployment Frequency**: How often do you want to deploy to production?
2. **Risk Tolerance**: What's acceptable downtime during deployments?
3. **Budget**: What's the monthly budget for monitoring/tooling?
4. **On-Call**: Is there an on-call expectation? If so, what's the rotation?
5. **Priorities**: Which pain points are most critical to solve first?
6. **Tools**: Any preference for monitoring tools (Datadog vs AWS native)?
7. **Future Plans**: Any plans for multi-region expansion?
8. **Team Size**: How many engineers will be deploying regularly?

---

**Welcome aboard!** This is a well-architected system with solid foundations. Your focus will be on improving deployment velocity, observability, and reliability. The team has done excellent work documenting everything, so you're in good hands.

Feel free to ask questions and propose improvements. We value DevOps expertise and welcome your recommendations!

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Maintained By**: Technical Lead
**Review Frequency**: Monthly
