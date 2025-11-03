#!/bin/bash
# deploy-cmd.sh - Deploy with approval gate
# Usage: deploy-cmd.sh <environment>

set -e

ENV="$1"

if [[ -z "$ENV" ]]; then
  echo "❌ Usage: deploy-cmd.sh <environment>"
  echo ""
  echo "Valid environments: staging, production"
  exit 1
fi

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "❌ Invalid environment: $ENV"
  echo ""
  echo "Valid environments: staging, production"
  exit 1
fi

# Load environment
if [[ -f /home/runner/workspace/.env ]]; then
  source /home/runner/workspace/.env
fi

# Change to project root
cd /home/runner/workspace

echo "🚀 Deploy to $ENV"
echo ""

# Generate approval token
TOKEN=$(openssl rand -hex 8)

echo "Requesting approval..."
echo ""

# Request approval using await_reply.sh
if /home/runner/workspace/scripts/telegram/core/await_reply.sh \
  "🚨 **DEPLOYMENT APPROVAL REQUIRED**

**Environment**: \`$ENV\`
**Timestamp**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

**This will deploy the current code to $ENV.**

Reply within 15 minutes: \`approve $TOKEN\`" \
  900 \
  "$TOKEN"; then

  echo "✅ Deployment approved"
  echo ""

  # Run deployment
  if [[ "$ENV" == "staging" ]]; then
    echo "Deploying to staging..."
    # Add staging deployment command here
    # Example: ./deployment-scripts/deploy-to-eb.sh staging
    echo "✅ Staging deployment would run here"
  elif [[ "$ENV" == "production" ]]; then
    echo "Deploying to production..."
    # Add production deployment command here
    # Example: ./deployment-scripts/deploy-to-eb.sh production
    echo "✅ Production deployment would run here"
  fi

  echo ""
  echo "✅ Deployment complete"
else
  echo "❌ Deployment rejected or timed out"
  exit 1
fi
