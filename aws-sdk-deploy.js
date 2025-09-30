// AWS SDK-based deployment for schema
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand, UpdateEnvironmentCommand, CreateApplicationVersionCommand } from '@aws-sdk/client-elastic-beanstalk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import fs from 'fs';
import { execSync } from 'child_process';

// AWS Configuration
const awsConfig = {
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: 'AKIAWCHYHHICYOWB626U',
    secretAccessKey: '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'
  }
};

const APPLICATION_NAME = 'p3-interview-academy';
const ENVIRONMENT_NAME = 'p3-interview-academy-prod-v2';

// Initialize AWS clients
const ebClient = new ElasticBeanstalkClient(awsConfig);
const s3Client = new S3Client(awsConfig);
const stsClient = new STSClient(awsConfig);

async function updateEnvironmentWithSchemaDeployment() {
  try {
    console.log('🚀 Starting AWS SDK-based schema deployment...');

    // 1. Verify AWS credentials
    console.log('🔐 Verifying AWS credentials...');
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log(`✅ Connected as: ${identity.Account} (${identity.Arn})`);

    // 2. Check current environment status
    console.log('📊 Checking environment status...');
    const envResponse = await ebClient.send(new DescribeEnvironmentsCommand({
      EnvironmentNames: [ENVIRONMENT_NAME]
    }));

    const environment = envResponse.Environments?.[0];
    if (!environment) {
      throw new Error(`Environment ${ENVIRONMENT_NAME} not found`);
    }

    console.log(`Environment status: ${environment.Status} (Health: ${environment.Health})`);

    // 3. Update environment variables to trigger schema deployment
    console.log('🔧 Updating environment to trigger schema deployment...');

    const updateCommand = new UpdateEnvironmentCommand({
      EnvironmentName: ENVIRONMENT_NAME,
      OptionSettings: [
        {
          Namespace: 'aws:elasticbeanstalk:application:environment',
          OptionName: 'DEPLOY_SCHEMA',
          Value: 'true'
        },
        {
          Namespace: 'aws:elasticbeanstalk:application:environment',
          OptionName: 'SCHEMA_DEPLOY_TIMESTAMP',
          Value: new Date().toISOString()
        }
      ]
    });

    const updateResponse = await ebClient.send(updateCommand);
    console.log('✅ Environment update initiated');

    // 4. Wait for deployment to stabilize
    console.log('⏳ Waiting for environment to stabilize...');

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

      const statusResponse = await ebClient.send(new DescribeEnvironmentsCommand({
        EnvironmentNames: [ENVIRONMENT_NAME]
      }));

      const currentEnv = statusResponse.Environments?.[0];
      console.log(`Status check ${attempts + 1}: ${currentEnv?.Status} (Health: ${currentEnv?.Health})`);

      if (currentEnv?.Status === 'Ready') {
        console.log('✅ Environment is ready!');
        break;
      } else if (currentEnv?.Status === 'Severe') {
        throw new Error('Environment deployment failed');
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn('⚠️ Environment update timeout, but may still be in progress');
    }

    console.log('🎉 Schema deployment environment update completed!');
    return true;

  } catch (error) {
    console.error('❌ AWS SDK deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
updateEnvironmentWithSchemaDeployment()
  .then(() => {
    console.log('✨ AWS SDK schema deployment initiated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  });