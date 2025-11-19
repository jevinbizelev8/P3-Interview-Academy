# GitHub Actions Setup for Telegram Approval

This guide explains how to configure GitHub Actions to use Telegram-based approval gates for production deployments.

## Overview

The P3 Interview Academy deployment workflow now sends Telegram notifications for production deployment approvals. This enables:

- **Real-time Mobile Notifications**: Instant alerts when deployments need approval
- **Deployment Context**: See commit details, author, and staging URL on your phone
- **Quick Access**: Direct links to GitHub Actions workflow for approval
- **Success/Failure Notifications**: Get notified when deployments complete or fail

**Note**: Approval is still done via GitHub's manual approval interface (Environment protection rules). Telegram serves as a notification system to alert you when approval is needed, allowing you to quickly access the GitHub Actions page to approve or reject.

## Workflow Integration

The deployment workflow follows this sequence:

1. **Tests** → Run TypeScript checks and Vitest tests
2. **Build** → Create deployment bundle
3. **Deploy to Staging** → Deploy to AWS Elastic Beanstalk staging environment
4. **Smoke Tests** → Validate staging deployment
5. **🆕 Telegram Notification** → Send notification that approval is needed
6. **🔒 Manual Approval Gate** → GitHub Environment protection (requires admin approval)
7. **Deploy to Production** → Deploy to production after approval
8. **🆕 Success/Failure Notification** → Send Telegram status update

## Required GitHub Secrets

You must add the following secrets to your GitHub repository for Telegram integration to work:

### 1. TELEGRAM_BOT_TOKEN

Your Telegram bot's authentication token.

**How to Get It:**
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create bot
4. Copy the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

**How to Add Secret:**
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `TELEGRAM_BOT_TOKEN`
5. Value: Paste your bot token
6. Click **Add secret**

### 2. TELEGRAM_CHAT_ID

The chat ID where deployment notifications will be sent.

**How to Get It:**

**Option A - Using get_chat_id.sh script:**
```bash
cd scripts/telegram
./get_chat_id.sh
```

**Option B - Manual method:**
1. Send a message to your bot in Telegram
2. Visit: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":` in the response
4. Copy the numeric ID (e.g., `123456789`)

**How to Add Secret:**
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `TELEGRAM_CHAT_ID`
5. Value: Paste your chat ID (numeric value)
6. Click **Add secret**

## Verification

After adding the secrets, verify the setup:

### 1. Check Secrets Are Added

Go to **Settings** → **Secrets and variables** → **Actions**

You should see:
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `TELEGRAM_CHAT_ID`

### 2. Test the Workflow

**Option A - Push to main branch:**
```bash
git checkout main
git commit --allow-empty -m "test: verify Telegram approval integration"
git push origin main
```

**Option B - Manual workflow dispatch:**
1. Go to **Actions** tab in GitHub
2. Select **Deploy Main to Production (via Staging)**
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

### 3. Expected Telegram Notifications

When the workflow reaches the approval stage, you should receive:

```
🚀 **Production Deployment Ready for Approval**

**Branch**: main
**Commit**: `abc123d`
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

## Approval Process

### Approving a Deployment

**1. Click the workflow link in the Telegram notification**

The link will take you directly to the GitHub Actions workflow run.

**2. Click "Review deployments" button**

You'll see a prompt to review pending deployments for the Production environment.

**3. Select "Production" and click "Approve and deploy"**

Optionally add a comment explaining the approval decision.

**Result:**
- ✅ GitHub Actions workflow proceeds to production deployment
- You receive success/failure notification via Telegram after deployment completes

### Rejecting a Deployment

**1. Click the workflow link in the Telegram notification**

**2. Click "Review deployments" button**

**3. Select "Production" and click "Reject"**

Add a comment explaining why the deployment is being rejected.

**Result:**
- ❌ GitHub Actions workflow cancels production deployment
- Workflow marked as failed
- No production deployment occurs

## Troubleshooting

### Approval Button Not Appearing

**Problem**: Can't find "Review deployments" button in GitHub Actions

**Solutions:**

1. **Check Environment protection is configured:**
   - Go to repository **Settings** → **Environments**
   - Verify "Production" environment exists
   - Ensure "Required reviewers" is configured

2. **Verify you have approval permissions:**
   - Only repository admins or designated reviewers can approve
   - Check your GitHub permissions

3. **Refresh the workflow page:**
   - Sometimes the button takes a few seconds to appear

### Notifications Not Received

**Problem**: Not receiving Telegram messages

**Solutions:**

1. **Verify bot token is correct:**
   ```bash
   # Test bot token
   curl https://api.telegram.org/bot<BOT_TOKEN>/getMe
   ```

2. **Verify chat ID is correct:**
   ```bash
   # Check updates
   curl https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```

3. **Check GitHub Secrets are set:**
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` exist

4. **Check bot permissions:**
   - Ensure you've started a chat with the bot
   - Send `/start` command to the bot

### Workflow Stuck at Approval Step

**Problem**: Workflow waits indefinitely for approval

**Solutions:**

1. **Check if approval is required:**
   - GitHub Environment protection may be blocking deployment
   - Look for "Waiting for approval" status in workflow

2. **Approve via GitHub UI:**
   - Click the workflow link
   - Click "Review deployments"
   - Approve the deployment

3. **Check Environment protection rules:**
   - Settings → Environments → Production
   - Verify required reviewers are configured correctly

## Security Considerations

### Approval Security

- **GitHub Environment Protection**: Leverages GitHub's built-in security features
- **Role-Based Access**: Only designated reviewers can approve deployments
- **Audit Trail**: All approvals are logged in GitHub Actions history
- **Two-Factor Authentication**: Supports GitHub 2FA for approvals

### Secret Management

- **Never commit secrets**: GitHub Secrets are encrypted and only accessible to workflows
- **Rotate tokens regularly**: Change bot token periodically for security
- **Restrict access**: Only repository admins should have access to add/modify secrets

## Advanced Configuration

### Customizing Notification Message

Edit the notification message in `.github/workflows/deploy-main.yml`:

```yaml
- name: Send Telegram notification
  run: |
    APPROVAL_MESSAGE="🚀 **Production Deployment Ready for Approval**

    [Customize message here]

    **Workflow**: ${{ steps.metadata.outputs.workflow_url }}"
```

### Adding Additional Notification Channels

To send notifications to multiple chats:

1. Get additional chat IDs
2. Add them as GitHub Secrets (`TELEGRAM_CHAT_ID_2`, etc.)
3. Modify workflow to send to multiple recipients:

```yaml
- name: Send Telegram notification
  run: |
    bash scripts/telegram/github-actions-notify.sh "$APPROVAL_MESSAGE"
    # Send to second chat
    TELEGRAM_CHAT_ID="${{ secrets.TELEGRAM_CHAT_ID_2 }}" \
      bash scripts/telegram/github-actions-notify.sh "$APPROVAL_MESSAGE"
```

### Configuring Environment Protection

To set up manual approval gates:

1. Go to repository **Settings** → **Environments**
2. Click **New environment** or edit **Production**
3. Enable **Required reviewers**
4. Add reviewers (GitHub usernames)
5. Optionally set **Wait timer** (delay before deployment can proceed)
6. Click **Save protection rules**

## Related Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete Telegram system setup
- **[DEPLOYMENT_TESTING.md](DEPLOYMENT_TESTING.md)** - How to test deployments
- **[API_REFERENCE.md](API_REFERENCE.md)** - Webhook API details
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## Support

For issues with GitHub Actions integration:

1. Check workflow logs in **Actions** tab
2. Review Telegram webhook logs: `pm2 logs telegram-webhook`
3. Consult [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. Contact DevOps team via #p3-redesign Slack channel
