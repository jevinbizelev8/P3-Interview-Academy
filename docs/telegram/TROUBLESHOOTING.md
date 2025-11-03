# Telegram Bot Controller - Troubleshooting Guide

Common issues, debugging techniques, and solutions for the Telegram Bot Controller system.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Webhook Issues](#webhook-issues)
- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [Integration Issues](#integration-issues)
- [Performance Issues](#performance-issues)
- [Debugging Tools](#debugging-tools)
- [FAQ](#faq)
- [Known Limitations](#known-limitations)

---

## Quick Diagnostics

Run these commands to quickly diagnose common issues:

```bash
# 1. Check notification status
notifyctl status

# 2. Check environment variables
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "Chat ID: $TELEGRAM_CHAT_ID"
echo "Webhook URL: $TELEGRAM_WEBHOOK_URL"

# 3. Check webhook server
curl http://localhost:5000/health

# 4. Check Telegram webhook registration
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# 5. View recent messages
./scripts/telegram/tools/monitor.sh

# 6. Test notification
notify.sh "Test message $(date)"
```

If any of these fail, see the relevant section below.

---

## Webhook Issues

### Issue: Not Receiving Messages

**Symptoms**:
- Messages sent to bot don't appear in `/tmp/telegram_messages/`
- `await_reply.sh` times out even when you reply
- Webhook server logs show no incoming requests

**Diagnosis**:

```bash
# 1. Check webhook registration
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# Look for:
# - "url": should match your webhook URL
# - "has_custom_certificate": false (we use HTTPS from Replit)
# - "pending_update_count": should be 0 (if > 0, messages are queued)
# - "last_error_date": should not be present (or old)
```

**Solutions**:

1. **Webhook not registered**:
   ```bash
   # Re-register webhook
   ./scripts/telegram/tools/webhook_register.sh
   ```

2. **Pending updates** (messages queued):
   ```bash
   # Clear pending updates by re-registering
   curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
   sleep 2
   ./scripts/telegram/tools/webhook_register.sh
   ```

3. **Server not running**:
   ```bash
   # Check if server is running
   curl http://localhost:5000/health || echo "Server not running"

   # Start server (in background or separate terminal)
   python3 scripts/telegram/server/server.py &
   ```

4. **Wrong webhook URL**:
   ```bash
   # Verify Replit URL is correct (check for typos)
   echo $TELEGRAM_WEBHOOK_URL

   # Update and re-register
   export TELEGRAM_WEBHOOK_URL="https://correct-url.repl.co"
   ./scripts/telegram/tools/webhook_register.sh
   ```

5. **Firewall blocking Telegram**:
   - Ensure Replit server is publicly accessible
   - Check no firewall rules block Telegram IPs
   - Verify HTTPS is enabled (Replit provides this automatically)

---

### Issue: Webhook Returns 403 Forbidden

**Symptoms**:
- Telegram shows error in `getWebhookInfo`
- Server logs show: `WARNING: Unauthorized chat_id: 111111111`

**Diagnosis**:

```bash
# Check your actual chat ID
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates" | jq '.result[0].message.chat.id'

# Compare with configured chat ID
echo $TELEGRAM_CHAT_ID
```

**Solutions**:

1. **Wrong chat ID configured**:
   ```bash
   # Get correct chat ID from @userinfobot
   # Or extract from getUpdates (above)

   # Update environment variable
   export TELEGRAM_CHAT_ID="987654321"  # Use correct value

   # Restart server
   pkill -f server.py
   python3 scripts/telegram/server/server.py &
   ```

2. **Testing with wrong account**:
   - Ensure you're messaging the bot from the correct Telegram account
   - Chat ID must match the one configured in `TELEGRAM_CHAT_ID`

---

### Issue: Webhook Shows SSL Error

**Symptoms**:
- `getWebhookInfo` shows `last_error_message` about SSL/certificate

**Solutions**:

1. **Use Replit's HTTPS** (recommended):
   - Replit provides automatic HTTPS
   - Use the `https://` URL, not `http://`
   - Example: `https://myapp.username.repl.co`

2. **Self-signed certificate** (not supported):
   - Telegram requires valid SSL certificate
   - Cannot use `http://` or self-signed certificates
   - Use Replit, Heroku, or similar platform with automatic HTTPS

---

### Issue: High Pending Update Count

**Symptoms**:
- `getWebhookInfo` shows `pending_update_count: 50`
- Old messages not being processed

**Cause**:
- Server was offline while messages arrived
- Telegram queued messages but couldn't deliver

**Solution**:

```bash
# Option 1: Clear pending updates (discards old messages)
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true"
./scripts/telegram/tools/webhook_register.sh

# Option 2: Process pending updates via getUpdates
# (Download and process manually if needed)
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
```

---

## Authentication Issues

### Issue: Chat ID Validation Fails

**Symptoms**:
- Server returns 403 for your messages
- Other users can't use the bot (expected behavior)

**Diagnosis**:

```bash
# Verify your chat ID
# Method 1: Use @userinfobot on Telegram

# Method 2: Extract from getUpdates
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates" | \
  jq -r '.result[-1].message.chat.id'
```

**Solution**:

```bash
# Update .env with correct chat ID
echo "TELEGRAM_CHAT_ID=987654321" >> .env

# Reload environment
source .env

# Restart server
pkill -f server.py
python3 scripts/telegram/server/server.py &
```

---

### Issue: Bot Token Invalid

**Symptoms**:
- API calls return `{"ok":false,"error_code":401,"description":"Unauthorized"}`
- Cannot send notifications

**Diagnosis**:

```bash
# Test bot token
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"

# Should return bot info if valid
```

**Solutions**:

1. **Token typo**:
   ```bash
   # Verify token format: 123456:ABC-DEF...
   echo $TELEGRAM_BOT_TOKEN

   # Re-copy from @BotFather and update .env
   ```

2. **Token revoked**:
   - Create new bot with @BotFather (`/newbot`)
   - Update `TELEGRAM_BOT_TOKEN` in `.env`
   - Re-register webhook

---

## Deployment Issues

### Issue: Replit Server Keeps Stopping

**Symptoms**:
- Server runs for a few minutes then stops
- Free tier Replit limits

**Solutions**:

1. **Keep alive with HTTP requests**:
   ```bash
   # Add to Replit .replit file
   run = "python3 scripts/telegram/server/server.py"

   # Enable "Always On" in Replit (paid feature)
   # Or use UptimeRobot to ping health endpoint every 5 minutes
   ```

2. **Use external monitoring**:
   - [UptimeRobot](https://uptimerobot.com) - Free tier, ping every 5 min
   - Configure to ping: `https://your-replit.repl.co/health`

3. **Upgrade Replit plan**:
   - Replit Hacker plan provides "Always On" feature
   - Ensures server never sleeps

---

### Issue: Environment Variables Not Loading

**Symptoms**:
- Server starts but `TELEGRAM_CHAT_ID` is None
- Python errors: `TypeError: expected string or bytes-like object`

**Solutions**:

1. **Replit Secrets**:
   - Use Replit's Secrets feature (padlock icon)
   - Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_URL`
   - Restart Repl

2. **Local development**:
   ```bash
   # Create .env file
   cat > .env <<EOF
   TELEGRAM_BOT_TOKEN="your-token"
   TELEGRAM_CHAT_ID="your-chat-id"
   TELEGRAM_WEBHOOK_URL="https://your-url.repl.co"
   EOF

   # Load in shell
   source .env

   # Or use python-dotenv
   pip install python-dotenv
   ```

   ```python
   # Add to server.py
   from dotenv import load_dotenv
   load_dotenv()
   ```

---

### Issue: /tmp/ Directory Cleared on Reboot

**Symptoms**:
- After server restart, state directories missing
- `await_reply.sh` fails with "No such file or directory"

**Solution**:

```bash
# Run init.sh after every restart
./scripts/telegram/core/init.sh

# Or add to server startup
# In .replit file:
run = """
./scripts/telegram/core/init.sh
python3 scripts/telegram/server/server.py
"""
```

---

## Integration Issues

### Issue: AWS Deployment Approval Fails

**Symptoms**:
- `await_reply.sh` times out during deployment
- Messages sent but replies not detected

**Diagnosis**:

```bash
# Check if reply file was created
ls -la /tmp/telegram_replies/

# Check server logs for incoming POST
# Should show: "Reply written to /tmp/telegram_replies/reply_*.txt"
```

**Solutions**:

1. **Server and script on different machines**:
   - **Problem**: State files are local to each machine
   - **Solution**: Run both server and scripts on same machine (Replit or local)

2. **File synchronization issue**:
   ```bash
   # Ensure same /tmp/ directory is used
   # Check TELEGRAM_REPLY_DIR environment variable
   echo $TELEGRAM_REPLY_DIR

   # If using custom directory, ensure consistency
   export TELEGRAM_REPLY_DIR="/path/to/shared/replies"
   ```

3. **Token mismatch**:
   ```bash
   # Verify token in reply file name matches expected
   # Reply file: reply_1730000100_a3f5.txt
   # Your message: "approve a3f5" (exact match required)
   ```

---

### Issue: Gemini Agent Notifications Not Sending

**Symptoms**:
- Gemini tasks run but no notifications
- `notify.sh` exits silently

**Diagnosis**:

```bash
# Check if notifications are enabled
notifyctl status

# Check if notify.sh is being called
# Add debug output to Gemini script
echo "Calling notify.sh..." >&2
notify.sh "Test from Gemini"
```

**Solutions**:

1. **Notifications disabled**:
   ```bash
   notifyctl on
   ```

2. **Gemini script not sourcing notify.sh**:
   ```bash
   # Add to Gemini integration script
   source /path/to/scripts/telegram/core/notify.sh
   ```

3. **Environment variables not loaded**:
   ```bash
   # Load .env before calling notify.sh
   source /path/to/.env
   notify.sh "Gemini task complete"
   ```

---

### Issue: Database Migration Approval Loop

**Symptoms**:
- Multiple reply files created
- Approval affects wrong operation

**Diagnosis**:

```bash
# Check for multiple pending replies
ls -la /tmp/telegram_replies/
# Should only show 1 file per pending approval
```

**Solutions**:

1. **Clean up stale replies**:
   ```bash
   ./scripts/telegram/tools/cleanup.sh 0  # Delete all reply files
   ```

2. **Use unique tokens**:
   ```bash
   # Each operation should generate unique token
   TOKEN=$(openssl rand -hex 8)  # Longer token = more unique
   ```

3. **Sequential approvals**:
   ```bash
   # Wait for first approval before starting second
   if await_reply.sh "Migrate database?" 300 "$TOKEN1"; then
     # Database migrated
     if await_reply.sh "Deploy code?" 300 "$TOKEN2"; then
       # Code deployed
     fi
   fi
   ```

---

## Performance Issues

### Issue: High CPU Usage from await_reply.sh

**Symptoms**:
- `await_reply.sh` consuming significant CPU
- Multiple processes polling simultaneously

**Diagnosis**:

```bash
# Check number of await_reply.sh processes
ps aux | grep await_reply.sh | grep -v grep | wc -l

# Should be 1-2 max (one per pending approval)
```

**Solutions**:

1. **Kill zombie processes**:
   ```bash
   pkill -f await_reply.sh
   ./scripts/telegram/tools/cleanup.sh 0
   ```

2. **Increase polling interval** (edit `await_reply.sh`):
   ```bash
   # Change from 2 seconds to 5 seconds
   sleep 5  # Instead of sleep 2
   ```

3. **Use timeout to auto-kill**:
   ```bash
   # Set reasonable timeout (don't use 9999999)
   await_reply.sh "Approve?" 600  # 10 minutes, then auto-exit
   ```

---

### Issue: Timeout Too Short/Long

**Symptoms**:
- Legitimate approvals timing out
- Or approvals taking too long to fail

**Solutions**:

```bash
# Adjust timeout based on operation

# Quick decisions (5 minutes)
await_reply.sh "Small change?" 300

# Review required (30 minutes)
await_reply.sh "Major migration?" 1800

# Overnight batch (4 hours)
await_reply.sh "Review batch results?" 14400

# Emergency (1 minute)
await_reply.sh "Critical hotfix?" 60
```

---

### Issue: Stale Files Consuming Disk Space

**Symptoms**:
- `/tmp/telegram_messages/` growing large
- Thousands of old message files

**Diagnosis**:

```bash
# Count files
find /tmp/telegram_messages/ -type f | wc -l

# Check disk usage
du -sh /tmp/telegram_messages/
du -sh /tmp/telegram_replies/
```

**Solutions**:

1. **Manual cleanup**:
   ```bash
   ./scripts/telegram/tools/cleanup.sh 60  # Delete files older than 1 hour
   ```

2. **Automated cleanup** (cron):
   ```bash
   # Add to crontab
   crontab -e

   # Run every hour
   0 * * * * /path/to/scripts/telegram/tools/cleanup.sh
   ```

3. **Aggressive cleanup**:
   ```bash
   # Delete all files immediately
   rm -f /tmp/telegram_messages/*
   rm -f /tmp/telegram_replies/*
   ```

---

## Debugging Tools

### View Webhook Info

```bash
#!/bin/bash
# scripts/telegram/tools/webhook_info.sh

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq
```

**Output**:
```json
{
  "ok": true,
  "result": {
    "url": "https://myapp.repl.co/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40,
    "ip_address": "1.2.3.4"
  }
}
```

---

### Test Notification Pipeline

```bash
#!/bin/bash
# scripts/telegram/tools/test_pipeline.sh

echo "1. Testing notification system..."
notifyctl on
notify.sh "Test message $(date +%s)"
sleep 2

echo "2. Checking message file..."
ls -lht /tmp/telegram_messages/ | head -3

echo "3. Testing webhook server..."
curl http://localhost:5000/health

echo "4. Testing Telegram API..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.result.username'

echo "All tests complete"
```

---

### Monitor Real-Time Messages

```bash
#!/bin/bash
# scripts/telegram/tools/watch_messages.sh

watch -n 1 'ls -lht /tmp/telegram_messages/ | head -10'
```

---

### Server Logs (Replit)

```bash
# View live logs in Replit Console tab

# Or add debug logging to server.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Logs will show:
# DEBUG: Request received from 1.2.3.4
# INFO: Message received: approve a3f5
# WARNING: Unauthorized chat_id: 111111111
```

---

### Manual Webhook Test

```bash
#!/bin/bash
# Send fake webhook POST to server

curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456,
    "message": {
      "message_id": 1,
      "chat": {"id": "'$TELEGRAM_CHAT_ID'"},
      "text": "test message"
    }
  }'

# Check if message file created
ls -lht /tmp/telegram_messages/ | head -3
```

---

## FAQ

### Q: Can multiple users use the same bot?

**A**: No, not with the current implementation. The bot validates against a single `TELEGRAM_CHAT_ID`.

**Workaround**: Modify `server.py` to accept multiple chat IDs:

```python
# server.py
ALLOWED_CHAT_IDS = os.environ.get('TELEGRAM_CHAT_IDS', '').split(',')

if chat_id not in ALLOWED_CHAT_IDS:
    return jsonify({'ok': False}), 403
```

---

### Q: How do I test without deploying to Replit?

**A**: Use ngrok to expose local server:

```bash
# Terminal 1: Run server locally
python3 scripts/telegram/server/server.py

# Terminal 2: Expose via ngrok
ngrok http 5000

# Terminal 3: Register ngrok URL
export TELEGRAM_WEBHOOK_URL="https://abc123.ngrok.io"
./scripts/telegram/tools/webhook_register.sh

# Send test message to bot
# Check Terminal 1 for incoming POST logs
```

---

### Q: Can I use this in production?

**A**: Yes, but consider:

1. **Reliability**: Use persistent hosting (not free Replit)
2. **Scalability**: Replace file-based state with Redis
3. **Audit trail**: Add database logging for approvals
4. **Multi-user**: Implement user management system
5. **Security**: Add approval logging and audit trail

---

### Q: What happens if server crashes during approval?

**A**: The approval times out and returns failure (exit 1). The calling script should handle this gracefully:

```bash
if ! await_reply.sh "Deploy?" 300; then
  notify.sh "Approval failed - check server status"
  exit 1
fi
```

---

### Q: Can I send images or files via notification?

**A**: Not with `notify.sh` (text-only). You can extend the system:

```bash
#!/bin/bash
# scripts/telegram/core/notify_image.sh

IMAGE_PATH="$1"

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto" \
  -F "chat_id=${TELEGRAM_CHAT_ID}" \
  -F "photo=@${IMAGE_PATH}"
```

---

### Q: How do I disable notifications temporarily?

**A**: Use `notifyctl off`:

```bash
# Disable for focused work
notifyctl off

# Your work session
# ...

# Re-enable
notifyctl on
```

---

### Q: Can I customize the approval keywords?

**A**: Yes, edit `await_reply.sh`:

```bash
# Change this line:
if echo "$REPLY" | grep -iE "^(yes|approve|ok|y)$" > /dev/null; then

# To:
if echo "$REPLY" | grep -iE "^(yes|approve|ok|y|confirm|proceed)$" > /dev/null; then
```

---

### Q: What if I accidentally approve the wrong thing?

**A**: Use token-based approval for critical operations:

```bash
# Requires exact token match
TOKEN=$(openssl rand -hex 6)
await_reply.sh "Delete production data? Reply: approve $TOKEN" 300 "$TOKEN"

# User must reply exactly: "approve a3f5b7c2d1e9"
# Typos or wrong token = rejection
```

---

### Q: How do I integrate with GitHub Actions?

**A**: Add to workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy with Approval

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure Telegram
        run: |
          echo "TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}" >> $GITHUB_ENV
          echo "TELEGRAM_CHAT_ID=${{ secrets.TELEGRAM_CHAT_ID }}" >> $GITHUB_ENV

      - name: Request approval
        run: |
          ./scripts/telegram/core/notify.sh "Deploy ${{ github.sha }}?"
          if ! ./scripts/telegram/core/await_reply.sh "Approve deployment?" 600; then
            exit 1
          fi

      - name: Deploy
        run: npm run deploy
```

**Important**: GitHub Actions runner and webhook server must share state (use API-based approach or external service).

---

## Known Limitations

### Single User Only

- Bot validates against one `TELEGRAM_CHAT_ID`
- Multi-user requires code modifications
- **Workaround**: Deploy multiple bots (one per user)

### File-Based State

- Not suitable for distributed systems
- Shared state requires same machine/container
- **Workaround**: Use Redis or database for production

### Polling Overhead

- 2-second polling creates CPU/disk overhead
- Multiple concurrent approvals compound this
- **Workaround**: Increase poll interval or use event-driven approach

### No Message History

- Messages deleted after processing
- No audit trail or replay capability
- **Workaround**: Add database logging in `server.py`

### Replit Free Tier Limits

- Server sleeps after inactivity (free tier)
- Webhook POSTs fail during sleep
- **Workaround**: Use UptimeRobot pings or upgrade to Hacker plan

### No Retry Logic

- Failed notifications are lost (no queue)
- Timeouts are final (no second chance)
- **Workaround**: Add retry logic in calling scripts

### Token Security

- Tokens sent in plain text messages
- Visible in Telegram chat history
- **Workaround**: Use short-lived tokens, clear chat history

---

## Getting Help

### Debug Checklist

1. ✅ Notifications enabled (`notifyctl status`)
2. ✅ Environment variables set (`echo $TELEGRAM_BOT_TOKEN`)
3. ✅ Webhook server running (`curl localhost:5000/health`)
4. ✅ Webhook registered (`curl https://api.telegram.org/.../getWebhookInfo`)
5. ✅ Chat ID correct (test with `/start` to bot)
6. ✅ State directories exist (`ls /tmp/telegram_*/`)

### Useful Commands

```bash
# Full diagnostic
./scripts/telegram/tools/monitor.sh

# Test notification
notify.sh "Test $(date)"

# Test approval (30 seconds)
await_reply.sh "Test approval?" 30

# View webhook info
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq

# Clear all state
./scripts/telegram/tools/cleanup.sh 0

# Restart system
notifyctl off
pkill -f server.py
./scripts/telegram/core/init.sh
notifyctl on
python3 scripts/telegram/server/server.py &
./scripts/telegram/tools/webhook_register.sh
```

### Contact & Support

For issues specific to P3 Interview Academy integration:
- Check [GitHub Issues](https://github.com/jevinbizelev8/P3-Interview-Academy/issues)
- Review [main documentation](../README.md)

For Telegram Bot API issues:
- [Telegram Bot API docs](https://core.telegram.org/bots/api)
- [Bot troubleshooting](https://core.telegram.org/bots/faq)

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
