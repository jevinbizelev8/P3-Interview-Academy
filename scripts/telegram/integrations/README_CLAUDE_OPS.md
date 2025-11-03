# Claude Code Operations Notification Script

## Overview

`claude-session-notify.sh` enables Claude Code agents to send Telegram notifications and request approvals for critical operations.

This script is designed for autonomous agent workflows where:
- Tasks may run for extended periods (>1 minute)
- Critical operations require human approval
- Errors need immediate attention
- Progress tracking helps maintain awareness

## Actions

### 1. Start Notification
Notify when a long-running task begins.

```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  start "Database schema migration"
```

**Output:**
```
📱 Start notification sent
```

**Telegram Message:**
```
🤖 Claude Code Task Started

Task: Database schema migration
Started: 2025-11-01 14:30:00

I'll notify you when this task completes
```

### 2. Complete Notification
Notify when a task finishes successfully.

```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  complete "Database migration" "13 tables created"
```

**Output:**
```
📱 Completion notification sent
```

**Telegram Message:**
```
✅ Claude Code Task Complete

Task: Database migration
Completed: 2025-11-01 14:35:00
Details: 13 tables created

Task finished successfully
```

### 3. Approval Request
Request approval for critical operations (returns exit code 0 if approved, 1 if rejected/timeout).

```bash
if ./scripts/telegram/integrations/claude-session-notify.sh \
  approve "Delete 50 test files" "files: test/*.old"; then
  echo "Approved - proceeding"
  rm test/*.old
else
  echo "Rejected - cancelled"
fi
```

**Output (waiting):**
```
📱 Approval request sent to Telegram
⏳ Waiting for response...
```

**Telegram Message:**
```
⚠️ Approval Required

Task: Delete 50 test files
Details: files: test/*.old
Requested: 2025-11-01 14:40:00

To approve, reply:
`approve abc123de`

To reject, reply:
`reject abc123de`

Timeout: 5 minutes
```

**Output (approved):**
```
✅ APPROVED
📱 Approval granted notification sent
```

**Output (rejected):**
```
❌ REJECTED
📱 Approval denied notification sent
```

**Output (timeout):**
```
⏰ TIMEOUT
📱 Approval timeout notification sent
```

### 4. Alert Notification
Send error/warning alerts.

```bash
./scripts/telegram/integrations/claude-session-notify.sh \
  alert "Deployment failed" "Health check timeout after 5 minutes"
```

**Output:**
```
📱 Alert notification sent
```

**Telegram Message:**
```
🚨 Claude Code Alert

Task: Deployment failed
Issue: Health check timeout after 5 minutes
Time: 2025-11-01 14:50:00

Action may be required!
```

## Use Cases

### Long-Running Tasks
```bash
# Research task
./claude-session-notify.sh start "Gemini research on AWS deployment"

# ... agent performs research for 10 minutes ...

./claude-session-notify.sh complete "Research done" "Found 5 best practices"
```

### Critical Operations Requiring Approval
```bash
# Before destructive operation
if ./claude-session-notify.sh approve "Drop test database" "DB: test_db"; then
  dropdb test_db
  echo "Database dropped"
else
  echo "Operation cancelled by user"
fi
```

### Error Handling
```bash
# Build process with error notification
if ! npm run build; then
  ./claude-session-notify.sh alert "Build failed" "TypeScript errors detected"
  exit 1
fi
```

### Multi-Step Workflow with Progress Tracking
```bash
#!/bin/bash
# Complete deployment workflow with notifications

./claude-session-notify.sh start "Complete deployment workflow"

# Step 1: Tests
./claude-session-notify.sh start "Running tests"
if npm test; then
  ./claude-session-notify.sh complete "Tests passed"
else
  ./claude-session-notify.sh alert "Tests failed" "Check test logs"
  exit 1
fi

# Step 2: Build (requires approval for production)
if ./claude-session-notify.sh approve "Deploy to production?" "Branch: main"; then
  ./claude-session-notify.sh start "Building production bundle"
  npm run build
  ./claude-session-notify.sh complete "Build successful"

  # Step 3: Deploy
  ./claude-session-notify.sh start "Deploying to production"
  if npm run deploy:prod; then
    ./claude-session-notify.sh complete "Deployment successful" "Status: Live"
  else
    ./claude-session-notify.sh alert "Deployment failed" "Check AWS logs"
    exit 1
  fi
else
  echo "Deployment cancelled by user"
  exit 0
fi
```

## Silent Mode

When notifications are disabled (`notifyctl off` or `.notify.enabled` file missing):

- **start/complete/alert**: Skip notification, exit 0
- **approve**: Auto-approve (exit 0) with warning message

**Example Output in Silent Mode:**
```bash
$ ./claude-session-notify.sh start "My task"
⚠️  Notifications disabled - skipping notification

$ ./claude-session-notify.sh approve "Delete files"
⚠️  Notifications disabled - AUTO-APPROVING
```

This is useful for:
- Local development without interruptions
- Automated testing
- CI/CD pipelines

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (or approved) |
| 1 | Rejected or timeout |
| 2 | Usage error (invalid arguments) |

## Integration with Claude Code Workflows

### Example 1: File Deletion Gate
```bash
# Claude Code agent script for cleanup
FILE_COUNT=$(find test/ -name "*.old" | wc -l)

if [[ $FILE_COUNT -gt 10 ]]; then
  # Request approval for bulk deletion
  if ./scripts/telegram/integrations/claude-session-notify.sh \
    approve "Delete $FILE_COUNT old test files" "Directory: test/"; then
    find test/ -name "*.old" -delete
    echo "Deleted $FILE_COUNT files"
  else
    echo "Cleanup cancelled"
  fi
else
  # Small number, just delete
  find test/ -name "*.old" -delete
fi
```

### Example 2: Database Migration Workflow
```bash
#!/bin/bash
# Database migration with notifications

./claude-session-notify.sh start "Database migration for redesign project"

# Check schema
if npm run db:validate; then
  ./claude-session-notify.sh complete "Schema validation passed"
else
  ./claude-session-notify.sh alert "Schema validation failed" "Check Drizzle logs"
  exit 1
fi

# Request approval before migration
if ./claude-session-notify.sh approve "Apply 13 new tables?" "Phase 1 migration"; then
  ./claude-session-notify.sh start "Applying migrations"
  npm run db:push
  ./claude-session-notify.sh complete "Migration complete" "13 tables created"
else
  echo "Migration cancelled"
fi
```

### Example 3: Deployment Pipeline
```bash
#!/bin/bash
# Production deployment with gated approval

./claude-session-notify.sh start "Production deployment initiated"

# Build
npm run build || {
  ./claude-session-notify.sh alert "Build failed" "Check TypeScript errors"
  exit 1
}

# Request approval
if ./claude-session-notify.sh approve "Deploy to production?" "Branch: main, Commit: $(git rev-parse --short HEAD)"; then
  # Deploy
  if npm run deploy:prod; then
    ./claude-session-notify.sh complete "Production deployment" "Status: Live, URL: https://prod.example.com"
  else
    ./claude-session-notify.sh alert "Deployment failed" "Check AWS Elastic Beanstalk logs"
    exit 1
  fi
else
  echo "Deployment cancelled by user"
fi
```

### Example 4: Research Task with Checkpoints
```bash
#!/bin/bash
# Long-running research task

./claude-session-notify.sh start "Researching AWS Bedrock cost optimization"

# Phase 1
echo "Analyzing token usage patterns..."
sleep 60
./claude-session-notify.sh complete "Phase 1: Token analysis" "Found 3 optimization areas"

# Phase 2
echo "Researching cache strategies..."
sleep 90
./claude-session-notify.sh complete "Phase 2: Cache research" "Cache read saves 90% cost"

# Phase 3
echo "Compiling recommendations..."
sleep 30
./claude-session-notify.sh complete "Research complete" "5 recommendations documented"
```

## Best Practices

### DO ✅
- Use `start` for tasks expected to take >1 minute
- Use `approve` for destructive operations (delete, drop, deploy)
- Use `alert` for errors requiring human attention
- Include meaningful task descriptions
- Add details to provide context (file counts, branch names, etc.)
- Chain notifications for multi-step workflows
- Test approval flow in development first

### DON'T ❌
- Don't overuse notifications (notification fatigue)
- Don't bypass approval in production environments
- Don't use approve for trivial operations
- Don't send alerts for expected failures (use logs)
- Don't include sensitive data in notifications (passwords, API keys)

## Troubleshooting

### Approval Not Received
1. Check Telegram bot is running: `ps aux | grep telegram-listener`
2. Verify `.notify.enabled` exists
3. Check bot token in `.telegram.config`
4. Test basic notification: `./scripts/telegram/core/notify.sh "test"`

### Timeout Too Short
Edit the script to increase timeout (default 300 seconds):
```bash
if "$PROJECT_ROOT/scripts/telegram/core/await_reply.sh" "$TOKEN" 600; then
```

### Silent Mode Not Working
Ensure `.notify.enabled` file is created:
```bash
./scripts/telegram/core/notifyctl on
```

## Security Notes

- Tokens are 16-character hex (128-bit randomness) via `openssl rand`
- Tokens are single-use and deleted after response
- Pending requests timeout after 5 minutes
- Tokens stored in `.pending/` directory (add to `.gitignore`)
- Responses stored in `.inbox/` directory (cleaned after reading)

## Related Scripts

- `scripts/telegram/core/notify.sh` - Core notification sender
- `scripts/telegram/core/await_reply.sh` - Response waiting mechanism
- `scripts/telegram/core/notifyctl` - Enable/disable notifications
- `scripts/telegram/core/init.sh` - Initial Telegram setup
