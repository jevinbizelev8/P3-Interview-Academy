#!/bin/bash
# Display Telegram webhook registration information
#
# Usage:
#   ./webhook_info.sh
#
# Queries:
#   - Telegram API getWebhookInfo endpoint
#   - Displays URL, pending updates, last error
#
# Dependencies:
#   - TELEGRAM_BOT_TOKEN environment variable
#   - jq for JSON parsing
#   - curl for API queries
#
# Exit codes:
#   0 - Webhook registered and working
#   1 - Webhook not registered or error
#   2 - Missing dependencies

set -euo pipefail

# Check dependencies
if ! command -v jq &>/dev/null; then
  echo "❌ Error: jq is not installed"
  echo "Install with: apt-get install jq"
  exit 2
fi

if ! command -v curl &>/dev/null; then
  echo "❌ Error: curl is not installed"
  exit 2
fi

# Check environment
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "❌ Error: TELEGRAM_BOT_TOKEN not set"
  echo ""
  echo "Set it with:"
  echo "  export TELEGRAM_BOT_TOKEN='your_bot_token'"
  echo ""
  echo "Or add to .env file in scripts/telegram/"
  exit 2
fi

# Query Telegram API
echo "📡 Webhook Registration Status"
echo "════════════════════════════════════════════"
echo ""

response=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" 2>/dev/null)

# Check if API call succeeded
if [[ -z "$response" ]]; then
  echo "❌ Failed to query Telegram API"
  exit 1
fi

# Parse response
ok=$(echo "$response" | jq -r '.ok')
if [[ "$ok" != "true" ]]; then
  echo "❌ API returned error:"
  echo "$response" | jq .
  exit 1
fi

# Extract webhook info
url=$(echo "$response" | jq -r '.result.url // ""')
has_custom_certificate=$(echo "$response" | jq -r '.result.has_custom_certificate // false')
pending_update_count=$(echo "$response" | jq -r '.result.pending_update_count // 0')
last_error_date=$(echo "$response" | jq -r '.result.last_error_date // 0')
last_error_message=$(echo "$response" | jq -r '.result.last_error_message // ""')
max_connections=$(echo "$response" | jq -r '.result.max_connections // 0')
allowed_updates=$(echo "$response" | jq -r '.result.allowed_updates // [] | join(", ")')

# Check if webhook is set
if [[ -z "$url" || "$url" == "null" ]]; then
  echo "❌ Webhook NOT registered"
  echo ""
  echo "Register webhook with:"
  echo "  ./scripts/telegram/core/notifyctl webhook"
  echo ""
  exit 1
fi

# Display webhook info
echo "✅ Webhook registered"
echo ""
echo "URL: $url"
echo ""

# Additional details
echo "Details:"
echo "  Custom certificate: $has_custom_certificate"
echo "  Max connections: $max_connections"

if [[ -n "$allowed_updates" && "$allowed_updates" != "null" ]]; then
  echo "  Allowed updates: $allowed_updates"
else
  echo "  Allowed updates: all"
fi

echo ""

# Pending updates
if [[ "$pending_update_count" -gt 0 ]]; then
  echo "⚠️  Pending updates: $pending_update_count"
  echo "  (These updates are queued and will be delivered to webhook)"
  echo ""
else
  echo "✅ No pending updates"
  echo ""
fi

# Last error (if any)
if [[ -n "$last_error_message" && "$last_error_message" != "null" ]]; then
  echo "⚠️  Last error:"
  if [[ "$last_error_date" -gt 0 ]]; then
    error_time=$(date -d "@$last_error_date" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "timestamp: $last_error_date")
    echo "  Time: $error_time"
  fi
  echo "  Message: $last_error_message"
  echo ""
  echo "  This may indicate temporary connection issues."
  echo "  If persistent, check webhook server logs."
  echo ""
  exit 1
fi

# Full JSON output (for debugging)
echo "───────────────────────────────────────────"
echo "Full webhook info (JSON):"
echo ""
echo "$response" | jq '.result'

exit 0
