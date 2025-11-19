# Telegram Notifications & Permissions Architecture

**Last Updated**: 2025-11-06
**Status**: ✅ Production Ready

---

## Overview

The P3 Interview Academy project uses a **dual-layer permission system** for bash commands:

1. **Claude Code Permissions** - Controls whether commands CAN execute
2. **Telegram Notification Hook** - Controls whether to send notifications about command execution

Both layers must be configured for optimal operation.

---

## Architecture Diagram

```
User/Agent runs command
         │
         ▼
┌─────────────────────────────────────┐
│ Claude Code Permission Check        │
│ File: .claude/settings.json         │
│                                     │
│ ✓ Is command in "allow" list?      │
│ ✓ Is command in "ask" list?        │
│ ✓ Default: ask for approval         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ PreToolUse Hook Execution           │
│ File: bash-approval-notifier-v2.sh  │
│                                     │
│ ✓ Is command in PRE_APPROVED list? │
│   ├─ YES: Silent execution          │
│   └─ NO: Send Telegram notification │
└─────────────────────────────────────┘
         │
         ▼
    Command Executes
         │
         ▼
┌─────────────────────────────────────┐
│ PostToolUse Hook (Optional)         │
│ Sends confirmation to Telegram      │
└─────────────────────────────────────┘
```

---

## Configuration Files

### 1. Claude Code Permissions (`.claude/settings.json`)

**Location**:
- Active: `/home/runner/.claude/settings.json` (ephemeral)
- Backup: `/home/runner/workspace/.claude/settings.json` (persistent)

**Purpose**: Controls whether commands are allowed to execute

**Format**:
```json
{
  "permissions": {
    "allow": [
      "Bash(command:*)",
      "Bash(prefix-:*)"
    ],
    "ask": [
      "Bash(dangerous-command:*)"
    ]
  }
}
```

**Key Rules**:
- Colon (`:`) separates command from arguments
- Asterisk (`*`) matches any arguments
- Prefix matching: `"Bash(aws elasticbeanstalk describe-:*)"` matches all `describe-*` subcommands
- Full matching: `"Bash(aws s3 ls:*)"` matches only `s3 ls` with any arguments

**Example Patterns**:
```json
"Bash(aws elasticbeanstalk describe-:*)"     // Matches: describe-environments, describe-applications, etc.
"Bash(aws s3 ls:*)"                          // Matches: s3 ls with any path/flags
"Bash(gh run list:*)"                        // Matches: gh run list with any flags
```

---

### 2. Telegram Notification Hook (`bash-approval-notifier-v2.sh`)

**Location**:
- Active: `/home/runner/.claude/bash-approval-notifier-v2.sh` (ephemeral)
- Backup: `/home/runner/workspace/.claude/bash-approval-notifier-v2.sh` (persistent)

**Purpose**: Controls whether to send Telegram notifications about command execution

**Format**:
```bash
PRE_APPROVED_PATTERNS=(
    "command prefix"
    "aws elasticbeanstalk describe-"
    "gh run list"
)
```

**Key Rules**:
- Simple bash string prefix matching (NOT regex)
- Pattern `"aws s3 cp"` matches `"aws s3 cp s3://bucket/file /local/path"`
- Trailing space matters: `"cat "` matches `cat file` but NOT `catch`
- No asterisks needed - bash does prefix matching automatically

---

## Current Pre-Approved Commands

### Development Commands
```bash
"npm run test"
"npm run build"
"npm run check"
"npx tsx"
```

### Git Commands (Read-Only)
```bash
"git status"
"git diff"
"git log"
```

### File Operations
```bash
"cat "
"grep "
"tail "
"head "
"ls "
"echo "
"chmod "
"curl "
"python3 "
```

### Telegram Scripts
```bash
"./scripts/telegram/core/notify.sh"
"./scripts/telegram/core/notifyctl"
```

### Deployment Scripts
```bash
"./deployment-scripts/check-environment-status.sh"
"./deployment-scripts/smoke-tests.ts"
"node ./deployment-scripts/smoke-tests.ts"
```

### AWS CLI (Read-Only)
```bash
"aws elasticbeanstalk describe-"      # All describe-* subcommands
"aws elasticbeanstalk list-"          # All list-* subcommands
"aws rds describe-"
"aws elb describe-"
"aws elbv2 describe-"
"aws ec2 describe-"
"aws acm describe-"
"aws acm list-"
"aws acm wait"
"aws cloudwatch get-"
"aws cloudformation describe-"
"aws cloudformation list-"
"aws cloudformation get-"
"aws logs describe-"
"aws logs tail"
"aws s3 ls"
```

### AWS CLI (Write Operations - Auto-Approved)
```bash
"aws elasticbeanstalk update-environment"
"aws elasticbeanstalk create-application-version"
"aws elasticbeanstalk update-application-version"
"aws s3 cp"
"aws s3 sync"
```

### GitHub CLI
```bash
"gh run list"
"gh run view"
"gh workflow list"
"gh pr list"
"gh pr view"
"gh repo view"
"gh api"
```

---

## How to Add New Pre-Approved Commands

### Step 1: Edit the Backup File

```bash
nano /home/runner/workspace/.claude/bash-approval-notifier-v2.sh
```

Find the `PRE_APPROVED_PATTERNS` array (around line 26) and add your command:

```bash
PRE_APPROVED_PATTERNS=(
    # ... existing patterns ...
    "your new command"
)
```

### Step 2: Copy to Active Location

```bash
cp /home/runner/workspace/.claude/bash-approval-notifier-v2.sh \
   /home/runner/.claude/bash-approval-notifier-v2.sh
```

### Step 3: Test

```bash
# Run your command - should execute without Telegram notification
your new command --with-args
```

---

## How to Add Commands to Claude Code Permissions

### Step 1: Edit Settings

```bash
nano /home/runner/workspace/.claude/settings.json
```

Add to the `allow` array:

```json
{
  "permissions": {
    "allow": [
      "Bash(your-command:*)",
      "Bash(prefix-:*)"
    ]
  }
}
```

### Step 2: Copy to Active Location

```bash
cp /home/runner/workspace/.claude/settings.json \
   /home/runner/.claude/settings.json
```

### Step 3: Verify

```bash
cat /home/runner/.claude/settings.json | jq '.permissions.allow' | grep "your-command"
```

---

## Common Patterns

### AWS CLI Commands

| Operation | Claude Code Pattern | Notification Hook Pattern |
|-----------|-------------------|-------------------------|
| Describe all | `Bash(aws service describe-:*)` | `"aws service describe-"` |
| List all | `Bash(aws service list-:*)` | `"aws service list-"` |
| Specific command | `Bash(aws s3 ls:*)` | `"aws s3 ls"` |
| All subcommands | `Bash(aws service:*)` | `"aws service"` |

### GitHub CLI Commands

| Operation | Claude Code Pattern | Notification Hook Pattern |
|-----------|-------------------|-------------------------|
| Run commands | `Bash(gh run:*)` | `"gh run"` |
| Specific | `Bash(gh run list:*)` | `"gh run list"` |
| All gh | `Bash(gh:*)` | `"gh "` |

### Script Patterns

| Operation | Claude Code Pattern | Notification Hook Pattern |
|-----------|-------------------|-------------------------|
| Specific script | `Bash(./path/script.sh:*)` | `"./path/script.sh"` |
| All in dir | `Bash(./path/:*)` | `"./path/"` |
| Node scripts | `Bash(node ./path/:*)` | `"node ./path/"` |

---

## Troubleshooting

### Commands Still Prompting for Approval

**Symptom**: AWS/GH commands still asking for approval or sending Telegram notifications

**Diagnosis**:
1. Check if command is in Claude Code allow list
2. Check if command is in Telegram notification hook PRE_APPROVED list
3. Verify active files match backup files

**Fix**:
```bash
# Check active settings
cat /home/runner/.claude/settings.json | jq '.permissions.allow' | grep "aws"

# Check notification hook
grep "aws elasticbeanstalk" /home/runner/.claude/bash-approval-notifier-v2.sh

# If missing, copy from backup
cp /home/runner/workspace/.claude/settings.json /home/runner/.claude/
cp /home/runner/workspace/.claude/bash-approval-notifier-v2.sh /home/runner/.claude/
```

---

### Notification Hook Not Working

**Symptom**: No Telegram notifications at all

**Diagnosis**:
```bash
# Check if notifications are enabled
./scripts/telegram/core/notifyctl status

# Check if hook is configured
cat /home/runner/.claude/settings.json | jq '.hooks'

# Check if notification file exists
ls -la /home/runner/workspace/.notify.enabled
```

**Fix**:
```bash
# Enable notifications
./scripts/telegram/core/notifyctl on

# Verify hook is in settings.json
cat /home/runner/.claude/settings.json | jq '.hooks.PreToolUse'
```

---

### After Container Restart (Replit)

**Symptom**: Configurations lost after Replit restart

**Fix**:
```bash
# Run restore script (handles both settings and notification hook)
~/workspace/.claude/restore-config.sh

# Verify
~/workspace/.claude/check-health.sh
```

---

## Security Considerations

### What to Auto-Approve

✅ **Safe to auto-approve**:
- Read-only operations (`describe`, `list`, `get`)
- File reads (`cat`, `grep`, `tail`)
- Git status checks
- Build/test commands
- Smoke tests

⚠️ **Require approval** (keep in "ask" list):
- Write operations to production (`create`, `delete`, `modify`)
- Git commits/pushes
- Database migrations
- Destructive operations

🔒 **Never auto-approve**:
- Environment deletion
- RDS modifications
- Security group changes
- Production deployments

### Principle of Least Privilege

The current configuration follows security best practices:

1. **Read-only AWS commands** → Auto-approved
2. **Deployment version creation** → Auto-approved (reversible)
3. **Environment updates** → Auto-approved (with smoke tests)
4. **Resource deletion** → Always require approval
5. **Infrastructure changes** → Always require approval

---

## Testing Your Configuration

### Test Script

```bash
#!/bin/bash
# Test pre-approved commands

echo "Testing AWS commands..."
aws elasticbeanstalk describe-environments --environment-names p3-interview-academy-prod-v2 --query 'Environments[0].Health' --output text

echo "Testing GitHub CLI..."
gh run list --limit 1

echo "Testing S3..."
aws s3 ls

echo "✅ All commands should execute without prompts or Telegram notifications"
```

Save as `test-permissions.sh` and run:
```bash
chmod +x test-permissions.sh
./test-permissions.sh
```

**Expected Result**: All commands execute silently without:
- Claude Code approval prompts
- Telegram notifications

---

## Integration with Agents

When using Claude Code agents (like `opencode-deploy-expert`), the same permission system applies:

1. Agent runs command → Claude Code checks permissions
2. If allowed → PreToolUse hook checks notification list
3. If pre-approved → Silent execution
4. If not pre-approved → Telegram notification sent

**Key Point**: Both `.claude/settings.json` AND `bash-approval-notifier-v2.sh` must have the command configured.

---

## Export/Sharing Guide

See [EXPORT_GUIDE.md](./EXPORT_GUIDE.md) for complete instructions on:
- Exporting configuration to other projects
- Team setup and onboarding
- Multi-environment configuration
- CI/CD integration

---

## Quick Reference

### Files to Configure
1. `/home/runner/workspace/.claude/settings.json` (permissions)
2. `/home/runner/workspace/.claude/bash-approval-notifier-v2.sh` (notifications)

### After Changes
```bash
# Copy to active location
cp /home/runner/workspace/.claude/settings.json /home/runner/.claude/
cp /home/runner/workspace/.claude/bash-approval-notifier-v2.sh /home/runner/.claude/
```

### Verify Configuration
```bash
~/workspace/.claude/check-health.sh
```

### Test Command
```bash
aws elasticbeanstalk describe-environments --environment-names prod --query 'Environments[0].Health'
# Should execute without prompts
```

---

## Related Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Initial Telegram bot setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture details
- [COMMAND_GUIDE.md](./COMMAND_GUIDE.md) - User command reference
- [EXPORT_GUIDE.md](./EXPORT_GUIDE.md) - Export and sharing guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

---

**Version**: 2.0
**Maintainer**: P3 Interview Academy Team
**Last Review**: 2025-11-06
