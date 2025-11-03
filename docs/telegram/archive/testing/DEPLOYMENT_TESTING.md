# Deployment Testing Guide

This guide explains how to test the Telegram-integrated deployment workflow for P3 Interview Academy.

## Overview

The deployment workflow uses Telegram for production approvals. This guide covers:

- How to trigger test deployments
- What to expect in Telegram notifications
- How to approve/reject deployments
- Timeout and rollback procedures
- Troubleshooting deployment issues

## Prerequisites

Before testing deployments, ensure:

1. ✅ **GitHub Secrets configured**: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
2. ✅ **Telegram bot created**: Via @BotFather
3. ✅ **Webhook server running**: Telegram webhook server is operational
4. ✅ **Repository access**: Push access to main branch or workflow dispatch permissions

See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) for setup instructions.

## Deployment Workflow Stages

The complete deployment workflow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Tests (TypeScript + Vitest)                              │
│    Duration: ~2-3 minutes                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Build Application                                         │
│    Duration: ~1-2 minutes                                    │
│    Output: deployment-YYYYMMDD-HHMMSS.zip                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Deploy to Staging                                         │
│    Duration: ~5-7 minutes                                    │
│    URL: http://p3-interview-academy-staging...               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Run Smoke Tests                                           │
│    Duration: ~1-2 minutes                                    │
│    Tests: Health, Auth, Prepare, Practice modules           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Send Telegram Notification                                │
│    Duration: Instant                                         │
│    Alert: Approval needed, with workflow link               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Manual Approval Gate (GITHUB)                            │
│    Duration: Wait for reviewer (configurable)               │
│    Action Required: Approve via GitHub Actions UI           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Deploy to Production                                      │
│    Duration: ~5-7 minutes                                    │
│    URL: http://p3-interview-academy-prod-v2...               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Success/Failure Notification (TELEGRAM)                   │
│    Duration: Instant                                         │
└─────────────────────────────────────────────────────────────┘
```

**Total Duration**: 15-30 minutes (including manual approval time)

## Triggering Test Deployments

### Method 1: Push to Main Branch (Recommended)

This simulates a real deployment scenario:

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Make a test change (empty commit)
git commit --allow-empty -m "test: verify Telegram approval integration"

# Push to trigger deployment
git push origin main
```

**Expected Result**: Workflow automatically starts within 10-20 seconds

### Method 2: Manual Workflow Dispatch

Trigger workflow without pushing code:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy Main to Production (via Staging)**
4. Click **Run workflow** button
5. Select branch: `main`
6. Optional: Check **Skip tests** or **Skip smoke tests** for faster testing
7. Click **Run workflow**

**Expected Result**: Workflow starts immediately

### Method 3: Pull Request to Main

For testing staging-only deployment:

```bash
# Create feature branch
git checkout -b test/telegram-approval

# Make changes
git commit -m "test: telegram approval"

# Push and create PR
git push origin test/telegram-approval
```

**Expected Result**: Staging deployment only (no production approval)

## Telegram Notification Format

### Approval Request Notification

When smoke tests pass, you'll receive:

```
🚀 **Production Deployment Ready for Approval**

**Branch**: main
**Commit**: `a1b2c3d`
**Author**: your-github-username

✅ Tests Passed
✅ Build Successful
✅ Staging Deployed
✅ Smoke Tests Passed

**Staging URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

**Action Required**: Approve deployment via GitHub Actions
**Workflow**: https://github.com/your-org/P3-Interview-Academy/actions/runs/123456789

⏱️ Waiting for manual approval...

[2025-11-01 14:32:15]
```

### Success Notification

After successful production deployment:

```
✅ **Production Deployment Successful**

**Environment**: p3-interview-academy-prod-v2
**Commit**: `a1b2c3d4e5f6789012345678901234567890abcd`
**Author**: your-github-username
**Production URL**: http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

🎉 Deployment completed and verified!

[2025-11-01 14:45:28]
```

### Failure Notification

If production deployment fails:

```
❌ **Production Deployment Failed**

**Environment**: p3-interview-academy-prod-v2
**Commit**: `a1b2c3d4e5f6789012345678901234567890abcd`
**Author**: your-github-username
**Workflow**: https://github.com/your-org/P3-Interview-Academy/actions/runs/123456789

⚠️ Please check logs and investigate immediately!

[2025-11-01 14:45:28]
```

### Timeout Notification

If approval not received within 15 minutes:

```
⏰ **Deployment Timeout**: No approval received within 15 minutes. Production deployment cancelled.

[2025-11-01 14:47:15]
```

## Approval Process

### Approving a Deployment

**1. Click the workflow link in the Telegram notification**

The link will take you directly to the GitHub Actions workflow run.

**2. Look for "Review deployments" button**

It appears in a yellow banner at the top of the workflow page.

**3. Click "Review deployments"**

A modal will appear showing pending deployment approvals.

**4. Select "Production" checkbox**

**5. Optionally add a comment**

Example: "Approved after testing staging environment"

**6. Click "Approve and deploy"**

**Result:**
- ✅ Workflow proceeds to production deployment
- Production deployment starts within seconds
- You'll receive success/failure notification after ~5-7 minutes

### Rejecting a Deployment

**1. Click the workflow link in the Telegram notification**

**2. Click "Review deployments"**

**3. Select "Production" checkbox**

**4. Add a comment explaining rejection**

Example: "Rejecting due to failing smoke tests in staging"

**5. Click "Reject"**

**Result:**
- ❌ Workflow stops and marks as failed
- Production deployment does not occur
- Workflow summary shows deployment was rejected

## Verification Steps

### After Approval

**1. Monitor GitHub Actions workflow:**

- Go to **Actions** tab
- Watch deployment progress
- Check for "Deploy to Production" job

**2. Verify staging URL:**

```bash
# Test staging health endpoint
curl -f http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "main-20251101-143215"
}
```

**3. Wait for production deployment to complete (~5-7 minutes)**

**4. Verify production URL:**

```bash
# Test production health endpoint
curl -f http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

**5. Check for success notification in Telegram**

### After Rejection

**1. Verify workflow failed:**

- Go to **Actions** tab
- Workflow should show red X (failed)
- Check "Request Production Approval" step shows failure

**2. Verify production was NOT deployed:**

```bash
# Get current production version
aws elasticbeanstalk describe-environments \
  --environment-names p3-interview-academy-prod-v2 \
  --query 'Environments[0].VersionLabel' \
  --output text
```

Version should NOT have changed

## Rollback Procedures

### If Production Deployment Fails

**1. Immediate Actions:**

- Check failure notification in Telegram
- Review GitHub Actions logs
- Verify production health endpoint

**2. Quick Rollback via AWS Console:**

```bash
# List recent versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy \
  --query 'ApplicationVersions[:5].[VersionLabel,DateCreated]' \
  --output table

# Rollback to previous version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label <previous-version-label>
```

**3. Monitor rollback:**

```bash
# Wait for rollback to complete
aws elasticbeanstalk wait environment-updated \
  --environment-name p3-interview-academy-prod-v2

# Verify health
curl -f http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

### If Staging Deployment Fails

**1. Diagnosis:**

- Check GitHub Actions logs for staging deployment step
- Review AWS Elastic Beanstalk events:

```bash
aws elasticbeanstalk describe-events \
  --environment-name p3-interview-academy-staging \
  --max-items 20
```

**2. Fix and Retry:**

- Fix the issue in code
- Push fix to main branch
- Workflow automatically retriggers

## Troubleshooting Common Issues

### Issue 1: Approval Not Working

**Symptoms:**
- Reply with `approve <token>` but workflow keeps waiting
- No bot response after approval

**Solutions:**

1. **Check webhook server status:**
   ```bash
   pm2 status telegram-webhook
   pm2 logs telegram-webhook --lines 50
   ```

2. **Verify token matches:**
   - Copy token exactly from Telegram message
   - Check for extra spaces

3. **Check webhook registration:**
   ```bash
   curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
   ```

### Issue 2: Notifications Not Received

**Symptoms:**
- Workflow proceeds but no Telegram messages

**Solutions:**

1. **Check GitHub Secrets:**
   - Settings → Secrets and variables → Actions
   - Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` exist

2. **Test bot manually:**
   ```bash
   cd scripts/telegram/core
   ./notify.sh "Test message"
   ```

3. **Check bot permissions:**
   - Send `/start` command to bot
   - Verify bot can send messages

### Issue 3: Workflow Hangs at Approval

**Symptoms:**
- Workflow stuck waiting for approval
- Eventually times out

**Solutions:**

1. **Check approval directory:**
   - GitHub Actions creates `.approval/` directory
   - Webhook server should write approval files

2. **Check file permissions:**
   ```bash
   ls -la $GITHUB_WORKSPACE/.approval/
   ```

3. **Cancel and retry:**
   - Cancel workflow in GitHub Actions
   - Retrigger deployment

## Testing Checklist

Use this checklist for comprehensive deployment testing:

### Pre-Deployment
- [ ] GitHub Secrets configured (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- [ ] Telegram bot responds to `/start` command
- [ ] Webhook server running (`pm2 status telegram-webhook`)
- [ ] Local tests pass (`npm run test:run`)

### During Deployment
- [ ] Tests pass in GitHub Actions
- [ ] Build completes successfully
- [ ] Staging deployment succeeds
- [ ] Smoke tests pass
- [ ] Telegram approval notification received
- [ ] Approval token visible in notification

### Approval Testing
- [ ] Test approval: Reply `approve <token>`
- [ ] Bot responds with confirmation
- [ ] Workflow proceeds to production
- [ ] Test rejection: Reply `reject <token>` (separate workflow)
- [ ] Bot responds with cancellation
- [ ] Workflow fails and skips production

### Post-Deployment
- [ ] Production deployment completes
- [ ] Success notification received
- [ ] Production health endpoint returns 200
- [ ] Application functions correctly
- [ ] Database connectivity verified

### Cleanup
- [ ] Old application versions cleaned up
- [ ] GitHub Actions artifacts removed
- [ ] Logs reviewed for errors

## Performance Metrics

Expected timings for each stage:

| Stage | Duration | Notes |
|-------|----------|-------|
| Tests | 2-3 min | TypeScript + Vitest |
| Build | 1-2 min | Frontend + Backend |
| Staging Deploy | 5-7 min | AWS EB deployment |
| Smoke Tests | 1-2 min | API validation |
| **Approval Wait** | **0-15 min** | **User action required** |
| Production Deploy | 5-7 min | AWS EB deployment |
| Verification | 30 sec | Health checks |
| **Total** | **15-35 min** | **Including approval time** |

## Best Practices

### For Development Testing

1. **Use empty commits** for testing workflow without code changes
2. **Skip tests** for faster iterations (workflow dispatch option)
3. **Test in staging first** using PR-based deployments
4. **Monitor logs in real-time** via GitHub Actions UI

### For Production Deployments

1. **Review staging deployment** before approving
2. **Check smoke test results** in GitHub Actions logs
3. **Verify staging URL** manually before approval
4. **Approve promptly** to avoid timeouts
5. **Monitor production** health endpoint after deployment
6. **Document issues** in ops-log if problems occur

### For Emergency Situations

1. **Keep previous version label** handy for quick rollback
2. **Have AWS Console open** during deployment
3. **Monitor CloudWatch logs** for real-time errors
4. **Use reject option** if any concerns arise
5. **Rollback immediately** if production health check fails

## Related Documentation

- **[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** - Initial setup guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete Telegram system setup
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Detailed troubleshooting
- **[API_REFERENCE.md](API_REFERENCE.md)** - Webhook API documentation
- **[DEPLOYMENT.md](../../DEPLOYMENT.md)** - General deployment procedures

## Support

For deployment issues:

1. **Check logs**: GitHub Actions + `pm2 logs telegram-webhook`
2. **Review documentation**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **Contact DevOps**: #p3-redesign Slack channel
4. **Emergency**: Rollback immediately, investigate later
