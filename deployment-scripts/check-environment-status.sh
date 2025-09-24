#!/bin/bash

# P³ Interview Academy - Environment Status Checker
# Quick script to check Elastic Beanstalk environment status and configuration

set -e

# Configuration
APPLICATION_NAME="p3-interview-academy"
ENVIRONMENT_NAME="p3-interview-academy-prod-v2"
REGION="ap-southeast-1"

echo "=========================================="
echo "P³ Interview Academy - Status Check"
echo "=========================================="
echo "Application: $APPLICATION_NAME"
echo "Environment: $ENVIRONMENT_NAME"
echo "Region: $REGION"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI not found"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "ERROR: AWS credentials not configured"
    exit 1
fi

echo "1. ENVIRONMENT STATUS"
echo "===================="

# Get environment details
env_info=$(aws elasticbeanstalk describe-environments \
    --region "$REGION" \
    --environment-names "$ENVIRONMENT_NAME" \
    --query 'Environments[0].[Status,Health,EnvironmentId,CNAME]' \
    --output text)

if [ -z "$env_info" ] || [ "$env_info" = "None" ]; then
    echo "ERROR: Environment '$ENVIRONMENT_NAME' not found"
    exit 1
fi

echo "$env_info" | while IFS=$'\t' read -r status health env_id cname; do
    echo "Status: $status"
    echo "Health: $health"
    echo "Environment ID: $env_id"
    echo "URL: http://$cname"
done

echo ""
echo "2. CRITICAL ENVIRONMENT VARIABLES"
echo "=================================="

# Check critical environment variables
critical_vars=("DATABASE_URL" "SESSION_SECRET" "NODE_ENV" "WS_ALLOWED_ORIGINS")

for var in "${critical_vars[@]}"; do
    value=$(aws elasticbeanstalk describe-configuration-settings \
        --region "$REGION" \
        --application-name "$APPLICATION_NAME" \
        --environment-name "$ENVIRONMENT_NAME" \
        --query "ConfigurationSettings[0].OptionSettings[?OptionName=='$var'].Value" \
        --output text)

    if [ "$value" = "None" ] || [ -z "$value" ]; then
        echo "❌ $var: NOT SET"
    else
        if [ "$var" = "NODE_ENV" ]; then
            echo "✅ $var: $value"
        else
            echo "✅ $var: ****** (configured)"
        fi
    fi
done

echo ""
echo "3. OPTIONAL API KEYS"
echo "==================="

optional_vars=("OPENAI_API_KEY" "SEALION_API_KEY" "ANTHROPIC_API_KEY" "GOOGLE_API_KEY")

for var in "${optional_vars[@]}"; do
    value=$(aws elasticbeanstalk describe-configuration-settings \
        --region "$REGION" \
        --application-name "$APPLICATION_NAME" \
        --environment-name "$ENVIRONMENT_NAME" \
        --query "ConfigurationSettings[0].OptionSettings[?OptionName=='$var'].Value" \
        --output text)

    if [ "$value" = "None" ] || [ -z "$value" ]; then
        echo "⚠️  $var: not configured"
    else
        echo "✅ $var: ****** (configured)"
    fi
done

echo ""
echo "4. RECENT EVENTS"
echo "================"

aws elasticbeanstalk describe-events \
    --region "$REGION" \
    --environment-name "$ENVIRONMENT_NAME" \
    --max-items 10 \
    --query 'Events[].[EventDate,Severity,Message]' \
    --output table

echo ""
echo "5. APPLICATION VERSIONS"
echo "======================"

aws elasticbeanstalk describe-application-versions \
    --region "$REGION" \
    --application-name "$APPLICATION_NAME" \
    --query 'ApplicationVersions[0:5].[VersionLabel,DateCreated,Status]' \
    --output table

echo ""
echo "6. HEALTH CHECK"
echo "==============="

# Get the CNAME for health check
cname=$(aws elasticbeanstalk describe-environments \
    --region "$REGION" \
    --environment-names "$ENVIRONMENT_NAME" \
    --query 'Environments[0].CNAME' \
    --output text)

if [ "$cname" != "None" ] && [ -n "$cname" ]; then
    echo "Testing health endpoint: http://$cname/api/health"

    if command -v curl &> /dev/null; then
        echo "Response:"
        curl -s -w "\nHTTP Status: %{http_code}\n" "http://$cname/api/health" || echo "Health check failed"
    else
        echo "curl not available - please test manually: http://$cname/api/health"
    fi
else
    echo "CNAME not available - environment may be deploying"
fi

echo ""
echo "Status check completed!"
echo ""
echo "If you need to:"
echo "- Set missing environment variables: run './deployment-scripts/setup-environment-variables.sh'"
echo "- Deploy new version: run './deployment-scripts/deploy-to-eb.sh'"
echo "- Check logs: aws elasticbeanstalk retrieve-environment-info"