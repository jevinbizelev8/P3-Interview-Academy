#!/bin/bash
# Deploy to AWS Elastic Beanstalk Staging Environment
# Called by Telegram /deploy staging command

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Import notification system
source "$SCRIPT_DIR/../core/notify.sh"

# Configuration
ENV_NAME="p3-interview-academy-staging"
REGION="ap-southeast-1"

echo "========================================="
echo "AWS Deployment - Staging Environment"
echo "========================================="
echo ""

# Step 1: Verify AWS credentials
echo "Step 1: Verifying AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured"
    notify "❌ Deployment Failed" "AWS credentials not available"
    exit 1
fi
echo "✅ AWS credentials verified"

# Step 2: Check if environment exists
echo ""
echo "Step 2: Checking environment status..."
if ! aws elasticbeanstalk describe-environments \
    --environment-names "$ENV_NAME" \
    --region "$REGION" > /dev/null 2>&1; then
    echo "❌ Environment $ENV_NAME not found"
    notify "❌ Deployment Failed" "Environment $ENV_NAME does not exist"
    exit 1
fi

HEALTH=$(aws elasticbeanstalk describe-environments \
    --environment-names "$ENV_NAME" \
    --region "$REGION" \
    --query "Environments[0].Health" \
    --output text)

echo "✅ Environment found (Health: $HEALTH)"

# Step 3: Build application
echo ""
echo "Step 3: Building application..."
cd "$PROJECT_ROOT"

notify "🏗️ Building application" "Running npm run build..."

if ! npm run build; then
    echo "❌ Build failed"
    notify "❌ Deployment Failed" "npm run build failed"
    exit 1
fi
echo "✅ Build completed"

# Step 4: Create deployment bundle
echo ""
echo "Step 4: Creating deployment bundle..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUNDLE_NAME="staging-${TIMESTAMP}.zip"

# Create bundle excluding development files
zip -r "/tmp/$BUNDLE_NAME" . \
    -x "*.git*" \
    -x "*node_modules/*" \
    -x "*.venv/*" \
    -x "*.DS_Store" \
    -x "*tmp/*" \
    -x "*.log" \
    > /dev/null 2>&1

echo "✅ Bundle created: $BUNDLE_NAME"

# Step 5: Upload to S3
echo ""
echo "Step 5: Uploading to S3..."
S3_BUCKET="elasticbeanstalk-$REGION-$(aws sts get-caller-identity --query Account --output text)"
S3_KEY="deployments/$BUNDLE_NAME"

aws s3 cp "/tmp/$BUNDLE_NAME" "s3://$S3_BUCKET/$S3_KEY" --region "$REGION"
echo "✅ Uploaded to S3"

# Step 6: Create application version
echo ""
echo "Step 6: Creating application version..."
APP_NAME="p3-interview-academy"
VERSION_LABEL="staging-$TIMESTAMP"

aws elasticbeanstalk create-application-version \
    --application-name "$APP_NAME" \
    --version-label "$VERSION_LABEL" \
    --source-bundle "S3Bucket=$S3_BUCKET,S3Key=$S3_KEY" \
    --region "$REGION" \
    > /dev/null

echo "✅ Application version created: $VERSION_LABEL"

# Step 7: Deploy to environment
echo ""
echo "Step 7: Deploying to staging..."
notify "🚀 Deploying to Staging" "Version: $VERSION_LABEL"

aws elasticbeanstalk update-environment \
    --environment-name "$ENV_NAME" \
    --version-label "$VERSION_LABEL" \
    --region "$REGION" \
    > /dev/null

echo "✅ Deployment initiated"

# Step 8: Wait for deployment
echo ""
echo "Step 8: Waiting for deployment to complete..."
echo "This may take 2-5 minutes..."

TIMEOUT=300  # 5 minutes
ELAPSED=0
INTERVAL=15

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(aws elasticbeanstalk describe-environments \
        --environment-names "$ENV_NAME" \
        --region "$REGION" \
        --query "Environments[0].Status" \
        --output text)

    if [ "$STATUS" = "Ready" ]; then
        echo "✅ Deployment complete!"
        break
    fi

    echo "Status: $STATUS (waiting...)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "⏰ Deployment timed out after 5 minutes"
    notify "⏰ Deployment Timeout" "Check AWS console for status"
    exit 1
fi

# Step 9: Verify health
echo ""
echo "Step 9: Verifying deployment health..."
FINAL_HEALTH=$(aws elasticbeanstalk describe-environments \
    --environment-names "$ENV_NAME" \
    --region "$REGION" \
    --query "Environments[0].Health" \
    --output text)

if [ "$FINAL_HEALTH" = "Green" ] || [ "$FINAL_HEALTH" = "Yellow" ]; then
    echo "✅ Environment health: $FINAL_HEALTH"
    notify "✅ Staging Deployment Complete" "Health: $FINAL_HEALTH\nVersion: $VERSION_LABEL"
else
    echo "⚠️ Environment health: $FINAL_HEALTH"
    notify "⚠️ Deployment Warning" "Health: $FINAL_HEALTH\nManual verification needed"
fi

# Cleanup
rm -f "/tmp/$BUNDLE_NAME"

echo ""
echo "========================================="
echo "Deployment to staging complete!"
echo "Environment: $ENV_NAME"
echo "Version: $VERSION_LABEL"
echo "Health: $FINAL_HEALTH"
echo "========================================="

exit 0
