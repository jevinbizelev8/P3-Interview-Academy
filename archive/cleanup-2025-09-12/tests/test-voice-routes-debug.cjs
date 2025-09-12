#!/usr/bin/env node

/**
 * Voice Routes Debug Test
 * Debug why voice routes are not being loaded
 */

const http = require('http');

class VoiceRoutesDebugTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async runDebugTest() {
    console.log('🔍 Voice Routes Debug Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Test various endpoints
      await this.testEndpoints();
      
    } catch (error) {
      console.error('❌ Debug test failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async startServer() {
    console.log('🚀 Starting server...');
    
    const { spawn } = require('child_process');
    this.serverProcess = spawn('npm', ['start'], {
      cwd: '/home/runner/workspace',
      stdio: 'pipe'
    });
    
    await this.waitForServer();
    console.log('✅ Server started successfully');
  }

  async waitForServer() {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.makeRequest('/api/health');
        if (response.status === 200) {
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Server failed to start within 30 seconds');
  }

  async testEndpoints() {
    console.log('\n🔍 Testing various endpoints...');
    
    const endpoints = [
      '/api/health',
      '/api/voice/health',
      '/api/voice/config',
      '/api/prepare-ai/health',
      '/api/practice/sessions'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint}...`);
      
      try {
        const response = await this.makeRequest(endpoint);
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`  ✅ Available`);
        } else if (response.status === 404) {
          console.log(`  ❌ Not Found`);
        } else {
          console.log(`  ⚠️ Other Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  }

  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const responseData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('✅ Server stopped');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new VoiceRoutesDebugTester();
  tester.runDebugTest().catch(console.error);
}

module.exports = VoiceRoutesDebugTester;
