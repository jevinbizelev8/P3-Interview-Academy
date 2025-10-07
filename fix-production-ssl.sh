#!/bin/bash

# Fix Production SSL Certificate Issue
# This script updates the AWS Elastic Beanstalk environment to disable SSL certificate verification
# for self-signed certificates in the PostgreSQL database connection

set -e

ENVIRONMENT_NAME="p3-interview-academy-prod-v2"
REGION="ap-southeast-1"

echo "🔧 Fixing SSL certificate issue in production..."
echo "Environment: $ENVIRONMENT_NAME"
echo "Region: $REGION"
echo ""

# Option 1: Set NODE_TLS_REJECT_UNAUTHORIZED (temporary workaround)
echo "Setting NODE_TLS_REJECT_UNAUTHORIZED=0 to bypass SSL verification..."
aws elasticbeanstalk update-environment \
  --environment-name "$ENVIRONMENT_NAME" \
  --region "$REGION" \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_TLS_REJECT_UNAUTHORIZED,Value=0

echo ""
echo "✅ Environment variable updated successfully!"
echo ""
echo "⏳ The environment will restart automatically (takes ~2-3 minutes)"
echo ""
echo "📋 To verify the fix:"
echo "1. Wait for environment to restart"
echo "2. Run: curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health"
echo "3. Check that database.status is 'healthy'"
echo "4. Test signup/login functionality"
echo ""
echo "⚠️  Note: This is a temporary fix. For production, you should:"
echo "  - Use RDS CA certificates"
echo "  - Or update DATABASE_URL to include proper SSL parameters"
echo ""
