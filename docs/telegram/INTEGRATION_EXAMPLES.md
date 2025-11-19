# Telegram Bot Controller - Integration Examples

**Real-world integration examples showing how to use the Telegram Bot Controller in production workflows**

This document provides complete, working code examples for common integration scenarios. Each example includes full implementation, error handling, testing instructions, and customization options.

---

## Table of Contents

- [Example 1: AWS Deployment Approval Gate](#example-1-aws-deployment-approval-gate)
- [Example 2: Gemini Research Agent Notifications](#example-2-gemini-research-agent-notifications)
- [Example 3: Database Migration Approval](#example-3-database-migration-approval)
- [Example 4: General Claude Code Task Wrapper](#example-4-general-claude-code-task-wrapper)
- [Example 5: CI/CD Pipeline Integration](#example-5-cicd-pipeline-integration)
- [Example 6: Scheduled Task Notifications](#example-6-scheduled-task-notifications)

---

## Example 1: AWS Deployment Approval Gate

### Use Case

Deploy P3 Interview Academy to AWS Elastic Beanstalk with Telegram approval between staging and production environments.

### Complete Implementation

**File**: `deployment-scripts/deploy-with-telegram-approval.sh`

```bash
#!/bin/bash
# deploy-with-telegram-approval.sh
# AWS Elastic Beanstalk deployment with Telegram approval gates

set -e  # Exit on error

# ============================================================================
# Configuration
# ============================================================================

STAGING_ENV="p3-interview-academy-staging"
PRODUCTION_ENV="p3-interview-academy-prod-v2"
APP_NAME="P3-Interview-Academy"
REGION="ap-southeast-1"

# Load environment variables
if [[ -f .env ]]; then
  source .env
else
  echo "❌ Error: .env file not found"
  exit 1
fi

# Load Telegram notification functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../scripts/telegram/core/notify.sh"

# Enable notifications
notifyctl on

# ============================================================================
# Helper Functions
# ============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

notify_and_log() {
  log "$1"
  notify.sh "$1"
}

get_eb_health() {
  local env_name="$1"
  aws elasticbeanstalk describe-environment-health \
    --environment-name "$env_name" \
    --attribute-names Status \
    --region "$REGION" \
    --query 'Status' \
    --output text 2>/dev/null || echo "Unknown"
}

wait_for_environment() {
  local env_name="$1"
  local max_wait=300  # 5 minutes
  local elapsed=0

  log "Waiting for $env_name to become healthy..."

  while [[ $elapsed -lt $max_wait ]]; do
    local status=$(get_eb_health "$env_name")

    if [[ "$status" == "Ok" ]]; then
      log "✅ $env_name is healthy"
      return 0
    elif [[ "$status" == "Severe" ]]; then
      log "❌ $env_name is in severe state"
      return 1
    fi

    sleep 10
    elapsed=$((elapsed + 10))
  done

  log "⚠️  Timeout waiting for $env_name to become healthy"
  return 1
}

# ============================================================================
# Deployment Steps
# ============================================================================

log "🚀 Starting deployment process for $APP_NAME"

# Step 1: Build
notify_and_log "📦 **Building Application**

Environment: \`development\`
Branch: \`$(git rev-parse --abbrev-ref HEAD)\`
Commit: \`$(git rev-parse --short HEAD)\`

Starting build process..."

if npm run build; then
  BUILD_SIZE=$(du -sh dist/ | cut -f1)
  notify_and_log "✅ **Build Complete**

Build size: $BUILD_SIZE
Bundle created successfully."
else
  notify_and_log "❌ **Build Failed**

Build process encountered errors. Deployment aborted."
  exit 1
fi

# Step 2: Create Deployment Bundle
log "📦 Creating deployment bundle..."
VERSION_LABEL="v$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"

if ./deployment-scripts/create-deployment-bundle.sh; then
  log "✅ Deployment bundle created: $VERSION_LABEL"
else
  notify_and_log "❌ **Bundle Creation Failed**

Could not create deployment bundle. Check logs."
  exit 1
fi

# Step 3: Deploy to Staging
notify_and_log "🚀 **Deploying to Staging**

Environment: \`$STAGING_ENV\`
Version: \`$VERSION_LABEL\`

Deployment in progress..."

if aws elasticbeanstalk create-application-version \
  --application-name "$APP_NAME" \
  --version-label "$VERSION_LABEL" \
  --source-bundle S3Bucket="elasticbeanstalk-${REGION}-$(aws sts get-caller-identity --query Account --output text)",S3Key="${APP_NAME}/${VERSION_LABEL}.zip" \
  --region "$REGION" > /dev/null 2>&1; then

  aws elasticbeanstalk update-environment \
    --environment-name "$STAGING_ENV" \
    --version-label "$VERSION_LABEL" \
    --region "$REGION" > /dev/null 2>&1

  log "Deployment initiated for staging"
else
  notify_and_log "❌ **Staging Deployment Failed**

Could not create application version or update environment."
  exit 1
fi

# Wait for staging deployment
if wait_for_environment "$STAGING_ENV"; then
  STAGING_URL="http://${STAGING_ENV}.eba-wdmrjtn2.${REGION}.elasticbeanstalk.com"

  notify_and_log "✅ **Staging Deployment Complete**

Environment: \`$STAGING_ENV\`
Version: \`$VERSION_LABEL\`
URL: $STAGING_URL

**Smoke Tests**:
- [ ] Health check: \`/api/health\`
- [ ] Authentication working
- [ ] Database connectivity verified

Review staging environment before approving production."
else
  notify_and_log "❌ **Staging Deployment Failed**

Environment did not become healthy. Check AWS console."
  exit 1
fi

# Step 4: Run Smoke Tests
log "🧪 Running smoke tests..."

SMOKE_TEST_RESULT=$(npm run smoke:staging 2>&1 || echo "FAILED")

if echo "$SMOKE_TEST_RESULT" | grep -q "All tests passed"; then
  notify_and_log "✅ **Smoke Tests Passed**

All critical endpoints responding correctly."
else
  notify_and_log "⚠️ **Smoke Tests Failed**

Some tests did not pass:
\`\`\`
${SMOKE_TEST_RESULT:0:500}
\`\`\`

Review before proceeding to production."

  # Still allow manual approval to proceed
fi

# Step 5: Production Approval Gate
log "🔒 Requesting production approval..."

# Generate secure token
TOKEN=$(openssl rand -hex 8)

# Request approval (15 minute timeout)
if await_reply.sh "🚨 **PRODUCTION DEPLOYMENT APPROVAL REQUIRED**

**Application**: $APP_NAME
**Environment**: \`$PRODUCTION_ENV\`
**Version**: \`$VERSION_LABEL\`
**Staging URL**: $STAGING_URL

**Changes**:
\`\`\`
$(git log -1 --pretty=%B)
\`\`\`

**Pre-deployment Checklist**:
- [ ] Staging tested and verified
- [ ] Database migrations applied (if any)
- [ ] Smoke tests passed
- [ ] No critical bugs in staging

**⚠️ WARNING**: This will deploy to production!

Reply within 15 minutes: \`approve $TOKEN\`" \
  900 \
  "$TOKEN"; then

  log "✅ Production deployment approved"
  notify_and_log "✅ **Production Deployment Approved**

Proceeding with production deployment..."

else
  notify_and_log "❌ **Production Deployment CANCELLED**

User rejected, timed out, or invalid token.
Version \`$VERSION_LABEL\` remains in staging only."

  exit 1
fi

# Step 6: Deploy to Production
notify_and_log "🎯 **Deploying to Production**

Environment: \`$PRODUCTION_ENV\`
Version: \`$VERSION_LABEL\`

Production deployment in progress..."

if aws elasticbeanstalk update-environment \
  --environment-name "$PRODUCTION_ENV" \
  --version-label "$VERSION_LABEL" \
  --region "$REGION" > /dev/null 2>&1; then

  log "Production deployment initiated"
else
  notify_and_log "❌ **Production Deployment Failed**

Could not update production environment. Investigate immediately!"
  exit 1
fi

# Wait for production deployment
if wait_for_environment "$PRODUCTION_ENV"; then
  PRODUCTION_URL="http://${PRODUCTION_ENV}.eba-wdmrjtn2.${REGION}.elasticbeanstalk.com"

  notify_and_log "🎉 **PRODUCTION DEPLOYMENT COMPLETE**

Environment: \`$PRODUCTION_ENV\`
Version: \`$VERSION_LABEL\`
URL: $PRODUCTION_URL

**Deployment Summary**:
- Build time: $(date)
- Staging: ✅ Deployed and tested
- Production: ✅ Deployed successfully

All systems operational. Monitor logs for any issues."

else
  notify_and_log "🚨 **PRODUCTION DEPLOYMENT FAILED**

Environment did not become healthy after deployment!

**CRITICAL**: Production may be down!

**Immediate Actions**:
1. Check AWS Console: EB → $PRODUCTION_ENV → Events
2. Review CloudWatch logs
3. Consider rollback: \`aws elasticbeanstalk update-environment --environment-name $PRODUCTION_ENV --version-label <previous>\`

Production URL: $PRODUCTION_URL"

  exit 1
fi

log "✅ Deployment process complete"
```

### How It Works

1. **Build Phase**: Compiles application and notifies
2. **Staging Deployment**: Deploys to staging environment
3. **Smoke Tests**: Runs automated verification
4. **Approval Gate**: Waits for Telegram approval with token
5. **Production Deployment**: Only proceeds if approved
6. **Health Checks**: Verifies environments are healthy

### Error Handling

- Build failures → Immediate abort, notify
- Staging failures → Abort before asking for approval
- Approval timeout/rejection → Cancel, notify
- Production failures → Critical alert with rollback instructions

### Testing Instructions

**Test in staging only** (skip production):

```bash
# Modify script to add this after staging deployment:
log "Testing mode - skipping production"
exit 0

# Then run:
./deployment-scripts/deploy-with-telegram-approval.sh
```

**Full test** (with production):
```bash
# Ensure you're ready to deploy
git status
npm test

# Run deployment
./deployment-scripts/deploy-with-telegram-approval.sh

# In Telegram: Approve or reject when prompted
```

### Customization Options

**Change timeout**:
```bash
# Line ~200: Change 900 (15 min) to desired seconds
await_reply.sh "..." 1800 "$TOKEN"  # 30 minutes
```

**Skip smoke tests**:
```bash
# Comment out smoke test section (lines ~160-180)
```

**Add more pre-deployment checks**:
```bash
# Before approval gate, add:
if ! npm run lint; then
  notify.sh "⚠️ Linting errors detected. Review before approval."
fi
```

---

## Example 2: Gemini Research Agent Notifications

### Use Case

Run long-running Gemini CLI research tasks and notify when complete, with progress updates for tasks longer than 10 minutes.

### Complete Implementation

**File**: `scripts/telegram/integrations/gemini-research-wrapper.sh`

```bash
#!/bin/bash
# gemini-research-wrapper.sh
# Wrapper for Gemini CLI with Telegram notifications and progress tracking

set -e

# ============================================================================
# Configuration
# ============================================================================

QUERY="$1"
OUTPUT_FILE="${2:-/tmp/gemini-research-$(date +%s).md}"
PROGRESS_INTERVAL=300  # Notify every 5 minutes for long tasks

if [[ -z "$QUERY" ]]; then
  echo "Usage: $0 <research query> [output file]"
  echo "Example: $0 'React 19 server components' ./research/react19.md"
  exit 1
fi

# Load environment
source .env
source scripts/telegram/core/notify.sh

# Enable notifications
notifyctl on

# ============================================================================
# Helper Functions
# ============================================================================

format_duration() {
  local seconds=$1
  if [[ $seconds -lt 60 ]]; then
    echo "${seconds}s"
  elif [[ $seconds -lt 3600 ]]; then
    echo "$((seconds / 60))m $((seconds % 60))s"
  else
    echo "$((seconds / 3600))h $(((seconds % 3600) / 60))m"
  fi
}

send_progress_update() {
  local elapsed=$1
  notify.sh "⏳ **Gemini Research Progress Update**

**Query**: $QUERY
**Elapsed**: $(format_duration $elapsed)
**Status**: In progress...

Research continuing. You'll be notified when complete."
}

# ============================================================================
# Research Execution
# ============================================================================

# Notify start
notify.sh "🔬 **Gemini Research Started**

**Query**: \`$QUERY\`
**Output**: \`$OUTPUT_FILE\`

Expected duration: 10-30 minutes depending on complexity.
You'll receive progress updates every 5 minutes."

echo "🔬 Starting Gemini research..."
echo "Query: $QUERY"
echo "Output: $OUTPUT_FILE"

START_TIME=$(date +%s)
LAST_PROGRESS=0

# Start research in background
# Replace with actual Gemini CLI command:
# gemini-cli research "$QUERY" > "$OUTPUT_FILE" &
(
  # Simulated long-running research
  sleep 10  # Replace with: gemini-cli research "$QUERY" > "$OUTPUT_FILE"
  echo "Research results for: $QUERY" > "$OUTPUT_FILE"
) &

RESEARCH_PID=$!

# Monitor progress
while kill -0 $RESEARCH_PID 2>/dev/null; do
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))

  # Send progress update every PROGRESS_INTERVAL seconds
  if [[ $((ELAPSED - LAST_PROGRESS)) -ge $PROGRESS_INTERVAL ]]; then
    send_progress_update $ELAPSED
    LAST_PROGRESS=$ELAPSED
  fi

  sleep 30  # Check every 30 seconds
done

# Wait for completion
wait $RESEARCH_PID
RESEARCH_EXIT_CODE=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# ============================================================================
# Results Processing
# ============================================================================

if [[ $RESEARCH_EXIT_CODE -eq 0 ]]; then
  # Count results
  WORD_COUNT=$(wc -w < "$OUTPUT_FILE")
  LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
  FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

  # Extract summary (first 500 chars)
  SUMMARY=$(head -c 500 "$OUTPUT_FILE")

  notify.sh "✅ **Gemini Research Complete**

**Query**: \`$QUERY\`
**Duration**: $(format_duration $DURATION)
**Output**: \`$OUTPUT_FILE\`

**Results**:
- Words: $WORD_COUNT
- Lines: $LINE_COUNT
- Size: $FILE_SIZE

**Summary**:
\`\`\`
${SUMMARY}...
\`\`\`

Full results saved to: $OUTPUT_FILE"

  echo "✅ Research complete"
  echo "Duration: $(format_duration $DURATION)"
  echo "Output: $OUTPUT_FILE"

else
  notify.sh "❌ **Gemini Research Failed**

**Query**: \`$QUERY\`
**Duration**: $(format_duration $DURATION)
**Error**: Research process exited with code $RESEARCH_EXIT_CODE

Check logs for details."

  echo "❌ Research failed with exit code: $RESEARCH_EXIT_CODE"
  exit 1
fi
```

### Advanced Version with Result Analysis

**File**: `scripts/telegram/integrations/gemini-research-advanced.sh`

```bash
#!/bin/bash
# gemini-research-advanced.sh
# Advanced research wrapper with result categorization and approval

QUERY="$1"
OUTPUT_DIR="${2:-./research/$(date +%Y%m%d)}"

mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/$(echo "$QUERY" | tr ' ' '_' | tr '[:upper:]' '[:lower:]').md"

source .env
source scripts/telegram/core/notify.sh
notifyctl on

# Research execution (similar to basic version)
notify.sh "🔬 **Advanced Gemini Research Started**

**Query**: $QUERY
**Features**: Code extraction, pattern analysis, example detection

Starting comprehensive research..."

# ... (research execution) ...

# After completion: Analyze results
echo "📊 Analyzing research results..."

# Count patterns found
PATTERNS=$(grep -c "^##" "$OUTPUT_FILE" || echo "0")

# Extract code blocks
CODE_BLOCKS=$(grep -c '```' "$OUTPUT_FILE" || echo "0")
CODE_BLOCKS=$((CODE_BLOCKS / 2))  # Each block has opening and closing

# Find examples
EXAMPLES=$(grep -ic "example" "$OUTPUT_FILE" || echo "0")

# Categorize results
if [[ $PATTERNS -gt 10 ]] && [[ $CODE_BLOCKS -gt 5 ]]; then
  QUALITY="Excellent"
  EMOJI="🌟"
elif [[ $PATTERNS -gt 5 ]] && [[ $CODE_BLOCKS -gt 2 ]]; then
  QUALITY="Good"
  EMOJI="✅"
else
  QUALITY="Basic"
  EMOJI="ℹ️"
fi

notify.sh "$EMOJI **Research Analysis Complete**

**Query**: $QUERY
**Quality**: $QUALITY

**Findings**:
- Patterns identified: $PATTERNS
- Code examples: $CODE_BLOCKS
- Total examples: $EXAMPLES

**Output**: \`$OUTPUT_FILE\`

Review results and decide next steps."

# Optional: Ask if user wants a summary
TOKEN=$(openssl rand -hex 4)
if await_reply.sh "📝 Generate executive summary from research?

This will create a condensed version with key findings.

Reply: \`approve $TOKEN\`" 300 "$TOKEN"; then

  # Generate summary (pseudo-code)
  echo "# Executive Summary: $QUERY" > "$OUTPUT_DIR/summary.md"
  head -n 50 "$OUTPUT_FILE" >> "$OUTPUT_DIR/summary.md"

  notify.sh "📝 **Summary Generated**

Executive summary saved to: \`$OUTPUT_DIR/summary.md\`"
fi

echo "✅ Advanced research complete"
```

### Testing Instructions

**Test with short query**:
```bash
./scripts/telegram/integrations/gemini-research-wrapper.sh "Test query" /tmp/test.md

# Should complete quickly, verify:
# 1. Start notification received
# 2. Completion notification received
# 3. Output file created
```

**Test with long query** (simulated):
```bash
# Modify script: Change sleep 10 to sleep 600 (10 minutes)
# Then run and verify progress updates
```

### Customization Options

**Change progress interval**:
```bash
PROGRESS_INTERVAL=600  # 10 minutes
```

**Add result filtering**:
```bash
# After research completes:
grep "important" "$OUTPUT_FILE" > "$OUTPUT_DIR/filtered.md"
```

**Multi-query batch**:
```bash
for query in "React 19" "Vue 3" "Svelte 5"; do
  ./scripts/telegram/integrations/gemini-research-wrapper.sh "$query"
done

notify.sh "✅ Batch research complete - 3 queries processed"
```

---

## Example 3: Database Migration Approval

### Use Case

Apply Drizzle ORM schema changes to PostgreSQL with Telegram approval, backup verification, and rollback support.

### Complete Implementation

**File**: `scripts/telegram/integrations/db-migrate-secure.sh`

```bash
#!/bin/bash
# db-migrate-secure.sh
# Secure database migration with Telegram approval and rollback

set -e

# ============================================================================
# Configuration
# ============================================================================

# Determine environment from DATABASE_URL
if [[ "$DATABASE_URL" =~ "postgres" ]]; then
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  ENV_NAME="production"
elif [[ "$DATABASE_URL" =~ "p3_staging" ]]; then
  DB_NAME="p3_staging"
  ENV_NAME="staging"
else
  DB_NAME="development"
  ENV_NAME="development"
fi

BACKUP_DIR="./backups/db"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"

# Load environment
source .env
source scripts/telegram/core/notify.sh
notifyctl on

# ============================================================================
# Pre-flight Checks
# ============================================================================

log() {
  echo "[$(date +'%H:%M:%S')] $1"
}

log "🗄️  Database Migration Tool"
log "Environment: $ENV_NAME ($DB_NAME)"

# Check for schema changes
log "Checking for pending schema changes..."

CHANGES=$(npm run db:push -- --print 2>&1 | grep -A 50 "Changes:" || echo "No changes")

if [[ "$CHANGES" == "No changes" ]]; then
  notify.sh "ℹ️ **Database Migration Check**

**Environment**: \`$ENV_NAME\` (\`$DB_NAME\`)

No schema changes detected. Database schema is current."

  log "✅ No changes needed"
  exit 0
fi

log "Schema changes detected:"
echo "$CHANGES"

# ============================================================================
# Backup Database
# ============================================================================

log "📦 Creating database backup..."

mkdir -p "$BACKUP_DIR"

if command -v pg_dump > /dev/null; then
  # Extract connection details from DATABASE_URL
  # Format: postgresql://user:pass@host:port/dbname

  if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
  else
    notify.sh "❌ **Backup Failed**

Could not create database backup.

**CRITICAL**: Migration aborted for safety.

Check DATABASE_URL and pg_dump access."

    log "❌ Backup failed"
    exit 1
  fi
else
  log "⚠️  pg_dump not found - skipping backup"
  notify.sh "⚠️ **Warning: No Backup Created**

pg_dump not available. Proceeding without backup.

**Environment**: \`$ENV_NAME\`"
fi

# ============================================================================
# Migration Approval
# ============================================================================

notify.sh "🗄️ **Database Migration Approval Required**

**Environment**: \`$ENV_NAME\` (\`$DB_NAME\`)
**Backup**: \`$BACKUP_FILE\`

**Pending Changes**:
\`\`\`
$CHANGES
\`\`\`

**Pre-Migration Checklist**:
- [ ] Backup created successfully
- [ ] Changes reviewed and understood
- [ ] Application can handle schema updates
- [ ] Rollback plan ready if needed

**⚠️ WARNING**: This will modify the database!

Review changes carefully."

# Generate approval token
TOKEN=$(openssl rand -hex 8)

log "🔒 Waiting for approval (10 minute timeout)..."

if await_reply.sh "🚨 **APPLY DATABASE MIGRATION?**

**Environment**: \`$ENV_NAME\`

Reply within 10 minutes: \`approve $TOKEN\`" \
  600 \
  "$TOKEN"; then

  log "✅ Migration approved"

else
  notify.sh "❌ **Database Migration CANCELLED**

User rejected or timed out.

No changes applied to database."

  log "❌ Migration cancelled"

  # Clean up backup
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ============================================================================
# Apply Migration
# ============================================================================

notify.sh "⏳ **Applying Database Migration...**

**Environment**: \`$ENV_NAME\`

Migration in progress. Do not interrupt."

log "🔄 Applying migration..."

START_TIME=$(date +%s)

# Run migration
if npm run db:push 2>&1 | tee /tmp/migration.log; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  log "✅ Migration complete (${DURATION}s)"

  # Extract applied changes from log
  APPLIED=$(grep -A 10 "Applied changes" /tmp/migration.log || echo "See full log")

  notify.sh "✅ **Database Migration COMPLETE**

**Environment**: \`$ENV_NAME\` (\`$DB_NAME\`)
**Duration**: ${DURATION}s
**Backup**: \`$BACKUP_FILE\`

**Changes Applied**:
\`\`\`
$APPLIED
\`\`\`

Database schema is now current.

**Rollback** (if needed):
\`\`\`bash
psql \$DATABASE_URL < $BACKUP_FILE
\`\`\`"

  log "Migration successful"
  log "Backup preserved: $BACKUP_FILE"

else
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  ERROR_LOG=$(tail -n 20 /tmp/migration.log)

  notify.sh "🚨 **DATABASE MIGRATION FAILED**

**Environment**: \`$ENV_NAME\` (\`$DB_NAME\`)
**Duration**: ${DURATION}s

**CRITICAL ERROR**: Migration failed!

**Error Log**:
\`\`\`
$ERROR_LOG
\`\`\`

**IMMEDIATE ACTIONS REQUIRED**:
1. Check database state
2. Verify application still works
3. Consider rollback:
   \`psql \$DATABASE_URL < $BACKUP_FILE\`

Backup available: \`$BACKUP_FILE\`"

  log "❌ Migration failed!"
  log "Check /tmp/migration.log for details"
  log "Backup available: $BACKUP_FILE"

  exit 1
fi

# ============================================================================
# Post-Migration Verification
# ============================================================================

log "🧪 Running post-migration verification..."

# Test database connectivity
if npm run test:db 2>&1 | grep -q "passed"; then
  notify.sh "✅ **Post-Migration Verification Passed**

Database connectivity and basic tests successful."

  log "✅ Verification passed"
else
  notify.sh "⚠️ **Post-Migration Verification Issues**

Some database tests failed. Review immediately.

Rollback available: \`$BACKUP_FILE\`"

  log "⚠️  Some tests failed"
fi

log "Migration process complete"
```

### Rollback Script

**File**: `scripts/telegram/integrations/db-rollback.sh`

```bash
#!/bin/bash
# db-rollback.sh - Rollback database to backup

BACKUP_FILE="$1"

if [[ -z "$BACKUP_FILE" ]] || [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup_file.sql>"
  echo "Available backups:"
  ls -lht backups/db/*.sql | head -5
  exit 1
fi

source .env
source scripts/telegram/core/notify.sh
notifyctl on

# Confirm rollback
TOKEN=$(openssl rand -hex 6)

if await_reply.sh "🚨 **DATABASE ROLLBACK CONFIRMATION**

**Backup**: \`$BACKUP_FILE\`

**⚠️ WARNING**: This will REPLACE the current database!

All data since backup will be LOST!

Reply: \`approve $TOKEN\`" 300 "$TOKEN"; then

  notify.sh "⏳ **Rolling back database...**

Restoring from: \`$BACKUP_FILE\`"

  if psql "$DATABASE_URL" < "$BACKUP_FILE" 2>&1 | tee /tmp/rollback.log; then
    notify.sh "✅ **Rollback Complete**

Database restored from backup.

Verify application functionality."

    echo "✅ Rollback successful"
  else
    notify.sh "🚨 **ROLLBACK FAILED**

Critical error during rollback!

Manual intervention required."

    echo "❌ Rollback failed"
    exit 1
  fi
else
  echo "Rollback cancelled"
  notify.sh "ℹ️ Rollback cancelled by user"
  exit 1
fi
```

### Testing Instructions

**Test in development**:
```bash
# 1. Make a schema change in shared/schema.ts
# 2. Run migration script
./scripts/telegram/integrations/db-migrate-secure.sh

# 3. Verify approval gate works
# 4. Check backup created
ls -l backups/db/

# 5. Test rollback
./scripts/telegram/integrations/db-rollback.sh backups/db/development_*.sql
```

### Customization Options

**Require multiple approvals**:
```bash
# After first approval:
if await_reply.sh "Second approval required (safety check)" 300; then
  # Proceed
fi
```

**Skip backup** (development only):
```bash
if [[ "$ENV_NAME" == "development" ]]; then
  log "Skipping backup in development"
else
  # Create backup
fi
```

---

## Example 4: General Claude Code Task Wrapper

### Use Case

Wrap any long-running Claude Code task with start/end notifications and error handling.

### Complete Implementation

**File**: `scripts/telegram/integrations/task-wrapper.sh`

```bash
#!/bin/bash
# task-wrapper.sh - Generic wrapper for any task with Telegram notifications

# ============================================================================
# Configuration
# ============================================================================

TASK_NAME="${1:-Unnamed Task}"
TASK_COMMAND="${@:2}"

if [[ -z "$TASK_COMMAND" ]]; then
  echo "Usage: $0 <task_name> <command> [args...]"
  echo "Example: $0 'Database Backup' pg_dump mydb > backup.sql"
  exit 1
fi

source .env 2>/dev/null || true
source scripts/telegram/core/notify.sh
notifyctl on

# ============================================================================
# Task Execution
# ============================================================================

LOG_FILE="/tmp/task_${TASK_NAME//[^a-zA-Z0-9]/_}_$(date +%s).log"

notify.sh "▶️ **Task Started**

**Name**: $TASK_NAME
**Command**: \`${TASK_COMMAND:0:100}${([[ ${#TASK_COMMAND} -gt 100 ]] && echo "...") || echo ""}\`
**Started**: $(date '+%Y-%m-%d %H:%M:%S')

Task running. You'll be notified when complete."

echo "▶️ Starting task: $TASK_NAME"
echo "Command: $TASK_COMMAND"
echo "Log: $LOG_FILE"

START_TIME=$(date +%s)

# Run command with output capture
if eval "$TASK_COMMAND" > "$LOG_FILE" 2>&1; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  # Success
  notify.sh "✅ **Task Complete**

**Name**: $TASK_NAME
**Duration**: ${DURATION}s (~$((DURATION / 60))m)
**Status**: Success

Log available: \`$LOG_FILE\`"

  echo "✅ Task completed successfully (${DURATION}s)"
  exit 0

else
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  EXIT_CODE=$?

  # Failure
  ERROR_LOG=$(tail -n 20 "$LOG_FILE")

  notify.sh "❌ **Task Failed**

**Name**: $TASK_NAME
**Duration**: ${DURATION}s
**Exit Code**: $EXIT_CODE

**Last 20 lines of output**:
\`\`\`
$ERROR_LOG
\`\`\`

Full log: \`$LOG_FILE\`"

  echo "❌ Task failed with exit code $EXIT_CODE"
  echo "Log: $LOG_FILE"
  exit $EXIT_CODE
fi
```

### Usage Examples

**Wrap database backup**:
```bash
./scripts/telegram/integrations/task-wrapper.sh \
  "Database Backup" \
  pg_dump "$DATABASE_URL" > /tmp/backup.sql
```

**Wrap npm build**:
```bash
./scripts/telegram/integrations/task-wrapper.sh \
  "Production Build" \
  npm run build
```

**Wrap long-running test**:
```bash
./scripts/telegram/integrations/task-wrapper.sh \
  "Integration Tests" \
  npm run test:integration
```

---

## Example 5: CI/CD Pipeline Integration

### GitHub Actions Complete Example

**File**: `.github/workflows/deploy-with-telegram.yml`

```yaml
name: Deploy with Telegram Notifications

on:
  push:
    branches: [main]
  workflow_dispatch:

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
          cache: 'npm'

      - name: Notify build start
        run: |
          chmod +x scripts/telegram/core/notify.sh
          touch /tmp/telegram_notify_enabled
          ./scripts/telegram/core/notify.sh "📦 **Build Started**

**Workflow**: ${{ github.workflow }}
**Commit**: \`${{ github.sha }}\`
**Author**: ${{ github.actor }}
**Branch**: ${{ github.ref_name }}

Building application..."

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ github.sha }}
          path: dist/

      - name: Notify build success
        if: success()
        run: |
          ./scripts/telegram/core/notify.sh "✅ **Build Complete**

Tests passed, build successful.

Proceeding to deployment..."

      - name: Notify build failure
        if: failure()
        run: |
          ./scripts/telegram/core/notify.sh "❌ **Build Failed**

Tests or build process failed.

Check GitHub Actions logs for details:
${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build-${{ github.sha }}
          path: dist/

      - name: Deploy to staging
        run: npm run deploy:staging

      - name: Notify staging success
        run: |
          chmod +x scripts/telegram/core/notify.sh
          touch /tmp/telegram_notify_enabled
          ./scripts/telegram/core/notify.sh "✅ **Staging Deployed**

Environment ready for testing:
http://staging.example.com

Review before approving production."

  approve-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Request production approval
        run: |
          chmod +x scripts/telegram/core/{notify.sh,await_reply.sh}
          touch /tmp/telegram_notify_enabled

          TOKEN=$(openssl rand -hex 8)

          ./scripts/telegram/core/await_reply.sh \
            "🚨 **PRODUCTION APPROVAL**

Commit: \`${{ github.sha }}\`

Reply: \`approve $TOKEN\`" \
            900 \
            "$TOKEN"

  deploy-production:
    needs: approve-production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: npm run deploy:production

      - name: Notify success
        run: |
          chmod +x scripts/telegram/core/notify.sh
          touch /tmp/telegram_notify_enabled
          ./scripts/telegram/core/notify.sh "🎉 **Production Deployed**

Commit: \`${{ github.sha }}\`
URL: https://example.com

Deployment complete!"
```

---

## Example 6: Scheduled Task Notifications

### Cron Job with Telegram Notifications

**File**: `scripts/telegram/integrations/scheduled-backup.sh`

```bash
#!/bin/bash
# scheduled-backup.sh - Daily database backup with notifications

source .env
source scripts/telegram/core/notify.sh
notifyctl on

BACKUP_DIR="/backups/daily"
BACKUP_FILE="$BACKUP_DIR/db_$(date +%Y%m%d).sql"

notify.sh "🔄 **Scheduled Backup Starting**

Daily database backup initiated at $(date)"

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>&1; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

  notify.sh "✅ **Backup Complete**

File: \`$BACKUP_FILE\`
Size: $SIZE

Daily backup successful."
else
  notify.sh "❌ **Backup Failed**

Scheduled backup encountered errors.

Check cron logs immediately!"
fi
```

**Crontab entry**:
```bash
# Daily at 2 AM
0 2 * * * /path/to/scripts/telegram/integrations/scheduled-backup.sh
```

---

**That's it!** These examples should cover most integration scenarios. Modify and combine them as needed for your specific use cases.

**Last Updated**: 2025-11-01
**Version**: 1.0.0
