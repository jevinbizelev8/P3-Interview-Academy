#!/bin/bash
# Debug and fix AWS Elastic Beanstalk staging environment stuck in "Updating" state

set -e

ENVIRONMENT_NAME="p3-interview-academy-staging"
REGION="ap-southeast-1"

echo "🔍 Checking staging environment status..."

# Get current environment status
ENV_STATUS=$(aws elasticbeanstalk describe-environments \
  --environment-names "$ENVIRONMENT_NAME" \
  --region "$REGION" \
  --query 'Environments[0]' \
  --output json)

echo "Current Environment Status:"
echo "$ENV_STATUS" | jq '{Status, Health, AbortableOperationInProgress, DateUpdated, VersionLabel}'

STATUS=$(echo "$ENV_STATUS" | jq -r '.Status')
ABORTABLE=$(echo "$ENV_STATUS" | jq -r '.AbortableOperationInProgress')

echo ""
echo "📋 Recent environment events (last 20):"
aws elasticbeanstalk describe-events \
  --environment-name "$ENVIRONMENT_NAME" \
  --region "$REGION" \
  --max-items 20 \
  --query 'Events[].{Time:EventDate,Severity:Severity,Message:Message}' \
  --output table

echo ""
if [ "$STATUS" = "Updating" ] && [ "$ABORTABLE" = "true" ]; then
  echo "⚠️  Environment is stuck in 'Updating' state with an abortable operation"
  echo ""
  echo "Options:"
  echo "1. Abort the current update (recommended if stuck for >10 minutes)"
  echo "2. Wait longer (if update just started)"
  echo ""
  read -p "Do you want to abort the stuck update? (yes/no): " ABORT_CHOICE

  if [ "$ABORT_CHOICE" = "yes" ]; then
    echo "🛑 Aborting environment update..."
    aws elasticbeanstalk abort-environment-update \
      --environment-name "$ENVIRONMENT_NAME" \
      --region "$REGION"

    echo "✅ Abort command sent. Waiting 30 seconds for environment to stabilize..."
    sleep 30

    # Check new status
    NEW_STATUS=$(aws elasticbeanstalk describe-environments \
      --environment-names "$ENVIRONMENT_NAME" \
      --region "$REGION" \
      --query 'Environments[0].{Status:Status,Health:Health}' \
      --output json)

    echo "New environment status:"
    echo "$NEW_STATUS" | jq '.'
  else
    echo "Skipping abort. Environment will continue updating."
  fi
elif [ "$STATUS" = "Ready" ]; then
  echo "✅ Environment is Ready and healthy"

  # Check if there are any pending updates
  PENDING=$(aws elasticbeanstalk describe-environment-health \
    --environment-name "$ENVIRONMENT_NAME" \
    --region "$REGION" \
    --attribute-names All \
    --query 'Status' \
    --output text 2>/dev/null || echo "N/A")

  echo "Environment health status: $PENDING"
else
  echo "ℹ️  Environment status: $STATUS (not stuck)"
fi

echo ""
echo "🔗 Staging URL: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"
