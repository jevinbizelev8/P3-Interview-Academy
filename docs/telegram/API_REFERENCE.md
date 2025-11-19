# Telegram Bot Controller - API Reference

Complete reference documentation for all scripts and components in the Telegram Bot Controller system.

## Table of Contents

- [Core Scripts](#core-scripts)
  - [notifyctl](#notifyctl)
  - [notify.sh](#notifysh)
  - [await_reply.sh](#await_replysh)
  - [init.sh](#initsh)
- [Webhook Server](#webhook-server)
  - [server.py](#serverpy)
- [Tools](#tools)
  - [webhook_register.sh](#webhook_registersh)
  - [monitor.sh](#monitorsh)
  - [cleanup.sh](#cleanupsh)
- [Environment Variables](#environment-variables)
- [Exit Codes](#exit-codes)
- [File Formats](#file-formats)

---

## Core Scripts

Located in `scripts/telegram/core/`

### notifyctl

Toggle the notification system on or off globally.

#### Synopsis

```bash
notifyctl <command>
```

#### Commands

| Command | Description |
|---------|-------------|
| `on` | Enable notifications |
| `off` | Disable notifications |
| `status` | Show current state |

#### Description

Controls the global notification state by creating/removing the flag file `/tmp/telegram_notify_enabled`. When notifications are disabled, `notify.sh` and `await_reply.sh` operate in silent mode.

**Silent Mode Behavior**:
- `notify.sh`: Echoes message to console only, no Telegram message sent
- `await_reply.sh`: Auto-approves immediately (exit 0) without waiting

#### Exit Codes

- `0` - Success
- `1` - Invalid command or error

#### Examples

```bash
# Enable notifications before starting work
notifyctl on

# Disable during focused work (no interruptions)
notifyctl off

# Check current state
notifyctl status
# Output: "Notifications enabled" or "Notifications disabled"
```

#### Implementation Details

```bash
#!/bin/bash
FLAG_FILE="/tmp/telegram_notify_enabled"

case "$1" in
  on)
    touch "$FLAG_FILE"
    echo "Notifications enabled"
    ;;
  off)
    rm -f "$FLAG_FILE"
    echo "Notifications disabled"
    ;;
  status)
    if [[ -f "$FLAG_FILE" ]]; then
      echo "Notifications enabled"
    else
      echo "Notifications disabled"
    fi
    ;;
  *)
    echo "Usage: notifyctl {on|off|status}"
    exit 1
    ;;
esac
```

#### Environment Variables

None required.

#### Error Handling

- Invalid commands display usage and exit 1
- File system errors (permissions) propagate as standard shell errors

---

### notify.sh

Send a notification message to Telegram.

#### Synopsis

```bash
notify.sh <message>
```

#### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `message` | Yes | Message text to send (supports Markdown) |

#### Description

Sends a one-way notification to the configured Telegram chat. Messages support Markdown formatting including:
- **Bold**: `**text**`
- *Italic*: `*text*`
- `Code`: `` `code` ``
- Code blocks: ` ```code block``` `

When notifications are disabled (via `notifyctl off`), messages are echoed to console only.

#### Exit Codes

- `0` - Success (message sent or silent mode)
- `1` - API call failed or missing parameters

#### Examples

**Basic notification**:
```bash
notify.sh "Deployment complete!"
```

**Markdown formatting**:
```bash
notify.sh "**Deployment complete**\n\nEnvironment: \`production\`\nDuration: 2m 34s"
```

**Multi-line with code block**:
```bash
notify.sh "Build succeeded:
\`\`\`
Build time: 1m 23s
Bundle size: 2.4MB
\`\`\`"
```

**In scripts**:
```bash
#!/bin/bash
npm run build
if [ $? -eq 0 ]; then
  notify.sh "Build completed successfully"
else
  notify.sh "Build failed - check logs"
fi
```

#### Implementation Details

```bash
#!/bin/bash
MESSAGE="$1"

if [[ -z "$MESSAGE" ]]; then
  echo "Usage: notify.sh <message>"
  exit 1
fi

# Check if notifications enabled
if [[ ! -f /tmp/telegram_notify_enabled ]]; then
  echo "[SILENT] $MESSAGE"
  exit 0
fi

# Send via Telegram API
RESPONSE=$(curl -s -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=Markdown")

# Check response
if echo "$RESPONSE" | grep -q '"ok":true'; then
  exit 0
else
  echo "Failed to send notification: $RESPONSE"
  exit 1
fi
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Target chat ID |

#### Error Handling

- Missing message: Display usage, exit 1
- API errors: Echo error response, exit 1
- Silent mode: No error, exit 0 with console echo
- Network errors: Standard curl error propagation

---

### await_reply.sh

Wait for user reply with approval/rejection logic.

#### Synopsis

```bash
await_reply.sh <question> [timeout] [token]
```

#### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `question` | Yes | - | Question to ask user |
| `timeout` | No | `300` | Timeout in seconds |
| `token` | No | - | Approval token for validation |

#### Description

Sends a question via Telegram and waits for user reply. Supports two modes:

**Token Mode** (when token provided):
- Requires exact match: `"approve <token>"`
- Example: User must reply `"approve a3f5"` for token `a3f5`
- Secure for critical operations

**Hybrid Mode** (no token):
- Accepts: `yes`, `approve`, `ok`, `y` (case-insensitive)
- Rejects: `no`, `reject`, `cancel`, or any other text
- Flexible for non-critical approvals

When notifications are disabled, immediately returns 0 (auto-approve) without waiting.

#### Exit Codes

- `0` - Approved (or auto-approved in silent mode)
- `1` - Rejected, timeout, or invalid token

#### Examples

**Basic approval (hybrid mode)**:
```bash
if await_reply.sh "Deploy to production?"; then
  echo "Approved - deploying..."
  npm run deploy:prod
else
  echo "Deployment cancelled"
  exit 1
fi
```

**With custom timeout**:
```bash
# Wait up to 10 minutes (600 seconds)
if await_reply.sh "Start database migration?" 600; then
  npm run db:migrate
fi
```

**Token-based approval**:
```bash
TOKEN=$(openssl rand -hex 4)
if await_reply.sh "Delete production data? Reply: approve $TOKEN" 300 "$TOKEN"; then
  echo "Confirmed with token - proceeding"
  ./scripts/dangerous-operation.sh
else
  echo "Invalid token or cancelled"
  exit 1
fi
```

**In CI/CD pipeline**:
```bash
#!/bin/bash
# .github/scripts/deploy-with-approval.sh

npm run build
npm run deploy:staging

# Wait for staging approval
if ! await_reply.sh "Staging looks good? Approve for production." 900; then
  echo "Production deployment cancelled"
  exit 1
fi

npm run deploy:production
notify.sh "Production deployment complete!"
```

**AWS deployment approval**:
```bash
#!/bin/bash
aws elasticbeanstalk create-application-version --application-name myapp --version-label v1.2.3

if await_reply.sh "Deploy v1.2.3 to production?" 600; then
  aws elasticbeanstalk update-environment --environment-name prod --version-label v1.2.3
  notify.sh "v1.2.3 deployed to production"
else
  notify.sh "Deployment cancelled - v1.2.3 not deployed"
fi
```

#### Implementation Details

```bash
#!/bin/bash
QUESTION="$1"
TIMEOUT="${2:-300}"
TOKEN="$3"

if [[ -z "$QUESTION" ]]; then
  echo "Usage: await_reply.sh <question> [timeout] [token]"
  exit 1
fi

# Check if notifications enabled
if [[ ! -f /tmp/telegram_notify_enabled ]]; then
  echo "[SILENT] Auto-approved: $QUESTION"
  exit 0
fi

# Send question
source notify.sh "$QUESTION"

# Create reply file
REPLY_DIR="/tmp/telegram_replies"
mkdir -p "$REPLY_DIR"
TIMESTAMP=$(date +%s)
TOKEN_SUFFIX="${TOKEN:-notok}"
REPLY_FILE="$REPLY_DIR/reply_${TIMESTAMP}_${TOKEN_SUFFIX}.txt"
touch "$REPLY_FILE"

# Wait for reply
START_TIME=$(date +%s)
while true; do
  # Check timeout
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))

  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "Timeout after ${TIMEOUT}s - no reply received"
    rm -f "$REPLY_FILE"
    exit 1
  fi

  # Check for reply
  if [[ -s "$REPLY_FILE" ]]; then
    REPLY=$(cat "$REPLY_FILE")
    rm -f "$REPLY_FILE"

    # Validate reply
    if [[ -n "$TOKEN" ]]; then
      # Token mode: require exact match
      if [[ "$REPLY" == "approve $TOKEN" ]]; then
        echo "Approved with token: $TOKEN"
        exit 0
      else
        echo "Invalid token or rejection. Expected: approve $TOKEN"
        exit 1
      fi
    else
      # Hybrid mode: fuzzy match
      if echo "$REPLY" | grep -iE "^(yes|approve|ok|y)$" > /dev/null; then
        echo "Approved: $REPLY"
        exit 0
      else
        echo "Rejected: $REPLY"
        exit 1
      fi
    fi
  fi

  sleep 2
done
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token (used by notify.sh) |
| `TELEGRAM_CHAT_ID` | Yes | Chat ID (used by notify.sh) |

#### Error Handling

- Missing question: Display usage, exit 1
- Timeout: Echo timeout message, exit 1
- Invalid token: Echo expected format, exit 1
- Silent mode: Auto-approve (exit 0)
- File system errors: Propagate as shell errors

#### Performance Notes

- Polling interval: 2 seconds
- CPU usage: Minimal (<0.1% on modern systems)
- File operations: 1 read per 2 seconds
- Network: None (only during initial notification send)

---

### init.sh

Initialize the Telegram bot system.

#### Synopsis

```bash
./scripts/telegram/core/init.sh
```

#### Parameters

None.

#### Description

Creates required directories and sets proper permissions for the notification system. Run once during initial setup or after system restart.

Creates:
- `/tmp/telegram_messages/` - Incoming message storage
- `/tmp/telegram_replies/` - Reply tracking files

Sets permissions to `700` (owner-only access) for security.

#### Exit Codes

- `0` - Success
- `1` - File system error (permissions issue)

#### Examples

**Initial setup**:
```bash
# Clone repository
git clone https://github.com/yourorg/p3-interview-academy
cd p3-interview-academy

# Initialize Telegram system
./scripts/telegram/core/init.sh

# Configure environment
cp .env.example .env
# ... edit .env with TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID ...
```

**After system restart**:
```bash
# /tmp/ is cleared on reboot, reinitialize
./scripts/telegram/core/init.sh
```

#### Implementation Details

```bash
#!/bin/bash

MESSAGE_DIR="/tmp/telegram_messages"
REPLY_DIR="/tmp/telegram_replies"

# Create directories
mkdir -p "$MESSAGE_DIR"
mkdir -p "$REPLY_DIR"

# Set permissions (owner-only)
chmod 700 "$MESSAGE_DIR"
chmod 700 "$REPLY_DIR"

echo "Telegram bot system initialized"
echo "  Message directory: $MESSAGE_DIR"
echo "  Reply directory: $REPLY_DIR"
```

#### Environment Variables

None required.

#### Error Handling

- Permission errors: Standard shell error propagation
- Existing directories: No error, idempotent operation

---

## Webhook Server

Located in `scripts/telegram/server/`

### server.py

Flask webhook server for receiving Telegram messages.

#### Synopsis

```bash
python3 scripts/telegram/server/server.py
```

#### Description

HTTP server that receives webhook POSTs from Telegram API. Validates incoming messages and writes them to the file system for processing by core scripts.

**Endpoints**:
- `POST /webhook` - Receive Telegram messages
- `GET /health` - Health check

#### Parameters

None (configured via environment variables).

#### Routes

##### POST /webhook

Receives incoming Telegram messages.

**Request Body** (JSON):
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 987654321,
      "first_name": "John"
    },
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "date": 1730000000,
    "text": "approve a3f5"
  }
}
```

**Response** (JSON):
```json
{
  "ok": true
}
```

**Error Responses**:
- `400 Bad Request` - Missing message field
- `403 Forbidden` - Unauthorized chat ID

**Behavior**:
1. Extract `chat_id` and `text` from message
2. Validate `chat_id == TELEGRAM_CHAT_ID`
3. Write message to `/tmp/telegram_messages/msg_<timestamp>.txt`
4. Check for pending reply files and populate if found
5. Return success

##### GET /health

Health check endpoint.

**Response** (JSON):
```json
{
  "status": "ok",
  "service": "telegram-webhook"
}
```

#### Examples

**Run server locally (development)**:
```bash
export TELEGRAM_BOT_TOKEN="123456:ABC..."
export TELEGRAM_CHAT_ID="987654321"
python3 scripts/telegram/server/server.py
# Server running on http://0.0.0.0:5000
```

**Run in Replit**:
1. Create new Python Repl
2. Upload `server.py`
3. Configure Secrets (environment variables)
4. Click "Run" - server starts automatically

**Test health endpoint**:
```bash
curl http://localhost:5000/health
# {"status":"ok","service":"telegram-webhook"}
```

**Test webhook locally** (requires ngrok or similar):
```bash
# Terminal 1: Run server
python3 server.py

# Terminal 2: Expose via ngrok
ngrok http 5000
# Note the HTTPS URL: https://abc123.ngrok.io

# Terminal 3: Register webhook
export TELEGRAM_WEBHOOK_URL="https://abc123.ngrok.io"
./scripts/telegram/tools/webhook_register.sh

# Send a test message to your bot
# Check server logs for incoming POST
```

#### Implementation Details

```python
from flask import Flask, request, jsonify
import os
import time
import glob

app = Flask(__name__)

# Configuration
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')
MESSAGE_DIR = os.environ.get('TELEGRAM_STATE_DIR', '/tmp/telegram_messages')
REPLY_DIR = os.environ.get('TELEGRAM_REPLY_DIR', '/tmp/telegram_replies')

@app.route('/webhook', methods=['POST'])
def webhook():
    """Receive Telegram webhook POST"""
    data = request.json

    # Validate request
    if 'message' not in data:
        return jsonify({'ok': False, 'error': 'no_message'}), 400

    message = data['message']
    chat_id = str(message['chat']['id'])
    text = message.get('text', '')

    # Validate chat ID
    if chat_id != TELEGRAM_CHAT_ID:
        app.logger.warning(f"Unauthorized chat_id: {chat_id}")
        return jsonify({'ok': False, 'error': 'unauthorized'}), 403

    # Write message to file
    timestamp = int(time.time())
    msg_file = f"{MESSAGE_DIR}/msg_{timestamp}.txt"

    with open(msg_file, 'w') as f:
        f.write(text)

    app.logger.info(f"Message received: {text[:50]}")

    # Process potential approval replies
    process_approval_reply(text)

    return jsonify({'ok': True})

def process_approval_reply(text):
    """Check if message matches any pending reply files"""
    reply_files = glob.glob(f"{REPLY_DIR}/reply_*.txt")

    for reply_file in reply_files:
        # Check if file is empty (waiting for reply)
        if os.path.getsize(reply_file) == 0:
            # Write reply
            with open(reply_file, 'w') as f:
                f.write(text.strip())
            app.logger.info(f"Reply written to {reply_file}")
            break  # Only match first pending reply

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'telegram-webhook'
    })

if __name__ == '__main__':
    # Create directories if needed
    os.makedirs(MESSAGE_DIR, exist_ok=True)
    os.makedirs(REPLY_DIR, exist_ok=True)

    # Run server
    app.run(host='0.0.0.0', port=5000, debug=False)
```

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_CHAT_ID` | Yes | - | Authorized chat ID |
| `TELEGRAM_STATE_DIR` | No | `/tmp/telegram_messages` | Message directory |
| `TELEGRAM_REPLY_DIR` | No | `/tmp/telegram_replies` | Reply directory |

#### Dependencies

Create `requirements.txt`:
```
Flask==3.0.0
```

Install:
```bash
pip install -r scripts/telegram/server/requirements.txt
```

#### Error Handling

- Missing environment variables: Server starts but webhooks fail with 500
- Invalid JSON: Flask returns 400 automatically
- Unauthorized chat ID: Returns 403 with error message
- File system errors: Logged but not returned to client

#### Logging

Server logs to stdout:
```
INFO: Message received: approve a3f5
WARNING: Unauthorized chat_id: 111111111
INFO: Reply written to /tmp/telegram_replies/reply_1730000100_a3f5.txt
```

---

## Tools

Located in `scripts/telegram/tools/`

### webhook_register.sh

Register webhook URL with Telegram API.

#### Synopsis

```bash
./scripts/telegram/tools/webhook_register.sh
```

#### Parameters

None (uses environment variables).

#### Description

Registers the webhook URL with Telegram's servers. After registration, Telegram will send all incoming messages to the configured endpoint.

Must be run after:
- Starting the webhook server
- Changing the webhook URL
- Bot token rotation

#### Exit Codes

- `0` - Success
- `1` - API error or missing environment variables

#### Examples

**Initial registration**:
```bash
export TELEGRAM_WEBHOOK_URL="https://your-replit.repl.co"
./scripts/telegram/tools/webhook_register.sh
```

**Verify registration**:
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

**Remove webhook** (for local testing without webhook):
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```

#### Implementation Details

```bash
#!/bin/bash

if [[ -z "$TELEGRAM_WEBHOOK_URL" ]]; then
  echo "Error: TELEGRAM_WEBHOOK_URL not set"
  exit 1
fi

WEBHOOK_ENDPOINT="${TELEGRAM_WEBHOOK_URL}/webhook"

RESPONSE=$(curl -s -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_ENDPOINT}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "Webhook registered successfully"
  echo "URL: $WEBHOOK_ENDPOINT"
  exit 0
else
  echo "Failed to register webhook"
  echo "Response: $RESPONSE"
  exit 1
fi
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_WEBHOOK_URL` | Yes | Public URL (without /webhook path) |

#### Error Handling

- Missing environment variables: Error message, exit 1
- API errors: Display response, exit 1
- Network errors: Standard curl error propagation

---

### monitor.sh

View system status and recent messages.

#### Synopsis

```bash
./scripts/telegram/tools/monitor.sh
```

#### Parameters

None.

#### Description

Displays:
- Current notification state (enabled/disabled)
- Recent message files
- Pending reply files

Useful for debugging and monitoring the system.

#### Exit Codes

- `0` - Success

#### Examples

**View system status**:
```bash
./scripts/telegram/tools/monitor.sh
```

**Output**:
```
=== Notification Status ===
Notifications enabled

=== Recent Messages ===
total 8
-rw------- 1 user user 12 Nov  1 10:23 msg_1730000220.txt
-rw------- 1 user user 15 Nov  1 10:20 msg_1730000200.txt

=== Pending Replies ===
total 0
-rw------- 1 user user  0 Nov  1 10:25 reply_1730000300_a3f5.txt
```

**Watch in real-time**:
```bash
watch -n 2 ./scripts/telegram/tools/monitor.sh
```

#### Implementation Details

```bash
#!/bin/bash

echo "=== Notification Status ==="
./scripts/telegram/core/notifyctl status

echo -e "\n=== Recent Messages ==="
ls -lht /tmp/telegram_messages/ | head -10

echo -e "\n=== Pending Replies ==="
ls -lht /tmp/telegram_replies/ | head -10

echo -e "\n=== Reply File Contents ==="
for file in /tmp/telegram_replies/reply_*.txt; do
  if [[ -f "$file" ]]; then
    echo "File: $(basename "$file")"
    if [[ -s "$file" ]]; then
      echo "Content: $(cat "$file")"
    else
      echo "Content: (waiting for reply)"
    fi
    echo "---"
  fi
done
```

#### Environment Variables

None required.

#### Error Handling

- Missing directories: Shows empty listings
- No permissions: Standard ls error messages

---

### cleanup.sh

Remove stale message and reply files.

#### Synopsis

```bash
./scripts/telegram/tools/cleanup.sh [age_minutes]
```

#### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `age_minutes` | No | `60` | Delete files older than this |

#### Description

Deletes old message and reply files to prevent disk usage buildup. Safe to run repeatedly (idempotent).

**Recommended Schedule**:
- Manually: After long sessions
- Cron: Every hour
- Systemd timer: Every 30 minutes

#### Exit Codes

- `0` - Success

#### Examples

**Default cleanup (60 minutes)**:
```bash
./scripts/telegram/tools/cleanup.sh
```

**Custom age (24 hours)**:
```bash
./scripts/telegram/tools/cleanup.sh 1440
```

**Cron schedule** (every hour):
```bash
# Add to crontab
0 * * * * /path/to/scripts/telegram/tools/cleanup.sh
```

**Aggressive cleanup (10 minutes)**:
```bash
./scripts/telegram/tools/cleanup.sh 10
```

#### Implementation Details

```bash
#!/bin/bash

AGE_MINUTES="${1:-60}"

MESSAGE_DIR="/tmp/telegram_messages"
REPLY_DIR="/tmp/telegram_replies"

echo "Cleaning up files older than ${AGE_MINUTES} minutes..."

# Remove old message files
DELETED_MESSAGES=$(find "$MESSAGE_DIR" -type f -mmin "+${AGE_MINUTES}" -delete -print | wc -l)

# Remove old reply files
DELETED_REPLIES=$(find "$REPLY_DIR" -type f -mmin "+${AGE_MINUTES}" -delete -print | wc -l)

echo "Deleted: $DELETED_MESSAGES messages, $DELETED_REPLIES replies"
```

#### Environment Variables

None required.

#### Error Handling

- Missing directories: find returns 0 (no files deleted)
- No permissions: find displays error but continues

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID` | Your numeric chat ID | `987654321` |
| `TELEGRAM_WEBHOOK_URL` | Public webhook URL (no /webhook suffix) | `https://myapp.repl.co` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_STATE_DIR` | `/tmp/telegram_messages` | Message storage directory |
| `TELEGRAM_REPLY_DIR` | `/tmp/telegram_replies` | Reply tracking directory |

### Configuration

**`.env` file** (recommended):
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
TELEGRAM_CHAT_ID="987654321"
TELEGRAM_WEBHOOK_URL="https://your-replit.repl.co"
```

**Export in shell**:
```bash
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_CHAT_ID="..."
export TELEGRAM_WEBHOOK_URL="..."
```

**Load from .env**:
```bash
source .env
```

---

## Exit Codes

Standard exit codes used across all scripts:

| Code | Meaning | Example Scenarios |
|------|---------|-------------------|
| `0` | Success | Message sent, approval granted, command completed |
| `1` | Error/Failure | Timeout, rejection, invalid parameters, API error |

**Specific Contexts**:

- `notify.sh` returns `0` even in silent mode (no error)
- `await_reply.sh` returns `0` for approval, `1` for rejection/timeout
- `notifyctl status` returns `0` regardless of enabled/disabled state

---

## File Formats

### Message Files

**Location**: `/tmp/telegram_messages/msg_<timestamp>.txt`

**Format**: Plain text (UTF-8)

**Example**:
```
approve a3f5
```

**Lifecycle**:
1. Created by `server.py` on webhook POST
2. Not actively consumed by core scripts (audit trail only)
3. Deleted by `cleanup.sh` after 60 minutes

### Reply Files

**Location**: `/tmp/telegram_replies/reply_<timestamp>_<token>.txt`

**Naming**:
- `reply_1730000100_a3f5.txt` - With token `a3f5`
- `reply_1730000200_notok.txt` - Without token

**Format**: Plain text (UTF-8), initially empty

**Example** (after user reply):
```
approve a3f5
```

**Lifecycle**:
1. Created empty by `await_reply.sh`
2. Populated by `server.py` when matching message arrives
3. Read and deleted immediately by `await_reply.sh`
4. Deleted by `cleanup.sh` if stale (60+ minutes)

### State Files

**Notification Enabled Flag**: `/tmp/telegram_notify_enabled`

**Format**: Empty file (presence indicates enabled)

**Lifecycle**:
- Created by `notifyctl on`
- Deleted by `notifyctl off`
- Checked by `notify.sh` and `await_reply.sh`

---

## Integration Patterns

### Shell Script Integration

```bash
#!/bin/bash
source scripts/telegram/core/notify.sh
source scripts/telegram/core/await_reply.sh

# Your script logic
notify.sh "Task starting..."

if await_reply.sh "Proceed with step 2?" 300; then
  # Approved
  notify.sh "Step 2 complete"
else
  # Rejected
  notify.sh "Step 2 skipped"
fi
```

### npm Scripts Integration

```json
{
  "scripts": {
    "deploy": "npm run build && scripts/deploy-with-notification.sh",
    "migrate": "scripts/telegram/integrations/db-migrate.sh"
  }
}
```

### CI/CD Integration (GitHub Actions)

```yaml
- name: Deploy with approval
  run: |
    source .env
    if ./scripts/telegram/core/await_reply.sh "Deploy?" 600; then
      npm run deploy
    else
      exit 1
    fi
```

### Python Integration

```python
import subprocess
import os

def notify(message):
    subprocess.run([
        './scripts/telegram/core/notify.sh',
        message
    ], check=True)

def await_approval(question, timeout=300):
    result = subprocess.run([
        './scripts/telegram/core/await_reply.sh',
        question,
        str(timeout)
    ])
    return result.returncode == 0

# Usage
notify("Python task starting...")
if await_approval("Continue?"):
    print("Approved!")
```

---

## Advanced Usage

### Chained Approvals

```bash
#!/bin/bash
# Multi-stage deployment with approvals

notify.sh "Deployment starting - 3 stages"

if ! await_reply.sh "Stage 1: Build?" 300; then
  exit 1
fi
npm run build

if ! await_reply.sh "Stage 2: Deploy to staging?" 300; then
  exit 1
fi
npm run deploy:staging

TOKEN=$(openssl rand -hex 6)
if ! await_reply.sh "Stage 3: Deploy to production? Reply: approve $TOKEN" 600 "$TOKEN"; then
  notify.sh "Production deployment cancelled"
  exit 1
fi
npm run deploy:production

notify.sh "All stages complete!"
```

### Conditional Notifications

```bash
#!/bin/bash
# Only notify on errors

if ! npm run test; then
  notify.sh "Tests failed - check logs"
  exit 1
fi

# Success - no notification
```

### Timeout Strategies

```bash
#!/bin/bash
# Different timeouts for different operations

# Quick approval (5 minutes)
await_reply.sh "Small change - approve?" 300

# Long approval (30 minutes)
await_reply.sh "Major migration - review required" 1800

# Very long (4 hours - for overnight tasks)
await_reply.sh "Batch job complete - review results?" 14400
```

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
