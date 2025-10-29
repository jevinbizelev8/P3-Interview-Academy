# Stripe Integration Setup Guide

**Feature**: Admin Dashboard & Subscription System (Phase 6)
**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Prerequisites**: Stripe account with admin access

---

## 📋 Overview

This guide walks through the complete setup of Stripe payment integration for the P3 Interview Academy subscription system. Follow these steps to configure Stripe for both test (staging) and production environments.

**⚠️ PREREQUISITE**: Stripe webhooks require HTTPS URLs. Before proceeding, ensure SSL/HTTPS is configured on your Elastic Beanstalk environments. See **`MD_Documentations/Guides/AWS_SSL_HTTPS_SETUP.md`** for setup instructions.

---

## 🎯 What We're Setting Up

### Subscription Products
1. **Pro Tier** - $10/month, 100 credits
2. **Advanced Tier** - $28/month, 280 credits

### One-Time Top-Up Products
3. **100 Credits** - $10 (Small package)
4. **500 Credits** - $45 (Best Value, 10% savings)
5. **2000 Credits** - $160 (Bulk package, 20% savings)

### Webhook Events
Configure webhooks to receive real-time payment and subscription updates.

---

## 🔐 Step 1: Obtain Stripe API Keys

### For Test Mode (Development & Staging)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Ensure you're in **Test mode** (toggle in top-right should say "Test mode")
3. Find these credentials:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal test key")
4. Copy both keys to your `.env` file:
   ```env
   STRIPE_MODE=test
   STRIPE_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   ```

### For Live Mode (Production Only)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Toggle to **Live mode** (top-right)
3. Find these credentials:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (click "Reveal live key")
4. Copy both keys to your **production** `.env` file:
   ```env
   STRIPE_MODE=live
   STRIPE_LIVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   ```

⚠️ **SECURITY WARNING**: Never commit Stripe keys to version control! Always use environment variables.

---

## 🏗️ Step 2: Create Stripe Products (Automated)

We use an automated script to create products and prices in Stripe. This ensures consistency and is idempotent (safe to run multiple times).

### Run Product Creation Script

**For Test Mode:**
```bash
# Ensure test keys are in .env
STRIPE_MODE=test

# Run the script
npx tsx server/scripts/setup-stripe-products.ts
```

**For Live Mode:**
```bash
# Switch to live mode
STRIPE_MODE=live

# Run the script (ONLY AFTER TESTING IN TEST MODE)
npx tsx server/scripts/setup-stripe-products.ts
```

### Expected Output

The script will create:
- ✅ 2 subscription products with recurring monthly prices
- ✅ 3 one-time payment products for credit top-ups
- ✅ Price IDs saved to `.env` file automatically

Example output:
```
✅ Created product: P3 Pro Monthly (prod_xxxxx)
✅ Created price: $10/month (price_xxxxx)
✅ Created product: P3 Advanced Monthly (prod_xxxxx)
✅ Created price: $28/month (price_xxxxx)
...

🎉 All Stripe products created successfully!
📋 Price IDs have been added to .env file
```

### Verify Products in Dashboard

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products) (test mode)
2. You should see 5 products:
   - P3 Pro Monthly ($10/month)
   - P3 Advanced Monthly ($28/month)
   - 100 Credits Top-Up ($10)
   - 500 Credits Top-Up ($45)
   - 2000 Credits Top-Up ($160)

---

## 🔗 Step 3: Configure Webhook Endpoints

Webhooks allow Stripe to notify your application about payment events (successful payments, subscription cancellations, etc.).

### 3A. Staging Environment Setup

**⚠️ IMPORTANT**: Stripe requires HTTPS URLs. Ensure SSL/HTTPS is configured first (see `AWS_SSL_HTTPS_SETUP.md`).

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks) (test mode)
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe
   ```
4. Select **"Events to send"** → **"Select events"**
5. Choose these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **Copy the Signing Secret** (starts with `whsec_...`)
8. Add to staging environment variables:
   ```env
   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 3B. Production Environment Setup

**⚠️ IMPORTANT**: Stripe requires HTTPS URLs. Ensure SSL/HTTPS is configured first (see `AWS_SSL_HTTPS_SETUP.md`).

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks) (LIVE mode)
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe
   ```

   Or if using custom domain (recommended for production):
   ```
   https://p3app.bizelev8.ai/api/webhooks/stripe
   ```
4. Select the same 6 events as staging
5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_...`)
7. Add to production environment variables:
   ```env
   STRIPE_LIVE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 3C. Local Development Setup (Optional)

For local testing, use the Stripe CLI to forward webhooks:

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop install stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.17.0/stripe_1.17.0_linux_x86_64.tar.gz
   tar -xvf stripe_1.17.0_linux_x86_64.tar.gz
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret from the output:
   ```
   Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. Add to local `.env`:
   ```env
   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 🌍 Step 4: Configure Environment Variables

### Development (.env.local)
```env
# Stripe Configuration
STRIPE_MODE=test
STRIPE_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Checkout URLs
STRIPE_SUCCESS_URL=http://localhost:5000/billing?success=true
STRIPE_CANCEL_URL=http://localhost:5000/billing?canceled=true

# Stripe Price IDs (auto-populated by setup script)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ADVANCED_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_TOPUP_100=price_xxxxxxxxxxxxx
STRIPE_PRICE_TOPUP_500=price_xxxxxxxxxxxxx
STRIPE_PRICE_TOPUP_2000=price_xxxxxxxxxxxxx
```

### Staging Environment Variables (AWS)

Configure via deployment script or AWS Console:
```bash
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_MODE,Value=test \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_TEST_SECRET_KEY,Value=sk_test_xxx \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_TEST_PUBLISHABLE_KEY,Value=pk_test_xxx \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_TEST_WEBHOOK_SECRET,Value=whsec_xxx \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_SUCCESS_URL,Value=http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/billing?success=true \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_CANCEL_URL,Value=http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/billing?canceled=true
```

### Production Environment Variables (AWS)

⚠️ **USE LIVE KEYS ONLY IN PRODUCTION**
```bash
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_MODE,Value=live \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_LIVE_SECRET_KEY,Value=sk_live_xxx \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_LIVE_PUBLISHABLE_KEY,Value=pk_live_xxx \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_LIVE_WEBHOOK_SECRET,Value=whsec_xxx \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_SUCCESS_URL,Value=https://p3app.bizelev8.ai/billing?success=true \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_CANCEL_URL,Value=https://p3app.bizelev8.ai/billing?canceled=true
```

---

## ✅ Step 5: Testing the Integration

### Test with Stripe Test Cards

Use these test card numbers in **test mode only**:

| Card Number         | Description            | Expected Result |
|---------------------|------------------------|-----------------|
| 4242 4242 4242 4242 | Visa (success)         | ✅ Payment succeeds |
| 4000 0025 0000 3155 | Visa (requires 3DS)    | ✅ Payment succeeds after authentication |
| 4000 0000 0000 9995 | Visa (decline)         | ❌ Card declined |
| 4000 0000 0000 0069 | Visa (expired card)    | ❌ Card expired |

**Test Details:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Test Checklist

#### Subscription Flow
- [ ] User clicks "Upgrade to Pro" on billing page
- [ ] Redirected to Stripe Checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Redirected back to `/billing?success=true`
- [ ] User tier updated to "Pro" in database
- [ ] 100 monthly credits allocated
- [ ] Webhook event `checkout.session.completed` received
- [ ] Subscription record created in database

#### Top-Up Flow
- [ ] User clicks "Purchase 500 Credits"
- [ ] Redirected to Stripe Checkout
- [ ] Enter test card
- [ ] Complete payment
- [ ] Redirected back to `/billing?success=true`
- [ ] 500 top-up credits added to user account
- [ ] Webhook event `checkout.session.completed` received
- [ ] Transaction logged in credit_transactions table

#### Subscription Cancellation
- [ ] User clicks "Manage Subscription" → Stripe Customer Portal
- [ ] Cancel subscription
- [ ] Webhook event `customer.subscription.deleted` received
- [ ] User downgraded to Free tier
- [ ] Monthly credits reset to 50

#### Invoice Payment
- [ ] Wait for subscription renewal (or manually trigger)
- [ ] Webhook event `invoice.payment_succeeded` received
- [ ] Monthly credits reset to tier default
- [ ] Invoice created in database

---

## 🔍 Step 6: Verify Webhook Events

### Check Webhook Logs in Stripe Dashboard

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click **"Events & logs"** tab
4. Verify events are being delivered with `200 OK` status

### Common Webhook Issues

**❌ Webhook failing with 401 Unauthorized**
- Check that your server is deployed and running
- Verify the endpoint URL is correct
- Check authentication middleware isn't blocking `/api/webhooks/stripe`

**❌ Webhook failing with 400 Bad Request**
- Signature verification might be failing
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check that webhook secret matches the environment (test vs live)

**❌ Webhook not being received at all**
- Check server logs for incoming requests
- Verify endpoint URL is publicly accessible
- Test with `curl` to ensure route exists:
  ```bash
  curl -X POST http://your-server.com/api/webhooks/stripe
  ```

---

## 🚀 Step 7: Production Deployment Checklist

Before going live with Stripe in production:

### Pre-Production
- [ ] All tests passing in staging with test mode
- [ ] Webhook events successfully received in staging
- [ ] User flows tested end-to-end (subscriptions, top-ups, cancellations)
- [ ] Admin dashboard showing correct payment data
- [ ] Email notifications working (payment success, failure, etc.)
- [ ] SSL certificate configured for custom domain (if applicable)

### Production Setup
- [ ] Switch `STRIPE_MODE=live` in production environment
- [ ] Configure live Stripe keys (secret, publishable, webhook)
- [ ] Run product creation script in live mode
- [ ] Verify live webhook endpoint in Stripe dashboard
- [ ] Update success/cancel URLs to production domain
- [ ] Enable rate limiting on webhook endpoint
- [ ] Configure error monitoring (Sentry, etc.)

### Post-Production
- [ ] Smoke test: Complete one real transaction (can refund immediately)
- [ ] Monitor webhook logs for first 24 hours
- [ ] Set up alerts for failed webhook deliveries
- [ ] Document rollback plan

---

## 📞 Troubleshooting & Support

### Stripe Dashboard Links

**Test Mode:**
- API Keys: https://dashboard.stripe.com/test/apikeys
- Products: https://dashboard.stripe.com/test/products
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Payments: https://dashboard.stripe.com/test/payments
- Logs: https://dashboard.stripe.com/test/logs

**Live Mode:**
- API Keys: https://dashboard.stripe.com/apikeys
- Products: https://dashboard.stripe.com/products
- Webhooks: https://dashboard.stripe.com/webhooks
- Payments: https://dashboard.stripe.com/payments
- Logs: https://dashboard.stripe.com/logs

### Getting Help

**Stripe Documentation:**
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Webhooks: https://stripe.com/docs/webhooks
- Checkout: https://stripe.com/docs/payments/checkout
- Testing: https://stripe.com/docs/testing

**Stripe Support:**
- Email: support@stripe.com
- Dashboard: https://dashboard.stripe.com/support

### Common Questions

**Q: Can I use the same Stripe account for staging and production?**
A: Yes! Stripe has built-in test mode and live mode within the same account. Just toggle between them in the dashboard.

**Q: What happens if I run the product creation script multiple times?**
A: The script is idempotent - it checks if products already exist before creating them. Safe to run multiple times.

**Q: How do I refund a payment?**
A: Go to Stripe Dashboard → Payments → Click on payment → Click "Refund". Full or partial refunds available.

**Q: Can users update their payment method?**
A: Yes! Users can click "Manage Subscription" which redirects to Stripe Customer Portal where they can update cards, billing info, and cancel subscriptions.

**Q: Do webhook secrets change?**
A: Only if you delete and recreate the webhook endpoint. If you edit an existing endpoint, the secret stays the same.

---

## 📋 Quick Reference

### Environment Variables Checklist
```env
# Required for all environments
✅ STRIPE_MODE (test or live)
✅ STRIPE_TEST_SECRET_KEY
✅ STRIPE_TEST_PUBLISHABLE_KEY
✅ STRIPE_TEST_WEBHOOK_SECRET
✅ STRIPE_SUCCESS_URL
✅ STRIPE_CANCEL_URL

# Required for production only
✅ STRIPE_LIVE_SECRET_KEY
✅ STRIPE_LIVE_PUBLISHABLE_KEY
✅ STRIPE_LIVE_WEBHOOK_SECRET

# Auto-populated by script
✅ STRIPE_PRICE_PRO_MONTHLY
✅ STRIPE_PRICE_ADVANCED_MONTHLY
✅ STRIPE_PRICE_TOPUP_100
✅ STRIPE_PRICE_TOPUP_500
✅ STRIPE_PRICE_TOPUP_2000
```

### Webhook Events to Configure
```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

### Test Card Numbers
```
✅ 4242 4242 4242 4242 (Visa success)
✅ 4000 0025 0000 3155 (Requires 3DS authentication)
❌ 4000 0000 0000 9995 (Card declined)
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Next Review**: After Phase 6 implementation
**Maintained By**: Development Team
