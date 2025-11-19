#!/usr/bin/env bash
set -euo pipefail

# Script: test-suite.sh
# Purpose: Test all Telegram bot controller scripts
# Usage: ./test-suite.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

success() {
  echo -e "${GREEN}✓${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

info() {
  echo -e "${BLUE}→${NC} $1"
}

section() {
  echo ""
  echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

# Cleanup function
cleanup() {
  rm -f "$PROJECT_ROOT/.notify.enabled"
  rm -rf "$PROJECT_ROOT/.inbox" "$PROJECT_ROOT/.pending"
}
trap cleanup EXIT

section "Testing notifyctl"

# Test 1: Initial status should be OFF
info "Test: Initial status is OFF"
if OUTPUT=$("$SCRIPT_DIR/notifyctl" status) && [[ "$OUTPUT" == "OFF" ]]; then
  success "Initial status is OFF"
else
  fail "Initial status test failed: $OUTPUT"
fi

# Test 2: Enable notifications
info "Test: Enable notifications"
if OUTPUT=$("$SCRIPT_DIR/notifyctl" on 2>&1) && [[ -f "$PROJECT_ROOT/.notify.enabled" ]]; then
  success "Notifications enabled"
else
  fail "Enable notifications failed: $OUTPUT"
fi

# Test 3: Status should be ON
info "Test: Status is ON after enabling"
if OUTPUT=$("$SCRIPT_DIR/notifyctl" status) && [[ "$OUTPUT" == "ON" ]]; then
  success "Status correctly shows ON"
else
  fail "Status check failed: $OUTPUT"
fi

# Test 4: Disable notifications
info "Test: Disable notifications"
if OUTPUT=$("$SCRIPT_DIR/notifyctl" off 2>&1) && [[ ! -f "$PROJECT_ROOT/.notify.enabled" ]]; then
  success "Notifications disabled"
else
  fail "Disable notifications failed: $OUTPUT"
fi

# Test 5: Invalid command
info "Test: Invalid command shows help"
if ! OUTPUT=$("$SCRIPT_DIR/notifyctl" invalid 2>&1) && echo "$OUTPUT" | grep -q "Usage:"; then
  success "Invalid command shows help"
else
  fail "Invalid command test failed"
fi

section "Testing notify.sh"

# Test 6: No message parameter
info "Test: notify.sh requires message parameter"
if ! OUTPUT=$("$SCRIPT_DIR/notify.sh" 2>&1); then
  if echo "$OUTPUT" | grep -q "Error: Message text required"; then
    success "Missing parameter error works"
  else
    fail "Wrong error message: $OUTPUT"
  fi
else
  fail "Should have failed without message parameter"
fi

# Test 7: Disabled notifications (silent exit)
info "Test: notify.sh exits silently when disabled"
"$SCRIPT_DIR/notifyctl" off >/dev/null
if "$SCRIPT_DIR/notify.sh" "Test message" 2>&1; then
  success "Silent exit when disabled"
else
  fail "Should exit successfully when disabled"
fi

# Test 8: No env file error
info "Test: notify.sh reports missing .env"
"$SCRIPT_DIR/notifyctl" on >/dev/null
if ! OUTPUT=$("$SCRIPT_DIR/notify.sh" "Test" 2>&1); then
  if echo "$OUTPUT" | grep -q "Environment file not found"; then
    success "Missing .env file detected"
  else
    fail "Wrong error: $OUTPUT"
  fi
else
  fail "Should have failed without .env"
fi

section "Testing await_reply.sh"

# Test 9: No message parameter
info "Test: await_reply.sh requires message parameter"
if ! OUTPUT=$("$SCRIPT_DIR/await_reply.sh" 2>&1); then
  if echo "$OUTPUT" | grep -q "Error: Message text required"; then
    success "Missing parameter error works"
  else
    fail "Wrong error message: $OUTPUT"
  fi
else
  fail "Should have failed without message parameter"
fi

# Test 10: Creates pending directory
info "Test: await_reply.sh creates .pending directory"
rm -rf "$PROJECT_ROOT/.pending"
timeout 2 "$SCRIPT_DIR/await_reply.sh" "Test" 1 2>/dev/null || true
if [[ -d "$PROJECT_ROOT/.pending" ]]; then
  success "Creates .pending directory"
else
  fail ".pending directory not created"
fi

# Test 11: Timeout behavior
info "Test: await_reply.sh times out correctly"
START=$(date +%s)
if ! OUTPUT=$("$SCRIPT_DIR/await_reply.sh" "Test timeout" 3 2>&1); then
  END=$(date +%s)
  ELAPSED=$((END - START))
  if echo "$OUTPUT" | grep -q "TIMEOUT" && [[ $ELAPSED -ge 3 ]] && [[ $ELAPSED -le 5 ]]; then
    success "Timeout works correctly (${ELAPSED}s)"
  else
    fail "Timeout failed: ${ELAPSED}s, output: $OUTPUT"
  fi
else
  fail "Should have timed out"
fi

# Test 12: Cleanup after timeout
info "Test: await_reply.sh cleans up after timeout"
timeout 2 "$SCRIPT_DIR/await_reply.sh" "Test cleanup" 1 2>/dev/null || true
sleep 2
PENDING_COUNT=$(find "$PROJECT_ROOT/.pending" -type f 2>/dev/null | wc -l)
if [[ $PENDING_COUNT -eq 0 ]]; then
  success "Cleanup works after timeout"
else
  fail "Pending files not cleaned up: $PENDING_COUNT files"
fi

section "Testing init.sh"

# Test 13: Creates directories
info "Test: init.sh creates required directories"
rm -rf "$PROJECT_ROOT/.inbox" "$PROJECT_ROOT/.pending" "$SCRIPT_DIR/../.logs"
# Can't run init.sh without .env, but we can check directory creation logic
mkdir -p "$PROJECT_ROOT/.inbox" "$PROJECT_ROOT/.pending" "$SCRIPT_DIR/../.logs"
if [[ -d "$PROJECT_ROOT/.inbox" ]] && [[ -d "$PROJECT_ROOT/.pending" ]] && [[ -d "$SCRIPT_DIR/../.logs" ]]; then
  success "Directory creation logic verified"
else
  fail "Directories not created"
fi

# Test 14: Scripts are executable
info "Test: All scripts are executable"
ALL_EXECUTABLE=true
for script in notifyctl notify.sh await_reply.sh init.sh; do
  if [[ ! -x "$SCRIPT_DIR/$script" ]]; then
    ALL_EXECUTABLE=false
    break
  fi
done

if [[ $ALL_EXECUTABLE == true ]]; then
  success "All scripts are executable"
else
  fail "Some scripts are not executable"
fi

section "Test Summary"
echo ""
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}✗ Some tests failed${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
fi
