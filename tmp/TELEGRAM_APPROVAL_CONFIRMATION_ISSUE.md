# Telegram Approval Confirmation - Pending Issue

**Date**: 2025-11-05
**Status**: 🟡 Deferred to future session
**Priority**: Low (nice-to-have UX improvement)

## Current State

### ✅ What Works
- **Approval REQUEST notifications**: Working perfectly
  - Format: `⚠️ *APPROVAL NEEDED* • command • time`
  - Sends immediately when bash commands need approval
  - User receives notification and can approve in Claude Code

### ❌ What Doesn't Work
- **Approval CONFIRMATION notifications**: Not working
  - Expected format: `✅ *APPROVED* • command • time`
  - Should send 5 seconds after user approves
  - Background job with `setsid` is implemented but not executing

## Root Cause

**Claude Code Hook Caching**: Claude Code loads PreToolUse hooks once at session startup and doesn't reload them during the session. Updated hook scripts are not picked up until Claude Code restarts.

**Evidence**:
- Hook script contains correct code with `setsid` and background jobs
- Manual tests of the same code work perfectly outside the hook
- No `[CONFIRMATION]` logs appear in `/tmp/approval-hook.log` during real approvals
- Updated code is in the file but not being executed

## Implementation Details

### Files Created
1. **`~/.claude/bash-approval-notifier-v2.sh`** - Main hook script
   - Sends approval request notification immediately
   - Spawns background job with `setsid` for confirmation
   - Location: `/home/runner/workspace/.claude/bash-approval-notifier-v2.sh` (persistent)

2. **`~/.claude/send-approval-confirmation.sh`** - Confirmation sender script
   - Simple script called by background job
   - Waits 5 seconds, reads message file, sends to Telegram
   - Location: `/home/runner/workspace/.claude/send-approval-confirmation.sh` (persistent)

3. **`~/.claude/settings.json`** - Hook configuration
   - PreToolUse hook configured to call bash-approval-notifier-v2.sh
   - Timeout: 2 seconds (sufficient for request notification)

### Technical Approach
```bash
# In hook script:
MSG_FILE="/tmp/approval-msg-$$.txt"
echo "✅ *APPROVED* • \`${SHORT_CMD}\` • $(date '+%H:%M')" > "$MSG_FILE"
setsid /home/runner/workspace/.claude/send-approval-confirmation.sh "$MSG_FILE" &>/dev/null &
```

**Why setsid?**
- Creates new session with init (PID 1) as parent
- Prevents termination when hook times out at 2 seconds
- Background job survives and continues independently

## Testing Results

### Manual Tests (Outside Hook) ✅
- Background jobs with `setsid` work perfectly
- Telegram notifications send successfully
- Message formatting displays correctly
- 5-second delay works as expected

### Hook Tests (Inside PreToolUse) ❌
- Background jobs don't execute
- No confirmation logs in `/tmp/approval-hook.log`
- Hook caching prevents updated code from running

## Solution for Next Session

**Requires**: Claude Code restart to reload hooks

**Steps**:
1. Verify hook files exist and are executable:
   ```bash
   ls -la ~/.claude/bash-approval-notifier-v2.sh
   ls -la ~/.claude/send-approval-confirmation.sh
   ```

2. Test with any non-pre-approved command:
   ```bash
   aws s3 ls
   ```

3. Expected behavior:
   - Immediate: ⚠️ *APPROVAL NEEDED* • `aws s3 ls` • [time]
   - After 5s: ✅ *APPROVED* • `aws s3 ls` • [time]

4. If not working, check logs:
   ```bash
   tail -20 /tmp/approval-hook.log | grep -E "\[APPROVAL HOOK\]|\[CONFIRMATION\]"
   ```

## Alternative Approaches (If Issue Persists)

### Option A: Queue-Based System
- Hook writes to queue file (instant, no background job)
- Separate poller process monitors queue and sends confirmations
- **Pros**: 100% reliable, no caching issues
- **Cons**: Requires persistent background process

### Option B: PostToolUse Hook
- Use PostToolUse hook instead of background job
- **Issue**: Claude Code might not support PostToolUse (untested)
- **Status**: Previously attempted, no logs appeared

### Option C: Accept Current State
- Approval requests work perfectly (most important)
- User knows when approval is needed
- Confirmation is nice-to-have, not critical
- **Recommended**: Use this until hook reload is confirmed

## Impact Assessment

**User Experience**:
- **Current**: User receives approval request, approves in Claude Code UI, sees no confirmation
- **Desired**: User receives approval request AND confirmation after approval
- **Impact**: Low - user already sees approval happen in Claude Code UI

**Priority**: Low (cosmetic UX improvement)

## Next Steps

1. ✅ Document issue (this file)
2. ✅ Continue with Phase 6 testing
3. ⏳ Future session: Restart Claude Code and verify confirmations work
4. ⏳ If still not working: Implement queue-based system

## Related Files

- `/home/runner/workspace/.claude/bash-approval-notifier-v2.sh` (persistent)
- `/home/runner/workspace/.claude/send-approval-confirmation.sh` (persistent)
- `/home/runner/workspace/.claude/settings.json` (persistent backup)
- `~/.claude/settings.json` (ephemeral, lost on Replit restart)
- `/tmp/approval-hook.log` (debug logs)

## Contact

Ask for **@agent-gemini-research-specialist** if deep debugging is needed - they provided the original setsid solution.
