# Telegram Webhook Server

Flask-based webhook server for processing Telegram Bot API messages in the Claude Code Controller system.

## Overview

This server receives webhook events from Telegram and processes user replies using file-based state management. It supports **Hybrid Mode** message processing, allowing both token-specific and latest-pending command handling.

## Features

- **POST `/telegram/webhook`** - Main webhook endpoint for Telegram messages
- **GET `/healthz`** - Health check endpoint for monitoring
- **Hybrid Mode Commands**:
  - `approve TOKEN` / `reject TOKEN` - Process specific pending request
  - `approve` / `reject` - Process latest pending request
  - `/input TOKEN text` - Provide text input for specific request
  - `/input text` - Provide text input for latest request
- **Chat ID Validation** - Only authorized chat can send commands
- **File-based State** - Uses `.inbox/` and `.pending/` directories

## Prerequisites

1. **Python 3.9+** installed
2. **Required packages**: Install from `requirements.txt`
3. **Telegram Bot**: Created via @BotFather with bot token
4. **Chat ID**: Your personal Telegram chat ID

## Installation

### 1. Install Python Dependencies

```bash
cd scripts/telegram/server
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cd scripts/telegram
cp .env.example .env
```

Edit `scripts/telegram/.env` and set:

```bash
BOT_TOKEN=your_telegram_bot_token_here
CHAT_ID=your_chat_id_here
WEBHOOK_URL=https://your-repl-name.your-username.repl.co/telegram/webhook
```

**Getting Telegram Credentials**:

1. **Bot Token**:
   - Open Telegram and message @BotFather
   - Send `/newbot` and follow instructions
   - Copy the token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **Chat ID**:
   - Start a chat with your bot (click "Start" button)
   - Run this command to fetch updates:
     ```bash
     export BOT_TOKEN="your_token_here"
     curl -s "https://api.telegram.org/bot$BOT_TOKEN/getUpdates" | jq
     ```
   - Look for `"chat": {"id": YOUR_NUMBER}` in the response

3. **Webhook URL**:
   - For Replit: `https://<your-repl-name>.<your-username>.repl.co/telegram/webhook`
   - Must be HTTPS (Telegram requirement)

## Usage

### Starting the Server Locally

```bash
# From project root
python scripts/telegram/server/server.py
```

The server will start on port 8080 (configurable via `PORT` environment variable).

**Expected output**:
```
Starting Telegram webhook server on port 8080
Authorized Chat ID: 123456789
Inbox directory: /home/runner/workspace/.inbox
Pending directory: /home/runner/workspace/.pending
Environment file: /home/runner/workspace/scripts/telegram/.env
Ready to receive webhooks at POST /telegram/webhook
 * Serving Flask app 'server'
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:8080
```

### Registering the Webhook

After starting the server, register your webhook URL with Telegram:

```bash
cd scripts/telegram/tools
./webhook_register.sh
```

**Expected output**:
```
════════════════════════════════════════════════════════════
  Telegram Webhook Registration
════════════════════════════════════════════════════════════

Bot Token: 123456789:...
Webhook URL: https://your-repl.repl.co/telegram/webhook

Registering webhook with Telegram API...

✅ Webhook registered successfully!

Response: Webhook was set

Verifying webhook configuration...

═══ Webhook Status ═══
URL: https://your-repl.repl.co/telegram/webhook
Pending updates: 0
Last error date: none
Last error message: none
```

### Testing the System

#### 1. Test Health Check

```bash
curl http://localhost:8080/healthz
```

**Expected**: `ok`

#### 2. Test Notification

```bash
cd scripts/telegram/core
./notify.sh "Test notification from Claude Code"
```

You should receive a message on Telegram.

#### 3. Test Approval Flow

Run the await_reply script:

```bash
cd scripts/telegram/core
./await_reply.sh "Need approval for deployment"
```

You'll receive a Telegram message with a token. Reply with:
- `approve` - To approve
- `reject` - To reject
- Any other text - Custom response

The script will receive your reply and print it.

#### 4. Test Hybrid Mode

**Test Latest-Pending Command**:
1. Create a pending request: `mkdir -p .pending && touch .pending/TEST_TOKEN_123`
2. Send message to your bot: `approve`
3. Check inbox: `cat .inbox/TEST_TOKEN_123` → Should show `approve`

**Test Token-Specific Command**:
1. Create pending: `touch .pending/TOKEN_ABC`
2. Send message: `approve TOKEN_ABC`
3. Check inbox: `cat .inbox/TOKEN_ABC` → Should show `approve`

**Test Input Command**:
1. Create pending: `touch .pending/INPUT_TEST`
2. Send message: `/input INPUT_TEST This is my custom input`
3. Check inbox: `cat .inbox/INPUT_TEST` → Should show `This is my custom input`

## Message Processing Logic

### Command Patterns

The server processes messages in this priority order:

1. **Explicit approve/reject with token**
   - Pattern: `approve TOKEN_123` or `reject TOKEN_456`
   - Action: Write decision to `.inbox/TOKEN`, remove from `.pending/`

2. **Latest-pending approve/reject**
   - Pattern: `approve` or `reject` (no token)
   - Action: Find latest token in `.pending/`, write decision, remove pending

3. **Input command with optional token**
   - Pattern: `/input TOKEN text...` or `/input text...`
   - Action: Write text to `.inbox/TOKEN`, remove pending

### Response Codes

| Status | Meaning |
|--------|---------|
| `ok` | Command processed successfully |
| `no_pending` | No pending requests found |
| `ignored` | Message didn't match any command pattern |
| `unauthorized` | Message from non-authorized chat ID |
| `error` | Server error processing request |

## File Structure

```
.
├── .inbox/              # Replies from Telegram (read by await_reply.sh)
│   └── TOKEN_*          # Files containing user responses
├── .pending/            # Tokens awaiting replies
│   └── TOKEN_*          # Empty marker files
└── scripts/telegram/
    ├── .env             # Environment configuration (BOT_TOKEN, CHAT_ID)
    ├── core/
    │   ├── notify.sh    # Send notifications to Telegram
    │   └── await_reply.sh  # Wait for Telegram replies
    ├── server/
    │   ├── server.py    # Flask webhook server (this)
    │   ├── requirements.txt
    │   └── README.md    # This file
    └── tools/
        └── webhook_register.sh  # Register webhook with Telegram
```

## Monitoring

### Server Logs

The server prints detailed logs to stdout:

```
Processed: approve TOKEN_1234567890_123
Processed (latest): reject TOKEN_1234567890_456
Processed input for token INPUT_789: Some user input...
Ignored message (no recognized pattern): hello bot
Unauthorized chat ID: 987654321 (expected: 123456789)
```

### Webhook Status

Check webhook status at any time:

```bash
export BOT_TOKEN="your_token"
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | jq
```

Key fields:
- `url` - Registered webhook URL
- `pending_update_count` - Number of queued updates
- `last_error_date` - Last error timestamp (if any)
- `last_error_message` - Error details

## Troubleshooting

### Issue: Server not receiving webhooks

**Symptoms**: Messages sent to bot, but server logs show nothing

**Solutions**:
1. Verify webhook is registered: Check `getWebhookInfo` output
2. Check URL is correct: Must match your Replit URL exactly
3. Ensure HTTPS: Telegram requires HTTPS for webhooks
4. Check firewall: Port 8080 must be accessible
5. Verify bot token: Run `getMe` API call to test:
   ```bash
   curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"
   ```

### Issue: "Unauthorized chat ID" errors

**Symptoms**: Server logs show `Unauthorized chat ID: <number>`

**Solutions**:
1. Verify CHAT_ID in `.env` matches your chat ID
2. Get your chat ID:
   ```bash
   curl "https://api.telegram.org/bot$BOT_TOKEN/getUpdates" | jq '.result[].message.chat.id'
   ```
3. Update `.env` and restart server

### Issue: Pending updates accumulating

**Symptoms**: `getWebhookInfo` shows high `pending_update_count`

**Solutions**:
1. Clear pending updates by temporarily setting webhook to empty:
   ```bash
   curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"
   ```
2. Re-register webhook: `./tools/webhook_register.sh`
3. Or use `drop_pending_updates=true` parameter:
   ```bash
   curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=YOUR_URL&drop_pending_updates=true"
   ```

### Issue: Files not being created in .inbox/

**Symptoms**: Webhook logs show "Processed" but no inbox file

**Solutions**:
1. Check file permissions: `.inbox/` must be writable
2. Verify token format: Should match what `await_reply.sh` creates
3. Check server user: Ensure same user runs server and scripts
4. Debug manually:
   ```bash
   touch .pending/TEST_123
   # Send "approve" to bot
   ls -la .inbox/TEST_123  # Should exist
   cat .inbox/TEST_123     # Should show "approve"
   ```

### Issue: Environment variables not loading

**Symptoms**: `Error: BOT_TOKEN not set in environment`

**Solutions**:
1. Verify `.env` file exists: `ls -la scripts/telegram/.env`
2. Check file format: No spaces around `=`, no quotes needed
3. Example correct format:
   ```
   BOT_TOKEN=123456789:ABCdefGHI
   CHAT_ID=123456789
   ```
4. Restart server after editing `.env`

## Production Deployment

### Replit Always-On

For 24/7 webhook server availability on Replit:

1. Enable Replit Always-On (requires Hacker plan)
2. Add webhook server to `.replit` run command (already configured)
3. Server will auto-restart on crashes

### Running in Background

For VPS or other deployment:

```bash
# Start server in background
nohup python scripts/telegram/server/server.py > /tmp/webhook.log 2>&1 &

# Check if running
ps aux | grep server.py

# View logs
tail -f /tmp/webhook.log

# Stop server
pkill -f server.py
```

### Systemd Service (Linux VPS)

Create `/etc/systemd/system/telegram-webhook.service`:

```ini
[Unit]
Description=Telegram Webhook Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/project
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python scripts/telegram/server/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable telegram-webhook
sudo systemctl start telegram-webhook
sudo systemctl status telegram-webhook
```

## Security Considerations

1. **Chat ID Validation**: Server only processes messages from authorized CHAT_ID
2. **Token Cleanup**: Pending tokens are removed after processing
3. **HTTPS Required**: Telegram webhooks require HTTPS (use Replit or reverse proxy)
4. **Environment Variables**: Keep BOT_TOKEN secret, never commit to git
5. **File Permissions**: Ensure `.inbox/` and `.pending/` are not world-readable

## API Reference

### POST /telegram/webhook

Processes incoming Telegram messages.

**Request Body** (from Telegram):
```json
{
  "message": {
    "chat": {"id": 123456789},
    "text": "approve TOKEN_123"
  }
}
```

**Response Examples**:

Success (explicit token):
```json
{
  "status": "ok",
  "type": "decision",
  "token": "TOKEN_123",
  "decision": "approve"
}
```

Success (latest pending):
```json
{
  "status": "ok",
  "type": "decision",
  "token": "TOKEN_456",
  "decision": "reject",
  "note": "applied_to_latest_pending"
}
```

No pending requests:
```json
{
  "status": "no_pending",
  "message": "No pending requests to approve/reject"
}
```

Unauthorized:
```json
{
  "status": "unauthorized"
}
```

### GET /healthz

Simple health check endpoint.

**Response**: `ok` (status 200)

## Further Reading

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Webhook Best Practices](https://core.telegram.org/bots/webhooks)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review server logs for error details
3. Test components individually (notify.sh, await_reply.sh, webhook)
4. Verify webhook status with `getWebhookInfo`
