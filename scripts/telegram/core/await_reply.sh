#!/usr/bin/env bash
set -euo pipefail

# Script: await_reply.sh
# Purpose: Send message and wait for reply from Telegram
# Usage: await_reply.sh "message text" [timeout_seconds]

# Get project root (2 levels up from scripts/telegram/core/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PENDING_DIR="$PROJECT_ROOT/.pending"
INBOX_DIR="$PROJECT_ROOT/.inbox"

# Parse parameters
if [[ $# -eq 0 ]]; then
  echo "Error: Message text required" >&2
  echo "Usage: $(basename "$0") \"message text\" [timeout_seconds]" >&2
  exit 1
fi

MESSAGE="$1"
TIMEOUT="${2:-300}"  # Default 5 minutes

# Generate unique token
TOKEN="TOKEN_$(date +%s)_$$"
PENDING_FILE="$PENDING_DIR/$TOKEN"
INBOX_FILE="$INBOX_DIR/$TOKEN"

# Cleanup function
cleanup() {
  rm -f "$PENDING_FILE" "$INBOX_FILE"
}
trap cleanup EXIT

# Ensure directories exist
mkdir -p "$PENDING_DIR" "$INBOX_DIR"

# Create pending file
touch "$PENDING_FILE"

# Send notification with approval instructions
APPROVAL_MESSAGE="$MESSAGE

📋 **Reply Token**: \`$TOKEN\`

To approve: Reply with 'approve'
To reject: Reply with 'reject'
Or send custom response text"

"$SCRIPT_DIR/notify.sh" "$APPROVAL_MESSAGE" || {
  echo "Error: Failed to send notification" >&2
  exit 1
}

# Poll for reply
ELAPSED=0
POLL_INTERVAL=2

while [[ $ELAPSED -lt $TIMEOUT ]]; do
  if [[ -f "$INBOX_FILE" ]]; then
    # Reply received
    REPLY=$(cat "$INBOX_FILE")
    echo "$REPLY"
    exit 0
  fi

  sleep "$POLL_INTERVAL"
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

# Timeout reached
echo "Error: Timeout waiting for reply after ${TIMEOUT}s" >&2
echo "TIMEOUT" >&2
exit 1
