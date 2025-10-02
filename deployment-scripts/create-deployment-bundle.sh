#!/bin/bash

# P³ Interview Academy - Deployment Bundle Creation Script
# Creates a clean, production-ready deployment bundle for AWS Elastic Beanstalk

set -e

select_python() {
    if command -v python &> /dev/null; then
        PYTHON_CMD=(python)
    elif command -v python3 &> /dev/null && [[ $(command -v python3) != *WindowsApps/python3 ]]; then
        PYTHON_CMD=(python3)
    elif command -v py &> /dev/null; then
        PYTHON_CMD=(py -3)
    else
        PYTHON_CMD=()
    fi
}

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

# Copy source code for EB to build
cp -r server/ "$TEMP_DIR/"
cp -r client/ "$TEMP_DIR/"
echo "✓ Source code copied"

# Copy built artifacts (frontend and compiled backend)
cp -r dist "$TEMP_DIR/" 2>/dev/null || echo "No dist directory found"
echo "Build artifacts copied"

# Copy package files (production dependencies info)
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || echo "No package-lock.json found"
cp .npmrc "$TEMP_DIR/" 2>/dev/null || echo "No .npmrc found"
echo "✓ Package files copied"

# Copy configuration files
cp -r .ebextensions/ "$TEMP_DIR/" 2>/dev/null || echo "No .ebextensions directory found"
cp tsconfig.json "$TEMP_DIR/" 2>/dev/null || echo "No tsconfig.json found"
cp vite.config.ts "$TEMP_DIR/" 2>/dev/null || echo "No vite.config.ts found"
cp tailwind.config.js "$TEMP_DIR/" 2>/dev/null || echo "No tailwind.config.js found"
cp postcss.config.js "$TEMP_DIR/" 2>/dev/null || echo "No postcss.config.js found"
echo "✓ Configuration files copied"

# Copy shared directory (types and schemas)
cp -r shared/ "$TEMP_DIR/"
echo "✓ Shared directory copied"

# Copy environment example (for reference)
cp .env.example "$TEMP_DIR/" 2>/dev/null || echo "No .env.example found"

# Skip npm install - let EB handle dependency installation
echo "Skipping npm install - EB will handle dependencies during deployment..."
echo "✓ Bundle prepared for EB dependency installation"

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
if command -v zip &> /dev/null; then
    (cd "$TEMP_DIR" && zip -r "../$BUNDLE_FILE" . -q)
else
    echo "zip command not found, using python to create archive"
    select_python
    if [ ${#PYTHON_CMD[@]} -eq 0 ]; then
        echo "Python interpreter not found; cannot create archive"
        exit 1
    fi
    TEMP_DIR="$TEMP_DIR" BUNDLE_FILE="$BUNDLE_FILE" "${PYTHON_CMD[@]}" - <<'PY'
import os
import zipfile

base = os.environ["TEMP_DIR"]
out_path = os.environ["BUNDLE_FILE"]
with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as archive:
    for root, _, files in os.walk(base):
        for name in files:
            full_path = os.path.join(root, name)
            rel_path = os.path.relpath(full_path, base)
            archive.write(full_path, rel_path)
PY
fi

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
if command -v zip &> /dev/null; then
    if zip -t "$BUNDLE_FILE" > /dev/null; then
        echo "✓ Bundle ZIP is valid"
    else
        echo "ERROR: Bundle ZIP is corrupted"
        exit 1
    fi
else
    select_python
    if [ ${#PYTHON_CMD[@]} -eq 0 ]; then
        echo "Python interpreter not found; cannot validate archive"
        exit 1
    fi
    BUNDLE_FILE="$BUNDLE_FILE" "${PYTHON_CMD[@]}" - <<'PY'
import os
import sys
import zipfile

bundle = os.environ["BUNDLE_FILE"]
try:
    with zipfile.ZipFile(bundle) as archive:
        bad_file = archive.testzip()
except zipfile.BadZipFile:
    sys.exit(1)
else:
    if bad_file is None:
        sys.exit(0)
    sys.exit(1)
PY
    if [ $? -eq 0 ]; then
        echo "✓ Bundle ZIP is valid"
    else
        echo "ERROR: Bundle ZIP is corrupted"
        exit 1
    fi
fi

echo "Bundle contents preview:"
if command -v unzip &> /dev/null; then
    unzip -l "$BUNDLE_FILE" | head -20
else
    select_python
    if [ ${#PYTHON_CMD[@]} -eq 0 ]; then
        echo "Python interpreter not found; cannot preview archive"
    else
        BUNDLE_FILE="$BUNDLE_FILE" "${PYTHON_CMD[@]}" - <<'PY'
import os
import zipfile

bundle = os.environ["BUNDLE_FILE"]
with zipfile.ZipFile(bundle) as archive:
    for idx, name in enumerate(archive.namelist()):
        print(name)
        if idx == 19:
            break
PY
    fi
fi
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


