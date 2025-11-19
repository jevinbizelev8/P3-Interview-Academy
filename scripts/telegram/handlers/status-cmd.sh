#!/bin/bash
# status-cmd.sh - System health status command
# Shows webhook server status, notifications, pending requests, and recent activity

echo "📊 System Status"
echo ""

# Webhook server status
if curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
  echo "✅ Webhook Server: Running"
else
  echo "❌ Webhook Server: Down"
fi

# Notification status
if [[ -f /tmp/telegram_notify_enabled ]]; then
  echo "✅ Notifications: Enabled"
else
  echo "⚠️  Notifications: Disabled (run: notifyctl on)"
fi

# Check main app (if running on port 5000)
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  echo "✅ Main App: Healthy"
else
  echo "⚠️  Main App: Not responding"
fi

# Pending requests
PENDING_COUNT=$(ls -1 /home/runner/workspace/.pending 2>/dev/null | wc -l)
echo "📬 Pending Requests: $PENDING_COUNT"

# Inbox responses
INBOX_COUNT=$(ls -1 /home/runner/workspace/.inbox 2>/dev/null | wc -l)
echo "📥 Recent Responses: $INBOX_COUNT"

# Recent activity (last 5 audit log entries)
if [[ -f /tmp/telegram/command-audit.log ]]; then
  RECENT_COMMANDS=$(tail -5 /tmp/telegram/command-audit.log | wc -l)
  echo "📝 Recent Commands: $RECENT_COMMANDS (last 5)"
fi

echo ""
echo "_Last check: $(date -u '+%Y-%m-%d %H:%M:%S UTC')_"
