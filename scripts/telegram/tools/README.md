# Telegram System Monitoring & Maintenance Tools

This directory contains utility scripts for monitoring and maintaining the Telegram notification system.

## 📊 Scripts Overview

### 1. monitor.sh (192 lines)
**Purpose**: Display comprehensive system status

**Usage**:
```bash
./monitor.sh [--no-color]
```

**Features**:
- ✅ Notification toggle status (ENABLED/DISABLED)
- ✅ Webhook registration status with URL and errors
- ✅ Pending approvals count and list
- ✅ Recent messages from .inbox/ and .telegram_messages/
- ✅ State directory health check
- ✅ Overall system health assessment
- ✅ Color-coded output (green/red/yellow indicators)

**Example Output**:
```
📊 Telegram System Status
════════════════════════════════════════════

Notification Status
════════════════════════════════════════════
✅ ENABLED

Webhook Status
════════════════════════════════════════════
✅ Registered
  URL: https://your-server.com/telegram/webhook

Pending Approvals
════════════════════════════════════════════
⚠️  2 request(s) waiting
  Recent pending:
  - approval_A1430.txt (modified: 2025-11-01 07:31)
  - approval_B2341.txt (modified: 2025-11-01 07:29)

Recent Activity
════════════════════════════════════════════
  .inbox/: 5 message(s)
  [2025-11-01 07:31] reply_A1430.txt
  [2025-11-01 07:29] reply_B2341.txt
  ...

State Directories
════════════════════════════════════════════
✅ .pending → 2 file(s)
✅ .inbox → 5 file(s)
✅ .telegram_messages → 15 file(s)

Health Check
════════════════════════════════════════════
✅ All systems operational
```

**Dependencies**:
- TELEGRAM_BOT_TOKEN environment variable
- jq (for JSON parsing)
- curl (for API queries)

---

### 2. cleanup.sh (128 lines)
**Purpose**: Remove old state files to prevent disk bloat

**Usage**:
```bash
./cleanup.sh [--dry-run]
```

**Behavior**:
- Removes message files older than 24 hours from `.telegram_messages/`
- Removes reply files older than 1 hour from `.inbox/`
- **Keeps all files** in `.pending/` (active approvals)
- Logs all actions to `/tmp/telegram_cleanup.log`

**Options**:
- `--dry-run` - Show what would be deleted without actually deleting

**Example Output**:
```
🔍 DRY RUN MODE - No files will be deleted

[2025-11-01 09:10:31] ═══════════════════════════════════════
[2025-11-01 09:10:31] Cleanup started (dry-run: true)
[2025-11-01 09:10:31] Checking .telegram_messages/ for files older than 24 hours...
[2025-11-01 09:10:31]   [DRY RUN] Would remove: .telegram_messages/msg_1234.txt
[2025-11-01 09:10:31]   [DRY RUN] Would remove: .telegram_messages/msg_1235.txt
[2025-11-01 09:10:31]   Total from .telegram_messages/: 2 file(s)
[2025-11-01 09:10:31] Checking .inbox/ for files older than 1 hour...
[2025-11-01 09:10:31]   No old replies found in .inbox/
[2025-11-01 09:10:31] Keeping all 2 file(s) in .pending/ (active approvals)
[2025-11-01 09:10:31] ─────────────────────────────────────────
[2025-11-01 09:10:31] Cleanup complete
[2025-11-01 09:10:31]   .telegram_messages/: 2 file(s)
[2025-11-01 09:10:31]   .inbox/: 0 file(s)

📊 Cleanup Summary
════════════════════════════════════════════
  .telegram_messages/: 2 file(s) removed
  .inbox/: 0 file(s) removed
  .pending/: kept (active approvals)

  ℹ️  This was a dry run - no files were actually deleted
  Run without --dry-run to perform cleanup

  Log file: /tmp/telegram_cleanup.log
```

**Cron Integration**:
Run cleanup hourly to keep directories clean:
```bash
# Add to crontab (crontab -e)
0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh
```

**Safety**:
- Always test with `--dry-run` first
- Does NOT touch `.pending/` (active approvals never deleted)
- Logs all actions for audit trail

---

### 3. webhook_info.sh (136 lines)
**Purpose**: Query and display Telegram webhook registration details

**Usage**:
```bash
./webhook_info.sh
```

**Features**:
- Queries Telegram API `getWebhookInfo` endpoint
- Displays webhook URL, pending updates, last error
- Shows full JSON response for debugging
- Exit codes: 0 (success), 1 (not registered/error), 2 (missing dependencies)

**Example Output**:
```
📡 Webhook Registration Status
════════════════════════════════════════════

✅ Webhook registered

URL: https://your-server.com/telegram/webhook

Details:
  Custom certificate: false
  Max connections: 40
  Allowed updates: all

✅ No pending updates

───────────────────────────────────────────
Full webhook info (JSON):

{
  "url": "https://your-server.com/telegram/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  "max_connections": 40
}
```

**Error Handling**:
- Checks for TELEGRAM_BOT_TOKEN
- Validates jq and curl are installed
- Displays last error if webhook has issues

**Dependencies**:
- TELEGRAM_BOT_TOKEN environment variable
- jq (for JSON parsing)
- curl (for API queries)

---

## 🔧 Setup & Testing

### 1. Initial Setup
```bash
# Make scripts executable (already done)
chmod +x scripts/telegram/tools/*.sh

# Load environment variables
source scripts/telegram/.env

# Initialize state directories (if needed)
./scripts/telegram/core/notifyctl setup
```

### 2. Test Scripts
```bash
# Check system status
./scripts/telegram/tools/monitor.sh

# Test cleanup (dry-run first!)
./scripts/telegram/tools/cleanup.sh --dry-run

# Check webhook info
./scripts/telegram/tools/webhook_info.sh
```

### 3. Regular Monitoring
```bash
# Daily health check (add to morning routine)
./scripts/telegram/tools/monitor.sh

# Weekly cleanup check
./scripts/telegram/tools/cleanup.sh --dry-run
```

---

## 📅 Recommended Maintenance Schedule

### Hourly (Automated via Cron)
```bash
0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh
```

### Daily (Manual Check)
```bash
# Morning status check
./scripts/telegram/tools/monitor.sh
```

### Weekly (Manual Audit)
```bash
# Check webhook health
./scripts/telegram/tools/webhook_info.sh

# Review cleanup logs
tail -100 /tmp/telegram_cleanup.log
```

### Monthly (Deep Audit)
```bash
# Full system audit
./scripts/telegram/tools/monitor.sh > /tmp/monthly_audit_$(date +%Y%m).txt

# Review state directory sizes
du -sh .pending .inbox .telegram_messages
```

---

## 🚨 Troubleshooting

### monitor.sh Issues

**Problem**: "TELEGRAM_BOT_TOKEN not set"
```bash
# Solution: Load environment
source scripts/telegram/.env
# Or export manually
export TELEGRAM_BOT_TOKEN='your_token'
```

**Problem**: "jq not installed"
```bash
# Solution: Install jq
sudo apt-get update && sudo apt-get install -y jq
```

**Problem**: Webhook shows errors
```bash
# Check webhook details
./scripts/telegram/tools/webhook_info.sh

# Re-register webhook
./scripts/telegram/core/notifyctl webhook
```

### cleanup.sh Issues

**Problem**: Script removes files unexpectedly
```bash
# Always test with dry-run first!
./scripts/telegram/tools/cleanup.sh --dry-run
```

**Problem**: Need to recover deleted files
```bash
# Files are permanently deleted - no recovery
# Prevention: Always test with --dry-run first
# Check /tmp/telegram_cleanup.log for deleted file list
```

### webhook_info.sh Issues

**Problem**: "Webhook NOT registered"
```bash
# Register webhook
./scripts/telegram/core/notifyctl webhook
```

**Problem**: Shows "last_error_message"
```bash
# Check server logs
tail -50 scripts/telegram/server/server.log

# Verify server is running
ps aux | grep telegram-webhook

# Re-register webhook
./scripts/telegram/core/notifyctl webhook
```

---

## 🔗 Related Documentation

- **Core Scripts**: `../core/README.md` (notifyctl, notify.sh, await_reply.sh)
- **Webhook Server**: `../server/README.md` (Node.js Express server)
- **Quick Start Guide**: `../QUICK_START.md`
- **Implementation Details**: `../IMPLEMENTATION.md`

---

## 📝 Script Details

### File Locations
```
scripts/telegram/tools/
├── monitor.sh          # System status monitoring (192 lines)
├── cleanup.sh          # Old file cleanup (128 lines)
├── webhook_info.sh     # Webhook details query (136 lines)
├── webhook_register.sh # Webhook registration (150 lines)
└── README.md           # This file
```

### State Directories
```
workspace root/
├── .notify.enabled     # Toggle file (exists = enabled)
├── .pending/           # Approval requests (kept forever)
├── .inbox/             # User replies (cleaned after 1 hour)
└── .telegram_messages/ # Message history (cleaned after 24 hours)
```

### Log Files
- `/tmp/telegram_cleanup.log` - Cleanup operations
- `scripts/telegram/server/server.log` - Webhook server
- `scripts/telegram/.logs/` - Notification system logs

---

## 🎯 Quick Reference

```bash
# Check system status
./scripts/telegram/tools/monitor.sh

# Clean old files (safe)
./scripts/telegram/tools/cleanup.sh --dry-run

# Check webhook registration
./scripts/telegram/tools/webhook_info.sh

# Enable notifications
./scripts/telegram/core/notifyctl on

# Disable notifications
./scripts/telegram/core/notifyctl off

# Send test notification
./scripts/telegram/core/notify.sh "Test message"

# Check pending approvals
ls -lt .pending/

# View recent messages
ls -lt .inbox/
```

---

**Last Updated**: 2025-11-01
**Phase**: B - Monitoring & Maintenance Tools Complete
