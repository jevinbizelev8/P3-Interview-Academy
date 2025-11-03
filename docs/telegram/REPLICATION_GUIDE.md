# Telegram Bot Controller - Replication Guide

**Complete guide for deploying the Telegram Bot Controller system to NEW projects**

This is the master replication document. Use this guide to set up the Telegram Bot Controller in any project that needs Claude Code integration with Telegram notifications and approval gates.

---

## Table of Contents

- [Section 1: Creating a New Telegram Bot](#section-1-creating-a-new-telegram-bot)
- [Section 2: Quick Setup for New Projects (5-Minute Version)](#section-2-quick-setup-for-new-projects-5-minute-version)
- [Section 3: Detailed Setup for New Projects](#section-3-detailed-setup-for-new-projects)
- [Section 4: Multi-Bot Management](#section-4-multi-bot-management)
- [Section 5: Platform-Specific Guides](#section-5-platform-specific-guides)
- [Section 6: Customization Guide](#section-6-customization-guide)
- [Section 7: Migration from Other Systems](#section-7-migration-from-other-systems)

---

## Section 1: Creating a New Telegram Bot

### Step 1: Open Telegram and Find @BotFather

1. **Open Telegram** on your phone, desktop, or web browser
2. **Search for `@BotFather`** in the search bar
3. **Start a conversation** by clicking "Start" or sending `/start`

**Screenshot location**: You'll see a blue checkmark next to @BotFather indicating it's the official bot creator

### Step 2: Create Your Bot

1. **Send the command**: `/newbot`
2. **BotFather will ask for a name**:
   - Enter a friendly name (e.g., "P3 Deploy Bot", "MyProject Notifier")
   - This is what users see in their contact list
3. **BotFather will ask for a username**:
   - Must end in `bot` (e.g., `p3_deploy_bot`, `myproject_notifier_bot`)
   - Must be unique across all of Telegram
   - Cannot contain spaces or special characters (use underscores)

**Example conversation**:
```
You: /newbot
BotFather: Alright, a new bot. How are we going to call it? Please choose a name for your bot.
You: MyProject Notifier
BotFather: Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
You: myproject_notifier_bot
BotFather: Done! Congratulations on your new bot. You will find it at t.me/myproject_notifier_bot. You can now add a description, about section and profile picture for your bot, see /help for a list of commands.

Use this token to access the HTTP API:
123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890

For a description of the Bot API, see this page: https://core.telegram.org/bots/api
```

### Step 3: Save Your Bot Token

**CRITICAL**: Copy the token immediately and save it securely.

**Token format**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890`
- Numbers before colon: Bot ID
- After colon: Secret key (never share this!)

**Security best practices**:
- ✅ Save to password manager (1Password, LastPass, Bitwarden)
- ✅ Save to `.env` file (add `.env` to `.gitignore`)
- ✅ Save to Replit Secrets (if using Replit)
- ❌ Never commit to git
- ❌ Never share in public channels
- ❌ Never paste in screenshots

### Step 4: Start a Conversation with Your Bot

1. **Click the link** provided by BotFather (e.g., `t.me/myproject_notifier_bot`)
2. **Click "Start"** or send `/start` to your bot
3. **Send a test message** like "Hello" or "Test"

**Why this matters**: Your bot needs to know your chat ID. Starting the conversation establishes the connection.

### Step 5: Get Your Chat ID

You need your **numeric chat ID** to configure the bot. There are 3 methods:

#### Method 1: Browser API (Easiest)

1. **Open this URL** in your browser (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```

2. **Look for the response**:
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 987654321,  ← YOUR CHAT ID
             "is_bot": false,
             "first_name": "John"
           },
           "chat": {
             "id": 987654321,  ← YOUR CHAT ID
             "first_name": "John",
             "type": "private"
           },
           "date": 1730000000,
           "text": "Hello"
         }
       }
     ]
   }
   ```

3. **Copy the `chat.id` number** (e.g., `987654321`)

**If you see an empty result `[]`**: Send a new message to your bot and refresh the page.

#### Method 2: Helper Bot (Simplest)

1. **Search for `@userinfobot`** in Telegram
2. **Start the bot** and send any message
3. **Copy the ID** from the response:
   ```
   Your ID: 987654321
   ```

**Note**: This gives you YOUR user ID, which is the same as your private chat ID with any bot.

#### Method 3: Script Method (For Advanced Users)

**Create a script** `get-chat-id.sh`:
```bash
#!/bin/bash
BOT_TOKEN="123456789:ABCdefGHI..."  # Your bot token

# Send yourself a test message via the bot
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Test"

# Get updates
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | \
  python3 -m json.tool | \
  grep -A 5 '"chat"' | \
  grep '"id"' | \
  head -1
```

**Run it**:
```bash
chmod +x get-chat-id.sh
./get-chat-id.sh
```

#### Method 4: Node.js Script (For JavaScript Projects)

**Create `get-chat-id.js`**:
```javascript
const fetch = require('node-fetch');

const BOT_TOKEN = '123456789:ABCdefGHI...'; // Your bot token

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`)
  .then(res => res.json())
  .then(data => {
    if (data.result.length > 0) {
      const chatId = data.result[0].message.chat.id;
      console.log(`Your Chat ID: ${chatId}`);
    } else {
      console.log('No messages found. Send a message to your bot first!');
    }
  });
```

**Run it**:
```bash
node get-chat-id.js
```

### Step 6: Configure Bot Settings (Optional)

**Recommended configuration** via @BotFather:

1. **Set description** (shown in bot profile):
   ```
   /setdescription
   Select your bot
   Enter: "Deployment notifications and approval gates for MyProject"
   ```

2. **Set about text** (shown when starting the bot):
   ```
   /setabouttext
   Select your bot
   Enter: "Automated notifications from MyProject. Do not share this bot token!"
   ```

3. **Set profile picture**:
   ```
   /setuserpic
   Select your bot
   Upload an image (PNG, 512x512 recommended)
   ```

4. **Disable group mode** (security):
   ```
   /setjoingroups
   Select your bot
   Select "Disable"
   ```
   **Why**: Prevents accidental addition to group chats

5. **Disable inline mode** (not needed):
   ```
   /setinline
   Select your bot
   Select "Disable"
   ```

### Step 7: Test Your Bot Token

**Verify the token works**:

```bash
# Method 1: curl
curl "https://api.telegram.org/bot123456789:ABCdefGHI.../getMe"

# Expected response:
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "MyProject Notifier",
    "username": "myproject_notifier_bot"
  }
}

# Method 2: Send a test message
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHI.../sendMessage" \
  -d "chat_id=987654321" \
  -d "text=Test message from curl"
```

**If you get errors**:
- `Unauthorized`: Token is incorrect, regenerate with @BotFather
- `Bad Request`: Check your chat ID format (numbers only, no quotes in curl)
- `Connection refused`: Check your internet connection

### Step 8: Security Considerations

**Token security checklist**:
- [ ] Token saved to password manager
- [ ] `.env` file added to `.gitignore`
- [ ] Never committed token to git repository
- [ ] Team members have separate tokens (don't share)
- [ ] Bot disabled from joining groups
- [ ] Chat ID validation enabled in webhook server

**If token is compromised**:
1. Message @BotFather
2. Send `/revoke` and select your bot
3. Generate new token with `/token`
4. Update `.env` and Replit Secrets immediately

**Best practice**: Rotate tokens every 90 days for production bots.

---

## Section 2: Quick Setup for New Projects (5-Minute Version)

**Prerequisites checklist**:
- [ ] Telegram bot created (token and chat ID ready)
- [ ] Replit account created (free tier is fine)
- [ ] Node.js project initialized (or any project with shell access)
- [ ] Git repository initialized

### Step 1: Copy Template Files

**From the P3 Interview Academy template repository** (or your source project):

```bash
# In your new project directory
mkdir -p scripts/telegram/{core,server,tools,integrations}
mkdir -p docs/telegram

# Copy core scripts
cp /path/to/template/scripts/telegram/core/* scripts/telegram/core/
cp /path/to/template/scripts/telegram/server/* scripts/telegram/server/
cp /path/to/template/scripts/telegram/tools/* scripts/telegram/tools/

# Copy documentation
cp /path/to/template/docs/telegram/* docs/telegram/
```

**Or clone from GitHub** (if available):
```bash
# Clone template repo to temporary directory
git clone https://github.com/yourorg/telegram-bot-template /tmp/telegram-template

# Copy files
cp -r /tmp/telegram-template/scripts/telegram scripts/
cp -r /tmp/telegram-template/docs/telegram docs/

# Clean up
rm -rf /tmp/telegram-template
```

### Step 2: Set Environment Variables

**Create `.env` file**:
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHI..."  # Your bot token
TELEGRAM_CHAT_ID="987654321"                # Your chat ID
TELEGRAM_WEBHOOK_URL="https://your-replit-name.repl.co"  # From Step 4
```

**Add to `.gitignore`**:
```bash
echo ".env" >> .gitignore
```

### Step 3: Set Up Replit Webhook Server

1. **Go to [replit.com](https://replit.com)**
2. **Click "Create Repl"**
3. **Select "Python"** template
4. **Name it**: `myproject-telegram-bot` (or similar)
5. **Click "Create Repl"**

**In Replit**:

6. **Upload `server.py`**:
   - Click the "Upload file" icon in the Files panel
   - Select `scripts/telegram/server/server.py` from your local project
   - Or copy-paste the content (see detailed guide for full code)

7. **Create `requirements.txt`**:
   ```
   Flask==3.0.0
   ```

8. **Configure Secrets** (left sidebar → Secrets/Environment):
   - Key: `TELEGRAM_BOT_TOKEN` → Value: Your bot token
   - Key: `TELEGRAM_CHAT_ID` → Value: Your chat ID

9. **Click "Run"** - Server starts on port 5000

10. **Copy the Replit URL**:
    - Look for: `https://myproject-telegram-bot.username.repl.co`
    - Update `TELEGRAM_WEBHOOK_URL` in your local `.env` file

### Step 4: Initialize and Register Webhook

**In your local project terminal**:

```bash
# 1. Initialize directories
./scripts/telegram/core/init.sh

# 2. Make scripts executable
chmod +x scripts/telegram/core/*
chmod +x scripts/telegram/tools/*

# 3. Load environment variables
source .env

# 4. Register webhook with Telegram
./scripts/telegram/tools/webhook_register.sh

# Expected output:
# Webhook registered successfully
# URL: https://myproject-telegram-bot.username.repl.co/webhook
```

### Step 5: Enable Notifications

```bash
# Enable notifications
notifyctl on

# Verify status
notifyctl status
# Output: Notifications enabled
```

### Step 6: Test the System

**Test 1: Send a notification**:
```bash
notify.sh "Test notification - system is working!"
```

**Check your Telegram**: You should receive the message

**Test 2: Test approval gate**:
```bash
# In terminal
await_reply.sh "Test approval - please reply 'yes'" 60

# In Telegram: Type "yes" and send
# Terminal should show: "Approved: yes" and exit 0
```

**Test 3: Test token approval**:
```bash
# In terminal
await_reply.sh "Test token - reply: approve abc123" 60 "abc123"

# In Telegram: Type "approve abc123" and send
# Terminal should show: "Approved with token: abc123"
```

### Step 7: Add to PATH (Optional)

**For easier access**:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:/path/to/your/project/scripts/telegram/core"

# Reload shell
source ~/.bashrc

# Now you can use from anywhere:
notify.sh "Message from any directory"
```

### Verification Checklist

After setup, verify everything works:

- [ ] `notifyctl status` shows "Notifications enabled"
- [ ] `notify.sh "test"` sends a message to Telegram
- [ ] `await_reply.sh "test" 30` waits for your reply
- [ ] Webhook server is running on Replit (check logs)
- [ ] `curl https://your-replit.repl.co/health` returns `{"status":"ok"}`

**If any step fails**, see Section 3 for detailed troubleshooting or check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Section 3: Detailed Setup for New Projects

### 3.1: Project Structure Setup

**Create the complete directory structure**:

```bash
# Navigate to your project root
cd /path/to/your/project

# Create directories
mkdir -p scripts/telegram/core
mkdir -p scripts/telegram/server
mkdir -p scripts/telegram/tools
mkdir -p scripts/telegram/integrations
mkdir -p docs/telegram

# Verify structure
tree scripts/telegram
```

**Expected structure**:
```
scripts/telegram/
├── core/
│   ├── notifyctl         # Toggle notifications on/off
│   ├── notify.sh         # Send notifications
│   ├── await_reply.sh    # Wait for user replies
│   └── init.sh           # Initialize system
├── server/
│   ├── server.py         # Flask webhook server
│   └── requirements.txt  # Python dependencies
├── tools/
│   ├── webhook_register.sh   # Register webhook
│   ├── monitor.sh            # System monitoring
│   └── cleanup.sh            # File cleanup
└── integrations/         # Project-specific integrations (optional)
    ├── aws-deploy.sh     # Example: AWS deployment with approval
    ├── db-migrate.sh     # Example: Database migration approval
    └── gemini-notify.sh  # Example: Gemini research notifications

docs/telegram/
├── README.md             # Overview and quick start
├── ARCHITECTURE.md       # System design
├── API_REFERENCE.md      # Script reference
├── TROUBLESHOOTING.md    # Common issues
├── REPLICATION_GUIDE.md  # This file
├── SETUP_GUIDE.md        # Project-specific setup
└── INTEGRATION_EXAMPLES.md  # Real-world examples
```

### 3.2: Core Scripts Setup

#### File 1: `scripts/telegram/core/notifyctl`

```bash
#!/bin/bash
# notifyctl - Toggle notification system on/off

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
      exit 0
    else
      echo "Notifications disabled"
      exit 1
    fi
    ;;
  *)
    echo "Usage: notifyctl {on|off|status}"
    exit 1
    ;;
esac
```

**Make executable**:
```bash
chmod +x scripts/telegram/core/notifyctl
```

#### File 2: `scripts/telegram/core/notify.sh`

```bash
#!/bin/bash
# notify.sh - Send notification to Telegram

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

# Load environment variables if not already loaded
if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
  if [[ -f .env ]]; then
    source .env
  else
    echo "Error: TELEGRAM_BOT_TOKEN not set and .env not found"
    exit 1
  fi
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

**Make executable**:
```bash
chmod +x scripts/telegram/core/notify.sh
```

#### File 3: `scripts/telegram/core/await_reply.sh`

```bash
#!/bin/bash
# await_reply.sh - Wait for user reply with approval logic

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

# Load environment variables if not already loaded
if [[ -z "$TELEGRAM_BOT_TOKEN" ]] && [[ -f .env ]]; then
  source .env
fi

# Send question
source "$(dirname "$0")/notify.sh" "❓ $QUESTION"

# Create reply file
REPLY_DIR="/tmp/telegram_replies"
mkdir -p "$REPLY_DIR"
TIMESTAMP=$(date +%s)
TOKEN_SUFFIX="${TOKEN:-notok}"
REPLY_FILE="$REPLY_DIR/reply_${TIMESTAMP}_${TOKEN_SUFFIX}.txt"
touch "$REPLY_FILE"

echo "Waiting for reply (timeout: ${TIMEOUT}s)..."

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
        echo "✅ Approved with token: $TOKEN"
        exit 0
      else
        echo "❌ Invalid token or rejection. Expected: approve $TOKEN"
        exit 1
      fi
    else
      # Hybrid mode: fuzzy match
      if echo "$REPLY" | grep -iE "^(yes|approve|ok|y)$" > /dev/null; then
        echo "✅ Approved: $REPLY"
        exit 0
      else
        echo "❌ Rejected: $REPLY"
        exit 1
      fi
    fi
  fi

  sleep 2
done
```

**Make executable**:
```bash
chmod +x scripts/telegram/core/await_reply.sh
```

#### File 4: `scripts/telegram/core/init.sh`

```bash
#!/bin/bash
# init.sh - Initialize Telegram bot system

MESSAGE_DIR="/tmp/telegram_messages"
REPLY_DIR="/tmp/telegram_replies"

# Create directories
mkdir -p "$MESSAGE_DIR"
mkdir -p "$REPLY_DIR"

# Set permissions (owner-only)
chmod 700 "$MESSAGE_DIR"
chmod 700 "$REPLY_DIR"

echo "✅ Telegram bot system initialized"
echo "  Message directory: $MESSAGE_DIR"
echo "  Reply directory: $REPLY_DIR"
echo ""
echo "Next steps:"
echo "  1. Configure .env with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID"
echo "  2. Start webhook server on Replit"
echo "  3. Run: ./scripts/telegram/tools/webhook_register.sh"
echo "  4. Run: notifyctl on"
```

**Make executable**:
```bash
chmod +x scripts/telegram/core/init.sh
```

### 3.3: Webhook Server Setup

#### File 1: `scripts/telegram/server/server.py`

```python
#!/usr/bin/env python3
"""
Telegram Webhook Server
Receives incoming Telegram messages and writes them to file system
"""

from flask import Flask, request, jsonify
import os
import time
import glob
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')
MESSAGE_DIR = os.environ.get('TELEGRAM_STATE_DIR', '/tmp/telegram_messages')
REPLY_DIR = os.environ.get('TELEGRAM_REPLY_DIR', '/tmp/telegram_replies')

# Validate configuration
if not TELEGRAM_CHAT_ID:
    logger.error("TELEGRAM_CHAT_ID not set - webhook will reject all messages")

@app.route('/webhook', methods=['POST'])
def webhook():
    """Receive Telegram webhook POST"""
    try:
        data = request.json

        # Validate request structure
        if 'message' not in data:
            logger.warning("Webhook received POST without 'message' field")
            return jsonify({'ok': False, 'error': 'no_message'}), 400

        message = data['message']
        chat_id = str(message['chat']['id'])
        text = message.get('text', '')

        # Validate chat ID
        if chat_id != TELEGRAM_CHAT_ID:
            logger.warning(f"Unauthorized chat_id: {chat_id}")
            return jsonify({'ok': False, 'error': 'unauthorized'}), 403

        # Write message to file
        timestamp = int(time.time())
        msg_file = f"{MESSAGE_DIR}/msg_{timestamp}.txt"

        os.makedirs(MESSAGE_DIR, exist_ok=True)
        with open(msg_file, 'w') as f:
            f.write(text)

        logger.info(f"Message received: {text[:50]}{'...' if len(text) > 50 else ''}")

        # Process potential approval replies
        process_approval_reply(text)

        return jsonify({'ok': True})

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        return jsonify({'ok': False, 'error': 'internal_error'}), 500

def process_approval_reply(text):
    """Check if message matches any pending reply files"""
    try:
        reply_files = glob.glob(f"{REPLY_DIR}/reply_*.txt")

        for reply_file in reply_files:
            # Check if file is empty (waiting for reply)
            if os.path.exists(reply_file) and os.path.getsize(reply_file) == 0:
                # Write reply
                with open(reply_file, 'w') as f:
                    f.write(text.strip())
                logger.info(f"Reply written to {os.path.basename(reply_file)}")
                break  # Only match first pending reply

    except Exception as e:
        logger.error(f"Error processing approval reply: {e}", exc_info=True)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'telegram-webhook',
        'chat_id_configured': bool(TELEGRAM_CHAT_ID)
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'telegram-webhook-server',
        'status': 'running',
        'endpoints': {
            'webhook': 'POST /webhook',
            'health': 'GET /health'
        }
    })

if __name__ == '__main__':
    # Create directories if needed
    os.makedirs(MESSAGE_DIR, exist_ok=True)
    os.makedirs(REPLY_DIR, exist_ok=True)

    logger.info("Starting Telegram webhook server...")
    logger.info(f"Message directory: {MESSAGE_DIR}")
    logger.info(f"Reply directory: {REPLY_DIR}")
    logger.info(f"Authorized chat ID: {TELEGRAM_CHAT_ID}")

    # Run server
    app.run(host='0.0.0.0', port=5000, debug=False)
```

#### File 2: `scripts/telegram/server/requirements.txt`

```
Flask==3.0.0
Werkzeug==3.0.1
```

### 3.4: Tools Setup

#### File 1: `scripts/telegram/tools/webhook_register.sh`

```bash
#!/bin/bash
# webhook_register.sh - Register webhook with Telegram API

# Load environment if not already loaded
if [[ -z "$TELEGRAM_BOT_TOKEN" ]] && [[ -f .env ]]; then
  source .env
fi

if [[ -z "$TELEGRAM_WEBHOOK_URL" ]]; then
  echo "Error: TELEGRAM_WEBHOOK_URL not set"
  echo "Set it in .env file or export it:"
  echo "  export TELEGRAM_WEBHOOK_URL='https://your-replit.repl.co'"
  exit 1
fi

WEBHOOK_ENDPOINT="${TELEGRAM_WEBHOOK_URL}/webhook"

echo "Registering webhook..."
echo "URL: $WEBHOOK_ENDPOINT"

RESPONSE=$(curl -s -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_ENDPOINT}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✅ Webhook registered successfully"
  echo ""
  echo "Verify with:"
  echo "  curl 'https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo'"
  exit 0
else
  echo "❌ Failed to register webhook"
  echo "Response: $RESPONSE"
  exit 1
fi
```

**Make executable**:
```bash
chmod +x scripts/telegram/tools/webhook_register.sh
```

#### File 2: `scripts/telegram/tools/monitor.sh`

```bash
#!/bin/bash
# monitor.sh - View system status and recent messages

echo "=== Notification Status ==="
if [[ -x "$(dirname "$0")/../core/notifyctl" ]]; then
  "$(dirname "$0")/../core/notifyctl" status
else
  if [[ -f /tmp/telegram_notify_enabled ]]; then
    echo "Notifications enabled"
  else
    echo "Notifications disabled"
  fi
fi

echo ""
echo "=== Recent Messages ==="
if [[ -d /tmp/telegram_messages ]]; then
  ls -lht /tmp/telegram_messages/ | head -10
else
  echo "No message directory found"
fi

echo ""
echo "=== Pending Replies ==="
if [[ -d /tmp/telegram_replies ]]; then
  ls -lht /tmp/telegram_replies/ | head -10
else
  echo "No reply directory found"
fi

echo ""
echo "=== Reply File Contents ==="
for file in /tmp/telegram_replies/reply_*.txt 2>/dev/null; do
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

echo ""
echo "=== Webhook Server Status ==="
if [[ -n "$TELEGRAM_WEBHOOK_URL" ]]; then
  echo "Testing: ${TELEGRAM_WEBHOOK_URL}/health"
  curl -s "${TELEGRAM_WEBHOOK_URL}/health" | python3 -m json.tool 2>/dev/null || echo "Server unreachable"
else
  echo "TELEGRAM_WEBHOOK_URL not set"
fi
```

**Make executable**:
```bash
chmod +x scripts/telegram/tools/monitor.sh
```

#### File 3: `scripts/telegram/tools/cleanup.sh`

```bash
#!/bin/bash
# cleanup.sh - Remove stale message and reply files

AGE_MINUTES="${1:-60}"

MESSAGE_DIR="/tmp/telegram_messages"
REPLY_DIR="/tmp/telegram_replies"

echo "Cleaning up files older than ${AGE_MINUTES} minutes..."

# Remove old message files
if [[ -d "$MESSAGE_DIR" ]]; then
  DELETED_MESSAGES=$(find "$MESSAGE_DIR" -type f -mmin "+${AGE_MINUTES}" -delete -print 2>/dev/null | wc -l)
else
  DELETED_MESSAGES=0
fi

# Remove old reply files
if [[ -d "$REPLY_DIR" ]]; then
  DELETED_REPLIES=$(find "$REPLY_DIR" -type f -mmin "+${AGE_MINUTES}" -delete -print 2>/dev/null | wc -l)
else
  DELETED_REPLIES=0
fi

echo "✅ Cleanup complete"
echo "  Deleted: $DELETED_MESSAGES messages"
echo "  Deleted: $DELETED_REPLIES replies"
```

**Make executable**:
```bash
chmod +x scripts/telegram/tools/cleanup.sh
```

### 3.5: Environment Configuration

#### File: `.env` (Root of project)

```bash
# Telegram Bot Configuration
# DO NOT COMMIT THIS FILE - Add .env to .gitignore

# Bot token from @BotFather (format: 123456789:ABCdefGHI...)
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

# Your Telegram chat ID (numeric, e.g., 987654321)
TELEGRAM_CHAT_ID="YOUR_CHAT_ID_HERE"

# Webhook URL from Replit (no /webhook suffix)
TELEGRAM_WEBHOOK_URL="https://your-replit-name.username.repl.co"

# Optional: Custom state directories (defaults shown)
# TELEGRAM_STATE_DIR="/tmp/telegram_messages"
# TELEGRAM_REPLY_DIR="/tmp/telegram_replies"
```

#### Update `.gitignore`

Add to `.gitignore`:
```
# Telegram Bot - Sensitive credentials
.env
.env.local
.env.*.local

# Telegram Bot - Runtime state
/tmp/telegram_messages/
/tmp/telegram_replies/
```

### 3.6: Testing Your Setup

**Test suite** `scripts/telegram/test-system.sh`:

```bash
#!/bin/bash
# test-system.sh - Comprehensive system test

set -e

echo "=== Telegram Bot System Test Suite ==="
echo ""

# Test 1: Check files exist
echo "Test 1: Checking files..."
FILES=(
  "scripts/telegram/core/notifyctl"
  "scripts/telegram/core/notify.sh"
  "scripts/telegram/core/await_reply.sh"
  "scripts/telegram/core/init.sh"
)
for file in "${FILES[@]}"; do
  if [[ -x "$file" ]]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (missing or not executable)"
    exit 1
  fi
done

# Test 2: Check environment variables
echo ""
echo "Test 2: Checking environment variables..."
source .env
if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
  echo "  ✅ TELEGRAM_BOT_TOKEN set"
else
  echo "  ❌ TELEGRAM_BOT_TOKEN not set"
  exit 1
fi

if [[ -n "$TELEGRAM_CHAT_ID" ]]; then
  echo "  ✅ TELEGRAM_CHAT_ID set"
else
  echo "  ❌ TELEGRAM_CHAT_ID not set"
  exit 1
fi

if [[ -n "$TELEGRAM_WEBHOOK_URL" ]]; then
  echo "  ✅ TELEGRAM_WEBHOOK_URL set"
else
  echo "  ❌ TELEGRAM_WEBHOOK_URL not set"
  exit 1
fi

# Test 3: Check webhook server
echo ""
echo "Test 3: Checking webhook server..."
HEALTH_RESPONSE=$(curl -s "${TELEGRAM_WEBHOOK_URL}/health" || echo "FAILED")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "  ✅ Webhook server responding"
else
  echo "  ❌ Webhook server not responding"
  echo "  Response: $HEALTH_RESPONSE"
  exit 1
fi

# Test 4: Send test notification
echo ""
echo "Test 4: Sending test notification..."
if ./scripts/telegram/core/notifyctl on > /dev/null 2>&1; then
  echo "  ✅ Notifications enabled"
else
  echo "  ❌ Failed to enable notifications"
  exit 1
fi

if ./scripts/telegram/core/notify.sh "✅ Test notification from test suite"; then
  echo "  ✅ Test notification sent"
  echo "  Check your Telegram for the message"
else
  echo "  ❌ Failed to send notification"
  exit 1
fi

# Test 5: Verify webhook registration
echo ""
echo "Test 5: Verifying webhook registration..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
if echo "$WEBHOOK_INFO" | grep -q "$TELEGRAM_WEBHOOK_URL"; then
  echo "  ✅ Webhook registered correctly"
else
  echo "  ⚠️  Webhook not registered or URL mismatch"
  echo "  Run: ./scripts/telegram/tools/webhook_register.sh"
fi

echo ""
echo "=== All Tests Passed! ==="
echo ""
echo "Manual test:"
echo "  Run: await_reply.sh 'Test approval - reply yes' 30"
echo "  Then reply 'yes' in Telegram within 30 seconds"
```

**Make executable and run**:
```bash
chmod +x scripts/telegram/test-system.sh
./scripts/telegram/test-system.sh
```

---

## Section 4: Multi-Bot Management

### 4.1: Managing Multiple Environments

**Common scenario**: Separate bots for development, staging, and production.

#### Strategy 1: Multiple `.env` Files

**Create environment-specific files**:

```bash
# .env.development
TELEGRAM_BOT_TOKEN="123456:DEV_TOKEN..."
TELEGRAM_CHAT_ID="111111111"
TELEGRAM_WEBHOOK_URL="https://dev-bot.repl.co"

# .env.staging
TELEGRAM_BOT_TOKEN="234567:STAGING_TOKEN..."
TELEGRAM_CHAT_ID="222222222"
TELEGRAM_WEBHOOK_URL="https://staging-bot.repl.co"

# .env.production
TELEGRAM_BOT_TOKEN="345678:PROD_TOKEN..."
TELEGRAM_CHAT_ID="333333333"
TELEGRAM_WEBHOOK_URL="https://prod-bot.repl.co"
```

**Load specific environment**:

```bash
# Development
source .env.development
./scripts/telegram/tools/webhook_register.sh
notifyctl on

# Production
source .env.production
./scripts/telegram/tools/webhook_register.sh
notifyctl on
```

#### Strategy 2: Bot Naming Convention

**Recommended naming**:
- Development: `myproject_dev_bot`
- Staging: `myproject_staging_bot`
- Production: `myproject_prod_bot`
- Personal: `myproject_yourname_bot`

**Benefits**:
- Clear visual distinction in Telegram
- Easy to identify which environment
- Prevents accidental approvals in wrong environment

#### Strategy 3: Replit Organization

**Create separate Repls for each environment**:

1. **Development Repl**: `myproject-telegram-dev`
   - Secrets: DEV bot token and chat ID
   - Used by dev team daily

2. **Staging Repl**: `myproject-telegram-staging`
   - Secrets: STAGING bot token and chat ID
   - Used for pre-production testing

3. **Production Repl**: `myproject-telegram-prod`
   - Secrets: PROD bot token and chat ID
   - Used for production deployments only

**Team access control**:
- Development: All team members
- Staging: Senior developers + DevOps
- Production: DevOps + Team leads only

### 4.2: Multi-User Support

**Current limitation**: Single chat ID validation

**To support multiple users**:

#### Option 1: Shared Bot (Simple)

All team members use the **same bot and chat ID**:

**Pros**:
- Simple setup
- All notifications go to one person (deployment manager)
- Single point of approval

**Cons**:
- Only one person receives notifications
- No individual accountability

**Use case**: Small teams, single deployment manager

#### Option 2: Multiple Bots (Recommended)

Each team member has their **own bot**:

**Setup**:
```bash
# Alice's bot
TELEGRAM_BOT_TOKEN="111:ALICE_TOKEN"
TELEGRAM_CHAT_ID="111111111"  # Alice's chat ID

# Bob's bot
TELEGRAM_BOT_TOKEN="222:BOB_TOKEN"
TELEGRAM_CHAT_ID="222222222"  # Bob's chat ID
```

**Pros**:
- Individual notifications
- Personal approval workflows
- Clear accountability

**Cons**:
- Each person needs their own bot
- More configuration overhead

**Use case**: Medium teams, distributed responsibility

#### Option 3: Group Chat (Advanced - Requires Code Changes)

**Not currently supported** - requires modifying `server.py`:

```python
# Future enhancement: Support group chats
TELEGRAM_GROUP_ID = "-1001234567890"  # Group chat ID (negative number)

# In webhook():
if chat_id != TELEGRAM_CHAT_ID and chat_id != TELEGRAM_GROUP_ID:
    return jsonify({'ok': False}), 403
```

**To get group chat ID**:
1. Add bot to group
2. Send message in group
3. Check `getUpdates` for negative chat ID

### 4.3: Tracking Multiple Deployments

**Create a deployment registry**:

#### File: `docs/telegram/DEPLOYMENT_REGISTRY.md`

```markdown
# Telegram Bot Deployment Registry

## Active Deployments

| Environment | Bot Username | Bot Token (last 4) | Chat ID | Webhook URL | Owner |
|-------------|--------------|-------------------|---------|-------------|-------|
| Development | myproject_dev_bot | ...ew11 | 111111111 | https://dev-bot.repl.co | Team |
| Staging | myproject_staging_bot | ...ab22 | 222222222 | https://staging-bot.repl.co | DevOps |
| Production | myproject_prod_bot | ...cd33 | 333333333 | https://prod-bot.repl.co | Alice |
| Personal (Bob) | myproject_bob_bot | ...ef44 | 444444444 | https://bob-bot.repl.co | Bob |

## Token Rotation Schedule

| Bot | Last Rotated | Next Rotation | Status |
|-----|-------------|---------------|--------|
| Development | 2025-10-01 | 2026-01-01 | ✅ Active |
| Staging | 2025-10-15 | 2026-01-15 | ✅ Active |
| Production | 2025-11-01 | 2026-02-01 | ✅ Active |

## Emergency Contacts

- Token compromised: Revoke immediately via @BotFather
- Webhook issues: Check Replit server status
- Notification failures: Verify chat ID and token

Last Updated: 2025-11-01
```

---

## Section 5: Platform-Specific Guides

### 5.1: Replit Deployment (Recommended)

**Why Replit?**
- ✅ Free tier with persistent URL
- ✅ Automatic HTTPS
- ✅ Always-on hosting (with paid plan)
- ✅ Easy secrets management
- ✅ Web-based IDE (no local setup needed)

#### Step-by-Step Replit Setup

**1. Create Replit Account**
- Go to [replit.com](https://replit.com)
- Sign up with GitHub, Google, or email
- Free tier is sufficient for webhook server

**2. Create New Repl**
- Click "Create Repl"
- Template: "Python"
- Title: `myproject-telegram-webhook`
- Privacy: Private (recommended)
- Click "Create Repl"

**3. Upload Server Code**

In Replit, create `main.py` (copy content from `server.py`):

```python
# Paste the full server.py content here
# (See Section 3.3 for complete code)
```

**4. Create `requirements.txt`**

```
Flask==3.0.0
Werkzeug==3.0.1
```

**5. Configure Secrets**

Click "Secrets" (lock icon in sidebar):
- Add secret: `TELEGRAM_BOT_TOKEN` → Your bot token
- Add secret: `TELEGRAM_CHAT_ID` → Your chat ID

**6. Run the Repl**

- Click "Run" button
- Wait for "Starting Telegram webhook server..." message
- Copy the URL: `https://myproject-telegram-webhook.username.repl.co`

**7. Keep Repl Alive (Free Tier)**

**Problem**: Free Repls sleep after 1 hour of inactivity

**Solution 1**: UptimeRobot (Recommended)
- Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
- Add monitor: `https://your-repl.repl.co/health`
- Check interval: 5 minutes
- Monitor type: HTTP(s)

**Solution 2**: Replit Always-On ($7/month)
- In Repl settings, enable "Always On"
- Repl never sleeps

**Solution 3**: Cron Job (Self-Hosted)**
```bash
# On your server, add to crontab:
*/5 * * * * curl -s https://your-repl.repl.co/health > /dev/null
```

**8. Verify Deployment**

```bash
# Test health endpoint
curl https://your-repl.repl.co/health

# Expected response:
{"status":"ok","service":"telegram-webhook","chat_id_configured":true}
```

**9. Monitor Logs**

In Replit:
- Open "Console" tab
- Watch for incoming webhook POSTs
- Look for errors (unauthorized, connection issues)

**Replit-specific troubleshooting**:
- **"Error: Address already in use"**: Repl is already running, stop and restart
- **"ModuleNotFoundError: No module named 'flask'"**: Missing `requirements.txt`, create it
- **"Server unreachable"**: Check firewall, Repl might be sleeping
- **"Unauthorized chat_id"**: Check Secrets configuration

### 5.2: GitHub Actions Integration

**Use case**: Approval gates in CI/CD pipelines

#### Example Workflow: Deployment with Approval

**File**: `.github/workflows/deploy-with-approval.yml`

```yaml
name: Deploy with Telegram Approval

on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

env:
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/

      - name: Notify deployment start
        run: |
          chmod +x scripts/telegram/core/notify.sh
          ./scripts/telegram/core/notify.sh "🚀 Deploying to STAGING\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"

      - name: Deploy to staging
        run: npm run deploy:staging

      - name: Notify staging success
        run: |
          ./scripts/telegram/core/notify.sh "✅ Staging deployment complete\nURL: https://staging.example.com"

  approve-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Request production approval
        id: approval
        run: |
          chmod +x scripts/telegram/core/{notify.sh,await_reply.sh}

          # Generate secure token
          TOKEN=$(openssl rand -hex 6)
          echo "::set-output name=token::$TOKEN"

          # Wait for approval (15 minutes)
          if ./scripts/telegram/core/await_reply.sh \
            "🚨 PRODUCTION DEPLOYMENT\n\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}\n\nReply: approve $TOKEN" \
            900 \
            "$TOKEN"; then
            echo "approved=true" >> $GITHUB_OUTPUT
          else
            echo "approved=false" >> $GITHUB_OUTPUT
            exit 1
          fi

      - name: Approval result
        if: steps.approval.outputs.approved == 'true'
        run: |
          ./scripts/telegram/core/notify.sh "✅ Production deployment APPROVED"

  deploy-production:
    needs: approve-production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/

      - name: Deploy to production
        run: npm run deploy:production

      - name: Notify production success
        run: |
          chmod +x scripts/telegram/core/notify.sh
          ./scripts/telegram/core/notify.sh "🎉 PRODUCTION deployment complete\nURL: https://example.com\nCommit: ${{ github.sha }}"
```

**GitHub Secrets Configuration**:

1. Go to repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

**Important**: GitHub Actions runners need `notifyctl on` pre-configured, or use `touch /tmp/telegram_notify_enabled` in workflow.

### 5.3: Local Development Setup

**For testing without deploying to Replit**

#### Prerequisites
- Python 3.8+
- ngrok or similar tunneling tool

#### Setup Steps

**1. Install Python dependencies**:
```bash
cd scripts/telegram/server
pip install -r requirements.txt
```

**2. Start local server**:
```bash
export TELEGRAM_BOT_TOKEN="your_token"
export TELEGRAM_CHAT_ID="your_chat_id"
python3 server.py

# Server runs on http://localhost:5000
```

**3. Expose via ngrok**:
```bash
# In another terminal
ngrok http 5000

# Copy HTTPS URL: https://abc123.ngrok.io
```

**4. Register webhook**:
```bash
export TELEGRAM_WEBHOOK_URL="https://abc123.ngrok.io"
./scripts/telegram/tools/webhook_register.sh
```

**5. Test**:
```bash
# Enable notifications
notifyctl on

# Send test message
notify.sh "Local dev test"

# Check server logs for incoming webhook
```

**Limitations**:
- ngrok URL changes on restart (free tier)
- Must re-register webhook after each restart
- Not suitable for production

**Best for**:
- Development and debugging
- Testing webhook logic changes
- Learning how the system works

### 5.4: Heroku Deployment

**Alternative to Replit** (paid hosting)

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Setup Steps

**1. Create `Procfile`**:
```
web: python scripts/telegram/server/server.py
```

**2. Create `runtime.txt`**:
```
python-3.11.5
```

**3. Deploy**:
```bash
# Login to Heroku
heroku login

# Create app
heroku create myproject-telegram-bot

# Set config vars
heroku config:set TELEGRAM_BOT_TOKEN="your_token"
heroku config:set TELEGRAM_CHAT_ID="your_chat_id"

# Deploy
git push heroku main

# Get URL
heroku info -a myproject-telegram-bot
# Copy URL: https://myproject-telegram-bot.herokuapp.com
```

**4. Register webhook**:
```bash
export TELEGRAM_WEBHOOK_URL="https://myproject-telegram-bot.herokuapp.com"
./scripts/telegram/tools/webhook_register.sh
```

**Cost**: ~$7/month for Eco Dynos (always-on)

### 5.5: AWS Lambda Deployment (Advanced)

**For enterprise-grade hosting**

**Benefits**:
- Pay-per-use (nearly free for low volume)
- Auto-scaling
- AWS ecosystem integration

**Complexity**: High (requires AWS knowledge)

**Quick overview**:
1. Package `server.py` with Flask for Lambda
2. Create API Gateway endpoint
3. Set environment variables in Lambda
4. Register API Gateway URL as webhook

**Full guide**: See AWS Lambda Python documentation

---

## Section 6: Customization Guide

### 6.1: Modifying `server.py` for Project Needs

#### Adding Custom Commands

**Extend webhook handler** to support `/status`, `/cancel`, etc.:

```python
# In server.py, add after process_approval_reply()

def process_command(text):
    """Handle custom bot commands"""
    if text.startswith('/status'):
        return handle_status_command()
    elif text.startswith('/cancel'):
        return handle_cancel_command()
    elif text.startswith('/help'):
        return handle_help_command()
    return None

def handle_status_command():
    """Return system status"""
    import subprocess
    result = subprocess.run(['notifyctl', 'status'], capture_output=True, text=True)
    return result.stdout.strip()

def handle_cancel_command():
    """Cancel pending approvals"""
    import glob
    reply_files = glob.glob(f"{REPLY_DIR}/reply_*.txt")
    for file in reply_files:
        os.remove(file)
    return f"Cancelled {len(reply_files)} pending approval(s)"

def handle_help_command():
    """Return help text"""
    return """
Available commands:
/status - Check notification status
/cancel - Cancel pending approvals
/help - Show this help
"""

# In webhook() function, after chat ID validation:
command_response = process_command(text)
if command_response:
    send_telegram_message(command_response)

def send_telegram_message(text):
    """Send message back to user"""
    import requests
    url = f"https://api.telegram.org/bot{os.environ.get('TELEGRAM_BOT_TOKEN')}/sendMessage"
    requests.post(url, json={'chat_id': TELEGRAM_CHAT_ID, 'text': text})
```

#### Adding Logging to Database

**Track all approvals** for audit purposes:

```python
# Add after imports
import sqlite3
from datetime import datetime

# Initialize database
DB_PATH = os.environ.get('APPROVAL_DB_PATH', '/tmp/approvals.db')

def init_database():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            question TEXT,
            reply TEXT,
            approved BOOLEAN,
            token TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_approval(question, reply, approved, token=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO approvals (timestamp, question, reply, approved, token)
        VALUES (?, ?, ?, ?, ?)
    ''', (datetime.now().isoformat(), question, reply, approved, token))
    conn.commit()
    conn.close()

# Call init_database() in __main__
# Call log_approval() in process_approval_reply()
```

### 6.2: Adjusting Timeouts and Settings

#### Global Timeout Configuration

**Create config file** `scripts/telegram/config.sh`:

```bash
# Telegram Bot Configuration

# Default timeout for approvals (seconds)
DEFAULT_TIMEOUT=300  # 5 minutes

# Critical operation timeout (seconds)
CRITICAL_TIMEOUT=900  # 15 minutes

# Quick approval timeout (seconds)
QUICK_TIMEOUT=120  # 2 minutes

# Poll interval (seconds) - how often to check for replies
POLL_INTERVAL=2

# Cleanup age (minutes) - delete files older than this
CLEANUP_AGE=60

# Webhook retry configuration
WEBHOOK_RETRY_COUNT=3
WEBHOOK_RETRY_DELAY=5

# Notification rate limiting
MAX_NOTIFICATIONS_PER_HOUR=100
```

**Use in scripts**:

```bash
#!/bin/bash
# Load configuration
source "$(dirname "$0")/config.sh"

# Use configured timeout
await_reply.sh "Deploy?" "$CRITICAL_TIMEOUT"
```

#### Per-Environment Timeouts

```bash
# .env.development
APPROVAL_TIMEOUT=120  # Quick for dev

# .env.production
APPROVAL_TIMEOUT=900  # Longer for prod
```

### 6.3: Custom Message Formatting

#### Rich Notification Templates

**Create** `scripts/telegram/templates/`:

```bash
# scripts/telegram/templates/deployment.sh
#!/bin/bash

send_deployment_notification() {
  local environment="$1"
  local commit="$2"
  local author="$3"

  local icon="🚀"
  if [[ "$environment" == "production" ]]; then
    icon="🎯"
  fi

  notify.sh "$icon **Deployment Started**

**Environment**: \`$environment\`
**Commit**: \`${commit:0:8}\`
**Author**: $author
**Time**: $(date '+%Y-%m-%d %H:%M:%S')

Deploying now..."
}

send_deployment_success() {
  local environment="$1"
  local url="$2"
  local duration="$3"

  notify.sh "✅ **Deployment Complete**

**Environment**: \`$environment\`
**URL**: $url
**Duration**: ${duration}s

All systems operational."
}

send_deployment_failure() {
  local environment="$1"
  local error="$2"

  notify.sh "❌ **Deployment Failed**

**Environment**: \`$environment\`
**Error**: \`$error\`

Please review logs and retry."
}
```

**Usage**:

```bash
source scripts/telegram/templates/deployment.sh

send_deployment_notification "staging" "$COMMIT_SHA" "$AUTHOR"
npm run deploy:staging
if [ $? -eq 0 ]; then
  send_deployment_success "staging" "https://staging.example.com" "$SECONDS"
else
  send_deployment_failure "staging" "Build failed"
fi
```

---

## Section 7: Migration from Other Systems

### 7.1: Migrating from Slack Notifications

**Common pattern** in existing projects:

```bash
# Old Slack notification
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"Deployment complete\"}"
```

**Replace with Telegram**:

```bash
# New Telegram notification
notify.sh "Deployment complete"
```

**Batch migration**:

```bash
# Find all Slack notifications
grep -r "SLACK_WEBHOOK_URL" scripts/ | grep curl

# Create migration script
sed -i 's/curl -X POST.*SLACK_WEBHOOK_URL.*/notify.sh "MESSAGE"/g' scripts/*.sh
```

**Comparison**:

| Feature | Slack | Telegram |
|---------|-------|----------|
| Setup complexity | Medium (workspace, app, webhook) | Easy (bot, chat ID) |
| Cost | Free tier limited | Completely free |
| Approval gates | Requires custom bot | Built-in |
| Mobile notifications | Yes | Yes |
| Message formatting | Slack markdown | Telegram markdown |

### 7.2: Migrating from Discord Notifications

**Old Discord webhook**:

```bash
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"content\":\"Build complete\"}"
```

**Telegram equivalent**:

```bash
notify.sh "Build complete"
```

**Migration mapping**:

| Discord | Telegram |
|---------|----------|
| Webhook URL | Bot token + Chat ID |
| `content` field | Message text |
| Embeds | Markdown formatting |
| Reactions | N/A (use reply buttons instead) |

### 7.3: Migrating from Email Notifications

**Old email script**:

```bash
echo "Deployment complete" | mail -s "Deploy Status" user@example.com
```

**Telegram replacement**:

```bash
notify.sh "**Deploy Status**\n\nDeployment complete"
```

**Benefits over email**:
- ✅ Instant push notifications (no polling)
- ✅ Better mobile experience
- ✅ Approval gates without complex email parsing
- ✅ No email server configuration needed

**Batch migration**:

```bash
# Find all mail commands
grep -r "mail -s" scripts/

# Replace with Telegram
sed -i 's/echo "\(.*\)" | mail -s "\(.*\)" .*/notify.sh "**\2**\\n\\n\1"/g' scripts/*.sh
```

---

## Appendix A: Complete File Checklist

**After replication, verify all files exist**:

```bash
# Core scripts
[ -x scripts/telegram/core/notifyctl ] && echo "✅ notifyctl" || echo "❌ notifyctl"
[ -x scripts/telegram/core/notify.sh ] && echo "✅ notify.sh" || echo "❌ notify.sh"
[ -x scripts/telegram/core/await_reply.sh ] && echo "✅ await_reply.sh" || echo "❌ await_reply.sh"
[ -x scripts/telegram/core/init.sh ] && echo "✅ init.sh" || echo "❌ init.sh"

# Server files
[ -f scripts/telegram/server/server.py ] && echo "✅ server.py" || echo "❌ server.py"
[ -f scripts/telegram/server/requirements.txt ] && echo "✅ requirements.txt" || echo "❌ requirements.txt"

# Tools
[ -x scripts/telegram/tools/webhook_register.sh ] && echo "✅ webhook_register.sh" || echo "❌ webhook_register.sh"
[ -x scripts/telegram/tools/monitor.sh ] && echo "✅ monitor.sh" || echo "❌ monitor.sh"
[ -x scripts/telegram/tools/cleanup.sh ] && echo "✅ cleanup.sh" || echo "❌ cleanup.sh"

# Documentation
[ -f docs/telegram/README.md ] && echo "✅ README.md" || echo "❌ README.md"
[ -f docs/telegram/ARCHITECTURE.md ] && echo "✅ ARCHITECTURE.md" || echo "❌ ARCHITECTURE.md"
[ -f docs/telegram/API_REFERENCE.md ] && echo "✅ API_REFERENCE.md" || echo "❌ API_REFERENCE.md"
[ -f docs/telegram/TROUBLESHOOTING.md ] && echo "✅ TROUBLESHOOTING.md" || echo "❌ TROUBLESHOOTING.md"
[ -f docs/telegram/REPLICATION_GUIDE.md ] && echo "✅ REPLICATION_GUIDE.md" || echo "❌ REPLICATION_GUIDE.md"

# Environment
[ -f .env ] && echo "✅ .env" || echo "⚠️  .env (create from template)"
grep -q ".env" .gitignore && echo "✅ .gitignore" || echo "❌ .env in .gitignore"
```

---

## Appendix B: Quick Reference Card

**Print this and keep it at your desk**:

```
TELEGRAM BOT QUICK REFERENCE
============================

CREATE BOT
----------
1. Message @BotFather
2. /newbot
3. Save token: 123456:ABC...
4. Get chat ID: @userinfobot

SETUP
-----
1. ./scripts/telegram/core/init.sh
2. Edit .env (token, chat ID, webhook URL)
3. Start Replit server
4. ./scripts/telegram/tools/webhook_register.sh
5. notifyctl on

COMMANDS
--------
notify.sh "message"                    # Send notification
await_reply.sh "question?" 300         # Wait for reply (5 min)
await_reply.sh "approve?" 600 "token"  # Token-based approval
notifyctl on|off|status                # Toggle notifications

TROUBLESHOOTING
---------------
./scripts/telegram/tools/monitor.sh    # View system status
./scripts/telegram/tools/cleanup.sh    # Clean stale files
curl $WEBHOOK_URL/health               # Check webhook server

ENVIRONMENT VARIABLES
---------------------
TELEGRAM_BOT_TOKEN    = Bot token from @BotFather
TELEGRAM_CHAT_ID      = Your numeric chat ID
TELEGRAM_WEBHOOK_URL  = Replit URL (no /webhook suffix)

EMERGENCY
---------
Token compromised: @BotFather → /revoke → /token
Webhook issues: Check Replit logs, verify URL
Approvals stuck: /scripts/telegram/tools/cleanup.sh 0
```

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
**Maintainer**: P3 Interview Academy DevOps Team

**Next Steps**:
- [ ] Create your first Telegram bot
- [ ] Set up Replit webhook server
- [ ] Test the system with quick setup guide
- [ ] Deploy to your project
- [ ] Read [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for real-world usage
