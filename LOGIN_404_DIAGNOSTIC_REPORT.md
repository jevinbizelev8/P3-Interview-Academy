# Login 404 Error - Diagnostic Report

**Date**: 2025-12-09
**Issue**: Founder gets 404 error after login on staging environment
**Environment**: Staging only (production works fine)
**User Type**: Regular user (not admin)

---

## Executive Summary

### ✅ Good News

1. **AWS Cognito migration is NOT needed** - This is not an auth architecture problem
2. **Code is correct** - All Phase 2 UAT bug fixes ARE deployed to staging
3. **Configuration looks good** - Environment variables and routes are properly set
4. **Infrastructure is healthy** - Staging environment status is Green

### 🔍 What We Found

**Deployed Version**: `staging-20251204-103334` (Dec 4, 2025)
**Deployed Commit**: `0cf51372` - "Redeploy staging with latest auth fixes"
**Phase 2 Fixes**: ✅ **INCLUDED** in deployment (commit `dad5903c` is in history)

**Environment Variables**:
- ✅ `NODE_ENV=staging`
- ✅ `SESSION_SECRET` is set
- ✅ `FORCE_HTTPS` not set (okay for staging)

**Code Verification**:
- ✅ `/dashboard` route exists in App.tsx (line 33-38)
- ✅ LoginForm redirects regular users to `/dashboard` (line 107)
- ✅ Nginx SPA fallback configured (`try_files $uri $uri/ /index.html`)
- ✅ ProtectedRoute wraps dashboard properly

### 🤔 The Mystery

Since all the code and configuration are correct, the 404 must be a **runtime issue**.

Possible causes:
1. **Session not persisting** after login
2. **Cookies not being sent** by browser
3. **Timing issue** between login and redirect
4. **Auth context failing** to load after redirect

---

## Immediate Actions Needed

### For Founder (During Next Login Attempt):

**Step 1: Open Browser DevTools BEFORE logging in**
- Press F12 to open DevTools
- Go to **Network** tab
- Check "Preserve log" option
- Go to **Console** tab (keep it open)

**Step 2: Attempt Login**
- Enter credentials
- Click "Sign In"
- **DO NOT close DevTools**

**Step 3: Capture Information**
We need to see what's actually happening. Please capture:

#### A. Network Tab Information:
1. Find the POST request to `/api/auth/login`
   - What's the status code? (should be 200)
   - Click on it → Response tab → What does the response say?

2. Find the GET request to `/api/auth/user`
   - What's the status code? (200 = success, 401 = session problem)
   - Response tab → What does it say?

3. Check the Headers for `/api/auth/user`:
   - Request Headers → Is there a `Cookie:` header?
   - Response Headers → Are there any `Set-Cookie:` headers?

#### B. Console Tab Information:
- Are there any error messages?
- Any red text or warnings?

#### C. Application Tab:
- Go to Application → Cookies
- Select the staging domain
- Is there a cookie called `connect.sid`?
- What's its value and expiry?

#### D. Final URL:
- After the 404 appears, what URL is shown in the address bar?
- Is it exactly `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/dashboard`?

#### E. 404 Page Details:
- Does the 404 page say "nginx" anywhere?
- Or does it look like a React error page?
- Can you take a screenshot?

---

## For DevOps/Technical Team:

### Option 1: Watch CloudWatch Logs During Login

Run this command BEFORE founder attempts login:
```bash
aws logs tail /aws/elasticbeanstalk/p3-interview-academy-staging/var/log/web.stdout.log \
  --follow \
  --region ap-southeast-1
```

Look for these log messages during login:
- `🔐 LOGIN ATTEMPT:` (should appear when login starts)
- `✅ LOGIN SUCCESS:` (should appear after password verification)
- `✅ SESSION SAVED:` (should appear after session creation)
- `🔍 AUTH CHECK:` (should appear when checking auth)
- Any error messages

### Option 2: Add Temporary Debugging

If logs don't show the issue, add temporary debug logging to LoginForm:

```javascript
// In client/src/components/LoginForm.tsx, around line 93-108
try {
  const response = await apiRequest("POST", "/api/auth/login", formData);
  const data = await response.json();
  console.log('🔐 Login response:', data);  // ADD THIS

  if (data.success) {
    onSuccess();

    const userResponse = await fetch('/api/auth/user', { credentials: 'include' });
    const userData = await userResponse.json();
    console.log('👤 User data:', userData);  // ADD THIS
    console.log('🎯 Redirecting to:', userData.role === 'admin' ? '/admin' : '/dashboard');  // ADD THIS

    if (userData.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  }
}
```

Then redeploy and ask founder to check browser console during login.

### Option 3: Test Session Manually

After founder logs in (even with 404), immediately run:
```bash
# Check if session exists in database
psql "$DATABASE_URL" -c "SELECT * FROM sessions ORDER BY expire DESC LIMIT 5;"
```

If session exists but founder gets 404, it's likely a cookie/browser issue.

---

## Likely Root Causes (Ranked by Probability)

### 1. Session Cookie Not Being Set (60% probability)

**Symptoms**: Login succeeds, but `/api/auth/user` returns 401

**Why**: Browser might not be accepting the cookie due to:
- SameSite policy
- Secure flag mismatch
- Domain mismatch
- Third-party cookie blocking

**Fix**: May need to adjust cookie settings in `server/auth-simple.ts`:
```javascript
cookie: {
  httpOnly: true,
  secure: false,  // Try explicitly false for staging
  maxAge: sessionTtlMs,
  sameSite: 'lax',
  domain: undefined,
}
```

### 2. Race Condition in Auth Context (25% probability)

**Symptoms**: Redirect happens before auth context loads

**Why**: `onSuccess()` triggers auth refresh, but redirect happens immediately

**Fix**: Add small delay:
```javascript
if (data.success) {
  const userResponse = await fetch('/api/auth/user', { credentials: 'include' });
  const userData = await userResponse.json();

  onSuccess();  // Trigger auth context refresh

  await new Promise(resolve => setTimeout(resolve, 200));  // Wait 200ms

  window.location.href = userData.role === 'admin' ? '/admin' : '/dashboard';
}
```

### 3. Browser-Specific Issue (10% probability)

**Symptoms**: Works in some browsers but not others

**Why**: Different browsers handle cookies/redirects differently

**Test**: Try different browser or incognito mode (already tried, but worth re-testing)

### 4. Nginx Configuration Not Loaded (5% probability)

**Symptoms**: nginx returns 404 instead of serving index.html

**Check**: SSH to instance and verify:
```bash
nginx -T | grep -A5 "location /"
# Should show: try_files $uri $uri/ /index.html =404;
```

---

## Decision: DO NOT Migrate to AWS Cognito

**Reasons**:
1. This is a runtime/configuration issue, not an architecture problem
2. Cognito migration costs 2-4 weeks of development time
3. Won't fix the 404 issue
4. Current Passport.js setup is working fine (production proves this)

**When to reconsider Cognito**:
- User base > 50,000 monthly active users
- MFA requirement emerges
- Need multiple social login providers
- 6-12 months from now

---

## Next Steps

1. **Immediate**: Founder captures browser DevTools information during next login attempt
2. **Short-term**: DevOps watches CloudWatch logs during login
3. **If still unclear**: Add temporary debug logging and redeploy
4. **If session issue confirmed**: Adjust cookie settings
5. **If race condition**: Add delay before redirect

---

## AWS Cognito Research

Full research available at: `docs/research/AWS_COGNITO_MIGRATION_RESEARCH.md` (38KB)

**Summary**:
- Migration complexity: Medium-High (2-4 weeks)
- Cost: Neutral or slight increase
- Risk: Medium (user migration required)
- **Recommendation**: Not worth it for current scale and won't fix 404 issue

**Cost comparison**:
- <50k users/month: Cognito free, Passport.js $60/month → Cognito wins
- 100k users/month: Cognito $335/month, Passport.js $200/month → Passport wins
- Your situation: <10k users → Stay with Passport.js

---

**Report Prepared By**: Claude Code AI Assistant
**Date**: 2025-12-09
**Status**: Awaiting founder browser diagnostics
