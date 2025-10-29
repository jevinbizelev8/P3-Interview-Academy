#!/usr/bin/env node

/**
 * Simple Voice Check Test
 * Tests if voice routes are accessible by checking the server directly
 */

const http = require('http');

class SimpleVoiceCheckTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async runSimpleVoiceCheck() {
    console.log('🎤 Simple Voice Check Test\n');
    
    try {
      // Start server
      await this.startServer();
      
      // Test basic endpoints
      await this.testBasicEndpoints();
      
    } catch (error) {
      console.error('❌ Simple voice check failed:', error.message);
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

  async testBasicEndpoints() {
    console.log('\n🔍 Testing basic endpoints...');
    
    // Test health endpoint
    try {
      const healthResponse = await this.makeRequest('/api/health');
      console.log(`✅ Health endpoint: ${healthResponse.status}`);
    } catch (error) {
      console.log(`❌ Health endpoint failed: ${error.message}`);
    }
    
    // Test voice health endpoint
    try {
      const voiceHealthResponse = await this.makeRequest('/api/voice/health');
      console.log(`✅ Voice health endpoint: ${voiceHealthResponse.status}`);
      if (voiceHealthResponse.status === 200) {
        console.log('📋 Voice Health Response:', JSON.stringify(voiceHealthResponse.data, null, 2));
      }
    } catch (error) {
      console.log(`❌ Voice health endpoint failed: ${error.message}`);
    }
    
    // Test voice config endpoint
    try {
      const voiceConfigResponse = await this.makeRequest('/api/voice/config');
      console.log(`✅ Voice config endpoint: ${voiceConfigResponse.status}`);
      if (voiceConfigResponse.status === 200) {
        console.log('📋 Voice Config Response:', JSON.stringify(voiceConfigResponse.data, null, 2));
      }
    } catch (error) {
      console.log(`❌ Voice config endpoint failed: ${error.message}`);
    }
    
    // Test browser voices endpoint
    try {
      const browserVoicesResponse = await this.makeRequest('/api/voice/browser-voices?language=en');
      console.log(`✅ Browser voices endpoint: ${browserVoicesResponse.status}`);
      if (browserVoicesResponse.status === 200) {
        console.log('📋 Browser Voices Response:', JSON.stringify(browserVoicesResponse.data, null, 2));
      }
    } catch (error) {
      console.log(`❌ Browser voices endpoint failed: ${error.message}`);
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
  const tester = new SimpleVoiceCheckTester();
  tester.runSimpleVoiceCheck().catch(console.error);
}

module.exports = SimpleVoiceCheckTester;
