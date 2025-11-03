# Telegram Bot Controller

A lightweight notification and approval system for integrating Telegram with Claude Code in Replit environments.

## Features

- 📨 **Send Notifications** - Push messages to Telegram from scripts
- 🔔 **Toggle Control** - Enable/disable notifications on demand
- ⏳ **Await Replies** - Request approvals and wait for responses
- 🔒 **Secure** - Environment-based credentials, no hardcoded tokens
- 🚀 **Easy Setup** - One-command initialization

## Quick Start

### 1. Setup Telegram Bot

1. Create a bot with [@BotFather](https://t.me/BotFather):
   - Send `/newbot`
   - Follow prompts to name your bot
   - Copy the `BOT_TOKEN`

2. Get your Chat ID:
   - Send a message to [@userinfobot](https://t.me/userinfobot)
   - Copy your `chat_id`

### 2. Configure Environment

```bash
# Copy template
cp scripts/telegram/.env.example scripts/telegram/.env

# Edit with your credentials
# BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
# CHAT_ID=123456789
```

### 3. Initialize System

```bash
./scripts/telegram/core/init.sh
```

This will:
- ✓ Check required dependencies (curl, python3, jq)
- ✓ Create necessary directories (.inbox, .pending, .logs)
- ✓ Set proper permissions
- ✓ Validate credentials
- ✓ Test Telegram API connection
- ✓ Send test message
- ✓ Install Python dependencies (if needed)

## Usage

### Send Notifications

```bash
# Simple notification
./scripts/telegram/core/notify.sh "Deployment started!"

# With markdown formatting
./scripts/telegram/core/notify.sh "**Build Status**: ✅ Passed"

# Emoji support
./scripts/telegram/core/notify.sh "🚀 Production deployment in progress"
```

### Toggle Notifications

```bash
# Enable notifications
./scripts/telegram/core/notifyctl on

# Disable notifications
./scripts/telegram/core/notifyctl off

# Check status
./scripts/telegram/core/notifyctl status
```

### Request Approvals

```bash
# Ask for approval with 5-minute timeout
./scripts/telegram/core/await_reply.sh "Deploy to production?" 300

# User replies in Telegram:
# - "approve" → script exits 0, outputs "approve"
# - "reject" → script exits 0, outputs "reject"
# - Custom text → script exits 0, outputs custom text
# - Timeout → script exits 1, outputs "TIMEOUT"

# Use in scripts
if RESPONSE=$(./scripts/telegram/core/await_reply.sh "Continue?" 120); then
  if [[ "$RESPONSE" == "approve" ]]; then
    echo "Approved! Continuing..."
  else
    echo "Response: $RESPONSE"
  fi
else
  echo "Timeout or error"
  exit 1
fi
```

## Architecture

### File Structure

```
scripts/telegram/
├── core/
│   ├── init.sh           # System initialization
│   ├── notifyctl         # Toggle notifications on/off
│   ├── notify.sh         # Send Telegram messages
│   └── await_reply.sh    # Request and wait for replies
├── .env                  # Credentials (DO NOT COMMIT)
├── .env.example          # Template for .env
└── .logs/                # System logs (created by init)

.inbox/                   # Incoming replies (project root)
.pending/                 # Pending approval tokens (project root)
.notify.enabled           # Notification toggle state (project root)
```

### State Files

- **`.notify.enabled`** - Presence indicates notifications are ON
- **`.pending/TOKEN_*`** - Active approval requests waiting for replies
- **`.inbox/TOKEN_*`** - Received replies from Telegram (created by bot listener)

### Environment Variables

Required in `scripts/telegram/.env`:
- `BOT_TOKEN` - Telegram bot token from @BotFather
- `CHAT_ID` - Your Telegram chat ID

## Integration Examples

### Deployment Script

```bash
#!/usr/bin/env bash
set -euo pipefail

# Notify deployment start
./scripts/telegram/core/notify.sh "🚀 Starting production deployment"

# Run tests
npm run test || {
  ./scripts/telegram/core/notify.sh "❌ Tests failed! Aborting deployment"
  exit 1
}

# Request approval
if ! RESPONSE=$(./scripts/telegram/core/await_reply.sh "Tests passed. Deploy to prod?" 300); then
  ./scripts/telegram/core/notify.sh "⏱️ Approval timeout - deployment cancelled"
  exit 1
fi

if [[ "$RESPONSE" != "approve" ]]; then
  ./scripts/telegram/core/notify.sh "🛑 Deployment rejected: $RESPONSE"
  exit 1
fi

# Deploy
npm run deploy:production

# Notify success
./scripts/telegram/core/notify.sh "✅ Production deployment complete!"
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
- name: Request deployment approval
  run: |
    RESPONSE=$(./scripts/telegram/core/await_reply.sh "Deploy ${{ github.ref }}?" 600)
    if [[ "$RESPONSE" != "approve" ]]; then
      echo "Deployment not approved: $RESPONSE"
      exit 1
    fi
```

### Error Monitoring

```bash
#!/usr/bin/env bash

# Monitor logs and send alerts
tail -f /var/log/app.log | while read line; do
  if echo "$line" | grep -q "ERROR"; then
    ./scripts/telegram/core/notify.sh "🚨 Error detected: $line"
  fi
done
```

## Bot Listener Setup

To receive replies, you need a bot listener. Example Python listener:

```python
# scripts/telegram/bot_listener.py
import os
from telegram import Update
from telegram.ext import Application, MessageHandler, filters

INBOX_DIR = ".inbox"

async def handle_message(update: Update, context):
    """Process incoming messages and save to inbox"""
    text = update.message.text

    # Extract token from message (format: TOKEN_1234567890_5678)
    if "TOKEN_" in text:
        token = text.split()[0]  # First word
        inbox_file = os.path.join(INBOX_DIR, token)

        # Save reply to inbox
        with open(inbox_file, 'w') as f:
            f.write(update.message.text)

        await update.message.reply_text(f"✓ Reply received for {token}")

def main():
    token = os.getenv("BOT_TOKEN")
    app = Application.builder().token(token).build()

    app.add_handler(MessageHandler(filters.TEXT, handle_message))
    app.run_polling()

if __name__ == "__main__":
    main()
```

Run the listener:
```bash
python3 scripts/telegram/bot_listener.py
```

## Troubleshooting

### Notifications Not Sending

1. Check notification status:
   ```bash
   ./scripts/telegram/core/notifyctl status
   ```

2. Verify credentials:
   ```bash
   source scripts/telegram/.env
   echo "Token: ${BOT_TOKEN:0:10}..."
   echo "Chat ID: $CHAT_ID"
   ```

3. Test API manually:
   ```bash
   curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"
   ```

### Replies Not Working

1. Ensure bot listener is running
2. Check `.inbox/` and `.pending/` directories exist
3. Verify permissions: `ls -la .inbox .pending`
4. Check token format in pending files

### Permission Errors

```bash
# Fix directory permissions
chmod 700 .inbox .pending
chmod 755 scripts/telegram/.logs

# Fix script permissions
chmod +x scripts/telegram/core/*
```

## Security Best Practices

1. **Never commit `.env`** - Add to `.gitignore`:
   ```gitignore
   scripts/telegram/.env
   .inbox/
   .pending/
   .notify.enabled
   ```

2. **Rotate tokens** - Regenerate bot token periodically via @BotFather

3. **Restrict chat** - Use private chat ID, not public group

4. **Validate inputs** - Scripts sanitize messages before sending

5. **Audit logs** - Check `scripts/telegram/.logs/` for activity

## Dependencies

- **curl** - HTTP requests to Telegram API
- **jq** - JSON parsing and formatting
- **python3** - Bot listener (optional)
- **bash 4+** - Script execution

## License

MIT License - Part of P3 Interview Academy project

## Support

For issues or questions:
- Check troubleshooting section above
- Review script comments for detailed logic
- Test with `init.sh` to verify setup
- Check Telegram bot status with @BotFather

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
