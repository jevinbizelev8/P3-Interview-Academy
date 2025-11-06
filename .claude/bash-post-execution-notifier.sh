#!/bin/bash
# Post-execution notification hook
# Sends confirmation after command actually executes

set -e

# Check if notifications are enabled
NOTIFY_ENABLED_FILE="/home/runner/workspace/.notify.enabled"
if [ ! -f "$NOTIFY_ENABLED_FILE" ]; then
    exit 0
fi

# Get tool arguments from stdin
TOOL_ARGS=$(cat)

# Extract command and description from JSON
COMMAND=$(echo "$TOOL_ARGS" | grep -o '"command":"[^"]*"' | cut -d'"' -f4 | head -1)
DESCRIPTION=$(echo "$TOOL_ARGS" | grep -o '"description":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -z "$COMMAND" ]; then
    exit 0
fi

# Check if command is pre-approved (same list as pre-tool hook)
PRE_APPROVED_PATTERNS=(
    "npm run test"
    "npm run build"
    "npm run check"
    "git status"
    "git diff"
    "git log"
    "./scripts/telegram/core/notify.sh"
    "./scripts/telegram/core/notifyctl"
    "./deployment-scripts/check-environment-status.sh"
    "./deployment-scripts/smoke-tests.ts"
    "node ./deployment-scripts/smoke-tests.ts"
    "npx tsx"
    "cat "
    "grep "
    "tail "
    "head "
    "ls "
    "wc "
    "find "
    "diff "
    "echo "
    "chmod "
    "curl "
    "python3 "
    "jq "
    "aws elasticbeanstalk describe-"
    "aws elasticbeanstalk list-"
    "aws elasticbeanstalk update-environment"
    "aws elasticbeanstalk create-application-version"
    "aws elasticbeanstalk update-application-version"
    "aws rds describe-"
    "aws elb describe-"
    "aws elbv2 describe-"
    "aws ec2 describe-"
    "aws acm describe-"
    "aws acm list-"
    "aws acm wait"
    "aws cloudwatch get-"
    "aws cloudformation describe-"
    "aws cloudformation list-"
    "aws cloudformation get-"
    "aws logs describe-"
    "aws logs tail"
    "aws s3 cp"
    "aws s3 sync"
    "aws s3 ls"
    "gh run list"
    "gh run view"
    "gh workflow list"
    "gh pr list"
    "gh pr view"
    "gh repo view"
    "gh api"
)

IS_PRE_APPROVED=false
for pattern in "${PRE_APPROVED_PATTERNS[@]}"; do
    if [[ "$COMMAND" == $pattern* ]]; then
        IS_PRE_APPROVED=true
        break
    fi
done

# Only send confirmation for non-pre-approved commands that were actually approved and executed
if [ "$IS_PRE_APPROVED" = false ]; then
    NOTIFY_SCRIPT="/home/runner/workspace/scripts/telegram/core/notify.sh"

    if [ -f "$NOTIFY_SCRIPT" ]; then
        # Truncate command for display
        if [ ${#COMMAND} -gt 80 ]; then
            SHORT_CMD="${COMMAND:0:80}..."
        else
            SHORT_CMD="$COMMAND"
        fi

        # Format confirmation message
        if [ -n "$DESCRIPTION" ]; then
            MESSAGE="🟢 *APPROVED & EXECUTED*
━━━━━━━━━━━━━━━━━━
📋 $DESCRIPTION

\`${SHORT_CMD}\`"
        else
            MESSAGE="🟢 *APPROVED & EXECUTED*
━━━━━━━━━━━━━━━━━━
\`${SHORT_CMD}\`"
        fi

        # Send confirmation
        "$NOTIFY_SCRIPT" "$MESSAGE" &>/dev/null || true

        echo "[POST-EXEC HOOK] Confirmation sent for: $COMMAND" >> /tmp/approval-hook.log
    fi
fi

exit 0
