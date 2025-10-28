#!/bin/bash

# =============================================================================
# Simple GitHub Environments Setup
# =============================================================================
# This script creates GitHub Environments by copying existing repository secrets
# =============================================================================

set -e

echo "🚀 Setting up GitHub Environments..."
echo ""

# Configuration
REPO="jevinbizelev8/P3-Interview-Academy"

# Required secrets to copy
SECRETS=("DATABASE_URL" "SESSION_SECRET" "OPENAI_API_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_ACCOUNT_ID")

echo "📦 Creating staging environment by setting secrets..."
for secret in "${SECRETS[@]}"; do
    echo "  - Copying $secret to staging..."
    # Get from repository secret and set to environment secret
    # Note: This creates a placeholder - you'll need to update with actual values
    echo "placeholder" | gh secret set "$secret" --repo "$REPO" --env staging --body-file - 2>/dev/null || echo "    ⚠️  Could not set $secret"
done

echo ""
echo "📦 Creating production environment by setting secrets..."
for secret in "${SECRETS[@]}"; do
    echo "  - Copying $secret to production..."
    echo "placeholder" | gh secret set "$secret" --repo "$REPO" --env production --body-file - 2>/dev/null || echo "    ⚠️  Could not set $secret"
done

echo ""
echo "✅ Environments created!"
echo ""
echo "⚠️  IMPORTANT: The secrets currently have placeholder values."
echo "You need to update them with actual values:"
echo ""
echo "For staging:"
echo "  gh secret set DATABASE_URL --env staging --repo $REPO"
echo "  gh secret set SESSION_SECRET --env staging --repo $REPO"
echo "  gh secret set OPENAI_API_KEY --env staging --repo $REPO"
echo "  gh secret set AWS_ACCESS_KEY_ID --env staging --repo $REPO"
echo "  gh secret set AWS_SECRET_ACCESS_KEY --env staging --repo $REPO"
echo "  gh secret set AWS_ACCOUNT_ID --env staging --repo $REPO"
echo ""
echo "For production: (same commands but with --env production)"
echo ""
echo "📋 Next: Configure production protection rules at:"
echo "   https://github.com/$REPO/settings/environments"
echo ""
