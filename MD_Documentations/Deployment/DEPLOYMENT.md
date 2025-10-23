# P³ Interview Academy - Production Deployment Guide

This guide provides step-by-step instructions for deploying P³ Interview Academy to AWS Elastic Beanstalk.

## 🚨 Prerequisites

### Required Tools
- **Node.js 18+** - Application runtime
- **AWS CLI** - Configured with appropriate permissions
- **Git** - Version control (for source management)

### AWS Requirements
- **AWS Account** with Elastic Beanstalk permissions
- **PostgreSQL Database** (AWS RDS recommended)
- **Elastic Beanstalk Application** already created
- **S3 Bucket** for deployment artifacts (auto-created by EB)

### Database Setup
1. **PostgreSQL Database** accessible from your EB environment
2. **Database URL** in the format: `postgresql://username:password@host:port/database`
3. **Network access** configured (VPC, security groups, etc.)

## 🔧 Pre-Deployment Setup

### 1. Clone and Prepare Repository
```bash
git clone <repository-url>
cd p3-interview-academy
npm install
```

### 2. Configure Environment Variables
Run the interactive environment setup script:
```bash
chmod +x deployment-scripts/setup-environment-variables.sh
./deployment-scripts/setup-environment-variables.sh
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure random string (32+ characters)
- `NODE_ENV=production`
- `WS_ALLOWED_ORIGINS` - WebSocket CORS origins (`*` for dev, domains for prod)

**Optional API Keys:**
- `OPENAI_API_KEY` - For OpenAI GPT integration
- `SEALION_API_KEY` - For SeaLion AI integration
- `ANTHROPIC_API_KEY` - For Claude integration

### 3. Verify Database Connectivity
Test database connection and schema:
```bash
chmod +x deployment-scripts/verify-database.sh
./deployment-scripts/verify-database.sh
```

This script will:
- Test database connectivity
- Verify session table creation
- Check application schema status
- Test connection performance

### 4. Test Build Process
Verify the application builds correctly:
```bash
npm run build
```

Expected output:
- `dist/index.js` - Built backend server
- `dist/public/` - Built frontend assets

### 5. Run Schema Auditor (recommended after schema changes)
The Express bootstrap now calls `ensureCriticalSchema()` on startup to create the Prepare tables and align `interview_sessions` column names. Trigger it manually before deploying or after restoring a snapshot to keep the database consistent:
```bash
npx tsx server/services/schema-auditor.ts
```

## 🔄 GitHub Actions CI/CD Activation

Automated staging and production deployments now live in `.github/workflows/deploy-eb-staging.yml` and `.github/workflows/deploy-eb-production.yml`. Complete the following once per repository to activate the pipeline end to end.

### Step 1: Configure GitHub secrets
Set the AWS credentials GitHub Actions will use (`Settings → Secrets and variables → Actions`). Create three **repository secrets**:
- `AWS_ACCESS_KEY_ID` – IAM access key with Elastic Beanstalk, S3, and CloudWatch Logs permissions.
- `AWS_SECRET_ACCESS_KEY` – Matching secret key.
- `AWS_ACCOUNT_ID` – Twelve digit AWS account number (used to locate the EB S3 bucket).

Recommended IAM policy actions (minimum): `elasticbeanstalk:*`, `s3:*` on the EB artifact bucket, `cloudwatch:Describe*`, and `iam:PassRole` for the EB instance/profile role.

### Step 2: Provision the staging environment
Create `p3-interview-academy-staging` inside the existing Elastic Beanstalk application (`p3-interview-academy`). The simplest approach is to **clone the production environment** in the EB console and update the environment variables for staging services (database URL, feature flags, etc.).

Prefer CLI? Use a saved configuration template from production:
```bash
aws elasticbeanstalk create-environment \
  --application-name p3-interview-academy \
  --environment-name p3-interview-academy-staging \
  --cname-prefix p3-interview-academy-staging \
  --solution-stack-name "64bit Amazon Linux 2023 v4.3.1 running Node.js 20" \
  --template-name production-clone \
  --version-label placeholder-bootstrap
```
Replace `production-clone` with an EB configuration template that mirrors production capacity and networking.

### Step 3: Validate the staging workflow
1. Open the **Deploy to AWS Elastic Beanstalk Staging** workflow in the Actions tab.
2. Trigger it manually (`Run workflow`) or open a PR against `main` to let the PR event kick it off.
3. Confirm the `test` job passes (`npm ci`, `npm run check`, `npm run test:run`).
4. Watch the `deploy-staging` job upload the bundle, create the EB application version, and wait for `p3-interview-academy-staging` to turn green. The job prints the environment health and hits `/api/health` automatically.
5. For pull requests, the workflow comments with the staging URL and version label once verification succeeds.

> ⚠️ **Schema reminder:** After each staging deploy (latest `p3-interview-academy-eb-20251004-185052`), cast any `user_id` / `created_by` columns that still use `varchar` to `uuid` in the staging database, then repeat in production once staging is verified. Run `npm run db:push` or restart the API afterwards so `ensureCriticalSchema` can finish the UUID foreign keys.


**Note:** `npm run build` now triggers `npm run check` and `npm run test:run` via the `prebuild` hook, so production bundles fail fast if the AI prepare/practice tests regress.
### Step 4: Promote via production workflow
Pushes to `main` now trigger **Deploy to AWS Elastic Beanstalk Production**. The job reuses the same bundle process, waits for the green health check, and trims older application versions (keeping the newest five). You can also run it manually from the Actions tab if you need to redeploy a prior commit—set `skip_tests` to `true` only during break-glass scenarios.

### Step 5: Sunset manual scripts (optional)
The scripts under `deployment-scripts/` remain for local smoke tests, but the GitHub Actions workflows are the source of truth for deployments. Update `DEPLOYMENT.md` or deprecate the shell scripts after the team confirms the automated path in practice.

## 🚀 Deployment Process

### Method 1: Automated Deployment (Recommended)

#### Step 1: Create Deployment Bundle
```bash
chmod +x deployment-scripts/create-deployment-bundle.sh
./deployment-scripts/create-deployment-bundle.sh
```

This creates a timestamped deployment bundle (e.g., `p3-interview-academy-eb-20241201-143022.zip`)

#### Step 2: Deploy to Elastic Beanstalk
```bash
chmod +x deployment-scripts/deploy-to-eb.sh
./deployment-scripts/deploy-to-eb.sh
```

Or specify a specific bundle:
```bash
./deployment-scripts/deploy-to-eb.sh p3-interview-academy-eb-20241201-143022.zip
```

### Method 2: Manual Deployment

#### Step 1: Create Bundle Manually
```bash
npm run build
zip -r deployment-bundle.zip dist/ package.json package-lock.json .ebextensions/ shared/ node_modules/
```

#### Step 2: Upload to AWS
```bash
# Upload to S3
aws s3 cp deployment-bundle.zip s3://elasticbeanstalk-ap-southeast-1-YOUR-ACCOUNT-ID/p3-interview-academy/

# Create application version
aws elasticbeanstalk create-application-version \
  --application-name p3-interview-academy \
  --version-label manual-v1 \
  --source-bundle S3Bucket=elasticbeanstalk-ap-southeast-1-YOUR-ACCOUNT-ID,S3Key=p3-interview-academy/deployment-bundle.zip

# Deploy to environment
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label manual-v1
```

## 🔍 Post-Deployment Verification

### 1. Check Environment Status
```bash
chmod +x deployment-scripts/check-environment-status.sh
./deployment-scripts/check-environment-status.sh
```

### 2. Test Health Endpoints

**Simple Health Check (for load balancers):**
```bash
curl http://your-eb-app.region.elasticbeanstalk.com/api/health/simple
```

**Enhanced Health Check:**
```bash
curl http://your-eb-app.region.elasticbeanstalk.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T14:30:22.123Z",
  "environment": "production",
  "uptime": 157.234,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "environment": {
      "required": {
        "DATABASE_URL": true,
        "SESSION_SECRET": true
      }
    }
  }
}
```

### 3. Test Application Features
- Visit the application URL
- Test user authentication
- Verify AI services are working
- Check WebSocket connections
- Test voice features
- Start a new Practice session; a fresh chat should auto-populate the first AI question and play the voice prompt when enabled.

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Environment Health: Red
**Symptoms:** Application not responding, 5xx errors

**Debug Steps:**
```bash
# Check recent events
aws elasticbeanstalk describe-events \
  --environment-name p3-interview-academy-prod-v2 \
  --max-items 10

# Check environment status
./deployment-scripts/check-environment-status.sh
```

**Common Causes:**
- Missing environment variables (DATABASE_URL, SESSION_SECRET)
- Database connectivity issues
- Build artifacts missing from deployment bundle

#### 2. Database Connection Errors
**Symptoms:** Health check shows database as unhealthy

**Debug Steps:**
```bash
# Test database connectivity
./deployment-scripts/verify-database.sh

# Check security groups and VPC configuration
# Ensure EB environment can reach database
```

**Solutions:**
- Verify DATABASE_URL format
- Check database server accessibility
- Verify credentials and permissions

#### 3. Missing `ai_prepare_*` tables or `interview_sessions.user_id`
**Symptoms:** Logs show `relation "ai_prepare_sessions" does not exist` or column names like `user_id` missing after deployment.

**Resolution:**
- Restart the Elastic Beanstalk environment; the server runs `ensureCriticalSchema()` on boot.
- Or SSH in / run remotely:
```bash
npx tsx server/services/schema-auditor.ts
```
This will create the Prepare tables and rename any camelCase `interview_sessions` columns back to snake_case.

#### 4. Static Files Not Serving
**Symptoms:** Frontend not loading, API works

**Causes:**
- `dist/public/` directory missing from bundle
- Build process failed
- Nginx configuration issues

**Solutions:**
- Rebuild with `npm run build`
- Verify `dist/public/index.html` exists
- Check `.ebextensions/01-nodejs.config` static file configuration

#### 5. WebSocket Connection Failures
**Symptoms:** Real-time features not working

**Solutions:**
- Set `WS_ALLOWED_ORIGINS=*` for testing
- Configure proper domain origins for production
- Check load balancer WebSocket support

### Log Access

#### Application Logs
```bash
# View recent logs
aws logs tail /aws/elasticbeanstalk/p3-interview-academy-prod-v2/var/log/eb-docker/containers/eb-current-app

# Download logs bundle
aws elasticbeanstalk retrieve-environment-info \
  --environment-name p3-interview-academy-prod-v2 \
  --info-type tail
```

#### Health Check Logs
Access detailed diagnostics (requires authentication):
```bash
curl -H "Authorization: Bearer YOUR-TOKEN" \
  http://your-eb-app.region.elasticbeanstalk.com/api/diagnostics
```

## 🔄 Rollback Process

### Quick Rollback
```bash
# List recent application versions
aws elasticbeanstalk describe-application-versions \
  --application-name p3-interview-academy \
  --max-items 10

# Rollback to previous version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label PREVIOUS-VERSION-LABEL
```

### Emergency Rollback
If the environment is severely degraded:
1. Use AWS Console for faster rollback
2. Monitor the environment status during rollback
3. Verify health checks after rollback completes

## 📊 Monitoring and Maintenance

### Regular Checks
- Monitor `/api/health` endpoint for system health
- Check AWS CloudWatch metrics
- Review application logs for errors
- Monitor database performance

### Environment Updates
```bash
# Check for available platform updates
aws elasticbeanstalk list-available-solution-stacks

# Apply platform updates during maintenance windows
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --solution-stack-name "NEW-PLATFORM-VERSION"
```

### Database Maintenance
- Regular backups (if using RDS)
- Monitor connection pool usage
- Run `npm run db:push` for schema updates (with caution in production)

## 🚨 Security Considerations

### Environment Variables
- Never commit secrets to version control
- Use AWS Systems Manager Parameter Store for sensitive values
- Rotate secrets regularly (SESSION_SECRET, API keys)

### Database Security
- Use SSL connections (included in DATABASE_URL)
- Regular security patches
- Monitor access patterns

### Application Security
- Keep dependencies updated (`npm audit`)
- Monitor for security vulnerabilities
- Use HTTPS in production (configure ALB/CloudFront)

## 📞 Support and Emergency Contacts

### Issue Reporting
1. Check health endpoints first
2. Review application logs
3. Check this deployment guide
4. Contact system administrator if issues persist

### Useful Commands Reference
```bash
# Quick status check
./deployment-scripts/check-environment-status.sh

# Database verification
./deployment-scripts/verify-database.sh

# Create new deployment
./deployment-scripts/create-deployment-bundle.sh

# Deploy to production
./deployment-scripts/deploy-to-eb.sh

# Emergency rollback
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label LAST-KNOWN-GOOD-VERSION
```

---

## 🧪 Staging Deployment & Testing Guide

### Overview
This section covers deploying to staging, configuring Stripe, and testing the Admin Subscription System (Phases 1-8) before production release.

### Deployment Order
1. ✅ **Deploy to staging first** (get live URL for Stripe webhooks)
2. ✅ **Test non-Stripe features** (UI, navigation, admin dashboard)
3. ✅ **Configure Stripe** (products, webhooks, environment variables)
4. ✅ **Test full integration** (payments, subscriptions, credits)
5. ✅ **Verify all features** (email notifications, cron jobs, UX)

---

### Step 1: Deploy to Staging (10-15 min)

#### Option A: GitHub Actions (Recommended)

**Create Pull Request:**
```bash
gh pr create --title "feat: Admin Subscription System Complete" --body "$(cat <<'EOF'
## Admin Subscription System - Ready for Testing

✅ All 8 phases implemented
✅ HTTPS configured
✅ Stripe integration ready
✅ Email notifications
✅ Credit reset cron job
✅ Confetti & toast notifications

**Testing Required:**
- Subscription upgrades (Free → Pro → Advanced)
- Credit top-ups (100, 500, 2000 credits)
- Email notifications (8 templates)
- Admin dashboard
- Stripe webhooks
- Credit reset automation

See ADMIN_SUBSCRIPTION_SYSTEM_PROGRESS.md for details.
EOF
)"
```

**What Happens:**
- GitHub Actions triggers `.github/workflows/deploy-eb-staging.yml`
- Runs tests (`npm run check`, `npm run test:run`)
- Creates deployment bundle
- Deploys to `p3-interview-academy-staging`
- Posts staging URL in PR comment
- Typically takes 8-12 minutes

**Monitor Deployment:**
```bash
# Watch GitHub Actions
gh run watch

# Check staging environment status
aws elasticbeanstalk describe-environments \
  --environment-names p3-interview-academy-staging \
  --query 'Environments[0].[Status,Health,HealthStatus]' \
  --output table
```

#### Option B: Manual Deployment
```bash
# Create deployment bundle
./deployment-scripts/create-deployment-bundle.sh

# Deploy to staging
./deployment-scripts/deploy-to-eb.sh <bundle-name>.zip p3-interview-academy-staging
```

---

### Step 2: Test Non-Stripe Features (10 min)

Once staging is deployed, verify these features **before** setting up Stripe:

#### 2.1 Environment Health
```bash
# Test staging health endpoint
curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# Expected: 200 OK with database status "healthy"
```

#### 2.2 UI & Navigation
- [ ] Visit staging URL
- [ ] Log in to test account
- [ ] Credit widget appears in navigation
- [ ] Navigate to `/billing` page
- [ ] Admin dashboard loads (`/admin/dashboard`)

#### 2.3 Billing Page UI
- [ ] **Tier cards** display correctly (Free, Pro, Advanced)
  - Gradient backgrounds render
  - Pricing shows correctly
  - Benefits list appears
- [ ] **Top-up cards** show (100, 500, 2000 credits)
  - "Best Value" badge on 500 credits
  - Pricing and savings display
- [ ] **Transaction history** tab loads
- [ ] **Tabs work** (Plans, Top-Ups, History)
- [ ] **Mobile responsive** (test on 375px width)
- [ ] **No errors** in browser console

#### 2.4 Admin Dashboard (Admin Users)
- [ ] `/admin/dashboard` accessible
- [ ] **User Management** tab:
  - User list displays
  - Search and filter work
  - Edit user dialog opens
  - Delete confirmation works
- [ ] **Analytics** tab:
  - Revenue chart renders
  - User growth chart displays
  - Credit usage metrics show
- [ ] **Payments** tab:
  - Transaction list loads
  - Payment status filters work

---

### Step 3: Configure Stripe (15-20 min)

Now that staging is live, set up Stripe integration.

#### 3.1 Create Stripe Products & Prices

**Run Product Creation Script:**
```bash
# Set environment variables
export STRIPE_SECRET_KEY="sk_test_51QIa..." # Your Stripe test secret key
export STRIPE_MODE="test"
export DATABASE_URL="postgresql://..." # Staging database URL

# Run script
npx tsx server/scripts/setup-stripe-products.ts
```

**Expected Output:**
```
✅ Subscription Product created: prod_RabcXYZ123
✅ Pro Monthly created: price_1RabcXYZ ($10.00)
✅ Pro 3-Month created: price_1RabdXYZ ($27.00 - 10% off)
✅ Pro 6-Month created: price_1RabeXYZ ($48.00 - 20% off)
✅ Advanced Monthly created: price_1RabfXYZ ($28.00)
✅ Advanced 3-Month created: price_1RabgXYZ ($75.60 - 10% off)
✅ Advanced 6-Month created: price_1RabhXYZ ($133.44 - 20.1% off)
✅ Topup Product created: prod_RabiXYZ456
✅ 100 Credits created: price_1RabjXYZ ($10.00)
✅ 500 Credits created: price_1RabkXYZ ($45.00)
✅ 2000 Credits created: price_1RablXYZ ($160.00)
✅ All Stripe products and prices created successfully!
```

**Verify in Stripe Dashboard:**
1. Go to [Stripe Dashboard → Test Mode → Products](https://dashboard.stripe.com/test/products)
2. Should see:
   - **P3 Interview Academy Subscription** (10 prices)
   - **P3 Interview Academy Credits** (3 prices)

#### 3.2 Configure Webhook Endpoint

**Add Staging Webhook:**
1. Go to [Stripe Dashboard → Test Mode → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. **Endpoint URL**:
   ```
   http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe
   ```
   ⚠️ **Note**: HTTP is acceptable for Stripe test mode
4. **Description**: "P3 Interview Academy - Staging"
5. **Events to send** - Select these 6 events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **Copy webhook signing secret** (starts with `whsec_...`)

#### 3.3 Add Webhook Secret to Staging Environment

**Via AWS CLI:**
```bash
aws elasticbeanstalk update-environment \
  --region ap-southeast-1 \
  --environment-name p3-interview-academy-staging \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_TEST_WEBHOOK_SECRET,Value=whsec_your_signing_secret_here
```

**Via AWS Console:**
1. Go to [Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk)
2. Select `p3-interview-academy-staging`
3. Click **Configuration** → **Software** → **Edit**
4. Scroll to **Environment properties**
5. Add:
   - **Name**: `STRIPE_TEST_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (from Stripe dashboard)
6. Click **Apply** (environment will restart, ~2-3 minutes)

**Verify Environment Variables:**
```bash
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --application-name p3-interview-academy \
  --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`STRIPE_TEST_WEBHOOK_SECRET`]' \
  --output table
```

---

### Step 4: Test Full Stripe Integration (20-30 min)

#### 4.1 Test Subscription Upgrade Flow

**Test Pro Subscription:**
1. Go to staging billing page
2. Click **"Upgrade to Pro"** card
3. Click **"Subscribe Monthly"** ($10/month)
4. Should redirect to Stripe Checkout
5. Fill in test details:
   - **Email**: `test@example.com`
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
6. Click **"Subscribe"**
7. Should redirect to `/billing?success=true`
8. **Verify UX Enhancements:**
   - ✨ **Confetti animation fires!**
   - 🎉 **Toast notification appears**: "Payment Successful!"
   - 💳 **Credit balance updates**: 50 → 100 credits
   - 📊 **Current plan shows**: "PRO"
   - 📋 **Transaction history** logs the upgrade

**Test Advanced Subscription:**
1. Click **"Upgrade to Advanced"** card
2. Click **"Subscribe 3-Month"** ($75.60 - 10% off)
3. Complete checkout (same test card)
4. Verify:
   - Confetti fires again
   - Credit balance: 100 → 280 credits
   - Plan shows "ADVANCED"
   - Transaction logged

#### 4.2 Test Credit Top-Ups

**Test Top-Up Purchase:**
1. Click **"Top-Ups"** tab
2. Select **"500 Credits - $45"** (Best Value)
3. Click **"Purchase"**
4. Complete Stripe checkout
5. Redirect to `/billing?success=true`
6. **Verify:**
   - Confetti fires
   - Toast: "Credits Added Successfully!"
   - Balance increases by +500
   - Transaction history shows purchase
   - Note: "These credits never expire"

**Test All Top-Up Tiers:**
- [ ] 100 Credits - $10
- [ ] 500 Credits - $45 ⭐ Best Value
- [ ] 2000 Credits - $160

#### 4.3 Verify Stripe Webhooks

**Check Webhook Events:**
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on staging endpoint
3. Should see recent events:
   - ✅ `checkout.session.completed` - Status: 200 OK
   - ✅ `customer.subscription.created` - Status: 200 OK
   - ✅ `invoice.payment_succeeded` - Status: 200 OK
4. Click on an event → **Webhook attempts** should show successful delivery

**Check Staging Logs:**
```bash
# View recent EB logs
aws elasticbeanstalk describe-environment-health \
  --environment-name p3-interview-academy-staging \
  --attribute-names All

# Or use CloudWatch Logs
aws logs tail /aws/elasticbeanstalk/p3-interview-academy-staging/var/log/eb-engine.log --follow
```

Look for:
```
[stripe-webhook] Received event: checkout.session.completed
[stripe-webhook] Signature verified
[stripe-webhook] Processing subscription upgrade...
[stripe-webhook] User xxx upgraded to PRO
```

#### 4.4 Test Stripe Customer Portal

**Access Customer Portal:**
1. On billing page, click **"Manage Subscription"** button
2. Should redirect to Stripe Customer Portal
3. **Verify Portal Features:**
   - [ ] View subscription details
   - [ ] Update payment method
   - [ ] View and download invoices
   - [ ] Cancel subscription option
   - [ ] Portal uses P3 branding

**Test Subscription Cancellation:**
1. In Customer Portal, click **"Cancel subscription"**
2. Follow cancellation flow
3. Return to billing page
4. **Verify:**
   - Plan still shows "PRO" until period end
   - Toast notification: "Subscription will end on [date]"
   - Credits remain until period end
   - Email notification sent (check logs)

---

### Step 5: Test Email Notifications (15 min)

#### 5.1 Verify SMTP Configuration

```bash
# Check staging environment variables
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --application-name p3-interview-academy \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]' \
  --output table | grep -i SMTP
```

Required variables:
- `SMTP_HOST` (smtp.gmail.com)
- `SMTP_PORT` (587)
- `SMTP_USER` (support@bizelev8.ai)
- `SMTP_PASS` (app password)
- `EMAIL_FROM` (support@bizelev8.ai)

#### 5.2 Test Email Templates

**Emails That Should Be Sent:**

1. **Subscription Started** (after Pro/Advanced upgrade)
   - Subject: "Welcome to PRO - P3 Interview Academy"
   - Content: Welcome message, credit allocation, next billing date

2. **Payment Succeeded** (after renewal/initial payment)
   - Subject: "Payment Received - P3 Interview Academy"
   - Content: Amount, invoice link, next billing date

3. **Top-Up Purchase** (after credit purchase)
   - Subject: "500 Credits Added to Your Account - P3 Interview Academy"
   - Content: Credits added, amount paid, "never expire" note

4. **Subscription Canceled** (after cancellation)
   - Subject: "Subscription Canceled - P3 Interview Academy"
   - Content: Active until date, downgrade to Free, reactivate option

**Check Email Delivery:**
- Check inbox for test@example.com
- Or check staging logs:
  ```bash
  aws logs filter-log-events \
    --log-group-name /aws/elasticbeanstalk/p3-interview-academy-staging \
    --filter-pattern "[email]" \
    --max-items 20
  ```

Look for:
```
[email] Subscription started notification sent to test@example.com
[email] Top-up purchase confirmation sent to test@example.com
```

---

### Step 6: Test Credit Reset Cron Job (10 min)

#### 6.1 Verify Cron Job Initialization

**Check Server Startup Logs:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/p3-interview-academy-staging \
  --filter-pattern "credit-reset" \
  --start-time $(($(date +%s) - 3600))000 \
  --max-items 10
```

Expected logs:
```
✅ Credit reset cron job initialized
Schedule: Daily at midnight UTC (0 0 * * *)
Next run: [timestamp]
✅ Startup credit reset fallback complete
```

#### 6.2 Manual Trigger Test (Optional)

**Create Admin API Endpoint for Testing:**
```bash
# Add to server/routes.ts (temporary, for testing only)
app.post('/api/admin/test-credit-reset', requireAdmin, async (req, res) => {
  const { manualCreditReset } = await import('./services/credit-reset-cron.js');
  const result = await manualCreditReset();
  res.json(result);
});
```

**Trigger Manual Reset:**
```bash
curl -X POST http://p3-interview-academy-staging.../api/admin/test-credit-reset \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json"
```

**Verify Results:**
- Check credit_transactions table for 'allocation' entries
- Verify users' creditBalance updated
- Check currentPeriodEnd set to +1 month
- Email notifications sent

---

### Step 7: Pre-Production Checklist

Before deploying to production, verify all features:

#### Subscription System
- [ ] Free tier (50 credits/month) working
- [ ] Pro upgrade ($10/month, 100 credits) working
- [ ] Advanced upgrade ($28/month, 280 credits) working
- [ ] 3-month and 6-month plans working (with discounts)
- [ ] Credit top-ups working (100, 500, 2000)
- [ ] Subscription cancellation working
- [ ] Customer Portal accessible

#### Credit Management
- [ ] Credit deduction works (monthly → top-up priority)
- [ ] Credit balance displays correctly
- [ ] Transaction history logs all operations
- [ ] Low credit warning appears (< 20%)
- [ ] Top-up credits persist (never expire)
- [ ] Cron job initializes on server start

#### UX Features
- [ ] Confetti fires on successful upgrade
- [ ] Toast notifications appear (Sonner)
- [ ] Loading states during Stripe redirects
- [ ] Error handling shows upgrade CTAs
- [ ] Mobile responsive (375px - 1920px)
- [ ] Gradient cards render correctly
- [ ] Skeleton loaders display

#### Email Notifications (8 Templates)
- [ ] Free tier welcome email
- [ ] Subscription started email
- [ ] Payment succeeded email
- [ ] Payment failed email
- [ ] Top-up purchase email
- [ ] Low credits warning email
- [ ] Credit reset email
- [ ] Subscription canceled email

#### Admin Dashboard
- [ ] User management CRUD operations
- [ ] Analytics charts render
- [ ] Revenue tracking accurate
- [ ] Payment list displays
- [ ] Search and filter working
- [ ] Admin middleware protecting routes

#### Stripe Integration
- [ ] Webhooks receiving events (200 OK)
- [ ] Webhook signature verification passing
- [ ] Products and prices created correctly
- [ ] Checkout sessions redirect properly
- [ ] Customer Portal functional
- [ ] Test mode working in staging

#### Performance & Security
- [ ] Health endpoints return 200 OK
- [ ] Database queries optimized
- [ ] No console errors
- [ ] HTTPS ready (production only)
- [ ] Environment variables secured
- [ ] No sensitive data in logs

---

### Step 8: Common Issues & Solutions

#### Issue: Deployment fails with "npm ERR! code ENOENT"
**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Issue: Stripe webhook returns 404
**Cause**: Route not registered or code not deployed
**Solution:**
- Verify staging deployment completed
- Check `/api/webhooks/stripe` endpoint exists
- Restart staging environment

#### Issue: Webhook signature validation fails
**Cause**: Incorrect webhook secret in environment
**Solution:**
```bash
# Verify secret matches Stripe dashboard
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`STRIPE_TEST_WEBHOOK_SECRET`].Value' \
  --output text

# Update if incorrect
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_TEST_WEBHOOK_SECRET,Value=whsec_correct_secret
```

#### Issue: Confetti animation doesn't fire
**Cause**: URL parameter not parsed or dependency missing
**Solution:**
- Check browser console for errors
- Verify `canvas-confetti` in package.json
- Check `success=true` in URL after redirect
- Clear browser cache and test again

#### Issue: Email notifications not sent
**Cause**: SMTP configuration missing or incorrect
**Solution:**
```bash
# Verify SMTP variables
aws elasticbeanstalk describe-configuration-settings \
  --environment-name p3-interview-academy-staging \
  --query 'ConfigurationSettings[0].OptionSettings[?contains(OptionName, `SMTP`) || contains(OptionName, `EMAIL`)]'

# Test SMTP manually
curl http://p3-interview-academy-staging.../api/health | jq '.checks.email'
```

Expected: `{"ok": true, "message": "SMTP transport verified"}`

#### Issue: Credit reset cron job not running
**Cause**: Cron not initialized or server restarted before midnight
**Solution:**
- Check server startup logs for cron initialization
- Manually trigger via admin endpoint
- Wait until midnight UTC for automatic run
- Check server timezone: `date -u` (should be UTC)

#### Issue: Transaction history not showing
**Cause**: Database query failing or transactions not logged
**Solution:**
```bash
# Query database directly
psql $DATABASE_URL -c "SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 10;"

# Check for transaction logging in code
# Verify creditService.deductCredits() and creditService.addCredits() calls
```

---

### Step 9: Production Release Preparation

Once all staging tests pass:

#### 9.1 Update Production Stripe

**Create Production Products:**
```bash
# Use LIVE Stripe secret key
export STRIPE_SECRET_KEY="sk_live_..." # Live secret key
export STRIPE_MODE="live"
export DATABASE_URL="postgresql://..." # Production database URL

npx tsx server/scripts/setup-stripe-products.ts
```

**Configure Production Webhook:**
1. Go to [Stripe Dashboard → Live Mode → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://p3app.bizelev8.ai/api/webhooks/stripe` (HTTPS required)
3. Select same 6 events
4. Copy production webhook secret (`whsec_...`)

**Add to Production Environment:**
```bash
aws elasticbeanstalk update-environment \
  --region ap-southeast-1 \
  --environment-name p3-interview-academy-prod-v2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_WEBHOOK_SECRET,Value=whsec_production_secret
```

#### 9.2 Merge to Main Branch

```bash
# Merge PR via GitHub UI or CLI
gh pr merge <PR-NUMBER> --merge --delete-branch

# Or locally:
git checkout main
git pull origin main
git merge feature/admin-subscription-system
git push origin main
```

#### 9.3 Monitor Production Deployment

GitHub Actions will auto-deploy to production:
```bash
# Watch deployment
gh run watch

# Check production health after deploy
curl https://p3app.bizelev8.ai/api/health

# Monitor CloudWatch logs
aws logs tail /aws/elasticbeanstalk/p3-interview-academy-prod-v2/var/log/eb-engine.log --follow
```

#### 9.4 Post-Production Verification

- [ ] Health check returns 200 OK
- [ ] HTTPS working correctly
- [ ] Stripe webhooks receiving events
- [ ] Email notifications working
- [ ] Cron job initialized
- [ ] No errors in logs
- [ ] Admin dashboard accessible
- [ ] Test small transaction (use real card, then refund)

---

**This staging deployment guide ensures thorough testing before production release of the Admin Subscription System.**

---

**This deployment guide ensures reliable, repeatable production deployments for P³ Interview Academy.**
> HTTPS/SSL
> - Environments should be accessed via HTTPS once the load balancer certificate is provisioned. Prefer `https://` URLs in checks and external links.
> - Ensure the EB load balancer listener on 443 is active and the certificate is attached. Update CNAMEs/DNS if using a custom domain.
