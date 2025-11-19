#!/bin/bash
# Deploy to AWS Elastic Beanstalk Production Environment
# Called by Telegram /deploy production command
# Requires explicit approval via Telegram

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Import notification and approval systems
source "$SCRIPT_DIR/../core/notify.sh"
source "$SCRIPT_DIR/../core/await_reply.sh"

# Configuration
ENV_NAME="p3-interview-academy-prod-v2"
REGION="ap-southeast-1"

echo "========================================="
echo "AWS Deployment - PRODUCTION Environment"
echo "========================================="
echo ""
echo "⚠️  WARNING: This will deploy to PRODUCTION"
echo ""

# Step 1: Request approval
echo "Step 1: Requesting deployment approval..."
notify_question "🚨 Production Deployment Approval Required" \
    "Environment: $ENV_NAME\nRegion: $REGION\n\nApprove this production deployment?" \
    "Deploy" "Cancel"

RESPONSE=$(await_telegram_reply 900)  # 15 minute timeout

if [ "$RESPONSE" != "Deploy" ]; then
    echo "❌ Deployment cancelled by user"
    notify "❌ Production Deployment Cancelled" "User declined approval"
    exit 1
fi

echo "✅ Deployment approved"
notify "✅ Approval Received" "Starting production deployment..."

# Step 2: Verify AWS credentials
echo ""
echo "Step 2: Verifying AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured"
    notify "❌ Deployment Failed" "AWS credentials not available"
    exit 1
fi
echo "✅ AWS credentials verified"

# Step 3: Check if environment exists
echo ""
echo "Step 3: Checking environment status..."
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

# Step 4: Run tests
echo ""
echo "Step 4: Running test suite..."
notify "🧪 Running Tests" "Verifying code quality before deployment..."

cd "$PROJECT_ROOT"

if ! npm run test:run; then
    echo "❌ Tests failed - deployment aborted"
    notify "❌ Deployment Aborted" "Test suite failed - fix tests before deploying"
    exit 1
fi
echo "✅ All tests passed"

# Step 5: Build application
echo ""
echo "Step 5: Building application..."
notify "🏗️ Building Application" "Production build in progress..."

if ! npm run build; then
    echo "❌ Build failed"
    notify "❌ Deployment Failed" "npm run build failed"
    exit 1
fi
echo "✅ Build completed"

# Step 6: Create deployment bundle
echo ""
echo "Step 6: Creating deployment bundle..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUNDLE_NAME="production-${TIMESTAMP}.zip"

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

# Step 7: Upload to S3
echo ""
echo "Step 7: Uploading to S3..."
S3_BUCKET="elasticbeanstalk-$REGION-$(aws sts get-caller-identity --query Account --output text)"
S3_KEY="deployments/$BUNDLE_NAME"

aws s3 cp "/tmp/$BUNDLE_NAME" "s3://$S3_BUCKET/$S3_KEY" --region "$REGION"
echo "✅ Uploaded to S3"

# Step 8: Create application version
echo ""
echo "Step 8: Creating application version..."
APP_NAME="p3-interview-academy"
VERSION_LABEL="production-$TIMESTAMP"

aws elasticbeanstalk create-application-version \
    --application-name "$APP_NAME" \
    --version-label "$VERSION_LABEL" \
    --source-bundle "S3Bucket=$S3_BUCKET,S3Key=$S3_KEY" \
    --region "$REGION" \
    > /dev/null

echo "✅ Application version created: $VERSION_LABEL"

# Step 9: Deploy to environment
echo ""
echo "Step 9: Deploying to PRODUCTION..."
notify "🚀 Deploying to PRODUCTION" "Version: $VERSION_LABEL\n\n⚠️ Monitor closely!"

aws elasticbeanstalk update-environment \
    --environment-name "$ENV_NAME" \
    --version-label "$VERSION_LABEL" \
    --region "$REGION" \
    > /dev/null

echo "✅ Deployment initiated"

# Step 10: Wait for deployment
echo ""
echo "Step 10: Waiting for deployment to complete..."
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

# Step 11: Verify health
echo ""
echo "Step 11: Verifying deployment health..."
FINAL_HEALTH=$(aws elasticbeanstalk describe-environments \
    --environment-names "$ENV_NAME" \
    --region "$REGION" \
    --query "Environments[0].Health" \
    --output text)

if [ "$FINAL_HEALTH" = "Green" ]; then
    echo "✅ Environment health: $FINAL_HEALTH"
    notify "✅ PRODUCTION Deployment SUCCESS" "Health: $FINAL_HEALTH\nVersion: $VERSION_LABEL\n\n🎉 Production is live!"
elif [ "$FINAL_HEALTH" = "Yellow" ]; then
    echo "⚠️ Environment health: $FINAL_HEALTH"
    notify "⚠️ Production Deployment Warning" "Health: $FINAL_HEALTH\nVersion: $VERSION_LABEL\n\nManual verification recommended"
else
    echo "❌ Environment health: $FINAL_HEALTH"
    notify "❌ Production Deployment Issue" "Health: $FINAL_HEALTH\nVersion: $VERSION_LABEL\n\n🚨 IMMEDIATE ACTION REQUIRED"
fi

# Step 12: Smoke tests
echo ""
echo "Step 12: Running smoke tests..."
HEALTH_URL="http://$ENV_NAME.eba-wdmrjtn2.$REGION.elasticbeanstalk.com/api/health/simple"

if curl -sf "$HEALTH_URL" > /dev/null; then
    echo "✅ Health endpoint responding"
else
    echo "⚠️ Health endpoint check failed"
    notify "⚠️ Smoke Test Warning" "Health endpoint not responding - verify manually"
fi

# Cleanup
rm -f "/tmp/$BUNDLE_NAME"

echo ""
echo "========================================="
echo "Production deployment complete!"
echo "Environment: $ENV_NAME"
echo "Version: $VERSION_LABEL"
echo "Health: $FINAL_HEALTH"
echo "========================================="

exit 0
