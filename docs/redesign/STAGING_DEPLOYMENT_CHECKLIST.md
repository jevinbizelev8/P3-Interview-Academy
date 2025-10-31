# Staging Deployment Checklist

**Project**: P3 Interview Academy - Base44 MVP Redesign Integration
**Environment**: Staging (`p3-interview-academy-staging`)
**Branch**: `redesign/mvp-founder-design`
**Date**: _______________
**Deployed By**: _______________

---

## PRE-DEPLOYMENT CHECKLIST

### Code & Testing Verification

**TypeScript & Build**:
- [ ] TypeScript check passes: `npm run check` (0 errors)
- [ ] Production build succeeds: `npm run build`
- [ ] Build size acceptable: ~1.6 MB bundle, ~446 KB gzipped

**Test Execution**:
- [ ] Client tests reviewed: `npm run test:client` (118 tests, 58 passing - known selector issues)
- [ ] Server tests pass: `npm run test:api` (203 tests, 174 passing - 86%)
- [ ] Integration tests pass: `npm run test:integration` (2/2 passing)
- [ ] All test failures documented and non-blocking

**Code Review**:
- [ ] All PRs merged to `redesign/mvp-founder-design` branch
- [ ] Code review completed and approved
- [ ] No console.error or alert() in production code
- [ ] All TODO items documented in MASTER_PLAN.md

---

### Database Migration Readiness

**Migration Preparation**:
- [ ] Migration SQL reviewed: `cat server/migrations/2025-10-redesign/phase1.sql`
- [ ] Migration tests pass: Run migration tests if available
- [ ] Database schema validated: 13 new tables + 6 user columns
- [ ] Staging database backup created (< 24 hours old)
- [ ] Migration verified in local dev environment
- [ ] Rollback SQL prepared and reviewed

**Expected Schema Changes**:
- [ ] New tables: 15 total (badges, user_badges, learning_modules, user_module_progress, self_intros, resumes, star_stories, reflection_journals, actual_interviews, referrals, feedback, support_tickets, etc.)
- [ ] User columns: xp_points, current_streak, longest_streak, readiness_score, referral_code, last_active_at
- [ ] No breaking changes to existing tables
- [ ] All foreign keys properly defined

---

### Environment Health

**AWS Environment Status**:
- [ ] Staging environment health: Run `./deployment-scripts/check-environment-status.sh p3-interview-academy-staging`
- [ ] Status: Ready
- [ ] Health: Green/OK
- [ ] No recent errors in CloudWatch logs

**Environment Variables**:
- [ ] All required variables configured in AWS EB Console
- [ ] DATABASE_URL points to staging database (`p3_staging`)
- [ ] SESSION_SECRET configured
- [ ] OPENAI_API_KEY configured
- [ ] SMTP credentials configured
- [ ] Stripe test mode credentials configured
- [ ] No production secrets in staging

**CI/CD Pipeline**:
- [ ] GitHub Actions workflows passing
- [ ] AWS credentials configured (GitHub Secrets)
- [ ] Deployment permissions verified
- [ ] No pending GitHub Actions runs

---

### Communication & Preparation

**Team Coordination**:
- [ ] Team notified of staging deployment
- [ ] Founders aware of new features being deployed
- [ ] Deployment time communicated (if scheduled)
- [ ] Rollback contact available (if needed)

**Documentation**:
- [ ] CHANGELOG.md updated with changes
- [ ] MASTER_PLAN.md Phase 6 Week 2 status current
- [ ] Deployment notes prepared
- [ ] Known issues documented

---

## DEPLOYMENT EXECUTION

### GitHub Actions Pipeline

**Trigger Deployment**:
- [ ] Method: Push to `redesign/mvp-founder-design` OR manual workflow dispatch
- [ ] Pipeline started: GitHub Actions Run URL: _______________
- [ ] Deployment version label: _______________
- [ ] Commit SHA: _______________

**Monitor Pipeline Stages**:

**Stage 1: Tests & Build**:
- [ ] TypeScript check passes
- [ ] Unit tests execute successfully
- [ ] Integration tests pass
- [ ] Build completes
- [ ] Build artifact created

**Stage 2: Staging Deployment**:
- [ ] Database migration initiated
- [ ] Migration executes successfully: Check logs for "Migration completed"
- [ ] Migration verification passes: 19/19 checks ✅
- [ ] Application bundle uploaded to S3
- [ ] EB environment update initiated
- [ ] Rolling deployment in progress
- [ ] Health check passes (3 retries, 30s intervals)

**Stage 3: Deployment Completion**:
- [ ] Deployment status: SUCCESS
- [ ] Environment status: Ready
- [ ] Health: Green
- [ ] No errors in deployment logs

**Pipeline Links** (Record for audit):
- GitHub Actions Run: _______________
- S3 Artifact URL: _______________
- EB Application Version: _______________

---

## POST-DEPLOYMENT VALIDATION

### Automated Smoke Tests

**Run Smoke Tests**:
```bash
npx tsx deployment-scripts/smoke-tests.ts http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
```

- [ ] Health check (simple): ✅ HTTP 200
- [ ] Health check (detailed): ✅ Database connected, uptime > 0
- [ ] Practice module API: ✅ Endpoint reachable

---

### Database Verification

**Schema Validation**:
```bash
# Option 1: Run migration verify (if available)
npm run db:migrate:verify

# Option 2: Connect to database and verify manually
psql $DATABASE_URL_STAGING
```

- [ ] All 15 new tables exist
- [ ] All 6 user columns added (xp_points, current_streak, longest_streak, readiness_score, referral_code, last_active_at)
- [ ] Existing user count matches pre-deployment: _____ users
- [ ] No data loss detected
- [ ] All foreign keys properly created
- [ ] Indexes created successfully

---

### Manual Feature Testing

#### Phase 1-5 Features (Redesign)

**Prepare Module**:
- [ ] Learning Hub accessible: Navigate to `/prepare/learning-hub`
- [ ] Learning modules display (11 modules expected)
- [ ] Module progression tracking works
- [ ] Resume Analyzer accessible: Upload PDF → Analysis generated
- [ ] Resume AI feedback displays correctly
- [ ] Self-Intro Wizard loads: 6-step wizard functional
- [ ] Self-intro video recording/upload works
- [ ] STAR Story Builder accessible and functional
- [ ] Story templates available
- [ ] Readiness Score displays: 0-100% with breakdown

**Practice Module (Existing + Enhancements)**:
- [ ] Simulation setup shows credit cost
- [ ] Credit balance displays correctly
- [ ] Interview session starts successfully
- [ ] AI questions generate properly
- [ ] Voice/text response capture works
- [ ] Credit deduction occurs after session
- [ ] Assessment displays with STAR scoring
- [ ] Reflection journal saves after session
- [ ] Session history displays

**Perform Module**:
- [ ] Dashboard loads with new metrics
- [ ] XP points display correctly
- [ ] Readiness score shows on dashboard
- [ ] Badge gallery displays (empty initially for new users)
- [ ] Streak counter displays (0 for new users)
- [ ] Actual Interview Tracker accessible
- [ ] Can log real interview experiences
- [ ] Interview timeline displays
- [ ] Performance analytics display
- [ ] Chart data renders correctly

**Gamification System**:
- [ ] XP awarded for completing learning module
- [ ] XP awarded for completing practice session
- [ ] Badge progression displays
- [ ] Badge requirements shown
- [ ] Leaderboard accessible (if populated)
- [ ] Streak tracking increments correctly
- [ ] Readiness score calculation accurate

**Credits & Referrals**:
- [ ] Credit balance API works: `GET /api/credits/balance`
- [ ] Credit history displays
- [ ] Top-up flow accessible (if implemented)
- [ ] Referral code generation works
- [ ] Referral code displays to user
- [ ] Can apply referral code
- [ ] Referral stats display

**Support & Feedback**:
- [ ] Floating AI Coach accessible
- [ ] Can submit feedback
- [ ] Can create support ticket
- [ ] Support ticket list displays
- [ ] Ticket status updates work

---

### API Endpoint Testing

**Core APIs** (Sample key endpoints):
```bash
# Set staging URL
STAGING_URL="http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"

# Test health
curl $STAGING_URL/api/health

# Test gamification endpoints (requires authentication)
# GET /api/gamification/xp
# GET /api/gamification/badges
# GET /api/gamification/streak
# GET /api/gamification/leaderboard

# Test prepare endpoints
# GET /api/prepare/modules
# POST /api/prepare/resume
# GET /api/prepare/self-intros
# POST /api/prepare/star-stories

# Test perform endpoints
# GET /api/perform/readiness-score
# GET /api/perform/stats
# GET /api/perform/performance-chart

# Test referral endpoints
# GET /api/referrals/code
# POST /api/referrals/create
# POST /api/referrals/apply
```

**API Health Checks**:
- [ ] `/api/health/simple` - ✅ HTTP 200
- [ ] `/api/health` - ✅ HTTP 200, database connected
- [ ] `/api/gamification/xp` - Works with authentication
- [ ] `/api/gamification/badges` - Returns badge list
- [ ] `/api/prepare/modules` - Returns 11 learning modules
- [ ] `/api/perform/readiness-score` - Calculates score (0-100%)
- [ ] `/api/referrals/code` - Returns or generates referral code

---

### Authentication & Security

**Authentication Flow**:
- [ ] Login works correctly
- [ ] Logout works correctly
- [ ] Session persistence maintained
- [ ] Protected routes enforce authentication
- [ ] Redirect to login for unauthenticated users

**Security Checks**:
- [ ] User data segregated (staging database isolated)
- [ ] No production data accessible
- [ ] CORS configured correctly
- [ ] HTTPS enforced (if SSL configured)
- [ ] Session cookies secure
- [ ] No sensitive data in client-side code

---

### Performance & Quality

**Performance Metrics**:
- [ ] Homepage load time: < 3 seconds
- [ ] API response time: < 500ms (average)
- [ ] Dashboard load time: < 2 seconds
- [ ] No performance regressions from baseline

**Quality Checks**:
- [ ] No console errors in browser DevTools
- [ ] No 500 errors in CloudWatch logs
- [ ] No database connection errors
- [ ] No authentication failures (unexpected)
- [ ] Images and assets load correctly

**Cross-Browser Testing** (Quick Check):
- [ ] Chrome: UI renders correctly
- [ ] Safari: No layout issues
- [ ] Firefox: Functional
- [ ] Mobile responsive: Test on small viewport (375px)

---

### Environment Configuration Verification

**Check Environment Status**:
```bash
./deployment-scripts/check-environment-status.sh p3-interview-academy-staging
```

- [ ] Environment status: Ready
- [ ] Health: Green/Ok
- [ ] Version label: Matches deployment
- [ ] Platform version: Current
- [ ] Instance count: > 0

**Verify Database Connection**:
```bash
./deployment-scripts/verify-database.sh
```

- [ ] Database reachable
- [ ] Credentials valid
- [ ] Connection pool healthy
- [ ] Query response time acceptable

---

### Monitoring & Logs

**CloudWatch Logs** (Last 10 minutes):
- [ ] No ERROR level logs
- [ ] No WARN logs (or reviewed and acceptable)
- [ ] No database connection errors
- [ ] No authentication failures
- [ ] API requests logging normally

**Application Logs**:
- [ ] Server startup successful
- [ ] Database connection established
- [ ] Migrations applied successfully
- [ ] No uncaught exceptions
- [ ] No memory leaks detected

---

## ROLLBACK PROCEDURES

### When to Rollback

**Critical Issues** (Immediate rollback):
- Database migration failure
- Application not starting
- Health checks failing consistently
- Data loss or corruption
- Security vulnerability exposed

**Major Issues** (Consider rollback):
- Core features broken (login, practice sessions)
- Performance degradation > 50%
- High error rate (> 5% of requests)
- User-facing critical bugs

**Minor Issues** (Fix forward):
- UI glitches
- Non-critical feature issues
- Low error rates
- Performance issues < 20%

---

### Rollback Steps

#### 1. Stop Further Deployment

If deployment is in progress:
- [ ] Cancel GitHub Actions workflow (if still running)
- [ ] Notify team of rollback decision
- [ ] Document reason for rollback

#### 2. Rollback Application Code

**Via AWS Console**:
1. Navigate to Elastic Beanstalk console
2. Select `p3-interview-academy-staging`
3. Click "Application versions"
4. Select previous version
5. Click "Deploy"

**Via AWS CLI**:
```bash
# List recent versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy \
  --max-records 10

# Deploy previous version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --version-label <PREVIOUS_VERSION_LABEL>
```

- [ ] Application rollback initiated
- [ ] Previous version: _______________
- [ ] Rollback deployment started
- [ ] Health check passes after rollback

#### 3. Rollback Database (If Needed)

**Option 1: Migration Rollback** (if migration reversible):
```bash
npm run db:migrate:rollback
```

**Option 2: RDS Snapshot Restore** (if migration not reversible):
```bash
# Create new DB instance from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier p3-staging-rollback-$(date +%Y%m%d) \
  --db-snapshot-identifier <PRE_DEPLOYMENT_SNAPSHOT_ID>

# Update connection string in EB environment
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value=<NEW_CONNECTION_STRING>
```

- [ ] Database rollback method: _______________ (migration rollback / snapshot restore)
- [ ] Database rollback completed
- [ ] Database connectivity verified
- [ ] Data integrity checked

#### 4. Verify Rollback Success

- [ ] Health check passes: `curl $STAGING_URL/api/health`
- [ ] Core functionality restored: Login → Dashboard → Practice
- [ ] No errors in CloudWatch logs (last 5 minutes)
- [ ] Database queries successful
- [ ] Application responding normally

#### 5. Post-Rollback Actions

- [ ] Document rollback in `docs/ops-log/2025-10.md`
- [ ] Update MASTER_PLAN.md with blocker status
- [ ] Create GitHub issue for failure investigation
- [ ] Schedule post-mortem meeting
- [ ] Identify root cause
- [ ] Plan fix and re-deployment

**Rollback Documentation Template**:
```markdown
## Staging Deployment Rollback - [DATE]

**Deployment Version**: [VERSION_LABEL]
**Rollback Time**: [TIMESTAMP]
**Rolled Back To**: [PREVIOUS_VERSION_LABEL]

**Reason for Rollback**:
[Describe the critical issue that triggered rollback]

**Impact**:
[Describe what was affected and for how long]

**Root Cause**:
[Initial assessment of what went wrong]

**Resolution Plan**:
[Steps to fix the issue before re-deployment]

**Lessons Learned**:
[What can be improved in the process]
```

---

## SIGN-OFF & NEXT STEPS

### Deployment Details

**Deployment Information**:
- **Date/Time**: _______________
- **Deployed By**: _______________
- **Branch**: `redesign/mvp-founder-design`
- **Commit SHA**: _______________
- **Version Label**: _______________
- **GitHub Actions Run**: _______________

**Environment Status**:
- **Pre-Deployment**: _______________
- **Post-Deployment**: _______________
- **Rollback Required**: Yes / No

---

### Sign-Off

**Engineering Lead**:
- Name: _______________
- Signature: _______________
- Date: _______________
- Status: ✅ Approved / ⚠️ Conditional / ❌ Issues Found

**QA / Testing** (if applicable):
- Name: _______________
- Signature: _______________
- Date: _______________
- Status: ✅ Approved / ⚠️ Conditional / ❌ Issues Found

**Deployment Status**:
- [ ] ✅ **SUCCESS** - All checks passed, ready for UAT
- [ ] ⚠️ **SUCCESS WITH ISSUES** - Deployed but non-critical issues found (document below)
- [ ] ❌ **FAILED** - Critical issues found, rollback required

---

### Known Issues (If Any)

| Issue | Severity | Impact | Workaround | Fix Required |
|-------|----------|--------|------------|--------------|
| | | | | |
| | | | | |

---

### Next Steps

**Immediate**:
- [ ] Monitor staging for 24 hours
- [ ] Collect initial user feedback
- [ ] Document any issues discovered
- [ ] Schedule UAT with founders

**User Acceptance Testing (UAT)**:
- [ ] Schedule UAT session: _______________
- [ ] Prepare UAT test script
- [ ] Test as new user (signup → prepare → practice → perform)
- [ ] Test as existing user (verify no breakage)
- [ ] Test all Phase 1-5 features
- [ ] Collect founder feedback
- [ ] Document UAT results

**Production Readiness**:
- [ ] UAT sign-off received
- [ ] All critical issues resolved
- [ ] Performance validated
- [ ] Security audit complete (if required)
- [ ] Production deployment planned: _______________

**Documentation**:
- [ ] Update CHANGELOG.md
- [ ] Update MASTER_PLAN.md
- [ ] Document deployment in ops log
- [ ] Share results with team

---

## Quick Reference Links

**Documentation**:
- [Master Plan](MASTER_PLAN.md) - Phase 6 Week 2
- [Deployment Guide](../../DEPLOYMENT.md) - Detailed procedures
- [Migration Runbook](MIGRATION_RUNBOOK.md) - Database migration guide
- [API Mapping](API_MAPPING.md) - All API endpoints
- [Database Schema](DATABASE_SCHEMA.md) - Schema documentation

**Scripts**:
- Smoke Tests: `deployment-scripts/smoke-tests.ts`
- Environment Status: `deployment-scripts/check-environment-status.sh`
- Database Verify: `deployment-scripts/verify-database.sh`
- Full Deployment: `deployment-scripts/full-deployment.sh`

**URLs**:
- Staging: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- GitHub Actions: `https://github.com/jevinbizelev8/P3-Interview-Academy/actions`
- AWS Console: `https://console.aws.amazon.com/elasticbeanstalk`

---

**Checklist Version**: 1.0
**Last Updated**: 2025-10-31
**Next Review**: After first staging deployment
