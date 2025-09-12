#!/usr/bin/env node

/**
 * Voice Route Fix Test
 * Tests if removing duplicate routes fixes the 404 issue
 */

const http = require('http');

class VoiceRouteFixTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async runVoiceRouteFixTest() {
    console.log('🔧 Voice Route Fix Test\n');
    
    try {
      // Start server
      await this.startServer();
      
      // Test voice endpoints
      await this.testVoiceEndpoints();
      
    } catch (error) {
      console.error('❌ Voice route fix test failed:', error.message);
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

  async testVoiceEndpoints() {
    console.log('\n🔍 Testing voice endpoints...');
    
    const endpoints = [
      '/api/voice/health',
      '/api/voice/config',
      '/api/voice/browser-voices?language=en'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        console.log(`✅ ${endpoint}: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`📋 Response: ${JSON.stringify(response.data, null, 2)}`);
        } else {
          console.log(`❌ Error: ${response.data.message || response.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (body) {
        const bodyString = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
      }

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

      if (body) {
        req.write(JSON.stringify(body));
      }

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
  const tester = new VoiceRouteFixTester();
  tester.runVoiceRouteFixTest().catch(console.error);
}

module.exports = VoiceRouteFixTester;
