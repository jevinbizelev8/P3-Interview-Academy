# Telegram Bot Controller

A lightweight notification and approval system that enables Claude Code agents to interact with users via Telegram when they're away from keyboard (AFK).

## Overview

The Telegram Bot Controller allows automated systems and AI agents to:

- Send real-time notifications to users via Telegram
- Request approval for critical operations (deployments, database migrations, etc.)
- Receive user input through Telegram messages
- Support both token-based and natural language approvals
- Operate in multiple modes: notifications-only, approval-gate, or hybrid

**Use Cases**:
- Deploy to production and request approval before final release
- Run database migrations with human oversight
- Notify users of long-running task completion
- Request configuration decisions during automated workflows
- Alert users of errors or system events

## Key Features

### Notification System
- **Simple API**: One-line command to send notifications
- **Non-blocking**: Fire-and-forget messages that don't halt execution
- **Rich formatting**: Support for Markdown, code blocks, and emojis
- **Manual toggle**: Enable/disable via `notifyctl` command

### Approval Gates
- **Blocking operations**: Wait for user approval before continuing
- **Timeout support**: Configurable timeouts with default behavior
- **Token-based validation**: Optional security tokens for approvals
- **Hybrid mode**: Accept both "approve [token]" and simple "yes/no"

### Integration Points
- AWS deployments and environment updates
- Database migrations and schema changes
- Gemini research agent tasks
- General Claude Code operations
- Custom workflows via simple shell scripts

### Security
- Chat ID validation (only authorized users can control the bot)
- Optional approval tokens for sensitive operations
- File-based state management with proper permissions
- No external database dependencies

## Quick Start (5 Minutes)

### Prerequisites

1. **Telegram Bot Token**:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot with `/newbot`
   - Save the token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

2. **Your Chat ID**:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - Note your numeric chat ID (e.g., `987654321`)

3. **Replit Account** (recommended):
   - Sign up at [replit.com](https://replit.com)
   - This provides persistent webhook hosting

### Installation

```bash
# 1. Initialize the Telegram bot system
./scripts/telegram/core/init.sh

# 2. Set environment variables in .env
TELEGRAM_BOT_TOKEN="your-bot-token-here"
TELEGRAM_CHAT_ID="your-chat-id-here"
TELEGRAM_WEBHOOK_URL="https://your-replit.repl.co/webhook"

# 3. Start the webhook server (in Replit or background)
python3 scripts/telegram/server/server.py

# 4. Register the webhook with Telegram
./scripts/telegram/tools/webhook_register.sh

# 5. Enable notifications
notifyctl on
```

### Basic Usage

**Send a simple notification**:
```bash
notify.sh "Deployment complete! Application is live."
```

**Request approval before proceeding**:
```bash
if await_reply.sh "Deploy to production?" 300; then
  echo "Approved! Deploying..."
  # deployment commands here
else
  echo "Rejected or timed out"
  exit 1
fi
```

**Advanced approval with token**:
```bash
TOKEN=$(openssl rand -hex 4)
if await_reply.sh "Migrate database? Reply: approve $TOKEN" 600 "$TOKEN"; then
  npm run db:migrate
else
  echo "Migration cancelled"
fi
```

## Architecture

The system consists of three layers:

1. **Core Scripts** (`scripts/telegram/core/`):
   - `notifyctl` - Toggle notifications on/off
   - `notify.sh` - Send notifications
   - `await_reply.sh` - Wait for user replies with approval logic
   - `init.sh` - Initialize the system

2. **Webhook Server** (`scripts/telegram/server/`):
   - `server.py` - Flask server that receives Telegram messages
   - Validates chat ID and writes messages to state files
   - Runs continuously in Replit

3. **Tools** (`scripts/telegram/tools/`):
   - `webhook_register.sh` - Register webhook with Telegram API
   - `monitor.sh` - View recent messages and system status
   - `cleanup.sh` - Remove stale state files

**State Management**:
- Notifications enabled/disabled: `/tmp/telegram_notify_enabled`
- Incoming messages: `/tmp/telegram_messages/msg_*.txt`
- Reply tracking: Token files in `/tmp/telegram_replies/`

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed diagrams and workflows.

## Common Workflows

### AWS Deployment with Approval

```bash
#!/bin/bash
# Deploy to staging, wait for approval, then production

npm run build
npm run deploy:staging

# Wait for staging approval
if ! await_reply.sh "Staging looks good? Approve for production." 600; then
  echo "Deployment cancelled"
  exit 1
fi

npm run deploy:production
notify.sh "Production deployment complete!"
```

### Database Migration with Token

```bash
#!/bin/bash
TOKEN=$(openssl rand -hex 6)

notify.sh "Database migration ready. Review changes at: http://localhost:3000/migrations"

if await_reply.sh "Run migration? Reply: approve $TOKEN" 900 "$TOKEN"; then
  npm run db:push
  notify.sh "Migration complete - all tables updated"
else
  notify.sh "Migration cancelled by user"
  exit 1
fi
```

### Gemini Research Task

```bash
#!/bin/bash
# Long-running research task with notification

notify.sh "Starting Gemini research on React 19 patterns..."

# Run research (takes 10+ minutes)
gemini-cli research "React 19 server components best practices" > /tmp/research.md

# Notify completion
notify.sh "Research complete! Found 15 patterns and 8 examples."
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Your numeric Telegram chat ID |
| `TELEGRAM_WEBHOOK_URL` | Yes | Public webhook URL (Replit URL) |
| `TELEGRAM_STATE_DIR` | No | State directory (default: `/tmp/telegram_messages`) |
| `TELEGRAM_REPLY_DIR` | No | Reply directory (default: `/tmp/telegram_replies`) |

### Toggle Control

```bash
# Enable notifications
notifyctl on

# Disable notifications (useful during focused work)
notifyctl off

# Check status
notifyctl status
```

When disabled, `notify.sh` and `await_reply.sh` operate in silent mode (no messages sent, approvals auto-pass for development).

## Integration Examples

### With GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Request deployment approval
  run: |
    source scripts/telegram/core/notify.sh
    if ! await_reply.sh "Deploy ${{ github.sha }} to production?" 600; then
      exit 1
    fi
```

### With npm Scripts

```json
{
  "scripts": {
    "deploy:prod": "./scripts/deploy-with-approval.sh",
    "db:migrate:safe": "./scripts/migrate-with-approval.sh"
  }
}
```

### With Claude Code Agents

```bash
# In your custom agent script
notify.sh "Agent starting 30-minute research task..."

# Long-running task
./scripts/research-agent.sh

notify.sh "Research complete. Results ready for review."
```

## Documentation

### Core Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design, components, and workflows
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete installation and configuration
- [COMMAND_GUIDE.md](./COMMAND_GUIDE.md) - User commands reference
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

### Permissions & Configuration (NEW - 2025-11-06)
- [PERMISSIONS_AND_NOTIFICATIONS.md](./PERMISSIONS_AND_NOTIFICATIONS.md) - **How Claude Code permissions and Telegram notifications work together**
- [PERMISSIONS_QUICK_REFERENCE.md](./PERMISSIONS_QUICK_REFERENCE.md) - **One-page cheat sheet for quick lookup**
- [EXPORT_GUIDE.md](./EXPORT_GUIDE.md) - **Export and share this system with other projects**
- [SESSION_SUMMARY_2025-11-06.md](./SESSION_SUMMARY_2025-11-06.md) - **Recent fixes and improvements**

### Key Insights
📌 **Important**: This system uses TWO layers of permissions:
1. **Claude Code permissions** (`.claude/settings.json`) - Controls if commands CAN execute
2. **Telegram notification hook** (`bash-approval-notifier-v2.sh`) - Controls if notifications are sent

Both must be configured for commands to run silently. See [PERMISSIONS_AND_NOTIFICATIONS.md](./PERMISSIONS_AND_NOTIFICATIONS.md) for details.

## Limitations

- **Single user**: Bot validates against one chat ID (multi-user requires code changes)
- **Replit dependency**: Webhook server needs persistent hosting
- **File-based state**: Not suitable for high-frequency messages (use Redis for scale)
- **No message history**: Messages are ephemeral (deleted after processing)
- **Internet required**: Both Replit and local system must have internet access

## Security Considerations

- Store `TELEGRAM_BOT_TOKEN` in `.env` (never commit to git)
- Validate chat ID on every incoming message
- Use approval tokens for sensitive operations
- Set proper file permissions on state directories (0700)
- Review webhook logs regularly for unauthorized access attempts

## Contributing

To extend this system:

1. Add new scripts to `scripts/telegram/core/` for new features
2. Update `server.py` for advanced message parsing
3. Create integration scripts in `scripts/telegram/integrations/`
4. Update documentation in `docs/telegram/`

## License

Part of the P3 Interview Academy project. See main repository LICENSE.

---

**Last Updated**: 2025-11-06
**Version**: 1.1.0
**Status**: Production Ready with Comprehensive Documentation
