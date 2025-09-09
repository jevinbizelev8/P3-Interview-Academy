#!/usr/bin/env node

/**
 * Translation Debug Test
 * Debug the actual translation functionality and API responses
 */

const http = require('http');

class TranslationDebugTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testUserId = 'test-user-' + Date.now();
    this.cookies = '';
  }

  async runDebugTests() {
    console.log('🔍 Translation Debug Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Setup user
      await this.setupUser();
      
      // Step 3: Debug question generation API
      await this.debugQuestionGenerationAPI();
      
      // Step 4: Test translation service directly
      await this.testTranslationServiceDirectly();
      
      // Step 5: Test voice services
      await this.testVoiceServices();
      
    } catch (error) {
      console.error('❌ Debug tests failed:', error.message);
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

  async setupUser() {
    console.log('\n👤 Setting up user...');
    
    // Register user
    const registerResponse = await this.makeRequest('/api/auth/signup', 'POST', {
      email: `test-${this.testUserId}@example.com`,
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResponse.status === 200 || registerResponse.status === 409) {
      console.log('✅ User setup complete');
    }
    
    // Login user
    const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
      email: `test-${this.testUserId}@example.com`,
      password: 'testpassword123'
    });
    
    if (loginResponse.status === 200) {
      this.cookies = loginResponse.headers['set-cookie']?.join('; ') || '';
      console.log('✅ User login complete');
    }
  }

  async debugQuestionGenerationAPI() {
    console.log('\n🔍 Debugging Question Generation API...');
    
    try {
      // Create session
      const sessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
        scenarioId: 'test-scenario-debug',
        userJobPosition: 'Software Engineer',
        userCompanyName: 'Test Company',
        interviewLanguage: 'ms'
      }, this.cookies);
      
      if (sessionResponse.status === 200 || sessionResponse.status === 201) {
        const sessionId = sessionResponse.data.id;
        console.log(`✅ Session created: ${sessionId}`);
        
        // Debug the actual API response
        console.log('\n📋 Session Response Data:');
        console.log(JSON.stringify(sessionResponse.data, null, 2));
        
        // Test question generation with detailed logging
        console.log('\n🎯 Testing Question Generation...');
        
        const questionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/ai-question`, 'POST', {
          questionNumber: 1,
          previousQuestions: [],
          preferredLanguage: 'ms'
        }, this.cookies);
        
        console.log(`\n📋 Question Response Status: ${questionResponse.status}`);
        console.log('📋 Question Response Data:');
        console.log(JSON.stringify(questionResponse.data, null, 2));
        
        // Check for translation fields
        const data = questionResponse.data;
        console.log('\n🔍 Translation Field Analysis:');
        console.log(`  question: ${data.question ? 'Present' : 'Missing'}`);
        console.log(`  questionText: ${data.questionText ? 'Present' : 'Missing'}`);
        console.log(`  questionTextTranslated: ${data.questionTextTranslated ? 'Present' : 'Missing'}`);
        console.log(`  translatedQuestion: ${data.translatedQuestion ? 'Present' : 'Missing'}`);
        console.log(`  questionTranslated: ${data.questionTranslated ? 'Present' : 'Missing'}`);
        
        if (data.questionTextTranslated) {
          console.log(`  Translation: ${data.questionTextTranslated}`);
        }
        
      } else {
        console.log('❌ Session creation failed:', sessionResponse.status);
        console.log('Response:', sessionResponse.data);
      }
      
    } catch (error) {
      console.log('❌ Question generation debug failed:', error.message);
    }
  }

  async testTranslationServiceDirectly() {
    console.log('\n🌐 Testing Translation Service Directly...');
    
    try {
      // Test translation service endpoint if it exists
      const translationResponse = await this.makeRequest('/api/translate', 'POST', {
        text: 'Tell me about yourself and your experience in software development.',
        targetLanguage: 'ms'
      }, this.cookies);
      
      console.log(`\n📋 Translation Service Status: ${translationResponse.status}`);
      console.log('📋 Translation Service Response:');
      console.log(JSON.stringify(translationResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Translation service test failed:', error.message);
    }
  }

  async testVoiceServices() {
    console.log('\n🎤 Testing Voice Services...');
    
    try {
      // Test voice services endpoints
      const voiceEndpoints = [
        '/api/voice/health',
        '/api/voice/status',
        '/api/voice/config',
        '/api/prepare/voice/status',
        '/api/practice/voice/status'
      ];
      
      for (const endpoint of voiceEndpoints) {
        console.log(`\n🔍 Testing ${endpoint}...`);
        
        const response = await this.makeRequest(endpoint);
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`  ✅ Available`);
          console.log(`  Data: ${JSON.stringify(response.data, null, 2)}`);
        } else {
          console.log(`  ❌ Not Available`);
        }
      }
      
    } catch (error) {
      console.log('❌ Voice services test failed:', error.message);
    }
  }

  makeRequest(path, method = 'GET', body = null, cookies = null) {
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

      if (cookies) {
        options.headers['Cookie'] = cookies;
      }

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

// Run the tests
if (require.main === module) {
  const tester = new TranslationDebugTester();
  tester.runDebugTests().catch(console.error);
}

module.exports = TranslationDebugTester;
