#!/bin/bash

# P³ Interview Academy - Complete Deployment Script
# Deploys a bundle to AWS Elastic Beanstalk

set -e

# Configuration
APPLICATION_NAME="p3-interview-academy"
ENVIRONMENT_NAME="p3-interview-academy-prod-v2"
REGION="ap-southeast-1"

# Get bundle file from argument or create one
BUNDLE_FILE="$1"

echo "=========================================="
echo "P³ Interview Academy - Deployment"
echo "=========================================="
echo "Application: $APPLICATION_NAME"
echo "Environment: $ENVIRONMENT_NAME"
echo "Region: $REGION"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI not found. Please install and configure AWS CLI first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "ERROR: AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Get AWS account ID for S3 bucket
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
S3_BUCKET="elasticbeanstalk-$REGION-$AWS_ACCOUNT_ID"
S3_KEY="$APPLICATION_NAME"

echo "AWS Account: $AWS_ACCOUNT_ID"
echo "S3 Bucket: $S3_BUCKET"
echo ""

# Handle bundle file
if [ -z "$BUNDLE_FILE" ]; then
    echo "No bundle file specified. Creating new deployment bundle..."
    if [ -f "./deployment-scripts/create-deployment-bundle.sh" ]; then
        ./deployment-scripts/create-deployment-bundle.sh
        # Get the most recent bundle file
        BUNDLE_FILE=$(ls -t p3-interview-academy-eb-*.zip 2>/dev/null | head -1)
        if [ -z "$BUNDLE_FILE" ]; then
            echo "ERROR: Bundle creation failed or no bundle found"
            exit 1
        fi
        echo "Created bundle: $BUNDLE_FILE"
    else
        echo "ERROR: Bundle creation script not found and no bundle specified"
        exit 1
    fi
elif [ ! -f "$BUNDLE_FILE" ]; then
    echo "ERROR: Bundle file '$BUNDLE_FILE' not found"
    exit 1
fi

# Extract version label from bundle filename
VERSION_LABEL=$(basename "$BUNDLE_FILE" .zip)

echo "Using bundle: $BUNDLE_FILE"
echo "Version label: $VERSION_LABEL"
echo ""

# Check environment status
echo "1. CHECKING ENVIRONMENT STATUS"
echo "==============================="

env_status=$(aws elasticbeanstalk describe-environments \
    --region "$REGION" \
    --environment-names "$ENVIRONMENT_NAME" \
    --query 'Environments[0].Status' \
    --output text 2>/dev/null)

if [ "$env_status" = "None" ] || [ -z "$env_status" ]; then
    echo "ERROR: Environment '$ENVIRONMENT_NAME' not found"
    exit 1
fi

echo "Current environment status: $env_status"

if [ "$env_status" != "Ready" ]; then
    echo "WARNING: Environment is not in 'Ready' state. Current state: $env_status"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

echo "✓ Environment is accessible"
echo ""

# Upload bundle to S3
echo "2. UPLOADING BUNDLE TO S3"
echo "=========================="

echo "Uploading $BUNDLE_FILE to S3..."
aws s3 cp "$BUNDLE_FILE" "s3://$S3_BUCKET/$S3_KEY/" --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✓ Bundle uploaded to S3"
else
    echo "ERROR: Failed to upload bundle to S3"
    exit 1
fi

echo ""

# Create application version
echo "3. CREATING APPLICATION VERSION"
echo "==============================="

echo "Creating application version: $VERSION_LABEL"

aws elasticbeanstalk create-application-version \
    --region "$REGION" \
    --application-name "$APPLICATION_NAME" \
    --version-label "$VERSION_LABEL" \
    --description "Deployment $(date '+%Y-%m-%d %H:%M:%S') - $(whoami)" \
    --source-bundle "S3Bucket=$S3_BUCKET,S3Key=$S3_KEY/$(basename $BUNDLE_FILE)" \
    --auto-create-application

if [ $? -eq 0 ]; then
    echo "✓ Application version created"
else
    echo "ERROR: Failed to create application version"
    exit 1
fi

echo ""

# Deploy to environment
echo "4. DEPLOYING TO ENVIRONMENT"
echo "============================"

echo "Deploying version '$VERSION_LABEL' to environment '$ENVIRONMENT_NAME'..."

aws elasticbeanstalk update-environment \
    --region "$REGION" \
    --environment-name "$ENVIRONMENT_NAME" \
    --version-label "$VERSION_LABEL"

if [ $? -eq 0 ]; then
    echo "✓ Deployment initiated"
else
    echo "ERROR: Failed to initiate deployment"
    exit 1
fi

echo ""

# Monitor deployment
echo "5. MONITORING DEPLOYMENT"
echo "========================"

echo "Monitoring deployment progress..."
echo "This may take several minutes..."
echo ""

# Function to check deployment status
check_status() {
    local status
    status=$(aws elasticbeanstalk describe-environments \
        --region "$REGION" \
        --environment-names "$ENVIRONMENT_NAME" \
        --query 'Environments[0].Status' \
        --output text)
    echo "$status"
}

# Wait for deployment to complete
start_time=$(date +%s)
timeout=900  # 15 minutes timeout

while true; do
    current_status=$(check_status)
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    echo "$(date '+%H:%M:%S') - Status: $current_status (${elapsed}s elapsed)"

    if [ "$current_status" = "Ready" ]; then
        echo ""
        echo "🎉 Deployment completed successfully!"
        break
    elif [ "$current_status" = "Severe" ] || [ "$current_status" = "Degraded" ]; then
        echo ""
        echo "❌ Deployment failed with status: $current_status"
        echo ""
        echo "Recent events:"
        aws elasticbeanstalk describe-events \
            --region "$REGION" \
            --environment-name "$ENVIRONMENT_NAME" \
            --max-items 5 \
            --query 'Events[].[EventDate,Severity,Message]' \
            --output table
        exit 1
    elif [ $elapsed -gt $timeout ]; then
        echo ""
        echo "❌ Deployment timed out after ${timeout} seconds"
        echo "Check AWS console for more details"
        exit 1
    fi

    sleep 30
done

echo ""

# Final verification
echo "6. DEPLOYMENT VERIFICATION"
echo "=========================="

# Get environment info
env_info=$(aws elasticbeanstalk describe-environments \
    --region "$REGION" \
    --environment-names "$ENVIRONMENT_NAME" \
    --query 'Environments[0].[CNAME,Health,Status]' \
    --output text)

echo "$env_info" | while IFS=$'\t' read -r cname health status; do
    echo "URL: http://$cname"
    echo "Health: $health"
    echo "Status: $status"
    echo ""

    # Test health endpoint
    if [ "$health" = "Ok" ] && command -v curl &> /dev/null; then
        echo "Testing health endpoint..."
        health_response=$(curl -s -w "%{http_code}" "http://$cname/api/health" || echo "000")

        if [[ "$health_response" == *"200" ]]; then
            echo "✅ Health endpoint responding correctly"
        else
            echo "⚠️ Health endpoint test failed - response: $health_response"
        fi
    fi
done

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Version deployed: $VERSION_LABEL"
echo "Bundle used: $BUNDLE_FILE"
echo "Environment: $ENVIRONMENT_NAME"
echo ""
echo "Next steps:"
echo "- Test your application thoroughly"
echo "- Monitor logs: aws logs tail /aws/elasticbeanstalk/$ENVIRONMENT_NAME/var/log/eb-docker/containers/eb-current-app"
echo "- Check environment status: ./deployment-scripts/check-environment-status.sh"
echo ""

if [ -f "$BUNDLE_FILE" ]; then
    echo "Bundle file ($BUNDLE_FILE) can be safely deleted if deployment is successful."
fi