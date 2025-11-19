#!/bin/bash
# Hook for user approval requests in Claude Code
# Sends Telegram notification when approval is needed

# Check if notifications are enabled
FLAG_FILE="/tmp/claude_approval_notifications_enabled"
if [ ! -f "$FLAG_FILE" ]; then
  # Notifications disabled, exit silently
  exit 0
fi

# This script receives approval context via stdin or args
MESSAGE="${*:-Claude Code is requesting your approval}"

# Format message with proper newlines using printf
FORMATTED_MESSAGE=$(printf "%s\n\n%s" \
  "$MESSAGE" \
  "Return to Claude Code interface to approve or reject.")

# Send Telegram notification
/home/runner/workspace/scripts/telegram/integrations/claude-session-notify.sh alert \
  "🔔 Approval Needed" \
  "$FORMATTED_MESSAGE" \
  2>&1 | logger -t claude-approval-hook

# Exit successfully so CC continues
exit 0
