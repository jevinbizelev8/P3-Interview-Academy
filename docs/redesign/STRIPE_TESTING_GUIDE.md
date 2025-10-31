# Stripe Testing Guide

**Status**: ✅ Products Configured | ⏳ Webhook Endpoint Registration Pending

This guide provides step-by-step instructions for testing the Stripe credit purchase system in P3 Interview Academy.

---

## ✅ Configuration Status

### Stripe Products (Test Mode)
All 5 products have been created and Price IDs configured:

| Product | Price | Price ID | Status |
|---------|-------|----------|--------|
| 100 Credits Top-Up | $10.00 | `price_1SLN3kRYjG8QUIcykni1o8wq` | ✅ Active |
| 500 Credits Top-Up | $45.00 | `price_1SLN3lRYjG8QUIcy6CROxcbA` | ✅ Active |
| 2000 Credits Top-Up | $160.00 | `price_1SLN3mRYjG8QUIcyaF6HIv6p` | ✅ Active |
| P3 Pro Monthly | $10.00/month | `price_1SLN3iRYjG8QUIcyQ7g3Pkeo` | ✅ Active |
| P3 Advanced Monthly | $28.00/month | `price_1SLN3jRYjG8QUIcyRo9QpgfF` | ✅ Active |

### Environment Variables
- ✅ `STRIPE_MODE=test`
- ✅ `STRIPE_TEST_SECRET_KEY` configured
- ✅ `STRIPE_TEST_PUBLISHABLE_KEY` configured
- ✅ `STRIPE_TEST_WEBHOOK_SECRET` configured
- ✅ All 5 Price IDs configured in `.env`

### Webhook Endpoints
- ⚠️ **Action Required**: No webhook endpoints registered in Stripe Dashboard
- ✅ Webhook secret is pre-configured: `whsec_7YEu2Iip7s5Pj48GGpzznqu7AMV7ofAQ`

---

## 🔧 Step 1: Register Webhook Endpoint in Stripe Dashboard

Before testing, you need to register the webhook endpoint in Stripe:

### For Staging Environment

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Switch to Test Mode** (toggle in top-right corner)
3. **Click "Add endpoint"**
4. **Enter endpoint URL**:
   ```
   http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe
   ```
   **Note**: Stripe prefers HTTPS. If staging has SSL configured, use `https://` instead.

5. **Select events to listen for**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

6. **Copy the Signing Secret**:
   - After creating the endpoint, click on it to view details
   - Copy the "Signing secret" (starts with `whsec_`)
   - **Verify it matches** the value in `.env`: `STRIPE_TEST_WEBHOOK_SECRET`
   - If different, update `.env` and redeploy

### For Local Development

For local testing, you'll use Stripe CLI webhook forwarding (see Step 2).

---

## 🧪 Step 2: Local Testing Workflow

### Prerequisites
- ✅ Stripe CLI installed (version 1.19.5 detected)
- ✅ Development server can run (`npm run dev`)
- ✅ Test Stripe API keys configured

### Testing Steps

#### 1. Start Development Server
```bash
npm run dev
```

Server should start on `http://localhost:5000` (or configured port).

#### 2. Start Stripe Webhook Listener (Separate Terminal)
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

**Expected Output**:
```
> Ready! You are using Stripe API Version [2024-XX-XX]. Your webhook signing secret is
> whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

**Important**: Copy the webhook signing secret from the output and update `.env`:
```env
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then **restart the dev server** to load the new secret.

#### 3. Navigate to Billing/Credits Page
Open your browser and go to the credit purchase page (e.g., `/billing` or `/credits`).

**Login credentials** (if needed):
- Use your test account or create a new one
- If `BYPASS_AUTH=true` is set, authentication may be skipped in development

#### 4. Initiate Credit Purchase
1. Click "Buy Credits" or "Purchase"
2. Select the **100 Credits** package ($10)
3. You should be redirected to **Stripe Checkout**

#### 5. Complete Test Payment
On the Stripe Checkout page:
- **Card Number**: `4242 4242 4242 4242` (test card, always succeeds)
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Postal Code**: Any valid postal code
- Click **"Pay"**

#### 6. Verify Success
After payment:
- ✅ You should be redirected to a success page
- ✅ Check the **webhook listener terminal** for `checkout.session.completed` event
- ✅ Check the **dev server logs** for credit addition messages
- ✅ Verify credits were added to your account

**Check Database** (optional):
```bash
psql $DATABASE_URL -c "SELECT credit_balance FROM users WHERE email = 'your-test-email@example.com';"
```

#### 7. Verify Email Sent
If SMTP is configured:
- ✅ Check your email for a confirmation message
- ✅ Check server logs for email sending confirmation

---

## 🎴 Test Card Numbers

Stripe provides various test cards for different scenarios:

### Successful Payments
- **Basic Success**: `4242 4242 4242 4242`
- **3D Secure Required**: `4000 0025 0000 3155` (triggers authentication)
- **Visa Debit**: `4000 0566 5566 5556`

### Failed Payments
- **Generic Decline**: `4000 0000 0000 9995`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`
- **Incorrect CVC**: `4000 0000 0000 0127`

### For all cards:
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Postal Code**: Any valid code

**Full list**: https://stripe.com/docs/testing#cards

---

## ✅ Test Checklist

Use this checklist during testing:

### Top-Up Purchase Flow
- [ ] Navigate to billing/credits page
- [ ] Click "Purchase Credits"
- [ ] Select 100-credit package ($10)
- [ ] Redirected to Stripe Checkout
- [ ] Enter test card `4242 4242 4242 4242`
- [ ] Complete payment successfully
- [ ] Redirected to success page
- [ ] **Verify**: Credits added to user account
- [ ] **Verify**: Transaction logged in `credit_transactions` table
- [ ] **Verify**: Confirmation email sent (if SMTP configured)
- [ ] **Verify**: Webhook event logged in Stripe listener

### Webhook Processing
- [ ] `checkout.session.completed` event received in listener
- [ ] Webhook signature verified successfully (no errors)
- [ ] Server logs show `processTopUpPayment()` called
- [ ] Credits added via `CreditService.addCredits()`
- [ ] Email sent via `sendCreditTopupEmail()`
- [ ] No errors in server logs

### Edge Cases
- [ ] Test with declined card: `4000 0000 0000 9995`
- [ ] Test with 3DS authentication: `4000 0025 0000 3155`
- [ ] Test duplicate webhook delivery (should be idempotent)
- [ ] Test webhook with invalid signature (should return 400)

### Subscription Testing (Optional)
- [ ] Navigate to subscription page
- [ ] Select "P3 Pro Monthly" ($10/month)
- [ ] Complete payment with test card
- [ ] Verify subscription created in Stripe Dashboard
- [ ] Verify monthly credits added to account
- [ ] Test subscription cancellation

---

## 🐛 Troubleshooting

### Issue: Webhook Not Received

**Symptoms**: Payment completes but credits not added

**Diagnosis**:
```bash
# Check webhook listener is running
stripe logs tail

# Check server logs
# Look for webhook processing errors
```

**Solutions**:
1. Verify webhook listener is running (`stripe listen ...`)
2. Verify webhook secret matches between listener output and `.env`
3. Restart dev server after updating webhook secret
4. Check server logs for signature verification errors

### Issue: "Invalid webhook signature"

**Symptoms**: Server returns 400, logs show signature mismatch

**Solution**:
1. Copy the webhook secret from `stripe listen` output
2. Update `STRIPE_TEST_WEBHOOK_SECRET` in `.env`
3. Restart the dev server
4. Retry the payment

### Issue: "Price ID not found"

**Symptoms**: Error creating checkout session, "No such price"

**Diagnosis**:
```bash
# Verify Price IDs in .env
grep "STRIPE_PRICE_" .env

# Check if prices exist in Stripe
stripe prices list --limit 5
```

**Solution**:
1. Verify Price IDs match Stripe Dashboard
2. Re-run setup script: `npx tsx server/scripts/setup-stripe-products.ts`
3. Restart the server

### Issue: Credits Not Added After Payment

**Symptoms**: Payment successful, webhook received, but balance unchanged

**Diagnosis**:
```bash
# Check server logs for errors in topUpService.processTopUpPayment()
# Check database transaction logs

psql $DATABASE_URL -c "SELECT * FROM credit_transactions WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 5;"
```

**Solution**:
1. Check for errors in `topUpService.processTopUpPayment()`
2. Verify `CreditService.addCredits()` is being called
3. Check database permissions (INSERT on credit_transactions)
4. Verify user ID from session matches database

### Issue: Email Not Sent

**Symptoms**: Credits added but no confirmation email

**Diagnosis**:
```bash
# Check SMTP configuration in .env
grep "SMTP_" .env

# Check email service logs
# Look for email sending errors in server logs
```

**Solution**:
1. Verify SMTP credentials are correct
2. Check `EMAIL_FROM` and `EMAIL_FROM_NAME` are set
3. Test email service independently
4. Check spam folder for test emails

---

## 🚀 Next Steps

After successful local testing:

### 1. Staging Deployment
1. Push changes to staging branch
2. Update AWS environment variables with Price IDs:
   ```bash
   eb setenv \
     STRIPE_PRICE_TOPUP_100=price_1SLN3kRYjG8QUIcykni1o8wq \
     STRIPE_PRICE_TOPUP_500=price_1SLN3lRYjG8QUIcy6CROxcbA \
     STRIPE_PRICE_TOPUP_2000=price_1SLN3mRYjG8QUIcyaF6HIv6p \
     STRIPE_PRICE_PRO_MONTHLY=price_1SLN3iRYjG8QUIcyQ7g3Pkeo \
     STRIPE_PRICE_ADVANCED_MONTHLY=price_1SLN3jRYjG8QUIcyRo9QpgfF \
     --environment p3-interview-academy-staging
   ```
3. Register webhook endpoint in Stripe Dashboard (see Step 1)
4. Test credit purchase on staging
5. Monitor webhook delivery in Stripe Dashboard

### 2. Production Deployment (After Staging Approval)
**⚠️ IMPORTANT**: Do NOT deploy to production until staging is fully tested.

1. Switch to Live Mode in Stripe Dashboard
2. Create live products: `export STRIPE_MODE=live && npx tsx server/scripts/setup-stripe-products.ts`
3. Register live webhook endpoint (use HTTPS URL)
4. Update production environment variables with live Price IDs
5. Test with small live transaction ($10)
6. Monitor for 24 hours

---

## 📞 Support

### Stripe Dashboard Links
- **Test Mode Products**: https://dashboard.stripe.com/test/products
- **Test Mode Webhooks**: https://dashboard.stripe.com/test/webhooks
- **Test Mode Payments**: https://dashboard.stripe.com/test/payments
- **Test Mode Logs**: https://dashboard.stripe.com/test/logs

### Stripe CLI Commands
```bash
# List products
stripe products list

# List prices
stripe prices list

# View recent events
stripe events list --limit 10

# Trigger test event
stripe trigger checkout.session.completed

# View API logs
stripe logs tail
```

### Documentation References
- **Main Setup Guide**: `docs/guides/STRIPE_SETUP_GUIDE.md`
- **Product Configuration**: `docs/redesign/STRIPE_CREDIT_PRODUCTS.md`
- **Master Plan**: `docs/redesign/MASTER_PLAN.md` (Phase 5)

---

**Last Updated**: 2025-10-31
**Status**: ✅ Ready for Local Testing | ⏳ Webhook Registration Pending
