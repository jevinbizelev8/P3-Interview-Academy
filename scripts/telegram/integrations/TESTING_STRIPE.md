# Stripe Webhook Testing Guide - P3 Interview Academy

## Overview

This guide walks through comprehensive testing of Stripe webhook integration using the notification wrapper.

## Prerequisites

### 1. Stripe CLI Installed

**Check installation**:
```bash
stripe --version
```

**Expected output**: `stripe version 1.19.5` (or higher)

**If not installed**, see [README_STRIPE.md](README_STRIPE.md#stripe-cli-not-found)

### 2. Stripe CLI Authenticated

**Authenticate**:
```bash
stripe login
```

**Verify authentication**:
```bash
stripe config --list
```

**Expected output** should include:
```
account_id = acct_xxxxx
test_mode_api_key = sk_test_xxxxx
```

### 3. P3 Application Running

**Start development server**:
```bash
cd /home/runner/workspace
npm run dev
```

**Verify application is running**:
```bash
curl http://localhost:5000/api/health
```

**Expected output**:
```json
{"status":"ok","timestamp":"2025-11-01T..."}
```

### 4. Notification System Enabled

**Check notification status**:
```bash
./scripts/notifyctl status
```

**Expected output**:
```
Notifications: enabled
```

**If disabled**, enable notifications:
```bash
./scripts/notifyctl on
```

## Test Scenarios

### Test 1: Basic Webhook Forwarding

**Goal**: Verify webhook forwarding starts and notifications work

**Steps**:

1. **Start webhook forwarding**:
   ```bash
   ./scripts/telegram/integrations/stripe-test-notify.sh
   ```

2. **Verify terminal output**:
   ```
   💳 Stripe webhook forwarding started
   📱 Notification sent to Telegram
   🔊 Monitoring for webhook events...

   Ready! You are using Stripe API Version [2024-04-10]
   Waiting for events...
   ```

3. **Check Telegram**:
   - Verify you received start notification
   - Should include forwarding URL, test cards, timestamp

4. **Stop forwarding** (Ctrl+C):
   ```
   ^C
   ⏸️  Stopping Stripe webhook forwarding...
   📱 Notification sent to Telegram
   ✅ Stripe webhook forwarding stopped
   ```

5. **Check Telegram**:
   - Verify you received stop notification
   - Should include session duration and event count

**Success Criteria**:
- ✅ Forwarding starts without errors
- ✅ Start notification received on Telegram
- ✅ Stop notification received on Telegram
- ✅ Clean exit with Ctrl+C

---

### Test 2: Simulated Checkout Event

**Goal**: Test notification for checkout completion using Stripe trigger

**Steps**:

1. **Start webhook forwarding**:
   ```bash
   ./scripts/telegram/integrations/stripe-test-notify.sh
   ```

2. **Open new terminal** (keep forwarding running)

3. **Trigger checkout event**:
   ```bash
   stripe trigger checkout.session.completed
   ```

4. **Verify terminal output** (in forwarding terminal):
   ```
   > checkout.session.completed [evt_xxxxx]
   💰 Checkout completed notification sent
   ```

5. **Check Telegram**:
   - Should receive "Checkout Completed" notification
   - Includes event ID, session ID, timestamp

**Success Criteria**:
- ✅ Event triggered successfully
- ✅ Notification received on Telegram within 1-2 seconds
- ✅ Notification includes correct event details

---

### Test 3: Simulated Payment Success

**Goal**: Test notification for successful payment

**Steps**:

1. **Webhook forwarding should be running** (from Test 2)

2. **Trigger payment success event**:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

3. **Verify terminal output**:
   ```
   > payment_intent.succeeded [evt_xxxxx]
   ✅ Payment succeeded notification sent
   ```

4. **Check Telegram**:
   - Should receive "Payment Succeeded" notification
   - Includes event ID, payment ID, timestamp

**Success Criteria**:
- ✅ Event triggered successfully
- ✅ Notification received on Telegram
- ✅ Notification shows payment success

---

### Test 4: Simulated Payment Failure

**Goal**: Test notification for failed payment

**Steps**:

1. **Trigger payment failure event**:
   ```bash
   stripe trigger payment_intent.payment_failed
   ```

2. **Verify terminal output**:
   ```
   > payment_intent.payment_failed [evt_xxxxx]
   ❌ Payment failed notification sent
   ```

3. **Check Telegram**:
   - Should receive "Payment Failed" notification
   - Includes event ID, payment ID, warning

**Success Criteria**:
- ✅ Event triggered successfully
- ✅ Notification received with failure indicator
- ✅ Terminal shows red color for failure

---

### Test 5: End-to-End Credit Purchase

**Goal**: Test real credit purchase flow in P3 application

**Prerequisites**:
- P3 application running (`npm run dev`)
- Webhook forwarding running
- Stripe configured in P3 (check `.env`)

**Steps**:

1. **Open P3 application** in browser:
   ```
   http://localhost:5000
   ```

2. **Login** to P3 (or create test account)

3. **Navigate to billing/credits page**:
   ```
   http://localhost:5000/billing
   ```

4. **Select credit package** (e.g., 100 credits)

5. **Click "Purchase" or "Buy Credits"**

6. **Fill Stripe checkout form**:
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVV**: Any 3 digits (e.g., `123`)
   - **Name**: Test User
   - **Email**: `test@example.com`

7. **Complete purchase**

8. **Monitor terminal** (webhook forwarding):
   ```
   > checkout.session.completed [evt_xxxxx]
   💰 Checkout completed notification sent

   > payment_intent.succeeded [evt_xxxxx]
   ✅ Payment succeeded notification sent
   ```

9. **Check Telegram**:
   - Should receive 2 notifications:
     1. Checkout Completed
     2. Payment Succeeded

10. **Verify credit addition in P3**:
    - Check credit balance in UI
    - Should reflect purchased amount

11. **Verify in database** (optional):
    ```bash
    psql $DATABASE_URL -c "
    SELECT id, email, credits, updated_at
    FROM users
    WHERE email = 'test@example.com';
    "
    ```

**Success Criteria**:
- ✅ Checkout form loads successfully
- ✅ Payment processes without errors
- ✅ Webhook notifications received on Telegram
- ✅ Credits added to user account
- ✅ Database updated correctly

---

### Test 6: Payment Decline Flow

**Goal**: Test error handling for declined payment

**Steps**:

1. **Navigate to billing page** in P3 application

2. **Select credit package**

3. **Use decline test card**:
   - **Card number**: `4000 0000 0000 0002`
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits

4. **Attempt purchase**

5. **Expected behavior**:
   - Stripe shows error: "Your card was declined"
   - P3 shows error message
   - No credits added

6. **Check Telegram**:
   - Should receive "Payment Failed" notification

7. **Verify no credit addition**:
   - Check credit balance (should be unchanged)

**Success Criteria**:
- ✅ Payment declined by Stripe
- ✅ Error message shown to user
- ✅ Failure notification received on Telegram
- ✅ No credits added to account

---

### Test 7: Subscription Lifecycle (If Supported)

**Goal**: Test subscription events if P3 supports subscriptions

**Steps**:

1. **Create subscription**:
   ```bash
   stripe trigger customer.subscription.created
   ```

2. **Check Telegram**:
   - Should receive "Subscription Created" notification

3. **Update subscription**:
   ```bash
   stripe trigger customer.subscription.updated
   ```

4. **Check Telegram**:
   - Should receive "Subscription Updated" notification

5. **Cancel subscription**:
   ```bash
   stripe trigger customer.subscription.deleted
   ```

6. **Check Telegram**:
   - Should receive "Subscription Deleted" notification

**Success Criteria**:
- ✅ All 3 subscription events trigger notifications
- ✅ Notifications received on Telegram
- ✅ Notifications show correct event types

---

### Test 8: Multiple Simultaneous Events

**Goal**: Test notification system handles rapid events

**Steps**:

1. **Trigger multiple events rapidly**:
   ```bash
   stripe trigger checkout.session.completed &
   stripe trigger payment_intent.succeeded &
   stripe trigger customer.subscription.created &
   wait
   ```

2. **Check terminal output**:
   - Should see all 3 events logged
   - Should see 3 notification confirmations

3. **Check Telegram**:
   - Should receive 3 separate notifications
   - Order may vary (async)

**Success Criteria**:
- ✅ All events processed
- ✅ All notifications received
- ✅ No errors or dropped events

---

### Test 9: Silent Mode

**Goal**: Verify script works without notifications

**Steps**:

1. **Disable notifications**:
   ```bash
   ./scripts/notifyctl off
   ```

2. **Run stripe forwarding**:
   ```bash
   ./scripts/telegram/integrations/stripe-test-notify.sh
   ```

3. **Verify terminal output**:
   ```
   ⚠️  Notifications disabled - running stripe listen without notifications
   Ready! You are using Stripe API Version [2024-04-10]
   Waiting for events...
   ```

4. **Trigger event**:
   ```bash
   stripe trigger checkout.session.completed
   ```

5. **Verify**:
   - Event appears in terminal
   - No Telegram notifications sent

6. **Re-enable notifications**:
   ```bash
   ./scripts/notifyctl on
   ```

**Success Criteria**:
- ✅ Script detects disabled notifications
- ✅ Falls back to standard stripe listen
- ✅ Events still processed
- ✅ No notification errors

---

### Test 10: Long-Running Session

**Goal**: Verify stability and session summary

**Steps**:

1. **Start webhook forwarding**:
   ```bash
   ./scripts/telegram/integrations/stripe-test-notify.sh
   ```

2. **Trigger 10+ events** over 5 minutes:
   ```bash
   for i in {1..5}; do
     stripe trigger checkout.session.completed
     sleep 10
     stripe trigger payment_intent.succeeded
     sleep 10
   done
   ```

3. **Monitor notifications**:
   - Should receive notification for each event

4. **Stop forwarding** (Ctrl+C)

5. **Check stop notification**:
   - Should show duration (5+ minutes)
   - Should show event count (10 events)

**Success Criteria**:
- ✅ All events processed over time
- ✅ No memory leaks or slowdowns
- ✅ Accurate session summary
- ✅ Clean exit

---

## Verification Checklist

After running all tests, verify:

### Terminal Output
- [ ] Forwarding starts without errors
- [ ] Events are logged in real-time
- [ ] Color-coded output works
- [ ] Stop message shows duration and event count

### Telegram Notifications
- [ ] Start notification received
- [ ] Event notifications received
- [ ] Stop notification received
- [ ] Markdown formatting renders correctly

### P3 Application
- [ ] Checkout page loads
- [ ] Payment form works
- [ ] Credits added on success
- [ ] Error shown on decline
- [ ] Database updated correctly

### Edge Cases
- [ ] Script handles Ctrl+C gracefully
- [ ] Silent mode works
- [ ] Multiple events handled
- [ ] No notification errors in logs

---

## Troubleshooting

### No Notifications Received

**Check notification system**:
```bash
./scripts/notifyctl status
./scripts/telegram/core/notify.sh "Test message"
```

**Check Telegram bot configuration**:
```bash
cat scripts/telegram/.env
```

### Events Not Forwarded to P3

**Check webhook endpoint**:
```bash
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Check P3 server logs**:
- Look for webhook handler errors
- Verify webhook signature validation

### Stripe CLI Issues

**Re-authenticate**:
```bash
stripe login
```

**Check account**:
```bash
stripe config --list
```

**Update CLI**:
```bash
# macOS
brew upgrade stripe/stripe-cli/stripe

# Linux
# Download latest from GitHub releases
```

---

## Expected Notification Format

### Start Notification
```
💳 Stripe Webhook Testing Started

Forwarding To: `localhost:5000/api/webhooks/stripe`
Started: 10:30:45
Stripe Account: `acct_xxxxx`

Test Cards:
• Success: `4242 4242 4242 4242`
• Decline: `4000 0000 0000 0002`
• Auth Required: `4000 0025 0000 3155`

You'll be notified when payment events are received
```

### Event Notification
```
💰 Stripe Event: Checkout Completed

Event: `checkout.session.completed`
Event ID: `evt_1A2B3C4D5E6F`
Session ID: `cs_test_xxxxx`
Time: 10:35:22

Credit purchase completed successfully ✅
```

### Stop Notification
```
⏸️ Stripe Webhook Testing Stopped

Duration: 4m 37s
Events Received: 8
Status: Forwarding terminated

Stripe webhook testing session complete
```

---

## Test Data Reference

### Test Cards

| Scenario | Card Number | CVV | Expiry |
|----------|-------------|-----|--------|
| Success | `4242 4242 4242 4242` | 123 | 12/25 |
| Decline | `4000 0000 0000 0002` | 123 | 12/25 |
| Insufficient Funds | `4000 0000 0000 9995` | 123 | 12/25 |
| Lost Card | `4000 0000 0000 9987` | 123 | 12/25 |
| Expired Card | `4000 0000 0000 0069` | 123 | 01/20 |

### P3 Credit Packages (Example)

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 10 | $5 |
| Basic | 50 | $20 |
| Pro | 100 | $35 |
| Premium | 500 | $150 |

---

## Performance Benchmarks

| Metric | Expected Value |
|--------|----------------|
| Notification latency | < 500ms |
| Event processing | < 100ms |
| Session startup time | < 2s |
| Memory usage | < 50MB |

---

## Next Steps

After successful testing:

1. **Document findings** in ops log:
   ```bash
   echo "$(date): Stripe webhook testing completed successfully" >> docs/ops-log/2025-11.md
   ```

2. **Configure production webhooks** in Stripe Dashboard:
   - Add production webhook URL
   - Select events to monitor
   - Copy webhook signing secret

3. **Update P3 environment variables**:
   - `STRIPE_WEBHOOK_SECRET` (production)
   - `STRIPE_PUBLISHABLE_KEY` (production)
   - `STRIPE_SECRET_KEY` (production)

4. **Test in staging** before production deployment

---

## Support Resources

- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Stripe Testing Docs**: https://stripe.com/docs/testing
- **P3 Documentation**: `docs/redesign/STRIPE_CREDIT_PRODUCTS.md`
- **Notification System**: `scripts/telegram/README.md`
