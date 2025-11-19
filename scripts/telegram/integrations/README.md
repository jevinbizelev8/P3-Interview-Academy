# P3 Interview Academy - Telegram Notification Integrations

## Overview

This directory contains specialized notification wrappers for P3 development workflows. Each integration wraps a specific tool and adds Telegram notifications for key events.

## Available Integrations

### 1. Stripe Webhook Testing 💳

**Script**: `stripe-test-notify.sh`

**Purpose**: Local Stripe webhook testing with payment event notifications

**Key Features**:
- Real-time webhook forwarding notifications
- Payment event alerts (checkout, success, failure)
- Subscription lifecycle notifications
- Session duration tracking
- Test card reference in start notification

**Documentation**:
- 📘 [Usage Guide](README_STRIPE.md) - Complete reference
- 🧪 [Testing Guide](TESTING_STRIPE.md) - End-to-end test scenarios
- ⚡ [Quick Reference](QUICK_REFERENCE_STRIPE.md) - One-line commands

**Quick Start**:
```bash
./scripts/telegram/integrations/stripe-test-notify.sh
```

**Use Cases**:
- Testing credit purchase flow locally
- Debugging webhook integration
- Verifying payment error handling
- Testing subscription changes

---

### 2. Database Migrations 🗄️

**Script**: `db-migrate-p3.sh`

**Purpose**: Database migration notifications for P3 schema changes

**Key Features**:
- Migration start/completion notifications
- SQL execution alerts
- Error detection and reporting
- Multi-environment support (dev/staging/prod)

**Documentation**:
- 📘 [Usage Guide](README_DB_MIGRATE.md) - Complete reference
- 🧪 [Testing Guide](TESTING_DB_MIGRATE.md) - Migration test scenarios
- ⚡ [Quick Reference](QUICK_REFERENCE_DB_MIGRATE.md) - One-line commands

**Quick Start**:
```bash
./scripts/telegram/integrations/db-migrate-p3.sh path/to/migration.sql
```

**Use Cases**:
- Running database schema updates
- Tracking migration deployment
- Multi-environment migration coordination
- Schema change auditing

---

### 3. Gemini AI Research 🤖

**Script**: `gemini-notify-p3.sh`

**Purpose**: Long-running AI research task notifications

**Key Features**:
- Research session start/completion alerts
- Token usage tracking
- Error and timeout notifications
- Result summary delivery

**Documentation**:
- 🧪 [Testing Guide](TESTING_GEMINI.md) - Research workflow tests
- 📚 [Examples](EXAMPLES_GEMINI.md) - Common research patterns

**Quick Start**:
```bash
./scripts/telegram/integrations/gemini-notify-p3.sh "Research prompt here"
```

**Use Cases**:
- Long-running AI research tasks
- Competitive analysis automation
- Documentation generation
- API research and discovery

---

### 4. Claude Code Operations 🤖

**Script**: `claude-session-notify.sh`

**Purpose**: Autonomous agent notification system for Claude Code workflows

**Key Features**:
- Task progress tracking (start/complete)
- Critical operation approval gates
- Error alerts requiring attention
- Auto-approve in silent mode (no blocking)

**Documentation**:
- 📘 [Usage Guide](README_CLAUDE_OPS.md) - Complete reference
- 🧪 [Testing Guide](TESTING_CLAUDE_OPS.md) - Test procedures

**Quick Start**:
```bash
# Start notification
./scripts/telegram/integrations/claude-session-notify.sh start "Task description"

# Request approval (blocks until response)
if ./scripts/telegram/integrations/claude-session-notify.sh approve "Delete files?" "Count: 50"; then
  # Approved - proceed with operation
  rm files/*
fi

# Complete notification
./scripts/telegram/integrations/claude-session-notify.sh complete "Task done" "Details"

# Alert notification
./scripts/telegram/integrations/claude-session-notify.sh alert "Error occurred" "Details"
```

**Use Cases**:
- Long-running agent tasks (>1 minute)
- Destructive operations requiring approval
- Error conditions requiring human intervention
- Multi-step workflow progress tracking

---

## Common Features

All integrations share these characteristics:

### Silent Mode Support
When notifications are disabled, all scripts fall back to standard tool behavior:
```bash
./scripts/notifyctl off
./scripts/telegram/integrations/stripe-test-notify.sh
# Runs stripe listen without notifications
```

### Graceful Error Handling
- Tool availability checks (Stripe CLI, psql, etc.)
- Configuration validation
- Clear error messages with solutions

### Session Tracking
- Start/stop notifications with timestamps
- Duration tracking
- Event/operation counting
- Resource usage reporting (where applicable)

### Consistent Notification Format
```
[Icon] Event Title

Key: Value
Key: Value

Status message
```

---

## Quick Comparison

| Integration | Tool Wrapped | Primary Use Case | Avg Duration |
|-------------|--------------|------------------|--------------|
| **Stripe** | `stripe listen` | Payment testing | Minutes to hours |
| **Database** | `psql` | Schema migrations | Seconds to minutes |
| **Gemini** | `gemini-research.sh` | AI research | Minutes to hours |
| **Claude Ops** | N/A (standalone) | Agent workflows | Varies by task |

---

## Installation & Setup

### Prerequisites

1. **Notification System Enabled**:
   ```bash
   ./scripts/notifyctl status
   # Should show: Notifications: enabled
   ```

2. **Tool-Specific Requirements**:

   **Stripe**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe  # macOS
   stripe login  # Authenticate
   ```

   **Database**:
   ```bash
   # PostgreSQL client required
   which psql
   # DATABASE_URL environment variable set
   ```

   **Gemini**:
   ```bash
   # Gemini research script available
   ls -la scripts/telegram/tools/gemini-research.sh
   ```

### Verify Setup

```bash
# Test notification system
./scripts/telegram/core/notify.sh "Test message"

# Test tool availability
stripe --version      # For Stripe integration
psql --version       # For database integration
gemini --version     # For Gemini integration (if applicable)
```

---

## Usage Patterns

### Development Workflow Integration

**Typical P3 development session**:

```bash
# Terminal 1: Start webhook forwarding
./scripts/telegram/integrations/stripe-test-notify.sh

# Terminal 2: Start application
npm run dev

# Terminal 3: Run migrations if needed
./scripts/telegram/integrations/db-migrate-p3.sh migrations/add_new_table.sql

# Terminal 4: Available for testing/debugging
stripe trigger checkout.session.completed
```

### CI/CD Integration

Integrations can be used in automated pipelines:

```bash
# In deployment script
if [[ -f .notify.enabled ]]; then
  ./scripts/telegram/integrations/db-migrate-p3.sh \
    --env production \
    migrations/v1.2.0.sql
else
  psql -f migrations/v1.2.0.sql
fi
```

---

## Notification Management

### Enable/Disable All Integrations

```bash
# Enable notifications
./scripts/notifyctl on

# Disable notifications
./scripts/notifyctl off

# Check status
./scripts/notifyctl status
```

### Per-Integration Control

All integrations respect the global notification state (`.notify.enabled` file). There is no per-integration toggle.

**Workaround for selective notifications**:
```bash
# Temporarily disable for specific command
./scripts/notifyctl off
./scripts/telegram/integrations/stripe-test-notify.sh
./scripts/notifyctl on
```

---

## Troubleshooting

### Common Issues Across All Integrations

**Notifications Not Received**:
```bash
# 1. Check notification system status
./scripts/notifyctl status

# 2. Test core notification
./scripts/telegram/core/notify.sh "Test"

# 3. Verify Telegram configuration
cat scripts/telegram/.env

# 4. Check bot token and chat ID
```

**Tool Not Found Errors**:
```bash
# Each integration checks for required tools
# Follow installation instructions in error message

# Example: Stripe CLI not found
brew install stripe/stripe-cli/stripe
```

**Permission Denied**:
```bash
# Make scripts executable
chmod +x scripts/telegram/integrations/*.sh
```

### Integration-Specific Issues

See individual README files for detailed troubleshooting:
- Stripe: [README_STRIPE.md#troubleshooting](README_STRIPE.md#troubleshooting)
- Database: [README_DB_MIGRATE.md#troubleshooting](README_DB_MIGRATE.md#troubleshooting)
- Gemini: [TESTING_GEMINI.md#troubleshooting](TESTING_GEMINI.md#troubleshooting)

---

## Architecture

### Directory Structure

```
scripts/telegram/integrations/
├── README.md                          # This file
│
├── stripe-test-notify.sh              # Stripe webhook wrapper
├── README_STRIPE.md                   # Stripe usage guide
├── TESTING_STRIPE.md                  # Stripe testing scenarios
├── QUICK_REFERENCE_STRIPE.md          # Stripe quick commands
│
├── db-migrate-p3.sh                   # Database migration wrapper
├── README_DB_MIGRATE.md               # Database usage guide
├── TESTING_DB_MIGRATE.md              # Database testing scenarios
├── QUICK_REFERENCE_DB_MIGRATE.md      # Database quick commands
│
├── gemini-notify-p3.sh                # Gemini AI wrapper
├── TESTING_GEMINI.md                  # Gemini testing scenarios
└── EXAMPLES_GEMINI.md                 # Gemini usage examples
```

### Notification Flow

```
Integration Script
    ↓
Check .notify.enabled
    ↓
    ├─ Enabled → Wrap tool with notifications
    │              ↓
    │          Start notification
    │              ↓
    │          Monitor tool output
    │              ↓
    │          Event notifications (as needed)
    │              ↓
    │          Stop notification
    │
    └─ Disabled → Run tool directly (no notifications)
```

### Core Notification System

All integrations use:
- `scripts/telegram/core/notify.sh` - Send Telegram messages
- `.notify.enabled` - Global notification state
- `scripts/telegram/.env` - Telegram bot credentials

---

## Best Practices

### When to Use Integrations

✅ **Use integrations when**:
- Working locally and want real-time alerts
- Running long operations that can be backgrounded
- Testing critical workflows (payments, migrations)
- Collaborating remotely (notifications keep team informed)

❌ **Don't use integrations when**:
- In automated CI/CD (unless explicitly desired)
- Running quick operations (<10 seconds)
- Already monitoring terminal output actively
- Notification spam would be disruptive

### Notification Etiquette

**DO**:
- Disable notifications when running batch operations
- Use silent mode for repetitive testing
- Test notification flow before long-running tasks

**DON'T**:
- Leave webhook forwarding running overnight (spam)
- Enable notifications in shared CI/CD environments
- Use for every single operation (notification fatigue)

---

## Development

### Adding New Integrations

To create a new integration wrapper:

1. **Create script**: `scripts/telegram/integrations/my-tool-notify.sh`
2. **Follow template**:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail

   # Check tool availability
   if ! command -v my-tool &> /dev/null; then
     echo "Error: my-tool not installed"
     exit 1
   fi

   # Check notification state
   if [[ ! -f ".notify.enabled" ]]; then
     my-tool "$@"  # Run without notifications
     exit $?
   fi

   # Send start notification
   ./scripts/telegram/core/notify.sh "Task started"

   # Wrap tool execution
   my-tool "$@" 2>&1 | while read -r line; do
     echo "$line"
     # Send notifications for key events
   done

   # Send stop notification
   ./scripts/telegram/core/notify.sh "Task completed"
   ```

3. **Add documentation**:
   - `README_MY_TOOL.md` - Usage guide
   - `TESTING_MY_TOOL.md` - Test scenarios
   - `QUICK_REFERENCE_MY_TOOL.md` - Quick commands

4. **Update this README** with new integration

---

## Related Documentation

- **Core System**: [../README.md](../README.md) - Telegram notification system overview
- **Quick Start**: [../QUICK_START.md](../QUICK_START.md) - Initial setup
- **Implementation**: [../IMPLEMENTATION.md](../IMPLEMENTATION.md) - Technical details
- **P3 Documentation**: [../../../docs/](../../../docs/) - Project documentation

---

## Support

### Getting Help

1. **Check documentation** for specific integration
2. **Review troubleshooting** sections
3. **Test core system**: `./scripts/notifyctl status`
4. **Verify tool installation**: `which tool-name`

### Reporting Issues

When reporting integration issues, include:
- Integration name (Stripe/Database/Gemini)
- Error message and terminal output
- Notification system status
- Tool version (e.g., `stripe --version`)
- Environment (local/staging/production)

---

## Statistics

**Total Integrations**: 3 (Stripe, Database, Gemini)
**Total Scripts**: 3 wrapper scripts
**Total Documentation**: 11 files (2,637 lines)
**Total Lines of Code**: ~450 lines (across 3 scripts)

---

**Last Updated**: 2025-11-01
**Maintainer**: P3 Interview Academy Development Team
