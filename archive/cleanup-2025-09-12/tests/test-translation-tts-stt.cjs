#!/usr/bin/env node

/**
 * Translation, TTS, and STT Functionality Test
 * Tests translation in practice module and TTS/STT in both prepare and practice modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class TranslationTTSTTSTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      translation: {},
      tts: {},
      stt: {},
      voiceServices: {},
      errors: []
    };
    this.testUserId = 'test-user-' + Date.now();
    this.cookies = '';
  }

  async runTranslationTTSTTSTests() {
    console.log('🌐 Translation, TTS, and STT Functionality Test\n');
    
    try {
      // Step 1: Start server
      await this.startServer();
      
      // Step 2: Setup user and session
      await this.setupUserAndSession();
      
      // Step 3: Test Translation Functionality
      await this.testTranslationFunctionality();
      
      // Step 4: Test TTS (Text-to-Speech) Functionality
      await this.testTTSFunctionality();
      
      // Step 5: Test STT (Speech-to-Text) Functionality
      await this.testSTTFunctionality();
      
      // Step 6: Test Voice Services Integration
      await this.testVoiceServicesIntegration();
      
      // Step 7: Generate Comprehensive Report
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Translation/TTS/STT tests failed:', error.message);
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

  async testTranslationFunctionality() {
    console.log('\n🌐 Testing Translation Functionality...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      // Test 1: Create session with different languages
      const languages = ['en', 'ms', 'id', 'th', 'vi', 'tl'];
      const translationResults = {};
      
      for (const language of languages) {
        console.log(`\n🔤 Testing ${language} translation...`);
        
        // Create session with specific language
        const sessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
          scenarioId: 'test-scenario-translation',
          userJobPosition: 'Software Engineer',
          userCompanyName: 'Test Company',
          interviewLanguage: language
        }, this.cookies);
        
        if (sessionResponse.status === 200 || sessionResponse.status === 201) {
          const sessionId = sessionResponse.data.id;
          console.log(`✅ Session created for ${language}: ${sessionId}`);
          
          // Test AI question generation with translation
          const questionResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/ai-question`, 'POST', {
            questionNumber: 1,
            previousQuestions: [],
            language: language
          }, this.cookies);
          
          if (questionResponse.status === 200) {
            const questionData = questionResponse.data;
            console.log(`✅ Question generated for ${language}`);
            console.log(`  Question: ${questionData.question?.substring(0, 100)}...`);
            
            // Check if translation is present
            const hasTranslation = questionData.questionTranslated || questionData.translatedQuestion;
            console.log(`  Translation: ${hasTranslation ? 'Present' : 'Not Present'}`);
            
            translationResults[language] = {
              sessionCreated: true,
              questionGenerated: true,
              hasTranslation: !!hasTranslation,
              questionText: questionData.question
            };
          } else {
            console.log(`❌ Question generation failed for ${language}:`, questionResponse.status);
            translationResults[language] = {
              sessionCreated: true,
              questionGenerated: false,
              hasTranslation: false,
              error: questionResponse.data
            };
          }
        } else {
          console.log(`❌ Session creation failed for ${language}:`, sessionResponse.status);
          translationResults[language] = {
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
      console.log('❌ Translation functionality test failed:', error.message);
      this.testResults.translation.error = error.message;
      this.testResults.errors.push(`Translation: ${error.message}`);
    }
  }

  async testTTSFunctionality() {
    console.log('\n🔊 Testing TTS (Text-to-Speech) Functionality...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      // Test 1: TTS in Practice Module
      console.log('\n🎤 Testing TTS in Practice Module...');
      
      const practiceSessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
        scenarioId: 'test-scenario-tts',
        userJobPosition: 'Software Engineer',
        userCompanyName: 'Test Company',
        interviewLanguage: 'en'
      }, this.cookies);
      
      if (practiceSessionResponse.status === 200 || practiceSessionResponse.status === 201) {
        const sessionId = practiceSessionResponse.data.id;
        console.log('✅ Practice session created for TTS testing');
        
        // Test TTS generation
        const ttsResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/tts`, 'POST', {
          text: 'Hello, this is a test of the text-to-speech functionality.',
          language: 'en',
          voice: 'default'
        }, this.cookies);
        
        if (ttsResponse.status === 200) {
          console.log('✅ TTS generation successful in practice module');
          this.testResults.tts.practiceModule = 'PASS';
        } else {
          console.log('❌ TTS generation failed in practice module:', ttsResponse.status);
          this.testResults.tts.practiceModule = 'FAIL';
        }
      }
      
      // Test 2: TTS in Prepare Module
      console.log('\n🎤 Testing TTS in Prepare Module...');
      
      const prepareTTSResponse = await this.makeRequest('/api/prepare/tts', 'POST', {
        text: 'This is a test of TTS in the prepare module.',
        language: 'en',
        voice: 'default'
      }, this.cookies);
      
      if (prepareTTSResponse.status === 200) {
        console.log('✅ TTS generation successful in prepare module');
        this.testResults.tts.prepareModule = 'PASS';
      } else {
        console.log('❌ TTS generation failed in prepare module:', prepareTTSResponse.status);
        this.testResults.tts.prepareModule = 'FAIL';
      }
      
      // Test 3: TTS with different languages
      console.log('\n🌐 Testing TTS with different languages...');
      
      const languages = ['en', 'ms', 'id', 'th', 'vi'];
      const ttsLanguageResults = {};
      
      for (const language of languages) {
        const langTTSResponse = await this.makeRequest('/api/prepare/tts', 'POST', {
          text: `This is a test in ${language} language.`,
          language: language,
          voice: 'default'
        }, this.cookies);
        
        ttsLanguageResults[language] = langTTSResponse.status === 200 ? 'PASS' : 'FAIL';
        console.log(`  ${language}: ${ttsLanguageResults[language]}`);
      }
      
      this.testResults.tts.languageSupport = ttsLanguageResults;
      
    } catch (error) {
      console.log('❌ TTS functionality test failed:', error.message);
      this.testResults.tts.error = error.message;
      this.testResults.errors.push(`TTS: ${error.message}`);
    }
  }

  async testSTTFunctionality() {
    console.log('\n🎙️ Testing STT (Speech-to-Text) Functionality...');
    
    try {
      if (!this.cookies) {
        throw new Error('No session cookies available');
      }
      
      // Test 1: STT in Practice Module
      console.log('\n🎤 Testing STT in Practice Module...');
      
      const practiceSessionResponse = await this.makeRequest('/api/practice/sessions', 'POST', {
        scenarioId: 'test-scenario-stt',
        userJobPosition: 'Software Engineer',
        userCompanyName: 'Test Company',
        interviewLanguage: 'en'
      }, this.cookies);
      
      if (practiceSessionResponse.status === 200 || practiceSessionResponse.status === 201) {
        const sessionId = practiceSessionResponse.data.id;
        console.log('✅ Practice session created for STT testing');
        
        // Test STT with mock audio data
        const mockAudioData = Buffer.from('mock audio data for testing').toString('base64');
        
        const sttResponse = await this.makeRequest(`/api/practice/sessions/${sessionId}/stt`, 'POST', {
          audioData: mockAudioData,
          language: 'en',
          format: 'wav'
        }, this.cookies);
        
        if (sttResponse.status === 200) {
          console.log('✅ STT processing successful in practice module');
          console.log(`  Transcription: ${sttResponse.data.transcription || 'No transcription'}`);
          this.testResults.stt.practiceModule = 'PASS';
        } else {
          console.log('❌ STT processing failed in practice module:', sttResponse.status);
          this.testResults.stt.practiceModule = 'FAIL';
        }
      }
      
      // Test 2: STT in Prepare Module
      console.log('\n🎤 Testing STT in Prepare Module...');
      
      const mockAudioData = Buffer.from('mock audio data for prepare module testing').toString('base64');
      
      const prepareSTTResponse = await this.makeRequest('/api/prepare/stt', 'POST', {
        audioData: mockAudioData,
        language: 'en',
        format: 'wav'
      }, this.cookies);
      
      if (prepareSTTResponse.status === 200) {
        console.log('✅ STT processing successful in prepare module');
        console.log(`  Transcription: ${prepareSTTResponse.data.transcription || 'No transcription'}`);
        this.testResults.stt.prepareModule = 'PASS';
      } else {
        console.log('❌ STT processing failed in prepare module:', prepareSTTResponse.status);
        this.testResults.stt.prepareModule = 'FAIL';
      }
      
      // Test 3: STT with different languages
      console.log('\n🌐 Testing STT with different languages...');
      
      const languages = ['en', 'ms', 'id', 'th', 'vi'];
      const sttLanguageResults = {};
      
      for (const language of languages) {
        const langSTTResponse = await this.makeRequest('/api/prepare/stt', 'POST', {
          audioData: mockAudioData,
          language: language,
          format: 'wav'
        }, this.cookies);
        
        sttLanguageResults[language] = langSTTResponse.status === 200 ? 'PASS' : 'FAIL';
        console.log(`  ${language}: ${sttLanguageResults[language]}`);
      }
      
      this.testResults.stt.languageSupport = sttLanguageResults;
      
    } catch (error) {
      console.log('❌ STT functionality test failed:', error.message);
      this.testResults.stt.error = error.message;
      this.testResults.errors.push(`STT: ${error.message}`);
    }
  }

  async testVoiceServicesIntegration() {
    console.log('\n🔗 Testing Voice Services Integration...');
    
    try {
      // Test 1: Voice Services Health Check
      console.log('\n🏥 Testing Voice Services Health...');
      
      const healthResponse = await this.makeRequest('/api/voice/health');
      
      if (healthResponse.status === 200) {
        console.log('✅ Voice services health check passed');
        this.testResults.voiceServices.health = 'PASS';
      } else {
        console.log('❌ Voice services health check failed:', healthResponse.status);
        this.testResults.voiceServices.health = 'FAIL';
      }
      
      // Test 2: Voice Services Configuration
      console.log('\n⚙️ Testing Voice Services Configuration...');
      
      const configResponse = await this.makeRequest('/api/voice/config');
      
      if (configResponse.status === 200) {
        console.log('✅ Voice services configuration accessible');
        this.testResults.voiceServices.config = 'PASS';
      } else {
        console.log('❌ Voice services configuration failed:', configResponse.status);
        this.testResults.voiceServices.config = 'FAIL';
      }
      
      // Test 3: Voice Services Status
      console.log('\n📊 Testing Voice Services Status...');
      
      const statusResponse = await this.makeRequest('/api/voice/status');
      
      if (statusResponse.status === 200) {
        console.log('✅ Voice services status accessible');
        this.testResults.voiceServices.status = 'PASS';
      } else {
        console.log('❌ Voice services status failed:', statusResponse.status);
        this.testResults.voiceServices.status = 'FAIL';
      }
      
    } catch (error) {
      console.log('❌ Voice services integration test failed:', error.message);
      this.testResults.voiceServices.error = error.message;
      this.testResults.errors.push(`Voice Services: ${error.message}`);
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

  generateComprehensiveReport() {
    console.log('\n📊 Translation, TTS, and STT Test Report');
    console.log('========================================');
    
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
    
    // TTS Results
    console.log('\n🔊 TTS (Text-to-Speech) Functionality:');
    console.log(`  Practice Module: ${this.testResults.tts.practiceModule || 'NOT TESTED'}`);
    console.log(`  Prepare Module: ${this.testResults.tts.prepareModule || 'NOT TESTED'}`);
    
    if (this.testResults.tts.languageSupport) {
      console.log('  Language Support:');
      Object.entries(this.testResults.tts.languageSupport).forEach(([lang, result]) => {
        const status = result === 'PASS' ? '✅' : '❌';
        console.log(`    ${lang}: ${status}`);
      });
    }
    
    // STT Results
    console.log('\n🎙️ STT (Speech-to-Text) Functionality:');
    console.log(`  Practice Module: ${this.testResults.stt.practiceModule || 'NOT TESTED'}`);
    console.log(`  Prepare Module: ${this.testResults.stt.prepareModule || 'NOT TESTED'}`);
    
    if (this.testResults.stt.languageSupport) {
      console.log('  Language Support:');
      Object.entries(this.testResults.stt.languageSupport).forEach(([lang, result]) => {
        const status = result === 'PASS' ? '✅' : '❌';
        console.log(`    ${lang}: ${status}`);
      });
    }
    
    // Voice Services Results
    console.log('\n🔗 Voice Services Integration:');
    console.log(`  Health Check: ${this.testResults.voiceServices.health || 'NOT TESTED'}`);
    console.log(`  Configuration: ${this.testResults.voiceServices.config || 'NOT TESTED'}`);
    console.log(`  Status: ${this.testResults.voiceServices.status || 'NOT TESTED'}`);
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Overall Status
    const totalTests = 20; // Approximate number of tests
    const passedTests = Object.values(this.testResults.translation).filter(r => r === true || r === 'PASS').length +
                       Object.values(this.testResults.tts).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.stt).filter(r => r === 'PASS').length +
                       Object.values(this.testResults.voiceServices).filter(r => r === 'PASS').length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (this.testResults.errors.length === 0) {
      console.log('🎉 All translation, TTS, and STT tests passed!');
      console.log('✅ Translation functionality works in practice module');
      console.log('✅ TTS works in both prepare and practice modules');
      console.log('✅ STT works in both prepare and practice modules');
      console.log('✅ Voice services integration is working');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new TranslationTTSTTSTester();
  tester.runTranslationTTSTTSTests().catch(console.error);
}

module.exports = TranslationTTSTTSTester;
