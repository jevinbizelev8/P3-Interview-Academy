# Telegram Bot Command Guide

**P3 Interview Academy - User-Initiated Commands**

This guide covers the user-initiated slash commands available in the Telegram bot. These commands allow you to interact with the system directly from your Telegram chat.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Command Details](#command-details)
3. [Rate Limiting](#rate-limiting)
4. [Error Messages](#error-messages)
5. [Audit Logging](#audit-logging)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference

| Command | Description | Rate Limit | Example |
|---------|-------------|------------|---------|
| `/status` | Show system health | 10/min | `/status` |
| `/monitor` | View detailed metrics | 10/min | `/monitor` |
| `/test` | Run test suite | 1/5min | `/test` |
| `/deploy` | Deploy to AWS | 1/5min | `/deploy staging` |
| `/help` | Show help | 10/min | `/help deploy` |

---

## Command Details

### `/status` - System Status

**Description**: Shows current system health and status.

**Usage**:
```
/status
```

**Output**:
- ✅ Webhook Server status
- ✅ Notification settings (enabled/disabled)
- 📬 Pending approval requests count
- 📥 Recent responses count
- 🕐 Last check timestamp

**Example**:
```
📊 System Status

✅ Webhook Server: Running
✅ Notifications: Enabled
📬 Pending Requests: 2
📥 Recent Responses: 5

Last check: 2025-11-03 12:34:56 UTC
```

**Rate Limit**: 10 per minute (readonly tier)

---

### `/monitor` - Detailed Monitoring

**Description**: Runs the `monitor.sh` script to show comprehensive system metrics.

**Usage**:
```
/monitor
```

**Output**:
- System health checks
- Database connectivity
- Recent events
- Pending operations
- Full monitor script output (formatted for Telegram)

**Example**:
```
📊 Monitor Output

=== Telegram Bot System Status ===

📱 Notification Status: Enabled
🌐 Webhook Server: Online
📬 Pending Requests: 0
📝 Recent Commands: 5

... (truncated if output exceeds 3000 characters)
```

**Rate Limit**: 10 per minute (readonly tier)

---

### `/test` - Run Test Suite

**Description**: Executes the full test suite (`npm run test:run`) and reports results.

**Usage**:
```
/test
```

**Output**:
- 🧪 Test execution progress
- ✅ Summary of passed/failed tests
- ⏱️ Execution duration
- 📊 Test results (last 50 lines)

**Example**:
```
🧪 Running test suite...

This may take several minutes.

---

🧪 Test Suite

✅ All tests passed

`Tests: 232 passed, 89 skipped, 321 total`

Duration: 123456ms
```

**Notes**:
- Long-running command (typically 2-5 minutes)
- Runs in project root directory
- Timeout: 5 minutes
- Returns last 50 lines of output

**Rate Limit**: 1 per 5 minutes (intensive tier)

---

### `/deploy <environment>` - AWS Deployment

**Description**: Deploy application to AWS Elastic Beanstalk with approval gate.

**Usage**:
```
/deploy <environment>
```

**Arguments**:
- `environment` (required): Target deployment environment
  - Valid values: `staging`, `production`

**Examples**:
```
/deploy staging
/deploy production
```

**Workflow**:
1. Command validation
2. Approval request sent to Telegram
3. User must reply: `approve <token>` within 15 minutes
4. If approved, deployment executes
5. Progress updates sent to Telegram
6. Final status notification

**Output**:
```
🚀 Deploy to staging

Requesting approval...

[Telegram notification with approval token]

---

✅ Deployment approved

Deploying to staging...
✅ Deployment complete
```

**Notes**:
- Production deployments require explicit approval
- Uses deployment scripts in `scripts/telegram/integrations/`
- Timeout: 10 minutes per deployment
- Approval timeout: 15 minutes

**Rate Limit**: 1 per 5 minutes (intensive tier)

**Security**: All deployments are logged to audit log

---

### `/help` - Command Help

**Description**: Show help documentation for commands.

**Usage**:
```
/help
/help <command>
```

**Examples**:
```
/help              # General help
/help status       # Help for /status command
/help deploy       # Help for /deploy command
```

**General Help Output**:
```
🤖 P3 Interview Academy DevOps Bot

Available Commands:

📊 Monitoring
• /status - Show system health and status
• /monitor - View detailed system metrics

🧪 Testing
• /test - Run test suite

🚀 Deployment
• /deploy <env> - Deploy to AWS environment

❓ Help
• /help - Show this message
• /help <command> - Get detailed help for a command

Quick Tips:
• Commands are rate-limited to prevent overload
• Long-running commands update progress in real-time
• All actions are logged for security

Type /help <command> for detailed information.
```

**Specific Command Help**:
Each command has detailed help including:
- Description
- Usage syntax
- Arguments (if any)
- Examples
- Rate limits
- Special notes

**Rate Limit**: 10 per minute (readonly tier)

---

## Rate Limiting

### Overview

Rate limiting prevents system overload and abuse. All commands are rate-limited per user.

### Rate Limit Tiers

| Tier | Limit | Window | Commands |
|------|-------|--------|----------|
| **Readonly** | 10 requests | 1 minute | `/status`, `/monitor`, `/help` |
| **General** | 5 requests | 1 minute | (default for unknown commands) |
| **Intensive** | 1 request | 5 minutes | `/test`, `/deploy` |

### Rate Limit Behavior

**When rate limit is exceeded:**
```
⏱️ Rate limit exceeded. Try again in 45 seconds.

Rate limits protect the system from overload.
```

**Response includes:**
- ⏱️ Emoji indicator
- Retry-after time in seconds
- Explanation of rate limiting

**Rate limit tracking:**
- Per user ID (not per chat)
- Separate counters for each tier
- Automatic cleanup of old timestamps
- State persists for lifetime of webhook server process

### Best Practices

1. **Use `/status` for quick checks** (10/min available)
2. **Avoid spamming `/test`** (1 per 5 minutes)
3. **Plan deployments** (1 per 5 minutes)
4. **Check `/help` anytime** (10/min available)

---

## Error Messages

### Command Not Found

```
❌ Unknown command: `/unknown`

Try /help to see available commands.
```

**Cause**: Command doesn't exist or typo

**Solution**: Check `/help` for valid commands

---

### Missing Arguments

```
❌ Usage: `/deploy <environment>`

Environments: staging, production
```

**Cause**: Required argument not provided

**Solution**: Add required argument (e.g., `/deploy staging`)

---

### Invalid Arguments

```
❌ Invalid environment: `prod`

Valid: staging, production
```

**Cause**: Argument value not recognized

**Solution**: Use one of the valid values

---

### Rate Limit Exceeded

```
⏱️ Rate limit exceeded. Try again in 45 seconds.

Rate limits protect the system from overload.
```

**Cause**: Too many requests in time window

**Solution**: Wait for the specified time before retrying

---

### Execution Error

```
❌ Error running monitor: [Errno 2] No such file or directory
```

**Cause**: Script or dependency not found

**Solution**: Check that required scripts exist and are executable

---

### Timeout

```
⏰ Test suite timed out after 5 minutes
```

**Cause**: Command execution exceeded timeout

**Solution**: Check system performance or increase timeout

---

## Audit Logging

### Overview

All command executions are logged to `/tmp/telegram/command-audit.log` in JSON format.

### Log Format

```json
{
  "timestamp": "2025-11-03T12:34:56",
  "command": "deploy",
  "user_id": 449555452,
  "chat_id": 449555452,
  "args": ["staging"],
  "success": true,
  "error": null,
  "duration_ms": 234
}
```

### Log Fields

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | UTC timestamp of command execution |
| `command` | string | Command name (without /) |
| `user_id` | integer | Telegram user ID |
| `chat_id` | integer | Telegram chat ID |
| `args` | array | Command arguments |
| `success` | boolean | Whether command succeeded |
| `error` | string | Error message (if failed) |
| `duration_ms` | integer | Execution time in milliseconds |

### Viewing Audit Logs

```bash
# View all logs
cat /tmp/telegram/command-audit.log

# View last 10 commands
tail -10 /tmp/telegram/command-audit.log

# View formatted (requires jq)
cat /tmp/telegram/command-audit.log | jq .

# Filter by command
grep '"command":"deploy"' /tmp/telegram/command-audit.log | jq .

# Filter by user
grep '"user_id":449555452' /tmp/telegram/command-audit.log | jq .

# Failed commands only
grep '"success":false' /tmp/telegram/command-audit.log | jq .
```

### Log Retention

- Logs persist until server restart or manual cleanup
- No automatic rotation (manual management recommended)
- Consider archiving old logs periodically

---

## Troubleshooting

### Commands Not Working

**Symptoms**: Bot doesn't respond to commands

**Diagnosis**:
1. Check if bot is online: `/status` (should get response within 2-3 seconds)
2. Check webhook server: `curl http://localhost:8080/healthz`
3. Check notifications: `./scripts/telegram/core/notifyctl status`
4. Check audit log: `tail /tmp/telegram/command-audit.log`

**Solutions**:
- Restart webhook server if down
- Enable notifications: `./scripts/telegram/core/notifyctl on`
- Check server logs: `tail /tmp/telegram-webhook.log`

---

### Rate Limiting Too Aggressive

**Symptoms**: Frequently getting rate limit errors

**Solutions**:
1. Wait for retry-after time
2. Use readonly commands (`/status`, `/help`) more often
3. Plan intensive operations (`/test`, `/deploy`) in advance
4. If legitimate high-frequency use case, contact admin to adjust limits

---

### Test Command Timeout

**Symptoms**: `/test` times out after 5 minutes

**Diagnosis**:
1. Check if tests are hanging
2. Check system resources (CPU, memory)
3. Check test configuration

**Solutions**:
- Run tests manually: `npm run test:run`
- Check for hanging tests in test suite
- Increase timeout in `server.py` if needed

---

### Deployment Approval Not Working

**Symptoms**: Deployment doesn't start after approval

**Diagnosis**:
1. Check approval token matches exactly
2. Check if approval timed out (15 minutes)
3. Check deployment script exists
4. Check audit log for errors

**Solutions**:
- Ensure exact token match: `approve abc123def456`
- Restart deployment if timed out
- Verify deployment scripts are executable

---

### Monitor Script Not Found

**Symptoms**: `/monitor` returns "script not found"

**Diagnosis**:
```bash
ls -la scripts/telegram/tools/monitor.sh
```

**Solution**:
- Ensure script exists and is executable
- Create script if missing (see `docs/telegram/` for template)

---

## Advanced Usage

### Chaining Commands

Commands can be used in sequence for workflow automation:

```
1. /status          # Check system is healthy
2. /test            # Run tests
3. /deploy staging  # Deploy to staging
4. /status          # Verify deployment
```

### Integration with Scripts

Commands can be triggered from external scripts via Telegram bot API:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID" \
  -d "text=/status"
```

---

## See Also

- **Setup Guide**: `docs/telegram/SETUP_GUIDE.md`
- **Architecture**: `docs/telegram/ARCHITECTURE.md` (if exists)
- **Research**: `docs/research/telegram-bot-command-implementation.md`
- **CLAUDE.md**: Main project documentation with Telegram section

---

**Last Updated**: 2025-11-03
**Version**: 1.0.0
**Implementation**: Phase 1 - Command System Complete
