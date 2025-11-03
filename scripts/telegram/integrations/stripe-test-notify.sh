#!/usr/bin/env bash
# Stripe Webhook Testing Notification Wrapper for P3 Interview Academy
#
# Usage: ./scripts/telegram/integrations/stripe-test-notify.sh
#
# This script wraps 'stripe listen' and sends Telegram notifications for:
# - When forwarding starts
# - Key payment events (checkout, payment success/failure)
# - When forwarding stops

set -euo pipefail

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/.notify.enabled"

# Configuration
FORWARD_URL="${STRIPE_FORWARD_URL:-localhost:5000/api/webhooks/stripe}"
LOG_FILE="/tmp/stripe_listen_$(date +%s).log"

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo -e "${RED}❌ Error: Stripe CLI not installed${NC}" >&2
  echo "Install: https://stripe.com/docs/stripe-cli" >&2
  echo "" >&2
  echo "Installation instructions:" >&2
  echo "  macOS:  brew install stripe/stripe-cli/stripe" >&2
  echo "  Linux:  https://stripe.com/docs/stripe-cli#install" >&2
  exit 1
fi

# Check if notifications enabled
NOTIFICATIONS_ENABLED=false
if [[ -f "$STATE_FILE" ]]; then
  NOTIFICATIONS_ENABLED=true
fi

if [[ "$NOTIFICATIONS_ENABLED" == "false" ]]; then
  echo -e "${YELLOW}⚠️  Notifications disabled - running stripe listen without notifications${NC}"
  stripe listen --forward-to "$FORWARD_URL"
  exit $?
fi

# Get Stripe account info for notification
STRIPE_ACCOUNT=$(stripe config --list 2>/dev/null | grep -oP '(?<=account_id = )\S+' || echo "default")

# Notify start
START_TIME=$(date '+%H:%M:%S')
"$SCRIPT_DIR/../core/notify.sh" "💳 **Stripe Webhook Testing Started**

**Forwarding To**: \`$FORWARD_URL\`
**Started**: $START_TIME
**Stripe Account**: \`$STRIPE_ACCOUNT\`

**Test Cards**:
• Success: \`4242 4242 4242 4242\`
• Decline: \`4000 0000 0000 0002\`
• Auth Required: \`4000 0025 0000 3155\`

*You'll be notified when payment events are received*" || true

echo -e "${GREEN}💳 Stripe webhook forwarding started${NC}"
echo -e "${BLUE}📱 Notification sent to Telegram${NC}"
echo -e "${YELLOW}🔊 Monitoring for webhook events...${NC}"
echo ""

# Trap Ctrl+C to send stop notification
trap 'handle_exit' INT TERM

handle_exit() {
  echo ""
  echo -e "${YELLOW}⏸️  Stopping Stripe webhook forwarding...${NC}"

  # Calculate session duration
  END_TIME=$(date '+%s')
  START_TIMESTAMP=$(echo "$LOG_FILE" | grep -oP '\d{10}$')
  DURATION=$((END_TIME - START_TIMESTAMP))
  DURATION_MIN=$((DURATION / 60))
  DURATION_SEC=$((DURATION % 60))

  # Count events received
  EVENT_COUNT=0
  if [[ -f "$LOG_FILE" ]]; then
    EVENT_COUNT=$(grep -c "evt_" "$LOG_FILE" || echo "0")
  fi

  "$SCRIPT_DIR/../core/notify.sh" "⏸️ **Stripe Webhook Testing Stopped**

**Duration**: ${DURATION_MIN}m ${DURATION_SEC}s
**Events Received**: $EVENT_COUNT
**Status**: Forwarding terminated

*Stripe webhook testing session complete*" || true

  echo -e "${BLUE}📱 Notification sent to Telegram${NC}"
  echo -e "${GREEN}✅ Stripe webhook forwarding stopped${NC}"

  exit 0
}

# Start stripe listen in background, monitor events
stripe listen --forward-to "$FORWARD_URL" 2>&1 | tee "$LOG_FILE" | \
while IFS= read -r line; do
  # Log all output
  echo "$line"

  # Extract event type and ID if present
  EVENT_TYPE=""
  EVENT_ID=""

  if echo "$line" | grep -q "\[evt_"; then
    EVENT_ID=$(echo "$line" | grep -oP 'evt_[a-zA-Z0-9]+' || echo "")
    EVENT_TYPE=$(echo "$line" | grep -oP '^\s*\K[a-z_\.]+(?=\s+\[evt_)' || echo "")
  fi

  # Detect important events and notify
  case "$EVENT_TYPE" in
    "checkout.session.completed")
      SESSION_ID=$(echo "$line" | grep -oP 'cs_[a-zA-Z0-9]+' || echo "")
      if [[ -z "$SESSION_ID" ]]; then
        SESSION_ID="[See Stripe Dashboard]"
      fi

      "$SCRIPT_DIR/../core/notify.sh" "💰 **Stripe Event: Checkout Completed**

**Event**: \`checkout.session.completed\`
**Event ID**: \`$EVENT_ID\`
**Session ID**: \`$SESSION_ID\`
**Time**: $(date '+%H:%M:%S')

*Credit purchase completed successfully* ✅" || true

      echo -e "${GREEN}💰 Checkout completed notification sent${NC}"
      ;;

    "payment_intent.succeeded")
      PAYMENT_ID=$(echo "$line" | grep -oP 'pi_[a-zA-Z0-9]+' || echo "")
      if [[ -z "$PAYMENT_ID" ]]; then
        PAYMENT_ID="[See Stripe Dashboard]"
      fi

      "$SCRIPT_DIR/../core/notify.sh" "✅ **Stripe Event: Payment Succeeded**

**Event**: \`payment_intent.succeeded\`
**Event ID**: \`$EVENT_ID\`
**Payment ID**: \`$PAYMENT_ID\`
**Time**: $(date '+%H:%M:%S')

*Payment processed successfully*" || true

      echo -e "${GREEN}✅ Payment succeeded notification sent${NC}"
      ;;

    "payment_intent.payment_failed")
      PAYMENT_ID=$(echo "$line" | grep -oP 'pi_[a-zA-Z0-9]+' || echo "")
      if [[ -z "$PAYMENT_ID" ]]; then
        PAYMENT_ID="[See Stripe Dashboard]"
      fi

      "$SCRIPT_DIR/../core/notify.sh" "❌ **Stripe Event: Payment Failed**

**Event**: \`payment_intent.payment_failed\`
**Event ID**: \`$EVENT_ID\`
**Payment ID**: \`$PAYMENT_ID\`
**Time**: $(date '+%H:%M:%S')

*Payment failed - check Stripe dashboard* ⚠️" || true

      echo -e "${RED}❌ Payment failed notification sent${NC}"
      ;;

    "customer.subscription.created")
      SUBSCRIPTION_ID=$(echo "$line" | grep -oP 'sub_[a-zA-Z0-9]+' || echo "")
      if [[ -z "$SUBSCRIPTION_ID" ]]; then
        SUBSCRIPTION_ID="[See Stripe Dashboard]"
      fi

      "$SCRIPT_DIR/../core/notify.sh" "🔄 **Stripe Event: Subscription Created**

**Event**: \`customer.subscription.created\`
**Event ID**: \`$EVENT_ID\`
**Subscription ID**: \`$SUBSCRIPTION_ID\`
**Time**: $(date '+%H:%M:%S')

*New subscription started*" || true

      echo -e "${BLUE}🔄 Subscription created notification sent${NC}"
      ;;

    "customer.subscription.updated")
      SUBSCRIPTION_ID=$(echo "$line" | grep -oP 'sub_[a-zA-Z0-9]+' || echo "")
      if [[ -z "$SUBSCRIPTION_ID" ]]; then
        SUBSCRIPTION_ID="[See Stripe Dashboard]"
      fi

      "$SCRIPT_DIR/../core/notify.sh" "🔄 **Stripe Event: Subscription Updated**

**Event**: \`customer.subscription.updated\`
**Event ID**: \`$EVENT_ID\`
**Subscription ID**: \`$SUBSCRIPTION_ID\`
**Time**: $(date '+%H:%M:%S')

*Subscription changed*" || true

      echo -e "${BLUE}🔄 Subscription updated notification sent${NC}"
      ;;

    "customer.subscription.deleted")
      SUBSCRIPTION_ID=$(echo "$line" | grep -oP 'sub_[a-zA-Z0-9]+' || echo "")
      if [[ -z "$SUBSCRIPTION_ID" ]]; then
        SUBSCRIPTION_ID="[See Stripe Dashboard]"
      fi

      "$SCRIPT_DIR/../core/notify.sh" "⛔ **Stripe Event: Subscription Deleted**

**Event**: \`customer.subscription.deleted\`
**Event ID**: \`$EVENT_ID\`
**Subscription ID**: \`$SUBSCRIPTION_ID\`
**Time**: $(date '+%H:%M:%S')

*Subscription canceled*" || true

      echo -e "${YELLOW}⛔ Subscription deleted notification sent${NC}"
      ;;
  esac
done

# This should only be reached if stripe listen exits normally
EXIT_CODE=$?
handle_exit
