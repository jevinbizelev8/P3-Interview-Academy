# Stripe Payment Testing Checklist

**Quick Reference**: Copy-paste ready test checklist for Phase 9.7
**Companion to**: [STRIPE_TESTING_GUIDE.md](./STRIPE_TESTING_GUIDE.md)

---

## Pre-Testing Setup ✓

### Environment Setup
- [ ] Stripe test account created
- [ ] Stripe CLI installed (`stripe --version`)
- [ ] `.env` configured with test keys
- [ ] Products/prices created (`npm run setup-stripe-products`)
- [ ] Local server running (`npm run dev`)
- [ ] Stripe CLI listener active (`stripe listen --forward-to localhost:5000/api/webhooks/stripe`)
- [ ] Webhook secret copied to `.env`

### Verification Commands
```bash
# Check Stripe mode
echo $STRIPE_MODE  # Should output: test

# Verify price IDs configured
cat .env | grep STRIPE_PRICE

# Test database connectivity
npm run db:push

# Health check
curl http://localhost:5000/api/health
```

---

## A. Happy Path Tests (25 scenarios) ✓

### Subscription Purchases

**A1. Pro Monthly Subscription ($10/month, 100 credits)**
- [ ] Navigate to `/billing`
- [ ] Click "Subscribe to Pro"
- [ ] Complete checkout with card `4242424242424242`
- [ ] Verify redirect to `/billing?success=true`
- [ ] Verify credits: +100
- [ ] Verify subscription status: `active`
- [ ] Verify webhook `customer.subscription.created` received

**A2. Advanced Monthly Subscription ($28/month, 280 credits)**
- [ ] Navigate to `/billing`
- [ ] Click "Subscribe to Advanced"
- [ ] Complete checkout with card `4242424242424242`
- [ ] Verify credits: +280
- [ ] Verify subscription tier: `ADVANCED`

### One-Time Top-Ups

**A3. Buy 100 Credits ($10)**
- [ ] Click "Buy 100 Credits"
- [ ] Complete checkout
- [ ] Verify credits: +100
- [ ] Verify payment mode: `payment` (not subscription)
- [ ] Verify webhook `checkout.session.completed` received

**A4. Buy 500 Credits ($45 - 10% savings)**
- [ ] Click "Buy 500 Credits"
- [ ] Complete checkout
- [ ] Verify credits: +500
- [ ] Verify price: $45.00

**A5. Buy 2000 Credits ($160 - 20% savings)**
- [ ] Click "Buy 2000 Credits"
- [ ] Complete checkout
- [ ] Verify credits: +2000
- [ ] Verify price: $160.00

### Recurring Billing

**A6. First Monthly Renewal (Pro)**
- [ ] Trigger: `stripe trigger invoice.payment_succeeded`
- [ ] Verify credits: +100 (added to existing balance)
- [ ] Verify subscription remains active

**A7. First Monthly Renewal (Advanced)**
- [ ] Trigger: `stripe trigger invoice.payment_succeeded`
- [ ] Verify credits: +280 (added to existing balance)

**A8. Second Monthly Renewal**
- [ ] Wait 30 days or trigger manually
- [ ] Verify credits added correctly

**A9. Plan Upgrade (Pro → Advanced)**
- [ ] Subscribe to Pro
- [ ] Upgrade to Advanced
- [ ] Verify proration calculation
- [ ] Verify credit adjustment

**A10. Plan Downgrade (Advanced → Pro)**
- [ ] Subscribe to Advanced
- [ ] Downgrade to Pro
- [ ] Verify proration
- [ ] Verify no credit loss

### Multiple Purchases

**A11. Sequential Top-Ups (100 + 500 credits)**
- [ ] Buy 100 credits
- [ ] Verify balance: +100
- [ ] Buy 500 credits
- [ ] Verify balance: +600 total

**A12. Subscription + Top-Up**
- [ ] Subscribe to Pro (100 credits)
- [ ] Buy 500 credits
- [ ] Verify balance: 600 total

**A13. Multiple 100-Credit Top-Ups (3x)**
- [ ] Buy 100 credits (1st)
- [ ] Buy 100 credits (2nd)
- [ ] Buy 100 credits (3rd)
- [ ] Verify total: 300 credits

**A14. Upgrade Subscription**
- [ ] Active Pro subscription
- [ ] Upgrade to Advanced via billing page
- [ ] Verify immediate credit adjustment

**A15. Downgrade Subscription**
- [ ] Active Advanced subscription
- [ ] Downgrade to Pro via billing page
- [ ] Verify credit handling

### Checkout Variations

**A16. Saved Payment Method**
- [ ] Complete first purchase
- [ ] Start second checkout
- [ ] Verify saved card appears
- [ ] Complete with saved card

**A17. Different Currencies (if supported)**
- [ ] Test with non-USD currency
- [ ] Verify currency conversion

**A18. Promotional Code (if applicable)**
- [ ] Enter promo code at checkout
- [ ] Verify discount applied

**A19. Guest Purchase → Account Creation**
- [ ] Start purchase without login
- [ ] Create account during checkout
- [ ] Verify credits linked to new account

**A20. Authenticated User Purchase**
- [ ] Login first
- [ ] Complete purchase
- [ ] Verify faster checkout (pre-filled info)

### Post-Purchase Experience

**A21. Email Confirmation**
- [ ] Complete purchase
- [ ] Check email inbox
- [ ] Verify receipt email received
- [ ] Verify purchase details correct

**A22. Receipt Generation**
- [ ] Complete purchase
- [ ] Navigate to `/billing`
- [ ] Click "View Receipt"
- [ ] Verify PDF/receipt generated

**A23. Real-Time Credit Update**
- [ ] Open billing page
- [ ] Complete purchase in new tab
- [ ] Refresh billing page
- [ ] Verify balance updates immediately

**A24. Transaction History**
- [ ] Navigate to transaction history
- [ ] Verify purchase appears
- [ ] Verify timestamp, amount, type correct

**A25. Billing Page Subscription Display**
- [ ] Subscribe to any plan
- [ ] Navigate to `/billing`
- [ ] Verify subscription card shows:
  - Current plan
  - Next billing date
  - Manage subscription button

---

## B. Error & Edge Cases (30 scenarios) ✓

### Declined Cards

**B1. Insufficient Funds (Card: `4000000000009995`)**
- [ ] Attempt purchase with this card
- [ ] Verify error message: "Your card has insufficient funds"
- [ ] Verify no credits added
- [ ] Verify no transaction created
- [ ] Verify user can retry

**B2. Card Declined (Card: `4000000000000002`)**
- [ ] Attempt purchase
- [ ] Verify error: "Your card was declined"
- [ ] Verify retry option available

**B3. Incorrect CVC (Card: `4000000000000127`)**
- [ ] Attempt purchase
- [ ] Verify error: "Your card's security code is incorrect"

**B4. Expired Card (Card: `4000000000000069`)**
- [ ] Attempt purchase
- [ ] Verify error: "Your card has expired"

**B5. Processing Error (Card: `4000000000000119`)**
- [ ] Attempt purchase
- [ ] Verify error: "An error occurred while processing your card"

### Fraud Prevention

**B6. Fraud Suspected (Card: `4100000000000019`)**
- [ ] Attempt purchase
- [ ] Verify Stripe Radar blocks payment
- [ ] Verify user notified

**B7. High Risk (Card: `4000000000004954`)**
- [ ] Attempt purchase
- [ ] Verify extra verification required
- [ ] Verify payment only proceeds after verification

**B8. 3D Secure Required (Card: `4000002500003155`)**
- [ ] Attempt purchase
- [ ] Verify 3D Secure modal appears
- [ ] Complete authentication
- [ ] Verify payment succeeds

**B9. 3D Secure Fails (Card: `4000008400001629`)**
- [ ] Attempt purchase
- [ ] 3D Secure authentication fails
- [ ] Verify payment blocked
- [ ] Verify user can retry

**B10. Rate Limiting**
- [ ] Attempt 10+ rapid purchases
- [ ] Verify rate limiting kicks in
- [ ] Verify error message shown

### Concurrent Purchases

**B11. Two Users Purchase Simultaneously**
- [ ] User A starts checkout
- [ ] User B starts checkout
- [ ] Both complete purchases simultaneously
- [ ] Verify both receive correct credits
- [ ] Verify no race conditions

**B12. Same User Duplicate Purchase (Idempotency)**
- [ ] Complete purchase (session ID: `cs_test_xxx`)
- [ ] Replay webhook with same session ID
- [ ] Verify credits only added once
- [ ] Verify transaction created only once

**B13. Two Checkout Sessions Same User**
- [ ] Open checkout in Tab 1
- [ ] Open checkout in Tab 2
- [ ] Complete both simultaneously
- [ ] Verify credits added correctly for both
- [ ] Verify no double-charge

**B14. Webhook Before Checkout Redirect**
- [ ] Start checkout
- [ ] Webhook arrives before user redirected
- [ ] User redirected after webhook processed
- [ ] Verify credits already added when user sees success page

**B15. Duplicate Webhook Delivery**
- [ ] Complete purchase
- [ ] Manually resend webhook via Stripe Dashboard
- [ ] Verify credits not duplicated
- [ ] Verify idempotency works

### Session Expiration

**B16. Checkout Session Expires (24h)**
- [ ] Create checkout session
- [ ] Wait 24+ hours (or change system clock)
- [ ] Attempt to access checkout URL
- [ ] Verify error: "Session expired"
- [ ] Verify user can create new session

**B17. User Abandons Checkout**
- [ ] Start checkout
- [ ] Click "Cancel" button
- [ ] Verify redirect to `/billing?canceled=true`
- [ ] Verify no charges
- [ ] Verify no credits added

**B18. Browser Closed During Checkout**
- [ ] Start checkout
- [ ] Enter card details
- [ ] Close browser before submitting
- [ ] Verify no charges
- [ ] Verify session can be resumed or recreated

**B19. Network Error During Payment**
- [ ] Start checkout
- [ ] Simulate network disconnection
- [ ] Attempt payment
- [ ] Verify error handling
- [ ] Verify retry mechanism

**B20. Webhook Delivery Delayed (>5 min)**
- [ ] Complete purchase
- [ ] Simulate webhook delay (pause Stripe CLI)
- [ ] Wait 10 minutes
- [ ] Resume webhook delivery
- [ ] Verify credits added correctly (eventually)

### Subscription Edge Cases

**B21. Cancel Immediately After Creation**
- [ ] Subscribe to Pro
- [ ] Immediately cancel subscription
- [ ] Verify initial credits retained
- [ ] Verify no future charges

**B22. Invoice Payment Fails (Expired Card)**
- [ ] Subscribe with valid card
- [ ] Update card to expired test card
- [ ] Wait for renewal date
- [ ] Trigger: `stripe trigger invoice.payment_failed`
- [ ] Verify subscription status: `past_due`
- [ ] Verify user notified

**B23. Reactivate Canceled Subscription**
- [ ] Cancel active subscription
- [ ] Immediately resubscribe
- [ ] Verify new subscription created
- [ ] Verify credits added

**B24. Change Payment Method Mid-Cycle**
- [ ] Active subscription
- [ ] Update payment method
- [ ] Verify next renewal uses new card
- [ ] Verify no disruption

**B25. Proration on Plan Change**
- [ ] Subscribe to Pro on day 1
- [ ] Upgrade to Advanced on day 15
- [ ] Verify proration credit applied
- [ ] Verify correct charge amount

### Data Integrity

**B26. Duplicate Webhook Event ID**
- [ ] Process webhook event `evt_xxx`
- [ ] Attempt to process same `evt_xxx` again
- [ ] Verify credits not duplicated
- [ ] Verify database constraint prevents duplicate

**B27. Invalid Price ID**
- [ ] Manually create checkout with invalid price ID
- [ ] Verify error returned
- [ ] Verify no partial transaction created

**B28. User Deleted Before Webhook**
- [ ] Start purchase
- [ ] Delete user from database
- [ ] Webhook arrives
- [ ] Verify graceful error handling
- [ ] Verify no crash

**B29. Database Transaction Rollback**
- [ ] Simulate database error during credit allocation
- [ ] Verify entire transaction rolled back
- [ ] Verify no partial credit added
- [ ] Verify no orphaned transaction record

**B30. Stripe Customer ID Mismatch**
- [ ] User A's Stripe customer ID
- [ ] Manually change to User B's ID
- [ ] Attempt purchase
- [ ] Verify error or correct user credited

---

## C. Webhook Testing (20 scenarios) ✓

### Signature Verification

**C1. Webhook Signature Verification**
- [ ] Valid signature: `stripe trigger checkout.session.completed`
  - Verify: 200 OK, webhook processed
- [ ] Invalid signature: `curl -X POST ... -H "Stripe-Signature: invalid"`
  - Verify: 400 error, webhook rejected
- [ ] Missing signature: `curl -X POST ... (no header)`
  - Verify: 400 error, webhook rejected

### Event Types

**C2. All Webhook Event Types**
- [ ] `checkout.session.completed` (subscription)
  - Trigger: `stripe trigger checkout.session.completed`
  - Verify: Subscription created, credits added
- [ ] `checkout.session.completed` (one-time payment)
  - Verify: Credits added, no subscription created
- [ ] `customer.subscription.created`
  - Trigger: `stripe trigger customer.subscription.created`
  - Verify: Subscription record in database
- [ ] `customer.subscription.updated`
  - Trigger: `stripe trigger customer.subscription.updated`
  - Verify: Subscription status updated
- [ ] `customer.subscription.deleted`
  - Trigger: `stripe trigger customer.subscription.deleted`
  - Verify: Subscription status = `canceled`
- [ ] `invoice.payment_succeeded`
  - Trigger: `stripe trigger invoice.payment_succeeded`
  - Verify: Renewal credits added
- [ ] `invoice.payment_failed`
  - Trigger: `stripe trigger invoice.payment_failed`
  - Verify: Subscription status = `past_due`, user notified
- [ ] `payment_intent.succeeded`
  - Verify: Logged but not double-processed
- [ ] `customer.created`
  - Verify: Logged, no action needed
- [ ] `charge.succeeded`
  - Verify: Logged, no duplicate credit allocation

### Webhook Reliability

**C3. First-Attempt Success**
- [ ] Trigger webhook
- [ ] Server returns 200 OK immediately
- [ ] Verify no retries in Stripe Dashboard

**C4. Webhook Retry (Server Error)**
- [ ] Simulate server 500 error
- [ ] Trigger webhook
- [ ] Verify Stripe retries webhook
- [ ] Verify eventual success

**C5. Idempotency**
- [ ] Process webhook event `evt_xxx`
- [ ] Replay same `evt_xxx`
- [ ] Verify credits added only once
- [ ] Verify no duplicate transactions

**C6. Out-of-Order Events**
- [ ] Trigger `customer.subscription.updated`
- [ ] Then trigger `customer.subscription.created`
- [ ] Verify system handles gracefully
- [ ] Verify final state correct

**C7. Webhook Timeout**
- [ ] Simulate slow server (>30s response)
- [ ] Trigger webhook
- [ ] Verify Stripe times out
- [ ] Verify retry attempted

**C8. Large Webhook Payload**
- [ ] Create subscription with many metadata fields
- [ ] Trigger webhook
- [ ] Verify large payload handled

**C9. Webhook Rate Limiting**
- [ ] Trigger 100+ webhooks rapidly
- [ ] Verify all processed correctly
- [ ] Verify no dropped webhooks

**C10. Webhook Secret Rotation**
- [ ] Note current webhook secret
- [ ] Rotate secret in Stripe Dashboard
- [ ] Update `.env` with new secret
- [ ] Restart server
- [ ] Verify webhooks work with new secret

### Error Handling

**C11. Database Unavailable**
- [ ] Stop database
- [ ] Trigger webhook
- [ ] Verify 500 error returned (Stripe will retry)
- [ ] Restart database
- [ ] Verify retry succeeds

**C12. Invalid User ID in Webhook**
- [ ] Manually craft webhook with invalid user ID
- [ ] Send webhook
- [ ] Verify error logged
- [ ] Verify graceful handling (no crash)

**C13. Credit Allocation Fails**
- [ ] Simulate constraint violation
- [ ] Trigger webhook
- [ ] Verify transaction rolled back
- [ ] Verify retry attempted

**C14. Email Sending Fails**
- [ ] Disable SMTP
- [ ] Trigger webhook
- [ ] Verify credits still added (email failure doesn't block)
- [ ] Verify email failure logged

**C15. Partial Processing Failure**
- [ ] Credits added successfully
- [ ] Email sending fails
- [ ] Verify webhook returns 200 OK (retry not needed)
- [ ] Verify failed email logged for manual follow-up

### Edge Cases

**C16. Webhook Before Checkout Redirect**
- [ ] Complete purchase
- [ ] Webhook arrives in <1s
- [ ] User redirect takes 2s
- [ ] Verify credits already added when user sees success page

**C17. Refund Webhook**
- [ ] Complete purchase
- [ ] Issue refund via Stripe Dashboard
- [ ] Verify `charge.refunded` webhook received
- [ ] Verify credits deducted

**C18. Dispute Webhook**
- [ ] Complete purchase with dispute card (`4000000000009235`)
- [ ] Verify `charge.dispute.created` webhook
- [ ] Verify appropriate action taken

**C19. Partial Refund Webhook**
- [ ] Purchase 100 credits ($10)
- [ ] Issue partial refund ($5)
- [ ] Verify partial credit deduction (50 credits)

**C20. Subscription Trial Ending**
- [ ] Create subscription with trial
- [ ] Wait for trial end date
- [ ] Trigger `customer.subscription.trial_will_end`
- [ ] Verify user notified

---

## D. Test Card Reference ✓

### Success Cards
```
4242424242424242 - Visa (default success)
5555555555554444 - Mastercard
378282246310005  - American Express
6011111111111117 - Discover
```

### Declined Cards
```
4000000000000002 - Generic decline
4000000000009995 - Insufficient funds
4000000000009987 - Lost card
4000000000009979 - Stolen card
4000000000000069 - Expired card
4000000000000127 - Incorrect CVC
4000000000000119 - Processing error
```

### Special Cards
```
4000002500003155 - Requires 3D Secure (success)
4000008400001629 - 3D Secure fails
4000000000004954 - High risk (Radar block)
4100000000000019 - Fraud suspected
```

**Card Details** (use for all test cards):
- Expiry: `12/34` (any future date)
- CVC: `123` (any 3 digits)
- ZIP: `12345` (any valid ZIP)

---

## E. Smoke Test (Quick Production Validation) ✓

**Run these tests immediately after production deployment**

**E1. Pro Subscription Purchase**
- [ ] Complete end-to-end Pro subscription purchase
- [ ] Verify credits added
- [ ] Verify webhook received
- **Time**: 2 minutes

**E2. 100 Credit Top-Up**
- [ ] Complete 100-credit top-up
- [ ] Verify credits added immediately
- **Time**: 1 minute

**E3. Declined Card Handling**
- [ ] Attempt purchase with `4000000000000002`
- [ ] Verify error message shown
- [ ] Verify no charges
- **Time**: 1 minute

**E4. Webhook Signature Verification**
- [ ] Check Stripe Dashboard webhook logs
- [ ] Verify recent webhook delivered successfully
- [ ] Verify 200 OK response
- **Time**: 1 minute

**Total Smoke Test Time**: ~5 minutes

---

## F. Regression Test Suite (After Code Changes) ✓

**Run these tests before every deployment**

### Critical Path (15 minutes)
- [ ] A1 - Pro subscription purchase
- [ ] A3 - 100 credit top-up
- [ ] A4 - 500 credit top-up
- [ ] B1 - Insufficient funds error
- [ ] B2 - Card declined error
- [ ] C1 - Webhook signature verification
- [ ] C2 - Key webhook event types
- [ ] C5 - Idempotency test

### Full Regression (2 hours)
- [ ] All Category A tests (happy path)
- [ ] All Category B tests (errors)
- [ ] All Category C tests (webhooks)

---

## G. Performance Tests ✓

**G1. Checkout Load Test**
- [ ] Simulate 50 concurrent checkouts
- [ ] Verify all complete successfully
- [ ] Verify average response time <2s

**G2. Webhook Processing Speed**
- [ ] Trigger 100 webhooks rapidly
- [ ] Verify all processed within 5s each
- [ ] Verify no timeouts

**G3. Database Query Performance**
- [ ] Check credit balance query time (<100ms)
- [ ] Check transaction history query time (<200ms)
- [ ] Verify no N+1 queries

---

## H. Security Tests ✓

**H1. Webhook Replay Attack**
- [ ] Capture valid webhook
- [ ] Wait 10 minutes
- [ ] Replay webhook with old timestamp
- [ ] Verify rejected (timestamp too old)

**H2. Invalid Webhook Signature**
- [ ] Send webhook with modified payload
- [ ] Verify signature verification fails
- [ ] Verify webhook rejected

**H3. Test Mode in Production**
- [ ] Verify `STRIPE_MODE=live` in production
- [ ] Verify test cards don't work in production
- [ ] Verify separate product/price IDs

**H4. API Key Exposure**
- [ ] Search codebase for hardcoded keys
- [ ] Verify all keys in `.env`
- [ ] Verify `.env` in `.gitignore`

---

## I. Monitoring & Alerts ✓

**Setup Monitoring**
- [ ] Stripe webhook delivery monitoring
- [ ] Failed payment alerts
- [ ] Credit balance anomalies
- [ ] Daily reconciliation report

**Stripe Dashboard Checks**
- [ ] Recent payments tab
- [ ] Webhook delivery logs
- [ ] Customer list
- [ ] Subscription list
- [ ] Disputes tab

---

## J. Documentation & Handoff ✓

**Documentation Checklist**
- [ ] Test results documented
- [ ] Known issues logged
- [ ] Test coverage report generated
- [ ] Automated test suite committed
- [ ] Runbook for production issues created

**Handoff Checklist**
- [ ] QA team trained on test procedures
- [ ] Support team briefed on common issues
- [ ] Monitoring dashboards shared
- [ ] Escalation process documented

---

## Testing Summary

| Category | Total Tests | Est. Time |
|----------|-------------|-----------|
| **A. Happy Path** | 25 | 4-6 hours |
| **B. Error Cases** | 30 | 6-8 hours |
| **C. Webhooks** | 20 | 4-5 hours |
| **D. Reference** | - | - |
| **E. Smoke Test** | 4 | 5 min |
| **F. Regression** | 8-33 | 15 min - 2 hrs |
| **G. Performance** | 3 | 1 hour |
| **H. Security** | 4 | 1 hour |
| **Total** | **75+** | **29-41 hours** |

---

## Quick Commands Reference

```bash
# Setup
stripe login
stripe listen --forward-to localhost:5000/api/webhooks/stripe
npm run setup-stripe-products

# Testing
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# Debugging
stripe events list --limit 10
stripe logs tail
stripe customers list

# Health checks
curl http://localhost:5000/api/health
curl http://localhost:5000/api/credits/balance
```

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
**Status**: Ready for Phase 9.7 Testing
