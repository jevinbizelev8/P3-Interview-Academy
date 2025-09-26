#!/bin/bash

# P³ Interview Academy - AWS Elastic Beanstalk Environment Variables Setup
# This script sets up all required environment variables for production deployment

set -e

# Configuration
APPLICATION_NAME="p3-interview-academy"
ENVIRONMENT_NAME="p3-interview-academy-prod-v2"
REGION="ap-southeast-1"

echo "=========================================="
echo "P³ Interview Academy - Environment Setup"
echo "=========================================="
echo "Application: $APPLICATION_NAME"
echo "Environment: $ENVIRONMENT_NAME"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI not found. Please install and configure AWS CLI first."
    exit 1
fi

# Verify AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "ERROR: AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

echo "AWS credentials verified ✓"
echo ""

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    local description=$3

    echo "Setting $var_name..."

    if [ -z "$var_value" ]; then
        echo "WARNING: $var_name is empty. $description"
        echo "Skipping..."
        return 1
    fi

    aws elasticbeanstalk update-environment \
        --region "$REGION" \
        --environment-name "$ENVIRONMENT_NAME" \
        --option-settings \
        "Namespace=aws:elasticbeanstalk:application:environment,OptionName=$var_name,Value=$var_value" \
        > /dev/null

    echo "$var_name set successfully ✓"
    return 0
}

# ==========================================
# CRITICAL ENVIRONMENT VARIABLES
# ==========================================

echo "Setting up CRITICAL environment variables..."
echo ""

# Database URL
read -p "Enter DATABASE_URL (PostgreSQL connection string): " DATABASE_URL
set_env_var "DATABASE_URL" "$DATABASE_URL" "Required for PostgreSQL database connection"

# Session Secret
echo ""
echo "SESSION_SECRET should be a secure random string (32+ characters)."
read -s -p "Enter SESSION_SECRET (input hidden): " SESSION_SECRET
echo ""
set_env_var "SESSION_SECRET" "$SESSION_SECRET" "Required for secure session encryption"

# WebSocket CORS Origins
echo ""
echo "WS_ALLOWED_ORIGINS controls WebSocket CORS policy."
echo "Use '*' for development or comma-separated domains for production."
read -p "Enter WS_ALLOWED_ORIGINS (e.g., '*' or 'yourdomain.com,app.yourdomain.com'): " WS_ALLOWED_ORIGINS
set_env_var "WS_ALLOWED_ORIGINS" "$WS_ALLOWED_ORIGINS" "Required for WebSocket CORS configuration"

echo ""
echo "==========================================="
echo "OPTIONAL API KEYS"
echo "==========================================="
echo ""

# OpenAI API Key (should already be set)
echo "Checking if OPENAI_API_KEY is already set..."
existing_openai=$(aws elasticbeanstalk describe-configuration-settings \
    --region "$REGION" \
    --application-name "$APPLICATION_NAME" \
    --environment-name "$ENVIRONMENT_NAME" \
    --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`OPENAI_API_KEY`].Value' \
    --output text)

if [ "$existing_openai" != "None" ] && [ -n "$existing_openai" ]; then
    echo "OPENAI_API_KEY already configured ✓"
else
    read -s -p "Enter OPENAI_API_KEY (optional, press Enter to skip): " OPENAI_API_KEY
    echo ""
    if [ -n "$OPENAI_API_KEY" ]; then
        set_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY" "Optional: For OpenAI GPT integration"
    fi
fi

# SeaLion API Key
echo ""
read -s -p "Enter SEALION_API_KEY (optional, press Enter to skip): " SEALION_API_KEY
echo ""
if [ -n "$SEALION_API_KEY" ]; then
    set_env_var "SEALION_API_KEY" "$SEALION_API_KEY" "Optional: For SeaLion AI integration"
fi

# Anthropic API Key
echo ""
read -s -p "Enter ANTHROPIC_API_KEY (optional, press Enter to skip): " ANTHROPIC_API_KEY
echo ""
if [ -n "$ANTHROPIC_API_KEY" ]; then
    set_env_var "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "Optional: For Anthropic Claude integration"
fi


echo ""
echo "==========================================="
echo "ENVIRONMENT SETUP COMPLETED"
echo "==========================================="
echo ""

# Verify environment status
echo "Checking environment status..."
env_status=$(aws elasticbeanstalk describe-environments \
    --region "$REGION" \
    --environment-names "$ENVIRONMENT_NAME" \
    --query 'Environments[0].Status' \
    --output text)

echo "Environment Status: $env_status"

if [ "$env_status" = "Ready" ]; then
    echo "✓ Environment is ready"
else
    echo "⚠ Environment is in '$env_status' status. Wait for it to become 'Ready' before deploying."
fi

echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to create deployment artifacts"
echo "2. Run './deployment-scripts/create-deployment-bundle.sh' to create deployment bundle"
echo "3. Deploy the bundle using AWS CLI or EB CLI"
echo ""
echo "Environment variables setup completed!"

# Show current environment variables (without values for security)
echo ""
echo "Current environment variables configured:"
aws elasticbeanstalk describe-configuration-settings \
    --region "$REGION" \
    --application-name "$APPLICATION_NAME" \
    --environment-name "$ENVIRONMENT_NAME" \
    --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`].[OptionName]' \
    --output table
