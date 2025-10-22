#!/bin/bash

# P³ Interview Academy - Environment Configuration Fix Script
# This script addresses the issues found in the environment audit
# Generated: 2025-10-22

set -e

REGION="ap-southeast-1"
APP_NAME="p3-interview-academy"
PROD_ENV="p3-interview-academy-prod-v2"
STAGING_ENV="p3-interview-academy-staging"

echo "=========================================="
echo "P³ Interview Academy - Environment Fixes"
echo "=========================================="
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "ERROR: AWS credentials not configured"
    echo "Please run: aws configure"
    exit 1
fi

echo "AWS Account: $(aws sts get-caller-identity --query Account --output text)"
echo "Region: $REGION"
echo ""

# Function to update environment
update_env() {
    local env_name=$1
    shift
    local options=("$@")

    echo "Updating $env_name..."
    aws elasticbeanstalk update-environment \
        --region "$REGION" \
        --environment-name "$env_name" \
        --option-settings "${options[@]}"

    echo "✅ Update initiated for $env_name"
}

# Menu
echo "Select fixes to apply:"
echo "1. Fix security issues (production)"
echo "2. Add missing variables (staging)"
echo "3. Fix both production and staging"
echo "4. Remove TLS bypass (production only)"
echo "5. Restrict WebSocket CORS (both environments)"
echo "6. Exit"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "🔒 Fixing Production Security Issues..."
        echo "This will:"
        echo "  - Remove NODE_TLS_REJECT_UNAUTHORIZED (security risk)"
        echo "  - Restrict WS_ALLOWED_ORIGINS to known domains"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled"
            exit 0
        fi

        # Remove TLS bypass
        aws elasticbeanstalk update-environment \
            --region "$REGION" \
            --environment-name "$PROD_ENV" \
            --options-to-remove \
                Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_TLS_REJECT_UNAUTHORIZED

        echo "✅ Removed NODE_TLS_REJECT_UNAUTHORIZED"

        # Restrict CORS
        update_env "$PROD_ENV" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=WS_ALLOWED_ORIGINS,Value=https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai"

        echo "✅ Production security fixes applied"
        ;;

    2)
        echo ""
        echo "⚙️  Adding Missing Variables to Staging..."
        echo "This will add:"
        echo "  - SEALION_API_KEY=disabled"
        echo "  - SMTP_SECURE=false"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled"
            exit 0
        fi

        update_env "$STAGING_ENV" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=SEALION_API_KEY,Value=disabled" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=SMTP_SECURE,Value=false"

        echo "✅ Staging variables added"
        ;;

    3)
        echo ""
        echo "🔧 Applying All Fixes..."
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled"
            exit 0
        fi

        # Production fixes
        echo "Fixing production..."
        aws elasticbeanstalk update-environment \
            --region "$REGION" \
            --environment-name "$PROD_ENV" \
            --options-to-remove \
                Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_TLS_REJECT_UNAUTHORIZED

        update_env "$PROD_ENV" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=WS_ALLOWED_ORIGINS,Value=https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai"

        # Staging fixes
        echo "Fixing staging..."
        update_env "$STAGING_ENV" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=SEALION_API_KEY,Value=disabled" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=SMTP_SECURE,Value=false" \
            "Namespace=aws:elasticbeanstalk:application:environment,OptionName=WS_ALLOWED_ORIGINS,Value=https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai,http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"

        echo "✅ All fixes applied"
        ;;

    4)
        echo ""
        echo "🔓 Removing TLS Bypass from Production..."
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled"
            exit 0
        fi

        aws elasticbeanstalk update-environment \
            --region "$REGION" \
            --environment-name "$PROD_ENV" \
            --options-to-remove \
                Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_TLS_REJECT_UNAUTHORIZED

        echo "✅ TLS bypass removed"
        ;;

    5)
        echo ""
        echo "🌐 Restricting WebSocket CORS..."
        echo ""
        read -p "Apply to production? (y/n): " prod_confirm
        read -p "Apply to staging? (y/n): " staging_confirm

        if [ "$prod_confirm" = "y" ]; then
            update_env "$PROD_ENV" \
                "Namespace=aws:elasticbeanstalk:application:environment,OptionName=WS_ALLOWED_ORIGINS,Value=https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai"
            echo "✅ Production CORS restricted"
        fi

        if [ "$staging_confirm" = "y" ]; then
            update_env "$STAGING_ENV" \
                "Namespace=aws:elasticbeanstalk:application:environment,OptionName=WS_ALLOWED_ORIGINS,Value=https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai,http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"
            echo "✅ Staging CORS restricted"
        fi
        ;;

    6)
        echo "Exiting..."
        exit 0
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Updates Complete!"
echo "=========================================="
echo ""
echo "The environments will now update (this may take 5-10 minutes)."
echo "Monitor progress with:"
echo "  aws elasticbeanstalk describe-environments --environment-names $PROD_ENV $STAGING_ENV"
echo ""
echo "Or use the status checker:"
echo "  ./deployment-scripts/check-environment-status.sh"
echo ""
