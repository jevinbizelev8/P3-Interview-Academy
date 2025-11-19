#!/usr/bin/env bash
set -euo pipefail

# Example: Log monitoring with Telegram alerts
# This demonstrates real-time error monitoring and notifications

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TELEGRAM_CORE="$SCRIPT_DIR/../core"

# Enable notifications
"$TELEGRAM_CORE/notifyctl" on

# Send monitoring start notification
"$TELEGRAM_CORE/notify.sh" "👀 **Monitoring Started**

Watching application logs for errors
Alert threshold: ERROR, FATAL
Notification: Enabled
"

# Simulate log monitoring (in real scenario, use: tail -f /var/log/app.log)
echo "Monitoring logs... (Press Ctrl+C to stop)"

# Sample log entries for demonstration
SAMPLE_LOGS=(
  "2025-11-01 10:00:00 INFO Application started"
  "2025-11-01 10:01:23 DEBUG User login attempt"
  "2025-11-01 10:02:45 ERROR Database connection failed"
  "2025-11-01 10:03:12 INFO Retrying connection..."
  "2025-11-01 10:03:15 ERROR Authentication service down"
  "2025-11-01 10:04:30 FATAL System crash - out of memory"
)

# Process each log entry
for log_entry in "${SAMPLE_LOGS[@]}"; do
  echo "$log_entry"

  # Check for errors
  if echo "$log_entry" | grep -qE "ERROR|FATAL"; then
    LEVEL=$(echo "$log_entry" | grep -oE "ERROR|FATAL")
    MESSAGE=$(echo "$log_entry" | cut -d' ' -f4-)

    # Send alert based on severity
    if [[ "$LEVEL" == "FATAL" ]]; then
      "$TELEGRAM_CORE/notify.sh" "🚨 **CRITICAL ALERT**

Level: FATAL
Message: $MESSAGE
Time: $(date '+%H:%M:%S')

Immediate action required!
"

      # Request immediate response for critical errors
      if RESPONSE=$("$TELEGRAM_CORE/await_reply.sh" "🚨 **System Down**

$MESSAGE

Acknowledge this alert?
Reply 'ack' to acknowledge
" 120); then
        echo "Alert acknowledged: $RESPONSE"
      fi

    else
      "$TELEGRAM_CORE/notify.sh" "⚠️ **Error Detected**

Level: ERROR
Message: $MESSAGE
Time: $(date '+%H:%M:%S')

Check application status
"
    fi
  fi

  sleep 1
done

echo "Monitoring example completed"
