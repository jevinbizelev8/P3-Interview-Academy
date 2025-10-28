# Database Migration Runbook - Phase 1 Redesign

**Version**: 1.0
**Date**: 2025-10-28
**Migration**: Phase 1 - Redesign Schema (Gamification + Learning)
**Impact**: 🟢 LOW - Additive changes only (6 columns, 15 tables)

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Automated Deployment (CI/CD)](#automated-deployment-cicd)
4. [Manual Deployment Procedures](#manual-deployment-procedures)
5. [Verification & Testing](#verification--testing)
6. [Emergency Rollback](#emergency-rollback)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment Tasks](#post-deployment-tasks)

---

## Overview

### What This Migration Does

**User Table Extensions** (6 new columns):
- `xp_points` - Experience points for gamification
- `current_streak` - Current consecutive activity streak
- `longest_streak` - Personal best streak record
- `last_activity_date` - Last platform engagement timestamp
- `readiness_score` - Interview preparedness score (0-100)
- `referral_code` - Unique referral code for user growth

**New Tables** (15 total):
1. `job_descriptions` - JD uploads for resume matching
2. `badges` - Badge definitions for gamification
3. `user_badges` - User badge awards and progress
4. `learning_modules` - Interactive learning content
5. `user_module_progress` - Progress tracking per module
6. `self_intro_drafts` - Draft self-introductions
7. `self_intros` - Finalized self-introductions
8. `resumes` - Resume uploads and metadata
9. `resume_analysis_history` - AI analysis results
10. `star_stories` - STAR method interview stories
11. `actual_interviews` - Real interview tracking
12. `reflection_journals` - Post-interview reflections
13. `referrals` - Referral program tracking
14. `feedback` - User feedback submissions
15. `support_tickets` - Support ticket system

### Migration Safety

✅ **Additive Only**: No data modifications or deletions
✅ **Idempotent**: Safe to run multiple times (IF NOT EXISTS)
✅ **Transaction-Wrapped**: All-or-nothing execution (BEGIN/COMMIT)
✅ **Default Values**: All new columns have defaults
✅ **Rollback Ready**: Complete rollback SQL available

### Estimated Downtime

**5-15 seconds** - Brief lock on users table during column additions
**Zero-downtime deployment possible** with proper sequencing

---

## Pre-Deployment Checklist

### Development Environment

- [ ] **Pull latest code**: `git checkout redesign/mvp-founder-design && git pull`
- [ ] **Review migration SQL**: `cat server/migrations/2025-10-redesign/phase1.sql`
- [ ] **Run migration tests**: `npm run test:db-redesign` (all tests pass)
- [ ] **Test locally**: `npm run db:migrate` on dev database
- [ ] **Verify locally**: `npm run db:migrate:verify` (all checks pass)
- [ ] **Test rollback**: Review `docs/redesign/DATABASE_SCHEMA.md` rollback section

### Staging Environment

- [ ] **Staging database accessible**: Test connection
- [ ] **Recent backup exists**: Check RDS snapshots (< 24 hours old)
- [ ] **CI/CD pipeline configured**: GitHub Actions secrets set
  - `STAGING_DATABASE_URL` secret configured
  - AWS credentials valid
- [ ] **Application health**: Staging environment running normally
- [ ] **Notify team**: Inform team of upcoming staging migration

### Production Environment

- [ ] **Create RDS snapshot**: `npm run db:snapshot` (or via AWS Console)
  - Snapshot ID saved for rollback
  - Snapshot status: Available
- [ ] **Recent staging success**: Migration tested in staging < 48 hours ago
- [ ] **Application health**: Production environment Green/OK
- [ ] **Database credentials**: `PRODUCTION_DATABASE_URL` secret configured
- [ ] **Manual approval ready**: GitHub Environment approver available
- [ ] **Rollback plan reviewed**: Team understands rollback procedures
- [ ] **Communication ready**: Incident response team on standby
- [ ] **Maintenance window** (optional): Low-traffic period if desired

---

## Automated Deployment (CI/CD)

### GitHub Actions Pipeline

The migration is **automatically executed** during deployment via GitHub Actions:

**Staging Deployment** (PR-based or main branch):
1. Tests run
2. Application builds
3. **Database migration executes** ← Automated
4. Migration verification runs
5. Application deploys
6. Smoke tests run

**Production Deployment** (main branch, after approval):
1. Staging deployment completes
2. Smoke tests pass
3. **Manual approval** required (GitHub Environment gate)
4. **RDS snapshot created** ← Automated
5. **Database migration executes** ← Automated
6. Migration verification runs
7. Application deploys
8. Health checks run

### Monitoring CI/CD Migration

**View Logs**:
1. Go to GitHub Actions → Latest workflow run
2. Click "Deploy to Staging" or "Deploy to Production" job
3. Expand "Run database migration" step
4. Monitor output for success/failure

**Success Indicators**:
```
🔍 Running pre-flight checks...
  ✅ badges table: NOT FOUND (ready to create)
  ✅ users.xp_points: NOT FOUND (ready to add)

🚀 Executing migration...
✅ Migration executed successfully in 8234ms

🔍 Running post-migration verification...
  ✅ users.xp_points column: EXISTS
  ✅ badges table: EXISTS
  (... 15 more checks ...)

✅ All verification checks passed!
```

**Failure Response**:
- Workflow stops immediately (deployment does not proceed)
- Review error logs in GitHub Actions
- Fix issue and retry or escalate

---

## Manual Deployment Procedures

### When to Use Manual Deployment

- CI/CD pipeline unavailable
- Emergency hotfix required
- Testing migration in isolation
- Rollback execution

### Staging Manual Deployment

```bash
# 1. Connect to appropriate environment
export DATABASE_URL="<STAGING_DATABASE_URL>"

# 2. Verify connection
psql "$DATABASE_URL" -c "SELECT version();"

# 3. Run migration
npm run db:migrate

# Expected output:
# ✅ Migration executed successfully
# ✅ All verification checks passed

# 4. Verify schema
npm run db:migrate:verify

# 5. Test application
npm run dev
# Test key features manually
```

### Production Manual Deployment

```bash
# ⚠️  PRODUCTION - PROCEED WITH CAUTION

# 1. Create RDS snapshot first
export AWS_REGION="ap-southeast-1"
bash deployment-scripts/backup-rds.sh production

# Wait for snapshot confirmation:
# ✅ SNAPSHOT CREATED SUCCESSFULLY
# Snapshot ID: p3-prod-migration-backup-20251028-143022

# 2. Connect to production database
export DATABASE_URL="<PRODUCTION_DATABASE_URL>"

# 3. Verify connection
psql "$DATABASE_URL" -c "SELECT current_database();"

# 4. Final confirmation
echo "⚠️  About to run migration on PRODUCTION database"
read -p "Type 'MIGRATE' to confirm: " CONFIRM
[ "$CONFIRM" = "MIGRATE" ] || exit 1

# 5. Run migration
npm run db:migrate

# 6. Verify schema
npm run db:migrate:verify

# 7. Test application health
curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# 8. Document completion
echo "Migration completed at $(date)" >> docs/ops-log/2025-10.md
```

---

## Verification & Testing

### Automated Verification

The verification script checks:
- All 6 user columns exist with correct types
- All 15 new tables exist
- Key indexes created
- Foreign key constraints in place
- CHECK constraints applied

**Run Verification**:
```bash
npm run db:migrate:verify
```

**Success Output**:
```
╔════════════════════════════════════════════════════╗
║     Schema Verification - Phase 1 Redesign         ║
╚════════════════════════════════════════════════════╝

📋 User Columns (6/6 passed)
─────────────────────────────────────────────────────
✅ users.xp_points column with default 0
✅ users.current_streak column
✅ users.readiness_score column with CHECK constraint
(... 3 more ...)

📋 Tables (15/15 passed)
─────────────────────────────────────────────────────
✅ badges table exists
✅ user_badges table exists
(... 13 more ...)

📊 Total Checks:      30
✅ Passed:            30
❌ Failed:            0

✅ All schema verification checks passed!
```

### Manual Database Verification

**Check User Table Columns**:
```sql
-- Connect to database
psql "$DATABASE_URL"

-- List user table columns
\d users

-- You should see:
-- xp_points | integer | default 0
-- current_streak | integer | default 0
-- readiness_score | integer | default 0 CHECK (readiness_score >= 0 AND readiness_score <= 100)
-- referral_code | character varying(50) | UNIQUE
```

**Check New Tables**:
```sql
-- List all new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'badges', 'user_badges', 'learning_modules',
    'user_module_progress', 'resumes', 'star_stories'
  );

-- Should return 6 rows (sample of 15 tables)
```

**Check Indexes**:
```sql
-- List new indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname IN ('idx_users_referral_code', 'idx_users_xp_points');

-- Should return 2 rows
```

### Application Testing

**Smoke Test Checklist**:
- [ ] Application starts without errors: `npm run dev`
- [ ] Health endpoint responds: `GET /api/health`
- [ ] User login works
- [ ] Existing features functional:
  - [ ] Prepare module loads
  - [ ] Practice session creates
  - [ ] Perform dashboard displays
- [ ] No console errors in browser DevTools
- [ ] No database connection errors in logs

**Automated Smoke Tests**:
```bash
# Run full smoke test suite
npx tsx deployment-scripts/smoke-tests.ts <STAGING_OR_PROD_URL>

# Expected output:
# ✅ Health endpoint responding
# ✅ Database connectivity verified
# ✅ Authentication endpoints functional
# (... more checks ...)
```

---

## Emergency Rollback

### When to Rollback

- Migration verification fails
- Application fails to start after migration
- Critical bugs discovered in new features
- Data integrity issues detected

### Automated Rollback (SQL)

```bash
# ⚠️  DESTRUCTIVE - This removes all Phase 1 changes

# 1. Confirm rollback intent
echo "⚠️  This will DROP 15 tables and REMOVE 6 user columns"
read -p "Type 'ROLLBACK' to confirm: " CONFIRM
[ "$CONFIRM" = "ROLLBACK" ] || exit 1

# 2. Run rollback script
npm run db:migrate:rollback

# 3. Verify rollback
npm run db:migrate:verify
# Should show: ❌ All critical checks failed (expected after rollback)

# 4. Check application
npm run dev
# Should start normally without new features
```

### RDS Snapshot Restore (Full Rollback)

**Use Case**: SQL rollback fails or data integrity compromised

**Procedure**:
```bash
# 1. Get snapshot ID from backup script output
SNAPSHOT_ID="p3-prod-migration-backup-20251028-143022"

# 2. Restore to new RDS instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier p3-rds-production-restored \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region ap-southeast-1

# 3. Wait for restore to complete (10-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier p3-rds-production-restored

# 4. Get new database endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier p3-rds-production-restored \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# 5. Update application DATABASE_URL
# - Update GitHub Actions secret: PRODUCTION_DATABASE_URL
# - Update AWS EB environment variable
# - Redeploy application

# 6. Verify application functionality
curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# 7. After verification, consider deleting old instance
# aws rds delete-db-instance --db-instance-identifier p3-rds-production
```

---

## Troubleshooting

### Migration Fails: "Column already exists"

**Cause**: Migration already partially applied
**Solution**: Migration is idempotent, safe to re-run
```bash
# Just re-run the migration
npm run db:migrate

# The script will detect existing changes and complete remaining ones
```

### Migration Fails: "Permission denied"

**Cause**: Database user lacks ALTER TABLE permissions
**Solution**:
```sql
-- Connect as superuser
psql "$DATABASE_URL" -U postgres

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user_prod;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user_prod;

-- Then retry migration
```

### Verification Fails: "Table/column missing"

**Cause**: Migration didn't complete successfully
**Investigation**:
```bash
# Check migration logs for errors
npm run db:migrate 2>&1 | tee migration.log

# Check database directly
psql "$DATABASE_URL" -c "\d badges"

# If table exists but verification fails, may be script issue
# Manually verify table exists
```

### Application Won't Start: "Unknown column"

**Cause**: Application code deployed before migration
**Solution**:
```bash
# 1. Check which version is deployed
aws elasticbeanstalk describe-environments \
  --environment-names p3-interview-academy-prod-v2 \
  --query 'Environments[0].VersionLabel'

# 2. Rollback application to previous version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label <PREVIOUS_VERSION>

# 3. Run migration
npm run db:migrate

# 4. Redeploy application
```

### Timeout During Migration

**Cause**: Large database or slow connection
**Solution**:
```bash
# Migration timeout is 2 minutes by default
# Increase timeout in migration script if needed

# Or run migration SQL directly with no timeout
psql "$DATABASE_URL" -f server/migrations/2025-10-redesign/phase1.sql
```

### CI/CD Migration Fails in GitHub Actions

**Symptoms**: Workflow stops at "Run database migration" step
**Investigation**:
1. Check GitHub Actions logs for error message
2. Common issues:
   - `DATABASE_URL` secret not set → Set in GitHub repository secrets
   - AWS credentials invalid → Verify `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
   - Database unreachable → Check RDS security groups
   - Migration SQL syntax error → Review phase1.sql

**Solution**:
```bash
# Test migration locally first
export DATABASE_URL="<STAGING_DATABASE_URL>"
npm run db:migrate

# Fix any errors, commit, and retry CI/CD
```

---

## Post-Deployment Tasks

### Immediate (within 1 hour)

- [ ] **Verify application health**: Check production /api/health endpoint
- [ ] **Monitor error logs**: Review CloudWatch logs for 1 hour
- [ ] **Test new features** (if any enabled):
  - [ ] User profile shows xp_points
  - [ ] Badge system functional
  - [ ] Learning modules load
- [ ] **Document completion**: Update `docs/ops-log/2025-10.md`
- [ ] **Notify team**: Migration successful message

### Short-term (within 24 hours)

- [ ] **Run seed script**: `npm run db:seed-redesign` (populate badges, modules)
- [ ] **Performance monitoring**: Check database query performance
  - User table queries still fast
  - New indexes used correctly
- [ ] **Database size check**: Ensure no unexpected growth
- [ ] **Backup verification**: Confirm automated backups still running

### Long-term (within 1 week)

- [ ] **User testing**: Get feedback on new features (if released)
- [ ] **Database optimization**: Analyze query plans, add indexes if needed
- [ ] **Clean up snapshots**: Delete old migration snapshots (keep latest 3)
- [ ] **Update documentation**: Reflect any changes discovered
- [ ] **Schedule Phase 2**: Plan next migration phase

---

## Contact & Escalation

### Migration Issues

- **Primary Contact**: DevOps Team
- **Backup Contact**: Database Administrator
- **Emergency**: CTO / Technical Lead

### Database Access

- **Staging**: `STAGING_DATABASE_URL` (GitHub secret)
- **Production**: `PRODUCTION_DATABASE_URL` (GitHub secret)
- **AWS Console**: https://console.aws.amazon.com/rds/ (ap-southeast-1)

### Documentation References

- **Migration SQL**: `server/migrations/2025-10-redesign/phase1.sql`
- **Schema Documentation**: `docs/redesign/DATABASE_SCHEMA.md`
- **Master Plan**: `docs/redesign/MASTER_PLAN.md`
- **Operations Log**: `docs/ops-log/2025-10.md`

---

**Last Updated**: 2025-10-28
**Next Review**: After Phase 1 production deployment
