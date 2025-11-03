#!/bin/bash
# Notify user via Telegram when Claude Code needs input
# This hook is triggered when Claude Code requests user approval

# Check if notifications are enabled
FLAG_FILE="/tmp/claude_approval_notifications_enabled"
if [ ! -f "$FLAG_FILE" ]; then
  # Notifications disabled, exit silently
  exit 0
fi

# Get the current working directory
CWD="$(pwd)"

# Extract context from environment or stdin
CONTEXT="${1:-User input required}"

# Format message with proper newlines using printf
FORMATTED_MESSAGE=$(printf "%s\n\nLocation: %s\n\nPlease return to Claude Code to respond." \
  "$CONTEXT" \
  "$CWD")

# Send notification
/home/runner/workspace/scripts/telegram/integrations/claude-session-notify.sh alert \
  "⚠️ Claude Code Needs Input" \
  "$FORMATTED_MESSAGE" \
  > /dev/null 2>&1 &

# Always exit successfully so hook doesn't block
exit 0
