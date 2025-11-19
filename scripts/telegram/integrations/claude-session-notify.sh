#!/bin/bash
# Claude Code Operations Notification Script
#
# Usage:
#   ./claude-session-notify.sh start "task description"
#   ./claude-session-notify.sh complete "task description" "details"
#   ./claude-session-notify.sh approve "task description" "details"
#   ./claude-session-notify.sh alert "task description" "issue details"

set -euo pipefail

# Get script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Parse arguments
ACTION="${1:?Missing action: start|complete|approve|alert}"
TASK_DESC="${2:?Missing task description}"
DETAILS="${3:-}"

# Check if notifications enabled
if [[ ! -f "$PROJECT_ROOT/.notify.enabled" ]]; then
  case "$ACTION" in
    approve)
      # Auto-approve in silent mode
      echo "⚠️  Notifications disabled - AUTO-APPROVING"
      exit 0
      ;;
    *)
      # Other actions just skip notification
      echo "⚠️  Notifications disabled - skipping notification"
      exit 0
      ;;
  esac
fi

case "$ACTION" in
  start)
    MESSAGE="🤖 **Claude Code Task Started**

**Task**: $TASK_DESC
**Started**: $(date '+%Y-%m-%d %H:%M:%S')

*I'll notify you when this task completes*"
    "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "$MESSAGE"
    echo "📱 Start notification sent"
    ;;

  complete)
    MESSAGE="✅ **Claude Code Task Complete**

**Task**: $TASK_DESC
**Completed**: $(date '+%Y-%m-%d %H:%M:%S')"
    if [[ -n "$DETAILS" ]]; then
      MESSAGE="$MESSAGE
**Details**: $DETAILS"
    fi
    MESSAGE="$MESSAGE

*Task finished successfully*"
    "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "$MESSAGE"
    echo "📱 Completion notification sent"
    ;;

  approve)
    # Generate secure token
    TOKEN=$(openssl rand -hex 8)

    # Create pending request
    mkdir -p "$PROJECT_ROOT/.pending"
    echo "$TOKEN" > "$PROJECT_ROOT/.pending/$TOKEN"

    # Send approval request
    MESSAGE="⚠️ **Approval Required**

**Task**: $TASK_DESC"
    if [[ -n "$DETAILS" ]]; then
      MESSAGE="$MESSAGE
**Details**: $DETAILS"
    fi
    MESSAGE="$MESSAGE
**Requested**: $(date '+%Y-%m-%d %H:%M:%S')

**To approve, reply:**
\`approve $TOKEN\`

**To reject, reply:**
\`reject $TOKEN\`

*Timeout: 5 minutes*"
    "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "$MESSAGE"

    echo "📱 Approval request sent to Telegram"
    echo "⏳ Waiting for response..."

    # Wait for approval (5 minute timeout)
    if "$PROJECT_ROOT/scripts/telegram/core/await_reply.sh" "$TOKEN" 300; then
      DECISION=$(cat "$PROJECT_ROOT/.inbox/$TOKEN")
      rm -f "$PROJECT_ROOT/.inbox/$TOKEN"
      rm -f "$PROJECT_ROOT/.pending/$TOKEN"

      if [[ "$DECISION" == "approve" ]]; then
        echo "✅ APPROVED"
        "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "✅ Approval granted - proceeding with: $TASK_DESC"
        exit 0
      else
        echo "❌ REJECTED"
        "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "❌ Approval denied - cancelled: $TASK_DESC"
        exit 1
      fi
    else
      echo "⏰ TIMEOUT"
      rm -f "$PROJECT_ROOT/.pending/$TOKEN"
      "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "⏰ Approval timeout - cancelled: $TASK_DESC"
      exit 1
    fi
    ;;

  alert)
    MESSAGE="🚨 **Claude Code Alert**

**Task**: $TASK_DESC
**Issue**: $DETAILS
**Time**: $(date '+%Y-%m-%d %H:%M:%S')

**Action may be required!**"
    "$PROJECT_ROOT/scripts/telegram/core/notify.sh" "$MESSAGE"
    echo "📱 Alert notification sent"
    ;;

  *)
    echo "Error: Invalid action: $ACTION" >&2
    echo "Usage: $0 {start|complete|approve|alert} <task> [details]" >&2
    exit 2
    ;;
esac
