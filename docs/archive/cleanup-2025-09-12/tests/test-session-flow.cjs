#!/usr/bin/env node

/**
 * Comprehensive Session Control and Data Flow Test
 * Tests session management across prepare, practice, and perform modules
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User'
};

class SessionFlowTester {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.testSessionId = null;
    this.testResults = {
      sessionControl: {},
      dataFlow: {},
      moduleIntegration: {},
      errors: []
    };
  }

  async runTests() {
    console.log('🧪 Starting Comprehensive Session Flow Tests...\n');
    
    try {
      // Step 1: Authentication and User Setup
      await this.testAuthentication();
      
      // Step 2: Session Control Tests
      await this.testSessionControl();
      
      // Step 3: Data Flow Tests
      await this.testDataFlow();
      
      // Step 4: Module Integration Tests
      await this.testModuleIntegration();
      
      // Step 5: Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.errors.push(error.message);
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
      // Test user registration/login
      const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      this.authToken = authResponse.data.token;
      this.userId = authResponse.data.user.id;
      
      console.log('✅ Authentication successful');
      this.testResults.sessionControl.authentication = 'PASS';
      
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
      this.testResults.sessionControl.authentication = 'FAIL';
      this.testResults.errors.push(`Authentication: ${error.message}`);
    }
  }

  async testSessionControl() {
    console.log('\n📋 Testing Session Control...');
    
    try {
      // Test 1: Create Practice Session
      const sessionResponse = await axios.post(`${BASE_URL}/api/practice/sessions`, {
        scenarioId: 'test-scenario-1',
        userJobPosition: 'Software Engineer',
        userCompanyName: 'Test Company',
        interviewLanguage: 'en'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      this.testSessionId = sessionResponse.data.id;
      console.log('✅ Practice session created:', this.testSessionId);
      
      // Test 2: Session Persistence
      const sessionCheck = await axios.get(`${BASE_URL}/api/practice/sessions/${this.testSessionId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (sessionCheck.data.id === this.testSessionId) {
        console.log('✅ Session persistence verified');
        this.testResults.sessionControl.persistence = 'PASS';
      } else {
        throw new Error('Session ID mismatch');
      }
      
      // Test 3: Session Auto-save
      const autoSaveResponse = await axios.post(`${BASE_URL}/api/practice/sessions/${this.testSessionId}/auto-save`, {
        currentQuestion: 2,
        progress: 25
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (autoSaveResponse.status === 200) {
        console.log('✅ Session auto-save working');
        this.testResults.sessionControl.autoSave = 'PASS';
      }
      
      // Test 4: Session Timeout Management
      const sessionStatus = await axios.get(`${BASE_URL}/api/practice/sessions/${this.testSessionId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (sessionStatus.data.status) {
        console.log('✅ Session status tracking working');
        this.testResults.sessionControl.statusTracking = 'PASS';
      }
      
    } catch (error) {
      console.log('❌ Session control test failed:', error.response?.data?.message || error.message);
      this.testResults.sessionControl.error = error.message;
      this.testResults.errors.push(`Session Control: ${error.message}`);
    }
  }

  async testDataFlow() {
    console.log('\n🔄 Testing Data Flow...');
    
    try {
      if (!this.testSessionId) {
        throw new Error('No test session available');
      }
      
      // Test 1: AI Question Generation
      const questionResponse = await axios.post(`${BASE_URL}/api/practice/sessions/${this.testSessionId}/ai-question`, {
        questionNumber: 1,
        previousQuestions: []
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (questionResponse.data.question) {
        console.log('✅ AI question generation working');
        this.testResults.dataFlow.aiQuestionGeneration = 'PASS';
      }
      
      // Test 2: User Response Recording
      const responseData = {
        questionId: questionResponse.data.questionId,
        response: 'This is a test response for the interview question.',
        responseTime: 30,
        wordCount: 12
      };
      
      const userResponse = await axios.post(`${BASE_URL}/api/practice/sessions/${this.testSessionId}/user-response`, responseData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (userResponse.status === 200) {
        console.log('✅ User response recording working');
        this.testResults.dataFlow.userResponseRecording = 'PASS';
      }
      
      // Test 3: Message History
      const messagesResponse = await axios.get(`${BASE_URL}/api/practice/sessions/${this.testSessionId}/messages`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (messagesResponse.data && Array.isArray(messagesResponse.data)) {
        console.log('✅ Message history retrieval working');
        this.testResults.dataFlow.messageHistory = 'PASS';
      }
      
      // Test 4: Session Completion
      const completeResponse = await axios.post(`${BASE_URL}/api/practice/sessions/${this.testSessionId}/complete`, {
        finalScore: 85,
        duration: 1800
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (completeResponse.status === 200) {
        console.log('✅ Session completion working');
        this.testResults.dataFlow.sessionCompletion = 'PASS';
      }
      
    } catch (error) {
      console.log('❌ Data flow test failed:', error.response?.data?.message || error.message);
      this.testResults.dataFlow.error = error.message;
      this.testResults.errors.push(`Data Flow: ${error.message}`);
    }
  }

  async testModuleIntegration() {
    console.log('\n🔗 Testing Module Integration...');
    
    try {
      if (!this.testSessionId) {
        throw new Error('No test session available');
      }
      
      // Test 1: Practice to Perform Data Flow
      const evaluationResponse = await axios.get(`${BASE_URL}/api/perform/sessions/${this.testSessionId}/evaluation`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (evaluationResponse.data) {
        console.log('✅ Practice to Perform data flow working');
        this.testResults.moduleIntegration.practiceToPerform = 'PASS';
      }
      
      // Test 2: Session Data Consistency
      const sessionData = await axios.get(`${BASE_URL}/api/practice/sessions/${this.testSessionId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      const performData = await axios.get(`${BASE_URL}/api/perform/sessions/${this.testSessionId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (sessionData.data.id === performData.data.id) {
        console.log('✅ Session data consistency verified');
        this.testResults.moduleIntegration.dataConsistency = 'PASS';
      }
      
      // Test 3: User Analytics Data
      const userSessions = await axios.get(`${BASE_URL}/api/practice/sessions`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (userSessions.data && Array.isArray(userSessions.data)) {
        console.log('✅ User analytics data available');
        this.testResults.moduleIntegration.userAnalytics = 'PASS';
      }
      
    } catch (error) {
      console.log('❌ Module integration test failed:', error.response?.data?.message || error.message);
      this.testResults.moduleIntegration.error = error.message;
      this.testResults.errors.push(`Module Integration: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    // Session Control Results
    console.log('\n📋 Session Control:');
    Object.entries(this.testResults.sessionControl).forEach(([test, result]) => {
      const status = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${status} ${test}: ${result}`);
    });
    
    // Data Flow Results
    console.log('\n🔄 Data Flow:');
    Object.entries(this.testResults.dataFlow).forEach(([test, result]) => {
      const status = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${status} ${test}: ${result}`);
    });
    
    // Module Integration Results
    console.log('\n🔗 Module Integration:');
    Object.entries(this.testResults.moduleIntegration).forEach(([test, result]) => {
      const status = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${status} ${test}: ${result}`);
    });
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Overall Status
    const totalTests = Object.keys(this.testResults.sessionControl).length + 
                      Object.keys(this.testResults.dataFlow).length + 
                      Object.keys(this.testResults.moduleIntegration).length;
    const passedTests = Object.values(this.testResults.sessionControl).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.dataFlow).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.moduleIntegration).filter(r => r === 'PASS').length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (this.testResults.errors.length === 0) {
      console.log('🎉 All tests passed! Session control and data flow are working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new SessionFlowTester();
  tester.runTests().catch(console.error);
}

module.exports = SessionFlowTester;
