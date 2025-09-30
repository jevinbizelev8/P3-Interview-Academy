// Extract AWS CLI zip file using Node.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('📦 Extracting AWS CLI using Node.js...');

try {
  // Try to use 7z if available
  execSync('7z x awscliv2.zip', { stdio: 'inherit' });
  console.log('✅ AWS CLI extracted successfully with 7z');
} catch (error) {
  console.log('7z not available, trying alternative methods...');

  try {
    // Try using apt to install unzip
    execSync('apt update && apt install -y unzip', { stdio: 'inherit' });
    execSync('unzip awscliv2.zip', { stdio: 'inherit' });
    console.log('✅ AWS CLI extracted successfully with unzip');
  } catch (error2) {
    console.error('❌ Failed to extract AWS CLI:', error2.message);
    process.exit(1);
  }
}