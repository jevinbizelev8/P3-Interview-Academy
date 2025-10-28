#!/bin/bash

# =============================================================================
# Configure GitHub Environment Secrets from AWS EB
# =============================================================================
# This script fetches environment variables from AWS Elastic Beanstalk
# and sets them as GitHub Environment secrets
#
# Prerequisites:
# - AWS CLI configured with credentials
# - gh CLI authenticated
# - Repository admin access
#
# Usage:
#   bash deployment-scripts/configure-github-secrets.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
REPO="jevinbizelev8/P3-Interview-Academy"
AWS_REGION="ap-southeast-1"
EB_APP="p3-interview-academy"
EB_STAGING="p3-interview-academy-staging"
EB_PRODUCTION="p3-interview-academy-prod-v2"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}GitHub Secrets Configuration${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI not found${NC}"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo -e "${RED}ERROR: gh CLI not found${NC}"
    exit 1
fi

if ! aws sts get-caller-identity --region $AWS_REGION &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
echo -e "${GREEN}✓ AWS Account: $AWS_ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Function to get secret from AWS EB
get_eb_secret() {
    local env_name=$1
    local secret_name=$2

    aws elasticbeanstalk describe-configuration-settings \
        --application-name $EB_APP \
        --environment-name $env_name \
        --region $AWS_REGION \
        --query "ConfigurationSettings[0].OptionSettings[?OptionName=='$secret_name'].Value" \
        --output text 2>/dev/null || echo ""
}

# Function to set GitHub environment secret
set_gh_secret() {
    local env=$1
    local name=$2
    local value=$3

    if [ -z "$value" ]; then
        echo -e "${YELLOW}  ⚠️  $name - no value found, skipping${NC}"
        return
    fi

    echo "$value" | gh secret set "$name" --env "$env" --repo "$REPO" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ $name${NC}"
    else
        echo -e "${RED}  ✗ $name - failed${NC}"
    fi
}

# Configure Staging Environment
echo -e "${BLUE}Configuring staging environment...${NC}"

STAGING_DATABASE_URL=$(get_eb_secret "$EB_STAGING" "DATABASE_URL")
STAGING_SESSION_SECRET=$(get_eb_secret "$EB_STAGING" "SESSION_SECRET")
STAGING_OPENAI_KEY=$(get_eb_secret "$EB_STAGING" "OPENAI_API_KEY")

set_gh_secret "staging" "DATABASE_URL" "$STAGING_DATABASE_URL"
set_gh_secret "staging" "SESSION_SECRET" "$STAGING_SESSION_SECRET"
set_gh_secret "staging" "OPENAI_API_KEY" "$STAGING_OPENAI_KEY"
set_gh_secret "staging" "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
set_gh_secret "staging" "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
set_gh_secret "staging" "AWS_ACCOUNT_ID" "$AWS_ACCOUNT_ID"

echo ""

# Configure Production Environment
echo -e "${BLUE}Configuring production environment...${NC}"

PROD_DATABASE_URL=$(get_eb_secret "$EB_PRODUCTION" "DATABASE_URL")
PROD_SESSION_SECRET=$(get_eb_secret "$EB_PRODUCTION" "SESSION_SECRET")
PROD_OPENAI_KEY=$(get_eb_secret "$EB_PRODUCTION" "OPENAI_API_KEY")

set_gh_secret "production" "DATABASE_URL" "$PROD_DATABASE_URL"
set_gh_secret "production" "SESSION_SECRET" "$PROD_SESSION_SECRET"
set_gh_secret "production" "OPENAI_API_KEY" "$PROD_OPENAI_KEY"
set_gh_secret "production" "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
set_gh_secret "production" "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
set_gh_secret "production" "AWS_ACCOUNT_ID" "$AWS_ACCOUNT_ID"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Configuration Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure production protection rules:"
echo "   https://github.com/$REPO/settings/environments/Production"
echo ""
echo "2. Add required reviewers for production deployments"
echo ""
echo "3. Test the workflow by pushing to main branch"
echo ""
