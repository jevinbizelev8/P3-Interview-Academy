#!/bin/bash
# Database Migration Approval Wrapper for P3 Interview Academy
#
# Usage: ./scripts/telegram/integrations/db-migrate-p3.sh [--staging|--production]
#
# This script wraps Drizzle Kit database migrations with Telegram approval.
# It shows the schema diff and requires explicit approval before applying changes.

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

cd "$PROJECT_ROOT"

# Parse environment argument
ENV="${1:---staging}"
case "$ENV" in
  --staging)
    DB_NAME="p3_staging"
    ENV_NAME="Staging"
    ;;
  --production)
    DB_NAME="postgres"
    ENV_NAME="Production"
    ;;
  *)
    echo "Usage: $0 [--staging|--production]" >&2
    exit 2
    ;;
esac

echo "🗄️  Database Migration - $ENV_NAME"
echo "════════════════════════════════════════════"

# Check if notifications enabled
if [[ ! -f ".notify.enabled" ]]; then
  echo "⚠️  Notifications disabled (notifyctl off)"
  echo "Running migration without approval..."
  npm run db:push
  exit $?
fi

# Get schema diff
echo "Fetching schema changes..."
SCHEMA_DIFF=$(npx drizzle-kit push --print 2>&1 || echo "Error fetching schema diff")

# Check if there are changes
if echo "$SCHEMA_DIFF" | grep -q "No schema changes"; then
  echo "✅ No schema changes detected"
  exit 0
fi

# Truncate diff if too long (Telegram message limit)
DIFF_LENGTH=${#SCHEMA_DIFF}
if [[ $DIFF_LENGTH -gt 3000 ]]; then
  SCHEMA_DIFF="${SCHEMA_DIFF:0:3000}

... (truncated, ${DIFF_LENGTH} chars total)"
fi

# Generate secure token
TOKEN=$(openssl rand -hex 8)

# Create pending request
mkdir -p .pending
echo "$TOKEN" > ".pending/$TOKEN"

# Send approval request with schema diff
./scripts/telegram/core/notify.sh <<EOF
🗄️ **Database Migration Approval Required**

**Environment**: $ENV_NAME ($DB_NAME)
**Timestamp**: $(date '+%Y-%m-%d %H:%M:%S')

**Schema Changes:**
\`\`\`
$SCHEMA_DIFF
\`\`\`

**⚠️ WARNING**: These changes will be applied to $ENV_NAME database.

**To approve, reply:**
\`approve $TOKEN\`

**To reject, reply:**
\`reject $TOKEN\`

*Timeout: 5 minutes*
EOF

echo "📱 Approval request sent to Telegram"
echo "Waiting for response..."

# Wait for approval (5 minute timeout)
if ./scripts/telegram/core/await_reply.sh "$TOKEN" 300; then
  DECISION=$(cat ".inbox/$TOKEN")
  rm -f ".inbox/$TOKEN"

  if [[ "$DECISION" == "approve" ]]; then
    echo "✅ Migration APPROVED - proceeding..."

    # Apply migration
    if npm run db:push; then
      ./scripts/telegram/core/notify.sh <<EOF
✅ **Database Migration SUCCESS**

**Environment**: $ENV_NAME
**Status**: Schema changes applied successfully
**Timestamp**: $(date '+%Y-%m-%d %H:%M:%S')
EOF
      echo "✅ Migration completed successfully"
      exit 0
    else
      ./scripts/telegram/core/notify.sh <<EOF
❌ **Database Migration FAILED**

**Environment**: $ENV_NAME
**Error**: Migration command failed
**Timestamp**: $(date '+%Y-%m-%d %H:%M:%S')

**Action Required**: Check logs and database state
EOF
      echo "❌ Migration failed"
      exit 1
    fi
  else
    echo "❌ Migration REJECTED by user"
    ./scripts/telegram/core/notify.sh "⏸️ Database migration cancelled by user"
    exit 1
  fi
else
  echo "⏰ Approval timeout (5 minutes)"
  ./scripts/telegram/core/notify.sh "⏰ Database migration timeout - no response"
  rm -f ".pending/$TOKEN"
  exit 1
fi
