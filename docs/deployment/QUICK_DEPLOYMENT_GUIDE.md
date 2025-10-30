# Quick Deployment Guide - Phase 1 Migration

**Status**: ✅ Ready for PR Creation
**Date**: 2025-10-30
**Branch**: `redesign/mvp-founder-design` (pushed to remote)

---

## 🚨 CRITICAL: Manual PR Creation Required

GitHub CLI authentication failed. You must create the PR manually.

### Step 1: Create PR on GitHub

1. **Go to**: https://github.com/jevinbizelev8/P3-Interview-Academy/compare/main...redesign/mvp-founder-design

2. **Click**: "Create pull request"

3. **Title**:
   ```
   feat(redesign): Deploy Phase 1 database migration to staging
   ```

4. **Body**: Copy from `/home/runner/workspace/pr-body.txt` or use this:

---

## Phase 1 Database Migration Deployment

### Overview
Deploying 13 new tables and 6 user columns for the redesign project gamification and learning system.

### Pre-Deployment Verification ✅
- ✅ TypeScript compilation: 0 errors
- ✅ Production build: SUCCESS (19.65s)
- ✅ Test suite: 8/8 tests passing
- ✅ Migration tested locally: 365ms, 19/19 checks passed
- ✅ Rollback procedures documented

### Database Changes

**New Tables** (13):
- badges, user_badges
- learning_modules, user_module_progress
- self_intro_drafts, resumes
- star_stories, reflection_journals
- actual_interviews, referrals
- feedback, support_tickets
- credit_ledger

**Extended Tables** (2):
- users: +6 columns (xp_points, current_streak, longest_streak, readiness_score, last_activity_date, referral_code)
- interview_sessions: +1 column (reflection_id)

### Migration Details
- **File**: `server/migrations/2025-10-redesign/phase1.sql`
- **Type**: Additive only (no destructive changes)
- **Execution Time**: ~365ms (tested locally)
- **Verification**: 24/25 checks passed (1 non-critical index warning)

### Automation
- ✅ Migration runner script (`server/scripts/run-migration.ts`)
- ✅ Verification script (`server/scripts/verify-migration.ts`)
- ✅ Rollback script (`server/scripts/rollback-migration.ts`)
- ✅ CI/CD integration (auto-runs before deployment)
- ✅ **RUN_CI_DB_MIGRATION enabled in staging workflow** (commit 6659292)

### Rollback Plan
If migration fails:
1. Automatic rollback via `npm run db:migrate:rollback`
2. RDS snapshot restore (if needed)
3. Redeploy previous version

See `docs/redesign/MIGRATION_RUNBOOK.md` for detailed procedures.

### Testing Checklist
After deployment:
- [ ] Verify 15 tables exist in staging database
- [ ] Verify 6 user columns added
- [ ] Run smoke tests
- [ ] Seed initial data (badges, learning modules)
- [ ] Test new API endpoints
- [ ] Check CloudWatch logs for errors

### Documentation
- Master Plan: `docs/redesign/MASTER_PLAN.md`
- Migration Runbook: `docs/redesign/MIGRATION_RUNBOOK.md`
- Database Schema: `docs/redesign/DATABASE_SCHEMA.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

---

### Step 2: Wait for GitHub Actions (Auto-triggered)

Once PR is created, GitHub Actions will automatically:
1. Run tests (5-10 min)
2. **Run database migration** (1-2 min) ← NEW, ENABLED
3. **Verify migration** (30 sec) ← NEW
4. Build application (10-15 min)
5. Deploy to staging (10-15 min)
6. Run health checks (1-2 min)
7. Comment on PR with staging URL

**Total time**: ~30-45 minutes

### Step 3: Monitor Deployment

Use the monitoring script:
```bash
./monitor-deployment.sh <PR_NUMBER>
```

Or check manually:
- **GitHub Actions**: https://github.com/jevinbizelev8/P3-Interview-Academy/actions
- **PR Comments**: Check for staging URL comment

### Step 4: Verify Migration (After Deployment)

```bash
# Quick health check
curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health/simple

# Verify database schema
npm run db:migrate:verify
```

Expected output:
```
✅ 15/15 tables verified
✅ 6/6 user columns verified
✅ All indexes created
✅ All foreign keys valid
```

### Step 5: Seed Data

```bash
npm run db:seed-redesign
```

Expected:
- 15-20 badges created
- 11 learning modules created

### Step 6: Test APIs

```bash
STAGING_URL="http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"

# Test badges
curl $STAGING_URL/api/gamification/badges

# Test modules
curl $STAGING_URL/api/prepare/modules
```

### Step 7: Check Logs

```bash
aws logs tail /aws/elasticbeanstalk/p3-interview-academy-staging/var/log/nodejs/nodejs.log \
  --since 30m \
  --follow
```

Look for:
- ✅ "Migration executed successfully"
- ✅ No error stack traces
- ✅ Successful API requests

### Step 8: Update Documentation

1. **ops-log** (`docs/ops-log/2025-10.md`):
   ```markdown
   ### 2025-10-30: Phase 1 Database Migration Deployed to Staging

   - ✅ PR #XXX created
   - ✅ Migration executed: XXXms
   - ✅ 15 tables created
   - ✅ 6 user columns added
   - ✅ Health: Green
   ```

2. **MASTER_PLAN** (`docs/redesign/MASTER_PLAN.md`):
   ```markdown
   - [x] Deploy schema to staging database ✅ 2025-10-30
   ```

---

## 🚨 If Something Goes Wrong

### Migration Fails

1. Check GitHub Actions logs for error
2. Automatic rollback should trigger
3. Verify rollback: `npm run db:migrate:verify`
4. Fix issue and retry

### Deployment Fails

1. Check AWS EB events:
   ```bash
   aws elasticbeanstalk describe-events \
     --environment-name p3-interview-academy-staging \
     --max-items 20
   ```

2. Check CloudWatch logs for errors

3. Rollback to previous version:
   ```bash
   aws elasticbeanstalk describe-application-versions \
     --application-name p3-interview-academy \
     --max-records 5

   aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-staging \
     --version-label <PREVIOUS_VERSION>
   ```

### Database Corrupted

1. Rollback migration:
   ```bash
   npm run db:migrate:rollback
   ```

2. If severe, restore RDS snapshot:
   - See `docs/redesign/MIGRATION_RUNBOOK.md`
   - 7-day retention available

---

## 📊 Success Criteria

Before declaring success:

✅ PR created on GitHub
✅ GitHub Actions workflow completed
✅ Migration step passed (15 tables + 6 columns)
✅ Verification step passed
✅ Staging deployment green
✅ Health endpoints HTTP 200
✅ Seed data loaded
✅ API endpoints responding
✅ CloudWatch logs clean
✅ Documentation updated

---

## 📚 Reference Files

- **Deployment status**: `/home/runner/workspace/DEPLOYMENT_STATUS.md` (detailed)
- **PR body**: `/home/runner/workspace/pr-body.txt` (for GitHub)
- **Monitoring script**: `/home/runner/workspace/monitor-deployment.sh` (automated checks)
- **Migration runbook**: `docs/redesign/MIGRATION_RUNBOOK.md` (procedures)
- **Master plan**: `docs/redesign/MASTER_PLAN.md` (project tracking)

---

## ⏱️ Timeline

- **PR Creation**: 2 min (manual)
- **GitHub Actions**: 30-45 min (automatic)
- **Verification**: 15 min (manual)
- **Seeding**: 30 min (manual)
- **Testing**: 20 min (manual)
- **Documentation**: 15 min (manual)

**Total**: ~2-2.5 hours

---

## 🔗 Quick Links

- **PR Compare**: https://github.com/jevinbizelev8/P3-Interview-Academy/compare/main...redesign/mvp-founder-design
- **GitHub Actions**: https://github.com/jevinbizelev8/P3-Interview-Academy/actions
- **Staging URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
- **AWS Console**: https://console.aws.amazon.com/elasticbeanstalk/home?region=ap-southeast-1

---

**Ready to deploy! Create the PR now.**
