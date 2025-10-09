#!/usr/bin/env node
// Schema deployment script for AWS EB environment
const { execSync } = require('child_process');

console.log('Starting database schema deployment...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

try {
  console.log('Running drizzle-kit push...');
  const output = execSync('npm run db:push', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('Schema deployment completed successfully!');
} catch (error) {
  console.error('Schema deployment failed:', error.message);
  process.exit(1);
}