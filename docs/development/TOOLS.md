# Development Tools Guide

This document provides detailed information about the development tools available for the P3 Interview Academy project.

---

## Chrome DevTools MCP Integration

**Purpose**: Browser automation and testing

**Status**: ✅ Installed globally

**Location**: `C:\Users\User\.claude\chrome-mcp-tools\`

**Quick Start**:
1. Double-click `launch-chrome-debug.bat`
2. Restart Claude Code

**Capabilities**:
- Navigate URLs
- Take screenshots
- Inspect DOM
- Execute JavaScript
- Monitor network traffic

**Documentation**: See `C:\Users\User\.claude\chrome-mcp-tools\README.md`

---

## Stripe CLI

**Purpose**: Local payment testing and webhook forwarding

**Status**: ✅ Installed

**Common Commands**:
```bash
# Authenticate with Stripe account
stripe login

# Forward webhooks to local development server
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Trigger test webhook events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed

# View real-time API logs
stripe logs tail
```

**Capabilities**:
- Forward webhooks to local development server
- Trigger test webhook events
- View webhook logs and debugging information
- Test payment flows without deploying to staging

**Documentation**: Run `stripe --help` or see [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)

---

## Telegram Remote Control

**Purpose**: Remote approval and notifications for Claude Code agents

**Status**: ✅ **PRODUCTION** - Fully operational since 2025-11-03

**Configuration**:
- **Bot**: @JevinCC_Bot
- **Chat ID**: 449555452
- **Webhook**: Running on port 8080

**Features**:
- Remote approval gates for AWS deployments and database migrations
- User-initiated slash commands (/status, /monitor, /test, /deploy, /help)
- Notifications for long-running operations
- Rate limiting and audit logging

### Quick Commands

```bash
# Enable/disable notifications
./scripts/telegram/core/notifyctl {on|off|status}

# Send notification
./scripts/telegram/core/notify.sh "Deployment complete"

# Request approval (blocking)
if await_reply.sh "Deploy to production?" 600; then
  npm run deploy:prod
fi

# System monitoring
./scripts/telegram/tools/monitor.sh
./scripts/telegram/tools/webhook_info.sh
```

### User-Initiated Commands (via Telegram)

- `/status` - System health check
- `/monitor` - Detailed metrics
- `/test` - Run test suite (~5 min)
- `/deploy <env>` - Deploy to AWS (staging, production)
- `/help [command]` - Command documentation

### Rate Limits

- **Readonly** (`/status`, `/help`): 10 per minute
- **General**: 5 per minute
- **Intensive** (`/test`, `/deploy`): 1 per 5 minutes

### Documentation

- [README.md](../telegram/README.md) - Quick start
- [SETUP_GUIDE.md](../telegram/SETUP_GUIDE.md) - Complete installation
- [COMMAND_GUIDE.md](../telegram/COMMAND_GUIDE.md) - User commands
- [ARCHITECTURE.md](../telegram/ARCHITECTURE.md) - System design
- [TROUBLESHOOTING.md](../telegram/TROUBLESHOOTING.md) - Common issues

**Deployment Log**: [ops-log/2025-11.md](../ops-log/2025-11.md) (Phase E section)

---

## Claude Code Statusline (AWS Bedrock Cost Tracking)

**Purpose**: Real-time AWS Bedrock API usage and cost tracking

**Status**: ✅ Production-ready with Replit persistence solution

**Display Format**:
```
Session: 7.3M↑/16.8K↓ $12.83 │ Today: $17.00 │ Week: $50.46 │ 21m │ 07:31 │ ~/workspace [branch]
```

**Features**:
- Real token counts from transcript files (100% accurate)
- Cache-aware pricing (fresh, cache write, cache read, output)
- Daily and weekly cost aggregation
- Session duration tracking
- Git branch display

**Replit-Specific Note**: Container restarts wipe `/home/runner/.claude/` but preserve `/home/runner/workspace/.claude/`

### After Container Restart

**⚡ Run this after every container restart (every 1-24 hours in Replit):**
```bash
~/workspace/.claude/restore-config.sh
```
**Time required**: 30 seconds

### Common Commands

```bash
# Restore configuration after container restart
~/workspace/.claude/restore-config.sh

# Check system health and verify configuration
~/workspace/.claude/check-health.sh

# Sync versions after editing script
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# View current costs
cat ~/workspace/.claude/data/usage-stats.json | jq .

# View cost breakdown
tail -50 ~/workspace/.claude/data/statusline-debug.log | grep "COST BREAKDOWN"
```

### Key Files

- **Active**: `~/.claude/statusline-command.sh` (ephemeral, lost on restart)
- **Backup**: `~/workspace/.claude/statusline-command.sh` (persistent)
- **Settings**: `~/.claude/settings.json` (ephemeral) + `~/workspace/.claude/settings.json` (persistent)
- **Data**: `~/workspace/.claude/data/usage-stats.json` (persistent, symlinked)
- **Scripts**: `~/workspace/.claude/restore-config.sh`, `check-health.sh`, `aliases.sh`

### AWS Bedrock Pricing (Sonnet 4.5)

- **Fresh input**: $0.003 per 1K tokens
- **Cache write**: $0.00375 per 1K tokens (25% premium)
- **Cache read**: $0.0003 per 1K tokens (90% discount!)
- **Output**: $0.015 per 1K tokens (5x input cost)

### Documentation

- [docs/statusline/README.md](../statusline/README.md) - Quick overview
- [docs/statusline/GUIDE.md](../statusline/GUIDE.md) - Complete user guide
- [docs/statusline/REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md](../statusline/REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md) - Deep technical analysis
- `.claude/USAGE_INSTRUCTIONS.md` - Quick reference
- `.claude/QUICK_FIX_INSTRUCTIONS.md` - Troubleshooting

---

**Last Updated**: 2025-11-26
**Maintainer**: Development Team
