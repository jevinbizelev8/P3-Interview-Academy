#!/usr/bin/env bash
set -euo pipefail

# Script: webhook_register.sh
# Purpose: Register webhook URL with Telegram Bot API
# Usage: webhook_register.sh
#
# This script reads BOT_TOKEN and WEBHOOK_URL from the environment
# (or from scripts/telegram/.env) and registers the webhook with Telegram.
#
# Prerequisites:
# - curl and jq must be installed
# - BOT_TOKEN and WEBHOOK_URL must be set
#
# Example:
#   cd scripts/telegram/tools
#   ./webhook_register.sh

# Get script directory and load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# Load environment variables if .env exists
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
  echo "✓ Loaded environment from $ENV_FILE"
else
  echo "⚠️  Warning: Environment file not found: $ENV_FILE"
  echo "   Attempting to use environment variables..."
fi

# Validate required environment variables
if [[ -z "${BOT_TOKEN:-}" ]]; then
  echo "❌ Error: BOT_TOKEN not set in environment or .env file" >&2
  echo "" >&2
  echo "Please set BOT_TOKEN in scripts/telegram/.env or export it:" >&2
  echo "  export BOT_TOKEN='your_token_here'" >&2
  exit 1
fi

if [[ -z "${WEBHOOK_URL:-}" ]]; then
  echo "❌ Error: WEBHOOK_URL not set in environment or .env file" >&2
  echo "" >&2
  echo "Please set WEBHOOK_URL in scripts/telegram/.env or export it:" >&2
  echo "  export WEBHOOK_URL='https://your-repl.repl.co/telegram/webhook'" >&2
  exit 1
fi

# Check for required commands
for cmd in curl jq; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "❌ Error: $cmd is not installed" >&2
    echo "   Please install $cmd to continue" >&2
    exit 1
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Telegram Webhook Registration"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Bot Token: ${BOT_TOKEN:0:10}..." # Show first 10 chars only
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Call Telegram API to set webhook
API_URL="https://api.telegram.org/bot${BOT_TOKEN}/setWebhook"

echo "Registering webhook with Telegram API..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}")

# Parse response
if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
  echo ""
  echo "✅ Webhook registered successfully!"
  echo ""

  # Show webhook info
  DESCRIPTION=$(echo "$RESPONSE" | jq -r '.description // "No description"')
  echo "Response: $DESCRIPTION"

  # Get webhook info to verify
  echo ""
  echo "Verifying webhook configuration..."
  INFO_URL="https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
  INFO_RESPONSE=$(curl -s "$INFO_URL")

  if echo "$INFO_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    WEBHOOK_INFO=$(echo "$INFO_RESPONSE" | jq -r '.result.url')
    PENDING_COUNT=$(echo "$INFO_RESPONSE" | jq -r '.result.pending_update_count // 0')
    LAST_ERROR_DATE=$(echo "$INFO_RESPONSE" | jq -r '.result.last_error_date // "none"')
    LAST_ERROR_MESSAGE=$(echo "$INFO_RESPONSE" | jq -r '.result.last_error_message // "none"')

    echo ""
    echo "═══ Webhook Status ═══"
    echo "URL: $WEBHOOK_INFO"
    echo "Pending updates: $PENDING_COUNT"
    echo "Last error date: $LAST_ERROR_DATE"
    echo "Last error message: $LAST_ERROR_MESSAGE"
    echo ""
  fi

  echo "════════════════════════════════════════════════════════════"
  echo "✓ Setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Ensure webhook server is running: python scripts/telegram/server/server.py"
  echo "  2. Send a test message to your bot on Telegram"
  echo "  3. Check server logs for incoming webhook requests"
  echo "════════════════════════════════════════════════════════════"
  echo ""

  exit 0
else
  echo ""
  echo "❌ Webhook registration failed!"
  echo ""
  echo "Response from Telegram API:"
  echo "$RESPONSE" | jq .
  echo ""

  # Common error guidance
  ERROR_CODE=$(echo "$RESPONSE" | jq -r '.error_code // "unknown"')
  ERROR_DESC=$(echo "$RESPONSE" | jq -r '.description // "No description"')

  echo "Error code: $ERROR_CODE"
  echo "Description: $ERROR_DESC"
  echo ""

  case "$ERROR_CODE" in
    400)
      echo "💡 Tip: Invalid request. Check that WEBHOOK_URL is a valid HTTPS URL."
      echo "   Telegram webhooks require HTTPS (not HTTP)."
      ;;
    401)
      echo "💡 Tip: Unauthorized. Check that BOT_TOKEN is correct."
      echo "   Get your token from @BotFather on Telegram."
      ;;
    *)
      echo "💡 Tip: See https://core.telegram.org/bots/api#setwebhook for details."
      ;;
  esac

  exit 1
fi
