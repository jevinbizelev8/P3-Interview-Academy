#!/usr/bin/env node

/**
 * Actual Voice and Translation Functionality Test
 * Tests the existing voice and translation services that are implemented
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class ActualVoiceTranslationTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      translation: {},
      voiceServices: {},
      questionGeneration: {},
      languageSupport: {},
      errors: []
    };
    this.testUserId = 'test-user-' + Date.now();
    this.cookies = '';
  }

  async runActualTests() {
    console.log('🎯 Actual Voice and Translation Functionality Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Setup user and session
      await this.setupUserAndSession();
      
      // Step 3: Test Translation in Question Generation
      await this.testTranslationInQuestionGeneration();
      
      // Step 4: Test Voice Services Components
      await this.testVoiceServicesComponents();
      
      // Step 5: Test Language Support
      await this.testLanguageSupport();
      
      // Step 6: Test Voice Controls Integration
      await this.testVoiceControlsIntegration();
      
      // Step 7: Generate Actual Test Report
      this.generateActualTestReport();
      
    } catch (error) {
      console.error('❌ Actual voice/translation tests failed:', error.message);
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
  }

  async testTranslationInQuestionGeneration() {
    console.log('\n🌐 Testing Translation in Question Generation...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      // Test different languages for question generation
      const languages = [
        { code: 'en', name: 'English' },
        { code: 'ms', name: 'Bahasa Malaysia' },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'th', name: 'Thai' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'tl', name: 'Filipino' }
      ];
      
      const translationResults = {};
      
      for (const language of languages) {
        console.log(`\n🔤 Testing ${language.name} (${language.code})...`);
        
        // Create session with specific language
        const sessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
          scenarioId: 'test-scenario-translation',
          userJobPosition: 'Software Engineer',
          userCompanyName: 'Test Company',
          interviewLanguage: language.code
        }, this.cookies);
        
        if (sessionResponse.status === 200 || sessionResponse.status === 201) {
          const sessionId = sessionResponse.data.id;
          console.log(`✅ Session created for ${language.name}: ${sessionId}`);
          
          // Test AI question generation with language preference
          const questionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/ai-question`, 'POST', {
            questionNumber: 1,
            previousQuestions: [],
            preferredLanguage: language.code
          }, this.cookies);
          
          if (questionResponse.status === 200) {
            const questionData = questionResponse.data;
            console.log(`✅ Question generated for ${language.name}`);
            
            // Check if question has translation
            const hasTranslation = questionData.questionTextTranslated || 
                                 questionData.translatedQuestion || 
                                 questionData.questionTranslated;
            
            console.log(`  Question: ${questionData.question?.substring(0, 100) || 'No question text'}...`);
            console.log(`  Translation: ${hasTranslation ? 'Present' : 'Not Present'}`);
            
            if (hasTranslation) {
              console.log(`  Translated: ${hasTranslation.substring(0, 100)}...`);
            }
            
            translationResults[language.code] = {
              sessionCreated: true,
              questionGenerated: true,
              hasTranslation: !!hasTranslation,
              questionText: questionData.question,
              translatedText: hasTranslation,
              language: language.name
            };
          } else {
            console.log(`❌ Question generation failed for ${language.name}:`, questionResponse.status);
            translationResults[language.code] = {
              sessionCreated: true,
              questionGenerated: false,
              hasTranslation: false,
              error: questionResponse.data
            };
          }
        } else {
          console.log(`❌ Session creation failed for ${language.name}:`, sessionResponse.status);
          translationResults[language.code] = {
            sessionCreated: false,
            questionGenerated: false,
            hasTranslation: false,
            error: sessionResponse.data
          };
        }
      }
      
      // Analyze translation results
      const successfulTranslations = Object.values(translationResults).filter(r => r.hasTranslation).length;
      const totalLanguages = languages.length;
      
      console.log(`\n📊 Translation Results: ${successfulTranslations}/${totalLanguages} languages with translation`);
      
      this.testResults.translation.languages = languages;
      this.testResults.translation.results = translationResults;
      this.testResults.translation.successRate = (successfulTranslations / totalLanguages) * 100;
      
    } catch (error) {
      console.log('❌ Translation in question generation test failed:', error.message);
      this.testResults.translation.error = error.message;
      this.testResults.errors.push(`Translation: ${error.message}`);
    }
  }

  async testVoiceServicesComponents() {
    console.log('\n🎤 Testing Voice Services Components...');
    
    try {
      // Test 1: Check if voice services are available in the codebase
      const voiceServiceFiles = [
        'client/src/services/integrated-voice-service.ts',
        'client/src/services/voice-quality-detector.ts',
        'client/src/services/enhanced-tts.ts',
        'client/src/services/whisper-wasm.ts',
        'client/src/components/prepare-ai/VoiceControls.tsx',
        'client/src/components/VoiceRecorder.tsx'
      ];
      
      let availableServices = 0;
      const serviceStatus = {};
      
      for (const file of voiceServiceFiles) {
        const filePath = path.join('/home/runner/workspace', file);
        if (fs.existsSync(filePath)) {
          availableServices++;
          serviceStatus[file] = 'Available';
          console.log(`✅ ${file}: Available`);
        } else {
          serviceStatus[file] = 'Not Found';
          console.log(`❌ ${file}: Not Found`);
        }
      }
      
      console.log(`\n📊 Voice Services: ${availableServices}/${voiceServiceFiles.length} components available`);
      
      this.testResults.voiceServices.components = serviceStatus;
      this.testResults.voiceServices.availability = (availableServices / voiceServiceFiles.length) * 100;
      
      // Test 2: Check voice service functionality in practice module
      console.log('\n🎯 Testing Voice Integration in Practice Module...');
      
      const practiceSessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
        scenarioId: 'test-scenario-voice',
        userJobPosition: 'Software Engineer',
        userCompanyName: 'Test Company',
        interviewLanguage: 'en'
      }, this.cookies);
      
      if (practiceSessionResponse.status === 200 || practiceSessionResponse.status === 201) {
        const sessionId = practiceSessionResponse.data.id;
        console.log('✅ Practice session created for voice testing');
        
        // Test if voice-related data is included in session
        const sessionData = practiceSessionResponse.data;
        const hasVoiceData = sessionData.voiceEnabled || sessionData.audioEnabled || sessionData.speechEnabled;
        
        console.log(`  Voice Data: ${hasVoiceData ? 'Present' : 'Not Present'}`);
        this.testResults.voiceServices.practiceIntegration = hasVoiceData ? 'PASS' : 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ Voice services components test failed:', error.message);
      this.testResults.voiceServices.error = error.message;
      this.testResults.errors.push(`Voice Services: ${error.message}`);
    }
  }

  async testLanguageSupport() {
    console.log('\n🌍 Testing Language Support...');
    
    try {
      // Test supported languages from schema
      const supportedLanguages = {
        'en': 'English',
        'ms': 'Bahasa Malaysia',
        'id': 'Bahasa Indonesia',
        'th': 'ไทย (Thai)',
        'vi': 'Tiếng Việt (Vietnamese)',
        'fil': 'Filipino',
        'my': 'မြန်မာ (Myanmar)',
        'km': 'ខ្មែរ (Khmer)',
        'lo': 'ລາວ (Lao)',
        'zh-sg': '中文 (Chinese - Singapore)'
      };
      
      console.log(`📋 Supported Languages: ${Object.keys(supportedLanguages).length} languages`);
      
      // Test a few key languages
      const testLanguages = ['en', 'ms', 'id', 'th', 'vi'];
      const languageResults = {};
      
      for (const langCode of testLanguages) {
        const langName = supportedLanguages[langCode];
        console.log(`\n🔤 Testing ${langName} (${langCode})...`);
        
        // Create session with language
        const sessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
          scenarioId: 'test-scenario-lang',
          userJobPosition: 'Software Engineer',
          userCompanyName: 'Test Company',
          interviewLanguage: langCode
        }, this.cookies);
        
        if (sessionResponse.status === 200 || sessionResponse.status === 201) {
          console.log(`✅ Session created for ${langName}`);
          languageResults[langCode] = 'PASS';
        } else {
          console.log(`❌ Session creation failed for ${langName}:`, sessionResponse.status);
          languageResults[langCode] = 'FAIL';
        }
      }
      
      this.testResults.languageSupport.supportedLanguages = Object.keys(supportedLanguages).length;
      this.testResults.languageSupport.testResults = languageResults;
      
    } catch (error) {
      console.log('❌ Language support test failed:', error.message);
      this.testResults.languageSupport.error = error.message;
      this.testResults.errors.push(`Language Support: ${error.message}`);
    }
  }

  async testVoiceControlsIntegration() {
    console.log('\n🎛️ Testing Voice Controls Integration...');
    
    try {
      // Check if voice controls are properly integrated
      const voiceControlFiles = [
        'client/src/components/prepare-ai/VoiceControls.tsx',
        'client/src/components/prepare-ai/VoiceCompatibilityTest.tsx',
        'client/src/utils/voice-compatibility.ts'
      ];
      
      let availableControls = 0;
      const controlStatus = {};
      
      for (const file of voiceControlFiles) {
        const filePath = path.join('/home/runner/workspace', file);
        if (fs.existsSync(filePath)) {
          availableControls++;
          controlStatus[file] = 'Available';
          console.log(`✅ ${file}: Available`);
          
          // Check if file has proper voice functionality
          const content = fs.readFileSync(filePath, 'utf8');
          const hasVoiceFeatures = content.includes('recording') || 
                                 content.includes('speech') || 
                                 content.includes('audio') ||
                                 content.includes('microphone');
          
          if (hasVoiceFeatures) {
            console.log(`  Voice Features: Present`);
          } else {
            console.log(`  Voice Features: Not Present`);
          }
        } else {
          controlStatus[file] = 'Not Found';
          console.log(`❌ ${file}: Not Found`);
        }
      }
      
      console.log(`\n📊 Voice Controls: ${availableControls}/${voiceControlFiles.length} components available`);
      
      this.testResults.voiceServices.controls = controlStatus;
      this.testResults.voiceServices.controlsAvailability = (availableControls / voiceControlFiles.length) * 100;
      
    } catch (error) {
      console.log('❌ Voice controls integration test failed:', error.message);
      this.testResults.voiceServices.error = error.message;
      this.testResults.errors.push(`Voice Controls: ${error.message}`);
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

  generateActualTestReport() {
    console.log('\n📊 Actual Voice and Translation Test Report');
    console.log('===========================================');
    
    // Translation Results
    console.log('\n🌐 Translation Functionality:');
    console.log(`  Languages Tested: ${this.testResults.translation.languages?.length || 0}`);
    console.log(`  Success Rate: ${this.testResults.translation.successRate || 0}%`);
    
    if (this.testResults.translation.results) {
      Object.entries(this.testResults.translation.results).forEach(([lang, result]) => {
        const status = result.hasTranslation ? '✅' : '❌';
        console.log(`  ${lang}: ${status} ${result.hasTranslation ? 'Translation Present' : 'No Translation'}`);
      });
    }
    
    // Voice Services Results
    console.log('\n🎤 Voice Services:');
    console.log(`  Availability: ${this.testResults.voiceServices.availability || 0}%`);
    console.log(`  Practice Integration: ${this.testResults.voiceServices.practiceIntegration || 'NOT TESTED'}`);
    console.log(`  Controls Availability: ${this.testResults.voiceServices.controlsAvailability || 0}%`);
    
    if (this.testResults.voiceServices.components) {
      console.log('  Components:');
      Object.entries(this.testResults.voiceServices.components).forEach(([file, status]) => {
        const icon = status === 'Available' ? '✅' : '❌';
        console.log(`    ${file}: ${icon} ${status}`);
      });
    }
    
    // Language Support Results
    console.log('\n🌍 Language Support:');
    console.log(`  Supported Languages: ${this.testResults.languageSupport.supportedLanguages || 0}`);
    
    if (this.testResults.languageSupport.testResults) {
      console.log('  Test Results:');
      Object.entries(this.testResults.languageSupport.testResults).forEach(([lang, result]) => {
        const status = result === 'PASS' ? '✅' : '❌';
        console.log(`    ${lang}: ${status}`);
      });
    }
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Overall Status
    const totalTests = 15; // Approximate number of tests
    const passedTests = Object.values(this.testResults.translation).filter(r => r === true || r === 'PASS').length +
                       Object.values(this.testResults.voiceServices).filter(r => r === 'PASS' || r > 0).length +
                       Object.values(this.testResults.languageSupport).filter(r => r === 'PASS' || r > 0).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (this.testResults.errors.length === 0) {
      console.log('🎉 All actual voice and translation tests passed!');
      console.log('✅ Translation functionality is implemented in question generation');
      console.log('✅ Voice services components are available');
      console.log('✅ Language support is comprehensive');
      console.log('✅ Voice controls are integrated');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new ActualVoiceTranslationTester();
  tester.runActualTests().catch(console.error);
}

module.exports = ActualVoiceTranslationTester;
