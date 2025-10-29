# ⚠️ DEPRECATED - DO NOT USE

> **This document is OUTDATED and has been superseded.**
>
> **Use instead**: `MD_Documentations/Deployment/DEPLOYMENT.md`
>
> **Why deprecated:**
> - ❌ Only covers Phases 1-5 (missing Phases 6-8)
> - ❌ Missing Stripe integration setup
> - ❌ Missing email notifications testing
> - ❌ Missing cron job testing
> - ❌ Missing production release guide
> - ✅ All content now in DEPLOYMENT.md with comprehensive coverage
>
> **New Guide Location:**
> - File: `MD_Documentations/Deployment/DEPLOYMENT.md`
> - Section: "🧪 Staging Deployment & Testing Guide" (Step 1-9)
> - Coverage: All 8 phases + HTTPS + Stripe + complete testing
>
> **Redirect:** See DEPLOYMENT.md for current staging deployment instructions.

---

# ~~Codex Staging Deployment Guide - Admin Subscription System (Phases 1-5)~~

> ~~Status: ON HOLD (2025-10-23)~~
>
> ~~- Staging deployment is paused to avoid impacting production data.~~
> ~~- Observed issue: `p3-interview-academy-staging` currently uses a `DATABASE_URL` pointing to the production database (`.../postgres` with `app_user`).~~
> ~~- Action required: update EB staging `DATABASE_URL` to the staging DB: `postgresql://app_user_staging:<password>@<rds-endpoint>:5432/p3_staging?sslmode=require`.~~
> ~~- After the environment variable fix, re-run the staging workflow, then execute migrations (`npm run db:push`) and seed credit costs (`npx tsx server/scripts/seed-credit-costs.ts`).~~
> ~~- Note: AWS SSL/HTTPS hardening landed on `main`. Prefer using `https://` when accessing the staging URL if the certificate is active.~~

**Feature Branch**: `feature/admin-subscription-system`
**Target Environment**: AWS Staging (`p3-interview-academy-staging`)
**Document Version**: 1.0
**Last Updated**: 2025-10-23

---

## 🎯 Quick Overview

Deploy Phases 1-5 of the Admin Subscription System to AWS staging environment for testing **without touching production**.

**What's Being Deployed:**
- ✅ Phase 1: Database Schema (4 new tables + user table updates)
- ✅ Phase 2: Credit Management System (APIs + middleware)
- ✅ Phase 3: Billing UI (beautiful frontend, payments disabled)
- ✅ Phase 4: Admin User Management Dashboard
- ✅ Phase 5: Admin Analytics Dashboard

**What's NOT Being Deployed:**
- ⏳ Phase 6: Stripe Integration (requires HTTPS/SSL setup + webhook secrets)
- ⏳ Phases 7-8: Automation and polish (depend on Phase 6)

**📌 Important Note for Phase 6**:
Before implementing Phase 6 (Stripe webhooks), HTTPS/SSL must be configured on staging and production environments. Stripe requires HTTPS URLs for webhook endpoints. See **`MD_Documentations/Guides/AWS_SSL_HTTPS_SETUP.md`** for setup instructions.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Push Feature Branch
```bash
git status
git add .
git commit -m "feat: Admin subscription system phases 1-5 ready for staging"
git push origin feature/admin-subscription-system
```

**Expected Output:**
```
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
To https://github.com/jevinbizelev8/P3-Interview-Academy.git
   abc1234..def5678  feature/admin-subscription-system -> feature/admin-subscription-system
```

---

### Step 2: Deploy to Staging (Choose One Option)

#### **Option A: GitHub Actions (Recommended - Fully Automated)**

1. Create a Pull Request (don't merge yet):
   ```bash
   # Via GitHub CLI (if installed)
   gh pr create --base main --head feature/admin-subscription-system \
     --title "Admin Subscription System (Phases 1-5)" \
     --body "Deploying to staging for testing. DO NOT MERGE until testing complete."
   ```

   **Or via GitHub Web UI:**
   - Go to: https://github.com/jevinbizelev8/P3-Interview-Academy/pulls
   - Click "New pull request"
   - Base: `main` ← Compare: `feature/admin-subscription-system`
   - Title: "Admin Subscription System (Phases 1-5)"
   - Mark as **Draft** to prevent accidental merge
   - Create PR

2. **GitHub Actions will automatically:**
   - ✅ Run TypeScript compilation
   - ✅ Run all tests
   - ✅ Build application (frontend + backend)
   - ✅ Create deployment bundle
   - ✅ Deploy to staging environment
   - ✅ Comment on PR with staging URL

3. **Monitor deployment:**
   - Go to PR → "Checks" tab
   - Watch "Deploy to Staging" workflow
   - Wait for green checkmark (5-10 minutes)

4. **Get staging URL from PR comment:**
   ```
   Staging URL: https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com (use https if SSL is provisioned)
   ```

**Expected Result:** PR shows "Deploy to Staging ✅ Successful"

---

#### **Option B: Manual AWS CLI Deployment**

**Prerequisites:**
- AWS CLI configured
- Access to staging environment

```bash
# From project root directory
cd /home/runner/workspace

# Run full deployment script (will prompt for environment selection)
./deployment-scripts/full-deployment.sh

# When prompted, select STAGING (not production)
# Confirm: p3-interview-academy-staging
```

**Expected Output:**
```
🚀 Starting full deployment process...
STEP 1/5: ENVIRONMENT VARIABLE CHECK
✅ Environment variables verified
STEP 2/5: DATABASE VERIFICATION
✅ Database verification passed
STEP 3/5: BUILD VERIFICATION
✅ Build verification passed
STEP 4/5: DEPLOYMENT BUNDLE CREATION
✅ Deployment bundle created: p3-interview-academy-eb-20251023-120000.zip
STEP 5/5: AWS DEPLOYMENT
✅ Deployment successful
```

---

### Step 3: Verify Deployment Health

```bash
# Check staging environment health (prefer HTTPS)
curl -f https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health || \
curl -f http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "environment": "staging",
  "database": "connected",
  "uptime": 120
}
```

**✅ Pass Criteria:** HTTP 200 status, `"status": "ok"`, `"database": "connected"`

---

### Step 4: Run Database Migrations

**Connect to staging database:**

```bash
# Option 1: Via AWS Systems Manager (SSM)
INSTANCE_ID=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name p3-interview-academy-staging \
  --query 'EnvironmentResources.Instances[0].Id' \
  --output text)

aws ssm start-session --target $INSTANCE_ID
```

**Once connected to staging server:**
```bash
cd /var/app/current
npm run db:push
```

**Expected Output:**
```
✅ Schema migrations complete
✅ All tables created successfully
```

**Seed credit costs:**
```bash
npx tsx server/scripts/seed-credit-costs.ts
```

**Expected Output:**
```
✅ Created credit cost: practice-session = 1 credit(s)
✅ Created credit cost: prepare-session = 1 credit(s)
✨ Credit costs seeded successfully!
```

---

### Step 5: Verify Database Schema

**Option 1: Direct SQL Query (Recommended)**

```bash
# Connect to staging database
psql postgresql://app_user_staging:password@your-rds-endpoint:5432/p3_staging
```

**Run verification query:**
```sql
-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'credit_transactions', 'invoices', 'credit_costs')
ORDER BY table_name;
```

**Expected Output:**
```
 table_name
--------------------
 credit_costs
 credit_transactions
 invoices
 subscriptions
(4 rows)
```

**✅ Pass Criteria:** All 4 tables present

---

## ✅ Quick Smoke Tests (Top 10 Critical Tests)

After deployment, run these quick tests to verify functionality:

### Test 1: Health Check ✅
```bash
STAGING_URL="http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"

curl $STAGING_URL/api/health
```
**Pass:** HTTP 200, `"status": "ok"`

---

### Test 2: Credit Balance API ✅
```bash
# Login first (get session cookie)
curl -X POST $STAGING_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "your_password"}' \
  -c cookies.txt

# Get credit balance
curl -X GET $STAGING_URL/api/credits/balance \
  -b cookies.txt
```
**Pass:** HTTP 200, returns `{"success": true, "data": {"totalCredits": 50, ...}}`

---

### Test 3: Credit Costs API ✅
```bash
curl -X GET $STAGING_URL/api/credits/costs \
  -b cookies.txt
```
**Pass:** HTTP 200, returns 2 features (practice-session, prepare-session) with cost = 1

---

### Test 4: Credit Deduction (Practice Session) ✅
```bash
curl -X POST $STAGING_URL/api/practice/sessions \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"scenarioId": "test-scenario", "language": "en"}'
```
**Pass:** HTTP 201, credits deducted = 1, session created

---

### Test 5: Insufficient Credits (402 Paywall) ✅
```sql
-- Set user to 0 credits
UPDATE users
SET monthly_credit_allocation = 0, top_up_credits = 0, credit_balance = 0
WHERE email = 'test@example.com';
```
```bash
curl -X POST $STAGING_URL/api/practice/sessions \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"scenarioId": "test", "language": "en"}' \
  -w "\nHTTP Status: %{http_code}\n"
```
**Pass:** HTTP 402, returns `"code": "INSUFFICIENT_CREDITS"`, `"upgradeUrl": "/billing"`

---

### Test 6: Billing Page Loads ✅
```bash
# Via browser (manual)
open $STAGING_URL/billing
```
**Pass:** Page loads, 3 tabs visible (Upgrade Plan, Buy Credits, Usage History), all payment buttons disabled

---

### Test 7: Credit Widget Displays ✅
```bash
# Via browser (manual)
# Login to staging and check navigation bar
```
**Pass:** Credit widget visible in header, shows credit count, tooltip with breakdown

---

### Test 8: Admin Users List API ✅
```bash
# Login as admin
curl -X POST $STAGING_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin_password"}' \
  -c admin_cookies.txt

# Get users list
curl -X GET "$STAGING_URL/api/admin/users?page=1&limit=50" \
  -b admin_cookies.txt
```
**Pass:** HTTP 200, returns users array with pagination metadata

---

### Test 9: Admin Add Credits ✅
```bash
# Get user ID
USER_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM users WHERE email = 'test@example.com';")

# Add 100 credits
curl -X POST "$STAGING_URL/api/admin/users/$USER_ID/credits/add" \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "reason": "Test credit adjustment"}'
```
**Pass:** HTTP 200, returns `{"creditsAdded": 100, "newBalance": 100}`

---

### Test 10: Admin Analytics API ✅
```bash
curl -X GET "$STAGING_URL/api/admin/analytics/users" \
  -b admin_cookies.txt
```
**Pass:** HTTP 200, returns user metrics (totalUsers, activeUsers, tierDistribution)

---

## 📋 Comprehensive Testing

For full test coverage, see: **`MD_Documentations/Testing/ADMIN_SUBSCRIPTION_PHASES_1-5_STAGING_TESTS.md`**

This document contains:
- 40+ detailed test cases
- Integration tests (3 complete workflows)
- Performance tests
- Regression tests
- SQL verification queries
- Issue tracker template

---

## 🔧 Troubleshooting

### Issue 1: Deployment Fails - Build Errors

**Symptom:** GitHub Actions fails at "Build" step

**Solution:**
```bash
# Check TypeScript compilation locally
npm run check

# Fix any TypeScript errors
# Re-push and retry
```

---

### Issue 2: Database Migration Fails

**Symptom:** `npm run db:push` errors

**Check database connection:**
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

**If connection fails:**
- Verify `DATABASE_URL` in staging environment variables
- Check RDS security group allows EB instances
- Verify database credentials

---

### Issue 3: Health Check Returns 500

**Symptom:** `/api/health` returns HTTP 500

**Check logs:**
```bash
aws elasticbeanstalk describe-environment-health \
  --environment-name p3-interview-academy-staging \
  --attribute-names All

# Or SSH and check application logs
tail -f /var/log/nodejs/nodejs.log
```

**Common causes:**
- Database connection failure
- Missing environment variables
- Application crash on startup

---

### Issue 4: Credit APIs Return 401 Unauthorized

**Symptom:** Credit endpoints return 401

**Solution:**
```bash
# Verify you're logged in
curl -X GET $STAGING_URL/api/user \
  -b cookies.txt

# If no user, re-login
curl -X POST $STAGING_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  -c cookies.txt
```

---

### Issue 5: Admin Routes Return 403 Forbidden

**Symptom:** Admin endpoints return 403

**Solution:**
```bash
# Verify user has admin role
psql $DATABASE_URL -c "SELECT email, role FROM users WHERE email = 'admin@example.com';"

# If role is not 'admin', update:
psql $DATABASE_URL -c "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';"
```

---

## 🔄 Rollback Procedure

If deployment causes issues:

### Option 1: Rollback via AWS CLI

```bash
# List recent versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy \
  --query 'ApplicationVersions[?Status==`PROCESSED`] | sort_by(@, &DateCreated) | [-5:]' \
  --output table

# Rollback to previous version
PREVIOUS_VERSION="staging-20251022-120000"  # Use actual version label

aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --version-label $PREVIOUS_VERSION

# Wait for update to complete
aws elasticbeanstalk wait environment-updated \
  --environment-name p3-interview-academy-staging

# Verify health
curl $STAGING_URL/api/health
```

**Expected:** Previous version restored, health check passes

---

### Option 2: Rollback via GitHub Actions

1. Go to PR → Checks tab
2. Find successful previous deployment
3. Click "Re-run jobs"
4. Wait for redeployment

---

## 🎯 Post-Testing: Merge to Production

**ONLY after all staging tests pass:**

1. Review PR with team
2. Mark PR as "Ready for review" (remove draft status)
3. Get approvals
4. Merge PR to `main` branch
5. GitHub Actions automatically deploys to production
6. Run smoke tests on production
7. Monitor production health for 24 hours

---

## 📊 Environment URLs

| Environment | HTTP URL | HTTPS URL (Required for Phase 6) | Purpose |
|-------------|----------|-----------------------------------|---------|
| **Staging** | http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com | https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com | Testing feature branch |
| **Production** | http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com | https://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com | Live application |

**Note**: HTTP URLs work for Phases 1-5. HTTPS URLs required for Phase 6 (Stripe webhooks). Setup guide: `AWS_SSL_HTTPS_SETUP.md`

---

## 🔐 Admin Credentials (Staging)

**Admin Account:**
- Email: `admin@example.com`
- Password: (Check `.env` or ask team)
- Role: `admin`

**Test User Account:**
- Email: `test@example.com`
- Password: (Check `.env` or ask team)
- Role: `user`

---

## 📖 Additional Documentation

- **Full Test Document**: `MD_Documentations/Testing/ADMIN_SUBSCRIPTION_PHASES_1-5_STAGING_TESTS.md`
- **Progress Document**: `MD_Documentations/Progress/ADMIN_SUBSCRIPTION_SYSTEM_PROGRESS.md`
- **Stripe Setup**: `MD_Documentations/Guides/STRIPE_SETUP_GUIDE.md` (for Phase 6)
- **Deployment Scripts**: `deployment-scripts/` directory
- **Main Docs**: `CLAUDE.md`, `DEPLOYMENT.md`, `SECURITY.md`

---

## ✅ Deployment Checklist

Before you start:
- [ ] Feature branch pushed to GitHub
- [ ] AWS CLI configured (if manual deployment)
- [ ] Database credentials available

During deployment:
- [ ] Deployment successful (HTTP 200 health check)
- [ ] Database migrations run successfully
- [ ] Credit costs seeded
- [ ] All 4 new tables created

After deployment:
- [ ] Top 10 smoke tests passed
- [ ] Billing page loads correctly
- [ ] Admin dashboard accessible
- [ ] Credit system functional
- [ ] No regressions in existing features

Ready for production merge:
- [ ] All comprehensive tests passed (40+ tests)
- [ ] Performance tests passed
- [ ] Integration tests passed
- [ ] Team approval obtained
- [ ] Rollback plan documented

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Next Review**: After successful staging testing
**For Questions**: Check comprehensive test document or team documentation
