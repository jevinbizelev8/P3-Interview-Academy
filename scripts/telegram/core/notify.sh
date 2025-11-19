#!/usr/bin/env bash
set -euo pipefail

# Script: notify.sh
# Purpose: Send Telegram messages via Bot API
# Usage: notify.sh "message text"

# Get project root (2 levels up from scripts/telegram/core/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/.notify.enabled"
ENV_FILE="$SCRIPT_DIR/../.env"

# Validate message parameter first (before checking state)
if [[ $# -eq 0 ]]; then
  echo "Error: Message text required" >&2
  echo "Usage: $(basename "$0") \"message text\"" >&2
  exit 1
fi

# Check if notifications are enabled
if [[ ! -f "$STATE_FILE" ]]; then
  # Silently exit if notifications are disabled
  exit 0
fi

MESSAGE="$1"

# Load environment variables
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: Environment file not found: $ENV_FILE" >&2
  echo "Run scripts/telegram/core/init.sh to set up the system" >&2
  exit 1
fi

# Source environment file
set -a
source "$ENV_FILE"
set +a

# Validate required environment variables
if [[ -z "${BOT_TOKEN:-}" ]]; then
  echo "Error: BOT_TOKEN not set in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${CHAT_ID:-}" ]]; then
  echo "Error: CHAT_ID not set in $ENV_FILE" >&2
  exit 1
fi

# Send message via Telegram API (no timestamp - Telegram shows it)
API_URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"$CHAT_ID\",
    \"text\": $(printf '%s' "$MESSAGE" | jq -Rs .),
    \"parse_mode\": \"Markdown\"
  }")

# Check if message was sent successfully
if echo "$RESPONSE" | grep -q '"ok":true'; then
  exit 0
else
  echo "Error: Failed to send Telegram message" >&2
  echo "Response: $RESPONSE" >&2
  exit 1
fi
