#!/bin/bash
# monitor-cmd.sh - Run monitor.sh and format for Telegram
# Strips ANSI color codes and formats output

# Check if monitor script exists
MONITOR_SCRIPT="/home/runner/workspace/scripts/telegram/tools/monitor.sh"

if [[ ! -f "$MONITOR_SCRIPT" ]]; then
  echo "❌ Monitor script not found"
  echo ""
  echo "Expected: $MONITOR_SCRIPT"
  exit 1
fi

# Run monitor script and strip ANSI color codes
"$MONITOR_SCRIPT" 2>&1 | sed 's/\x1b\[[0-9;]*m//g'
