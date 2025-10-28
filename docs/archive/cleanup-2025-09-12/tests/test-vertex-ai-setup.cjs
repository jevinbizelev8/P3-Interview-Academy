#!/usr/bin/env node
/**
 * Test script for SeaLion Vertex AI integration setup
 * This script validates the setup without requiring TypeScript compilation
 */

// Load environment variables from .env file
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.startsWith('#')) {
        const [key, ...valueParts] = cleanLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    }
    console.log('📄 Loaded .env file');
  } else {
    console.log('⚠️  No .env file found (this is optional)');
  }
} catch (error) {
  console.log(`⚠️  Error loading .env file: ${error.message}`);
}

console.log('🧪 Testing SeaLion Vertex AI Integration Setup\n');

// Test 1: Environment Variables
console.log('1️⃣ Checking Environment Variables...');
const requiredVertexAIVars = [
  'GCP_PROJECT_ID', 
  'GCP_REGION', 
  'GCP_ENDPOINT_ID'
];

const vertexAIAuthVars = [
  'GOOGLE_API_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_OAUTH_CLIENT_CREDENTIALS',
  'GOOGLE_OAUTH_ACCESS_TOKEN'
];

const requiredSeaLionVars = [
  'SEALION_API_KEY',
  'SEA_LION_API_KEY'
];

let vertexAIVarsOK = true;
let vertexAIAuthOK = false;
let seaLionVarsOK = false;

console.log('\n   Vertex AI Configuration:');
for (const envVar of requiredVertexAIVars) {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${value}`);
  } else {
    console.log(`   ❌ ${envVar}: Not set`);
    vertexAIVarsOK = false;
  }
}

console.log('\n   Vertex AI Authentication:');
for (const envVar of vertexAIAuthVars) {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ***configured***`);
    vertexAIAuthOK = true;
  } else {
    console.log(`   ❌ ${envVar}: Not set`);
  }
}

console.log('\n   SeaLion Direct API Configuration:');
for (const envVar of requiredSeaLionVars) {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ***configured***`);
    seaLionVarsOK = true;
  } else {
    console.log(`   ❌ ${envVar}: Not set`);
  }
}

// Test 2: Node.js Dependencies
console.log('\n2️⃣ Checking Dependencies...');
const requiredDependencies = [
  'google-auth-library',
  '@google-cloud/aiplatform',
  'openai',
  'axios'
];

let dependenciesOK = true;
for (const dep of requiredDependencies) {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep}: Available`);
  } catch (error) {
    console.log(`❌ ${dep}: Missing`);
    dependenciesOK = false;
  }
}

// Test 3: Project Files
console.log('\n3️⃣ Checking Project Files...');

const criticalFiles = [
  'server/services/vertex-ai-config.ts',
  'server/services/sealion.ts', 
  'server/sealion.ts',
  '.env.example',
  'GCP_SETUP.md'
];

let filesOK = true;
for (const file of criticalFiles) {
  try {
    fs.accessSync(path.join(__dirname, file));
    console.log(`✅ ${file}: Present`);
  } catch (error) {
    console.log(`❌ ${file}: Missing`);
    filesOK = false;
  }
}

// Test 4: .gitignore Configuration
console.log('\n4️⃣ Checking .gitignore...');
try {
  const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf-8');
  const protectedFiles = [
    'vt-svc-key.json',
    '.env',
    'gcp-credentials.json'
  ];
  
  let gitignoreOK = true;
  for (const file of protectedFiles) {
    if (gitignore.includes(file)) {
      console.log(`✅ ${file}: Protected in .gitignore`);
    } else {
      console.log(`❌ ${file}: Not protected in .gitignore`);
      gitignoreOK = false;
    }
  }
} catch (error) {
  console.log(`❌ .gitignore check failed: ${error.message}`);
}

// Test 5: Service Account File (if configured)
console.log('\n5️⃣ Checking Service Account Credentials...');
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credentialsPath) {
  try {
    fs.accessSync(credentialsPath);
    console.log(`✅ Service account file exists: ${credentialsPath}`);
    
    // Try to read and validate JSON structure
    const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsContent);
    
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    let validCredentials = true;
    
    for (const field of requiredFields) {
      if (!credentials[field]) {
        console.log(`❌ Missing field in service account: ${field}`);
        validCredentials = false;
      }
    }
    
    if (validCredentials) {
      console.log(`✅ Service account structure is valid`);
      console.log(`   Project ID: ${credentials.project_id}`);
      console.log(`   Client Email: ${credentials.client_email}`);
      
      // Validate project ID matches environment variable
      if (credentials.project_id === process.env.GCP_PROJECT_ID) {
        console.log(`✅ Service account project matches GCP_PROJECT_ID`);
      } else {
        console.log(`⚠️  Service account project (${credentials.project_id}) differs from GCP_PROJECT_ID (${process.env.GCP_PROJECT_ID})`);
      }
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`❌ Service account file not found: ${credentialsPath}`);
      console.log(`   Please download your service account key from Google Cloud Console`);
    } else if (error instanceof SyntaxError) {
      console.log(`❌ Invalid JSON in service account file`);
    } else {
      console.log(`❌ Service account file error: ${error.message}`);
    }
  }
} else {
  console.log(`⚠️  GOOGLE_APPLICATION_CREDENTIALS not set`);
}

// Test 6: Package.json Integration
console.log('\n6️⃣ Checking Package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  
  const requiredDeps = ['google-auth-library', '@google-cloud/aiplatform'];
  let packageOK = true;
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: Not in dependencies`);
      packageOK = false;
    }
  }
  
  // Check for test script
  if (packageJson.scripts && packageJson.scripts['test:vertex-ai']) {
    console.log(`✅ test:vertex-ai script: Present`);
  } else {
    console.log(`❌ test:vertex-ai script: Missing`);
  }
  
} catch (error) {
  console.log(`❌ Package.json check failed: ${error.message}`);
}

// Summary
console.log('\n📋 Setup Summary');
console.log('================');

console.log(`\n🔧 Configuration Status:`);
console.log(`   Vertex AI Ready: ${vertexAIVarsOK && vertexAIAuthOK ? '✅ Yes' : '❌ No'}`);
console.log(`   Direct API Ready: ${seaLionVarsOK ? '✅ Yes' : '❌ No'}`);
console.log(`   Dependencies: ${dependenciesOK ? '✅ OK' : '❌ Missing'}`);
console.log(`   Project Files: ${filesOK ? '✅ OK' : '❌ Missing'}`);

const vertexAIReady = vertexAIVarsOK && vertexAIAuthOK && dependenciesOK && filesOK;
const directAPIReady = seaLionVarsOK && dependenciesOK && filesOK;

if (vertexAIReady) {
  console.log('\n🚀 Status: READY FOR VERTEX AI');
  console.log('   Your SeaLion integration is configured to use Google Cloud Vertex AI');
  console.log('   Project: g-4d-bizelev8');
  console.log('   Region: asia-southeast1'); 
  console.log('   Endpoint: 2904148858537771008');
} else if (directAPIReady) {
  console.log('\n⚡ Status: READY FOR DIRECT API');  
  console.log('   Your SeaLion integration will use the direct SeaLion API');
  console.log('   Set up Vertex AI credentials to enable Google Cloud integration');
} else {
  console.log('\n❌ Status: SETUP INCOMPLETE');
  console.log('   Please complete the configuration steps below');
}

console.log('\n📝 Next Steps:');
if (!vertexAIReady && !directAPIReady) {
  console.log('1. Install missing dependencies: npm install');
  console.log('2. Set up service account credentials (see GCP_SETUP.md)');
  console.log('3. OR set SEALION_API_KEY/SEA_LION_API_KEY for direct API access');
} else if (!vertexAIReady && directAPIReady) {
  console.log('1. Review GCP_SETUP.md for Vertex AI configuration');
  console.log('2. Download service account key from Google Cloud Console');
  console.log('3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
} else if (vertexAIReady) {
  console.log('1. Start the application: npm run dev');
  console.log('2. Your SeaLion Vertex AI integration is ready! 🎉');
  console.log('3. Monitor logs for "SeaLion service initialized with Vertex AI"');
}

console.log('\n📚 Documentation:');
console.log('   Setup Guide: ./GCP_SETUP.md');
console.log('   Environment Template: ./.env.example');
console.log('   Test Command: npm run test:vertex-ai');

console.log('\n✨ Test completed!\n');