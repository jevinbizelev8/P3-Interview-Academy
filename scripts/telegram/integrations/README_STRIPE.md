# Stripe Webhook Testing Notification Wrapper

## Overview

`stripe-test-notify.sh` wraps `stripe listen` with Telegram notifications for local webhook testing in **P3 Interview Academy**'s credit-based payment system.

## Features

- 🔔 **Start/Stop Notifications** - Know when forwarding begins and ends
- 💰 **Payment Event Alerts** - Real-time notifications for checkout, payments, subscriptions
- 📊 **Session Summary** - Duration and event count when stopping
- 🎨 **Color-coded Output** - Easy-to-read terminal feedback
- 🔇 **Silent Mode** - Falls back to standard `stripe listen` when notifications disabled

## Usage

### Basic Usage

```bash
./scripts/telegram/integrations/stripe-test-notify.sh
```

**Default forwarding URL**: `localhost:5000/api/webhooks/stripe`

### Custom Forwarding URL

```bash
STRIPE_FORWARD_URL="localhost:3000/webhooks" ./scripts/telegram/integrations/stripe-test-notify.sh
```

### Stop Forwarding

Press **Ctrl+C** to stop. You'll receive a summary notification with:
- Session duration
- Total events received
- Stop timestamp

## Workflow

1. **Start**: Sends notification with test card details and forwarding info
2. **Monitor**: Watches for webhook events in real-time
3. **Notify**: Sends Telegram message for key events (see table below)
4. **Stop**: Sends summary notification when forwarding ends (Ctrl+C)

## Events Monitored

| Event | Icon | Notification | Description |
|-------|------|--------------|-------------|
| `checkout.session.completed` | 💰 | Checkout Completed | Credit purchase completed successfully |
| `payment_intent.succeeded` | ✅ | Payment Succeeded | Payment processed successfully |
| `payment_intent.payment_failed` | ❌ | Payment Failed | Payment declined or failed |
| `customer.subscription.created` | 🔄 | Subscription Created | New subscription started |
| `customer.subscription.updated` | 🔄 | Subscription Updated | Subscription tier or status changed |
| `customer.subscription.deleted` | ⛔ | Subscription Deleted | Subscription canceled |

## Test Cards

Use these test card numbers for different scenarios:

| Card Number | Scenario | CVV | Expiry |
|-------------|----------|-----|--------|
| `4242 4242 4242 4242` | ✅ Success | Any | Any future date |
| `4000 0000 0000 0002` | ❌ Decline | Any | Any future date |
| `4000 0025 0000 3155` | 🔐 Requires Auth | Any | Any future date |
| `4000 0000 0000 9995` | ⚠️ Insufficient Funds | Any | Any future date |

**More test cards**: [Stripe Testing Documentation](https://stripe.com/docs/testing)

## Example Session

```bash
$ ./scripts/telegram/integrations/stripe-test-notify.sh

💳 Stripe webhook forwarding started
📱 Notification sent to Telegram
🔊 Monitoring for webhook events...

Ready! You are using Stripe API Version [2024-04-10]
Waiting for events...

> checkout.session.completed [evt_1A2B3C4D5E6F]
💰 Checkout completed notification sent

> payment_intent.succeeded [evt_7G8H9I0J1K2L]
✅ Payment succeeded notification sent

^C
⏸️  Stopping Stripe webhook forwarding...
📱 Notification sent to Telegram
✅ Stripe webhook forwarding stopped
```

## Integration with P3 Workflows

### Testing Credit Purchases

**Full end-to-end test flow**:

1. **Start webhook forwarding**:
   ```bash
   ./scripts/telegram/integrations/stripe-test-notify.sh
   ```

2. **Start P3 application**:
   ```bash
   npm run dev
   ```

3. **Navigate to billing**:
   ```
   http://localhost:5000/billing
   ```

4. **Purchase credits**:
   - Select credit package (e.g., 100 credits)
   - Enter test card: `4242 4242 4242 4242`
   - Complete checkout

5. **Verify notifications**:
   - Check Telegram for `checkout.session.completed`
   - Check Telegram for `payment_intent.succeeded`

6. **Verify credit addition**:
   - Check P3 application credit balance
   - Check database: `SELECT credits FROM users WHERE id = ...`

### Testing Payment Failures

**Test error handling**:

1. **Start webhook forwarding**
2. **Use decline card**: `4000 0000 0000 0002`
3. **Check Telegram** for `payment_intent.payment_failed` notification
4. **Verify error handling** in P3 application (error message shown to user)

### Testing Subscription Changes

**Test subscription lifecycle**:

1. **Start webhook forwarding**
2. **Create subscription** (if P3 supports subscriptions)
3. **Monitor Telegram** for:
   - `customer.subscription.created` - Subscription started
   - `customer.subscription.updated` - Plan changed
   - `customer.subscription.deleted` - Subscription canceled

## Silent Mode

When notifications are disabled, the script falls back to standard `stripe listen`:

```bash
$ ./scripts/notifyctl off
Notifications disabled

$ ./scripts/telegram/integrations/stripe-test-notify.sh
⚠️  Notifications disabled - running stripe listen without notifications
Ready! You are using Stripe API Version [2024-04-10]
Waiting for events...
```

**Re-enable notifications**:
```bash
./scripts/notifyctl on
```

## Troubleshooting

### Stripe CLI Not Found

**Error**:
```
❌ Error: Stripe CLI not installed
Install: https://stripe.com/docs/stripe-cli
```

**Solution - macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Solution - Linux**:
```bash
# Download and install
wget -qO- https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz | tar -xz
sudo mv stripe /usr/local/bin/
```

**Verify installation**:
```bash
stripe --version
```

### Stripe CLI Not Authenticated

**Error**:
```
Error: You need to log in to use this command.
```

**Solution**:
```bash
stripe login
```

Follow the browser authentication flow.

### Forwarding URL Issues

If webhooks aren't reaching your app:

1. **Check app is running**:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Verify webhook endpoint**:
   - Endpoint: `/api/webhooks/stripe`
   - Method: `POST`
   - Handler: `server/routes/webhooks/stripe.ts` (or similar)

3. **Check webhook signature validation**:
   - Verify `STRIPE_WEBHOOK_SECRET` environment variable is set
   - Check webhook signature verification in code

4. **Check logs**:
   - Server logs: `npm run dev` output
   - Stripe logs: `/tmp/stripe_listen_*.log`

### Notifications Not Received

**If Telegram notifications aren't sent**:

1. **Check notification system**:
   ```bash
   ./scripts/notifyctl status
   ```

2. **Test notification**:
   ```bash
   ./scripts/telegram/core/notify.sh "Test message"
   ```

3. **Check Telegram configuration**:
   ```bash
   cat scripts/telegram/.env
   ```

4. **Verify bot token and chat ID** are correct

### Events Not Triggering Notifications

**If webhook events are received but notifications aren't sent**:

1. **Check event type** - Only 6 events trigger notifications (see table above)
2. **Check logs** - Look for notification errors in terminal output
3. **Manually test event**:
   ```bash
   stripe trigger checkout.session.completed
   ```

## Logs

All Stripe CLI output is logged to: `/tmp/stripe_listen_<timestamp>.log`

**View logs**:
```bash
tail -f /tmp/stripe_listen_*.log
```

**Search for specific events**:
```bash
grep "checkout.session.completed" /tmp/stripe_listen_*.log
```

**Count events received**:
```bash
grep -c "evt_" /tmp/stripe_listen_*.log
```

## Advanced Usage

### Multiple Terminal Windows

**Terminal 1** - Webhook forwarding:
```bash
./scripts/telegram/integrations/stripe-test-notify.sh
```

**Terminal 2** - P3 application:
```bash
npm run dev
```

**Terminal 3** - Manual event triggers:
```bash
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
```

### Testing with Real Checkout

**Create test checkout session**:

```bash
# Using Stripe CLI
stripe checkout sessions create \
  --mode payment \
  --line-items "[{\"price_data\": {\"currency\": \"usd\", \"unit_amount\": 1000, \"product_data\": {\"name\": \"100 Credits\"}}, \"quantity\": 1}]" \
  --success-url "http://localhost:5000/billing/success" \
  --cancel-url "http://localhost:5000/billing/cancel"
```

Open the returned URL in browser to complete checkout.

### Custom Event Monitoring

**Monitor specific events only** (edit script):

```bash
# In stripe-test-notify.sh, add custom event detection
case "$EVENT_TYPE" in
  "invoice.payment_succeeded")
    # Your custom notification logic
    ;;
  "charge.refunded")
    # Your custom notification logic
    ;;
esac
```

## Integration Points

### P3 Interview Academy Backend

**Webhook handler location**:
- `server/routes/webhooks/stripe.ts` (or similar)
- `server/services/payment-service.ts` (payment processing logic)

**Webhook signature verification**:
```typescript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
```

**Credit addition logic**:
```typescript
case 'checkout.session.completed':
  await addCreditsToUser(userId, creditAmount);
  break;
```

### Database Verification

**Check credit balance after purchase**:
```sql
SELECT id, email, credits, updated_at
FROM users
WHERE email = 'test@example.com';
```

**Check transaction history**:
```sql
SELECT *
FROM credit_transactions
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 10;
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STRIPE_FORWARD_URL` | `localhost:5000/api/webhooks/stripe` | Webhook forwarding URL |

### Notification State

Notifications are controlled by:
```bash
./scripts/notifyctl on   # Enable notifications
./scripts/notifyctl off  # Disable notifications
```

State file: `/home/runner/workspace/.notify.enabled`

## Performance

- **Minimal overhead** - Notifications sent asynchronously
- **No blocking** - Stripe CLI output streams in real-time
- **Low latency** - Notifications sent within 100-200ms of event receipt

## Security Notes

- **Webhook secrets** - Keep `STRIPE_WEBHOOK_SECRET` secure
- **Test mode only** - Use test API keys for local development
- **Production webhooks** - Configure separately in Stripe Dashboard
- **Telegram bot token** - Keep secure, stored in `scripts/telegram/.env`

## Related Documentation

- **Stripe CLI Documentation**: https://stripe.com/docs/stripe-cli
- **Stripe Webhook Documentation**: https://stripe.com/docs/webhooks
- **P3 Payment System**: `docs/redesign/STRIPE_CREDIT_PRODUCTS.md`
- **Telegram Notification System**: `scripts/telegram/README.md`

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Stripe CLI logs: `/tmp/stripe_listen_*.log`
3. Check P3 server logs: `npm run dev` output
4. Consult Stripe Dashboard for webhook delivery status
