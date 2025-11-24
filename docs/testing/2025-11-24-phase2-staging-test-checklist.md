# Phase 2 Staging Test Checklist

**Date**: 2025-11-24
**PR**: [#15 - Phase 2 UAT Bug Fixes](https://github.com/jevinbizelev8/P3-Interview-Academy/pull/15)
**Staging URL**: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

---

## Pre-Test Setup

### Check Deployment Status
- [ ] GitHub Actions workflow completed successfully
- [ ] Staging environment health check: `curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health/simple`
- [ ] Expected response: `{"status":"ok","timestamp":"..."}`

### AWS S3 Setup (ONE-TIME SETUP REQUIRED)
⚠️ **IMPORTANT**: S3 bucket must be created before testing Bug #8

```bash
# 1. Create S3 bucket
aws s3 mb s3://p3-user-uploads --region ap-southeast-1

# 2. Configure public access
aws s3api put-public-access-block \
  --bucket p3-user-uploads \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# 3. Set bucket policy
cat > /tmp/bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::p3-user-uploads/profile-photos/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket p3-user-uploads \
  --policy file:///tmp/bucket-policy.json

# 4. Configure CORS
cat > /tmp/s3-cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://p3app.bizelev8.ai",
        "https://p3app-staging.bizelev8.ai",
        "http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com",
        "http://localhost:5000"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket p3-user-uploads \
  --cors-configuration file:///tmp/s3-cors.json

# 5. Set environment variable in AWS Elastic Beanstalk
eb setenv S3_BUCKET_NAME=p3-user-uploads --environment p3-interview-academy-staging
```

### Test User Setup
- [ ] Create test user or use existing account
- [ ] Note starting credit balance: _______ credits
- [ ] Ensure user has at least 20 credits for testing

---

## 🐛 BUG #3: Self-Intro Coaching

**Priority**: HIGH
**Expected Behavior**: Users can request AI coaching on each self-intro wizard step

### Test Steps

#### Step 1: Navigate to Wizard
- [ ] Log in to staging: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- [ ] Navigate to **Prepare** → **Self-Introduction Wizard**
- [ ] Verify wizard loads correctly

#### Step 2: Test "Who Are You" Coaching
- [ ] Enter text in "Who Are You" field:
  ```
  I am a software engineer with 5 years of experience in full-stack development.
  ```
- [ ] Click **"Request for Personalized Coaching"** button
- [ ] **Expected**: AI coaching appears (NOT "coming soon" message)
- [ ] **Expected**: Coaching is relevant to WHO content (mentions role, experience)
- [ ] **Expected**: Coaching includes 2-3 specific tips
- [ ] **Expected**: Coaching is conversational and encouraging
- [ ] Check credit balance → **Expected**: 2 credits deducted

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Step 3: Test "What Do You Do" Coaching
- [ ] Move to Step 2 (What Do You Do)
- [ ] Enter different content:
  ```
  I build scalable web applications using React and Node.js. I increased user engagement by 40% through performance optimization.
  ```
- [ ] Click **"Request for Personalized Coaching"**
- [ ] **Expected**: New coaching specific to WHAT content
- [ ] **Expected**: Coaching mentions achievements, metrics
- [ ] Check credit balance → **Expected**: 2 more credits deducted (total 4)

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Step 4: Test "Why This Role/Company" Coaching
- [ ] Move to Step 3 (Why This Role/Company)
- [ ] Enter content:
  ```
  I'm passionate about working with innovative teams that solve real-world problems.
  ```
- [ ] Click **"Request for Personalized Coaching"**
- [ ] **Expected**: Coaching relevant to WHY section
- [ ] Check credit balance → **Expected**: 2 more credits deducted (total 6)

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Step 5: Test "Closing Hook" Coaching
- [ ] Move to Step 4 (Closing Hook)
- [ ] Enter content:
  ```
  I'm excited to contribute to your team and learn from industry experts.
  ```
- [ ] Click **"Request for Personalized Coaching"**
- [ ] **Expected**: Coaching for closing section
- [ ] Check credit balance → **Expected**: 2 more credits deducted (total 8)

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Step 6: Test Empty Field Handling
- [ ] Clear the field (make it empty)
- [ ] Click **"Request for Personalized Coaching"**
- [ ] **Expected**: Helpful message like "Please write your [step] first to receive personalized coaching"
- [ ] **Expected**: NO credits deducted

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

### Success Criteria
- ✅ All 4 steps provide relevant coaching
- ✅ Different content produces different coaching
- ✅ Empty fields show helpful message
- ✅ Credits deducted correctly (2 per request)
- ✅ No "coming soon" placeholder message

**OVERALL BUG #3**: ⬜ PASS ⬜ FAIL

---

## 🐛 BUG #7: Improved Error Messages

**Priority**: MEDIUM
**Expected Behavior**: Clear, helpful error messages with specific guidance

### Test Steps

#### Test 1: Network Error
- [ ] Navigate to **Practice** module
- [ ] Click **"Start Simulation"**
- [ ] **IMMEDIATELY** disconnect internet (WiFi off or airplane mode)
- [ ] **Expected Error Message**:
  ```
  ❌ Simulation Error

  🌐 Network connection lost. Please check your internet connection and try again.

  What you can do:
  • Check your internet connection
  • Refresh the page and try again
  • Contact support@bizelev8.ai if this persists

  Your credits have not been charged.
  ```
- [ ] Reconnect internet
- [ ] **Expected**: Can try again successfully

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 2: Insufficient Credits
- [ ] Set user credits to 0 (or use test account with 0 credits)
- [ ] Try to start simulation (costs 10 credits)
- [ ] **Expected Error Message**:
  ```
  You need 10 credits but only have 0. Please purchase more credits or upgrade your plan.
  ```
- [ ] **Expected**: Clear and actionable
- [ ] **Expected**: Shows exact credit amounts

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 3: Error Logging
- [ ] Open browser DevTools → Console tab
- [ ] Trigger any error (network, insufficient credits, etc.)
- [ ] **Expected in Console**: Detailed error object with:
  - Error code
  - Error message
  - HTTP status
  - Timestamp
  - Additional debug data

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

### Success Criteria
- ✅ Network errors clearly identified
- ✅ All error messages user-friendly (no technical jargon)
- ✅ Messages include actionable next steps
- ✅ Support email provided
- ✅ Credit status clarified
- ✅ Error codes logged for debugging

**OVERALL BUG #7**: ⬜ PASS ⬜ FAIL

---

## 🐛 BUG #5: Transparent Script Analysis

**Priority**: MEDIUM
**Expected Behavior**: Clear messaging about current capabilities

### Test Steps

#### Test 1: UI Labels
- [ ] Navigate to **Prepare** → **Self-Introduction Wizard**
- [ ] Complete steps 1-6 (script building)
- [ ] Arrive at Step 7 (Assessment)
- [ ] **Verify Title**: "🎯 AI Script Assessment"
- [ ] **Verify Subtitle**: "Get detailed feedback on your self-introduction content and delivery recommendations"
- [ ] **Expected**: NO mention of "video assessment" or "video performance"

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 2: Capability Alert
- [ ] On Step 7, look for blue info alert
- [ ] **Expected Alert**:
  ```
  ℹ️ Current Analysis: We analyze your script content and provide delivery recommendations.

  Full video analysis (facial expressions, body language tracking) coming in Q1 2026!
  ```
- [ ] **Verify**: Alert is visible and easy to read
- [ ] **Verify**: Clear distinction between current and future features

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 3: Button Text
- [ ] Verify button text: **"Analyze Script & Get Delivery Tips (5 credits)"**
- [ ] **Expected**: Button clearly states it analyzes SCRIPT, not video
- [ ] Click button to analyze
- [ ] **Expected**: Analysis focuses on script content
- [ ] **Expected**: Feedback includes delivery recommendations

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

### Success Criteria
- ✅ UI clearly states "script-based analysis"
- ✅ No misleading claims about video processing
- ✅ Users understand current vs. future capabilities
- ✅ Info alert visible and informative
- ✅ Timeline mentioned (Q1 2026)

**OVERALL BUG #5**: ⬜ PASS ⬜ FAIL

---

## 🐛 BUG #8: S3 Profile Photos

**Priority**: LOW
**Expected Behavior**: Profile photos stored in S3, persist across restarts

⚠️ **PRE-REQUISITE**: AWS S3 bucket must be set up (see Pre-Test Setup section above)

### Test Steps

#### Test 1: Upload Profile Photo
- [ ] Navigate to **Profile** page
- [ ] Click **"Upload Photo"** or photo upload button
- [ ] Select JPG image (< 5MB)
- [ ] Click **"Upload"**
- [ ] **Expected**: Upload succeeds
- [ ] **Expected**: Photo displays immediately in profile
- [ ] **Inspect Photo URL** (right-click → Copy Image Address)
- [ ] **Expected URL Format**:
  ```
  https://p3-user-uploads.s3.ap-southeast-1.amazonaws.com/profile-photos/[userId]/[timestamp]-[filename].jpg
  ```

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 2: Photo Persistence
- [ ] Note the photo URL from Test 1
- [ ] **Hard refresh page** (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] **Expected**: Photo still displays
- [ ] **Expected**: Same S3 URL
- [ ] Open photo URL in new tab
- [ ] **Expected**: Image loads successfully

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 3: Photo Replacement
- [ ] Upload a **different** photo (different image file)
- [ ] **Expected**: New photo displays
- [ ] Note new photo URL
- [ ] **Verify**: URL has new timestamp
- [ ] Check S3 bucket contents (via AWS Console or CLI):
  ```bash
  aws s3 ls s3://p3-user-uploads/profile-photos/[userId]/
  ```
- [ ] **Expected**: Only ONE photo exists (old one deleted)

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 4: File Type Validation
- [ ] Try to upload PDF file
- [ ] **Expected Error**: "Only image files are allowed (JPEG, PNG, GIF, WebP)"
- [ ] Try to upload PNG file
- [ ] **Expected**: Success
- [ ] Try to upload WebP file
- [ ] **Expected**: Success

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 5: File Size Validation
- [ ] Try to upload 6MB image (larger than 5MB limit)
- [ ] **Expected Error**: "File too large. Maximum size is 5MB."
- [ ] Try to upload 4MB image (under limit)
- [ ] **Expected**: Success

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 6: S3 Health Check
- [ ] Open: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health`
- [ ] Look for `s3` section in response
- [ ] **Expected**:
  ```json
  {
    "checks": {
      "s3": {
        "status": "healthy",
        "bucket": "p3-user-uploads"
      }
    }
  }
  ```

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

### Success Criteria
- ✅ Photos upload to S3 successfully
- ✅ Photos display correctly in UI
- ✅ Photos persist across page refreshes
- ✅ Old photos deleted when new ones uploaded
- ✅ File type validation works
- ✅ File size validation works
- ✅ S3 health check passes

**OVERALL BUG #8**: ⬜ PASS ⬜ FAIL

---

## 🐛 BUG #4: Credit Deduction Verification

**Priority**: HIGH
**Expected Behavior**: No duplicate charges, credits deducted after operation

### Test Steps

#### Test 1: Duplicate Prevention
- [ ] Navigate to Self-Intro Wizard → Step 7 (Assessment)
- [ ] Record video with script: "Hello, I am John"
- [ ] Note credit balance: _______ credits
- [ ] Click **"Analyze Video"**
- [ ] **Expected**: Analysis succeeds
- [ ] Note credit balance: _______ credits (should be 5 less)
- [ ] **WITHOUT CHANGING SCRIPT**, click **"Analyze Video"** again
- [ ] **Expected Error**: 409 status
- [ ] **Expected Message**: "This script has already been analyzed. Please modify your script to get new feedback."
- [ ] Note credit balance: _______ credits (should be UNCHANGED)
- [ ] **Expected**: NO additional credits deducted

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 2: New Script Analysis
- [ ] Change script to: "Hello, I am John Smith"
- [ ] Click **"Analyze Video"**
- [ ] **Expected**: New analysis (not duplicate error)
- [ ] **Expected**: 5 more credits deducted

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

#### Test 3: Failed Operation No Charge
- [ ] Try to start simulation with insufficient credits
- [ ] **Expected**: Operation fails
- [ ] **Expected**: Credits NOT deducted
- [ ] **Expected**: Error message clarifies no charge

**PASS/FAIL**: ⬜ PASS ⬜ FAIL

**Notes**: _______________________________________________

### Success Criteria
- ✅ Duplicate operations rejected with 409 error
- ✅ NO duplicate credit charges
- ✅ Failed operations don't charge credits
- ✅ Each operation has unique resource ID

**OVERALL BUG #4**: ⬜ PASS ⬜ FAIL

---

## 📊 Overall Test Summary

### Bug Status
- **BUG #3** (Self-Intro Coaching): ⬜ PASS ⬜ FAIL
- **BUG #7** (Error Messages): ⬜ PASS ⬜ FAIL
- **BUG #5** (Transparent UI): ⬜ PASS ⬜ FAIL
- **BUG #8** (S3 Photos): ⬜ PASS ⬜ FAIL
- **BUG #4** (Credit Deduction): ⬜ PASS ⬜ FAIL

### Issues Found
List any issues discovered during testing:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendation
⬜ **APPROVE FOR PRODUCTION** - All tests passed
⬜ **NEEDS FIXES** - Issues found that require code changes
⬜ **BLOCKER** - Critical issues prevent production deployment

---

## 🚀 Next Steps

### If All Tests Pass
1. Update this document with PASS status
2. Comment on PR #15 with test results
3. Approve PR for merge to main
4. Monitor production deployment

### If Issues Found
1. Document issues in "Issues Found" section above
2. Comment on PR #15 with detailed issue descriptions
3. Create new branch for fixes
4. Re-test after fixes applied

---

**Tester**: _______________________________________________
**Date Tested**: _______________________________________________
**Time Spent**: _______________________________________________
**Overall Result**: ⬜ PASS ⬜ FAIL
