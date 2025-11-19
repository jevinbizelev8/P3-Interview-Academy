# Telegram Notification Format Improvements

**Date**: 2025-11-06
**Version**: 2.1

---

## 🐛 Critical Bug Fix (Version 2.1)

**Date**: 2025-11-06 02:15 UTC

### The Bug
Approval confirmations were being sent **immediately** after approval requests, without waiting for actual user approval. This created false "APPROVED" notifications.

**Symptom**:
```
🔴 APPROVAL NEEDED  ← You see this
🟢 APPROVED         ← Sent immediately (wrong!)
```

**Root Cause**: PreToolUse hook was sending both the request AND the confirmation in sequence, without waiting for user action.

### The Fix

**Created Two-Hook System**:

1. **PreToolUse Hook** (`bash-approval-notifier-v2.sh`)
   - Sends 🔴 APPROVAL NEEDED
   - Waits for user approval
   - Does NOT send confirmation

2. **PostToolUse Hook** (`bash-post-execution-notifier.sh`) - NEW
   - Runs AFTER command executes
   - Sends 🟢 APPROVED & EXECUTED
   - Only sent for commands that were approved and ran

**Correct Flow Now**:
```
1. 🔴 APPROVAL NEEDED     (PreToolUse)
2. User approves in UI
3. Command executes
4. 🟢 APPROVED & EXECUTED (PostToolUse)
```

**Files Modified**:
- `.claude/bash-approval-notifier-v2.sh` - Removed automatic confirmation
- `.claude/bash-post-execution-notifier.sh` - New script for post-execution confirmation
- `.claude/settings.json` - Added PostToolUse hook

---

## Summary of Changes

The Telegram notification format has been improved based on user feedback to provide cleaner, more informative messages.

---

## Before vs After

### OLD Format ❌

**Approval Request:**
```
⚠️ APPROVAL NEEDED

`curl -sI https://p3app-staging.bizelev8.ai/api/hea...`

⏱ Waiting... • 22:51
```

**Approval Confirmation:**
```
2025-11-05 22:51:06 ✅ APPROVED • `curl -sI https://p3app-staging.bizelev8.ai/api/hea...` • 22:51
```

**Issues:**
- ❌ Redundant timestamps (Telegram already shows message time)
- ❌ Command truncated too early (50 chars)
- ❌ No description of what the command does
- ❌ Cluttered single-line format for confirmation

---

### NEW Format ✅

**Approval Request:**
```
⚠️ APPROVAL NEEDED

📋 Check staging health endpoint

`curl -sI https://p3app-staging.bizelev8.ai/api/health/simple`

⏱ Waiting for approval...
```

**Approval Confirmation:**
```
✅ APPROVED

📋 Check staging health endpoint

`curl -sI https://p3app-staging.bizelev8.ai/api/health/simple`
```

**Improvements:**
- ✅ No timestamps (rely on Telegram's built-in timestamps)
- ✅ Command shows up to 80 characters (vs 50 before)
- ✅ Description line explains what the command does
- ✅ Multi-line format for better readability
- ✅ Cleaner, more professional appearance

---

## How Descriptions Work

The description comes from the `description` parameter in Bash tool calls:

### In Your Code

```typescript
// Example: Agent calling Bash tool
await bash({
  command: "curl -sI https://p3app-staging.bizelev8.ai/api/health/simple",
  description: "Check staging health endpoint"  // ← This shows in Telegram
});
```

### In Notification

```
⚠️ APPROVAL NEEDED

📋 Check staging health endpoint  ← Description here

`curl -sI https://p3app-staging.bizelev8.ai/api/health/simple`

⏱ Waiting for approval...
```

### If No Description Provided

```
⚠️ APPROVAL NEEDED

🔧 Command requires approval  ← Default message

`some-command --with-args`

⏱ Waiting for approval...
```

---

## Format Specifications

### Approval Request Format

```
⚠️ *APPROVAL NEEDED*

[ICON] [Description or Default Message]

`[Command - up to 80 chars]`

⏱ Waiting for approval...
```

**Icons:**
- 📋 - Description provided
- 🔧 - No description (default)

### Approval Confirmation Format

**With Description:**
```
✅ *APPROVED*

📋 [Description]

`[Command]`
```

**Without Description:**
```
✅ *APPROVED*

`[Command]`
```

---

## Examples

### Example 1: AWS Deployment

**Request:**
```
⚠️ APPROVAL NEEDED

📋 Deploy version v2.1.0 to production

`aws elasticbeanstalk update-environment --environment-name prod --version-label v2.1.0`

⏱ Waiting for approval...
```

**Confirmation:**
```
✅ APPROVED

📋 Deploy version v2.1.0 to production

`aws elasticbeanstalk update-environment --environment-name prod --version-label v2.1.0`
```

---

### Example 2: Database Migration

**Request:**
```
⚠️ APPROVAL NEEDED

📋 Run migration: add gamification tables

`npx drizzle-kit push:pg --config=drizzle.config.ts`

⏱ Waiting for approval...
```

**Confirmation:**
```
✅ APPROVED

📋 Run migration: add gamification tables

`npx drizzle-kit push:pg --config=drizzle.config.ts`
```

---

### Example 3: Git Push

**Request:**
```
⚠️ APPROVAL NEEDED

📋 Push feature branch to remote

`git push origin feature/new-dashboard --force`

⏱ Waiting for approval...
```

**Confirmation:**
```
✅ APPROVED

📋 Push feature branch to remote

`git push origin feature/new-dashboard --force`
```

---

### Example 4: No Description

**Request:**
```
⚠️ APPROVAL NEEDED

🔧 Command requires approval

`some-unknown-command --dangerous-flag`

⏱ Waiting for approval...
```

**Confirmation:**
```
✅ APPROVED

`some-unknown-command --dangerous-flag`
```

---

## Benefits

### 1. Cleaner Messages
- Removed redundant information (timestamps already in Telegram)
- Multi-line format improves readability
- Clear visual hierarchy

### 2. More Context
- Description explains WHY the command is running
- Helps users make informed approval decisions
- Easier to understand command purpose at a glance

### 3. Better Command Visibility
- 80 character limit (up from 50)
- Shows more of the command before truncation
- Most common commands fit without truncation

### 4. Professional Appearance
- Consistent emoji use (📋 for descriptions, 🔧 for system)
- Structured layout
- Easy to scan quickly

---

## Technical Details

### File Modified
- `/home/runner/workspace/.claude/bash-approval-notifier-v2.sh`
- Lines 91-135 (message formatting section)

### Changes Made
1. Increased command truncation limit: 50 → 80 characters
2. Added description extraction and formatting
3. Removed all timestamp references
4. Implemented multi-line format for confirmations
5. Added conditional description display

### Backward Compatibility
- ✅ Works with or without description field
- ✅ Falls back to default message if no description
- ✅ Compatible with existing notification system
- ✅ No changes required to existing code

---

## Best Practices for Descriptions

### Good Descriptions ✅

```bash
# Clear and specific
description: "Deploy v2.1.0 to production"
description: "Check staging health endpoint"
description: "Run database migration: add users table"
description: "Upload build artifacts to S3"
```

### Poor Descriptions ❌

```bash
# Too vague
description: "Run command"
description: "Do something"

# Too long (will be truncated)
description: "This is a really long description that explains every single detail about what this command does and why we're running it and what the expected outcome should be"

# Redundant with command
description: "aws s3 cp ./file s3://bucket"
```

### Description Guidelines

**Length**: 3-8 words ideal
**Style**: Start with action verb (Deploy, Check, Run, Upload, etc.)
**Context**: Include what/where (production, staging, table name, etc.)
**Version**: Include version numbers if relevant

---

## Testing the New Format

### Test 1: Command with Description

```bash
# This will trigger notification (not in pre-approved list)
some-unknown-command --test

# Expected Telegram message:
# ⚠️ APPROVAL NEEDED
# 🔧 Command requires approval
# `some-unknown-command --test`
# ⏱ Waiting for approval...
```

### Test 2: Command with Custom Description

In your agent code:
```typescript
await bash({
  command: "echo 'test deployment'",
  description: "Test notification format"
});
```

Expected message:
```
⚠️ APPROVAL NEEDED

📋 Test notification format

`echo 'test deployment'`

⏱ Waiting for approval...
```

---

## Migration Guide

### For Existing Code

**No changes required!** The new format:
- Works with existing Bash tool calls
- Extracts description automatically if provided
- Falls back gracefully if no description

### For New Code

**Recommended**: Always provide descriptions for better UX

```typescript
// Before (still works)
await bash({
  command: "curl https://api.example.com/health"
});

// After (recommended)
await bash({
  command: "curl https://api.example.com/health",
  description: "Check API health endpoint"  // ← Add this
});
```

---

## Rollback Instructions

If you need to revert to the old format:

```bash
# Restore from backup
cp /home/runner/workspace/.claude/bash-approval-notifier-v2.sh.backup-20251105-034233 \
   /home/runner/workspace/.claude/bash-approval-notifier-v2.sh

# Apply to active location
cp /home/runner/workspace/.claude/bash-approval-notifier-v2.sh \
   /home/runner/.claude/bash-approval-notifier-v2.sh
```

---

## Future Enhancements

### Potential Improvements

1. **Emoji Customization**: Allow custom emoji for different command types
2. **Priority Levels**: Different formatting for critical vs routine approvals
3. **Estimated Duration**: Show expected command execution time
4. **Risk Level**: Display risk indicator (low/medium/high)
5. **Action Buttons**: Inline Telegram buttons for approve/deny

### Example Future Format

```
⚠️ APPROVAL NEEDED

📋 Deploy v2.1.0 to production
⏱ Est. duration: 5 minutes
🔴 Risk: High (production deployment)

`aws elasticbeanstalk update-environment --environment-name prod --version-label v2.1.0`

[Approve] [Deny] [Details]
```

---

## Related Documentation

- [PERMISSIONS_AND_NOTIFICATIONS.md](./PERMISSIONS_AND_NOTIFICATIONS.md) - How notifications work
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Initial setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

## Changelog

### Version 2.1 (2025-11-06 02:15 UTC) - CRITICAL BUG FIX
- 🐛 **Fixed**: Premature approval confirmations
- ✅ Created two-hook system (PreToolUse + PostToolUse)
- ✅ Confirmations now sent only after actual execution
- ✅ Added `bash-post-execution-notifier.sh`

### Version 2.0 (2025-11-06)
- ✅ Removed redundant timestamps
- ✅ Added description field support
- ✅ Increased command display limit to 80 chars
- ✅ Implemented multi-line format
- ✅ Added fallback for missing descriptions
- ✅ Color-coded messages (🔴 request, 🟢 confirmation)

### Version 1.0 (2025-11-05)
- Initial implementation
- Single-line format with timestamps

---

**Version**: 2.1
**Last Updated**: 2025-11-06 02:15 UTC
**Status**: Production Ready
