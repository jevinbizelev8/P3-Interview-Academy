# Stripe Webhook Testing - Quick Reference

## One-Line Commands

```bash
# Start webhook forwarding with notifications
./scripts/telegram/integrations/stripe-test-notify.sh

# Custom forwarding URL
STRIPE_FORWARD_URL="localhost:3000/webhooks" ./scripts/telegram/integrations/stripe-test-notify.sh

# Silent mode (no notifications)
./scripts/notifyctl off && ./scripts/telegram/integrations/stripe-test-notify.sh

# Stop forwarding
# Press Ctrl+C
```

## Test Card Numbers

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 Auth Required |

**CVV**: Any 3 digits | **Expiry**: Any future date

## Trigger Test Events

```bash
# Simulate checkout completion
stripe trigger checkout.session.completed

# Simulate payment success
stripe trigger payment_intent.succeeded

# Simulate payment failure
stripe trigger payment_intent.payment_failed

# Simulate subscription created
stripe trigger customer.subscription.created
```

## Events Monitored

| Event | Icon | Trigger |
|-------|------|---------|
| `checkout.session.completed` | 💰 | Credit purchase completed |
| `payment_intent.succeeded` | ✅ | Payment processed |
| `payment_intent.payment_failed` | ❌ | Payment failed |
| `customer.subscription.created` | 🔄 | Subscription started |
| `customer.subscription.updated` | 🔄 | Subscription changed |
| `customer.subscription.deleted` | ⛔ | Subscription canceled |

## Quick Workflow

```bash
# Terminal 1: Start webhook forwarding
./scripts/telegram/integrations/stripe-test-notify.sh

# Terminal 2: Start P3 app
npm run dev

# Terminal 3: Trigger events
stripe trigger checkout.session.completed
```

## Notification Format

**Start**:
```
💳 Stripe Webhook Testing Started
Forwarding To: localhost:5000/api/webhooks/stripe
Started: 10:30:45
Test Cards: 4242..., 4000...
```

**Event**:
```
💰 Stripe Event: Checkout Completed
Event: checkout.session.completed
Event ID: evt_xxxxx
Session ID: cs_test_xxxxx
Time: 10:35:22
Credit purchase completed successfully ✅
```

**Stop** (Ctrl+C):
```
⏸️ Stripe Webhook Testing Stopped
Duration: 4m 37s
Events Received: 8
Stripe webhook testing session complete
```

## Troubleshooting

### Stripe CLI Not Found
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget -qO- https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz | tar -xz
sudo mv stripe /usr/local/bin/
```

### Not Authenticated
```bash
stripe login
```

### Notifications Not Working
```bash
./scripts/notifyctl status
./scripts/telegram/core/notify.sh "Test"
```

### P3 App Not Receiving Webhooks
```bash
# Check app is running
curl http://localhost:5000/api/health

# Check endpoint exists
curl -X POST http://localhost:5000/api/webhooks/stripe -d '{}'
```

## Logs

**Stripe CLI output**: `/tmp/stripe_listen_*.log`
```bash
tail -f /tmp/stripe_listen_*.log
```

**Count events received**:
```bash
grep -c "evt_" /tmp/stripe_listen_*.log
```

## Configuration

**Forwarding URL**: `STRIPE_FORWARD_URL` environment variable
**Notification State**: `/home/runner/workspace/.notify.enabled`

## Full Documentation

- **Usage Guide**: [README_STRIPE.md](README_STRIPE.md)
- **Testing Guide**: [TESTING_STRIPE.md](TESTING_STRIPE.md)
- **Notification System**: [../README.md](../README.md)

## P3 Integration Points

**Webhook Endpoint**: `/api/webhooks/stripe`
**Credit Addition**: Check `server/services/payment-service.ts`
**Database**: Check `credit_transactions` table

## Support

**Stripe Docs**: https://stripe.com/docs/stripe-cli
**P3 Payment Docs**: `docs/redesign/STRIPE_CREDIT_PRODUCTS.md`
