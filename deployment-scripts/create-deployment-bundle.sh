#!/bin/bash

# P³ Interview Academy - Deployment Bundle Creation Script
# Creates a clean, production-ready deployment bundle for AWS Elastic Beanstalk

set -e

# Configuration
BUNDLE_NAME="p3-interview-academy-eb-$(date +%Y%m%d-%H%M%S)"
TEMP_DIR="temp-deployment"
BUNDLE_FILE="${BUNDLE_NAME}.zip"

echo "=========================================="
echo "P³ Interview Academy - Bundle Creation"
echo "=========================================="
echo "Bundle: $BUNDLE_FILE"
echo "Working directory: $(pwd)"
echo ""

# Check prerequisites
echo "1. CHECKING PREREQUISITES"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Run this script from the project root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "✓ Prerequisites checked"
echo ""

# Clean and build
echo "2. BUILDING APPLICATION"
echo "======================="

echo "Cleaning previous build..."
rm -rf dist/ || echo "No previous dist/ to clean"

echo "Running build process..."
npm run build

# Verify build artifacts
if [ ! -f "dist/index.js" ]; then
    echo "ERROR: Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -d "dist/public" ] || [ ! -f "dist/public/index.html" ]; then
    echo "ERROR: Frontend build failed - dist/public/index.html not found"
    exit 1
fi

echo "✓ Build completed successfully"
echo ""

# Create deployment bundle
echo "3. CREATING DEPLOYMENT BUNDLE"
echo "=============================="

echo "Preparing temporary directory..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "Copying production files..."

# Copy built artifacts
cp -r dist/ "$TEMP_DIR/"
echo "✓ Built artifacts copied"

# Copy package files (production dependencies info)
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || echo "No package-lock.json found"
echo "✓ Package files copied"

# Copy configuration files
cp -r .ebextensions/ "$TEMP_DIR/" 2>/dev/null || echo "No .ebextensions directory found"
echo "✓ EB Extensions copied"

# Copy shared directory (types and schemas)
cp -r shared/ "$TEMP_DIR/"
echo "✓ Shared directory copied"

# Copy environment example (for reference)
cp .env.example "$TEMP_DIR/" 2>/dev/null || echo "No .env.example found"

# Create production node_modules (only production dependencies)
echo "Installing production dependencies in bundle..."
cd "$TEMP_DIR"
npm ci --omit=dev --silent
echo "✓ Production dependencies installed"

cd ..

echo "Bundle contents:"
find "$TEMP_DIR" -type f -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "package*" | head -20
if [ $(find "$TEMP_DIR" -type f | wc -l) -gt 20 ]; then
    echo "... and $(( $(find "$TEMP_DIR" -type f | wc -l) - 20 )) more files"
fi

echo ""

# Create zip bundle
echo "4. CREATING ZIP BUNDLE"
echo "======================"

echo "Creating deployment bundle: $BUNDLE_FILE"
cd "$TEMP_DIR"
zip -r "../$BUNDLE_FILE" . -q
cd ..

# Get bundle size
if command -v ls &> /dev/null; then
    bundle_size=$(ls -lh "$BUNDLE_FILE" | awk '{print $5}')
    echo "✓ Bundle created: $bundle_size"
else
    echo "✓ Bundle created: $BUNDLE_FILE"
fi

# Clean up temporary directory
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo ""

# Verify bundle
echo "5. BUNDLE VERIFICATION"
echo "======================"

if [ ! -f "$BUNDLE_FILE" ]; then
    echo "ERROR: Bundle file was not created"
    exit 1
fi

echo "Verifying bundle contents..."
zip -t "$BUNDLE_FILE" > /dev/null && echo "✓ Bundle ZIP is valid" || (echo "ERROR: Bundle ZIP is corrupted" && exit 1)

echo "Bundle contents preview:"
unzip -l "$BUNDLE_FILE" | head -20
echo ""

# Show deployment instructions
echo "6. DEPLOYMENT READY"
echo "=================="
echo ""
echo "✅ Deployment bundle created successfully: $BUNDLE_FILE"
echo ""
echo "Next steps:"
echo "1. Upload to AWS S3 (EB will use this):"
echo "   aws s3 cp $BUNDLE_FILE s3://elasticbeanstalk-ap-southeast-1-YOUR-ACCOUNT-ID/p3-interview-academy/"
echo ""
echo "2. Create application version:"
echo '   aws elasticbeanstalk create-application-version \'
echo '     --application-name p3-interview-academy \'
echo "     --version-label $BUNDLE_NAME \\"
echo '     --source-bundle S3Bucket=elasticbeanstalk-ap-southeast-1-YOUR-ACCOUNT-ID,S3Key=p3-interview-academy/'"$BUNDLE_FILE"
echo ""
echo "3. Deploy to environment:"
echo '   aws elasticbeanstalk update-environment \'
echo '     --environment-name p3-interview-academy-prod-v2 \'
echo "     --version-label $BUNDLE_NAME"
echo ""
echo "Or use the deploy script:"
echo "   ./deployment-scripts/deploy-to-eb.sh $BUNDLE_FILE"
echo ""

# Check if environment variables are set
echo "⚠️  IMPORTANT: Ensure environment variables are configured before deploying:"
echo "   ./deployment-scripts/check-environment-status.sh"
echo ""

echo "Bundle creation completed successfully!"
echo "Bundle: $BUNDLE_FILE"