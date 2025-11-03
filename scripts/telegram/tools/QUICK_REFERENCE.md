# Telegram Tools - Quick Reference Card

## 📊 System Monitoring

```bash
# Check system status (color output)
./scripts/telegram/tools/monitor.sh

# Check system status (plain output)
./scripts/telegram/tools/monitor.sh --no-color
```

**Shows**: Notifications ON/OFF, webhook status, pending approvals, recent activity, health check

---

## 🧹 File Cleanup

```bash
# Test cleanup (safe, shows what would be deleted)
./scripts/telegram/tools/cleanup.sh --dry-run

# Run actual cleanup
./scripts/telegram/tools/cleanup.sh
```

**Removes**:
- `.telegram_messages/` files > 24 hours old
- `.inbox/` files > 1 hour old
- Keeps all `.pending/` files (never deleted)

---

## 🔗 Webhook Diagnostics

```bash
# Check webhook registration
./scripts/telegram/tools/webhook_info.sh
```

**Shows**: URL, pending updates, errors, full JSON details

---

## 🧪 Testing

```bash
# Run all tool tests
./scripts/telegram/tools/test-all.sh
```

**Tests**: monitor.sh, cleanup.sh, webhook_info.sh

---

## ⏰ Cron Setup

```bash
# Edit crontab
crontab -e

# Add hourly cleanup (recommended)
0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh

# Verify cron job
crontab -l
```

---

## 📋 Common Commands

```bash
# Enable notifications
./scripts/telegram/core/notifyctl on

# Disable notifications
./scripts/telegram/core/notifyctl off

# Send test notification
./scripts/telegram/core/notify.sh "Test message"

# Check pending approvals
ls -lt .pending/

# View recent replies
ls -lt .inbox/

# View message history
ls -lt .telegram_messages/

# Check cleanup log
tail -50 /tmp/telegram_cleanup.log
```

---

## 🚨 Troubleshooting

```bash
# Check if bot token is set
echo $TELEGRAM_BOT_TOKEN

# Initialize system
./scripts/telegram/core/notifyctl setup

# Test all tools
./scripts/telegram/tools/test-all.sh

# Check dependencies
which jq curl python3

# View full system status
./scripts/telegram/tools/monitor.sh
```

---

## 📁 File Locations

```
workspace/
├── .notify.enabled         # Toggle file (exists = ON)
├── .pending/               # Approval requests (kept forever)
├── .inbox/                 # User replies (cleaned after 1h)
├── .telegram_messages/     # Message history (cleaned after 24h)
├── scripts/telegram/
│   ├── core/               # Core notification scripts
│   ├── tools/              # Monitoring & maintenance tools
│   └── server/             # Webhook server
└── docs/telegram/          # Documentation
```

---

## 🔧 Exit Codes

**monitor.sh**: 0 (always succeeds)
**cleanup.sh**: 0 (success)
**webhook_info.sh**:
- 0 = Webhook registered and working
- 1 = Webhook not registered or error
- 2 = Missing dependencies (jq, curl)

---

## 📚 Full Documentation

- **Tool Documentation**: `scripts/telegram/tools/README.md`
- **Cron Setup**: `scripts/telegram/tools/CRON_SETUP.md`
- **Core Scripts**: `scripts/telegram/QUICK_START.md`
- **Architecture**: `docs/telegram/ARCHITECTURE.md`
- **Troubleshooting**: `docs/telegram/TROUBLESHOOTING.md`

---

**Quick Start**: `./scripts/telegram/tools/test-all.sh`
