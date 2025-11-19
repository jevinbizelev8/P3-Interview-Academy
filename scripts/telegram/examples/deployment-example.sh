#!/usr/bin/env bash
set -euo pipefail

# Example: Deployment script with Telegram notifications
# This demonstrates how to integrate Telegram notifications into your workflows

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TELEGRAM_CORE="$SCRIPT_DIR/../core"

# Enable notifications
"$TELEGRAM_CORE/notifyctl" on

# Send deployment start notification
"$TELEGRAM_CORE/notify.sh" "🚀 **Deployment Started**

Environment: Production
Branch: main
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
Triggered by: ${USER:-system}
"

# Simulate running tests
echo "Running tests..."
sleep 2

# Check if tests passed (simulated)
TESTS_PASSED=true

if [[ "$TESTS_PASSED" == true ]]; then
  "$TELEGRAM_CORE/notify.sh" "✅ **Tests Passed**

All unit tests successful
Coverage: 85%
Ready for deployment
"
else
  "$TELEGRAM_CORE/notify.sh" "❌ **Tests Failed**

Deployment aborted
Check logs for details
"
  exit 1
fi

# Request approval for production deployment
echo "Requesting deployment approval..."
if ! RESPONSE=$("$TELEGRAM_CORE/await_reply.sh" "🔐 **Approval Required**

Deploy to production?
Branch: main
Tests: ✅ Passed
Database: No migrations

Reply 'approve' to continue or 'reject' to cancel
" 300); then
  "$TELEGRAM_CORE/notify.sh" "⏱️ **Deployment Cancelled**

Approval timeout (5 minutes)
No changes deployed
"
  exit 1
fi

# Check approval response
if [[ "$RESPONSE" != "approve" ]]; then
  "$TELEGRAM_CORE/notify.sh" "🛑 **Deployment Rejected**

Reason: $RESPONSE
No changes deployed
"
  exit 1
fi

# Simulate deployment
echo "Deploying to production..."
sleep 3

# Send success notification
"$TELEGRAM_CORE/notify.sh" "✅ **Deployment Complete**

Environment: Production
Status: Success
Duration: 45 seconds
Version: v1.2.3

Application is live!
"

echo "Deployment completed successfully!"
