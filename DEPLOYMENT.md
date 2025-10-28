# DEPLOYMENT.md

Comprehensive deployment guide for P3 Interview Academy.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [GitHub Environments Setup](#github-environments-setup)
3. [CI/CD Workflows](#cicd-workflows)
4. [Deployment Procedures](#deployment-procedures)
5. [Approval Workflow](#approval-workflow)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview

P3 Interview Academy uses a multi-stage deployment pipeline with automated testing and manual approval gates to ensure safe production deployments.

### Deployment Flow

```
Feature Branch → PR → Staging (Auto) → Review
                                       ↓
Main Branch → Staging (Auto) → Smoke Tests → Approval Gate → Production (Auto)
```

### Environments

- **Development**: Local development (`npm run dev`)
- **Staging**: `p3-interview-academy-staging` (AWS EB)
- **Production**: `p3-interview-academy-prod-v2` (AWS EB)

---

## GitHub Environments Setup

GitHub Environments provide deployment protection rules and environment-specific secrets.

### Prerequisites

- Repository admin access
- GitHub Pro/Team/Enterprise account (for required reviewers)

### Step 1: Create Environments

1. Navigate to repository **Settings** → **Environments**
2. Click **New environment**

#### Create Staging Environment

1. **Name**: `staging`
2. **Protection Rules**: None (auto-deploy)
3. **Environment Secrets**:
   - `DATABASE_URL`: Staging database connection string
   - `SESSION_SECRET`: Staging session secret
   - `OPENAI_API_KEY`: OpenAI API key (shared or staging-specific)
   - Any other staging-specific secrets
4. **Deployment branches**: Select `main` only
5. Click **Save protection rules**

#### Create Production Environment

1. **Name**: `production`
2. **Protection Rules**:
   - ✅ **Required reviewers**: Add repository admins (e.g., yourself)
   - ✅ **Wait timer**: 0 minutes (optional: add delay if needed)
   - ⚠️ **Prevent self-review**: Recommended if multiple admins
3. **Environment Secrets**:
   - `DATABASE_URL`: Production database connection string
   - `SESSION_SECRET`: Production session secret
   - `OPENAI_API_KEY`: OpenAI API key (production-specific)
   - Any other production-specific secrets
4. **Deployment branches**: Select `main` only
5. Click **Save protection rules**

### Step 2: Verify Environment Configuration

1. Go to **Settings** → **Environments**
2. Verify both `staging` and `production` environments exist
3. Verify production has **Required reviewers** configured
4. Verify secrets are set for each environment

### Step 3: Test the Setup

1. Make a small change to code (e.g., update a comment)
2. Commit and push to `main` branch
3. Navigate to **Actions** tab
4. Watch the workflow progress:
   - ✅ Tests should pass
   - ✅ Build should complete
   - ✅ Staging deployment should succeed
   - ✅ Smoke tests should pass
   - ⏸️ Production deployment should wait for approval

---

## CI/CD Workflows

### Workflow Files

Located in `.github/workflows/`:

1. **`deploy-main.yml`** - Main branch deployment (staging → production)
2. **`deploy-eb-staging.yml`** - PR-based staging deployments
3. **`opslog-seed.yml`** - Monthly ops log generation

### Main Branch Deployment Workflow

**File**: `.github/workflows/deploy-main.yml`

**Trigger**: Push to `main` branch (excluding markdown/docs changes)

**Jobs**:
1. **test** - Run TypeScript checks and test suite
2. **build** - Build application once, upload artifact
3. **deploy-staging** - Deploy to staging environment
4. **smoke-tests** - Run automated validation tests
5. **deploy-production** - Deploy to production (requires approval)
6. **summary** - Generate deployment summary

**Key Features**:
- Single build artifact for both environments
- Automated smoke tests before production
- Manual approval gate via GitHub Environments
- Health verification after each deployment
- Automatic cleanup of old versions

### PR-Based Staging Workflow

**File**: `.github/workflows/deploy-eb-staging.yml`

**Trigger**: Pull request to `main` branch

**Purpose**: Test changes in staging before merging

**Features**:
- Automatic staging deployment on PR creation/updates
- PR comment with staging URL
- Independent of main branch workflow

---

## Deployment Procedures

### Standard Deployment (Recommended)

1. **Develop & Test Locally**
   ```bash
   npm run dev
   npm run check
   npm run test:run
   ```

2. **Create Pull Request**
   - Push branch to GitHub
   - Create PR to `main`
   - Automatic staging deployment triggered
   - Review staging URL in PR comment

3. **Review & Test in Staging**
   - Test functionality in staging environment
   - Verify changes work as expected
   - Get code review approval

4. **Merge to Main**
   - Merge PR to `main` branch
   - **Main deployment workflow triggered automatically**:
     - ✅ Tests run
     - ✅ Application built
     - ✅ Deployed to staging
     - ✅ Smoke tests run
     - ⏸️ **Waits for production approval**

5. **Approve Production Deployment**
   - See [Approval Workflow](#approval-workflow) section
   - Navigate to Actions → Select workflow run
   - Click **Review deployments**
   - Select **production**
   - Click **Approve and deploy**

6. **Monitor Production Deployment**
   - Watch workflow complete production deployment
   - Verify health checks pass
   - Test production environment

### Emergency Hotfix Deployment

For critical production issues:

1. **Create hotfix branch from main**
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-issue
   ```

2. **Make minimal changes**
   - Fix only the critical issue
   - Test locally

3. **Fast-track deployment**
   - Create PR (triggers staging deployment)
   - Test in staging immediately
   - Merge to main as soon as validated
   - Approve production deployment immediately

### Rollback Procedure

If production deployment fails or introduces issues:

1. **Via GitHub Actions** (recommended):
   ```bash
   # Find previous successful deployment version
   aws elasticbeanstalk describe-application-versions \
     --application-name p3-interview-academy \
     --query 'ApplicationVersions[?Status==`PROCESSED`].[VersionLabel,DateCreated]' \
     --output table

   # Deploy previous version
   aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-prod-v2 \
     --version-label <PREVIOUS_VERSION_LABEL>
   ```

2. **Via AWS Console**:
   - Navigate to Elastic Beanstalk
   - Select `p3-interview-academy-prod-v2`
   - Click **Application versions**
   - Select previous working version
   - Click **Deploy**

---

## Approval Workflow

### How to Approve Production Deployments

When a deployment to `main` is triggered, the workflow will pause at the production deployment job.

#### Step 1: Receive Notification

- GitHub will send notifications to required reviewers
- Check email or GitHub notifications
- Look for "Waiting for approval" status

#### Step 2: Review Deployment

1. Go to repository **Actions** tab
2. Click on the waiting workflow run
3. Review the workflow progress:
   - ✅ Verify tests passed
   - ✅ Verify build succeeded
   - ✅ Verify staging deployment succeeded
   - ✅ Verify smoke tests passed
4. Click on **Review deployments** button (yellow banner at top)

#### Step 3: Approve or Reject

**Approval Dialog**:
- Environment: `production`
- Checkbox: Select `production`
- Comment (optional): Add approval notes
- Click **Approve and deploy**

**To Reject**:
- Leave checkbox unchecked
- Add comment explaining rejection
- Click **Reject**

#### Step 4: Monitor Production Deployment

After approval:
- Workflow resumes automatically
- Production deployment proceeds
- Health checks run
- Workflow completes

### Approval Best Practices

✅ **Do**:
- Verify all smoke tests passed
- Check staging environment works correctly
- Review code changes being deployed
- Add approval comments for audit trail
- Approve within reasonable time (workflow times out after 30 days)

❌ **Don't**:
- Approve without reviewing smoke test results
- Approve if staging has issues
- Skip verification steps
- Approve deployments you didn't initiate (unless expected)

---

## Manual Deployment

For situations where CI/CD is unavailable or troubleshooting is needed.

### Prerequisites

```bash
# Install dependencies
npm ci

# Configure AWS CLI
aws configure
# Or use environment variables:
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="ap-southeast-1"
```

### Manual Deployment to Staging

```bash
# 1. Build application
npm run build

# 2. Create deployment bundle
bash deployment-scripts/create-deployment-bundle.sh

# 3. Deploy to staging
bash deployment-scripts/deploy-to-eb.sh staging

# 4. Verify deployment
curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

### Manual Deployment to Production

```bash
# 1. Build application
npm run build

# 2. Create deployment bundle
bash deployment-scripts/create-deployment-bundle.sh

# 3. Deploy to production
bash deployment-scripts/deploy-to-eb.sh production

# 4. Verify deployment
curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
```

### Full Deployment Script

```bash
# Interactive deployment script (recommended)
bash deployment-scripts/full-deployment.sh
```

This script will:
1. Validate environment
2. Run tests
3. Build application
4. Create deployment bundle
5. Deploy to selected environment
6. Verify deployment

---

## Troubleshooting

### Common Issues

#### Issue: "Waiting for approval" times out

**Solution**:
- Approvals expire after 30 days
- Re-run the workflow from GitHub Actions
- Or merge a new commit to trigger fresh deployment

#### Issue: Smoke tests fail

**Causes**:
- Staging deployment unhealthy
- Database connectivity issues
- API endpoint changes

**Solution**:
1. Check staging health: `curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health`
2. Review smoke test logs in GitHub Actions
3. Fix issues and push new commit
4. Or skip smoke tests via manual workflow dispatch (not recommended)

#### Issue: Production deployment fails

**Solution**:
1. Check AWS EB logs:
   ```bash
   aws elasticbeanstalk describe-events \
     --environment-name p3-interview-academy-prod-v2 \
     --max-items 20
   ```
2. Check health status:
   ```bash
   aws elasticbeanstalk describe-environments \
     --environment-names p3-interview-academy-prod-v2
   ```
3. Rollback to previous version (see [Rollback Procedure](#rollback-procedure))

#### Issue: Environment secrets missing

**Solution**:
1. Go to **Settings** → **Environments** → Select environment
2. Add missing secrets
3. Re-run workflow

### Deployment Scripts

Useful scripts in `deployment-scripts/`:

- **`check-environment-status.sh`** - Check EB environment health
- **`verify-database.sh`** - Verify database connectivity
- **`smoke-tests.ts`** - Run smoke tests manually
  ```bash
  npx tsx deployment-scripts/smoke-tests.ts http://staging-url
  ```

### AWS CLI Commands

```bash
# Check environment status
aws elasticbeanstalk describe-environments \
  --environment-names p3-interview-academy-prod-v2

# View recent events
aws elasticbeanstalk describe-events \
  --environment-name p3-interview-academy-prod-v2 \
  --max-items 20

# List application versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy

# View environment health
aws elasticbeanstalk describe-environment-health \
  --environment-name p3-interview-academy-prod-v2 \
  --attribute-names All
```

### Health Check URLs

- **Production**: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health`
- **Staging**: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health`

### Support

For additional help:
- Check **[CLAUDE.md](CLAUDE.md)** for architecture overview
- Review **[ops-log/](deployment-scripts/ops-log/)** for recent deployment history
- Check **[SECURITY.md](SECURITY.md)** for credential management

---

**Last Updated**: 2025-10-28
**Document Version**: 1.0 (Initial)
