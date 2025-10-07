// Deploy new application version with schema deployment
import { ElasticBeanstalkClient, CreateApplicationVersionCommand, UpdateEnvironmentCommand } from '@aws-sdk/client-elastic-beanstalk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import fs from 'fs';
import { execSync } from 'child_process';
import { createReadStream } from 'fs';

// AWS Configuration - CREDENTIALS REMOVED FOR SECURITY
const awsConfig = {
  region: 'ap-southeast-1',
  // Use AWS CLI profile or environment variables for credentials
};

const APPLICATION_NAME = 'p3-interview-academy';
const ENVIRONMENT_NAME = 'p3-interview-academy-prod-v2';

// Initialize AWS clients
const ebClient = new ElasticBeanstalkClient(awsConfig);
const s3Client = new S3Client(awsConfig);
const stsClient = new STSClient(awsConfig);

async function deployWithSchemaCreation() {
  try {
    console.log('🚀 Starting deployment with schema creation...');

    // 1. Get AWS account info
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    const accountId = identity.Account;
    const s3Bucket = `elasticbeanstalk-ap-southeast-1-${accountId}`;

    console.log(`✅ AWS Account: ${accountId}`);

    // 2. Create deployment bundle with schema deployment
    const bundleName = `schema-fix-${Date.now()}`;
    const bundlePath = `/tmp/${bundleName}`;

    console.log('📦 Creating deployment bundle...');
    execSync(`mkdir -p ${bundlePath}`, { stdio: 'inherit' });

    // Copy essential application files
    execSync(`cp -r dist/ ${bundlePath}/ 2>/dev/null || echo "No dist folder"`, { stdio: 'inherit' });
    execSync(`cp package.json ${bundlePath}/`, { stdio: 'inherit' });
    execSync(`cp -r shared/ ${bundlePath}/ 2>/dev/null || echo "No shared folder"`, { stdio: 'inherit' });

    // Create schema deployment script
    const deployScript = `#!/bin/bash
set -e

echo "🗃️ Starting schema deployment in production..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Run schema deployment directly
echo "Running database schema deployment..."

# Direct SQL execution for schema creation
node -e "
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function deploySchema() {
  const client = await pool.connect();

  try {
    console.log('📋 Creating practice_sessions table...');
    await client.query(\`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-session-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
        user_id VARCHAR(255) NOT NULL,
        scenario_id VARCHAR(255) NOT NULL,
        interview_stage VARCHAR(100) NOT NULL,
        job_position VARCHAR(255),
        company_name VARCHAR(255),
        difficulty_level VARCHAR(50) DEFAULT 'intermediate',
        preferred_language VARCHAR(10) DEFAULT 'en',
        total_questions INTEGER DEFAULT 20,
        current_question_number INTEGER DEFAULT 1,
        session_status VARCHAR(50) DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        overall_score DECIMAL(5,2),
        feedback_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);

    console.log('📋 Creating practice_messages table...');
    await client.query(\`
      CREATE TABLE IF NOT EXISTS practice_messages (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-message-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
        session_id VARCHAR(255) NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
        message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'ai')),
        content TEXT NOT NULL,
        question_number INTEGER,
        response_time INTEGER,
        star_score DECIMAL(5,2),
        feedback TEXT,
        cultural_context TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);

    console.log('📋 Creating practice_reports table...');
    await client.query(\`
      CREATE TABLE IF NOT EXISTS practice_reports (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'practice-report-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8),
        session_id VARCHAR(255) NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
        overall_score DECIMAL(5,2) NOT NULL,
        star_breakdown JSONB,
        detailed_feedback TEXT,
        strengths TEXT[],
        improvement_areas TEXT[],
        recommendations TEXT[],
        cultural_insights TEXT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);

    console.log('✅ Schema deployment completed successfully!');
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

deploySchema();
"

echo "✅ Schema deployment script completed!"
`;

    fs.writeFileSync(`${bundlePath}/deploy-schema.sh`, deployScript);
    execSync(`chmod +x ${bundlePath}/deploy-schema.sh`);

    // Create .ebextensions for deployment hooks
    execSync(`mkdir -p ${bundlePath}/.ebextensions`);

    const ebConfig = `commands:
  01_deploy_schema:
    command: "./deploy-schema.sh"
    leader_only: true`;

    fs.writeFileSync(`${bundlePath}/.ebextensions/01-deploy-schema.config`, ebConfig);

    // Create bundle archive
    console.log('📦 Creating deployment archive...');
    execSync(`cd ${bundlePath} && tar -czf ../${bundleName}.tar.gz .`);

    // 3. Upload to S3
    const s3Key = `${APPLICATION_NAME}/${bundleName}.tar.gz`;
    console.log(`📤 Uploading to S3: ${s3Bucket}/${s3Key}`);

    const fileContent = fs.readFileSync(`/tmp/${bundleName}.tar.gz`);
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/gzip'
    }));

    console.log('✅ Bundle uploaded to S3');

    // 4. Create application version
    const versionLabel = bundleName;
    console.log(`📋 Creating application version: ${versionLabel}`);

    await ebClient.send(new CreateApplicationVersionCommand({
      ApplicationName: APPLICATION_NAME,
      VersionLabel: versionLabel,
      SourceBundle: {
        S3Bucket: s3Bucket,
        S3Key: s3Key
      },
      Description: 'Schema deployment fix for practice sessions'
    }));

    console.log('✅ Application version created');

    // 5. Deploy to environment
    console.log(`🚀 Deploying to environment: ${ENVIRONMENT_NAME}`);
    await ebClient.send(new UpdateEnvironmentCommand({
      EnvironmentName: ENVIRONMENT_NAME,
      VersionLabel: versionLabel
    }));

    console.log('✅ Deployment initiated');
    console.log('⏳ Deployment will take a few minutes to complete...');

    return true;

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
deployWithSchemaCreation()
  .then(() => {
    console.log('🎉 Schema deployment bundle created and deployed!');
    console.log('Monitor the deployment in AWS EB console');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  });