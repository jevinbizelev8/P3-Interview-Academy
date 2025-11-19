# Telegram Bot Controller - Setup Guide for P3 Interview Academy

**Project-specific setup guide for the P3 Interview Academy Telegram Bot integration**

This guide walks through setting up the Telegram Bot Controller specifically for the P3 Interview Academy project, including integration with existing workflows (AWS deployments, Gemini research agent, database migrations).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Telegram Bot Creation](#step-1-telegram-bot-creation)
- [Step 2: Replit Secrets Configuration](#step-2-replit-secrets-configuration)
- [Step 3: Directory and File Setup](#step-3-directory-and-file-setup)
- [Step 4: Installation and Initialization](#step-4-installation-and-initialization)
- [Step 5: Webhook Registration](#step-5-webhook-registration)
- [Step 6: Testing the System](#step-6-testing-the-system)
- [Step 7: Integrating with Existing Workflows](#step-7-integrating-with-existing-workflows)
- [Step 8: Monitoring and Maintenance](#step-8-monitoring-and-maintenance)

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Telegram account** (mobile, desktop, or web)
- [ ] **Replit account** (free tier is fine) - Already have P3 project on Replit
- [ ] **Access to P3 repository** with write permissions
- [ ] **Environment access**: Able to run bash scripts in the P3 workspace
- [ ] **AWS CLI configured** (for AWS integration testing)

**Estimated time**: 15-20 minutes

---

## Step 1: Telegram Bot Creation

### 1.1: Create the P3 Deploy Bot

1. **Open Telegram** and search for **@BotFather**
2. **Send** `/newbot`
3. **Choose a name**: `P3 Interview Academy Deploy Bot` (or your preference)
4. **Choose a username**: `p3_interview_deploy_bot` (must end in `_bot`)

**Example conversation**:
```
You: /newbot
BotFather: Alright, a new bot. How are we going to call it?
You: P3 Interview Academy Deploy Bot
BotFather: Good. Now let's choose a username for your bot.
You: p3_interview_deploy_bot
BotFather: Done! Congratulations on your new bot.

Use this token to access the HTTP API:
123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

5. **Save the token immediately** to your password manager

### 1.2: Configure Bot Settings

**Security configuration** (recommended):

```
# Disable group joining (security)
/setjoingroups
Select: p3_interview_deploy_bot
Select: Disable

# Set description
/setdescription
Select: p3_interview_deploy_bot
Enter: Deployment notifications and approval gates for P3 Interview Academy. AWS, Gemini, and database operations.

# Set about text
/setabouttext
Select: p3_interview_deploy_bot
Enter: Automated notifications from P3 Interview Academy. Do not share this bot token!
```

### 1.3: Get Your Chat ID

**Method 1** (Easiest): Use @userinfobot
1. Search for **@userinfobot** in Telegram
2. Start the bot and note your ID (e.g., `987654321`)

**Method 2**: Use API directly
1. **Start a conversation** with your bot (click the link from BotFather)
2. **Send a message** like "Hello"
3. **Open in browser** (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. **Find your chat ID** in the response:
   ```json
   {
     "result": [{
       "message": {
         "chat": {
           "id": 987654321  ← YOUR CHAT ID
         }
       }
     }]
   }
   ```

**Save both** the bot token and chat ID - you'll need them in the next step.

---

## Step 2: Replit Secrets Configuration

### 2.1: Access Replit Environment

The P3 Interview Academy project is already on Replit. We'll add the Telegram webhook server to the existing Repl or create a separate one.

**Option A**: Add to existing P3 Repl (simpler)
**Option B**: Create dedicated webhook Repl (recommended for separation)

### 2.2: Create Dedicated Webhook Repl (Recommended)

1. **Go to Replit** and click "Create Repl"
2. **Template**: Python
3. **Title**: `p3-telegram-webhook`
4. **Privacy**: Private
5. **Click** "Create Repl"

### 2.3: Configure Secrets

In the Replit sidebar:

1. **Click the lock icon** (Secrets)
2. **Add the following secrets**:

| Key | Value | Notes |
|-----|-------|-------|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | Your bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | `987654321` | Your numeric chat ID |

**Do not add** `TELEGRAM_WEBHOOK_URL` to Replit - it's determined by the Repl URL automatically.

### 2.4: Upload Server Files

In the Replit file browser:

1. **Create** `main.py` (Replit's default entry point)
2. **Paste the following** (webhook server code):

```python
#!/usr/bin/env python3
"""
P3 Interview Academy - Telegram Webhook Server
Receives incoming Telegram messages for deployment approvals
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

# Configuration from Replit Secrets
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')
MESSAGE_DIR = '/tmp/telegram_messages'
REPLY_DIR = '/tmp/telegram_replies'

# Validate configuration
if not TELEGRAM_CHAT_ID:
    logger.error("⚠️  TELEGRAM_CHAT_ID not set - webhook will reject all messages")
    logger.error("   Add it to Replit Secrets")

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
            logger.warning(f"❌ Unauthorized chat_id: {chat_id}")
            return jsonify({'ok': False, 'error': 'unauthorized'}), 403

        # Write message to file
        timestamp = int(time.time())
        msg_file = f"{MESSAGE_DIR}/msg_{timestamp}.txt"

        os.makedirs(MESSAGE_DIR, exist_ok=True)
        with open(msg_file, 'w') as f:
            f.write(text)

        logger.info(f"📩 Message received: {text[:50]}{'...' if len(text) > 50 else ''}")

        # Process potential approval replies
        process_approval_reply(text)

        return jsonify({'ok': True})

    except Exception as e:
        logger.error(f"❌ Error processing webhook: {e}", exc_info=True)
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
                logger.info(f"✅ Reply written to {os.path.basename(reply_file)}")
                break  # Only match first pending reply

    except Exception as e:
        logger.error(f"❌ Error processing approval reply: {e}", exc_info=True)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'p3-telegram-webhook',
        'chat_id_configured': bool(TELEGRAM_CHAT_ID),
        'project': 'P3 Interview Academy'
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'P3 Interview Academy - Telegram Webhook Server',
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

    logger.info("🚀 Starting P3 Telegram webhook server...")
    logger.info(f"📁 Message directory: {MESSAGE_DIR}")
    logger.info(f"📁 Reply directory: {REPLY_DIR}")
    logger.info(f"🔐 Authorized chat ID: {TELEGRAM_CHAT_ID}")

    # Run server
    app.run(host='0.0.0.0', port=5000, debug=False)
```

3. **Create** `requirements.txt`:

```
Flask==3.0.0
Werkzeug==3.0.1
```

4. **Click "Run"** - The server should start

5. **Copy the Repl URL**: Look in the browser panel for `https://p3-telegram-webhook.username.repl.co`

**Test the server**:
```bash
curl https://p3-telegram-webhook.username.repl.co/health
# Expected: {"status":"ok","service":"p3-telegram-webhook","chat_id_configured":true}
```

---

## Step 3: Directory and File Setup

### 3.1: Navigate to P3 Project Root

```bash
cd /home/runner/workspace
# Or wherever your P3 project is located
```

### 3.2: Create Directory Structure

The documentation files already exist in `docs/telegram/`. Now create the scripts:

```bash
# Core scripts directory
mkdir -p scripts/telegram/core
mkdir -p scripts/telegram/server
mkdir -p scripts/telegram/tools
mkdir -p scripts/telegram/integrations

# Verify
tree scripts/telegram
```

### 3.3: Create Core Scripts

All core scripts were detailed in [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) Section 3.2. Here's a quick creation script:

```bash
# Create all scripts at once
cat > scripts/telegram/core/notifyctl << 'EOF'
#!/bin/bash
FLAG_FILE="/tmp/telegram_notify_enabled"
case "$1" in
  on) touch "$FLAG_FILE" && echo "Notifications enabled" ;;
  off) rm -f "$FLAG_FILE" && echo "Notifications disabled" ;;
  status)
    if [[ -f "$FLAG_FILE" ]]; then
      echo "Notifications enabled"
      exit 0
    else
      echo "Notifications disabled"
      exit 1
    fi
    ;;
  *) echo "Usage: notifyctl {on|off|status}" && exit 1 ;;
esac
EOF

# Make executable
chmod +x scripts/telegram/core/notifyctl
```

**For full script content**, see [REPLICATION_GUIDE.md Section 3.2](./REPLICATION_GUIDE.md#32-core-scripts-setup).

**Quick setup script** (recommended):

Create `scripts/telegram/setup-p3.sh`:

```bash
#!/bin/bash
# setup-p3.sh - Quick setup for P3 Telegram bot

echo "🚀 Setting up P3 Telegram Bot..."

# Create directories
mkdir -p scripts/telegram/{core,server,tools,integrations}

# Download scripts from template (if available)
# Or manually copy from REPLICATION_GUIDE.md

echo "✅ Directories created"
echo ""
echo "Next steps:"
echo "  1. Copy script files from REPLICATION_GUIDE.md Section 3.2"
echo "  2. Run: chmod +x scripts/telegram/core/* scripts/telegram/tools/*"
echo "  3. Configure .env file"
echo "  4. Run: ./scripts/telegram/core/init.sh"
```

### 3.4: Configure Environment Variables

**Add to `.env` file** (root of P3 project):

```bash
# ===========================
# Telegram Bot Configuration
# ===========================

# Bot token from @BotFather
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890"

# Your Telegram chat ID (numeric)
TELEGRAM_CHAT_ID="987654321"

# Replit webhook URL (no /webhook suffix)
TELEGRAM_WEBHOOK_URL="https://p3-telegram-webhook.username.repl.co"

# Optional: Custom state directories (defaults work fine)
# TELEGRAM_STATE_DIR="/tmp/telegram_messages"
# TELEGRAM_REPLY_DIR="/tmp/telegram_replies"
```

**Verify `.gitignore`** includes `.env`:

```bash
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

---

## Step 4: Installation and Initialization

### 4.1: Make Scripts Executable

```bash
chmod +x scripts/telegram/core/*
chmod +x scripts/telegram/tools/*
```

### 4.2: Initialize the System

```bash
./scripts/telegram/core/init.sh
```

**Expected output**:
```
✅ Telegram bot system initialized
  Message directory: /tmp/telegram_messages
  Reply directory: /tmp/telegram_replies

Next steps:
  1. Configure .env with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
  2. Start webhook server on Replit
  3. Run: ./scripts/telegram/tools/webhook_register.sh
  4. Run: notifyctl on
```

### 4.3: Load Environment Variables

```bash
source .env

# Verify
echo "Bot token configured: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "Chat ID: $TELEGRAM_CHAT_ID"
echo "Webhook URL: $TELEGRAM_WEBHOOK_URL"
```

---

## Step 5: Webhook Registration

### 5.1: Verify Webhook Server is Running

**Check Replit**:
1. Open your `p3-telegram-webhook` Repl
2. Verify server is running (look for "Starting P3 Telegram webhook server..." in console)
3. Test health endpoint:
   ```bash
   curl https://p3-telegram-webhook.username.repl.co/health
   ```

**Expected response**:
```json
{
  "status": "ok",
  "service": "p3-telegram-webhook",
  "chat_id_configured": true,
  "project": "P3 Interview Academy"
}
```

### 5.2: Register Webhook with Telegram

```bash
./scripts/telegram/tools/webhook_register.sh
```

**Expected output**:
```
Registering webhook...
URL: https://p3-telegram-webhook.username.repl.co/webhook
✅ Webhook registered successfully

Verify with:
  curl 'https://api.telegram.org/bot123456789:ABC.../getWebhookInfo'
```

### 5.3: Verify Webhook Registration

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

**Expected response**:
```json
{
  "ok": true,
  "result": {
    "url": "https://p3-telegram-webhook.username.repl.co/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

**If `pending_update_count` is high**: Old messages pending, they'll be processed automatically.

### 5.4: Enable Notifications

```bash
# Enable notifications globally
notifyctl on

# Verify
notifyctl status
# Output: Notifications enabled
```

---

## Step 6: Testing the System

### 6.1: Test Simple Notification

```bash
notify.sh "✅ P3 Telegram Bot test - system is operational!"
```

**Check your Telegram** - you should receive the message within 2-3 seconds.

**If no message received**:
- Check `notifyctl status` → Should be "enabled"
- Verify bot token: `echo $TELEGRAM_BOT_TOKEN`
- Check Replit server logs for errors
- Verify you started a conversation with the bot

### 6.2: Test Approval Gate (Simple)

**In terminal**:
```bash
await_reply.sh "Test approval gate - please reply 'yes'" 60
```

**In Telegram**:
- You'll receive: "❓ Test approval gate - please reply 'yes'"
- Reply with: `yes`

**Terminal should show**:
```
Waiting for reply (timeout: 60s)...
✅ Approved: yes
```

**Exit code**: 0 (success)

### 6.3: Test Token-Based Approval

**In terminal**:
```bash
await_reply.sh "Test secure approval - reply: approve abc123" 60 "abc123"
```

**In Telegram**:
- You'll receive: "❓ Test secure approval - reply: approve abc123"
- Reply with: `approve abc123` (exact match required)

**Terminal should show**:
```
Waiting for reply (timeout: 60s)...
✅ Approved with token: abc123
```

### 6.4: Test Rejection

**In terminal**:
```bash
await_reply.sh "Test rejection - reply 'no'" 60
```

**In Telegram**:
- Reply with: `no`

**Terminal should show**:
```
Waiting for reply (timeout: 60s)...
❌ Rejected: no
```

**Exit code**: 1 (failure)

### 6.5: Test Timeout

```bash
# Very short timeout
await_reply.sh "Test timeout - don't reply" 5
```

**Wait 5 seconds** without replying.

**Terminal should show**:
```
Waiting for reply (timeout: 5s)...
Timeout after 5s - no reply received
```

**Exit code**: 1 (failure)

### 6.6: Run Full Test Suite

**Create** `scripts/telegram/test-p3.sh`:

```bash
#!/bin/bash
# test-p3.sh - P3-specific test suite

set -e

echo "=== P3 Telegram Bot Test Suite ==="
echo ""

# Load environment
source .env

# Test 1: Core scripts
echo "Test 1: Checking core scripts..."
for script in notifyctl notify.sh await_reply.sh init.sh; do
  if [[ -x "scripts/telegram/core/$script" ]]; then
    echo "  ✅ $script"
  else
    echo "  ❌ $script (missing or not executable)"
    exit 1
  fi
done

# Test 2: Environment
echo ""
echo "Test 2: Environment variables..."
[[ -n "$TELEGRAM_BOT_TOKEN" ]] && echo "  ✅ TELEGRAM_BOT_TOKEN" || exit 1
[[ -n "$TELEGRAM_CHAT_ID" ]] && echo "  ✅ TELEGRAM_CHAT_ID" || exit 1
[[ -n "$TELEGRAM_WEBHOOK_URL" ]] && echo "  ✅ TELEGRAM_WEBHOOK_URL" || exit 1

# Test 3: Webhook server
echo ""
echo "Test 3: Webhook server health..."
HEALTH=$(curl -s "${TELEGRAM_WEBHOOK_URL}/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "  ✅ Webhook server responding"
else
  echo "  ❌ Webhook server not responding"
  exit 1
fi

# Test 4: Send notification
echo ""
echo "Test 4: Sending test notification..."
notifyctl on > /dev/null
if notify.sh "✅ P3 Test Suite - All systems operational"; then
  echo "  ✅ Notification sent (check Telegram)"
else
  echo "  ❌ Failed to send notification"
  exit 1
fi

echo ""
echo "=== All Automated Tests Passed! ==="
echo ""
echo "Manual test:"
echo "  Run: await_reply.sh 'Manual test - reply yes' 30"
echo "  Then reply 'yes' in Telegram"
```

**Run it**:
```bash
chmod +x scripts/telegram/test-p3.sh
./scripts/telegram/test-p3.sh
```

---

## Step 7: Integrating with Existing Workflows

### 7.1: AWS Elastic Beanstalk Deployment

**Current P3 deployment** (from CLAUDE.md):
- Production: `p3-interview-academy-prod-v2`
- Staging: `p3-interview-academy-staging`
- GitHub Actions CI/CD pipeline

**Integration point**: Add approval gate between staging and production.

#### Modify GitHub Actions Workflow

**File**: `.github/workflows/deploy-main.yml`

**Current workflow** (simplified):
```yaml
jobs:
  deploy-staging:
    # ... deploy to staging ...

  deploy-production:
    needs: deploy-staging
    # ... deploy to production ...
```

**Add approval gate**:

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # ... existing staging deployment steps ...

      - name: Notify staging deployment complete
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: |
          chmod +x scripts/telegram/core/notify.sh
          ./scripts/telegram/core/notify.sh "✅ **Staging Deployment Complete**

**Environment**: \`p3-interview-academy-staging\`
**Commit**: \`${{ github.sha }}\`
**Author**: ${{ github.actor }}
**URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

Smoke tests passed. Ready for production approval."

  approve-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Request production approval
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: |
          chmod +x scripts/telegram/core/{notify.sh,await_reply.sh}

          # Enable notifications (GitHub Actions starts with clean /tmp)
          touch /tmp/telegram_notify_enabled

          # Generate secure token
          TOKEN=$(openssl rand -hex 6)

          # Request approval (15 minutes timeout)
          if ./scripts/telegram/core/await_reply.sh \
            "🚨 **PRODUCTION DEPLOYMENT APPROVAL REQUIRED**

**Environment**: \`p3-interview-academy-prod-v2\`
**Commit**: \`${{ github.sha }}\`
**Author**: ${{ github.actor }}
**Branch**: ${{ github.ref_name }}

**Changes**: $(git log -1 --pretty=%B | head -n 1)

**Staging URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

Reply within 15 minutes: \`approve $TOKEN\`" \
            900 \
            "$TOKEN"; then
            echo "✅ Production deployment approved"
          else
            echo "❌ Production deployment rejected or timed out"
            ./scripts/telegram/core/notify.sh "❌ **Production deployment CANCELLED**

Timeout or rejection. Commit \`${{ github.sha }}\` not deployed."
            exit 1
          fi

  deploy-production:
    needs: approve-production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # ... existing production deployment steps ...

      - name: Notify production deployment complete
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: |
          chmod +x scripts/telegram/core/notify.sh
          ./scripts/telegram/core/notify.sh "🎉 **PRODUCTION DEPLOYMENT COMPLETE**

**Environment**: \`p3-interview-academy-prod-v2\`
**Commit**: \`${{ github.sha }}\`
**URL**: http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

All systems operational. Deployment successful."
```

**Add GitHub Secrets**:
1. Go to repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `TELEGRAM_BOT_TOKEN` (your bot token)
   - `TELEGRAM_CHAT_ID` (your chat ID)

### 7.2: Database Migrations (Drizzle)

**Current P3 database** (from CLAUDE.md):
- PostgreSQL with Drizzle ORM
- Schema: `shared/schema.ts`
- Migrations: `npm run db:push`

**Integration**: Add approval gate before pushing schema changes.

**Create** `scripts/telegram/integrations/db-migrate-p3.sh`:

```bash
#!/bin/bash
# db-migrate-p3.sh - Database migration with Telegram approval

set -e

echo "🗄️  P3 Database Migration Tool"
echo "================================"
echo ""

# Load environment
source .env

# Enable notifications
notifyctl on

# Check for pending changes
echo "Checking for schema changes..."
CHANGES=$(npm run db:push -- --print 2>&1 | grep -A 20 "Changes:" || echo "No changes")

if [[ "$CHANGES" == "No changes" ]]; then
  echo "✅ No schema changes detected"
  notify.sh "ℹ️ **Database Migration Check**

No schema changes detected. Database is up to date."
  exit 0
fi

# Notify about pending changes
notify.sh "🗄️ **Database Migration Pending**

**Environment**: \`${DATABASE_URL##*/}\` (from DATABASE_URL)

**Changes detected**:
\`\`\`
$CHANGES
\`\`\`

Preparing migration approval..."

echo ""
echo "Schema changes:"
echo "$CHANGES"
echo ""

# Generate approval token
TOKEN=$(openssl rand -hex 6)

# Request approval
if await_reply.sh "🚨 **DATABASE MIGRATION APPROVAL**

**Changes**:
\`\`\`
$CHANGES
\`\`\`

**⚠️ WARNING**: This will modify the production database!

Review changes carefully. Reply within 10 minutes: \`approve $TOKEN\`" \
  600 \
  "$TOKEN"; then

  echo "✅ Migration approved - proceeding..."

  notify.sh "⏳ **Applying database migration...**

Changes approved. Migration in progress..."

  # Apply migration
  if npm run db:push; then
    notify.sh "✅ **Database migration COMPLETE**

All tables updated successfully. Schema is current."
    echo "✅ Migration complete"
  else
    notify.sh "❌ **Database migration FAILED**

Error occurred during migration. Check logs immediately!

Database may be in inconsistent state. Review and rollback if necessary."
    echo "❌ Migration failed"
    exit 1
  fi

else
  notify.sh "❌ **Database migration CANCELLED**

User rejected or timeout. No changes applied to database."
  echo "❌ Migration cancelled"
  exit 1
fi
```

**Usage**:
```bash
chmod +x scripts/telegram/integrations/db-migrate-p3.sh
./scripts/telegram/integrations/db-migrate-p3.sh
```

### 7.3: Gemini Research Agent Integration

**P3 uses Gemini CLI** for research tasks (mentioned in CLAUDE.md).

**Integration**: Notify when research starts/completes.

**Create** `scripts/telegram/integrations/gemini-notify-p3.sh`:

```bash
#!/bin/bash
# gemini-notify-p3.sh - Wrapper for Gemini research with notifications

QUERY="$1"

if [[ -z "$QUERY" ]]; then
  echo "Usage: $0 <research query>"
  exit 1
fi

# Load environment
source .env

# Enable notifications
notifyctl on

# Notify start
notify.sh "🔬 **Gemini Research Started**

**Query**: $QUERY

Expected duration: 10-30 minutes. You'll be notified when complete."

echo "🔬 Starting Gemini research: $QUERY"
START_TIME=$(date +%s)

# Run research (replace with actual Gemini CLI command)
# Example: gemini-cli research "$QUERY" > /tmp/research.md
echo "Running: gemini-cli research \"$QUERY\""
# ... actual research command ...

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Notify completion
notify.sh "✅ **Gemini Research Complete**

**Query**: $QUERY
**Duration**: ${DURATION}s (~$((DURATION / 60)) minutes)

Results ready for review."

echo "✅ Research complete - duration: ${DURATION}s"
```

**Usage**:
```bash
chmod +x scripts/telegram/integrations/gemini-notify-p3.sh
./scripts/telegram/integrations/gemini-notify-p3.sh "React 19 server components best practices"
```

### 7.4: Stripe Webhook Testing (Local)

**P3 has Stripe CLI** installed (from CLAUDE.md).

**Integration**: Notify when testing Stripe webhooks locally.

**Create** `scripts/telegram/integrations/stripe-test-notify.sh`:

```bash
#!/bin/bash
# stripe-test-notify.sh - Stripe webhook testing with notifications

source .env
notifyctl on

notify.sh "💳 **Stripe Webhook Testing Started**

Forwarding webhooks to local server: \`localhost:5000/api/webhooks/stripe\`

Test payment events to verify integration."

echo "💳 Starting Stripe webhook forwarding..."
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# When stopped (Ctrl+C), notify
notify.sh "💳 **Stripe Webhook Testing Stopped**

Local webhook forwarding ended."
```

---

## Step 8: Monitoring and Maintenance

### 8.1: Daily Monitoring

**Create a monitoring script** `scripts/telegram/tools/monitor-p3.sh`:

```bash
#!/bin/bash
# monitor-p3.sh - P3-specific monitoring

echo "=== P3 Telegram Bot Status ==="
echo ""

# Notification status
echo "📱 Notification Status:"
notifyctl status
echo ""

# Webhook server health
echo "🌐 Webhook Server:"
if curl -s "${TELEGRAM_WEBHOOK_URL}/health" | grep -q '"status":"ok"'; then
  echo "  ✅ Online and responding"
else
  echo "  ❌ Offline or unreachable"
fi
echo ""

# Recent messages
echo "📬 Recent Messages (last 10):"
ls -lt /tmp/telegram_messages/ 2>/dev/null | head -11 | tail -10 || echo "  No messages"
echo ""

# Pending approvals
echo "⏳ Pending Approvals:"
PENDING=$(ls /tmp/telegram_replies/reply_*.txt 2>/dev/null | wc -l)
if [[ $PENDING -gt 0 ]]; then
  echo "  ⚠️  $PENDING pending approval(s)"
  ls -lt /tmp/telegram_replies/reply_*.txt | head -5
else
  echo "  ✅ No pending approvals"
fi
echo ""

# Webhook registration
echo "🔗 Webhook Registration:"
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
if echo "$WEBHOOK_INFO" | grep -q "$TELEGRAM_WEBHOOK_URL"; then
  echo "  ✅ Registered correctly"
else
  echo "  ⚠️  Not registered or URL mismatch"
  echo "  Run: ./scripts/telegram/tools/webhook_register.sh"
fi
```

**Run daily** (or add to cron):
```bash
./scripts/telegram/tools/monitor-p3.sh
```

### 8.2: Cleanup Automation

**Add to crontab** (or systemd timer):

```bash
# Clean up stale Telegram files every hour
0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh 60

# Or manually:
./scripts/telegram/tools/cleanup.sh
```

### 8.3: Replit Keep-Alive

**Prevent Replit from sleeping** (free tier sleeps after 1 hour):

**Option 1**: UptimeRobot (Recommended)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add HTTP(s) monitor
3. URL: `https://p3-telegram-webhook.username.repl.co/health`
4. Interval: 5 minutes

**Option 2**: Cron job from P3 server
```bash
# Add to crontab
*/5 * * * * curl -s https://p3-telegram-webhook.username.repl.co/health > /dev/null 2>&1
```

**Option 3**: Replit Always-On ($7/month)
- In Repl settings, enable "Always On"

### 8.4: Token Rotation Schedule

**Security best practice**: Rotate bot tokens every 90 days.

**Create reminder** `scripts/telegram/tools/rotation-reminder.sh`:

```bash
#!/bin/bash
# rotation-reminder.sh - Check if token needs rotation

LAST_ROTATION="2025-11-01"  # Update when you rotate
NEXT_ROTATION=$(date -d "$LAST_ROTATION + 90 days" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

if [[ "$TODAY" > "$NEXT_ROTATION" ]]; then
  notify.sh "⚠️ **Security Alert: Token Rotation Overdue**

Last rotation: $LAST_ROTATION
Next rotation: $NEXT_ROTATION (overdue by $(( ($(date +%s) - $(date -d "$NEXT_ROTATION" +%s)) / 86400 )) days)

Action required:
1. Message @BotFather
2. Send /revoke → select bot
3. Send /token → generate new token
4. Update .env and Replit Secrets"
else
  DAYS_UNTIL=$(( ($(date -d "$NEXT_ROTATION" +%s) - $(date +%s)) / 86400 ))
  echo "✅ Token rotation due in $DAYS_UNTIL days ($NEXT_ROTATION)"
fi
```

**Run monthly**:
```bash
./scripts/telegram/tools/rotation-reminder.sh
```

### 8.5: Incident Response

**If notifications stop working**:

1. **Check notification status**:
   ```bash
   notifyctl status
   # If disabled: notifyctl on
   ```

2. **Check webhook server**:
   ```bash
   curl https://p3-telegram-webhook.username.repl.co/health
   # If fails: Restart Replit server
   ```

3. **Check webhook registration**:
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   # If wrong URL: ./scripts/telegram/tools/webhook_register.sh
   ```

4. **Check Replit logs**:
   - Open Replit console
   - Look for errors (unauthorized, connection issues)
   - Verify Secrets are set correctly

5. **Manual notification test**:
   ```bash
   curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
     -d "chat_id=${TELEGRAM_CHAT_ID}" \
     -d "text=Manual test"
   ```

---

## Appendix: Integration Checklist

After setup, verify all integrations:

- [ ] **Core System**
  - [ ] `notifyctl on/off/status` works
  - [ ] `notify.sh "test"` sends messages
  - [ ] `await_reply.sh` receives replies
  - [ ] Webhook server running on Replit
  - [ ] Webhook registered with Telegram

- [ ] **AWS Deployment**
  - [ ] GitHub Actions workflow updated
  - [ ] Secrets added to repository
  - [ ] Test deployment with approval gate

- [ ] **Database Migrations**
  - [ ] `db-migrate-p3.sh` created
  - [ ] Test migration approval flow
  - [ ] Rollback procedure documented

- [ ] **Gemini Research**
  - [ ] `gemini-notify-p3.sh` created
  - [ ] Test research notifications

- [ ] **Stripe Testing**
  - [ ] `stripe-test-notify.sh` created (optional)

- [ ] **Monitoring**
  - [ ] `monitor-p3.sh` runs successfully
  - [ ] Cleanup cron job configured
  - [ ] UptimeRobot or Always-On enabled

---

**Setup Complete!** 🎉

Your P3 Telegram Bot Controller is now operational. For real-world usage examples, see [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md).

**Next Steps**:
1. Test the system with a real deployment
2. Customize notification messages for your team
3. Add project-specific integration scripts

**Support**:
- Documentation: `docs/telegram/*.md`
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
**Project**: P3 Interview Academy
