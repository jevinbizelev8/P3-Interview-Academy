# Admin Subscription System - Phases 1-5 Staging Deployment & Testing Plan

**Feature Branch**: `feature/admin-subscription-system`
**Test Environment**: AWS Elastic Beanstalk Staging (`p3-interview-academy-staging`)
**Test Date**: TBD
**Tester**: TBD
**Status**: ⏳ Ready for Testing

---

## 📋 Test Overview

This document provides comprehensive testing procedures for Phases 1-5 of the Admin Subscription System deployment to AWS staging environment.

**Phases Included:**
- ✅ Phase 1: Database Schema & Tables
- ✅ Phase 2: Credit Management System (Core Logic)
- ✅ Phase 3: Beautiful Billing Frontend (UI Only)
- ✅ Phase 4: Admin Dashboard - User Management
- ✅ Phase 5: Admin Dashboard - Analytics

**Phases Excluded (Blocked):**
- ⏳ Phase 6: Stripe Integration & Payments (requires Stripe credentials)
- ⏳ Phase 7: Subscription Lifecycle Automation (depends on Phase 6)
- ⏳ Phase 8: User Notifications & UX Polish (depends on Phase 6-7)

---

## 🎯 Testing Objectives

1. Verify database schema migration success
2. Validate credit management API functionality
3. Test billing UI rendering and functionality
4. Verify admin dashboard operations
5. Validate analytics data accuracy
6. Ensure no regressions in existing features
7. Verify payment buttons are disabled with proper messaging
8. Confirm system stability and performance

---

## ⚙️ Pre-Deployment Checklist

### Environment Setup
- [ ] AWS CLI configured with staging credentials
- [ ] Database connection to staging RDS verified
- [ ] Feature branch merged/ready for deployment
- [ ] All TypeScript compilation errors resolved
- [ ] All unit tests passing locally

### Required Environment Variables (Staging)
```bash
# Verify these are set in staging environment
- [ ] NODE_ENV=staging
- [ ] PORT=5000
- [ ] DATABASE_URL=postgresql://... (staging database)
- [ ] SESSION_SECRET=... (staging secret)
- [ ] OPENAI_API_KEY=... (test key)
- [ ] WS_ALLOWED_ORIGINS=*
```

**Verification Command:**
```bash
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --application-name p3-interview-academy \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]' \
  --output table
```

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Database Backup

**Command:**
```bash
# Verify RDS automated backup is enabled
aws rds describe-db-instances \
  --query 'DBInstances[0].{BackupRetention:BackupRetentionPeriod,LatestBackup:LatestRestorableTime}' \
  --output table
```

**Expected Result:**
- BackupRetentionPeriod: 7 days
- LatestRestorableTime: Recent timestamp

**Pass/Fail:** [ ]

---

### Step 2: Deploy to Staging via GitHub Actions

**Option A: Automatic PR Deployment**
```bash
# Create Pull Request to main branch
git checkout feature/admin-subscription-system
git push origin feature/admin-subscription-system

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build application
# 3. Deploy to staging
# 4. Comment on PR with staging URL
```

**Option B: Manual Deployment**
```bash
# From project root
./deployment-scripts/full-deployment.sh

# When prompted:
# - Confirm staging deployment (not production)
# - Verify environment: p3-interview-academy-staging
```

**Expected Result:**
- GitHub Actions workflow completes successfully
- PR comment shows staging URL
- Health check returns HTTP 200

**Pass/Fail:** [ ]

---

### Step 3: Run Database Migrations

**SSH into staging environment:**
```bash
# Get instance ID
INSTANCE_ID=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name p3-interview-academy-staging \
  --query 'EnvironmentResources.Instances[0].Id' \
  --output text)

# Connect via SSM
aws ssm start-session --target $INSTANCE_ID
```

**Run migration:**
```bash
cd /var/app/current
npm run db:push
```

**Expected Result:**
```
✅ Tables created/updated successfully
✅ No migration errors
```

**Pass/Fail:** [ ]

---

### Step 4: Seed Credit Costs

**Command:**
```bash
# In staging environment
cd /var/app/current
npx tsx server/scripts/seed-credit-costs.ts
```

**Expected Result:**
```
✅ Created credit cost: practice-session = 1 credit(s)
✅ Created credit cost: prepare-session = 1 credit(s)
✨ Credit costs seeded successfully!
```

**Pass/Fail:** [ ]

---

## 🧪 Phase 1 Tests: Database Schema Validation

### Test 1.1: Verify New Tables Exist

**SQL Query:**
```sql
-- Connect to staging database
psql $DATABASE_URL

-- Check for new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'credit_transactions', 'invoices', 'credit_costs')
ORDER BY table_name;
```

**Expected Result:**
```
 table_name
--------------------
 credit_costs
 credit_transactions
 invoices
 subscriptions
(4 rows)
```

**Pass/Fail:** [ ]

---

### Test 1.2: Verify Users Table Updates

**SQL Query:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'stripe_customer_id',
    'stripe_subscription_id',
    'plan_type',
    'subscription_status',
    'current_period_end',
    'monthly_credit_allocation',
    'credit_balance',
    'top_up_credits'
  )
ORDER BY column_name;
```

**Expected Result:**
- All 8 columns present
- `plan_type` default: 'FREE'
- `monthly_credit_allocation` default: 50
- `credit_balance` default: 50
- `top_up_credits` default: 0

**Pass/Fail:** [ ]

---

### Test 1.3: Verify Foreign Key Constraints

**SQL Query:**
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('subscriptions', 'credit_transactions', 'invoices', 'credit_costs')
ORDER BY tc.table_name, tc.constraint_name;
```

**Expected Result:**
- subscriptions.user_id → users.id
- credit_transactions.user_id → users.id
- invoices.user_id → users.id
- invoices.subscription_id → subscriptions.id
- credit_costs.updated_by → users.id

**Pass/Fail:** [ ]

---

### Test 1.4: Verify Credit Costs Seeded

**SQL Query:**
```sql
SELECT feature_name, credit_cost, is_active, description
FROM credit_costs
ORDER BY feature_name;
```

**Expected Result:**
```
 feature_name      | credit_cost | is_active | description
-------------------+-------------+-----------+--------------------------------------------------
 practice-session  |           1 | t         | Credits required to start an AI-powered practice...
 prepare-session   |           1 | t         | Credits required to start an AI-powered preparation...
(2 rows)
```

**Pass/Fail:** [ ]

---

### Test 1.5: Verify Existing Users Migrated

**SQL Query:**
```sql
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN plan_type = 'FREE' THEN 1 END) as free_users,
  COUNT(CASE WHEN monthly_credit_allocation = 50 THEN 1 END) as users_with_50_credits,
  COUNT(CASE WHEN credit_balance >= 0 THEN 1 END) as users_with_valid_balance
FROM users;
```

**Expected Result:**
- All existing users have `plan_type = 'FREE'`
- All existing users have `monthly_credit_allocation = 50`
- All users have non-negative credit balance

**Pass/Fail:** [ ]

---

## 🧪 Phase 2 Tests: Credit Management System

**Staging URL:** `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

### Test 2.1: Credit Balance API

**Setup:**
```sql
-- Create test user with known credits
INSERT INTO users (email, password_hash, first_name, last_name, plan_type, monthly_credit_allocation, top_up_credits, credit_balance)
VALUES ('test-credits@example.com', 'test_hash', 'Test', 'User', 'FREE', 50, 0, 50)
ON CONFLICT (email) DO UPDATE
SET monthly_credit_allocation = 50, top_up_credits = 0, credit_balance = 50;
```

**Test Command:**
```bash
# Login and get session cookie first
curl -X POST http://staging-url/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test-credits@example.com", "password": "test123"}' \
  -c cookies.txt

# Get credit balance
curl -X GET http://staging-url/api/credits/balance \
  -b cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "totalCredits": 50,
    "monthlyCredits": 50,
    "topUpCredits": 0,
    "breakdown": {
      "subscription": {
        "credits": 50,
        "description": "Monthly subscription credits (resets each billing cycle)"
      },
      "topUp": {
        "credits": 0,
        "description": "One-time purchased credits (never expire)"
      }
    }
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Response structure matches expected
- totalCredits = monthlyCredits + topUpCredits

**Pass/Fail:** [ ]

---

### Test 2.2: Credit Deduction (Practice Session)

**Test Command:**
```bash
# Create practice session (requires 1 credit)
curl -X POST http://staging-url/api/practice/sessions \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "existing-scenario-id",
    "language": "en"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "status": "active",
    ...
  },
  "message": "Practice session created successfully",
  "credits": {
    "deducted": 1,
    "remaining": 49,
    "breakdown": {
      "monthlyCreditsUsed": 1,
      "topUpCreditsUsed": 0
    }
  }
}
```

**Pass Criteria:**
- HTTP 201 status
- Session created successfully
- Credits deducted: 1
- Response headers include `X-Credits-Remaining: 49`

**Pass/Fail:** [ ]

**Verify in Database:**
```sql
SELECT
  monthly_credit_allocation,
  top_up_credits,
  credit_balance
FROM users
WHERE email = 'test-credits@example.com';

-- Should show: 49, 0, 49
```

---

### Test 2.3: Credit Transaction History

**Test Command:**
```bash
curl -X GET "http://staging-url/api/credits/history?limit=10" \
  -b cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "consumption",
        "amount": -1,
        "balanceAfter": 49,
        "description": "Practice session started",
        "feature": "practice-session",
        "sessionId": "session-uuid",
        "timestamp": "2025-10-23T..."
      }
    ],
    "count": 1,
    "limit": 10
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Shows deduction transaction
- Amount is negative for consumption
- balanceAfter matches current balance

**Pass/Fail:** [ ]

---

### Test 2.4: Insufficient Credits (402 Paywall)

**Setup:**
```sql
-- Set user to 0 credits
UPDATE users
SET monthly_credit_allocation = 0, top_up_credits = 0, credit_balance = 0
WHERE email = 'test-credits@example.com';
```

**Test Command:**
```bash
# Attempt to create practice session with 0 credits
curl -X POST http://staging-url/api/practice/sessions \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "existing-scenario-id",
    "language": "en"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result:**
```json
{
  "message": "Insufficient credits to use practice-session",
  "code": "INSUFFICIENT_CREDITS",
  "error": "You don't have enough credits to perform this action",
  "creditsNeeded": 1,
  "currentBalance": 0,
  "monthlyCredits": 0,
  "topUpCredits": 0,
  "upgradeUrl": "/billing",
  "suggestion": "Your credits have been depleted. Please upgrade your plan or purchase top-up credits."
}
```

**Pass Criteria:**
- HTTP 402 status code
- Error message clear and actionable
- upgradeUrl provided
- Session NOT created

**Pass/Fail:** [ ]

---

### Test 2.5: Credit Priority (Monthly → Top-Up)

**Setup:**
```sql
-- Set user to have 1 monthly + 5 top-up credits
UPDATE users
SET monthly_credit_allocation = 1, top_up_credits = 5, credit_balance = 6
WHERE email = 'test-credits@example.com';
```

**Test Command:**
```bash
# Create session (should use monthly credit first)
curl -X POST http://staging-url/api/practice/sessions \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"scenarioId": "test-id", "language": "en"}'
```

**Expected Result:**
```json
{
  "credits": {
    "deducted": 1,
    "remaining": 5,
    "breakdown": {
      "monthlyCreditsUsed": 1,
      "topUpCreditsUsed": 0
    }
  }
}
```

**Verify in Database:**
```sql
SELECT monthly_credit_allocation, top_up_credits, credit_balance
FROM users
WHERE email = 'test-credits@example.com';

-- Should show: 0, 5, 5 (monthly used first, top-up preserved)
```

**Pass Criteria:**
- Monthly credits used before top-up credits
- Top-up credits preserved

**Pass/Fail:** [ ]

---

### Test 2.6: Credit Costs API

**Test Command:**
```bash
curl -X GET http://staging-url/api/credits/costs \
  -b cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "costs": [
      {
        "feature": "practice-session",
        "creditCost": 1,
        "description": "Credits required to start an AI-powered practice interview session"
      },
      {
        "feature": "prepare-session",
        "creditCost": 1,
        "description": "Credits required to start an AI-powered preparation session"
      }
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Both features listed
- Credit costs correct (1 credit each)

**Pass/Fail:** [ ]

---

## 🧪 Phase 3 Tests: Billing Frontend

### Test 3.1: Billing Page Renders

**Manual Test:**
1. Navigate to: `http://staging-url/billing`
2. Verify page loads without errors
3. Check browser console for JavaScript errors

**Expected Result:**
- Page loads successfully
- No console errors
- All 3 tabs visible: "Upgrade Plan", "Buy Credits", "Usage History"

**Pass/Fail:** [ ]

---

### Test 3.2: Credit Widget Display

**Manual Test:**
1. Navigate to any authenticated page
2. Verify credit widget in navigation bar

**Expected Result:**
- Credit widget visible in header
- Shows correct credit count (from API)
- Zap icon visible
- Tooltip shows breakdown on hover
- Links to /billing page

**Pass/Fail:** [ ]

---

### Test 3.3: Tier Cards Display (Multi-Cycle)

**Manual Test:**
1. Navigate to billing page → "Upgrade Plan" tab
2. Verify billing cycle selector (Monthly / 3-Month / 6-Month)
3. Select different cycles, verify pricing updates

**Expected Result:**
- 3 tier cards visible: Free, Pro, Advanced
- Billing cycle selector works
- Pricing changes based on cycle:
  - **Monthly**: Pro $10/mo, Advanced $28/mo
  - **3-Month**: Pro $9/mo (10% off), Advanced $25/mo (10% off)
  - **6-Month**: Pro $8/mo (20% off), Advanced $20/mo (28.6% off)
- Savings badges display percentages
- "Upgrade" buttons DISABLED with tooltip: "Payment integration coming soon"

**Pass/Fail:** [ ]

---

### Test 3.4: Top-Up Cards Display

**Manual Test:**
1. Navigate to billing page → "Buy Credits" tab
2. Verify 3 top-up packages visible

**Expected Result:**
- 100 credits: $10 ($0.10/credit)
- 500 credits: $45 ($0.09/credit, "Best Value" badge, 10% savings)
- 2000 credits: $160 ($0.08/credit, 20% savings)
- All "Purchase" buttons DISABLED with tooltip
- Alert box: "Top-up credits never expire"

**Pass/Fail:** [ ]

---

### Test 3.5: Transaction History Display

**Setup:**
```sql
-- Create some test transactions
INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, balance_after, description, feature_used)
SELECT
  id,
  'consumption',
  -1,
  49,
  'Practice session started',
  'practice-session'
FROM users WHERE email = 'test-credits@example.com';
```

**Manual Test:**
1. Navigate to billing page → "Usage History" tab
2. Verify transaction history displays

**Expected Result:**
- Transaction cards visible (color-coded: red for consumption, green for allocation)
- Shows: credits amount, balance after, description, feature used, timestamp
- Scrollable if > 20 transactions
- Empty state message if no transactions: "No credit transactions yet"

**Pass/Fail:** [ ]

---

### Test 3.6: Paywall Modal Trigger

**Setup:**
```sql
-- Set user to 0 credits
UPDATE users
SET monthly_credit_allocation = 0, top_up_credits = 0, credit_balance = 0
WHERE email = 'test-credits@example.com';
```

**Manual Test:**
1. Attempt to create a practice session with 0 credits
2. Verify paywall modal appears

**Expected Result:**
- Modal appears with gradient header
- Title: "You've run out of credits"
- Two buttons: "View Plans" and "Close"
- For Free users: Shows next renewal date message
- "View Plans" navigates to /billing

**Pass/Fail:** [ ]

---

### Test 3.7: Subscription Management Section

**Manual Test:**
1. Navigate to billing page (scroll to bottom)
2. Verify subscription management card

**Expected Result:**
- **Left Column**: Current plan details
  - Plan type badge (colored)
  - Credits per month
  - Current price
  - Billing cycle
  - Status badge (Active)
  - Next renewal date
- **Right Column**: Quick actions
  - "Update Payment Method" button (disabled)
  - "Download Latest Invoice" button (disabled)
  - "Cancel Subscription" button (disabled, red)
- Note about Stripe integration coming soon

**Pass/Fail:** [ ]

---

## 🧪 Phase 4 Tests: Admin Dashboard - User Management

**Admin Login:**
```bash
# Use admin credentials
curl -X POST http://staging-url/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin_password"}' \
  -c admin_cookies.txt
```

### Test 4.1: Admin Users List API

**Test Command:**
```bash
curl -X GET "http://staging-url/api/admin/users?page=1&limit=50" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "Test",
        "lastName": "User",
        "planType": "FREE",
        "monthlyCredits": 50,
        "topUpCredits": 0,
        "totalCredits": 50,
        "subscriptionStatus": null,
        "emailVerified": true,
        "createdAt": "2025-10-01T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Users array populated
- Pagination metadata correct
- Credit fields present

**Pass/Fail:** [ ]

---

### Test 4.2: Admin Users List UI

**Manual Test:**
1. Navigate to: `http://staging-url/admin/users`
2. Verify user table displays

**Expected Result:**
- Table with columns: Email, Name, Tier, Monthly Credits, Top-Up Credits, Total, Status, Signup Date
- Search box functional (filters by email/name)
- Tier filter dropdown (All/Free/Pro/Advanced)
- Status filter dropdown (All/Active/Canceled/Past Due)
- Pagination controls (50 per page)
- Color-coded tier badges
- Low credit warning indicator (< 20%)
- Click row navigates to user detail

**Pass/Fail:** [ ]

---

### Test 4.3: Admin User Detail API

**Test Command:**
```bash
# Get user ID first
USER_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM users WHERE email = 'test-credits@example.com';")

curl -X GET "http://staging-url/api/admin/users/$USER_ID" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test-credits@example.com",
      ...full user details
    },
    "creditStats": {
      "monthlyCredits": 50,
      "topUpCredits": 0,
      "totalCredits": 50
    },
    "transactions": [...recent 50 transactions...],
    "sessions": [...recent practice/prepare sessions...]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- User details complete
- Credit stats accurate
- Transactions and sessions included

**Pass/Fail:** [ ]

---

### Test 4.4: Admin Add Credits

**Test Command:**
```bash
curl -X POST "http://staging-url/api/admin/users/$USER_ID/credits/add" \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "reason": "Test admin credit adjustment"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Credits added successfully",
  "data": {
    "creditsAdded": 100,
    "newBalance": 150,
    "breakdown": {
      "monthlyCredits": 50,
      "topUpCredits": 100
    }
  }
}
```

**Verify in Database:**
```sql
SELECT top_up_credits, credit_balance
FROM users
WHERE id = '$USER_ID';

-- Should show: 100, 150
```

**Pass Criteria:**
- HTTP 200 status
- Credits added to top_up_credits
- Transaction logged
- Balance updated correctly

**Pass/Fail:** [ ]

---

### Test 4.5: Admin Reset Monthly Credits

**Test Command:**
```bash
curl -X POST "http://staging-url/api/admin/users/$USER_ID/credits/reset" \
  -b admin_cookies.txt \
  -H "Content-Type: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Monthly credits reset successfully",
  "data": {
    "newMonthlyCredits": 50,
    "topUpCredits": 100,
    "totalCredits": 150
  }
}
```

**Pass Criteria:**
- Monthly credits reset to tier default (50 for FREE)
- Top-up credits preserved
- Transaction logged

**Pass/Fail:** [ ]

---

### Test 4.6: Admin Change User Tier

**Test Command:**
```bash
curl -X PUT "http://staging-url/api/admin/users/$USER_ID/tier" \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "newTier": "PRO"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "User tier updated successfully",
  "data": {
    "oldTier": "FREE",
    "newTier": "PRO",
    "newMonthlyCredits": 100
  }
}
```

**Verify in Database:**
```sql
SELECT plan_type, monthly_credit_allocation
FROM users
WHERE id = '$USER_ID';

-- Should show: PRO, 100
```

**Pass Criteria:**
- Tier updated in database
- Monthly credits updated to new tier (100 for PRO)
- Transaction logged

**Pass/Fail:** [ ]

---

### Test 4.7: Admin Credit Costs Configuration API

**Test Command:**
```bash
# List all credit costs
curl -X GET "http://staging-url/api/admin/credit-costs" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "costs": [
      {
        "id": "uuid",
        "featureName": "practice-session",
        "creditCost": 1,
        "description": "Credits required to start an AI-powered practice interview session",
        "isActive": true,
        "updatedAt": "2025-10-23T...",
        "updatedBy": null
      },
      {
        "id": "uuid",
        "featureName": "prepare-session",
        "creditCost": 1,
        "description": "Credits required to start an AI-powered preparation session",
        "isActive": true,
        "updatedAt": "2025-10-23T...",
        "updatedBy": null
      }
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Both features listed
- All fields present

**Pass/Fail:** [ ]

---

### Test 4.8: Admin Update Credit Cost

**Test Command:**
```bash
# Get cost ID
COST_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM credit_costs WHERE feature_name = 'practice-session';")

# Update credit cost
curl -X PUT "http://staging-url/api/admin/credit-costs/$COST_ID" \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "creditCost": 2,
    "description": "Updated practice session cost"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Credit cost updated successfully",
  "data": {
    "featureName": "practice-session",
    "oldCost": 1,
    "newCost": 2
  }
}
```

**Verify in Database:**
```sql
SELECT credit_cost, description, updated_at
FROM credit_costs
WHERE feature_name = 'practice-session';

-- Should show: 2, "Updated practice session cost", recent timestamp
```

**Pass Criteria:**
- Cost updated in database
- Updated timestamp changed
- Changes reflected immediately

**Pass/Fail:** [ ]

**Cleanup:**
```bash
# Reset to original value
curl -X PUT "http://staging-url/api/admin/credit-costs/$COST_ID" \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"creditCost": 1}'
```

---

### Test 4.9: Admin Delete User

**Setup:**
```sql
-- Create test user to delete
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ('delete-test@example.com', 'hash', 'Delete', 'Test')
ON CONFLICT (email) DO NOTHING;
```

**Test Command:**
```bash
# Get user ID
DELETE_USER_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM users WHERE email = 'delete-test@example.com';")

# Delete user
curl -X DELETE "http://staging-url/api/admin/users/$DELETE_USER_ID" \
  -b admin_cookies.txt
```

**Expected Result:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Verify in Database:**
```sql
SELECT COUNT(*) FROM users WHERE email = 'delete-test@example.com';

-- Should return: 0
```

**Pass Criteria:**
- User deleted from database
- Cascade delete (transactions, sessions, etc.)
- HTTP 200 status

**Pass/Fail:** [ ]

---

## 🧪 Phase 5 Tests: Admin Analytics

### Test 5.1: Analytics - User Metrics API

**Test Command:**
```bash
curl -X GET "http://staging-url/api/admin/analytics/users" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "activeUsers": 25,
    "newUsersThisMonth": 10,
    "tierDistribution": [
      {"tier": "FREE", "count": 40},
      {"tier": "PRO", "count": 8},
      {"tier": "ADVANCED", "count": 2}
    ],
    "growthTrend": [
      {"month": "May 2025", "signups": 5},
      {"month": "Jun 2025", "signups": 8},
      ...6 months
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Counts are accurate (verify against database)
- Tier distribution sums to totalUsers
- Growth trend has 6 data points

**Pass/Fail:** [ ]

**Verification Query:**
```sql
-- Verify total users
SELECT COUNT(*) FROM users;

-- Verify tier distribution
SELECT plan_type, COUNT(*) FROM users GROUP BY plan_type;

-- Verify active users (last 30 days)
SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '30 days';
```

---

### Test 5.2: Analytics - Usage Metrics API

**Test Command:**
```bash
curl -X GET "http://staging-url/api/admin/analytics/usage" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "totalCreditsConsumed": 500,
    "creditsConsumedThisMonth": 150,
    "practiceSessionsCount": 250,
    "prepareSessionsCount": 100,
    "featureUsage": [
      {"feature": "practice-session", "count": 250, "creditsUsed": 250},
      {"feature": "prepare-session", "count": 100, "creditsUsed": 100}
    ],
    "topUsers": [
      {"userId": "uuid", "email": "user@example.com", "creditsUsed": 50},
      ...top 10
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Credit consumption accurate
- Session counts match database
- Feature usage breakdown correct
- Top 10 users sorted by credits used

**Pass/Fail:** [ ]

---

### Test 5.3: Analytics - Platform Health API

**Test Command:**
```bash
curl -X GET "http://staging-url/api/admin/analytics/platform" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "lowCreditUsers": [
      {"userId": "uuid", "email": "user@example.com", "credits": 5, "tier": "FREE"}
    ],
    "creditDistribution": [
      {"range": "0-10", "count": 5},
      {"range": "11-25", "count": 10},
      {"range": "26-50", "count": 20},
      {"range": "51-100", "count": 10},
      {"range": "100+", "count": 5}
    ],
    "upcomingRenewals": [
      {"userId": "uuid", "email": "user@example.com", "renewalDate": "2025-11-01", "tier": "PRO"}
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Low credit users (< 10 credits) listed
- Credit distribution histogram accurate
- Upcoming renewals (next 30 days) listed

**Pass/Fail:** [ ]

---

### Test 5.4: Analytics - Revenue Metrics API (Mock Data)

**Test Command:**
```bash
curl -X GET "http://staging-url/api/admin/analytics/revenue" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "mrr": 220,
    "topupRevenue": 0,
    "totalRevenue": 220,
    "activeSubscriptions": 10,
    "proSubscriptions": 8,
    "advancedSubscriptions": 2,
    "revenueTrend": [
      {"month": "May", "mrr": 180, "topups": 0, "total": 180},
      ...6 months
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- MRR = (proCount × $10) + (advancedCount × $28)
- Active subscriptions = proCount + advancedCount
- Revenue trend has 6 data points
- Note: This is MOCK data until Stripe integration

**Pass/Fail:** [ ]

**Manual Calculation:**
```sql
-- Calculate expected MRR
SELECT
  (COUNT(*) FILTER (WHERE plan_type = 'PRO') * 10) +
  (COUNT(*) FILTER (WHERE plan_type = 'ADVANCED') * 28) AS expected_mrr
FROM users;
```

---

### Test 5.5: Admin Payments API (Mock Data)

**Test Command:**
```bash
curl -X GET "http://staging-url/api/admin/payments" \
  -b admin_cookies.txt \
  -H "Accept: application/json"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "mock-txn-1",
        "userId": "uuid",
        "userName": "User Name",
        "userEmail": "user@example.com",
        "type": "subscription",
        "amount": 10,
        "status": "completed",
        "date": "2025-10-15T...",
        "description": "PRO Monthly Subscription"
      }
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Mock transactions generated from actual Pro/Advanced users
- Transactions include user details
- Note: This is MOCK data until Stripe integration

**Pass/Fail:** [ ]

---

### Test 5.6: Admin Analytics Page UI

**Manual Test:**
1. Navigate to: `http://staging-url/admin/analytics`
2. Verify all sections render

**Expected Result:**
- **User Metrics Section:**
  - 4 summary cards (Total, Active, New, Distribution)
  - Tier distribution pie chart (Recharts)
  - User growth trend line chart (6 months)
- **Usage Metrics Section:**
  - 4 summary cards (Credits Consumed, Sessions, etc.)
  - Feature usage bar chart
  - Top 10 active users table
- **Platform Health Section:**
  - Low credit users table (< 10 credits)
  - Credit distribution histogram
  - Upcoming renewals table
- No console errors
- All charts render correctly
- Loading states work
- Data refreshes from API

**Pass/Fail:** [ ]

---

### Test 5.7: Admin Payments Page UI

**Manual Test:**
1. Navigate to: `http://staging-url/admin/payments`
2. Verify page renders with mock data warning

**Expected Result:**
- Yellow warning banner: "Mock Data - Real transaction data available after Stripe integration (Phase 6)"
- **Revenue Cards:**
  - MRR card (green)
  - Top-up revenue card
  - Total revenue card (blue)
  - Active subscriptions card (purple)
- **Revenue Trend Chart:**
  - 3 lines: MRR, Top-Ups, Total (Recharts)
  - 6 months of data
- **Payment Transactions Table:**
  - Mock transactions from Pro/Advanced users
  - Filterable by date/type/status
  - Badges for status/type
- **CSV Export Button:**
  - Functional
  - Downloads CSV file
  - Correct format

**Pass/Fail:** [ ]

---

## 🧪 Integration Tests: End-to-End Workflows

### Integration Test 1: Complete User Credit Lifecycle

**Scenario:** New user signs up, uses credits, runs out, admin adds credits

**Steps:**
1. **Create new user account**
   ```bash
   curl -X POST http://staging-url/api/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "integration-test@example.com",
       "password": "Test123!",
       "firstName": "Integration",
       "lastName": "Test"
     }'
   ```
   - Expected: User created with 50 FREE credits

2. **Login and verify initial balance**
   ```bash
   curl -X POST http://staging-url/api/login \
     -H "Content-Type: application/json" \
     -d '{"email": "integration-test@example.com", "password": "Test123!"}' \
     -c integration_cookies.txt

   curl -X GET http://staging-url/api/credits/balance \
     -b integration_cookies.txt
   ```
   - Expected: 50 credits

3. **Use credits (create 3 practice sessions)**
   ```bash
   # Session 1
   curl -X POST http://staging-url/api/practice/sessions \
     -b integration_cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"scenarioId": "test-id", "language": "en"}'

   # Session 2 and 3 (repeat)
   ```
   - Expected: 47 credits remaining after 3 sessions

4. **Check transaction history**
   ```bash
   curl -X GET http://staging-url/api/credits/history \
     -b integration_cookies.txt
   ```
   - Expected: 3 consumption transactions, 1 allocation transaction

5. **Admin views user in dashboard**
   - Navigate to: http://staging-url/admin/users
   - Search for: integration-test@example.com
   - Expected: User visible with 47 credits

6. **Admin adds 100 top-up credits**
   ```bash
   USER_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM users WHERE email = 'integration-test@example.com';")

   curl -X POST "http://staging-url/api/admin/users/$USER_ID/credits/add" \
     -b admin_cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "reason": "Integration test top-up"}'
   ```
   - Expected: 147 total credits (47 monthly + 100 top-up)

7. **User verifies new balance**
   ```bash
   curl -X GET http://staging-url/api/credits/balance \
     -b integration_cookies.txt
   ```
   - Expected: 147 credits with breakdown

**Pass/Fail:** [ ]

---

### Integration Test 2: Admin User Management Workflow

**Scenario:** Admin manages user tier, credits, and views analytics

**Steps:**
1. **Admin views user list and filters by tier**
   - Navigate to: http://staging-url/admin/users
   - Filter: Tier = FREE
   - Expected: Only FREE users shown

2. **Admin selects user for upgrade**
   - Click on integration-test@example.com
   - Navigate to user detail page
   - Expected: User details, credit balance, transaction history visible

3. **Admin upgrades user to PRO**
   ```bash
   curl -X PUT "http://staging-url/api/admin/users/$USER_ID/tier" \
     -b admin_cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"newTier": "PRO"}'
   ```
   - Expected: Tier changed to PRO, monthly credits = 100

4. **Admin resets monthly credits**
   ```bash
   curl -X POST "http://staging-url/api/admin/users/$USER_ID/credits/reset" \
     -b admin_cookies.txt
   ```
   - Expected: Monthly credits reset to 100 (PRO tier default)

5. **Admin views analytics impact**
   - Navigate to: http://staging-url/admin/analytics
   - Check tier distribution
   - Expected: PRO count increased by 1, FREE count decreased by 1

6. **Admin checks revenue impact**
   - Navigate to: http://staging-url/admin/payments
   - Expected: MRR increased by $10

**Pass/Fail:** [ ]

---

### Integration Test 3: Credit Cost Configuration Impact

**Scenario:** Admin changes credit cost, verify impact on users

**Steps:**
1. **Admin changes practice-session cost to 2 credits**
   ```bash
   COST_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM credit_costs WHERE feature_name = 'practice-session';")

   curl -X PUT "http://staging-url/api/admin/credit-costs/$COST_ID" \
     -b admin_cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"creditCost": 2}'
   ```

2. **User checks credit costs**
   ```bash
   curl -X GET http://staging-url/api/credits/costs \
     -b integration_cookies.txt
   ```
   - Expected: practice-session = 2 credits

3. **User creates practice session**
   ```bash
   # Before creating, check balance
   BALANCE_BEFORE=$(curl -s http://staging-url/api/credits/balance -b integration_cookies.txt | jq '.data.totalCredits')

   # Create session
   curl -X POST http://staging-url/api/practice/sessions \
     -b integration_cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"scenarioId": "test-id", "language": "en"}'

   # Check balance after
   BALANCE_AFTER=$(curl -s http://staging-url/api/credits/balance -b integration_cookies.txt | jq '.data.totalCredits')
   ```
   - Expected: BALANCE_AFTER = BALANCE_BEFORE - 2

4. **Reset credit cost to original**
   ```bash
   curl -X PUT "http://staging-url/api/admin/credit-costs/$COST_ID" \
     -b admin_cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"creditCost": 1}'
   ```

**Pass/Fail:** [ ]

---

## 🧪 Performance Tests

### Performance Test 1: API Response Times

**Test Command:**
```bash
# Test all critical endpoints with time measurement
for endpoint in \
  "/api/health" \
  "/api/credits/balance" \
  "/api/credits/history" \
  "/api/credits/costs" \
  "/api/admin/users" \
  "/api/admin/analytics/users" \
  "/api/admin/analytics/usage" \
  "/api/admin/analytics/revenue"
do
  echo "Testing: $endpoint"
  time curl -s -o /dev/null -w "HTTP %{http_code} - %{time_total}s\n" \
    "http://staging-url$endpoint" \
    -b admin_cookies.txt
done
```

**Expected Results:**
- All endpoints: < 2 seconds response time
- Health endpoint: < 500ms
- Simple GET requests: < 1 second
- Analytics endpoints: < 3 seconds (more complex queries)

**Pass Criteria:**
- 95% of requests under 2 seconds
- No timeouts
- HTTP 200 status (or expected status)

**Pass/Fail:** [ ]

---

### Performance Test 2: Database Query Performance

**Test Queries:**
```sql
-- Enable query timing
\timing on

-- Test credit transactions query (should use index)
EXPLAIN ANALYZE
SELECT * FROM credit_transactions
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 50;

-- Test user list query with filters
EXPLAIN ANALYZE
SELECT * FROM users
WHERE plan_type = 'PRO'
  AND credit_balance > 0
ORDER BY created_at DESC
LIMIT 50;

-- Test analytics aggregation query
EXPLAIN ANALYZE
SELECT
  plan_type,
  COUNT(*) as user_count,
  AVG(credit_balance) as avg_credits
FROM users
GROUP BY plan_type;
```

**Expected Results:**
- Query execution time: < 100ms for single-table queries
- Query execution time: < 500ms for aggregations
- Index usage confirmed in EXPLAIN ANALYZE output

**Pass Criteria:**
- No sequential scans on large tables
- Indexes used where expected
- Execution time within limits

**Pass/Fail:** [ ]

---

### Performance Test 3: Concurrent User Load

**Test Script:**
```bash
#!/bin/bash
# Simulate 50 concurrent users checking credit balance

for i in {1..50}; do
  (
    curl -s http://staging-url/api/credits/balance \
      -b integration_cookies.txt \
      -w "User $i: %{http_code} - %{time_total}s\n"
  ) &
done

wait
echo "All requests completed"
```

**Expected Results:**
- All requests succeed (HTTP 200)
- No 503 Service Unavailable errors
- Average response time: < 2 seconds
- No database connection errors

**Pass Criteria:**
- 100% success rate
- No server crashes
- System remains stable

**Pass/Fail:** [ ]

---

## 🧪 Regression Tests

### Regression Test 1: Existing Features Still Work

**Test existing Practice module:**
```bash
# Create practice session (pre-existing feature)
curl -X POST http://staging-url/api/practice/sessions \
  -b integration_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "existing-scenario-id",
    "language": "en"
  }'
```

**Expected Result:**
- Session created successfully
- Credits deducted (new behavior)
- Session playable
- No breaking changes

**Pass/Fail:** [ ]

---

### Regression Test 2: Existing Prepare Module

**Test existing Prepare module:**
```bash
# Create prepare session
curl -X POST http://staging-url/api/prepare/sessions \
  -b integration_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Software Engineer",
    "jobDescription": "Test job description",
    "language": "en"
  }'
```

**Expected Result:**
- Session created successfully
- Credits deducted (new behavior)
- Session functional
- No breaking changes

**Pass/Fail:** [ ]

---

### Regression Test 3: Authentication Flow

**Test login/logout:**
```bash
# Login
curl -X POST http://staging-url/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  -c test_cookies.txt

# Access protected route
curl -X GET http://staging-url/api/credits/balance \
  -b test_cookies.txt

# Logout
curl -X GET http://staging-url/api/logout \
  -b test_cookies.txt

# Verify logged out
curl -X GET http://staging-url/api/credits/balance \
  -b test_cookies.txt
```

**Expected Results:**
- Login successful
- Protected route accessible when authenticated
- Logout successful
- Protected route returns 401 after logout

**Pass/Fail:** [ ]

---

## 📊 Test Execution Log

| Date | Tester | Test Section | Pass/Fail | Notes |
|------|--------|--------------|-----------|-------|
| | | Pre-Deployment Checklist | | |
| | | Deployment Steps | | |
| | | Phase 1: Database Schema | | |
| | | Phase 2: Credit Management | | |
| | | Phase 3: Billing Frontend | | |
| | | Phase 4: Admin Dashboard | | |
| | | Phase 5: Analytics | | |
| | | Integration Tests | | |
| | | Performance Tests | | |
| | | Regression Tests | | |

---

## ⚠️ Known Limitations (Stripe Integration Pending)

The following features are **intentionally disabled** until Phase 6 (Stripe Integration):

### Payment Features
- [ ] Subscription tier upgrades (buttons disabled with tooltip)
- [ ] Credit top-up purchases (buttons disabled with tooltip)
- [ ] Stripe Checkout integration
- [ ] Webhook handling for payment events
- [ ] Real payment transaction data

### Mock Data Areas
- [ ] Payment transactions in admin dashboard (generated from user tiers)
- [ ] Revenue metrics (calculated from Pro/Advanced user counts)
- [ ] Invoice data (placeholder only)

### Expected Behavior
- **Billing Page**: All upgrade/purchase buttons show tooltip: "Payment integration coming soon"
- **Admin Payments Page**: Yellow banner: "Mock Data - Real data available after Stripe integration"
- **Revenue Metrics**: Calculated as MRR = (Pro users × $10) + (Advanced users × $28)
- **Transactions**: Mock transactions generated from existing Pro/Advanced users

**These are expected limitations and NOT bugs.**

---

## 🔄 Rollback Procedures

### If Deployment Fails

**Step 1: Identify Last Good Version**
```bash
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy \
  --query 'ApplicationVersions[?Status==`PROCESSED`] | sort_by(@, &DateCreated) | [-5:]' \
  --output table
```

**Step 2: Rollback to Previous Version**
```bash
# Get last stable version label
PREVIOUS_VERSION="staging-20251020-123456"  # Replace with actual

# Rollback
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --version-label $PREVIOUS_VERSION
```

**Step 3: Verify Rollback**
```bash
# Wait for environment to stabilize
aws elasticbeanstalk wait environment-updated \
  --environment-name p3-interview-academy-staging

# Check health
curl http://staging-url/api/health
```

---

### If Database Migration Fails

**Step 1: Check Migration Status**
```bash
# Connect to database
psql $DATABASE_URL

# Check which tables exist
\dt

# Check schema version if tracked
SELECT * FROM schema_migrations;  -- If using migrations table
```

**Step 2: Manual Rollback (if needed)**
```sql
-- Drop new tables in reverse order (due to foreign keys)
DROP TABLE IF EXISTS credit_costs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Rollback users table changes (if needed)
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE users DROP COLUMN IF EXISTS plan_type;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE users DROP COLUMN IF EXISTS current_period_end;
ALTER TABLE users DROP COLUMN IF EXISTS top_up_credits;
```

**Step 3: Restore from Backup (last resort)**
```bash
# List available backups
aws rds describe-db-snapshots \
  --db-instance-identifier your-db-instance \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Time:SnapshotCreateTime}' \
  --output table

# Restore from snapshot (creates new instance)
# Note: This is a major operation - consult with team first
```

---

## ✅ Test Sign-Off

### Test Completion Checklist
- [ ] All Phase 1 tests passed
- [ ] All Phase 2 tests passed
- [ ] All Phase 3 tests passed
- [ ] All Phase 4 tests passed
- [ ] All Phase 5 tests passed
- [ ] All integration tests passed
- [ ] All performance tests passed
- [ ] All regression tests passed
- [ ] No critical bugs found
- [ ] Known limitations documented
- [ ] Rollback procedures tested

### Approvals
- **QA Lead**: _________________ Date: _______
- **Tech Lead**: ________________ Date: _______
- **Product Owner**: ____________ Date: _______

---

## 📝 Issue Tracker

| ID | Priority | Issue Description | Status | Assigned To | Resolution |
|----|----------|-------------------|--------|-------------|------------|
| | | | | | |
| | | | | | |

**Priority Levels:**
- **P0**: Critical - Blocks deployment
- **P1**: High - Must fix before production
- **P2**: Medium - Should fix but not blocking
- **P3**: Low - Nice to have

---

## 🔗 Related Documentation

- **Progress Doc**: `MD_Documentations/Progress/ADMIN_SUBSCRIPTION_SYSTEM_PROGRESS.md`
- **Deployment Guide**: `CLAUDE.md` - Deployment section
- **API Documentation**: Phase 2 section in progress doc
- **Database Schema**: `shared/schema.ts`
- **Stripe Integration Guide**: Phase 6 section in progress doc (when ready)

---

**Last Updated**: 2025-10-23
**Document Version**: 1.0
**Next Review**: After Phase 6 completion
