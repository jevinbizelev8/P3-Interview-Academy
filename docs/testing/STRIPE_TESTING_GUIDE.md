# Stripe Payment Testing Guide - Phase 9.7

**Project**: P3 Interview Academy
**Integration**: Stripe Payment System for Credit Purchases
**Status**: Phase 9.7 (Stripe Payment Testing) - 75+ Test Scenarios Required
**Priority**: HIGH - Critical for Revenue and User Trust
**Last Updated**: 2025-12-02

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Stripe CLI Setup & Usage](#stripe-cli-setup--usage)
4. [Test Scenario Catalog (75+ Scenarios)](#test-scenario-catalog)
5. [Test Card Numbers Reference](#test-card-numbers-reference)
6. [Webhook Testing Guide](#webhook-testing-guide)
7. [Automation Strategy](#automation-strategy)
8. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
9. [Testing Timeline & Effort](#testing-timeline--effort)
10. [Appendix: Stripe Best Practices](#appendix-stripe-best-practices)

---

## Overview

### What We're Testing

P3 Interview Academy uses Stripe for:
- **Subscription Payments**: Pro ($10/month, 100 credits), Advanced ($28/month, 280 credits)
- **One-Time Top-Ups**: 100 credits ($10), 500 credits ($45), 2000 credits ($160)
- **Webhook Processing**: Automated credit allocation and subscription management

### Current Implementation

**Files to Review**:
- `server/config/stripe.ts` - Stripe SDK configuration, price IDs, customer management
- `server/routes/stripe-webhooks.ts` - Webhook event handlers
- `server/scripts/setup-stripe-products.ts` - Product/price creation automation
- `server/services/subscription-service.ts` - Subscription lifecycle management
- `server/services/topup-service.ts` - One-time payment processing

**Key Features**:
- Environment-based mode switching (test/live)
- Automatic Stripe customer creation/retrieval
- Idempotent credit allocation (via unique transaction IDs)
- Webhook signature verification
- Subscription lifecycle handling (created, updated, deleted)
- Invoice payment tracking (succeeded, failed)

---

## Test Environment Setup

### Prerequisites

1. **Stripe Test Account**
   - Sign up at https://dashboard.stripe.com/register
   - Switch to Test Mode (toggle in Stripe Dashboard)
   - Note: Test mode data is completely separate from live mode

2. **Environment Variables** (`.env`)
   ```bash
   # Stripe Configuration
   STRIPE_MODE=test
   STRIPE_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

   # Checkout URLs
   STRIPE_SUCCESS_URL=http://localhost:5000/billing?success=true
   STRIPE_CANCEL_URL=http://localhost:5000/billing?canceled=true
   ```

3. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   curl -s https://packages.stripe.com/api/v1/stripe-cli/latest | sh

   # Windows
   scoop install stripe
   ```

4. **Login to Stripe CLI**
   ```bash
   stripe login
   # Follow browser prompts to authenticate
   ```

5. **Create Stripe Products** (One-time setup)
   ```bash
   npm run setup-stripe-products
   # Or manually:
   npx tsx server/scripts/setup-stripe-products.ts
   ```

### Verification Checklist

- [ ] Stripe test account created and accessible
- [ ] Stripe CLI installed and authenticated (`stripe --version`)
- [ ] All environment variables configured (`.env`)
- [ ] Products and prices created in Stripe Dashboard
- [ ] Price IDs populated in `.env` file
- [ ] Local server running (`npm run dev`)
- [ ] Database accessible and schema up-to-date

---

## Stripe CLI Setup & Usage

### Local Webhook Forwarding

The Stripe CLI allows you to test webhooks locally without deploying to a server.

**Start Webhook Listener**:
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Output:
# > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
# > (add this to your .env as STRIPE_TEST_WEBHOOK_SECRET)
```

**Key Points**:
- Keep this terminal running while testing
- Copy the webhook secret to `.env` as `STRIPE_TEST_WEBHOOK_SECRET`
- All webhook events will be forwarded to your local server
- You'll see real-time logs of incoming webhooks

### Triggering Test Events

**Manual Event Triggering**:
```bash
# Trigger a successful payment
stripe trigger payment_intent.succeeded

# Trigger a checkout session completion
stripe trigger checkout.session.completed

# Trigger a subscription creation
stripe trigger customer.subscription.created

# Trigger an invoice payment
stripe trigger invoice.payment_succeeded
```

**Custom Event Triggering**:
```bash
# Send a specific event from Stripe Dashboard
stripe events resend evt_xxxxxxxxxxxxxx
```

### Monitoring & Debugging

**View Recent Events**:
```bash
# List recent events
stripe events list --limit 10

# View specific event details
stripe events retrieve evt_xxxxxxxxxxxxxx
```

**Test API Calls**:
```bash
# Create a test customer
stripe customers create \
  --email=test@example.com \
  --name="Test User"

# List customers
stripe customers list --limit 5

# Create a checkout session (for testing)
stripe checkout sessions create \
  --mode=payment \
  --line-items[][price]=price_xxxxxxxxxxxxx \
  --line-items[][quantity]=1 \
  --success-url=http://localhost:5000/success \
  --cancel-url=http://localhost:5000/cancel
```

---

## Test Scenario Catalog

### Category A: Happy Path Tests (25 scenarios)

#### A1: Subscription Purchase - Pro Monthly

**Test ID**: STRIPE-A1-001
**Priority**: Critical
**Type**: Manual + Automated

**Steps**:
1. Navigate to billing page (`/billing`)
2. Click "Subscribe to Pro" button
3. Complete Stripe Checkout with test card `4242424242424242`
4. Verify redirect to success page
5. Check user credits increased by 100
6. Verify subscription record created in database
7. Confirm Stripe customer created
8. Verify webhook `checkout.session.completed` received
9. Verify webhook `customer.subscription.created` received

**Expected Results**:
- ✅ User redirected to `/billing?success=true`
- ✅ Credit balance: +100 credits
- ✅ Subscription status: `active`
- ✅ Subscription tier: `PRO`
- ✅ Stripe customer ID stored in database
- ✅ Transaction record created with unique ID
- ✅ Webhook events processed successfully

**Test Data**:
```json
{
  "card": "4242424242424242",
  "expiry": "12/34",
  "cvc": "123",
  "zip": "12345"
}
```

---

#### A2: Subscription Purchase - Advanced Monthly

**Test ID**: STRIPE-A2-002
**Priority**: Critical
**Type**: Manual + Automated

**Steps**: (Similar to A1, but for Advanced tier)
1. Navigate to billing page
2. Click "Subscribe to Advanced" button
3. Complete Stripe Checkout
4. Verify 280 credits added
5. Verify subscription tier = `ADVANCED`

**Expected Results**:
- ✅ Credit balance: +280 credits
- ✅ Subscription tier: `ADVANCED`
- ✅ Monthly charge: $28.00

---

#### A3: One-Time Top-Up - 100 Credits

**Test ID**: STRIPE-A3-003
**Priority**: Critical
**Type**: Manual + Automated

**Steps**:
1. Navigate to billing page
2. Click "Buy 100 Credits" button
3. Complete Stripe Checkout
4. Verify redirect to success page
5. Check user credits increased by 100
6. Verify no subscription created (one-time payment)
7. Verify webhook `checkout.session.completed` received

**Expected Results**:
- ✅ Credit balance: +100 credits
- ✅ Payment mode: `payment` (not `subscription`)
- ✅ One-time charge: $10.00
- ✅ Credits never expire

---

#### A4: One-Time Top-Up - 500 Credits (Popular)

**Test ID**: STRIPE-A4-004
**Priority**: High
**Type**: Manual + Automated

**Steps**: (Similar to A3)
1. Purchase 500 credits top-up
2. Verify 500 credits added
3. Verify price = $45 (10% savings compared to 100-credit package)

**Expected Results**:
- ✅ Credit balance: +500 credits
- ✅ One-time charge: $45.00
- ✅ Savings: 10%

---

#### A5: One-Time Top-Up - 2000 Credits (Bulk)

**Test ID**: STRIPE-A5-005
**Priority**: High
**Type**: Manual + Automated

**Steps**: (Similar to A3)
1. Purchase 2000 credits top-up
2. Verify 2000 credits added
3. Verify price = $160 (20% savings)

**Expected Results**:
- ✅ Credit balance: +2000 credits
- ✅ One-time charge: $160.00
- ✅ Savings: 20%

---

#### A6-A10: Recurring Subscription Billing

**Test ID**: STRIPE-A6-006 to STRIPE-A10-010
**Priority**: Critical
**Type**: Automated (via Stripe CLI)

**Scenarios**:
- **A6**: First monthly renewal (Pro) - 100 credits added
- **A7**: First monthly renewal (Advanced) - 280 credits added
- **A8**: Second monthly renewal - credits added correctly
- **A9**: Annual billing (if applicable)
- **A10**: Proration on plan upgrade (Pro → Advanced)

**Test with Stripe CLI**:
```bash
# Trigger invoice payment for subscription renewal
stripe trigger invoice.payment_succeeded

# Check credit balance after renewal
curl http://localhost:5000/api/credits/balance
```

---

#### A11-A15: Multiple Purchases

**Scenarios**:
- **A11**: Purchase 100 credits, then 500 credits (sequential)
- **A12**: Subscribe to Pro, then buy 500 credit top-up
- **A13**: Multiple 100-credit top-ups (3x)
- **A14**: Upgrade from Pro to Advanced subscription
- **A15**: Downgrade from Advanced to Pro subscription

---

#### A16-A20: Checkout Flow Variations

**Scenarios**:
- **A16**: Complete purchase with saved payment method
- **A17**: Purchase with different currencies (if supported)
- **A18**: Purchase with promotional code (if applicable)
- **A19**: Purchase as guest (then create account)
- **A20**: Purchase as authenticated user

---

#### A21-A25: Post-Purchase Experience

**Scenarios**:
- **A21**: Email confirmation received after purchase
- **A22**: Receipt generated and accessible
- **A23**: Credit balance updates in real-time
- **A24**: Transaction history shows purchase
- **A25**: Billing page shows active subscription

---

### Category B: Error & Edge Cases (30 scenarios)

#### B1: Declined Card - Insufficient Funds

**Test ID**: STRIPE-B1-026
**Priority**: Critical
**Type**: Manual

**Test Card**: `4000000000009995` (Declined - insufficient funds)

**Steps**:
1. Attempt to purchase Pro subscription
2. Use declined test card
3. Observe error handling

**Expected Results**:
- ❌ Payment fails with error message
- ✅ User shown friendly error: "Your card has insufficient funds"
- ✅ No credits added
- ✅ No subscription created
- ✅ User can retry with different card

---

#### B2: Declined Card - Card Declined

**Test ID**: STRIPE-B2-027
**Priority**: Critical
**Type**: Manual

**Test Card**: `4000000000000002` (Generic decline)

**Expected Results**:
- ❌ Payment fails
- ✅ Error message: "Your card was declined"
- ✅ User prompted to try different payment method

---

#### B3: Declined Card - Incorrect CVC

**Test ID**: STRIPE-B3-028
**Priority**: High
**Type**: Manual

**Test Card**: `4000000000000127` (Incorrect CVC)

**Expected Results**:
- ❌ Payment fails
- ✅ Error message: "Your card's security code is incorrect"

---

#### B4: Declined Card - Expired Card

**Test ID**: STRIPE-B4-029
**Priority**: High
**Type**: Manual

**Test Card**: `4000000000000069` (Expired card)

**Expected Results**:
- ❌ Payment fails
- ✅ Error message: "Your card has expired"

---

#### B5: Declined Card - Processing Error

**Test ID**: STRIPE-B5-030
**Priority**: Medium
**Type**: Manual

**Test Card**: `4000000000000119` (Processing error)

**Expected Results**:
- ❌ Payment fails
- ✅ Error message: "An error occurred while processing your card"

---

#### B6-B10: Fraud Prevention

**Scenarios**:
- **B6**: Card suspected of fraud (`4100000000000019`)
- **B7**: Risk level = highest (`4000000000004954`)
- **B8**: Requires 3D Secure authentication (`4000002500003155`)
- **B9**: 3D Secure authentication fails (`4000008400001629`)
- **B10**: Rate limiting (multiple rapid purchases)

---

#### B11-B15: Concurrent Purchases

**Scenarios**:
- **B11**: Two users purchase simultaneously (different sessions)
- **B12**: Same user attempts duplicate purchase (idempotency)
- **B13**: Race condition: two checkout sessions for same user
- **B14**: Webhook received before checkout completion
- **B15**: Webhook received multiple times (retry scenario)

---

#### B16-B20: Session Expiration

**Scenarios**:
- **B16**: Checkout session expires (24h default)
- **B17**: User abandons checkout (cancel button)
- **B18**: User closes browser during checkout
- **B19**: Network error during payment processing
- **B20**: Webhook delivery delayed (>5 minutes)

---

#### B21-B25: Subscription Edge Cases

**Scenarios**:
- **B21**: Cancel subscription immediately after creation
- **B22**: Invoice payment fails (card expired)
- **B23**: Reactivate canceled subscription
- **B24**: Change payment method mid-billing cycle
- **B25**: Proration calculation on plan change

---

#### B26-B30: Data Integrity

**Scenarios**:
- **B26**: Webhook processed twice (duplicate event IDs)
- **B27**: Invalid price ID in checkout session
- **B28**: User deleted before webhook processed
- **B29**: Database transaction rollback during credit allocation
- **B30**: Stripe customer ID mismatch

---

### Category C: Webhook Testing (20 scenarios)

#### C1: Webhook Signature Verification

**Test ID**: STRIPE-C1-056
**Priority**: Critical
**Type**: Automated

**Steps**:
1. Send webhook with valid signature
2. Send webhook with invalid signature
3. Send webhook without signature header

**Test Script**:
```bash
# Valid signature (Stripe CLI handles this)
stripe trigger checkout.session.completed

# Invalid signature (manual curl with wrong signature)
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=invalid_signature" \
  -d '{"type": "checkout.session.completed"}'
```

**Expected Results**:
- ✅ Valid signature: webhook processed
- ❌ Invalid signature: 400 error returned
- ❌ No signature: 400 error returned

---

#### C2: Webhook Event Types

**Test ID**: STRIPE-C2-057
**Priority**: Critical
**Type**: Automated

**Webhook Events to Test**:
1. `checkout.session.completed` (subscription)
2. `checkout.session.completed` (one-time payment)
3. `customer.subscription.created`
4. `customer.subscription.updated`
5. `customer.subscription.deleted`
6. `invoice.payment_succeeded`
7. `invoice.payment_failed`
8. `payment_intent.succeeded`
9. `customer.created`
10. `charge.succeeded`

**Test Each Event**:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
# etc.
```

---

#### C3-C10: Webhook Reliability

**Scenarios**:
- **C3**: Webhook delivered successfully (first attempt)
- **C4**: Webhook retry (server returns 500)
- **C5**: Webhook idempotency (same event ID sent twice)
- **C6**: Webhook ordering (events arrive out of order)
- **C7**: Webhook timeout (slow server response)
- **C8**: Webhook with large payload
- **C9**: Webhook rate limiting
- **C10**: Webhook secret rotation

---

#### C11-C15: Webhook Error Handling

**Scenarios**:
- **C11**: Database unavailable during webhook processing
- **C12**: Invalid user ID in webhook payload
- **C13**: Credit allocation fails (constraint violation)
- **C14**: Email sending fails during webhook
- **C15**: Partial webhook processing failure

---

#### C16-C20: Webhook Edge Cases

**Scenarios**:
- **C16**: Webhook received before checkout redirect
- **C17**: Webhook for refunded payment
- **C18**: Webhook for disputed payment
- **C19**: Webhook for partially refunded payment
- **C20**: Webhook for subscription trial ending

---

## Test Card Numbers Reference

### Success Cards

| Card Number | Description | Use Case |
|-------------|-------------|----------|
| `4242424242424242` | Visa - Success | Default happy path testing |
| `4000056655665556` | Visa (Debit) - Success | Test debit card processing |
| `5555555555554444` | Mastercard - Success | Test Mastercard |
| `378282246310005` | American Express - Success | Test Amex |
| `6011111111111117` | Discover - Success | Test Discover |

### Declined Cards

| Card Number | Decline Code | Error Message |
|-------------|--------------|---------------|
| `4000000000000002` | generic_decline | "Your card was declined" |
| `4000000000009995` | insufficient_funds | "Your card has insufficient funds" |
| `4000000000009987` | lost_card | "Your card was reported lost" |
| `4000000000009979` | stolen_card | "Your card was reported stolen" |
| `4000000000000069` | expired_card | "Your card has expired" |
| `4000000000000127` | incorrect_cvc | "Your card's security code is incorrect" |
| `4000000000000119` | processing_error | "An error occurred while processing your card" |
| `4000000000000259` | rate_limit_error | "Too many requests. Please try again later" |

### Special Behavior Cards

| Card Number | Behavior | Use Case |
|-------------|----------|----------|
| `4000002500003155` | Requires 3D Secure authentication | Test SCA flow |
| `4000008400001629` | 3D Secure authentication fails | Test failed auth |
| `4000000000004954` | High risk (triggers Radar block) | Test fraud prevention |
| `4000000000000341` | Attaches to Customer then declines | Test saved card decline |
| `4000000000009235` | Charge succeeds, but dispute lost | Test dispute handling |

### International Cards

| Card Number | Country | Use Case |
|-------------|---------|----------|
| `4000000400000008` | United States | US card |
| `4000007600000016` | Brazil | International card |
| `4000003800000008` | Malaysia | Southeast Asia card |
| `4000007020000003` | Singapore | Singapore card |

**Complete Card List**: https://docs.stripe.com/testing#cards

---

## Webhook Testing Guide

### Local Webhook Testing Workflow

#### Step 1: Start Webhook Listener

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start Stripe CLI webhook forwarder
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

#### Step 2: Copy Webhook Secret

```bash
# Stripe CLI outputs:
# > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx

# Add to .env:
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Step 3: Restart Server

```bash
# Restart server to load new webhook secret
# Ctrl+C in Terminal 1, then:
npm run dev
```

#### Step 4: Trigger Test Webhooks

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted

# Test invoice events
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

#### Step 5: Verify Webhook Processing

**Check Server Logs**:
```
✅ Webhook received: checkout.session.completed (ID: evt_xxxxxxxxxxxxx)
📝 Checkout session completed: cs_test_xxxxxxxxxxxxx
   → One-time payment (top-up) checkout completed
✅ Top-up processed: 100 credits added for user user_xxxxxxxxxxxxx
```

**Check Database**:
```sql
-- Verify credit transaction created
SELECT * FROM credit_transactions
WHERE transaction_type = 'top_up_purchase'
ORDER BY created_at DESC LIMIT 1;

-- Verify user credit balance
SELECT credit_balance FROM users WHERE id = 'user_xxxxxxxxxxxxx';
```

**Check Stripe Dashboard**:
- Navigate to "Developers" → "Webhooks"
- Click on your webhook endpoint
- View recent deliveries and their status

---

### Webhook Idempotency Testing

Stripe may send the same webhook multiple times. Your system must handle duplicate events gracefully.

**Test Scenario**:
```bash
# Trigger same event twice
EVENT_ID=$(stripe trigger checkout.session.completed --format json | jq -r '.id')
stripe events resend $EVENT_ID
stripe events resend $EVENT_ID
```

**Expected Behavior**:
- First webhook: Credits added, transaction created
- Second webhook: No duplicate credits added (idempotent)
- Database: Only one transaction record with unique ID

**Implementation Check**:
```typescript
// server/services/topup-service.ts
export async function processTopUpPayment(session: Stripe.Checkout.Session) {
  const transactionId = session.id; // Use Stripe session ID as unique transaction ID

  // Check if transaction already processed (idempotency)
  const existingTransaction = await db.query(
    'SELECT id FROM credit_transactions WHERE stripe_transaction_id = $1',
    [transactionId]
  );

  if (existingTransaction.rows.length > 0) {
    console.log(`⚠️ Duplicate webhook: Transaction ${transactionId} already processed`);
    return; // Exit early - don't process again
  }

  // Process payment...
}
```

---

### Webhook Retry Testing

Stripe retries failed webhooks automatically (up to 3 days).

**Simulate Webhook Failure**:
```bash
# Temporarily break webhook endpoint
# Comment out webhook handler logic, or:

# Make server return 500 error
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Stripe-Signature: $(stripe trigger checkout.session.completed --format json | jq -r '.request.headers["Stripe-Signature"]')" \
  -d '{"type": "checkout.session.completed"}'
```

**Check Retry Behavior**:
- Stripe Dashboard → Webhooks → Recent deliveries
- Failed webhooks show retry attempts
- Webhooks retry with exponential backoff

**Best Practice**: Return `200 OK` as soon as possible, then process asynchronously.

---

### Webhook Security Testing

#### Test 1: Missing Signature

```bash
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "checkout.session.completed"}'
```

**Expected**: `400 Bad Request` - "Missing signature"

---

#### Test 2: Invalid Signature

```bash
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=fake_signature" \
  -d '{"type": "checkout.session.completed"}'
```

**Expected**: `400 Bad Request` - "Webhook Error: No signatures found matching the expected signature"

---

#### Test 3: Replay Attack

```bash
# Capture a valid webhook
VALID_WEBHOOK=$(stripe trigger checkout.session.completed --format raw)

# Wait 10 minutes
sleep 600

# Replay the webhook (should fail due to timestamp tolerance)
echo "$VALID_WEBHOOK" | curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: $(echo "$VALID_WEBHOOK" | jq -r '.headers["Stripe-Signature"]')" \
  --data-binary @-
```

**Expected**: `400 Bad Request` - Webhook timestamp too old (default tolerance: 5 minutes)

---

## Automation Strategy

### What to Automate

#### High Priority (Automate First)

1. **Happy Path Purchases** (A1-A5)
   - Subscribe to Pro
   - Subscribe to Advanced
   - Buy 100, 500, 2000 credits
   - *Why*: Core revenue flows, must always work

2. **Declined Card Handling** (B1-B5)
   - Insufficient funds
   - Generic decline
   - Expired card
   - *Why*: Critical error handling, affects user trust

3. **Webhook Processing** (C1-C10)
   - Signature verification
   - Event types
   - Idempotency
   - *Why*: Prevents double-charging and lost payments

4. **Credit Balance Verification**
   - Credits added correctly
   - Balance persists across sessions
   - *Why*: Core value delivery

#### Medium Priority (Automate Later)

5. **Subscription Lifecycle** (A6-A10)
   - Monthly renewals
   - Plan upgrades/downgrades
   - Cancellations

6. **Multiple Purchases** (A11-A15)
   - Sequential purchases
   - Mixed subscription + top-ups

7. **Edge Cases** (B11-B20)
   - Concurrent purchases
   - Session expiration
   - Network errors

#### Low Priority (Manual Testing)

8. **UI/UX Flows**
   - Button interactions
   - Loading states
   - Error message display
   - *Why*: Hard to automate, lower risk

9. **Email Confirmations** (A21)
   - Receipt emails
   - *Why*: Can be manually spot-checked

10. **Complex Scenarios** (B26-B30)
    - Data integrity edge cases
    - *Why*: Rare occurrences, manual testing sufficient

---

### Automated Test Stack

**Recommended Tools**:

1. **Vitest** (existing) - Unit and integration tests
2. **Playwright** (existing) - E2E tests (GitHub Actions only)
3. **Stripe Mock Server** - Offline testing without hitting Stripe API
4. **Custom Test Scripts** - Node.js scripts for specific scenarios

---

### Sample Automated Test (Vitest)

**File**: `server/tests/stripe-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { stripe } from '../config/stripe';
import { subscriptionService } from '../services/subscription-service';
import { topUpService } from '../services/topup-service';
import { storage } from '../storage';

describe('Stripe Integration Tests', () => {
  let testUserId: string;
  let testCustomerId: string;

  beforeEach(async () => {
    // Create test user
    const testUser = await storage.createUser({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'test123',
    });
    testUserId = testUser.id;

    // Create Stripe test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      metadata: { userId: testUserId },
    });
    testCustomerId = customer.id;
  });

  afterEach(async () => {
    // Cleanup: delete test customer
    await stripe.customers.del(testCustomerId);
    // Cleanup: delete test user (if needed)
  });

  describe('Top-Up Purchases', () => {
    it('should add 100 credits for successful top-up payment', async () => {
      // Create a test checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: testCustomerId,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_TOPUP_100,
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:5000/success',
        cancel_url: 'http://localhost:5000/cancel',
      });

      // Simulate checkout completion (mock webhook)
      await topUpService.processTopUpPayment(session as any);

      // Verify credits added
      const user = await storage.getUserById(testUserId);
      expect(user.creditBalance).toBe(100);
    });

    it('should be idempotent (no duplicate credits)', async () => {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: testCustomerId,
        line_items: [
          { price: process.env.STRIPE_PRICE_TOPUP_100, quantity: 1 },
        ],
        success_url: 'http://localhost:5000/success',
        cancel_url: 'http://localhost:5000/cancel',
      });

      // Process payment twice (simulate duplicate webhook)
      await topUpService.processTopUpPayment(session as any);
      await topUpService.processTopUpPayment(session as any);

      // Verify credits only added once
      const user = await storage.getUserById(testUserId);
      expect(user.creditBalance).toBe(100); // NOT 200
    });
  });

  describe('Subscription Purchases', () => {
    it('should create Pro subscription and add 100 credits', async () => {
      const subscription = await stripe.subscriptions.create({
        customer: testCustomerId,
        items: [
          { price: process.env.STRIPE_PRICE_PRO_MONTHLY },
        ],
      });

      // Simulate subscription.created webhook
      await subscriptionService.handleSubscriptionCreated(subscription);

      // Verify subscription created in database
      const dbSubscription = await storage.getSubscriptionByUserId(testUserId);
      expect(dbSubscription).toBeDefined();
      expect(dbSubscription.tier).toBe('PRO');
      expect(dbSubscription.status).toBe('active');

      // Verify credits added
      const user = await storage.getUserById(testUserId);
      expect(user.creditBalance).toBe(100);
    });

    it('should add 280 credits for Advanced subscription', async () => {
      const subscription = await stripe.subscriptions.create({
        customer: testCustomerId,
        items: [
          { price: process.env.STRIPE_PRICE_ADVANCED_MONTHLY },
        ],
      });

      await subscriptionService.handleSubscriptionCreated(subscription);

      const user = await storage.getUserById(testUserId);
      expect(user.creditBalance).toBe(280);
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should reject webhook with invalid signature', async () => {
      const payload = JSON.stringify({ type: 'checkout.session.completed' });
      const invalidSignature = 'invalid_signature';

      // This should throw an error
      expect(() => {
        stripe.webhooks.constructEvent(
          payload,
          invalidSignature,
          process.env.STRIPE_TEST_WEBHOOK_SECRET!
        );
      }).toThrow();
    });
  });
});
```

---

### Running Automated Tests

```bash
# Run all Stripe tests
npm run test -- stripe-integration.test.ts

# Run specific test
npm run test -- -t "should add 100 credits for successful top-up payment"

# Run with coverage
npm run test:coverage -- stripe-integration.test.ts
```

---

### CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/stripe-tests.yml`):

```yaml
name: Stripe Payment Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  stripe-tests:
    runs-on: ubuntu-latest

    env:
      STRIPE_MODE: test
      STRIPE_TEST_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
      STRIPE_TEST_WEBHOOK_SECRET: ${{ secrets.STRIPE_TEST_WEBHOOK_SECRET }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run Stripe integration tests
        run: npm run test -- stripe-integration.test.ts

      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Common Issues & Troubleshooting

### Issue 1: Webhook Signature Verification Failed

**Error Message**:
```
❌ Webhook signature verification failed: No signatures found matching the expected signature for payload
```

**Causes**:
1. Webhook secret not configured or incorrect
2. Server parsing request body as JSON (should be raw buffer)
3. Webhook secret rotated in Stripe Dashboard

**Solutions**:

1. **Verify webhook secret** (`.env`):
   ```bash
   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

2. **Check Express.js configuration** (`server/index.ts`):
   ```typescript
   // IMPORTANT: Webhook route must receive raw body
   app.post(
     '/api/webhooks/stripe',
     express.raw({ type: 'application/json' }), // Raw body for signature verification
     stripeWebhookRouter
   );

   // All other routes can use JSON parsing
   app.use(express.json());
   ```

3. **Restart Stripe CLI listener**:
   ```bash
   # Stop existing listener (Ctrl+C)
   # Start fresh listener
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   # Copy new webhook secret to .env
   ```

4. **Verify secret in Stripe Dashboard**:
   - Go to "Developers" → "Webhooks"
   - Click on webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy to `.env`

---

### Issue 2: Credits Not Added After Purchase

**Symptoms**:
- Checkout completes successfully
- User redirected to success page
- Credits not added to user account

**Debugging Steps**:

1. **Check Stripe Dashboard**:
   - Go to "Payments" → "Recent payments"
   - Verify payment succeeded
   - Check "Events" tab for webhooks

2. **Check Webhook Delivery**:
   - Go to "Developers" → "Webhooks"
   - Check recent deliveries
   - Look for `checkout.session.completed` event
   - Check delivery status (succeeded/failed)

3. **Check Server Logs**:
   ```bash
   # Look for webhook processing logs
   tail -f server.log | grep "Webhook received"
   ```

4. **Check Database**:
   ```sql
   -- Verify transaction created
   SELECT * FROM credit_transactions
   WHERE user_id = 'user_xxxxxxxxxxxxx'
   ORDER BY created_at DESC;

   -- Check user credit balance
   SELECT credit_balance FROM users WHERE id = 'user_xxxxxxxxxxxxx';
   ```

**Common Causes**:
- Webhook not configured or disabled
- Webhook handler error (check logs)
- Database transaction failed
- User ID mismatch

---

### Issue 3: Duplicate Credits Added

**Symptoms**:
- User receives 200 credits instead of 100
- Multiple transaction records for same purchase

**Causes**:
- Idempotency check not implemented
- Webhook received multiple times
- Race condition in credit allocation

**Fix**:
```typescript
// server/services/topup-service.ts
export async function processTopUpPayment(session: Stripe.Checkout.Session) {
  const transactionId = session.id; // Use Stripe session ID

  // Idempotency check
  const existing = await storage.getTransactionByStripeId(transactionId);
  if (existing) {
    console.log(`⚠️ Duplicate webhook: ${transactionId} already processed`);
    return; // Exit early
  }

  // Use database transaction for atomicity
  await storage.transaction(async (trx) => {
    // Add credits
    await storage.addCredits(userId, credits, trx);

    // Create transaction record (with unique constraint)
    await storage.createTransaction({
      userId,
      stripeTransactionId: transactionId, // Unique constraint
      amount: credits,
      type: 'top_up_purchase',
    }, trx);
  });
}
```

**Database Schema**:
```sql
-- Add unique constraint to prevent duplicates
ALTER TABLE credit_transactions
ADD CONSTRAINT unique_stripe_transaction_id
UNIQUE (stripe_transaction_id);
```

---

### Issue 4: Checkout Session Expired

**Error Message**:
```
This Checkout Session has expired and is no longer available for display.
```

**Causes**:
- User returned to checkout URL after 24 hours
- Checkout session URL bookmarked

**Solution**:
- Checkout sessions expire after 24 hours (Stripe default)
- Generate new checkout session when user clicks purchase button
- Don't cache or reuse checkout session URLs

**Best Practice**:
```typescript
// server/routes/subscriptions.ts
app.post('/api/subscriptions/create-checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;

  // Always create fresh checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: userStripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${BASE_URL}/billing?success=true`,
    cancel_url: `${BASE_URL}/billing?canceled=true`,
    // Session expires after 24 hours
  });

  // Return URL immediately (don't store)
  res.json({ url: session.url });
});
```

---

### Issue 5: Webhook Delivery Delayed

**Symptoms**:
- Checkout completes but credits added minutes later
- Webhooks show "Pending" status

**Causes**:
- Server too slow to respond (timeout)
- Network issues
- Stripe retry backoff

**Solutions**:

1. **Respond quickly** (< 5 seconds):
   ```typescript
   router.post('/stripe', async (req, res) => {
     const event = stripe.webhooks.constructEvent(/*...*/);

     // Return 200 OK immediately
     res.json({ received: true });

     // Process webhook asynchronously
     processWebhookAsync(event).catch(error => {
       console.error('Async webhook processing failed:', error);
     });
   });
   ```

2. **Check server performance**:
   ```bash
   # Monitor response times
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health
   ```

3. **Review Stripe Dashboard**:
   - Check webhook delivery attempts
   - Look for 5xx errors or timeouts

---

### Issue 6: Test Mode vs Live Mode Confusion

**Error Message**:
```
No such price: 'price_xxxxxxxxxxxxx'
```

**Causes**:
- Using test mode price ID in live mode (or vice versa)
- Environment variable mismatch

**Solution**:

1. **Verify Stripe mode**:
   ```bash
   echo $STRIPE_MODE  # Should be "test" for development
   ```

2. **Check price IDs**:
   ```bash
   # Test mode price IDs start with price_test_
   # Live mode price IDs start with price_live_

   echo $STRIPE_PRICE_TOPUP_100  # Should start with price_test_ in dev
   ```

3. **Separate test and live configurations**:
   ```bash
   # .env (development)
   STRIPE_MODE=test
   STRIPE_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_PRICE_TOPUP_100=price_test_xxxxxxxxxxxxx

   # .env.production (production)
   STRIPE_MODE=live
   STRIPE_LIVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   STRIPE_PRICE_TOPUP_100=price_live_xxxxxxxxxxxxx
   ```

---

### Issue 7: 3D Secure Authentication Problems

**Test Card**: `4000002500003155` (Requires 3D Secure)

**Error**: Checkout completes but shows "Authentication required"

**Expected Behavior**:
- Stripe Checkout shows 3D Secure modal
- User completes authentication
- Payment succeeds

**Debugging**:
```typescript
// Check if payment method supports 3D Secure
const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
console.log('3D Secure status:', paymentIntent.charges.data[0]?.outcome?.network_status);
```

**Solution**:
- Ensure Stripe Checkout configured to handle SCA
- Test with 3DS test cards regularly

---

### Issue 8: Refund Handling

**Scenario**: User requests refund after purchase

**Steps**:

1. **Issue refund via Stripe Dashboard**:
   - Go to "Payments" → Find payment
   - Click "Refund" button
   - Enter refund amount

2. **Handle refund webhook**:
   ```typescript
   // Add to server/routes/stripe-webhooks.ts
   case 'charge.refunded': {
     const charge = event.data.object as Stripe.Charge;
     console.log(`📝 Charge refunded: ${charge.id}`);

     // Deduct credits from user
     await subscriptionService.handleRefund(charge);
     break;
   }
   ```

3. **Deduct credits**:
   ```typescript
   // server/services/subscription-service.ts
   export async function handleRefund(charge: Stripe.Charge) {
     // Find original transaction
     const transaction = await storage.getTransactionByStripeChargeId(charge.id);
     if (!transaction) {
       console.error('Transaction not found for refund');
       return;
     }

     // Deduct credits
     await storage.deductCredits(transaction.userId, transaction.credits);

     // Create refund transaction record
     await storage.createTransaction({
       userId: transaction.userId,
       type: 'refund',
       amount: -transaction.credits,
       stripeChargeId: charge.id,
     });
   }
   ```

---

## Testing Timeline & Effort

### Phase 1: Test Environment Setup (2-3 hours)

- [ ] Stripe test account setup (30 min)
- [ ] Install and configure Stripe CLI (30 min)
- [ ] Create products/prices via script (30 min)
- [ ] Configure environment variables (30 min)
- [ ] Verify local webhook forwarding (30 min)
- [ ] Test first successful purchase manually (30 min)

**Deliverable**: Fully functional local test environment

---

### Phase 2: Manual Happy Path Testing (4-6 hours)

- [ ] Test all 5 purchase options (A1-A5) (2 hours)
- [ ] Test subscription renewals (A6-A10) (1 hour)
- [ ] Test multiple purchase scenarios (A11-A15) (1 hour)
- [ ] Test checkout variations (A16-A20) (1 hour)
- [ ] Test post-purchase experience (A21-A25) (1 hour)

**Deliverable**: Documented test results for 25 happy path scenarios

---

### Phase 3: Error Scenario Testing (6-8 hours)

- [ ] Test all declined card scenarios (B1-B10) (2 hours)
- [ ] Test concurrent purchase edge cases (B11-B15) (2 hours)
- [ ] Test session expiration scenarios (B16-B20) (1 hour)
- [ ] Test subscription edge cases (B21-B25) (2 hours)
- [ ] Test data integrity scenarios (B26-B30) (1 hour)

**Deliverable**: Documented test results for 30 error scenarios, bug reports

---

### Phase 4: Webhook Testing (4-5 hours)

- [ ] Test webhook signature verification (C1) (1 hour)
- [ ] Test all webhook event types (C2) (1 hour)
- [ ] Test webhook reliability (C3-C10) (1 hour)
- [ ] Test webhook error handling (C11-C15) (1 hour)
- [ ] Test webhook edge cases (C16-C20) (1 hour)

**Deliverable**: Documented webhook test results, idempotency verification

---

### Phase 5: Automated Test Development (8-12 hours)

- [ ] Write automated tests for happy path (4 hours)
- [ ] Write automated tests for error scenarios (3 hours)
- [ ] Write automated webhook tests (3 hours)
- [ ] Configure CI/CD pipeline (2 hours)

**Deliverable**: Automated test suite with >80% coverage

---

### Phase 6: Staging Environment Testing (3-4 hours)

- [ ] Deploy to staging environment (1 hour)
- [ ] Configure staging webhook endpoint (1 hour)
- [ ] Run full test suite in staging (1 hour)
- [ ] Verify production readiness (1 hour)

**Deliverable**: Staging environment validated, deployment checklist

---

### Phase 7: Production Smoke Testing (2-3 hours)

- [ ] Configure production webhooks (1 hour)
- [ ] Run production smoke tests with test cards (1 hour)
- [ ] Monitor first real transactions (1 hour)

**Deliverable**: Production payment system live and monitored

---

### Total Estimated Effort

| Phase | Low Estimate | High Estimate |
|-------|--------------|---------------|
| **Phase 1**: Setup | 2 hours | 3 hours |
| **Phase 2**: Manual Happy Path | 4 hours | 6 hours |
| **Phase 3**: Error Scenarios | 6 hours | 8 hours |
| **Phase 4**: Webhook Testing | 4 hours | 5 hours |
| **Phase 5**: Automation | 8 hours | 12 hours |
| **Phase 6**: Staging | 3 hours | 4 hours |
| **Phase 7**: Production | 2 hours | 3 hours |
| **Total** | **29 hours** | **41 hours** |

**Recommended Timeline**: 5-7 business days (assuming 6-8 hours/day)

**Team Allocation**:
- 1 developer (full-time): 5-7 days
- 2 developers (parallel): 3-4 days
- 1 developer + 1 QA: 4-5 days (optimal)

---

## Appendix: Stripe Best Practices

### Security Best Practices

1. **Never Expose Secret Keys**
   - Use environment variables
   - Never commit keys to version control
   - Rotate keys regularly (every 90 days)

2. **Always Verify Webhook Signatures**
   - Prevents replay attacks
   - Ensures events come from Stripe

3. **Use HTTPS in Production**
   - Stripe requires HTTPS for webhooks
   - Use SSL certificates (Let's Encrypt free)

4. **Implement Idempotency**
   - Prevent duplicate charges
   - Use unique transaction IDs
   - Database constraints for uniqueness

5. **Secure Customer Data**
   - Don't store card numbers
   - Use Stripe's Customer object
   - PCI compliance by default

---

### Performance Best Practices

1. **Respond to Webhooks Quickly**
   - Return `200 OK` within 5 seconds
   - Process heavy logic asynchronously
   - Stripe retries failed webhooks

2. **Use Database Transactions**
   - Atomic credit allocation
   - Rollback on errors
   - Prevent partial updates

3. **Cache Stripe Customer IDs**
   - Store in user table
   - Avoid repeated API calls
   - Faster checkout creation

4. **Implement Rate Limiting**
   - Prevent abuse
   - Limit checkout session creation

---

### Reliability Best Practices

1. **Handle Webhook Retries**
   - Implement idempotency keys
   - Log all webhook events
   - Monitor failed deliveries

2. **Test Edge Cases**
   - Network failures
   - Database outages
   - Concurrent requests

3. **Monitor Stripe Status**
   - Subscribe to Stripe Status (https://status.stripe.com)
   - Implement fallback strategies
   - Alert on webhook failures

4. **Implement Reconciliation**
   - Daily report: Stripe payments vs database credits
   - Identify discrepancies
   - Manual resolution process

---

### User Experience Best Practices

1. **Clear Error Messages**
   - "Your card was declined" (not "Payment failed")
   - Suggest retry with different card
   - Link to support

2. **Show Loading States**
   - "Processing payment..."
   - Disable submit button during processing
   - Prevent double-clicks

3. **Email Confirmations**
   - Send receipt immediately
   - Include purchase details
   - Link to billing page

4. **Transparent Pricing**
   - Show total amount before checkout
   - Explain credit packages
   - Highlight savings (500 & 2000 packages)

---

### Testing Best Practices

1. **Always Use Test Mode**
   - Separate test and live data
   - Use test cards only in test mode
   - Never mix environments

2. **Test Webhooks Locally**
   - Use Stripe CLI for development
   - Verify signature validation
   - Test all event types

3. **Automate Critical Flows**
   - Purchase flows
   - Webhook processing
   - Credit allocation

4. **Monitor Production**
   - Set up Stripe webhook monitoring
   - Alert on failures
   - Review payment logs daily

---

## Quick Reference: Essential Stripe CLI Commands

```bash
# Authentication
stripe login                           # Login to Stripe account

# Webhook Testing
stripe listen --forward-to localhost:5000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe events list --limit 10

# Product Management
stripe products list
stripe prices list
stripe products create --name "Test Product"

# Customer Management
stripe customers create --email test@example.com --name "Test User"
stripe customers list --limit 5
stripe customers retrieve cus_xxxxxxxxxxxxx

# Payment Testing
stripe checkout sessions create \
  --mode payment \
  --line-items[][price]=price_xxxxxxxxxxxxx \
  --line-items[][quantity]=1 \
  --success-url http://localhost:5000/success \
  --cancel-url http://localhost:5000/cancel

# Debugging
stripe logs tail                       # Stream real-time API logs
stripe events retrieve evt_xxxxxxxxxxxxx  # View event details
```

---

## Resources

**Official Stripe Documentation**:
- Testing Guide: https://docs.stripe.com/testing
- Test Cards: https://docs.stripe.com/testing#cards
- Webhooks: https://docs.stripe.com/webhooks
- Stripe CLI: https://docs.stripe.com/stripe-cli

**P3 Project Documentation**:
- Stripe Configuration: `server/config/stripe.ts`
- Webhook Handlers: `server/routes/stripe-webhooks.ts`
- Setup Script: `server/scripts/setup-stripe-products.ts`
- Environment Config: `.env.example`

**Support**:
- Stripe Support: https://support.stripe.com
- Stripe Discord: https://stripe.com/discord
- Stack Overflow: https://stackoverflow.com/questions/tagged/stripe-payments

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-02 | 1.0.0 | Initial guide created with 75+ test scenarios |

---

**End of Stripe Payment Testing Guide**
