# Telegram Bot Controller - Architecture

This document describes the system architecture, component interactions, and data flows for the Telegram Bot Controller.

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Workflow Diagrams](#workflow-diagrams)
- [File Structure](#file-structure)
- [Data Flow](#data-flow)
- [Security Model](#security-model)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

The Telegram Bot Controller is a lightweight notification and approval system designed for developer workflows. It bridges the gap between automated processes (CI/CD, agents, scripts) and human decision-making.

### Design Principles

1. **Simplicity**: Single-line commands, no complex APIs
2. **Reliability**: File-based state, no database dependencies
3. **Security**: Chat ID validation, optional approval tokens
4. **Flexibility**: Works with any shell script or automation tool
5. **Minimal dependencies**: Python 3 + Flask, standard Unix tools

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Bot Controller                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Core Scripts │    │   Webhook    │    │    Tools     │  │
│  │              │◄───┤    Server    │───►│              │  │
│  │  - notify    │    │  (Flask/Py)  │    │  - monitor   │  │
│  │  - await     │    │              │    │  - cleanup   │  │
│  │  - notifyctl │    │              │    │  - register  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         └────────────────────┼────────────────────┘          │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │   State Files     │                    │
│                    │  /tmp/telegram_*  │                    │
│                    └───────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Telegram API     │
                    │  (External)       │
                    └───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  User's Telegram  │
                    │  Mobile App       │
                    └───────────────────┘
```

---

## Component Architecture

### 1. Core Scripts (`scripts/telegram/core/`)

These are the primary interface for developers and automation scripts.

#### `notifyctl`

**Purpose**: Toggle notification system on/off globally

**Implementation**:
- Writes flag file: `/tmp/telegram_notify_enabled`
- Commands: `on`, `off`, `status`
- Exit codes: 0 (success), 1 (error)

**Logic**:
```
notifyctl on
  └─► Create /tmp/telegram_notify_enabled
  └─► Echo "Notifications enabled"

notifyctl off
  └─► Remove /tmp/telegram_notify_enabled
  └─► Echo "Notifications disabled"

notifyctl status
  └─► Check file existence
  └─► Echo current state
```

#### `notify.sh <message>`

**Purpose**: Send one-way notifications to Telegram

**Implementation**:
```bash
#!/bin/bash
MESSAGE="$1"

# Check if notifications enabled
if [[ ! -f /tmp/telegram_notify_enabled ]]; then
  echo "[SILENT] Notifications disabled: $MESSAGE"
  exit 0
fi

# Send via Telegram API
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="${TELEGRAM_CHAT_ID}" \
  -d text="$MESSAGE" \
  -d parse_mode="Markdown"
```

**Flow**:
```
notify.sh "Deploy complete"
  │
  ├─► Check /tmp/telegram_notify_enabled
  │   └─► Not found? → Silent mode (echo to console, exit 0)
  │
  └─► Send HTTP POST to Telegram API
      └─► Success? → Exit 0
      └─► Failure? → Exit 1
```

#### `await_reply.sh <question> [timeout] [token]`

**Purpose**: Wait for user reply with approval logic

**Parameters**:
- `$1` - Question to ask user
- `$2` - Timeout in seconds (default: 300)
- `$3` - Optional approval token for validation

**Implementation**:
```bash
#!/bin/bash
QUESTION="$1"
TIMEOUT="${2:-300}"
TOKEN="$3"

# Check if notifications enabled
if [[ ! -f /tmp/telegram_notify_enabled ]]; then
  echo "[SILENT] Auto-approved (notifications disabled)"
  exit 0
fi

# Send question
notify.sh "❓ $QUESTION"

# Generate reply file
REPLY_FILE="/tmp/telegram_replies/reply_$(date +%s)_${TOKEN:-notok}.txt"
touch "$REPLY_FILE"

# Wait for reply
START_TIME=$(date +%s)
while true; do
  # Check timeout
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "Timeout after ${TIMEOUT}s"
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
        echo "Approved with token"
        exit 0
      else
        echo "Invalid token or rejection"
        exit 1
      fi
    else
      # Hybrid mode: yes/approve/ok
      if echo "$REPLY" | grep -iE "^(yes|approve|ok|y)$" > /dev/null; then
        echo "Approved"
        exit 0
      else
        echo "Rejected"
        exit 1
      fi
    fi
  fi

  sleep 2
done
```

**Flow**:
```
await_reply.sh "Deploy?" 300 "a3f5"
  │
  ├─► Check /tmp/telegram_notify_enabled
  │   └─► Not found? → Auto-approve (exit 0)
  │
  ├─► Send question via notify.sh
  │
  ├─► Create reply file: /tmp/telegram_replies/reply_1730000000_a3f5.txt
  │
  └─► Poll loop (every 2 seconds)
      ├─► Check timeout
      │   └─► Exceeded? → Exit 1
      │
      └─► Check reply file
          ├─► Empty? → Continue loop
          │
          └─► Has content?
              ├─► Token provided? → Validate exact match
              │   ├─► "approve a3f5" → Exit 0
              │   └─► Anything else → Exit 1
              │
              └─► No token? → Hybrid mode
                  ├─► "yes|approve|ok|y" → Exit 0
                  └─► Anything else → Exit 1
```

#### `init.sh`

**Purpose**: Initialize directory structure and permissions

**Implementation**:
```bash
#!/bin/bash
mkdir -p /tmp/telegram_messages
mkdir -p /tmp/telegram_replies
chmod 700 /tmp/telegram_messages
chmod 700 /tmp/telegram_replies

echo "Telegram bot system initialized"
```

### 2. Webhook Server (`scripts/telegram/server/`)

#### `server.py`

**Purpose**: Receive incoming Telegram messages via webhook

**Implementation**:
```python
from flask import Flask, request, jsonify
import os
import time

app = Flask(__name__)

TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')
MESSAGE_DIR = '/tmp/telegram_messages'
REPLY_DIR = '/tmp/telegram_replies'

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json

    # Extract message
    if 'message' not in data:
        return jsonify({'ok': False}), 400

    message = data['message']
    chat_id = str(message['chat']['id'])
    text = message.get('text', '')

    # Validate chat ID
    if chat_id != TELEGRAM_CHAT_ID:
        return jsonify({'ok': False, 'error': 'unauthorized'}), 403

    # Write message to file
    timestamp = int(time.time())
    msg_file = f"{MESSAGE_DIR}/msg_{timestamp}.txt"

    with open(msg_file, 'w') as f:
        f.write(text)

    # Check for approval replies
    process_approval_reply(text)

    return jsonify({'ok': True})

def process_approval_reply(text):
    """Check if message matches any pending reply files"""
    import glob

    # Look for reply files
    reply_files = glob.glob(f"{REPLY_DIR}/reply_*.txt")

    for reply_file in reply_files:
        # Extract token from filename
        filename = os.path.basename(reply_file)
        parts = filename.split('_')

        if len(parts) >= 3:
            token = parts[2].replace('.txt', '')

            # Write reply to file
            with open(reply_file, 'w') as f:
                f.write(text.strip())

            break  # Only match first pending reply

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'telegram-webhook'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Flow**:
```
Telegram API → POST /webhook
  │
  ├─► Parse JSON body
  │
  ├─► Extract chat_id and text
  │
  ├─► Validate chat_id == TELEGRAM_CHAT_ID
  │   └─► Mismatch? → Return 403 Forbidden
  │
  ├─► Write to /tmp/telegram_messages/msg_<timestamp>.txt
  │
  └─► Check for pending reply files
      ├─► Find /tmp/telegram_replies/reply_*.txt
      │
      └─► Write user's text to reply file
          └─► await_reply.sh detects and processes
```

### 3. Tools (`scripts/telegram/tools/`)

#### `webhook_register.sh`

**Purpose**: Register webhook URL with Telegram API

**Implementation**:
```bash
#!/bin/bash
WEBHOOK_URL="${TELEGRAM_WEBHOOK_URL}"

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}/webhook"

echo "Webhook registered: ${WEBHOOK_URL}/webhook"
```

#### `monitor.sh`

**Purpose**: View recent messages and system status

**Implementation**:
```bash
#!/bin/bash
echo "=== Notification Status ==="
notifyctl status

echo -e "\n=== Recent Messages ==="
ls -lht /tmp/telegram_messages/ | head -10

echo -e "\n=== Pending Replies ==="
ls -lht /tmp/telegram_replies/ | head -10
```

#### `cleanup.sh`

**Purpose**: Remove stale message and reply files

**Implementation**:
```bash
#!/bin/bash
# Remove files older than 1 hour
find /tmp/telegram_messages/ -type f -mmin +60 -delete
find /tmp/telegram_replies/ -type f -mmin +60 -delete

echo "Cleanup complete"
```

---

## Workflow Diagrams

### Notification Flow

```
┌──────────────┐
│   Script     │
│ (any process)│
└──────┬───────┘
       │
       │ notify.sh "message"
       ▼
┌──────────────┐
│ Check Enabled│ /tmp/telegram_notify_enabled exists?
└──────┬───────┘
       │
       ├─► No  → Echo to console (silent mode)
       │         Exit 0
       │
       └─► Yes → Continue
                 │
                 ▼
          ┌──────────────┐
          │ Telegram API │
          │  POST /send  │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │ User receives│
          │  notification│
          └──────────────┘
```

### Approval Gate Flow

```
┌──────────────┐
│   Script     │
│ needs approval│
└──────┬───────┘
       │
       │ await_reply.sh "question" 300 "token"
       ▼
┌─────────────────┐
│  Check Enabled  │
└──────┬──────────┘
       │
       ├─► No → Auto-approve (exit 0)
       │
       └─► Yes → Continue
                 │
                 ▼
          ┌──────────────────┐
          │ Send question    │
          │ via notify.sh    │
          └──────┬───────────┘
                 │
                 ▼
          ┌──────────────────┐
          │ Create reply file│
          │ /tmp/.../reply_* │
          └──────┬───────────┘
                 │
                 ▼
          ┌──────────────────┐
          │   Poll Loop      │
          │ (every 2 seconds)│
          └──────┬───────────┘
                 │
                 ├─► Timeout? → Exit 1
                 │
                 └─► Reply file has content?
                     │
                     ├─► No → Continue loop
                     │
                     └─► Yes → Validate
                               │
                               ├─► Token mode
                               │   ├─► "approve <token>" → Exit 0
                               │   └─► Other → Exit 1
                               │
                               └─► Hybrid mode
                                   ├─► "yes|approve|ok" → Exit 0
                                   └─► Other → Exit 1
```

### Hybrid Mode Flow

```
User sends message to bot
         │
         ▼
┌─────────────────┐
│  Webhook Server │
│   receives POST │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Validate chat_id│
└─────────┬───────┘
          │
          ├─► Invalid → Return 403
          │
          └─► Valid → Continue
                      │
                      ▼
              ┌─────────────────┐
              │ Write to message│
              │   directory     │
              └─────────┬───────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Find pending replies│
              │  /tmp/.../reply_*   │
              └─────────┬───────────┘
                        │
                        ├─► None found → Done
                        │
                        └─► Found → Write user text to reply file
                                    │
                                    ▼
                              ┌─────────────────┐
                              │ await_reply.sh  │
                              │   detects file  │
                              │   has content   │
                              └─────────┬───────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Token provided?  │
                              └─────────┬────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │                                             │
                  ▼                                             ▼
          ┌──────────────┐                            ┌──────────────┐
          │ Exact match  │                            │ Fuzzy match  │
          │ "approve XYZ"│                            │ "yes|approve"│
          └──────┬───────┘                            └──────┬───────┘
                 │                                            │
                 └─────────────────┬──────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  Exit 0 or 1    │
                          │ (approve/reject)│
                          └─────────────────┘
```

---

## File Structure

```
scripts/telegram/
├── core/
│   ├── notifyctl              # Toggle notifications on/off
│   ├── notify.sh              # Send notification
│   ├── await_reply.sh         # Wait for user reply
│   └── init.sh                # Initialize system
├── server/
│   ├── server.py              # Flask webhook server
│   └── requirements.txt       # Python dependencies (Flask)
├── tools/
│   ├── webhook_register.sh    # Register webhook with Telegram
│   ├── monitor.sh             # View messages and status
│   └── cleanup.sh             # Remove stale files
└── integrations/              # Optional integration scripts
    ├── aws-deploy.sh          # AWS deployment with approval
    ├── db-migrate.sh          # Database migration with token
    └── gemini-notify.sh       # Gemini agent notifications

docs/telegram/
├── README.md                  # Overview and quick start
├── ARCHITECTURE.md            # This file
├── API_REFERENCE.md           # Script reference
└── TROUBLESHOOTING.md         # Common issues

/tmp/telegram_messages/        # Message files (ephemeral)
├── msg_1730000001.txt
├── msg_1730000045.txt
└── ...

/tmp/telegram_replies/         # Reply tracking files
├── reply_1730000100_a3f5.txt  # With token
├── reply_1730000200_notok.txt # Without token
└── ...

/tmp/telegram_notify_enabled   # Flag file (presence = enabled)
```

---

## Data Flow

### Message Creation Flow

```
Developer Script
  └─► notify.sh "message"
      └─► Check /tmp/telegram_notify_enabled
          └─► POST https://api.telegram.org/bot<TOKEN>/sendMessage
              └─► Telegram servers
                  └─► User's mobile app
                      └─► Push notification
```

### Reply Processing Flow

```
User's mobile app
  └─► User types reply
      └─► Telegram servers
          └─► POST https://your-replit.repl.co/webhook
              └─► server.py
                  ├─► Validate chat_id
                  ├─► Write to /tmp/telegram_messages/msg_*.txt
                  └─► Find /tmp/telegram_replies/reply_*.txt
                      └─► Write user text to reply file
                          └─► await_reply.sh polling loop
                              ├─► Read file content
                              ├─► Validate against token/pattern
                              └─► Exit 0 (approve) or Exit 1 (reject)
                                  └─► Developer script continues/aborts
```

### State File Lifecycle

```
1. Creation
   await_reply.sh → touch /tmp/telegram_replies/reply_<timestamp>_<token>.txt

2. Population
   server.py → write user's message text to reply file

3. Consumption
   await_reply.sh → read file, validate, delete file

4. Cleanup (if stale)
   cleanup.sh → delete files older than 60 minutes
```

---

## Security Model

### Authentication Layers

**Layer 1: Chat ID Validation**
- Every incoming webhook POST validates `chat_id`
- Only messages from `TELEGRAM_CHAT_ID` are processed
- Unauthorized chats receive 403 Forbidden

**Layer 2: Token-Based Approval**
- Optional tokens for sensitive operations
- Tokens generated per-request (random hex, e.g., `a3f5b7`)
- Exact string match required: `"approve a3f5b7"`

**Layer 3: File Permissions**
- State directories: `chmod 700` (owner-only read/write)
- Reply files deleted immediately after processing
- No persistent message storage

### Threat Model

**Threats Mitigated**:
- Unauthorized users controlling the bot (chat ID validation)
- Accidental approvals (token requirement for critical ops)
- Message interception (HTTPS for webhook, file permissions)

**Threats NOT Mitigated**:
- Compromised Telegram account (user responsibility)
- Replit server compromise (shared hosting risk)
- Timing attacks on token validation (low risk for dev tool)

### Best Practices

1. **Environment Variables**:
   ```bash
   # .env (never commit)
   TELEGRAM_BOT_TOKEN="123456:ABC..."
   TELEGRAM_CHAT_ID="987654321"
   ```

2. **Token Generation**:
   ```bash
   # Use cryptographically secure random
   TOKEN=$(openssl rand -hex 6)
   ```

3. **Webhook Security**:
   ```python
   # server.py
   if chat_id != TELEGRAM_CHAT_ID:
       return jsonify({'ok': False}), 403
   ```

4. **File Cleanup**:
   ```bash
   # Run cleanup every hour (cron or systemd timer)
   0 * * * * /path/to/cleanup.sh
   ```

---

## Deployment Architecture

### Replit Hosting (Recommended)

```
┌────────────────────────────────────────────┐
│           Replit Environment               │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │        server.py (Flask)              │ │
│  │  - Runs on port 5000                  │ │
│  │  - Auto-restarts on crash             │ │
│  │  - Persistent URL                     │ │
│  └──────────────┬───────────────────────┘ │
│                 │                          │
│  ┌──────────────▼───────────────────────┐ │
│  │    State Files (/tmp/)                │ │
│  │  - Ephemeral (reset on redeploy)      │ │
│  │  - 700 permissions                    │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────┬───────────────────────────┘
                 │
                 │ HTTPS (webhook)
                 ▼
┌────────────────────────────────────────────┐
│         Telegram API Servers               │
│  api.telegram.org                          │
└────────────────┬───────────────────────────┘
                 │
                 │ Push notifications
                 ▼
┌────────────────────────────────────────────┐
│       User's Telegram App                  │
│  (iOS, Android, Desktop)                   │
└────────────────────────────────────────────┘
```

### Local Development Environment

```
┌────────────────────────────────────────────┐
│      Developer's Machine (Local)           │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │   Core Scripts                        │ │
│  │  - notify.sh                          │ │
│  │  - await_reply.sh                     │ │
│  │  - notifyctl                          │ │
│  └──────────────┬───────────────────────┘ │
│                 │                          │
│                 │ HTTP POST                │
│                 ▼                          │
└─────────────────┼──────────────────────────┘
                  │
                  │ Internet
                  ▼
┌─────────────────────────────────────────────┐
│    Replit (Webhook Server)                  │
│  - Receives messages from Telegram          │
│  - Writes to state files                    │
│  - Accessible via polling from local        │
└─────────────────┬───────────────────────────┘
                  │
                  │ Shared state (polled)
                  ▼
┌─────────────────────────────────────────────┐
│   Developer polls reply files               │
│  - await_reply.sh checks files every 2s     │
│  - Files written by Replit server           │
└─────────────────────────────────────────────┘
```

### High Availability Considerations

**Current Design** (Single Point of Failure):
- Replit server restart → Webhook offline briefly
- Solution: Telegram retries failed webhook POSTs

**Future Enhancements**:
- Multiple webhook servers with load balancing
- Redis for shared state (replace file system)
- Database for message persistence and audit logs

---

## Performance Characteristics

### Latency

- **Notification send**: ~200-500ms (API call)
- **Webhook processing**: ~50-100ms (file write)
- **Reply detection**: 2-second polling interval
- **End-to-end approval**: 5-15 seconds (human response time)

### Scalability

**Current Limits**:
- Single user (one chat ID)
- ~10 concurrent approvals (file handle limits)
- No message queuing (immediate processing)

**Scaling Recommendations**:
- For multi-user: Add chat ID table and user routing
- For high volume: Replace files with Redis
- For audit trail: Add database logging

### Resource Usage

- **Memory**: ~50MB (Flask server)
- **Disk**: <1MB (state files cleaned hourly)
- **CPU**: <1% (polling and webhooks)
- **Network**: ~1KB per message (negligible)

---

## Extension Points

### Custom Message Handlers

```python
# server.py
def process_custom_command(text):
    if text.startswith('/status'):
        # Return system status
        pass
    elif text.startswith('/cancel'):
        # Cancel pending approvals
        pass
```

### Integration Plugins

```bash
# scripts/telegram/integrations/custom-workflow.sh
#!/bin/bash
source scripts/telegram/core/notify.sh
source scripts/telegram/core/await_reply.sh

# Custom workflow logic
notify.sh "Starting custom workflow..."
# ... workflow steps ...
if await_reply.sh "Continue to next phase?" 300; then
    # ... next phase ...
fi
```

### Advanced Validation

```bash
# await_reply.sh - Add custom validation
validate_reply() {
    local reply="$1"
    local token="$2"

    # Custom validation logic
    if [[ "$reply" =~ ^approve:[A-Za-z0-9]+$ ]]; then
        # Extract and validate
        return 0
    fi
    return 1
}
```

---

## Conclusion

The Telegram Bot Controller architecture prioritizes simplicity, reliability, and security for developer workflows. The file-based state management and polling approach may seem unconventional, but it provides excellent reliability without complex infrastructure dependencies.

For most use cases (CI/CD approvals, deployment gates, agent notifications), this architecture provides sufficient performance and scalability. For high-volume production systems, consider the scaling recommendations in the Performance section.

---

## User-Initiated Command System (Phase 3)

### Overview

The command system allows users to interact with the bot via slash commands, enabling remote control and monitoring of the system directly from Telegram.

### Architecture

```
User Types Command
       ↓
  /status, /monitor, /test, /deploy, /help
       ↓
Telegram Bot API
       ↓
Webhook Server (Flask)
       ↓
Command Router (parse_command)
       ↓
Rate Limit Check
       ↓
Command Executor (execute_command)
       ↓
   ┌────────┴────────┐
   │   Command       │
   │   Handlers      │
   └────────┬────────┘
       ↓
Subprocess Execution or Direct Response
       ↓
Response Message
       ↓
Telegram Bot API
       ↓
User Receives Response
```

### Command Flow Details

#### 1. Command Parsing

```python
def parse_command(text: str) -> Optional[Dict]:
    # Matches: /command arg1 arg2 arg3
    match = re.match(r'^/(\w+)(?:\s+(.*))?$', text.strip())
    if match:
        command = match.group(1).lower()
        args = match.group(2).split() if match.group(2) else []
        return {'command': command, 'args': args}
    return None
```

**Supported Format**: `/command [arg1] [arg2] ...`

---

#### 2. Rate Limiting

```
Command Received
       ↓
Determine Tier (readonly/general/intensive)
       ↓
Check Request History
       ↓
     ┌──────────┐
     │ Within   │────Yes────► Reject (Rate Limited)
     │ Limit?   │
     └──────────┘
          │
         No
          ↓
Add to History
          ↓
Execute Command
```

**Rate Limit Tiers**:
- **Readonly**: 10 req/min (`/status`, `/monitor`, `/help`)
- **General**: 5 req/min (unknown commands)
- **Intensive**: 1 req/5min (`/test`, `/deploy`)

---

#### 3. Command Execution Flow

```
execute_command(command, args, chat_id, user_id)
       ↓
Start Timer (for duration logging)
       ↓
   ┌─────────────┐
   │ Route to    │
   │ Handler     │
   └─────────────┘
       ↓
    ╔═════════════════╗
    ║  Command Type   ║
    ╚═════════════════╝
       ↓
   ┌───┴────────────────────────────────────┐
   │                                        │
/help                                   /status
   │                                        │
Return                              Read state files
static text                         Return status
   │                                        │
   └──────────────┬─────────────────────────┘
                  ↓
            /monitor, /test, /deploy
                  ↓
       Run shell script/command
                  ↓
         Capture output
                  ↓
      Format for Telegram
                  ↓
        Return response
                  ↓
       Stop Timer
                  ↓
    Log to Audit File
                  ↓
Send Response to User
```

---

#### 4. Deployment Command Flow

```
User: /deploy staging
       ↓
Validate Arguments
       ↓
Check Rate Limit
       ↓
   ┌──────────────┐
   │ Environment  │───staging────► deploy-staging.sh
   │ Type?        │
   │              │───production──► deploy-production.sh
   └──────────────┘                        ↓
                                  Request Approval
                                           ↓
                                  User: approve <token>
                                           ↓
                                  Run Deployment Script
                                           ↓
                                  ┌─────────────────┐
                                  │ Deployment      │
                                  │ Steps           │
                                  ├─────────────────┤
                                  │ 1. AWS Auth     │
                                  │ 2. Check Env    │
                                  │ 3. Run Tests    │ (production only)
                                  │ 4. Build        │
                                  │ 5. Create Bundle│
                                  │ 6. Upload S3    │
                                  │ 7. Create Ver   │
                                  │ 8. Deploy       │
                                  │ 9. Wait         │
                                  │ 10. Verify      │
                                  │ 11. Smoke Tests │
                                  └─────────────────┘
                                           ↓
                                  Send Progress Updates
                                           ↓
                                  Final Status Message
```

---

### Command Handlers

#### `/status` - Quick Health Check

**Implementation**: `execute_status_command()`

```
Check Components:
1. Webhook server (always running)
2. Notification flag (/tmp/telegram_notify_enabled)
3. Pending requests (.pending/ directory)
4. Inbox messages (.inbox/ directory)

Format Response:
📊 System Status
✅ Webhook Server: Running
✅ Notifications: Enabled
📬 Pending Requests: X
📥 Recent Responses: X
```

**Response Time**: < 100ms (no I/O operations)

---

#### `/monitor` - Detailed Metrics

**Implementation**: `execute_monitor_command()`

```
Run Script: scripts/telegram/tools/monitor.sh
       ↓
Capture Output (timeout: 10s)
       ↓
Strip ANSI Color Codes
       ↓
Truncate if > 3000 chars
       ↓
Format for Telegram (code block)
       ↓
Return Response
```

**Response Time**: 1-10 seconds (depending on script complexity)

---

#### `/test` - Run Test Suite

**Implementation**: `execute_test_command()`

```
Send Initial Message: "Running tests..."
       ↓
Run: npm run test:run
       ↓
Wait (timeout: 5 minutes)
       ↓
Parse Output
       ↓
Extract Test Summary
       ↓
Send Final Results
```

**Response Time**: 2-5 minutes (long-running)

---

#### `/deploy` - AWS Deployment

**Implementation**: `execute_deploy_command()`

```
Validate Environment Argument
       ↓
Send Initial Message
       ↓
Run: scripts/telegram/integrations/deploy-{env}.sh
       ↓
Script Handles:
  - Approval (production only)
  - AWS deployment
  - Progress notifications
       ↓
Wait (timeout: 10 minutes)
       ↓
Return Final Status
```

**Response Time**: 2-10 minutes (long-running)

**Production Flow**: Includes approval gate via `await_telegram_reply()`

---

#### `/help` - Command Documentation

**Implementation**: `execute_help_command()`

```
Args Provided?
   │
   ├─No──► Return General Help (all commands)
   │
   └─Yes─► Return Specific Command Help
              │
              ├─Valid Command──► Return detailed help
              │
              └─Invalid Command──► Return error message
```

**Response Time**: < 50ms (static content)

---

### Audit Logging

All command executions are logged to `/tmp/telegram/command-audit.log`:

```json
{
  "timestamp": "2025-11-03T12:34:56",
  "command": "deploy",
  "user_id": 449555452,
  "chat_id": 449555452,
  "args": ["staging"],
  "success": true,
  "error": null,
  "duration_ms": 234567
}
```

**Purpose**:
- Security auditing
- Performance monitoring
- Debugging failures
- Usage analytics

---

### Security Model

#### Chat ID Validation

```
Webhook Receives Message
       ↓
Extract chat_id
       ↓
Compare with CHAT_ID env var
       ↓
   ┌─────────┐
   │ Match?  │───No───► Return 403 Unauthorized
   └─────────┘
        │
       Yes
        ↓
  Process Command
```

**Protection**: Only authorized user can execute commands

---

#### Rate Limiting

```
Command Received
       ↓
Get User History (in-memory dict)
       ↓
Filter Old Timestamps (outside window)
       ↓
Count Recent Requests
       ↓
   ┌────────────┐
   │ Exceeded?  │───Yes───► Return Error + Retry-After
   └────────────┘
        │
       No
        ↓
Add Current Timestamp
        ↓
  Execute Command
```

**Protection**: Prevents abuse and system overload

---

#### Input Validation

```
Parse Command Arguments
       ↓
Validate Argument Count
       ↓
Validate Argument Values
       ↓
Sanitize for Shell Execution
       ↓
   ┌──────────┐
   │ Valid?   │───No───► Return Error Message
   └──────────┘
        │
       Yes
        ↓
  Execute Command
```

**Protection**: Prevents command injection and invalid operations

---

### BotFather Commands Menu

To enable autocomplete in Telegram:

1. Open @BotFather
2. Send `/mybots`
3. Select @JevinCC_Bot
4. Select "Edit Bot" → "Edit Commands"
5. Send commands list:

```
status - Show system health and status
monitor - View detailed system metrics
test - Run test suite
deploy - Deploy to AWS environment
help - Show command help
```

Users will then see these commands when typing `/` in the bot chat.

---

### Integration with Existing System

**Coexistence with Approval System**:

```
Telegram Webhook
       ↓
   ┌─────────────┐
   │ Message     │
   │ Type?       │
   └─────────────┘
       ↓
   ┌───┴─────────────────────────────────┐
   │                                     │
Slash Command                    Button Callback or Text
   │                                     │
Route to                          Route to Approval
Command System                    System (existing)
   │                                     │
Rate Limit                        Token Matching
   │                                     │
Execute                           Write to .inbox/
   │                                     │
Return Response                   Remove from .pending/
```

**Key Points**:
- Command system and approval system are independent
- Both share the same webhook endpoint
- No conflicts (different message formats)
- Separate rate limiting
- Separate audit logging

---

### Performance Considerations

**Quick Commands** (`/status`, `/help`):
- Response time: < 100ms
- No external I/O
- Suitable for frequent checks

**Moderate Commands** (`/monitor`):
- Response time: 1-10 seconds
- Script execution with timeout
- Rate limited to prevent overload

**Long Commands** (`/test`, `/deploy`):
- Response time: 2-10 minutes
- Asynchronous execution
- Progress updates sent
- Strict rate limiting (1 per 5 minutes)

---

### Error Handling

```
Command Execution
       ↓
   ┌──────────┐
   │ Try      │
   │ Execute  │
   └──────────┘
       ↓
   ┌──────────────────────────────┐
   │                              │
Success                        Exception
   │                              │
Log Success                   Log Error
   │                              │
Return                        Format Error
Result                        Message
   │                              │
   └──────────────┬───────────────┘
                  ↓
       Send to User
                  ↓
       Audit Log Entry
```

**Error Types**:
- Command not found
- Invalid arguments
- Timeout (5-10 minutes)
- Rate limit exceeded
- Script execution failure
- Network/API errors

All errors are:
1. Logged to audit log
2. Sent to user with helpful message
3. Captured with duration and context

---

### Testing

See [COMMAND_TEST_PLAN.md](./COMMAND_TEST_PLAN.md) for comprehensive test cases.

**Test Coverage**:
- All 5 commands
- Rate limiting (all 3 tiers)
- Error handling
- Security (unauthorized access)
- Performance
- Audit logging
- Integration tests

---

**Next Steps**:
- Review [API_REFERENCE.md](./API_REFERENCE.md) for detailed script documentation
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Check [COMMAND_GUIDE.md](./COMMAND_GUIDE.md) for user documentation
- Check [COMMAND_TEST_PLAN.md](./COMMAND_TEST_PLAN.md) for testing procedures
- Explore integration examples in `scripts/telegram/integrations/`
