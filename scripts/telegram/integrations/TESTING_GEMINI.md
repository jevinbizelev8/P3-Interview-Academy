# Testing Guide: Gemini Research Notification Wrapper

## Overview

This guide covers how to test `gemini-notify-p3.sh` before using it in production workflows.

## Prerequisites

- ✅ Telegram Controller configured (`scripts/telegram/core/notify.sh` working)
- ✅ Notifications enabled (`.notify.enabled` file exists)
- ✅ Test Telegram chat configured

## Quick Test

### Test 1: Simple Echo Command (Success)

```bash
cd /home/runner/workspace

./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Test simple command" \
  "echo 'Hello from Gemini wrapper'"
```

**Expected Output (Console)**:
```
🔍 Research started: Test simple command
📱 Notification sent to Telegram

⏳ Executing command...

✅ Research completed successfully (0s)
📱 Completion notification sent to Telegram

--- Full Output ---
Hello from Gemini wrapper
```

**Expected Notifications (Telegram)**:
1. Start notification:
   ```
   🔍 Gemini Research Started

   Task: Test simple command
   Started: 14:32:15
   Estimated Duration: 2-5 minutes

   You'll be notified when the research is complete.
   ```

2. Completion notification:
   ```
   ✅ Gemini Research Complete

   Task: Test simple command
   Duration: 0s
   Status: SUCCESS

   Summary:
   Hello from Gemini wrapper

   Full output saved to console logs
   ```

### Test 2: Command with Delay (Simulates Long Research)

```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Test long-running command" \
  "sleep 5 && echo 'Research completed after delay'"
```

**Expected**:
- Start notification sent immediately
- 5-second delay
- Completion notification shows `Duration: 5s`

### Test 3: Command that Fails

```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Test command failure" \
  "exit 1"
```

**Expected Output (Console)**:
```
🔍 Research started: Test command failure
📱 Notification sent to Telegram

⏳ Executing command...

❌ Research failed (0s)
📱 Failure notification sent to Telegram

--- Error Output ---
```

**Expected Notification (Telegram)**:
```
❌ Gemini Research Failed

Task: Test command failure
Duration: 0s
Status: FAILED (Exit Code: 1)

Error:
[empty or error message]

Check console logs for details
```

### Test 4: Long Output (Tests Truncation)

```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Test output truncation" \
  "for i in {1..100}; do echo 'Line number \$i with some additional text to make it longer'; done"
```

**Expected**:
- Telegram notification shows first 500 characters + "..."
- Console shows full output

### Test 5: Silent Mode (Notifications Disabled)

```bash
# Disable notifications
./scripts/notifyctl off

# Run wrapper
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Test silent mode" \
  "echo 'Running in silent mode'"

# Re-enable notifications
./scripts/notifyctl on
```

**Expected**:
```
⚠️  Notifications disabled - running command without notifications
Running in silent mode
```

No Telegram notifications sent.

## Testing with Actual Gemini CLI

### Prerequisites

- Gemini CLI installed and configured
- `.claude/agents/gemini-research-specialist.md` exists

### Test 6: Real Gemini Research (Short)

```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research React hooks best practices" \
  "claude --agent gemini 'provide 3 React hooks best practices in bullet points'"
```

**Expected**:
- Start notification sent
- Gemini CLI executes (may take 1-3 minutes)
- Completion notification with research summary

### Test 7: Real Gemini Research (Medium)

```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research PostgreSQL indexing strategies" \
  "claude --agent gemini 'research PostgreSQL indexing strategies for high-traffic web applications'"
```

**Expected**:
- Duration: 2-5 minutes
- Detailed research output
- Summary truncated in Telegram, full in console

### Test 8: Real Gemini Research with Failure

```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research invalid topic" \
  "claude --agent gemini --invalid-flag 'test'"
```

**Expected**:
- Failure notification sent
- Error message captured
- Exit code reported

## Verification Checklist

After running tests, verify:

### Notifications
- [ ] Start notification received in Telegram
- [ ] Completion notification received in Telegram
- [ ] Failure notification received (for failed tests)
- [ ] Notifications include task description
- [ ] Duration displayed correctly (formatted as Xm Ys or Xs)

### Console Output
- [ ] "Research started" message printed
- [ ] "Notification sent" confirmation shown
- [ ] Full output displayed after completion
- [ ] Success/failure status clearly indicated

### Timing
- [ ] Start notification sent immediately (within 1-2 seconds)
- [ ] Duration calculation accurate (compare to stopwatch)
- [ ] Completion notification sent within 1-2 seconds of command finish

### Error Handling
- [ ] Failed commands don't crash wrapper
- [ ] Exit code preserved from original command
- [ ] Error output captured and displayed
- [ ] Failure notification sent

### Silent Mode
- [ ] Commands execute when notifications disabled
- [ ] Warning message displayed
- [ ] No Telegram notifications sent
- [ ] Exit code still preserved

## Common Issues

### Issue: No Notifications Sent

**Symptoms**: Command runs but no Telegram notifications

**Diagnosis**:
```bash
# Check if notifications enabled
ls .notify.enabled

# Test notify.sh directly
./scripts/telegram/core/notify.sh <<< "Test message"

# Check notify.sh is executable
ls -l scripts/telegram/core/notify.sh
```

**Solutions**:
- Enable notifications: `./scripts/notifyctl on`
- Make notify.sh executable: `chmod +x scripts/telegram/core/notify.sh`
- Verify Telegram token configured in `.env`

### Issue: "Command Not Found" Error

**Symptoms**: Wrapper fails with command not found

**Diagnosis**:
```bash
# Test command directly
which claude
echo $PATH

# Check if command exists
claude --version
```

**Solutions**:
- Install missing command
- Use full path to command
- Add command directory to PATH

### Issue: Output Truncated in Console

**Symptoms**: Console shows partial output

**Diagnosis**: Not actually an issue - full output displayed after "--- Full Output ---" line

**Verification**:
```bash
# Compare line counts
./gemini-notify-p3.sh "test" "echo 'test'" | wc -l
```

### Issue: Duration Shows 0s

**Symptoms**: Very fast commands show 0s duration

**Diagnosis**: Expected behavior - sub-second commands round to 0s

**Solutions**:
- Use for longer tasks (>1 second)
- Add artificial delay for testing: `sleep 2 && your-command`

### Issue: Script Permission Denied

**Symptoms**: `bash: ./gemini-notify-p3.sh: Permission denied`

**Solution**:
```bash
chmod +x scripts/telegram/integrations/gemini-notify-p3.sh
```

## Performance Testing

### Test Response Time

```bash
# Measure notification overhead
time ./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Performance test" \
  "sleep 10"

# Compare to direct execution
time sleep 10
```

**Expected Overhead**: 1-3 seconds (for two API calls to Telegram)

### Test with Large Output

```bash
# Generate 10KB of output
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Test large output" \
  "for i in {1..1000}; do echo 'Line \$i: Lorem ipsum dolor sit amet'; done"
```

**Expected**: Telegram shows truncated, console shows full output

### Test Concurrent Execution

```bash
# Run multiple wrappers in parallel
./scripts/telegram/integrations/gemini-notify-p3.sh "Task 1" "sleep 5" &
./scripts/telegram/integrations/gemini-notify-p3.sh "Task 2" "sleep 3" &
./scripts/telegram/integrations/gemini-notify-p3.sh "Task 3" "sleep 2" &

wait
```

**Expected**: All three complete, notifications interleaved but distinct

## Integration Testing

### Test with DB Migration Wrapper

```bash
# Simulate research before migration
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research migration strategy" \
  "echo 'Migration research complete'" \
&& ./scripts/telegram/integrations/db-migrate-p3.sh --dry-run
```

**Expected**: Both wrappers execute sequentially, notifications for each

### Test in CI/CD Pipeline

```bash
# Add to .github/workflows/test.yml
- name: Research deployment strategy
  run: |
    ./scripts/telegram/integrations/gemini-notify-p3.sh \
      "Research CI/CD best practices" \
      "echo 'CI/CD research complete'"
```

**Expected**: Works in GitHub Actions (if Telegram token configured as secret)

## Load Testing

### Rapid Fire Test

```bash
# Send 10 rapid notifications
for i in {1..10}; do
  ./scripts/telegram/integrations/gemini-notify-p3.sh \
    "Rapid test $i" \
    "echo 'Test $i'"
  sleep 1
done
```

**Expected**: All 20 notifications (10 start + 10 complete) delivered

**Watch for**: Telegram rate limiting (may delay some notifications)

## Cleanup After Testing

```bash
# Remove test notifications from Telegram
# (Manual: delete messages in Telegram chat)

# Check for leftover temp files
ls /tmp/tmp.* 2>/dev/null || echo "No temp files found"

# Verify no background processes running
ps aux | grep gemini-notify
```

## Automated Test Suite

Create `scripts/telegram/integrations/test-gemini-wrapper.sh`:

```bash
#!/bin/bash
# Automated test suite for gemini-notify-p3.sh

set -e

echo "Running automated tests for Gemini notification wrapper..."

# Test 1: Success case
echo "Test 1: Success case"
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Automated test - success" \
  "echo 'Success test'"

sleep 2

# Test 2: Failure case
echo "Test 2: Failure case"
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Automated test - failure" \
  "exit 1" || true

sleep 2

# Test 3: Long output
echo "Test 3: Long output"
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Automated test - long output" \
  "for i in {1..100}; do echo 'Line \$i'; done"

sleep 2

echo "All tests completed!"
```

Make executable and run:
```bash
chmod +x scripts/telegram/integrations/test-gemini-wrapper.sh
./scripts/telegram/integrations/test-gemini-wrapper.sh
```

## Success Criteria

Your implementation passes if:

✅ All 8 manual tests pass
✅ Notifications received in Telegram within 2 seconds
✅ Duration calculation accurate
✅ Output truncation works (500 chars in Telegram, full in console)
✅ Silent mode works (no notifications when disabled)
✅ Error handling works (failed commands don't crash wrapper)
✅ No temp files left behind after execution
✅ Exit codes preserved from original commands

## Next Steps

After successful testing:
1. Document test results in this file
2. Create real-world usage examples
3. Integrate into P3 development workflows
4. Train team on usage patterns
5. Set up monitoring for notification delivery

## See Also

- [Usage Examples](EXAMPLES_GEMINI.md) - Real-world usage patterns
- [Telegram Controller Setup](../../telegram/SETUP.md) - Initial configuration
- [Core Notification Script](../core/notify.sh) - Underlying notification logic
