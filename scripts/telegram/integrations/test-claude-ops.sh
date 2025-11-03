#!/bin/bash
# Quick verification script for claude-session-notify.sh
# Tests all actions in silent mode (no actual notifications)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFY_SCRIPT="$SCRIPT_DIR/claude-session-notify.sh"

echo "========================================"
echo "Testing claude-session-notify.sh"
echo "========================================"
echo ""

# Ensure silent mode (backup existing state)
if [[ -f "$SCRIPT_DIR/../../.notify.enabled" ]]; then
  mv "$SCRIPT_DIR/../../.notify.enabled" "$SCRIPT_DIR/../../.notify.enabled.backup"
fi

echo "Test 1: Start notification (silent mode)"
if "$NOTIFY_SCRIPT" start "Test task" 2>&1 | grep -q "skipping notification"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""

echo "Test 2: Complete notification without details (silent mode)"
if "$NOTIFY_SCRIPT" complete "Test task" 2>&1 | grep -q "skipping notification"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""

echo "Test 3: Complete notification with details (silent mode)"
if "$NOTIFY_SCRIPT" complete "Test task" "Some details" 2>&1 | grep -q "skipping notification"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""

echo "Test 4: Alert notification (silent mode)"
if "$NOTIFY_SCRIPT" alert "Test error" "Issue details" 2>&1 | grep -q "skipping notification"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""

echo "Test 5: Approval auto-approve (silent mode)"
if "$NOTIFY_SCRIPT" approve "Test approval" "Details" 2>&1 | grep -q "AUTO-APPROVING"; then
  echo "✅ PASS (exit code 0, auto-approved)"
else
  echo "❌ FAIL"
fi
echo ""

echo "Test 6: Invalid action"
if "$NOTIFY_SCRIPT" invalid "Test" 2>&1 | grep -q "Invalid action"; then
  echo "✅ PASS (error shown)"
else
  echo "❌ FAIL"
fi
echo ""

echo "Test 7: Missing task description"
if "$NOTIFY_SCRIPT" start 2>&1 | grep -q "Missing task description"; then
  echo "✅ PASS (error shown)"
else
  echo "❌ FAIL"
fi
echo ""

# Restore notify state if it existed
if [[ -f "$SCRIPT_DIR/../../.notify.enabled.backup" ]]; then
  mv "$SCRIPT_DIR/../../.notify.enabled.backup" "$SCRIPT_DIR/../../.notify.enabled"
  echo "Notifications restored to enabled state"
fi

echo "========================================"
echo "All tests complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Enable notifications: ./scripts/telegram/core/notifyctl on"
echo "2. Start listener: ./scripts/telegram/core/start-listener.sh"
echo "3. Test with real notifications: $NOTIFY_SCRIPT start \"Real test\""
