#!/bin/bash
# test-cmd.sh - Run test suite and stream output
# Returns last 50 lines of test output

set -e

cd /home/runner/workspace

echo "🧪 Running test suite..."
echo ""
echo "This may take several minutes. Please wait..."
echo ""

# Run tests and capture output
if npm run test:run 2>&1 | tail -50; then
  echo ""
  echo "✅ Test suite completed successfully"
  exit 0
else
  echo ""
  echo "❌ Some tests failed - check logs for details"
  exit 1
fi
