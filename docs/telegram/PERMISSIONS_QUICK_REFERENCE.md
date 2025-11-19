# Telegram Notifications - Quick Reference Card

**Version**: 1.0 | **Last Updated**: 2025-11-06

---

## 🚀 Quick Commands

```bash
# Enable/disable notifications
./scripts/telegram/core/notifyctl {on|off|status}

# Send notification
./scripts/telegram/core/notify.sh "Your message"

# Health check
~/.claude/check-health.sh

# Restore after restart
~/.claude/restore-config.sh
```

---

## 📁 Key Files

| File | Location | Purpose |
|------|----------|---------|
| **Settings** | `.claude/settings.json` | Claude Code permissions |
| **Hook** | `.claude/bash-approval-notifier-v2.sh` | Notification logic |
| **Telegram** | `scripts/telegram/core/notify.sh` | Send messages |
| **Credentials** | `scripts/telegram/.env` | Bot token + Chat ID |

**Ephemeral** (lost on restart): `/home/runner/.claude/*`
**Persistent** (survives restart): `/home/runner/workspace/.claude/*`

---

## 🔧 Add Pre-Approved Command

### 1. Edit Notification Hook

```bash
nano ~/workspace/.claude/bash-approval-notifier-v2.sh
```

Add to `PRE_APPROVED_PATTERNS` array:
```bash
PRE_APPROVED_PATTERNS=(
    # ... existing ...
    "your new command"
)
```

### 2. Edit Claude Code Settings

```bash
nano ~/workspace/.claude/settings.json
```

Add to `permissions.allow` array:
```json
{
  "permissions": {
    "allow": [
      "Bash(your-command:*)"
    ]
  }
}
```

### 3. Apply Changes

```bash
cp ~/workspace/.claude/bash-approval-notifier-v2.sh ~/.claude/
cp ~/workspace/.claude/settings.json ~/.claude/
```

---

## 📝 Pattern Examples

### Claude Code Settings Format

```json
"Bash(command:*)"          // command with any args
"Bash(prefix-:*)"          // prefix-* subcommands
"Bash(aws s3 ls:*)"        // specific command
```

### Notification Hook Format

```bash
"command "                 // prefix match (note trailing space)
"aws s3 ls"               // exact prefix
"aws elasticbeanstalk describe-"  // subcommand prefix
```

---

## 🎯 Common Patterns

### AWS Commands

| Claude Code | Notification Hook |
|-------------|-------------------|
| `Bash(aws elasticbeanstalk describe-:*)` | `"aws elasticbeanstalk describe-"` |
| `Bash(aws s3 ls:*)` | `"aws s3 ls"` |
| `Bash(aws logs tail:*)` | `"aws logs tail"` |

### GitHub CLI

| Claude Code | Notification Hook |
|-------------|-------------------|
| `Bash(gh run list:*)` | `"gh run list"` |
| `Bash(gh pr view:*)` | `"gh pr view"` |

### Scripts

| Claude Code | Notification Hook |
|-------------|-------------------|
| `Bash(./path/script.sh:*)` | `"./path/script.sh"` |
| `Bash(npx tsx:*)` | `"npx tsx"` |

---

## 🔍 Troubleshooting

### Still Getting Prompts?

```bash
# 1. Check Claude Code settings
cat ~/.claude/settings.json | jq '.permissions.allow' | grep "aws"

# 2. Check notification hook
grep "aws elasticbeanstalk" ~/.claude/bash-approval-notifier-v2.sh

# 3. Verify both match backup
diff ~/.claude/settings.json ~/workspace/.claude/settings.json
diff ~/.claude/bash-approval-notifier-v2.sh ~/workspace/.claude/bash-approval-notifier-v2.sh

# 4. If different, restore
cp ~/workspace/.claude/* ~/.claude/
```

### Notifications Not Working?

```bash
# Check enabled
./scripts/telegram/core/notifyctl status

# Test notification
./scripts/telegram/core/notify.sh "Test"

# Check credentials
cat scripts/telegram/.env | grep -E "BOT_TOKEN|CHAT_ID"
```

### After Container Restart?

```bash
# Quick restore
~/workspace/.claude/restore-config.sh

# Verify
~/workspace/.claude/check-health.sh
```

---

## 📊 Current Pre-Approved Commands

### Development
```
npm run test*, npm run build*, npm run check*
npx tsx*, node *, python3 *
```

### Git (Read-Only)
```
git status*, git diff*, git log*
```

### File Operations
```
cat *, grep *, tail *, head *, ls *, echo *, chmod *, curl *
```

### AWS (Read-Only)
```
aws elasticbeanstalk describe-*
aws elasticbeanstalk list-*
aws rds describe-*
aws logs tail
aws s3 ls
```

### AWS (Write - Auto-Approved)
```
aws elasticbeanstalk update-environment
aws elasticbeanstalk create-application-version
aws s3 cp, aws s3 sync
```

### GitHub CLI
```
gh run list, gh run view
gh pr list, gh pr view
gh workflow list
gh api
```

---

## 🔐 Security Levels

| Level | Commands | Action |
|-------|----------|--------|
| 🟢 **Auto-Approved** | Read-only (describe, list, get) | Silent execution |
| 🟡 **Approved Write** | Reversible writes (version, upload) | Silent execution |
| 🔴 **Require Approval** | Destructive (delete, modify, create env) | Manual approval |

---

## 🚨 Quick Fixes

### Fix Permissions
```bash
find .claude -name "*.sh" -exec chmod +x {} \;
find scripts/telegram -name "*.sh" -exec chmod +x {} \;
```

### Reset Configuration
```bash
cp ~/workspace/.claude/settings.json ~/.claude/
cp ~/workspace/.claude/bash-approval-notifier-v2.sh ~/.claude/
```

### Test Setup
```bash
# Should NOT send notification (pre-approved)
git status

# Should send notification (not pre-approved)
echo "test" > /tmp/test.txt
```

---

## 📖 Full Documentation

- **Setup**: `docs/telegram/SETUP_GUIDE.md`
- **Architecture**: `docs/telegram/PERMISSIONS_AND_NOTIFICATIONS.md`
- **Export**: `docs/telegram/EXPORT_GUIDE.md`
- **Troubleshooting**: `docs/telegram/TROUBLESHOOTING.md`

---

## 💾 Backup Before Changes

```bash
# Backup current config
cp ~/.claude/settings.json ~/.claude/settings.json.backup-$(date +%Y%m%d)
cp ~/.claude/bash-approval-notifier-v2.sh ~/.claude/bash-approval-notifier-v2.sh.backup-$(date +%Y%m%d)
```

---

**Print this page** | **Bookmark** | **Share with team**

P3 Interview Academy | v1.0 | 2025-11-06
