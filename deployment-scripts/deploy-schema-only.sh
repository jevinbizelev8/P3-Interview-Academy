#!/bin/bash
# Deploy schema to production AWS EB environment

echo "=== Schema-Only Deployment to AWS EB ==="

# Create a minimal deployment bundle with just the schema changes
BUNDLE_NAME="schema-deploy-$(date +%Y%m%d%H%M%S)"
TEMP_DIR="/tmp/${BUNDLE_NAME}"

echo "Creating deployment bundle in ${TEMP_DIR}..."
mkdir -p "${TEMP_DIR}"

# Copy only essential files for schema deployment
cp package.json "${TEMP_DIR}/"
cp drizzle.config.ts "${TEMP_DIR}/"
cp -r shared/ "${TEMP_DIR}/"
cp -r server/test-endpoints.ts "${TEMP_DIR}/server/"

# Create a simple deployment script
cat > "${TEMP_DIR}/deploy-schema.js" << 'EOF'
const { execSync } = require('child_process');

console.log('Starting schema deployment...');
try {
  const output = execSync('npm run db:push', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('Schema deployment completed successfully!');
} catch (error) {
  console.error('Schema deployment failed:', error.message);
  process.exit(1);
}
EOF

# Create deployment package
cd "${TEMP_DIR}"
zip -r "../${BUNDLE_NAME}.zip" .

echo "Deployment bundle created: /tmp/${BUNDLE_NAME}.zip"

# Upload to S3 and deploy (would need AWS CLI configured)
echo "To deploy manually:"
echo "1. Upload /tmp/${BUNDLE_NAME}.zip to S3"
echo "2. Create EB application version"
echo "3. Deploy to environment"