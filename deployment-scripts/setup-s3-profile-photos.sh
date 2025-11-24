#!/bin/bash

# S3 Profile Photos Setup Script
# Purpose: Configure AWS S3 bucket for profile photo uploads
# Usage: ./deployment-scripts/setup-s3-profile-photos.sh [staging|production]

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="p3-user-uploads"
AWS_REGION="ap-southeast-1"
ENVIRONMENT="${1:-staging}"  # Default to staging

# Environment-specific settings
if [ "$ENVIRONMENT" = "production" ]; then
    EB_ENV_NAME="p3-interview-academy-prod-v2"
    ALLOWED_ORIGINS='["https://p3app.bizelev8.ai","http://localhost:5000"]'
else
    EB_ENV_NAME="p3-interview-academy-staging"
    ALLOWED_ORIGINS='["https://p3app-staging.bizelev8.ai","http://localhost:5000","http://localhost:5173"]'
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}S3 Profile Photos Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket: $BUCKET_NAME"
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Check if bucket exists
echo -e "${YELLOW}Step 1: Checking if bucket exists...${NC}"
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo -e "${GREEN}✓ Bucket already exists${NC}"
else
    echo "Creating bucket..."
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    check_status "Bucket created"
fi
echo ""

# Step 2: Configure public access block
echo -e "${YELLOW}Step 2: Configuring public access...${NC}"
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
check_status "Public access configured"
echo ""

# Step 3: Create and apply bucket policy
echo -e "${YELLOW}Step 3: Creating bucket policy...${NC}"
cat > /tmp/s3-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/profile-photos/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/s3-bucket-policy.json
check_status "Bucket policy applied"
echo ""

# Step 4: Configure CORS
echo -e "${YELLOW}Step 4: Configuring CORS...${NC}"
cat > /tmp/s3-cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": $ALLOWED_ORIGINS,
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///tmp/s3-cors-config.json
check_status "CORS configured"
echo ""

# Step 5: Verify bucket configuration
echo -e "${YELLOW}Step 5: Verifying bucket configuration...${NC}"

# Check bucket location
echo -n "Bucket location: "
aws s3api get-bucket-location --bucket "$BUCKET_NAME" --query LocationConstraint --output text

# Check policy exists
echo -n "Bucket policy: "
if aws s3api get-bucket-policy --bucket "$BUCKET_NAME" --query Policy --output text | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Configured${NC}"
else
    echo -e "${RED}✗ Not configured${NC}"
fi

# Check CORS exists
echo -n "CORS configuration: "
if aws s3api get-bucket-cors --bucket "$BUCKET_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Configured${NC}"
else
    echo -e "${RED}✗ Not configured${NC}"
fi
echo ""

# Step 6: Set Elastic Beanstalk environment variables
echo -e "${YELLOW}Step 6: Setting Elastic Beanstalk environment variables...${NC}"
echo "Environment: $EB_ENV_NAME"

aws elasticbeanstalk update-environment \
    --application-name p3-interview-academy \
    --environment-name "$EB_ENV_NAME" \
    --region "$AWS_REGION" \
    --option-settings \
        Namespace=aws:elasticbeanstalk:application:environment,OptionName=S3_BUCKET_NAME,Value="$BUCKET_NAME" \
        Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS_REGION,Value="$AWS_REGION"

check_status "Environment variables set"
echo ""

# Wait for environment update
echo -e "${YELLOW}Waiting for environment update to complete...${NC}"
echo "(This may take 2-3 minutes)"

MAX_WAIT=180  # 3 minutes
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(aws elasticbeanstalk describe-environments \
        --application-name p3-interview-academy \
        --environment-names "$EB_ENV_NAME" \
        --region "$AWS_REGION" \
        --query 'Environments[0].Status' \
        --output text)

    if [ "$STATUS" = "Ready" ]; then
        echo -e "${GREEN}✓ Environment update complete${NC}"
        break
    fi

    echo -n "."
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done
echo ""

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠ Environment update still in progress. Check AWS console for status.${NC}"
fi

# Step 7: Verify environment variables
echo -e "${YELLOW}Step 7: Verifying environment variables...${NC}"
aws elasticbeanstalk describe-configuration-settings \
    --application-name p3-interview-academy \
    --environment-name "$EB_ENV_NAME" \
    --region "$AWS_REGION" \
    --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`S3_BUCKET_NAME` || OptionName==`AWS_REGION`]' \
    --output table

check_status "Environment variables verified"
echo ""

# Step 8: Test S3 upload (create test file)
echo -e "${YELLOW}Step 8: Testing S3 upload...${NC}"

# Create small test image (1x1 pixel PNG)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-upload.png

# Upload test file
TEST_KEY="profile-photos/test-user/$(date +%s)-test-upload.png"
aws s3 cp /tmp/test-upload.png "s3://$BUCKET_NAME/$TEST_KEY" \
    --content-type "image/png" \
    --acl public-read \
    --region "$AWS_REGION"

check_status "Test file uploaded"

# Test direct access
TEST_URL="https://$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com/$TEST_KEY"
echo "Test URL: $TEST_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Direct S3 access works (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Direct S3 access failed (HTTP $HTTP_CODE)${NC}"
fi

# Clean up test file
aws s3 rm "s3://$BUCKET_NAME/$TEST_KEY"
check_status "Test file cleaned up"
echo ""

# Clean up temp files
rm -f /tmp/s3-bucket-policy.json /tmp/s3-cors-config.json /tmp/test-upload.png

# Final summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ S3 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket Configuration:"
echo "  • Bucket: $BUCKET_NAME"
echo "  • Region: $AWS_REGION"
echo "  • Public Read: Enabled for /profile-photos/"
echo "  • CORS: Configured for $ENVIRONMENT"
echo ""
echo "Elastic Beanstalk:"
echo "  • Environment: $EB_ENV_NAME"
echo "  • S3_BUCKET_NAME: $BUCKET_NAME"
echo "  • AWS_REGION: $AWS_REGION"
echo ""
echo "Next Steps:"
echo "  1. Test photo upload in $ENVIRONMENT environment"
echo "  2. Verify photo displays correctly"
echo "  3. Check that S3 URLs are accessible"
echo "  4. Run full UAT test scenarios"
echo ""
echo "Testing URL:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  https://p3app.bizelev8.ai/profile"
else
    echo "  https://p3app-staging.bizelev8.ai/profile"
fi
echo ""
echo -e "${GREEN}Setup script completed successfully!${NC}"
