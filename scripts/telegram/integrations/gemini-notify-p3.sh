#!/bin/bash
# Gemini Research Notification Wrapper for P3 Interview Academy
#
# Usage: ./scripts/telegram/integrations/gemini-notify-p3.sh "task description" "command to run"
#
# Example:
#   ./gemini-notify-p3.sh \
#     "Research Stripe webhook best practices" \
#     "echo 'Researching Stripe webhooks...'"

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
NOTIFY_SCRIPT="$PROJECT_ROOT/scripts/telegram/core/notify.sh"

# Parse arguments
TASK_DESC="${1:?Missing task description}"
COMMAND="${2:?Missing command to execute}"

# Check if notifications enabled
if [[ ! -f "$PROJECT_ROOT/.notify.enabled" ]]; then
  echo "⚠️  Notifications disabled - running command without notifications"
  eval "$COMMAND"
  exit $?
fi

# Verify notify.sh exists
if [[ ! -x "$NOTIFY_SCRIPT" ]]; then
  echo "⚠️  Notification script not found or not executable: $NOTIFY_SCRIPT"
  echo "⚠️  Running command without notifications"
  eval "$COMMAND"
  exit $?
fi

# Notify start
"$NOTIFY_SCRIPT" <<EOF
🔍 **Gemini Research Started**

**Task**: $TASK_DESC
**Started**: $(date '+%H:%M:%S')
**Estimated Duration**: 2-5 minutes

*You'll be notified when the research is complete.*
EOF

echo "🔍 Research started: $TASK_DESC"
echo "📱 Notification sent to Telegram"
echo ""

# Execute command and capture output
START_TIME=$(date +%s)
OUTPUT_FILE=$(mktemp)

echo "⏳ Executing command..."
if eval "$COMMAND" > "$OUTPUT_FILE" 2>&1; then
  EXIT_CODE=0
  STATUS="✅ SUCCESS"
else
  EXIT_CODE=$?
  STATUS="❌ FAILED"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Format duration nicely
if [[ $DURATION -ge 60 ]]; then
  MINUTES=$((DURATION / 60))
  SECONDS=$((DURATION % 60))
  DURATION_TEXT="${MINUTES}m ${SECONDS}s"
else
  DURATION_TEXT="${DURATION}s"
fi

# Read output (limit to first 500 characters for notification)
OUTPUT=$(cat "$OUTPUT_FILE")
OUTPUT_SUMMARY="${OUTPUT:0:500}"
[[ ${#OUTPUT} -gt 500 ]] && OUTPUT_SUMMARY="${OUTPUT_SUMMARY}..."

# Notify completion
if [[ $EXIT_CODE -eq 0 ]]; then
  "$NOTIFY_SCRIPT" <<EOF
✅ **Gemini Research Complete**

**Task**: $TASK_DESC
**Duration**: $DURATION_TEXT
**Status**: SUCCESS

**Summary**:
${OUTPUT_SUMMARY}

*Full output saved to console logs*
EOF
  echo ""
  echo "✅ Research completed successfully ($DURATION_TEXT)"
  echo "📱 Completion notification sent to Telegram"
  echo ""
  echo "--- Full Output ---"
  cat "$OUTPUT_FILE"
else
  "$NOTIFY_SCRIPT" <<EOF
❌ **Gemini Research Failed**

**Task**: $TASK_DESC
**Duration**: $DURATION_TEXT
**Status**: FAILED (Exit Code: $EXIT_CODE)

**Error**:
${OUTPUT_SUMMARY}

*Check console logs for details*
EOF
  echo ""
  echo "❌ Research failed ($DURATION_TEXT)"
  echo "📱 Failure notification sent to Telegram"
  echo ""
  echo "--- Error Output ---"
  cat "$OUTPUT_FILE"
fi

# Cleanup
rm -f "$OUTPUT_FILE"

exit $EXIT_CODE
