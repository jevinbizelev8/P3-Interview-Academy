# Testing Guide: Claude Code Operations Script

## Overview

This guide provides comprehensive testing procedures for `claude-session-notify.sh` to verify all notification types, approval flows, and error handling.

## Prerequisites

1. **Telegram Bot Setup**
   ```bash
   cd /home/runner/workspace
   ./scripts/telegram/core/init.sh
   ```

2. **Enable Notifications**
   ```bash
   ./scripts/telegram/core/notifyctl on
   ```

3. **Start Listener**
   ```bash
   ./scripts/telegram/core/start-listener.sh
   ```

## Test Suite

### Test 1: Start Notification

**Purpose**: Verify task start notifications are sent correctly.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  start "Test task for verification"
```

**Expected Console Output**:
```
📱 Start notification sent
```

**Expected Telegram Message**:
```
🤖 Claude Code Task Started

Task: Test task for verification
Started: 2025-11-01 14:30:00

I'll notify you when this task completes
```

**Verification**:
- [ ] Console shows success message
- [ ] Telegram receives notification within 5 seconds
- [ ] Timestamp is accurate
- [ ] Task description matches input

---

### Test 2: Complete Notification (Without Details)

**Purpose**: Verify completion notifications work without optional details.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  complete "Test task completion"
```

**Expected Console Output**:
```
📱 Completion notification sent
```

**Expected Telegram Message**:
```
✅ Claude Code Task Complete

Task: Test task completion
Completed: 2025-11-01 14:32:00

Task finished successfully
```

**Verification**:
- [ ] Console shows success message
- [ ] Telegram receives notification
- [ ] No "Details:" line shown
- [ ] Timestamp is accurate

---

### Test 3: Complete Notification (With Details)

**Purpose**: Verify completion notifications include optional details.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  complete "Test task completion" "13 files processed, 0 errors"
```

**Expected Console Output**:
```
📱 Completion notification sent
```

**Expected Telegram Message**:
```
✅ Claude Code Task Complete

Task: Test task completion
Completed: 2025-11-01 14:32:00
Details: 13 files processed, 0 errors

Task finished successfully
```

**Verification**:
- [ ] Console shows success message
- [ ] Details line appears
- [ ] Details text matches input

---

### Test 4: Alert Notification

**Purpose**: Verify error alerts are sent correctly.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  alert "Test error condition" "Simulated failure for testing"
```

**Expected Console Output**:
```
📱 Alert notification sent
```

**Expected Telegram Message**:
```
🚨 Claude Code Alert

Task: Test error condition
Issue: Simulated failure for testing
Time: 2025-11-01 14:35:00

Action may be required!
```

**Verification**:
- [ ] Console shows success message
- [ ] Alert emoji (🚨) displayed
- [ ] Issue details included
- [ ] Urgent tone conveyed

---

### Test 5: Approval Flow - Approve

**Purpose**: Verify approval requests work and accept approval.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Delete test files" "10 files in /tmp/test"
```

**Expected Console Output (Initial)**:
```
📱 Approval request sent to Telegram
⏳ Waiting for response...
```

**Expected Telegram Message**:
```
⚠️ Approval Required

Task: Delete test files
Details: 10 files in /tmp/test
Requested: 2025-11-01 14:40:00

To approve, reply:
`approve abc123de`

To reject, reply:
`reject abc123de`

Timeout: 5 minutes
```

**User Action**: In Telegram, reply with:
```
approve abc123de
```
(Replace token with actual token from message)

**Expected Console Output (After Approval)**:
```
✅ APPROVED
```

**Expected Telegram Confirmation**:
```
✅ Approval granted - proceeding with: Delete test files
```

**Exit Code Check**:
```bash
echo $?  # Should output: 0
```

**Verification**:
- [ ] Approval request sent
- [ ] Token is 16 hex characters
- [ ] Reply correctly processed
- [ ] Confirmation sent
- [ ] Exit code is 0
- [ ] Token file cleaned up from `.pending/`

---

### Test 6: Approval Flow - Reject

**Purpose**: Verify approval requests handle rejection correctly.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Drop production database" "DB: prod_db"
```

**User Action**: In Telegram, reply with:
```
reject abc123de
```

**Expected Console Output**:
```
📱 Approval request sent to Telegram
⏳ Waiting for response...
❌ REJECTED
```

**Expected Telegram Confirmation**:
```
❌ Approval denied - cancelled: Drop production database
```

**Exit Code Check**:
```bash
echo $?  # Should output: 1
```

**Verification**:
- [ ] Rejection processed
- [ ] Exit code is 1
- [ ] Token cleaned up

---

### Test 7: Approval Flow - Timeout

**Purpose**: Verify approval requests timeout correctly.

**Command**:
```bash
# Use short timeout for faster testing (edit script temporarily)
# Change line: if "$PROJECT_ROOT/scripts/telegram/core/await_reply.sh" "$TOKEN" 300; then
# To: if "$PROJECT_ROOT/scripts/telegram/core/await_reply.sh" "$TOKEN" 10; then

./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Timeout test" "Wait 10 seconds"
```

**User Action**: Do NOT reply in Telegram.

**Expected Console Output (After 10 seconds)**:
```
📱 Approval request sent to Telegram
⏳ Waiting for response...
⏰ TIMEOUT
```

**Expected Telegram Message**:
```
⏰ Approval timeout - cancelled: Timeout test
```

**Exit Code Check**:
```bash
echo $?  # Should output: 1
```

**Verification**:
- [ ] Timeout after specified duration
- [ ] Exit code is 1
- [ ] Timeout notification sent
- [ ] Token cleaned up

---

### Test 8: Silent Mode - Regular Actions

**Purpose**: Verify notifications are skipped in silent mode.

**Setup**:
```bash
./scripts/telegram/core/notifyctl off
```

**Commands**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh start "Silent test"
./scripts/telegram/integrations/claude-session-notify.sh complete "Silent test"
./scripts/telegram/integrations/claude-session-notify.sh alert "Silent test" "Details"
```

**Expected Console Output (Each)**:
```
⚠️  Notifications disabled - skipping notification
```

**Expected Telegram**: No messages received

**Exit Codes**: All should be 0

**Verification**:
- [ ] Console shows warning
- [ ] No Telegram messages sent
- [ ] Exit codes are 0
- [ ] Scripts continue without error

**Cleanup**:
```bash
./scripts/telegram/core/notifyctl on
```

---

### Test 9: Silent Mode - Approval Auto-Approve

**Purpose**: Verify approvals auto-approve in silent mode.

**Setup**:
```bash
./scripts/telegram/core/notifyctl off
```

**Command**:
```bash
if ./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Silent approval test"; then
  echo "AUTO-APPROVED"
fi
```

**Expected Console Output**:
```
⚠️  Notifications disabled - AUTO-APPROVING
AUTO-APPROVED
```

**Exit Code**: 0

**Verification**:
- [ ] Console shows auto-approve warning
- [ ] No blocking/waiting
- [ ] Exit code is 0
- [ ] Workflow continues

**Cleanup**:
```bash
./scripts/telegram/core/notifyctl on
```

---

### Test 10: Invalid Action

**Purpose**: Verify proper error handling for invalid actions.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  invalid "Test"
```

**Expected Console Output**:
```
Error: Invalid action: invalid
Usage: ./scripts/telegram/integrations/claude-session-notify.sh {start|complete|approve|alert} <task> [details]
```

**Exit Code**: 2

**Verification**:
- [ ] Error message shown
- [ ] Usage help displayed
- [ ] Exit code is 2

---

### Test 11: Missing Arguments

**Purpose**: Verify proper error handling for missing arguments.

**Command**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh start
```

**Expected Console Output**:
```bash
./scripts/telegram/integrations/claude-session-notify.sh: line 18: 2: Missing task description
```

**Exit Code**: 1

**Verification**:
- [ ] Error indicates missing parameter
- [ ] Non-zero exit code

---

### Test 12: Integration - Conditional Workflow

**Purpose**: Verify script integrates correctly in bash conditionals.

**Test Script** (`test-workflow.sh`):
```bash
#!/bin/bash
set -e

echo "=== Testing Conditional Workflow ==="

# Test 1: Approved flow
if ./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Test conditional workflow" "Reply approve"; then
  echo "✅ Branch 1: Approved path taken"
else
  echo "❌ Branch 1: Rejected path taken (UNEXPECTED)"
  exit 1
fi

# Test 2: Rejected flow
if ./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Test rejection path" "Reply reject"; then
  echo "❌ Branch 2: Approved path taken (UNEXPECTED)"
  exit 1
else
  echo "✅ Branch 2: Rejected path taken"
fi

echo "=== All tests passed ==="
```

**User Actions**:
1. First approval request: Reply `approve <token>`
2. Second approval request: Reply `reject <token>`

**Expected Final Output**:
```
✅ Branch 1: Approved path taken
✅ Branch 2: Rejected path taken
=== All tests passed ===
```

**Verification**:
- [ ] Conditional branches work correctly
- [ ] Script integrates with standard bash patterns

---

## Integration Testing

### Real-World Scenario 1: Database Migration

**Test Script**:
```bash
#!/bin/bash

./scripts/telegram/integrations/claude-session-notify.sh \
  start "Database migration test"

echo "Simulating migration..."
sleep 2

if ./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Apply test migrations?" "5 tables"; then

  echo "Migration approved"
  sleep 1

  ./scripts/telegram/integrations/claude-session-notify.sh \
    complete "Migration complete" "5 tables created"
else
  ./scripts/telegram/integrations/claude-session-notify.sh \
    alert "Migration cancelled" "User rejected"
fi
```

**Verification**:
- [ ] Start notification received
- [ ] Approval request received
- [ ] Completion or alert sent based on response

---

### Real-World Scenario 2: Error Recovery

**Test Script**:
```bash
#!/bin/bash

./scripts/telegram/integrations/claude-session-notify.sh \
  start "Build and deploy test"

echo "Simulating build..."
sleep 1

# Simulate build failure
if false; then
  echo "Build succeeded"
else
  ./scripts/telegram/integrations/claude-session-notify.sh \
    alert "Build failed" "TypeScript error on line 42"
  exit 1
fi
```

**Expected Outcome**:
- [ ] Start notification sent
- [ ] Alert sent when build fails
- [ ] Script exits with code 1

---

## Performance Testing

### Latency Test

**Command**:
```bash
time ./scripts/telegram/integrations/claude-session-notify.sh \
  start "Latency test"
```

**Expected Time**: < 3 seconds

**Verification**:
- [ ] Response time acceptable
- [ ] No unnecessary delays

---

### Concurrent Requests Test

**Command**:
```bash
for i in {1..5}; do
  ./scripts/telegram/integrations/claude-session-notify.sh \
    start "Concurrent test $i" &
done
wait
```

**Expected**: All 5 notifications sent successfully

**Verification**:
- [ ] All messages received
- [ ] No message loss
- [ ] No race conditions

---

## Cleanup After Testing

```bash
# Remove test tokens
rm -rf .pending/* .inbox/*

# Check listener status
ps aux | grep telegram-listener

# Review logs if needed
tail -50 ~/.telegram-listener.log
```

---

## Success Criteria

All tests must pass with:
- ✅ Correct console output
- ✅ Expected Telegram messages
- ✅ Proper exit codes
- ✅ Clean token cleanup
- ✅ No errors in logs
- ✅ Silent mode respects disabled state
- ✅ Approval flow works bidirectionally
- ✅ Integration with bash conditionals

---

## Troubleshooting Test Failures

### Notifications Not Received
1. Check listener is running: `ps aux | grep telegram-listener`
2. Verify bot token: `cat .telegram.config`
3. Test basic notification: `./scripts/telegram/core/notify.sh "test"`

### Approval Not Processing
1. Check token in Telegram matches command
2. Verify `.pending/` directory exists and is writable
3. Check listener log: `tail -50 ~/.telegram-listener.log`

### Exit Codes Wrong
1. Use `set -x` in script for debugging
2. Check error output: `... 2>&1 | tee test.log`
3. Verify `await_reply.sh` returns correct codes

### Timeouts Not Working
1. Verify timeout parameter passed correctly
2. Check system time is accurate
3. Test `await_reply.sh` directly with short timeout

---

## Test Checklist

Before declaring Phase C5 complete, verify:

- [ ] All 12 basic tests pass
- [ ] Integration tests complete successfully
- [ ] Silent mode works correctly
- [ ] Approval flow handles all outcomes (approve/reject/timeout)
- [ ] Error handling works for invalid inputs
- [ ] Exit codes match specification
- [ ] No token leakage (files cleaned up)
- [ ] Performance is acceptable (<3s latency)
- [ ] Concurrent requests don't interfere
- [ ] Documentation matches actual behavior
