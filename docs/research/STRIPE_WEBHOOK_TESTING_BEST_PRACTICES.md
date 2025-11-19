# Stripe Webhook Testing Best Practices

**Research Date**: 2025-11-01
**For**: P3 Interview Academy Phase 6 Testing
**Status**: Ready for Implementation

---

## Overview

This guide provides industry best practices for testing Stripe webhooks in local development, specifically for P3's credit purchase integration (100/500/2000 credit packages).

---

## 1. Local Webhook Testing Workflow

### Step 1: Configure Express for Raw Body Access

**Critical Issue**: Stripe webhook signature verification requires the **raw request body**. If `express.json()` parses the body first, verification will fail.

```typescript
// ❌ WRONG - JSON parsing before webhook route
app.use(express.json());
app.post('/api/webhooks/stripe', webhookHandler);

// ✅ CORRECT - Webhook route FIRST with raw body
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  webhookHandler
);

// THEN apply JSON parsing for other routes
app.use(express.json());
```

**Recommended Pattern for P3**:
```typescript
// server/index.ts or server/routes.ts
import express from 'express';

const app = express();

// 1. Webhook route MUST come before express.json()
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;

    let event;

    try {
      // Verify signature with raw body
      event = stripe.webhooks.constructEvent(
        req.body, // This is a Buffer, not parsed JSON
        sig,
        endpointSecret
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// 2. NOW apply JSON parsing for all other routes
app.use(express.json());
```

### Step 2: Start Stripe CLI Listener

```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Forward Stripe webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

**Expected Output**:
```
> Ready! You are using Stripe API Version [2024-11-20]. Your webhook signing secret is
> whsec_abc123xyz456... (^C to quit)
```

**Action Required**: Copy the `whsec_...` secret and update `.env`:
```env
STRIPE_TEST_WEBHOOK_SECRET=whsec_abc123xyz456...
```

**Important**: Restart your dev server after updating the webhook secret!

### Step 3: Test Credit Purchase Flow

1. **Navigate to billing page**: `http://localhost:5000/billing`
2. **Click "Buy Credits"** → Select 100 credits ($10)
3. **Use test card**: `4242 4242 4242 4242`
4. **Complete payment**
5. **Monitor webhook listener** (Terminal 2):
   ```
   2024-11-01 15:30:45  --> checkout.session.completed [evt_1ABC...]
   ```

6. **Verify in dev server logs** (Terminal 1):
   ```
   ✅ Webhook received: checkout.session.completed
   ✅ Credits added: 100 credits for user test-user-123
   ✅ New balance: 350 credits
   ✅ Email sent to user@example.com
   ```

7. **Check database**:
   ```bash
   psql $DATABASE_URL -c "SELECT credit_balance FROM users WHERE id = 'test-user-123';"
   ```

---

## 2. Webhook Signature Verification Best Practices

### Test vs Live Mode Secrets

**Critical**: Stripe uses **different signing secrets** for test and live webhooks.

```typescript
// ❌ WRONG - Hardcoded secret
const endpointSecret = 'whsec_test123';

// ✅ CORRECT - Environment-based secret
const endpointSecret = process.env.STRIPE_MODE === 'live'
  ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
  : process.env.STRIPE_TEST_WEBHOOK_SECRET;
```

### Signature Verification Implementation

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Stripe's constructEvent() verifies the signature
    event = stripe.webhooks.constructEvent(
      req.body,    // Must be raw Buffer
      sig,         // Stripe-Signature header
      endpointSecret
    );
  } catch (err) {
    const error = err as Error;
    console.error('❌ Webhook signature verification failed:', error.message);

    // Return 400 to tell Stripe the webhook failed
    return res.status(400).json({
      success: false,
      error: `Webhook Error: ${error.message}`
    });
  }

  // Signature verified! Process the event
  console.log('✅ Webhook signature verified:', event.id);

  // ... handle event logic
}
```

---

## 3. Testing Webhook Event Handling

### Test Scenarios

#### Scenario 1: Successful Credit Purchase
```bash
# 1. Start webhook listener
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# 2. Trigger test event (alternative to UI flow)
stripe trigger checkout.session.completed
```

**Expected Response**:
```json
{
  "received": true
}
```

**Verify**:
- ✅ User's credit balance increased
- ✅ Transaction logged in `credit_transactions` table
- ✅ Confirmation email sent
- ✅ Webhook logged in Stripe Dashboard

#### Scenario 2: Duplicate Webhook Delivery (Idempotency)

Stripe may send the same webhook multiple times. **Must be idempotent**.

```typescript
// Check if event already processed using Stripe's event ID
const existingTransaction = await db.creditTransactions.findFirst({
  where: { stripeEventId: event.id }
});

if (existingTransaction) {
  console.log(`⚠️ Event ${event.id} already processed, skipping`);
  return res.json({ received: true }); // Still return 200 to Stripe
}

// Process the webhook...
await db.creditTransactions.create({
  data: {
    userId: session.metadata.userId,
    amount: creditAmount,
    stripeEventId: event.id, // Store event ID to prevent duplicates
    type: 'topup',
    status: 'completed'
  }
});
```

#### Scenario 3: Failed Payment
```bash
# Test with declined card in UI
# Card: 4000 0000 0000 9995

# Or trigger test failure event
stripe trigger payment_intent.payment_failed
```

**Expected Behavior**:
- ❌ No credits added
- ✅ Error logged
- ✅ User notified of failure

#### Scenario 4: Invalid Signature (Security Test)
```bash
# Manually send webhook with wrong signature (simulate attack)
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid_signature" \
  -d '{"type": "checkout.session.completed"}'
```

**Expected Response**: `400 Bad Request`

---

## 4. Monitoring and Debugging

### Stripe CLI Commands

```bash
# View real-time API logs
stripe logs tail

# List recent webhook events
stripe events list --limit 10

# View specific event details
stripe events retrieve evt_1ABC...

# List all products
stripe products list

# List all prices
stripe prices list

# Test specific event type
stripe trigger checkout.session.completed
```

### Debugging Checklist

When webhooks aren't working:

1. **Check webhook listener is running**:
   ```bash
   # Look for this in Terminal 2
   > Ready! You are using Stripe API Version...
   ```

2. **Verify webhook secret matches**:
   ```bash
   # Compare stripe listen output with .env
   grep STRIPE_TEST_WEBHOOK_SECRET .env
   ```

3. **Check Express middleware order**:
   ```typescript
   // Webhook route MUST be before express.json()
   ```

4. **Review server logs for errors**:
   ```
   ❌ Webhook signature verification failed
   ❌ No such customer
   ❌ Price ID not found
   ```

5. **Check Stripe Dashboard logs**:
   - https://dashboard.stripe.com/test/logs
   - Look for failed webhook deliveries

---

## 5. Staging/Production Webhook Registration

### For Staging Environment

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**:
   ```
   https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/webhooks/stripe
   ```

4. **Select events**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Copy signing secret** → Update AWS environment variables:
   ```bash
   eb setenv STRIPE_TEST_WEBHOOK_SECRET=whsec_staging_secret \
     --environment p3-interview-academy-staging
   ```

### For Production (After Staging Approval)

**⚠️ CRITICAL**: Use HTTPS for production webhooks!

1. **Switch to Live Mode** in Stripe Dashboard
2. **Register endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Update production environment**:
   ```bash
   eb setenv \
     STRIPE_MODE=live \
     STRIPE_LIVE_WEBHOOK_SECRET=whsec_live_secret \
     --environment p3-interview-academy-prod-v2
   ```

---

## 6. Security Best Practices

### ✅ DO
- **Always verify webhook signatures** using `stripe.webhooks.constructEvent()`
- **Use environment-specific secrets** (test vs live)
- **Implement idempotency** using Stripe's event ID
- **Log webhook events** for debugging and audit trails
- **Use HTTPS** for staging/production endpoints
- **Return 200** even if business logic fails (to prevent retries)

### ❌ DON'T
- **Don't parse request body** before signature verification
- **Don't use live secrets** in test mode (or vice versa)
- **Don't process duplicate events** without checking
- **Don't expose webhook errors** to attackers (generic 400 response)
- **Don't trust event data** without signature verification
- **Don't use HTTP** for production webhooks

---

## 7. Testing Checklist for P3

Before Monday staging deployment:

### Local Development Testing
- [ ] Stripe CLI installed and logged in
- [ ] Webhook listener running in separate terminal
- [ ] Webhook secret copied from listener output to `.env`
- [ ] Dev server restarted after secret update
- [ ] 100 credit package purchase completes successfully
- [ ] Credits added to user account (verify in database)
- [ ] Transaction logged in `credit_transactions` table
- [ ] Confirmation email sent (if SMTP configured)
- [ ] Webhook signature verified (no errors in logs)
- [ ] Test with declined card (4000 0000 0000 9995)
- [ ] Test duplicate webhook delivery (credits not added twice)

### Stripe Dashboard Verification
- [ ] Checkout session created in test mode
- [ ] Payment succeeded in Payments tab
- [ ] Customer created in Customers tab
- [ ] Event delivered in Webhooks → Events tab

### Code Review
- [ ] Webhook route defined BEFORE `express.json()`
- [ ] Using `express.raw({ type: 'application/json' })`
- [ ] Signature verification implemented correctly
- [ ] Idempotency check using `event.id`
- [ ] Error handling returns 400 for invalid signatures
- [ ] Success response returns 200

### Staging Deployment Prep
- [ ] Webhook endpoint registered in Stripe Dashboard (test mode)
- [ ] Signing secret added to AWS environment variables
- [ ] All 5 Price IDs configured in staging environment
- [ ] Staging URL uses HTTPS (if available)

---

## 8. Common Pitfalls and Solutions

### Issue: "Webhook signature verification failed"

**Cause**: Webhook secret mismatch or body already parsed

**Solution**:
1. Copy exact secret from `stripe listen` output
2. Update `.env` file
3. Restart dev server
4. Ensure webhook route is BEFORE `express.json()`

### Issue: "No such price: price_xxx"

**Cause**: Price IDs don't match Stripe Dashboard

**Solution**:
```bash
# List all prices in Stripe
stripe prices list

# Update .env with correct IDs
STRIPE_PRICE_TOPUP_100=price_1SLN3kRYjG8QUIcykni1o8wq
```

### Issue: Credits not added after payment

**Cause**: Webhook handler not called or error in service

**Solution**:
1. Check webhook listener terminal for events
2. Check dev server logs for errors
3. Verify `processTopUpPayment()` is being called
4. Check database permissions

### Issue: Webhook endpoint not found (404)

**Cause**: Route not registered or incorrect path

**Solution**:
```typescript
// Verify route is registered
app.post('/api/webhooks/stripe', webhookHandler);

// Test with curl
curl -X POST http://localhost:5000/api/webhooks/stripe
# Should return 400 (signature error), not 404
```

---

## 9. References

### Official Stripe Documentation
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Test Cards**: https://stripe.com/docs/testing#cards
- **Webhook Signatures**: https://stripe.com/docs/webhooks/signatures

### P3 Documentation
- **Main Testing Guide**: `docs/redesign/STRIPE_TESTING_GUIDE.md`
- **Product Configuration**: `docs/redesign/STRIPE_CREDIT_PRODUCTS.md`
- **Master Plan**: `docs/redesign/MASTER_PLAN.md` (Phase 5)

---

**Last Updated**: 2025-11-01
**Status**: ✅ Ready for Implementation
**Next Step**: Write integration tests (see `INTEGRATION_TEST_EXAMPLES.md`)
