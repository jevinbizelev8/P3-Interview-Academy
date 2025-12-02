# Stripe Testing: Common Issues & Quick Fixes

**Quick Reference**: Fast troubleshooting guide for common Stripe testing issues
**Related**: [STRIPE_TESTING_GUIDE.md](./STRIPE_TESTING_GUIDE.md) | [STRIPE_TEST_CHECKLIST.md](./STRIPE_TEST_CHECKLIST.md)

---

## Issue 1: "Webhook signature verification failed"

### Symptoms
```
❌ Webhook signature verification failed: No signatures found matching the expected signature
```

### Root Causes
1. Webhook secret not configured
2. Wrong webhook secret in `.env`
3. Request body parsed as JSON (should be raw)
4. Webhook secret rotated in Stripe Dashboard

### Quick Fix

**Step 1**: Get fresh webhook secret
```bash
# Stop existing listener
# Ctrl+C

# Start new listener
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Copy the output: whsec_xxxxxxxxxxxxx
```

**Step 2**: Update `.env`
```bash
# Replace with new secret
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Step 3**: Restart server
```bash
npm run dev
```

**Step 4**: Test
```bash
stripe trigger checkout.session.completed
```

### Verify Fix
```
✅ Webhook received: checkout.session.completed (ID: evt_xxxxxxxxxxxxx)
```

---

## Issue 2: "Credits not added after purchase"

### Symptoms
- Checkout completes successfully
- User redirected to success page
- Credits remain at previous balance

### Debugging Checklist

**1. Check Stripe Dashboard**
```
Dashboard → Payments → Recent
- Is payment marked as "Succeeded"?
```

**2. Check Webhook Delivery**
```
Dashboard → Developers → Webhooks → Recent deliveries
- Is "checkout.session.completed" delivered?
- Status: 200 OK or error?
```

**3. Check Server Logs**
```bash
tail -f server.log | grep "Webhook received"
# Should show: ✅ Webhook received: checkout.session.completed
```

**4. Check Database**
```sql
-- Check transactions
SELECT * FROM credit_transactions
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC
LIMIT 5;

-- Check user balance
SELECT credit_balance FROM users WHERE id = 'user_xxx';
```

### Common Causes & Fixes

**Cause 1**: Webhook not configured
```bash
# Solution: Start Stripe CLI listener
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

**Cause 2**: Webhook handler error
```bash
# Solution: Check server logs for error details
npm run dev
# Look for error stack traces
```

**Cause 3**: Database transaction failed
```sql
-- Solution: Check database constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'credit_transactions';
```

---

## Issue 3: "Duplicate credits added"

### Symptoms
- User receives 200 credits instead of 100
- Multiple transaction records for same purchase

### Root Cause
Idempotency check not working

### Quick Check
```sql
-- Check for duplicate transactions
SELECT stripe_transaction_id, COUNT(*) as count
FROM credit_transactions
GROUP BY stripe_transaction_id
HAVING COUNT(*) > 1;
```

### Quick Fix

**Add database constraint**:
```sql
ALTER TABLE credit_transactions
ADD CONSTRAINT unique_stripe_transaction_id
UNIQUE (stripe_transaction_id);
```

**Fix service logic**:
```typescript
// server/services/topup-service.ts
export async function processTopUpPayment(session: Stripe.Checkout.Session) {
  // Check if already processed
  const existing = await storage.getTransactionByStripeId(session.id);
  if (existing) {
    console.log(`⚠️ Duplicate webhook ignored: ${session.id}`);
    return; // Exit early
  }

  // Process payment...
}
```

### Test Fix
```bash
# Trigger webhook twice
EVENT_ID=$(stripe trigger checkout.session.completed --format json | jq -r '.id')
stripe events resend $EVENT_ID
stripe events resend $EVENT_ID

# Check credits (should be added only once)
curl http://localhost:5000/api/credits/balance
```

---

## Issue 4: "Checkout session expired"

### Symptoms
```
This Checkout Session has expired and is no longer available for display.
```

### Root Cause
Checkout session URLs expire after 24 hours

### Quick Fix

**Don't cache checkout URLs**:
```typescript
// ❌ BAD: Storing checkout URL
const checkoutUrl = await createCheckoutSession();
await storage.saveCheckoutUrl(checkoutUrl); // Don't do this

// ✅ GOOD: Generate fresh session on-demand
app.post('/api/checkout/create', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    // Fresh session every time
  });
  res.json({ url: session.url }); // Return immediately
});
```

---

## Issue 5: "Test card declined in production"

### Symptoms
```
Your card was declined
```

### Root Cause
Using test card in live mode

### Quick Fix

**Check Stripe mode**:
```bash
echo $STRIPE_MODE
# Development: test
# Production: live
```

**Verify you're not using test cards**:
```
Test card: 4242424242424242 ❌
Real card: 4532XXXXXXXXXXXX ✅
```

**Environment-specific test approach**:
- **Local/Staging**: Use test mode + test cards
- **Production**: Use live mode + real cards (low-value test purchases)

---

## Issue 6: "No such price: price_xxxxxxxxxxxxx"

### Symptoms
```
Error: No such price: 'price_test_xxxxxxxxxxxxx'; a similar object exists in live mode, but a test mode key was used to make this request.
```

### Root Cause
Price ID mismatch between test/live mode

### Quick Fix

**Step 1**: Verify mode consistency
```bash
# Check Stripe mode
echo $STRIPE_MODE

# Check price IDs
cat .env | grep STRIPE_PRICE
```

**Step 2**: Ensure price IDs match mode
```
Test mode:  STRIPE_PRICE_TOPUP_100=price_test_xxxxxxxxxxxxx
Live mode:  STRIPE_PRICE_TOPUP_100=price_live_xxxxxxxxxxxxx
```

**Step 3**: Recreate products if needed
```bash
# For test mode
STRIPE_MODE=test npm run setup-stripe-products

# For live mode (use cautiously!)
STRIPE_MODE=live npm run setup-stripe-products
```

---

## Issue 7: "Webhook timeout (30s)"

### Symptoms
- Stripe Dashboard shows webhook timed out
- Multiple retry attempts

### Root Cause
Webhook handler taking >30 seconds

### Quick Fix

**Return 200 OK immediately**:
```typescript
router.post('/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(/* ... */);

  // ✅ Return immediately
  res.json({ received: true });

  // ⏰ Process asynchronously
  processWebhookAsync(event).catch(error => {
    console.error('Async webhook processing failed:', error);
  });
});

async function processWebhookAsync(event: Stripe.Event) {
  // Heavy processing here
  await addCredits(/*...*/);
  await sendEmail(/*...*/);
}
```

### Best Practices
- Return 200 OK within 5 seconds
- Process heavy logic asynchronously
- Use background jobs for email sending

---

## Issue 8: "3D Secure authentication not working"

### Symptoms
- Checkout shows "Authentication required"
- Payment stuck in processing

### Root Cause
3D Secure not configured correctly

### Quick Test
```bash
# Test card that requires 3D Secure
# Card: 4000002500003155
```

### Expected Behavior
1. Enter card details
2. 3D Secure modal appears
3. Complete authentication
4. Payment succeeds

### Quick Fix

**Ensure Stripe Checkout handles SCA**:
```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'], // Stripe handles 3DS automatically
  line_items: [/*...*/],
  success_url: '...',
  cancel_url: '...',
});
```

**Test 3D Secure flow**:
```bash
# Use test card
Card: 4000002500003155
CVC: 123
Expiry: 12/34

# Complete authentication when prompted
# Should succeed
```

---

## Issue 9: "Database constraint violation"

### Symptoms
```
ERROR: duplicate key value violates unique constraint "unique_stripe_transaction_id"
```

### Root Cause
Good! This means idempotency is working.

### Quick Fix

**This is expected behavior**. Add error handling:
```typescript
try {
  await storage.createTransaction({
    stripeTransactionId: session.id, // Unique constraint
    userId,
    amount: credits,
  });
} catch (error) {
  if (error.code === '23505') { // PostgreSQL duplicate key error
    console.log(`✅ Transaction already processed: ${session.id}`);
    return; // Exit gracefully
  }
  throw error; // Re-throw other errors
}
```

---

## Issue 10: "Subscription renewal not adding credits"

### Symptoms
- Subscription active
- Invoice paid
- Credits not added on renewal

### Debugging Steps

**1. Check webhook received**:
```bash
stripe events list --type invoice.payment_succeeded --limit 5
```

**2. Check subscription ID**:
```sql
SELECT * FROM subscriptions WHERE stripe_subscription_id = 'sub_xxxxxxxxxxxxx';
```

**3. Check invoice webhook handler**:
```typescript
// server/routes/stripe-webhooks.ts
case 'invoice.payment_succeeded': {
  const invoice = event.data.object as Stripe.Invoice;
  console.log(`📝 Invoice payment succeeded: ${invoice.id}`);
  await subscriptionService.handleInvoicePaymentSucceeded(invoice);
  break;
}
```

### Quick Fix

**Implement invoice handler**:
```typescript
// server/services/subscription-service.ts
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Skip if not subscription invoice
  if (!invoice.subscription) return;

  // Get subscription
  const subscription = await storage.getSubscriptionByStripeId(invoice.subscription);
  if (!subscription) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }

  // Add renewal credits
  const credits = subscription.tier === 'PRO' ? 100 : 280;
  await storage.addCredits(subscription.userId, credits);

  // Log renewal
  await storage.createTransaction({
    userId: subscription.userId,
    type: 'subscription_renewal',
    amount: credits,
    stripeInvoiceId: invoice.id,
  });

  console.log(`✅ Renewal credits added: ${credits} for user ${subscription.userId}`);
}
```

---

## Quick Diagnostic Commands

### Check Stripe Configuration
```bash
# Verify mode
echo $STRIPE_MODE

# Verify keys configured
env | grep STRIPE | grep -v SECRET

# Test Stripe API access
stripe customers list --limit 1
```

### Check Webhook Status
```bash
# List recent webhooks
stripe events list --limit 10

# Check specific webhook
stripe events retrieve evt_xxxxxxxxxxxxx

# Resend webhook
stripe events resend evt_xxxxxxxxxxxxx
```

### Check Database State
```sql
-- Recent transactions
SELECT * FROM credit_transactions
ORDER BY created_at DESC
LIMIT 10;

-- User balances
SELECT id, email, credit_balance
FROM users
ORDER BY credit_balance DESC
LIMIT 10;

-- Active subscriptions
SELECT * FROM subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;
```

### Check Server Health
```bash
# Health endpoint
curl http://localhost:5000/api/health

# Credit balance
curl -H "Cookie: session=xxx" \
  http://localhost:5000/api/credits/balance

# Recent transactions
curl -H "Cookie: session=xxx" \
  http://localhost:5000/api/credits/transactions
```

---

## Emergency Rollback Procedures

### Scenario 1: Mass Double-Crediting

**Symptoms**: All users received double credits

**Quick Fix**:
```sql
-- Identify duplicate transactions
SELECT stripe_transaction_id, COUNT(*) as count, SUM(amount) as total_credits
FROM credit_transactions
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY stripe_transaction_id
HAVING COUNT(*) > 1;

-- Rollback duplicates (BE CAREFUL!)
-- Backup first!
BEGIN;

-- Delete duplicate transactions
DELETE FROM credit_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY stripe_transaction_id
      ORDER BY created_at DESC
    ) as row_num
    FROM credit_transactions
  ) t
  WHERE row_num > 1
);

-- Recalculate user balances
UPDATE users u
SET credit_balance = (
  SELECT COALESCE(SUM(amount), 0)
  FROM credit_transactions
  WHERE user_id = u.id
);

COMMIT; -- Only commit after verification!
```

### Scenario 2: Webhook Processing Stopped

**Symptoms**: No credits added for last N minutes

**Quick Fix**:
```bash
# 1. Check if server is running
curl http://localhost:5000/api/health

# 2. Check Stripe CLI listener
# Restart listener:
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# 3. Manually replay missed webhooks
stripe events list --created "gte=$(date -d '1 hour ago' +%s)" --limit 50
# Resend each missed event:
stripe events resend evt_xxxxxxxxxxxxx
```

### Scenario 3: Production Outage During High Traffic

**Symptoms**: Server down during checkout

**Quick Fix**:
```bash
# 1. Restore service
docker restart app_container
# or
npm run dev

# 2. Check webhook retry queue
# Stripe Dashboard → Developers → Webhooks
# Check "Recent deliveries" for failed webhooks

# 3. Manually process failed checkouts
stripe checkout sessions list --created "gte=$(date -d '1 hour ago' +%s)" --status complete
# For each completed session without transaction:
# - Verify payment succeeded
# - Manually trigger webhook or add credits via admin endpoint
```

---

## Preventive Measures

### Daily Checks
- [ ] Review Stripe Dashboard for failed webhooks
- [ ] Check server error logs for payment issues
- [ ] Verify credit balance anomalies
- [ ] Monitor subscription churn rate

### Weekly Checks
- [ ] Reconcile Stripe payments vs database credits
- [ ] Review dispute/refund requests
- [ ] Check for abnormal credit usage patterns
- [ ] Update test data for QA environment

### Monthly Checks
- [ ] Rotate Stripe API keys (if policy requires)
- [ ] Review and update webhook endpoints
- [ ] Audit admin credit adjustments
- [ ] Generate financial reconciliation report

---

## Contact & Escalation

### Internal Support
- **Development Team**: For code/logic issues
- **DevOps Team**: For server/deployment issues
- **Finance Team**: For reconciliation discrepancies

### External Support
- **Stripe Support**: https://support.stripe.com
- **Stripe Discord**: https://stripe.com/discord (fast community help)
- **Stripe Status**: https://status.stripe.com (check for outages)

### Emergency Contacts
- **P1 Incident**: Payments completely broken
  - Page on-call engineer
  - Check Stripe Status
  - Enable maintenance mode if needed

- **P2 Incident**: Partial payment issues
  - Log detailed error information
  - Manual processing as temporary workaround
  - Schedule fix within 24 hours

---

## Additional Resources

- **Main Guide**: [STRIPE_TESTING_GUIDE.md](./STRIPE_TESTING_GUIDE.md)
- **Test Checklist**: [STRIPE_TEST_CHECKLIST.md](./STRIPE_TEST_CHECKLIST.md)
- **Stripe Docs**: https://docs.stripe.com
- **Test Cards**: https://docs.stripe.com/testing#cards
- **Webhook Reference**: https://docs.stripe.com/webhooks

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
