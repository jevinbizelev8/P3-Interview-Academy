# Manual QA Testing Checklist - Phase 6 Staging Deployment

**Target Date**: Monday (Staging Deployment)
**Environment**: Staging → `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
**Scope**: Credit packages, gamification systems, AI features
**Tester**: QA team / Developer

---

## Pre-Deployment Checklist

### Environment Verification

- [ ] **Staging Environment Healthy**
  - Visit: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health`
  - Expected: `{ "status": "healthy", "database": "connected" }`

- [ ] **Database Connection Working**
  - Check health endpoint shows database connected
  - Verify it's using `p3_staging` database (not production)

- [ ] **Stripe Test Mode Configured**
  - Check dashboard: https://dashboard.stripe.com/test
  - Verify all 5 products exist (100/500/2000 credits, Pro/Advanced)
  - Verify webhook endpoint registered

- [ ] **Environment Variables Set**
  ```bash
  eb printenv --environment p3-interview-academy-staging
  ```
  - `STRIPE_MODE=test`
  - `STRIPE_TEST_SECRET_KEY=sk_test_...`
  - `STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_TEST_WEBHOOK_SECRET=whsec_...`
  - All 5 `STRIPE_PRICE_*` variables configured

---

## 1. Authentication & User Management

### User Registration

- [ ] **Navigate to Signup Page**
  - URL: `/signup`
  - Page loads without errors

- [ ] **Create Test User**
  - Email: `qa-test-{timestamp}@example.com`
  - Password: Strong password with requirements met
  - First Name: QA
  - Last Name: Tester
  - **Expected**: Account created, redirected to onboarding/dashboard

- [ ] **Verify Email Confirmation** (if enabled)
  - Check email inbox for verification email
  - Click verification link
  - **Expected**: Email confirmed, can login

- [ ] **Login with New Account**
  - Use credentials from signup
  - **Expected**: Successfully logged in, session persists

### User Profile

- [ ] **View Profile**
  - Navigate to `/profile` or user menu
  - **Expected**: Shows user details, credit balance, XP points

- [ ] **Initial Stats Correct**
  - Credit Balance: 0 (or welcome bonus if configured)
  - XP Points: 0
  - Current Streak: 0
  - Readiness Score: 0%

---

## 2. Credit Purchase System (Stripe Integration)

### 2A. Purchase 100 Credits ($10)

- [ ] **Navigate to Billing/Credits Page**
  - URL: `/billing` or `/credits`
  - **Expected**: Shows current balance, purchase options

- [ ] **Click "Buy 100 Credits"**
  - Package: 100 credits for $10.00
  - **Expected**: Redirected to Stripe Checkout

- [ ] **Complete Test Payment**
  - Card Number: `4242 4242 4242 4242`
  - Expiry: `12/34`
  - CVC: `123`
  - Name: Any name
  - **Expected**: Payment successful, redirected to success page

- [ ] **Verify Credit Balance Updated**
  - Check dashboard or profile
  - **Expected**: Balance increased by 100 credits
  - **Actual Balance**: _______

- [ ] **Verify Transaction Logged**
  - Navigate to transaction history (if available)
  - **Expected**: Shows +100 credits, $10.00, timestamp

- [ ] **Check Stripe Dashboard**
  - Visit: https://dashboard.stripe.com/test/payments
  - **Expected**: Payment appears with correct amount
  - **Screenshot**: Recommended

### 2B. Purchase 500 Credits ($45)

- [ ] **Buy 500 Credits Package**
  - Use test card: `4242 4242 4242 4242`
  - **Expected**: Balance increases by 500

- [ ] **Verify Correct Pricing**
  - Amount charged: $45.00
  - Credits added: 500
  - **Actual Balance After**: _______

### 2C. Purchase 2000 Credits ($160)

- [ ] **Buy 2000 Credits Package**
  - Use test card: `4242 4242 4242 4242`
  - **Expected**: Balance increases by 2000

- [ ] **Verify Correct Pricing**
  - Amount charged: $160.00
  - Credits added: 2000
  - **Actual Balance After**: _______

### 2D. Failed Payment Scenarios

- [ ] **Test Declined Card**
  - Card: `4000 0000 0000 9995` (generic decline)
  - **Expected**: Payment fails, no credits added, error message shown

- [ ] **Test Insufficient Funds Card**
  - Card: `4000 0000 0000 9995`
  - **Expected**: Payment rejected, user sees helpful error

- [ ] **Test Expired Card**
  - Card: `4000 0000 0000 0069`
  - **Expected**: Payment rejected, appropriate error message

### 2E. Webhook Verification

- [ ] **Check Webhook Delivery**
  - Stripe Dashboard → Webhooks → Events
  - **Expected**: `checkout.session.completed` event delivered
  - **Response Code**: 200 OK

- [ ] **Verify Idempotency** (if possible)
  - Re-send same webhook event from Stripe Dashboard
  - **Expected**: Credits NOT added twice

---

## 3. Credit Deduction (Practice Sessions)

### Start Practice Session

- [ ] **Navigate to Practice Module**
  - URL: `/practice` or main dashboard
  - **Expected**: Can create new interview session

- [ ] **Verify Current Credit Balance**
  - **Balance Before**: _______

- [ ] **Create New Practice Session**
  - Difficulty: Medium
  - Job Description: "Software Engineer"
  - **Expected**: Session starts, credits deducted

- [ ] **Verify Credit Deduction**
  - **Expected Deduction**: 10 credits (check pricing)
  - **Balance After**: _______
  - **Math Check**: Before - After = 10? ☐ Yes ☐ No

- [ ] **Transaction Logged**
  - Type: "practice_session" or similar
  - Amount: -10 credits
  - **Visible in history**: ☐ Yes ☐ No

### Insufficient Credits Scenario

- [ ] **Set Low Balance** (if possible via admin panel)
  - Or spend credits until balance < 10

- [ ] **Try to Start Session with Insufficient Credits**
  - **Expected**: Error message "Insufficient credits"
  - **Session Started**: ☐ No (correct) ☐ Yes (BUG!)

---

## 4. Gamification System

### 4A. XP Points System

#### Learning Module Completion

- [ ] **Navigate to Learning Hub**
  - URL: `/prepare` or learning modules
  - **Expected**: Shows available modules

- [ ] **Complete First Module**
  - Module: Any available module
  - **Expected**: Module marked as complete

- [ ] **Verify XP Awarded**
  - **Expected**: +10 to +20 XP
  - **Actual XP Gained**: _______
  - **Total XP After**: _______

- [ ] **Check XP History** (if visible)
  - Source: "module_completion"
  - Points: 10-20 XP
  - Timestamp: Recent

#### Practice Session XP

- [ ] **Complete Practice Session**
  - Finish full interview simulation
  - Performance Score: 70-80%
  - **Expected**: XP awarded based on performance

- [ ] **Verify XP Calculation**
  - **Base XP**: 50-100
  - **Performance Bonus**: +0 to +50 (if >80%)
  - **Total XP Gained**: _______

#### High Performance Bonus

- [ ] **Complete Session with >90% Score** (if possible)
  - **Expected**: +50 XP bonus
  - **Bonus XP Visible**: ☐ Yes ☐ No

### 4B. Badge System

#### First Steps Badge (1 Module)

- [ ] **Check Badge Progress Before**
  - Navigate to badges page (`/badges` or profile)
  - "First Steps" badge progress: 0/1

- [ ] **Complete First Learning Module**
  - (Already done in XP test if sequential)

- [ ] **Verify Badge Unlocked**
  - **Expected**: "First Steps" badge earned
  - **Badge Status**: ☐ Unlocked ☐ Locked (BUG!)
  - **Badge XP Reward**: 50 XP

- [ ] **Check Badge Display**
  - Badge icon shown in profile
  - Badge appears in badges collection
  - Earned date displayed

#### Quick Learner Badge (5 Modules)

- [ ] **Complete 5 Learning Modules**
  - Track progress: 1/5, 2/5, 3/5, 4/5, 5/5

- [ ] **Verify Badge Unlocked at 5**
  - **Expected**: "Quick Learner" badge earned
  - **XP Reward**: 100 XP

#### Interview Ready Badge (10 Simulations)

- [ ] **Check Initial Progress**
  - Progress: 0/10 simulations

- [ ] **Complete Multiple Simulations**
  - After 1st: Progress 1/10
  - After 5th: Progress 5/10
  - After 10th: Badge unlocked

- [ ] **Verify Badge Earned**
  - **Badge Unlocked**: ☐ Yes ☐ No
  - **XP Reward**: 200 XP

### 4C. Streak Tracking

#### Day 1 Activity

- [ ] **Record Initial Streak**
  - Current Streak: 0 days
  - Longest Streak: 0 days

- [ ] **Complete Any Activity**
  - Module, practice session, or any engagement
  - **Expected**: Streak updated to 1 day

- [ ] **Verify Streak Display**
  - Current Streak: 1 day
  - Streak icon/animation shown
  - **Daily Bonus XP**: +5 XP

#### Day 2 Activity (Next Day Test)

- [ ] **Simulate Next Day** (if possible)
  - Or test after 24 hours

- [ ] **Complete Activity Next Day**
  - **Expected**: Streak continues to 2 days

- [ ] **Verify Streak Bonus Scales**
  - Day 1: +5 XP
  - Day 2: +10 XP
  - **Bonus Increases**: ☐ Yes ☐ No

#### Broken Streak Scenario

- [ ] **Skip 2+ Days** (if testing long-term)
  - **Expected**: Streak resets to 0

- [ ] **Longest Streak Preserved**
  - **Expected**: Longest streak = previous max
  - **Current Streak**: Reset to 0

### 4D. Readiness Score (0-100%)

- [ ] **Check Initial Readiness Score**
  - Navigate to dashboard or readiness page
  - **Initial Score**: 0% (or low value)

- [ ] **Complete Various Activities**
  - ☐ Complete 2-3 learning modules
  - ☐ Complete 1-2 practice simulations (>70% score)
  - ☐ Upload resume (if available)
  - ☐ Complete self-intro assessment (if available)

- [ ] **Verify Score Increases**
  - **Expected**: Score rises with each activity
  - **Score After Activities**: _______% (target: 20-40%)

- [ ] **Check Score Breakdown**
  - **Simulation Performance**: ___% contribution (60% weight)
  - **Module Completion**: ___% contribution (20% weight)
  - **Self-Intro Score**: ___% contribution (10% weight)
  - **Resume Score**: ___% contribution (5% weight)
  - **Practice Consistency**: ___% contribution (5% weight)

- [ ] **Verify Recommendations Shown**
  - **Expected**: Suggestions to improve score
  - Example: "Complete 3 more modules to reach 50%"

---

## 5. AI-Powered Features

### 5A. Resume Analyzer

- [ ] **Navigate to Resume Upload**
  - URL: `/prepare/resume` or similar

- [ ] **Upload Test Resume** (PDF)
  - Use sample resume file
  - **Expected**: Upload successful, processing starts

- [ ] **Wait for AI Analysis**
  - **Expected**: Analysis completes in <30 seconds
  - **Status**: ☐ Complete ☐ Failed ☐ Timeout

- [ ] **Verify Analysis Results**
  - **ATS Score**: _______% (0-100)
  - **Strengths Identified**: ☐ Yes ☐ No
  - **Improvement Suggestions**: ☐ Yes ☐ No
  - **Job Description Match**: _______% (if JD provided)

- [ ] **Check XP Awarded**
  - **Expected**: +25 XP for resume analysis
  - **XP Gained**: _______

### 5B. Self-Introduction Assessment

- [ ] **Navigate to Self-Intro Module**
  - URL: `/prepare/self-intro` or similar

- [ ] **Complete Self-Intro Wizard**
  - Step 1: Background
  - Step 2: Current Role
  - Step 3: Skills
  - Step 4: Achievements
  - Step 5: Goals
  - Step 6: Practice (optional video)

- [ ] **Submit for AI Feedback**
  - **Expected**: AI generates feedback in <30 seconds

- [ ] **Verify AI Feedback Quality**
  - **Clarity Score**: _______/10
  - **Structure Score**: _______/10
  - **Relevance Score**: _______/10
  - **Specific Suggestions**: ☐ Yes ☐ No

- [ ] **Check XP Awarded**
  - **Expected**: +25 to +50 XP
  - **XP Gained**: _______

### 5C. STAR Story Builder

- [ ] **Navigate to STAR Stories**
  - URL: `/prepare/star-stories`

- [ ] **Create New STAR Story**
  - **Situation**: Describe context
  - **Task**: Specific responsibility
  - **Action**: Steps taken
  - **Result**: Outcomes achieved

- [ ] **Get AI Feedback**
  - **Expected**: AI evaluates each component
  - **Situation Score**: _______/10
  - **Task Score**: _______/10
  - **Action Score**: _______/10
  - **Result Score**: _______/10

- [ ] **Check Improvement Suggestions**
  - **Suggestions Provided**: ☐ Yes ☐ No
  - **Actionable**: ☐ Yes ☐ No

- [ ] **Verify XP Awarded**
  - **Expected**: +15-20 XP per story

---

## 6. Referral System

### 6A. Generate Referral Code

- [ ] **Navigate to Referrals Page**
  - URL: `/referrals` or user menu

- [ ] **Generate Referral Code**
  - Click "Get My Referral Code"
  - **Expected**: Code generated (8 alphanumeric chars)
  - **Your Code**: _____________

- [ ] **Verify Referral URL**
  - **Expected Format**: `http://staging-url/signup?ref=ABCD1234`
  - **URL Copyable**: ☐ Yes ☐ No

### 6B. Apply Referral Code (New User)

- [ ] **Open Incognito/Private Window**
  - Visit staging URL

- [ ] **Signup with Referral Code**
  - Email: `qa-referred-{timestamp}@example.com`
  - Password: Strong password
  - **Referral Code**: (paste code from 6A)

- [ ] **Verify Signup Bonus**
  - **Expected**: New user gets 25 credits signup bonus
  - **Actual Balance**: _______

### 6C. Complete Qualifying Action (New User)

- [ ] **Login as New User**
  - Use referred account

- [ ] **Complete First Practice Session**
  - (This triggers referral reward)

- [ ] **Check Referrer's Account**
  - Login as original user
  - **Expected**: +50 credits referral reward
  - **Actual Balance**: _______

- [ ] **Verify Referral Stats**
  - Navigate to referrals page
  - **Total Referrals**: 1
  - **Successful Referrals**: 1
  - **Credits Earned**: 50

---

## 7. Performance & UX Testing

### Page Load Times

- [ ] **Dashboard Load**
  - **Time**: _______s (target: <2s)

- [ ] **Practice Session Start**
  - **Time**: _______s (target: <3s)

- [ ] **AI Analysis Response**
  - **Time**: _______s (target: <30s)

### Responsive Design

- [ ] **Test on Mobile** (Chrome DevTools or real device)
  - ☐ Dashboard displays correctly
  - ☐ Credit purchase flow works
  - ☐ Navigation menu functional
  - ☐ Buttons clickable/sized appropriately

- [ ] **Test on Tablet**
  - ☐ Layout adapts properly
  - ☐ All features accessible

### Cross-Browser Testing (if time permits)

- [ ] **Chrome**: ☐ Pass ☐ Issues: _______
- [ ] **Firefox**: ☐ Pass ☐ Issues: _______
- [ ] **Safari**: ☐ Pass ☐ Issues: _______
- [ ] **Edge**: ☐ Pass ☐ Issues: _______

---

## 8. Error Handling & Edge Cases

### Network Errors

- [ ] **Simulate Slow Network**
  - Chrome DevTools → Network → Slow 3G
  - **Expected**: Loading indicators shown, graceful degradation

- [ ] **Test Offline Mode**
  - Disconnect internet mid-session
  - **Expected**: Appropriate error message, data saved locally if possible

### Invalid Inputs

- [ ] **Invalid Email Format**
  - Email: `notanemail`
  - **Expected**: Validation error shown

- [ ] **Weak Password**
  - Password: `123`
  - **Expected**: Password requirements shown

- [ ] **Expired Session**
  - Clear cookies, try to access protected page
  - **Expected**: Redirected to login

### Race Conditions

- [ ] **Double-Click Purchase Button**
  - Rapidly click "Buy Credits" twice
  - **Expected**: Only one checkout session created

- [ ] **Concurrent Credit Deductions**
  - Start two practice sessions simultaneously (two tabs)
  - **Expected**: Both deduct correctly, no negative balance

---

## 9. Data Integrity Checks

### Database Consistency

- [ ] **Credit Balance Accuracy**
  - Sum all transactions: _______
  - Current balance: _______
  - **Match**: ☐ Yes ☐ No

- [ ] **XP Points Accuracy**
  - Sum all XP history: _______
  - Current XP total: _______
  - **Match**: ☐ Yes ☐ No

- [ ] **Badge Progress**
  - Manual count of completed modules: _______
  - Badge progress shows: _______
  - **Match**: ☐ Yes ☐ No

---

## 10. Security Testing

### Authentication

- [ ] **Cannot Access Protected Routes When Logged Out**
  - Visit `/dashboard`, `/practice`, `/billing`
  - **Expected**: Redirected to `/login`

- [ ] **Session Persistence**
  - Login, close browser, reopen
  - **Expected**: Still logged in (or session expires appropriately)

### Payment Security

- [ ] **Cannot Manipulate Prices**
  - Inspect network requests, try to change amount
  - **Expected**: Server validates price, not client

- [ ] **Webhook Signature Verified**
  - Check server logs for signature verification
  - **Expected**: No "signature verification failed" errors

---

## 11. Accessibility (WCAG 2.1 Level AA)

### Keyboard Navigation

- [ ] **Tab Through Form Fields**
  - Login, signup, credit purchase forms
  - **All fields accessible**: ☐ Yes ☐ No

- [ ] **Buttons Focusable**
  - **Focus indicators visible**: ☐ Yes ☐ No

### Screen Reader Compatibility

- [ ] **Test with Screen Reader** (if available)
  - NVDA (Windows) or VoiceOver (Mac)
  - **Form labels read correctly**: ☐ Yes ☐ No
  - **Buttons announced**: ☐ Yes ☐ No

### Color Contrast

- [ ] **Text Readable**
  - Use browser extension (e.g., axe DevTools)
  - **Contrast ratio ≥4.5:1**: ☐ Yes ☐ No

---

## 12. Smoke Tests After Deployment

### Critical Path Verification (5 minutes)

1. **Health Check**: `/api/health` → 200 OK
2. **Login**: Existing user can login
3. **Dashboard**: Loads with correct data
4. **Credit Purchase**: Can initiate Stripe checkout
5. **Practice Session**: Can start new session
6. **Gamification**: XP and badges display correctly

---

## Bug Reporting Template

When you find a bug, document it:

### Bug Report Format

```
**Bug ID**: BUG-{number}
**Severity**: Critical / High / Medium / Low
**Module**: Authentication / Credit / Gamification / AI / Referrals

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. Observe...

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Browser/Device**:
[Chrome 120, Windows 11]

**Additional Notes**:
[Any other relevant info]
```

---

## Test Summary Report

### Overall Results

- **Total Test Cases**: _______
- **Passed**: _______
- **Failed**: _______
- **Blocked**: _______
- **Pass Rate**: _______% (target: >95%)

### Critical Issues Found

1. [Bug ID] [Description]
2. [Bug ID] [Description]
3. ...

### Recommendations

- [ ] **Ready for Production**: ☐ Yes ☐ No ☐ With Fixes
- [ ] **Blocker Issues Resolved**: ☐ Yes ☐ No
- [ ] **Performance Acceptable**: ☐ Yes ☐ No

### Sign-Off

- **Tester Name**: _______________________
- **Date Completed**: _______________________
- **Signature**: _______________________

---

## Appendix: Test Accounts

### Staging Test Accounts

| Email | Password | Purpose | Credits | XP |
|-------|----------|---------|---------|-----|
| qa-test-1@example.com | [secure] | General testing | 500 | 250 |
| qa-test-low-credits@example.com | [secure] | Insufficient credits test | 5 | 0 |
| qa-test-high-xp@example.com | [secure] | Badge testing | 1000 | 5000 |

### Stripe Test Cards Reference

| Card Number | Scenario | Expected Result |
|-------------|----------|-----------------|
| 4242 4242 4242 4242 | Success | Payment succeeds |
| 4000 0025 0000 3155 | 3D Secure | Requires authentication |
| 4000 0000 0000 9995 | Decline | Payment fails |
| 4000 0000 0000 0069 | Expired | Card expired error |

---

**Last Updated**: 2025-11-01
**Version**: 1.0 (Phase 6 Staging Deployment)
**Next Review**: After staging deployment on Monday
