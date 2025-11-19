# Telegram Notification System - Export & Sharing Guide

**Version**: 1.0
**Last Updated**: 2025-11-06

---

## Overview

This guide explains how to export the Telegram notification system to:
- Other projects
- Team members' environments
- New development machines
- CI/CD pipelines

---

## Table of Contents

1. [What Gets Exported](#what-gets-exported)
2. [Quick Export (Single Command)](#quick-export-single-command)
3. [Step-by-Step Export](#step-by-step-export)
4. [Team Setup](#team-setup)
5. [Multi-Environment Configuration](#multi-environment-configuration)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## What Gets Exported

### Core Files (Required)

```
.claude/
├── settings.json                      # Claude Code permissions
├── bash-approval-notifier-v2.sh      # Notification hook
├── send-approval-confirmation.sh     # Confirmation sender
├── test-bg-job.sh                    # Background job test
├── restore-config.sh                 # Restore after restart
└── check-health.sh                   # Health check script

scripts/telegram/
├── core/
│   ├── notify.sh                     # Send Telegram messages
│   ├── notifyctl                     # Control script (on/off)
│   └── await_reply.sh                # Blocking approval request
├── tools/
│   ├── monitor.sh                    # System monitoring
│   └── webhook_info.sh               # Webhook status
└── .env                              # Telegram credentials (GITIGNORED)

.notify.enabled                        # Flag file (enable/disable)
```

### Documentation Files (Recommended)

```
docs/telegram/
├── README.md                          # Quick start
├── SETUP_GUIDE.md                    # Complete setup
├── PERMISSIONS_AND_NOTIFICATIONS.md  # This architecture guide
├── EXPORT_GUIDE.md                   # This file
├── COMMAND_GUIDE.md                  # User commands
├── ARCHITECTURE.md                   # System design
└── TROUBLESHOOTING.md                # Common issues
```

### Configuration Files (Project-Specific)

```
.gitignore                             # Exclude .env from git
.replit                                # Replit configuration (if using)
```

---

## Quick Export (Single Command)

### Create Export Package

```bash
#!/bin/bash
# create-telegram-export.sh

# Create export directory
mkdir -p /tmp/telegram-notification-export

# Copy core files
cp -r .claude /tmp/telegram-notification-export/
cp -r scripts/telegram /tmp/telegram-notification-export/
cp -r docs/telegram /tmp/telegram-notification-export/
cp .notify.enabled /tmp/telegram-notification-export/

# Create .env template (without secrets)
cat > /tmp/telegram-notification-export/scripts/telegram/.env.example << 'EOF'
# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here
CHAT_ID=your_chat_id_here
EOF

# Create README
cat > /tmp/telegram-notification-export/README.md << 'EOF'
# Telegram Notification System Export

## Quick Setup

1. Install dependencies:
   - Claude Code
   - Telegram bot token
   - curl/jq

2. Copy files:
   ```bash
   cp -r .claude ~/project/.claude
   cp -r scripts/telegram ~/project/scripts/
   cp -r docs/telegram ~/project/docs/
   ```

3. Configure credentials:
   ```bash
   nano ~/project/scripts/telegram/.env
   # Add your BOT_TOKEN and CHAT_ID
   ```

4. Restore configuration:
   ```bash
   ~/project/.claude/restore-config.sh
   ```

5. Test:
   ```bash
   ~/project/scripts/telegram/core/notify.sh "Test message"
   ```

See docs/telegram/SETUP_GUIDE.md for complete instructions.
EOF

# Create archive
cd /tmp/telegram-notification-export
tar -czf ../telegram-notification-system.tar.gz .
cd -

echo "✅ Export created: /tmp/telegram-notification-system.tar.gz"
echo "📦 Size: $(du -h /tmp/telegram-notification-system.tar.gz | cut -f1)"
```

**Usage**:
```bash
chmod +x create-telegram-export.sh
./create-telegram-export.sh
```

---

## Step-by-Step Export

### Step 1: Prepare Export Directory

```bash
# Create clean export directory
export EXPORT_DIR="/tmp/telegram-export-$(date +%Y%m%d)"
mkdir -p "$EXPORT_DIR"
```

### Step 2: Copy Core Scripts

```bash
# Claude Code configuration
mkdir -p "$EXPORT_DIR/.claude"
cp /home/runner/workspace/.claude/settings.json "$EXPORT_DIR/.claude/"
cp /home/runner/workspace/.claude/bash-approval-notifier-v2.sh "$EXPORT_DIR/.claude/"
cp /home/runner/workspace/.claude/send-approval-confirmation.sh "$EXPORT_DIR/.claude/"
cp /home/runner/workspace/.claude/test-bg-job.sh "$EXPORT_DIR/.claude/"
cp /home/runner/workspace/.claude/restore-config.sh "$EXPORT_DIR/.claude/"
cp /home/runner/workspace/.claude/check-health.sh "$EXPORT_DIR/.claude/"

# Telegram scripts
mkdir -p "$EXPORT_DIR/scripts/telegram/core"
mkdir -p "$EXPORT_DIR/scripts/telegram/tools"
cp /home/runner/workspace/scripts/telegram/core/notify.sh "$EXPORT_DIR/scripts/telegram/core/"
cp /home/runner/workspace/scripts/telegram/core/notifyctl "$EXPORT_DIR/scripts/telegram/core/"
cp /home/runner/workspace/scripts/telegram/core/await_reply.sh "$EXPORT_DIR/scripts/telegram/core/"
cp /home/runner/workspace/scripts/telegram/tools/*.sh "$EXPORT_DIR/scripts/telegram/tools/"

# Flag file
cp /home/runner/workspace/.notify.enabled "$EXPORT_DIR/"
```

### Step 3: Copy Documentation

```bash
mkdir -p "$EXPORT_DIR/docs/telegram"
cp /home/runner/workspace/docs/telegram/*.md "$EXPORT_DIR/docs/telegram/"
```

### Step 4: Create Environment Template

```bash
cat > "$EXPORT_DIR/scripts/telegram/.env.example" << 'EOF'
# Telegram Bot Configuration
# Get BOT_TOKEN from @BotFather on Telegram
# Get CHAT_ID from @userinfobot on Telegram

BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
CHAT_ID=123456789
EOF
```

### Step 5: Sanitize Sensitive Data

```bash
# Remove any existing .env files (contain secrets)
find "$EXPORT_DIR" -name ".env" -type f -delete

# Create gitignore
cat > "$EXPORT_DIR/.gitignore" << 'EOF'
# Telegram credentials
scripts/telegram/.env

# Temporary files
*.log
/tmp/

# OS files
.DS_Store
Thumbs.db
EOF
```

### Step 6: Create Setup Script

```bash
cat > "$EXPORT_DIR/install.sh" << 'EOF'
#!/bin/bash
# Telegram Notification System Installer

set -e

PROJECT_DIR="${1:-$HOME/workspace}"
echo "Installing Telegram notification system to: $PROJECT_DIR"

# Copy files
echo "📂 Copying files..."
cp -r .claude "$PROJECT_DIR/"
cp -r scripts/telegram "$PROJECT_DIR/scripts/"
cp -r docs/telegram "$PROJECT_DIR/docs/"
cp .notify.enabled "$PROJECT_DIR/"

# Make scripts executable
echo "🔧 Setting permissions..."
chmod +x "$PROJECT_DIR/.claude"/*.sh
chmod +x "$PROJECT_DIR/scripts/telegram/core"/*
chmod +x "$PROJECT_DIR/scripts/telegram/tools"/*.sh

# Setup credentials
echo "🔑 Configure credentials:"
echo "Edit $PROJECT_DIR/scripts/telegram/.env"
echo "Add your BOT_TOKEN and CHAT_ID"

# Restore configuration
echo "♻️  Restoring configuration..."
"$PROJECT_DIR/.claude/restore-config.sh"

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. nano $PROJECT_DIR/scripts/telegram/.env"
echo "2. Add your BOT_TOKEN and CHAT_ID"
echo "3. Test: $PROJECT_DIR/scripts/telegram/core/notify.sh 'Test message'"
EOF

chmod +x "$EXPORT_DIR/install.sh"
```

### Step 7: Create Archive

```bash
cd "$EXPORT_DIR"
tar -czf "../telegram-notification-$(date +%Y%m%d).tar.gz" .
cd -

echo "✅ Export complete: $(dirname $EXPORT_DIR)/telegram-notification-$(date +%Y%m%d).tar.gz"
```

---

## Team Setup

### Scenario: Onboarding New Team Member

**Export Package Creator** (One-time):
```bash
# Create export package
./create-telegram-export.sh

# Share with team (choose one)
# Option 1: Upload to shared drive
cp /tmp/telegram-notification-system.tar.gz /mnt/team-drive/

# Option 2: Create GitHub release
gh release create v1.0 /tmp/telegram-notification-system.tar.gz

# Option 3: Email/Slack
# Attach: /tmp/telegram-notification-system.tar.gz
```

**New Team Member** (Installation):
```bash
# 1. Download package
# From shared drive / GitHub release / email

# 2. Extract
tar -xzf telegram-notification-system.tar.gz -C /tmp/telegram-install

# 3. Install
cd /tmp/telegram-install
./install.sh ~/my-project

# 4. Configure credentials (each team member needs their own chat)
nano ~/my-project/scripts/telegram/.env

# Add:
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz  # Shared bot token
CHAT_ID=987654321                                  # Your personal chat ID

# 5. Test
~/my-project/scripts/telegram/core/notify.sh "Hello from $(whoami)!"
```

### Shared vs Individual Configuration

**Shared (All Team Members)**:
- Bot token (same bot)
- Scripts and hooks
- Pre-approved command lists
- Documentation

**Individual (Per Team Member)**:
- Chat ID (different for each person)
- Personal notification preferences
- Optional: webhook for personal commands

---

## Multi-Environment Configuration

### Development, Staging, Production

```bash
# Structure
.claude/
├── settings.json                    # Base settings
├── settings.dev.json               # Dev overrides
├── settings.staging.json           # Staging overrides
├── settings.prod.json              # Production overrides
└── bash-approval-notifier-v2.sh

scripts/telegram/
├── .env.dev                         # Dev bot credentials
├── .env.staging                     # Staging bot credentials
├── .env.prod                        # Production bot credentials
└── core/notify.sh                   # Auto-detects environment
```

**Environment-Aware notify.sh**:
```bash
#!/bin/bash
# Enhanced notify.sh with environment detection

# Detect environment
if [[ "$PWD" == *"/staging"* ]]; then
    ENV="staging"
elif [[ "$PWD" == *"/production"* ]]; then
    ENV="prod"
else
    ENV="dev"
fi

# Load appropriate credentials
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.$ENV"

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "⚠️  Warning: Environment file not found: $ENV_FILE"
    exit 1
fi

# Send message with environment tag
MESSAGE="[$ENV] $1"
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d "chat_id=$CHAT_ID" \
    -d "text=$MESSAGE" \
    -d "parse_mode=Markdown"
```

**Environment-Specific Settings**:
```json
// settings.dev.json - More permissive
{
  "permissions": {
    "allow": ["Bash(*)"],  // Allow everything in dev
    "ask": []
  }
}

// settings.prod.json - Restrictive
{
  "permissions": {
    "allow": [
      "Bash(aws elasticbeanstalk describe-:*)"  // Read-only
    ],
    "ask": [
      "Bash(aws elasticbeanstalk update-:*)"    // Write requires approval
    ]
  }
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy with Telegram Notifications

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Telegram Notifications
        run: |
          # Create .env from secrets
          cat > scripts/telegram/.env << EOF
          BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}
          CHAT_ID=${{ secrets.TELEGRAM_CHAT_ID }}
          EOF

          # Make scripts executable
          chmod +x scripts/telegram/core/*.sh

      - name: Notify Deploy Start
        run: |
          scripts/telegram/core/notify.sh "🚀 Deployment started - ${{ github.sha }}"

      - name: Deploy to AWS
        run: |
          # Your deployment commands
          npm run build
          aws s3 sync ./dist s3://my-bucket/

      - name: Notify Deploy Success
        if: success()
        run: |
          scripts/telegram/core/notify.sh "✅ Deployment successful - ${{ github.sha }}"

      - name: Notify Deploy Failure
        if: failure()
        run: |
          scripts/telegram/core/notify.sh "❌ Deployment failed - ${{ github.sha }}"
```

### GitLab CI Example

```yaml
# .gitlab-ci.yml
stages:
  - notify
  - deploy

variables:
  TELEGRAM_SCRIPT: "./scripts/telegram/core/notify.sh"

before_script:
  - echo "BOT_TOKEN=$TELEGRAM_BOT_TOKEN" > scripts/telegram/.env
  - echo "CHAT_ID=$TELEGRAM_CHAT_ID" >> scripts/telegram/.env
  - chmod +x scripts/telegram/core/*.sh

deploy:
  stage: deploy
  script:
    - $TELEGRAM_SCRIPT "🚀 Deploying $CI_COMMIT_SHORT_SHA"
    - npm run deploy
    - $TELEGRAM_SCRIPT "✅ Deploy complete"
  after_script:
    - if [ $CI_JOB_STATUS == 'failed' ]; then
        $TELEGRAM_SCRIPT "❌ Deploy failed - $CI_JOB_URL";
      fi
```

---

## Configuration Checklist

When exporting to a new environment, verify:

- [ ] Bot token configured in `.env`
- [ ] Chat ID configured in `.env`
- [ ] Scripts are executable (`chmod +x`)
- [ ] Notification hook is active in `settings.json`
- [ ] Pre-approved commands match your needs
- [ ] `.notify.enabled` file exists
- [ ] Test notification works
- [ ] Test pre-approved command (no notification)
- [ ] Test non-approved command (gets notification)

**Quick Test Script**:
```bash
#!/bin/bash
# test-export.sh

echo "🧪 Testing Telegram Notification Export..."

# Test 1: Notification system
echo "Test 1: Send test notification"
./scripts/telegram/core/notify.sh "Test from export" && echo "✅ Pass" || echo "❌ Fail"

# Test 2: Pre-approved command (should NOT notify)
echo "Test 2: Pre-approved command (git status)"
git status > /dev/null && echo "✅ Pass (no notification expected)" || echo "❌ Fail"

# Test 3: Control script
echo "Test 3: Notification control"
./scripts/telegram/core/notifyctl status && echo "✅ Pass" || echo "❌ Fail"

# Test 4: Configuration check
echo "Test 4: Configuration health"
./.claude/check-health.sh && echo "✅ Pass" || echo "❌ Fail"

echo "🏁 Tests complete"
```

---

## Import to New Project

### Quick Import

```bash
# 1. Extract package
tar -xzf telegram-notification-system.tar.gz -C /tmp/telegram-import

# 2. Copy to project
cd /tmp/telegram-import
./install.sh /path/to/new/project

# 3. Configure credentials
nano /path/to/new/project/scripts/telegram/.env

# 4. Test
/path/to/new/project/scripts/telegram/core/notify.sh "Import successful!"
```

### Custom Integration

If you have existing Claude Code settings:

```bash
# Merge permissions (don't overwrite)
cd /path/to/new/project

# Backup existing settings
cp .claude/settings.json .claude/settings.json.backup

# Merge allow lists
jq -s '.[0].permissions.allow + .[1].permissions.allow | unique' \
  .claude/settings.json.backup \
  /tmp/telegram-import/.claude/settings.json \
  > .claude/settings.json.merged

# Add hooks section
jq '.hooks = {
  "PreToolUse": [{
    "matcher": "Bash",
    "hooks": [{
      "type": "command",
      "command": "'$(pwd)'/.claude/bash-approval-notifier-v2.sh",
      "timeout": 2
    }]
  }]
}' .claude/settings.json.merged > .claude/settings.json
```

---

## Troubleshooting Export

### Issue: Scripts Don't Execute

```bash
# Fix permissions
find .claude -type f -name "*.sh" -exec chmod +x {} \;
find scripts/telegram -type f -name "*.sh" -exec chmod +x {} \;
find scripts/telegram/core -type f ! -name "*.sh" ! -name ".env*" -exec chmod +x {} \;
```

### Issue: Notifications Not Working

```bash
# Check credentials
cat scripts/telegram/.env
# Verify BOT_TOKEN and CHAT_ID are set

# Test Telegram API directly
BOT_TOKEN="your_token"
CHAT_ID="your_chat_id"
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID" \
  -d "text=Direct test"
```

### Issue: Hook Not Triggering

```bash
# Check if hook is in settings
cat .claude/settings.json | jq '.hooks'

# Verify notification file exists
ls -la .notify.enabled

# Check script path in settings matches actual location
grep "command" .claude/settings.json
```

---

## Version Control

### What to Commit

```gitignore
# Commit these
.claude/settings.json
.claude/*.sh
scripts/telegram/core/*.sh
scripts/telegram/tools/*.sh
docs/telegram/*.md
.notify.enabled

# Do NOT commit
scripts/telegram/.env      # Contains secrets
.claude/data/*.log         # Runtime logs
```

### .gitignore Template

```gitignore
# Telegram credentials (NEVER COMMIT)
scripts/telegram/.env
scripts/telegram/.env.*
!scripts/telegram/.env.example

# Runtime files
.notify.enabled.bak
*.log
/tmp/

# OS files
.DS_Store
Thumbs.db
```

---

## Distribution Options

### Option 1: Git Repository

```bash
# Create standalone repo
git init telegram-notification-system
cd telegram-notification-system
cp -r /path/to/export/* .
git add .
git commit -m "Initial export"
git remote add origin https://github.com/yourorg/telegram-notifications.git
git push -u origin main
```

### Option 2: NPM Package

```json
{
  "name": "@yourorg/telegram-notifications",
  "version": "1.0.0",
  "description": "Claude Code Telegram notification system",
  "main": "index.js",
  "bin": {
    "telegram-install": "./install.sh"
  },
  "files": [
    ".claude/",
    "scripts/",
    "docs/",
    "install.sh"
  ]
}
```

### Option 3: Docker Image

```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    bash

# Copy notification system
COPY .claude /workspace/.claude
COPY scripts /workspace/scripts
COPY docs /workspace/docs

# Make executable
RUN chmod +x /workspace/.claude/*.sh
RUN chmod +x /workspace/scripts/telegram/core/*

WORKDIR /workspace
CMD ["/bin/bash"]
```

---

## Related Documentation

- [PERMISSIONS_AND_NOTIFICATIONS.md](./PERMISSIONS_AND_NOTIFICATIONS.md) - Permission architecture
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Initial setup
- [COMMAND_GUIDE.md](./COMMAND_GUIDE.md) - User commands
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

**Maintainer**: P3 Interview Academy Team
**Last Review**: 2025-11-06
**Version**: 1.0
