#!/usr/bin/env bash
set -euo pipefail

# Script: github-actions-notify.sh
# Purpose: GitHub Actions wrapper for Telegram notifications
# Usage: github-actions-notify.sh "message text"
#
# This script adapts the Telegram notification system for GitHub Actions
# by mapping GitHub Secrets to the expected environment variables.

if [[ $# -eq 0 ]]; then
  echo "Error: Message text required" >&2
  echo "Usage: $(basename "$0") \"message text\"" >&2
  exit 1
fi

MESSAGE="$1"

# Validate required environment variables (from GitHub Secrets)
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "Error: TELEGRAM_BOT_TOKEN not set (GitHub Secret required)" >&2
  exit 1
fi

if [[ -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "Error: TELEGRAM_CHAT_ID not set (GitHub Secret required)" >&2
  exit 1
fi

# Map GitHub Secrets to expected variable names
export BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
export CHAT_ID="$TELEGRAM_CHAT_ID"

# Add timestamp prefix
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
FORMATTED_MESSAGE="[$TIMESTAMP] $MESSAGE"

# Send message via Telegram API
API_URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"$CHAT_ID\",
    \"text\": $(printf '%s' "$FORMATTED_MESSAGE" | jq -Rs .),
    \"parse_mode\": \"Markdown\"
  }")

# Check if message was sent successfully
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✅ Telegram notification sent successfully"
  exit 0
else
  echo "❌ Failed to send Telegram message" >&2
  echo "Response: $RESPONSE" >&2
  exit 1
fi
