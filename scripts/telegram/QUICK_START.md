# Telegram Bot Controller - Quick Start Guide

Get up and running with Telegram notifications in 5 minutes.

## Prerequisites

- Telegram account
- Bash shell (Linux/macOS/WSL)
- curl, jq, python3 (check with: `which curl jq python3`)

## Step 1: Create Telegram Bot (2 minutes)

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)

2. Send `/newbot` command

3. Follow prompts:
   ```
   BotFather: Alright, a new bot. How are we going to call it?
   You: P3 Deployment Bot

   BotFather: Good. Now let's choose a username for your bot.
   You: p3_deploy_bot

   BotFather: Done! Here is your token: 123456789:ABC-DEF...
   ```

4. Copy the token (looks like: `123456789:ABC-DEFghIJKlmnoPQRstuVWxyz`)

## Step 2: Get Your Chat ID (1 minute)

1. Search for [@userinfobot](https://t.me/userinfobot) in Telegram

2. Send any message (like `/start`)

3. Copy your chat ID (looks like: `123456789`)

## Step 3: Configure Environment (1 minute)

```bash
# Navigate to project
cd /home/runner/workspace

# Copy template
cp scripts/telegram/.env.example scripts/telegram/.env

# Edit with your credentials (use nano, vim, or any editor)
nano scripts/telegram/.env
```

Add your credentials:
```bash
BOT_TOKEN=123456789:ABC-DEFghIJKlmnoPQRstuVWxyz
CHAT_ID=123456789
```

Save and exit (Ctrl+O, Enter, Ctrl+X in nano)

## Step 4: Initialize System (1 minute)

```bash
./scripts/telegram/core/init.sh
```

You should see:
```
✓ Checking requirements...
✓ All required commands available
✓ Creating directories...
✓ Directories created
✓ Setting permissions...
✓ Permissions set
✓ Validating environment...
✓ Environment file exists
✓ Required environment variables set
✓ Testing Telegram API...
✓ Telegram API connected (bot: @p3_deploy_bot)
✓ Sending test message...
✓ Test message sent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Setup complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Check your Telegram - you should receive a test message!

## Step 5: Test Basic Commands (30 seconds)

```bash
# Send a notification
./scripts/telegram/core/notify.sh "Hello from P3 Interview Academy! 🚀"

# Check your Telegram for the message
```

## Common First-Time Issues

### Issue: "Error: Environment file not found"
**Solution**: Make sure you created `.env` file (not `.env.example`)
```bash
cp scripts/telegram/.env.example scripts/telegram/.env
```

### Issue: "Invalid Telegram bot token"
**Solution**: Double-check token from @BotFather, ensure no extra spaces
```bash
# Check your token format
cat scripts/telegram/.env | grep BOT_TOKEN
```

### Issue: "curl: command not found"
**Solution**: Install required dependencies
```bash
# Ubuntu/Debian
sudo apt-get install curl jq

# macOS
brew install curl jq
```

### Issue: "Permission denied"
**Solution**: Make scripts executable
```bash
chmod +x scripts/telegram/core/*.sh
```

## Next Steps

### Enable/Disable Notifications

```bash
# Turn on notifications
./scripts/telegram/core/notifyctl on

# Check status
./scripts/telegram/core/notifyctl status

# Turn off notifications (scripts will run but not send)
./scripts/telegram/core/notifyctl off
```

### Request Approvals

```bash
# Ask a question with 5-minute timeout
./scripts/telegram/core/await_reply.sh "Deploy to production?" 300

# To reply:
# 1. Copy the TOKEN from the message
# 2. Create file: echo "approve" > .inbox/TOKEN_123456789
# 3. Script will read your reply and continue

# Note: For production use, set up the bot listener (see README.md)
```

### Integration Examples

See `scripts/telegram/examples/` for:
- `deployment-example.sh` - Complete deployment workflow
- `monitoring-example.sh` - Log monitoring with alerts

Run them:
```bash
./scripts/telegram/examples/deployment-example.sh
./scripts/telegram/examples/monitoring-example.sh
```

## Testing Your Setup

Run the test suite to verify everything works:

```bash
./scripts/telegram/core/test-suite.sh
```

Expected output:
```
━━━ Testing notifyctl ━━━
✓ Initial status is OFF
✓ Notifications enabled
✓ Status correctly shows ON
...

Total Tests: 14
Passed: 11+
Failed: 0-3 (acceptable with missing .env)
```

## Pro Tips

1. **Markdown Formatting**: Messages support markdown
   ```bash
   ./scripts/telegram/core/notify.sh "**Bold** _italic_ \`code\`"
   ```

2. **Emojis**: Full emoji support
   ```bash
   ./scripts/telegram/core/notify.sh "✅ Success! 🎉"
   ```

3. **Multi-line Messages**: Use quotes
   ```bash
   ./scripts/telegram/core/notify.sh "Line 1
   Line 2
   Line 3"
   ```

4. **Silent Mode**: Notifications can be toggled without changing scripts
   ```bash
   # Your script
   ./scripts/telegram/core/notify.sh "Deployment started"
   # ... deploy logic ...

   # Users can disable notifications without modifying your script
   ./scripts/telegram/core/notifyctl off
   ```

## Getting Help

- **Full Documentation**: See `scripts/telegram/README.md`
- **Test Scripts**: Run `./scripts/telegram/core/test-suite.sh`
- **Examples**: Check `scripts/telegram/examples/`
- **Troubleshooting**: See README.md "Troubleshooting" section

## What's Next?

1. **Set up bot listener** for reply functionality (see README.md)
2. **Integrate into CI/CD** pipelines (see examples)
3. **Add to deployment scripts** for production monitoring
4. **Configure monitoring** for error alerts

---

**Setup Time**: ~5 minutes
**Status**: ✅ Ready to use
**Documentation**: `scripts/telegram/README.md`
