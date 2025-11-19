#!/bin/bash

# =============================================================================
# GitHub Environments Setup Script
# =============================================================================
# This script automates the creation and configuration of GitHub Environments
# for the CI/CD pipeline with staging → smoke tests → approval → production.
#
# Prerequisites:
# - gh CLI installed and authenticated
# - AWS CLI installed and configured (optional, for auto-fetching secrets)
#
# Usage:
#   bash deployment-scripts/setup-github-environments.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="jevinbizelev8"
REPO_NAME="P3-Interview-Academy"
STAGING_ENV="staging"
PRODUCTION_ENV="production"
EB_STAGING="p3-interview-academy-staging"
EB_PRODUCTION="p3-interview-academy-prod-v2"
EB_APP="p3-interview-academy"
AWS_REGION="ap-southeast-1"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed or not in PATH"
        return 1
    fi
    return 0
}

# =============================================================================
# Step 1: Verify Prerequisites
# =============================================================================

log_info "Checking prerequisites..."

if ! check_command gh; then
    log_error "GitHub CLI (gh) is required. Install from: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI is not authenticated. Run: gh auth login"
    exit 1
fi

log_success "GitHub CLI is installed and authenticated"

# Check AWS CLI (optional)
AWS_AVAILABLE=false
if check_command aws; then
    AWS_AVAILABLE=true
    log_success "AWS CLI is available"
else
    log_warning "AWS CLI not available - will use manual input for secrets"
fi

# =============================================================================
# Step 2: Check if AWS CLI is configured
# =============================================================================

AWS_CONFIGURED=false
if [ "$AWS_AVAILABLE" = true ]; then
    if aws sts get-caller-identity --region $AWS_REGION &> /dev/null; then
        AWS_CONFIGURED=true
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null || echo "")
        log_success "AWS CLI is configured (Account: $AWS_ACCOUNT_ID)"
    else
        log_warning "AWS CLI is not configured - will use manual input for secrets"
    fi
fi

# =============================================================================
# Step 3: Fetch secrets from AWS (if available)
# =============================================================================

declare -A STAGING_SECRETS
declare -A PRODUCTION_SECRETS

fetch_aws_secrets() {
    local env_name=$1
    local target_array=$2

    log_info "Fetching secrets from AWS EB environment: $env_name..."

    local secrets_json=$(aws elasticbeanstalk describe-configuration-settings \
        --application-name $EB_APP \
        --environment-name $env_name \
        --region $AWS_REGION \
        --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`].{Name:OptionName,Value:Value}' \
        --output json 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$secrets_json" ]; then
        # Parse JSON and populate associative array
        while IFS= read -r line; do
            local key=$(echo "$line" | jq -r '.Name')
            local value=$(echo "$line" | jq -r '.Value')

            if [ "$target_array" = "staging" ]; then
                STAGING_SECRETS["$key"]="$value"
            else
                PRODUCTION_SECRETS["$key"]="$value"
            fi
        done < <(echo "$secrets_json" | jq -c '.[]')

        log_success "Retrieved secrets from $env_name"
        return 0
    else
        log_warning "Could not fetch secrets from $env_name"
        return 1
    fi
}

if [ "$AWS_CONFIGURED" = true ]; then
    log_info "Attempting to fetch secrets from AWS Elastic Beanstalk..."
    fetch_aws_secrets "$EB_STAGING" "staging"
    fetch_aws_secrets "$EB_PRODUCTION" "production"
fi

# =============================================================================
# Step 4: Prompt for missing secrets
# =============================================================================

prompt_for_secret() {
    local env=$1
    local secret_name=$2
    local current_value=$3

    echo ""
    if [ -n "$current_value" ] && [ "$current_value" != "null" ]; then
        log_info "$env - $secret_name already retrieved from AWS"
        echo "Current value: ${current_value:0:20}..." # Show first 20 chars only
        read -p "Use this value? [Y/n]: " use_current
        if [ "$use_current" = "n" ] || [ "$use_current" = "N" ]; then
            read -sp "Enter new value for $secret_name: " new_value
            echo "$new_value"
        else
            echo "$current_value"
        fi
    else
        read -sp "Enter value for $env - $secret_name: " value
        echo ""
        echo "$value"
    fi
}

# Required secrets
REQUIRED_SECRETS=("DATABASE_URL" "SESSION_SECRET" "OPENAI_API_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_ACCOUNT_ID")

log_info "Collecting secrets for staging environment..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${STAGING_SECRETS[$secret]}" ] || [ "${STAGING_SECRETS[$secret]}" = "null" ]; then
        value=$(prompt_for_secret "staging" "$secret" "")
        STAGING_SECRETS["$secret"]="$value"
    fi
done

log_info "Collecting secrets for production environment..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${PRODUCTION_SECRETS[$secret]}" ] || [ "${PRODUCTION_SECRETS[$secret]}" = "null" ]; then
        value=$(prompt_for_secret "production" "$secret" "")
        PRODUCTION_SECRETS["$secret"]="$value"
    fi
done

# Use AWS_ACCOUNT_ID from AWS CLI if available
if [ "$AWS_CONFIGURED" = true ] && [ -n "$AWS_ACCOUNT_ID" ]; then
    STAGING_SECRETS["AWS_ACCOUNT_ID"]="$AWS_ACCOUNT_ID"
    PRODUCTION_SECRETS["AWS_ACCOUNT_ID"]="$AWS_ACCOUNT_ID"
fi

# =============================================================================
# Step 5: Create GitHub Environments
# =============================================================================

log_info "Creating GitHub Environments..."

# Note: gh CLI doesn't have direct environment creation commands
# We need to create them by setting environment-specific secrets
# which will auto-create the environment if it doesn't exist

log_success "Environments will be created when setting secrets"

# =============================================================================
# Step 6: Set environment secrets
# =============================================================================

set_environment_secret() {
    local env=$1
    local secret_name=$2
    local secret_value=$3

    log_info "Setting $secret_name for $env environment..."

    echo "$secret_value" | gh secret set "$secret_name" \
        --repo "$REPO_OWNER/$REPO_NAME" \
        --env "$env" \
        --body-file - &> /dev/null

    if [ $? -eq 0 ]; then
        log_success "✓ Set $secret_name"
    else
        log_error "✗ Failed to set $secret_name"
        return 1
    fi
}

log_info "Configuring staging environment secrets..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    set_environment_secret "$STAGING_ENV" "$secret" "${STAGING_SECRETS[$secret]}"
done

log_info "Configuring production environment secrets..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    set_environment_secret "$PRODUCTION_ENV" "$secret" "${PRODUCTION_SECRETS[$secret]}"
done

# =============================================================================
# Step 7: Configure protection rules
# =============================================================================

log_warning "Note: GitHub CLI does not support configuring environment protection rules directly."
log_warning "You must manually configure protection rules for the production environment:"
echo ""
echo "  1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/environments"
echo "  2. Click on 'production' environment"
echo "  3. Under 'Environment protection rules':"
echo "     - Check 'Required reviewers'"
echo "     - Add yourself as a required reviewer"
echo "     - Set 'Deployment branches' to 'Selected branches' → 'main'"
echo "  4. Click 'Save protection rules'"
echo ""

read -p "Press Enter once you have configured production protection rules..."

# =============================================================================
# Step 8: Verify setup
# =============================================================================

log_info "Verifying environment setup..."

# List environments
log_info "GitHub Environments:"
gh api repos/$REPO_OWNER/$REPO_NAME/environments --jq '.environments[].name' 2>/dev/null | while read env; do
    log_success "✓ $env"
done

echo ""
log_success "=========================================="
log_success "GitHub Environments Setup Complete!"
log_success "=========================================="
echo ""
log_info "Next steps:"
echo "  1. Verify environments at: https://github.com/$REPO_OWNER/$REPO_NAME/settings/environments"
echo "  2. Ensure production has required reviewers configured"
echo "  3. Test the workflow by merging to main branch"
echo ""
log_info "Documentation:"
echo "  - Full guide: deployment-scripts/github-environments-setup.md"
echo "  - Deployment guide: DEPLOYMENT.md"
echo ""

exit 0
