#!/bin/bash
# Enhanced Bash Approval Notification Hook with Auto-Confirmation
# Sends approval request notification, then tracks and confirms execution
# FIXED: Using setsid to prevent process group termination

set -e

# Check if notifications are enabled
NOTIFY_ENABLED_FILE="/home/runner/workspace/.notify.enabled"
if [ ! -f "$NOTIFY_ENABLED_FILE" ]; then
    exit 0
fi

# Get tool arguments from stdin
TOOL_ARGS=$(cat)

# Extract command from JSON
COMMAND=$(echo "$TOOL_ARGS" | grep -o '"command":"[^"]*"' | cut -d'"' -f4 | head -1)
DESCRIPTION=$(echo "$TOOL_ARGS" | grep -o '"description":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -z "$COMMAND" ]; then
    exit 0
fi

# Check if command is pre-approved
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

# Only process if command needs approval
if [ "$IS_PRE_APPROVED" = false ]; then
    NOTIFY_SCRIPT="/home/runner/workspace/scripts/telegram/core/notify.sh"

    if [ -f "$NOTIFY_SCRIPT" ]; then
        # Truncate command for display (more generous limit)
        if [ ${#COMMAND} -gt 80 ]; then
            SHORT_CMD="${COMMAND:0:80}..."
        else
            SHORT_CMD="$COMMAND"
        fi

        # Format description (if available)
        if [ -n "$DESCRIPTION" ]; then
            DESC_LINE="📋 $DESCRIPTION"
        else
            DESC_LINE="🔧 Command requires approval"
        fi

        # Send approval request (Red/Warning Style)
        MESSAGE="🔴 *APPROVAL NEEDED*
━━━━━━━━━━━━━━━━━━
$DESC_LINE

\`${SHORT_CMD}\`

⏱ *Waiting for approval...*"

        "$NOTIFY_SCRIPT" "$MESSAGE" &>/dev/null || true

        echo "[APPROVAL HOOK] Approval request sent for: $COMMAND" >> /tmp/approval-hook.log
    fi
fi

exit 0
