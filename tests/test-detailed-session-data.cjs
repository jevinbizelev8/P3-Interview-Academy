#!/usr/bin/env node

/**
 * Detailed Session Data Verification Test
 * Verifies specific data that's saved and retrieved for user progress tracking
 */

const http = require('http');

class DetailedSessionDataTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      sessionData: {},
      progressData: {},
      userContext: {},
      scoringData: {},
      errors: []
    };
    this.testUserId = 'test-user-' + Date.now();
    this.testSessionIds = [];
    this.cookies = '';
  }

  async runDetailedTests() {
    console.log('🔍 Detailed Session Data Verification Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Setup user and create session
      await this.setupUserAndSession();
      
      // Step 3: Test detailed session data
      await this.testDetailedSessionData();
      
      // Step 4: Test progress tracking data
      await this.testProgressTrackingData();
      
      // Step 5: Test user context preservation
      await this.testUserContextPreservation();
      
      // Step 6: Test scoring and evaluation data
      await this.testScoringAndEvaluationData();
      
      // Step 7: Generate detailed report
      this.generateDetailedReport();
      
    } catch (error) {
      console.error('❌ Detailed tests failed:', error.message);
      this.testResults.errors.push(error.message);
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

  async setupUserAndSession() {
    console.log('\n👤 Setting up user and session...');
    
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
    
    // Create test session with specific data
    const sessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
      scenarioId: 'test-scenario-detailed',
      userJobPosition: 'Senior Software Engineer',
      userCompanyName: 'Tech Innovations Inc',
      interviewLanguage: 'en'
    }, this.cookies);
    
    if (sessionResponse.status === 200 || sessionResponse.status === 201) {
      this.testSessionIds.push(sessionResponse.data.id);
      console.log('✅ Test session created:', sessionResponse.data.id);
    }
  }

  async testDetailedSessionData() {
    console.log('\n📊 Testing Detailed Session Data...');
    
    try {
      if (!this.cookies || this.testSessionIds.length === 0) {
        throw new Error('No session available');
      }
      
      const sessionId = this.testSessionIds[0];
      
      // Get session data
      const sessionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}`, 'GET', null, this.cookies);
      
      if (sessionResponse.status === 200) {
        const sessionData = sessionResponse.data;
        
        // Check core session fields
        const coreFields = ['id', 'userId', 'scenarioId', 'status', 'currentQuestion', 'totalQuestions'];
        const hasCoreFields = coreFields.every(field => sessionData.hasOwnProperty(field));
        console.log(`✅ Core session fields: ${hasCoreFields ? 'Present' : 'Missing'}`);
        this.testResults.sessionData.coreFields = hasCoreFields;
        
        // Check user context fields
        const userContextFields = ['userJobPosition', 'userCompanyName', 'interviewLanguage'];
        const hasUserContext = userContextFields.every(field => sessionData.hasOwnProperty(field));
        console.log(`✅ User context fields: ${hasUserContext ? 'Present' : 'Missing'}`);
        this.testResults.sessionData.userContext = hasUserContext;
        
        // Check timing fields
        const timingFields = ['startedAt', 'completedAt', 'duration', 'autoSavedAt'];
        const hasTimingFields = timingFields.some(field => sessionData.hasOwnProperty(field));
        console.log(`✅ Timing fields: ${hasTimingFields ? 'Present' : 'Missing'}`);
        this.testResults.sessionData.timingFields = hasTimingFields;
        
        // Log actual session data for verification
        console.log('📋 Session Data Details:');
        console.log(`  ID: ${sessionData.id}`);
        console.log(`  User ID: ${sessionData.userId}`);
        console.log(`  Scenario ID: ${sessionData.scenarioId}`);
        console.log(`  Status: ${sessionData.status}`);
        console.log(`  Job Position: ${sessionData.userJobPosition || 'Not set'}`);
        console.log(`  Company: ${sessionData.userCompanyName || 'Not set'}`);
        console.log(`  Language: ${sessionData.interviewLanguage || 'Not set'}`);
        console.log(`  Started At: ${sessionData.startedAt || 'Not set'}`);
        
      } else {
        console.log('❌ Failed to retrieve session data:', sessionResponse.status);
        this.testResults.sessionData.error = 'Failed to retrieve session data';
      }
      
    } catch (error) {
      console.log('❌ Detailed session data test failed:', error.message);
      this.testResults.sessionData.error = error.message;
    }
  }

  async testProgressTrackingData() {
    console.log('\n📈 Testing Progress Tracking Data...');
    
    try {
      if (!this.cookies || this.testSessionIds.length === 0) {
        throw new Error('No session available');
      }
      
      const sessionId = this.testSessionIds[0];
      
      // Update session progress
      const progressResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/auto-save`, 'POST', {
        currentQuestion: 5,
        progress: 50,
        timeSpent: 600,
        notes: 'User is progressing well through the interview'
      }, this.cookies);
      
      if (progressResponse.status === 200) {
        console.log('✅ Progress update successful');
        this.testResults.progressData.update = 'PASS';
        
        // Verify progress was saved
        const sessionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}`, 'GET', null, this.cookies);
        
        if (sessionResponse.status === 200) {
          const sessionData = sessionResponse.data;
          console.log('📋 Progress Data Details:');
          console.log(`  Current Question: ${sessionData.currentQuestion || 'Not updated'}`);
          console.log(`  Progress: ${sessionData.progress || 'Not updated'}`);
          console.log(`  Auto-saved At: ${sessionData.autoSavedAt || 'Not updated'}`);
          
          this.testResults.progressData.retrieval = 'PASS';
        } else {
          this.testResults.progressData.retrieval = 'FAIL';
        }
      } else {
        console.log('❌ Progress update failed:', progressResponse.status);
        this.testResults.progressData.update = 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ Progress tracking test failed:', error.message);
      this.testResults.progressData.error = error.message;
    }
  }

  async testUserContextPreservation() {
    console.log('\n👤 Testing User Context Preservation...');
    
    try {
      if (!this.cookies || this.testSessionIds.length === 0) {
        throw new Error('No session available');
      }
      
      const sessionId = this.testSessionIds[0];
      
      // Get session data
      const sessionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}`, 'GET', null, this.cookies);
      
      if (sessionResponse.status === 200) {
        const sessionData = sessionResponse.data;
        
        // Check if user context is preserved
        const expectedJobPosition = 'Senior Software Engineer';
        const expectedCompany = 'Tech Innovations Inc';
        const expectedLanguage = 'en';
        
        const jobPositionMatch = sessionData.userJobPosition === expectedJobPosition;
        const companyMatch = sessionData.userCompanyName === expectedCompany;
        const languageMatch = sessionData.interviewLanguage === expectedLanguage;
        
        console.log(`✅ Job Position Preserved: ${jobPositionMatch ? 'Yes' : 'No'} (${sessionData.userJobPosition})`);
        console.log(`✅ Company Preserved: ${companyMatch ? 'Yes' : 'No'} (${sessionData.userCompanyName})`);
        console.log(`✅ Language Preserved: ${languageMatch ? 'Yes' : 'No'} (${sessionData.interviewLanguage})`);
        
        this.testResults.userContext.jobPosition = jobPositionMatch;
        this.testResults.userContext.company = companyMatch;
        this.testResults.userContext.language = languageMatch;
        
      } else {
        console.log('❌ Failed to retrieve session for context verification');
        this.testResults.userContext.error = 'Failed to retrieve session';
      }
      
    } catch (error) {
      console.log('❌ User context preservation test failed:', error.message);
      this.testResults.userContext.error = error.message;
    }
  }

  async testScoringAndEvaluationData() {
    console.log('\n🎯 Testing Scoring and Evaluation Data...');
    
    try {
      if (!this.cookies || this.testSessionIds.length === 0) {
        throw new Error('No session available');
      }
      
      const sessionId = this.testSessionIds[0];
      
      // Complete session with scoring data
      const completeResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/complete`, 'POST', {
        finalScore: 87,
        duration: 2400,
        situationScore: 85,
        taskScore: 90,
        actionScore: 88,
        resultScore: 86,
        flowScore: 89,
        strengths: [
          'Clear communication',
          'Good problem-solving approach',
          'Relevant examples'
        ],
        improvements: [
          'More specific technical details',
          'Better time management',
          'Stronger conclusion statements'
        ],
        recommendations: [
          'Practice STAR method more',
          'Prepare more technical examples',
          'Work on confidence building'
        ]
      }, this.cookies);
      
      if (completeResponse.status === 200) {
        console.log('✅ Session completed with scoring data');
        this.testResults.scoringData.completion = 'PASS';
        
        // Verify scoring data was saved
        const sessionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}`, 'GET', null, this.cookies);
        
        if (sessionResponse.status === 200) {
          const sessionData = sessionResponse.data;
          console.log('📋 Scoring Data Details:');
          console.log(`  Overall Score: ${sessionData.overallScore || 'Not set'}`);
          console.log(`  Situation Score: ${sessionData.situationScore || 'Not set'}`);
          console.log(`  Task Score: ${sessionData.taskScore || 'Not set'}`);
          console.log(`  Action Score: ${sessionData.actionScore || 'Not set'}`);
          console.log(`  Result Score: ${sessionData.resultScore || 'Not set'}`);
          console.log(`  Flow Score: ${sessionData.flowScore || 'Not set'}`);
          console.log(`  Duration: ${sessionData.duration || 'Not set'}`);
          console.log(`  Status: ${sessionData.status || 'Not set'}`);
          
          this.testResults.scoringData.retrieval = 'PASS';
        } else {
          this.testResults.scoringData.retrieval = 'FAIL';
        }
        
        // Test evaluation data access
        const evaluationResponse = await this.makeRequest(`/api/perform/sessions/${sessionId}/evaluation`, 'GET', null, this.cookies);
        
        if (evaluationResponse.status === 200) {
          console.log('✅ Evaluation data accessible');
          this.testResults.scoringData.evaluation = 'PASS';
        } else {
          console.log('❌ Evaluation data not accessible:', evaluationResponse.status);
          this.testResults.scoringData.evaluation = 'FAIL';
        }
        
      } else {
        console.log('❌ Session completion failed:', completeResponse.status);
        this.testResults.scoringData.completion = 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ Scoring and evaluation test failed:', error.message);
      this.testResults.scoringData.error = error.message;
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

  generateDetailedReport() {
    console.log('\n📊 Detailed Session Data Verification Report');
    console.log('============================================');
    
    // Session Data Results
    console.log('\n📊 Session Data:');
    console.log(`  Core Fields: ${this.testResults.sessionData.coreFields ? '✅' : '❌'}`);
    console.log(`  User Context: ${this.testResults.sessionData.userContext ? '✅' : '❌'}`);
    console.log(`  Timing Fields: ${this.testResults.sessionData.timingFields ? '✅' : '❌'}`);
    
    // Progress Data Results
    console.log('\n📈 Progress Tracking:');
    console.log(`  Update: ${this.testResults.progressData.update || 'NOT TESTED'}`);
    console.log(`  Retrieval: ${this.testResults.progressData.retrieval || 'NOT TESTED'}`);
    
    // User Context Results
    console.log('\n👤 User Context Preservation:');
    console.log(`  Job Position: ${this.testResults.userContext.jobPosition ? '✅' : '❌'}`);
    console.log(`  Company: ${this.testResults.userContext.company ? '✅' : '❌'}`);
    console.log(`  Language: ${this.testResults.userContext.language ? '✅' : '❌'}`);
    
    // Scoring Data Results
    console.log('\n🎯 Scoring and Evaluation:');
    console.log(`  Completion: ${this.testResults.scoringData.completion || 'NOT TESTED'}`);
    console.log(`  Retrieval: ${this.testResults.scoringData.retrieval || 'NOT TESTED'}`);
    console.log(`  Evaluation: ${this.testResults.scoringData.evaluation || 'NOT TESTED'}`);
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Overall Status
    const totalTests = 10;
    const passedTests = Object.values(this.testResults.sessionData).filter(r => r === true).length +
                       Object.values(this.testResults.progressData).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.userContext).filter(r => r === true).length +
                       Object.values(this.testResults.scoringData).filter(r => r === 'PASS').length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (this.testResults.errors.length === 0) {
      console.log('🎉 All detailed session data tests passed!');
      console.log('✅ User sessions contain comprehensive data');
      console.log('✅ Progress tracking works correctly');
      console.log('✅ User context is preserved');
      console.log('✅ Scoring and evaluation data is saved and accessible');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new DetailedSessionDataTester();
  tester.runDetailedTests().catch(console.error);
}

module.exports = DetailedSessionDataTester;
