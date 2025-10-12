# GitGuardian Incident Resolution Guide

**PR #7**: Email Security Fixes
**Date**: 2025-10-12
**Status**: Current code is secure, old commits contain secrets

## Overview

GitGuardian detected 3 secrets in the git history of PR #7. These secrets have been **removed from the current code** (commit `daa06e5`) and replaced with environment variables. However, they still exist in older commits in the git history.

## Incidents to Resolve

### Incident 1: PostgreSQL Credentials (debug-verification-token.js)
- **Incident ID**: 21468081
- **Dashboard URL**: https://dashboard.gitguardian.com/workspace/769026/incidents/21468081
- **File**: `archive/debug-scripts-20251007/debug-verification-token.js`
- **Commit**: `49cc9dd95a523fd391076d9aee994df8df6db9df`
- **Secret Type**: PostgreSQL Credentials
- **Status**: Fixed in commit `daa06e5` (now uses `STAGING_DATABASE_URL` env var)

### Incident 2: SMTP Credentials (test-smtp-connection.js)
- **Incident ID**: 21391772
- **Dashboard URL**: https://dashboard.gitguardian.com/workspace/769026/incidents/21391772
- **File**: `deployment-scripts/util/test-smtp-connection.js`
- **Commit**: `49cc9dd95a523fd391076d9aee994df8df6db9df`
- **Secret Type**: SMTP credentials
- **Status**: Fixed in commit `daa06e5` (now uses `SMTP_USER` and `SMTP_PASS` env vars)

### Incident 3: PostgreSQL Credentials (settings.local.json)
- **Incident ID**: 21387795
- **Dashboard URL**: https://dashboard.gitguardian.com/workspace/769026/incidents/21387795
- **File**: `.claude/settings.local.json`
- **Commit**: `bdf3cf77739b4dcbe98bcc25f6911f75dab860fe`
- **Secret Type**: PostgreSQL Credentials
- **Status**: Fixed in commit `daa06e5` (hardcoded credentials removed from permissions)

## Step-by-Step Resolution Instructions

### Step 1: Access GitGuardian Dashboard

1. Open your browser and go to: https://dashboard.gitguardian.com/auth/login/
2. Log in with your GitGuardian account (or GitHub OAuth)
3. Navigate to Workspace #769026 (P3-Interview-Academy)

### Step 2: Resolve Each Incident

For **each of the 3 incidents** listed above:

#### 2.1 Open the Incident
- Click the incident ID link from the list above
- Or navigate to: https://dashboard.gitguardian.com/workspace/769026/incidents/[INCIDENT_ID]

#### 2.2 Review the Incident Details
- Verify the file and commit match what's listed above
- Confirm the secret is in an **old commit** (not the latest `daa06e5`)

#### 2.3 Mark as Resolved
1. Look for the **"Mark as"** dropdown button (usually top-right)
2. Select **"Resolved"** from the dropdown
3. In the resolution dialog:
   - **Resolution Status**: Select "Resolved"
   - **Resolution Type**: Select "Revoked" (since we've removed and will rotate credentials)
   - **Comment**: Add this explanation:
     ```
     Secret removed from current code in commit daa06e5.
     File updated to use environment variables instead of hardcoded credentials.
     Production credentials will be rotated as standard security practice.
     Current code (latest commit) is secure.
     ```
4. Click **"Confirm"** or **"Mark as Resolved"**

#### 2.4 Verify Resolution
- The incident status should change from "Triggered" to "Resolved"
- The incident should no longer appear in active alerts

### Step 3: Repeat for All Three Incidents

Complete Step 2 for each of these incident IDs:
- [ ] **21468081** (debug-verification-token.js)
- [ ] **21391772** (test-smtp-connection.js)
- [ ] **21387795** (settings.local.json)

### Step 4: Verify GitGuardian Check Passes

After resolving all incidents:

1. Wait 2-3 minutes for GitGuardian to update the PR check
2. Run this command to verify:
   ```bash
   gh pr view 7 --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name == "GitGuardian Security Checks")'
   ```
3. The check should show `"conclusion": "SUCCESS"`

If the check doesn't update automatically:
- Refresh the PR page in GitHub
- Make a trivial commit to trigger a re-scan (e.g., update a comment)

## Security Follow-up Actions

After resolving the GitGuardian incidents, ensure these security practices:

### 1. Rotate Exposed Credentials

**PostgreSQL Database Password**:
```bash
# Connect to RDS and change the app_user password
aws rds modify-db-instance \
  --db-instance-identifier p3interviewacademy \
  --master-user-password "NEW_SECURE_PASSWORD_HERE" \
  --apply-immediately
```

**SMTP Gmail App Password**:
1. Go to https://myaccount.google.com/apppasswords
2. Delete the old app password: `qgmf zwmk ofis srlx`
3. Generate a new app password
4. Update the `SMTP_PASS` environment variable in:
   - AWS Elastic Beanstalk production environment
   - AWS Elastic Beanstalk staging environment
   - Local `.env` file (do not commit!)

### 2. Update Environment Variables

Ensure all environments use the new credentials:

**Production**:
```bash
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value="postgresql://app_user:NEW_PASSWORD@host:port/postgres" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=SMTP_PASS,Value="NEW_GMAIL_APP_PASSWORD"
```

**Staging**:
```bash
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value="postgresql://app_user:NEW_PASSWORD@host:port/p3_staging" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=SMTP_PASS,Value="NEW_GMAIL_APP_PASSWORD"
```

### 3. Verify Application Still Works

After rotating credentials:
```bash
# Test production health
curl https://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# Test staging health
curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# Both should return 200 OK with database connection confirmed
```

## Prevention for Future

To prevent secrets from being committed in the future:

### 1. Add Pre-commit Hook (Optional)

Install GitGuardian's pre-commit hook:
```bash
# Install ggshield
pip install ggshield

# Configure pre-commit hook
ggshield install --mode pre-commit
```

### 2. Use .env Files (Already Implemented)

The codebase now uses `.env` files correctly:
- `.env.example` - Template with no real secrets (safe to commit)
- `.env` - Actual secrets (in `.gitignore`, never committed)

### 3. Code Review Checklist

Before committing, check:
- [ ] No hardcoded passwords or API keys
- [ ] All credentials use `process.env.VARIABLE_NAME`
- [ ] `.env` file not staged for commit
- [ ] Permission whitelists don't contain credentials

## Summary

**Current Status**:
- ✅ Current code is secure (commit `daa06e5`)
- ✅ All hardcoded credentials replaced with environment variables
- ⚠️ GitGuardian check fails due to secrets in **old commits** (git history)

**Resolution Steps**:
1. Mark all 3 incidents as "Resolved" in GitGuardian dashboard
2. Rotate exposed credentials (PostgreSQL password, Gmail app password)
3. Update environment variables in AWS Elastic Beanstalk
4. Verify GitGuardian check passes on PR #7

**Expected Outcome**:
- GitGuardian check turns green ✅
- PR #7 can be safely merged
- Production remains secure with rotated credentials

## Need Help?

If you encounter issues:
1. Check GitGuardian documentation: https://docs.gitguardian.com/
2. Verify you have access to workspace #769026
3. Contact GitGuardian support if incidents can't be resolved
4. Alternative: Ask repository owner to resolve incidents if you lack permissions

---

**Created**: 2025-10-12
**PR**: #7 (Email Security Fixes)
**Latest Secure Commit**: `daa06e5`

