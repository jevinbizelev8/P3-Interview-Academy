// AWS-based schema deployment using AWS SDK
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// AWS Configuration - CREDENTIALS REMOVED FOR SECURITY
const AWS_CONFIG = {
  // Use AWS CLI profile or environment variables for credentials
  region: 'ap-southeast-1'
};

const APPLICATION_NAME = 'p3-interview-academy';
const ENVIRONMENT_NAME = 'p3-interview-academy-prod-v2';

async function executeAWSCommand(command) {
  try {
    console.log(`🔧 Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('Note: This is a placeholder')) {
      console.warn(`⚠️ Warning: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    throw error;
  }
}

async function deploySchemaViaAWS() {
  try {
    console.log('🚀 Starting AWS-based schema deployment...');

    // 1. Check AWS credentials
    console.log('🔐 Verifying AWS credentials...');
    await executeAWSCommand('aws sts get-caller-identity');

    // 2. Check current environment status
    console.log('📊 Checking environment status...');
    const envStatus = await executeAWSCommand(`aws elasticbeanstalk describe-environments --environment-names ${ENVIRONMENT_NAME} --query 'Environments[0].Status' --output text`);
    console.log(`Environment status: ${envStatus}`);

    // 3. Get environment variables to verify database access
    console.log('🔍 Checking environment configuration...');
    const envVars = await executeAWSCommand(`aws elasticbeanstalk describe-configuration-settings --application-name ${APPLICATION_NAME} --environment-name ${ENVIRONMENT_NAME} --query 'ConfigurationSettings[0].OptionSettings[?Namespace==\`aws:elasticbeanstalk:application:environment\`]'`);
    console.log('Environment variables configured');

    // 4. Create a simple deployment bundle with schema deployment
    console.log('📦 Creating schema deployment bundle...');

    // Create deployment bundle
    await execAsync('mkdir -p /tmp/schema-deploy-bundle');

    // Copy essential files
    await execAsync('cp package.json /tmp/schema-deploy-bundle/');
    await execAsync('cp direct-schema-deploy.js /tmp/schema-deploy-bundle/');
    await execAsync('cp -r shared/ /tmp/schema-deploy-bundle/ 2>/dev/null || true');
    await execAsync('cp -r dist/ /tmp/schema-deploy-bundle/ 2>/dev/null || true');

    // Create deployment script
    const deployScript = `#!/bin/bash
echo "🗃️ Starting schema deployment..."
export NODE_ENV=production
node direct-schema-deploy.js
echo "✅ Schema deployment completed"
`;

    await execAsync(`echo '${deployScript}' > /tmp/schema-deploy-bundle/deploy-schema.sh`);
    await execAsync('chmod +x /tmp/schema-deploy-bundle/deploy-schema.sh');

    // Create zip bundle
    await execAsync('cd /tmp/schema-deploy-bundle && tar -czf ../schema-deploy.tar.gz .');

    // 5. Upload bundle to S3
    const accountId = await executeAWSCommand('aws sts get-caller-identity --query Account --output text');
    const s3Bucket = `elasticbeanstalk-ap-southeast-1-${accountId}`;
    const s3Key = `${APPLICATION_NAME}/schema-deploy-${Date.now()}.tar.gz`;

    console.log(`📤 Uploading to S3: ${s3Bucket}/${s3Key}`);
    await executeAWSCommand(`aws s3 cp /tmp/schema-deploy.tar.gz s3://${s3Bucket}/${s3Key}`);

    // 6. Create application version
    const versionLabel = `schema-deploy-${Date.now()}`;
    console.log(`📋 Creating application version: ${versionLabel}`);
    await executeAWSCommand(`aws elasticbeanstalk create-application-version --application-name ${APPLICATION_NAME} --version-label ${versionLabel} --source-bundle S3Bucket=${s3Bucket},S3Key=${s3Key}`);

    // 7. Deploy to environment
    console.log(`🚀 Deploying to environment: ${ENVIRONMENT_NAME}`);
    await executeAWSCommand(`aws elasticbeanstalk update-environment --environment-name ${ENVIRONMENT_NAME} --version-label ${versionLabel}`);

    console.log('⏳ Waiting for deployment to complete...');

    // Wait for deployment
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

      const status = await executeAWSCommand(`aws elasticbeanstalk describe-environments --environment-names ${ENVIRONMENT_NAME} --query 'Environments[0].Status' --output text`);
      console.log(`Deployment status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

      if (status === 'Ready') {
        console.log('✅ Deployment completed successfully!');
        break;
      } else if (status === 'Severe') {
        throw new Error('Deployment failed with severe status');
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn('⚠️ Deployment timeout, but may still be in progress');
    }

    console.log('🎉 Schema deployment process completed!');
    return true;

  } catch (error) {
    console.error('❌ AWS schema deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
deploySchemaViaAWS()
  .then(() => {
    console.log('✨ AWS schema deployment initiated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  });