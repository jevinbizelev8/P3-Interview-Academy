# Stripe Credit Products Configuration Guide

**Date**: 2025-10-30
**Phase**: Phase 5 - Service Integrations & Polish
**Status**: Manual Configuration Required

---

## Overview

This document outlines the credit packages for the P3 Interview Academy redesign project and provides instructions for configuring them in Stripe.

## Current Implementation

The existing Stripe configuration (`server/config/stripe.ts`) has **3 top-up packages**:

| Package | Credits | Price | Price/Credit | Savings |
|---------|---------|-------|--------------|---------|
| SMALL   | 100     | $10   | $0.10        | -       |
| POPULAR | 500     | $45   | $0.09        | 10%     |
| BULK    | 2000    | $160  | $0.08        | 20%     |

Environment variables required:
- `STRIPE_PRICE_TOPUP_100`
- `STRIPE_PRICE_TOPUP_500`
- `STRIPE_PRICE_TOPUP_2000`

## Proposed Redesign Packages

The original redesign specifications suggested **4 packages**:

| Package | Credits | Proposed Price | Price/Credit | Notes |
|---------|---------|----------------|--------------|-------|
| Starter | 50      | $9.99          | $0.20        | Best for trial |
| Value   | 150     | $24.99         | $0.17        | Most popular |
| Pro     | 500     | $74.99         | $0.15        | Power users |
| Elite   | 1000    | $129.99        | $0.13        | Bulk savings |

## Recommendation

**Keep the existing 3-package structure** for the following reasons:

1. **Already integrated**: The existing packages (SMALL, POPULAR, BULK) are fully integrated with:
   - Stripe checkout flow (`topup-service.ts`)
   - Webhook handlers
   - Credit transaction logging
   - Email confirmations

2. **Better value proposition**:
   - Existing: 100 credits for $10 = $0.10/credit
   - Proposed: 50 credits for $9.99 = $0.20/credit (double the cost per credit)

3. **Clear tier structure**: The 100/500/2000 progression is clearer than 50/150/500/1000

4. **Lower risk**: No need to refactor existing payment logic

## Manual Configuration Steps

### Step 1: Create Products in Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test Mode** (for development)
3. Navigate to **Products** → **Add Product**

#### Product 1: Small Credit Pack
- **Name**: Small Credit Pack
- **Description**: 100 Interview Practice Credits
- **Price**: $10.00 USD
- **Billing**: One-time payment
- **Copy the Price ID**: `price_xxxxxxxxxx`

#### Product 2: Popular Credit Pack (Best Value)
- **Name**: Popular Credit Pack
- **Description**: 500 Interview Practice Credits - Save 10%
- **Price**: $45.00 USD
- **Billing**: One-time payment
- **Add metadata**: `savings: 10%`
- **Copy the Price ID**: `price_xxxxxxxxxx`

#### Product 3: Bulk Credit Pack (Maximum Savings)
- **Name**: Bulk Credit Pack
- **Description**: 2000 Interview Practice Credits - Save 20%
- **Price**: $160.00 USD
- **Billing**: One-time payment
- **Add metadata**: `savings: 20%`
- **Copy the Price ID**: `price_xxxxxxxxxx`

### Step 2: Configure Environment Variables

#### Development (.env)
```bash
# Stripe Top-Up Price IDs (Test Mode)
STRIPE_PRICE_TOPUP_100=price_xxxxxxxxxx
STRIPE_PRICE_TOPUP_500=price_xxxxxxxxxx
STRIPE_PRICE_TOPUP_2000=price_xxxxxxxxxx
```

#### Staging (AWS Elastic Beanstalk)
```bash
eb setenv STRIPE_PRICE_TOPUP_100=price_xxxxxxxxxx \
          STRIPE_PRICE_TOPUP_500=price_xxxxxxxxxx \
          STRIPE_PRICE_TOPUP_2000=price_xxxxxxxxxx \
          --environment p3-interview-academy-staging
```

#### Production (After Testing)
1. Create products in **Live Mode** in Stripe Dashboard
2. Copy the **live Price IDs**
3. Update production environment variables:
```bash
eb setenv STRIPE_MODE=live \
          STRIPE_PRICE_TOPUP_100=price_live_xxxxxxxxxx \
          STRIPE_PRICE_TOPUP_500=price_live_xxxxxxxxxx \
          STRIPE_PRICE_TOPUP_2000=price_live_xxxxxxxxxx \
          --environment p3-interview-academy-prod-v2
```

### Step 3: Verify Configuration

Run the verification script:
```bash
npm run stripe:verify
```

Or check manually:
```bash
node -e "require('./server/config/stripe.js').verifyPriceIdsConfigured()"
```

Expected output:
```
✅ Stripe Configuration:
   Mode: test
   Price IDs configured: Yes ✅
```

### Step 4: Test Purchase Flow

1. Start development server: `npm run dev`
2. Navigate to `/billing` page
3. Click "Buy Credits" → Select package
4. Use Stripe test card: `4242 4242 4242 4242`
5. Verify:
   - Credits added to account
   - Transaction logged in database
   - Confirmation email sent

## Webhook Configuration

### Webhook Events Required

The webhook handler in `server/routes/subscriptions.ts` listens for:
- `checkout.session.completed` - Process credit purchases

### Configure Webhook in Stripe

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   - **Staging**: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe`
   - **Production**: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the **Signing Secret**: `whsec_xxxxxxxxxx`
6. Update environment variable:
   ```bash
   eb setenv STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxx
   ```

## Testing Checklist

- [ ] Stripe products created in Test Mode
- [ ] Environment variables configured
- [ ] Server starts without errors
- [ ] `/api/subscription/topup-packages` returns correct packages
- [ ] Checkout session creates successfully
- [ ] Test payment completes
- [ ] Credits added to user account
- [ ] Transaction logged in `credit_transactions` table
- [ ] Confirmation email sent
- [ ] Webhook signature verified

## Production Deployment Checklist

- [ ] Stripe products created in Live Mode
- [ ] Live Price IDs configured in production environment
- [ ] Live webhook endpoint configured
- [ ] Live webhook secret configured
- [ ] Test purchase with real card (small amount)
- [ ] Monitor Stripe dashboard for errors
- [ ] Verify credit balance updates correctly

## Troubleshooting

### Error: "Stripe Price ID not configured"
- Check environment variables are set correctly
- Restart server after updating `.env`
- Verify Price IDs in Stripe Dashboard

### Error: "Webhook signature verification failed"
- Check `STRIPE_TEST_WEBHOOK_SECRET` or `STRIPE_LIVE_WEBHOOK_SECRET` is set
- Verify signing secret matches Stripe Dashboard
- Check webhook endpoint URL is correct

### Credits not added after payment
- Check webhook logs in Stripe Dashboard → **Developers** → **Webhooks** → **Event logs**
- Check server logs for errors: `eb logs --environment p3-interview-academy-staging`
- Verify metadata (`topUpCredits`, `userId`) is included in checkout session

## Implementation Status

✅ **Complete**:
- Stripe configuration file exists
- Top-up service implemented
- Checkout session creation
- Webhook handler
- Credit transaction logging
- Email confirmation service

⏳ **Pending**:
- Manual Stripe product creation (requires dashboard access)
- Environment variable configuration
- Production webhook setup

## References

- **Stripe Config**: `server/config/stripe.ts`
- **Top-Up Service**: `server/services/topup-service.ts`
- **Webhook Handler**: `server/routes/subscriptions.ts` (line 127-161)
- **Email Service**: `server/services/email-service.ts` (`sendCreditTopupEmail`)

---

**Next Steps**:
1. Create products in Stripe Dashboard (Test Mode)
2. Update `.env` with Price IDs
3. Test purchase flow
4. Deploy to staging
5. Test staging webhook
6. Create Live Mode products
7. Deploy to production
