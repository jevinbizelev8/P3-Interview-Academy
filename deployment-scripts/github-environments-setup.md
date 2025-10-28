# GitHub Environments Setup Guide

Quick reference for configuring GitHub Environments for the CI/CD approval workflow.

---

## Prerequisites

- ✅ Repository admin access
- ✅ GitHub Pro/Team/Enterprise account (for protected environments)
- ✅ AWS secrets ready (`DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`, etc.)

---

## Setup Steps

### 1. Access Environments Settings

1. Navigate to repository: `https://github.com/jevinbizelev8/P3-Interview-Academy`
2. Click **Settings** (top menu)
3. Click **Environments** (left sidebar)

### 2. Create Staging Environment

1. Click **New environment**
2. **Name**: `staging`
3. Click **Configure environment**

**Configuration**:
- **Environment protection rules**: None (leave unchecked)
- **Deployment branches**: `Selected branches` → Add `main`
- **Environment secrets**:
  - Click **Add secret**
  - Add each secret:
    ```
    DATABASE_URL = <staging database URL>
    SESSION_SECRET = <staging session secret>
    OPENAI_API_KEY = <OpenAI API key>
    AWS_ACCESS_KEY_ID = <AWS access key>
    AWS_SECRET_ACCESS_KEY = <AWS secret key>
    AWS_ACCOUNT_ID = <AWS account ID>
    ```

4. Click **Save protection rules**

### 3. Create Production Environment

1. Click **New environment**
2. **Name**: `production`
3. Click **Configure environment**

**Configuration**:

#### Protection Rules
- ✅ **Required reviewers**:
  - Click **Add reviewers**
  - Select repository admins (e.g., yourself)
  - Click **Save protection rules**
- ⏸️ **Wait timer**: 0 minutes (optional)
- ⚠️ **Prevent self-review**: Enabled (recommended if multiple admins)

#### Deployment Branches
- **Deployment branches**: `Selected branches` → Add `main`

#### Environment Secrets
- Click **Add secret**
- Add each secret:
  ```
  DATABASE_URL = <production database URL>
  SESSION_SECRET = <production session secret>
  OPENAI_API_KEY = <OpenAI API key>
  AWS_ACCESS_KEY_ID = <AWS access key>
  AWS_SECRET_ACCESS_KEY = <AWS secret key>
  AWS_ACCOUNT_ID = <AWS account ID>
  ```

4. Click **Save protection rules**

---

## Verification Checklist

After setup, verify:

- [ ] Two environments exist: `staging` and `production`
- [ ] Staging has no protection rules
- [ ] Production has required reviewers configured
- [ ] Both environments have deployment branch set to `main`
- [ ] All required secrets are added to both environments
- [ ] Test deployment workflow (see below)

---

## Test the Setup

1. **Make a test commit**:
   ```bash
   # On main branch
   echo "# Test deployment workflow" >> README.md
   git add README.md
   git commit -m "test: verify GitHub Environments workflow"
   git push origin main
   ```

2. **Monitor workflow**:
   - Navigate to **Actions** tab
   - Click on the running workflow
   - Verify progress:
     - ✅ Test job completes
     - ✅ Build job completes
     - ✅ Deploy-staging job completes
     - ✅ Smoke-tests job completes
     - ⏸️ Deploy-production job waits for approval

3. **Approve production deployment**:
   - Click **Review deployments** (yellow banner)
   - Select `production` checkbox
   - Add comment: "Testing approval workflow"
   - Click **Approve and deploy**
   - Verify production deployment completes

4. **Verify health**:
   ```bash
   # Check staging
   curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

   # Check production
   curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
   ```

---

## Common Issues

### Issue: "Resource not accessible by integration"

**Cause**: GitHub Actions doesn't have permission to read environments

**Solution**:
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
3. Click **Save**

### Issue: No approval button shows

**Cause**: Not configured as required reviewer

**Solution**:
1. Go to **Settings** → **Environments** → **production**
2. Under **Required reviewers**, add your GitHub username
3. Click **Save protection rules**

### Issue: Secrets not available in workflow

**Cause**: Secrets not set in environment

**Solution**:
1. Go to **Settings** → **Environments** → Select environment
2. Click **Add secret**
3. Add missing secrets
4. Re-run workflow

---

## Environment Secret Reference

### Required Secrets

Both `staging` and `production` need:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `SESSION_SECRET` | Express session encryption key | `<random 64-char string>` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `<secret>` |
| `AWS_ACCOUNT_ID` | AWS account ID | `123456789012` |

### Optional Secrets

| Secret Name | Description |
|------------|-------------|
| `SEALION_API_KEY` | SeaLion AI API key (fallback) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key (fallback) |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | Email SMTP username |
| `SMTP_PASS` | Email SMTP password |

---

## Maintenance

### Adding New Secrets

1. Go to **Settings** → **Environments** → Select environment
2. Click **Add secret**
3. Enter name and value
4. Click **Add secret**

### Updating Secrets

1. Go to **Settings** → **Environments** → Select environment
2. Find secret in list
3. Click **Update**
4. Enter new value
5. Click **Update secret**

### Managing Reviewers

**Add Reviewer**:
1. Go to **Settings** → **Environments** → **production**
2. Under **Required reviewers**, click **Add reviewers**
3. Search for user or team
4. Click **Save protection rules**

**Remove Reviewer**:
1. Click **X** next to reviewer name
2. Click **Save protection rules**

---

## Additional Resources

- **Full Deployment Guide**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Architecture Overview**: [CLAUDE.md](../CLAUDE.md)
- **GitHub Docs**: [Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

---

**Last Updated**: 2025-10-28
