#!/bin/bash
# Monitor Phase 1 Database Migration Deployment
# Usage: ./monitor-deployment.sh [PR_NUMBER]

set -e

PR_NUMBER=${1:-""}
STAGING_URL="http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"

echo "=================================================="
echo "Phase 1 Migration Deployment Monitor"
echo "=================================================="
echo ""

if [ -z "$PR_NUMBER" ]; then
    echo "⚠️  No PR number provided. Getting latest PR..."
    echo ""
    # Try to get PR number from git (if gh CLI works)
    if command -v gh &> /dev/null; then
        PR_NUMBER=$(gh pr list --head redesign/mvp-founder-design --json number --jq '.[0].number' 2>/dev/null || echo "")
    fi

    if [ -z "$PR_NUMBER" ]; then
        echo "❌ Could not determine PR number automatically."
        echo "   Please provide PR number as argument:"
        echo "   ./monitor-deployment.sh <PR_NUMBER>"
        exit 1
    fi
fi

echo "📋 PR Number: #$PR_NUMBER"
echo "🌐 Staging URL: $STAGING_URL"
echo ""

# Function to check GitHub Actions status
check_gh_actions() {
    echo "=================================================="
    echo "1. GitHub Actions Workflow Status"
    echo "=================================================="

    if ! command -v gh &> /dev/null; then
        echo "⚠️  GitHub CLI not available. Skipping workflow check."
        echo "   Check manually at:"
        echo "   https://github.com/jevinbizelev8/P3-Interview-Academy/actions"
        return
    fi

    echo "Fetching latest workflow runs..."
    gh run list --workflow=deploy-eb-staging.yml --limit 5 || {
        echo "⚠️  Could not fetch workflow runs (authentication issue)"
        echo "   Check manually at:"
        echo "   https://github.com/jevinbizelev8/P3-Interview-Academy/actions"
        return
    }

    echo ""
    echo "To watch live:"
    echo "  gh run watch \$(gh run list --workflow=deploy-eb-staging.yml --json databaseId --jq '.[0].databaseId')"
    echo ""
}

# Function to check staging environment health
check_staging_health() {
    echo "=================================================="
    echo "2. Staging Environment Health"
    echo "=================================================="

    echo "Checking basic health endpoint..."
    if curl -s -f -o /dev/null -w "HTTP %{http_code} | Response time: %{time_total}s\n" \
        "$STAGING_URL/api/health/simple"; then
        echo "✅ Basic health check passed"
    else
        echo "❌ Basic health check failed"
        return 1
    fi

    echo ""
    echo "Checking detailed health endpoint..."
    HEALTH_RESPONSE=$(curl -s "$STAGING_URL/api/health" || echo '{"error": "failed"}')
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"

    echo ""
}

# Function to check AWS EB status
check_aws_status() {
    echo "=================================================="
    echo "3. AWS Elastic Beanstalk Status"
    echo "=================================================="

    if ! command -v aws &> /dev/null; then
        echo "⚠️  AWS CLI not available. Skipping EB check."
        return
    fi

    echo "Fetching environment status..."
    aws elasticbeanstalk describe-environments \
        --environment-names p3-interview-academy-staging \
        --query 'Environments[0].[EnvironmentName,Status,Health,HealthStatus]' \
        --output table 2>/dev/null || {
        echo "⚠️  Could not fetch EB status (authentication issue)"
        return
    }

    echo ""
    echo "Recent events (last 10):"
    aws elasticbeanstalk describe-events \
        --environment-name p3-interview-academy-staging \
        --max-items 10 \
        --query 'Events[*].[EventDate,Severity,Message]' \
        --output table 2>/dev/null || {
        echo "⚠️  Could not fetch EB events"
    }

    echo ""
}

# Function to check database migration
check_migration() {
    echo "=================================================="
    echo "4. Database Migration Verification"
    echo "=================================================="

    echo "⚠️  Migration verification requires database access."
    echo "   Run this after deployment completes:"
    echo ""
    echo "   npm run db:migrate:verify"
    echo ""
    echo "Expected output:"
    echo "  ✅ 15/15 tables verified"
    echo "  ✅ 6/6 user columns verified"
    echo "  ✅ Indexes created"
    echo ""
}

# Function to check API endpoints
check_api_endpoints() {
    echo "=================================================="
    echo "5. API Endpoint Quick Test"
    echo "=================================================="

    # Note: Most endpoints require authentication
    echo "Testing public endpoints..."

    echo -n "  /api/health/simple ... "
    if curl -s -f "$STAGING_URL/api/health/simple" > /dev/null; then
        echo "✅"
    else
        echo "❌"
    fi

    echo -n "  /api/health ... "
    if curl -s -f "$STAGING_URL/api/health" > /dev/null; then
        echo "✅"
    else
        echo "❌"
    fi

    echo ""
    echo "⚠️  Most new endpoints require authentication."
    echo "   Full API testing requires:"
    echo "   - User authentication"
    echo "   - Seed data loaded"
    echo ""
}

# Function to show next steps
show_next_steps() {
    echo "=================================================="
    echo "Next Steps"
    echo "=================================================="
    echo ""
    echo "1. Wait for GitHub Actions to complete (~30-45 min)"
    echo "   - Check PR for status updates"
    echo "   - Watch for staging URL comment"
    echo ""
    echo "2. Verify migration succeeded:"
    echo "   npm run db:migrate:verify"
    echo ""
    echo "3. Seed initial data:"
    echo "   npm run db:seed-redesign"
    echo ""
    echo "4. Run full smoke tests:"
    echo "   npm run smoke:staging"
    echo ""
    echo "5. Test new API endpoints (see DEPLOYMENT_STATUS.md)"
    echo ""
    echo "6. Check CloudWatch logs:"
    echo "   aws logs tail /aws/elasticbeanstalk/p3-interview-academy-staging/var/log/nodejs/nodejs.log --since 30m"
    echo ""
    echo "7. Update documentation:"
    echo "   - docs/ops-log/2025-10.md"
    echo "   - docs/redesign/MASTER_PLAN.md"
    echo ""
}

# Main execution
main() {
    check_gh_actions
    check_staging_health
    check_aws_status
    check_migration
    check_api_endpoints
    show_next_steps

    echo "=================================================="
    echo "Monitoring complete!"
    echo "=================================================="
    echo ""
    echo "For continuous monitoring, run this script periodically:"
    echo "  watch -n 60 ./monitor-deployment.sh $PR_NUMBER"
    echo ""
}

# Run main function
main
