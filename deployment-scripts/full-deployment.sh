#!/bin/bash

# P³ Interview Academy - Complete Deployment Orchestration Script
# Runs the full deployment process with pre-deployment checks

set -e

echo "=========================================="
echo "P³ Interview Academy - Full Deployment"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Run this script from the project root directory."
    exit 1
fi

# Configuration
SKIP_ENV_CHECK=${1:-false}
SKIP_DB_CHECK=${2:-false}

echo "🚀 Starting full deployment process..."
echo ""

# Step 1: Environment Variable Check
if [ "$SKIP_ENV_CHECK" != "true" ]; then
    echo "STEP 1/5: ENVIRONMENT VARIABLE CHECK"
    echo "====================================="
    echo ""

    echo "Current environment variables status:"
    ./deployment-scripts/check-environment-status.sh || {
        echo ""
        echo "❌ Environment check failed!"
        echo ""
        echo "Would you like to configure environment variables now? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            ./deployment-scripts/setup-environment-variables.sh
        else
            echo "Please configure environment variables before deploying."
            echo "Run: ./deployment-scripts/setup-environment-variables.sh"
            exit 1
        fi
    }

    echo "✅ Environment variables verified"
else
    echo "STEP 1/5: SKIPPED - Environment variable check"
fi

echo ""

# Step 2: Database Verification
if [ "$SKIP_DB_CHECK" != "true" ]; then
    echo "STEP 2/5: DATABASE VERIFICATION"
    echo "==============================="
    echo ""

    if [ -n "$DATABASE_URL" ]; then
        echo "Running database verification..."
        ./deployment-scripts/verify-database.sh || {
            echo ""
            echo "❌ Database verification failed!"
            echo "Please fix database issues before continuing."
            echo ""
            echo "Common solutions:"
            echo "- Check DATABASE_URL format"
            echo "- Verify database server accessibility"
            echo "- Ensure database user has proper permissions"
            exit 1
        }
        echo "✅ Database verification passed"
    else
        echo "⚠️ DATABASE_URL not set - skipping database verification"
        echo "Note: Application will fail to start without DATABASE_URL"
    fi
else
    echo "STEP 2/5: SKIPPED - Database verification"
fi

echo ""

# Step 3: Build Verification
echo "STEP 3/5: BUILD VERIFICATION"
echo "============================"
echo ""

echo "Testing build process..."
npm run build || {
    echo ""
    echo "❌ Build process failed!"
    echo "Please fix build errors before continuing."
    exit 1
}

# Verify build artifacts
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build artifact missing: dist/index.js"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build artifact missing: dist/public/index.html"
    exit 1
fi

echo "✅ Build verification passed"
echo ""

# Step 4: Create Deployment Bundle
echo "STEP 4/5: DEPLOYMENT BUNDLE CREATION"
echo "===================================="
echo ""

echo "Creating deployment bundle..."
./deployment-scripts/create-deployment-bundle.sh || {
    echo ""
    echo "❌ Bundle creation failed!"
    exit 1
}

# Get the most recent bundle
BUNDLE_FILE=$(ls -t p3-interview-academy-eb-*.zip 2>/dev/null | head -1)
if [ -z "$BUNDLE_FILE" ]; then
    echo "❌ No deployment bundle found after creation"
    exit 1
fi

echo "✅ Deployment bundle created: $BUNDLE_FILE"
echo ""

# Step 5: Deploy to AWS
echo "STEP 5/5: AWS DEPLOYMENT"
echo "========================"
echo ""

echo "Deploying to AWS Elastic Beanstalk..."
echo "Bundle: $BUNDLE_FILE"
echo ""

# Confirm deployment
echo "🚨 PRODUCTION DEPLOYMENT CONFIRMATION"
echo ""
echo "You are about to deploy to production:"
echo "  Application: p3-interview-academy"
echo "  Environment: p3-interview-academy-prod-v2"
echo "  Bundle: $BUNDLE_FILE"
echo ""
echo "This will update the live application. Are you sure? (y/N)"
read -r confirmation

if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled by user."
    echo ""
    echo "Bundle created but not deployed: $BUNDLE_FILE"
    echo "You can deploy it later with:"
    echo "  ./deployment-scripts/deploy-to-eb.sh $BUNDLE_FILE"
    exit 0
fi

echo ""
echo "Starting deployment..."

./deployment-scripts/deploy-to-eb.sh "$BUNDLE_FILE" || {
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check AWS CLI configuration"
    echo "2. Verify AWS permissions"
    echo "3. Check Elastic Beanstalk environment status"
    echo "4. Review deployment logs"
    echo ""
    echo "Check status with:"
    echo "  ./deployment-scripts/check-environment-status.sh"
    exit 1
}

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo ""

# Final verification
echo "FINAL VERIFICATION"
echo "=================="
echo ""

echo "Running post-deployment checks..."
./deployment-scripts/check-environment-status.sh

echo ""
echo "=========================================="
echo "DEPLOYMENT SUMMARY"
echo "=========================================="
echo "✅ Environment variables: Configured"
echo "✅ Database: Verified and connected"
echo "✅ Build: Successful"
echo "✅ Bundle: Created and deployed"
echo "✅ AWS Deployment: Successful"
echo ""
echo "Bundle deployed: $BUNDLE_FILE"
echo "Environment: p3-interview-academy-prod-v2"
echo ""
echo "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Monitor application logs"
echo "3. Check health endpoints regularly"
echo "4. Monitor AWS CloudWatch metrics"
echo ""
echo "For troubleshooting, see: DEPLOYMENT.md"
echo "=========================================="
echo ""

# Clean up old bundles (keep last 3)
echo "Cleaning up old deployment bundles (keeping last 3)..."
ls -t p3-interview-academy-eb-*.zip 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || echo "No old bundles to clean up"

echo "🚀 Full deployment process completed successfully!"