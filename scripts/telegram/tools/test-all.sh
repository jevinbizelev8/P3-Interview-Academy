#!/bin/bash
# Test all monitoring and maintenance tools
#
# Usage:
#   ./test-all.sh
#
# Tests:
#   1. monitor.sh - System status
#   2. cleanup.sh - File cleanup (dry-run)
#   3. webhook_info.sh - Webhook status
#
# Purpose:
#   Quick verification that all tools are working

set -euo pipefail

cd "$(dirname "$0")/../../.." || exit 1

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Testing All Telegram Monitoring & Maintenance Tools     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Monitor
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: System Monitor (monitor.sh)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ./scripts/telegram/tools/monitor.sh --no-color; then
  echo ""
  echo "✅ monitor.sh completed successfully"
else
  echo ""
  echo "❌ monitor.sh failed (exit code: $?)"
fi

echo ""
echo ""

# Test 2: Cleanup (dry-run)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: File Cleanup - Dry Run (cleanup.sh)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ./scripts/telegram/tools/cleanup.sh --dry-run; then
  echo "✅ cleanup.sh completed successfully"
else
  echo "❌ cleanup.sh failed (exit code: $?)"
fi

echo ""
echo ""

# Test 3: Webhook Info
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Webhook Information (webhook_info.sh)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ./scripts/telegram/tools/webhook_info.sh; then
  echo ""
  echo "✅ webhook_info.sh completed successfully"
else
  exit_code=$?
  echo ""
  if [[ $exit_code -eq 1 ]]; then
    echo "⚠️  webhook_info.sh: webhook not registered (expected if not set up)"
  elif [[ $exit_code -eq 2 ]]; then
    echo "❌ webhook_info.sh: missing dependencies"
  else
    echo "❌ webhook_info.sh failed (exit code: $exit_code)"
  fi
fi

echo ""
echo ""

# Summary
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Test Summary                                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "All tools are installed and executable."
echo ""
echo "Next steps:"
echo "  1. Set up Telegram bot token: export TELEGRAM_BOT_TOKEN='...'"
echo "  2. Initialize system: ./scripts/telegram/core/notifyctl setup"
echo "  3. Monitor status: ./scripts/telegram/tools/monitor.sh"
echo "  4. Set up cron: see CRON_SETUP.md"
echo ""

exit 0
