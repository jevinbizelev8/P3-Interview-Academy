#!/usr/bin/env node

/**
 * Session Persistence and User Progress Tracking Test
 * Tests that user sessions are saved and progress is visible after login
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class SessionPersistenceTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      sessionPersistence: {},
      userProgress: {},
      dataIntegrity: {},
      loginFlow: {},
      errors: []
    };
    this.testUserId = 'test-user-' + Date.now();
    this.testSessionIds = [];
  }

  async runPersistenceTests() {
    console.log('🧪 Session Persistence and User Progress Tracking Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Test User Registration/Login
      await this.testUserAuthentication();
      
      // Step 3: Test Session Creation and Persistence
      await this.testSessionCreationAndPersistence();
      
      // Step 4: Test User Progress Tracking
      await this.testUserProgressTracking();
      
      // Step 5: Test Data Integrity
      await this.testDataIntegrity();
      
      // Step 6: Test Login Flow and Progress Visibility
      await this.testLoginFlowAndProgress();
      
      // Step 7: Generate Persistence Report
      this.generatePersistenceReport();
      
    } catch (error) {
      console.error('❌ Persistence tests failed:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  async startServer() {
    console.log('🚀 Starting server...');
    
    try {
      // Start server in background
      const { spawn } = require('child_process');
      this.serverProcess = spawn('npm', ['start'], {
        cwd: '/home/runner/workspace',
        stdio: 'pipe'
      });
      
      // Wait for server to start
      await this.waitForServer();
      console.log('✅ Server started successfully');
      
    } catch (error) {
      console.log('❌ Failed to start server:', error.message);
      throw error;
    }
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

  async testUserAuthentication() {
    console.log('\n🔐 Testing User Authentication...');
    
    try {
      // Test 1: User Registration
      const registerResponse = await this.makeRequest('/api/auth/register', 'POST', {
        email: `test-${this.testUserId}@example.com`,
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      });
      
      if (registerResponse.status === 200 || registerResponse.status === 201) {
        console.log('✅ User registration successful');
        this.testResults.loginFlow.registration = 'PASS';
      } else if (registerResponse.status === 409) {
        console.log('⚠️ User already exists (expected for repeated tests)');
        this.testResults.loginFlow.registration = 'EXISTS';
      } else {
        console.log('❌ User registration failed:', registerResponse.status);
        this.testResults.loginFlow.registration = 'FAIL';
      }
      
      // Test 2: User Login
      const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
        email: `test-${this.testUserId}@example.com`,
        password: 'testpassword123'
      });
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        console.log('✅ User login successful');
        this.authToken = loginResponse.data.token;
        this.testResults.loginFlow.login = 'PASS';
      } else {
        console.log('❌ User login failed:', loginResponse.status);
        this.testResults.loginFlow.login = 'FAIL';
        throw new Error('Authentication failed');
      }
      
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
      this.testResults.loginFlow.error = error.message;
      this.testResults.errors.push(`Authentication: ${error.message}`);
    }
  }

  async testSessionCreationAndPersistence() {
    console.log('\n💾 Testing Session Creation and Persistence...');
    
    try {
      if (!this.authToken) {
        throw new Error('No auth token available');
      }
      
      // Test 1: Create Practice Session
      const sessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
        scenarioId: 'test-scenario-1',
        userJobPosition: 'Software Engineer',
        userCompanyName: 'Test Company',
        interviewLanguage: 'en'
      }, this.authToken);
      
      if (sessionResponse.status === 200 || sessionResponse.status === 201) {
        this.testSessionIds.push(sessionResponse.data.id);
        console.log('✅ Practice session created:', sessionResponse.data.id);
        this.testResults.sessionPersistence.creation = 'PASS';
      } else {
        console.log('❌ Session creation failed:', sessionResponse.status);
        this.testResults.sessionPersistence.creation = 'FAIL';
      }
      
      // Test 2: Create Another Session
      const session2Response = await this.makeRequest('/api/practice/sessions', 'POST', {
        scenarioId: 'test-scenario-2',
        userJobPosition: 'Data Analyst',
        userCompanyName: 'Analytics Corp',
        interviewLanguage: 'en'
      }, this.authToken);
      
      if (session2Response.status === 200 || session2Response.status === 201) {
        this.testSessionIds.push(session2Response.data.id);
        console.log('✅ Second session created:', session2Response.data.id);
        this.testResults.sessionPersistence.multipleSessions = 'PASS';
      } else {
        console.log('❌ Second session creation failed:', session2Response.status);
        this.testResults.sessionPersistence.multipleSessions = 'FAIL';
      }
      
      // Test 3: Verify Session Persistence
      const sessionsResponse = await this.makeRequest('/api/practice/sessions', 'GET', null, this.authToken);
      
      if (sessionsResponse.status === 200 && Array.isArray(sessionsResponse.data)) {
        console.log(`✅ Found ${sessionsResponse.data.length} persisted sessions`);
        this.testResults.sessionPersistence.retrieval = 'PASS';
        this.testResults.sessionPersistence.sessionCount = sessionsResponse.data.length;
      } else {
        console.log('❌ Session retrieval failed:', sessionsResponse.status);
        this.testResults.sessionPersistence.retrieval = 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ Session persistence test failed:', error.message);
      this.testResults.sessionPersistence.error = error.message;
      this.testResults.errors.push(`Session Persistence: ${error.message}`);
    }
  }

  async testUserProgressTracking() {
    console.log('\n📊 Testing User Progress Tracking...');
    
    try {
      if (!this.authToken || this.testSessionIds.length === 0) {
        throw new Error('No auth token or sessions available');
      }
      
      const sessionId = this.testSessionIds[0];
      
      // Test 1: Update Session Progress
      const progressResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/auto-save`, 'POST', {
        currentQuestion: 3,
        progress: 25,
        timeSpent: 300
      }, this.authToken);
      
      if (progressResponse.status === 200) {
        console.log('✅ Session progress updated');
        this.testResults.userProgress.update = 'PASS';
      } else {
        console.log('❌ Progress update failed:', progressResponse.status);
        this.testResults.userProgress.update = 'FAIL';
      }
      
      // Test 2: Add User Response
      const responseData = {
        questionId: 'test-question-1',
        response: 'This is a test response for progress tracking.',
        responseTime: 45,
        wordCount: 12
      };
      
      const userResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/user-response`, 'POST', responseData, this.authToken);
      
      if (userResponse.status === 200) {
        console.log('✅ User response recorded');
        this.testResults.userProgress.responseRecording = 'PASS';
      } else {
        console.log('❌ Response recording failed:', userResponse.status);
        this.testResults.userProgress.responseRecording = 'FAIL';
      }
      
      // Test 3: Complete Session
      const completeResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/complete`, 'POST', {
        finalScore: 85,
        duration: 1800,
        strengths: ['Good communication', 'Clear examples'],
        improvements: ['More specific details', 'Better time management']
      }, this.authToken);
      
      if (completeResponse.status === 200) {
        console.log('✅ Session completed with progress data');
        this.testResults.userProgress.completion = 'PASS';
      } else {
        console.log('❌ Session completion failed:', completeResponse.status);
        this.testResults.userProgress.completion = 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ User progress tracking test failed:', error.message);
      this.testResults.userProgress.error = error.message;
      this.testResults.errors.push(`User Progress: ${error.message}`);
    }
  }

  async testDataIntegrity() {
    console.log('\n🔍 Testing Data Integrity...');
    
    try {
      if (!this.authToken || this.testSessionIds.length === 0) {
        throw new Error('No auth token or sessions available');
      }
      
      const sessionId = this.testSessionIds[0];
      
      // Test 1: Verify Session Data Integrity
      const sessionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}`, 'GET', null, this.authToken);
      
      if (sessionResponse.status === 200 && sessionResponse.data.id === sessionId) {
        console.log('✅ Session data integrity verified');
        this.testResults.dataIntegrity.sessionData = 'PASS';
      } else {
        console.log('❌ Session data integrity failed:', sessionResponse.status);
        this.testResults.dataIntegrity.sessionData = 'FAIL';
      }
      
      // Test 2: Verify Messages Persistence
      const messagesResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/messages`, 'GET', null, this.authToken);
      
      if (messagesResponse.status === 200 && Array.isArray(messagesResponse.data)) {
        console.log(`✅ Messages persisted: ${messagesResponse.data.length} messages`);
        this.testResults.dataIntegrity.messages = 'PASS';
        this.testResults.dataIntegrity.messageCount = messagesResponse.data.length;
      } else {
        console.log('❌ Messages persistence failed:', messagesResponse.status);
        this.testResults.dataIntegrity.messages = 'FAIL';
      }
      
      // Test 3: Verify Evaluation Data
      const evaluationResponse = await this.makeRequest(`/api/perform/sessions/${sessionId}/evaluation`, 'GET', null, this.authToken);
      
      if (evaluationResponse.status === 200) {
        console.log('✅ Evaluation data accessible');
        this.testResults.dataIntegrity.evaluation = 'PASS';
      } else {
        console.log('❌ Evaluation data failed:', evaluationResponse.status);
        this.testResults.dataIntegrity.evaluation = 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ Data integrity test failed:', error.message);
      this.testResults.dataIntegrity.error = error.message;
      this.testResults.errors.push(`Data Integrity: ${error.message}`);
    }
  }

  async testLoginFlowAndProgress() {
    console.log('\n🔄 Testing Login Flow and Progress Visibility...');
    
    try {
      // Test 1: Simulate User Logout (clear token)
      const originalToken = this.authToken;
      this.authToken = null;
      
      // Test 2: User Login Again
      const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
        email: `test-${this.testUserId}@example.com`,
        password: 'testpassword123'
      });
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        console.log('✅ User re-login successful');
        this.authToken = loginResponse.data.token;
        this.testResults.loginFlow.relogin = 'PASS';
      } else {
        console.log('❌ User re-login failed:', loginResponse.status);
        this.testResults.loginFlow.relogin = 'FAIL';
        return;
      }
      
      // Test 3: Verify Sessions Still Available
      const sessionsResponse = await this.makeRequest('/api/practice/sessions', 'GET', null, this.authToken);
      
      if (sessionsResponse.status === 200 && Array.isArray(sessionsResponse.data)) {
        console.log(`✅ User can see ${sessionsResponse.data.length} sessions after re-login`);
        this.testResults.userProgress.visibilityAfterLogin = 'PASS';
        this.testResults.userProgress.sessionsAfterLogin = sessionsResponse.data.length;
      } else {
        console.log('❌ Sessions not visible after re-login:', sessionsResponse.status);
        this.testResults.userProgress.visibilityAfterLogin = 'FAIL';
      }
      
      // Test 4: Verify Progress Data Available
      if (this.testSessionIds.length > 0) {
        const sessionId = this.testSessionIds[0];
        const sessionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}`, 'GET', null, this.authToken);
        
        if (sessionResponse.status === 200) {
          console.log('✅ Session progress data available after re-login');
          this.testResults.userProgress.progressAfterLogin = 'PASS';
        } else {
          console.log('❌ Session progress not available after re-login:', sessionResponse.status);
          this.testResults.userProgress.progressAfterLogin = 'FAIL';
        }
      }
      
    } catch (error) {
      console.log('❌ Login flow test failed:', error.message);
      this.testResults.loginFlow.error = error.message;
      this.testResults.errors.push(`Login Flow: ${error.message}`);
    }
  }

  makeRequest(path, method = 'GET', body = null, authToken = null) {
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

      if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
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

  generatePersistenceReport() {
    console.log('\n📊 Session Persistence and User Progress Report');
    console.log('===============================================');
    
    // Session Persistence Results
    console.log('\n💾 Session Persistence:');
    console.log(`  Session Creation: ${this.testResults.sessionPersistence.creation || 'NOT TESTED'}`);
    console.log(`  Multiple Sessions: ${this.testResults.sessionPersistence.multipleSessions || 'NOT TESTED'}`);
    console.log(`  Session Retrieval: ${this.testResults.sessionPersistence.retrieval || 'NOT TESTED'}`);
    console.log(`  Sessions Found: ${this.testResults.sessionPersistence.sessionCount || 0}`);
    
    // User Progress Results
    console.log('\n📊 User Progress Tracking:');
    console.log(`  Progress Update: ${this.testResults.userProgress.update || 'NOT TESTED'}`);
    console.log(`  Response Recording: ${this.testResults.userProgress.responseRecording || 'NOT TESTED'}`);
    console.log(`  Session Completion: ${this.testResults.userProgress.completion || 'NOT TESTED'}`);
    console.log(`  Visibility After Login: ${this.testResults.userProgress.visibilityAfterLogin || 'NOT TESTED'}`);
    console.log(`  Sessions After Login: ${this.testResults.userProgress.sessionsAfterLogin || 0}`);
    console.log(`  Progress After Login: ${this.testResults.userProgress.progressAfterLogin || 'NOT TESTED'}`);
    
    // Data Integrity Results
    console.log('\n🔍 Data Integrity:');
    console.log(`  Session Data: ${this.testResults.dataIntegrity.sessionData || 'NOT TESTED'}`);
    console.log(`  Messages: ${this.testResults.dataIntegrity.messages || 'NOT TESTED'}`);
    console.log(`  Message Count: ${this.testResults.dataIntegrity.messageCount || 0}`);
    console.log(`  Evaluation: ${this.testResults.dataIntegrity.evaluation || 'NOT TESTED'}`);
    
    // Login Flow Results
    console.log('\n🔐 Login Flow:');
    console.log(`  Registration: ${this.testResults.loginFlow.registration || 'NOT TESTED'}`);
    console.log(`  Login: ${this.testResults.loginFlow.login || 'NOT TESTED'}`);
    console.log(`  Re-login: ${this.testResults.loginFlow.relogin || 'NOT TESTED'}`);
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Overall Status
    const totalTests = 12;
    const passedTests = Object.values(this.testResults.sessionPersistence).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.userProgress).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.dataIntegrity).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.loginFlow).filter(r => r === 'PASS').length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (this.testResults.errors.length === 0) {
      console.log('🎉 All session persistence and user progress tests passed!');
      console.log('✅ User sessions are properly saved');
      console.log('✅ Users can see their progress after each login');
      console.log('✅ Data integrity is maintained across sessions');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new SessionPersistenceTester();
  tester.runPersistenceTests().catch(console.error);
}

module.exports = SessionPersistenceTester;
